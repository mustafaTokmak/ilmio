# H1 — OfferAd: the Shopify workaround hunt

Research cutoff: **13 October 2026**. Independent, read-only investigation. Prepared from the task brief, the supplied raw documentation, and extensive current web research.

## Verdict

**[inferred] Build a separate, buyer-authorized offer conversation and redeem its result through Shopify's existing commerce primitives. Start with the existing OfferAd MCP connector, a deterministic quote service, and native Shopify discount codes. Add a visible storefront form and WebMCP tools over the same service.** Neither the merchant's Shopify UCP profile nor a new commerce protocol needs to change for this to work. A Shopify app installation alone does not guarantee that every visiting buyer agent will discover or invoke the service.

**[inferred] The five strongest complete mechanisms are:**

| Rank | Mechanism | How the request reaches OfferAd | How the agreed offer reaches Shopify | Principal gate |
|---|---|---|---|---|
| M1 | Authorized cross-store MCP connector → native codes → UCP or ordinary checkout | Buyer connects OfferAd and requests a comparison or negotiation | Admin-created discount code(s), submitted through `discounts.codes` or a cart permalink | Buyer-side connection and permission |
| M2 | Storefront WebMCP with a visible form fallback → existing browser cart | Theme app embed registers offer tools; ordinary browser agents use the equivalent form | Codes plus cart contents carried into Shopify checkout | Embed activation and actual browser-agent support |
| M3 | OfferAd-created Storefront API cart → `checkoutUrl` | An authorized HTTP/MCP quote interface or store form | App calls `cartCreate` with lines, attributes, and native codes | App Storefront API access; agent must accept a checkout handoff |
| M4 | Negotiated draft order → invoice checkout URL | Store quote form or authorized offer tool | `draftOrderCreate` with variant price overrides, shipping, and terms | Different checkout lifecycle; no assumed UCP compatibility |
| M5 | Personal Agent Protocol/Poppy company endpoint → M1/M3/M4 redemption | Poppy discovery, authenticated session, and company-agent conversation | The same Shopify codes/cart/draft backend | Draft protocol, adoption, and merchant-domain discovery |

**[inferred] These are composable routes, not five competing pricing engines.** M1 and M2 solve different agent entry points; M3 and M4 solve different redemption constraints; M5 is a new standards-based entry point. All should share one verifier, merchant policy engine, offer ledger, and post-purchase obligations service.

## Evidence labels and execution boundaries

- **`primary_source_read`**: official documentation, protocol source, first-party announcement, or a clearly identified firsthand source was read. This includes user-supplied saved primary documents; reading a saved response does not mean I repeated its live experiment.
- **`secondary_source`**: a third party reports the claim. Not treated as an API contract.
- **`inferred`**: engineering proposal, synthesis, absence-of-evidence conclusion, or a test that has not been run. These labels also cover all example OfferAd field names and endpoints, which are proposed interfaces rather than Shopify APIs.
- **`tested_live`**: reserved for an actual runtime result obtained in this investigation. **There are no successful new Shopify transaction or agent-adoption tests in this report.** Proposed tests below are not test results.

**[primary_source_read] Local evidence reviewed:** `tools-list.json`, `checkout-mcp.md`, `cart-mcp.md`, `checkout-webmcp.md`, `web-mcp.md`, and the relevant sections of `u-overview.md`, `u-checkout.md`, `u-discount.md`, and `fn-discount-input.md`; clean counterparts under `ucp-spec-0825` and `ucp-spec-draft`; the saved Shopify Admin inputs/mutations, theme configuration, cart permalinks, agent-discovery templates, Chrome WebMCP documentation, and Meta connector requirements. Root: `/Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/docs/`. I did not read another hunter's research answer.

**[inferred; execution record]** Only this output file was written. I did not save additional raw pages because the user's explicit one-output-file restriction and the task's final read-only rule override its earlier raw-download instruction. No accounts, messages, deployments, carts, checkouts, or orders were created. Public documentation was accessed through the web research tool. Direct shell HTTP fetching failed at DNS resolution; attempted fresh web-tool GETs of Allbirds' discovery documents also failed. Consequently, the Allbirds runtime facts below are attributed to the supplied capture, not to a new successful probe.

## 1. Important corrections and new findings

### 1.1 Personal Agent Protocol is already published as a draft

**[primary_source_read]** The October 6 Sierra announcement said v0.1 was planned later in the month. By this investigation, the protocol site displayed **Draft 0.1, updated October 12, 2026**. Its discovery document is `/.well-known/poppy.json`; it supports OpenAPI, MCP, and a company-agent conversation channel. The protocol's own path-to-1.0 page lists Meta, OpenAI, and Instinct as personal-agent design partners, and Shopify and Stripe as technology providers. This supersedes the brief's “announcement only” status. Evidence: S15–S18.

**[inferred]** This is an appropriate place to carry a preference and competitor URL. It is not evidence that Muse or Dots currently auto-discovers every compliant seller, nor that installing a Shopify app publishes the requisite merchant-domain document. Payments remain a stated open area; use Shopify checkout for redemption.

### 1.2 A real OpenAI browser implementation is documented

**[primary_source_read]** OpenAI's current Site tools documentation explicitly says ChatGPT Work and Codex can discover WebMCP tools in the desktop app's built-in browser. The page lists model, workspace-policy, rollout, and Edu limitations. It does **not** establish universal Dots cloud-browser WebMCP support. Separately, Dots documentation confirms shared plugin permissions and its own cloud computer/browser. Evidence: S12–S14.

**[inferred]** M2 now has a named documented buyer runtime to test, rather than merely a hypothetical future Chromium agent. Test that runtime first, then test Muse, Dots, and Grok Bot independently. A model's knowledge of WebMCP is not the same as browser integration.

### 1.3 Shopify has a supported agent-discovery customization hook

**[primary_source_read]** A merchant can supply `templates/agents.md.liquid`; `/llms.txt` and `/llms-full.txt` fall back to it unless individually overridden. Only `request` and `agents` are available in that template, so ordinary `shop`/`collections` references render blank. App-proxy paths use constrained prefixes, not arbitrary root paths. Evidence: S9–S10.

**[inferred]** Publish an honest service description and link to the store's offer form/endpoint there. This is better than hiding instructions inside a discount title. It still requires a merchant-supported template change, is distinct from catalog indexing, and does not install tools or alter `/.well-known/ucp`. Do not promise that a theme app embed can edit this template automatically; theme-write permission and app-review constraints require a separately supported installation path.

### 1.4 Native discounts are enough for a first useful product

**[primary_source_read]** `discountCodeBasicCreate` creates fixed-amount or percentage discounts usable at cart and checkout. The current input exposes `context`, `usageLimit`, validity dates, and combination settings. Free shipping has a separate native mutation. Evidence: S1–S3.

**[inferred]** The first version need not deploy a Discount Function for each quote. Issue a scoped native product discount, or free-shipping code, or both with deliberate combination rules. Add Functions only where the merchant needs conditional bundles, exact quantity rules, or service-specific shipping treatment. Native codes also provide a redemption limit that a signed cart attribute alone cannot provide.

### 1.5 Many codes do not require one active Function discount per quote

**[primary_source_read]** Shopify documents `discountRedeemCodeBulkAdd` for adding up to 250 redeem codes to an existing discount per call. An identified Shopify support response, reaffirmed in February 2026, says usage limits apply per redeem code. The input for an individual redeem code contains only `code`; it does not carry its own customer, expiry, or pricing configuration. Evidence: S6–S7.

**[inferred]** A small set of merchant-approved discount tiers can have many opaque redeem codes. This is a practical answer to the 25-active-Function limit, but it does not give every code different native terms. Test per-code single-use behavior and concurrency before relying on it; use individual native Basic discounts where personalized eligibility/expiry matters. If prices vary continuously, use bounded tiers, a carefully bounded Function configuration, or M4 rather than an unbounded number of active Function discounts.

### 1.6 Variant price overrides make draft orders stronger than a coupon-only design

**[primary_source_read]** Current `DraftOrderLineItemInput.priceOverride` substitutes the variant's catalog price while retaining `variantId`. Overrides cannot be applied to bundle components and can be removed when a line becomes part of a bundle. `DraftOrderInput` supports shipping, attributes, metafields, automatic-discount control, and checkout-code control. Evidence: S20–S22.

**[inferred]** M4 can freeze the negotiated basket more cleanly than portable coupon codes. Do not implement a normal stocked variant as a custom line just to change its price: that would lose the ordinary variant relationship. Do not assume a draft's invoice checkout can be addressed by UCP `get_checkout` or `complete_checkout`; no such mapping was established.

### 1.7 The Function network-access gate is real, and the docs are not perfectly aligned

**[primary_source_read]** The current Discount Function reference says its fetch target is limited to custom apps on **Plus and Enterprise**, with enablement required and no development-store availability. The dedicated network-access page lists Discount Functions for **Shopify for enterprises with custom apps**, again requiring Shopify enablement; it also says Online Store Ajax endpoints do not execute the network request. The tutorial demonstrates validating external discount codes. Evidence: S4–S5.

**[inferred]** Correct the brief's overly categorical “enterprise only” wording to **gated custom-app functionality; plan wording differs between official pages; not an ordinary public-app/dev-store route**. Do not build the general Shopify app around it. Even an eligible store needs proof that its UCP traffic invokes the fetch target; ordinary checkout support does not prove that transport path.

### 1.8 The saved live schema contradicts prose examples in implementation-relevant places

**[primary_source_read]** I parsed the supplied `tools-list.json`: 13 tools, no OfferAd tool. Its `create_checkout` top-level input has `meta` and `checkout`; `cart_id` appears inside `checkout`. The prose Checkout MCP page describes top-level `cart_id`. The capture also requires `line_items` on cart/checkout update payloads, and describes `discounts.codes` as replacement state. Both the capture and docs include `context.intent` and `context.eligibility`, but the Function input does not expose those UCP fields. Sources: S8, S11, and the supplied capture at `https://www.allbirds.com/api/ucp/mcp`.

**[inferred]** Negotiate the protocol version and inspect `tools/list` for the actual target. Do not copy a prose payload blindly. M1's initial test should explicitly create a checkout with the agreed lines and codes; exercise cart conversion separately using the observed schema. “The field is accepted by Shopify” does not imply “the merchant app receives the field.”

### 1.9 Meta's connector directory has a material completion requirement

**[primary_source_read]** Muse's connector guidelines require connectors that start purchasing workflows to complete their supported workflows; handing the whole checkout to the user does not meet the stated completion requirement. They also require factual tool descriptions and appropriate write classification. Evidence: S19.

**[inferred]** A private/custom pilot and a reviewed public Muse connector are different distribution milestones. Do not call an offer-plus-checkout-link connector directory-ready. Either add the required authorized completion/status lifecycle, establish that a narrowly scoped offer-information service qualifies, or use M2/M4's browser route while directory approval remains unproven.

## 2. Attack on candidates A–F

| Candidate | Verdict and exact reason | Evidence and label |
|---|---|---|
| **A: offer token as single-use code** | **Works as a redemption bridge.** OfferAd receives preference/proof separately, verifies it, issues a real Shopify code, and returns it. Shopify's existing code input supplies the missing checkout bridge. A code is a bearer benefit unless checkout enforces customer eligibility; high entropy is not identity binding. A Function discounts existing lines and delivery options—it does not itself insert a gift or create an express carrier service. | **[primary_source_read]** S1–S4, S8, S11. **[inferred]** M1 supplies the complete implementation. |
| **B(i): extra storefront WebMCP tool** | **Works for compatible visiting browser agents.** Register new names through a theme app embed, feature-detect the API, and retain a human form. Installation requires embed activation. The embed does not run on checkout step pages, so negotiate on storefront and carry the code forward. It adds no server UCP tool. | **[primary_source_read]** S9, S11–S12. **[inferred]** M2; runtime discovery still needs a test. |
| **B(ii): product/policy/FAQ text** | **Useful signposting, unreliable tool installation.** Honest text can explain an available price-match service. Arbitrary metafields are not guaranteed to be returned in the relevant catalog/FAQ result. A retrieved instruction cannot confer authority or force an external call. | **[primary_source_read]** S13, S19; saved `web-mcp.md` documents the policy/FAQ tool. **[inferred]** Measure actual returned content and voluntary agent uptake. |
| **B(iii): automatic-discount title** | **Reject as the primary discovery strategy.** An actually applied automatic discount can expose its title, but an ineligible or zero-effect discount is not guaranteed to appear. Titles are explanatory data, not registered tools; an app does not thereby gain control over UCP warnings or arbitrary actions. Giving a real universal discount just to carry a URL costs money. | **[primary_source_read]** S8 describes applied discounts. **[inferred]** No guaranteed “every cart” or execution channel was found. |
| **B(iv): JSON-LD, llms.txt, well-known** | **Split the claim.** Shopify explicitly supports customizing agent Markdown discovery. JSON-LD can describe an offer but does not register a callable tool. App proxy cannot simply claim the root well-known paths. Poppy on a merchant-controlled subdomain is possible, but the agent must first discover that subdomain. | **[primary_source_read]** S9–S10, S15. **[inferred]** Use truthful discovery metadata, not executable instructions. |
| **B(v): one cross-store connector** | **Strongest first route.** Buyer-side authorization and tool registration solve the unfamiliar-endpoint problem for connected users. Each merchant install supplies merchant authority and policy. Directory presence is a distribution project, not an automatic consequence of app installation. Muse has the extra completion gate above. | **[primary_source_read]** S13–S14, S19, S27. **[inferred]** M1 is the initial wedge. |
| **C: an offer menu encoded by known codes** | **Works for a finite menu, not the full proof workflow.** The agent can choose price versus shipping or a qualifying bundle. Rejections explain invalid redemption. Public reusable menu codes do not carry an arbitrary competitor URL to an ordinary app or cause remote verification. | **[primary_source_read]** S3, S8. **[inferred]** Use menus as quote options and anonymous fallback; do not mislabel them bilateral negotiation. |
| **D: provisional eligibility claims** | **No demonstrated ordinary-app route.** The protocol supports provisional benefits, but a claim is not proof, and Shopify's accepted UCP field is not a documented app callback or Function input. Encoding a competitor URL as a reverse-domain claim is semantically wrong and still lacks the receiver. | **[primary_source_read]** S8, S24. **[inferred]** Needs a real Shopify mapping/verification hook before promotion to a build path. |
| **E: custom UCP extension with Actions** | **Valid protocol design; closed merchant integration seam.** Both profiles must advertise compatible support. Owning `com.offerad.*` is sufficient to define an extension, not to modify Shopify's generated profile or make all agents implement it. An independently operated OfferAd UCP business endpoint is possible but still needs agent discovery and a Shopify redemption adapter. | **[primary_source_read]** S23. **[inferred]** Good later standardization, no unblocker for app-only installation. |
| **F: draft order/invoice URL** | **Works as a separate Shopify checkout path.** Variants can have explicit price overrides, selected shipping, and durable quote references. Return `invoiceUrl` without sending an invoice email. Do not mark a draft paid or call `draftOrderComplete` just to obtain a link. Subscriptions, bundle transformations, inventory, expiry, and transport compatibility need separate tests. | **[primary_source_read]** S20–S22. **[inferred]** M4 is the strongest fallback for strict basket contracts. |

**[inferred] Additional candidate G — external discount-code evaluation:** On an enabled enterprise custom app, `enteredDiscountCodes` can reach a fetch target that calls an external evaluator, which returns accepted discounts. This could carry an opaque OfferAd request ID while staying inside a native cart-update flow. It does not help an ordinary public app, and a raw encoded competitor URL raises code-length/normalization and timeout problems. First persist proof through an authorized channel; use only an opaque lookup token at checkout. This is an optimization of A, not a free discovery solution. A genuine UCP-to-fetch compatibility test cannot be completed on a normal development store under the current access rules. Evidence: S4–S5.

**[inferred] Additional candidate H — signed attributes:** An app-created cart or browser form can carry signed offer facts in attributes, which a Function can verify offline against a configured public key and merchant limits. Useful for tamper resistance, but not sufficient for one-time redemption, budget serialization, or proof of customer identity. Never advertise “single-use” merely because a token is signed. Couple it to a native redemption limit or use an order-specific draft. Evidence for transport and inputs: S4, S25–S26; the cryptographic design is a proposal, not a documented Shopify feature.

## 3. Common engine for all five mechanisms

### 3.1 OfferAd's proposed contract

**[inferred]** Preserve the existing MCP's `search_offers`, `make_offer`, `accept`, and `walk_away`; add explicit structured arguments rather than trying to transmit preferences through Shopify's `context.intent`. The following are **OfferAd-defined**, not UCP fields:

```json
{
  "shop_domain": "merchant.example",
  "items": [{"variant_id": "gid://shopify/ProductVariant/123", "quantity": 1}],
  "priorities": ["total_price", "delivery_speed"],
  "constraints": {"currency": "USD", "destination_country": "US", "postal_code": "94107"},
  "competitor_offer_url": "https://competitor.example/products/exact-product",
  "existing_offer_id": null,
  "idempotency_key": "buyer-generated-unique-request-id"
}
```

**[inferred]** `make_offer` returns a finite, labeled menu with an `offer_id`, immutable `revision`, line/quantity scope, currency, expiry, verification status, current payable estimate, tax/shipping assumptions, concession terms, and evidence timestamp. It can answer “price unchanged; free express upgrade available” or “comparison not verifiable; public bundle offer available.” It must distinguish `matched_product_only`, `verified_landed_price`, and `unverified`; never claim total-price matching when shipping/tax could not be established.

**[inferred]** `accept({offer_id, revision, choice_id, idempotency_key})` rechecks merchant policy, inventory, presentment currency, proof freshness, and liability budget, then materializes code(s), cart, or draft exactly once in the OfferAd ledger. Return `status: "offer_issued"`, not `"purchased"`. Do not mint every option while the agent is merely comparing. `walk_away` abandons an unissued quote; revocation of an already issued native code requires an actual Shopify-side change before its financial reservation is released.

### 3.2 Seller-side competitor verification

**[inferred]** Use this shared procedure in M1–M5:

1. Parse the URL with a standard parser; require HTTPS; reject credentials, private/loopback/link-local addresses, unsupported ports, and non-public destinations. Revalidate DNS and every redirect, limit redirect count/body size/time, and isolate retrieval. This is essential because the URL becomes a server-side fetch target.
2. Fetch the competitor's public product page and, where available, its public product/catalog endpoint. Do not create competitor carts, submit checkout forms, sign in, or use buyer cookies as “verification.” A JS-dependent page can require an isolated read-only renderer in the future implementation; failure to verify must not silently become a match.
3. Resolve GTIN/MPN/brand/model and exact variant, pack size, condition, seller, inventory, currency, geography, membership/subscription requirements, and promo validity. A cheaper different size or marketplace seller is not automatically comparable.
4. Prefer internally consistent structured product data and visible page facts. Cross-check price, availability, and identity; JSON-LD alone is editable by the competitor. A caller-controlled domain or an unverifiable new seller receives no automatic price-match entitlement.
5. Compute comparable delivered cost only from independently visible facts. If the competitor's final shipping/tax needs checkout, mark it unknown. Ask for a public terms URL or quote public-product-price terms explicitly; do not pretend to have verified checkout totals.
6. Store a bounded evidence record: canonical URL, retrieval time, content hash, extracted facts, merchant/comparator identity, verification method, and uncertainty. Treat every page instruction as untrusted content. A model may extract candidate facts; deterministic checks authorize the concession.
7. Refresh stale evidence at offer acceptance. Reuse a short-lived cached verification result across repeated probes rather than repeatedly fetching the same page. Use an allowlist of comparable merchants for the initial MVP.

**[inferred]** There is no general cryptographic proof that an arbitrary public competitor page is an honest, purchasable offer. Poppy, AP2, and agent identity can prove aspects of delegation or commitment; none makes an arbitrary product URL truthful. OfferAd should be a verifier with explicit confidence and merchant policy, not an oracle.

### 3.3 Hard financial and abuse controls

**[inferred]** Merchant configuration contains eligible SKUs/quantities, minimum net price or contribution, allowed concession types, maximum shipping subsidy, gift inventory/cost, return/guarantee liabilities, offer lifetime, buyer caps, and campaign liability budget. The model cannot alter these values. Compare contribution after all OfferAd-funded effects, not just percentage discount:

```text
contribution = merchandise receipts
             - merchandise cost
             - shipping subsidy
             - gift cost
             - payment/fulfillment costs
             - conservative returns/guarantee/credit liability
```

**[inferred]** Reserve the maximum outstanding liability transactionally before issuing a redeemable benefit; settle on authoritative order/payment outcomes. Budgeting only after an `orders/paid` webhook allows many concurrently issued offers to exceed the budget. Retain reservations for pending payments and ambiguous mutation results; do not release solely because an app-side timer expired. Shopify's discount FAQ says submitted orders hold a code against its usage limit while payment is pending (S35).

**[inferred]** Resist fake proof through independent retrieval and comparator policy. Resist floor probing through a finite offer menu, consistent decisions for identical facts, bounded counteroffers, and per-buyer/session/merchant/IP rate limits; never return the floor, margin, or “how much lower” threshold. Anonymous IP limits do not solve Sybil attacks. Resist code sharing with high-entropy short-lived codes, enforced customer eligibility when available, quantity/product restrictions, and single-use redemption. A guest bearer code may be used by the first holder; disclose that residual risk rather than claiming it is nontransferable. `buyer.email` alone is not strong proof of an authenticated buyer.

**[inferred]** Audit other discounts before guaranteeing a floor. Disabling combinations on an OfferAd code is useful, but it does not make the app the controller of every unrelated promotion the merchant installed. Freeze incompatible policies, constrain the guarantee to OfferAd's own contribution, or use M4's explicitly calculated draft. Enforce all limits in server/Function code and Shopify configuration, never in a seller-agent prompt.

### 3.4 Delivery of every requested concession

**[inferred]** This matrix is part of each mechanism below. A concession is offered only when the selected redemption path and merchant operations can fulfill it.

| Concession | Actual Shopify implementation | What must be verified |
|---|---|---|
| Product/order price | Native Basic code; conditional Function discount; or draft variant `priceOverride` | Exact variants/quantities, currency, tax treatment, expiry, combination rules, final Shopify total |
| Free shipping | Native free-shipping code, delivery discount Function, or draft `shippingLine` priced at zero | Destination/minimums and maximum eligible shipping rate; free shipping is not a delivery-speed guarantee |
| Express shipping | Select a real returned express option; subsidize that eligible option with a delivery Function, or use a correctly mapped draft shipping service | Inventory/cutoff/address eligibility, service identifier, warehouse fulfillment routing; merely renaming a line “express” is insufficient |
| Free gift | Add a real gift variant line with buyer agreement, then make it free using BXGY/Function or draft price override | Gift in stock; qualifying purchase remains; quantity capped; gift-only or removed-qualifier checkout cannot get the benefit |
| Bundle/bulk tier | Add the specified constituent variants and condition the discount on the complete quantity set; alternatively use an existing supported bundle product | Removing any required item invalidates/reprices the offer; draft bundle components have price-override restrictions |
| Extended returns | Versioned merchant commitment bound to offer/order; order metafield/attribute plus returns-portal/operations integration | The published standard return policy/portal must recognize the exception. A note does not alter Shopify's return eligibility logic by itself |
| Delivery guarantee | Recorded deadline, covered destination/service, exclusions, and remedy; shipment monitoring plus refund/credit workflow | Merchant and carrier can support it; checkout records the entitlement, but delivery success is a later event |
| Next-order credit | Issue a customer-bound future discount or call `storeCreditAccountCredit` after the qualifying paid order under an idempotent ledger | Currency, account/checkout eligibility, refund/cancellation clawback, no repeated credit on retried webhooks; it is future value, not a current-order price reduction |

**[primary_source_read]** Shopify's shipping input can cap eligible shipping prices (S3), draft inputs carry shipping and quote metadata (S20–S22), Storefront/Ajax carts carry attributes (S25–S26), and the store-credit mutation credits a customer or account with a separate scope (S28). **[inferred]** Returns exceptions and delivery guarantees are app/merchant obligations, not a newly discovered UCP concession type. For M1, the unique code links the purchased order to the offer ledger. For M2/M3, also carry a non-secret `offerad_offer_id` attribute. For M4, retain the draft/order relationship and write order metadata explicitly after conversion. For M5, also retain the conversation and offer revision. Never assume all draft metafields or protocol context propagate automatically.

## 4. The five mechanisms, end to end

### M1 — Authorized OfferAd MCP connector, native codes, standard Shopify commerce

**[inferred] Why first:** it extends the existing working project interface, makes buyer authority explicit, accepts both a priority and a competitor URL, and has a conservative Shopify redemption path. It proves the business behavior without waiting for automatic storefront discovery.

**[inferred] Exact sequence:**

1. Merchant installs OfferAd with the minimum relevant Shopify scopes, including `write_discounts` for native discount creation. OfferAd records the verified shop domain and merchant policy. Buyer connects the OfferAd remote MCP connector through a supported runtime and asks it to seek a better offer. Do not expose the merchant Admin token to the buyer agent.
2. Buyer calls `search_offers({shop_domain, items})`, then `make_offer` with the contract in §3.1. The backend reads merchant catalog/inventory and executes §3.2 verification. It returns labeled options, not a hidden price manipulation.
3. Buyer selects an option and calls `accept`. OfferAd reserves liability and calls `discountCodeBasicCreate(basicCodeDiscount: DiscountCodeBasicInput!)`. A one-item prototype can use the following **proposed variable values**:

```json
{
  "basicCodeDiscount": {
    "title": "OfferAd verified price-match offer",
    "code": "OA-UNPREDICTABLE-TOKEN",
    "startsAt": "2026-10-13T12:00:00Z",
    "endsAt": "2026-10-13T12:15:00Z",
    "context": {"all": "ALL"},
    "usageLimit": 1,
    "appliesOncePerCustomer": true,
    "customerGets": {
      "value": {"discountAmount": {"amount": "10.00", "appliesOnEachItem": false}},
      "items": {"products": {"productVariantsToAdd": ["gid://shopify/ProductVariant/123"]}}
    },
    "combinesWith": {"productDiscounts": false, "orderDiscounts": false, "shippingDiscounts": false}
  }
}
```

4. **[inferred]** Replace the example dates at issuance; use customer-scoped `context` after authenticated linking where appropriate. This fixed reduction is not an exact basket contract or an exact-quantity constraint. If those are required, use a Function or M4. Read `userErrors` and the returned discount node before reporting issuance. On an ambiguous timeout, reconcile by the deterministic unique code before retrying or releasing budget.
5. **[inferred]** For shipping, create a separate `discountCodeFreeShippingCreate(freeShippingCodeDiscount: ...)` with its own bounds and deliberately compatible combination settings. For complex joint benefits use `discountCodeAppCreate(codeAppDiscount: ...)` with `functionHandle`, `discountClasses`, and bounded metafield configuration, subject to the active Function limit. Do not assume all menu benefits can be combined.
6. **[inferred]** Return `codes`, item/quantity scope, expiry, and a Shopify permalink. An already integrated buyer calls `tools/call` at `https://{shop}/api/ucp/mcp`, with `params.name: "create_cart"`, `arguments.meta["ucp-agent"].profile`, and `arguments.cart` containing `line_items` and `discounts:{codes:[...]}`. For an existing cart, use `update_cart` with top-level `id` and the full schema-required desired state. Prices, lines, and code applicability must be reread from the returned state.
7. **[inferred]** Once the buyer intends to purchase, use the live `create_checkout` schema; for the initial compatibility test create it with the explicit agreed lines, buyer, and codes. Treat cart conversion as a separate tested optimization because of the documented/captured `cart_id` disagreement. Authenticated checkout calls use the required bearer/signature tier and buyer-IP handling. Check `discounts.applied`, warnings, totals, fulfillment, and status. Call completion only if the runtime has the required permission and buyer authority; otherwise return Shopify's `continue_url`.
8. **[inferred]** If the buyer has no UCP integration, return `https://{shop}/cart/{numeric_variant_id}:{quantity}?discount={code}` (multiple line entries and comma-separated codes where appropriate). A permalink is a handoff, not evidence of successful redemption. Re-read the actual checkout before purchase.

**[primary_source_read] API support:** S1–S4, S8, S11, S26. Admin amounts above are decimal money strings; UCP returned totals use currency minor units. Do not confuse the two representations.

**[inferred; schema checked against supplied capture]** The UCP cart call in step 6 has this envelope. The illustrative variant ID, code, and profile URL must be replaced with the owned store's real values; the agent profile must actually be hosted and valid. This is a payload design, not an executed request:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "create_cart",
    "arguments": {
      "meta": {"ucp-agent": {"profile": "https://buyer.example/ucp-profile.json"}},
      "cart": {
        "line_items": [{"item": {"id": "gid://shopify/ProductVariant/123"}, "quantity": 1}],
        "discounts": {"codes": ["OA-UNPREDICTABLE-TOKEN"]}
      }
    }
  }
}
```

**[inferred] Buyer support/discovery:** installed OfferAd MCP or a deliberately configured HTTP tool; the buyer may already have Shopify UCP, but need not if it can hand off a link. This is opt-in coverage, not universal coverage. Current Dots plugin permissions, Grok custom MCP documentation, and Muse connector review have different rules (S13–S14, S19, S27).

**[inferred] Proof/concessions/abuse:** use §3 in full. Nonfinancial promises are retrieved through the offer ID and stored against the resulting order. Native redemption limits mitigate reuse; customer binding needs actual checkout identity. Do not label the draft seller's quote as a read-only tool if it reserves budget or creates codes.

**[inferred] Development-store proof/kill test:** install on an owned dev store, seed one product, one gift, and standard/express rates, and use a separately owned mock competitor page. Ask the already-connected buyer agent to send “speed first” and the proof URL. Require evidence that the backend received both, fetched proof independently, chose the expected concession, and Shopify reflected it in checkout. Complete only an authorized test-mode order. Then test expired/used/wrong-product codes, changed quantity, second browser redemption, payment-pending replay, conflicting promotions, and concurrent code use. Kill the claimed one-use implementation if two paid test orders consume one entitlement; kill cross-platform support claims separately if a particular runtime cannot invoke the connector. Failure of automatic discovery does not falsify opt-in M1.

### M2 — Storefront WebMCP plus a real offer form, using the live browser cart

**[inferred] Exact sequence:**

1. Merchant activates a theme app embed that renders an accessible “Request an offer / Compare another offer” control and a form with product, quantity, priority, and competitor URL. The form submits to the merchant's configured app-proxy route, for example `/apps/offerad/quotes`. Validate Shopify's proxy signature, but do not treat that signature as authenticated customer identity.
2. When supported, the embed calls `document.modelContext.registerTool` for distinct names such as `offerad_request_offer` and `offerad_accept_offer`, with JSON input schemas matching the visible workflow. Use the documented current API and feature detection. Do not replace Shopify's tool set or claim its names. The tool execution handler calls the same backend as the form.
3. The browser agent discovers the tool on the visited storefront. If unavailable, it uses the visible form with ordinary browser controls. Neither path requires a buyer to install an OfferAd server connector. A factual link in `/agents.md` can help the agent find the offer page.
4. OfferAd verifies the competitor URL and returns the signed/versioned options. On authorized acceptance, the backend issues native codes as in M1. The app reads the current cart via `GET /{locale}/cart.js`; it adds agreed real variants with `POST /{locale}/cart/add.js` and sets the non-secret offer reference with `POST /{locale}/cart/update.js` using `attributes:{offerad_offer_id:"..."}`. Preserve unrelated cart contents and account for any materially changed basket before finalizing the quote.
5. Carry the code to checkout through a documented discount handoff, or let the browser agent call Shopify's checkout `update_checkout` with `checkout.discounts.codes` once checkout tools are present. If using a generated cart permalink, include the fully agreed basket rather than silently dropping existing items. Navigate with the built-in `proceed_to_checkout` where applicable.
6. On checkout, refresh tools and call `get_checkout`. Build the complete intended update from current state; replacement updates must not erase buyer, delivery, codes, or other checkout data accidentally. Verify the discount in `discounts.applied`, select the returned real delivery option, and use `complete_checkout` only after buyer confirmation. Fall back to ordinary visible checkout if WebMCP is unavailable.

**[primary_source_read] Support:** app embeds need activation and do not render on checkout steps (S9); current Chrome registration uses `document.modelContext.registerTool` (S12); Shopify's checkout tool set replaces storefront tools and code inclusion is not proof of application (S11). OpenAI documents a concrete supported Site tools runtime (S14).

**[inferred] Proof/concessions/abuse:** §3 applies. This route handles gift insertion and actual shipping selection naturally. All form/tool inputs are untrusted; browser attributes carry references, never authorization. The server checks policy, and Shopify enforces discount eligibility. A visible quote and acceptance step reduces ambiguity, but does not override the agent's approval requirements.

**[inferred] Development-store proof/kill test:** on the owned dev store, verify both Shopify's original tools and the two new tools coexist after embed activation and theme navigation. Test in a documented OpenAI Site tools configuration, then independently in Muse/Dots/Grok. Use a normal shopping request that mentions comparing an offer, without naming the implementation. Require tool discovery, exact priority/URL receipt, checkout persistence, and correct gift/shipping behavior. Disable WebMCP and repeat through the form. Fail M2's automatic tool claim for a runtime that never enumerates or invokes it; retain the browser-form route if it works. A server-only UCP test is expected not to see these tools.

### M3 — Seller-side Storefront API cart bridge

**[inferred] Why distinct:** this supplies the cart attributes missing from Shopify's UCP MCP inputs, removes the buyer's need to implement Shopify's MCP authentication/version details, and creates a complete gift/bundle basket on the app's side. It also works without a theme if the buyer already knows the OfferAd service.

**[inferred] Exact sequence:**

1. Buyer reaches a documented store offer page, an authorized OfferAd tool, or the merchant's agent-discovery link. It posts the §3.1 quote request; OfferAd verifies proof and returns options.
2. On acceptance, OfferAd issues the bounded native code(s), obtains the authorized store's Storefront API access, and calls `cartCreate(input: CartInput!)` against `https://{shop}/api/2026-10/graphql.json`. The **proposed** input is:

```json
{
  "input": {
    "lines": [
      {"merchandiseId": "gid://shopify/ProductVariant/123", "quantity": 1},
      {"merchandiseId": "gid://shopify/ProductVariant/456", "quantity": 1}
    ],
    "attributes": [{"key": "offerad_offer_id", "value": "offer_opaque_id"}],
    "discountCodes": ["OA-UNPREDICTABLE-TOKEN"],
    "buyerIdentity": {"countryCode": "US"}
  }
}
```

3. Query `cart { id checkoutUrl discountCodes { code applicable } cost { totalAmount { amount currencyCode } } }` plus `userErrors` and relevant warnings. Add contact/address only with buyer authorization and the current input schema. A locale/country hint is not a final shipping address.
4. Store the Shopify cart relationship server-side; return `checkoutUrl`, a read-only offer/terms URL, and provisional totals. Reuse/reconcile the same accepted offer on retries rather than making a new cart and code each time. Once full delivery details are known, check final costs and the selected concession again.
5. Buyer follows Shopify's returned URL and completes there, using browser tools if available or buyer handoff. Do not promise that this cart has become the agent's independently created UCP cart. Do not strip secret components from Shopify cart identifiers, expose Admin credentials, or let arbitrary clients mutate other buyers' carts.

**[primary_source_read] Support:** Storefront `CartInput` exposes `attributes`, `lines`, `discountCodes`, buyer identity, and metafields; `cartCreate` returns a cart with a checkout URL. Evidence: S25. Native codes remain the enforcement path; the attribute is just correlation data.

**[inferred] Buyer support/discovery:** ability to invoke the authorized quote endpoint or use the visible form, then follow a link. This is easier than full UCP support but still needs the initial service discovery. A merchant install can provide seller-side API access; it does not configure the buyer agent.

**[inferred] Proof/concessions/abuse:** §3 applies. All gift/bundle components and offer references are created together. For exact basket-sensitive discounts, use a public-app Function that reads safe Shopify configuration; unsigned cart attributes alone are never enough. Loss of buyer identity during checkout can invalidate a customer-bound discount, which must be shown as a failure rather than quietly waived.

**[inferred] Development-store proof/kill test:** create the offer through an authorized HTTP/MCP client with no Shopify UCP credentials. The backend must produce a Shopify cart and checkout URL containing the expected lines, code, and offer reference. Verify checkout, order metadata linkage, market currency, gift removal, retry reuse, expired code, and attempted attribute tampering. Test in a second browser to expose assumptions about session identity. Kill the claim that attributes enforce security if editing `offerad_offer_id` changes entitlement. Kill suitability for an agent platform that disallows the required handoff, not the underlying Shopify implementation.

### M4 — Explicit negotiated draft order with an invoice checkout link

**[inferred] Why distinct:** this is the cleanest fallback for an exact negotiated basket, combined shipping treatment, and a durable quote record. It is particularly useful for bundles/bulk offers that do not fit a bounded public coupon menu.

**[inferred] Exact sequence:**

1. A browser agent uses the visible “Request an offer” form, or an authorized connector invokes §3.1. OfferAd verifies proof, calculates the entire basket, and obtains acceptance of one revision. It reserves liability before creating the draft.
2. Merchant-authorized backend calls `draftOrderCreate(input: DraftOrderInput!)` with `lineItems:[{variantId,quantity,priceOverride:{amount,currencyCode}}]`, buyer-approved contact/address as needed, `presentmentCurrencyCode`, `customAttributes`/`metafields` containing the offer reference, and `shippingLine` for the agreed shipping treatment. Use the current `ShippingLineInput` fields, such as `title`, `shippingRateHandle` when appropriate, and `priceWithCurrency`; validate a real fulfillment service rather than inventing one.
3. Set `acceptAutomaticDiscounts:false` and `allowDiscountCodesInCheckout:false` when the agreed floor assumes no additional promotions. Do not simultaneously apply a price override and a duplicative line discount. For a gift, add the real variant with the intended zero price, subject to the dev-store test. Use `reserveInventoryUntil` only for a bounded accepted quote; inventory is not reserved by default.
4. Request `draftOrder { id invoiceUrl }` and `userErrors`. Return `invoiceUrl` to the agent. **Do not call `draftOrderInvoiceSend`** merely to generate the link, and do not call `draftOrderComplete` to fake payment. The buyer pays on the Shopify invoice checkout.
5. Persist the offer↔draft↔order relationship. On authorized test/payment completion, explicitly attach the obligation record to the resulting order and reconcile budget. Manage quote expiration in the app and Shopify draft lifecycle; a timestamp on an OfferAd page does not by itself invalidate an already issued direct invoice URL.

**[primary_source_read] Support:** draft creation, access scopes, checkout link, inventory reservation, price override, and discount controls are documented (S20–S22, S29). Draft orders do not currently support subscriptions, and bundle components have explicit price-override limits.

**[inferred] Buyer support/discovery:** ordinary browser/URL handoff is sufficient after the offer conversation. No Poppy/UCP extension is needed. The offer form or buyer's installed connector provides discovery. The draft is a separate purchase session: preserve the original cart unless the buyer chooses to replace it, and warn in the returned structured result if this path cannot preserve subscription/bundle semantics.

**[inferred] Proof/concessions/abuse:** §3 applies. The draft constrains variant quantities and terms more tightly than a reusable coupon. Treat the invoice URL as sensitive bearer access, with buyer/order identity and expiry controls. Returns/guarantees remain operational obligations; the draft only makes their attachment concrete. Do not reserve scarce inventory during speculative negotiations.

**[inferred] Development-store proof/kill test:** submit a verified offer for two real variants, a gift, and express shipping. Read the draft and invoice checkout; prove the precise price, shipping, prohibited extra codes, and eventual variant-based order/fulfillment entries. Change the catalog price, alter the address, apply a cart transform, and let the quote expire; verify no stale direct invoice can purchase an invalid contract. Test a duplicate accept request and an attempted second purchase. If expiry cannot be enforced or transformations change the agreed result, restrict the supported products/path. Do not call M4 UCP-compatible until separately demonstrated on the draft checkout.

### M5 — Poppy company-agent conversation, then ordinary Shopify redemption

**[inferred] Why distinct:** Poppy supplies a standards-based conversational channel with identity/session semantics. It can carry what UCP's current shopping tools cannot expose to an installed app: a buyer's actual request and arbitrary structured proof reference.

**[primary_source_read] Protocol sequence:** publish a compliant `/.well-known/poppy.json`; read `auth.issuer` and its OAuth metadata; obtain a signed-out session using the JWT-bearer grant, client assertion, session assertion, and DPoP proof. Send `POST {agent.protocols[type=poppy].endpoint}` with `message:{id,sender,text,data}`. Read `GET {endpoint}/{conversation_id}/events`; send follow-ups to `/{conversation_id}/messages`. See S15. Poppy's specification/documentation is Apache-2.0 licensed (S18).

**[primary_source_read] Exact authentication fields:** `POST {token_endpoint}` uses `Content-Type: application/x-www-form-urlencoded`, a `DPoP` proof header, and the fields `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer`, `assertion`, `client_id`, `client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer`, and `client_assertion`. Form-encode these values. Validate OAuth metadata `issuer == auth.issuer` and that `poppy_domains` contains `organization.domain`. The signed-out response includes `access_token`, `token_type`, `expires_in`, `scope`, `session_id`, and `signed_in:false`; conversation requests use the session token with `Authorization: DPoP` and a fresh `DPoP` proof. Poppy's MCP bearer-token exception is a separate resource-scoped flow, not permission to reuse an unbound token everywhere. S15 §§3.2, 4.1–4.3, 6.

**[inferred] Proposed OfferAd adaptation:**

1. Use a merchant-controlled subdomain such as `offers.merchant.example`, or identify OfferAd honestly as the company/broker on its own domain. Do not claim that an app proxy can install `/.well-known/poppy.json` at Shopify's root. Link the merchant-controlled offer origin from the storefront and supported agent-discovery template; prove domain ownership and merchant authorization in onboarding.
2. Set `organization.domain` to the domain actually discovered. Publish `protocol_version:"0.1"`, `auth.issuer`, and `agent.protocols:[{type:"poppy",endpoint:"https://offers.merchant.example/poppy/conversations"}]`. If also listing an MCP API, it must implement Poppy's token/audience rules; a normal unauthenticated MCP URL is not automatically compliant.
3. The personal agent supplies `message.sender:"agent"`, a unique message ID, normal-language intent in `text`, and OfferAd-defined `data` containing `items`, `priorities`, and `competitor_offer_url`. Keep request specifics in `text`/`data`, rather than pretending they are standardized Poppy `context` fields.
4. Company agent invokes the same verifier and policy engine as M1. It replies with labeled offer options and structured terms. Acceptance identifies the offer and revision; either use an explicitly authorized subsequent message or the optional `operations` extension to confirm exact terms. Operations must be supported by the personal agent before the company returns them.
5. For an operations-based acceptance, propose the offer-materialization operation, obtain the user's approval or an applicable prior delegation, confirm the exact revision at the advertised operations endpoint, and only then issue Shopify redemption. The operation's single-record/retry semantics help the app avoid duplicate issuance; they do not replace Shopify payment authorization.
6. Return M1 codes, M3 checkout URL, or M4 invoice URL through the company message's structured data. Buyer completes through Shopify's authorized path. A Poppy session token is not a Shopify customer login or permission to charge a card.

**[inferred] Buyer support/discovery:** a Poppy client that supports sessions and conversations, or its listed MCP API with appropriate authorization. The site currently lists major design partners; no primary source read here demonstrates universal production use by Muse/Dots or Shopify app-level automatic discovery. An independently configured standards client can prove the integration while consumer distribution remains unproven.

**[inferred] Proof/concessions/abuse:** §3 applies. Poppy's per-company opaque user identity improves rate-limit/correlation design without making an anonymous user an authenticated Shopify customer. Enforce issuer/domain binding, token audience, DPoP nonce/replay checks, message idempotency, and scoped authority in middleware. Competitor retrieval remains separate. All concessions still use the Shopify implementation matrix.

**[inferred] Development-store proof/kill test:** use an owned offer origin and a Poppy reference/test client with an owned Shopify dev store. Prove discovery, signed-out session, structured priority/URL delivery, reply, accepted revision, exactly-once redemption issuance, and a correct Shopify test checkout. Repeat with replayed messages, stale terms, wrong token audience, wrong domain binding, and a client without `operations`. Then run a separate cold-discovery test with an actual consumer agent. If the reference client succeeds and Muse does not discover it, the protocol adapter works but consumer distribution is unproved. Do not describe partner logos as passing that test.

## 5. Other protocols and distribution features: what they actually add

| Surface | Verified fact | Implication for OfferAd |
|---|---|---|
| UCP `ask` draft | **[primary_source_read]** It answers questions and expressly forbids changing commerce-resource state, including applying discounts. S24. | **[inferred]** It may describe a public offer or terms, but cannot replace issuance/redemption. No Shopify app-defined `ask` provider hook was found. |
| UCP custom extension/Actions | **[primary_source_read]** Vendor namespaces and negotiated extensions are supported. S23. | **[inferred]** Appropriate for standardizing the quote object later; both parties and Shopify's merchant implementation must cooperate. |
| A2A 1.0 | **[primary_source_read]** Current specification supports agent messaging and structured data parts; 1.0 changed the old `kind` representation. S30. | **[inferred]** A seller A2A endpoint can carry the same quote contract and return Shopify redemption. It does not create Shopify hooks or automatic buyer-agent discovery; don't mix old `message/send` examples and 1.0 payloads without checking the chosen binding. |
| AP2 | **[primary_source_read]** UCP's AP2 documentation describes signed checkout commitments and payment authorization bound to checkout state. S31. | **[inferred]** Valuable for proving approval of final terms. It is not a seller-negotiation API or competitor-price verifier; renegotiation needs a new authorized final state. |
| ACP/OpenAI promotion feed | **[primary_source_read]** Current OpenAI commerce docs expose GET/PATCH `/product_feeds/{id}/promotions`, with promotion IDs, active periods, targets, and amount/percentage/free-shipping benefits. S32. | **[inferred]** A feed can distribute a menu of offers. No buyer-priority/competitor-URL callback was established. A promotion record alone does not create the matching Shopify discount or authorize replacing Shopify's checkout handler. |
| Stripe Agentic Commerce Suite | **[primary_source_read]** Current docs describe a promotion feed, a product-price/availability hook, an order-approval hook, and agent participation controls; the agent integration is private preview. S33–S34. | **[inferred]** There is real seller-side extension machinery here. But it targets Stripe's agentic checkout. A connected Stripe payment account, or an agent label, is not evidence that an installed Shopify app receives shopping intent or can override Shopify checkout. |
| Google Direct Offers | **[primary_source_read]** Google describes promotion bundling, advertiser-supplied product eligibility/guardrails, and native UCP checkout integration. S36–S37. | **[inferred]** Very close to OfferAd's “concession at decision time” concept and a potential later distribution channel. The public pages do not document a webhook delivering an individual buyer's competitor URL to an arbitrary Shopify app. Campaign participation/availability must be verified separately. |
| Shopify promoted placements | **[primary_source_read]** Shopify documents an invite-led Developer Preview with Global Catalog affiliate placement/commission metadata. S38. | **[inferred]** This pays an approved referring platform; it is not a buyer concession or a merchant counteroffer channel. Do not confuse `placement.commission` with a discount. |
| ECP / Checkout Kit | **[primary_source_read]** They embed Shopify checkout and exchange checkout/UI events and delegated address/payment actions. S39. | **[inferred]** Useful completion UX after negotiating; not an arbitrary seller-offer inbox. |
| PACT vs Poppy | **[primary_source_read]** The saved PACT README describes Personal Agent Consent & Trust, built on A2A 1.0/OAuth; Poppy is the separate Personal Agent Protocol site. S40, S15. | **[inferred]** Both may help identity/agent conversation, but their formats, discovery, and adoption must not be conflated. Nor should either be confused with unrelated similarly named bot-attestation proposals. |

**[primary_source_read] Stripe hook detail:** the price/availability hook has a four-second response expectation and a documented fallback to feed data on timeout; the approval hook instead declines on timeout. **[inferred]** This makes slow public competitor scraping inside final checkout a poor design even on Stripe's own path. Verify evidence ahead of checkout and use a bounded, fast decision. S33.

**[inferred] Last-90-days assessment:** the most consequential recent evidence is Poppy's October 12 draft, OpenAI's current Dots/plugin and Site tools documentation, Chrome's October 7 WebMCP update, and Shopify's 2026-08-25 UCP version / 2026-10 Admin schemas. Direct Offers' major public expansion announcement is May 20, outside that window; I have not relabeled it an October launch. Several live documentation pages have no reliable original feature-release date, so availability observed on October 13 must not be presented as a newly announced feature. Search results or later edits are not deployment evidence.

## 6. Build decision and what would change it

**[inferred] Build M1 first, with M2's plain HTML form as the fallback entry point.** Start on one owned development store, one known buyer runtime already connected to OfferAd, a small comparator allowlist, and three merchant-approved choices: a bounded price concession, bounded free shipping, and a qualifying gift/bundle. Show base price and each concession separately. Price and shipping need native codes first; add a Function only for the particular conditional benefit that needs one. Support manual Shopify checkout completion until agent-side payment authority is genuinely established.

**[inferred] Initial acceptance criteria:**

1. A buyer agent conveys a real user priority and competitor URL to OfferAd through an authorized interface.
2. OfferAd independently verifies the URL and records uncertainty, without competitor cart creation.
3. Identical merchant policy/facts produce a bounded reproducible menu; prompt attacks cannot change limits.
4. The accepted option creates a real Shopify benefit and matches the buyer-visible checkout/order state.
5. Replays, concurrent use, quantity/product substitutions, returns, and outstanding-liability accounting remain within policy.
6. A cold-agent discovery experiment is measured separately from successful redemption. Report exact runtime/version and number of successful runs; do not generalize one configured demo to all buyer agents.

**[inferred] What changes the order:**

- **M2 first** if the actual target agents reliably enumerate and use added storefront tools with no buyer connector installation, and merchants complete embed activation. An OpenAI desktop Site tools success alone would not establish Muse/Dots/Grok coverage.
- **M3 first** if buyer runtimes cannot call Shopify MCP but can accept an authorized tool's Shopify checkout URL, or if offer-linked cart metadata/gift insertion is essential from the start.
- **M4 first** if exact basket pricing, extra-discount exclusion, bulk quantities, or shipping contracts cannot be safely expressed with the code plan; or if merchant promotion conflicts make the floor guarantee untenable.
- **M5 earlier** if a real target personal agent demonstrably follows Poppy discovery and conversations for a merchant outside a bespoke partnership, and merchant-domain installation is solved.
- **Native UCP extension route first** only after Shopify documents an app hook for merchant profile/tool registration and supported agents negotiate it. Similarly, a documented mapping from `context.intent`/`eligibility` into installed-app code would materially improve D.
- **Google/Stripe distribution earlier** if actual merchant onboarding and a buyer-signal callback can be verified while preserving Shopify checkout. The currently read promotion-feed pages do not prove that combination.

**[inferred] The honest product claim:** “Merchants can make verified, bounded offers to supported buyer agents, and the accepted benefit applies in Shopify checkout.” Avoid “install once and every AI shopping agent will automatically negotiate.”

## 7. Named people associated with the missing pieces

**[inferred] Reading rule:** the role evidence below is verified at the cited source's date, not an assertion that a particular person personally approves OfferAd. “Relevant missing piece” is my inference. A public spokesperson, author, or council member is distinguished from a verified operational owner. No one was contacted.

| Organization | Person and evidenced role | Relevant missing piece | Evidence, exact support, and confidence |
|---|---|---|---|
| Shopify | **Mani Fazeli — VP Product**, named in the October 6 Poppy announcement | Shopify participation in personal-agent interaction and potential app-facing integration | **[primary_source_read]** Exact role line: “Mani Fazeli, VP Product, Shopify”. https://sierra.ai/blog/introducing-personal-agent-protocol |
| Shopify / UCP | **Ilya Grigorik — Shopify Distinguished Engineer; UCP Governance Council** | Merchant profile extensibility, protocol direction, Shopify implementation boundaries | **[primary_source_read]** “Ilya Grigorik is a Distinguished Engineer at Shopify.” https://shopify.engineering/ucp ; council roster: https://github.com/Universal-Commerce-Protocol/.github/blob/main/MAINTAINERS.md |
| UCP / Google | **Amit Handa — Google, UCP Governance Council and Shopping Tech Council** | Protocol extension and interoperability process | **[primary_source_read]** Roster row “Amit Handa | Google”; governance description: “The Governance Council is responsible for the overall adoption and health of the protocol.” https://github.com/Universal-Commerce-Protocol/.github/blob/main/MAINTAINERS.md |
| UCP / Shopify | **Daniel Wyckoff, Lee Richmond, Victoria Duggan — Shopify Shopping Tech Council members** | Shopping extension and implementation review | **[primary_source_read]** Named company/member rows in the current maintainer roster. Same MAINTAINERS URL. **[inferred]** Membership does not prove ownership of an app-registration API. |
| Google | **Ashish Gupta — VP/GM, Merchant Shopping** | Google UCP onboarding and consumer-shopping adoption | **[primary_source_read]** Exact byline role: “VP/GM, Merchant Shopping”. https://blog.google/products-and-platforms/products/shopping/ucp-updates/ |
| Google | **Vidhya Srinivasan — VP/GM Ads and Commerce** | Direct Offers distribution, offer types, advertiser controls | **[primary_source_read]** Exact byline: “Vidhya Srinivasan VP/GM Ads and Commerce”. https://blog.google/products/ads-commerce/agentic-commerce-ai-tools-protocol-retailers-platforms/ |
| Google / Chrome | **Alexandra Klepper, François Beaufort, Kasper Kulikowski — named WebMCP documentation authors** | Browser registration, discovery, interoperability and rollout | **[primary_source_read]** Author lines on the page updated October 7. https://developer.chrome.com/docs/ai/webmcp . **[inferred]** Technical source leads, not asserted sole product owners. |
| Meta | **Nat Friedman — head of product, Meta Superintelligence Labs** | Muse product/connectors and adoption of external seller conversations | **[secondary_source]** Role reported September 22; exact supporting fragment: “head of product at Meta’s Superintelligence Labs (MSL)”. https://techcrunch.com/2026/09/22/meta-admits-muses-likeness-to-openclaw-isnt-a-coincidence/ . **[inferred]** Direct Muse connector-review ownership was not verified. |
| Meta / UCP | **James Andersen — Meta, Shopping Tech Council member** | Meta's UCP interoperability participation | **[primary_source_read]** Roster row “James Andersen | Meta”. https://github.com/Universal-Commerce-Protocol/.github/blob/main/MAINTAINERS.md |
| OpenAI | **Greg Brockman — President and co-founder** | Executive accountability for product/platform adoption; not a proven connector-review owner | **[primary_source_read]** “our President and co-founder, Greg Brockman” in OpenAI's June 1 statement. https://openai.com/index/our-views-on-ai-policy-and-political-advocacy/ . **[inferred]** No public source read identified the exact Dots seller-tool admission owner. |
| OpenAI | **Holly Li — OpenAI Dots demonstrator at DevDay** | Product lead to investigate further, not an established API controller | **[secondary_source]** September 29 report says “OpenAI's Holly Li tried to speak to her dot”. https://www.axios.com/2026/09/29/openai-dots-ai-assistant-devday . Her formal role/approval authority was not established. |
| xAI / SpaceXAI | **Roman Ugarte — helped incubate and build Grok Bot; previously led Growth at Cursor** | Grok Bot product/connectors, tool-discovery behavior | **[primary_source_read]** Firsthand interview landing page: “Roman Ugarte helped incubate and build Grok Bot, the popular new knowledge-work agent from SpaceXAI.” https://www.lennysnewsletter.com/p/how-we-built-grok-bot-in-a-month . **[inferred]** Exact current connector-review title was not established. |
| Stripe | **Kevin Miller — Head of Payments** | Agentic seller hooks and personal-agent protocol participation | **[primary_source_read]** October 6 role line: “Kevin Miller, Head of Payments, Stripe”. https://sierra.ai/blog/introducing-personal-agent-protocol |
| Stripe / UCP | **Prasad Wangikar — Stripe, Shopping Tech Council member** | Cross-protocol commerce extension work | **[primary_source_read]** Roster row “Prasad Wangikar | Stripe”. https://github.com/Universal-Commerce-Protocol/.github/blob/main/MAINTAINERS.md |
| Sierra / Poppy | **Bret Taylor and Clay Bavor — authors of the protocol announcement** | Poppy draft evolution and implementation questions | **[primary_source_read]** October 6 announcement bylines name both. https://sierra.ai/blog/introducing-personal-agent-protocol . **[inferred]** Include Sierra even though the requested organization list did not name it: it co-develops the relevant protocol. |

**[secondary_source] Role-staleness check:** the September 2025 Stripe/OpenAI launch called Fidji Simo CEO of Applications, but July 2026 reporting says she stepped down. Do not use that old launch title as a current October controller map. Supporting current report: https://www.axios.com/2026/07/10/openai-fidji-simo-steps-down-health-issues . **[inferred]** It is more useful to state that the precise OpenAI Dots connector owner is unverified than to fill the gap with an outdated executive title.

## 8. Primary evidence ledger: exact quotations and URLs

Each quotation below is short; repeated uses of an evidence ID above refer back to this quotation. API examples and proposed architecture in earlier sections are not claims of successful execution.

### Shopify commerce and discovery

- **S1 — [primary_source_read] Native amount-off code.** “Amount off discounts can be a percentage off or a fixed amount off.” `write_discounts` and `discountCodeBasicCreate` are documented here: https://shopify.dev/docs/api/admin-graphql/latest/mutations/discountCodeBasicCreate . Saved counterpart: `r1-m-discountCodeBasicCreate.md`.
- **S2 — [primary_source_read] Native limits and customer context.** “The maximum number of times the discount can be redeemed.” Input includes validity dates, combination settings, and buyer context: https://shopify.dev/docs/api/admin-graphql/latest/input-objects/DiscountCodeBasicInput . The current app-discount input uses `functionHandle` and `context`, with old `functionId` and `customerSelection` deprecated: https://shopify.dev/docs/api/admin-graphql/latest/input-objects/DiscountCodeAppInput . Exact support from the latter: “The context defining which buyers can use the discount.”
- **S3 — [primary_source_read] Shipping bound.** “The maximum shipping price, in the shop's currency, that qualifies for free shipping.” https://shopify.dev/docs/api/admin-graphql/latest/input-objects/DiscountCodeFreeShippingInput ; mutation: https://shopify.dev/docs/api/admin-graphql/latest/mutations/discountCodeFreeShippingCreate . Saved inputs/mutation were read.
- **S4 — [primary_source_read] Function limits and inputs.** The documented limit is a “maximum of 25 discount functions”; access restriction: “The fetch target is limited to custom apps installed on Shopify Plus and Enterprise stores.” https://shopify.dev/docs/api/functions/latest/discount . The current page and supplied `fn-discount-input.md` document cart/line attributes, buyer identity, entered codes, configuration metafields, the product/order/shipping targets, and restricted external-code association. No `context.intent`/`context.eligibility` input was found in that schema.
- **S5 — [primary_source_read] Network alternative and limitations.** “Use the GraphQL Admin or Storefront APIs to write metafields on the store before a buyer reaches checkout.” https://shopify.dev/docs/apps/build/functions/network-access . External-code tutorial: https://shopify.dev/docs/apps/build/discounts/network-access . Exact short tutorial support: “validates discount codes against an external system”. These pages distinguish fetch execution from local run execution and state plan/enablement restrictions.
- **S6 — [primary_source_read] Bulk redeem codes.** “The list of codes to associate with the code discount. Maximum: 250 codes.” https://shopify.dev/docs/api/admin-graphql/latest/mutations/discountRedeemCodeBulkAdd . The mutation returns a bulk-creation object; reconcile completion/errors before handing a code to a buyer. Individual-code input support: “The code that a customer can use at checkout to receive the associated discount.” https://shopify.dev/docs/api/admin-graphql/latest/input-objects/DiscountRedeemCodeInput .
- **S7 — [primary_source_read; official support statement, not normative schema] Per-code limit.** “The limit is tracked per redeem code, not across the parent discount.” Shopify staff response and February 2026 reaffirmation: https://community.shopify.dev/t/scope-of-usagelimit-for-discounts-with-multiple-codes-via-discountredeemcodebulkadd/12269 . Treat this as strong test guidance, not a substitute for the proposed race tests.
- **S8 — [primary_source_read] UCP discount channel.** “Rejected codes communicated via `messages[]` with detailed error codes”. https://ucp.dev/2026-08-25/specification/shopping/extensions/discount/ . The extension also defines applied automatic/code discounts, replacement code lists, cart continuity, and provisional eligibility pricing. Supplied `u-discount.md` was read.
- **S9 — [primary_source_read] Embed activation.** “By default, app embed blocks are deactivated after an app is installed.” https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration . This source also describes script assets and checkout-step restrictions. **Agent discovery:** “The `agents.md.liquid` template is located in the `templates` directory of the theme”. https://shopify.dev/docs/storefronts/themes/architecture/templates/agents-md-liquid . **llms fallback:** “`/llms.txt` is an agent-discovery file and an alternate URL for `/agents.md`, which is the canonical agent-discovery document.” https://shopify.dev/docs/storefronts/themes/architecture/templates/llms-txt-liquid .
- **S10 — [primary_source_read] App-proxy route constraint.** Allowed `prefix` is a “string matching `a`, `apps`, `community`, or `tools`”. https://shopify.dev/docs/apps/build/cli-for-apps/app-configuration#app_proxy . **[inferred]** This does not provide arbitrary root well-known hosting.
- **S11 — [primary_source_read] Native Shopify tools and checkout verification.** “A returned code doesn't mean it applied, so check `discounts.applied` and `messages` when present.” https://shopify.dev/docs/agents/carts-and-checkout/checkout-webmcp . **Server checkout:** “Every request must include a `meta` object in `arguments`.” https://shopify.dev/docs/agents/carts-and-checkout/checkout-mcp . **Cart:** “Cart tools accept unauthenticated requests”. https://shopify.dev/docs/agents/carts-and-checkout/cart-mcp . **Storefront scope:** “These tools serve agents that shoppers bring to your store in their browser.” https://shopify.dev/docs/api/web-mcp . Read the saved/live schema before constructing transport-specific payloads.

### Browser and personal-agent platforms

- **S12 — [primary_source_read] WebMCP registration.** “Use `registerTool` to add a single tool to the model context.” https://developer.chrome.com/docs/ai/webmcp/imperative-api . The example uses `document.modelContext.registerTool`; cross-origin exposure has separate permissions. The overview was updated October 7, 2026: https://developer.chrome.com/docs/ai/webmcp .
- **S13 — [primary_source_read] Dots permission boundary.** “Plugin permissions are shared across dots, ChatGPT, ChatGPT Work, and Codex.” https://help.openai.com/en/articles/20001529-dots-privacy-security-and-safety-faqs . This same source distinguishes user instructions from encountered content; content does not grant permission. For connection checks: “Available apps may differ.” https://help.openai.com/en/articles/20001530-getting-started-with-your-dot .
- **S14 — [primary_source_read] OpenAI Site tools.** “In the built-in browser in the ChatGPT desktop app, ChatGPT Work and Codex can discover and use these tools when they are available.” https://learn.chatgpt.com/docs/webmcp . Dots' separate runtime: “Your dot lives in the cloud and has its own computer and browser.” https://learn.chatgpt.com/docs/dots/computers-and-apps . Plugin packaging: “Combine your skills and MCP server into a plugin that people can install.” https://developers.openai.com/plugins .
- **S15 — [primary_source_read] Poppy v0.1 wire contract.** “This is draft version 0.1.” https://personalagentprotocol.org/docs/spec . Discovery, authentication, API token rules, message fields, and conversation requests were read from this specification, especially §§3, 4.1–4.3, 6, and 7.2–7.5. The page explicitly permits a company's controlled subdomain and leaves `message.data` keys to the application.
- **S16 — [primary_source_read] Availability rather than announcement-only.** “Anyone can implement it.” https://personalagentprotocol.org/docs/path-to-1 . The page displays Draft 0.1 / October 12 and lists design partners; it does not certify that every partner has deployed every protocol surface.
- **S17 — [primary_source_read] Exact-term approval extension.** “The User approves one revision of the terms, and the Company performs only what that revision describes.” https://personalagentprotocol.org/docs/extensions/operations . Optional extension support is declared by both parties; it provides an operation record and retry semantics.
- **S18 — [primary_source_read] Poppy gaps and license.** “Payments. How a personal agent makes payments in a way that fits the protocol, including how that works with existing payment protocols.” https://personalagentprotocol.org/docs/open-topics . License: “The Personal Agent Protocol specification and documentation, including their examples, are licensed under the Apache License 2.0.” https://personalagentprotocol.org/license .
- **S19 — [primary_source_read] Muse connector gate.** “Sending the user to finish the entire checkout does not meet the completion requirement.” https://muse.ai/platform/docs . The source also requires factual tool descriptions, truthful completion claims, and correctly classified state-changing actions. Saved counterpart `r5/muse-platform-docs.txt` was read.

### Alternate redemption and obligations

- **S20 — [primary_source_read] Draft creation.** “Send invoices to customers with a secure checkout link.” https://shopify.dev/docs/api/admin-graphql/latest/mutations/draftOrderCreate . The same page documents creation scope and optional inventory reservation. `invoiceUrl` description: “The link to the checkout, which is sent to the customer in the invoice email.” https://shopify.dev/docs/api/admin-graphql/latest/objects/DraftOrder . **[inferred]** Read this field and return it; sending the email is a separate operation.
- **S21 — [primary_source_read] Draft variant pricing.** “This price will be used in place of the product variant's catalog price in this draft order.” https://shopify.dev/docs/api/admin-graphql/latest/input-objects/DraftOrderLineItemInput . The same input documents the bundle-component exception and currency behavior.
- **S22 — [primary_source_read] Draft extra-discount control.** “Whether discount codes are allowed during checkout of this draft order.” https://shopify.dev/docs/api/admin-graphql/latest/input-objects/DraftOrderInput . This input also documents automatic-discount control, attributes, metadata, shipping, reservation, and the lack of subscription support.
- **S23 — [primary_source_read] UCP negotiated extensions.** “Extensions can add new fields and modify shared structures”. https://ucp.dev/2026-08-25/specification/overview/ . Read the namespace, schema-composition, and intersection-algorithm sections; defining a vendor namespace is not Shopify app registration.
- **S24 — [primary_source_read] Ask boundary and unresolved claims.** “`ask` answers; it does not act.” https://ucp.dev/draft/specification/common/ask/ . **Eligibility:** “Businesses MUST NOT complete a transaction with unresolved eligibility claims.” https://ucp.dev/2026-08-25/specification/shopping/checkout/ . These are protocol responsibilities, not evidence of an app callback.
- **S25 — [primary_source_read] Storefront cart bridge.** The `attributes` field is “An array of key-value pairs that contains additional information about the cart.” https://shopify.dev/docs/api/storefront/latest/input-objects/CartInput . This input also lists metafields, buyer identity, lines, and discount codes. `cartCreate` documentation: https://shopify.dev/docs/api/storefront/latest/mutations/cartCreate . **[inferred]** M3 uses these documented fields to carry a validated offer reference; the reference alone is not an entitlement.
- **S26 — [primary_source_read] Browser cart and permalink transport.** “You can also append multiple discounts in the cart permalink URL, separated by a comma `,`”. https://shopify.dev/docs/apps/build/checkout/create-cart-permalinks . The same page documents attributes and selling-plan/password limitations. Ajax support: “The Cart API is used to interact with a cart during a customer's session.” https://shopify.dev/docs/api/ajax/reference/cart .
- **S27 — [primary_source_read] Grok route.** “Bots can use many browser-based tools, including services without a connector.” https://docs.x.ai/grok-bot/overview . Custom MCP support is documented at https://docs.x.ai/grok/connectors/custom-mcp-tunneling ; exact support: “Grok's servers need to reach your MCP server over the public internet.” This does not establish that Grok Bot follows every custom UCP extension.
- **S28 — [primary_source_read] Future credit.** “Credits can optionally include an expiration date.” https://shopify.dev/docs/api/admin-graphql/latest/mutations/storeCreditAccountCredit . The mutation requires `write_store_credit_account_transactions` and supports customer/account IDs plus `creditInput.creditAmount`. **[inferred]** App-level idempotent entitlement accounting is required; do not assume retry-safe crediting merely because a webhook is retryable.
- **S29 — [primary_source_read] Draft shipping input.** `ShippingLineInput` exposes `title`, `shippingRateHandle`, and `priceWithCurrency`. The latter's exact description is “Price of the shipping rate with currency. If provided, `price` will be ignored.” https://shopify.dev/docs/api/admin-graphql/latest/input-objects/ShippingLineInput . This is price/service configuration, not proof a parcel ships faster.

### Other protocols, feeds, and distribution

- **S30 — [primary_source_read] A2A 1.0 distinction.** “Version 1.0 introduces a breaking change in how polymorphic objects are represented in the protocol.” https://a2a-protocol.org/latest/specification/ . Structured `data` parts and AgentCard/interface-version guidance were inspected. Do not copy pre-1.0 discriminators into a new implementation.
- **S31 — [primary_source_read] AP2 function.** “Dependencies: Checkout capability”. https://ucp.dev/documentation/ucp-and-ap2/ . The page describes the checkout signature and checkout/payment mandates. The official mandate models are also published at https://github.com/google-agentic-commerce/AP2/blob/main/code/sdk/python/ap2/models/mandate.py .
- **S32 — [primary_source_read] OpenAI promotion API.** “Retrieve and upsert promotions for a feed.” https://developers.openai.com/commerce/specs/api/promotions . The current documented benefits are amount-off, percent-off, and free-shipping; the endpoint is a feed update/read surface, not a documented offer conversation.
- **S33 — [primary_source_read] Stripe seller controls.** “Use the promotion feed to upload discount codes, percentage-off deals, fixed-amount discounts, and free shipping offers.” https://docs.stripe.com/agentic-commerce/sellers/manage . The same source describes the product-price/availability hook and order-approval hook, with different four-second timeout outcomes. I did not find a documented competitor-URL callback here.
- **S34 — [primary_source_read] Stripe agent access status.** “This feature is in private preview.” https://docs.stripe.com/agentic-commerce . This statement appears in the Agents section; do not indiscriminately apply it to every seller feature.
- **S35 — [primary_source_read] Discount payment hold.** “When a customer submits their order, the discount code is held against its usage limit until the payment completes or fails.” https://help.shopify.com/en/manual/discounts/discounts-faq .
- **S36 — [primary_source_read] Google expanded offer types.** “Brands can upload a variety of promotions in Google Ads, including discounts, giveaways and local coupons.” https://blog.google/products/ads-commerce/google-marketing-live-search-ads/ . Published May 20, 2026; it describes coming expansion and native UCP checkout integration, not arbitrary seller endpoint access.
- **S37 — [primary_source_read] Google current product description.** “We’ve added native checkout integration for UCP merchants.” https://business.google.com/us/accelerate/announcements/direct-offers/ . The page also describes offer guardrails and Gemini-constructed deals. Availability must be checked for the actual advertiser account; I did not create one or contact sales.
- **S38 — [primary_source_read] Shopify referral incentives.** “Promoted placements are invite-led during Developer Preview.” https://shopify.dev/docs/agents/catalog/promoted-placement . The documented `placement.type:"affiliate"` and commission metadata concern approved catalog partners.
- **S39 — [primary_source_read] Embedded checkout role.** “Load the checkout in a web view using the `continue_url` with ECP parameters.” https://shopify.dev/docs/agents/carts-and-checkout/ecp . The saved document describes host/checkout events and delegated UI actions; it does not expose arbitrary seller quote tools.
- **S40 — [primary_source_read; supplied saved source] PACT is separate.** “PACT builds on A2A 1.0 and OAuth to support these interactions.” https://openpactprotocol.org/ . Read from supplied `r5/pact-readme.md` and its linked normative material. No claim of a newly performed PACT deployment test.

## 9. Remaining unknowns, explicitly bounded

**[inferred]** The research found enough documented primitives to build and falsify the proposed routes. The unresolved work is empirical integration and distribution:

- Actual cold discovery and authorized invocation rates for each target agent/runtime, with and without a connector.
- Whether Shopify offers any unpublished/partner app registration hook for UCP merchant tools, context, messages, or custom extensions. None was established from the inspected public docs; this is not a claim that no internal hook exists.
- Exact UCP discount, cart conversion, and customer-identity behavior on the owned target store/version.
- Per-code usage behavior under concurrent payment, code-pool expiry/eligibility requirements, and interactions with other merchant discounts.
- Access to gated Function fetch and its invocation through UCP; a normal dev store cannot settle that question.
- Public Muse directory acceptance of OfferAd's exact workflow and checkout-completion scope.
- Poppy auto-discovery/adoption beyond design-partner listings, and a supportable Shopify merchant-domain installation procedure.
- Proof quality for JS-only, membership-only, regional, or checkout-only competitor offers; unsupported cases should produce an honest alternate offer rather than fabricated verification.
- Operational enforcement of returns/guarantee/credit promises after checkout. Those must be proven through order, fulfillment, and remediation tests before being advertised as automated concessions.

**[inferred] Final recommendation:** implement and test the narrow M1 contract now, expose the same service through M2's visible form, then add WebMCP as a progressive enhancement. Keep M3/M4 as explicit redemption adapters. Build a thin Poppy adapter only after the core checkout promise is proven. The workable gap is between an independently authorized seller conversation and ordinary Shopify redemption—not a hidden negotiation field inside today's Shopify UCP endpoint.
