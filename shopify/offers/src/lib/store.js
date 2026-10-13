// Persistence for the offer desk: offers, the discount codes minted for them,
// rate-limit counters and a short event log. One interface, two homes: a Map
// for Node scripts (memoryStore) and a SQLite-backed Durable Object for the
// worker (doStore). Both keep every record as JSON text, so what is read back
// is always a copy and the two behave the same.
//
//   putOffer(rec)   getOffer(id)    updateOffer(id, patch)     keyed by rec.id
//   putCode(rec)    getCode(code)   updateCode(code, patch)    keyed by rec.code
//   bump(key, windowSeconds)   counts a hit, gives the count in the key's window
//   log(event)      recent(limit)   newest first
//
// Every method returns a promise. get* gives null for a missing record;
// update* merges the patch into the stored record and gives the result, or
// null when there is nothing to update.

// The base class exists only in the Workers runtime. Node check scripts import
// this file for memoryStore, so there the class gets a plain stand-in.
const { DurableObject } = await import('cloudflare:workers').catch(() => ({
  DurableObject: class { constructor(ctx, env) { this.ctx = ctx; this.env = env; } },
}));

const OPS = ['putOffer', 'getOffer', 'updateOffer', 'putCode', 'getCode', 'updateCode', 'bump', 'log', 'recent', 'claimCode', 'claimOfferOrder'];

// Records stay this long after they expire, so an order or a question that
// comes late can still be matched to its offer.
const KEEP_MS = 30 * 86400000;
const MAX_EVENTS = 500;
const SWEEP_EVERY_MS = 60000;

// Shopify treats discount codes as case-insensitive, so every lookup does too.
const codeKey = code => String(code ?? '').trim().toUpperCase();

// The nine operations over any backing that can get, put, append and sweep.
// Nothing in here awaits, so inside the Durable Object each call is atomic:
// two requests can never both read a counter before either writes it.
function operations(db, now) {
  let swept = 0;
  const sweep = t => {
    if (t - swept < SWEEP_EVERY_MS) return;
    swept = t;
    db.sweep(t, MAX_EVENTS);
  };
  const keepUntil = (rec, t) => (Date.parse(rec.expires_at) || t) + KEEP_MS;
  const put = (kind, id, rec) => {
    const t = now();
    sweep(t);
    db.put(kind, id, rec, keepUntil(rec, t));
  };
  const merge = (kind, id, patch) => {
    const cur = db.get(kind, id);
    if (!cur) return null;
    const next = { ...cur, ...patch };
    db.put(kind, id, next, keepUntil(next, now()));
    return next;
  };
  return {
    putOffer(rec) {
      if (rec?.id == null || rec.id === '') throw new TypeError('putOffer needs a record with an id');
      put('offer', String(rec.id), rec);
    },
    getOffer: id => db.get('offer', String(id)),
    updateOffer: (id, patch) => merge('offer', String(id), patch),
    putCode(rec) {
      if (!codeKey(rec?.code)) throw new TypeError('putCode needs a record with a code');
      put('code', codeKey(rec.code), rec);
    },
    getCode: code => db.get('code', codeKey(code)),
    updateCode: (code, patch) => merge('code', codeKey(code), patch),
    // A redemption belongs to one order. These read/write claims contain no
    // await, so another RPC cannot interleave between the decision and write.
    claimCode(code, order_id, opts = {}) {
      const key = codeKey(code);
      const rec = db.get('code', key);
      if (!rec) return { ok: false, reason: 'not_found' };
      if (!order_id) throw new TypeError('claimCode needs an order id');
      if (rec.used) return rec.order_id === order_id ? { ok: true, first: false } : { ok: false, reason: 'already_used' };
      if (!opts.observed_order && rec.revoked) return { ok: false, reason: 'revoked' };
      if (!opts.observed_order && Date.parse(rec.expires_at) <= now()) return { ok: false, reason: 'expired' };
      merge('code', key, { used: true, order_id, used_at: new Date(now()).toISOString() });
      return { ok: true, first: true };
    },
    claimOfferOrder(id, order_id) {
      const rec = db.get('offer', String(id));
      if (!rec) return { ok: false, reason: 'not_found' };
      if (!order_id) throw new TypeError('claimOfferOrder needs an order id');
      if (rec.order_id) return rec.order_id === order_id ? { ok: true, first: false } : { ok: false, reason: 'another_order' };
      merge('offer', String(id), { order_id });
      return { ok: true, first: true };
    },
    // A window opens with a key's first hit and closes windowSeconds later;
    // the first hit after that opens a new one. Hits over a limit still count.
    bump(key, windowSeconds) {
      const t = now();
      sweep(t);
      const cur = db.get('hits', String(key));
      const live = cur && cur.ends > t;
      const next = live ? { n: cur.n + 1, ends: cur.ends } : { n: 1, ends: Math.round(t + windowSeconds * 1000) };
      db.put('hits', String(key), next, next.ends);
      return next.n;
    },
    log(event) {
      db.append({ at: new Date(now()).toISOString(), ...event });
    },
    recent: (limit = 50) => db.tail(Math.min(Math.max(1, Math.round(Number(limit)) || 50), MAX_EVENTS)),
  };
}

// For Node scripts and checks. `now` lets a check move the clock.
export function memoryStore({ now = () => Date.now() } = {}) {
  const rows = new Map();
  let events = [];
  const ops = operations({
    get: (kind, id) => {
      const row = rows.get(`${kind} ${id}`);
      return row ? JSON.parse(row.data) : null;
    },
    put: (kind, id, value, expires) => { rows.set(`${kind} ${id}`, { data: JSON.stringify(value), expires }); },
    append: event => { events.push(JSON.stringify(event)); },
    tail: n => events.slice(-n).reverse().map(e => JSON.parse(e)),
    sweep: (t, keep) => {
      for (const [key, row] of rows) if (row.expires < t) rows.delete(key);
      events = events.slice(-keep);
    },
  }, now);
  return Object.fromEntries(OPS.map(op => [op, async (...args) => ops[op](...args)]));
}

// The same operations over the object's own SQLite database.
export class Offers extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    const sql = ctx.storage.sql;
    sql.exec(`CREATE TABLE IF NOT EXISTS records (kind TEXT NOT NULL, id TEXT NOT NULL, expires INTEGER NOT NULL, data TEXT NOT NULL, PRIMARY KEY (kind, id));
      CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL);`);
    this.ops = operations({
      get: (kind, id) => {
        const row = sql.exec('SELECT data FROM records WHERE kind = ? AND id = ?', kind, id).toArray()[0];
        return row ? JSON.parse(row.data) : null;
      },
      put: (kind, id, value, expires) => {
        sql.exec('INSERT OR REPLACE INTO records (kind, id, expires, data) VALUES (?, ?, ?, ?)', kind, id, expires, JSON.stringify(value));
      },
      append: event => { sql.exec('INSERT INTO events (data) VALUES (?)', JSON.stringify(event)); },
      tail: n => sql.exec('SELECT data FROM events ORDER BY id DESC LIMIT ?', n).toArray().map(row => JSON.parse(row.data)),
      sweep: (t, keep) => {
        sql.exec('DELETE FROM records WHERE expires < ?', t);
        sql.exec('DELETE FROM events WHERE id <= (SELECT MAX(id) FROM events) - ?', keep);
      },
    }, () => Date.now());
  }

  // Public methods are what the worker reaches over RPC.
  putOffer(rec) { return this.ops.putOffer(rec); }
  getOffer(id) { return this.ops.getOffer(id); }
  updateOffer(id, patch) { return this.ops.updateOffer(id, patch); }
  putCode(rec) { return this.ops.putCode(rec); }
  getCode(code) { return this.ops.getCode(code); }
  updateCode(code, patch) { return this.ops.updateCode(code, patch); }
  bump(key, windowSeconds) { return this.ops.bump(key, windowSeconds); }
  log(event) { return this.ops.log(event); }
  recent(limit) { return this.ops.recent(limit); }
  claimCode(code, order_id, opts = {}) { return this.ops.claimCode(code, order_id, opts); }
  claimOfferOrder(id, order_id) { return this.ops.claimOfferOrder(id, order_id); }
}

// One object holds every shop: an offer is found by its id alone, and the
// per-address limit has to count across shops. `name` is there to split it later.
export function doStore(env, name = 'main') {
  if (!env?.OFFERS) throw new Error('doStore needs the OFFERS Durable Object binding');
  const stub = env.OFFERS.get(env.OFFERS.idFromName(name));
  return Object.fromEntries(OPS.map(op => [op, async (...args) => stub[op](...args)]));
}
