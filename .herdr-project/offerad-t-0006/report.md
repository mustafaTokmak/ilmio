## Report

Now (13 Oct 2026, in progress, you are asleep): fourth task, the workaround search and prototype. Not finished. Nobody was contacted and nothing was published.

What exists so far:

- Your go-ahead was taken as: build a real prototype app on your development store, drafts only for outreach, offers must go beyond discounts, the buyer agent may pass a competing-offer link as proof, build on the OfferAd repo.
- Changes made in your Shopify account while you slept: I created the app "OfferAd Agent Offers" in your Dev Dashboard (organisation 168607647, app id 434865111041, version prototype-1, scopes write_discounts, read_products, read_orders, write_orders, write_draft_orders) and installed it on mustafa-test-dev.myshopify.com. To undo: store admin, Settings, Apps, uninstall; then delete the app in the Dev Dashboard. No secret or token was read yet.
- Shopify CLI login on this machine is blocked: the device approval page asks for your password or passkey. So the Discount Function and the theme extension cannot be deployed until you run `shopify auth login` yourself.
- Research notes (ten files, each with quotes and URLs) are in /Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/research/ : Codex (H1), Fable (H2), a protocol hunt (H3) and six readers (R1 to R6).
- Code is being written in the worktree /Users/mustafatokmak/.herdr/worktrees/commerce-hack/hp-offerad-t-0006-shopify-agent-offers (branch hp/offerad/t-0006-shopify-agent-offers, nothing committed) under shopify/.
- People research and verification is running; notes will be in /Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/people/ .

Findings so far (from the notes, live checks marked):

- Checked live on your dev store: the agent endpoints answer while the storefront password is on (13 tools, same as public stores). Carts need a US buyer country. The store's /agents.md and the tokenless Storefront API are blocked by the password.
- Checked live on a public Shopify store by a research agent: a page script can register an extra browser tool next to Shopify's 12, and Shopify's script does not remove it. So an app's storefront script can add an offer tool.
- The settlement rail that works in every channel is a Shopify discount code; five existing products end in a generated code. Direct competitors exist for price-only negotiation (Flux, I Want That). Nobody ships buyer priority plus a verified competing-offer link plus non-price concessions.
- UCP has open proposals for offers and quotes (issues 738, 929, discussion 502). They are not adopted.

Third task (13 Oct 2026, continued from the handoff "feasibility of a Shopify app that negotiates with personal agents"): delivered one standalone HTML note, light mode only. Nobody was contacted, nothing was published, nothing was built.

- Local: /Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/.herdr-project/offerad-t-0006/library/shopify-negotiation-feasibility.html
- MacBook: /Users/mustafatokmak-st/claude-docs/offerad/shopify-negotiation-feasibility.html (folder checked first, file was new, copied and opened there)

Finding: a conditional offer is possible today, a negotiation is not.

- Possible, documented: an agent can submit discount codes on cart and checkout and reads back which discounts applied, with titles, amounts and rejection reasons. An app can decide discounts in code with a Discount Function (cart, customer tags and metafields, cart attributes, entered codes) and can issue one-off codes through the Admin API. Checkout links can carry a code and custom attributes.
- Not possible: an app cannot add its own tool to a store's agent interface (one public store's live tool list has exactly 13 tools, all Shopify's). UCP has no counter-offer or question message. The draft `ask` capability answers questions and must not apply discounts. The agent's free-text `intent` is not an input to Discount Functions. Function network access is enterprise-only. App checkout extensions are excluded from the agent's checkout tools.
- Unknown: `context.eligibility` (an agent claims a benefit, the store applies a provisional discount) is in the protocol and in Shopify's live schema, but Shopify does not document how a merchant or app registers a claim.

Decision in the note: do not build the conversational negotiator on Shopify now. The offer engine (discount rules plus a code issued by the app's own endpoint) is buildable, but it depends on a buyer's agent calling an offer tool it was not told about, which is the same untested assumption the project listed on 7 Oct. Test that on a development store before building.

Handoff steps: 1 and 2 done (UCP developer docs, Discount Functions docs, Checkout MCP docs). Step 3 done as a draft question in the note, not sent. Step 4 (development-store test) not done: it needs a Shopify partner account and a store the user owns. Step 5 done.

Not verified: no test was run; what Shopify does with an eligibility claim; whether a theme app extension may register WebMCP tools on a storefront (inferred from the browser standard, not from Shopify docs); whether Muse, Dots or Grok Bot use these tools or read applied discounts; how an app builds the "custom extensions" on Shopify's UCP marketing page; the live check covered one store only (allbirds.com, anonymous, read-only). The Discount Function reference was searched by keyword, not read in full; the embedded checkout protocol and loyalty extension were not read.

The user must decide: whether he has (or wants to create) a Shopify partner account and development store, and whether to send the partner support question himself.

Earlier tasks in this thread are still in the library: sf-in-person-ideas.html, distribution-first-ideas.html, group-stay-pattern-ideas.html.

## Next

Run `shopify auth login` on homeserver so the Function and theme extension can be deployed
Read the final HTML report once it is delivered to the thread library
Decide whether to keep the app "OfferAd Agent Offers" installed on mustafa-test-dev
Send the draft messages yourself once they are written; nothing has been sent

## Remember

- Shopify's UCP developer docs live at https://shopify.dev/docs/agents (https://shopify.dev/docs/ucp redirects there). Appending `.md` to a shopify.dev docs URL returns clean markdown; ucp.dev pages have `index.md` versions listed in https://ucp.dev/2026-08-25/llms.txt.
- A Shopify store's agent interface is fixed: 13 Shopify tools at `/api/ucp/mcp`, no app-defined tools. The only inputs an agent controls that reach an app's Discount Function are line items, buyer identity and discount codes. `context.intent` does not reach it.
- UCP "negotiation" means capability matching between agent and store, never price negotiation. Do not read it as support for OfferAd-style bargaining.
- `context.eligibility` plus provisional discounts is the closest official mechanism to a conditional offer triggered by the agent; Shopify's handling of custom claims is undocumented as of 13 Oct 2026.
- Any public Shopify store's agent profile is readable at `https://{store}/.well-known/ucp`, and an anonymous `tools/list` call shows the live tool schemas. Useful for checking claims without a dev store.
