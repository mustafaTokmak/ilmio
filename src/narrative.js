'use strict';

// Gift narrative generator — the final story card's "about this gift" text.
//
// This is a deterministic local composer (template + the actual contribution
// data), not a cloud LLM call. The UI labels it as an auto-generated draft so
// nobody mistakes it for a generative-AI response. A real LLM-backed narrator
// would implement the same {narrate(version, gift) -> string} signature and
// record its engine name on the stored narrative.

const { friendName } = typeof require !== 'undefined' ? require('./state') : window.OGMP_STATE;

function narrate(version, gift) {
  const influences = version.brief.influences || [];
  const callouts = (version.bundle && version.bundle.callouts) || [];
  const productName = version.bundle ? version.bundle.product.name : gift.category;

  const sentences = [];
  sentences.push(
    `This ${gift.category} was made for ${gift.recipient}'s ${gift.occasion} — one gift shaped by ${influences.length} friends instead of one shopper's guess.`
  );

  for (const inf of influences) {
    const who = friendName(gift, inf.friend);
    const callout = callouts.find((c) => c.friend === inf.friend);
    const detail = callout ? callout.intended : inf.intendedInfluence || 'a quiet place in the pattern';
    sentences.push(`${who} brought “${inf.contribution}”, which became ${detail}.`);
  }

  sentences.push(
    `Together they form the ${productName} — every detail on it traces back to someone who knows ${gift.recipient}.`
  );

  return sentences.join(' ');
}

// Attach (or refresh) the narrative on a version. Stored with its engine name
// so provenance stays explicit.
function attachNarrative(version, gift) {
  version.narrative = {
    text: narrate(version, gift),
    engine: 'local-template',
    label: 'Auto-generated draft (local composer — not a cloud AI response)',
    generatedAt: new Date().toISOString(),
  };
  return version.narrative;
}

const OGMP_NARRATIVE = { narrate, attachNarrative };
if (typeof module !== 'undefined') module.exports = OGMP_NARRATIVE;
if (typeof window !== 'undefined') window.OGMP_NARRATIVE = OGMP_NARRATIVE;
