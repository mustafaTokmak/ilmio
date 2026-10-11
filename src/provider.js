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
    request(fingerprint) {
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

module.exports = { createRecordedProvider };
