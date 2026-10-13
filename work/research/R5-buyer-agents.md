# R5 — How today's buyer agents reach merchants, and where a seller-side offer endpoint could plug in

Research date: 13 Oct 2026. Author: R5 subagent. Raw downloads: `/Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/docs/r5/` (index in section 12).

Labels used on every claim:

- `[P]` = primary_source_read (the maker's own page or repo, read today, raw copy saved)
- `[S]` = secondary_source (press, third-party write-up, or a page read only through a summarizing fetcher)
- `[I]` = inferred (my reasoning from the sources; not stated by anyone)
- `[T]` = tested_live (a read-only GET I made today)

Quotes are verbatim. 230 quote fragments in this file were machine-checked against the saved raw files; where a link sat inside a sentence the only difference is whitespace.

---

## 1. Bottom line

1. `[P]` No buyer agent documents an "offer" or "counter-offer" message a merchant can send it today. What each one documents is some mix of: a product feed with static promotions, a discount-code field in checkout, connectors (remote MCP), and a browser that treats page text as untrusted data.
2. `[P]` The one rail that is documented to work in every channel a Shopify store is sold through is the Shopify discount (code or automatic) backed by Shopify Functions. Shopify states this separately for Meta (Muse), Google AI Mode and Gemini, and Microsoft Copilot direct checkout; ChatGPT sends the buyer to the merchant's own online-store checkout. So idea A (offer token = discount code) is the right settlement layer for all of them. It is not a communication layer.
3. `[P]` The communication layer is where the cracks are, and they differ by agent:
   - Grok, Claude, Perplexity, ChatGPT and Muse all let a user add a custom connector (remote MCP, or for Muse an API that Muse wraps itself). That works today and needs no approval, but the buyer has to install it.
   - Directory listing is restricted for exactly the thing OfferAd is: Anthropic excludes "advertisements, sponsored content, paid product placements" and anything that "executes financial transactions"; OpenAI excludes plugins that "exist primarily as an advertising vehicle" and "pass-through intermediary software layers"; Meta requires the connector to complete the task and to "Label advertising, sponsored results".
   - Browsing agents read storefront text, but every maker says page content is untrusted and screened. An offer has to be visible, factual commerce data, never an instruction.
4. `[P]` New since the brief was written: the Personal Agent Protocol draft 0.1 ("Poppy") was published on 9 Oct 2026 at https://personalagentprotocol.org. It gives a company a discovery file (`/.well-known/poppy.json`), verified agent identity, a stable pseudonymous user ID even for guests, an MCP/OpenAPI slot, a company-agent conversation channel with free-form structured `data`, and an Operations extension that is very close to an "offer with exact terms and an expiry". Personal-agent design partners: Instinct, Meta, OpenAI. Technology-provider partners include Shopify and Stripe. It is a draft, nobody documents production support, and I found no live `poppy.json` on 28 probed domains.
5. `[P]` ACP (OpenAI + Stripe + Meta) already ships an Intent Trace on cancel (reason codes such as `price_sensitivity`, `comparison`, plus free metadata like `competitor_price`) and its RFC says "A subsequent RFC MAY define Reconsideration Offers keyed to specific reason codes." That is the closest thing to OfferAd inside an existing standard, and nobody has written that RFC.
6. `[P]` Google already sells a version of this as an ad product: Direct Offers ("Sponsored deal" in AI Mode) and promotion bundling ("We use Gemini to construct a deal") inside advertiser "guardrails". That is both validation and competition.

---

## 2. Channels a seller-side offer engine can use today, ranked by realism

Scale: A = works today on documented behavior with no third-party approval. B = works today but needs a buyer or merchant action, or platform acceptance. C = published protocol, no documented production client. D = standards work. E = platform-owned, closed to us.

| # | Channel | Reaches | Grade | Honest limit |
|---|---|---|---|---|
| 1 | Shopify discount code or automatic discount enforced by a Discount Function (idea A as settlement) | Muse, Google AI Mode/Gemini, Copilot (Shopify-powered direct checkout); ChatGPT (merchant checkout in in-app browser); every browser agent | A | Honors an offer; does not communicate one. On Google, codes are "manually enter[ed]" by the user. How a code gets entered in Meta's direct checkout is undocumented. |
| 2 | Visible, labeled offer data on the merchant's own pages (theme app embed, PDP, cart), plus compare-at price and automatic-discount title | ChatGPT referrals, Muse browser, Dots browser, Comet, Grok Bot, Claude in Chrome (read only) | A | Treated as untrusted content by every agent; must be plain commerce facts in accessible text. Claude in Chrome will not buy. |
| 3 | Shopify `/agents.md` (also drives `/llms.txt`, `/llms-full.txt`) through the `agents.md.liquid` theme template | Any agent that reads Shopify's agent discovery file | A to B | Needs a theme template (merchant action). No maker documents that its consumer agent fetches `/agents.md`. |
| 4 | User-added custom connector pointing at the OfferAd MCP server | Grok / Grok Bot, Claude, Perplexity, ChatGPT / Dots, Muse (custom connector built from an API) | B | Buyer must install it. Claude: "Custom connectors are never suggested." |
| 5 | Static promotion feeds: Stripe ACS promotions feed, OpenAI commerce Promotions API, Google Merchant Center promotions and loyalty, Microsoft Merchant Center | Agents fed by those platforms | B | Static, not responsive to a priority or a competing offer. OpenAI feed is "approved partners" only and has no code field. |
| 6 | Paid placement: Google Direct Offers pilot and promotion bundling; OpenAI Ads product feeds | Google AI Mode; ChatGPT | B | Ad products, pilot or eligibility gated, the platform decides when to show. |
| 7 | Reviewed directory listing of a per-merchant or cross-store connector | Muse Connector Platform, ChatGPT plugin directory, Claude Connectors Directory, Perplexity marketplace | B to C | Policy text cuts against an ad or offer vehicle (section 6). Muse is the least hostile on paper but demands full task completion. |
| 8 | Personal Agent Protocol ("Poppy") company endpoint | Muse (demoed), Dots/ChatGPT and Instinct (design partners) | C | Draft 0.1; "a revision can break compatibility"; payments are an open topic; `/.well-known/poppy.json` on a Shopify domain is unverified. |
| 9 | PACT provider (Decagon + Instinct), A2A agent card | Instinct; others unknown | C | Text-only messages; its own authors joined the PAP working group. |
| 10 | ACP "Reconsideration Offers" SEP on top of Intent Traces; UCP extension or working group | ChatGPT Instant Checkout partners; UCP platforms | D | Needs a TSC sponsor (OpenAI, Stripe or Meta) or 3+ organizations for a UCP DWG; months. |
| 11 | Hosted brand agents: Google Business Agent, Meta Business Agent | Google and Meta surfaces | E | Platform runs the logic. |

Best channel per agent today `[I]`:

| Agent | 1st | 2nd | 3rd |
|---|---|---|---|
| Muse | Discount code or automatic discount in Shopify-powered Meta direct checkout | Storefront text read by Muse's VM browser (accessibility tree), cart permalink with code | User-created Custom Connector to an OfferAd API; later PAP |
| ChatGPT | Referral lands in the merchant's own checkout: storefront embed and `?discount=` links work | Personal plugin ("Created by me" / shared) with the OfferAd MCP | Promotions API and Ads feeds (approved partners) |
| Dots | Installed plugin (MCP) | Cloud browser on the storefront | PAP later (OpenAI is a design partner) |
| Grok Bot | Custom MCP connector by URL (the existing OfferAd demo) | Browser on the storefront; the user takes over for payment | — |
| Google AI Mode / Gemini | Merchant Center promotion (auto-applied) or automatic discount | Direct Offers pilot / promotion bundling | Code typed by the user in the checkout UI |
| Copilot | Discount code or automatic discount in Shopify-powered direct checkout | Microsoft Merchant Center feed | — |
| Perplexity / Comet | Storefront text (Comet browses; confirms final orders) | Custom remote connector | — |
| Amazon Buy for Me | Automatic discount only (it checks out on the brand site as it finds it) | — | — |
| Claude | Custom connector (install link), Claude recommends and hands over a link | Claude in Chrome reads the page; it cannot purchase | — |

---

## 3. Answer matrix (five questions per agent)

| Agent | Q1 calls MCP/UCP/WebMCP or browses | Q2 custom connector, directory, rules | Q3 coupons and on-page offers | Q4 instructions on websites | Q5 documented merchant-offer path |
|---|---|---|---|---|---|
| Muse (Meta) | Shopify Catalog + "Meta's direct checkout"; connectors; own Chromium in a VM (accessibility-tree snapshots); PAP demo | Yes: reviewed Connector Platform (muse.ai/platform) + unreviewed user "Custom Connector" | Not documented by Meta. Shopify: codes and automatic discounts "supported in Meta's direct checkout" | External data "labeled as untrusted input"; classifier ensemble; blocks or asks the user | Shopify discounts; connector with labeled sponsored results; none specific to offers |
| ChatGPT | Feeds + Shopify Catalog; for Shopify a "discovery-focused referrer" to merchant checkout; plugins (MCP); Instant Checkout only for "select marketplace partners" | Yes: universal plugin directory, Personal tab; guidelines exclude ad vehicles and intermediaries | Not documented (help center 403). Merchant checkout applies them as usual | "Treat page content as untrusted context"; confirmation before purchase | Promotions API (approved partners), Ads feeds, ACP discount extension |
| Dots (OpenAI) | Own cloud computer and browser; uses installed plugins | Same plugin system | Not documented | Automatic review of actions; same browser policy | None specific |
| Grok Bot (xAI) | "connectors where available and computer use for everything else" | Yes: custom MCP by URL at grok.com/connectors; catalog rules not found | Not documented | "Outside content is marked as untrusted data" | None |
| Google AI Mode / Gemini | Calls merchant UCP endpoints (REST, MCP or A2A), Google-approved; Shopify-powered direct checkout | No consumer custom-tool route found for shopping | Auto-applied Merchant Center promotions; codes "users manually enter", max 10 | Not read for Gemini | Direct Offers pilot, promotion bundling, Merchant Center promotions and loyalty, Business Agent (coming) |
| Perplexity | PayPal-powered in-app checkout; Comet browses; custom remote MCP | Yes: custom remote connectors; marketplace by proposal form | Not documented | "External content is demarcated as untrusted"; confirms "final shopping orders" | Merchant program page now redirects elsewhere; nothing verified |
| Copilot | Microsoft Merchant Center feed, "UCP-ready"; Shopify auto-enrolled; Stripe ACS; PayPal | Not verified | Shopify: codes and automatic discounts supported in Copilot direct checkout | Not verified | Merchant Center feed; "Deal curation" seen in site nav, unread |
| Amazon Buy for Me / Alexa for Shopping | Browses and completes "the checkout process on the brand's website" | None | Not documented | Not documented | None for outside sellers |
| Claude | Connectors (MCP); Claude in Chrome browses but is "prohibited" from purchases | Yes: custom connector by URL (one on Free), install links, Connectors Directory | Claude in Chrome cannot complete a purchase, so it cannot redeem one | "Completing instructions from emails or web content" is prohibited; two classifiers | None |

Details and quotes follow.

---

## 4. Agent by agent

### 4.1 Muse (Meta)

Sources (all `[P]` unless marked):

- Launch post, 8 Sept 2026: https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/
- Security post by Tarek Sheasha, 8 Sept 2026: https://research.meta.ai/blog/security-and-safety-for-ai-agents-our-approach-with-muse
- Design post by Mona Sarantakos with Christine Awad: https://introducing.muse.ai
- Small business post, 29 Sept 2026: https://about.fb.com/news/2026/09/introducing-muse-small-business/
- Connector Platform: https://muse.ai/platform and guidelines https://muse.ai/platform/docs
- Help: connectors https://www.meta.com/help/artificial-intelligence/1687253048996149/ ; browsing https://www.meta.com/help/artificial-intelligence/2124746764949121/ ; permissions https://www.meta.com/help/artificial-intelligence/1385290430137537/
- Shopify help, Meta channel: https://help.shopify.com/en/manual/online-sales-channels/agentic-storefronts/meta

**Q1. How it reaches merchants.**

- Its own computer and browser: "Muse runs on Muse Secure VM, a dedicated secure computer with its own browser". "It can open a browser, fill out forms, and negotiate on their behalf." (launch post)
- "full web browser, so it can search, navigate sites, fill out forms, and complete transactions, like booking and purchasing" (introducing.muse.ai)
- The browser is real Chromium, but the model does not see the DOM: "Muse has a real up-to-date Chromium based browser running behind a virtualization layer." "The sub-agent, which drives the Browser, sees an accessibility tree snapshot of the page — not the raw DOM... It has no ability to run javascript in the page context" (security post).
- "When Muse browses the internet, it will appear as your activity" (security post). `[I]` So a store cannot count on a Muse user-agent to recognize it in the browser route.
- Shopify route: "Products are made available on Meta through Shopify Catalog." Checkout is "Meta's direct checkout" (Shopify-powered). "If a customer's checkout requires information that can't be collected on the Meta surface, then the customer is redirected to your online store checkout in a Meta in-app browser..., with their cart preserved." (Shopify help). Shopify changelog entry "Meta is now an AI channel in your admin", 8 Sept 2026: https://changelog.shopify.com/posts/meta-is-now-an-ai-channel-in-your-admin
- Connectors: "For each connector, we worked closely with the service provider to integrate their API, and we've written and iterated on SKILLs ... Muse can also write its own custom connectors for other services you care about if they have their own APIs or CLIs." (security post)
- PAP: "At Sierra Summit on Tuesday, Alex McGillis, VP of Product at Rocket, showed the protocol live featuring Meta's personal agent, Muse... Muse went to Rocket's website, found Rocket's agent through Poppy, and asked Alex for permission to connect." (https://sierra.ai/blog/poppy) `[I]` That is a stage demo, not documented product behavior.
- `[I]` Whether Muse itself calls a store's `/api/ucp/mcp`, or Meta's backend does through Shopify Catalog and direct checkout, is not stated anywhere I read. Whether Muse's browser exposes WebMCP tools is not stated either; given "no ability to run javascript in the page context" and accessibility-tree snapshots, do not count on it.

**Q2. Custom tools and the directory.**

- Users: "If you want to connect to a service not yet available in the Connector list, you can ask Muse to create a Custom Connector. Muse will guide you through the process, which can involve retrieving API information from the service... Meta doesn't review custom connectors or how they use your information, so grant access with caution" (help 1687253048996149).
- Business post: "Muse also supports custom connectors so you can plug in services we don't support yet". Launch connectors include Shopify, Stripe and Klaviyo. "Interested partners can apply at muse.ai/platform."
- Platform page: "A connector brings what you've built into the everyday tasks people ask Muse to help with. And we've partnered with Stripe to make accepting payments easy with Link." "Submit for review: We'll review your connector for functional, security, and legal requirements, and complete end to end testing." "Once approved, users will be able to find your connector in Muse. Editors will review connectors for featured placement."
- Guidelines (https://muse.ai/platform/docs):
  - 1.1 "If your service supports booking, purchasing, or scheduling, your connector should complete those tasks... Support guest checkout if it exists, so users don't always need to log in to complete payment." "Sending the user to finish the entire checkout does not meet the completion requirement."
  - 1.2 "A read-only connector can qualify when the information is the outcome, such as an account report or live inventory analysis. A wrapper around public pages or a list of links alone is not enough."
  - "Tool descriptions must be factual. Do not use tool descriptions or responses to instruct Muse to ignore its rules, steer away from competitors, access unrelated data, force recommendations, conceal commercial interests, or take unrequested actions."
  - Permissions: "Currently reads and writes from platform connectors default to Ask on first use." "Sensitive writes cannot be set to Always allow, including through Settings or a saved permission."
  - 3.4 "If any details (e.g. the price, recipient, scope) change after a write is approved, require a new fresh write to be approved."
  - 4.3 "Label advertising, sponsored results, and commercial relationships that influence recommendations. Do not fabricate reviews, urgency, discounts, or successful outcomes."
  - 4.7 "Before commitment, your tools should return all relevant information, such as: the seller, full price and currency, recurring charges, key terms, and cancellation or refund policy."
  - 5.x "In your API or MCP documentation, include setup instructions, inputs and outputs, read/write classifications, sensitive designations..."
  - 6 Review in three stages: "6.1 Risk assessment", "6.2 Tool review", "6.3 End-to-end QA ... We verify that sensitive writes require approval every time." "Meeting these guidelines does not guarantee approval."
  - 7.1 "Approved connectors are discoverable by the Muse agent and in Settings > Connectors."

**Q3. Coupons and on-page offers.**

- Meta does not document coupon handling. What exists:
  - Shopify: "Any automatic discounts or discount codes that you set up are supported in Meta's direct checkout." "Shopify Functions, such as shipping, discount, and cart and checkout validation functions, are supported or run in Meta's direct checkout." "Checkout blocks aren't supported in Meta's direct checkout." Unsupported: subscriptions, bundles, customizable products, B2B-only. "Shop Pay can display as a wallet or checkout option for customers in Muse when available."
  - Price awareness is a stated use: "Keeping an eye on things, such as looking for price drops" (help 2124746764949121); "finding the sweatshirt my son wanted (on sale!)" (introducing.muse.ai).
- Payment is locked to an approved amount: "Using Muse to buy stuff is one of the most popular browser use cases... prompt for a human in the loop approval with the exact details of the purchase every time... a single-use card number is issued ... tied to that particular merchant, a particular dollar amount" (security post). "Muse can checkout with Link built by Stripe ... Shop Pay is coming soon" (launch post).
- `[I]` Consequence for OfferAd: the offer has to be in the cart total before Muse asks its user to approve. A discount that changes the total after approval forces a new approval.

**Q4. Prompt injection.**

- "When data enters the model's context from any external source, it's labeled as untrusted input."
- "An ensemble of multiple prompt injection detection classifiers ... run on all external data entering model context via files and tool calls."
- Browser classifiers look for "Presence of attempted prompt injection within the DOM of the web page" and "Attempted submission of high risk forms"; "they either block the action or prompt the user to review".
- Sentinel is "the sole permission authority for connector actions and network egress".
- Bug bounty "up to $130,000 for successful prompt injection attempts".
- Help: "Muse is designed to ask you to confirm before it takes certain important actions in the browser, such as making a purchase." Web access can ask "when your information may be shared or it visits a website that is unfamiliar."
- System prompt first line, as published: "Your purpose is to make your user's life better."

**Q5. Documented merchant-offer path.** None named as such. Available: Shopify discounts in Meta direct checkout; a reviewed connector that labels commercial relationships; Meta Business Agent on the business side (https://about.fb.com/news/2026/06/meta-business-agent/: "Make product recommendations from a business catalog", "Close sales"; the platform "lets businesses connect to a growing suite of hundreds of systems like Shopify, Zendesk, and Shopee"); PAP in draft.

Other facts: "Muse doesn't share a person's conversations or the data in their VM with Meta's ad systems." (launch post). US rollout on iOS, Android and muse.ai, chat in the app or WhatsApp. Shopify's Meta channel is for the US, Canada and Mexico. CJ Desai runs the "Chief Enterprise Platform Officer" org covering "Muse agent, Meta Business Agent, Muse API, Muse Code" (https://about.fb.com/news/2026/09/launching-meta-enterprise-platform/). `[S]` Amazon cut Muse off from Amazon.com on 20 Sept saying it did not identify itself (implicator.ai, yellow.com).

### 4.2 OpenAI: ChatGPT, Dots, plugins, Instant Checkout, Ads

Sources `[P]`: https://developers.openai.com/commerce/llms-full.txt ; https://developers.openai.com/commerce/specs/api/promotions.md ; https://developers.openai.com/plugins/plugin-guidelines ; https://developers.openai.com/plugins/guides/product-checkout-conversion-spec ; https://developers.openai.com/ads/llms.txt ; https://learn.chatgpt.com/docs/dots.md ; https://learn.chatgpt.com/docs/dots/controls.md ; https://learn.chatgpt.com/docs/browser.md ; https://learn.chatgpt.com/docs/plugins.md ; https://learn.chatgpt.com/docs/whats-new/devday-2026.md ; Shopify help https://help.shopify.com/en/manual/online-sales-channels/agentic-storefronts/chatgpt

Naming: what the brief calls "ChatGPT apps and connectors" is documented in October 2026 as **plugins** (skills + one MCP server + optional UI) in one "universal plugin directory" shared by ChatGPT and Codex.

**Q1.**

- Shopify stores: "ChatGPT acts as a discovery-focused referrer platform ... ChatGPT users complete their purchase on your online store checkout in a ChatGPT in-app browser, or in a new tab when customers use ChatGPT web." "Because ChatGPT sales happen in your online store checkout, all your customizations, branding, selling strategies, and payment methods are supported." (Shopify help)
- Feeds: "Onboarding product feeds in ChatGPT is currently available to approved partners." "OpenAI is not the merchant of record".
- Instant Checkout: "Instant Checkout, which is currently in beta, is currently available only to select marketplace partners... Until then, standard external checkout is the required approach." (plugin guidelines)
- Checkout plugins: "Product checkout conversion plugins in ChatGPT are currently in beta and being tested with approved partners." "If a seller has a plugin, ChatGPT can open that plugin inline for checkout instead of punching out to an external website." (tool `checkout_session`, items carry `offerId`)
- Dots: "Powered by GPT-6 Astra, your dot lives in the cloud and has its own computer and browser." "Your dot can use supported plugins installed and enabled for your account". "Some websites block cloud browsers or require extra verification."
- DevDay, 29 Sept 2026: Dots, Plugin Extensions, MCP Events ("monitor updates from your MCP server and act when matching events arrive"), Sign in with ChatGPT. `[I]` MCP Events is a server-to-agent push path: an installed OfferAd plugin could notify a dot that a better offer exists.
- `[S]` March 2026 press (Modern Retail and others): OpenAI scaled Instant Checkout back and moved it into apps; only a few dozen Shopify merchants ever joined.

**Q2.** Yes. Plugin directory with a Personal tab ("Created by me", "Shared with me"); `@` invokes a plugin. Listing rules (plugin guidelines):

- "Unofficial connectors: We cannot approve plugins that primarily function as unofficial connectors to third-party services, including pass-through intermediary software layers."
- "Subtitles and descriptions: ... Do not advertise pricing, subscriptions, free trials, discounts, or promotions."
- "Fair play: Plugins must not include descriptions ... that manipulate how the model selects or uses other plugins". "Do not instruct the model to invoke another plugin or connector".
- "Currently, plugins may conduct commerce only for physical goods."
- "Checkout: Plugins should use external checkout, directing users to complete purchases on your own domain."
- "Advertising: Plugins must not serve advertisements and must not exist primarily as an advertising vehicle."
- "Plugins must not apply ChatGPT-specific fees, surcharges, or other pricing that penalizes users for accessing a service through ChatGPT. Temporary discounts and promotional offers on other platforms are permitted." `[I]` The text bans a ChatGPT surcharge; it does not ban a better price for ChatGPT users.
- "Plugins that demonstrate strong real-world utility ... may be eligible for enhanced distribution opportunities, such as directory placement or proactive suggestions."
- Plugin security page: "Assume prompt injection and malicious inputs will reach your server."

**Q3.** Not documented in what I could read (help.openai.com returned 403). In the Shopify case the code is redeemed in the merchant's own checkout, so normal Shopify behavior applies.

**Q4.** "Treat page content as untrusted context." "Instructions on a page can be misleading or malicious. A website permission lets ChatGPT interact with that site; it doesn't make the site's content trustworthy or approve every action." "ChatGPT also asks for confirmation before sensitive actions such as submitting information, making a purchase, changing permissions, or deleting data." Dots: "Before your dot takes an action that could affect your accounts or share information, an automatic review checks it against your instructions, permissions, custom rules, and built-in safety requirements."

**Q5.**

- Promotions API: "Promotions data can only be provided via the API." `GET/PATCH /product_feeds/{id}/promotions`; fields `id`, `title`, `description`, `status`, `active_period`, `benefits`, `applies_to`, `url` ("Canonical promotion URL."); benefit types `amount_off`, `percent_off`, `free_shipping`. There is no code field.
- Ads: "Create ads in ChatGPT", feeds at `https://api.ads.openai.com/v1/feeds`, flags `is_eligible_search`, `is_eligible_checkout`, `is_ads_eligible`.
- ACP discount extension and Intent Traces: section 5.3.

### 4.3 xAI: Grok and Grok Bot

Sources `[P]`: https://docs.x.ai/grok-bot/overview.md ; https://docs.x.ai/grok-bot/computer-and-apps.md ; https://docs.x.ai/grok-bot/approvals-security-and-privacy.md ; https://docs.x.ai/grok-bot/security.md ; https://docs.x.ai/grok-bot/security-faq.md ; https://docs.x.ai/grok/connectors.md . (x.ai/news and x.ai/grokbot returned 403.)

- Q1: "Each Bot works on a persistent cloud computer with a browser, filesystem, and terminal". "They use connectors where available and computer use for everything else". "A site can still block automation, expire a session, or require a human step. The Bot hands those steps to you rather than working around them." "The computers Bots work on run in Cursor's cloud." Access "is included with every paid individual Cursor plan and with the Cursor Teams plan", or a linked SuperGrok subscription. "Some services flag datacenter IP addresses."
- Q2: "Connectors are installed as plugins from Connect apps." "Prefer a connector when one is available: it is often more reliable than clicking through a website." For Grok: "Connectors are available to all Grok users". "Custom MCP connectors... Go to grok.com/connectors. Click New Connector, then select Custom. Enter the MCP server URL and complete any required authentication." "Your MCP server must be reachable over the public internet." CLI: `grok mcp add --transport http <name> <url>`. Listing rules for the catalog: not found.
- Q3: Not documented. No shopping features are documented; use cases are work tasks.
- Q4: "Content a Bot reads from the outside world, like web pages, plugin results, and command output, can try to steer it... Outside content is marked as untrusted data when presented to the model. These controls reduce, but do not eliminate, risk from malicious content".
- Payments: approval boundaries include "Purchases and financial transfers". "For passwords, passkeys, two-factor codes, CAPTCHAs, and payment confirmations, the Bot should hand you control of the computer." The Bot can show a form in chat for "a checkout address" and fill it into the page.
- Q5: none. `[I]` The existing OfferAd MCP connector is the documented way in, and xAI is the only one of the three "acting" agents with no directory policy text against it.

### 4.4 Google: AI Mode, Gemini, UCP, Direct Offers, Business Agent

Sources `[P]`: https://blog.google/products/ads-commerce/agentic-commerce-ai-tools-protocol-retailers-platforms/ (11 Jan 2026, Vidhya Srinivasan) ; https://blog.google/products/ads-commerce/google-marketing-live-search-ads/ (20 May 2026) ; https://blog.google/products-and-platforms/products/shopping/google-shopping-updates-holiday-shopping/ (16 Sept 2026, Ashish Gupta) ; https://blog.google/products-and-platforms/products/shopping/agentic-checkout-holiday-ai-shopping/ (13 Nov 2025) ; https://developers.google.com/merchant/ucp/guides/overview ; https://developers.google.com/merchant/ucp/guides/overview/promo-codes ; https://developers.google.com/merchant/ucp/faq ; Shopify help https://help.shopify.com/en/manual/online-sales-channels/agentic-storefronts/google

- Q1: Google calls merchant UCP endpoints. "We've added native checkout integration for Universal Commerce Protocol (UCP) merchants." "UCP already enables direct checkout for hundreds of thousands of brands and retailers across Google." Transports "APIs, MCP, or A2A". UCP traffic is recognizable: "a header with the label UCP-Agent:Profile is present, and the User-Agent value begins with Google/UCP". Gate: "Your integration must be approved by Google before you can go live" and "not all features defined in the spec are available on Google's surfaces". The Merchant Center UCP hub also offers "cart transfer to a merchant site".
- Q3: "Google provides promotional data from two primary sources: Auto-applied promotions: Offers ingested directly from your Google Merchant Center feeds. Google automatically applies these offers to the cart. User-applied promotions: Promotional codes that users manually enter during checkout, such as public discount codes or personalized email offers. The checkout UI supports a maximum of 10 applied promo codes per session." "To receive discount codes, you must advertise discount support in your UCP profile." Shopify: "Any automatic discounts or discount codes that you set up are supported in Google AI Mode and Gemini's direct checkout." Checkout blocks load only if they "support blocking checkout, and have checkout blocking enabled"; not loaded: blocks "offering add-ons or upsells", "Loyalty or rewards experiences", "Chat or messaging experiences", "Informational-only blocks".
- Q5, Direct Offers: "This new Google Ads pilot allows advertisers to present exclusive offers for shoppers who are ready to buy — like a special 20% off discount — directly in AI Mode." "With Direct Offers, retailers set up relevant offers they want to feature in their campaign settings and Google will use AI to determine when an offer is relevant to display. We are initially focusing on discounts for the pilot and will expand to support the creation of offers with other attributes that help shoppers prioritize value over price alone, such as bundles and free shipping. We're already collaborating with brands like Petco, e.l.f. Cosmetics, Samsonite, Rugs USA and Shopify merchants". The unit is labeled "Sponsored deal".
- Q5, promotion bundling: "Brands can upload a variety of promotions in Google Ads, including discounts, giveaways and local coupons. They'll soon be able to supply their eligible products and guardrails ... We use Gemini to construct a deal — like a highly relevant product bundle — to present the most compelling offer for that specific search."
- Q5, loyalty: "Connecting your loyalty data in Merchant Center highlights member perks and pricing across Google ... showcase perks like free shipping".
- Q5, Business Agent: "In the coming months, they'll be able to train the agent based on their data, ... provide offers for related products and enable direct purchases".
- "Let Google Call" asks stores about stock, price "and if there are any special promos".
- UCP was "co-developed with industry leaders including Shopify, Etsy, Wayfair, Target and Walmart".
- Q2 and Q4 for consumer Gemini: not found in what I read.

### 4.5 Perplexity (shopping, Comet)

Sources `[P]`: https://www.perplexity.ai/hub/blog/shopping-that-puts-you-first (25 Nov 2025) ; https://www.perplexity.ai/hub/blog/mitigating-prompt-injection-in-comet (22 Oct 2025) ; https://www.perplexity.ai/help-center/en/articles/13915507-adding-custom-remote-connectors ; https://www.perplexity.ai/help-center/en/articles/2026092501-submit-a-connector-proposal (25 Sept 2026)

- Q1: "We partnered with PayPal to power checkout all in the same user experience." "retailers stay at the center of the transaction as the merchant of record". Ranking is "not what advertisers want to sell first". Comet is a browser agent.
- Q2: Account settings → Connectors → "+ Custom connector" → Remote; MCP server URL, "HTTPS is required"; auth None, API key or OAuth. Marketplace: "complete the Connector Marketplace submission form"; "Submitting a proposal does not guarantee that Perplexity will build, approve, or make a connector available."
- Q4: "Clear content boundaries – External content is demarcated as untrusted in prompts". "Confirmation-required actions include: ... Placing final shopping orders". Classifiers target hidden HTML and CSS instructions and "Content Confusion Attacks ... injects tool names to trigger unintended actions". `[I]` An on-page offer block that names tools or hides text will be flagged.
- Q5: `[T]` https://www.perplexity.ai/merchants now redirects to `https://www.perplexity.ai/gen/computer/ecommerce/signin`, a "Perplexity Computer" page for store owners. No promotion mechanism verified.
- Q3: not documented.
- `[S]` Amazon sued Perplexity over Comet shopping in Nov 2025.

### 4.6 Microsoft Copilot Checkout

Source `[P]`: https://about.ads.microsoft.com/en/solutions/technology/agentic-commerce ; Shopify help https://help.shopify.com/en/manual/online-sales-channels/agentic-storefronts/microsoft

- "The first step is to improve product visibility in Microsoft Merchant Center (MMC) with a UCP-ready feed. MMC will support Universal Commerce Protocol (UCP)". "Shopify merchants have been automatically enrolled (with controls in Shopify admin)." Other on-ramps: Stripe ACS, PayPal Store Sync.
- "Copilot Checkout is available on Copilot.com and the Copilot mobile app". "Only English‑language merchants who sell to US buyers are eligible". "Microsoft does not take a commission or affiliate fee". "We leverage both information found on the web and from a merchant's feed".
- Shopify's Microsoft page makes the same statements as for Google: automatic discounts, discount codes and Functions work in the direct checkout; upsell, loyalty, chat and informational blocks do not load.
- Not read: Brand Agents, consumer Copilot connectors, Copilot injection policy, "Deal curation" and "MCP Server" items seen in the Microsoft Advertising navigation.

### 4.7 Amazon: Buy for Me, Alexa for Shopping (ex-Rufus)

Sources `[P]`: https://www.aboutamazon.com/news/retail/amazon-shopping-app-buy-for-me-brands ; https://www.aboutamazon.com/news/retail/how-to-use-amazon-shopping-ai-assistant

- "Using agentic AI capabilities, Amazon makes the purchase by securely providing the customer's encrypted name, address, and payment details to complete the checkout process on the brand's website." "Amazon Nova and Anthropic's Claude models support ..." "brands have the choice if they want to participate".
- "Alexa for Shopping, Amazon's agentic AI assistant for shopping, has been helping U.S. customers ... since launching in February 2024". `[I]` That launch date is Rufus's, so the brief's "Rufus" is now this product. Features include "Shop Direct selection ... tap the 'Buy For Me' button" and "auto-buying items at a set price".
- `[T]` https://www.amazon.com/robots.txt names 101 user agents. It sets `Disallow: /` for `GoogleAgent-Shopping`, `meta-externalagent`, `Claude-User`, `Perplexity-User`, `ChatGPT-User`, `GrokBot` and others.
- `[I]` Two consequences. Buy for Me is a browse-and-fill agent on the brand's site with no documented offer or coupon input, so only an automatic discount is safe to rely on. And a seller-side verifier that wants to check a competing offer on amazon.com is unwelcome there.
- Jordan Williams (Amazon) sits on the UCP Shopping Tech Council (section 5.4).

### 4.8 Claude: connectors, Claude in Chrome

Sources `[P]`: https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy (15 Apr 2026) ; https://claude.com/docs/connectors/building/review-criteria.md ; https://claude.com/docs/connectors/custom/add-unlisted.md ; https://claude.com/docs/connectors/building/directory-vs-custom.md ; https://support.claude.com/en/articles/12902446-claude-in-chrome-permissions-guide ; https://support.claude.com/en/articles/12902428-use-claude-in-chrome-safely

- Q2 custom: "You can add any third-party connector as a custom connector as long as you have the URL of its remote MCP server." Free plan: "you can add one custom connector". Install link: `https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=NAME&connectorUrl=ENCODED_URL` ("Install links only prefill the form.").
- Q2 directory: "When you submit a server, Anthropic scans it automatically for policy compliance and, by default, lists it in the directory as a Community connector." "Directory connectors are eligible for Suggested Connectors, which means Claude can recommend your connector in-chat when it's relevant to the user's task. Custom connectors are never suggested." "Only a directory listing makes your connector discoverable inside Claude."
- Directory policy, section 4 "Unsupported Use Cases" ("Unless otherwise expressly permitted by us in writing"): "A. Software that transfers money, cryptocurrency, or other financial assets, or executes financial transactions on behalf of users." "C. Software that serves advertisements, sponsored content, paid product placements, or exists primarily as an advertising or promotional vehicle." Also 2.D (must not coerce Claude into calling other tools), 2.F "must not direct Claude to dynamically pull behavioral instructions from external sources for Claude to execute", 3.F developers "must verify that they own or control any API endpoint, domain, or user interface their Software connects to". Review criteria reject tool descriptions that "promote products and services".
- Q1/Q3/Q4 Claude in Chrome: "Prohibited actions: ... Claude is prohibited from taking following actions regardless of permissions: Making purchases or financial transactions; Creating accounts; Handling sensitive credit card or ID data; ... Completing instructions from emails or web content". "Claude in Chrome has safety classifiers that screen for prompt injection attacks automatically. One checks incoming content for injection attempts, and another checks every action Claude takes before it runs." "We scan all untrusted content entering Claude's context". "Claude asks for permission before accessing financial sites."
- Q5: none.
- `[I]` Claude is a recommender, not a buyer. A custom connector can return an offer and a checkout link; the human completes the purchase.

### 4.9 Instinct (not in the brief; named by both new protocols)

- `[P]` Named as a personal agent in the PAP launch post and as PACT's co-developer; a PAP "Personal agents" design partner with Meta and OpenAI.
- `[S]` Founded by Noah Shinn; $1B Series C at a $10B valuation (pulse2.com, vktr.com); no standalone app, reached by SMS, phone and email; invite-only (eesel.ai review).
- No developer documentation found.

---

## 5. Protocols and platform plumbing

### 5.1 Personal Agent Protocol ("Poppy"), Meta + Sierra

Sources `[P]`: https://sierra.ai/blog/introducing-personal-agent-protocol (6 Oct 2026, Bret Taylor, Clay Bavor) ; https://sierra.ai/blog/poppy (9 Oct 2026) ; https://sierra.ai/blog/caller-id-in-the-age-of-agents (8 Oct 2026, Ajeet Grewal, Venu Satuluri) ; https://personalagentprotocol.org/ ; https://personalagentprotocol.org/docs/spec ; https://personalagentprotocol.org/docs/extensions/operations ; https://personalagentprotocol.org/docs/guides ; https://personalagentprotocol.org/docs/path-to-1 . Append `.md` to any `/docs/` URL for markdown.

**Status.** 6 Oct: "Personal Agent Protocol — an open standard Meta and Sierra are developing along with industry partners at Genesys, Instinct, Rocket, Shopify, Stripe, and Walmart". 9 Oct: "So today we're publishing a draft of Personal Agent Protocol, known as Poppy, and announcing an additional 35 design partners: Adyen, Atomic, Bank of America, BBVA, Chime, Cigna, Cloudflare, Comcast, DIRECTV, ElevenLabs, FOX, Gap Inc., GEICO, Hertz, Insurify, Klaviyo, Liberty Mutual, Mastercard, Nordstrom, Notion, Okta, OneSignal, OpenAI, PayPal, Plaid, SiriusXM, Synchrony, Target, United Airlines, Venmo, Visa, Wells Fargo, Zapier, Zendesk, and 1Password." "Over the next month we will host design workshops and publish a reference implementation". Spec: "This is draft version 0.1. Any part of it can change before a stable version". Path to 1.0: "Until 1.0, a revision can break compatibility with earlier drafts." Apache-2.0.

Design-partner groups on the site: Personal agents: Instinct, Meta, OpenAI. Technology providers include Cloudflare, Klaviyo, Shopify, Stripe, Zapier, Zendesk. Companies include Gap Inc., Nordstrom, Target, Walmart. Not listed: Google, Anthropic, Amazon, Microsoft, xAI, Perplexity.

Relationship to UCP: "Protocols such as Universal Commerce Protocol (UCP) focus on shopping, from finding products to checking out and managing orders. Personal Agent Protocol is complementary".

**What the spec gives a seller.**

- Discovery: "A Company MUST publish its `poppy.json` document at `https://{domain}/.well-known/poppy.json` over HTTPS, where `{domain}` is the Company's domain or a subdomain it controls." "The well-known URL MAY redirect to where the document is hosted, so a Company can host it somewhere else, such as with a provider." `organization.domain` "MUST match the host of the well-known URL the Personal Agent requested, ignoring a leading `www.`".
- Interfaces: `apis[]` of type `openapi` or `mcp` (remote MCP, Streamable HTTP, MCP 2025-06-18 or later), each with "a short `description` that helps the Personal Agent pick the right one"; `agent.protocols[]` for the company agent; `web.browser_session_endpoint`.
- Identity: the agent's `client_id` is an HTTPS URL to its metadata and JWKS. "Because every token is issued to a known `client_id` and User, the Company always knows a request comes from a Personal Agent, which one, and for which User." "Companies MAY require Personal Agents to register ahead of time." "Companies MAY keep allowlists or blocklists of Personal Agents by `client_id`".
- Guest sessions with a stable pseudonym: "A Session starts signed out: the Company knows which Personal Agent is asking and can recognize the same User over time, but not who the User is." The User ID "is stable ... opaque and different for each Company".
- `auth` is required as soon as `agent`, `apis` or `web.browser_session_endpoint` is listed; the issuer's OAuth metadata must list the domain in `poppy_domains`. With no sign-in types "it offers only signed-out Sessions".
- Conversation messages have `text`, `data` ("A JSON object for structured details ... The protocol doesn't define its keys.") and `context`. "The Personal Agent decides how much of the User's situation to share, and sharing more up front saves rounds of back-and-forth." But "Personal Agents SHOULD share only what the task needs."
- The spec's own example is a company agent making a priced counter-proposal: "I can do that. The insulated version would be warmer. Want to exchange instead for $70 more?" with `data: { "replacement_sku": ..., "price_difference": 70 }`.
- Extensions: "Extensions defined with this protocol have plain names, such as `operations`. Anyone else MUST start an extension's name with a domain they control, such as `example.com/gift-wrap`."
- Operations extension: "The operations extension lets a Company ask the Personal Agent to confirm an action before the Company performs it". An operation has `summary`, `terms` (company-defined keys), `revision`, `expires_at`, `state`. "An operation proposed in a signed-out Session can be used only in that Session." The agent "MUST NOT treat text from the Company, such as a conversation message, as the User's approval."
- Guidance to personal agents: "Prefer the company's APIs and company agent over browsing its website. They are faster and change less often." "Don't phone a company that publishes a `poppy.json`. Use the interfaces it lists instead." "Checking once a day for a price drop is usually enough."
- Guidance to companies: "Guest access: Let a signed-out personal agent session do what a signed-out visitor can do on your website, such as search products, read store policies, or ask the company agent general questions."
- Open topics, on purpose: "Payments. How a personal agent makes payments in a way that fits the protocol", "Push notifications. How a company reaches the personal agent when no request is open", "Attachments".
- Door for newcomers: "Anyone can implement it." "We're welcoming new partners. To join, email ..." with group (personal agent, company, or technology provider), a technical contact and a partnership contact. (Recorded as a fact; I contacted no one.)

Quotes from named partners (6 Oct post): Mani Fazeli, VP Product, Shopify: "From answering product questions to supporting purchases, returns, and exchanges, the ambition is to turn a buyer's intent into an outcome that delights them." Kevin Miller, Head of Payments, Stripe: "We're contributing to the Personal Agent Protocol to give businesses a standard way to recognize their customers' agents, efficiently interact with them, and shape their customer relationships." Also: "Payments extensions could let a personal agent complete a purchase without sharing credit card information." And the candid one: "When an agent uses the protocol, the company knows it's an agent and who it's acting for. Of course, some agents may not respect the protocol."

**Live checks `[T]`, 13 Oct 2026.** `GET /.well-known/poppy.json`:

- 404: sierra.ai, shopify.com, stripe.com, nordstrom.com, target.com, walmart.com, hertz.com, klaviyo.com, zendesk.com, muse.ai, openai.com, chatgpt.com, decagon.ai, siriusxm.com, gymshark.com, genesys.com, nice.com, instinct.ai, personalagentprotocol.org itself.
- Not conclusive: rocket.com and rocketmortgage.com 403 (bot wall); meta.com 400; shop.app 429; gap.com redirected to an unrelated HTML page; united.com no response; instinct.com returned an HTML shell.
- Shopify stores (allbirds, brooklinen, kith, deathwishcoffee, colourpop): 403 "Verifying your connection..." on every path including `/agents.md` and `/.well-known/ucp`. That is Shopify's bot challenge against this machine's IP after many requests today (siblings were probing the same stores), not information about the path. Sibling H2 recorded a 404 for allbirds `/.well-known/poppy.json` earlier in the day.
- Conclusion: no live `poppy.json` found anywhere.

**Shopify hosting of `/.well-known/poppy.json`.**

- `[P]` App proxies cannot serve it: the prefix "must match an allowed value (`a`, `apps`, `community`, or `tools`)" (https://shopify.dev/docs/apps/build/online-store/app-proxies).
- `[S]` Shopify URL redirects: "You can redirect only from broken URLs."; the help page lists prefixes that cannot be redirected and `/.well-known` is not among those the fetcher reported (https://help.shopify.com/en/manual/online-store/menus-and-links/url-redirect, read through a summarizing fetcher because direct fetches returned 403).
- `[I]` So a merchant-created URL redirect from `/.well-known/poppy.json` to an OfferAd-hosted document is the only candidate route, the spec explicitly allows a redirect "to a provider", and nobody has tested it. Shopify is a PAP technology provider and may start serving its own `poppy.json` per store, as it does `/.well-known/ucp`; there is one such file per domain, so OfferAd would then have to live inside Shopify's document or be an extension.

### 5.2 PACT (Decagon + Instinct)

Sources `[P]`: https://decagon.ai/blog/introducing-the-personal-agent-consent-trust-protocol-pact (6 Oct 2026, Harry Gao, Gram Liu) ; https://decagon.ai/blog/personal-agents-are-here (1 Oct 2026, Jesse Zhang, Ashwin Sreenivas) ; repo https://github.com/openpactprotocol/openpactprotocol (Apache-2.0, created 1 Oct 2026) ; https://openpactprotocol.org/

- "Today, we're open-sourcing the ... (PACT), co-developed and supported by Instinct. We're also excited to join the Personal Agent Protocol working group announced by the team behind Meta's Muse".
- "Personal agents like Muse, Instinct, and dots are starting to book travel, manage purchases, and resolve issues". "Route requests through the business's agent."
- Decagon on the buyer side: "These personal agents book, buy, cancel, and negotiate on their owners' behalf." "A personal agent might ask for a refund once, or keep trying different approaches to maximize the concession."
- Spec "PACT 1.0": built on A2A 1.0 and OAuth device code. Agent Card: "The standard place is `https://{brandDomain}/.well-known/agent-card.json`, which serves the card or redirects to the Provider's URL... This spec does not define a registry." `POST {interfaceUrl}/message:send`; "`role` MUST be `ROLE_USER`. `parts` MUST have at least one non-blank `text` part. Other part kinds get `CONTENT_TYPE_NOT_SUPPORTED`." Acceptance of agents "is the Provider's policy, not PACT's." "A personal agent registers with each Provider once, then can talk to every Brand that Provider hosts."
- `[T]` `https://www.allbirds.com/.well-known/agent-card.json` returned 404 earlier today.
- `[I]` PACT is usable as a multi-brand "Provider" model, which is OfferAd's shape, but it is text-only and its authors are converging on PAP.

### 5.3 ACP (Agentic Commerce Protocol)

Sources `[P]`: https://www.agenticcommerce.dev/llms.txt ; repo https://github.com/agentic-commerce-protocol/agentic-commerce-protocol (`MAINTAINERS.md`, `docs/governance.md`, `rfcs/`, `changelog/`, `spec/`)

- "Any agent can call an ACP-enabled checkout... merchants decide which agents to accept." "How do AI platforms discover ACP merchants? Discovery tooling is in progress."
- Lead maintainers: OpenAI, Stripe, Meta. TSC: "The TSC has up to 7 seats." Seat 1 OpenAI (`aravindrao-openai`), seat 2 Stripe (`prasad-stripe`), seat 3 Meta (`lhwa`). "Every SEP must be sponsored by a TSC member to proceed." Working groups: "Include members from at least two distinct organizations", proposal to the TSC, simple majority.
- Discount extension (`rfcs/rfc.discount_extension.md`, draft, author `nvp-stripe`): `discounts.codes`, `applied`, `rejected`, automatic discounts. "Out of scope: Discount creation/management APIs, coupon validation rules, loyalty point redemption."
- Intent Traces (`rfcs/rfc.intent_traces.md`, author Tomas Taylor, GitHub `0xtotaylor`; the `IntentTrace` schema is in the released `spec/2026-04-17` JSON schema):
  - "This specification lays the groundwork for merchants to transition from probabilistic retargeting (guessing) to deterministic negotiation (bidding)."
  - "Automated routing: Merchants can trigger different workflows per reason (e.g., `shipping_cost` → offer free shipping promo code)."
  - "Future extensibility: A subsequent RFC MAY define Reconsideration Offers keyed to specific reason codes."
  - `reason_code`: `price_sensitivity`, `shipping_cost`, `shipping_speed`, `product_fit`, `trust_security`, `returns_policy`, `payment_options`, `comparison` ("User is actively comparing prices or alternatives across merchants."), `timing_deferred`, `other`.
  - Example: `"trace_summary": "User verified product fit but found a similar SKU on Amazon for $15 less."` with metadata `competitor_source`, `competitor_price`, `max_budget`.
  - Sent only on `POST /checkout_sessions/{id}/cancel`; "The `intent_trace` is write-only." Schema description of `trace_summary`: "A generated summary of the specific objection or negotiation gap."
- Suggested Pricing (unreleased, SEP #197, author Lee Hwa of Meta): "Add suggested_price to Item on CheckoutSessionCreateRequest, enabling agents to communicate price provenance to sellers for catalog price matching." `PriceSource` carries `feed_id`, `channel`, `feed_update_id`, `updated_at`. "Seller-controlled policy: Time window and source verification are seller-defined". `[I]` This is the price the agent saw in the seller's own feed, not a competitor's price.
- `[I]` ACP is the only standard where the buyer agent already tells the seller why it is leaving and what the competing price was. The seller has no in-band way to answer. That gap is OfferAd's thesis, stated in the RFC's own words.

### 5.4 UCP governance (who decides what an extension can become)

Source `[P]`: https://github.com/Universal-Commerce-Protocol/.github/blob/main/MAINTAINERS.md and `GOVERNANCE.md`

- Governance Council: Amit Handa (Google), Ilya Grigorik (Shopify), Twum Djin (Stripe), two open seats.
- Shopping Tech Council: Amit Handa, Anurag Sinha, Drew Olson, Greg Smith, Jing Li (Google); Daniel Wyckoff, Gil Greenberg, Ilya Grigorik, Lee Richmond (Shopify); Imran Hoosain (Etsy); James Andersen (Meta); Jordan Williams (Amazon); Maxime Najim (Target); Patrick Jordan (Microsoft); Prasad Wangikar (Stripe); Scot DeDeo (Salesforce); Uddhav Kambli (Wayfair).
- "A group of 3+ organizations can submit a charter to the Governing Council to form a DWG". "Any DTC member can submit a DWG charter nomination".

### 5.5 Stripe agentic commerce

Sources `[P]`: https://docs.stripe.com/agentic-commerce.md ; https://docs.stripe.com/agentic-commerce/sellers/use-cases/retail.md ; https://docs.stripe.com/agentic-commerce/concepts/catalog-feed.md ; https://docs.stripe.com/agentic-commerce/sellers/manage.md ; https://docs.stripe.com/agentic-commerce/agents/link-agent-wallet.md

- Sellers: "Protocol used: UCP or ACP". The agent side is "Agents (Private preview)".
- Promotions feed: "Offers discount codes, deals, and free shipping to drive conversion". `benefit_type`: `percent_off`, `amount_off`, `free_shipping`. `application_type`: `automatic` or `promotion_code` (20 characters max). "All free_shipping promotions must include a valid redemption code." "AI agents actively offer promotions to shoppers. Sellers with active promotions consistently see higher conversion rates than equivalent products without them."
- Agent attribution: "View orders on the Transactions page in the Dashboard, where they're tagged with the originating agent. You can also filter transactions by agent names." "Agent details (Private preview) ... `CheckoutSessions.PaymentIntent.agent_details`".
- Agent onboarding is mutual: "Find the agent you want to sell through and review its terms... select Request connection. We send the agent an approval request that the agent must accept."
- Hooks: order approval `v1.delegated_checkout.finalize_checkout` ("Stripe enforces a four-second timeout"); `v1.delegated_checkout.customize_checkout` for shipping and tax; `delegated_commerce.product_price_availability` ("Agents can call this endpoint when inventory is low or before showing a product to a buyer."). `[I]` The price hook request carries only the SKU, with no agent identity or buyer intent, so it can reprice but not personalize.
- Link Agent Wallet: "Creates a spend request for a specific purchase. The customer approves it, and Link returns a one-time-use payment credential your agent uses to pay."

### 5.6 Shopify agentic storefronts and discovery files

Sources `[P]`: https://help.shopify.com/en/manual/online-sales-channels/agentic-storefronts and its `/meta`, `/chatgpt`, `/google`, `/microsoft`, `/products`, `/agentic-home`, `/data-privacy` pages ; https://shop.com/SKILL.md ; https://shop.com/references/transactions.md

- "Agentic storefronts is active by default for eligible stores." "For Google AI Mode and Gemini, Microsoft Copilot, and Meta surfaces such as Muse, if you have direct checkout activated, then customers can complete their purchases in the channel's Shopify-powered direct checkout".
- Discovery files: "Every Shopify store automatically serves the following discovery URLs that AI agents can read...: /agents.md — this is your canonical agent discovery URL... /llms.txt and /llms-full.txt". Customizable with theme templates; `agents.md.liquid` "changes the content that's served from all three URLs".
- `[T]` https://www.allbirds.com/agents.md (200 earlier today; title "# Agent Instructions — Allbirds"): "Use the [Shop skill](https://shop.com/SKILL.md)"; UCP MCP endpoint `https://www.allbirds.com/api/ucp/mcp`; "Agents must use the provided WebMCP tools for all agent-initiated shopping actions and updates. If the tools are unavailable ..., yield and ask the buyer to continue in the browser. Do not work around the tools by scripting checkout forms or page controls."; "Server-to-server requests and hosted or remote browsers must use Web Bot Auth"; "You may also read public HTML pages for additional context". (Sibling R3 saved the same file.)
- Shop skill: "Shop across millions of stores: discover and compare products, build carts, check out, use saved Shop details, and track orders. Use for any shopping request." MCP at `https://mcp.shop.com/`. Its transactions reference tells agents: "Preserve unrelated fields and unknown extensions", "Verify returned items, quantities, prices, messages, and status", and "Report every returned message and disclosure." It also says a purchase URL with "A `powered-by` header naming Shopify, or `rel="buy"` with `dev.shopify.shop_pay` among its payment handlers, identifies a Shop checkout path: use Shop tools with that store." The skill files I read never mention discount codes.
- Catalog data that reaches agents: "If you set compare-at prices..., you can choose whether Shopify Catalog shows them to AI agents. AI agents might use this information to advertise strikethrough pricing". "Ensure that your product descriptions include any relevant legal disclosures in the first 6,000 characters." "Agentic storefronts channels often re-rank results based on their own logic". An "Other channels" group covers "Independent developers and startups that are building niche or experimental shopping agents".

---

## 6. Ideas A to F: keep, change, or drop

**A. Offer token = single-use discount code + cart permalink + Discount Function. Keep as the settlement rail; change the delivery.**

- `[P]` Codes and Functions are documented to work in Meta, Google and Copilot direct checkout and in ChatGPT's in-app-browser checkout.
- `[I]` In the three Shopify-powered direct checkouts there is no cart permalink step: the cart lives in the channel. The code has to work by itself, with the Function reading everything it needs from the code and its discount metafield, not from permalink attributes.
- `[I]` Apply the offer before the approval step. Muse issues a card "tied to that particular merchant, a particular dollar amount"; Muse connector rule 3.4 and the Shop skill's spend requests both re-open approval when the total changes.
- `[P]` Google: codes are entered by the user; auto-applied promotions come from Merchant Center. On Google the dependable form of an offer is an automatic discount or a Merchant Center promotion, not a code handed to the agent.
- `[I]` Free gift as "a line the link adds and the function zeroes" only works where the agent follows a link (browser agents, ChatGPT referral). Bundles are unsupported in Meta's direct checkout.

**B(i). WebMCP tool from the theme app embed. Keep as an experiment.** `[P]` Limited to Chromium through an origin trial (existing docs). `[P]` Muse's browsing sub-agent sees accessibility-tree snapshots and "has no ability to run javascript in the page context"; nothing says it consumes WebMCP. `[P]` Shopify's own `/agents.md` tells agents to use "the provided WebMCP tools", which is ambiguous about app-registered ones.

**B(ii). Text in descriptions, metafields, policies, FAQ. Keep, with a strict style rule.** Facts only ("Price match available: this store answers offer requests at ...; proof accepted: a public product URL"), visible to humans, no imperatives addressed to the agent, no tool names in prose (Comet's classifier looks for injected tool names), nothing hidden. `[P]` Descriptions and mapped metafields do flow to the channels through Shopify Catalog.

**B(iii). Automatic discount title. Keep.** It shows in every channel's checkout. The Shop skill instructs agents to "Report every returned message and disclosure", which is the best evidence I found that checkout-side text reaches the user.

**B(iv). JSON-LD, llms.txt, well-known files. Upgrade.** `[P]` Shopify serves `/agents.md`, `/llms.txt` and `/llms-full.txt` for every store, and `agents.md.liquid` lets the merchant edit all three. That is the sanctioned place to declare the offer endpoint. Add `/.well-known/poppy.json` as a second, protocol-grade declaration if the redirect test passes.

**B(v). One cross-store connector in the directories. Split it.**

- As a user-added custom connector: works today on Grok, Claude, Perplexity, ChatGPT and Muse. Distribution is the problem, not permission.
- As a directory listing: Claude's policy 4.C and 4.A, and OpenAI's "advertising vehicle" and "pass-through intermediary" clauses, both read against a paid, cross-store offer broker. Muse's rules are compatible in spirit (labeled commercial relationships are allowed) but require completing the purchase inside the connector. Perplexity is proposal-based. Grok's rules are unknown.
- `[I]` A framing that fits the policies better: a neutral "verified price and terms" tool that returns each store's own first-party offer with the seller clearly named, charges sellers nothing per placement in the listed version, and never executes payment.

**C. Offer menu carried by codes. Keep.** `[P]` Stripe's promotions feed carries codes; OpenAI's Promotions API has no code field, so on ChatGPT a menu can only be described, with the `url` pointing at the page that issues the code.

**D. `context.eligibility` claims.** Nothing in my sources shows Google, Meta or Copilot sending merchant-defined eligibility claims. `[P]` Google's sanctioned path for member pricing and perks is loyalty data in Merchant Center, and "not all features defined in the spec are available on Google's surfaces". Treat D as unproven on the big channels.

**E. Custom UCP extension `com.offerad.*`.** `[P]` Private extensions need both sides to declare them, Google approves integrations, and Shopify generates the store profile. The standards path needs 3+ organizations for a DWG. `[I]` Two better-fitting homes for the same schema now exist: a PAP extension named with our own domain (allowed by rule today, no permission needed) and an ACP SEP for "Reconsideration Offers" (invited by the Intent Traces RFC).

**F. Draft orders or invoice URLs.** `[I]` Only usable where the agent ends in a browser on the merchant domain (browser agents, ChatGPT referral). Not usable inside channel-native direct checkouts. My sources add nothing else.

**New ideas from this research**

- **G. PAP ("Poppy") company endpoint operated by OfferAd per merchant.** Publish `poppy.json` (redirected from the store domain), run a per-merchant OAuth issuer that supports guest sessions, list an MCP API described as offers and price matching, optionally a company-agent conversation endpoint. The agent passes priority and the competing-offer URL in `message.data`; the reply carries the offer as an Operation (`summary`, `terms`, `expires_at`) and the Shopify code. Identity (`client_id`) and the stable guest User ID give per-agent policy and one-offer-per-user limits without personal data.
- **H. Become a PAP design partner as a technology provider.** The site invites it. This is an owner decision; nothing was sent.
- **I. Muse Custom Connector recipe.** Muse "can also write its own custom connectors for other services you care about if they have their own APIs or CLIs" and Meta does not review them. Publish a small, documented, public OfferAd API per store (OpenAPI plus a one-paragraph description) and point to it from `/agents.md`, so a Muse user can say "connect to this store's offers".
- **J. ACP "Reconsideration Offers" SEP.** Write the RFC the Intent Traces document anticipates: a seller response to a cancel with `reason_code`, carrying a labeled offer. Natural allies are the Intent Traces author and Meta's TSC seat, whose holder wrote Suggested Pricing.
- **K. Static feeds as signposts.** Put a floor offer in the Stripe, OpenAI, Google and Microsoft promotion feeds and use the promotion's URL and title to point at the dynamic endpoint.
- **L. Agent-aware offers without injection.** Use identity the platforms already send: Google's `UCP-Agent` profile header, Stripe's agent tag on orders, PAP's `client_id`.
- **M. MCP Events (OpenAI).** An installed OfferAd plugin can push "a better offer is available" to a dot. Depends on the plugin being installed.
- **N. Verify competing offers through sanctioned read paths, not scraping.** Shopify stores challenged plain server-side fetches today, and their `/agents.md` requires Web Bot Auth for "Server-to-server requests". Amazon disallows AI agents. The verifier needs a declared bot identity, should use catalog endpoints (the competitor's own public UCP catalog tools, or Shop's cross-store search) for Shopify-hosted competitors, and must return "could not verify" as a first-class outcome.

---

## 7. Honest limits of each crack

1. **Discount code rail.** Proven to settle; says nothing about how the agent learns the code. On Google the human types it. Single-use codes and per-user limits depend on identifying the buyer, which direct checkouts give only at checkout time.
2. **On-page offer text.** Every agent screens it. It can inform, it cannot command. Muse reads accessibility text only. Claude in Chrome will read and not buy.
3. **`/agents.md`.** Platform-sanctioned and merchant-editable, but I found no statement from Meta, OpenAI, xAI, Google, Perplexity or Anthropic that their consumer agent fetches it. Shopify's default content also tells agents not to script around its tools.
4. **Custom connectors.** The buyer must add them. Nothing makes an agent call one at the decision moment. Claude never suggests custom connectors.
5. **Directory listings.** Policy risk as described; review outcomes are discretionary on every platform ("does not guarantee approval").
6. **Promotion feeds and Direct Offers.** Static or platform-optimized; no proof-of-competing-offer input; gated (approved partners, pilots).
7. **PAP.** Four days old as a draft. Breaking changes are promised. Payments, push and attachments are missing. One stage demo with Muse; no production documentation. The Shopify-domain discovery file is untested, and Shopify may claim it.
8. **PACT.** Text-only; small adopter set; converging into PAP.
9. **ACP route.** ChatGPT sends Shopify buyers to the merchant checkout, so ACP traffic to Shopify stores is close to nil. Intent traces arrive after the buyer has left.
10. **Verifier.** Competitor sites block bots; logged-in, personalized or regional prices cannot be confirmed from outside; a page URL is not proof of a purchasable offer.

---

## 8. People (candidates for outreach; nobody was contacted)

| Name | Role | Why | Source |
|---|---|---|---|
| Bret Taylor | Sierra co-founder; byline on both PAP posts | Owns PAP direction | https://sierra.ai/blog/poppy |
| Clay Bavor | Sierra co-founder; byline on both PAP posts | Same | https://sierra.ai/blog/introducing-personal-agent-protocol |
| Ajeet Grewal, Venu Satuluri | Sierra, authors of "Caller ID in the age of agents" | Agent identity design | https://sierra.ai/blog/caller-id-in-the-age-of-agents |
| Alex McGillis | VP of Product, Rocket | Ran the live Muse + Poppy demo | https://sierra.ai/blog/poppy |
| Mani Fazeli | VP Product, Shopify | Shopify's named voice on PAP | https://sierra.ai/blog/introducing-personal-agent-protocol |
| Kevin Miller | Head of Payments, Stripe | Stripe's named voice on PAP | same |
| Tony Bates | Chairman and CEO, Genesys | PAP launch partner | same |
| Shawn Malhotra | CTO, Rocket Companies | PAP launch partner | same |
| Tarek Sheasha | Software Engineer & VP, Meta Superintelligence Labs | Author of Muse's security model (what Muse will and will not act on) | https://research.meta.ai/blog/security-and-safety-for-ai-agents-our-approach-with-muse |
| Mona Sarantakos, Christine Awad | Meta, authors of the Muse design post | Muse product behavior | https://introducing.muse.ai |
| CJ Desai | Chief Enterprise Platform Officer, Meta | Org over Muse agent, Business Agent, Muse API | https://about.fb.com/news/2026/09/launching-meta-enterprise-platform/ |
| Lee Hwa (`lhwa`) | Meta's ACP TSC representative; author of Suggested Pricing | Could sponsor a Reconsideration Offers SEP | https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/docs/governance.md |
| James Andersen | Meta, UCP Shopping Tech Council | Meta's UCP voice | https://github.com/Universal-Commerce-Protocol/.github/blob/main/MAINTAINERS.md |
| Tomas Taylor (`0xtotaylor`) | Author of ACP Intent Traces and Affiliate Attribution RFCs | Wrote "deterministic negotiation (bidding)"; most aligned individual | https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/rfcs/rfc.intent_traces.md |
| `aravindrao-openai` | OpenAI's ACP TSC seat (real name not verified) | SEP sponsor | ACP governance doc |
| Prasad Wangikar (`prasad-stripe`) | Stripe; ACP TSC seat; UCP Shopping and Payments councils | Sits in both standards | ACP governance doc; UCP MAINTAINERS |
| `nvp-stripe` | Author of the ACP discount extension (real name not verified) | Discount semantics in ACP | https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/rfcs/rfc.discount_extension.md |
| Twum Djin | Stripe, UCP Governance Council | UCP governance | UCP MAINTAINERS |
| Ilya Grigorik | Shopify; UCP Governance Council and Shopping Tech Council | Decides what Shopify's UCP surface becomes | UCP MAINTAINERS |
| Daniel Wyckoff, Gil Greenberg, Lee Richmond | Shopify, UCP Shopping Tech Council | Same | UCP MAINTAINERS |
| Amit Handa | Google; UCP Governance Council | Same for Google | UCP MAINTAINERS |
| Anurag Sinha, Drew Olson, Greg Smith, Jing Li | Google, UCP Shopping Tech Council | UCP spec direction | UCP MAINTAINERS |
| Vidhya Srinivasan | VP/GM Ads and Commerce, Google | Announced Direct Offers and UCP | https://blog.google/products/ads-commerce/agentic-commerce-ai-tools-protocol-retailers-platforms/ |
| Ashish Gupta | VP/GM Merchant Shopping, Google | Merchant Center UCP hub, loyalty | https://blog.google/products-and-platforms/products/shopping/google-shopping-updates-holiday-shopping/ |
| Patrick Jordan | Microsoft, UCP Shopping Tech Council | Copilot's UCP voice | UCP MAINTAINERS |
| Jordan Williams | Amazon, UCP Shopping Tech Council | Amazon's UCP voice | UCP MAINTAINERS |
| Rajiv Mehta | VP Conversational Shopping, Amazon | Alexa for Shopping | https://www.aboutamazon.com/news/retail/how-to-use-amazon-shopping-ai-assistant |
| Oliver Messenger | Shopping director, Amazon | Buy for Me | https://www.aboutamazon.com/news/retail/amazon-shopping-app-buy-for-me-brands |
| Jesse Zhang, Ashwin Sreenivas | CEO and President, Decagon | PACT sponsor; wrote that agents "negotiate" | https://decagon.ai/blog/personal-agents-are-here |
| Harry Gao, Gram Liu | Decagon, PACT authors | PACT spec | https://decagon.ai/blog/introducing-the-personal-agent-consent-trust-protocol-pact |
| Noah Shinn | Founder, Instinct `[S]` | Personal agent in both protocols | https://pulse2.com/instinct-raises-1-billion-series-c-at-10-billion-valuation/ |
| Imran Hoosain, Maxime Najim, Scot DeDeo, Uddhav Kambli | Etsy, Target, Salesforce, Wayfair on the UCP Shopping Tech Council | Possible co-sponsors for a working group | UCP MAINTAINERS |
| David Singleton `[S]` | Meta; said to work on Muse and to have announced PAP for Meta | Meta-side PAP contact | https://www.eesel.ai/blog/personal-agent-protocol |
| Jeff Weinstein `[S]` | Stripe; posted about PAP "founding members" | Stripe-side PAP contact | same |

---

## 9. Corrections to the brief

1. Item 11, PAP: now verified from primary sources, and the brief is out of date. The draft is published (9 Oct 2026) at https://personalagentprotocol.org, version 0.1, with discovery at `/.well-known/poppy.json`. OpenAI is a design partner.
2. Item 11, Direct Offers: verified from Google's own post. It is a Google Ads pilot, discounts first, labeled "Sponsored deal".
3. Item 11, Stripe: verified from Stripe's docs. Orders are "tagged with the originating agent" and the promotions feed supports codes.
4. Missing from the brief: Shopify's merchant help states, per channel, that discount codes, automatic discounts and Functions work in Meta, Google and Copilot direct checkout, and that most checkout blocks (upsell, loyalty, chat, informational) do not load there.
5. Missing: ChatGPT is a referrer for Shopify stores; purchases happen in the merchant's own checkout in an in-app browser. Instant Checkout is for "select marketplace partners".
6. Missing: Shopify serves `/agents.md`, `/llms.txt`, `/llms-full.txt` for every store and merchants can template them. Idea B(iv) should name these, not generic llms.txt.
7. Idea A assumes a cart permalink. In the three Shopify-powered direct checkouts there is no permalink step, and on Google the code is typed by the user.
8. Idea B(v) names "ChatGPT apps". They are now "plugins" in a universal directory; and the directory rules of OpenAI and Anthropic exclude advertising vehicles, intermediaries and (Anthropic) transaction execution. Meta has a connector directory too, missing from the list.
9. "Known doubt" is confirmed for every agent, with one refinement: agents do act on channels they were told about by the platform or the user: connectors, Shopify's agent files, and PAP's discovery file.
10. The brief lists Claude in Chrome as a buyer agent. It is prohibited from "Making purchases or financial transactions".
11. "Rufus" is now presented by Amazon as "Alexa for Shopping".
12. ACP already contains the buyer-to-seller half of a negotiation (Intent Traces) and names the missing half (Reconsideration Offers). The brief treats negotiation as absent from all standards.
13. ACP Suggested Pricing is price provenance from the seller's own feed, not a competitor price. Do not cite it as price matching against competitors.

---

## 10. Could not verify

1. Whether any personal agent ships PAP support in production (only a stage demo with Muse is documented).
2. Whether a Shopify store can serve or redirect `/.well-known/poppy.json` or `/.well-known/agent-card.json`. Needs a test on a store we own.
3. Whether Shopify will generate `poppy.json` per store.
4. How a discount code gets entered in Meta's direct checkout (by Muse, by the user, or not at all), and how Muse treats coupon fields on ordinary web checkouts.
5. Whether Muse itself calls a store's UCP MCP endpoint, and whether its browser exposes WebMCP tools.
6. Whether Dots, ChatGPT, Grok Bot, Comet or Muse fetch `/agents.md`.
7. ChatGPT's own documentation of coupon and promotion behavior (help.openai.com and chatgpt.com/merchants returned 403).
8. Listing rules for the Grok connector catalog (x.ai pages returned 403).
9. Muse Connector Platform terms (muse.ai/platform/terms returned 400).
10. Consumer Copilot connector extensibility, Copilot's injection policy, Microsoft "Deal curation".
11. Comet's coupon behavior; whether Perplexity calls UCP endpoints; plan gating of Perplexity custom connectors.
12. Whether Gemini accepts user-added tools for shopping; Gemini's injection policy; Direct Offers availability outside the pilot.
13. Amazon Buy for Me's merchant mechanics and coupon behavior.
14. Exact Shopify URL-redirect restrictions (read only through a summarizing fetcher).
15. Why Shopify storefronts returned 403 to this machine (rate, reputation, or sibling traffic).
16. Real names behind `aravindrao-openai` and `nvp-stripe`; Tomas Taylor's employer; David Singleton's title.
17. Whether an app-registered WebMCP tool is used by any agent next to Shopify's own tools (sibling R4's scope).
18. Whether any agent sends merchant-defined `context.eligibility` claims.

---

## 11. Process notes

- The scratchpad is shared with sibling agents. Early in the session a sibling replaced a helper script that had the same file name as mine, and my next call wrote converted text over one of my own raw files (`docs/r5/google-ucp-faq.html`). I re-downloaded that file and moved my helpers to a private folder with unique names. I did not restore my version over the sibling's script. My earlier shared-name helpers (`h2t.py`, `body.py`, `clean.py`) may have collided with a sibling's files in the same way.
- Nothing in `docs/` was deleted. A few of my own files are saved error pages (noted below).
- After many requests from this machine to Shopify storefronts today (mine and siblings'), Shopify began answering every path with 403 "Verifying your connection...". I stopped probing and did not try to get around it. `help.shopify.com` also returned 403 at the end; one page was read through the summarizing fetcher instead.
- No person or company was contacted, no account created, nothing posted, no cart or checkout created.

## 12. Raw files (all under `/Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/docs/r5/`)

- PAP: `sierra-introducing-personal-agent-protocol.*`, `sierra-blog-poppy.*`, `sierra-caller-id-in-the-age-of-agents.*`, `pap-org-home.*`, `pap-org-docs-introduction.*`, `pap-org-docs-spec.md`, `pap-org-docs-extensions.md`, `pap-org-docs-extensions-operations.md`, `pap-org-docs-guides.md`, `pap-org-docs-path-to-1.*`, `pap-org-license.html/.txt`, `pap-org-license-contributions.html/.txt`, `pap-org-sitemap.xml`, `poppy-probes/` (one file per probed host). Error pages: `pap-org-llms.txt`, `pap-org-llms-full.txt`, `pap-org-wellknown-poppy.json`, `pap-org-license.md`, `pap-org-license-contributions.md`.
- PACT: `decagon-pact.*`, `decagon-personal-agents-are-here.*`, `pact-readme.md`, `pact-docs-spec.md`, `pact-docs-index.md`, `pact-docs-personal-agent.md`, `pact-docs-provider.md`, `pact-AGENTS.md`, `pact-tree.json`, `pact-repo-meta.json`.
- Meta: `meta-introducing-muse-personal-ai-agent.*`, `meta-introducing-muse-small-business.*`, `meta-launching-meta-enterprise-platform.*`, `meta-business-agent.*`, `muse-security.*`, `muse-introducing.*`, `muse-platform.*`, `muse-platform-docs.*`, `muse-business.*`, `muse-help-1687253048996149.*`, `muse-help-2124746764949121.*`, `muse-help-1385290430137537.*`. Error pages: `muse-platform-terms.html`, `muse-custom-connectors-help.html`.
- Shopify: `shopify-help-agentic*.html/.txt` (home, meta, chatgpt, google, microsoft, products, data-privacy, plan setup), `shopify-changelog-meta.*`, `shopify-dev-app-proxies.md`, `live-allbirds-agents.md`, `live-allbirds-llms.txt`, `shop-SKILL.md`, `shop-skill-http.md`, `shop-skill-transactions.md`. Error page: `shopify-help-url-redirect.html`.
- OpenAI and ACP: `openai-commerce-llms-full.txt`, `openai-commerce-promotions.md`, `openai-plugins-llms-full.txt`, `openai-ads-llms-full.txt`, `openai-ads-product-feeds.md`, `chatgpt-docs-*.md`, `acp-llms.txt`, `acp-README.md`, `acp-MAINTAINERS.md`, `acp-docs-governance.md`, `acp-rfcs-*.md`, `acp-changelog-*.md`, `acp-spec-*.json`. Error pages: `openai-help-shopping.html`, `chatgpt-merchants.html`.
- xAI: `xai-grok-bot-*.md`, `xai-grok-connectors*.md`, `xai-grok-connector-management.md`, `xai-x-subscription-grok-bot.md`, `xai-build-features-*.md`, `xai-developers-tools-remote-mcp.md`.
- Google and UCP: `google-blog-*.html/.txt`, `google-ucp-*.html/.txt`, `ucp-org-MAINTAINERS.md`, `ucp-org-GOVERNANCE.md`, `ucp-repo-*.md`.
- Stripe: `stripe-agentic-commerce.md`, `stripe-ac-*.md`.
- Perplexity: `pplx-hub-*.html/.txt`, `pplx-help-*.html/.txt`, `pplx-merchants.*`.
- Microsoft: `ms-agentic-commerce.*`. Amazon: `amazon-buy-for-me.*`, `amazon-alexa-for-shopping.*`, `amazon-robots.txt`.
- Claude: `claude-software-directory-policy.*`, `claude-docs-connectors-*.md`, `claude-chrome-*.html/.txt`, `claude-mcp-directory-policy.*`, `claude-directory-faq.*`.
