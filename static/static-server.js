'use strict';

// Static-mode server shim: implements the demo API client-side so the
// deployed site needs no backend. Same engine modules as server.js.
// Generation resolves recorded bundles from bundles/<fingerprint>.json —
// an unknown brief becomes the honest provider-empty state, never a fake.
//
// Rooms: every gift lives under a unique shareable code, persisted in
// localStorage as ilmio-room:<code>. The seeded demo room ('demo') keeps the
// classic storyboard for old links.

const E = window.OGMP_STATE;
const S = window.OGMP_SUGGEST;
const N = window.OGMP_NARRATIVE;

const SEED = {
  gift: { recipient: 'Maya', occasion: 'housewarming', category: 'pillow cover' },
  contributions: {
    alex: {
      text: 'Lemon sprigs from our garden walks',
      intendedInfluence: 'one small lemon-and-leaf detail',
    },
    deniz: {
      text: 'Blue tiled courtyards and Turkish motifs',
      intendedInfluence: 'a simplified tulip and thin geometric border',
    },
    sam: null,
  },
};

function key(code) { return 'ilmio-room:' + code; }
function load(code) {
  try { return E.deserialize(localStorage.getItem(key(code))); } catch { return null; }
}
function save(code, state) { localStorage.setItem(key(code), E.serialize(state)); }

function roomFor(code, { create = false } = {}) {
  code = String(code || 'demo').slice(0, 40);
  let s = load(code);
  if (!s && (code === 'demo' || create)) { s = E.createState(SEED); save(code, s); }
  return s;
}

function newCode(recipient) {
  const slug = String(recipient || 'gift').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 12) || 'gift';
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(2))).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${slug}-${rand}`;
}

function err(msg, status) { const e = new Error(msg); e.status = status || 400; return e; }

async function generate(code) {
  const state = roomFor(code);
  const current = E.currentVersion(state);
  if (current.status === 'ready') return { job: null, version: current };
  const jobId = 'local-' + Math.random().toString(36).slice(2, 10);
  E.requestGeneration(state, jobId);
  save(code, state);
  let bundle = null, error = null;
  try {
    const res = await fetch('bundles/' + current.brief.fingerprint + '.json');
    if (res.ok) bundle = await res.json();
    else error = `no recorded result for brief ${current.brief.fingerprint}`;
  } catch {
    error = `no recorded result for brief ${current.brief.fingerprint}`;
  }
  try { E.resolveGeneration(state, jobId, bundle, error); } catch { /* superseded */ }
  save(code, state);
  return { jobId, fingerprint: current.brief.fingerprint };
}

window.ogmpLocal = {
  async api(path, body) {
    body = body || {};
    const code = String(body.code || 'demo').slice(0, 40);
    const state = path === '/api/gift' ? null : roomFor(code);
    if (path !== '/api/gift' && !state) throw err(`room not found: ${code}`, 404);
    const persist = () => save(code, state);
    const status = () => ({ code, status: E.giftStatus(state) });

    if (path === '/api/gift') {
      const gift = {
        recipient: String(body.recipient || '').trim() || 'Maya',
        occasion: String(body.occasion || '').trim() || 'housewarming',
        category: String(body.category || '').trim() || 'pillow cover',
        friendNames: {},
      };
      for (const f of E.FRIENDS) {
        const n = body.friendNames && String(body.friendNames[f] || '').trim();
        if (n) gift.friendNames[f] = n.slice(0, 30);
      }
      const contributions = body.prefill
        ? SEED.contributions
        : { alex: null, deniz: null, sam: null };
      const fresh = E.createState({ gift, contributions });
      const c = newCode(gift.recipient);
      save(c, fresh);
      return { code: c, state: fresh, status: E.giftStatus(fresh) };
    }
    if (path === '/api/contributions') {
      if (!E.FRIENDS.includes(body.friend)) throw err('unknown friend');
      const v = E.submitContribution(state, body.friend, body.text, body.intendedInfluence || null);
      persist();
      return { version: v, ...status() };
    }
    if (path === '/api/generate') return generate(code);
    if (path === '/api/approve') {
      const v = E.approve(state, body.versionId, body.friend);
      persist();
      return { version: v, ...status() };
    }
    if (path === '/api/request-change') {
      const v = E.requestChange(state, body.versionId, body.friend, body.note);
      persist();
      return { version: v, ...status() };
    }
    if (path === '/api/accept-quote') {
      const v = E.acceptQuote(state, body.versionId);
      persist();
      return { version: v, ...status() };
    }
    if (path === '/api/refresh-price') {
      const v = E.refreshPrice(state, body.versionId, body.quote);
      persist();
      return { version: v, ...status() };
    }
    if (path === '/api/narrative') {
      const version = state.versions.find((x) => x.id === body.versionId);
      if (!version) throw err('unknown version');
      if (version.id !== state.currentVersionId || version.status !== 'ready')
        throw err('narrative is only generated for the current ready version');
      N.attachNarrative(version, state.gift);
      persist();
      return { version };
    }
    if (path === '/api/reset') {
      const fresh = E.createState(SEED);
      save(code, fresh);
      return { code, state: fresh, status: E.giftStatus(fresh) };
    }
    throw err('unknown endpoint: ' + path);
  },
  state(code) {
    const s = roomFor(code || 'demo');
    if (!s) throw err(`room not found: ${code}`, 404);
    return { code: code || 'demo', state: s, status: E.giftStatus(s) };
  },
  suggest(code, friend, { count = 3, hint = '', avoid = [] } = {}) {
    const s = roomFor(code || 'demo');
    if (!s) throw err(`room not found: ${code}`, 404);
    // Local composer only — honestly labeled. `avoid` keeps repeat pulls fresh;
    // `hint` ranks matching pool ideas first.
    const taken = new Set(
      Object.values(s.contributions || {}).filter(Boolean).map((c) => c.text.trim().toLowerCase())
    );
    const av = new Set((avoid || []).map((a) => String(a).trim().toLowerCase()));
    let pool = (S.POOLS[s.gift.occasion] || S.POOLS.default).filter(
      (p) => !taken.has(p.memory.trim().toLowerCase()) && !av.has(p.memory.trim().toLowerCase())
    );
    const h = String(hint || '').trim().toLowerCase();
    if (h) {
      const match = (p) => p.memory.toLowerCase().includes(h) || p.influence.toLowerCase().includes(h);
      pool = pool.filter(match).concat(pool.filter((p) => !match(p)));
    }
    return { ideas: pool.slice(0, count), engine: 'local-template' };
  },
};
