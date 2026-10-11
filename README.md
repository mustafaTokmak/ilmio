# One Gift, Many People

**Pitch: Everyone adds a memory. Together, you make one gift.**

A polished demo and first build for the [Shopping 3.0 — AI Commerce Hackathon with Arcade](https://www.tech-week.com/calendar/sf/events/shopping-3-0-the-ai-commerce-hackathon-with-arcade-1aa3beea-03e6-4cae-83c1-f731dfa509d5).

## Concept

A group gift usually reflects whoever buys it. Here, every friend adds a memory — and each new contribution changes the proposed gift. Earlier approvals stop applying, a revised product appears, and everyone approves that specific result. The recipient also gets a story card connecting the gift to the people behind it.

## Demo flow (120 seconds)

1. Open a housewarming gift with two of three memory cards filled.
2. Reveal the first generated product + configuration + quote. 2/3 approve.
3. Add the third contribution live — the brief changes, approvals reset to 0/3.
4. Reveal the revised product beside the first. All three approve version 2.
5. Close on the recipient story card: friend → memory → visible detail.

## Build

One local page with five states (contributions → first product → changed brief → revised product → approved story card), a deterministic brief builder, version-bound approvals, an activity trail, and a reset control. Standard HTML/CSS/JavaScript with a small local Node server; recorded result bundles keep reload and offline rehearsal working.
