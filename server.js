'use strict';

// Local demo server — Node built-ins only, no framework.
// Serves public/ and a small JSON API over the pure state engine in src/state.js.

const crypto = require('node:crypto');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('./src/state');
const { createRecordedProvider, createCachedProvider } = require('./src/provider');
const { suggest } = require('./src/suggest');
const { attachNarrative } = require('./src/narrative');
const { createLlm } = require('./src/llm');
const { createArcadeProvider } = require('./src/arcade');

const PORT = process.env.PORT || 3847;
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const BUNDLES = path.join(ROOT, 'bundles');
const DATA_DIR = path.join(ROOT, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

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

// Rooms: each gift lives under a unique shareable code. The seeded demo room
// keeps the legacy data/state.json file; other rooms persist as
// data/state-<code>.json. A judge can create their own gift without touching
// anyone else's.
const rooms = new Map();

function roomFile(code) {
  return code === 'demo' ? STATE_FILE : path.join(DATA_DIR, `state-${code}.json`);
}

function roomFor(code, { create = false } = {}) {
  code = String(code || 'demo').slice(0, 40);
  if (rooms.has(code)) return rooms.get(code);
  let s = null;
  try {
    s = engine.deserialize(fs.readFileSync(roomFile(code), 'utf8'));
  } catch {
    if (code === 'demo' || create) s = engine.createState(SEED);
  }
  if (!s) return null;
  rooms.set(code, s);
  return s;
}

function saveRoom(code) {
  const s = rooms.get(code);
  if (!s) return;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(roomFile(code), engine.serialize(s));
}

function newRoomCode(recipient) {
  const slug = String(recipient || 'gift').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 12) || 'gift';
  const rand = crypto.randomBytes(2).toString('hex');
  return `${slug}-${rand}`;
}

let state = roomFor('demo', { create: true });

// Cache-first: recorded bundles always win; a miss calls real Arcade when a
// key is present, else reports provider-empty. The key stays server-only —
// never in bundles, logs, or client code.
const fallback = process.env.ARCADE_API_KEY
  ? createArcadeProvider(process.env.ARCADE_API_KEY, BUNDLES)
  : createRecordedProvider(BUNDLES, 0);
const provider = createCachedProvider(BUNDLES, fallback, Number(process.env.GENERATION_LATENCY_MS || 2500));

// Optional OpenRouter "understand & compose" layer. Every call falls back to
// the honest local composers when the key is absent or the model errors.
const llm = process.env.OPENROUTER_API_KEY
  ? createLlm(process.env.OPENROUTER_API_KEY, process.env.OPENROUTER_MODEL || undefined)
  : null;

// A room code comes from the request body (POST) or ?code= (GET); the seeded
// demo room answers when none is given so old links keep working.
function codeOf(url, body) {
  return (body && body.code) || url.searchParams.get('code') || 'demo';
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function clientError(res, e) {
  sendJson(res, 400, { error: e.message });
}

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

function serveStatic(res, urlPath) {
  let rel = urlPath === '/' ? '/index.html' : urlPath;
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC)) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      // bundles assets are served too (recorded image files must be local)
      const bundled = path.normalize(path.join(BUNDLES, rel.replace(/^\/bundles/, '')));
      if (bundled.startsWith(BUNDLES)) {
        return fs.readFile(bundled, (e2, d2) => {
          if (e2) {
            res.writeHead(404).end('not found');
          } else {
            res.writeHead(200, { 'Content-Type': MIME[path.extname(bundled)] || 'application/octet-stream' });
            res.end(d2);
          }
        });
      }
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}

async function handleApi(req, res, url) {
  const p = url.pathname;
  const body = req.method === 'POST' ? await readBody(req) : {};

  const code = codeOf(url, body);
  if (req.method === 'GET' && p === '/api/state') {
    const room = roomFor(code);
    if (!room) return sendJson(res, 404, { error: `room not found: ${code}` });
    return sendJson(res, 200, { code, state: room, status: engine.giftStatus(room) });
  }
  // /api/gift always creates a fresh room — it never 404s on the code.
  if (req.method === 'POST' && p === '/api/gift') { /* handled below */ }
  const state = (req.method === 'POST' && p === '/api/gift')
    ? null
    : roomFor(code);
  if (req.method !== 'POST' || p !== '/api/gift') {
    if (!state) return sendJson(res, 404, { error: `room not found: ${code}` });
  }
  const saveState = () => saveRoom(code);

  if (req.method === 'POST' && p === '/api/contributions') {
    // "Understand": when the friend only writes a memory (no explicit design
    // influence), the LLM interprets it into one. Honest provenance is stored
    // on the contribution; a model failure just leaves the field empty.
    let influence = body.intendedInfluence;
    let interpretedBy = null;
    if ((!influence || !String(influence).trim()) && llm) {
      influence = await llm.interpretMemory(
        state.gift,
        engine.friendName(state.gift, body.friend),
        body.text
      );
      if (influence) interpretedBy = llm.engine;
    }
    const v = engine.submitContribution(state, body.friend, body.text, influence);
    if (interpretedBy) state.contributions[body.friend].interpretedBy = interpretedBy;
    saveState();
    return sendJson(res, 200, { version: v, status: engine.giftStatus(state) });
  }

  if (req.method === 'POST' && p === '/api/generate') {
    const current = engine.currentVersion(state);
    if (current.status === 'ready') {
      return sendJson(res, 200, { job: null, version: current });
    }
    const { jobId, done } = provider.request(current.brief.fingerprint, current.brief.text);
    engine.requestGeneration(state, jobId);
    saveState();
    // Resolve asynchronously; superseded/mismatched results are rejected by the engine.
    done.then(({ bundle, error }) => {
      try {
        engine.resolveGeneration(state, jobId, bundle, error);
        saveState();
      } catch (e) {
        // A reset or reseed may wipe the job before a slow provider responds —
        // drop the late result instead of crashing the server.
        console.warn(`dropping late generation result for ${jobId}: ${e.message}`);
      }
    });
    return sendJson(res, 202, { jobId, fingerprint: current.brief.fingerprint });
  }

  if (req.method === 'POST' && p === '/api/approve') {
    const v = engine.approve(state, body.versionId, body.friend);
    saveState();
    return sendJson(res, 200, { version: v, status: engine.giftStatus(state) });
  }

  if (req.method === 'POST' && p === '/api/request-change') {
    const v = engine.requestChange(state, body.versionId, body.friend, body.note);
    saveState();
    return sendJson(res, 200, { version: v, status: engine.giftStatus(state) });
  }

  if (req.method === 'POST' && p === '/api/accept-quote') {
    const v = engine.acceptQuote(state, body.versionId);
    saveState();
    return sendJson(res, 200, { version: v, status: engine.giftStatus(state) });
  }

  if (req.method === 'POST' && p === '/api/refresh-price') {
    const v = engine.refreshPrice(state, body.versionId, body.quote);
    saveState();
    return sendJson(res, 200, { version: v, status: engine.giftStatus(state) });
  }

  if (req.method === 'GET' && p === '/api/suggest') {
    const friend = url.searchParams.get('friend') || '';
    if (!engine.FRIENDS.includes(friend)) {
      return sendJson(res, 400, { error: `unknown friend: ${friend}` });
    }
    const count = Number(url.searchParams.get('count')) || 3;
    const hint = (url.searchParams.get('hint') || '').slice(0, 200);
    const avoid = (url.searchParams.get('avoid') || '').split('|').map((s) => s.trim()).filter(Boolean).slice(0, 30);
    let ideas = null;
    let ideasEngine = 'local-template';
    if (llm) {
      ideas = await llm.suggest(state.gift, engine.friendName(state.gift, friend), state.contributions, count, { hint, avoid });
      if (ideas) ideasEngine = llm.engine;
    }
    if (!ideas) ideas = suggest(state.gift, friend, state.contributions, count);
    return sendJson(res, 200, { ideas, engine: ideasEngine });
  }

  if (req.method === 'POST' && p === '/api/narrative') {
    const version = state.versions.find((v) => v.id === body.versionId);
    if (!version) return sendJson(res, 400, { error: `unknown version: ${body.versionId}` });
    if (version.id !== state.currentVersionId || version.status !== 'ready') {
      return sendJson(res, 400, { error: 'narrative is only generated for the current ready version' });
    }
    if (!engine.isUnanimous(version)) {
      return sendJson(res, 400, { error: 'all friends must approve before the gift narrative is written' });
    }
    // "Compose": prefer the LLM narrator; fall back to the local composer so
    // the story card is never fake — whichever engine wrote it is labeled.
    if (llm) {
      const text = await llm.narrate(version, state.gift, engine.friendName);
      if (text) {
        version.narrative = {
          text,
          engine: llm.engine,
          label: llm.label,
          generatedAt: new Date().toISOString(),
        };
      }
    }
    if (!version.narrative) attachNarrative(version, state.gift);
    saveState();
    return sendJson(res, 200, { narrative: version.narrative });
  }

  if (req.method === 'POST' && p === '/api/gift') {
    // Organizer onboarding: create a fresh gift. `prefill` stages the demo's
    // two seeded contributions so the storyboard stays fast.
    const gift = {
      recipient: String(body.recipient || '').trim() || 'Maya',
      occasion: String(body.occasion || '').trim() || 'housewarming',
      category: String(body.category || '').trim() || 'pillow cover',
      friendNames: {},
    };
    for (const f of engine.FRIENDS) {
      const n = body.friendNames && String(body.friendNames[f] || '').trim();
      if (n) gift.friendNames[f] = n.slice(0, 30);
    }
    const contributions = body.prefill
      ? SEED.contributions
      : { alex: null, deniz: null, sam: null };
    const newCode = newRoomCode(gift.recipient);
    const fresh = engine.createState({ gift, contributions });
    rooms.set(newCode, fresh);
    saveRoom(newCode);
    return sendJson(res, 200, { code: newCode, state: fresh, status: engine.giftStatus(fresh) });
  }

  if (req.method === 'POST' && p === '/api/reset') {
    const fresh = engine.createState(SEED);
    rooms.set(code, fresh);
    saveState();
    return sendJson(res, 200, { code, state: fresh, status: engine.giftStatus(fresh) });
  }

  sendJson(res, 404, { error: 'unknown endpoint' });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/')) {
    handleApi(req, res, url).catch((e) => clientError(res, e));
  } else {
    serveStatic(res, decodeURIComponent(url.pathname));
  }
});

server.listen(PORT, () => {
  console.log(`one-gift-many-people demo → http://localhost:${PORT}`);
});
