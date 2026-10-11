'use strict';

// One-off regeneration of the two staged Arcade bundles with the current
// brief text (now carrying İznik-tile style direction). Writes the same
// recorded-result bundles the cache-first provider replays.

const path = require('node:path');
const engine = require('../src/state');
const { createArcadeProvider } = require('../src/arcade');

const BUNDLES = path.join(__dirname, '..', 'bundles');
const apiKey = process.env.ARCADE_API_KEY;
if (!apiKey) {
  console.error('ARCADE_API_KEY not set');
  process.exit(1);
}

const GIFT = { recipient: 'Maya', occasion: 'housewarming', category: 'pillow cover' };
const ALEX = { text: 'Lemon sprigs from our garden walks', intendedInfluence: 'one small lemon-and-leaf detail' };
const DENIZ = { text: 'Blue tiled courtyards and Turkish motifs', intendedInfluence: 'a simplified tulip and thin geometric border' };
const SAM = { text: 'Calm home. Minimal pattern. No lettering.', intendedInfluence: 'more empty space, quieter border, no words' };

const v1 = engine.buildBrief(GIFT, { alex: ALEX, deniz: DENIZ, sam: null });
const v2 = engine.buildBrief(GIFT, { alex: ALEX, deniz: DENIZ, sam: SAM });

console.log('v1 fp', v1.fingerprint, '|', v1.text);
console.log('v2 fp', v2.fingerprint, '|', v2.text);

const provider = createArcadeProvider(apiKey, BUNDLES);

async function main() {
  for (const brief of [v1, v2]) {
    const { jobId, done } = provider.request(brief.fingerprint, brief.text);
    console.log(`request ${jobId} for ${brief.fingerprint}…`);
    const res = await done;
    if (res.error) {
      console.error(`FAILED ${brief.fingerprint}: ${res.error}`);
      process.exitCode = 1;
      return;
    }
    console.log(`OK ${brief.fingerprint} → ${res.bundle.image} · ${res.bundle.quote ? res.bundle.quote.unitPrice + ' ' + res.bundle.quote.currency : 'no quote'}`);
  }
}

main();
