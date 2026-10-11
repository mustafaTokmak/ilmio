'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const sourceState = require('../src/state');

const ROOT = path.join(__dirname, '..');

test('static files match the generated build', () => {
  const result = spawnSync(process.execPath, ['scripts/build-static.js', '--check'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('the browser state build exposes candidate attachment and the source fingerprint', () => {
  const sandbox = { TextEncoder, Uint8Array, DataView };
  sandbox.window = sandbox;
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'static/vendor/sha256.js'), 'utf8'), sandbox);
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'static/vendor/state.js'), 'utf8'), sandbox);

  const gift = { recipient: 'Maya', occasion: 'housewarming', category: 'pillow cover' };
  const contributions = {
    alex: {
      text: 'Lemon sprigs from our garden walks',
      intendedInfluence: 'one small lemon-and-leaf detail',
    },
    deniz: {
      text: 'Blue tiled courtyards and Turkish motifs',
      intendedInfluence: 'a simplified tulip and thin geometric border',
    },
    sam: null,
  };

  assert.equal(typeof sandbox.OGMP_STATE.attachCandidate, 'function');
  assert.equal(
    sandbox.OGMP_STATE.buildBrief(gift, contributions).fingerprint,
    sourceState.buildBrief(gift, contributions).fingerprint,
  );
});
