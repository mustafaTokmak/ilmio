# OfferAd outreach plan (editor-in-chief ranking)

Date: 13 Oct 2026. Built from the five researched groups (G1 Shopify, G2 Meta/Sierra/Stripe, G3 OpenAI/xAI/others, G4 Google/WebMCP/UCP, G5 builders and allies) and their adversarial verifications in this folder (`V-G1` to `V-G5`). Only people whose role survived verification (confirmed or corrected) are ranked. Unverified but important people are in tier 2 with the caveat. Dropped people are listed with the reason.

Operating rules for the owner (one person, a working prototype, no audience):

- He sends everything himself. Nobody here has contacted anyone.
- He is a software engineer in San Francisco building a side project. Never "founder".
- Public professional channels only; no guessed addresses; personal Gmail addresses visible on GitHub profiles (Amit Handa, Arjun Garg, Lee Richmond) are not used.
- Every quoted hook below was fetched today or re-verified by the verification pass; where a quote is a minute-taker's paraphrase or a co-signed post, it is labelled.

## 0. What the plan is for

Three missing pieces that only other people can supply:

- (a) Shopify letting an installed app contribute to the store's agent surface (an app-defined tool or UCP extension, an agents.md section, or `context.intent` / `context.eligibility` reaching a Discount Function).
- (b) Agent makers (Meta Muse, OpenAI Dots/ChatGPT, xAI Grok Bot, Perplexity, Google) letting their agents call a seller's offer endpoint or listing an offer connector.
- (c) Protocol groups (UCP, PAP, ACP, WebMCP) adding an offer or reconsideration-offer message.

The single most important finding across all five groups: **the offer message is already on the UCP Shopping Tech Council's table.** Issue #738 (state-bound Offer, outside author Arjun Garg) is on the 2026-12-08 milestone, assigned to Greg Smith (Google), and was debated on 2 Oct 2026; the council said on 18 Sep 2026 that "items without an active implementer behind them are a signal to deprioritize". Issue #929 (Quote extension with a buyer price proposal, Google engineer Sparsh, 11 Oct 2026) is the buyer-initiated half and its checklist asks for "implementer evidence". A live Shopify app that does exactly this is the evidence both threads are missing. That is why the plan starts in those two GitHub threads, not with a note to a CEO.

## 1. Tier 1 (eight people)

Criteria: (a) owns or strongly influences a missing piece, (b) a short note or public comment from an unknown builder has a realistic chance of being read, (c) there is a concrete small ask. Reply odds are rough ranges with reasoning. Where the "channel" is a public GitHub comment, the note is the comment.

### 1.1 Arjun Garg - author of UCP Offer extension #738 / PR #773 (outside contributor)

- Role (verified): author of `[Proposal]: State-bound Offer extension for merchant-proposed Cart changes` (opened 15 Aug 2026, updated 10 Oct 2026), PR #773, #845, draft PR #918. `author_association` NONE: not a maintainer. GitHub profile says company "Intuit"; self-declared only, so do not state it in a message. Source: https://github.com/Universal-Commerce-Protocol/ucp/issues/738 and https://github.com/arjun2075 (fetched 13 Oct 2026).
- Why this person: he writes the text the council is weighing for December. He asked in public, four days ago, for exactly what OfferAd can supply.
- What he controls: the scope, wording and examples of the only offer proposal with a milestone; he does not control adoption (the council does).
- The ask: "Would a worked example on #738 help: buyer priority and competing-offer link in, state-bound offer out, settled on Shopify as a single-use discount code and cart link, plus a test vector backed by a real code?"
- Hook (his own words, 9 Oct 2026, https://github.com/Universal-Commerce-Protocol/ucp/issues/738#issuecomment-6087028190): "A concrete buyer proposal → seller counteroffer → Cart application → Checkout example would be useful for identifying which parts #738 can cover and which belong in the negotiation/handoff work." Same comment: "#738 currently represents a Business-proposed Cart transition; it doesn't define those negotiation states or arbitrary changes to shipping, payment terms, or other commercial conditions."
- Channel: one comment on issue #738. No other published channel.
- Better route: none; the thread is the route.
- Reply odds: 70-90%. He has answered every comment in the thread within a day, thanked a first-time reviewer and changed the PR the same day (28 Aug 2026), and the ask is one he made himself.
- Confidence in role: 0.85.

### 1.2 Sparsh (@isparsh510) - Google London, author of UCP Quote extension #929

- Role (verified): "Software Engineer III @Google London" (own GitHub bio, profile updated 13 Oct 2026, https://github.com/isparsh510); PR #930 commit carries an @google.com address. Author of issue #929 and draft PR #930 (opened 11 Oct 2026). Not a council member. Surname not shown; the commit name is "Sparsh Sparsh", so do not invent one.
- Why this person: #929 is the only UCP text where the buyer's agent opens the bargaining ("optional Buyer price proposal"). It excludes evidence links and non-price terms, which are OfferAd's two additions. The issue is two days old, has no assignee or milestone, and its checklist says "Open questions below resolved with implementer evidence".
- What he controls: the Working Draft text of `dev.ucp.common.quote`.
- The ask: "Would an optional evidence link on the Buyer proposal (a competing-offer URL the Business verifies itself) fit the Working Draft of #929, given a Shopify implementation that settles the accepted price as a single-use code?"
- Hook (his own words, 11 Oct 2026, https://github.com/Universal-Commerce-Protocol/ucp/issues/929): "Commerce today is unidirectional in UCP: the Business lists a price, the Buyer pays it or applies a code." Non-goal, same issue: "Negotiating anything other than price for the current line items (fulfillment, delivery dates, payment timing, warranty)."
- Channel: one comment on issue #929. Mention that the comment on #738 exists so the two threads cross-link.
- Better route: none.
- Reply odds: 60-80%. Fresh proposal, author actively asking for reviewers, and the comment is implementer evidence he asked for.
- Confidence in role: 0.8.

### 1.3 Greg Smith - Google, UCP Shopping Tech Council; assignee of #738

- Role (verified): "Greg Smith | Google" in the Shopping Tech Council table of https://github.com/Universal-Commerce-Protocol/.github/blob/main/MAINTAINERS.md (file last changed 12 Oct 2026; his Google row added 1 Aug 2026, replacing an Amazon row). Led or co-led the weekly meeting on 4, 18, 25 Sep and 2 Oct 2026; put #738 on the 2026-12-08 milestone on 25 Sep and assigned himself on 2 Oct. GitHub @gsmith85 (commits carry an @google.com address). Job title not published.
- Why this person: he decides whether #738 reaches a council vote in December. Minutes of 2 Oct: "Greg Smith will carry the topic into Monday's deep dive session to evaluate potential inclusion in the December milestone." On 9 Oct he polled for extra deep-dive sessions on Wednesday and Thursday, so the offer discussion is probably live this week (14-15 Oct).
- What he controls: triage and milestone placement of community proposals; co-chair of the Bulk Product Discovery working group (a live example of the "build together" structure, issue #682).
- The ask: "On #738, would an implementer note from a live Shopify app (buyer agent states a priority and a competing-offer link, the store answers with a single-use code) help the December decision, and should it go on #738 or #929?"
- Hook (his own words, 2 Oct 2026, https://github.com/Universal-Commerce-Protocol/ucp/pull/773#issuecomment-5943857455): "@arjun2075 apologies for the delay.  Will discuss at Technical Council tomorrow, stay tuned." Council position to cite (minutes 18 Sep 2026, minute-taker's wording): "items without an active implementer behind them are a signal to deprioritize".
- Channel: @-mention inside the #738 comment (no DM; no X or LinkedIn confirmed). In person: AGNTCon + MCPCon North America, San Jose, Thu 22 Oct 2026, 4:40-5:05 PM, room LL20C, "Universal Commerce Protocol" panel with Ilya Grigorik, Amit Handa and Greg Smith.
- Better route: the comment plus the AGNTCon panel question. Both are public record.
- Reply odds: 25-45% for a written reply (he answers outside authors, but took about five weeks on #773). Chance of being read before the December decision: high, because he is the assignee. In person on 22 Oct: a question at the panel is almost certain to be heard.
- Confidence in role: 0.85.

### 1.4 Gil Greenberg - Shopify, Staff Product Manager, agentic commerce; UCP Shopping Tech Council

- Role (verified, corrected): "Gil Greenberg | Staff Product Manager | Shopify" (DotDev lineup, https://dotdev.shopify.com/pages/sessions, 21-22 Jul 2026); X bio read 13 Oct 2026: "Agentic commerce @Shopify. Try it at http://UCP.new Prev: @checkoutblocks (acq by Shopify)"; UCP MAINTAINERS.md row "Gil Greenberg | Shopify" since 15 Sep 2026 (replaced Victoria Duggan). Until at least 9 Jul 2026 he signed forum posts "Product Manager, Checkout"; a developer wrote on 16 Sep 2026 that he was "moving teams". Caution: do not call him the checkout PM, and do not attribute the Discount Function API to him; that sits with the Discounts team.
- Why this person: the most reachable Shopify person who sits where piece (a) is decided: UCP council seat, launched checkout WebMCP (28 Sep 2026), answers Checkout MCP threads himself (9 Oct 2026), and was himself a solo app developer. His site says "Reach out on social media and I'd be happy to grab a coffee (I respond best on Twitter)" (he is in NYC).
- What he controls: the agent-surface half of piece (a): UCP profile direction with Ilya Grigorik, Checkout MCP, checkout WebMCP. Inferred from his talk and posts, not an org chart.
- The ask: "Which team owns what an installed app's Function can see in an agentic checkout, and could the buyer agent's UCP `context.intent` be passed into it so a discount app can answer what the agent asked for instead of guessing?"
- Hook (his own words, 28 Sep 2026, https://x.com/gilgNYC/status/2104583942728822998): "Shopping with an agent shouldn't feel like watching paint dry. Today, we're launching WebMCP support for checkout, including Shop Pay, for all eligible Shopify merchants. Learn how it works, where UCP fits, and what the data shows" (a yawning emoji follows "paint dry." in the original).
- Channel: short public reply or DM on X (@gilgNYC); or a new topic in the forum's Functions category, where his account Gil-Shopify is provably his (posts signed with his name).
- Better route: post the forum topic first, then the X note links it; that way the question is on record even if the DM is missed.
- Reply odds: 35-55%. He invites contact and answers developers, but he changed teams and now has a council seat and a launch to run.
- Confidence in role: 0.85.

### 1.5 Ilya Grigorik - Shopify, Distinguished Engineer and Technical Advisor to the CEO; UCP Governing Council

- Role (verified): "I am a Distinguished Engineer and Technical Advisor to the CEO at Shopify" (https://ilya.grigorik.com/, undated, fetched 13 Oct 2026); MAINTAINERS.md Governance Council row "Ilya Grigorik | Shopify" (12 Oct 2026); Shopping Tech Council member; standing participant on Payments. Top committer on Shopify/ucp-cli and ucp-proxy; merged the `ask` capability (PR #538, 7 Oct 2026).
- Why this person: he is the Shopify vote on whether an offer message is acceptable, and he raised the open question on 2 Oct. Nobody from Shopify has commented on #738 or #773 yet. A comment that answers his recorded question with data is the one thing an unknown builder can put in front of him that he will read.
- What he controls: Shopify's Governing Council vote; what Shopify's generated `/.well-known/ucp` lists; whether Shopify would sponsor a working group.
- The ask: "Could Shopify's generated /.well-known/ucp list an installed app's vendor capability, the way Shopware's profile lists com.shopware.quote, even behind a flag?" (Shopware's profile at sw-ag.dev/.well-known/ucp lists it at version 0.2, per #929.)
- Hook: the 2 Oct 2026 council minutes (https://github.com/Universal-Commerce-Protocol/meeting-minutes/blob/main/tc/shopping/2026/2026-10-02.md), minute-taker's wording, not his words: "Ilya Grigorik questioned whether cart state binding is necessary and probed whether platforms and agent builders would trust or utilize merchant-recommended products." The same minute lists him among those who "confirmed strong industry demand for personalization, reordering, and upselling". His own words, PR #538 (merged 7 Oct 2026): "`ask` answers; it does not act." Do not tell him he opposed offers; do not put the paraphrase in quotation marks as his words.
- Channel: a comment on #738 (he reviews UCP issues weekly). Not a DM: about 70k X followers and 9k GitHub followers; cold notes from individuals are unlikely to be answered. Published email on his GitHub profile exists but a thread comment is the correct route.
- Better route: the #738 comment, then the AGNTCon panel on 22 Oct where he is on stage.
- Reply odds: 15-35% for a written reply; probability the comment is read before the December vote: high.
- Confidence in role: 0.9.

### 1.6 Kasper Kulikowski - Google, Senior Developer Relations Engineer (Chrome, WebMCP docs)

- Role (verified): "I work as a Senior Developer Relations Engineer at Google and I am based in Poland." (https://www.kulikowski.me/about, fetched 13 Oct 2026); listed author of Chrome's WebMCP documentation (https://developer.chrome.com/docs/ai/webmcp, last updated 7 Oct 2026).
- Why this person: he writes Chrome's public guidance on a user's agent meeting a business-side agent, builds the demos others cite, and invited readers to reach out. His topic is exactly OfferAd's WebMCP tool.
- What he controls: no spec authority; shapes Chrome's guidance and demos, relays to the editors (Farolino, Sagar).
- The ask: "You asked readers to reach out: would you look at a two-minute demo where a visiting agent passes its user's priority and a competing-offer link to a store-side harness that answers with an offer the checkout honours, and say what WebMCP is missing for it?"
- Hook (his own words, 13 Jul 2026, https://www.kulikowski.me/blog/): "I'd love to hear how these ideas work out for you, so if you try them, please reach out". And 31 Aug 2026, co-written with Idan Levin (Nekuda) and André Bandarra (Google), https://www.kulikowski.me/blog/bring-your-own-agent: "The user's agent still represents the user. The website harness represents the business. The goal is not to pull control back from the user - it is to create a clear contract between both sides". Attribute the second as co-written.
- Channel: X @kaskulikowski (the handle on his own site; the Chrome author card links a different handle, i_am_kaspa) or LinkedIn https://www.linkedin.com/in/kasper-kulikowski (linked from his site).
- Better route: none needed; also open an issue on GoogleChromeLabs/webmcp-tools proposing the demo (François Beaufort comments daily there).
- Reply odds: 50-70%. Explicit invitation, exact topic, small audience.
- Confidence in role: 0.85.

### 1.7 David Singleton - Meta Superintelligence Labs, VP Engineering and Consumer Products; Meta's voice on the Personal Agent Protocol

- Role (verified, press for the title): "David Singleton, vice president of engineering and consumer products at Meta Superintelligence Labs and former technology chief at Stripe" (CNBC, 6 Oct 2026, https://www.cnbc.com/2026/10/06/meta-joins-companies-to-tame-chaos-of-doing-business-with-ai-bots.html, press). Primary support: his own LinkedIn post (March 2026) that he joined MSL with the Dreamer team. Lives in San Francisco per his own about page.
- Why this person: he is the Meta person who speaks publicly for PAP, the protocol Meta's Muse will use with businesses. The PAP draft (0.1, updated 12 Oct 2026) has no offer message; its Operations extension is the nearest hook; extensions are open to anyone "named with a domain they control" but only work if the personal agent lists them in client metadata. He is the practical route to piece (b) for Meta; Alexandr Wang is not (see tier 2).
- What he controls: inference only: Meta's side of PAP and therefore whether Muse honours an extension. Evidence supports "spokesperson", not "decides".
- The ask: "Will Muse act on a domain-named PAP extension that a merchant declares in poppy.json, or only on extensions defined on personalagentprotocol.org?"
- Hook (his own words, 6 Oct 2026, https://x.com/dps/status/2107565831257567324): "Today we're previewing our work to build an open standard @Meta (@muse and Meta Business Agent) and Sierra are developing along with industry partners at Genesys, NiCE, Decagon, Rocket, Shopify, Stripe, and Walmart that defines how personal agents interact with businesses." Fuller LinkedIn version: "Email as a means of communicating took off because everyone agreed on addressing, delivery and bounces. No one owns it and anyone can build on it. We believe agent commerce will work the same way, which is why we want to define these rails together." Caution: his partner list differs from Sierra's (Decagon is not on the design-partner list on personalagentprotocol.org today); do not repeat his list as the membership.
- Channel: public reply to the X post (only 15 replies, so it is visible) or a LinkedIn comment (https://www.linkedin.com/in/davidpsingleton/, 18 comments on the post). Not the [EMAIL REDACTED] address on his site: it is published "For AI agents" only.
- Better route: send the same point first as a review to the PAP feedback mailbox (section 3.6) so it is on record with the draft's authors, then the public reply says "sent a technology-provider review to the feedback address; one question".
- Reply odds: 15-30%. Senior, but the post has little traffic, he is local, ran a small company before Meta, and writes about developer community.
- Confidence in role: 0.8.

### 1.8 Alexander Embiricos - OpenAI, product lead for Dots and Codex

- Role (verified, press labels disagree): "Alexander Embiricos, OpenAI's Dots product lead" (Sources, 1 Oct 2026, https://sources.news/p/openai-dots-lead-future-chatgpt, press); own X bio reads only "Codex @OpenAI"; TechCrunch Disrupt agenda says "Head of Enterprise Product". Address him by product (Dots), not by title. GitHub embirico (company @openai).
- Why this person: Dots is one of the named agent makers in piece (b), and he speaks for it in his own posts ("Every few days during dots development I would reset my dot...", 6 Oct 2026). He is on stage in San Francisco in two days.
- What he controls: inference from product role: how a dot chooses installed plugin tools during a task and what it does before a purchase. Nothing he has said is about shopping.
- The ask: "When a dot is about to buy from a store, will it call an installed plugin tool that returns the seller's verified offer for that same cart, or only tools the user named in the task?"
- Hook (his own words, 6 Oct 2026, https://x.com/embirico/status/2107588722539823342): "Excited to ship the Meetings plugin! I use it so my dot has the context it needs and stays on top of followups. Also, this is a great example of what you can do with a ChatGPT Plugin Extension!"
- Channel: in person: TechCrunch Disrupt 2026, Moscone West, San Francisco, Thu 15 Oct 2026, 11:15-11:40 AM, Industry Stage - AI, "What Comes After the Chatbot" (ticket needed; the agenda does not say whether there is audience Q&A). Otherwise a public X reply (@embirico).
- Better route: the session; failing that, the plugin-policy half of the question goes to the OpenAI developer forum "ChatGPT Apps SDK" category and Romain Huet (tier 2), because the guidelines ban plugins that "serve advertisements" or are "pass-through intermediary software layers".
- Reply odds: 10-25% on X (a cold reply from an individual is a coin flip at best); 40-60% in person if the session has questions or a hallway moment. Time-boxed: the chance exists only on 15 Oct.
- Confidence in role: 0.75.

Not in tier 1 and why (closest misses): Yoav Weiss (Shopify, WebMCP) is reachable and relevant but his piece is secondary to the UCP decision and his question is answered by filing one issue (section 3.9); Jeff Weinstein (Stripe) publicly invites DMs but Stripe does not own any of the three pieces directly; Wes-Dev-Shopify is a forum reply, listed as a venue; Vignesh Sreedhar is very reachable but cannot speak for Meta; Harry Gao and Gram Liu (Decagon PACT) have the most open door but PACT is a minor protocol whose maintainers have not answered any outside issue yet.

## 2. Tier 2

Verified roles unless marked. Each has one ask. The two people the owner named are first.

### 2.1 Tobi Lutke - Shopify CEO (named by the owner)

- Role: confirmed. "Mr. Lütke has served as our Chief Executive Officer since April 2008." (https://www.shopify.com/investors/board-of-directors, undated, fetched 13 Oct 2026); X bio read 13 Oct 2026: "Shopify CEO by day, Dad in evening, hacker at night, Aspiring comprehensivist."; DotDev lineup Jul 2026 "CEO".
- What a note can and cannot achieve: he controls whether Shopify opens the store's agent surface to apps at all, so a yes from him would settle piece (a). But a cold DM to a public-company CEO with 517k followers will almost certainly not be read, and his 21 Sep 2026 Muse post has about 400 replies, so a reply there is one of hundreds. The claim that he has answered individual app developers on X in the past was not verified. A note to him cannot get a technical answer; at best it is a flag that a public question exists.
- Better route: do the Shopify work first (Gil Greenberg, forum thread 36329, Functions topic, #738 comment). Only then, if wanted, one short public reply to a post of his that names one concrete gap and links the demo and the forum thread.
- Hook (his own words, 21 Sep 2026, https://x.com/tobi/status/2102090718546198790): "We are excited to announce we are partnering deeply with Muse to enable agentic checkout with Shop Pay on all Shopify stores, offering people an easy and delightful way to shop and check out with Muse." Press line that fits (fs.blog, 10 Sep 2026, transcript on a press site): "I believe it should be easier to solve any kind of problem related to commerce inside of Shopify than outside of Shopify."
- The ask: "Should an installed app be able to add one tool to a store's agent surface, the way Sidekick App Extensions let apps into Sidekick?" (Precedent, Shopify newsroom 17 Jun 2026: "Now, any developer in Shopify's ecosystem can build a Sidekick App Extension.")
- Channel: X @tobi, public reply only. tobi.lutke.com's newest post is from 2019; not a live channel.
- Reply odds: under 5%.

### 2.2 Alexandr Wang - Meta, Chief AI Officer, Meta Superintelligence Labs (named by the owner)

- Role: confirmed from secondary sources only. "Alexandr Wang (Chief AI Officer, Meta Superintelligence Labs)" (Cheeky Pint interview page, 12 Oct 2026, https://cheekypint.substack.com/p/muse-wonder-zuckerberg-and-wangs); CNBC 8 Sep 2026 "Meta AI chief"; TechCrunch 22 Sep 2026 "Meta's Chief AI Officer". Meta's own executive pages could not be fetched (400/403). Whether the Muse product team (Nat Friedman, "Nat's team" per Zuckerberg) formally reports to him in 2026 is unverified; March 2026 press reported some teams reassigned away from MSL.
- What a note can and cannot achieve: Muse is built in MSL, so he sits over piece (b) for Meta. But his posts draw hundreds of replies (358 replies, 6,589 likes on a 24 Sep post), there is no evidence he reads cold notes, and he does not own the connector rules or the PAP text day to day. A note cannot get a connector listed or a protocol field added; it can only ask who should.
- Better route: David Singleton (tier 1) for PAP; the Muse Connector Platform submission (section 3.11) for distribution; Vignesh Sreedhar or James Andersen for Meta's protocol engineers; a public demo post that tags @muse is likelier to be seen than a DM.
- Hook (his own words, 12 Oct 2026, Cheeky Pint transcript, speaker label Alexandr Wang): "I think Muse is one of the first products where you're actually people are fully delegating purchases to the agents." Related, Zuckerberg in the same interview: "over time there are lots of different ways to effectively take a small cut of what you are saving or making for people". Caution: the interview is hosted by John Collison of Stripe.
- The ask: "Who on the Muse team should receive a two-page spec for a seller offer endpoint that Muse could call before checkout?"
- Channel: X @alexandr_wang (verified, Meta affiliation label), public reply.
- Reply odds: under 5%.

### 2.3 Shopify

- **Mani Fazeli**, VP of Product, leading agentic commerce. X bio read 13 Oct 2026: "VP of Product @Shopify, leading agentic commerce."; Sierra PAP post 6 Oct 2026 attributes him as "VP Product, Shopify". Shopify's author page still says Director: stale. Ask: "If Shopify implements the Personal Agent Protocol for stores, will an installed app be able to answer part of the agent session (for example a conditional offer), or will it be Shopify-only like today's UCP profile?" (Sierra lists Shopify as a partner, not an implementer, so "if", not "when".) Hook, his own words on the Sierra page, 6 Oct 2026: "Personal Agent Protocol helps establish how agents and merchants can work together to make that happen." Channel: X @mcfazeli (about 4k followers). Odds 10-20%. More reachable PAP route into Shopify than Tobi Lutke.
- **Yoav Weiss**, web platform at Shopify; WebMCP contributor. "These days I'm working at Shopify on improving the web platform" (https://blog.yoav.ws/about/, undated); GitHub company @Shopify; X bio "Web platform @shopify". Ask: "Does Shopify expect app embed scripts to register their own WebMCP tools on a storefront next to Shopify's, or should apps plan for a Shopify-only tool set?" Hook, 17 Sep 2026, https://github.com/webmachinelearning/webmcp/issues/312: "Playing around with WebMCP, I find myself in situations where the agent is not aware of the page's context." Channel: a comment on #312 or a new focused WebMCP issue; also X @yoavweiss. Odds 40-60% on GitHub.
- **Wes (Wes-Dev-Shopify)**, Shopify Staff, forum admin and moderator; surname and title not published. Ask (in thread 36329): "Could you add the offer use case (an installed app answering a buyer agent with a conditional offer) to the same internal feature request, and say whether an early-access preview exists?" Hook, 21 Aug 2026, https://community.shopify.dev/t/36329: "Extending UCP to expose these kinds of fulfilment details is a known gap and is on our radar. At this time, developers can't add to or adjust a merchant's /.well-known/ucp endpoint. I'll follow up in this thread if anything changes on that front." Caution: "known gap" refers to fulfilment details, not offers. Odds of a staff reply 70-90%; power over product: none.
- **Eytan Seidman**, VP of Product, developer platform. Shopify newsroom 10 Dec 2025: "says Shopify's VP of Product Eytan Seidman"; X bio @eytanseidman read 13 Oct 2026 via mirror: "Product @shopify working on our Developer Platform." Caveat: no statement in the last six months; title confirmed from a Dec 2025 page plus today's bio. The most plausible owner of the decision to let an app register a tool on the store's agent surface. Ask: "Is a buyer-facing counterpart to Sidekick App Extensions (apps contributing a tool to the store's agent surface) on the developer platform roadmap?" Odds 5-15%.
- **Adam Barrus**, Senior Staff Product Manager, Sidekick app extensions (DotDev lineup Jul 2026); maintains https://github.com/Shopify/app-intent-types and merged the `application/quote` intent type (sales quotes and negotiation) on 28 Aug 2026 after an app developer asked in forum thread 35737. Ask: "Was a buyer-facing version of app extensions considered when Sidekick App Extensions were designed, and is app-intent-types the right place to propose one?" Channel: an issue in that repository. Odds 30-50%. Better than Matt Koenig (dormant forum account, no handle).
- **Daniel Wyckoff**, Shopify payments platform developer; UCP Shopping and Payments Tech Councils (MAINTAINERS.md 12 Oct 2026; GitHub bio). Title unverified; do not state one. Ask: "Would a conditional offer such as 'credit on the next order' or 'longer returns' belong in purchase options and policies (PR #890), or in the Offer extension of #773?" Channel: comment on PR #890. Odds 30-50%.
- **Josh Larson**, senior staff engineer at Shopify (X bio @jplhomer), second-largest committer on Shopify/ucp-cli. Only for real bugs or fixes in ucp-cli; no outreach ask.

### 2.4 Meta, Sierra, Stripe

- **Vignesh Sreedhar**, software engineer, Meta fintech org, San Francisco; author of the last merged ACP change (#281, 18 Jul 2026). Own site: "I work on agentic commerce infra across Meta surfaces (Muse, Ads, Meta AI), shape industry protocols". Early-career individual contributor; cannot speak for Meta. Narrow ask: "How does an outside ACP SEP get a sponsor in practice, and is a seller reply to an intent trace something your team would read?" Channel: X @vigstar1 or the contact address he publishes on his own site. Odds 40-60%.
- **James Andersen**, Meta, UCP Shopping Tech Council (MAINTAINERS.md 12 Oct 2026); LinkedIn linked from his GitHub profile. Ask: a review comment on #738 or #929, not a commitment about Muse. Channel: the UCP threads. Odds 20-40%.
- **Lee Hwa**, Meta's ACP Technical Steering Committee seat (GitHub lhwa; governance.md 24 Apr 2026); author of merged Suggested Pricing SEP (#201). Title and gender not public; use the name. Ask: "Would Meta sponsor a Reconsideration Offers SEP that answers an intent trace with a revised offer, given Suggested Pricing covers the request side?" Channel: the SEP issue. Odds 15-30%; ACP has merged nothing since 18 Jul 2026.
- **Nat Friedman**, head of product, Meta Superintelligence Labs (press wording, TechCrunch 22 Sep 2026; Zuckerberg: "Nat's team"). Caveat: title is press-only. Ask: "May a Muse connector tool return a seller's labelled conditional offer while Muse is comparing options, or do the connector rules exclude that?" Channel: public X reply with a demo. Odds under 10%; his 21 Sep reply was to a viral post, not a cold note.
- **Bret Taylor**, Sierra co-founder; CNBC says he is leading the PAP initiative; chairs OpenAI. His LinkedIn version of the PAP post ends "if anyone is interested in joining let me know!" (6-7 Oct 2026). Ask: "Are seller-proposed offers in scope for the PAP design workshops, and may an independent implementer attend one?" Channel: a short LinkedIn reply saying a technology-provider request went to the feedback address (https://www.linkedin.com/in/brettaylor/). Odds 5-15%.
- **Jeff Weinstein**, Stripe, Product Lead, Agentic Commerce (Stripe byline 18 Mar 2026; Stripe affiliation label on X 6 Oct 2026). He publishes contact routes himself for stated purposes (28 Jul 2026 hiring thread; 1 Sep 2026 programme for service platforms). Ask: "Does Stripe want a seller-side revised-offer step in ACP or in PAP, so a proposal goes to the right standard?" Hook, 1 Sep 2026, X id 2094849375436755441: "You can't always purchase easily via agent, there's slow back and forth with the service via browser, and sometimes it gets blocked." Channel: X @jeff_weinstein. Caution: linkedin.com/in/jeffweinstein is a different person. Odds 25-45%.
- **Prasad Wangikar**, Stripe's ACP TSC seat and UCP Shopping/Payments councils; wrote ACP governance and operating model. 2025 bio: Principal Engineer, Payments Intelligence (secondary). Recent LinkedIn post (about 1-6 Oct 2026): "agentic purchases on Link grew 38x in the past month ... whether those purchases actually complete, and whether people trust them enough to keep saying yes." Ask: "Does a Reconsideration Offers proposal belong as a new SEP or an ACP extension, and what would make it sponsorable?" Channel: LinkedIn comment (https://www.linkedin.com/in/prasad-wangikar/) or the SEP issue. Odds 20-40%.
- **Steve Kaliski**, Stripe Principal Software Engineer, Engineering Lead Agentic Commerce (Stripe Sessions 2026 list; byline 18 Mar 2026); NYC. Hook (stripe.dev, 22 Sep 2026): "We believed WebMCP, an emerging standard gaining traction, was a strong candidate to improve the agent checkout experience." Ask: "Does Stripe Checkout's WebMCP surface let the merchant side add a tool, or only Stripe's?" Channel: X @stevekaliski or the email link he publishes on stevekaliski.com. Odds 25-45%.
- **Kevin Miller**, Stripe Business Lead for Payments; LinkedIn posts draw 1-8 comments. Ask: "Who at Stripe owns the seller's reply to an agent that walks away?" Odds 5-15%. Use Prasad or Weinstein first.

### 2.5 OpenAI, xAI, others

- **Aravind Rao**, OpenAI's ACP TSC seat (GitHub aravindrao-openai); co-author of the Promotions API (#191, which already shipped). Title unverified. Ask: "Would you sponsor a small Reconsideration Offers SEP, and what would you need to see first?" Channel: an Ideas Discussion in the ACP repo @-mentioning him. Caution: #191 has 0 comments since March and discussion #304 (the sponsor-request pattern) has 0 replies; no steering member has commented since August 2026. Odds 10-25%.
- **Romain Huet**, OpenAI Head of Developer Experience (own bio, "working on Codex and our API"). Hook, 6 Oct 2026, https://x.com/romainhuet/status/2107307387262832883: "ChatGPT plugins are a great way to get your product into more people's hands." Ask: "Who on the plugins team can say, before I submit, whether an offer-returning plugin fits the 'Advertising' rule?" Channel: X @romainhuet. Odds 20-35%; he does not own review decisions.
- **Tibo Sottiaux**, leads ChatGPT and Codex (Lenny's Newsletter 4 Oct 2026; own bio "Codex & ChatGPT @OpenAI"). Ask: "Is a plugin that returns a seller's concrete, checkout-valid offer when the user is about to buy 'legitimate functionality' or an 'advertising vehicle' under the plugin guidelines?" Channel: X @thsottiaux. Odds under 10%.
- **Roman Ugarte**, SpaceXAI, building Grok Bot (own X bio "Building @Bot at @SpaceXAI"; Lenny 8 Sep 2026). Title unverified. Hook: he reposted @bot on 8 Oct 2026, "Grok Bot can now help run your Shopify store." Ask: "Before Grok Bot orders, would it call an installed plugin that asks the seller for a verified better offer on that exact cart?" Channel: X @romanugarte_. Odds 15-30%. Better first contact: **Matt Palmer**, DevRel and Product for Grok Bot (own site palmer.gg: "I work at SpaceXAI (via Cursor)"; X @mattyp); same ask. Odds 30-50%.
- **Harry Gao** and **Gram Liu**, Decagon Members of Technical Staff, PACT authors and maintainers (byline 6 Oct 2026; Liu has 13 merged PRs and triages outside PRs). One issue, not two notes. Hook (co-signed post, 6 Oct 2026): "By publishing the specification openly, we're inviting other personal-agent developers, businesses, and agent platforms to implement it and help shape its evolution." Ask: "Would PACT accept an optional message in which the business agent returns a concrete offer (terms, expiry, how it is redeemed at checkout), and is issue #59 the right place?" Channel: PACT issue #59. Caution: no maintainer has replied to any outside issue yet; PACT's scope is identity and consent; Decagon says it is joining the PAP working group. Odds 30-50% eventually.
- **Noah Shinn**, founder of Instinct (own X post, 26 Aug 2026: "I'm Noah, the founder of Instinct."). Hook, 28 Sep 2026, https://x.com/noahrshinn/status/2104628465488306183: "35% of our users use Instinct for personal shopping. Today, we're partnering with @Shopify to bring product discovery, checkout and order updates into one conversation." Ask: "When Instinct sets up a Shopify order for Shop Pay checkout, can it pass a merchant-issued single-use discount code, or only promo codes tied to the user's Shop account?" Channel: X @noahrshinn. Odds 10-20% (14 people, ten-billion valuation, crowded inbox).
- **Dominic Farolino**, WebMCP spec editor, Chrome. Hook, 28 Sep 2026 on #261: "implement it outside the spec, gather experience, and then file focused issues if that work reveals specific WebMCP primitives that are actually missing." Ask: "Is a tool registered by a third-party app script in a store's top-level document meant to stay indistinguishable to browser agents from the platform's own tools, or will provenance be exposed (you mentioned letting the implementer choose which origins can execute the tool)?" Channel: one narrow WebMCP issue. Caution: #266 "Implementation report: agent commerce storefront" by an outsider was closed 28 Sep 2026; a general pitch gets closed. Odds 40-60% for a narrow spec question.
- **Sam Dallstream**, Microsoft Edge, "the main point of contact for WebMCP dev at Microsoft" (own comment, 1 Oct 2026, #328). Ask: "During the Edge 150 origin trial, does Copilot in Edge call WebMCP tools that a third-party script registers on a store page?" Caution: Microsoft's only public line (Walderman, 31 Jul 2026) is that there is nothing to share about in-browser Copilot integration. Channel: @-mention in a WebMCP issue. Odds 30-50%.
- **Amit Handa**, Google's UCP Governing Council member; led the Shopping council on 9 Oct 2026. Title "Director of Engineering, Google Commerce" is from 11 Jan 2026 only. Hook (slides, 8 Sep 2026, W3C/GS1 workshop): "Grab a pencil and contribute to UCP - ucp.dev ... Contribute your feedback, extensions, and code to the public repository." Ask: "#738 is on the 2026-12-08 milestone and #929 is on none; would an implementer note from a live Shopify app help either, and which should it go on?" Channel: @-mention in the #738 comment; AGNTCon panel 22 Oct and his 23 Oct 10:55 AM session. Odds 15-30%.

## 3. Venues: where filing beats a personal note

### 3.1 UCP issue #738 (state-bound Offer) - first action

- URL: https://github.com/Universal-Commerce-Protocol/ucp/issues/738 (PR #773)
- What to file: one comment, under 300 words, structured as the worked example Arjun Garg asked for on 9 Oct: (1) buyer agent request: priority (e.g. "fastest delivery") plus competing-offer URL; (2) seller verification of the link and the answer: a state-bound offer with a non-price term (free express shipping) and an expiry; (3) settlement on Shopify: single-use discount code submitted through the documented `discounts.codes` field, with a cart link; (4) a link to a public demo store and the `com.offerad.*` schema served from the owner's domain; (5) one question: which of this belongs in #738 and which in #929 or the negotiation/handoff work. @-mention @gsmith85 and @arjun2075. Do not pitch; do not mention competitors.
- Exact steps: read the full thread first (Chris Daly and Weston have commented; Arjun asked Daly a follow-up on 10 Oct). Post from the owner's GitHub account. No CLA is needed to comment; a Google CLA is needed only for a pull request. Then watch the Shopping Tech Council minutes (next file expected 16 Oct 2026) for the outcome.

### 3.2 UCP issue #929 (Quote extension, buyer price proposal)

- URL: https://github.com/Universal-Commerce-Protocol/ucp/issues/929 (draft PR #930)
- What to file: one comment with implementer evidence: the gap (no evidence link, no non-price priority) and how a Shopify-side implementation settles the accepted price. Cross-link to the #738 comment. Reviewer tagged by the author: Jing Li (Google, Shopping Tech Council).

### 3.3 UCP discussions #863 and #502

- URLs: https://github.com/Universal-Commerce-Protocol/ucp/discussions/863 (how a third-party app reaches a Shopify-hosted profile; 0 replies since 25 Sep 2026) and https://github.com/Universal-Commerce-Protocol/ucp/discussions/502 ("A Buyer's Agent Should Negotiate").
- What to file: in #863, add the OfferAd case under Yang W.'s question so the question to Shopify carries two apps. In #502, a reply to Juan Fernández (Shopware) and Chris Daly linking the #738 example. Later: a "Show and tell" post for the `com.offerad.*` vendor extension once it is live.

### 3.4 Shopify developer forum, thread 36329 and a Functions topic

- URLs: https://community.shopify.dev/t/36329 (Agentic Commerce category) and https://community.shopify.dev/c/shopify-functions/15
- What to file: (1) a reply in 36329 adding the offer use case to the feature request Wes logged and asking whether an early-access preview exists; (2) a new Functions topic titled along the lines of "Discount Function input: expose UCP context.intent / context.eligibility for agentic checkouts", with the use case and what the app would do with the value. Discounts-team developers answer there (Adam Ford, 13 Aug 2026: "Developer from the Discounts team here"). Staff confirmed on 8 Oct 2026 (thread 38308) that validation Function input has no sales-channel field, which is the adjacent gap.
- Exact steps: sign in with the Partner account; one topic, one question each. Also note thread 33264 "Managing Offers from Agents" (13 Apr 2026) has had no Shopify reply in six months; link it rather than reviving it.

### 3.5 AGNTCon + MCPCon North America 2026 (San Jose, 22-23 Oct)

- URL: https://events.linuxfoundation.org/agntcon-mcpcon-north-america/
- What to do: buy the Thursday 1-Day Pass (listed at $475; the $149 Expo pass excludes sessions). Thu 22 Oct: 12:10-12:55 PM open lunch table "Topic 1: Agentic Commerce"; 4:40-5:05 PM room LL20C, "Universal Commerce Protocol" panel with Ilya Grigorik, Amit Handa, Greg Smith. Ask one question: how does a third-party app's capability reach a Shopify-hosted UCP profile (discussion #863, unanswered since 25 Sep)? Fri 23 Oct: 10:55 AM UCP and AP2 session (Amit Handa); 4:05-4:30 PM room 210C, Francesco Marinoni Moretto on ucp-probe (merchant's side). This is the one room in the next month where the people deciding #738 are physically present, within driving distance.

### 3.6 Personal Agent Protocol: feedback on draft 0.1 and design-partner request

- URL: https://personalagentprotocol.org/docs/path-to-1
- What to file: a review in the format the site asks for: title "Review of the Personal Agent Protocol docs (2026-10-12)", a 2-3 sentence summary, points grouped by section id (extensions-operations#revisions, spec#extensions, General), each labelled Gap / Ambiguous / Contradiction / Risk / Wording / Question with a suggested fix. The point: Operations covers company-proposed terms with revisions and expiry but has no way for a company to propose a conditional offer in response to a stated priority or proof; propose it as a "broadly useful extension". Email it to the feedback address printed on the page ([EMAIL REDACTED]). In the same mail, request design-partner status as a technology provider (the page asks for a technical and a partnership contact; it neither admits nor excludes individuals).
- Caution: feedback is licensed to all members and users, perpetual and royalty-free. There is no public repo, tracker, mailing list or named editor. Design workshops were promised "over the next month" (9 Oct 2026) with no date yet.

### 3.7 ACP: Reconsideration Offers SEP

- URL: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/docs/sep-guidelines.md ; the hook text is in https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/rfcs/rfc.intent_traces.md ("A subsequent RFC MAY define **Reconsideration Offers** keyed to specific reason codes.")
- What to file: first ask Tomas Taylor (section 4) whether he is writing it. If not: a GitHub Issue tagged SEP and proposal with preamble, ~200-word abstract, motivation, specification (a minimal offer response keyed to `reason_code`, with expiry and redemption), rationale, backward compatibility, reference implementation, security. Then one Ideas Discussion asking for a sponsor (seats: OpenAI aravindrao-openai, Stripe prasad-stripe, Meta lhwa; two of three needed; OpenAI and Stripe hold vetoes).
- Cautions: no commit on main since 18 Jul 2026; 144 open issues; recent SEPs unlabelled and unassigned; unsponsored proposals may be closed as dormant after three months. Governance forbids "product marketing or self-promotion" and "direct comparisons between competing products" in ACP channels. A pull request needs OpenAPI and JSON Schema under spec/unreleased/, a changelog file and a signed individual CLA. Treat ACP as the third protocol, not the first.

### 3.8 WebMCP: one narrow issue, the community group, and a demo

- URLs: https://github.com/webmachinelearning/webmcp/issues ; join at https://www.w3.org/community/webmachinelearning/join ; demos at https://github.com/GoogleChromeLabs/webmcp-tools ; TPAC agenda issue https://github.com/webmachinelearning/meetings/issues/39
- What to file: (1) join the free Community Group (W3C account needed; owner does it); (2) one focused issue: "Provenance of tools registered by third-party app scripts on hosted storefronts" with the real implementation experience, @-mentioning @domfarolino, @yoavweiss and @sjdallst2; or comment on #312 (Yoav Weiss's page-context issue) if the point fits there; (3) an issue in GoogleChromeLabs/webmcp-tools proposing a small demo: a store page whose `request_offer` tool takes the shopper's priority and returns a code the checkout tool accepts (François Beaufort comments daily; a Google CLA is needed for the PR). TPAC 2026 is in Dublin on 26-27 Oct (remote attendance possible); the WebMCP day is reported as Tue 27 Oct; propose a five-minute implementer report on issue #39 only after the focused issue exists.
- Caution: editors close general pitches (#266 closed 28 Sep 2026). Chrome routes: Chromium bugs at https://crbug.com/new?component=2021259 ; early preview programme form at https://developer.chrome.com/docs/ai/join-epp.

### 3.9 Shopify/app-intent-types (Sidekick extension precedent)

- URL: https://github.com/Shopify/app-intent-types ("Public catalog & proposal venue for Sidekick app extensions intent types"; maintainer Adam Barrus; `application/quote` merged 28 Aug 2026 eight weeks after a forum request in thread 35737).
- What to file: an issue asking whether a buyer-facing counterpart (an app contributing a tool to the store's agent surface) has a proposal venue, and pointing to the forum topics. This is the one place Shopify has shown a public proposal process for apps extending an agent.

### 3.10 TechCrunch Disrupt 2026 (San Francisco, 13-15 Oct)

- URL: https://techcrunch.com/events/tc-disrupt-2026/agenda/
- What to do: if a pass is affordable, attend Thu 15 Oct 11:15-11:40 AM, Industry Stage - AI, Alexander Embiricos, "What Comes After the Chatbot", and ask the Dots question (tier 1.8). Also 13 Oct: "The Future of Money Movement in the Agentic Economy". Time-boxed; skip without regret if the pass is out of reach.

### 3.11 Muse: connector submission and custom connector demo

- URLs: https://muse.ai/platform (reviewed directory) and the custom-connector route described at https://about.fb.com/news/2026/09/introducing-muse-small-business/
- What to do: (1) today: use a Muse custom connector pointed at the OfferAd endpoint to record a demo (Meta does not review these; it is a demo route, not distribution); (2) when the connector satisfies the rules, submit through "Submit a connector" with overview, business verification, data questionnaire, endpoint/auth and tool docs labelled read/write/sensitive-write, and a test account. Rules that bite: 1.1 a connector that only sends the user to checkout fails the completion rule; 3.2 tools must not steer Muse away from competitors or force recommendations; 4.3 advertising and sponsored results must be labelled and discounts must be real; 5.7 Meta does not answer status messages. The terms page returned HTTP 400, so fees and eligibility for individuals are unknown.

### 3.12 OpenAI plugin portal and developer forum

- URLs: https://platform.openai.com/plugins ; https://community.openai.com (category "ChatGPT Apps SDK"); guidelines https://developers.openai.com/plugins/plugin-guidelines.md
- What to file: one forum question quoting the Advertising rule ("Plugins must not serve advertisements and must not exist primarily as an advertising vehicle.") and the pass-through rule, describing an offer-returning tool, and asking which side of the line it falls. Then submit a per-merchant plugin (safer than a cross-store broker) after individual verification; appeal by replying to a rejection email. Guidelines also require external checkout on the merchant's domain and allow commerce only for physical goods.

### 3.13 Grok Bot and Perplexity routes

- Grok custom MCP connectors (https://grok.com/connectors): works today for the existing OfferAd connector; distribution is by sharing the URL. Grok Bot's catalog is the Cursor Marketplace: https://cursor.com/marketplace/publish (curated, manually reviewed, open-source plugins only); a Showcase post on https://forum.cursor.com can precede it.
- Perplexity Connector Marketplace: https://pplx.ai/connector-form-submission (companies only; "does not guarantee") and the published team address [EMAIL REDACTED]. Low priority.
- Anthropic Connectors Directory: policy 4.C excludes software that "serves advertisements, sponsored content, paid product placements"; ask [EMAIL REDACTED] whether a seller's own conditional offer counts before building for it.

### 3.14 Shopify Partner Support and early access

- https://help.shopify.com/en/partners/about/support (signed in): forum staff say there is no public intake for agentic partnerships and that Partner Support "can route internally if there's an applicable path". State the app, the current integration and the specific request. The Universal Cart waitlist on https://shopify.dev/docs/agents is aimed at agent builders; weak fit, optional.

### 3.15 UCP Domain Working Group (the literal "build together" mechanism, later)

- URL: https://github.com/Universal-Commerce-Protocol/.github/blob/main/DOMAIN_WORKING_GROUP_CHARTER.md
- Rule: "A group of 3+ organizations can submit a charter to the Governing Council to form a DWG"; the nomination is filed by a Tech Council member; chairs "may invite additional industry participants". An individual cannot start one but can be invited. Candidate organisations from the threads: Shopware (Agentic Commerce Lab), I Want That!, Facet, StabileRewards, Klarna (Provash Shoumma, #810/#811), Salesforce (Scot DeDeo, PR #482). Candidate sponsors: Greg Smith or Amit Handa (Google), Ilya Grigorik or Gil Greenberg (Shopify), James Andersen (Meta). Live example: issue #682 (Bulk Product Discovery charter, James Andersen). Raise only after the #738 and #929 comments have been answered.

## 4. Partners: co-builders and complements (not gatekeepers)

- **Chris Daly**, Founder, I Want That! Inc (Columbus, Ohio). Kind: competitor who is also the loudest ally in UCP (#502 author, active on #738). Why: Arjun Garg asked both of you for the same worked example; co-writing it makes the evidence two implementations wide. His own 10 Sep 2026 line in #502: "I think I still have name-spaced UCP, Shopify blocked it and it has to be delivered as a theme extension". Channel: reply in #502 or #738 (the HubSpot link on his site is for customers). Odds 70-90%.
- **Yang W.**, Founder, StabileRewards (Dublin, CA, not San Francisco). Kind: complement (loyalty app with the same Shopify-hosted-profile blocker; #863 author). Ask: add the OfferAd case under #863 and compare notes somewhere in the Bay Area. Channel: #863 comment, then [EMAIL REDACTED] (company address on the site). Odds 60-80%.
- **Weston**, Founder and CEO, Facet (San Francisco per GitHub). Kind: complement (UCP checkout and directory for non-platform stores; first outside reviewer of #738). Ask: "Would Facet's directory listing schema take an optional offer-endpoint field?" Channel: the Facet community Slack linked from https://facet.llc/ or a #738 reply. Odds 60-80%.
- **Juan Fernández**, Product Manager, Shopware Agentic Commerce Lab. Kind: possible partner (Shopware ships `com.shopware.quote` in a live UCP profile; the plugin agentic-commerce-lab/merchant-quote-agent-plugin is MIT-licensed, so the reuse question is answered). Corrected ask: "Would Shopware accept a consumer (non-RFQ) profile of the same propose / counter / accept shape, so a Shopify-side endpoint and Shopware's become one interoperable example?" Channel: reply to his #502 comment. The engineers who build it are Sebastian Hölscher (HoelShare) and Lukas Rump (lukasrump). Odds 40-60%.
- **Tomas Taylor**, Co-Founder and CTO, Pennant (YC Summer 2026; YC lists New York, his site says San Francisco). Kind: co-author for the ACP Reconsideration Offers SEP; wrote the Intent Traces RFC (and Affiliate Attribution, #57). Ask: "Are you writing the Reconsideration Offers RFC your Intent Traces text reserves, and if not would you read a one-page draft before I open it as a SEP?" Channel: X @0xtotaylor. Odds 30-50%; no ACP activity since January 2026.
- **Discount Kit** (Sammy Isseyegh and Dave Spanton, co-founders, Optizio Ltd; 2026 Shopify Build Award). Kind: settlement-layer partner (Rust Discount Function engine). Ask: "Can one function keyed to a single code apply a product discount, a shipping discount and a zero-priced gift line together, and would you let another app create such codes through an API?" Channel: the "Book a call" link on https://discountkit.app/about/ ("The core team is always around for a chat"). Odds 60-80%.
- **Tobe Osakwe**, Founder and CEO, Regios Technologies (Regios Automatic Discounts). Kind: settlement-layer partner. Ask: "Would Regios accept a single-use code created by another app and turn it into a multi-effect discount through your Function?" Channel: LinkedIn https://linkedin.com/in/tobebuilds (the contact page reaches support staff first). His home page: "If you're wrestling with a discount Shopify can't handle, reach out. I read every message." Odds 50-70%. Verify the "25 function slots" figure before using it.
- **Francesco Marinoni Moretto**, Milan; author of the forthcoming Selling to Agents; maintainer of ucp-probe; AGNTCon speaker 23 Oct. Kind: ally and amplifier (merchant's side). Corrected ask: "ucp-probe is read-only and sees only the profile and MCP tools; what would an unaffiliated agent need to find in a Shopify store's profile to discover an app's offer endpoint at all?" Also his UCP discussion #867 (measurement frame). Channel: meet after his talk; GitHub frmoretto; LinkedIn in/francesco-moretto. Odds 60-80%.
- **Scot Wingo**, co-founder and CEO of ReFiBuy; author of Retailgentic. Kind: amplifier. Hook, 6 Oct 2026: "ChatGPT appears to be executing towards their goal of ads that simultaneously don't erode trust, add to the overall experience and give the advertiser high ROI for the impact." Ask: "Would you watch a two-minute recording of a Shopify store answering a personal agent with a verified price-match offer and say whether merchants you talk to would want it?" Channel: comment on a Retailgentic post; LinkedIn in/thescotwingo. Odds 20-40%. Do not call his newsletter "the most-read"; unsupported.
- **Jiaxin Pei**, Assistant Professor, UT Austin School of Information (A2A negotiation benchmark with PhD student Shenzhe Zhu). Kind: research partner. Caution: the "please reach out" line on his page is about his Fall 2026 course, not negotiation. Ask: "Would your group want a live Shopify test store where a code-enforced seller answers real buyer agents, as a field setting for the agent-to-agent negotiation benchmark?" Channel: [EMAIL REDACTED] (published on his page and UT's). Odds 30-50%.
- **Ben Ouattara**, Founder, Flux (UK). Kind: direct competitor (price-only negotiation via custom GPT and Claude MCP, settled with single-use codes; own UCP profile on its own domain, not the store's). Do not approach with design details (link verification, non-price terms). If contacted at all, only the measurement-swap question through [EMAIL REDACTED]. Low priority.

## 5. Dropped (with reason)

- Holly Li (OpenAI): only "product team member" who ran the Dots demo; no title, channel or ownership.
- Nayna Sheth (Microsoft): every source dated 8 Jan 2026; role today unverified; no channel.
- Ginny Marvin (Google Ads Liaison): role not confirmed after June 2026; no control over the product; no Direct Offers statement.
- David Moellenkamp (Shopify Director, Product): discounts ownership is an inference from one workshop; no channel; no statement. Use the Functions forum category.
- Vanessa Lee (Shopify VP Product): X @vlaurenlee exists, but no statement in the last six months and Sidekick leadership is unconfirmed; Adam Barrus covers the Sidekick precedent.
- Atlee Clark (Shopify VP Partners): no verified channel; Partner Support is the sanctioned route.
- Ravi Yada (Shopify Catalog API): no channel, no statement; thread 36731 is the venue if Promoted placements matter later.
- Matt Koenig (Shopify Sidekick extensions): dormant forum account, no handle; Adam Barrus is the better target.
- Lee Richmond (Shopify, UCP council): works on Orders, not offers; his X bio still says Salesforce (stale) and would mislead.
- Brandon Walderman (Microsoft, WebMCP editor): colleague says he has moved to other projects; Sam Dallstream replaces him.
- Clay Bavor (Sierra): no first-person statement; Bret Taylor leads PAP and invited interest.
- Kevin Miller (Stripe) kept only as a tier 2 footnote; executive with no handle and no ownership of the ask.
- Dmitry Shevelenko (Perplexity CBO): no channel, no statement in six months; connector form is for companies.
- Patrick Jordan (Microsoft, UCP council): not involved in offers (#738/#929), absent on 2 Oct; interest is SDKs and conformance; only a personal address in commit metadata.
- Jesse Zhang (Decagon CEO): CEO of a well-funded company; the PACT tracker is the route.
- Ashish Gupta and Vidhya Srinivasan (Google VPs): executives with no channel; Direct Offers is a competing product that picks from pre-uploaded promotions.
- Alexandra Klepper (Chrome docs): documentation only.
- Federico D'Amato (Google, UCP tooling): triage only; process question goes to Discussions Q&A.
- Anssi Kostiainen (W3C CG chair): process only; covered by the TPAC agenda issue in venues.
- Mikhail Parakhin (Shopify CTO per X bio): no relevance to the specific pieces; no recent statement.
- Carl Rivera: no longer at Shopify (X bio names Nubank).
- Lilian Rincon: reported to have left Google for Apple in March 2026; do not address as Google.
- Glen Coates (reported OpenAI app platform head, Dec 2025 press): not re-verified for Oct 2026.
- CJ Desai (Meta Chief Enterprise Platform Officer, 28 Sep 2026 newsroom): real and relevant to Meta Business Agent, but not reachable cold and no public channel found; revisit if a Meta Business Agent developer programme appears.
- Ginger Baker (Meta VP Product, Fintech and Payments): title from a Stripe Sessions page; ownership of Meta's protocol work is inferred; no channel; revisit.
- Mona Sarantakos (Meta): title from a search summary only.
- Hugo Barra, Nicholas Jitkoff (Meta MSL): current Muse roles unverified.
- Ravi Yada (Microsoft Brand Agents) and Rahul Bansal (OpenAI): identities or current roles not verified.
- @n2parko (SpaceXAI product): full name unverified.
- Ben Schwerin (reported Instinct CBO): press report only.
- Caroline George, Jing Li, Anurag Sinha, Alex Jansen, Julia Downey (UCP participants): no public channel or no relevance beyond the threads already being used.
- Stefan Hamann, Sebastian Hölscher, Lukas Rump (Shopware): engineers behind the quote plugin; reach them only if Juan Fernández points there.

## 6. Sequencing

Week 1 (13-17 Oct) - put the evidence on the public record before any personal note:

1. Today: make the demo public (a dev store with the app, a two-minute recording, the `com.offerad.*` schema served from the owner's domain). Record a Muse custom-connector run and a Grok custom-connector run. Everything below links to this.
2. 13-14 Oct: comment on UCP #738 (section 3.1) - the deep-dive sessions Greg Smith polled for are probably this week. Then comment on #929 (3.2). Then #863 and #502 (3.3).
3. 14 Oct: Shopify forum: reply in 36329 and open the Functions topic (3.4). Open the app-intent-types issue (3.9).
4. 15 Oct: Disrupt, if a pass is bought (3.10). Otherwise skip.
5. 15-16 Oct: PAP review email and design-partner request (3.6). Join the W3C Community Group and file the one WebMCP issue plus the webmcp-tools demo issue (3.8).
6. 16-17 Oct: short notes that point at the public record: Gil Greenberg (X, linking the Functions topic), Kasper Kulikowski (X or LinkedIn, linking the demo), Yang W. and Weston (after the #863/#738 comments), Tomas Taylor (ACP question), Discount Kit call booking.
7. 16 Oct: read the new Shopping Tech Council minutes file.

Week 2 (19-25 Oct):

8. 22 Oct: AGNTCon, Thursday pass: lunch table, UCP panel question to Greg Smith / Ilya Grigorik / Amit Handa, referencing the #738 comment by number. 23 Oct if attending: Moretto's talk.
9. After the panel: David Singleton public reply (now with a PAP review on record), Juan Fernández reply in #502, Chris Daly co-writing offer in #738, Adam Barrus issue follow-up.
10. 23 Oct: read minutes; if #738 or #929 moved, adjust the asks.

Week 3-4 (26 Oct - 8 Nov):

11. ACP: if Tomas Taylor is not writing the follow-up, file the Reconsideration Offers SEP and the sponsor Discussion; notes to Vignesh Sreedhar and Prasad Wangikar reference it (3.7).
12. OpenAI forum question on the Advertising rule; then Romain Huet; per-merchant plugin submission (3.12). Matt Palmer for Grok Bot; Cursor Marketplace application once the plugin repo is public (3.13).
13. Muse connector submission once rules 1.1/3.2/4.3 are met (3.11).
14. Only now, if still wanted: one public reply each to Tobi Lutke and Alexandr Wang that names one concrete gap and links the demo, the forum thread and the UCP comment. Expect nothing; the value is that the question is visible next to their own posts.
15. If three organisations in the threads agree, ask a council member about a DWG charter (3.15).

What to wait for before sending: the #738/#929 comments before any Shopify or Google personal note (so the note points to a thread, not a pitch); the PAP review email before any Meta or Sierra note; the ACP SEP before any Stripe or OpenAI ACP note; the 16 Oct and 23 Oct minutes before changing the UCP ask.

## 7. Cautions

Stale or contested roles:

- Gil Greenberg changed teams in September 2026; do not call him the checkout PM and do not credit him with the Discount Function API. His old checkout-extensibility area has an unnamed new owner.
- Mani Fazeli: Shopify's author page still says Director; his bio says VP. Say "if Shopify implements PAP", not "when"; Sierra lists Shopify as a partner, not an implementer.
- Lee Richmond's X bio says Salesforce; he is at Shopify. Nat Friedman's and Alexandr Wang's titles rest on press and an interview page, not Meta pages. Embiricos's title differs across three press sources; use the product name. Amit Handa's "Director of Engineering" is from January 2026. Daniel Wyckoff, Lee Richmond, Yoav Weiss, Greg Smith, James Andersen, Lee Hwa, Prasad Wangikar, Aravind Rao, Patrick Jordan: council seats confirmed, job titles not; do not state titles for them.
- Arjun Garg's Intuit affiliation is self-declared on GitHub; do not state it. Yang W. is in Dublin, CA, not San Francisco. Tomas Taylor may be in New York, not San Francisco. Moretto is not confirmed independent.
- Do not address Carl Rivera, Lilian Rincon, Holly Li, Nayna Sheth or Ginny Marvin as current owners of anything.

Quotes that must be labelled:

- Ilya Grigorik's 2 Oct 2026 remark is the minute-taker's paraphrase; the same minute lists him as confirming demand. Never say he opposed offers. Greg Smith's 18 Sep "signal to deprioritize" line is also a minutes paraphrase.
- Wes's "known gap" is about fulfilment details in the UCP profile, not offers.
- Kulikowski's 31 Aug post is co-written with Idan Levin and André Bandarra. Clay Bavor's and Gram Liu's quotes are co-signed company posts. Sottiaux's quote is a third-party machine transcript.
- Singleton's partner list is not the PAP membership (Decagon is not on the site's design-partner list).
- Jiaxin Pei's "please reach out" is about his course, not negotiation research.

Policies that can forbid the ask:

- OpenAI plugin guidelines ban plugins that "serve advertisements", "exist primarily as an advertising vehicle" or are "pass-through intermediary software layers"; a cross-store broker plugin is at risk, a per-merchant plugin less so. Commerce only for physical goods; external checkout on the merchant's domain.
- Muse connector rules 1.1 (must complete the task, not hand off to checkout), 3.2 (no steering away from competitors or forcing recommendations), 4.3 (label advertising; discounts must be real), 5.7 (no status replies). Terms page unavailable; fees and individual eligibility unknown.
- Anthropic directory policy 4.C excludes advertising and sponsored content "unless otherwise expressly permitted".
- ACP governance forbids product marketing, self-promotion and competitor comparisons in its channels; every SEP needs a TSC sponsor; the repo has been quiet since 18 Jul 2026.
- UCP CONTRIBUTING.md: vendor namespace (`com.offerad.*`, schema served from the matching domain) first; a core Enhancement Proposal only after "proven widespread adoption". Comments need no CLA; pull requests need a Google CLA.
- WebMCP editors close general implementation reports (#266, 28 Sep 2026); only narrow spec questions survive.
- PAP feedback is licensed perpetual and royalty-free to all members and users.
- Cursor Marketplace requires open-source plugins and works with "a small group of trusted partners". Perplexity's form is for companies. Stripe Startups Build Day (11 Nov) is for "venture-backed founders"; a side-project engineer may be declined.

Things that could embarrass the owner:

- Calling himself a founder, or OfferAd a company, anywhere; he is a software engineer with a side project.
- Pitching in a spec thread. Every GitHub comment must be an implementer report or a question, with no product name in the title and no competitor comparisons.
- Sending Flux (a direct competitor) the link-verification or non-price design.
- Claiming Shopify "blocked" apps from the agent surface as a quote; staff said "developers can't add to or adjust a merchant's /.well-known/ucp endpoint" (Wes, 21 Aug 2026) and "there's no extension point for custom product fields or custom checkout logic through the MCP tools themselves" (Kyle Giesbrecht, 28 Jul 2026); quote those.
- Shopify is building its own paid layer (Promoted placements, Shop Campaigns in ChatGPT) and Google its own Direct Offers; frame OfferAd as a seller-side answer to a buyer agent's stated priority, not as "ads in agents", which both platforms reserve for themselves.
- Using personal Gmail addresses visible on GitHub profiles (Amit Handa, Arjun Garg, Lee Richmond) or Singleton's agent-only address. Never guess an email.
- The Cheeky Pint interview that sources Wang's quote is hosted by Stripe's John Collison; cite it as an interview page, not as Meta.
- X profile timelines could not be read in date order today; a newer post than the ones quoted may exist for each person. Re-read the target's latest posts and MAINTAINERS.md immediately before sending anything.

## 8. Source files

- Group research: `G1-shopify.md`, `G2-meta-sierra-stripe.md`, `G3-openai-xai-others.md`, `G4-google-webmcp-ucp.md`, `G5-builders-and-allies.md` in `/Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/people/`.
- Adversarial verifications: `V-G1-shopify.md`, `V-G2-meta-sierra-stripe.md`, `V-G3-openai-xai-others.md`, `V-G4-google-webmcp-ucp.md`, `V-G5-builders-and-allies.md` in the same folder.
- Project brief: `/Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/research/BRIEF.md`.
