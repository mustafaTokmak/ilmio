'use strict';

// Completion checks from the build plan, using Node's built-in test runner.
// Run: node --test

const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../src/state');

const SEED = {
  gift: { recipient: 'Maya', occasion: 'housewarming', category: 'pillow cover' },
  contributions: {
    alex: { text: 'Lemon sprigs from our garden walks' },
    deniz: { text: 'Blue tiled courtyards and Turkish motifs' },
    sam: null,
  },
};

const CONFIG = {
  size: '18 x 18 in',
  fabric: 'cotton-linen',
  print: 'single-sided',
  closure: 'hidden zipper',
  insertIncluded: false,
};

function bundleFor(state, overrides) {
  const v = engine.currentVersion(state);
  return {
    kind: 'recorded-result',
    briefFingerprint: v.brief.fingerprint,
    provenance: { kind: 'illustration', label: 'test fixture — not an Arcade response' },
    product: { name: 'test pillow', category: 'pillow cover', configuration: CONFIG },
    image: 'bundles/assets/test.png',
    quote: {
      unitPrice: '34.00',
      currency: 'USD',
      quantity: 1,
      shipping: 'not provided',
      tax: 'not provided',
      duties: 'not provided',
      expiresAt: null,
      configuration: CONFIG,
    },
    ...overrides,
  };
}

function readyState() {
  const state = engine.createState(SEED);
  const job = engine.requestGeneration(state, 'job1');
  engine.resolveGeneration(state, job.id, bundleFor(state));
  return state;
}

test('a new contribution makes the proposal stale and clears current approvals', () => {
  const state = readyState();
  engine.approve(state, 'v1', 'alex');
  engine.approve(state, 'v1', 'deniz');
  assert.equal(engine.giftStatus(state).unanimous, false);

  const v2 = engine.submitContribution(state, 'sam', 'Calm home. Minimal pattern. No lettering.');
  assert.equal(state.versions.find((v) => v.id === 'v1').status, 'stale');
  assert.equal(v2.approvals.sam, 'pending');
  assert.equal(v2.approvals.alex, 'pending');
  assert.notEqual(v2.brief.fingerprint, state.versions[0].brief.fingerprint);
  assert.equal(engine.giftStatus(state).unanimous, false);
});

test('approving a stale version is rejected', () => {
  const state = readyState();
  engine.submitContribution(state, 'sam', 'Calm home.');
  assert.throws(() => engine.approve(state, 'v1', 'alex'), /stale-version/);
});

test('a superseded async response cannot overwrite the current proposal', () => {
  const state = readyState();
  // Start a generation for v1's brief... then change the brief before it lands.
  engine.submitContribution(state, 'sam', 'Calm home. Minimal pattern. No lettering.');
  const staleJob = { id: 'job_late' };
  state.jobs[staleJob.id] = {
    id: staleJob.id,
    versionId: 'v2',
    fingerprint: 'old-brief',
    status: 'superseded',
  };
  const res = engine.resolveGeneration(state, 'job_late', bundleFor(state));
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'superseded');
  assert.equal(engine.currentVersion(state).bundle, null);
});

test('submitting a contribution marks running jobs superseded', () => {
  const state = engine.createState(SEED);
  const job = engine.requestGeneration(state, 'jobA');
  engine.submitContribution(state, 'sam', 'Calm home.');
  assert.equal(state.jobs[job.id].status, 'superseded');
});

test('a prepared bundle whose fingerprint does not match the brief is rejected', () => {
  const state = engine.createState(SEED);
  const job = engine.requestGeneration(state, 'job1');
  const wrong = bundleFor(state);
  wrong.briefFingerprint = 'deadbeefdeadbeef';
  const res = engine.resolveGeneration(state, job.id, wrong);
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'brief-mismatch');
  assert.equal(engine.currentVersion(state).status, 'mismatch');
});

test('a quote describing a different configuration is rejected', () => {
  const state = engine.createState(SEED);
  const job = engine.requestGeneration(state, 'job1');
  const wrong = bundleFor(state);
  wrong.quote.configuration = { ...CONFIG, size: '20 x 20 in' };
  const res = engine.resolveGeneration(state, job.id, wrong);
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'quote-config-mismatch');
});

test('price-only refresh keeps artwork approvals but resets host acceptance', () => {
  const state = readyState();
  engine.approve(state, 'v1', 'alex');
  engine.approve(state, 'v1', 'deniz');
  engine.approve(state, 'v1', 'sam');
  engine.acceptQuote(state, 'v1');
  assert.equal(engine.giftStatus(state).quoteAccepted, true);

  const q = { ...engine.currentVersion(state).quote };
  delete q.revision;
  delete q.refreshedAt;
  q.unitPrice = '36.00';
  engine.refreshPrice(state, 'v1', q);

  const v = engine.currentVersion(state);
  assert.equal(v.approvals.alex, 'approved');
  assert.equal(v.approvals.deniz, 'approved');
  assert.equal(v.approvals.sam, 'approved');
  assert.equal(v.quote.revision, 2);
  assert.equal(v.hostAcceptance, null);
  assert.equal(engine.giftStatus(state).unanimous, true);
  assert.equal(engine.giftStatus(state).quoteAccepted, false);
});

test('a refreshed quote for a different configuration is rejected', () => {
  const state = readyState();
  const q = { ...engine.currentVersion(state).quote, configuration: { size: '24 x 24 in' } };
  delete q.revision;
  assert.throws(() => engine.refreshPrice(state, 'v1', q), /quote-config-mismatch/);
});

test('missing quote: artwork can be approved but priced handoff cannot', () => {
  const state = engine.createState(SEED);
  const job = engine.requestGeneration(state, 'job1');
  const noQuote = bundleFor(state);
  delete noQuote.quote;
  engine.resolveGeneration(state, job.id, noQuote);

  engine.approve(state, 'v1', 'alex');
  assert.equal(engine.currentVersion(state).approvals.alex, 'approved');
  assert.throws(() => engine.acceptQuote(state, 'v1'), /no-quote/);
});

test('expired quote blocks host acceptance', () => {
  const state = engine.createState(SEED);
  const job = engine.requestGeneration(state, 'job1');
  const b = bundleFor(state);
  b.quote.expiresAt = '2020-01-01T00:00:00.000Z';
  engine.resolveGeneration(state, job.id, b);
  assert.throws(() => engine.acceptQuote(state, 'v1'), /quote-expired/);
});

test('a request for change blocks unanimous completion until re-approved', () => {
  const state = readyState();
  engine.approve(state, 'v1', 'alex');
  engine.approve(state, 'v1', 'deniz');
  engine.requestChange(state, 'v1', 'sam', 'bigger border');
  assert.equal(engine.giftStatus(state).unanimous, false);
  engine.approve(state, 'v1', 'sam');
  assert.equal(engine.giftStatus(state).unanimous, true);
});

test('unanimous requires all three friends on the current version', () => {
  const state = readyState();
  engine.approve(state, 'v1', 'alex');
  engine.approve(state, 'v1', 'deniz');
  assert.equal(engine.giftStatus(state).unanimous, false);
  engine.approve(state, 'v1', 'sam');
  assert.equal(engine.giftStatus(state).unanimous, true);
});

test('state survives a serialize/deserialize roundtrip (reload)', () => {
  const state = readyState();
  engine.approve(state, 'v1', 'alex');
  const restored = engine.deserialize(engine.serialize(state));
  assert.equal(restored.currentVersionId, 'v1');
  assert.equal(restored.versions[0].approvals.alex, 'approved');
  assert.equal(restored.versions[0].bundle.briefFingerprint, state.versions[0].bundle.briefFingerprint);
  assert.equal(restored.activity.length, state.activity.length);
});

test('deterministic brief: same contributions produce the same fingerprint', () => {
  const a = engine.createState(SEED);
  const b = engine.createState(SEED);
  assert.equal(a.versions[0].brief.fingerprint, b.versions[0].brief.fingerprint);
  assert.equal(a.versions[0].brief.text, b.versions[0].brief.text);
});

test('empty contribution text is rejected', () => {
  const state = readyState();
  assert.throws(() => engine.submitContribution(state, 'sam', '   '), /empty/);
});

test('approving before any artwork exists is rejected', () => {
  const state = engine.createState(SEED);
  assert.throws(() => engine.approve(state, 'v1', 'alex'), /no-artwork/);
});

// --- brainstorm suggestions + gift narrative ---

const { suggest } = require('../src/suggest');
const { narrate, attachNarrative } = require('../src/narrative');

test('suggestions skip memories a friend already contributed', () => {
  const state = engine.createState(SEED);
  const ideas = suggest(state.gift, 'sam', state.contributions, 10);
  const texts = ideas.map((i) => i.memory.toLowerCase());
  assert.ok(!texts.includes('lemon sprigs from our garden walks'));
  assert.ok(!texts.includes('blue tiled courtyards and turkish motifs'));
  assert.ok(ideas.length > 0);
  assert.ok(ideas.every((i) => i.influence));
});

test('suggestions are deterministic', () => {
  const a = suggest(SEED.gift, 'sam', SEED.contributions, 3);
  const b = suggest(SEED.gift, 'sam', SEED.contributions, 3);
  assert.deepEqual(a, b);
});

test('narrative mentions every contributing friend and the product', () => {
  const state = readyState();
  engine.submitContribution(state, 'sam', 'Calm home. Minimal pattern. No lettering.');
  const job = engine.requestGeneration(state, 'job2');
  engine.resolveGeneration(state, job.id, bundleFor(state));
  const v = engine.currentVersion(state);
  const text = narrate(v, state.gift);
  assert.ok(text.includes('Alex'));
  assert.ok(text.includes('Deniz'));
  assert.ok(text.includes('Sam'));
  assert.ok(text.includes('Maya'));
  assert.ok(text.includes(v.bundle.product.name));
});

test('attachNarrative stores provenance label on the version', () => {
  const state = readyState();
  const v = engine.currentVersion(state);
  attachNarrative(v, state.gift);
  assert.equal(v.narrative.engine, 'local-template');
  assert.ok(v.narrative.label.includes('not a cloud AI'));
  assert.ok(v.narrative.generatedAt);
});
