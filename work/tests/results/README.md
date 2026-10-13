# Buyer-agent experiment results

One JSON summary line per run. `saw_arm_text` lists the store tools through
which the arm's injected text reached the agent. `codes_submitted` /
`codes_applied` come from the cart/checkout calls; `last_total` is in cents.

## Arms

- `A-control` — nothing about offers anywhere. Baseline: no codes applied.
- `B-menu` — arm file appends an "offers menu" paragraph to The Complete
  Snowboard's description (OFFER-PRICE $112 off, OFFER-GIFT free wax,
  OFFER-BULK 8% on 2+). Simulates merchant-written product content.
- `D-faq-menu` — arm file appends the same menu as a Knowledge-Base FAQ answer
  ("Are there discount codes or offers at this store?") when the agent's FAQ
  query matches discount-ish terms. Simulates a merchant-written KB entry.
  First run 13 Oct 2026 on the `openrouter` runtime (kit/store-mcp.mjs +
  kit/openrouter-buyer.mjs; earlier arms ran claude/codex CLIs on the MacBook).
- `connector-demo` — the buyer has the offers connector installed and shops the
  demo storefront (Powder Lab, the offers worker's own stand-in shop) by
  web_fetch. First full end-to-end run of the product: browse → get_offer_options
  → request_offer → offer in hand → stops for the user's approval, as the rules
  require. 13 Oct 2026, 2 runs (gpt-6.1-sol): both reached a quoted $607.85
  offer ($112 off, vs $719.85 list).

## What the runs say

- `A-control` (6 runs, claude/codex): agents buy at list. Nothing to find.
- `B-menu` (28 runs, claude/codex/grok/gemini): description menu converts on
  `deal` (~4/6) and sometimes `neutral`/`two`/`speed` — every applied code is
  OFFER-PRICE; OFFER-BULK was submitted once, OFFER-GIFT never.
- `D-faq-menu` (24 runs, openrouter: haiku-4.5 / gpt-6.1-sol / grok-4.7):
  `deal` 5/6 applied OFFER-PRICE, `told` 4/6 — but only when the agent chose
  to ask the FAQ tool (haiku on `told` searched elsewhere and never hit it).
  `neutral`, `speed`, `two`, `returns`: 0/12 — the FAQ arm fires only on
  discount-ish queries, so unmotivated agents never see it.
- Both menu arms: agents that saw the text used OFFER-PRICE even when the
  task pointed at a different component (bulk, returns). The "one code per
  order" framing makes the biggest single code the obvious pick.
- `openrouter` runtime validated by re-running B-menu (6 runs): same pattern
  — `deal`/`told`/`neutral` each 1/2 per model, codes found in
  `search_catalog` output.
- `connector-demo` (2 runs): the offer desk does the whole job once the agent
  has the connector — options, a $112-off quote compared against the extras
  package, and a correct stop at the approval gate.

Reading: an agent only uses a published offer when its own goal already
points at it; discovery content converts motivated agents, it does not
create motivation. That argues for making the offer surface reachable from
whatever the agent already does (catalog output, cart readback) rather than
relying on a tool it must think to call.
