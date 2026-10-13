# G4: Google, WebMCP and UCP governance: who controls the missing pieces

Fetched and checked on 13 Oct 2026. Nobody was contacted. Nothing was posted, starred, followed or signed up for. Only public pages and public GitHub API reads.

Raw copies of every page quoted here: `/Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/docs/g4/`

Labels used: **[P]** primary source read today (organisation's own page, the person's own profile or post, a maintainer file, a spec). **[S]** press or other secondary source. **[I]** my inference.

---

## 0. Short version

1. **UCP has an open door for exactly this idea, and it is being decided in the next eight weeks.** Two proposals cover "offer" semantics: the state-bound Offer extension (#738 with PR #773, by an outside author at Intuit) is on the `2026-12-08` milestone and assigned to Greg Smith (Google); the Quote extension (#929 with draft PR #930, filed 11 Oct 2026 by a Google engineer in London) adds a Buyer `proposal` and names "the smallest in-protocol opening that lets a consumer agent make an offer without leaving UCP". Neither has a field for a competing-offer link or a non-price priority. That is the gap OfferAd can speak to with a working implementation.
2. **The governance documents tell an individual builder what to do first: ship under your own namespace.** "Vendors should first create capabilities & extensions in vendor-specific namespace pattern (e.g. com.{vendor}.\*) for new use cases. Requests to add new capabilities and extensions should only be submitted when there is proven widespread adoption". A core "offer" message is a Tech Council majority vote, twice. A working group needs "3+ organizations" and can only be nominated by a Tech Council member.
3. **The council itself says outside contributors "hit a wall"** (minutes, 4 Sep 2026) and that "items without an active implementer behind them are a signal to deprioritize" (18 Sep 2026). So the realistic route is an implementer note on the existing proposals, not a new proposal and not a cold note to a vice president.
4. **WebMCP is run in the open by three editors (two Google, one Microsoft) in a W3C Community Group that anyone can join for free.** The most active triager is Dominic Farolino (Google Chrome). His stated rule for new ideas: "implement it outside the spec, gather experience, and then file focused issues". The group meets every two weeks and face to face at TPAC in Dublin on 27 Oct 2026.
5. **Most reachable person in this scope: Kasper Kulikowski** (Senior Developer Relations Engineer, Google). He writes on his own blog about a user's agent meeting a website-side "harness" that "represents the business", and he wrote "if you try them, please reach out".
6. **Google's Direct Offers has no publicly named product lead.** The only named owners are Vidhya Srinivasan (VP/GM Ads and Commerce) and, for advertiser questions, Ginny Marvin (Ads Product Liaison). Press reports (7 Oct 2026) say the new "Direct Offer" asset settles through single-use promo codes uploaded as a CSV, the same settlement mechanism OfferAd uses.
7. **Role-staleness catch:** Greg Smith joined the UCP Tech Council in April 2026 as "Greg Smith (Amazon)"; the maintainer file moved him to Google on 1 Aug 2026 and gave the Amazon seat to Jordan Williams. Victoria Duggan (Shopify) left the Shopping Tech Council on 15 Sep 2026, replaced by Gil Greenberg. The older note H1 section 7 still lists Duggan.

---

## 1. UCP governance: the exact process

### 1.1 Who decides

Source [P]: `GOVERNANCE.md`, https://github.com/Universal-Commerce-Protocol/.github/blob/main/GOVERNANCE.md (repository last pushed 12 Oct 2026).

- Governing Council (GC): "Responsible for governance, overall health and adoption of the protocol." "Includes a total of 5 members." "Includes 1 permanent member from each founding organization (Google & Shopify) each having 1 vote (total 2 votes)." "Includes 3 elected members from any organization". "Google holds proxy vote for all open seats until Dec 2028 to facilitate rapid early stage growth & adoption of the protocol." "May choose to review and veto a DTC decision or recommendation." "Decisions are made with a majority vote."
- [I] Today the GC has three named members and two open seats, and Google holds the proxy vote for the open seats. So Google controls three of five GC votes.
- Shopping Tech Council: "Responsible for building and maintaining core specification for the Shopping domain." "Includes 16 members, 4 permanent members from each founding organization (Google & Shopify), each with 1 vote (total 8 votes)." "Includes 8 members from any organization, each with 1 vote (total 8 votes)." "Decisions are made with a majority vote." "Members are elected by the GC every 6 months".
- Maintainers: "All code changes require approval from at least one Maintainer."

Source [P]: `MAINTAINERS.md`, https://github.com/Universal-Commerce-Protocol/.github/blob/main/MAINTAINERS.md (last commit 12 Oct 2026, "replace Harsh Mehta with Simon Farrow on Payments Tech Council (#80)").

Governance Council today: Amit Handa (Google), Ilya Grigorik (Shopify), Twum Djin (Stripe), Open, Open.

Shopping Tech Council today (17 rows): Amit Handa\* (Google), Anurag Sinha (Google), Daniel Wyckoff (Shopify), Drew Olson (Google), Gil Greenberg (Shopify), Greg Smith (Google), Ilya Grigorik (Shopify), Imran Hoosain (Etsy), James Andersen (Meta), Jing Li (Google), Jordan Williams (Amazon), Lee Richmond (Shopify), Maxime Najim (Target), Patrick Jordan (Microsoft), Prasad Wangikar (Stripe), Scot DeDeo (Salesforce), Uddhav Kambli (Wayfair). "\* Standing Governing Council (GC) member participating per GOVERNANCE.md rules."

Maintainer file history [P] (GitHub commit log for MAINTAINERS.md):
- 2026-07-31 "docs: replace Greg Smith with Jordan Williams in MAINTAINERS.md (#51)" (row `Greg Smith | Amazon` removed, `Jordan Williams | Amazon` added; commit author Amit Handa).
- 2026-08-01 "docs: update MAINTAINERS list to include Greg Smith and denote Governing Council members (#52)" (row `Greg Smith | Google` added).
- 2026-09-15 "docs(maintainers): replace Victoria Duggan with Gil Greenberg on Shopping Tech Council (#71)".
- ucp.dev announcement of 24 Apr 2026 still reads "Greg Smith (Amazon)" (https://ucp.dev/documentation/announcements/). It is historical, not current.

### 1.2 Route A: a vendor extension such as `com.offerad.offer` (no permission needed)

Source [P]: `CONTRIBUTING.md`, https://github.com/Universal-Commerce-Protocol/.github/blob/main/CONTRIBUTING.md

> "UCP is designed to be extensible while keeping the core protocol light. A core principle of UCP is to ensure that the set of extensions and capabilities defined in UCP have broad ecosystem support. Vendors should first create capabilities & extensions in vendor-specific namespace pattern (e.g. com.{vendor}.\*) for new use cases. Requests to add new capabilities and extensions should only be submitted when there is proven widespread adoption of vendor-specific capabilities and extensions."

> "New features should typically be attempted through the extensions framework first. If an extension achieves significant usage, it can be considered for adoption into the next minor version of the core."

Source [P]: https://ucp.dev/documentation/contributing/ (fetched as index.md today)

> "New capabilities or extensions for vendor-specific or emerging use cases should first be self-hosted under a vendor namespace (e.g., `com.{vendor}.*`; see Namespace Governance) and proposed for adoption into `dev.ucp.*` once there is broad multi-party ecosystem adoption."

Source [P]: UCP specification overview, https://ucp.dev/specification/overview/ (version 2026-08-25)

> "The `dev.ucp.*` namespace is reserved for capabilities sanctioned by the UCP governing body. Vendors **MUST** use their own reverse-domain namespace for custom capabilities."

> "a declared `schema` URL's origin **MUST** match the namespace authority in its name."

> "This binding guarantees **provenance, not trust** ... Whether to negotiate, trust, or implement it is always the client's decision"

> A third-party extension "advertises exact extension versions in Business and Platform profiles and is negotiated by exact-version intersection like every capability."

What this means for OfferAd [I]:
- Nobody has to approve `com.offerad.offer`. The schema must be served over https from `offerad.com` (or a subdomain), because the name is bound to the domain. Whether the owner controls `offerad.com` was not checked.
- The extension only activates when BOTH profiles list it. Shopify generates the store's profile and no buyer agent lists it, so on Shopify today it is a published document, not a working channel. It still counts as the "self-hosted under a vendor namespace" first step that the governance text asks for.

### 1.3 Route B: a core change (an "offer" message in `dev.ucp.*`)

Source [P]: `CONTRIBUTING.md` (same URL)

> "Any significant change to the protocol requires a formal Enhancement Proposal and will require Tech Council (TC) approval."

Significant changes include "Core Schema Modifications", "Protocol Changes", "New API Endpoints: Introduction of entirely new capabilities or services", "Backwards Incompatibility".

Lifecycle, quoted:
> "**Proposal:** Anyone can submit; idea is proposed and debated."
> "**Provisional:** TC majority vote to accept; enters working draft iteration."
> "**Implemented:** TC majority vote to finalize; code complete and merged."

> "Every Enhancement Proposal must follow a standard template requiring sections for a Summary, Motivation, Detailed Design, Risks, a Test Plan, and Graduation Criteria."

The issue form itself [P] (https://github.com/Universal-Commerce-Protocol/.github/blob/main/.github/ISSUE_TEMPLATE/enhancement-proposal.yml; open it at https://github.com/Universal-Commerce-Protocol/ucp/issues/new?template=enhancement-proposal.yml): title prefix "[Proposal]: ", label `enhancement-proposal`, required fields Summary, Motivation, Goals, Detailed Design, Risks and Mitigations ("This is a mandatory section"), Test Plan ("A test plan is required for a proposal to be moved to the \"Provisional\" stage"), Graduation Criteria. Blank issues are disabled.

Step-by-step from ucp.dev [P]:
> "1. **Open the EP Issue First (`Proposal` Phase)**: Before writing full implementation code or opening a mergeable PR, submit the EP Issue. (Optional: You may open a Draft PR linked to the EP Issue ...)"
> "2. **Design Review & Provisional Approval**: Triagers label the EP Issue by functional domain (e.g., `area:shopping` ...) and route it to the relevant Domain Working Group (DWG) and Domain Tech Council (DTC). Once open design questions are resolved, the DTC votes on whether to accept the proposal as Provisional"
> "3. **Submit Implementation PRs (`Provisional` Phase)**"
> "4. **Iterate Toward Graduation** ... the DTC holds a final vote to mark the EP Implemented"

Maturity levels [P]: Working Draft ("Breaking changes expected") then Candidate ("Early adopter implementations, production pilots") then Stable; each step "TC majority vote to advance".

Escalation [P]: "L1: routine changes ... require approval from at least 2 Maintainers." "L2: ... Significant changes affecting core protocol architecture must follow the Enhancement Proposal process, requiring TC approval before implementation." "L3: Any changes made to the Governance process ... or any changes that impact the core protocol's scope or adoption, must be approved by Governance Council (GC)." "The TC reserves the right to stop any discussions deemed non-critical to the protocol."

Contributor licence [P]: "Contributions to this project must be accompanied by a Contributor License Agreement (CLA)." (Google CLA, https://cla.developers.google.com/). Signing a CLA is an action only the owner can take.

"Feature Request vs Enhancement Proposal" [P]: "For new feature suggestions without an implementation plan, please submit a standard \"Feature Request\" issue."

### 1.4 Route C: a Domain Working Group

Source [P]: `GOVERNANCE.md`

> "A group of 3+ organizations can submit a charter to the Governing Council to form a DWG (e.g., \"Travel WG\"). Once chartered, the DWG has autonomy to define capabilities for their domain and submit for DTC approvals."

> "Any DTC member can submit a DWG charter nomination (using the DWG charter template) as a new issue in the UCP Issues tracker." "GC reviews the DWG charter and approves or rejects the DWG nomination." "GC approves chairs/co-chairs for the DWG". "DWG chairs/co-chairs may invite additional industry participants to contribute to the DWG via the DWG charter issue."

> "DWG are subject to DTC oversight - all DWG artifacts must be reviewed and approved by the DTC."

Charter template sections [P] (`DOMAIN_WORKING_GROUP_CHARTER.md`): Problem Statement, Strategic Fit, Scope (In-Scope, Out-of-Scope), Key Deliverables, Deliver By, DTC Sponsors ("DTC name (e.g., Shopping DTC) and proposed Chairs/Co-Chairs").

So [I]: three organisations are needed, the nomination itself must be filed by a sitting Tech Council member, and the Governing Council approves. An individual cannot start one; he can be invited into one by its chairs.

Only existing example [P]: Bulk Product Discovery DWG, charter https://github.com/Universal-Commerce-Protocol/ucp/issues/682, "approved by the Governing Council on 2026-08-07", "Chairs / Co-Chairs: James Andersen (Meta), Vinod Kumar (Meta), Greg Smith (Google), Alex Jansen (Google)", "Target completion: late October 2026" (https://github.com/Universal-Commerce-Protocol/meeting-minutes/blob/main/tc/shopping/dwg/bulk-product-discovery/README.md).

### 1.5 Where discussion happens

- GitHub Issues (EPs, feature requests): https://github.com/Universal-Commerce-Protocol/ucp/issues [P]
- GitHub Discussions, categories Announcements, General, Ideas, Polls, Q&A, Show and tell: https://github.com/Universal-Commerce-Protocol/ucp/discussions [P]
- Public minutes: https://github.com/Universal-Commerce-Protocol/meeting-minutes (Shopping TC weekly on Fridays; latest files 2026-10-02 and 2026-10-09) [P]. "Minutes and meeting notes should be published to the repository within 1 week".
- Mailing list: GOVERNANCE.md says "All communication that is intended to be public ... shall take place on a shared Google group with a mailing list." I could not find the address of that group in the README, the org profile, the contributing page or the minutes repository. Not confirmed that it exists publicly.
- UCP Summit: "32 participants have confirmed attendance for the upcoming Universal Commerce Protocol (UCP) Summit in November" (minutes 2026-10-09 [P]). Invitations went to council members; no public registration found. Location not stated.
- Elections for open Tech Council seats: "every six months, in June and December"; nomination form is shared on the announcement board (https://github.com/Universal-Commerce-Protocol/ucp/discussions/categories/announcements) [P]. Criteria favour an organisation that "represents a large established ecosystem". Not a route for an individual.

### 1.6 The council's own words about outsiders (minutes) [P]

- 2026-09-04: "Amit Handa and Greg Smith acknowledged that the current handling of community pull requests is insufficient, with the majority of work authored and reviewed by the Tech Council itself, and proposed a more responsive framework for incorporating outside contributions." "Ilya Grigorik separately highlighted that first-time contributors unaffiliated with partner organizations currently hit a wall during the contribution process." (https://github.com/Universal-Commerce-Protocol/meeting-minutes/blob/main/tc/shopping/2026/2026-09-04.md)
- 2026-09-25: "Greg Smith emphasized that near-term focus is directed at ensuring high-value community contributions are surfaced to governing bodies rather than enforcing strict response service-level agreements (SLAs) across all submissions." Action item: "Amit Handa: Publish the draft shopping roadmap externally to the community with appropriate disclaimers. (Due: 2026-10-02)". (.../2026-09-25.md)
- 2026-10-02, item "Structured Cart Modifications and State-Bound Offers": "Greg Smith presented a community contribution pull request proposing a structured mechanism for businesses to propose cart modifications and merchant offers bound to specific cart states." "Ilya Grigorik questioned whether cart state binding is necessary and probed whether platforms and agent builders would trust or utilize merchant-recommended products. James Andersen, Greg Smith, Jordan Williams, Julia Downey, and Ilya Grigorik confirmed strong industry demand for personalization, reordering, and upselling (such as phone cases for phone purchases). Greg Smith will carry the topic into Monday's deep dive session to evaluate potential inclusion in the December milestone." Action item: "Greg Smith: Evaluate the structured offer and cart modification community contribution for potential integration. (Due: 2026-10-09)". (.../2026-10-02.md, "Led by: Greg Smith, Amit Handa")
- 2026-10-09 ("Led by: Amit Handa"): no offer item. "Amit Handa congratulated the council on merging pull request 538 for the `ask` capability". "Amit Handa presented pull request 902 proposing the addition of `purpose` and `reference_ids` fields to catalog search to handle item recommendations and product swaps". (.../2026-10-09.md)

### 1.7 The open proposals that touch "offer" (state on 13 Oct 2026) [P]

| Item | Author | State | Why it matters |
|---|---|---|---|
| #738 "[Proposal]: State-bound Offer extension for merchant-proposed Cart changes" https://github.com/Universal-Commerce-Protocol/ucp/issues/738 | Arjun Garg (@arjun2075, GitHub company "Intuit") | open, milestone `2026-12-08`, assignee @gsmith85, 15 comments, updated 10 Oct 2026 | Business proposes a cart change; agent applies it by reference with `apply_offer(cart_id, offer_id, revision)`. Seller-initiated only. |
| #773 PR "feat: add state-bound Offer extension for Cart proposals" https://github.com/Universal-Commerce-Protocol/ucp/pull/773 | same | open, labels `status:under-review`, `gov:needs-tc-review`, `area:shopping` | Carries offers in the Cart `actions` map. |
| #929 "[Proposal]: Quote extension: Business-authoritative quotation binding on Cart and Checkout" https://github.com/Universal-Commerce-Protocol/ucp/issues/929 | "Sparsh" (@isparsh510, GitHub bio "Software Engineer III @Google London") | open, filed 11 Oct 2026, label `area:common` | `dev.ucp.common.quote` with an optional Buyer `proposal` (subtotal and message). Explicit non-goal: "Negotiating anything other than price for the current line items". |
| #930 draft PR for #929 https://github.com/Universal-Commerce-Protocol/ucp/pull/930 | same | draft | Schema plus 17 examples. |
| #845 "[Proposal]: Accepted commercial term handoff into UCP Cart/Checkout" https://github.com/Universal-Commerce-Protocol/ucp/issues/845 | Arjun Garg | open, no reply from the council to the 29 Sep question | Where an outside-negotiated term binds into checkout. |
| #482 PR "feat: add approaching discounts to discount extension" | @sdedeo2025 (Scot DeDeo, Salesforce [I] from handle and council roster) | open, `status:stale` | "$10 off orders over $100" hints. |
| Discussion #502 "A Buyer's Agent Should Negotiate" https://github.com/Universal-Commerce-Protocol/ucp/discussions/502 | Chris Daly (@c-e-daly) | open | A live Shopify "make an offer" app that returns a discount code and checkout URL. Cited by #929 as "A production \"make an offer\" tool". |

Quote from #929 [P], 11 Oct 2026: "Commerce today is unidirectional in UCP: the Business lists a price, the Buyer pays it or applies a code." and "This proposal is that binding, plus the smallest in-protocol opening that lets a consumer agent make an offer without leaving UCP."

Roadmap [P] (https://ucp.dev/documentation/roadmap/): "**Native cross-sell and upsell modules:** Capabilities for businesses to provide personalized recommendations and upsells based on user context."

---

## 2. People: UCP and Google

### 2.1 Greg Smith (Google; UCP Shopping Tech Council)
- Role [P]: row "Greg Smith | Google" in MAINTAINERS.md under Shopping Tech Council (file last changed 12 Oct 2026; his Google row dates from the 1 Aug 2026 commit). Minutes of 2 Oct 2026: "**Led by:** Greg Smith, Amit Handa". Assignee of #738. Co-chair of the Bulk Product Discovery DWG ("Greg Smith (Google)"). Job title not published anywhere I could fetch: unverified.
- Controls: whether the Offer proposal reaches a vote for the `2026-12-08` milestone; triage of community pull requests.
- Channel: GitHub @gsmith85 (profile: name "Greg Smith", location "Seattle, WA", no company, no email). No X or LinkedIn confirmed.
- Recent statement [P], 2 Oct 2026, on PR #773: "@arjun2075 apologies for the delay.  Will discuss at Technical Council tomorrow, stay tuned." https://github.com/Universal-Commerce-Protocol/ucp/pull/773#issuecomment-5943857455
- Reachability: medium. He reads the tracker and answers outside authors, slowly (that reply came about five weeks after the PR). A comment on #738 is the right door; there is no evidence he reads cold direct messages.
- Ask: "On #738: would a short implementer note from a live Shopify app (buyer agent states a priority and a competing-offer link; the store answers with a single-use code) help the December milestone decision, and should it go on #738 or #929?"

### 2.2 Amit Handa (Google; UCP Governing Council; leads Shopping TC meetings)
- Role [P]: "Amit Handa | Google" under Governance Council and, starred, under Shopping, Food and Lodging councils (MAINTAINERS.md, 12 Oct 2026). Title [P, dated]: byline "Amit Handa, Director of Engineering, Google Commerce" on https://developers.googleblog.com/under-the-hood-universal-commerce-protocol-ucp/ (11 Jan 2026). Slides at the W3C/GS1 workshop, 8 Sep 2026: "AMIT HANDA @ GOOGLE FALL 2026" (https://www.w3.org/2026/09/ecommerce-agents/slides/Amit_Handa.pdf). The "Director of Engineering" title was not re-confirmed by a source dated after January 2026.
- Controls: Google's permanent GC vote plus the proxy for open seats; chairs the weekly Shopping TC; announces council changes.
- Channels: GitHub @amithanda. His GitHub profile shows a personal Gmail address; I have left it out of the structured result because the tracker is the stated venue and a personal inbox is the wrong place for a first note. No X or LinkedIn profile confirmed today (search returned no profile of his).
- Recent statement [P], 8 Sep 2026, closing slide of his W3C workshop talk: "Agentic commerce future is still being written" / "Grab a pencil and contribute to UCP - ucp.dev" / "Contribute your feedback, extensions, and code to the public repository."
- Also [P], PR #902 opened by him on 5 Oct 2026: "Platforms and agents need to retrieve complementary recommendations and functional substitutes".
- Reachability: low for a cold note, medium through the tracker. Outside authors do @-mention him on proposals ("Hi @amithanda, could you help route this Enhancement Proposal for initial Shopping Tech Council triage?" on #738) and the proposal did get routed.
- Ask: "Is the draft shopping roadmap you planned to publish (action item due 2 Oct) available, and does it place buyer-requested offers under the Offer proposal (#738), the Quote proposal (#929), or vendor extensions?"

### 2.3 "Sparsh" (@isparsh510; Google, London; author of the Quote extension)
- Role [P]: GitHub profile fetched today: name "Sparsh", company "@google", bio "Software Engineer III @Google London ...", profile updated 13 Oct 2026. Author of #929 and #930 (11 Oct 2026). Not on any council. Surname not shown on the profile; do not guess it.
- Controls: the text of the only UCP proposal with a buyer-side price proposal. He asked three Google reviewers by handle (@damaz91, @jingyli, @niranjanmanjunath) to look at it.
- Channel: GitHub @isparsh510, on the issue itself.
- Recent statement [P], 11 Oct 2026, #929: "Commerce today is unidirectional in UCP: the Business lists a price, the Buyer pays it or applies a code."
- Reachability: high on the issue (two days old, author is actively asking for review).
- Ask: "Would an optional evidence link on the Buyer `proposal` (a competing-offer URL the Business verifies itself) fit the Working Draft of #929, given a Shopify implementation that settles the accepted price as a single-use code?"

### 2.4 Arjun Garg (@arjun2075; GitHub company "Intuit"; author of the Offer extension)
- Role [P]: author of #738, #773, #845; GitHub profile shows company "Intuit", location "US". Outside contributor, not a council member. Employer taken from his own profile only.
- Controls: nothing formally; he owns the text the council is evaluating for December.
- Channel: GitHub @arjun2075, on #738. (His profile also shows a personal Gmail; not used here.)
- Recent statement [P], 9 Oct 2026, #738: "The buyer's initial proposal, negotiation discovery, pending review, rejection, and successive counteroffers would still need a negotiation contract around that."
- Reachability: high on the issue; he answers within a day.
- Ask: "Would a worked example on #738 help: buyer priority and competing link in, state-bound offer out, settled on Shopify as a single-use code and cart link?"

### 2.5 Federico D'Amato (@damaz91; Google, Zürich)
- Role [P]: GitHub bio "Agentic Commerce @google - Working on the Universal Commerce Protocol (UCP)", company "Google", location "Zürich" (fetched today). Author of the governance tooling commits in the `.github` repository (for example 15 Sep 2026 "feat(governance): update governance rules to use domain tech councils (#69)", 1 Oct 2026 "feat(label-sync): add area:common label (#75)"). Not listed on a council.
- Controls: labels, routing rules and PR validation for the organisation, which is how an outside item gets in front of a council.
- Channel: GitHub @damaz91.
- Recent statement: none found about offers or extensibility; his public output is tooling commits.
- Reachability: medium (answers process questions on the tracker). Lower priority than 2.1 to 2.4.
- Ask: "Which label or step puts an outside implementer report in front of the Shopping TC, and is the public mailing list that GOVERNANCE.md mentions open to join?"

### 2.6 Ilya Grigorik (Shopify; UCP Governing Council). Listed here only for his UCP seat; his Shopify role belongs to the Shopify notes.
- Role [P]: "Ilya Grigorik | Shopify" under Governance Council, Shopping TC and (starred) Payments TC, MAINTAINERS.md 12 Oct 2026. GitHub bio: "Building merchant+web platform capabilities to supercharge commerce at @Shopify."
- Controls: Shopify's permanent GC vote; what Shopify's generated store profile lists.
- Channels: GitHub @igrigorik, X @igrigorik (from his GitHub profile), site https://ilya.grigorik.com.
- Recent statement [P, minutes paraphrase, not a direct quote], 2 Oct 2026: "Ilya Grigorik questioned whether cart state binding is necessary and probed whether platforms and agent builders would trust or utilize merchant-recommended products."
- Reachability: low for a cold note (over 9,000 GitHub followers, council chair-level load); medium on a focused issue.
- Ask: "Could Shopify's generated `/.well-known/ucp` list an installed app's vendor capability, as Shopware's profile lists `com.shopware.quote`, even behind a flag?"

### 2.7 Ashish Gupta (Google; VP/GM, Merchant Shopping)
- Role [P]: byline "Ashish Gupta, VP/GM, Merchant Shopping" on https://blog.google/products-and-platforms/products/shopping/google-shopping-updates-holiday-shopping/ dated 16 Sep 2026. Also "VP/GM, Merchant Shopping, and Engineering Fellow" (developers.googleblog.com, 11 Jan 2026). NRF APAC speaker page: "As a Vice President and General Manager in Ads & Commerce, Ashish Gupta leads the Merchant Shopping organization." (https://nrfbigshowapac.nrf.com/speakers/ashish_gupta, undated 2026 page).
- Controls: Merchant Center, the UCP integration hub, Business Agent, loyalty data; the organisation that launched UCP.
- Channels: none personal confirmed. The blog.google author URL I tried returned 404.
- Recent statement [P], 16 Sep 2026: "UCP already enables direct checkout for hundreds of thousands of brands and retailers across Google. Now, merchants who use the hub for UCP-powered checkout can also enable capabilities like cart transfer to a merchant site and enhanced checkout flow testing, with analytics and more coming soon."
- Also [S, podcast transcript read through a summariser], Future Commerce episode 465, 27 May 2026: "the merchant is always the seller of record."
- Reachability: low.
- Better route: Greg Smith or Amit Handa on the tracker; for Merchant Center questions the "Join the waitlist" form on https://developers.google.com/merchant/ucp (a form; only the owner can decide to fill it).
- Ask: "Do Google's shopping agents pass a merchant-issued single-use code through UCP `discounts.codes` at agentic checkout today, or only codes the shopper types?"

### 2.8 Vidhya Srinivasan (Google; VP/GM, Ads and Commerce)
- Role [P]: blog.google author page fetched today: "Vidhya Srinivasan, Vice President/General Manager, Ads & Commerce. Vidhya is Vice President and General Manager of Ads and Commerce. She oversees the advertising, shopping and payments products that help people discover and connect with businesses and shop online." https://blog.google/authors/vidhya-srinivasan/ (undated page; it lists the 20 May 2026 post). Byline "Vidhya Srinivasan, VP/GM Ads and Commerce" on the 11 Jan 2026 post.
- Controls: Direct Offers, AI Mode ads, Business Agent, UCP funding inside Google.
- Channels: blog.google author page only. No X or LinkedIn confirmed today.
- Recent statement [P], 11 Jan 2026 (older than six months): "We are initially focusing on discounts for the pilot and will expand to support the creation of offers with other attributes that help shoppers prioritize value over price alone, such as bundles and free shipping." https://blog.google/products/ads-commerce/agentic-commerce-ai-tools-protocol-retailers-platforms/
- More recent, but bylined "News from Google Team", not her [P], 20 May 2026: "Brands can upload a variety of promotions in Google Ads, including discounts, giveaways and local coupons. They'll soon be able to supply their eligible products and guardrails ... We use Gemini to construct a deal". https://blog.google/products/ads-commerce/a-new-generation-of-ads-for-the-ai-era-of-search/
- Reachability: low.
- Better route: Ginny Marvin (2.9) for the product question; a Google Ads partner or agency contact for pilot access.
- Ask: "Will Direct Offers accept an offer computed at request time by the merchant's own endpoint, instead of a promotion uploaded in advance?"

### 2.9 Ginny Marvin (Google; Ads Product Liaison). Stand-in for the unnamed Direct Offers lead.
- Role [P]: "Hosted by Ads Product Liaison, Ginny Marvin" on https://blog.google/products/ads-commerce/launching-ads-decoded-podcast/ (28 Jan 2026). [S] press, 11 Jun 2026: "Google Ads Liaison Ginny Marvin" (techwyse.com). Not confirmed by a source dated after June 2026.
- Controls: nothing in the product; she carries advertiser questions to the product teams and answers in public.
- Channels: not verified today. A 2021 press report mentions a personal handle; I did not confirm any current handle, so none is listed.
- Recent statement: none found from her about Direct Offers in the last six months. [S] a search summary attributes to her, on 11 Jan 2026, the phrase "like a salesperson negotiating a deal"; I did not fetch the original post, so do not quote it.
- Reachability: medium (her job is to answer practitioners in public), but only once a current channel is confirmed.
- Ask: "For the new Direct Offer asset, can an app supply the single-use codes through an API rather than a CSV upload?"

### 2.10 Direct Offers product lead and Business Agent lead: not named
- I found no Google page, post or press report that names a product lead for Direct Offers or for Business Agent. Google Marketing Live 2026 speaker names surfaced only in a search summary (for example "Sylvanus Bent, Group Product Manager, Google"), with no link to Direct Offers. Treat as unverified and do not address anyone as the Direct Offers lead.
- What Direct Offers is today [P]: "Direct Offers allows advertisers to present exclusive discounts ... directly to shoppers who are ready to buy." "AI Max and PMax advertisers can now natively create Direct Offers within the Google Ads UI and set value limits to ensure deals stay active without overspending." (https://business.google.com/us/accelerate/announcements/direct-offers/, fetched today, undated, "New for 2026").
- [S] press, 7 Oct 2026 (ppcnewsfeed.com, read through a summariser): the "Direct Offer" asset has "an incentive type and amount with an optional CSV upload of single-use promo codes", an optional daily limit, and shows in AI Mode as a "Claim one-time code" bar.
- Business Agent [P], 11 Jan 2026: "In the coming months, they'll be able to train the agent based on their data, access new customer insights, provide offers for related products and enable direct purchases". 16 Sep 2026: "we're now inviting retailers to participate in the Business Agent for YouTube ads beta in the U.S."

### 2.11 Other Google names on the Shopping TC (role = roster row only)
Anurag Sinha, Drew Olson, Jing Li: "Google" rows in MAINTAINERS.md [P]. Jing Li's GitHub bio: "Software Developer @ Google". Drew Olson also sits on the Payments TC. A search summary says a conference speaker page describes Anurag Sinha as "currently focused on building and scaling the Universal Commerce Protocol" [S, not fetched]. No offer-related statements found. Caroline George attends council meetings and "offered assistance from the Google Technical Services (GTEC) team" (minutes 2 Oct 2026); not on the roster.

---

## 3. WebMCP: who owns it and how to propose

### 3.1 The group and the process [P]

- Specification: "WebMCP, Draft Community Group Report, 9 October 2026". "Editors: Brandon Walderman (Microsoft), Khushal Sagar (Google), Dominic Farolino (Google)". "This specification was published by the Web Machine Learning Community Group. It is not a W3C Standard nor is it on the W3C Standards Track." https://webmachinelearning.github.io/webmcp/
- Repository: https://github.com/webmachinelearning/webmcp (4,610 stars, 123 open issues and PRs, last push 9 Oct 2026). Issues: https://github.com/webmachinelearning/webmcp/issues
- Group: W3C Web Machine Learning Community Group, https://www.w3.org/groups/cg/webmachinelearning/ . Chair: Anssi Kostiainen (W3C group page; affiliation Intel from his GitHub profile).
- Charter (start date 2025-09-25), https://webmachinelearning.github.io/charter/ : WebMCP API is "A Web API that allows web developers to expose their web application functionality as tools ... The API is designed for human-in-the-loop workflows where the user maintains visibility and remains in control." Decisions: "This group will seek to make decisions where there is consensus." "a decision should be publicly recorded (where GitHub is used as the resolution of an Issue)". Contributions "in the form of a pull request (preferred), by raising an issue, or by adding a comment to an existing issue."
- CONTRIBUTING.md in the repository: "This repository is being used for work in the W3C Web Machine Learning Community Group, governed by the W3C Community License Agreement (CLA). To make substantive contributions, you must join the CG."
- How to join (https://webmachinelearning.github.io/community/): "Create a W3C Account", "Join the Community Group", "If representing a W3C Member, also join the Working Group", "You're all set to contribute on GitHub and join meetings". Community Groups are free and open to individuals. Joining means creating an account, which only the owner can do.
- Meetings: Community Group teleconference every second Thursday, 15:00 to 16:00 UTC (agendas 3 Sep, 17 Sep, 1 Oct 2026 in https://github.com/webmachinelearning/meetings/tree/main/telcons; [I] next one 15 Oct 2026). Topics reach the agenda through the `Agenda+` label. Face to face: "W3C TPAC 2026: Web Machine Learning WG/CG F2F", Clayton Hotel Burlington Road, Dublin, "in-person & remote", 26 and 27 October 2026; "Submit agenda proposals via https://github.com/webmachinelearning/meetings/issues/39".
- Other channels: mailing list archive https://lists.w3.org/Archives/Public/public-webmachinelearning/ ; W3C Slack channel `#webmachinelearning`; IRC `#webmachinelearning`.
- Chrome side: "Raise questions and participate in discussion on GitHub." "If you have feedback on Chrome's implementation, file a Chromium bug." (https://crbug.com/new?component=2021259). "Join the early preview program (EPP) to provide feedback on WebMCP" (https://developer.chrome.com/docs/ai/join-epp). Origin trial from Chrome 149.
- Edge side: "An Origin Trial is live in Edge 150." (implementation-status.md). Enrolling "requires that you agree to be contacted by Microsoft for feedback".
- Implementation status file also lists Brave (Leo), ChatGPT Desktop, Firefox and Safari positions, and Meta Ray-Ban Display ("coming soon").

How the editors treat outside ideas [P], Dominic Farolino, 28 Sep 2026: "implement it outside the spec, gather experience, and then file focused issues if that work reveals specific WebMCP primitives that are actually missing." (https://github.com/webmachinelearning/webmcp/issues/261#issuecomment-5875926859) and, same day, on an implementer note: "It doesn't seem like there's a concrete issue with the spec or API above though. ... Please file focused issues" (#266, "Implementation report: agent commerce storefront on WebMCP").

Relevant open issues: #31 "Support agent to agent interaction" (Khushal Sagar, 2025, no comments), #329 "Allow pages to send messages to agents" (30 Sep 2026), #188 "Tool retrieval: wildcard or not" (the hypothetical `tools.shopify.com` iframe), #8 "Should tools be a means for capability discovery?", #341 "Declarative tool-manifest for JS-callable tools" (12 Oct 2026), #340 "site guide for agents" (8 Oct 2026). On 8 Oct 2026 the declarative API was removed from the spec "for now" (commit by François Beaufort, #338).

### 3.2 Dominic Farolino (Google Chrome; WebMCP editor)
- Role [P]: "Editor: Dominic Farolino, Google" in the spec source and rendered spec (9 Oct 2026). GitHub bio: "Engineer @GoogleChrome. Ex-@microsoft @mozilla. Editor @whatwg." (profile updated 12 Oct 2026).
- Controls: spec text, triage (he closes or redirects most new issues), Chromium implementation direction.
- Channels: GitHub @domfarolino; X @domfarolino and site https://domfarolino.com (both from his GitHub profile); email [EMAIL REDACTED] on his GitHub profile and [EMAIL REDACTED] in the spec's editor line.
- Recent statement [P], 8 Apr 2026 (six months ago), #159: "All script running on your page is treated the same and you have to own it from a security perspective." https://github.com/webmachinelearning/webmcp/issues/159#issuecomment-4207682279 . More recent, 29 Sep 2026, #328: "WebMCP tools may change frequently as the user moves through a site".
- Reachability: medium to high on a focused GitHub issue (he answers within days); low for a product pitch.
- Ask: "Is a tool registered by a third-party app script in a store's top-level document meant to stay indistinguishable to browser agents from the store platform's own tools, or will provenance be exposed?"

### 3.3 Khushal Sagar (Google; WebMCP editor)
- Role [P]: "Editor: Khushal Sagar, Google" (spec, 9 Oct 2026). GitHub: company "Google", location "San Francisco, CA".
- Controls: spec text; he opened the agent-to-agent issue.
- Channels: GitHub @khushalsagar; [EMAIL REDACTED] in the spec's editor line.
- Recent statement: none in the last six months that I could find. Latest found is 14 Jan 2026 (#62). The relevant older one, 26 Sep 2025, #31: "We should definitely be thinking of how an interaction between the browser agent and a site agent would be coordinated."
- Reachability: medium on GitHub; he is the only editor based in San Francisco, which matters if a local meetup appears.
- Ask: "Is #31 (a site agent exposed as one tool) still the intended way for a visiting agent to ask a store's agent for an offer?"

### 3.4 Brandon Walderman (Microsoft; WebMCP editor)
- Role [P]: "Editor: Brandon Walderman, Microsoft" (spec, 9 Oct 2026). But, 1 Oct 2026, Sam Dallstream: "@bwalderman is working on multiple projects, and I am now the main point of contact for WebMCP dev at Microsoft." His latest repository comment that I found is from 2 Mar 2026.
- Channels: GitHub @bwalderman; [EMAIL REDACTED] in the spec's editor line.
- Recent statement: none in the last six months.
- Reachability: low now. Use Sam Dallstream.
- Ask: none of his own; route Edge questions to 3.5.

### 3.5 Sam Dallstream (Microsoft Edge; WebMCP point of contact)
- Role [P]: his own words, 1 Oct 2026: "I am now the main point of contact for WebMCP dev at Microsoft." https://github.com/webmachinelearning/webmcp/issues/328 . GitHub bio: "Engineer @MicrosoftEdge" followed by his Microsoft email address (published by him in the bio).
- Controls: Edge's WebMCP implementation and what Copilot in Edge does with page tools.
- Channels: GitHub @sjdallst2; the email in his GitHub bio ([EMAIL REDACTED]).
- Recent statement [P], 1 Oct 2026: "Judging from the code we have, there is a clear information issue where we do not know when tools are available, and we have to guess when a page will be ready."
- Reachability: medium (new in the role, one public comment so far, publishes a work email).
- Ask: "During the Edge 150 origin trial, does Copilot in Edge call WebMCP tools that a third-party script registers on a store page?"
- Also Microsoft [P]: Sushanth Rajasankar (@sushraja-msft, bio "I work on Microsoft Edge") takes part in the continuation discussion (#135).

### 3.6 François Beaufort (Google Chrome developer relations; spec committer)
- Role [P]: listed author of https://developer.chrome.com/docs/ai/webmcp ("Published: May 18, 2026, Last updated: October 7, 2026"). GitHub: company "@GoogleChrome", bio "Happiness Evangelist @GoogleChrome", location "France". Ten spec commits between 3 Sep and 8 Oct 2026.
- Controls: demos (https://github.com/GoogleChromeLabs/webmcp-tools, last push 13 Oct 2026), docs accuracy, small spec changes; he relays developer feedback to the editors.
- Channels: GitHub @beaufortfrancois (the only link on his Chrome author card).
- Recent statement [P], 13 Oct 2026, #312: "FYI OpenAI just released their Browser Annotation API that lets websites customize what people select, what context accompanies their feedback, and which controls they use to preview changes before sending an annotation to ChatGPT." Earlier, 20 Feb 2026, #101: "In environments like online stores where first-party code and third-party partner JavaScript run within the same environment, a security concern exists with how WebMCP tools are registered."
- Reachability: high on GitHub (comments daily, including on outsiders' PRs).
- Ask: "Would a small demo for GoogleChromeLabs/webmcp-tools be welcome: a store page whose `request_offer` tool takes the shopper's priority and returns a code the checkout tool accepts?"

### 3.7 Kasper Kulikowski (Google; Senior Developer Relations Engineer)
- Role [P]: his own about page, fetched today: "I work as a Senior Developer Relations Engineer at Google and I am based in Poland." https://www.kulikowski.me/about (undated; latest post on the site 30 Sep 2026). Listed author of the Chrome WebMCP page (last updated 7 Oct 2026).
- Controls: nothing in the spec; he writes the public thinking on "bring your own agent" and builds demos with André Bandarra (Google, London). Issue #329 cites his posts.
- Channels: site https://www.kulikowski.me ; X https://x.com/kaskulikowski ; LinkedIn https://www.linkedin.com/in/kasper-kulikowski ; GitHub @Kulikowski (all linked from his own site). The Chrome author card links a different X handle (twitter.com/i_am_kaspa); use the one on his own site.
- Recent statement [P], 31 Aug 2026, "Bring your own agent. What does the website bring?": "The user's agent still represents the user. The website harness represents the business. The goal is not to pull control back from the user - it is to create a clear contract between both sides". https://www.kulikowski.me/blog/bring-your-own-agent
- Invitation [P], 13 Jul 2026, "When agents talk: tool calls, handoffs, and two wallets": "I'd love to hear how these ideas work out for you, so if you try them, please reach out". https://www.kulikowski.me/blog/agents-talking-to-each-other
- Reachability: high. He asks readers to write, publishes his handles, and the topic is his.
- Ask: "You asked readers to reach out: would you look at a two-minute demo where a visiting agent passes its user's priority and a competing-offer link to a store-side harness that answers with an offer the checkout honours, and say what WebMCP is missing for it?"

### 3.8 Alexandra Klepper (Google; Senior Technical Writer, Chrome)
- Role [P]: GitHub bio "Sr. Technical Writer for Google Chrome and web.dev", company "@Google". First listed author of the Chrome WebMCP page (last updated 7 Oct 2026) and sole author of "Join the WebMCP origin trial" (9 Jun 2026). Her personal site shows the name "Alexandra White"; the Chrome pages and GitHub use "Alexandra Klepper".
- Controls: wording of Chrome's WebMCP documentation.
- Channels: GitHub @alexandrascript; Bluesky https://bsky.app/profile/alexandrascript.com ; site https://alexandrascript.com (all linked from her Chrome author card).
- Recent statement [P], 9 Jun 2026 (origin trial post): "Share your feedback on the API shape by commenting on an existing issue".
- Reachability: medium, for documentation questions only.
- Better route: the "File a bug" link on the docs page, or Beaufort and Kulikowski.
- Ask: "Could the WebMCP use-cases page say whether tools added by a third-party plugin script on a hosted store are a supported pattern?"

### 3.9 Anssi Kostiainen (Intel; chair of the W3C Web Machine Learning groups)
- Role [P]: W3C group page lists him as chair of the Community Group. GitHub bio: "PE, Web Standards TL @intel. AC, Chair @W3C Machine Learning, Devices, Second Screen." (profile updated 1 Oct 2026). Agenda of 1 Oct 2026: "Chair: Anssi".
- Controls: the agenda and the recorded resolutions; the TPAC agenda issue.
- Channels: GitHub @anssiko; X @anssik and https://linktr.ee/anssik (GitHub profile); work email shown on his GitHub profile.
- Recent statement [P], agenda of 1 Oct 2026: "WebMCP momentum and next steps: Celebrate and look ahead." Nothing about commerce.
- Reachability: medium for a process question on the agenda issue; he is also on the programme committee of the W3C/GS1 e-commerce workshop.
- Ask: "Could a five-minute implementer report on commerce offer tools be tagged `Agenda+` for a Community Group call, or should it go to the TPAC agenda issue #39?"

### 3.10 Others seen (not primary targets)
- Mark Foltz (Google; GitHub bio "Senior Staff Software Engineer at Google, works on Chrome/Chromium"): author of the continuations explainer (2 Oct 2026), which matters if an offer tool navigates to a cart link.
- Yoav Weiss (Shopify; GitHub company "@Shopify"): spoke on "Shopify: Universal Commerce Protocol / WebMCP" at the W3C/GS1 workshop on 8 Sep 2026 and sits on its programme committee; opened #312 (updated 13 Oct 2026). Belongs to the Shopify notes.
- Johann Hofmann (Google Chrome, AI security), Mason Freed (Chromium): active on tool-ownership questions.

---

## 4. Other venue: W3C/GS1 workshop "E-commerce for Humans and AI Agents"
- Held 8 and 9 Sep 2026, Zurich, hybrid. https://www.w3.org/2026/ecommerce-agents/ (mirror that fetches: https://w3c.github.io/ecommerce-for-humans-and-AI-Agents-workshop/). Registration is closed.
- Chairs: Phil Archer (GS1), Philippe Le Hégaret (W3C). Staff contact: Roy Ruoxi Ran (W3C). Programme committee includes Alex Jansen (Google), Michael Linck (Google), Anssi Kostiainen (Intel), Andrew Smith (OpenAI), Riley Strong (OpenAI), Yoav Weiss (Shopify), Gavin Shenker (Visa), Vasilii Trofimchuk (Block).
- Talks: "Universal Commerce Protocol: Building a common language for Agentic Commerce", Amit Handa, Google; "Progressive Enhancement: Evolving the Web for Agents and Commerce", Riley Strong, OpenAI; "Shopify: Universal Commerce Protocol / WebMCP", Yoav Weiss, Shopify. Last agenda item: "Conclusions and discussion of next steps".
- No workshop report is published yet (repository last changed 9 Sep 2026). A report usually proposes follow-up groups; worth watching. "You can send emails to the workshop Program Committee at: [EMAIL REDACTED]."

---

## 5. Public positions that a message can truthfully cite
1. UCP governance asks vendors to ship under their own namespace first and only then ask for core adoption (CONTRIBUTING.md).
2. The Shopping Tech Council recorded "strong industry demand for personalization, reordering, and upselling" when it discussed state-bound offers (2 Oct 2026).
3. The council admits outsiders "hit a wall" (4 Sep 2026) and deprioritises items "without an active implementer" (18 Sep 2026).
4. A Google engineer's proposal says "Commerce today is unidirectional in UCP" and adds a Buyer price proposal, but rules out non-price terms (11 Oct 2026).
5. Google's Direct Offers plans "bundles and free shipping" beyond discounts (11 Jan 2026) and promotions with advertiser "guardrails" assembled by Gemini (20 May 2026). The offer is chosen by Google from what the advertiser uploaded; it is not a reply to a buyer agent's stated priority or proof.
6. Press (7 Oct 2026): the Direct Offer asset uses single-use promo codes.
7. WebMCP editor: "All script running on your page is treated the same" (8 Apr 2026); new ideas should be built outside the spec first and come back as focused issues (28 Sep 2026).
8. A Google developer-relations engineer describes a website-side harness that "represents the business" meeting the user's agent (31 Aug 2026).
9. Amit Handa in public: "Contribute your feedback, extensions, and code to the public repository." (8 Sep 2026).

---

## 6. Could not confirm
- Any named product lead for Direct Offers or for Business Agent.
- Current job titles of Greg Smith and of the Shopping TC members beyond the company in the roster. Amit Handa's "Director of Engineering" title is from 11 Jan 2026.
- The public address of the UCP mailing list ("shared Google group") that GOVERNANCE.md requires.
- Date, city and admission rules of the UCP Summit in November 2026.
- LinkedIn or X profiles for Amit Handa, Greg Smith, Ashish Gupta, Vidhya Srinivasan, Ginny Marvin, Khushal Sagar. LinkedIn was not fetched; no profile is asserted.
- Whether the draft shopping roadmap (action item due 2 Oct 2026) has been published; ucp.dev/documentation/roadmap still shows the general text.
- The outcome of the Tech Council "deep dive" on the Offer proposal (no minutes are published for deep dives).
- Whether Google's agents (AI Mode, Gemini) declare the UCP Discount extension or any vendor capability in their platform profile.
- Whether Gemini in Chrome or Copilot in Edge call a WebMCP tool registered by a third-party script on a store page.
- Any agentic-commerce or WebMCP meetup in San Francisco in October or November 2026. A search found only past events (an August 2026 park meetup and a March 2026 invite-only Shopify dinner), neither verified by me.
- Whether the owner controls the domain needed for the `com.offerad.*` namespace.
- The surname of @isparsh510.
- w3.org pages return 403 to curl; the group page and the slide PDF were read through the fetch tool instead. The Search Engine Land articles on Direct Offers returned 403 and were not read.
