'use strict';

// Provider adapter boundary.
//
// Today the only adapter is "recorded": it resolves generation jobs from
// recorded result bundles in bundles/<briefFingerprint>.json. A real Arcade
// adapter would implement the same {request(fingerprint) -> jobId, poll} shape
// against the documented API (patterns/create -> jobs/get -> products/create).
//
// Bundles are provenance-labeled: an illustration or Studio capture is never
// presented as a live API response.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function createRecordedProvider(bundlesDir, latencyMs) {
  const latency = latencyMs == null ? 2500 : latencyMs;

  function loadBundle(fingerprint) {
    const file = path.join(bundlesDir, `${fingerprint}.json`);
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }

  return {
    kind: 'recorded',
    // Returns {jobId, done(bundle|null, error|null)} — done resolves after the
    // simulated latency so the UI can show a genuine pending state.
    request(fingerprint, _briefText) {
      const jobId = `job_${crypto.randomBytes(6).toString('hex')}`;
      const done = new Promise((resolve) => {
        setTimeout(() => {
          const bundle = loadBundle(fingerprint);
          if (bundle) {
            resolve({ bundle });
          } else {
            resolve({ bundle: null, error: `no recorded result for brief ${fingerprint}` });
          }
        }, latency);
      });
      return { jobId, done };
    },
  };
}

// Cache-first provider: serve bundles/<fingerprint>.json when it exists
// (recorded bundle or a previously generated Arcade result), fall back to
// `fallback` on a miss. Keeps rehearsals offline and never re-generates.
function createCachedProvider(bundlesDir, fallback, latencyMs) {
  const latency = latencyMs == null ? 2500 : latencyMs;
  const file = (fp) => path.join(bundlesDir, `${fp}.json`);

  return {
    kind: `cached-${fallback.kind}`,
    request(fingerprint, briefText) {
      if (fs.existsSync(file(fingerprint))) {
        const jobId = `job_${crypto.randomBytes(6).toString('hex')}`;
        const done = new Promise((resolve) => {
          setTimeout(() => resolve({ bundle: JSON.parse(fs.readFileSync(file(fingerprint), 'utf8')) }), latency);
        });
        return { jobId, done };
      }
      return fallback.request(fingerprint, briefText);
    },
  };
}

module.exports = { createRecordedProvider, createCachedProvider };
