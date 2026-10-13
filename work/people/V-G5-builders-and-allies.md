# V-G5 - Adversarial verification of G5-builders-and-allies

Verification date: 13 Oct 2026. Verifier's notes on `/Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/people/G5-builders-and-allies.md`.

Method: every cited source was fetched again today (curl with a browser User-Agent for web pages; read-only GET and read-only GraphQL queries against the GitHub API for profiles, issues, discussions, pull requests and files). Nobody was contacted. No posts, comments, stars, follows, sign-ups or forms. LinkedIn and X pages were not opened; a LinkedIn or X handle is listed only when the person's own page or profile links to it. Raw copies of what I fetched: `/Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/docs/vg5/` (84 files).

Verdict key: confirmed = source re-fetched, quote present, nothing newer contradicts it. corrected = role or a fact the outreach note depends on is different from what the researcher wrote. unverified / drop = not used below; nobody on this list had to be dropped.

---

## 0. What changed, in short

1. **The Offer extension has moved further than the researcher reported.** UCP issue #738 was put on the `2026-12-08` milestone by Greg Smith (Google, Shopping Tech Council) on 25 Sep 2026 and assigned to him on 2 Oct 2026. The council discussed it on 2 Oct 2026; the public minutes record that "Ilya Grigorik questioned whether cart state binding is necessary and probed whether platforms and agent builders would trust or utilize merchant-recommended products" and that "Greg Smith will carry the topic into Monday's deep dive session to evaluate potential inclusion in the December milestone." Source: https://github.com/Universal-Commerce-Protocol/meeting-minutes/blob/main/tc/shopping/2026/2026-10-02.md . The researcher wrote that no community call or minutes were found; a public `meeting-minutes` repository exists with weekly notes through 9 Oct 2026.
2. **Tomas Taylor is Co-Founder and CTO of Pennant, a Y Combinator Summer 2026 company that YC lists in New York City.** The researcher had "building Pennant" and "same city". His own site still says San Francisco; the company's pages say New York.
3. **StabileRewards' Shopify App Store listing gives the developer address as Dublin, CA, not San Francisco.** Only the founder's GitHub profile says San Francisco. Discussion #856 is not theirs (it is by `deangoodman`).
4. **Francesco Marinoni Moretto is not simply "independent with no employer".** His Sessionize speaker profile says "Lead AI Architect working on agent-native commerce" and "AI Practice and Community Leader at N1AI". The book is forthcoming ("Out October 2026"), published by Affero Press, Milan.
5. **Juan Fernández speaks for Shopware in the threads but does not write the quote extension.** The commits are by Sebastian Hölscher (`HoelShare`) and Lukas Rump (`lukasrump`); the plugin repository is MIT-licensed, which already answers most of the proposed ask.
6. **"The only concrete offer message proposal in UCP" is overstated** for Arjun Garg. Others open today: #929 Quote extension with an optional buyer `proposal` (Sparsh, Google London), #810/#811 per-seller offers on catalog variants (Provash Shoumma, Klarna), PR #482 approaching discounts (Scot DeDeo, Salesforce; also on the December milestone), #384 Provider and offer discovery.
7. All twelve recent-statement quotes are really on the cited pages. For five people a newer or more relevant statement exists (listed per person).

---

## 1. Per-person checks

### 1.1 Chris Daly - Founder, I Want That! Inc - CONFIRMED

- Role source re-fetched: https://useiwantthat.com/ shows "Chris Daly" / "Founder, I Want That! • 25 years in retail"; footer "© 2026 I Want That! All rights reserved." GitHub API `users/c-e-daly`: name "Chris D", company "I Want That! Inc", bio "Founder, @i-want-that 30 years sales and marketing", location "Columbus, Ohio", `twitter_username` "letsmakedeals", 1 follower, updated 2026-09-22.
- Statement: comment 6086329030 on UCP #738, created 2026-10-09T17:54:01Z by `c-e-daly`; the quoted sentence is there word for word.
- Thread ownership: discussion #502 "A Buyer's Agent Should Negotiate" was created by `c-e-daly` on 2026-06-08 (category Ideas, 4 comments). Confirmed.
- Missed by the researcher, and directly relevant to OfferAd: on 10 Sep 2026 he wrote in #502: "I think I still have name-spaced UCP, Shopify blocked it and it has to be delivered as a theme extension, Woo received it as meta data on a product page." https://github.com/Universal-Commerce-Protocol/ucp/discussions/502#discussioncomment-18388900 . Also 10 Sep 2026: "My guess is this is 2027 -2028 before it becomes viable."
- Open loop: on 10 Oct 2026 Arjun Garg asked him directly "How does your restoration flow handle an outstanding counteroffer—does it retain the original proposal or generate a fresh one?" No reply from Daly as of today.
- Channels: GitHub `c-e-daly` confirmed. X `letsmakedeals` is the handle he set on his own GitHub profile; I did not open X. The HubSpot booking link is on his site and is labelled customer demo. Additional channel the researcher missed: his site links https://theretailsellersmindset.substack.com (footer "© 2026 Christopher Daly").
- Small inconsistencies, not material: GitHub display name is "Chris D"; "25 years" on the site against "30 years" on GitHub.

### 1.2 Arjun Garg - author of the UCP State-bound Offer proposal - CONFIRMED (title unverified, as the researcher said)

- GitHub API `users/arjun2075`: name "Arjun Garg", company "Intuit", location "US", updated 2026-09-28. Issue #738 opened by `arjun2075` on 2026-08-15, author_association NONE, 15 comments, updated 2026-10-10. PR #773 open, labels `status:under-review`, `gov:needs-tc-review`, `area:shopping`. Draft PR #918 open (opened 2026-10-09). Issue #845 open.
- Intuit affiliation is self-declared in one profile field; nothing on an Intuit page confirms it and "Arjun Garg" is a common name. Title and whether Intuit backs the work: unverified. The Google CLA bot on PR #773 said it "may be your first contribution to a Google open source project".
- Statement: comment 6087028190, 2026-10-09T18:38:46Z, quoted sentence present. The "sponsored placement" passage (comment 6077491198, 2026-10-09) is also present as quoted.
- Corrections to "controls":
  - Not "the only concrete offer message proposal in UCP" (see 0.6).
  - He also authored discussion #724 "Proposal: Preserve commercial-intervention provenance across Catalog → Offer → Cart → Checkout" (2026-08-14, 12 comments) and discussion #702. #724 is the closest thing in UCP to "an ad is an offer with declared provenance".
  - Status the researcher missed: #738 milestone `2026-12-08` (set by `gsmith85` 2026-09-25), assignee `gsmith85` (2026-10-02). `gsmith85` on PR #773, 2026-10-02: "apologies for the delay. Will discuss at Technical Council tomorrow, stay tuned." Council minutes of 2026-10-02 quoted in 0.1. So the person who decides is Greg Smith with the council, and Shopify's Ilya Grigorik has voiced doubt about state binding.
- Channels: GitHub `arjun2075` and the threads, confirmed. The researcher wrote that no email is on his profile; the GitHub API returns a public email he set on the profile ([EMAIL REDACTED]). It is a personal address; the issue thread remains the right route.
- The proposed ask still fits. One adjustment: by his own words on 9 Oct, #738 "doesn't define those negotiation states or arbitrary changes to shipping, payment terms, or other commercial conditions", so a free-express-shipping example tests exactly the stated boundary; say so.

### 1.3 Yang W. - Founder, StabileRewards - CORRECTED (location and thread attribution)

- GitHub API `users/yangw831`: name "Yang W.", company "StabileRewards", location "San Francisco", bio "Founder, StabileRewards: loyalty for Shopify merchants in AI-assisted shopping", 0 followers, updated 2026-10-09. Discussion #863 is signed "— Yang, StabileRewards".
- The company website (https://www.stabilerewards.com/) names no person. The founder role rests on the self-written GitHub bio only.
- Location conflict: the Shopify App Store listing https://apps.shopify.com/loyalty-rewards-ai-agent shows "Developer / StabileRewards / Dublin, CA, US". Dublin is in the East Bay, about 35 miles from San Francisco. "Same city" is not established; "Bay Area" is.
- The app is now listed as "Stabile: AI Shopper Rewards".
- Attribution error: the researcher lists "UCP discussions #856 and #863" as theirs. #856 ("We probed 500 platform-hosted storefronts...") is by `deangoodman`. #863 only says "Following up on the storefront probe in discussion #856".
- Statement: #863 created 2026-09-25T01:37:38Z, title "Mapping a Shopify points program onto the v2026-08-25 loyalty extension: fixtures and five questions", 0 comments today. Both quoted sentences present. "Three weeks" is 18 days.
- Newer statement, 8 Oct 2026, on #384: "Letting a Platform discover a provider's offers before it chooses among stores is valuable for Shopify merchants, because a signal like "this cart earns N points" or "you can redeem $5 here" can influence the Platform's selection ahead of checkout." https://github.com/Universal-Commerce-Protocol/ucp/issues/384#issuecomment-6068840152
- "Solo founder": not verifiable. The post says "We run a loyalty app".
- Channels: [EMAIL REDACTED], X `@stabilerewards` and the LinkedIn company link are all on the company home page. Confirmed.

### 1.4 Ben Ouattara - Founder, Flux - CONFIRMED (and strengthened)

- https://withflux.co.uk/llms.txt redirects to https://app.withflux.co.uk/llms.txt . Line 166: "Flux is founded by Ben Ouattara. Based in the United Kingdom." Line 169: "Last updated: 7 October 2026." https://withflux.co.uk/company/about : "Ben Ouattara, Founder of Flux".
- Registry confirmation the researcher did not have: UK Companies House lists FLUXAI GROUP HOLDINGS LTD, company number 16774724, "Incorporated on 9 October 2025", with one current officer, "OUATTARA, Ben Ahmed Elvis", Director. https://find-and-update.company-information.service.gov.uk/company/16774724/officers . The registered address matches the developer address on the Shopify listing.
- Shopify App Store listing https://apps.shopify.com/flux-ai-negotiation : developer "Flux", "Launched June 5, 2026".
- Statement quotes: both present in llms.txt (lines 19 and 59).
- Small corrections: llms.txt says ChatGPT access is "via the "Negotiate with Flux" custom GPT", so it is a custom GPT, not a ChatGPT app. The vendor-namespaced UCP profile is real: https://app.withflux.co.uk/.well-known/ucp returns a `com.withflux.negotiate` service (version 2026-09-17, MCP transport, OAuth 2 with PKCE). It is served from Flux's own domain, not from a merchant's store domain.
- Channels: [EMAIL REDACTED] is on the partners page ("Apply to partner with Flux Opens an email to [EMAIL REDACTED]"); [EMAIL REDACTED] is in llms.txt and in the UCP profile; LinkedIn company page linked from the site. No personal profile found; unchanged.

### 1.5 Weston - Founder and CEO, Facet - CONFIRMED (self-description only)

- GitHub API `users/westonale`: name "Weston", company "Facet", location "San Francisco, CA", bio "Founder, CEO of Facet.  The UCP checkout for every store. Author of x402-direct with cancelation & refunds.", `twitter_username` "Westonale", account created 2026-05-03, updated 2026-09-02, member of GitHub org `Facet-llc`.
- https://facet.llc/ names no person. The title rests on his own GitHub bio. Surname not published. San Francisco rests on the GitHub profile only.
- Statement: comment 5454508286 on #738, 2026-08-28T15:36:35Z, quote present. It was the first comment on #738 by anyone other than the author, so "first substantive reviewer" holds. He was also the first commenter on #724 (2026-08-23).
- Newer activity: eight comments in discussion #812 between 11 and 18 Sep 2026; UCP issue comments on 29 Sep 2026.
- Channels: X `@facetllc`, the Slack invite and r/FacetAgentCommerce are all linked from facet.llc. Also published: [EMAIL REDACTED] (GitHub org profile) and [EMAIL REDACTED] (site). X `@Westonale` comes from his GitHub profile field; not opened.

### 1.6 Juan Fernández - Product Manager, Shopware Agentic Commerce Lab - CONFIRMED (scope of control narrowed)

- GitHub API `users/juanferrub`: name "Juan Fernández", company "Shopware", bio "Product Manager at Shopware's Agentic Commerce Lab", location empty, updated 2026-08-17. Shopware's careers page confirms the lab exists as a team (https://careers.shopware.com/de/team/agentic-commerce-lab/) but names nobody. A web search for his name with Shopware returned nothing. So: self-described, consistent with how he writes ("Strong +1 from Shopware", "our current B2B Quote capability"), not independently confirmed.
- "Germany" is not on his profile: unverified.
- Statement: comment in #502 dated 2026-09-10T12:24:54Z, quote present.
- Newer statements: 29 Sep and 5 Oct 2026 on UCP #877 (catalog items with no public price). 29 Sep: "Requiring every catalog variant to expose a numeric price creates a false choice for businesses whose pricing depends on contracts, buyer identity, volume, rental terms, or an RFQ process." https://github.com/Universal-Commerce-Protocol/ucp/issues/877#issuecomment-5885765668
- Control, narrowed: `com.shopware.quote` is live (https://sw-ag.dev/.well-known/ucp lists it at version 0.2). The code in `agentic-commerce-lab/merchant-quote-agent-plugin` is by `HoelShare` (Sebastian Hölscher, 1,137 contributions, last commit 2026-10-09); `rfq-bench` is by `lukasrump` (Lukas Rump, "Software Engineer @shopware"); `SwagUcp` contributors include `sthamann` (Stefan Hamann, company "Shopware AG"). Juan has no commits there and is not a public member of the org. He is the product voice, not the owner of the schema.
- His focus is B2B RFQ ("We are actively working on B2B agentic commerce"), not consumer offers.
- The ask needs rewording: the plugin repository is MIT-licensed, so "is the schema free to reuse" is largely answered. A better question is whether Shopware would accept a consumer (non-RFQ) profile of the same propose / counter / accept shape.

### 1.7 Tomas Taylor - CORRECTED: Co-Founder and CTO, Pennant (YC Summer 2026)

- His own site (https://totaylor.com/, "© 2026 Tomas Taylor") says "I'm based in San Francisco, but South London is home." and "Today I'm building Pennant." Quotes present.
- Pennant's own team page, https://www.getpennant.ai/team : "Tomas Taylor / Co-Founder & CTO" and "He has contributed to multiple open-source projects, including AutoGPT and the Agentic Commerce Protocol, and co-founded ClawCon, a personal AI community event and hackathon series". The site banner says "We're hiring in New York".
- Y Combinator company page, https://www.ycombinator.com/companies/pennant : "Tomas Taylor / Founder/CTO", "Batch: Summer 2026", "Team Size: 2", "Location: New York City, NY", co-founder Ryan Nowicki Stewart (Founder/CEO).
- So: he is CTO of a two-person YC company whose listed base is New York. "Same city" is uncertain; his attention is on a fresh YC company in an unrelated field.
- ACP facts: PR #54 "[SEP] Intent Traces: Structured cancellation context for checkout sessions" opened 2025-12-17 by `0xtotaylor`, merged 2026-01-11 by `prasad-stripe`. He also wrote PR #57 "[SEP] Affiliate Attribution: Deterministic attribution transport for checkout sessions", merged 2026-01-14, which the researcher did not mention and which bears on "who gets credit for an agent sale". No ACP activity from him since January 2026. A search of the ACP repository for "reconsideration" returns only PR #54: nobody has opened the follow-up.
- RFC text re-read today from `main`: "**Status:** Proposal", "**Version:** 2025-12-16", and both quoted sentences are present.
- Channels: X `@0xtotaylor`, GitHub `0xtotaylor` and LinkedIn `in/tomastaylor` are all linked from his own site. Confirmed.
- Reachability is lower than "medium". He holds no ACP seat. The honest use of him is one factual question (is anyone writing the follow-up), and ClawCon as a possible venue.

### 1.8 Sammy Isseyegh and Dave Spanton - Co-founders, Discount Kit - CONFIRMED

- https://discountkit.app/about/ : "Core team", "Together since 2020, plus a fully staffed C-suite.", "Sammy Isseyegh / Co-founder", "Dave Spanton / Co-founder", "The core team is always around for a chat. Book a call →", footer "© 2026 discount kit · Legal Optizio Ltd · registered in England and Wales · company no. 12912929".
- Second primary source: Shopify's own award post dated July 22, 2026 names "Dave Spanton & Sammy Isseyegh, Co-founders, Discount Kit". https://shopify.dev/changelog/blog/shopify-build-award-2026
- Statement: https://discountkit.app/resources/introducing-discountkit-live/ , dated "July 2, 2026", quote present. Nothing about shopping agents or UCP on their resources index or in https://discountkit.app/llms.txt ; the researcher's "no statement on agents" is right.
- Channels, checked by the order of links inside each card on the About page: Sammy = X `SammyIsseyegh`, LinkedIn `in/sammyisseyegh`, GitHub `bkspace`; Dave = X `megastoat`, LinkedIn `in/david-spanton-optizio`, GitHub `davespanton`. The "Book a call" link is a Google Calendar appointment page. GitHub `bkspace` profile also lists the site and X handle (consistent). `davespanton`'s GitHub profile shows company "Recur Ltd." (stale or a second company); the About page link ties the handle to him.
- A 2023 interview surfaced by search says "David has moved on"; today's About page and Shopify's July 2026 post both list Dave Spanton as co-founder, so no contradiction with the present.

### 1.9 Tobe Osakwe - Founder and CEO, Regios Technologies, Inc. - CONFIRMED (route corrected)

- https://regiostech.com/about : "Regios was founded by Tobe Osakwe, an ex-Google software engineer who left to build tools for independent merchants." and "Tobe Osakwe / Founder & CEO"; footer "© 2026 Regios Technologies, Inc." He is the byline on the company blog through "Jul 4, 2026".
- Statement: https://regiostech.com/ : "If you're wrestling with a discount Shopify can't handle, reach out . I read every message." Present. No statement on agents, MCP or UCP in the blog index; the researcher's "none found" is right.
- Route correction: the contact page is a support desk, not a personal inbox: "To get in touch for support inquiries, please email us at" [EMAIL REDACTED], "We're a small US-based team", "We'll respond within 24 hours, Monday - Friday, 9AM-5PM PST." A partnership question sent there goes to support staff first. The only personal channel he publishes is the LinkedIn link on the About page (`linkedin.com/in/tobebuilds`, not opened).
- Location: "California, United States" sits next to template placeholders ("123 Street St, Your City, YC"). Unverified; the contact page says US-based and Pacific time.
- The ask leans on "one of a store's 25 function slots"; I did not verify that number today. Check it before it goes into a message.

### 1.10 Jiaxin Pei - Assistant Professor, UT Austin - CONFIRMED (Stanford title is self-described)

- Organisation's own page, https://ischool.utexas.edu/profiles/jiaxin-pei : "Jiaxin Pei is an Assistant Professor at the University of Texas at Austin. He was a Postdoctoral Fellow at the Stanford Institute for Human-Centered Artificial Intelligence (HAI)." The same page publishes [EMAIL REDACTED], X `jiaxin_pei` and his site.
- His own page, https://jiaxin-pei.github.io/ : "Assistant Professor at UT-Austin, Research Fellow at Stanford HAI" and "I am also an affliated research fellow at Stanford Institute for Human-Centered Artificial Intelligence (HAI) and Stanford Digital Economy Lab." Present.
- Stale pages that contradict nothing but should not be quoted: Stanford HAI's people page still shows "DEL Postdoctoral Fellow" (https://hai.stanford.edu/people/jiaxin-pei); his GitHub bio still says "Stanford Postdoc, Incoming Assistant Professor at UT Austin." So the current Stanford affiliation rests on his own page.
- Statement: the "please reach out" sentence is there, and it is about his Fall 2026 course ("partnering with OpenAI, I will be teaching Building Large Language Model Applications"), not about negotiation research. The researcher flagged this; a note must not present it as an invitation to collaborate on negotiation.
- Still relevant: his page lists "Agent-to-Agent Negotiation" under direction 1 and lists Shenzhe Zhu (first author of the negotiation paper) as his PhD student.
- Channels: all four are linked from his own page. Confirmed.

### 1.11 Scot Wingo - Co-founder and CEO, ReFiBuy; writes Retailgentic - CONFIRMED

- https://www.refibuy.ai/about (redirects to refibuy.ai/about): "Scot Wingo / Co-founder / CEO"; footer "© 2026 ReFiBuy, Inc." https://www.retailgentic.com/about : "Welcome to Retailgentic, a substack and accompanying podcast written by Scot Wingo and provided by the ReFiBuy Media Network".
- Statement: https://www.retailgentic.com/p/part-1-of-2-state-of-agentic-commerce , byline "Scot Wingo", `datePublished` 2026-09-15, quote present.
- Better statement for an "ad as offer" note, 6 Oct 2026: "ChatGPT appears to be executing towards their goal of ads that simultaneously don't erode trust, add to the overall experience and give the advertiser high ROI for the impact." https://www.retailgentic.com/p/retailgentic-exclusive-chatgpt-agentic (section "Actionable Strategy Five: Don't Sleep on ChatGPT Ads").
- He also published a two-part Shopify agentic commerce deep dive (12 and 25 Aug 2026), so he follows the Shopify surface closely.
- Channels the researcher missed: his card on the ReFiBuy About page links LinkedIn `in/thescotwingo`; the site also links X `@retailgentic` (the publication's account). Substack and YouTube `@Retailgentic` confirmed.
- "The most-read running commentary" is an unsupported superlative; drop it from any message.

### 1.12 Francesco Marinoni Moretto - CORRECTED: not simply independent

- GitHub API `users/frmoretto`: bio as quoted, location "Milan, Italy", 47 followers, updated 2026-10-04. Confirmed.
- Sessionize speaker profile, written by him, https://sessionize.com/francesco-marinoni-moretto/ : "Lead AI Architect working on agent-native commerce. Creator of LAR, Stream Coding & Clarity Gate; author of Selling to Agents." and "Based in Milan, he is AI Practice and Community Leader at N1AI, a 400+ member professional group." The employer behind "Lead AI Architect" is not named. "Independent, no employer" is therefore not established.
- Book: https://sellingtoagents.com/ says "Out October 2026", "Affero Press · Milan", "Independent publisher, Milan", contact [EMAIL REDACTED]. Sessionize calls the book "forthcoming". "Author of Selling to Agents (2026)" is true of a book that is about to be released.
- Talk: Linux Foundation schedule, Friday 23 Oct 2026, "4:05 PM – 4:30 PM", "210C (Concourse Level)", "Reading is Free, Spending is Not: What a Minimal Agent Learns Probing Live Ecommerce Endpoints", abstract opens "Most discussion of agentic commerce takes the platform's side. This talk takes the merchant's." Confirmed. That he will be there in person is an inference from the listing.
- ucp-probe: the abstract says he "pointed it at Allbirds' live commerce endpoints (UCP/ACP) in May 2026"; the repository description says "Reads-only, never completes a purchase." Updated 2026-09-22, 1 star.
- Newer and better route: he started UCP discussion #867 "Four measurements of the UCP surface, no shared denominator: a proposal for a common reporting frame" on 26 Sep 2026 (11 comments, updated 11 Oct 2026). He also keeps `shopify-dev-mcp-changelog`, a dated record of every published version of Shopify's Dev MCP server.
- Additional channel: LinkedIn `in/francesco-moretto`, linked from his Sessionize profile.
- The ask needs a rethink: ucp-probe reads the store's UCP profile and MCP tools. An offer endpoint behind an app proxy is not in that profile, so the probe will not see it by design. Ask him instead what an unaffiliated agent would need to find in the profile or on the page to discover such an endpoint.

---

## 2. People the researcher missed (in or next to this scope)

| Person | Why they matter | Evidence fetched today |
|---|---|---|
| Greg Smith, Google, UCP Shopping Tech Council (co-leads the weekly meeting) | Assignee of the Offer extension #738; put it on the December milestone; presented it to the council. He, not Arjun Garg, decides whether it lands. | `MAINTAINERS.md` in `Universal-Commerce-Protocol/.github` (last changed 2026-10-12) lists "Greg Smith / Google" under Shopping Tech Council. Issue events: milestoned 2026-09-25 and assigned 2026-10-02 by `gsmith85`. Minutes 2026-10-02: "Greg Smith: Evaluate the structured offer and cart modification community contribution for potential integration. (Due: 2026-10-09)". GitHub `gsmith85`, Seattle. He is on the UCP panel at AGNTCon on 22 Oct. |
| Sparsh, Google London (`isparsh510`) | Author of #929 Quote extension, which carries an optional buyer `proposal` ("I'll pay $150 for these three") on existing cart and checkout calls. The researcher left him in the secondary table; his proposal is the buyer-initiated half of OfferAd's flow. | GitHub bio "Software Engineer III @Google London", author_association CONTRIBUTOR, issue opened 2026-10-11. |
| Scot DeDeo, Salesforce, Shopping Tech Council | PR #482 "add approaching discounts to discount extension" (free shipping or money off once a threshold is near). It is on the December milestone and is the nearest thing to a seller-initiated non-price offer inside the existing discount extension. | PR #482 by `sdedeo2025`, opened 2026-05-27, open; MAINTAINERS.md lists "Scot DeDeo / Salesforce". The GitHub handle to name mapping is my inference from the handle and the council list. |
| Provash Shoumma, Klarna, Germany (`proshoumma`) | #810 and #811: per-seller offers on catalog variants. | GitHub profile: company "@klarna", location Germany, site provash.dev; issues opened 2026-09-07. |
| Sebastian Hölscher (`HoelShare`) and Lukas Rump (`lukasrump`), Shopware | They build the quote plugin and the RFQ benchmark that Juan Fernández cites. | Contributor lists and commits of `agentic-commerce-lab/merchant-quote-agent-plugin` (MIT, last push 2026-10-12) and `rfq-bench`. Lukas Rump's bio: "Software Engineer @shopware". Hölscher's employer is not on his profile: unverified. |
| Stefan Hamann, Shopware AG (`sthamann`) | Contributor to Shopware's UCP plugin; GitHub bio "Building Shopware and Hylaean"; X `stefan_hamann`; site agentic-commerce.sh. | GitHub profile, updated 2026-09-08. His current title at Shopware was not checked on a Shopware page: unverified. |
| Ilya Grigorik, Shopify (other task's scope, noted for one fact) | His merged `ask` capability (PR #538, "natural-language Q&A", on the December milestone) is a free-text channel from agent to business inside UCP. The research brief says no free-text field reaches app code; whether apps can answer `ask` is the question to put to him. He also voiced the doubt about state-bound offers on 2 Oct. | PR #538 by `igrigorik`, merged; minutes 2026-09-25 and 2026-10-02. |
| Venues (not people) | UCP Summit, 11 to 12 Nov 2026, by invitation ("32 participants have confirmed attendance"); public weekly minutes at github.com/Universal-Commerce-Protocol/meeting-minutes. ClawCon, the "personal AI community event and hackathon series" co-founded by Tomas Taylor. | Minutes 2026-09-25 and 2026-10-09; Pennant team page. |
| Other make-an-offer apps on Shopify (Fluxley, Bargain Buddy: AI Negotiation, CounterOffer by Base2brand) | Possible competitors not person-verified by either of us. | Search summary only (secondary). The Shopify Community thread for Fluxley did not render without JavaScript. Unverified. |

---

## 3. What I could not check

- X and LinkedIn pages were not opened for anyone. Handles are taken from the person's own page or GitHub profile field.
- Arjun Garg's title and Intuit's involvement; Juan Fernández's role on any Shopware page; Weston's surname; Yang W.'s surname and whether the company has other people.
- The outcome of the "Monday deep dive" on the Offer extension (6 Oct 2026): no minutes are published for deep dives, and the 9 Oct minutes do not mention offers.
- Whether Moretto attends AGNTCon in person.
- The "25 function slots" figure in the Regios ask.
- Housekeeping: my first copy command included a step to remove empty error-log files from the raw-copy folder; a safety check blocked that whole command before it ran. I did not retry the removal and instead copied only the non-error files. Nothing was deleted anywhere.
