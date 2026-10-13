# G5 - Possible co-builders and allies for OfferAd ("build together something for this")

Research date: 13 Oct 2026. Every role below was confirmed from a page fetched today unless it says "unverified". Nobody was contacted; only read-only GETs of public pages, public GitHub API endpoints and the public Luma discover endpoint. No accounts, forms, posts, stars or follows. Raw copies of what I fetched are in `/Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/docs/g5/`.

Labels: `primary` = the person's or organisation's own page, profile, repository or official programme; `secondary` = press, aggregator or search summary; `unverified` = I could not confirm it today.

Scope reminder: this file covers builders and allies (companies already doing offers, negotiation or ads for shopping agents; independent open-source developers; Shopify discount/Functions studios; researchers; Bay Area venues). Shopify, Meta, OpenAI, xAI, Google executives and the protocol councils are other tasks' scope; they appear here only where they show up at a venue.

---

## 0. Short version

1. The single best venue is nine days away and local: **AGNTCon + MCPCon North America, 22 to 23 Oct 2026, San Jose McEnery Convention Center**. It has an Agentic Commerce track, a UCP panel with Ilya Grigorik (Shopify), Amit Handa and Greg Smith (Google) on Thu 22 Oct 4:40 PM, an open "Agentic Commerce" lunch table on Thu 22 Oct, and a talk by the independent author of `ucp-probe` on Fri 23 Oct. A one-day pass is $475, the Expo + Party pass $149.
2. The standards conversation OfferAd needs is happening in public this week, between individuals who answer newcomers within hours: UCP issue #738 (Arjun Garg, Intuit), discussion #502 (Chris Daly, I Want That!), discussion #863 (Yang W., StabileRewards, San Francisco, zero replies so far), issue #929 (Sparsh, Google London). On 9 Oct 2026 Arjun Garg asked in public for exactly what OfferAd can supply: "A concrete buyer proposal → seller counteroffer → Cart application → Checkout example".
3. Three small companies have hit the same wall (Shopify writes the store's UCP profile; apps cannot add to it) and said so in public: I Want That!, StabileRewards, Flux. They are competitors or complements in product and natural co-signers of one joint question to Shopify.
4. Two discount-Function studios are reachable by design and own the "one code, several effects" piece: Discount Kit (co-founders Sammy Isseyegh and Dave Spanton, UK; "The core team is always around for a chat") and Regios (Tobe Osakwe; "reach out. I read every message").
5. I found no agentic-commerce-specific meetup or hackathon in San Francisco dated November or December 2026. Three such events happened in the last eight weeks (23 Aug, 3 Oct, 5 Oct), so the organisers' calendars are the thing to watch.

---

## 1. People (12), with verification

### 1.1 Chris Daly - Founder, I Want That! Inc (Columbus, Ohio)

- Role, `primary`: "Chris Daly / Founder, I Want That! • 25 years in retail" - https://useiwantthat.com/ (page footer "© 2026 I Want That!", fetched 13 Oct 2026). Second primary source: GitHub profile `c-e-daly`, company "I Want That! Inc", bio "Founder, @i-want-that 30 years sales and marketing", location "Columbus, Ohio", profile updated 2026-09-22 - https://github.com/c-e-daly
- What he controls: a live Shopify and WooCommerce offer engine with an agent channel ("Accept inbound offers from ChatGPT, Gemini, and Copilot through the same rule engine"), a buyer-side agent in beta ("Ask Rami"), and the UCP thread that started the negotiation discussion (#502).
- Recent statement, `primary`, 9 Oct 2026: "Enabling negotiation at scale requires the Buyer's agent to identify a seller who accepts offers, the json payload, signature and endpoint to submit the offer, the response offer shape, the counter offer shape and even the ability for the Buyer's agent to counter a counter offer from a seller." - https://github.com/Universal-Commerce-Protocol/ucp/issues/738#issuecomment-6086329030
- Also, 10 Sep 2026: "Because UCP is not quite ready for this yet, our approach is adding some meta data into the shop storefront the agent could read and then direct them to the api and resources to shape the offer and submit it for a shop. Today, on most platforms, the manifest.json cannot be altered by third parties." - https://github.com/Universal-Commerce-Protocol/ucp/discussions/502
- Public channels: GitHub `c-e-daly`; X handle `letsmakedeals` (listed on his GitHub profile); public booking link on his site https://meetings.hubspot.com/chris-e-daly/customer-demo (it is a customer-demo link, so a peer note belongs in the GitHub thread instead).
- Company classification: **competitor** in product (customer- and agent-generated offers on Shopify, code + cart permalink handoff), **ally** in standards (wants the same UCP capability). His offers are buyer-initiated price offers; no competing-link verification and no seller-initiated non-price offer found.
- Reachability: high. Solo founder, answers in the thread the same day, one GitHub follower.
- Better route: reply in UCP discussion #502 or issue #738, where the conversation already is.
- One ask: "Arjun asked on 9 Oct for a concrete buyer proposal → counteroffer → Cart → Checkout example; would you co-write it with me using a non-price counter (free express shipping) so the example covers more than price?"

### 1.2 Arjun Garg - Intuit (title not published); author of the UCP Offer extension proposal

- Role, `primary` for affiliation only: GitHub profile `arjun2075` shows name "Arjun Garg", company "Intuit", location "US", profile updated 2026-09-28 - https://github.com/arjun2075 . His title at Intuit is **unverified**; he comments with author association NONE (not a UCP maintainer).
- What he controls: issue #738 "[Proposal]: State-bound Offer extension for merchant-proposed Cart changes" (opened 15 Aug 2026, open, 15 comments), PR #773 (implementation, label gov:needs-tc-review), draft PR #918, issue #845 (accepted-terms handoff), and the prototype repo `arjun2075/ucp-offer-v0`.
- Recent statement, `primary`, 9 Oct 2026: "A concrete buyer proposal → seller counteroffer → Cart application → Checkout example would be useful for identifying which parts #738 can cover and which belong in the negotiation/handoff work." - https://github.com/Universal-Commerce-Protocol/ucp/issues/738#issuecomment-6087028190
- Same comment, on scope: "#738 currently represents a Business-proposed Cart transition; it doesn't define those negotiation states or arbitrary changes to shipping, payment terms, or other commercial conditions."
- Also 9 Oct 2026, on sponsored offers (relevant to "ad = offer"): two Offers "that are commercially identical in price and line items but differ only in *who proposed them and why* (e.g. ordinary merchant merchandising vs. a paid/sponsored placement) produce the same digest." - https://github.com/Universal-Commerce-Protocol/ucp/issues/738#issuecomment-6077491198
- On vendor extensions, 10 Sep 2026: "UCP already permits vendor-defined capabilities to be published in a Business profile with their own spec/schema. A compatible buyer agent would still need to advertise support for that capability/version before it could be negotiated" - https://github.com/Universal-Commerce-Protocol/ucp/discussions/502
- Public channels: GitHub `arjun2075` and the issue threads. No X handle, site or email on his profile.
- Relation: **standard_setter** (individual contributor, not council). Reachability: high inside the thread (he thanked a first-time reviewer and changed the PR the same day, 28 Aug 2026).
- One ask: "Would a seller-proposed non-price term (free express shipping, longer return window) fit Offer v0 as a Cart/fulfillment change, and may I contribute a test vector backed by a real Shopify single-use discount code?"

### 1.3 Yang W. - Founder, StabileRewards (San Francisco)

- Role, `primary`: GitHub profile `yangw831`: name "Yang W.", company "StabileRewards", location "San Francisco", bio "Founder, StabileRewards: loyalty for Shopify merchants in AI-assisted shopping", profile updated 2026-10-09 - https://github.com/yangw831 . Full surname is not published.
- What they control: a Shopify loyalty app whose rewards are redeemable by agents (ChatGPT app, remote MCP connector); the only public end-to-end test of an agent minting a Shopify code that then applied at checkout (R6 section 1.9); UCP discussions #856 and #863.
- Recent statement, `primary`, 25 Sep 2026: "How does a loyalty provider reach a platform-hosted profile? When the platform hosts the business profile (as Shopify does for every store), what is the intended path for a third-party loyalty program's data to appear in its cart and checkout responses: a platform-level extension point, the Provider participant type proposed in issue #384, or something else?" - https://github.com/Universal-Commerce-Protocol/ucp/discussions/863 (still "0 comments" on 13 Oct 2026). Same post: "Because Shopify hosts the profile, a merchant's loyalty app has no way to add the extension or populate the loyalty map itself."
- Public channels: GitHub `yangw831`; company contact published on the site: [EMAIL REDACTED]; X `@stabilerewards`; LinkedIn company page https://www.linkedin.com/company/113454174/ . Blog is active (latest post dated October 8, 2026).
- Company classification: **complement / possible partner**. Stabile gives next-order credit; OfferAd gives an at-decision offer. "Credit on the next order" is on OfferAd's own concession list, so one could be the other's concession type. Same blocker, same city.
- Reachability: high. Solo founder in San Francisco with an unanswered public question.
- One ask: "I hit the same wall with offers that you hit with loyalty; can I add my use case under your discussion #863 so the question to Shopify carries two apps, and compare notes over coffee in SF?"

### 1.4 Ben Ouattara - Founder, Flux (FLUXAI GROUP HOLDINGS LTD, UK)

- Role, `primary`: "Flux is founded by Ben Ouattara. Based in the United Kingdom." - https://withflux.co.uk/llms.txt ("Last updated: 7 October 2026."). And "Ben Ouattara, Founder of Flux" - https://withflux.co.uk/company/about (fetched 13 Oct 2026).
- What he controls: the closest live product to OfferAd: Shopify app (launched June 2026), "Negotiate with Flux" ChatGPT app, Claude MCP connector, vendor-namespaced UCP profile `com.withflux.negotiate`, single-use code handoff. Price-only, needs a Flux ID sign-in, no competing-link proof, no non-price terms.
- Recent statement, `primary`, 7 Oct 2026: "Flux works the same way for an AI agent as it does for a person. An AI shopping assistant can negotiate against a Flux store on a shopper's behalf, reach a deal inside the merchant's rules, and receive a real, working discount code for checkout — autonomously." and "The AI is a negotiator, not a cashier. It talks, reads intent, and closes — but the final price and the discount code are calculated by Flux's server against the vendor's own rules, never by the language model." - https://withflux.co.uk/llms.txt
- Public channels: published addresses on the site: [EMAIL REDACTED], [EMAIL REDACTED]; "Apply to partner with Flux" on https://withflux.co.uk/company/partners ; LinkedIn company page https://www.linkedin.com/company/with-flux . I found no personal X or LinkedIn profile for him (one web search returned nothing relevant).
- Company classification: **competitor** (direct). A partnership is conceivable only if scopes are split (he keeps price haggling, OfferAd does verified price-match and non-price terms), and he has every reason to build those himself.
- Reachability: medium. Small company with a published partner address, but a note from a direct competitor gets a guarded answer. Sharing the idea in detail carries a real risk.
- One ask: "Do the acting agents (Muse, Dots, Grok Bot) complete your Flux ID sign-in in practice, or only ChatGPT and Claude users with the connector installed? I can share what I measured on Shopify's 13-tool surface in return."

### 1.5 Weston (surname not published) - Founder and CEO, Facet (San Francisco)

- Role, `primary`: GitHub profile `westonale`: name "Weston", company "Facet", location "San Francisco, CA", bio "Founder, CEO of Facet. The UCP checkout for every store. Author of x402-direct with cancelation & refunds.", profile updated 2026-09-02 - https://github.com/westonale . Company site https://facet.llc/ ("Facet: agentic commerce, a second checkout for AI agents").
- What he controls: a UCP checkout and a business directory for stores that are not on a UCP platform (WooCommerce adapter), agent identity token ("Facet KYA"), `agents.txt` advertising of payment rails. He was the first substantive reviewer of the UCP Offer extension.
- Recent statement, `primary`, 28 Aug 2026: "Keep the three failure reasons distinct in the response. Source state moved, Offer expired, and Business can no longer honor are all "invalid" under the conjunctive rule, but an agent does something different in each case: refetch and re-request, drop it, or surface it to the buyer." - https://github.com/Universal-Commerce-Protocol/ucp/issues/738#issuecomment-5454508286
- Public channels: GitHub `westonale`; X `@Westonale` (on his GitHub profile) and `@facetllc`; public community links on facet.llc (Slack invite, r/FacetAgentCommerce).
- Company classification: **complement**. Facet is the checkout and directory for non-Shopify stores; OfferAd is the offer. Facet's directory is a discovery surface that Shopify does not give apps.
- Reachability: high. Early-stage, same city, engages with strangers' proposals in public.
- One ask: "Would Facet's directory listing schema take an optional 'offer endpoint' field, so an agent shopping the directory can ask a store for a conditional offer before checkout?"

### 1.6 Juan Fernández - Product Manager, Shopware Agentic Commerce Lab

- Role, `primary`: GitHub profile `juanferrub`: name "Juan Fernández", company "Shopware", bio "Product Manager at Shopware's Agentic Commerce Lab", profile updated 2026-08-17 - https://github.com/juanferrub . The lab's GitHub org `agentic-commerce-lab` publishes `SwagUcp` (Shopware 6 UCP plugin).
- What he controls: the only platform-shipped negotiation-like UCP vendor extension (`com.shopware.quote`, cited in UCP #929 as live), and Shopware's position in the UCP threads.
- Recent statement, `primary`, 10 Sep 2026: "Strong +1 from Shopware. We are actively working on B2B agentic commerce and have implemented RFQ/quote workflows as a vendor extension. In our experience, a buyer agent needs a discoverable way to know that a Business accepts offers and a structured flow for propose / counter / accept / reject—not just a discount code or an eventual checkout URL." and "We would support an optional UCP negotiation capability that a Business can advertise, with the Business retaining control over whether negotiation is automated, escalated to a human, or unavailable." - https://github.com/Universal-Commerce-Protocol/ucp/discussions/502
- Public channels: GitHub `juanferrub`; the #502 and #812 threads. No X handle on his profile.
- Company classification: **possible partner / standard ally**. Shopware is a platform that lets a vendor extension into the store profile, which is the thing Shopify does not. A Shopware plugin version of OfferAd would be the place where idea E (a real `com.offerad.*` extension) can be shown working.
- Reachability: medium. Platform PM in Germany; reachable in the thread.
- One ask: "Is the `com.shopware.quote` schema free to reuse, so my Shopify-side endpoint can speak the same propose / counter / accept shape and the two become one interoperable example for UCP?"

### 1.7 Tomas Taylor - author of ACP "Intent Traces"; San Francisco; now building Pennant

- Role, `primary`: "I'm Tommy. I'm a programmer and entrepreneur with a knack for artificial intelligence, blockchain technology, and financial markets. I'm based in San Francisco, but South London is home." and "Today I'm building Pennant." - https://totaylor.com/ (footer "© 2026 Tomas Taylor", fetched 13 Oct 2026). Pennant is "The World Model for Corporate Governance" (https://www.getpennant.ai/), so commerce protocols are not his day job. Authorship, `primary`: pull request title "[SEP] Intent Traces: Structured cancellation context for checkout sessions by 0xtotaylor · Pull Request #54", opened 17 Dec 2025, merged - https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/pull/54
- What he controls: nothing formally (he holds no ACP seat that I could confirm). He wrote the only merged spec text that names OfferAd's missing message.
- Statement, `primary`, RFC version dated 2025-12-16 (older than six months; nothing newer found): "This specification lays the groundwork for merchants to transition from probabilistic retargeting (guessing) to deterministic negotiation (bidding)." and "Future extensibility: A subsequent RFC MAY define **Reconsideration Offers** keyed to specific reason codes." - https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/rfcs/rfc.intent_traces.md
- Public channels: site https://totaylor.com ; X `@0xtotaylor`; GitHub `0xtotaylor`; LinkedIn https://www.linkedin.com/in/tomastaylor (link from his own site; page not fetched).
- Relation: **connector / standard ally**. Reachability: medium. His site says he is "focused on excitingly ambitious projects, new experiences, and paying it forward" and that he competes in hackathons; he lives in the same city; but he runs an unrelated startup.
- One ask: "Your Intent Traces RFC says a later RFC may define Reconsideration Offers; are you writing it, and if not, would you read a one-page draft from me before I open it as a SEP?"

### 1.8 Sammy Isseyegh (with Dave Spanton) - co-founders, Discount Kit (Optizio Ltd, England and Wales)

- Role, `primary`: "Sammy Isseyegh / Co-founder" and "Dave Spanton / Co-founder" under "Core team - Together since 2020" - https://discountkit.app/about/ (footer "© 2026 discount kit · Optizio Ltd · registered in England and Wales · company no. 12912929", fetched 13 Oct 2026).
- What they control: one of the best-regarded discount engines on Shopify ("We write our discount functions in Rust"; "Discount Kit is a 2026 Shopify Build Award winner", news item dated Jul 21, 2026; "one of Shopify's Top 25 Built for Shopify apps", Jul 7, 2026). They know exactly what one Discount Function can and cannot combine, which is the unproven part of OfferAd's settlement (R6: "Nobody found uses a Discount Function keyed to a code to combine product + shipping + gift effects").
- Recent statement, `primary`, 2 Jul 2026 (developer extensibility, not agents): "Your storefront, broadcasting: every promotion published to metafields the moment it changes — no API calls, no theme surgery." - https://discountkit.app/resources/introducing-discountkit-live/ . Their docs are also served to agents: "The discountkit documentation is available as a remote MCP server, so your AI editor can search and read these docs directly." - https://discountkit.app/docs/ai-tools/ . I found no statement from them about shopping agents or UCP.
- Public channels (all linked from their own About page): X `@SammyIsseyegh`, GitHub `bkspace`, LinkedIn https://www.linkedin.com/in/sammyisseyegh/ ; Dave Spanton X `@megastoat`, GitHub `davespanton`; company X `@DiscountKit`; a public "Book a call" calendar link on the About page ("The core team is always around for a chat.").
- Company classification: **possible partner (settlement layer)**. Not a competitor: they do rule-based promotions for humans. Promotions already published to product metafields are data that Shopify's own catalog tools can return to agents, which is OfferAd idea B(ii) with a partner who already ships it.
- Reachability: high. Small team that publishes a call link and names itself.
- One ask: "Can one Discount Kit function keyed to a single code apply a product discount, a shipping discount and a zero-priced gift line together, and would you let another app create such codes through an API?"

### 1.9 Tobe Osakwe - Founder and CEO, Regios Technologies, Inc. (Regios Discounts)

- Role, `primary`: "Regios was founded by Tobe Osakwe, an ex-Google software engineer who left to build tools for independent merchants." and "Tobe Osakwe / Founder & CEO" - https://regiostech.com/about (footer "© 2026", fetched 13 Oct 2026).
- What he controls: Regios Automatic Discounts on Shopify Functions ("4.9 stars · 208 reviews · Built for Shopify certified"; "2,000+ merchants"), a flowchart-style logic builder on customer tags, order history, cart totals.
- Recent statement: none found on agentic commerce, agents, UCP or MCP (I searched his home page and blog index). The only quotable line is about reachability: "If you're wrestling with a discount Shopify can't handle, reach out. I read every message." - https://regiostech.com/
- Public channels: LinkedIn https://linkedin.com/in/tobebuilds (linked from his About page; not fetched); the contact page on regiostech.com.
- Company classification: **possible partner (settlement layer)**; same reasoning as Discount Kit. The site footer says "California, United States" but that sits next to template placeholder text, so his location is **unverified**.
- Reachability: high by his own statement.
- One ask: "Would Regios accept a single-use code created by another app and turn it into a multi-effect discount (product + shipping + gift) through your Function, so I do not have to spend one of a store's 25 function slots on my own?"

### 1.10 Jiaxin Pei - Assistant Professor, UT Austin; Research Fellow, Stanford HAI

- Role, `primary`: "Assistant Professor at UT-Austin, Research Fellow at Stanford HAI" and "I am currently an Assistant Professor in Information Science at UT-Austin's School of Computing ... I am also an affliated research fellow at Stanford Institute for Human-Centered Artificial Intelligence (HAI) and Stanford Digital Economy Lab." - https://jiaxin-pei.github.io/ (undated page that refers to "Fall 2026"; fetched 13 Oct 2026). Location line: "Austin & Palo Alto".
- What he controls: the best-known benchmark of consumer agent-to-agent negotiation ("The Automated but Risky Game", arXiv 2506.00073, with Shenzhe Zhu, Jiao Sun, Yi Nian, Tobin South, Alex Pentland; code at github.com/ShenzheZhu/A2A-NT) and a research line he lists first: "1. Economics of AI Agents / Agentic Economy".
- Recent statement, `primary`, same page: "If you are an investor, founder, or industry partner interested in collaborating or sponsoring, I would love to connect — please reach out!" The negotiation paper itself is from 29 May 2025 (older than six months); his 2026 papers are on agent cost, multi-user agents and deliberation, not commerce negotiation.
- Public channels (all on his own page): email [EMAIL REDACTED] (self-published), X `@jiaxin_pei`, LinkedIn https://www.linkedin.com/in/jiaxin-pei-632b07147/ , GitHub `jiaxin-pei`.
- Relation: **connector / credibility** (researcher). Reachability: medium to high; he invites industry partners, but the invitation is tied to his course.
- One ask: "Would your group want a live Shopify test store where a code-enforced seller answers real buyer agents, as a field setting for the A2A negotiation benchmark?"

### 1.11 Scot Wingo - Co-founder and CEO, ReFiBuy; writes Retailgentic

- Role, `primary`: "Scot Wingo / Co-founder CEO - Scot is a serial entrepreneur with deep eCommerce experience, founding four startups, including ChannelAdvisor (IPO 2013)" - https://www.refibuy.ai/about (fetched 13 Oct 2026). And "Welcome to Retailgentic, a substack and accompanying podcast written by Scot Wingo and provided by the ReFiBuy Media Network." - https://www.retailgentic.com/about
- What he controls: the most-read running commentary on agentic commerce for retailers, with interviews roughly weekly (1 Oct 2026: Stripe's Global Agentic Commerce Solutions Lead; 3 Sep 2026: FERMÀT's CEO). ReFiBuy sells catalog optimisation for agents (reported $13.6M seed, `secondary`: retailtechinnovationhub.com, 5 May 2026).
- Recent statement, `primary`, 15 Sep 2026: "In the last two weeks we have seen an entirely new category of Agentic Commerce come seemingly out of nowhere that we call Personal Agents - these are horizontal agents meaning they do many more activities, such as email, calendaring, event planning, travel booking, but they do all anchor on and tout their Agentic Commerce capabilities." - https://www.retailgentic.com/p/part-1-of-2-state-of-agentic-commerce . I found no statement by him on seller offers or negotiation with agents.
- Public channels: the Retailgentic Substack (comments and replies), YouTube channel `@Retailgentic`. I did not verify his X or LinkedIn handles today.
- Company classification: **complement** (ReFiBuy optimises what agents read; OfferAd changes what the seller offers). Person: **connector to others**.
- Reachability: medium. He covers new entrants and runs demos of Muse and Dots himself, but a cold note competes with a lot of inbound.
- One ask: "Would you watch a two-minute recording of a Shopify store answering a personal agent with a verified price-match offer and tell me whether merchants you talk to would want it?"

### 1.12 Francesco Marinoni Moretto - independent author and developer (Milan); `ucp-probe`; speaking in San Jose on 23 Oct 2026

- Role, `primary`: GitHub profile `frmoretto`: name "Francesco Marinoni Moretto", location "Milan, Italy", bio "Agentic commerce: how AI agents discover, read and buy from merchants. Author of Selling to Agents (2026) and the LAR working paper.", profile updated 2026-10-04 - https://github.com/frmoretto . Book site: "Author Francesco Marinoni Moretto" - https://www.sellingtoagents.com/ . No employer is listed; treat as independent.
- What he controls: an open-source, unaffiliated probe of live Shopify UCP endpoints (`frmoretto/ucp-probe`: "Field report: how far an unsigned, anonymous agent gets on a live Shopify store via UCP/MCP"), a merchant-side book, and a slot in the AGNTCon Agentic Commerce track.
- Recent statement, `primary`, conference abstract for Fri 23 Oct 2026, 4:05 to 4:30 PM, room 210C: "Most discussion of agentic commerce takes the platform's side. This talk takes the merchant's." and "Reading is free; spending is not." - https://events.linuxfoundation.org/agntcon-mcpcon-north-america/program/schedule/?id=1253224
- Public channels: GitHub `frmoretto`; site https://www.sellingtoagents.com with a published contact address [EMAIL REDACTED].
- Relation: **connector / independent builder**. Reachability: high. Independent, 47 GitHub followers, travelling to the Bay Area for the talk.
- One ask: "Would you point ucp-probe at my development store with the OfferAd app installed and tell me whether an unaffiliated agent notices the offer at all?"

---

## 2. Other people and companies checked (not in the top 12)

| Name / company | What I confirmed today | Classification | Why not in the top list |
|---|---|---|---|
| Sparsh (`isparsh510`), Google London | `primary`: GitHub bio "Software Engineer III @Google London", profile updated 2026-10-13. Author of UCP #929 Quote extension (11 Oct 2026); he pinged three reviewers the same day. https://github.com/isparsh510 | standard_setter | Belongs to the protocol-groups scope; comment on #929 is the route. |
| "Matt" (`vcello`) | `primary`: GitHub name "Matt", no company. Author of UCP #384 Provider + offer discovery. | standard ally | Identity and affiliation unverified. |
| Rosie Bailey, Nibble | `primary`: "Nibble CEO Rosie Bailey" - https://nibbletechnology.com/llms.txt (fetched 13 Oct 2026). | competitor in the adjacent segment (now procurement-first) | Enterprise, London, no agent-facing ecommerce surface. |
| Laurens Van Wiele, Talon.One | `primary` but dated: byline "Laurens Van Wiele / Chief Product Officer" on "Incentives in the agentic future: Introducing the Unified Incentives Protocol", 23 Jan 2026 - https://www.talon.one/blog/introducing-the-unified-incentives-protocol . Product page today: "The Unified Incentives Protocol (UIP), introduced by Talon.One, is a new set of platform-agnostic standards designed to surface promotions and loyalty incentives across AI agent-based shopping experiences." | complement (enterprise promotions engine with UCP loyalty and promotions extensions) | Role source is nine months old; the site now leads with "The next chapter for Talon.One and Adyen", so the organisation may have changed. Enterprise sales motion; low reachability for an individual. |
| ChatCast (Comet Rocks GmbH, Berlin) | `primary`: "Operated by Comet Rocks GmbH · Cuvrystrasse 1, 10997 Berlin"; contact [EMAIL REDACTED] - https://chatcast.io/about | competitor on discovery, opposite incentive (pays the agent operator, not the buyer) | Founders are not named anywhere on the site: **unverified**. |
| Nekuda | `primary`: site headline "Make Your Website Actionable For Agents"; open-source `nekuda-ai/webmcp-kit` and `nekuda-ai/WindTunnel` ("A WebMCP benchmark"); GitHub org email [EMAIL REDACTED], X `@nekuda_ai`. | complement (WebMCP tooling; a directory at webmcp.com) | Named leads (Ayal Karmi, Dean Harel) not re-verified today (GitHub API rate limit); R6 has them as secondary. |
| Alex Nahas, MCP-B | `primary`: GitHub `MiguelsPizza`, company "MCP-B", Seattle; site: "MCP-B helped inspire the WebMCP spec." https://mcp-b.ai/ | complement (WebMCP polyfill and consulting) | WebMCP scope; Seattle. |
| Jason McGhee | `primary`: GitHub bio "CTO @ Writ.", San Francisco; repo `jasonjmcghee/WebMCP` "Early WebMCP proposal / implementation". | independent developer | No longer active on WebMCP by his own repo description. |
| ZeroClick (Ryan Hudson) | `primary` for the company only: "Today we're officially launching ZeroClick: the platform for selling to agents ... turning your offerings into agent-purchasable services" (21 Jul 2026, byline "ZeroClick Team") - https://www.zeroclick.ai/blog/its-time-to-sell-to-agents | was "ads inside AI answers" (2025), now x402/MPP storefronts for APIs and services | Ryan Hudson's current role is **unverified** today (only 2025 press names him). Product no longer overlaps with Shopify offers. |
| ReFiBuy co-founders Cameron Bowe (CTO), James Frawley (CAIO) | `primary`: https://www.refibuy.ai/about | complement | Wingo is the route. |
| Baishali Chaudhury et al. | `primary`: author list of "Persuadable Agents" on https://neurips.cc/virtual/2026/176559 | researchers (evidence for "limits in code") | Affiliations not shown on the page: **unverified**. |
| Raymond Xu | `primary` (Luma host record): hosted "Agentic commerce meetup", San Francisco, 23 Aug 2026, "A free flowing discussion in the park on all of the new action on agentic commerce"; host links X `@needhelptho`, site talkshi.com - https://luma.com/7ovs6mt4 | local organiser | Role and employer unverified; one event, ten guests. Worth following for a repeat. |
| Nathan Booker, Runtype | `secondary` (foundercal listing of a Luma event): "Nathan Booker, Chief Product Officer, Runtype"; organised "Selling to Agents: Cloudflare x Stripe x Runtype", 5 Oct 2026, Cloudflare SF office. | local organiser | About selling software to coding agents, not retail. |

Company classification, summary:

- **Competitors (same job on Shopify):** Flux (price haggling with agents; cross-store connector), I Want That! / Vector (customer- and agent-submitted offers). Neither verifies a competing link, and neither makes seller-initiated non-price offers.
- **Competitor with the opposite incentive:** ChatCast (commission to the agent operator).
- **Complements:** StabileRewards (next-order credit via agents), Facet (checkout and directory outside Shopify), ReFiBuy (catalog optimisation), Nekuda and MCP-B (WebMCP tooling), Talon.One (enterprise promotions with UCP extensions), competitor-price trackers on the App Store (Prisync, Price Parrot, PriceOtus: they monitor competitor prices for merchants; none verifies a buyer-supplied link, per their listings' descriptions).
- **Possible partners for the settlement layer:** Discount Kit, Regios (also on the App Store: SupaEasy by Nextools, Function Studio, Function Junction, Kite; not researched to person level).
- **Possible partner as a proving ground:** Shopware Agentic Commerce Lab (a platform where a vendor extension can enter the store profile).
- Fresh App Store searches today ("price match", "competitor price match", "ai agent offers", "agent discount", "agentic offers") returned no new app that makes offers to buyer agents beyond those in R6, and no app that verifies a competitor link.

---

## 3. Venues

### 3.1 AGNTCon + MCPCon North America (Agentic AI Foundation / Linux Foundation)

- `primary`: "AGNTCon + MCPCon North America: The AI Agents Conference - October 22-23, 2026 - San Jose McEnery Convention Center" - https://events.linuxfoundation.org/agntcon-mcpcon-north-america/
- Track, `primary`: "The Agentic Commerce track covers what happens when AI agents start shopping, selling, and paying on behalf of people and businesses." - https://events.linuxfoundation.org/agntcon-mcpcon-north-america/program/explore-the-tracks/
- Sessions, `primary` (schedule page fetched 13 Oct 2026):
  - Thu 22 Oct, 4:40 to 5:05 PM, LL20C: "Universal Commerce Protocol" panel, speakers "Ilya Grigorik, Amit Handa, Greg Smith" - "A panel discussion with Technical Council members and stewards of UCP."
  - Thu 22 Oct, 12:10 to 12:55 PM: lunch topic tables, "Topic 1: Agentic Commerce" ("These informal gatherings are open to anyone.").
  - Fri 23 Oct, 10:55 to 11:20 AM, 210C: "Architecting Agentic Commerce: The Universal Commerce Protocol and Agent Payments Protocol" (Amit Handa, Prateek Dudeja).
  - Fri 23 Oct, 4:05 to 4:30 PM, 210C: "Reading is Free, Spending is Not" (Francesco Marinoni Moretto).
  - Also: a WebMCP keynote by Sarah Drasner (Chrome) and a session by Andrew Nolan, described there as "co-creator of WebMCP and chair of the Agentic AI Foundation's Applied Industries Committee".
- Prices, `primary`: "Attendee $925", "1-Day Pass $475* *Choose Thursday or Friday", "Expo + Party Pass $149", "Academic $149" - https://events.linuxfoundation.org/agntcon-mcpcon-north-america/register/
- Steps: buy the Thursday one-day pass; sit at the Agentic Commerce lunch table; attend the 4:40 PM UCP panel and ask the one question in section 4; on Friday (if a second day is affordable) attend Moretto's talk. Buying a ticket is the owner's decision; I registered for nothing.

### 3.2 UCP GitHub Discussions and the four live threads

- `primary`: the UCP README lists one community channel: "Questions & Discussions: Join our GitHub Discussions" - https://github.com/Universal-Commerce-Protocol/ucp/discussions . I found no community call, Slack or Discord in the README; CONTRIBUTING.md returned 404 at the path I tried.
- Threads: #502 "A Buyer's Agent Should Negotiate" (Ideas; 4 comments, 6 replies); #738 Offer extension (updated 10 Oct 2026); #863 platform-hosted profiles (0 comments); #929 Quote extension (opened 11 Oct 2026); #384 Provider + offer discovery.
- Steps: post one concrete worked example (the one Arjun Garg asked for on 9 Oct) as a comment on #738 with a link from #502; add the OfferAd use case under #863.

### 3.3 ACP SEP process (for "Reconsideration Offers")

- https://github.com/agentic-commerce-protocol/agentic-commerce-protocol - the Intent Traces RFC is merged and explicitly leaves room for a follow-up RFC. Steps: open a discussion or SEP issue referencing `rfcs/rfc.intent_traces.md` line "A subsequent RFC MAY define Reconsideration Offers". Who can sponsor it is the protocol-groups task's question.

### 3.4 Bay Area events, October to December 2026

| Date | Event | Where | Source | Fit |
|---|---|---|---|---|
| 22 to 23 Oct | AGNTCon + MCPCon North America | San Jose McEnery Convention Center | `primary` (3.1) | Best. |
| 2 Nov, 2:30 PM | AgentCamp: An AI Agent Unconference (part of TechEquity Ai Summit) | 135 Constitution Dr, Menlo Park | `secondary`: https://foundercal.com/events/agentcamp-an-ai-agent-unconference-MXmjCA90jWBTPGq | Attendees propose sessions ("4:00 pm Session Proposals (Accept up to 12 sessions)"); a "seller offers for buyer agents" session can be proposed on the day. Not commerce-specific. |
| 11 Nov | Stripe Startups Build Day San Francisco | South San Francisco | `primary`: https://luma.com/r1d48cpq ("book 1:1 consultation time with Stripe experts"; "Demos of Stripe's latest products") | Aimed at "a curated group of venture-backed founders"; a side-project engineer may not be admitted. |
| 19 Nov | Agentic + AI Night: AI Agents Across the App Stack | San Francisco | `secondary` (foundercal listing) | General agents meetup. |
| past: 23 Aug | Agentic commerce meetup (Raymond Xu) | San Francisco, in a park | `primary`: https://luma.com/7ovs6mt4 | Follow the host for a repeat. |
| past: 3 Oct | The AI Commerce Gallery - Hackathon (ZooWork × AI Valley) | Walt Disney Family Museum, SF | `primary`: https://luma.com/6bbloggr | Watch https://luma.com/aivalley ; its upcoming list today has no commerce event. |
| past: 5 Oct | Selling to Agents: Cloudflare x Stripe x Runtype (SF Tech Week) | Cloudflare SF office | `secondary` (foundercal) | Series may repeat. |
| past: 6 Oct | Agentic Now & Agentic Next - Mastercard in SF | San Francisco | `secondary` (foundercal) | Mastercard "Agentic Commerce & Service Start Path partnerships program" was presented there. |

I paged through Luma's public San Francisco discover feed (67 featured events through January 2027) and foundercal's SF pages: nothing dated November or December 2026 has "commerce", "shopping", "Shopify" or "checkout" in its title.

### 3.5 Direct company doors that are published

- Flux: "Apply to partner with Flux" and [EMAIL REDACTED] - https://withflux.co.uk/company/partners
- Discount Kit: public "Book a call" link - https://discountkit.app/about/
- Regios: contact page, "I read every message" - https://regiostech.com/
- Facet: public Slack invite and subreddit linked from https://facet.llc/
- StabileRewards: [EMAIL REDACTED] on https://www.stabilerewards.com/

---

## 4. Public positions worth quoting back (exact, with date)

1. Arjun Garg, 9 Oct 2026: "A concrete buyer proposal → seller counteroffer → Cart application → Checkout example would be useful for identifying which parts #738 can cover and which belong in the negotiation/handoff work." (UCP #738)
2. Chris Daly, 8 Jun 2026: "A Buyer's Agent represents the interests of the buyer, not the seller, and that should include the ability to negotiate terms, pricing, shipping/delivery, etc." (UCP discussion #502)
3. Juan Fernández, 10 Sep 2026: "a buyer agent needs a discoverable way to know that a Business accepts offers and a structured flow for propose / counter / accept / reject—not just a discount code or an eventual checkout URL." (UCP discussion #502)
4. Yang W., 25 Sep 2026: "Because Shopify hosts the profile, a merchant's loyalty app has no way to add the extension or populate the loyalty map itself." (UCP discussion #863)
5. Tomas Taylor, RFC dated 16 Dec 2025: "A subsequent RFC MAY define **Reconsideration Offers** keyed to specific reason codes." (ACP rfc.intent_traces.md)
6. Flux, 7 Oct 2026: "the final price and the discount code are calculated by Flux's server against the vendor's own rules, never by the language model." (withflux.co.uk/llms.txt)
7. Sparsh (Google London), issue body dated 11 Oct 2026, re-read today from the GitHub API: "It is a one-quotation-at-a-time loop, not a negotiation protocol: no revisions, no multi-party mechanics, no non-price terms, and nothing about how a Business decides." and, among what it leaves out, "A Business answer of the form "not at that price, but take two and I will" is a proposed Cart transition and belongs to #738/#773." (UCP #929, https://github.com/Universal-Commerce-Protocol/ucp/issues/929 ; open, 2 comments)

The one question for the UCP panel on 22 Oct, built only from the above: "Stabile asked in discussion #863 how a third-party app's data reaches a Shopify-hosted profile and has no answer after three weeks; is the intended path a platform extension point, the Provider participant in #384, or neither?"

---

## 5. What I could not confirm

- Ben Ouattara: no personal X, LinkedIn or GitHub profile found; only company addresses. His "ex-Microsoft" background rests on his own About page headline ("Left Microsoft.").
- Weston (Facet) and Yang W. (Stabile): surnames are not published on the pages I read.
- Arjun Garg: title and team at Intuit; whether Intuit backs the proposal or it is personal work.
- Tobe Osakwe: location; any view on agents.
- Scot Wingo: his X and LinkedIn handles (not fetched); any statement on seller offers or negotiation.
- Jiaxin Pei: whether the negotiation line of work continues in 2026 (his 2026 papers are on other agent topics).
- ChatCast founders; Ryan Hudson's current role at ZeroClick; Nekuda's named leads; authors' affiliations for "Persuadable Agents"; Gagan Bansal's current page at Microsoft Research (URL returned 404).
- Talon.One: whether Laurens Van Wiele is still CPO (source dated 23 Jan 2026) and what "the next chapter for Talon.One and Adyen" means for ownership.
- LinkedIn profiles: none fetched; every LinkedIn URL above is a link printed on the person's own page.
- Whether any Shopify agency takes co-build work on Discount Functions for agent use: I verified two product studios, no agencies.
- Whether a Shopify-run developer meetup exists in San Francisco this quarter: shopify.com/events returned 404 and web search found only old listings.
- Events after mid-November: aggregators list little that far out; re-check in two weeks.
- GitHub's unauthenticated API rate limit cut off two lookups late in the session (ACP PR #54 JSON, one user profile); I used the public HTML page for PR #54 instead.

---

## 6. Raw files

All under `/Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/docs/g5/`: `flux-llms.txt`, `flux-about.html`, `flux-partners.html`, `flux-contact.html`, `iwt-home.html`, `stabile-home.html`, `stabile-blog.html`, `facet-home.html`, `totaylor-home.html`, `pennant.html`, `gh-*.json` (GitHub profiles), `ghs-*.json` (GitHub repository searches), `ucp-738.json`, `ucp-738-comments.json`, `ucp-929.json`, `ucp-929-comments.json`, `ucp-d502.html/.txt`, `ucp-d863.html/.txt`, `ucp-readme.md`, `ucp-maintainers.md`, `acp-intent-traces.md`, `acp-pr54.html`, `discountkit-*.html`, `dk-ai-tools.html`, `regios-*.html`, `app-*.html` (App Store listings), `apps-*.html` (App Store searches), `pei.html`, `pei-pubs.html`, `refibuy-about.html`, `retailgentic-api.json`, `rg-part1.html`, `rg-part2.html`, `sta-home.html`, `talon-*.html`, `zeroclick*.html`, `nekuda.html`, `mcpb.html`, `chatcast-about.html`, `nibble-llms.txt`, `neurips-176559.html`, `lf-agntcon.html`, `lf-tracks.html`, `lf-schedule.html/.txt`, `lf-register.html`, `luma-*.html`, `luma/p1.json`, `luma/p2.json`, `foundercal-*.html`, `fc-*.html`, `mimetic-*.html`, `rye-landscape.html`.
