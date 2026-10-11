# ilmio — One Gift, Many People

**Pitch: Everyone adds a memory. Together, you make one gift.**

A polished demo and first build for the [Shopping 3.0 — AI Commerce Hackathon with Arcade](https://www.tech-week.com/calendar/sf/events/shopping-3-0-the-ai-commerce-hackathon-with-arcade-1aa3beea-03e6-4cae-83c1-f731dfa509d5).

## Concept

A group gift usually reflects whoever buys it. Here, every friend adds a memory — and each new contribution changes the proposed gift. Earlier approvals stop applying, a revised product appears, and everyone approves that specific result. The recipient also gets a story card connecting the gift to the people behind it.

## Demo flow (90 seconds)

1. Open a housewarming gift with two of three memory cards filled.
2. Reveal the first generated product + configuration + quote. 2/3 approve.
3. Add the third contribution live — the brief changes, approvals reset to 0/3.
4. Reveal the revised product beside the first. All three approve version 2.
5. Close on the recipient story card: friend → memory → visible detail.

## Build

The flow goes from welcome to organizing or joining a gift, then into a room with a candidate tier board, approvals, and a story card. The room also has a deterministic brief builder, version-bound approvals, an activity trail, and a reset control. It uses standard HTML/CSS/JavaScript with a small local Node server; recorded result bundles keep reload and offline rehearsal working.

## Run

Requires Node 18+. No dependencies.

```bash
npm start                  # serves the demo on http://localhost:3847
npm test                   # runs the test suite
npm run build:static       # regenerate the client-only static build
```

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3847` | Port for the local Node server. |
| `GENERATION_LATENCY_MS` | `2500` | Simulated wait before a recorded bundle is returned. |
| `ARCADE_API_KEY` | unset | Enables live Arcade generation for briefs without a recorded bundle; without it, only recorded bundles are available. |
| `OPENROUTER_API_KEY` | unset | Enables LLM memory interpretation, narrative writing, and brainstorm suggestions; local composers are used as fallbacks. |
| `OPENROUTER_MODEL` | `anthropic/claude-haiku-5.5` | OpenRouter model used when `OPENROUTER_API_KEY` is set. |

## Layout

- `src/state.js` — pure state engine: brief builder, version lifecycle, approvals, quote rules
- `src/provider.js` — cache-first recorded bundles with an optional Arcade API fallback
- `src/arcade.js` — Arcade image-generation provider
- `src/llm.js` — optional OpenRouter memory interpretation and composition
- `src/suggest.js` — local brainstorm suggestions
- `src/narrative.js` — local gift-story composer
- `server.js` — dependency-free Node server + JSON API + state persistence
- `public/` — the single-page demo
- `bundles/` — recorded results keyed by brief fingerprint, with provenance labels
- `scripts/regen-bundles.js` — regenerate recorded bundles (requires `ARCADE_API_KEY`)
- `scripts/build-static.js` — generate the static hosting build
- `static/` — client-only build for static hosting, generated from `public/` and `src/state.js`, `src/suggest.js`, and `src/narrative.js`; `static-server.js`, `vendor/sha256.js`, and `bundles/` are maintained separately. The candidate tier board requires the Node server.
- `test/` — `node:test` checks for state rules and static-build consistency
- `demo-voiceover-transcript.md` — demo voiceover transcript

Prepared bundles in `bundles/` are labeled illustrations, not Arcade API responses.

## Static deploy

Serve the contents of `static/` from any static host. Room state is stored in the browser's `localStorage`, separately for each room code.
