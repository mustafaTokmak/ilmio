# OfferAd for Shopify: prototype build spec (working note, not for the repo)

Worktree: `/Users/mustafatokmak/.herdr/worktrees/commerce-hack/hp-offerad-t-0006-shopify-agent-offers`
All new code lives under `shopify/` in that worktree. Do not touch files outside `shopify/`. Do not commit, push, or create branches. Do not add dependencies, a test framework, or docs other than `shopify/README.md`. Plain ES modules, no build step, same style as `public/lib/arena.js` and `mcp`-style worker code in this repo (2 spaces, single quotes, semicolons, short comments that say why). Tests are plain Node scripts in `shopify/scripts/` using `node:assert/strict`.

Research notes with Shopify/UCP/WebMCP facts: `/Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/research/` (R1 = Discount Function and offer primitives, R3 = Shopify agent surface, R4 = WebMCP; read the ones relevant to your part if they exist). Raw docs: `.../work/docs/`.

## What the product is

A seller-agent service for a Shopify store. A buyer's AI agent asks the store for an offer, saying what its user cares about and optionally passing a link to a cheaper competing offer. The service checks the link itself, applies the merchant's limits in code (`policy.js`), and answers with one to three offers: a lower price, or a different kind of offer (free shipping, express upgrade, free add-on, longer returns, on-time guarantee, credit on the next order). When the agent accepts, the service mints a single-use Shopify discount code and returns it with a cart link. The agent applies the code through Shopify's own documented fields (`discounts.codes` in the UCP cart and checkout tools, or `?discount=` on a cart link).

Already written, do not rewrite (read them first):
- `shopify/offers/src/lib/policy.js`: `decide(mandate, request, evidence)`, `checkOffer`, `publicOffer`, `PRIORITIES`, `roomFor`, `unitFloor`.
- `shopify/offers/src/lib/mandates.js`: `SHOPS`, `shopConfig(shop)`, `listProducts(shop)`, `mandateFor(shop, ref)`. Two shops: `mustafa-test-dev.myshopify.com` (the real development store, `settle: 'shopify'`) and `demo` (stand-in storefront served by this worker, `settle: 'dry'`).
- `shopify/scripts/check-policy.mjs`: shows the shape of `decide()` output.

## Files to build

```
shopify/
  README.md                      how to run, test and deploy (short)
  offers/
    wrangler.jsonc               worker "offerad-offers", DO binding OFFERS (class Offers, SQLite), assets ./public
    src/worker.js                routing only
    src/lib/verify.js            competing-offer verifier
    src/lib/settle.js            settlement adapters: Shopify Admin API and dry
    src/lib/store.js             persistence: memoryStore() and doStore(env) with one interface
    src/lib/service.js           the four operations every door calls
    src/lib/mcp.js               MCP JSON-RPC (Streamable HTTP, stateless JSON replies)
    src/lib/pages.js             HTML doors and the demo storefront
    public/embed.js              storefront script: WebMCP tool, visible offer box, JSON-LD
  app/                           the Shopify app (deployed with Shopify CLI)
    shopify.app.toml
    extensions/offer-discount/   Discount Function: one code = one composite offer
    extensions/agent-offers/     theme app extension (app embed) that loads embed.js
  scripts/                       check-*.mjs test scripts
```

## verify.js

```js
export async function verifyCompetingOffer(url, product, policy, opts = {})
// product: mandate.product  { title, brand, gtin, mpn, sku, list, currency }
// policy:  mandate.price_match { trusted_domains, blocked_domains, min_price_ratio }
// opts:    { fetchFn = fetch, now = Date.now(), ownHosts = [], allowLocal = false, timeoutMs = 8000, maxBytes = 1_500_000 }
// returns  { ok, reason, reason_text, url, domain, trusted_domain, price, currency, shipping, availability,
//            condition, title, brand, gtin, mpn, match_by, match_score, method, fetched_at }
```
- The seller fetches the page itself. Nothing the buyer's agent says about the page is trusted.
- URL rules: https only (http and localhost allowed only with `allowLocal`), no IP-literal or private hosts, not one of `ownHosts`, not matching `blocked_domains` (substring match on host), at most 3 redirects, re-check the host after each redirect.
- Extraction, in this order, first complete result wins: JSON-LD (`Product`, `ProductGroup` with `hasVariant`, `@graph`, arrays; `offers` as `Offer`, `AggregateOffer` (use `lowPrice`), or array; `shippingDetails.shippingRate.value`), Shopify product JSON when the URL path contains `/products/<handle>` (fetch `<origin>/products/<handle>.js`: prices are integer cents; pick the variant from `?variant=` or the first available), OpenGraph/meta (`product:price:amount`, `og:price:amount`, `product:price:currency`, `og:title`), microdata `itemprop="price"`.
- `shipping` is a number when the page states it, otherwise `null` (policy then compares item prices only).
- Identity: `match_by: 'gtin'` when GTINs are equal after stripping non-digits and leading zeros; `'mpn'` when MPN equal (case-insensitive) and brand tokens overlap; `'sku'` same idea; else `'title'` when token similarity of normalised titles (Jaccard over words longer than 1 char, numbers kept) is at least 0.6. Below that: `different_product`.
- Reject with reason codes: `bad_url`, `blocked_domain`, `own_store`, `fetch_failed`, `no_price_found`, `currency_mismatch`, `out_of_stock`, `not_new` (itemCondition present and not NewCondition), `different_product`, `implausible_price` (price below `min_price_ratio` × list, default 0.5). `ok: true` has `reason: 'ok'`. `reason_text` is a short plain sentence fit to show the buyer's agent.
- `trusted_domain`: host equals or ends with `.` + an entry of `trusted_domains`.
- Script `check-verify.mjs`: fixtures as inline HTML strings served through an injected `fetchFn` covering every reason code and every extraction method, plus an optional live section (run only with `--live`) against two or three real public product pages to see what real pages give.

## settle.js

```js
export function dryAdapter(store)            // codes live in our own store; used by the demo storefront
export function shopifyAdapter({ shop, token, apiVersion = '2026-10', fetchFn = fetch, functionHandle = null })
// both return { mint(offer, mandate, { offer_id, ttl_minutes }), revoke(code), evaluate?(...) }
// mint -> { codes: [..], cart_url, expires_at, mode: 'function' | 'native' | 'dry', deferred: [..], warnings: [..] }
```
- Codes look like `OFFER-7K2M9Q` (unambiguous alphabet, 6 to 8 chars), single use, expire after `ttl_minutes` (default 60).
- `cart_url`: `{storefront}/cart/{variant_numeric_id}:{qty}[,{gift_variant_numeric_id}:1]?discount={CODE[,CODE2]}`.
- Shopify, native mode (works with no Function deployed): `price` component → `discountCodeBasicCreate` (fixed amount across the product's variant, `usageLimit: 1`, `appliesOncePerCustomer: true`, minimum quantity = offer quantity, `endsAt`, combines with shipping discounts); `free_shipping` → `discountCodeFreeShippingCreate` (same limits, combines with product and order discounts); `gift` → `discountCodeBxgyCreate` (buy the product, get the gift variant at 100% off, one use). Several codes may be returned when the offer has several of these. Check every mutation's exact input shape against the current Admin GraphQL docs (shopify.dev, append `.md`) and write the mutations so they are valid for API version 2026-10; cite the doc URL in a comment above each mutation.
- Shopify, function mode (when `functionHandle` is set): one `discountCodeAppCreate` with the offer's JSON in a metafield (`namespace: '$app'`, `key: 'offer'`, type `json`) and `discountClasses` covering what the offer needs; the Discount Function in `app/extensions/offer-discount` reads it.
- Components that money cannot express at checkout (`extended_returns`, `delivery_guarantee`, `next_order_credit`) go into `deferred`: the service records them against the code and, when the order arrives (webhook or lookup), `annotateOrder` writes a note, tags and metafields (`orderUpdate`), and for `next_order_credit` mints a second code valid for the next order. Provide `annotateOrder(orderGid, terms)`.
- `express_upgrade` needs the Function (delivery target, discount on the express option down to the standard price). In native mode put it in `warnings` and fall back to free shipping capped at the express price if `free_shipping` is also in the offer; otherwise report it as not deliverable.
- Dry adapter: stores `{ code, offer, expires_at, used }`, and exports `evaluate(codes, cart)` → `{ applied: [{ code, title, amount }], rejected: [{ code, reason }], totals }` so the demo cart page can show real totals.
- Script `check-settle.mjs`: dry adapter end to end; Shopify adapter with a stub `fetchFn` asserting the GraphQL operation names, variables and that no secret or seller-only field is sent.

## store.js

One interface, two implementations (`memoryStore()` for Node scripts, `doStore(env)` backed by the `Offers` Durable Object with SQLite):
`putOffer(rec)`, `getOffer(id)`, `updateOffer(id, patch)`, `putCode(rec)`, `getCode(code)`, `updateCode(code, patch)`, `bump(key, windowSeconds)` → count in the current window (rate limits), `log(event)`, `recent(limit)`.

## service.js

```js
export function createService({ store, adapterFor, verify = verifyCompetingOffer, now = () => Date.now(), limits })
// returns { options(input), request(input), accept(input), status(input) }
```
- `options({ shop, product })` → what this store can offer on this product (the kinds of concession, never amounts or limits), the priorities it understands, that it accepts a competing-offer link and from which kinds of shops, list price and standard delivery, and how to ask.
- `request({ shop, product, quantity, priority, need_by_days, competing_offer_url, note, session, client })` → `{ status, product, list, question, offers: [{ offer_id, kind, headline, components, quantity, unit_price, items_total, shipping_total, total, list_total, you_save, extras_value, ship_days, currency, expires_at }], notes, proof: { accepted, domain, their_price, compared }, next }`. Offers are stored with their private fields; only `publicOffer()` output leaves. `next` tells the agent in one or two sentences what to do (answer the question to get a better-fitting offer, show the offers to the user, call accept).
- `accept({ offer_id, user_approved, session })` → re-run `checkOffer`, mint through the shop's adapter, return `{ status: 'accepted', codes, cart_url, apply: { ucp: '...', webmcp: '...', link: '...' }, terms, expires_at, after_purchase: [...] }`. Without `user_approved: true` return `status: 'needs_approval'` and say why. Accepting twice returns the same codes.
- Limits (defaults): 3 requests per product per session per hour, 1 competing-offer check per product per session per hour, 20 requests per IP per hour, offer TTL 30 minutes, code TTL 60 minutes. Over a limit: `status: 'slow_down'` with a plain reason. A session is whatever stable id the door can supply (MCP session header, cookie, IP + user agent hash).
- Never include floor, cost, budget, room, seller_cost or the pace in any reply or log line that can reach the buyer side. Add a check for this in `check-service.mjs` (stringify every reply and assert none of the private numbers appear).

## mcp.js

Remote MCP over Streamable HTTP, stateless JSON replies, protocol `2025-06-18`, CORS open, same shape as the existing connector at `/Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/ref/offerad-mcp-worker.js` (reuse its `rpc` structure).
Tools: `get_offer_options`, `request_offer`, `accept_offer`. Descriptions matter more than anything else here: an agent that was never told about this tool must understand from the description alone what it gets, that it costs nothing, that nothing is bought and no personal data is needed, and when to call it. Say plainly what happens. No imperative "you must" language aimed at the model, no claims of authority.
- Per-store server: `/mcp` on the store's own path (`/apps/offerad/mcp`, shop fixed by the proxy).
- Cross-store connector: `/connect/mcp` where every tool takes a `store` (domain or product URL) so one connector reaches every store that runs the app; unknown stores answer `status: 'store_not_enrolled'`.

## worker.js routes

Everything is also served under the prefix `/apps/offerad` (that is where Shopify's app proxy will put it on the store's own domain; when `shop`, `timestamp` and `signature` query params are present and `SHOPIFY_API_SECRET` is set, verify the proxy signature per Shopify's app-proxy docs and take the shop from it).
- `POST /mcp`, `POST /connect/mcp`
- `GET /api/offers/options`, `POST /api/offers/request`, `POST /api/offers/accept`, `GET /api/offers/status`
- `GET /offer` (form), `POST /offer` (result), `POST /offer/accept` → HTML
- `GET /llms.txt`, `GET /.well-known/offers.json`, `GET /openapi.json`
- `GET /embed.js` (asset)
- `POST /webhooks/orders` (Shopify order webhook, HMAC-verified when the secret is set) → `annotateOrder`
- Demo storefront (shop `demo`): `GET /demo` (home), `/demo/products/:handle`, `/demo/cart/:lines` (accepts `?discount=`), `/demo/checkout` (review page, no payment, ends at "order would be placed here"), `/demo/policies`, competitor shop `/rival/products/:handle` (a second "shop" with JSON-LD, used as a competing-offer link in tests; several variants: cheaper, much cheaper, out of stock, different product).
- `GET /admin/log` (recent events, for the demo) 

Shop resolution: proxy signature → `shop` query/body field → `demo`. Admin token for the Shopify adapter comes from `env.SHOPIFY_ADMIN_TOKEN` or, when absent, a client-credentials exchange using `env.SHOPIFY_API_KEY` / `env.SHOPIFY_API_SECRET` cached in memory until it expires.

## pages.js and embed.js

- `/offer`: a plain page a person or a browser agent can use with no script: product and price, a short sentence on what can be asked, radio buttons for priority, quantity, optional need-by, optional competing-offer link, submit. The result page lists the offers as cards with totals, a note on what was checked, and an "Accept this offer" button; the accepted page shows the code, what it does, when it expires and a link that opens the cart with the code applied. Light mode only, readable, no tracking.
- Demo storefront pages look like a normal small shop. Discovery hooks are switchable per request with `?hooks=` (comma list) and default from env `DEMO_HOOKS`: `box` (visible "Ask this store for an offer" box under the price linking to `/offer`), `desc` (a sentence at the end of the product description pointing agents to the offer endpoint), `jsonld` (Product JSON-LD plus a `potentialAction` pointing at the offer endpoint), `webmcp` (load `embed.js`), `policy` (a line in `/demo/policies`). With no hooks the shop shows nothing about offers (control arm).
- `embed.js`: reads `window.OfferAd = { endpoint, product, shop }` or data attributes on its script tag. If `navigator.modelContext` or `document.modelContext` exists, register a tool `request_store_offer` (and `accept_store_offer`) next to whatever the site already registered, without replacing existing tools (use `registerTool`, never `provideContext`; read R4 for the exact API). Also inject the visible box if `data-box` is set, and the JSON-LD if `data-jsonld` is set. Must be safe on a real Shopify storefront: no globals beyond `window.OfferAd`, no errors when the API is missing.

## Shopify app (`shopify/app`)

- `shopify.app.toml`: name "OfferAd agent offers", scopes `write_discounts,read_products,read_orders,write_orders`, app proxy (`prefix = "apps"`, `subpath = "offerad"`), webhook subscription `orders/create`, `embedded = false`. Leave `client_id` and URLs as placeholders with a comment; they are filled when the app is linked.
- `extensions/offer-discount`: Discount Function (JavaScript), targets `cart.lines.discounts.generate.run` and `cart.delivery-options.discounts.generate.run`. Input: `discount { discountClasses metafield(namespace: "$app", key: "offer") { jsonValue } }`, `triggeringDiscountCode`, cart lines (id, quantity, merchandise variant id), delivery groups and options (handle, title, cost). Behaviour from the offer JSON: `price` → fixed amount on the product's line(s); `gift` → 100% off one unit of the gift variant if it is in the cart; `free_shipping` → 100% off the standard option(s); `express_upgrade` → on options whose title or handle matches the express pattern, a fixed discount equal to (express cost − standard cost) so the buyer pays the standard rate. Each candidate carries a short `message` (shown to the buyer and, through `discounts.applied`, to the agent). Follow R1's notes for the exact input and output schema and validation rules. Include `shopify.extension.toml`, `src/*.graphql`, `src/*.js`, and a Node check script that runs the function's exported `run` functions against sample inputs.
- `extensions/agent-offers`: theme app extension with one app embed block (`blocks/agent-offers.liquid`, target `body`) that loads `embed.js` from the app proxy path with the current product (when on a product page) and settings for box / JSON-LD / WebMCP on or off.
