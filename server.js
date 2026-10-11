'use strict';

// Local demo server — Node built-ins only, no framework.
// Serves public/ and a small JSON API over the pure state engine in src/state.js.

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

let state = loadState();

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

function loadState() {
  try {
    return engine.deserialize(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return engine.createState(SEED);
  }
}

function saveState() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, engine.serialize(state));
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

  if (req.method === 'GET' && p === '/api/state') {
    return sendJson(res, 200, { state, status: engine.giftStatus(state) });
  }

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
    let ideas = null;
    let ideasEngine = 'local-template';
    if (llm) {
      ideas = await llm.suggest(state.gift, engine.friendName(state.gift, friend), state.contributions, count);
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
    state = engine.createState({ gift, contributions });
    saveState();
    return sendJson(res, 200, { state, status: engine.giftStatus(state) });
  }

  if (req.method === 'POST' && p === '/api/reset') {
    state = engine.createState(SEED);
    saveState();
    return sendJson(res, 200, { state, status: engine.giftStatus(state) });
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
