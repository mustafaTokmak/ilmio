# OfferAd for Shopify

A merchant-side offer desk: a buyer's AI agent asks the store for an offer
(what their user cares about + an optional competing-offer link), the service
verifies the link itself, applies the merchant's limits in code, and answers
with offers that settle in checkout as single-use Shopify discount codes.

Layout

```
offers/    Cloudflare worker "offerad-offers" — the offer desk
  src/worker.js        routing only
  src/lib/policy.js    merchant limits: floors, approved concessions, budget
  src/lib/mandates.js  per-shop product mandates (demo + mustafa-test-dev)
  src/lib/verify.js    competing-offer page verifier (fetches the page itself)
  src/lib/settle.js    code minting: Shopify Admin API (native + Function) and dry
  src/lib/draft.js     draft-order / invoice offers when no Function is deployed
  src/lib/store.js     memoryStore() and doStore() (Durable Object, SQLite)
  src/lib/service.js   options / request / accept / status — every door's brain
  src/lib/mcp.js       MCP JSON-RPC door (Streamable HTTP, stateless)
  src/lib/pages.js     HTML doors, demo storefront, rival storefront
  public/embed.js      storefront script: WebMCP tool + visible box + JSON-LD
app/       the Shopify app (shopify.app.toml + two extensions)
  extensions/offer-discount/   Discount Function: one code = one composite offer
  extensions/agent-offers/     theme app extension loading embed.js
scripts/   check-*.mjs — plain Node test scripts, no dependencies
```

## Test

No dependencies and no build step; Node 20+ is enough. Each script is
self-contained and uses no network except where marked.

```
node shopify/scripts/check-policy.mjs    # limits, offers, arithmetic
node shopify/scripts/check-verify.mjs    # verifier fixtures (--live for real pages)
node shopify/scripts/check-settle.mjs    # adapters against a stub Admin API
node shopify/scripts/check-draft.mjs     # draft-order settlement
node shopify/scripts/check-function.mjs  # the Discount Function on sample inputs
node shopify/scripts/check-service.mjs   # the four operations, incl. privacy of floors
node shopify/scripts/check-pages.mjs     # HTML doors and embed.js
node shopify/scripts/check-worker.mjs    # all routes through worker.fetch
```

## Run

```
cd shopify/offers && npx wrangler dev
```

The demo shop is at `/demo` (its cart and checkout are simulated, codes are
dry). The offer desk answers on `/mcp`, `/connect/mcp`, `/api/offers/*`,
`/offer` (HTML), `/llms.txt`, `/.well-known/offers.json`, `/openapi.json`.
Everything is also served under `/apps/offerad`, the path Shopify's app proxy
uses on a store's own domain. `GET /demo/products/:handle?hooks=` toggles the
discovery hooks (`box,desc,jsonld,webmcp,policy`; empty = control arm).

Environment (all optional until you go live):

- `SHOPIFY_ADMIN_TOKEN`, or `SHOPIFY_API_KEY` + `SHOPIFY_API_SECRET` for a
  client-credentials token exchange — mints real codes on the dev store.
- `SHOPIFY_API_SECRET` also verifies app-proxy signatures and webhook HMAC.
- `SHOPIFY_FUNCTION_HANDLE` switches settlement to the Discount Function;
  `SHOPIFY_SETTLEMENT=draft` uses draft orders/invoices; default is `native`.
- `DEMO_HOOKS` default hook list for the demo storefront; `ADMIN_KEY` gates
  `/admin/log`; `SHOPIFY_API_VERSION`, `SESSION_SALT` tune the rest.

## Deploy

1. `npx wrangler deploy` — gives the worker a public URL.
2. Fill the PLACEHOLDER lines in `app/shopify.app.toml` (`client_id` via
   `shopify app config link`, `application_url`, `auth.redirect_urls`,
   `app_proxy.url` = `{worker origin}/apps/offerad`).
3. `shopify auth login` (a human step — device approval), then
   `cd shopify/app && shopify app deploy` to ship the Discount Function and the
   theme app extension.
4. Set the secrets: `npx wrangler secret put SHOPIFY_API_KEY` /
   `SHOPIFY_API_SECRET` (or `SHOPIFY_ADMIN_TOKEN`), and `SHOPIFY_FUNCTION_HANDLE`
   once the function is deployed.

## Buyer-agent experiments

`../work/tests/` holds the harness that runs buyer agents (claude, codex,
cursor, openrouter runtimes) against a store's own tools through
`kit/store-mcp.mjs`, applies an arm file (control, description menu, FAQ menu),
and logs every call. `batch.mjs` runs a grid and appends one summary line per
run to `results/<arm>.jsonl`.
