# V-G4: adversarial verification of G4 (Google, WebMCP, UCP governance)

Checked on 13 Oct 2026. Nobody was contacted. Nothing was posted, starred, followed or signed up for. Only read-only fetches: the public GitHub API (`gh api`, GET only), `curl` of public pages, the fetch tool for pages that return 403 to curl (w3.org), and web search.

Input checked: `/Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/people/G4-google-webmcp-ucp.md`

Labels: **[P]** primary source I fetched today. **[S]** press or a search snippet. **[I]** my inference.

---

## 0. Result in short

- 17 people checked. 16 roles hold up against the cited source. 1 (Ginny Marvin) could not be confirmed as current: newest primary source is 28 Jan 2026, newest press is 11 Jun 2026.
- No wrong person, no namesake confusion, no departed person in the list. Every quoted sentence I looked for is on the cited page, word for word.
- Real errors found (all in the "activity" claims, not in the roles):
  1. **Khushal Sagar**: G4 says no public statement in the last six months, latest 14 Jan 2026. Wrong. He commented in the WebMCP repository on 12 Jun, 26 Jun and 6 Jul 2026.
  2. **Brandon Walderman**: G4 says his latest repository comment is from 2 Mar 2026. Wrong. He has 23 issue comments since 1 Apr 2026, the latest on 6 Aug 2026.
  3. **Amit Handa, suggested ask**: the ask "is the draft shopping roadmap available" is already answered in the minutes of 25 Sep 2026: the council decided to publish the roadmap as GitHub milestone links. #738 is on milestone `2026-12-08`; #929 is on no milestone.
  4. **Kulikowski quote**: the 31 Aug 2026 post is co-authored ("Coauthored with Idan Levin · Nekuda", "Coauthored with André Bandarra · Google"). The sentence is real but it is not his alone.
  5. **Vidhya Srinivasan**: G4 missed her own bylined letter of 11 Feb 2026, which has a better Direct Offers sentence than the 11 Jan one. Still older than six months.
  6. **Sam Dallstream, "controls"**: "how Copilot in Edge uses page tools" is not supported. The only Microsoft statement on that is Walderman, 31 Jul 2026: "We don't have any links to share about in-browser Copilot integration at this time."
  7. **UCP Summit date**: G4 lists it as not confirmed. The minutes of 25 Sep 2026 give it: "the Universal Commerce Protocol (UCP) Summit on November 11–12, 2026". The minutes of 18 Sep 2026 say "The initial invitation covers Shopping Tech Council maintainers and public contributors". City still not stated.
- Role-staleness trap avoided by G4 but worth recording: **Lilian Rincon**, the former Google VP of Consumer Shopping Product, is reported [S, search snippet of Reuters/MediaPost/Yahoo Finance, March 2026] to have left for Apple as VP of AI product marketing. Do not address her as Google. Her successor on the buyer-agent side of Google Shopping was not identified. That is the largest gap in this scope: nobody on the list controls whether Google's own shopping agents call a seller's offer endpoint.

---

## 1. UCP and Google people

### 1.1 Greg Smith: CONFIRMED
- [P] `MAINTAINERS.md`, Shopping Tech Council table: `| Greg Smith      | Google     |`. https://github.com/Universal-Commerce-Protocol/.github/blob/main/MAINTAINERS.md . File last commit 2026-10-12T18:17:18Z ("docs(maintainers): replace Harsh Mehta with Simon Farrow on Payments Tech Council (#80)").
- [P] History checked in the pull request diffs: PR #51 (merged 2026-07-31) removes `| Greg Smith      | Amazon     |` and adds `| Jordan Williams | Amazon     |`; PR #52 (merged 2026-08-01) says "Adds **Greg Smith, Google** to the Shopping Tech Council table". ucp.dev announcements, 24 Apr 2026, still reads "Greg Smith (Amazon)". Historical.
- [P] Same person, not a namesake: commits by GitHub user `gsmith85` in `Universal-Commerce-Protocol/ucp` carry the author name "Greg Smith" and an `@google.com` address from 5 Oct 2026 (a personal address before that, last on 1 May 2026). `gsmith85` has been active in the repository since 5 Mar 2026.
- [P] Assignee of #738: confirmed (`assignees: ["gsmith85"]`). Timeline: he set milestone `2026-12-08` on 2026-09-25 and assigned himself on 2026-10-02T23:28:51Z, after the council meeting.
- [P] "co-leads its weekly meeting": minutes headers read "Led by: Greg Smith" (4 Sep), "Led by: Amit Handa, Greg Smith" (18 Sep), "Led by: Greg Smith, Amit Handa" (25 Sep, 2 Oct), "Led by: Amit Handa" (9 Oct; Smith not in the attendance list).
- [P] Bulk Product Discovery DWG: "Chairs / Co-Chairs: James Andersen (Meta), Vinod Kumar (Meta), Greg Smith (Google), Alex Jansen (Google)".
- Statement [P]: comment 5943857455 on PR #773, 2026-10-02T01:26:03Z, user `gsmith85`: "@arjun2075 apologies for the delay.  Will discuss at Technical Council tomorrow, stay tuned." Exact.
- Newer facts: the action item "Greg Smith: Evaluate the structured offer and cart modification community contribution for potential integration. (Due: 2026-10-09)" has no recorded outcome. Minutes of 9 Oct: "Amit Handa noted that Greg Smith circulated an availability poll for bonus technical council deep dive sessions scheduled for Wednesday and Thursday." [I] so the offer deep dive is likely 14 or 15 Oct 2026.
- Channel: GitHub `gsmith85` is his. Profile: name "Greg Smith", location "Seattle, WA", no company, no public email, no X. Very active: review and push events on 13 Oct 2026.
- Not confirmed: job title. No LinkedIn or X found.
- Milestone `2026-12-08` today [P]: 6 open items: #735, #738, #668, #634, #584, #482 ("feat: add approaching discounts to discount extension."). #929 is not on it.

### 1.2 Amit Handa: CONFIRMED (seat), title dated
- [P] Governance Council table: `| Amit Handa    | Google        |`. Shopping, Food and Lodging tables: `Amit Handa\*` with the footnote "Standing Governing Council (GC) member participating per GOVERNANCE.md rules." So on the Shopping council he is a standing participant, not one of its members, and "chair" is G4's word; the minutes say "Led by".
- [P] His commits to the `.github` repository carry an `@google.com` address (2 Sep 2026). Active on 13 Oct 2026 (pull request reviews).
- [P] Title: "Amit Handa Director of Engineering Google Commerce", developers.googleblog.com/under-the-hood-universal-commerce-protocol-ucp/ , "JAN. 11, 2026". Nothing newer found. Treat the title as of January 2026.
- [P] Slides: extracted the PDF text myself. "AMIT HANDA @ GOOGLE               FALL 2026", "Agentic commerce future is still being written", "Grab a pencil and contribute to UCP - ucp.dev", "Contribute your feedback, extensions, and code to the public repository." All present. Talk listed at 09:30 on Tuesday 8 September in the workshop agenda as "Amit Handa, Google".
- "Google's proxy vote": [P] GOVERNANCE.md line 134: "Google holds proxy vote for all open seats until Dec 2028". The text gives it to Google, not to Handa by name. [I] he casts it.
- Ask is stale. [P] minutes 25 Sep 2026: "Decision: The participants agreed to publish the draft roadmap externally using GitHub milestone links accompanied by disclaimers." with links to milestone 4 (`2026-12-08`) and milestone 5 (`2027-03-30`). Replace the ask (see the structured result).
- Channel: GitHub `amithanda` is his. His profile shows a public email; G4 says it is a personal Gmail and left it out. I did not read the value. Agree: do not use.

### 1.3 Sparsh (@isparsh510): CONFIRMED
- [P] GitHub profile: name "Sparsh", company "@google", location "UK", bio "Software Engineer III @Google London | 5* @codeChef | Expert @CodeForces | 3 Kyu @Atcoder| ICPC 2020 Regionalist| DTU’22", updated 2026-10-13.
- [P] Independent check: the commit in PR #930 has author name "Sparsh Sparsh" and an `@google.com` address. [I] the surname may itself be "Sparsh"; do not invent another.
- [P] #929: title "[Proposal]: Quote extension — Business-authoritative quotation binding on Cart and Checkout", author `isparsh510`, created 2026-10-11T01:31:21Z, label `area:common` (set by `damaz91` on 12 Oct), no assignee, no milestone, 2 comments. #930 is a draft PR.
- [P] Quotes exact: "Commerce today is unidirectional in UCP: the Business lists a price, the Buyer pays it or applies a code." and "This proposal is that binding, plus the smallest in-protocol opening that lets a consumer agent make an offer without leaving UCP." Non-goal exact: "Negotiating anything other than price for the current line items (fulfillment, delivery dates, payment timing, warranty)."
- [P] He asked reviewers: "@damaz91 @jingyli  @niranjanmanjunath  could you pls take a look when you get a chance". Jing Li is a Shopping Tech Council member; Niranjan Manjunath sits on the Food and Lodging councils.
- [P] The issue's own checklist: "Open questions below resolved with implementer evidence." That is the opening for an implementer note.

### 1.4 Arjun Garg (@arjun2075): CONFIRMED (employer self-declared only)
- [P] Author of #738 (created 2026-08-15), PR #773 (2026-08-26), #845 (2026-09-19). GitHub profile: name "Arjun Garg", company "Intuit", location "US". The employer is his own profile field and nothing else; do not state it as fact in a message.
- [P] Statement exact, comment of 2026-10-09T18:38:46Z on #738: "The buyer’s initial proposal, negotiation discovery, pending review, rejection, and successive counteroffers would still need a negotiation contract around that."
- [P] Same comment ends: "A concrete buyer proposal → seller counteroffer → Cart application → Checkout example would be useful for identifying which parts #738 can cover and which belong in the negotiation/handoff work." So the proposed ask answers a request he made in public.
- [P] Not a council member; `author_association` is NONE. #845 has one comment, his own question to @gsmith85 on 29 Sep, unanswered.
- Active on 13 Oct 2026.

### 1.5 Federico D'Amato (@damaz91): CONFIRMED
- [P] GitHub: name "Federico D'Amato", company "Google", location "Zürich", bio "Agentic Commerce @google - Working on the Universal Commerce Protocol (UCP)", updated 2026-09-24.
- [P] Commits in `.github`: 2026-10-01 "feat(label-sync): add area:common label (#75)", 2026-09-15 "feat(governance): update governance rules to use domain tech councils (#69)", 2026-09-09 "feat(label-sync): add area:lodging, area:food, and area:shopping labels with descriptions (#68)".
- [P] He is doing the routing in practice: on 2026-10-12 he relabelled #929 from `area:payments` to `area:common`; on 12 and 13 Oct he pointed maintainers at pull requests ("@gsmith85 PTAL at this").
- No statement on offers. Not on a council. Agree with G4.

### 1.6 Ilya Grigorik: CONFIRMED
- [P] Governance Council: `| Ilya Grigorik | Shopify       |`. Shopping council: plain row. Payments council: `Ilya Grigorik\*` (standing GC participant, so "Payments Tech Council member" in G4 is slightly loose).
- [P] GitHub: company "Shopify", location "Portland, OR", bio "Building merchant+web platform capabilities to supercharge commerce at @Shopify.", blog https://ilya.grigorik.com , X `igrigorik`, 9,083 followers. Active on 13 Oct 2026.
- [P] Minutes 2 Oct 2026, exact: "Ilya Grigorik questioned whether cart state binding is necessary and probed whether platforms and agent builders would trust or utilize merchant-recommended products." It is a note-taker's paraphrase; G4 labels it so. The next sentence lists him among those who "confirmed strong industry demand for personalization, reordering, and upselling".
- [P] Shopware claim in the ask holds: #929 says "They ship `com.shopware.quote` today (live on `sw-ag.dev/.well-known/ucp`)".
- His Shopify title was not checked here (belongs to the Shopify notes).

### 1.7 Ashish Gupta: CONFIRMED
- [P] blog.google, "Boost your holiday sales with these agentic commerce updates", datePublished 2026-09-16: byline "Ashish Gupta VP/GM, Merchant Shopping". Quote exact: "UCP already enables direct checkout for hundreds of thousands of brands and retailers across Google. Now, merchants who use the hub for UCP-powered checkout can also enable capabilities like cart transfer to a merchant site and enhanced checkout flow testing, with analytics and more coming soon."
- [P] 11 Jan 2026 byline: "Ashish Gupta VP/GM, Merchant Shopping, and Engineering Fellow Google".
- No personal channel. blog.google/authors/ashish-gupta/ returns 404. Nothing newer than 16 Sep 2026 found; no sign of a change.

### 1.8 Vidhya Srinivasan: CONFIRMED
- [P] Author page live today: "Vidhya Srinivasan Vice President/General Manager, Ads & Commerce Vidhya is Vice President and General Manager of Ads and Commerce. She oversees the advertising, shopping and payments products that help people discover and connect with businesses and shop online." https://blog.google/authors/vidhya-srinivasan/ (undated).
- [P] Newest dated byline of her own: 11 Feb 2026, "What to expect in digital advertising and commerce in 2026", "Vidhya Srinivasan Vice President/General Manager, Ads & Commerce". https://blog.google/products/ads-commerce/digital-advertising-commerce-2026/ . G4 missed this post.
- [P] Better statement from that letter: "Direct Offers allow businesses to share a tailored offer with a shopper who is ready to buy to help close the sale, without changing what they offer everyone else. We will expand these to include special offers that go beyond price to value, like loyalty benefits and product bundles." Eight months old.
- [P] 11 Jan 2026 quote exact as G4 gives it.
- [P] The 20 May 2026 post is bylined "News from Google Team" in its metadata, as G4 says. Her author page lists that article, so it is associated with her, but no sentence in it can be attributed to her.
- [S] search snippets only: no report of a role change through May 2026. Nothing dated Sep or Oct 2026 found either way.

### 1.9 Ginny Marvin: UNVERIFIED as current
- [P] 28 Jan 2026: "Hosted by Ads Product Liaison, Ginny Marvin, who has spent her career in paid search and digital advertising". Exact. https://blog.google/products/ads-commerce/launching-ads-decoded-podcast/
- [S] techwyse.com, 11 Jun 2026 (read through the fetch tool): "Google Ads Liaison Ginny Marvin confirmed during" a "post-Google Marketing Live 2026 Q&A with the PPC Chat community" on 26 May 2026. The article does not mention Direct Offers.
- Nothing dated after June 2026. A podcast tracker [S, snippet] shows the last Ads Decoded episode on 2026-05-06. No evidence she left; no evidence she is still in the role in October.
- Channel [S]: Search Engine Journal author bio (undated; newest article 18 Mar 2025): "You can find her on Twitter at @AdsLiaison." and linkedin.com/in/ginnymarvin. Press-sourced, not opened by me on X or LinkedIn. G4 lists no channel.
- No statement from her on Direct Offers found. The phrase "like a salesperson negotiating a deal" reaches me only through a third-party blog snippet; do not quote it.
- Weak target. Keep only as a fallback route for a Google Ads product question.

### 1.10 Direct Offers
- [S] Search Engine Land article "Google Ads tests new Direct Offer asset for AI Mode promotions" returns 403 to both curl and the fetch tool. A search summary of it says advertisers "optionally upload single-use promo codes through a CSV" and that the offer shows as a "Claim one-time code" option. Not read directly. Keep it labelled as press.
- No product lead named anywhere I could reach. Agree with G4.

---

## 2. WebMCP people

Spec checked [P]: https://webmachinelearning.github.io/webmcp/ , "Draft Community Group Report, 9 October 2026", "Editors: Brandon Walderman ( Microsoft ) Khushal Sagar ( Google ) Dominic Farolino ( Google )". Source file `index.bs` lines 9 to 11 match and carry the three editor email addresses that the spec itself publishes. Repository: 4,610 stars, pushed 2026-10-09.

ChromeStatus entry "WebMCP" [P] (https://chromestatus.com/api/v0/features?q=WebMCP, updated 2026-09-28) lists seven Chrome owners by address; the handles match Khushal Sagar, Dominic Farolino, François Beaufort, Mark Foltz and Mason Freed, plus two I did not resolve to names.

### 2.1 Dominic Farolino: CONFIRMED
- [P] Editor line above. GitHub: company "Google", location "Cambridge // Chromium", bio "Engineer @GoogleChrome. Ex-@microsoft @mozilla. Editor @whatwg. C++, web standards, and algorithms.", blog https://domfarolino.com , X `domfarolino`, public email `[EMAIL REDACTED]` (he publishes it on his profile).
- [P] Statement exact, 2026-04-08T16:05:49Z: "All script running on your page is treated the same and you have to own it from a security perspective." Six months and five days old. The same comment goes on: "The real opportunity here I think is letting the tool implementer choose which origins can execute the tool, and further letting the tool implementation itself know which origin/agent/frame is causing the current implementation." So he has already said where provenance might go; the ask should refer to it.
- [P] Better and newer line to cite, 2026-09-28T18:18:53Z, #261: "implement it outside the spec, gather experience, and then file focused issues if that work reveals specific WebMCP primitives that are actually missing."
- [P] Warning: #266 "Implementation report: agent commerce storefront on WebMCP" (opened 27 Aug 2026 by an outside author) was closed on 28 Sep 2026. A general implementer report gets closed; one narrow spec question does not.
- 176 issues with his comments; latest 12 Oct 2026.

### 2.2 Khushal Sagar: CONFIRMED (role); activity claim corrected
- [P] Editor line above. GitHub: company "Google", location "San Francisco, CA", no bio, no X, updated 2026-10-12. First owner on the ChromeStatus entry.
- G4 error: "none in the last six months, latest 14 Jan 2026". [P] He commented on #207 on 2026-06-12 and 2026-07-06 and on #212 on 2026-06-26 ("For \"Persistent tool execution\", it seems like those are 2 separate problems?"). None is about commerce or agent-to-agent.
- [P] #31 "Support agent to agent interaction": opened by him 2025-09-26, 0 comments, still open, last touched 2026-09-24. Quote exact: "We should definitely be thinking of how an interaction between the browser agent and a site agent would be coordinated." The example in the issue body is a shopping one ("product_finder_agent").
- Channel: GitHub `khushalsagar`; the spec publishes his Google address in the editor line.

### 2.3 Brandon Walderman: CONFIRMED (editor); activity claim corrected
- [P] Editor line above. GitHub: company "@microsoft", location "Seattle, WA".
- G4 error: "latest repository comment found is from 2 Mar 2026". [P] 23 issue comments since 1 Apr 2026; latest 2026-08-06 (PR #235), also 2026-07-31, 2026-07-09, 2026-06-11.
- [P] Useful line, 2026-07-31, PR #235: "Platform support is naturally at parity with Chromium. We don't have any links to share about in-browser Copilot integration at this time."
- [P] Dallstream, 2026-10-01: "@bwalderman is working on multiple projects, and I am now the main point of contact for WebMCP dev at Microsoft." So: still an editor, no longer the contact. No message to him.

### 2.4 Sam Dallstream: CONFIRMED (self-declared), thin evidence
- [P] Comment of 2026-10-01T00:31:29Z on #328, exact: "@domfarolino, for future communications, @bwalderman is working on multiple projects, and I am now the main point of contact for WebMCP dev at Microsoft." and "Judging from the code we have, there is a clear information issue where we do not know when tools are available, and we have to guess when a page will be ready."
- [P] GitHub `sjdallst2`: name "Sam Dallstream", company "Microsoft", bio "Engineer @MicrosoftEdge" followed by a Microsoft address he put there himself. 0 followers, one comment in the repository, profile updated 2026-10-01.
- [P] "An Origin Trial ... is live in Edge 150." is in `implementation-status.md`.
- Inflated in G4: "controls ... how Copilot in Edge uses page tools". No source. See the Walderman line of 31 Jul 2026.
- The role rests on one self-statement that nobody contradicted in the thread.

### 2.5 François Beaufort: CONFIRMED
- [P] developer.chrome.com/docs/ai/webmcp: "Alexandra Klepper GitHub Bluesky François Beaufort GitHub Kasper Kulikowski X GitHub LinkedIn Published: May 18, 2026, Last updated: October 7, 2026".
- [P] GitHub: company "@GoogleChrome", location "France", bio "Happiness Evangelist @GoogleChrome", 1,798 followers. "Developer relations" is G4's reading of that bio. Listed as an owner on the ChromeStatus entry.
- [P] Statement exact, 2026-10-13T09:00:49Z, #312: "FYI OpenAI just released their Browser Annotation API that lets websites customize what people select, what context accompanies their feedback, and which controls they use to preview changes before sending an annotation to ChatGPT." Not about commerce.
- [P] #101 opened by him on 2026-02-20, quote exact ("In environments like online stores where first-party code and third-party partner JavaScript run within the same environment, a security concern exists with how WebMCP tools are registered."). Closed 2026-03-06. This is the statement closest to OfferAd's case (an app script on a store page).

### 2.6 Kasper Kulikowski: CONFIRMED
- [P] https://www.kulikowski.me/about : "I work as a Senior Developer Relations Engineer at Google and I am based in Poland." Exact. Undated page; newest post 30 Sep 2026 ("When a WebMCP tool returns an MCP App").
- [P] Channels on his own site: https://x.com/kaskulikowski , https://www.linkedin.com/in/kasper-kulikowski , https://github.com/Kulikowski . GitHub profile agrees (X `kaskulikowski`, blog kulikowski.me, location "Kraków, Poland"). The Chrome author card links a different X handle (twitter.com/i_am_kaspa). Use the one on his site.
- [P] 31 Aug 2026 quote exact: "The user's agent still represents the user. The website harness represents the business. The goal is not to pull control back from the user - it is to create a clear contract between both sides". The post is "Coauthored with Idan Levin · Nekuda" and "Coauthored with André Bandarra · Google". Attribute it as co-written.
- [P] 13 Jul 2026 invitation exact: "I'd love to hear how these ideas work out for you, so if you try them, please reach out".
- [P] Active in the WebMCP repository: comments on 4 Sep, 17 Sep and 1 Oct 2026.

### 2.7 Alexandra Klepper: CONFIRMED
- [P] GitHub `alexandrascript`: name "Alexandra Klepper", company "@Google", bio "Sr. Technical Writer for Google Chrome and web.dev", blog https://alexandrascript.com . Chrome author card links GitHub and https://bsky.app/profile/alexandrascript.com .
- [P] "Join the WebMCP origin trial", "Published: June 9, 2026", sole author. Quote exact: "Share your feedback on the API shape by commenting on an existing issue or opening a new one in the WebMCP explainer on GitHub."
- Generic call to action, not a position. Documentation only. Low value as a first contact.

### 2.8 Anssi Kostiainen: CONFIRMED
- [P] W3C group page (through the fetch tool; curl gets 403): "Chairs" "Anssi Kostiainen".
- [P] Agenda 2026-10-01: "Chair: Anssi"; heading "WebMCP momentum and next steps". That is an agenda heading he wrote, not a statement of position.
- [P] GitHub: company "Intel Corporation", bio "PE, Web Standards TL @intel. AC, Chair @W3C Machine Learning, Devices, Second Screen.", blog https://linktr.ee/anssik , X `anssik`. The W3C/GS1 workshop site lists "Anssi Kostiainen, Intel" on its committee.
- [P] meetings issue #39 "WebML WG/CG F2F Agenda - TPAC 2026 (Dublin, Ireland)": open, by `anssiko`, updated 2026-10-12, venue "Clayton Hotel Burlington Road, Dublin, Ireland in-person & remote". [S] search snippet of the W3C minutes: Community Group day is Tuesday 27 Oct 2026, with WebMCP on that day.
- 53 issue comments in the WebMCP repository since April; latest 12 Oct 2026.

---

## 3. People G4 missed or under-weighted

1. **Jing Li** (Google; Shopping, Food and Lodging Tech Council member; GitHub `jingyli`, bio "Software Developer @ Google and uWaterloo SE alumni") [P]. The council member whom the Quote proposal's author asked to review #929. A council sponsor is what #929 lacks.
2. **Caroline George** (Google; "Google Technical Services (GTEC) team" per minutes of 2 Oct 2026) [P]. Runs the maintainers programme and the pull request backlog: "Caroline George reported on a kickoff session held on Monday to establish pull request (PR) review workflows and PR assignments" (25 Sep). Attends every recent council meeting and handles the Summit invitations. Not on a council. No public profile confirmed.
3. **André Cipriani Bandarra** (Google, London; GitHub `andreban`, site https://bandarra.me/, X `andreban`) [P]. Co-author of the 31 Aug post with Kulikowski and builder of the demos. Second door to the same conversation.
4. **Mason Freed** and **Mark Foltz** (Chrome) [P]: both listed as owners on the ChromeStatus WebMCP entry. Foltz's GitHub bio: "Senior Staff Software Engineer at Google, works on Chrome/Chromium." Foltz wrote the continuations explainer; relevant when an offer tool hands off to a cart link.
5. **Alex Jansen** (Google) [P]: co-chair of the Bulk Product Discovery working group and on the W3C/GS1 workshop committee.
6. **Anurag Sinha** (Google; Shopping Tech Council row) [P for the seat]; [S, snippet] "Senior Staff Software Engineer and Manager at Google".
7. **Buyer-agent side of Google (AI Mode, Gemini shopping, agentic checkout): no owner identified.** Lilian Rincon held it and is reported to have left for Apple in March 2026 [S]. This is piece (b) of the project's missing parts and G4 has nobody for it.
8. Outside this scope but they act inside these venues (check the other notes): **James Andersen** (Meta; Shopping council; said to have confirmed demand on 2 Oct), **Jordan Williams** (Amazon; same), **Gil Greenberg** (Shopify; GitHub `gil--`; with Grigorik assigns "P0, P1, and P2 priority levels to roadmap items"), **Yoav Weiss** (Shopify; workshop talk "Shopify: Universal Commerce Protocol / WebMCP"; opened webmcp #312), **Juan Fernández** (GitHub `juanferrub`, "Product Manager at Shopware's Agentic Commerce Lab"; ships `com.shopware.quote`; wrote "Strong +1 from Shopware" on discussion #502), **Chris Daly** (GitHub `c-e-daly`, "Founder, @i-want-that"; discussion #502 and comments on #738 on 9 Oct), **Weston** (GitHub `westonale`, Facet, San Francisco; reviewed #738 in August), **Julia Downey** (attends the Shopping council; affiliation not found).

---

## 4. Process facts corrected or added

- UCP Summit: 11 and 12 November 2026 [P, minutes 25 Sep]. "32 participants have confirmed attendance" [P, 9 Oct]. In person "strongly encouraged", "remote dial-in for select breakout sessions" [P, 25 Sep]. City not stated. Invitation list: "Shopping Tech Council maintainers and public contributors" [P, 18 Sep]. [I] a merged or seriously reviewed contribution is the only visible way onto that list.
- Roadmap: published as milestone links, not as a document [P, 25 Sep]. https://github.com/Universal-Commerce-Protocol/ucp/milestone/4 and /milestone/5.
- "items without an active implementer behind them are a signal to deprioritize" is in the minutes of 18 Sep 2026 [P], exact wording: "Ilya Grigorik and Amit Handa discussed weighting implementer interest and key drivers, suggesting that items without an active implementer behind them are a signal to deprioritize."
- "hit a wall" is in the minutes of 4 Sep 2026 [P], exact.
- Minutes of 9 Oct 2026: no offer item [P]. Confirmed.
- UCP mailing list: GOVERNANCE.md line 162 says public communication "shall take place on a shared Google group with a mailing list". No address found. Agree with G4.
- No agentic-commerce, UCP or WebMCP meetup in San Francisco in Oct or Nov 2026 found [S]. Agree with G4.

---

## 5. What I could not check

- LinkedIn and X pages were not opened (they block fetches). Handles are taken from the person's own GitHub profile or site, except Ginny Marvin's, which is press-sourced.
- Search Engine Land (403). The Direct Offer asset details stay press-level.
- w3.org pages: read only through the fetch tool's summary, apart from the slide PDF whose text I extracted locally.
- Email values on GitHub profiles: I read only Farolino's (he publishes a chromium.org address). For the others I checked only whether a public email exists.
- Review comments on pull requests were not scanned for the "latest activity" counts; only issue and PR conversation comments.
