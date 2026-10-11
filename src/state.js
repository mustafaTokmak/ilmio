'use strict';

// Pure state engine for the "One Gift, Many People" demo.
// No I/O, no timers — every mutation is a function on a plain-data store
// so it can be serialized, reloaded, and tested with node:test.

const crypto = typeof require !== 'undefined'
  ? require('node:crypto')
  : { createHash: () => ({ update: (s) => ({ digest: () => sha256hex(s) }) }) };

const FRIENDS = ['alex', 'deniz', 'sam'];

const FRIEND_NAMES = {
  alex: 'Alex',
  deniz: 'Deniz',
  sam: 'Sam',
};

const PALETTE = ['turquoise İznik blue field', 'deep navy', 'warm white', 'small coral-red and lemon-yellow accents'];
const STYLE = 'Turkish İznik ceramic-tile panel — ornate floral medallion composition, stylized tulips and carnations, rich saturated glazed-tile colors';

function now() {
  return new Date().toISOString();
}

function fingerprintContributions(contributions) {
  const normalized = FRIENDS.filter((f) => contributions[f] && contributions[f].text.trim())
    .map((f) => `${f}=${contributions[f].text.trim().toLowerCase()}`)
    .sort()
    .join('|');
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

function friendName(gift, id) {
  return (gift.friendNames && gift.friendNames[id]) || FRIEND_NAMES[id] || id;
}

// Deterministic brief: same contributions always produce the same brief.
function buildBrief(gift, contributions) {
  const influences = FRIENDS.filter((f) => contributions[f] && contributions[f].text.trim()).map(
    (f) => ({
      friend: f,
      contribution: contributions[f].text.trim(),
      intendedInfluence: contributions[f].intendedInfluence || null,
    })
  );

  const parts = influences.map(
    (i) => `${friendName(gift, i.friend)}: "${i.contribution}"`
  );
  const text =
    `A ${gift.occasion} gift for ${gift.recipient} — ${gift.category}. ` +
    `Influences: ${parts.join('; ')}. ` +
    `Style: ${STYLE}. ` +
    `Palette: ${PALETTE.join(', ')}.`;

  return {
    recipient: gift.recipient,
    occasion: gift.occasion,
    category: gift.category,
    influences,
    text,
    fingerprint: fingerprintContributions(contributions),
  };
}

function snapshotContributions(contributions) {
  const snap = {};
  for (const f of FRIENDS) {
    snap[f] = contributions[f] ? { ...contributions[f] } : null;
  }
  return snap;
}

function freshApprovals() {
  const a = {};
  for (const f of FRIENDS) a[f] = 'pending';
  return a;
}

function log(state, event, detail) {
  state.activity.push({ at: now(), event, detail: detail || null });
}

function currentVersion(state) {
  return state.versions.find((v) => v.id === state.currentVersionId) || null;
}

function quoteExpired(quote, at) {
  return Boolean(quote && quote.expiresAt && quote.expiresAt <= (at || now()));
}

// A quote must correspond exactly to the version's product configuration.
function quoteMatchesConfiguration(version, quote) {
  if (!version.bundle || !version.bundle.product || !quote) return false;
  return (
    JSON.stringify(quote.configuration || null) ===
    JSON.stringify(version.bundle.product.configuration || null)
  );
}

function createState(seed) {
  const contributions = {};
  for (const f of FRIENDS) {
    const c = seed.contributions && seed.contributions[f];
    contributions[f] = c ? { ...c } : null;
  }

  const state = {
    gift: { friendNames: { ...FRIEND_NAMES, ...(seed.gift.friendNames || {}) }, ...seed.gift },
    contributions,
    versions: [],
    currentVersionId: null,
    jobs: {},
    activity: [],
  };

  const brief = buildBrief(state.gift, state.contributions);
  const version = {
    id: 'v1',
    n: 1,
    contributionSnapshot: snapshotContributions(contributions),
    brief,
    status: 'pending', // pending -> ready -> stale
    bundle: null,
    quote: null,
    approvals: freshApprovals(),
    hostAcceptance: null,
    createdAt: now(),
  };
  state.versions.push(version);
  state.currentVersionId = version.id;
  log(state, 'gift-seeded', `${state.gift.occasion} gift for ${state.gift.recipient}`);
  return state;
}

// Editing a contribution makes the current proposal stale and clears
// current approvals (approvals live on the version, the new version starts clean).
function submitContribution(state, friend, text, intendedInfluence) {
  if (!FRIENDS.includes(friend)) throw new Error(`unknown friend: ${friend}`);
  const trimmed = String(text || '').trim();
  if (!trimmed) throw new Error('contribution text is empty');

  state.contributions[friend] = {
    text: trimmed,
    intendedInfluence: intendedInfluence || null,
    submittedAt: now(),
  };

  const prev = currentVersion(state);
  if (prev) prev.status = 'stale';

  // Any in-flight job was started for a different brief — mark superseded so a
  // late response can never overwrite the new current proposal.
  for (const job of Object.values(state.jobs)) {
    if (job.status === 'running') job.status = 'superseded';
  }

  const brief = buildBrief(state.gift, state.contributions);
  const n = state.versions.length + 1;
  const version = {
    id: `v${n}`,
    n,
    contributionSnapshot: snapshotContributions(state.contributions),
    brief,
    status: 'pending',
    bundle: null,
    quote: null,
    approvals: freshApprovals(),
    hostAcceptance: null,
    createdAt: now(),
  };
  state.versions.push(version);
  state.currentVersionId = version.id;
  log(
    state,
    'contribution-submitted',
    `${friendName(state.gift, friend)} added a contribution — ${prev ? prev.id + ' is stale, ' : ''}new brief ${brief.fingerprint}`
  );
  return version;
}

// Async generation: returns a job. The provider resolves it later; only the
// resolution path can attach a bundle, which keeps stale/superseded responses out.
function requestGeneration(state, jobId) {
  const version = currentVersion(state);
  if (!version) throw new Error('no current version');
  if (version.status !== 'pending') throw new Error('version already has a result');
  const job = {
    id: jobId,
    versionId: version.id,
    fingerprint: version.brief.fingerprint,
    status: 'running',
    startedAt: now(),
  };
  state.jobs[jobId] = job;
  log(state, 'generation-requested', `${version.id} · brief ${version.brief.fingerprint}`);
  return job;
}

// Attach a provider bundle to the current version. Rejects superseded jobs,
// brief mismatches, and quote/config mismatches — the recorded result must
// correspond to the exact brief on screen.
function resolveGeneration(state, jobId, bundle, error) {
  const job = state.jobs[jobId];
  if (!job) throw new Error(`unknown job: ${jobId}`);

  if (job.status === 'superseded') {
    job.status = 'discarded';
    log(state, 'response-discarded', `${jobId} arrived after a brief change — superseded response cannot overwrite the proposal`);
    return { ok: false, reason: 'superseded' };
  }
  if (job.status !== 'running') {
    return { ok: false, reason: job.status };
  }

  const version = state.versions.find((v) => v.id === job.versionId);
  if (!version || version.id !== state.currentVersionId || version.status === 'stale') {
    job.status = 'discarded';
    log(state, 'response-discarded', `${jobId} resolved against a stale version`);
    return { ok: false, reason: 'stale-version' };
  }

  if (error || !bundle) {
    job.status = 'failed';
    version.status = 'provider-empty';
    log(state, 'provider-empty', error || 'no recorded result for this brief');
    return { ok: false, reason: 'provider-empty' };
  }

  if (bundle.briefFingerprint !== version.brief.fingerprint) {
    job.status = 'rejected';
    version.status = 'mismatch';
    log(
      state,
      'brief-mismatch',
      `bundle fingerprint ${bundle.briefFingerprint} ≠ brief ${version.brief.fingerprint} — prepared result does not match the shown brief`
    );
    return { ok: false, reason: 'brief-mismatch' };
  }

  // Check before attaching: the quote must describe the same configuration
  // the artwork was generated for.
  if (
    bundle.quote &&
    JSON.stringify(bundle.quote.configuration || null) !==
      JSON.stringify((bundle.product && bundle.product.configuration) || null)
  ) {
    job.status = 'rejected';
    version.status = 'mismatch';
    log(state, 'quote-config-mismatch', 'quote does not describe the bundle configuration');
    return { ok: false, reason: 'quote-config-mismatch' };
  }

  job.status = 'resolved';
  job.resolvedAt = now();
  version.bundle = bundle;
  version.quote = bundle.quote
    ? { ...bundle.quote, revision: 1, refreshedAt: now() }
    : null;
  version.status = 'ready';
  log(
    state,
    'result-attached',
    `${version.id} ready · ${bundle.provenance ? bundle.provenance.label : 'unlabeled result'}`
  );
  return { ok: true, version };
}

// Candidate pick: the room's chosen candidate bundle becomes the current
// version's proposal. Approvals reset — consent binds to this exact result.
// (Candidate fingerprints intentionally differ from the brief fingerprint:
// each direction is its own generated artifact; provenance stays on the bundle.)
function attachCandidate(state, bundle, direction) {
  const version = currentVersion(state);
  if (!version) throw new Error('no current version');
  if (!bundle) throw new Error('candidate has no result');
  version.bundle = bundle;
  version.quote = bundle.quote ? { ...bundle.quote, revision: 1, refreshedAt: now() } : null;
  version.status = 'ready';
  version.pickedCandidate = direction;
  version.approvals = freshApprovals();
  log(state, 'candidate-picked', `${version.id} proposal set from ranked candidate: ${direction}`);
  return version;
}

function approve(state, versionId, friend) {
  const version = state.versions.find((v) => v.id === versionId);
  if (!version) throw new Error(`unknown version: ${versionId}`);
  if (!FRIENDS.includes(friend)) throw new Error(`unknown friend: ${friend}`);
  if (version.status === 'stale' || version.id !== state.currentVersionId) {
    throw new Error('stale-version: approvals apply to the current proposal only');
  }
  if (!version.bundle) throw new Error('no-artwork: nothing to approve yet');

  version.approvals[friend] = 'approved';
  log(state, 'approved', `${friendName(state.gift, friend)} approved ${version.id}`);
  return version;
}

function requestChange(state, versionId, friend, note) {
  const version = state.versions.find((v) => v.id === versionId);
  if (!version) throw new Error(`unknown version: ${versionId}`);
  if (!FRIENDS.includes(friend)) throw new Error(`unknown friend: ${friend}`);
  if (version.status === 'stale' || version.id !== state.currentVersionId) {
    throw new Error('stale-version');
  }
  if (!version.bundle) throw new Error('no-artwork');

  version.approvals[friend] = 'change_requested';
  version.changeNotes = version.changeNotes || [];
  version.changeNotes.push({ friend, note: note || null, at: now() });
  log(state, 'change-requested', `${friendName(state.gift, friend)} requested a change on ${version.id}`);
  return version;
}

// Friends approve artwork. Completion = unanimous approval of the CURRENT version.
function isUnanimous(version) {
  return FRIENDS.every((f) => version.approvals[f] === 'approved');
}

// Host accepts the current quote separately from artwork approval.
function acceptQuote(state, versionId) {
  const version = state.versions.find((v) => v.id === versionId);
  if (!version) throw new Error(`unknown version: ${versionId}`);
  if (version.id !== state.currentVersionId || version.status === 'stale') {
    throw new Error('stale-version');
  }
  if (!version.quote) throw new Error('no-quote: artwork can be reviewed without a price, but a priced handoff needs a quote');
  if (quoteExpired(version.quote)) throw new Error('quote-expired');
  if (!quoteMatchesConfiguration(version, version.quote)) {
    throw new Error('quote-config-mismatch');
  }

  version.hostAcceptance = { quoteRevision: version.quote.revision, acceptedAt: now() };
  log(state, 'quote-accepted', `host accepted ${version.id} quote rev ${version.quote.revision}`);
  return version;
}

// Price-only refresh: artwork approvals stay valid, host acceptance resets.
function refreshPrice(state, versionId, newQuote) {
  const version = state.versions.find((v) => v.id === versionId);
  if (!version) throw new Error(`unknown version: ${versionId}`);
  if (version.id !== state.currentVersionId || version.status === 'stale') {
    throw new Error('stale-version');
  }
  if (!version.bundle) throw new Error('no-artwork');
  if (newQuote && !quoteMatchesConfiguration(version, newQuote)) {
    throw new Error('quote-config-mismatch');
  }

  const revision = (version.quote ? version.quote.revision : 0) + 1;
  version.quote = newQuote ? { ...newQuote, revision, refreshedAt: now() } : null;
  version.hostAcceptance = null;
  log(state, 'price-refreshed', `${version.id} quote rev ${revision} — host acceptance reset, artwork approvals kept`);
  return version;
}

function giftStatus(state) {
  const version = currentVersion(state);
  if (!version) return { state: 'empty' };
  return {
    version: version.id,
    status: version.status,
    unanimous: version.status === 'ready' && isUnanimous(version),
    quoteAccepted: Boolean(
      version.hostAcceptance &&
        version.quote &&
        version.hostAcceptance.quoteRevision === version.quote.revision &&
        !quoteExpired(version.quote)
    ),
  };
}

function serialize(state) {
  return JSON.stringify(state);
}

function deserialize(json) {
  return JSON.parse(json);
}

const OGMP_STATE = {

  FRIENDS,
  FRIEND_NAMES,
  friendName,
  createState,
  buildBrief,
  fingerprintContributions,
  submitContribution,
  requestGeneration,
  resolveGeneration,
  attachCandidate,
  approve,
  requestChange,
  acceptQuote,
  refreshPrice,
  isUnanimous,
  giftStatus,
  currentVersion,
  serialize,
  deserialize,
};

if (typeof module !== 'undefined') module.exports = OGMP_STATE;
if (typeof window !== 'undefined') window.OGMP_STATE = OGMP_STATE;
