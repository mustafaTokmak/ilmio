# G2: Meta, Sierra and Stripe: who controls the missing pieces, and how to reach them

Research date: 13 Oct 2026. Every page cited below was fetched on that day unless marked otherwise. Raw copies are in `/Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/docs/g2/`. Nobody was contacted. Nothing was posted, signed up for or submitted.

Labels: **[P]** primary (the organisation's own page, the person's own post or profile, a maintainer file). **[S]** secondary (press or a conference bio). **[snippet]** seen only as a search-result summary, page not read. **[inferred]** my reading.

How X posts were read: through X's public embed endpoint (`cdn.syndication.twimg.com/tweet-result`), which returns the author, date and the first 280 characters. Long posts are cut at that length; I quote only what was returned.

---

## 1. Short answers to the questions in the task

1. **Alexandr Wang's current title.** "Chief AI Officer, Meta Superintelligence Labs", as printed on 12 Oct 2026 in the description of an interview he gave with Mark Zuckerberg. Not taken from a Meta page: Meta's executive pages returned HTTP 400 and the investor leadership page returned 403.
2. **Does Muse sit in his organisation?** Muse is a Meta Superintelligence Labs (MSL) product, and Wang's title is Chief AI Officer of MSL. Meta's own Muse safety post is signed "Software Engineer & VP, Meta Superintelligence Labs". Zuckerberg on 12 Oct 2026 described the product work as done by "the people on Nat's team". The formal reporting line from Nat Friedman to Wang is not confirmed by anything dated 2026; the only source is a 2025 press report repeated on Wikipedia.
3. **Nat Friedman.** Head of product at MSL per TechCrunch (22 Sep 2026); his own X posts and Zuckerberg's remarks are consistent with that. He is the person who runs the Muse product team.
4. **Muse Connector Platform lead and developer relations.** No named person found. The platform was announced by Zuckerberg himself. The guidelines say "we cannot respond to individual messages or emails about status". The only route is the submission portal behind a login.
5. **Meta on UCP.** James Andersen (UCP Shopping Tech Council; roster file changed 12 Oct 2026).
6. **Meta on ACP.** Lee Hwa (`lhwa`) holds Meta's seat on the ACP Technical Steering Committee. Vignesh Sreedhar (`vig-star`, San Francisco) wrote the most recently merged ACP change.
7. **Meta on the Personal Agent Protocol.** David Singleton made Meta's announcement on X and gave Meta's press interview.
8. **Who edits the PAP draft.** Not named anywhere on personalagentprotocol.org. The site says "The spec's authors" and "The people working on the draft". Feedback goes to one Sierra mailbox. There is no public repository, issue tracker or working-group sign-up.
9. **How an outsider comments on PAP.** Two documented ways, both ending in an email to `[EMAIL REDACTED]` (section 4.1).
10. **Stripe.** Kevin Miller (executive, payments), Jeff Weinstein (product lead, agentic commerce, title last printed Sep 2025), Steve Kaliski (engineering lead), Prasad Wangikar (Stripe's ACP seat and the person who runs ACP's admin), Jake Sinsheimer (go-to-market).
11. **How to propose an ACP change.** A GitHub issue tagged `SEP` and `proposal`, a sponsor from the steering committee, a seven-business-day review, a simple-majority vote (section 4.2). The repository has not merged anything since 18 Jul 2026.
12. **Is "Reconsideration Offers" already proposed?** No. A search of the ACP repository for "reconsideration" returns one item, the original Intent Traces pull request. The slot is open.

---

## 2. What each organisation has said in public that bears on the idea

### Meta

- Wang, 12 Oct 2026 [P, interview transcript]: "I think Muse is one of the first products where you’re actually people are fully delegating purchases to the agents." https://cheekypint.substack.com/p/muse-wonder-zuckerberg-and-wangs
- Wang, same interview: "I think agentic commerce demand will grow as a portion of the pie." and "do they want to participate in that slice or that portion of the economy over time?"
- Zuckerberg, same interview: "over time there are lots of different ways to effectively take a small cut of what you are saving or making for people, and that will end up being a very large revenue stream."
- Zuckerberg, same interview, on why Muse can buy anywhere: "now you can ask your muse to buy anything, more or less. And it’ll just figure it out with computer use, right? And so it’s like the ultimate backwards compatibility layer."
- Wang to CNBC, 8 Sep 2026 [S]: "We think the commerce business model is potentially really interesting for this product because of how much it enables people to to actually find the things that they are excited about and ultimately fulfill a lot of those purchases," and CNBC's paraphrase: "The company is exploring potential monetary initiatives, such as taking a cut of AI agent-related shopping transactions, but hasn't settled on any concrete plan". https://www.cnbc.com/2026/09/08/meta-personal-ai-agents-public-reckoning-privacy-safety.html
- Meta newsroom, 8 Sep 2026 (updated 30 Sep) [P]: Muse "can open a browser, fill out forms, and negotiate on their behalf" and "When it comes time to pay, Muse can checkout with Link built by Stripe". "Shop Pay is coming soon as another way to pay". https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/
- Muse connector guidelines [P, undated, fetched today], the rules an offer connector would be judged by. https://muse.ai/platform/docs
  - 1.2: "Muse can already browse websites. Your connector should improve on what’s possible in the browser experience through better information, account access, more reliable actions, or fewer steps." and "A wrapper around public pages or a list of links alone is not enough."
  - 1.1: "Sending the user to finish the entire checkout does not meet the completion requirement."
  - 3.2: "Do not use tool descriptions or responses to instruct Muse to ignore its rules, steer away from competitors, access unrelated data, force recommendations, conceal commercial interests, or take unrequested actions."
  - 4.3: "Label advertising, sponsored results, and commercial relationships that influence recommendations. Do not fabricate reviews, urgency, discounts, or successful outcomes."
  - 5.2: "Provide the business information and supporting evidence requested to verify your organization and your authority to submit the connector."
  - 5.7: "Check the portal for your connector’s review status. Due to submission volume, we cannot respond to individual messages or emails about status."
  - 6: "We review submissions in three stages. Meeting these guidelines does not guarantee approval."
  - 7.1: "Approved connectors are discoverable by the Muse agent and in Settings > Connectors."
- Muse platform page [P]: "We'll review your connector for functional, security, and legal requirements, and complete end to end testing." and "we've partnered with Stripe to make accepting payments easy with Link." https://muse.ai/platform
- Meta newsroom, 29 Sep 2026 (updated 8 Oct) [P]: "Interested partners can apply at muse.ai/platform. Muse also supports custom connectors so you can plug in services we don’t support yet". https://about.fb.com/news/2026/09/introducing-muse-small-business/
- [inferred] Rule 4.3 allows sponsored results if labelled, and forbids fabricated discounts. An offer connector that returns real, checkout-enforced offers and labels them as seller offers fits the wording. Rule 3.2 (no steering away from competitors) means the competing-offer link must be something the buyer's agent chooses to pass, never something the tool asks Muse to do. Rule 1.1 is the hard one for a Shopify app: a connector that ends in a cart link may be judged incomplete.

### Sierra and the Personal Agent Protocol (PAP, "Poppy")

- Draft 0.1, "Updated Oct 12, 2026" on every docs page. https://personalagentprotocol.org/docs/introduction
- The draft has no offer, discount, promotion or negotiation message. Word counts in the spec and the Operations extension: "discount" 0, "negotiat" 0, "promotion" 0; "offer" appears only in the ordinary sense (a company "offers" an API).
- The closest primitive is the Operations extension [P]: "The operations extension lets a Company ask the Personal Agent to confirm an action before the Company performs it". "Approval covers the exact terms. The User approves one revision of the terms, and the Company performs only what that revision describes." Each operation carries `summary`, `terms`, `revision`, `expires_at`. "Terms can change before confirmation, for example when the User asks for a different size. The Company then issues a new revision of the same operation". https://personalagentprotocol.org/docs/extensions/operations
- Anyone can define an extension without permission [P]: "Extensions defined on this site have plain names, such as operations. Anyone can define their own, named with a domain they control, such as example.com/gift-wrap." It only works if the personal agent also lists it: "A personal agent lists the extensions it supports in extensions in its client metadata document". https://personalagentprotocol.org/docs/extensions
- What the authors ask for [P]: "Broadly useful extensions. Things many implementations need, such as payments, that could be built as extensions." Open topics listed: payments, push notifications, attachments. Offers are not listed. https://personalagentprotocol.org/docs/path-to-1
- Sierra, 9 Oct 2026 [P]: "Protocols such as Universal Commerce Protocol (UCP) focus on shopping, from finding products to checking out and managing orders. Personal Agent Protocol is complementary". "Over the next month we will host design workshops and publish a reference implementation to help developers get started." https://sierra.ai/blog/poppy
- Shopify is listed as a technology-provider design partner, and Meta, OpenAI and Instinct as personal-agent design partners. Same page.
- [inferred] A seller offer fits PAP as "an operation the Company proposes with better terms than the agent asked for", or as a named extension (for example `offerad.<domain>/offers`). Either needs Muse to list the extension, which is Meta's decision, not Sierra's.

### Stripe and ACP

- Kevin Miller, Stripe Sessions keynote, 29 Apr 2026 [P]: "Payments is about to meet a new kind of buyer: agents." and "We think of this as a spectrum where, at one end, agents help customers discover, but the human still chooses and buys. In the middle, the human chooses and the agent checks out. And at the far end, the agent discovers and buys." Also: "today I’m pleased to announce that Shopify will become the preferred catalog provider for retailers that want to integrate with the Agentic Commerce Suite." https://stripe.com/sessions/2026/opening-remarks-and-product
- Kevin Miller in Sierra's post, 6 Oct 2026 [P for the quote]: "A customer relationship doesn’t start or end at checkout. When customers send an agent, they expect the same service they’d get themselves. We’re contributing to the Personal Agent Protocol to give businesses a standard way to recognize their customers’ agents, efficiently interact with them, and shape their customer relationships." https://sierra.ai/blog/introducing-personal-agent-protocol
- John Collison, 12 Oct 2026 [P, transcript]: "it’s very interesting to look at the agentic commerce stats at Stripe because we started developing all this stuff and we had a whole bunch of announcements at Sessions back in May, uh, and then it only as of September basically started going vertical." (He says May; Stripe's newsroom dates Sessions 29 Apr 2026.)
- ACP Intent Traces RFC, on `main`, "Status: Proposal" [P]: "This specification lays the groundwork for merchants to transition from probabilistic retargeting (guessing) to deterministic negotiation (bidding)." and "Future extensibility: A subsequent RFC MAY define **Reconsideration Offers** keyed to specific reason codes." https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/rfcs/rfc.intent_traces.md
- The Intent Traces pull request (#54, by `0xtotaylor`, opened 17 Dec 2025, closed 11 Jan 2026) states the motive in the seller's terms: "A merchant receiving `reason_code: shipping_cost` can programmatically respond with a free shipping offer rather than guessing."
- ACP Suggested Pricing (Lee Hwa, Meta; pull request #201, merged 22 May 2026) [P]: "the agent provides the seller with the information needed to make an informed decision about whether to honor the price the buyer saw."
- ACP governance rule that limits how a proposal may be worded [P]: not permitted: "Using ACP channels or governance forums for product marketing or self-promotion." and "Making direct comparisons between competing products or services within ACP discussions." https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/docs/governance.md
- [inferred] ACP is the one place where the text of the standard already names the missing message. A "Reconsideration Offers" proposal continues the maintainers' own sentence. The weakness found by sibling research still holds: ChatGPT sends Shopify buyers to the merchant's checkout, so ACP traffic to Shopify stores is thin.

---

## 3. People

Order: the ones most worth a message first within each organisation.

### 3.1 Meta

#### Alexandr Wang
- **Role:** Chief AI Officer, Meta Superintelligence Labs. Status: confirmed, but by an interview page and press, not by a Meta page.
- **Role quote:** "Mark Zuckerberg (founder and CEO, Meta) and Alexandr Wang (Chief AI Officer, Meta Superintelligence Labs) join John for a pint to discuss the launch of Muse Wonder and the future of personal AI agents." Cheeky Pint (John Collison of Stripe), 12 Oct 2026. https://cheekypint.substack.com/p/muse-wonder-zuckerberg-and-wangs
- **Supporting [S]:** CNBC, 8 Sep 2026: "Meta AI chief Alexandr Wang". TechCrunch, 22 Sep 2026: "Meta’s Chief AI Officer Alexandr Wang".
- **Muse and his organisation:** Meta's Muse safety post is by "Tarek Sheasha, Software Engineer & VP, Meta Superintelligence Labs" (8 Sep 2026) https://security.muse.ai/ . Wang announces Muse features and connector lists himself on X. Formal reporting line of the product team to him: not confirmed for 2026.
- **Controls:** the organisation that builds Muse; can direct whether Muse calls seller offer endpoints, honours a PAP extension, or lists an offer connector.
- **Public channel:** X `@alexandr_wang` (verified by reading his posts today).
- **Recent statements:** 12 Oct 2026 quote in section 2. Also X, 29 Sep 2026: "here's the full list of connectors launching today" followed by a list that includes "@stripe (merchant)" and "@Shopify (merchant)". https://x.com/alexandr_wang/status/2104925782644535438
- **Reachability: low.** His posts draw hundreds of replies (the 24 Sep post had 358 replies and 6,590 likes). A cold note from an individual is unlikely to be read. A public reply with a short working demo has a small chance.
- **Better route:** David Singleton for the protocol question, the connector portal for distribution, Lee Hwa and Vignesh Sreedhar for the ACP side.
- **One ask:** Name the person on the Muse team who should receive a two-page spec for a seller offer endpoint that Muse could call before checkout.

#### Nat Friedman
- **Role:** head of product, Meta Superintelligence Labs. Status: confirmed by press, consistent with primary remarks.
- **Role quote [S]:** "According to an X post by Nat Friedman, head of product at Meta’s Superintelligence Labs (MSL), Muse was “definitely heavily inspired as a product by OpenClaw.”" TechCrunch, 22 Sep 2026. https://techcrunch.com/2026/09/22/meta-admits-muses-likeness-to-openclaw-isnt-a-coincidence/
- **Primary support:** Zuckerberg, 12 Oct 2026: "whether they’re the people in the lab who are working on that or the people on Nat’s team who are working on the product". On the buying flow: "this is a set of things that Nat really obsessed over." Friedman's own X post, 21 Sep 2026: "After I used openclaw in january I bought hundreds of mac minis for the MSL team". https://x.com/natfriedman/status/2102103707936768130
- **His personal site (nat.org) does not state a current employer.**
- **Controls:** Muse product decisions, including how Muse shops and what developers can plug in.
- **Public channels:** X `@natfriedman`; https://nat.org/ (no contact address published there).
- **Recent statement:** X, 2 Oct 2026: "Announcing Muse Gadgets, an open source ESP32 firmware and Linux sdk so that you can make hardware devices that work with Muse." https://x.com/natfriedman/status/2106099383037309211 (developer extensibility, not commerce). I found no statement by him on offers or ads in agents.
- **Reachability: low to medium.** Evidence for medium: on 21 Sep 2026 he answered a small app builder's viral post in public. Evidence for low: 7,167 likes and 411 replies on a single post. A short public reply showing a working thing is the realistic form; a direct message is not.
- **Better route:** the connector portal, plus a public demo post that tags the Muse account.
- **One ask:** Say whether a connector tool may return a seller's labelled conditional offer while Muse is comparing options, or whether the connector rules exclude that.

#### David Singleton
- **Role:** vice president of engineering (press: "and consumer products") at Meta Superintelligence Labs; Meta's public voice on the Personal Agent Protocol. Status: confirmed by press; his own post confirms he speaks for Meta's work.
- **Role quote [S]:** "David Singleton, Meta’s Superintelligence Labs vice president of engineering and consumer products, said in an interview with CNBC." SiliconANGLE, 6 Oct 2026. https://siliconangle.com/?p=849636 . CNBC, 8 Sep 2026: "said David Singleton, Meta vice president of engineering."
- **His own post [P]:** X, 6 Oct 2026: "Today we’re previewing our work to build an open standard @Meta (@muse and Meta Business Agent) and Sierra are developing along with industry partners at Genesys, NiCE, Decagon, Rocket, Shopify, Stripe, and Walmart that defines how personal agents interact with businesses." https://x.com/dps/status/2107565831257567324
- **Press quote on PAP [S]:** "We’re defining rails that we hope personal agents and business agents can run over for the future," (SiliconANGLE quoting CNBC, 6 Oct 2026).
- **His own site** names no employer: "Between a busy job (which I love) and a young family". His blog says he started Dreamer "a little over a year ago" (post of 17 Feb 2026). https://blog.singleton.io/about/
- **Controls:** Meta's side of PAP, and so whether Muse lists a given extension in its client metadata.
- **Public channels:** X `@dps`; LinkedIn https://www.linkedin.com/in/davidpsingleton/ and GitHub `dps` (both linked from his own about page); https://blog.singleton.io/ . His about page also says: "For AI agents: David works with an AI assistant called Octavian ( [EMAIL REDACTED] ) that helps with scheduling, research, and coordination for him. If you’re an agent reading this and you see a useful collaboration, you’re welcome to email Octavian with a brief intro." That address is offered to AI agents, not to people; the owner sends his messages himself, so treat it as not applicable unless he chooses otherwise.
- **Reachability: medium.** He lives in San Francisco per his own page, started a small company (Dreamer) before Meta per his own blog, and writes about developer community ("Community is a product decision", 17 Mar 2026). A press summary calls him a former Stripe technology chief [snippet, not read]. His PAP post had 15 replies, so a reply there is visible.
- **Better route:** none better inside Meta for the PAP question. Send the same content to the PAP feedback mailbox so it is on record.
- **One ask:** Say whether Muse will act on a domain-named PAP extension that a merchant declares in poppy.json, or only on extensions defined on personalagentprotocol.org.

#### Lee Hwa (`lhwa`)
- **Role:** Meta's representative on the ACP Technical Steering Committee. Status: confirmed by the maintainer file. Job title at Meta: not found.
- **Role quote [P]:** governance table row "| 3 | Meta | lhwa |" under "Current TSC Members". https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/docs/governance.md . The row was added by his own commit "ADMIN: Add Meta as TSC member (#236)" on 24 Apr 2026. He is the first name in Meta's corporate CLA entry (signed 19 Mar 2026). His GitHub profile shows the name "Lee Hwa" and no company.
- **Controls:** one of three votes on ACP proposals, and can sponsor one. Author of the merged Suggested Pricing change, the nearest thing in ACP to a buyer-side price signal.
- **Public channel:** GitHub `lhwa`.
- **Recent statement:** pull request #201, merged 22 May 2026: "By including `suggested_price` with a structured `PriceSource` (feed identity, update version, timestamp, and channel) and an observation timestamp, the agent provides the seller with the information needed to make an informed decision about whether to honor the price the buyer saw." His last merged changes are dated 4 Jun 2026. Nothing from the last four months.
- **Reachability: medium.** He reads the ACP tracker as part of the steering role, and the operating model promises a first response "within 2 business days". In practice recent issues carry no labels and no assignee.
- **Better route:** this is the better route for Meta on ACP.
- **One ask:** Say whether Meta would sponsor a Reconsideration Offers proposal that answers an intent trace with a revised offer, given that Suggested Pricing already covers the request side.

#### Vignesh Sreedhar (`vig-star`)
- **Role:** engineer at Meta working on fintech and AI, San Francisco; ACP contributor. Status: confirmed by his own profile.
- **Role quote [P]:** GitHub profile bio "eng @ meta | fintech + ai", company "meta", location "san francisco" (profile last updated 10 Oct 2026). https://github.com/vig-star . Listed among Meta's authorised contributors in ACP's CLA file.
- **Controls:** nothing by himself. He wrote the most recent change merged into ACP ("SEP: Optional product URL on checkout Item (#281)", 18 Jul 2026), so he knows how Meta gets ACP changes through and which Meta team consumes them.
- **Public channels:** GitHub `vig-star`; X `@vigstar1` and https://vigneshsreedhar.com/ (both from his GitHub profile).
- **Recent statement:** pull request #281: "This SEP adds an optional url field (a canonical product page URL, type: string, format: uri) to Item. When present, sellers can map the URL to the exact product and brand."
- **Reachability: medium to high.** Individual engineer, same city, public handle, works on exactly this protocol.
- **One ask:** Say which Meta team decides whether Muse sends ACP intent traces on cancel, and whether a seller reply to one would be useful to that team.

#### James Andersen (`jamesandersen`)
- **Role:** Meta; member of the UCP Shopping Tech Council. Status: confirmed by the maintainer file.
- **Role quote [P]:** roster row "| James Andersen | Meta |" in the Shopping Tech Council table. https://github.com/Universal-Commerce-Protocol/.github/blob/main/MAINTAINERS.md (last changed 12 Oct 2026). GitHub profile: company "Meta", location "Washington, USA". Also in Meta's ACP CLA entry.
- **Controls:** Meta's review vote on UCP shopping changes, including the open offer and quote proposals found by sibling research (#738, #929).
- **Public channel:** GitHub `jamesandersen`.
- **Recent statement:** approving the UCP `ask` capability, 7 Oct 2026: "Thanks @igrigorik for the move to common where this functionality can more broadly benefit the UCP ecosystem. ...and for that latest pass clarifying the use of ids that I was initially a bit worried about. Another great addition here." https://github.com/Universal-Commerce-Protocol/ucp/pull/538
- **Reachability: medium, in public threads only.** He reviews UCP pull requests week by week. No other channel published.
- **One ask:** Comment on whether Meta's agents would negotiate a merchant-proposed offer capability if UCP adds one (the open State-bound Offer proposal).

### 3.2 Sierra

#### Bret Taylor
- **Role:** Co-Founder of Sierra; byline on both PAP posts. Status: confirmed by Sierra's own page.
- **Role quote [P]:** "Bret is Co-Founder of Sierra. Most recently, he served as Co-CEO of Salesforce." and "Bret serves on the board of OpenAI." https://sierra.ai/about (page undated). Byline "Bret Taylor / Clay Bavor" on https://sierra.ai/blog/introducing-personal-agent-protocol (6 Oct 2026) and https://sierra.ai/blog/poppy (9 Oct 2026).
- **Controls:** direction of the PAP draft; who becomes a design partner; what the design workshops cover.
- **Public channel:** X `@btaylor`.
- **Recent statement:** X, 6 Oct 2026: "Today we’re announcing Personal Agent Protocol — an open standard @Meta and @SierraPlatform are developing along with industry partners at @Genesys, @instinct, @RocketOTD, @Shopify, @stripe, and @Walmart. It will help define how personal agents interact with businesses". https://x.com/btaylor/status/2107535182119244176 . Press [S]: he told CNBC there "will be chaos until such a standard exists".
- **Reachability: low.** 226 replies and 2,943 likes on the announcement.
- **Better route:** the PAP feedback mailbox, using the review format the site asks for. That is the channel the authors say they read.
- **One ask:** Say whether seller-proposed offers are in scope for the PAP design workshops, and whether an independent implementer may attend one.

#### Clay Bavor
- **Role:** Co-Founder of Sierra; byline on both PAP posts. Status: confirmed by Sierra's own page.
- **Role quote [P]:** "Clay is Co-Founder of Sierra. Previously, Clay spent 18 years at Google, where he most recently led Google Labs." https://sierra.ai/about
- **Controls:** same as Taylor.
- **Public channel:** none verified today. I did not read a post of his and did not confirm an X handle or LinkedIn URL.
- **Recent statement:** only the co-signed posts. From the 9 Oct post: "This draft is a starting point. Over the next month we will host design workshops and publish a reference implementation to help developers get started." No separate interview or post found.
- **Reachability: low.**
- **Better route:** the PAP feedback mailbox.
- **One ask:** Say whether the Operations extension is meant to let a company propose terms the user did not ask for (an unprompted better offer), or only terms the agent requested.

#### The people who edit the PAP draft
- **Not named.** The site's words: "The spec's authors are working through implementations with several of the design partners." The review kit says: "The people working on the draft will read your review, so write it for them." A third-party page [snippet] says the kit's spec text is marked as copyright "its authors". No editor list, no repository, no changelog with names.
- **Nearest named Sierra engineers:** Ajeet Grewal and Venu Satuluri, bylines on "Caller ID in the age of agents" (8 Oct 2026), which describes the protocol as "an open standard that we’re working to develop with industry partners". Titles not given; not confirmed as spec editors.
- **Named demonstrator:** "Alex McGillis, VP of Product at Rocket, showed the protocol live featuring Meta’s personal agent, Muse" (Sierra, 9 Oct 2026).

### 3.3 Stripe

#### Prasad Wangikar (`prasad-stripe`)
- **Role:** Stripe; holds Stripe's seat on the ACP Technical Steering Committee; member of the UCP Shopping and Payments Tech Councils. Status: confirmed by maintainer files and his own profile. Job title: not found.
- **Role quote [P]:** governance table row "| 2 | Stripe | prasad-stripe |". GitHub profile: name "Prasad Wangikar", company "Stripe", location "Princeton, NJ" (updated 8 Oct 2026). UCP roster rows "| Prasad Wangikar | Stripe |" in both councils (file changed 12 Oct 2026). Point of contact for Stripe in ACP's CLA file.
- **Controls:** the ACP process itself. He authored the governance revision (10 Mar 2026), the operating model (7 Apr 2026) and most admin changes. He can sponsor a proposal and holds one of three votes; Stripe also holds a veto as a Founding Maintainer.
- **Public channel:** GitHub `prasad-stripe`.
- **Recent statement:** the operating model he committed on 7 Apr 2026: "Anyone may file a new SEP as a GitHub Issue with `SEP` and `proposal` tags. Community members can discuss ideas in `#general` on Discord before filing." His last commit on `main` is that one; nothing from the last six months.
- **Reachability: medium to high through the tracker, none elsewhere.** A well-formed proposal issue is the documented way to get his attention. No personal channel published.
- **One ask:** Say whether a Reconsideration Offers proposal belongs as a new SEP or as an ACP extension, and what would make it sponsorable.

#### Steve Kaliski (`stevekaliski-stripe`)
- **Role:** principal software engineer at Stripe and engineering lead for agentic commerce. Status: confirmed by a 2026 conference bio; Stripe's own byline is from 2025.
- **Role quote [S]:** "Steve Kaliski is a principal software engineer at Stripe and engineering lead for agentic commerce, developing payment infrastructure that allows autonomous software to make purchases within limits established by people and businesses." AI Engineer speaker page, "Conference affiliation: Stripe · 2026". https://www.ai.engineer/speakers/steve-kaliski
- **Older primary:** Stripe blog byline, 29 Sep 2025: "Steve Kaliski Engineering Lead, Agentic Commerce". https://stripe.com/blog/developing-an-open-standard-for-agentic-commerce . GitHub profile company "@stripe". Listed in Stripe's ACP CLA entry.
- **Controls:** the engineering of Stripe's agentic commerce products and Stripe's technical position on ACP.
- **Public channels:** GitHub `stevekaliski-stripe`. The conference page lists stevekaliski.com and `@stevekaliski`; I did not open them.
- **Recent statement:** talk "Building safe Payment Infrastructure for the autonomous economy" at AI Engineer Europe 2026 (exact date not on the page). The page's summary, not his words: "Safe agent commerce separates recommendations from financial authority: scoped credentials, paid HTTP requests, and structured checkout keep spending under deterministic control". No direct quote captured.
- **Reachability: medium.** Speaks at engineering events and writes for developers. "Limits established by people and businesses" enforced in code is the same principle as this project's seller limits.
- **One ask:** Say whether the Agentic Commerce Suite passes ACP intent traces through to the seller today, and whether the seller can answer one.

#### Jeff Weinstein
- **Role:** Stripe; "Product Lead, Agentic Commerce" as last printed by Stripe on 29 Sep 2025. Still posting Stripe's agentic announcements on 6 Oct 2026 under a Stripe affiliation badge. Current title wording not re-confirmed.
- **Role quote [P]:** Stripe blog byline "Jeff Weinstein Product Lead, Agentic Commerce", 29 Sep 2025. https://stripe.com/blog/developing-an-open-standard-for-agentic-commerce . X profile label "Stripe" (business affiliation badge, read today).
- **Controls:** product direction of Stripe's agentic commerce work and of ACP on Stripe's side.
- **Public channel:** X `@jeff_weinstein`.
- **Recent statement:** X, 6 Oct 2026: "Introducing: Personal Agent Protocol (PAP)—an open standard for how personal agents interact with businesses. @stripe is joining Meta, Sierra, Genesys, Instinct, Rocket, Shopify, and Walmart as founding members to design how the many agentic parties will play nicely together." https://x.com/jeff_weinstein/status/2107541730870632493
- **Reachability: medium.** 57 replies on that post, far fewer than the executives. This is a judgment; I have no evidence about how often he answers.
- **One ask:** Say whether Stripe wants a seller-side "revised offer" step in ACP or in PAP, so that a proposal goes to the right standard.

#### Kevin Miller
- **Role:** Stripe's business lead for payments. Two wordings in 2026: "Business Lead for Payments, Risk, Support and Global, Stripe" on Stripe's own Sessions page (29 Apr 2026) and "Head of Payments, Stripe" in Sierra's announcement (6 Oct 2026). Status: confirmed by Stripe's own page.
- **Role quote [P]:** "Kevin Miller , Business Lead for Payments, Risk, Support and Global, Stripe". https://stripe.com/sessions/2026/opening-remarks-and-product . "Kevin Miller, Head of Payments, Stripe". https://sierra.ai/blog/introducing-personal-agent-protocol
- **Controls:** executive ownership of Stripe payments, which includes the agentic commerce products; Stripe's named sponsor of PAP participation.
- **Public channel:** a search result lists https://www.linkedin.com/in/kevinmiller as "Kevin Miller - Stripe" [snippet; page not opened]. No X handle verified.
- **Recent statement:** the 6 Oct 2026 quote in section 2.
- **Reachability: low.**
- **Better route:** Wangikar through the ACP tracker; Kaliski or Weinstein for product questions.
- **One ask:** Name the person at Stripe who owns the seller's reply to an agent that walks away, if anyone does.

### 3.4 Others checked, not in the main list

| Name | What was confirmed today | Why not in the main list |
|---|---|---|
| Mark Zuckerberg | Announced the connector platform himself, X 18 Sep 2026: "Opening access for developers to build Muse connectors. You bring the API -- Muse brings the agent, the browser, and the context of what the person actually wants." https://x.com/finkd/status/2101084678640066765 | Not reachable |
| CJ Desai | "Chirantan “CJ” Desai will join Meta as Chief Enterprise Platform Officer, reporting directly to me." Meta newsroom, 28 Sep 2026 [P]. Scope: "the Muse agent, Meta Business Agent, Muse API, Muse Code". https://about.fb.com/news/2026/09/launching-meta-enterprise-platform/ | Two weeks into the job; the business side, not the consumer agent |
| Mona Sarantakos, Christine Awad | Authors of "How We Designed Muse", Sep 2026 [P] https://introducing.muse.ai/ . Sarantakos's title "vice president of Product Management at Meta Superintelligence Labs" seen only as [snippet] | Title unverified; no channel found; design decisions, not connectors |
| Tarek Sheasha | "Software Engineer & VP, Meta Superintelligence Labs", 8 Sep 2026 [P] https://security.muse.ai/ | Owns the security model that decides what Muse will act on; no commerce statement |
| Ginger Baker | "VP, Product Management, Fintech and Payments, Meta", Stripe Sessions page, 29 Apr 2026 [P for the listing]. On stage: "from discovery to purchase, it all takes place in the same experience." | Checkout in Meta's apps and ads, not Muse |
| Jake Sinsheimer | "GTM Head of Agentic Commerce, Stripe"; "my team looks after our relationship with merchants." Stripe Sessions page, 29 Apr 2026 [P] https://stripe.com/sessions/2026/new-channels-on-the | Partnerships route for a company with merchants, not for a protocol idea |
| Allison Xu | "Product, Agentic Commerce, Stripe"; "I work on the agentic commerce product team at Stripe." Same event [P] | No channel found |
| Jay Shah | "business lead for Link at Stripe"; "Stripe is building the infrastructure that lets agents buy from businesses". Stripe newsroom, 8 Sep 2026 [P] https://stripe.com/newsroom/news/stripe-helps-meta-muse-shop-with-link | Wallet side, not the seller side |
| Will Gaybrick | "Stripe's president of product and business" (newsroom, 29 Apr 2026) and "President, Technology and Business, Stripe" (Sessions page) [P] | Not reachable |
| Twum Djin | UCP Governance Council row "| Twum Djin | Stripe |" [P]. A web search for the name returned nothing | No role detail, no channel |
| `aravindrao-openai` | OpenAI's ACP seat. Sibling notes name Aravind Rao as SEP author; the GitHub profile shows no name | OpenAI is outside this scope |
| `nvp-stripe` | Stripe ACP contributor (discovery, cart, order schema). Profile shows no name | Real name unknown |
| Mike Fix (`mfix-stripe`) | GitHub: company "stripe.com", San Francisco, X `fixitup2`; in Stripe's ACP CLA entry [P] | Role in agentic commerce not established |
| Tomas Taylor (`0xtotaylor`) | Author of the Intent Traces RFC; GitHub lists totaylor.com, no employer [P] | Employer unknown. He wrote the sentence a Reconsideration Offers proposal would build on, so he is a natural co-author to ask |

---

## 4. Official venues and the exact steps

### 4.1 Personal Agent Protocol: commenting on the draft
Source: https://personalagentprotocol.org/docs/path-to-1 ("Draft 0.1, Updated Oct 12, 2026") and the review kit served at `https://personalagentprotocol.org/docs/review-kit.json`.

- Who may comment: "Feedback is welcome from anyone, whether or not you're a partner."
- What they want: "Privacy and security", "Gaps in the spec", "Simplification", "Broadly useful extensions. Things many implementations need, such as payments, that could be built as extensions."
- Way 1: "Use the site's inline comments. You can comment on any text on this site, then export your comments to share them. Enable site commenting, then select text to comment on it. To export, use the … button next to Comments."
- Way 2: "Review with an agent. If you'd like an agent to review the docs and write feedback, download the agent kit. It contains all the docs and an AGENTS.md that tells the agent how to write feedback in a form we can easily use."
- Where it goes: "Email either kind of feedback to [EMAIL REDACTED]."
- Licence on what is sent: "you grant all other members and users of the protocol a perpetual, irrevocable, nonexclusive, worldwide, royalty-free, sublicensable license to use, modify, and commercialize that feedback for any purpose, without compensation or other obligation to you." https://personalagentprotocol.org/license/contributions
- Format the authors ask for (from AGENTS.md in the kit): one Markdown file titled "Review of the Personal Agent Protocol docs (2026-10-12)", a two or three sentence summary, then points grouped by section, each labelled **Gap**, **Ambiguous**, **Contradiction**, **Risk**, **Wording** or **Question**, with headings such as "Specification › 3.1 Fields (`spec#fields`)". "For each point, say what's wrong and why it matters, and suggest a fix when you have one." "Skip praise and nitpicks unless asked."
- The sections an offers point belongs under: `extensions-operations#operations`, `extensions-operations#revisions`, `extensions-operations#proposing`, `spec#extensions`, and "General".
- The inline comment tool stores comments in the browser and exports them; nothing is public. There is no public thread to read or join.

### 4.2 Personal Agent Protocol: joining as a design partner
Same page: "We're welcoming new partners. To join, email [EMAIL REDACTED] with: Which group you fall into: personal agent, company, or technology provider. A technical contact, for the implementation work. A partnership contact, for everything else."
- A Shopify app that serves merchants would be a "technology provider".
- Every listed partner is a large company. Nothing says individuals are excluded and nothing says they are admitted.
- "Working group": the site does not use the term. The only sources for it are a Decagon X post quoted by a third-party blog [S]. There is no charter, mailing list or meeting schedule.
- Design workshops: announced twice ("host design workshops with interested parties", 6 Oct; "Over the next month we will host design workshops", 9 Oct). No date, place or sign-up page found.

### 4.3 ACP: proposing "Reconsideration Offers"
Sources: `docs/governance.md`, `docs/sep-guidelines.md`, `docs/operating-model.md`, `CONTRIBUTING.md` in https://github.com/agentic-commerce-protocol/agentic-commerce-protocol

1. Check it needs the formal route. It does: "Adding, modifying, or removing features in the specification (e.g., new API endpoints, messages, or data structures)" is a Major Change, and Major Changes "must follow the SEP process".
2. Optional first step: "Community members can discuss ideas in `#general` on Discord before filing." Also: "Start with a GitHub Discussion or Issue before creating a SEP".
3. File it: "You, the SEP author, create a well-formatted GitHub Issue with the `SEP` and `proposal` tags. The SEP number is the same as the GitHub Issue number".
4. Required parts: Preamble, Abstract ("~200 word"), Motivation ("SEP submissions without sufficient motivation may be rejected outright"), Specification ("A PR with the changes to the specification should be provided"), Rationale, Backward Compatibility, Reference Implementation, Security Implications.
5. Get a sponsor: "Every SEP must be sponsored by a TSC member to proceed." The seats today: OpenAI (`aravindrao-openai`), Stripe (`prasad-stripe`), Meta (`lhwa`). "Sponsorship discussion happens in `#technical-steering-committee`", which is members-only.
6. Review: "a mandatory 7-business-day public review window", which "must span across at least one instance of the weekly TSC meeting" (Thursday, 30 minutes, "time TBD").
7. Vote: "SEPs are adopted or rejected by a simple majority vote (50%+1) of the TSC." With three seats that is two votes. OpenAI and Stripe each hold a veto over SEPs, to block only.
8. Acceptance criteria: "A prototype implementation demonstrating the proposal", "Clear benefit to the ACP ecosystem", "Community support and consensus".
9. Time limit: "If the SEP has not found a sponsor within three months, Founding Maintainers may close the SEP as `dormant`."
10. The pull request needs: OpenAPI and JSON Schema under `spec/unreleased/`, examples in `examples/`, a file in `changelog/unreleased/`, the `sep-proposal.md` template, and a signed Individual CLA (the bot asks on the first pull request; "This takes less than 1 minute").
11. Tone rule: no "product marketing or self-promotion" and no "direct comparisons between competing products" in ACP channels. The proposal must not mention the app.

State of the repository, read today:
- Last commit on `main`: 18 Jul 2026. `pushed_at` is the same date. Nothing merged in almost three months.
- 144 open issues and pull requests. The 40 most recently updated carry no labels and no assignee, including SEPs filed in July, August and September.
- The two process documents disagree: `sep-guidelines.md` says sponsorship by "a Founding Maintainer or Maintainer (future tier)" and review "by the ACP Founding Maintainers team on a bi-weekly basis"; `governance.md` says a TSC sponsor and a weekly TSC vote. An open pull request from 16 Sep 2026 (#309, "Fix SEP sponsor/approval language in docs to match governance.md") is unmerged.
- Discussion #209 "ACP pattern for custom quoting before checkout creation?" (1 Apr 2026) has three comments, none from a maintainer account.
- Discussion #304 is a contributor asking in public for a sponsor for SEP #303; the same could be done.
- Discord invite printed in the operating model: https://discord.gg/53k84htnJ (not opened; joining needs an account).
- [inferred] The process is real and the hook is in the text, but the committee looks slow or quiet. A proposal filed cold may sit. Naming a sponsor first (Lee Hwa or Prasad Wangikar) is the step that decides the outcome.

### 4.4 Muse Connector Platform
Sources: https://muse.ai/platform and https://muse.ai/platform/docs . The terms page (https://muse.ai/platform/terms) returned HTTP 400.

1. Log in at muse.ai (the "Submit a connector" button leads to a login). Not done.
2. Submit: connector overview (5.1), business verification and terms (5.2), data processing questionnaire (5.3), endpoint, authentication and tool documentation for the API or MCP server (5.4), a test account and demo (5.5).
3. Review in three stages: risk assessment (6.1), tool review (6.2), end-to-end QA (6.3).
4. If approved: "discoverable by the Muse agent and in Settings > Connectors". Featuring "is a separate editorial decision".
5. No human contact: "we cannot respond to individual messages or emails about status." The one address on the page, [EMAIL REDACTED], is for security incidents only.
6. Business verification asks for "your organization and your authority to submit the connector", which may need a registered business.

### 4.5 Muse custom connectors
Meta, 29 Sep 2026: "Muse also supports custom connectors so you can plug in services we don’t support yet". The sibling notes quote Meta's help page: "Meta doesn't review custom connectors or how they use your information, so grant access with caution" (https://www.meta.com/help/artificial-intelligence/1687253048996149/, saved copy from this morning, not re-fetched by me). A user can ask their own Muse to connect to an offer endpoint with no Meta approval. Useful for a demo and for early users; it is not distribution.

### 4.6 UCP, for the Meta and Stripe members
The roster is at https://github.com/Universal-Commerce-Protocol/.github/blob/main/MAINTAINERS.md . James Andersen (Meta) and Prasad Wangikar (Stripe) sit on the Shopping Tech Council that reviews the open offer and quote proposals. The route is a comment on those open issues. The governance steps are covered by the sibling notes on UCP.

### 4.7 Not found
No Meta or Stripe office hours, no Muse developer-relations contact, no dated San Francisco event in this scope. Sierra Summit took place in San Francisco ("At Sierra Summit in San Francisco", Sierra's recap) on Tuesday 6 Oct 2026 and has passed. The promised PAP design workshops are the only upcoming in-person route, and they have no public date.

---

## 5. Honest read on who to write to

1. **Highest value for effort:** a PAP review sent in the format the authors ask for, making one point: the draft has no way for a company to put a better or different offer in front of a personal agent, and the Operations extension is two fields away from carrying one. This reaches the people who edit the draft, whoever they are, while the draft is ten days old and they are asking for "broadly useful extensions".
2. **Second:** an ACP proposal for Reconsideration Offers, with Lee Hwa or Prasad Wangikar asked in advance. The maintainers' own text names it. Risk: a quiet committee and thin Shopify traffic.
3. **Third:** David Singleton, one question about whether Muse will honour a merchant-declared extension. He is the one senior Meta person who is both named on PAP and plausibly reachable.
4. **Wang and Friedman:** the owner asked for them, and the note can truthfully refer to Wang's 12 Oct remark about delegated purchases. Expect no reply. A public post with a working demo that tags them is more likely to be seen than a direct message.
5. **Tobi Lutke** is outside this file's scope and belongs to the Shopify file.

---

## 6. Could not confirm

1. A Meta-published page stating Wang's title. Meta's executive pages returned 400 and the investor leadership page 403.
2. Whether Friedman reports to Wang in 2026.
3. Who leads the Muse Connector Platform and whether it has developer relations staff.
4. Mona Sarantakos's title (search summary only; the article returned 403).
5. Who edits the PAP draft; any Meta-side spec editor.
6. Dates, place and sign-up for the PAP design workshops; whether individuals can become design partners.
7. Job titles for Lee Hwa, James Andersen, Prasad Wangikar and Twum Djin. Only their seats and employers are confirmed.
8. Jeff Weinstein's and Steve Kaliski's titles from a Stripe page dated 2026.
9. Clay Bavor's and Kevin Miller's own public handles.
10. The CNBC interview of 6 Oct 2026 with Singleton and Taylor at its original URL; quotes are taken from SiliconANGLE's report of it.
11. The full text of X posts longer than 280 characters (Singleton's and Taylor's announcements are cut).
12. Muse Connector Platform terms.
13. Whether the ACP Thursday meeting is still held, and whether the Discord is active. I did not join.
14. The exact date of Steve Kaliski's AI Engineer Europe 2026 talk and a direct quote from it.
15. GitHub's API began refusing requests (rate limit) near the end; the last pull-request pages were read as public HTML instead.

---

## 7. Raw files

All under `/Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/docs/g2/`:

- ACP: `acp-governance.md`, `acp-sep-guidelines.md`, `acp-operating-model.md`, `acp-CONTRIBUTING.md`, `acp-MAINTAINERS.md`, `acp-CODEOWNERS`, `acp-SIGNATORIES.md`, `acp-README.md`, `acp-rfc-intent-traces.md`, `acp-commits.json`, `acp-gov-commits.json`, `acp-repo.json`, `acp-open-issues.json`, `acp-search-reconsideration.json`, `acp-search-suggested.json`, `acp-issue-54.json`, `acp-pr-201.json`, `acp-pr-281.html/.txt`, `acp-discussions.html/.txt`, `acp-discussion-209.html/.txt`, `acp-site-home.html/.txt`, `gh-user-*.json`.
- UCP: `ucp-MAINTAINERS.md`, `ucp-GOVERNANCE.md`, `ucp-maint-commits.json`, `ucp-andersen-comments.json`, `ucp-pr-538.html/.txt`, `ucp-pr-367.html/.txt`.
- PAP and Sierra: `pap-home.html`, `pap-path-to-1.html`, `pap-introduction.html`, `pap-extensions.html`, `pap-spec.html/.txt`, `pap-guides.html`, `pap-license.html`, `pap-license-contributions.html`, `pap-sitemap.xml`, `pap-review-kit.json`, `pap-kit-*.md`, `pap-chunk-*.js`, `sierra-pap.html/.txt`, `sierra-blog-poppy.html/.txt`, `sierra-about.html/.txt`, `sierra-callerid.html`, `sierra-summit-recap.html/.txt`, `sierra-blog-index.html/.txt`. `pap-llms.txt` is a 404 page.
- Meta: `muse-platform.html`, `muse-platform-docs.html/.txt`, `muse-introducing.html`, `muse-security.html`, `meta-muse-launch.html/.txt`, `meta-muse-smb.html/.txt`, `meta-muse-wonder.html/.txt`, `meta-enterprise-platform.html/.txt`, `meta-business-agent.html/.txt`, `cheekypint-wang.html/.txt`, `cnbc-muse.html/.txt`, `tc-friedman.html/.txt`, `siliconangle-pap.html/.txt`, `channelinsider-pap.html/.txt`, `wiki-msl.html/.txt`, `nat-org.html/.txt`, `singleton-blog.html/.txt`, `singleton-about.html`, `tweet-*.json`, `gh-search-muse-gadgets.json`. Error pages: `meta-executives.html`, `meta-exec-wang.html`, `meta-ir-leadership.html`, `muse-platform-terms.html`, `axios-muse-debut.html`, `dnyuz-muse-design.html`.
- Stripe: `stripe-sess-keynote.html/.txt`, `stripe-sess-new-channels.html/.txt`, `stripe-sess-under-the-hood.html/.txt`, `stripe-sess-beyond-checkout.html/.txt`, `stripe-blog-acp.html/.txt`, `stripe-blog-ac-solutions.html/.txt`, `stripe-blog-sessions-2026.html/.txt`, `stripe-news-muse-link.html/.txt`, `stripe-news-sessions-2026.html/.txt`, `stripe-newsroom.html`, `aie-kaliski.html/.txt`.
- Secondary write-ups used only to find links: `eesel-pap.html/.txt`, `cellcog-connector-platform.html/.txt`, `postiz-connectors.html/.txt`, `runtimewire-connectors.html/.txt`, `cryptobriefing-connectors.html/.txt`, `tnw-pap.html/.txt`, `x-*.html`.
