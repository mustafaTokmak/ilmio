# G1 - Shopify: who controls the missing pieces (people, roles, channels, venues)

Research date: 13 Oct 2026. Every role below was confirmed from a page fetched today unless it says "unverified". Nobody was contacted. Nothing was posted, starred, followed or signed up for. All requests were read-only GETs of public pages (GitHub reads went through the `gh` CLI, GET only).

Labels: [P] = primary source read today (the organisation's own page, the person's own profile or post, a maintainer file, official minutes). [S] = press or other secondary source. [I] = my inference.

Raw copies of what I fetched: `/Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/docs/g1/` (subfolders `forum/`, `x/`, `ucp-minutes/`).

---

## 0. Short answer

1. The one person who owns the exact Shopify piece and openly invites contact is **Gil Greenberg** (Staff Product Manager, agentic commerce; UCP Shopping Tech Council member since 15 Sep 2026). He gave the DotDev 2026 talk "How Shopify Functions help you succeed in agentic checkouts", he announced checkout WebMCP, his site says "Reach out on social media ... (I respond best on Twitter)", and in the developer forum he wrote "I'd love to hear about any use cases you're blocked on, what we're missing". He is the best first target, ahead of Tobi Lutke.
2. The protocol piece (an offer message in UCP) is already moving without us: the Shopping Tech Council discussed "Structured Cart Modifications and State-Bound Offers" on 2 Oct 2026 (PR #773, issue #738, milestone 2026-12-08, assignee Greg Smith of Google). **Ilya Grigorik** (Shopify; Governance Council) was the sceptic in the room: he "probed whether platforms and agent builders would trust or utilize merchant-recommended products". The useful move is a factual comment on #738, not a cold DM.
3. Shopify has said in public, through staff on its developer forum, that apps cannot extend the store's agent surface today and that this is a known gap: "Extending UCP to expose these kinds of fulfilment details is a known gap and is on our radar. At this time, developers can't add to or adjust a merchant's /.well-known/ucp endpoint." (Wes, Shopify Staff, 21 Aug 2026). A thread that asks precisely OfferAd's question ("Managing Offers from Agents", 13 Apr 2026) has had no reply in six months.
4. Shopify already has a precedent for "apps contribute to Shopify's agent": **Sidekick App Extensions** (merchant side, GA in the Spring '26 Edition, "Any developer in Shopify's ecosystem can now build in Sidekick"). The ask to Shopify can be framed as "the same model for the buyer-facing agent surface".
5. Tobi Lutke is confirmed as CEO and is very unlikely to read a cold note; his last relevant public statement is the 21 Sep 2026 post about Muse and Shop Pay. A short public reply or quote-post that names a concrete gap is the only realistic way to reach him, and it should come after the Gil/forum/UCP routes have something to point to.

---

## 1. People (ranked by how much they control the missing piece and how reachable they are)

### 1.1 Gil Greenberg - Staff Product Manager, agentic commerce; UCP Shopping Tech Council

- Role evidence:
  - [P] DotDev 2026 lineup (event 21-22 Jul 2026), https://dotdev.shopify.com/pages/sessions : session "How Shopify Functions help you succeed in agentic checkouts", speaker "Gil Greenberg / Staff Product Manager / Shopify". Session text: "Checkout UI extensions are restricted in agentic checkouts. Learn how you can still support the most important merchant customizations through Functions, additional fields, fees, and other platform capabilities."
  - [P] His X profile bio (read today through the public embed endpoint for @gilgNYC): "Agentic commerce @Shopify. Try it at https://t.co/Xu5GjYzozL  Prev: @checkoutblocks (acq by Shopify)" (profile link resolves to http://ucp.new).
  - [P] His own site, https://www.gilgreenberg.com/ (gil.nyc redirects there; undated): "Hey! I'm based in NYC and work at Shopify as a Product lead. Previously I was the founder of Checkout Blocks, a Shopify Plus app to customize checkout. It was acquired by Shopify in June 2024."
  - [P] UCP MAINTAINERS.md, https://github.com/Universal-Commerce-Protocol/.github/blob/main/MAINTAINERS.md (last commit 12 Oct 2026): Shopping Tech Council row "Gil Greenberg | Shopify". He joined on 15 Sep 2026: commit "docs(maintainers): replace Victoria Duggan with Gil Greenberg on Shopping Tech Council (#71)". He is listed as present in the 9 Oct 2026 council minutes.
  - [S] TechCrunch, 28 Sep 2026, https://techcrunch.com/2026/09/28/shopify-opens-checkout-to-browser-based-ai-agents/ : "Gil Greenberg, a staff product manager who works on agentic commerce at Shopify".
- What he controls: [I] the product surface where apps meet agentic checkout: which Functions run there, what inputs they get, checkout WebMCP, cart-to-order data. That is exactly missing piece (a), "a mapping from context.intent or context.eligibility into Discount Functions". He also has a vote on the UCP Shopping Tech Council.
- Recent statements:
  - [P] X, 28 Sep 2026, https://x.com/gilgNYC/status/2104583942728822998 (text verified through the public embed endpoint): "Shopping with an agent shouldn't feel like watching paint dry. Today, we're launching WebMCP support for checkout, including Shop Pay, for all eligible Shopify merchants. Learn how it works, where UCP fits, and what the data shows: https://t.co/U96VtJaeyc"
  - [S] quoted by TechCrunch from X, 28 Sep 2026: "If your agent is operating in the buyer's browser, use WebMCP tools provided on storefront and checkout to efficiently complete order placement, instead of navigating HTML built for humans" and "These WebMCP tools provide structured and efficient APIs, purposely designed - via UCP - to ensure accurate commerce facts, required disclosures, and handoff requirements."
  - [P] Developer forum, account "Gil-Shopify" (display name "Gil", title "Shopify Staff"; I could not prove it is the same Gil, but the topics match his job), 9 Jul 2026, https://community.shopify.dev/t/35930 : "Because they run server-side, validation functions work across every checkout surface, including agentic checkouts." and "I'd love to hear about any use cases you're blocked on, what we're missing".
  - [P] Same account, 9 Oct 2026, https://community.shopify.dev/t/33939 : "We've added documentation that now covers the buyer IP requirement" (he answers Checkout MCP questions himself).
- Public channels: X https://x.com/gilgNYC ; GitHub https://github.com/gil-- ; site https://www.gilgreenberg.com/ ; LinkedIn https://www.linkedin.com/in/gilgreenberg (linked from his site; not fetched) ; forum https://community.shopify.dev/u/Gil-Shopify (identity not proven).
- Reachability: HIGH. His site says: "In NYC? Reach out on social media and I'd be happy to grab a coffee (I respond best on Twitter)." He was a solo Shopify app developer himself and publicly asks developers for blocked use cases.
- Suggested ask (one sentence): "Could the Discount Function input expose the agent's UCP `context.intent` and `context.eligibility` values, so a discount app can answer what the buyer's agent asked for instead of guessing?"
- Relation: gatekeeper.

### 1.2 Ilya Grigorik - Distinguished Engineer and Technical Advisor to the CEO; UCP Governance Council, Shopping and Payments Tech Councils

- Role evidence:
  - [P] His own site, https://ilya.grigorik.com/ (fetched today): "I am a Distinguished Engineer and Technical Advisor to the CEO at Shopify, on a mission to make commerce better for everyone."
  - [P] DotDev 2026 lineup: "Ilya Grigorik / Distinguished Engineer, Technical Advisor to the CEO / Shopify", session "UCP origin story: Behind the scenes of how and why we built it" (with Mani Fazeli).
  - [P] UCP MAINTAINERS.md (12 Oct 2026): Governance Council row "Ilya Grigorik | Shopify"; Shopping Tech Council row "Ilya Grigorik | Shopify"; Payments Tech Council row "Ilya Grigorik\* | Shopify" (the star marks a standing Governing Council member).
  - [P] https://shopify.engineering/ucp (11 Jan 2026): "Ilya Grigorik is a Distinguished Engineer at Shopify."
  - [P] X bio @igrigorik (read today): "Distinguished Engineer, @Shopify. On a mission to make commerce better for everyone."
- What he controls: [P] top contributor to the UCP spec repository (52 commits) and to Shopify's own `Shopify/ucp-cli` (76 commits) and `Shopify/ucp-proxy`. He reported to the council on 4 Sep 2026 that "Shopify has launched support for the v2026-08-25 release". [I] He is the person who decides what Shopify's UCP surface becomes and whether an offer message is acceptable to Shopify.
- Recent statements:
  - [P] Shopping Tech Council minutes, 2 Oct 2026, https://github.com/Universal-Commerce-Protocol/meeting-minutes/blob/main/tc/shopping/2026/2026-10-02.md , topic "Structured Cart Modifications and State-Bound Offers" (this is the minute-taker's wording, not a verbatim quote of him): "Ilya Grigorik questioned whether cart state binding is necessary and probed whether platforms and agent builders would trust or utilize merchant-recommended products. James Andersen, Greg Smith, Jordan Williams, Julia Downey, and Ilya Grigorik confirmed strong industry demand for personalization, reordering, and upselling (such as phone cases for phone purchases)."
  - [P] His own words, PR #538 "feat: `ask` capability for natural-language Q&A" (opened 22 Jun 2026, merged by him 7 Oct 2026), https://github.com/Universal-Commerce-Protocol/ucp/pull/538 : "`ask` answers; it does not act. A Business **MUST NOT** change commerce state in response to a question, and an answer never supersedes the structured capability or extension that represents the resource."
  - [P] Minutes 10 Jul 2026 (minute-taker's wording): "Ilya Grigorik and Amit Handa discussed if actions require discovery, arguing that this approach is counterintuitive and that actions should not bypass the negotiation process."
  - [P] X, 19 May 2026, https://x.com/igrigorik/status/2056815173697233300 : "@tobi and I sat down to talk UCP and the art of protocol design. A couple of themes worth expanding on... The hard part of good protocol design isn't the spec. It's the deep understanding of the problem you're solving and the humility to approach it at the right level."
- Public channels: GitHub https://github.com/igrigorik ; X https://x.com/igrigorik ; site https://ilya.grigorik.com ; email `[EMAIL REDACTED]` (he publishes it on his GitHub profile).
- Reachability: MEDIUM on GitHub (he reviews UCP issues and PRs weekly), LOW by direct message (70k followers, senior). Better route: a short, evidence-carrying comment on UCP issue #738, where his objection ("would platforms trust merchant offers?") is the open question OfferAd can answer with a working demo.
- Suggested ask: "On #738, would a state-bound Offer be acceptable if the buyer's agent starts it by stating a priority and a competing-offer URL, and on a Shopify store who would compute the answer, Shopify or an installed app?"
- Relation: standard_setter (also the internal gatekeeper for Shopify's UCP implementation).

### 1.3 Mani Fazeli - VP of Product, "leading agentic commerce"

- Role evidence:
  - [P] His X profile bio @mcfazeli (read today): "Views my own. VP of Product @Shopify, leading agentic commerce. Prev: SVP Product @WaveHQ (acq @HRBlock), co-founder @Betterez (acq @Busbud) + @ContextLogic".
  - [P] Sierra announcement, 6 Oct 2026, https://sierra.ai/blog/introducing-personal-agent-protocol : role line "Mani Fazeli, VP Product, Shopify".
  - [P] DotDev 2026 lineup: "Mani Fazeli / VP, Product / Shopify".
  - Stale page, do not use: https://www.shopify.com/enterprise/blog/authors/mani-fazeli still says "Mani Fazeli is a Director of Product at Shopify. He currently leads the Checkout and B2B teams".
- What he controls: [I] product direction for agentic commerce and checkout; Shopify's participation in the Personal Agent Protocol. The Retailgentic episode has a chapter "What Mani owns across the commerce loop" (audio not transcribed by me).
- Recent statement: [P] 6 Oct 2026, in the Sierra post: "As personal agents become part of everyday life, merchants have a new frontier for excellent customer service. From answering product questions to supporting purchases, returns, and exchanges, the ambition is to turn a buyer's intent into an outcome that delights them. Personal Agent Protocol helps establish how agents and merchants can work together to make that happen."
  - [S] Retailgentic podcast show notes, 30 Jul 2026, https://retailgentic.transistor.fm/episodes/shopifys-agentic-commerce-playbook-vp-of-product-mani-fazeli-on-8x-agentic-traffic-growth-and-the-long-tail-boom : the industry is "somewhere between walk and run today"; guiding principle "always put the control in the merchant's hand."
- Public channels: X https://x.com/mcfazeli ; LinkedIn https://www.linkedin.com/in/mcfazeli/ (published in the podcast show notes and in his X profile).
- Reachability: LOW to MEDIUM. About 4k followers, posts rarely. A note that picks up his own phrase "turn a buyer's intent into an outcome" and "control in the merchant's hand" is honest and on topic. Better route for the technical ask: Gil Greenberg, who works in his area.
- Suggested ask: "When Shopify implements the Personal Agent Protocol for stores, will an installed app be able to answer part of the agent session (for example a conditional offer), or will it be Shopify-only like today's UCP profile?"
- Relation: gatekeeper.

### 1.4 Tobi Lutke - CEO (and co-founder, board member)

- Role evidence:
  - [P] Shopify Investor Relations, Board of Directors, https://www.shopify.com/investors/board-of-directors (undated page, fetched today): "Tobias Lutke co-founded Shopify in September 2004, and has served as a member of our board of directors since that time. Mr. Lutke has served as our Chief Executive Officer since April 2008." Caution: the same page still calls Fidji Simo "Chief Executive Officer of Applications at OpenAI", which sibling notes say is out of date, so this page alone is not proof of currency.
  - [P] His X profile bio @tobi (read today): "Shopify CEO by day, Dad in evening, hacker at night, Aspiring comprehensivist."
  - [P] DotDev 2026 lineup (21 Jul 2026): "Tobias Lutke / CEO / Shopify" for "Tobi & Harley fireside and Build Awards".
  - [S] Farnam Street, 10 Sep 2026, https://fs.blog/knowledge-project-podcast/tobi-lutke-3/ : "Shopify founder and CEO Tobi Lutke joins Shane Parrish".
  - [P] https://tobi.lutke.com/ header: "Tobi Lutke / Shopify CEO" (old site).
- What he controls: company direction; whether Shopify's agent surface opens to apps at all.
- Recent statements:
  - [P] X, 21 Sep 2026, https://x.com/tobi/status/2102090718546198790 (text verified through the public embed endpoint): "We are excited to announce we are partnering deeply with Muse to enable agentic checkout with Shop Pay on all Shopify stores, offering people an easy and delightful way to shop and check out with Muse."
  - [S] Interview transcript, 10 Sep 2026, same fs.blog URL: "'Hey, I believe it should be easier to solve any kind of problem related to commerce inside of Shopify than outside of Shopify.' The moment it is easier to build commerce software on a weekend without access to Shopify's tooling, than it is inside of Shopify with all of its might, that moment is the moment where it becomes much easier to compete with us just from a purely business perspective." This is the most useful sentence for a note: OfferAd's offer endpoint currently has to live outside Shopify's agent surface.
- Public channels: X https://x.com/tobi (about 517k followers); site https://tobi.lutke.com/ . No contact email found and none guessed.
- Reachability: LOW. He has replied to individual app developers on X in the past (Gil Greenberg posted in May 2022, as an independent developer, "Thanks for chatting @tobi!"), but a cold DM from an individual will almost certainly not be read. Better route: Gil Greenberg first; then, if wanted, a short public reply to his Muse post that states one concrete gap and links a demo.
- Suggested ask: "Should an installed app be able to add one tool to a store's agent surface, the way Sidekick App Extensions let apps into Sidekick?" (a yes or no he can answer in one line).
- Relation: gatekeeper.
- Useful link to the Meta side [S]: ChannelNews, https://www.channelnews.com.au/shopify-teams-up-with-meta-to-let-ai-agents-complete-online-purchases/ : "Meta's chief AI officer Alexandr Wang said the partnership would give Muse users access to a broad range of stores and products." So "wang" and "tobi" have both spoken publicly about the same Shopify and Muse checkout partnership; a note to either can refer to it.

### 1.5 David Moellenkamp - Director, Product (discounts with Functions)

- Role evidence: [P] DotDev 2026 lineup: workshop "Building dynamic, multi-class discounts with Functions" ("Build a promotion that reacts to live events. Learn to wire external signals via metafields and Functions, deliver multi-class discounts, and reach buyers in specific markets."), speakers "David Moellenkamp / Director, Product / Shopify" and "Jitesh Sachdeva / Manager, Engineering / Shopify". [P] https://www.shopify.com/enterprise/blog/authors/david-moellenkamp (undated): "David Moellenkamp is a director of product at Shopify."
- What he controls: [I] the discounts product and the Discount Function API (inferred from the workshop he led; I found no page that says "owns discounts").
- Recent statement: none found in the last six months beyond the workshop description above (which is Shopify's text, not his).
- Public channels: none verified. I did not find an X handle; LinkedIn was not checked (blocked to fetches).
- Reachability: LOW to MEDIUM, unknown. Better route: the Functions category of the developer forum, where "Adam Ford" answered on 13 Aug 2026 with "Developer from the Discounts team here" (https://community.shopify.dev/t/36785), and Gil Greenberg.
- Suggested ask: "Is minting one single-use app discount code per agent request, combining product, order and shipping classes, a pattern you support at volume, or should it be an automatic app discount keyed to something the agent sends?"
- Relation: gatekeeper.

### 1.6 Vanessa Lee - VP, Product (keynote; Editions; reported to lead Sidekick)

- Role evidence: [P] DotDev 2026 lineup: "Welcome & keynote ... Vanessa Lee / VP, Product / Shopify". [P] Shopify newsroom front page today lists the video "Shopify VP Vanessa Lee Explains the 'Everywhere' Edition". [P] Shopify newsroom, 11 Jan 2026, https://www.shopify.com/news/ai-commerce-at-scale : "says Vanessa Lee, VP of Product at Shopify". [S, undated] Product School speaker page, https://productschool.com/product-leaders/vanessa-lee : "the Vice President of Product at Shopify. As a senior product leader reporting directly to the CEO ... she leads the development of Sidekick, Shopify's AI assistant".
- What she controls: [I] the core product portfolio and Editions; Sidekick (per the secondary source only).
- Recent statement: the newest exact quote I found is nine months old. [P] 11 Jan 2026, same newsroom URL: "Shopify has a history of building checkouts for millions of unique retail businesses. We have taken everything we've seen over the decades to make UCP a robust commerce standard that can scale" and "Agentic commerce has so much potential to redefine shopping and we want to make sure it can scale to every product a customer might want to purchase." Nothing from the last six months was found in text form (the June 2026 Edition video was not transcribed).
- Public channels: none verified today (no X handle or LinkedIn URL confirmed).
- Reachability: LOW.
- Suggested ask: "Sidekick App Extensions let apps add data and actions to the merchant's agent; is the same extension model planned for the buyer-facing agent tools on a store?"
- Relation: gatekeeper.

### 1.7 Atlee Clark - VP, Partners (app and agency ecosystem)

- Role evidence: [P] DotDev 2026 lineup: "Atlee Clark / VP, Partners / Shopify". [P] Shopify newsroom, 28 Jul 2026, https://www.shopify.com/news/a-world-with-more-builders : byline "by Atlee Clark", standfirst "Shopify's VP of Partnerships believes AI will make that bet pay off for more people than ever."
- What she controls: the partner programme, DotDev, partner incentives, routing from partners to product teams. Not the API.
- Recent statement: [P] 28 Jul 2026, same URL: "Somewhere someone in a garage is hunched over a laptop, locked in on a vision, convinced the rest of the world just hasn't caught on yet. They aren't waiting for permission, they're already building." Also: "we've introduced a new opportunity by opening Shopify Catalog ... Soon partners will be able to earn commission on the sales those experiences drive."
- Public channels: none verified today.
- Reachability: LOW to MEDIUM. Better route: Partner Support while signed in to the Partner account, which Shopify staff say can "route internally" (see venues).
- Suggested ask: "Is there someone on the partnerships team who handles apps that build on the agentic surface, and an early-access programme they can join?"
- Relation: connector_to_others.

### 1.8 Daniel Wyckoff - Shopify developer; UCP Shopping and Payments Tech Councils

- Role evidence: [P] UCP MAINTAINERS.md (12 Oct 2026): "Daniel Wyckoff | Shopify" on both the Shopping and the Payments Tech Council. [P] GitHub profile `raginpirate` (updated 10 Oct 2026): company "@Shopify", bio "Contributing to Shopify's Payments Platform, UCP's Technical Council, W3C's WPWG, and FIDO's PTWG." [P] His site https://danielwyckoff.ca (undated): "Sr. Developer @Shopify". Exact current title: unverified beyond these.
- What he controls: a council vote; payments-side spec work (payment instruments, subscriptions, purchase options).
- Recent statement: [P] PR #890 (opened 2 Oct 2026), https://github.com/Universal-Commerce-Protocol/ucp/pull/890 , his text: "Combined per the Oct 5 TC deep dive: this PR now carries both the purchase options extension and the subscription policy type it defines". Minutes 2 Oct 2026: "Daniel Wyckoff clarified that this draft represents the first primitive for describing subscription terms, while purchase options form a secondary necessary primitive."
- Public channels: GitHub https://github.com/raginpirate ; site https://danielwyckoff.ca ; LinkedIn https://www.linkedin.com/in/daniel-wyckoff/ (linked from his site) ; email `[EMAIL REDACTED]` (published on his site's contact link and on his GitHub profile).
- Reachability: MEDIUM through GitHub review threads. He is not the owner of offers; ask him only about how an offer would compose with purchase options.
- Suggested ask: "Would a conditional offer such as 'credit on the next order' or 'longer returns' belong in purchase options and policies, or in the Offer extension of #773?"
- Relation: standard_setter.

### 1.9 Lee Richmond - Shopify; UCP Shopping Tech Council

- Role evidence: [P] UCP MAINTAINERS.md (12 Oct 2026): "Lee Richmond | Shopify". [P] GitHub profile `richmolj`: company "Shopify" (profile updated 29 Jul 2026). Present in the 9 Oct 2026 council minutes. Job title: unverified.
- What he controls: a council vote; author of the Order capability work.
- Recent statement: [P] PR #584 (opened 13 Jul 2026, updated 7 Oct 2026), https://github.com/Universal-Commerce-Protocol/ucp/pull/584 : "Order confirmation pages typically want to show how the buyer paid - card vs gift card, last four, billing address - but the Order capability has no payment field today." Not about offers.
- Public channels: GitHub https://github.com/richmolj ; X handle `richmolj` listed on his GitHub profile (not verified live).
- Reachability: MEDIUM on GitHub, but he is a weak target for this topic.
- Suggested ask: "Should an accepted offer be recorded on the Order (so the buyer's agent can later prove what was promised), and where?"
- Relation: standard_setter.

### 1.10 Yoav Weiss - Shopify web platform; WebMCP community group participant

- Role evidence: [P] GitHub profile `yoavweiss`: company "@Shopify". [P] https://blog.yoav.ws/about/ (undated): "These days I'm working at Shopify on improving the web platform and making it the best platform for online commerce." Job title: unverified.
- What he controls: [I] Shopify's voice in the WebMCP spec on whether third-party scripts on a page (which is what a Shopify app embed is) may register or call tools.
- Recent statements: [P] WebMCP issue #312 (opened 17 Sep 2026), https://github.com/webmachinelearning/webmcp/issues/312 : "Playing around with WebMCP, I find myself in situations where the agent is not aware of the page's context." and the use case "A checkout page with multiple different shipping addresses can provide them as context for the agent". [P] Issue #159 (he opened it 2 Apr 2026; comment 9 Apr 2026), https://github.com/webmachinelearning/webmcp/issues/159 : "I'm imagining tools.platform.com wanting to exclude anything on merchant.com (or publisher.com), but happy to accommodate tool calls from agent.platform.com, the browser's agent or extension-based agents."
- Public channels: GitHub https://github.com/yoavweiss ; blog https://blog.yoav.ws ; email `[EMAIL REDACTED]` (published on his GitHub profile).
- Reachability: MEDIUM on the WebMCP issue tracker.
- Suggested ask: "Does Shopify expect app embed scripts to register their own WebMCP tools on a storefront next to Shopify's, or should apps plan for a Shopify-only tool set?"
- Relation: standard_setter.

### 1.11 "Wes" (forum account Wes-Dev-Shopify) - Shopify Staff, developer forum

- Role evidence: [P] forum profile https://community.shopify.dev/u/Wes-Dev-Shopify : title "Shopify Staff", admin and moderator, last post 9 Oct 2026. Surname and job title: not published, unverified.
- What he controls: nothing in the product; he files feature requests internally and reports back in the thread.
- Recent statement: [P] 21 Aug 2026, https://community.shopify.dev/t/can-a-third-party-app-extend-the-ucp-profile-at-well-known-ucp/36329 : "I've made sure your feedback is heard. Extending UCP to expose these kinds of fulfilment details is a known gap and is on our radar. At this time, developers can't add to or adjust a merchant's /.well-known/ucp endpoint. I'll follow up in this thread if anything changes on that front." [P] 4 Sep 2026, https://community.shopify.dev/t/37439 : "I'm submitting your feedback as a feature request for review. I don't have a roadmap or timeline to share".
- Public channel: the forum only.
- Reachability: HIGH inside the forum (staff answer most threads within days). Other staff who answer agentic questions: Liam Griffin ("I'm a Developer Advocate here at Shopify", created the Agentic Commerce category; last post 30 Jul 2026), Kyle Giesbrecht ("I work on the Developer Support Team!"), Alan ("Developer Support Expert"; his profile says "My account on community.shopify.dev is my only official external channel for communication"), Paige, Donal.
- Suggested ask: "In thread 36329, could you add the offer use case (an installed app answering a buyer agent with a conditional offer) to the same feature request, and say whether an early-access preview exists?"
- Relation: connector_to_others.

### 1.12 Ravi Yada - Senior Staff Product Manager, Catalog API

- Role evidence: [P] DotDev 2026 lineup: "The next chapter of the Catalog API" ("See how product discovery, personalization, UCP checkout paths, and monetization create new ways to build and earn."), speaker "Ravi Yada / Senior Staff Product Manager / Shopify". GitHub `raviyada-shop` has 3 commits in `Shopify/ucp-cli` (profile has no name or company; the link to him is my inference).
- What he controls: [I] the Catalog API, including "Promoted placements" ("Promoted placements will give developers and partners a future path to earn revenue when their Catalog-powered experiences drive sales", Shopify newsroom 17 Jun 2026). That is Shopify's own paid-placement layer in agent surfaces, so it is both a complement and a possible competitor to seller offers.
- Recent statement: none found in his own words.
- Public channels: none verified.
- Reachability: LOW to MEDIUM, unknown. Better route: the forum thread "Promoted Placements: Can you pass in additional link parameters/IDs and get reporting?" (https://community.shopify.dev/t/36731, 11 Aug 2026, no reply yet).
- Suggested ask: "Can a Catalog result carry a seller's conditional offer (not only a price), and is that planned inside Promoted placements?"
- Relation: complement.

### 1.13 Matt Koenig - Senior Staff Product Manager, Sidekick extensions

- Role evidence: [P] DotDev 2026 lineup: "How Sidekick extensions change app engagement" ("Sidekick extensions give apps a new way to meet merchants inside their existing workflows."), speakers "Matt Koenig / Senior Staff Product Manager / Shopify" and "Nathan Davis / Senior Product Marketing Lead / Shopify". The hands-on workshop was run by "Adam Barrus / Senior Staff Product Manager" and "Trish Ta / Senior Staff Developer".
- What he controls: [I] the one existing mechanism by which an app extends a Shopify agent (merchant side).
- Recent statement: none found in his own words. Shopify's text (newsroom, 17 Jun 2026, https://www.shopify.com/news/spring-26-edition-dev): "Now, any developer in Shopify's ecosystem can build a Sidekick App Extension. App developers can surface their app's data and actions directly inside Sidekick conversations."
- Public channels: none verified.
- Reachability: unknown, probably LOW to MEDIUM.
- Suggested ask: "Was a buyer-facing version of app extensions (apps contributing tools to the store's UCP or MCP surface) considered when you designed Sidekick App Extensions?"
- Relation: possible_partner (precedent owner).

### Others noted, not in the main list

- Harley Finkelstein, President. [P] Q2 release, 5 Aug 2026, https://www.shopify.com/news/shopify-q2-2026-financial-results : "said Harley Finkelstein, President of Shopify". X bio: "Entrepreneur // @Shopify President // @BigShotPodcast Creator". Not an owner of the missing pieces.
- Jonathan Zazove, "Director, Product" (DotDev session "Built to last: Building for the Shopify App Store in 2026"). App Store, not the agent surface.
- David Cameron, "Senior Product Lead" (DotDev "Building without a backend: The static app architecture"); active in the forum as David-Shopify (last post 8 Oct 2026) on Polaris and Function deployment. App platform, reachable in the forum.
- Kate Ragotte, "Senior Staff Product Manager" (DotDev "AI discovery: What's real, what's hype, and what to do").
- Arvind Ravulavaru, "Senior Solutions Architect Lead" (DotDev workshop "Building shopping into any surface with Catalog & UCP").
- Nick Chen, "Director, Product" (payments; left the UCP Payments council on 2 Sep 2026, replaced by Rose Wiegley). Rose Wiegley and Vita Valeikaite are Shopify's other Payments Tech Council members (MAINTAINERS.md).
- Victoria (Vic) Duggan: Shopify, left the Shopping Tech Council on 15 Sep 2026 (replaced by Gil Greenberg). The earlier note H1 section 7 still lists her; that is out of date.
- Josh Larson (`jplhomer`, "Developer at @shopify"), Matthew Hutchinson (`matthutchinson`), Westin Wrzesinski (`westeezy`, "@Shopify"), Chris Sauve (`lemonmade`): engineers who commit to the UCP spec or Shopify's UCP tools.
- Adam Ford: "Developer from the Discounts team here" (forum, 13 Aug 2026).
- Yoni Nesher (forum, Shopify Staff), 8 Oct 2026, https://community.shopify.dev/t/38308 : "The current Cart and Checkout Validation Function input doesn't include a documented sales-channel field". Confirms that Functions cannot see which channel or agent a checkout came from.

---

## 2. What Shopify has said in public about apps extending the agent surface, and about offers or negotiation

1. [P] Apps cannot extend the UCP profile; known gap. Wes, Shopify Staff, 21 Aug 2026, https://community.shopify.dev/t/36329 : "Extending UCP to expose these kinds of fulfilment details is a known gap and is on our radar. At this time, developers can't add to or adjust a merchant's /.well-known/ucp endpoint."
2. [P] No extension point in the UCP tools. Kyle Giesbrecht, Shopify Staff, 28 Jul 2026, https://community.shopify.dev/t/36233 : "the UCP catalog and checkout tools use a fixed, standardized schema so there's no extension point for custom product fields or custom checkout logic through the MCP tools themselves. UCP is built for interoperability, so any agent can shop any merchant's store using the same protocol." On 19 Aug 2026 he added: "the core constraint hasn't changed" and "I'll pass this along as a feature suggestion."
3. [P] The offers question is unanswered. Thread "Managing Offers from Agents", Chris Daly, 13 Apr 2026, https://community.shopify.dev/t/33264 : "we are trying to ascertain if we can surface to the agent that the shop accepts offers from consumers/agents ... It could include a counter offer, so if an Agent offers $75 for a $99 offer the shop could counter offer IRT with $80 and $5 flat shipping to try an secure the order. Is there a way to surface that for the shop?" Zero replies as of 13 Oct 2026.
4. [P] agents.md is the documented, merchant-editable discovery file. Liam Griffin, 20 May 2026, https://community.shopify.dev/t/34049 : "Shopify now uses /agents.md as the primary storefront discovery file for agentic and AI experiences ... To customize the discovery file itself, create or update templates/agents.md.liquid in your theme." Donal, 29 Jun 2026, https://community.shopify.dev/t/35418 : "agents.md.liquid renders in the same restricted context as robots.txt.liquid, and shop.metafields isn't hydrated there." So an app cannot feed that file through shop metafields today; only a theme edit can.
5. [P] Merchant metafields do not reach agents through the catalog tools. Paige, 8 Sep 2026, https://community.shopify.dev/t/37487 : "Shopify doesn't populate the product metadata field in Storefront Catalog MCP responses. Product metafields aren't mapped into it".
6. [P] Agent checkout completion is by grant only. Alan, 2 Sep 2026, https://community.shopify.dev/t/36590 : "Direct complete_checkout is a granted on a case by case basis and there isn't a public application or waitlist for self-serve platforms at the moment."
7. [P] No public partnership intake for agentic builders. Alan, 1 Jul 2026, https://community.shopify.dev/t/35628 : "I'm not aware of a separate public intake form or Community-based process for business development / strategic partnership discussions around AI commerce or storefront-builder tools at the moment. I'd agree that the best next step is to get in touch with Partner Support while logged in to your Partner account ... they can route internally if there's an applicable path."
8. [P] Functions are Shopify's stated answer for app logic in agentic checkout. Gil, 9 Jul 2026, https://community.shopify.dev/t/35930 : "validation functions work across every checkout surface, including agentic checkouts"; "migrate that logic to the discount Function API, which now supports rejecting discount codes with a custom message."
9. [P] Precedent: apps do extend Shopify's merchant agent. Newsroom, 17 Jun 2026, https://www.shopify.com/news/spring-26-edition-dev : "Now, any developer in Shopify's ecosystem can build a Sidekick App Extension." Docs, https://shopify.dev/docs/apps/build/sidekick : "Sidekick currently supports integrations with up to 20 apps for each user on a store."
10. [P] Shopify's own blog acknowledges agent-to-agent discount requests as an emerging model. https://www.shopify.com/blog/agentic-commerce (by Lauren Scherr, updated 25 Sep 2026): "In an emerging agent-to-agent model, which is still largely in development, a shopper's AI agent might request a discount from a retailer's agent without either party manually intervening." This is editorial content, not a product commitment.
11. [P] Shopify's own monetisation of agent surfaces: "Promoted placements will give developers and partners a future path to earn revenue when their Catalog-powered experiences drive sales" and "Shop Campaigns ... now includes ChatGPT" (newsroom, 17 Jun 2026). [I] Shopify may see seller offers to agents as its own territory.
12. [P] In the UCP council Shopify's representative questioned the offer idea but agreed there is demand (minutes 2 Oct 2026, quoted in 1.2).
13. I found no Shopify statement that says apps will be able to register a tool, add an agents.md section, or receive `context.intent` in a Function, and no statement that says they will not.

---

## 3. Official venues an app developer can use

| Venue | URL | What it is | Exact steps | Why useful |
|---|---|---|---|---|
| Shopify developer forum, category "Agentic Commerce" | https://community.shopify.dev/c/agentic/30 | Public Discourse forum; description "A category for providing feedback related to Shopify's MCP and LLM tools & resources." 94 topics; staff reply within days | Sign in with the Shopify Partner account, either reply in thread 36329 (apps extending the UCP profile, where staff already said "known gap") or open one new topic with a concrete request and a minimal example | Staff log feature requests from here and report back in the same thread; it is the only channel staff call official |
| Same forum, category "Functions" | https://community.shopify.dev/c/shopify-functions/15 | Where Discount Function gaps are raised; Discounts-team developers answer | New topic: "Discount Function input: expose UCP context.intent / context.eligibility / agent profile for agentic checkouts", with the use case | Reaches the Discounts team and Gil's area; a related thread (38308) already confirms Functions cannot see the channel |
| UCP Enhancement Proposal | https://github.com/Universal-Commerce-Protocol/ucp/issues/new?template=enhancement-proposal.yml | Formal route for any protocol change. CONTRIBUTING.md: "Proposal: Anyone can submit; idea is proposed and debated. Provisional: TC majority vote to accept" | Prefer commenting on the existing issue #738 (state-bound Offer; milestone 2026-12-08; assignee Greg Smith) and PR #773 before opening a new proposal; a separate proposal only for the buyer-initiated half (priority plus competing-offer link) | The council already discussed offers on 2 Oct 2026 and is deciding on inclusion in the December milestone |
| UCP GitHub Discussions | https://github.com/Universal-Commerce-Protocol/ucp/discussions | 120 discussions; categories Announcements, General, Ideas, Polls, Q&A, Show and tell | Reply in #502 "A Buyer's Agent Should Negotiate" (8 Jun 2026) or #863 (how a third-party app reaches a platform-hosted profile; 0 replies) | Low bar; #863 asks the exact Shopify question and nobody from Shopify or Google has answered |
| UCP Shopping Tech Council minutes | https://github.com/Universal-Commerce-Protocol/meeting-minutes/tree/main/tc/shopping/2026 | Weekly public minutes; newest 9 Oct 2026 | Read each Friday's minutes to see what happened to #773 and who objected | Tells you exactly which objection to answer and when the December milestone is decided |
| UCP Domain Working Group | https://github.com/Universal-Commerce-Protocol/.github/blob/main/GOVERNANCE.md | "A group of 3+ organizations can submit a charter to the Governing Council to form a DWG"; "Any DTC member can submit a DWG charter nomination"; "DWG chairs/co-chairs may invite additional industry participants to contribute to the DWG via the DWG charter issue" | Needs a council member as sponsor. Example of a live one: issue #682 "Domain Working Group (DWG) Charter: Bulk Product Discovery" by James Andersen (Meta) | This is the literal "build it together" mechanism: an Offers working group with outside participants |
| Shopify Partner Support | https://help.shopify.com/en/partners/about/support | Chat or email, only when signed in: reached "by logging into your Partner Account from the Help Center, and then selecting either chat or email support" (read through a summarising fetcher; the page returned 403 to curl) | Sign in, choose the Partner organisation, state the product, the integration and the request | Staff say this is the route that "can route internally" to specialised teams |
| Universal Cart early access waitlist | linked from https://shopify.dev/docs/agents ("Request access" / "Join the early access waitlist.", a Google Form) | The only agentic early-access form I found on shopify.dev | The owner fills it in himself if he wants; it is for agent builders, not seller apps | Shows which team handles early access; weak fit for OfferAd |
| Shopify UCP tool repositories | https://github.com/Shopify/ucp-cli , https://github.com/Shopify/ucp-proxy | Shopify's own open-source UCP client and proxy; maintained by Ilya Grigorik, Josh Larson, Gil Greenberg | Issues are for bugs in those tools, not for platform feature requests | Shows who works on the implementation; a well-formed bug or PR is read by exactly these people |
| WebMCP community group | https://github.com/webmachinelearning/webmcp/issues | W3C community group issue tracker; Yoav Weiss speaks for Shopify use cases | Comment on the relevant issue (for example #312) with the storefront app-embed case | The place where third-party script tools on a page are decided |
| DotDev (annual) | https://dotdev.shopify.com/ | Shopify's developer event; 2026 was in Toronto, 21-22 Jul; page now says "That's a wrap ... Sign up so you don't miss the next one." | Nothing to do now | Where the owners named above present in person |

Not found: an upcoming Shopify or UCP developer event in San Francisco. Search results showed only a past invite-only Shopify dinner (https://www.shopify.com/event/sanfran-mar11, 11 Mar 2026) and a past community meetup. The UCP Summit in November 2026 is mentioned in the 2 and 9 Oct minutes as an invitation event for council members ("32 participants have confirmed attendance"). The UCP governance file mentions "a shared Google group with a mailing list" for public discussion, but I found no link to it.

---

## 4. What I could not confirm

1. Who leads the Shop app's shopping agent. No name found.
2. Who leads Agentic Storefronts as a product. Mani Fazeli's bio says he leads agentic commerce; no separate owner found.
3. Who leads Sidekick overall. Only a secondary, undated page says Vanessa Lee does. Matt Koenig and Adam Barrus are the product managers for Sidekick extensions.
4. That David Moellenkamp owns the discounts product. The only evidence is that he led the DotDev discounts workshop as "Director, Product".
5. Who owns the app platform decision "an app may register an agent tool". No named owner found; Gil Greenberg is the closest verified owner (Functions in agentic checkout).
6. That the forum account "Gil-Shopify" is Gil Greenberg (display name is only "Gil").
7. The surname and title of forum staff "Wes", "Alan", "Paige", "Donal".
8. Job titles of Lee Richmond and Yoav Weiss; the current title of Daniel Wyckoff beyond his own site and GitHub bio.
9. Mikhail Parakhin as CTO: only undated secondary pages; not verified today, so not listed.
10. Any LinkedIn page (not fetched; LinkedIn URLs above come from the people's own sites, profiles or show notes).
11. X handles for Vanessa Lee, Atlee Clark, David Moellenkamp, Ravi Yada, Matt Koenig.
12. A statement from the last six months in their own words for Vanessa Lee, David Moellenkamp, Ravi Yada, Matt Koenig.
13. The Partner Support page text was read only through a summarising fetcher (403 to direct fetch).
14. Whether Shopify plans any of the three missing pieces. Staff say "on our radar" for the UCP profile; nothing public on tools, agents.md sections for apps, or intent in Functions.
15. The investor-relations board page is undated and carries at least one bio that looks stale (Fidji Simo), so Tobi Lutke's title rests on that page plus his own X bio plus the July 2026 DotDev lineup plus September 2026 press, taken together.

---

## 5. Corrections to the earlier notes

- H1 section 7 lists "Daniel Wyckoff, Lee Richmond, Victoria Duggan" as Shopify's Shopping Tech Council members. As of the 12 Oct 2026 MAINTAINERS.md the Shopify members are Daniel Wyckoff, Gil Greenberg, Ilya Grigorik and Lee Richmond. Victoria Duggan was replaced on 15 Sep 2026.
- R5 section 8 has the right four names but gives no titles. Titles now: Grigorik "Distinguished Engineer, Technical Advisor to the CEO"; Greenberg "Staff Product Manager"; Wyckoff and Richmond unverified beyond "Shopify".
- Shopify's author page still calls Mani Fazeli "Director of Product"; his own X bio and two 2026 sources say VP of Product.
- The Shopify members of the Payments Tech Council are Daniel Wyckoff, Ilya Grigorik, Rose Wiegley and Vita Valeikaite (Nick Chen was replaced on 2 Sep 2026).

---

## 6. Method notes

- X: profile pages do not load without login. Single posts were verified through the public embed endpoint `cdn.syndication.twimg.com/tweet-result?id=<id>`, and profile bios through `syndication.twitter.com/srv/timeline-profile/screen-name/<handle>`. The second endpoint returns an unordered sample of old posts, so it cannot be used to find a person's newest post, and it rate-limits quickly.
- Shopify developer forum: Discourse JSON (`/t/<id>.json`, `/c/agentic/30.json`, `/u/<name>.json`, `/search.json`) is public and read-only. Some requests with `?print=true` returned 422; plain requests with a pause worked.
- GitHub: the unauthenticated API quota on this machine was used up, so reads went through `gh api -X GET` (read-only).
- help.shopify.com returned 403 to curl.
