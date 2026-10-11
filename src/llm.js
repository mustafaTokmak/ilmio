'use strict';

// OpenRouter-backed "understand & compose" layer for ilmio.
//
// Optional: only used when OPENROUTER_API_KEY is set server-side. Every call
// returns null on any failure (network, bad JSON, empty answer) so callers
// fall back to the honest local composers — a real result or a truthful
// failure, never a fake one. Engine names and labels are stored on results so
// provenance stays explicit ("who wrote this" is always visible).

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'anthropic/claude-haiku-4.5';

async function chat(apiKey, model, messages, { temperature = 0.7, maxTokens = 400 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    return typeof text === 'string' ? text.trim() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function createLlm(apiKey, model = DEFAULT_MODEL) {
  const engine = `openrouter:${model}`;
  const label = `AI-composed via OpenRouter (${model})`;

  // "Understand": turn a friend's raw memory (inside joke, shared trip, a thing
  // they always say) into one concrete design influence for the brief.
  async function interpretMemory(gift, who, memory) {
    const text = await chat(apiKey, model, [
      {
        role: 'system',
        content:
          'You translate personal memories into textile design influences. ' +
          'Reply with ONE short phrase (max 12 words): the concrete visual detail ' +
          'this memory should become on the gift. No preamble, no quotes, no emoji.',
      },
      {
        role: 'user',
        content:
          `Gift: a ${gift.category} for ${gift.recipient}'s ${gift.occasion}.\n` +
          `${who}'s memory: "${memory}"\n` +
          'Visual detail it should become:',
      },
    ], { temperature: 0.4, maxTokens: 40 });
    if (!text || text.length > 140) return null;
    return text.replace(/^["'“”]+|["'“”]+$/g, '').replace(/\.$/, '');
  }

  // "Compose": write the gift story card from the actual contributions + product.
  async function narrate(version, gift, friendNameFn) {
    const influences = (version.brief.influences || [])
      .map((inf) => `- ${friendNameFn(gift, inf.friend)}: "${inf.contribution}" → ${inf.intendedInfluence || 'a subtle detail'}`)
      .join('\n');
    const productName = version.bundle ? version.bundle.product.name : gift.category;
    const text = await chat(apiKey, model, [
      {
        role: 'system',
        content:
          'You write warm, concrete 3-4 sentence stories for group gifts. ' +
          'Mention each contributor by name and what their memory became on the gift. ' +
          'No emoji, no headers, no preamble — just the story paragraph.',
      },
      {
        role: 'user',
        content:
          `A ${gift.category} for ${gift.recipient}'s ${gift.occasion}, made by ${influences.split('\n').length} friends.\n` +
          `Product: ${productName}.\nContributions:\n${influences}\nWrite the "about this gift" story:`,
      },
    ], { temperature: 0.8, maxTokens: 220 });
    return text && text.length > 60 ? text : null;
  }

  // Personalized brainstorm: suggest memories a friend could add (inside jokes,
  // shared rituals, places) each paired with the design detail it would become.
  // `hint` steers the ideas ("something about cats"); `avoid` lists ideas
  // already shown so repeated calls keep returning fresh ones.
  async function suggest(gift, who, contributions, count = 3, { hint = '', avoid = [] } = {}) {
    const taken = Object.values(contributions || {}).filter(Boolean).map((c) => c.text.trim()).filter(Boolean);
    const text = await chat(apiKey, model, [
      {
        role: 'system',
        content:
          'You help people brainstorm personal memories for a group gift. ' +
          'Suggest SPECIFIC, personal memories — inside jokes, shared rituals, trips, ' +
          'things the recipient always says — not generic gift ideas. ' +
          'Reply with ONLY a JSON array: [{"memory": "...", "influence": "..."}] where ' +
          'influence is the small visual detail the memory could become (max 8 words).',
      },
      {
        role: 'user',
        content:
          `Gift: a ${gift.category} for ${gift.recipient}'s ${gift.occasion}.\n` +
          `Writing for: ${who}.\n` +
          (hint ? `They want ideas about: ${hint}\n` : '') +
          (taken.length ? `Already used by others (avoid similar): ${taken.join(' | ')}\n` : '') +
          (avoid.length ? `Already suggested (give different ones): ${avoid.join(' | ')}\n` : '') +
          `Give ${count} diverse suggestions:`,
      },
    ], { temperature: 0.9, maxTokens: 350 });
    if (!text) return null;
    const m = text.match(/\[[\s\S]*\]/);
    if (!m) return null;
    try {
      const ideas = JSON.parse(m[0]).filter(
        (i) => i && typeof i.memory === 'string' && typeof i.influence === 'string' && i.memory.trim()
      );
      return ideas.length ? ideas.slice(0, count) : null;
    } catch {
      return null;
    }
  }

  return { interpretMemory, narrate, suggest, engine, label, model };
}

module.exports = { createLlm, DEFAULT_MODEL };
