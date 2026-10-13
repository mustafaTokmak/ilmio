# V-G1 - Adversarial verification of G1-shopify (Shopify people)

Verification date: 13 Oct 2026. Verifier's own fetches, all read-only GETs of public pages. Nobody was contacted; nothing was posted, starred, followed, signed up for or submitted.

Raw copies of what I fetched are in the session scratchpad (`.../scratchpad/vg1/`), not in the project folder.

## How each source was read

- Web pages (dotdev.shopify.com, shopify.com newsroom and investor pages, ilya.grigorik.com, gilgreenberg.com, blog.yoav.ws, danielwyckoff.ca, sierra.ai, techcrunch.com, pymnts.com, fs.blog, productschool.com, stackoverflow.blog, channelnews.com.au, retailgentic.transistor.fm): `curl` with a browser User-Agent, text extracted locally, quoted strings searched in the text.
- GitHub (profiles, MAINTAINERS.md and its commit history, council minutes, pull requests, issues, discussions): `gh api -X GET`.
- Shopify developer forum: public Discourse JSON (`/t/<id>.json`, `/u/<name>.json`, `/search.json`).
- X posts: the public embed endpoint `cdn.syndication.twimg.com/tweet-result?id=<id>` (three posts verified).
- X profile bios: the embed profile endpoint returned 429 (rate limit) all session. Bios were read through the public FixTweet mirror `api.fxtwitter.com/<handle>` (a third-party mirror of public X profile data; flaky, several handles needed retries) and cross-checked against the researcher's saved raw copies in `work/docs/g1/x/`. Label for these: "X bio, read 13 Oct 2026 through a mirror".
- LinkedIn: not fetched. Every LinkedIn URL below comes from the person's own site, X profile or a podcast page.

## Summary of verdicts

| # | Person | Verdict | One-line reason |
|---|---|---|---|
| 1 | Gil Greenberg | corrected | Title holds, but he was "Product Manager, Checkout" until July and was reported "moving teams" in mid-September; the forum account IS provably his; ownership of the Discount Function input is over-attributed |
| 2 | Ilya Grigorik | confirmed | Every quote found; "sceptic" framing is one-sided and "decides in practice" is an inference |
| 3 | Mani Fazeli | confirmed | Own X bio and Sierra post of 6 Oct 2026 agree |
| 4 | Tobi Lutke | confirmed | CEO on four independent 2026 sources; post verified; his personal site is stale and is not a channel |
| 5 | David Moellenkamp | confirmed (title only) | Title on Shopify's own lineup of 21 Jul 2026; "owns discounts" stays unproven; no channel |
| 6 | Vanessa Lee | confirmed, channel added | Researcher found no channel; her X handle is @vlaurenlee with bio "VP Product @ Shopify" |
| 7 | Atlee Clark | confirmed | Byline and standfirst found; headline differs from the URL slug |
| 8 | Daniel Wyckoff | confirmed | Council rows and GitHub bio found; "Sr. Developer" comes from a stale personal page |
| 9 | Lee Richmond | confirmed | Council row plus @shopify.com commit email; his X bio still says Salesforce (stale) |
| 10 | Yoav Weiss | confirmed | About page, GitHub and X bio agree; "Shopify's position" is an inference |
| 11 | Wes (forum) | confirmed | Profile and quote found exactly |
| 12 | Ravi Yada | confirmed (title only), channel added | GitHub `raviyada-shop` commits are authored "Ravi Yada" |
| 13 | Matt Koenig | confirmed (title only) | No usable channel; Adam Barrus is the better named target for the same piece |

Nobody on the list had to be dropped. No namesake confusion was found. The biggest gaps are people the researcher missed: Eytan Seidman (VP of Product, developer platform), Adam Barrus (maintains Shopify's public RFC repository for Sidekick app intents) and Mikhail Parakhin (CTO, confirmed by his own X bio).

---

## 1. Gil Greenberg - CORRECTED

Claimed: "Staff Product Manager, agentic commerce (checkout, Functions in agentic checkouts, checkout WebMCP); UCP Shopping Tech Council member since 15 Sep 2026".

What I checked and found:

- DotDev lineup, https://dotdev.shopify.com/pages/sessions (event 21-22 Jul 2026): "How Shopify Functions help you succeed in agentic checkouts ... Gil Greenberg | Staff Product Manager | Shopify". Found.
- UCP MAINTAINERS.md (raw file read today): Shopping Tech Council row "Gil Greenberg | Shopify". Commit history: 2026-09-15 "docs(maintainers): replace Victoria Duggan with Gil Greenberg on Shopping Tech Council (#71)". Found. He is listed as present in the 9 Oct 2026 minutes (not in the 2 Oct minutes, when offers were discussed).
- His site https://www.gilgreenberg.com/ : "Hey! I'm based in NYC and work at Shopify as a Product lead." and "In NYC? Reach out on social media and I'd be happy to grab a coffee (I respond best on Twitter)." Found. The site links to twitter.com/gilgnyc, linkedin.com/in/gilgreenberg and github.com/gil--, so all three channels are his.
- GitHub `gil--`: name "Gil Greenberg", company "@shopify", twitter_username "gilgnyc", profile updated 2026-10-12. Public member of the Shopify organisation.
- X bio @gilgNYC (mirror, 13 Oct 2026): "Agentic commerce @Shopify. Try it at http://UCP.new  Prev: @checkoutblocks (acq by Shopify)".
- X post 2104583942728822998 (embed endpoint): created 2026-09-28T14:48:07Z by gilgNYC. Text matches the quote; the original has a yawning emoji after "paint dry." that the researcher dropped. The link goes to an X article.
- Press: TechCrunch 28 Sep 2026: "Gil Greenberg, a staff product manager who works on agentic commerce at Shopify". PYMNTS 28 Sep 2026: "Gil Greenberg, staff product manager, checkout at Shopify, wrote in a Monday (Sept. 28) article on LinkedIn". The two press titles disagree on the team.

New evidence the researcher did not have:

1. The forum account `Gil-Shopify` is provably Gil Greenberg. His posts are signed. Thread 35930 (9 Jul 2026) and thread 29264 (4 Feb 2026) both end: "Gil Greenberg Product Manager, Checkout". The researcher wrote "same person not proven"; that caveat can be removed.
2. He appears to have changed teams in September 2026. In thread 35930, post 20, 16 Sep 2026, a developer (Alex Hooper) wrote: "@Gil-Shopify do you know who'll be taking this on now you're moving teams?" Nobody answered. This is a third party's remark, not Gil's own statement, but it lines up with the council seat of 15 Sep 2026 and with his X bio now reading "Agentic commerce @Shopify" while his July signature said "Product Manager, Checkout".
3. He is active on UCP GitHub: he authored PR #793 "feat(permalink): add ucp/version protocol version parameter" (updated 13 Oct 2026) and left review comments on 7 and 9 Oct 2026.

Corrected role: Staff Product Manager at Shopify, now working on agentic commerce (UCP Shopping Tech Council since 15 Sep 2026; announced checkout WebMCP on 28 Sep 2026; answers Checkout MCP threads). Until at least 9 Jul 2026 he signed as "Product Manager, Checkout". The move itself rests on a third party's remark plus his own bio.

What is wrong or inflated in the researcher's entry:

- "Closest verified owner of 'context.intent or context.eligibility into Discount Functions'" is too strong. His July work was checkout validation Functions and the buyer journey intercept; the Discount Function API belongs to the Discounts team (forum: Adam Ford, "Developer from the Discounts team here", 13 Aug 2026). After the reported team move, whoever inherited checkout extensibility is unnamed. He is, however, now closer to the other half of missing piece (a): the store's agent surface (UCP, Checkout MCP, checkout WebMCP).
- The 9 Jul quote "I'd love to hear about any use cases you're blocked on, what we're missing" was an invitation about the buyer journey intercept deprecation, written in his old role. It is still fair to cite, with that context.

Channels (all verified as his): X https://x.com/gilgNYC ; GitHub https://github.com/gil-- ; site https://www.gilgreenberg.com/ ; LinkedIn https://www.linkedin.com/in/gilgreenberg (linked from his site; not fetched); forum https://community.shopify.dev/u/Gil-Shopify .

Reachability: high stays fair. Better ask for him now: "Which team owns what an app's Function can see in an agentic checkout, and could the agent's UCP context.intent be passed to it?"

## 2. Ilya Grigorik - CONFIRMED

- https://ilya.grigorik.com/ : "I am a Distinguished Engineer and Technical Advisor to the CEO at Shopify, on a mission to make commerce better for everyone." Found (page undated).
- DotDev lineup (21-22 Jul 2026): "Ilya Grigorik | Distinguished Engineer, Technical Advisor to the CEO | Shopify". Found.
- MAINTAINERS.md: Governance Council "Ilya Grigorik | Shopify"; Shopping Tech Council "Ilya Grigorik | Shopify"; Payments Tech Council "Ilya Grigorik\* | Shopify". Found. The Governance Council has three seated members (Amit Handa of Google, Ilya Grigorik, Twum Djin of Stripe) and two open seats.
- https://shopify.engineering/ucp (11 Jan 2026): "Ilya Grigorik is a Distinguished Engineer at Shopify." Found.
- X bio (mirror, 13 Oct 2026): "Distinguished Engineer, @Shopify. On a mission to make commerce better for everyone." GitHub: company "Shopify", email [EMAIL REDACTED] published, twitter igrigorik.
- Contribution counts confirmed: 52 commits in Universal-Commerce-Protocol/ucp (top contributor), 76 in Shopify/ucp-cli, 4 in Shopify/ucp-proxy.
- Minutes 2 Oct 2026: the quoted sentence is there, word for word. PR #538: opened 22 Jun 2026, merged 7 Oct 2026 by igrigorik; the body contains "`ask` answers; it does not act. A Business **MUST NOT** change commerce state in response to a question". X post of 19 May 2026 verified through the embed endpoint.

Issues:

- The "sceptic" framing is half the sentence. The same minute continues: "James Andersen, Greg Smith, Jordan Williams, Julia Downey, and Ilya Grigorik confirmed strong industry demand for personalization, reordering, and upselling". A note must not tell him he opposed offers.
- The minutes are a minute-taker's paraphrase. Do not put the words in quotation marks as his.
- "Decides in practice whether an offer message is acceptable to Shopify" is an inference; no source says it.
- Nobody from Shopify has commented on issue #738 or PR #773 so far (15 comments on #738, from arjun2075, westonale and c-e-daly). Issue #738 has milestone 2026-12-08 and assignee gsmith85 (Greg Smith); PR #773 itself has no milestone and no assignee and its last maintainer comment is Greg Smith on 2 Oct 2026 ("Will discuss at Technical Council tomorrow").
- Issue #738's exact title is "[Proposal]: State-bound Offer extension for merchant-proposed Cart changes". It is seller-initiated. OfferAd's buyer-initiated request is closer to discussion #502 "A Buyer's Agent Should Negotiate" (author c-e-daly).

## 3. Mani Fazeli - CONFIRMED

- X bio @mcfazeli (mirror, 13 Oct 2026): "Views my own. VP of Product @Shopify, leading agentic commerce. Prev: SVP Product @WaveHQ (acq @HRBlock), co-founder @Betterez (acq @Busbud) + @ContextLogic". His X profile's website field is https://linkedin.com/in/mcfazeli, so the LinkedIn URL is his.
- Sierra, https://sierra.ai/blog/introducing-personal-agent-protocol (datePublished 2026-10-06): the quote is there word for word, attributed "Mani Fazeli, VP Product, Shopify".
- DotDev lineup: "Mani Fazeli | VP, Product | Shopify". Retailgentic show notes dated 30 Jul 2026 carry "somewhere between walk and run today" and "always put the control in the merchant's hand" (show-note wording, secondary).
- The stale author page is confirmed stale: it still says "Mani Fazeli is a Director of Product at Shopify. He currently leads the Checkout and B2B teams".

Issues: the Sierra page lists Shopify among "industry partners" with whom "Meta and Sierra are developing" the protocol. It does not say Shopify will implement it, so the suggested ask should begin "If Shopify implements..." not "When". His quote is a launch endorsement, not a product statement.

## 4. Tobi Lutke - CONFIRMED

- https://www.shopify.com/investors/board-of-directors (undated): "Mr. Lütke has served as our Chief Executive Officer since April 2008." Found.
- X bio @tobi (mirror, 13 Oct 2026): "Shopify CEO by day, Dad in evening, hacker at night, Aspiring comprehensivist." 517,530 followers.
- DotDev lineup (21-22 Jul 2026): "Tobias Lütke | CEO | Shopify". fs.blog, datePublished 2026-09-10 (press): "Shopify founder and CEO Tobi Lütke joins Shane Parrish". ChannelNews (press, Sep 2026): "Shopify CEO Tobias Lütke confirmed the partnership".
- X post 2102090718546198790 (embed endpoint): created 2026-09-21T17:40:56Z by tobi; text matches exactly. About 8,000 likes and 400 replies, so a reply there is one of hundreds.
- The fs.blog sentence is on the page. Context matters: he is describing a belief he feeds to his AI tools to test ideas ("sometimes it's just like, 'Hey, I believe it should be easier to solve any kind of problem related to commerce inside of Shopify than outside of Shopify.'"). It is his stated belief, quoted from a transcript on a press site.

Issues:

- https://tobi.lutke.com/ is his, but its newest post is dated 22 Dec 2019. It proves nothing about 2026 and is not a contact channel. Only X is a live channel.
- The claim that he "has replied to individual app developers on X in the past" (a May 2022 Gil Greenberg post) was not verified by me.
- No sign of any change of role in 2026; one low-quality page claiming he became "Executive Chair" in 2020 is contradicted by every other source.

## 5. David Moellenkamp - CONFIRMED (title only)

- DotDev lineup (21-22 Jul 2026): workshop "Building dynamic, multi-class discounts with Functions", "David Moellenkamp | Director, Product | Shopify" with "Jitesh Sachdeva | Manager, Engineering | Shopify". Found.
- https://www.shopify.com/enterprise/blog/authors/david-moellenkamp (undated): "David Moellenkamp is a director of product at Shopify." Found. His only article listed there is "Ecommerce Automation: Benefits and Tasks You Can Automate" (16 Jan 2024), which points to automation rather than discounts.

Issues: ownership of discounts is not stated anywhere I could read. No X handle, no forum account (forum search returns nothing for his name), no statement in his own words. He is not a usable message target; the Functions category of the forum is.

## 6. Vanessa Lee - CONFIRMED, channel added

- DotDev lineup: "Welcome & keynote ... Atlee Clark | VP, Partners | Shopify | Vanessa Lee | VP, Product | Shopify". Found.
- Shopify newsroom 11 Jan 2026 (datePublished 2026-01-11): quote found word for word, "says Vanessa Lee, VP of Product at Shopify".
- Product School page (undated, secondary): the "reporting directly to the CEO" and "leads the development of Sidekick" sentences are on that page.
- New: Stack Overflow blog, 9 Jan 2026, https://stackoverflow.blog/2026/01/09/every-ecommerce-hero-needs-a-sidekick/ : "Ryan is joined by Vanessa Lee, VP of Product at Shopify ... They cover the development of Sidekick" and "Connect with Vanessa on Twitter", which links to https://x.com/vlaurenlee .
- New: X bio @vlaurenlee (mirror, 13 Oct 2026): name "Vanessa Lee", bio "VP Product @ Shopify", location Toronto, about 4,200 followers. This is a current, own-profile confirmation of her title and a verified channel.
- Newer appearance: The Unofficial Shopify Podcast, "Inside Shopify's 'Everywhere' Edition | Spring 2026", 23 Jun 2026 (Podwise page, third-party summary: "Vanessa Lee, VP of Product at Shopify, explains ..."). No verbatim quote available in text.

Issues: the researcher's "no verified public channel" is wrong. No verbatim statement from the last six months was found; the January quote is nine months old.

## 7. Atlee Clark - CONFIRMED

- https://www.shopify.com/news/a-world-with-more-builders (datePublished 2026-07-28): byline "by Atlee Clark"; standfirst "Shopify's VP of Partnerships believes AI will make that bet pay off for more people than ever."; the "Somewhere someone in a garage..." sentence is there word for word.
- DotDev lineup: "Atlee Clark | VP, Partners | Shopify". Partner Town Hall page https://www.shopify.com/webinar/partner-townhall-w26 (undated, first half of 2026): "Atlee Clark | VP of Partnerships".

Issues: the article's live headline is "The next era of commerce, built by partners"; the URL slug is older. No X handle or other channel could be verified (the handle @atlee belongs to someone else). A hook for a San Francisco builder is in the piece: "The directions took me to a garage in SoMa."

## 8. Daniel Wyckoff - CONFIRMED

- MAINTAINERS.md: "Daniel Wyckoff | Shopify" on both the Shopping and Payments Tech Councils. Found. Present at the 2 Oct and 9 Oct 2026 meetings.
- GitHub `raginpirate`: name "Daniel Wyckoff", company "@Shopify", bio "Contributing to Shopify's Payments Platform, UCP's Technical Council, W3C's WPWG, and FIDO's PTWG.", email [EMAIL REDACTED], blog danielwyckoff.ca, updated 2026-10-10. Public member of the Shopify organisation.
- PR #890 (opened 2026-10-02, open): body starts "**Combined per the Oct 5 TC deep dive:** this PR now carries both the purchase options extension and the subscription policy type it defines (formerly #901)." Found.

Issues: "Sr. Developer @Shopify" comes from his personal site, which also says "A member of the Subscriptions team"; the page is undated and looks older than his GitHub bio. Use the GitHub bio wording and do not state a title. He does not own offers.

## 9. Lee Richmond - CONFIRMED

- MAINTAINERS.md: "Lee Richmond | Shopify". Found. Present on 9 Oct 2026.
- GitHub `richmolj`: name "Lee Richmond", company "Shopify". Commits in PR #584 are authored with an @shopify.com address (13 Jul and 3 Aug 2026).
- PR #584 (opened 2026-07-13, updated 2026-10-07): the quoted sentence is the first line of the description.

Issues: his X account @richmolj (linked from his GitHub profile) has the bio "Principal Member of Technical Staff at Salesforce. Creator of Graphiti". That bio is stale; it must not be used as role evidence and the account is not a useful channel. His GitHub profile also shows a personal email address; the pull-request thread is the appropriate route. Weak target for offers, as the researcher said.

## 10. Yoav Weiss - CONFIRMED

- https://blog.yoav.ws/about/ : "These days I'm working at Shopify on improving the web platform and making it the best platform for online commerce." Found. Same page: he co-chairs the W3C Web Performance Working Group and the Web Incubator Community Group and is a Blink API owner.
- GitHub `yoavweiss`: company "@Shopify", email [EMAIL REDACTED]. New: X bio @yoavweiss (mirror, 13 Oct 2026): "Faster web, one perf feature at a time. Web platform @shopify. @webperfwg/@wicg_ co-chair. Blink API owner."
- WebMCP issue #312 "Keeping the agent in-sync with the page's context" (opened 2026-09-17, updated 2026-10-13, 6 comments): both quoted sentences are in the body. Issue #159: opened 2 Apr 2026, closed; the "tools.platform.com" comment is his, dated 9 Apr 2026.

Issues: "speaks for Shopify use cases" and "Shopify's position" are inferences; he files issues under his own name. Job title stays unverified.

## 11. Wes (Wes-Dev-Shopify) - CONFIRMED

- Profile JSON: name "Wes", title "Shopify Staff", admin true, moderator true, account created 30 Apr 2026, last post 2026-10-09.
- Thread 36329 (created 27 Jul 2026, 3 posts): his post of 21 Aug 2026 contains "Extending UCP to expose these kinds of fulfilment details is a known gap and is on our radar. At this time, developers can't add to or adjust a merchant's /.well-known/ucp endpoint. I'll follow up in this thread if anything changes on that front." Found. Thread 37439 quote also found (4 Sep 2026).

Issues: none on the facts. "Known gap" refers to fulfilment details in the UCP profile, not to offers; do not stretch it. Liam Griffin is a named alternative ("I'm a Developer Advocate here at Shopify", profile read today) but his last forum post is 30 Jul 2026.

## 12. Ravi Yada - CONFIRMED (title only), channel added

- DotDev lineup: "The next chapter of the Catalog API ... Ravi Yada | Senior Staff Product Manager | Shopify". Found.
- New: GitHub `raviyada-shop` (created Mar 2026, no profile name) has three commits in Shopify/ucp-cli authored "Ravi Yada" (28 May and 26 Jun 2026) and two pull requests about Global Catalog. That links the handle to him and gives a real, if thin, channel.
- Forum thread 36731 on Promoted Placements still has one post and no reply.

Issues: ownership of Promoted placements is inferred. No statement in his own words. No forum account.

## 13. Matt Koenig - CONFIRMED (title only)

- DotDev lineup: "How Sidekick extensions change app engagement ... Matt Koenig | Senior Staff Product Manager | Shopify". Found.
- New: forum account `Matt_Koenig` ("Shopify Staff") exists but is dormant (last post 22 Apr 2025). He does answer on X: in thread 33872 a developer wrote on 1 May 2026 'Had a response on X via Matt Koenig at Shopify "Almost GA!!! Just wrapping up a few remaining things :)"' and Wes confirmed "what was already shared by Matt Koenig on X". I could not identify his X handle, so no channel is verified.

Issues: for the Sidekick precedent the better named target is Adam Barrus (see below), who runs a public proposal repository.

---

## People the researcher missed

1. **Eytan Seidman - VP of Product, developer platform.** Shopify newsroom, 10 Dec 2025, https://www.shopify.com/news/winter-26-edition-dev : "'We rewired the platform to be AI-first and instant.' says Shopify's VP of Product Eytan Seidman." Partner Town Hall page (2026, undated): "Eytan Seidman | VP of Product". X bio @eytanseidman (mirror, 13 Oct 2026): "Product @shopify working on our Developer Platform. Builder of products, teams and companies." (New York, about 1,800 followers). He is the most plausible owner of the decision "an app may register a tool on the store's agent surface", which the researcher listed as having no named owner. No statement from the last six months found. He was not on the DotDev lineup.
2. **Adam Barrus - Senior Staff Product Manager, Sidekick app extensions.** DotDev lineup: "Adam Barrus | Senior Staff Product Manager | Shopify". GitHub `adambarrus` (company "Shopify"; publishes a Shopify email address on his profile) is the top committer of https://github.com/Shopify/app-intent-types , described as "Public catalog & proposal venue for Sidekick app extensions intent types." On 28 Aug 2026 he merged "Add definition for `application/quote` type", now listed as "Sales quotes & negotiation". That type started as a forum request by an app developer on 2 Jul 2026 (thread 35737), moved to an RFC in that repository on 3 Jul, and was released by 30 Aug 2026. This is a working, public example of an individual app developer getting Shopify to extend an agent contract in eight weeks. The researcher mentioned him only in passing and missed the repository entirely.
3. **Trish Ta - Senior Staff Developer, Sidekick app extensions.** DotDev lineup title; forum account `Trish_Ta` ("Shopify Staff"). 2 Jul 2026, thread 35737: "can you put up a proposal for the application/quote type in this repo?"
4. **Mikhail Parakhin - CTO.** X bio @MParakhin (mirror, 13 Oct 2026): "Shopify CTO". The researcher left him out as unverified; his own profile confirms the title. No recent statement on agentic commerce found; low relevance to the specific pieces.
5. **Liam Griffin - Developer Advocate.** Forum profile bio read today: "I'm a Developer Advocate here at Shopify and I work on projects that help developers find success when building apps, themes, and integrations." Named developer-relations contact; quieter since 30 Jul 2026.
6. **Josh Larson - senior staff engineer.** X bio @jplhomer (mirror, 13 Oct 2026): "senior staff engineer, @shopify." Second-largest committer on Shopify/ucp-cli (17 commits).
7. **Farhan Thawar - VP and Head of Engineering.** X bio @fnthawar (mirror, 13 Oct 2026): "VP & Head of Eng @Shopify". Not an owner of any missing piece; listed only because he is a senior, publicly active Shopify leader.

Cross-scope pointers (belong to other groups, noted so they are not lost):

- **Glen Coates**, formerly Shopify's head of core product, was reported in December 2025 (BetaKit, The Logic; press) to have joined OpenAI as head of its app platform. Not re-verified for October 2026. Relevant to missing piece (b), not to Shopify. Product School still lists him as a Shopify VP; that page is stale.
- **Carl Rivera**: his X bio now reads "Building a bank customers love fanatically ... @nubank". Do not treat him as a Shopify or Shop app contact.
- **Chris Daly** (GitHub `c-e-daly`), author of forum thread 33264 "Managing Offers from Agents" and UCP discussion #502, commented on issue #738 on 9 Oct 2026. **Arjun Garg** (GitHub `arjun2075`, company "Intuit") wrote #738 and #773. Both are allies on the protocol side.

Still unknown after this pass: who leads the Shop app's shopping agent; who the product manager for Discounts is; who inherited checkout extensibility from Gil Greenberg.

## Venue corrections and additions

- Add: https://github.com/Shopify/app-intent-types (Discussions and pull requests; 30 discussions, several opened this week). Merchant-side only (Sidekick), but it is Shopify's own public proposal process for app-to-agent contracts and the natural place to ask whether a buyer-facing equivalent is planned.
- UCP discussion #863 is titled "Mapping a Shopify points program onto the v2026-08-25 loyalty extension: fixtures and five questions" (25 Sep 2026, 0 comments). The researcher described it as asking "how a third-party app reaches a platform-hosted profile"; I did not read the body, so treat that description as unverified.
- Everything else in the researcher's venue table that I spot-checked held: forum threads 36329, 36233, 35628, 36785, 36731, 33264 (still zero replies) and 37439 contain the quoted sentences with the stated dates.

## What I could not verify

- Any LinkedIn page.
- That Gil Greenberg himself has said he changed teams (only a developer's remark and his bio).
- X handles for Atlee Clark, David Moellenkamp, Matt Koenig.
- The claim that Tobi Lutke replied to Gil Greenberg on X in May 2022.
- That titles taken only from the July 2026 DotDev lineup (Moellenkamp, Yada, Koenig, Barrus, Ta) are unchanged in October 2026; nothing newer was found for or against.
- Eytan Seidman's and Mikhail Parakhin's titles beyond their own X bios and the dated Shopify pages cited.
