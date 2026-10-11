'use strict';

// Static-mode server shim: implements the demo API client-side so the
// deployed site needs no backend. Same engine modules as server.js.
// Generation resolves recorded bundles from bundles/<fingerprint>.json —
// an unknown brief becomes the honest provider-empty state, never a fake.

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

const LS_KEY = 'ilmio-static-state';
let state = null;
try { state = E.deserialize(localStorage.getItem(LS_KEY)); } catch { /* fresh */ }
if (!state) state = E.createState(SEED);

function save() { localStorage.setItem(LS_KEY, E.serialize(state)); }

function err(msg) { const e = new Error(msg); e.status = 400; return e; }

async function generate() {
  const current = E.currentVersion(state);
  if (current.status === 'ready') return { job: null, version: current };
  const jobId = 'local-' + Math.random().toString(36).slice(2, 10);
  E.requestGeneration(state, jobId);
  save();
  let bundle = null, error = null;
  try {
    const res = await fetch('bundles/' + current.brief.fingerprint + '.json');
    if (res.ok) bundle = await res.json();
    else error = `no recorded result for brief ${current.brief.fingerprint}`;
  } catch {
    error = `no recorded result for brief ${current.brief.fingerprint}`;
  }
  try { E.resolveGeneration(state, jobId, bundle, error); } catch { /* superseded */ }
  save();
  return { jobId, fingerprint: current.brief.fingerprint };
}

window.ogmpLocal = {
  async api(path, body) {
    body = body || {};
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
      state = E.createState({ gift, contributions });
      save();
      return { state, status: E.giftStatus(state) };
    }
    if (path === '/api/contributions') {
      if (!E.FRIENDS.includes(body.friend)) throw err('unknown friend');
      const v = E.submitContribution(state, body.friend, body.text, body.intendedInfluence || null);
      save();
      return { version: v, status: E.giftStatus(state) };
    }
    if (path === '/api/generate') return generate();
    if (path === '/api/approve') {
      const v = E.approve(state, body.versionId, body.friend);
      save();
      return { version: v, status: E.giftStatus(state) };
    }
    if (path === '/api/request-change') {
      const v = E.requestChange(state, body.versionId, body.friend, body.note);
      save();
      return { version: v, status: E.giftStatus(state) };
    }
    if (path === '/api/accept-quote') {
      const v = E.acceptQuote(state, body.versionId);
      save();
      return { version: v, status: E.giftStatus(state) };
    }
    if (path === '/api/refresh-price') {
      const v = E.refreshPrice(state, body.versionId, body.quote);
      save();
      return { version: v, status: E.giftStatus(state) };
    }
    if (path === '/api/narrative') {
      const version = state.versions.find((x) => x.id === body.versionId);
      if (!version) throw err('unknown version');
      if (version.id !== state.currentVersionId || version.status !== 'ready')
        throw err('narrative is only generated for the current ready version');
      N.attachNarrative(version, state.gift);
      save();
      return { version };
    }
    if (path === '/api/reset') {
      state = E.createState(SEED);
      save();
      return { state, status: E.giftStatus(state) };
    }
    throw err('unknown endpoint: ' + path);
  },
  state() { return { state, status: E.giftStatus(state) }; },
  suggest(friend, count) { return { ideas: S.suggest(state.gift, friend, state.contributions, count || 3) }; },
};
