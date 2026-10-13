# V-G3: adversarial verification of G3 (OpenAI, xAI, Perplexity, Microsoft, Decagon, Instinct)

Verification date: 13 Oct 2026. Checked file: `/Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/people/G3-openai-xai-others.md`.

Nobody was contacted. Nothing was posted, starred, followed or submitted, and no account was created. All fetches were read-only GETs of public pages. GitHub was read through the public REST and GraphQL APIs with the locally signed-in `gh` client. Single X posts were read through X's public embed endpoint (`cdn.syndication.twimg.com/tweet-result`). X profile bios and recent-post lists were read through the public mirror `api.fxtwitter.com`, because X's own profile embed returned HTTP 429 for every handle; anything that rests on the mirror is marked **[mirror]**.

Raw copies of what I fetched: `/Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/docs/vg3/` (98 files).

Labels: **[P]** primary (organisation's own page, the person's own profile or post, a maintainer file, meeting minutes). **[S]** secondary (press, interviewer's page). **[I]** my inference.

---

## 0. Summary of verdicts

| # | Person | Verdict | One-line reason |
|---|---|---|---|
| 1 | Alexander Embiricos (OpenAI) | confirmed | Press quote is on the page; his own X bio says only "Codex @OpenAI"; his own posts of 6 to 9 Oct 2026 speak for Dots. |
| 2 | Aravind Rao (OpenAI, ACP) | confirmed | Seat is in governance.md. The proposed route is weak: issue #191 has had no comment since 24 Mar 2026 and its content was merged on 17 Apr 2026. |
| 3 | Romain Huet (OpenAI) | confirmed | GitHub and X bios both say Head of Developer Experience. A recent quotable statement exists (6 Oct 2026) that the researcher could not fetch. |
| 4 | Tibo Sottiaux (OpenAI) | confirmed | Lenny page quote is there; his own X bio says "Codex & ChatGPT @OpenAI". |
| 5 | Holly Li (OpenAI) | drop | Only "product team member" in press; no title, no channel, no ownership of the missing piece. |
| 6 | Roman Ugarte (SpaceXAI) | confirmed | Lenny page quote is there; X bio read directly: "Building @Bot at @SpaceXAI". A developer-relations person (Matt Palmer) is the better route and was missed. |
| 7 | Dmitry Shevelenko (Perplexity) | confirmed | Lazard page live today, Fast Company 18 Jun 2026. No channel, no statement. |
| 8 | Nayna Sheth (Microsoft) | unverified | Title confirmed on three pages, all dated 8 Jan 2026. Nothing newer found; no channel. |
| 9 | Patrick Jordan (Microsoft, UCP) | confirmed | In MAINTAINERS.md and present at the 9 Oct 2026 council meeting. GitHub handle found (`pjordan`). He is not the person handling the offer proposal. |
| 10 | Harry Gao (Decagon) | confirmed | Byline, own site and X bio all agree. |
| 11 | Gram Liu (Decagon) | corrected | Role right, but "no commits visible" understates him: he wrote 13 merged pull requests in the PACT repo and closed an outside pull request on 7 Oct 2026. |
| 12 | Jesse Zhang (Decagon) | confirmed | Byline and X bio agree. |
| 13 | Noah Shinn (Instinct) | corrected | Role is confirmed by a PRIMARY source the researcher missed (his own X post). X handle missed. A directly relevant statement was missed: "Instinct + Shopify", 28 Sep 2026. |

Largest corrections, in order of weight for the project:

1. **Noah Shinn has an X account, and Instinct shops on Shopify already.** His own post of 28 Sep 2026 announces a Shopify partnership with Shop Pay checkout and "automatic discounts and promo codes tied to your Shop account". The researcher wrote "No statement of his on offers or negotiation was found" and listed no X handle.
2. **ACP is a quiet venue.** No steering-committee member has commented on any ACP issue or pull request since August 2026 (Aravind Rao's last comment: 9 Jul 2026). A sponsor request posted as a Discussion on 9 Sep 2026 has zero replies. Issue #191, the recommended place to comment, has zero comments in almost seven months, and its proposal already shipped.
3. **Patrick Jordan is not where UCP offers are being decided.** Council minutes of 2 Oct 2026 show Greg Smith (Google) presenting the state-bound Offer extension; Patrick Jordan was absent that day and has not commented on #738 or #929.
4. **Grok Bot has a named developer-relations person, Matt Palmer**, who was not in the list.
5. **Gram Liu is an active PACT maintainer**, not just a co-byline.

---

## 1. Alexander Embiricos (OpenAI). Verdict: confirmed

- Cited source checked **[S]**: https://sources.news/p/openai-dots-lead-future-chatgpt , dated "Oct 01, 2026", by Alex Heath. The sentence is on the page: "Alexander Embiricos , OpenAI's Dots product lead, tells me why the company is moving beyond chatbots and what that means for the future of ChatGPT." Page title: "OpenAI's Dots lead on the future of ChatGPT".
- TechCrunch Disrupt agenda checked **[S]**: https://techcrunch.com/events/tc-disrupt-2026/agenda/ . Text on the page: "11:15AM – 11:40AM Industry Stage – AI Artificial Intelligence What Comes After the Chatbot Just days after OpenAI launched Dots, Head of Enterprise Product, Alexander Embiricos comes to Disrupt to explain the company's vision for AI that doesn't just answer questions, but acts on our behalf." The session sits under the "October 15" day block. Event header: "TechCrunch Disrupt 2026 October 13 – 15, 2026 — San Francisco"; registration text names Moscone West.
- Scuttlebutt checked **[S]**: "With Alexander Embiricos , product lead for Codex at OpenAI" and "Embiricos, who has led product on Codex at OpenAI since joining a little over two years ago" (30 Sep 2026).
- Crypto Briefing checked **[S]**: "Embiricos leads the Dots product and brings some relevant history to the role."
- New primary evidence the researcher did not have **[P][mirror]**: his own X bio reads "Codex @OpenAI" (location "San Francisco, CA"). It does not mention Dots.
- New primary evidence that he speaks for Dots **[P][mirror]**, his own posts:
  - 6 Oct 2026: "Every few days during dots development I would reset my dot to go through onboarding again." https://x.com/embirico/status/2107306622897013020
  - 6 Oct 2026: "Here's the plan for one of our top areas of feedback on dots: voice!" https://x.com/embirico/status/2107305601248424362
  - 7 Oct 2026: "we're working on improving dots and bringing the capabilities to all." https://x.com/embirico/status/2107961743054086307
  - 9 Oct 2026: "We started with dots on desktop for power users, and now we're opening up to mobile:" https://x.com/embirico/status/2108669028441219559
  - 9 Oct 2026 (Codex, same day): "The Codex sandbox on Windows is one of our top areas of user feedback." https://x.com/embirico/status/2108607017833341421
- Recent statement checked **[P]** through X's embed endpoint: posted 2026-10-06T21:48:03Z by `embirico` ("Alexander Embiricos"), text exactly as quoted by the researcher, quoting a @ChatGPT post about the Meetings plugin. https://x.com/embirico/status/2107588722539823342
- Channels: GitHub `embirico` has name "Alexander Embiricos", company "@openai", twitter_username "embirico" (profile last updated 2025-11-24). X `@embirico` display name matches. Both belong to him.
- Nothing newer contradicts the role; no departure report found.
- Issues:
  1. No OpenAI-owned page gives him a Dots title. Three press labels disagree ("Dots product lead", "Head of Enterprise Product", "product lead for Codex") and his own bio says Codex. Address him as working on Dots and Codex at OpenAI, not by a title.
  2. "What he controls" (which plugin tools a dot calls before a purchase) is inference. Nothing he has said in the last 20 posts or in the cited interviews is about purchases, shopping or stores.
  3. The Disrupt session is a 25-minute stage interview. Whether there is audience Q&A is not stated on the agenda.

## 2. Aravind Rao (OpenAI, ACP). Verdict: confirmed, with a route correction

- Cited source checked **[P]**: `docs/governance.md` on `main`. Lines 94 to 100: "### Current TSC Members | Seat | Organization | Representative(s) | ... | 1 | OpenAI | aravindrao-openai | | 2 | Stripe | prasad-stripe | | 3 | Meta | lhwa |". File last changed 2026-04-24 ("ADMIN: Add Meta as TSC member (#236)", by `lhwa`). Line 168: "**Sponsorship:** Every SEP must be sponsored by a TSC member to proceed."
- Name link checked **[P]**: issue #191 "[SEP] Promotions API", opened 2026-03-24 by `aravindrao-openai`, body "**Author(s)**: Aravind Rao, Rahul Bansal".
- Statement checked **[P]**: "The API is intended for pre-checkout catalog synchronization rather than transaction-time discount application." is in the abstract of #191. It is dated 24 Mar 2026, which is more than six months ago.
- 9 Jul 2026 comment checked **[P]**: text exactly as quoted, by `aravindrao-openai`, created 2026-07-09T16:26:36Z, on pull request #281.
- "Reconsideration Offers" checked **[P]**: `rfcs/rfc.intent_traces.md` line 29: "- **Future extensibility:** A subsequent RFC MAY define **Reconsideration Offers** keyed to specific reason codes." The file's only commit is 2026-01-11 by `0xtotaylor` (Tomas Taylor, per his GitHub name and https://totaylor.com), merged by `prasad-stripe`. Rao did not write that sentence.
- Corrections to the route:
  1. **Issue #191 is a dead letter.** It has 0 comments and its `updated_at` equals its `created_at` (2026-03-24T14:46:32Z). The proposal itself shipped: pull request #192 "SEP: Add promotions API to ACP Product Feeds", by `rb-oai`, merged 2026-04-17T02:04:04Z by `prasad-stripe`. `rfcs/rfc.product_feeds.md` exists on `main`. Commenting on #191 is unlikely to be seen.
  2. **Sponsor requests are not being answered.** Discussion #304 "SEP #303: a dispute_resolution extension for agent-initiated transactions — seeking a sponsor" (9 Sep 2026, category Ideas) has 0 comments. The researcher cites it as the pattern to follow; it shows the pattern has not worked for five weeks.
  3. **Steering members are silent in the repo.** Latest item each member commented on, by GitHub search: `aravindrao-openai` #243 (item updated 2026-08-15), `prasad-stripe` #10 (2026-08-06), `lhwa` #241 (2026-08-15). In the 40 most recent issue comments in the repo only one is by a steering member (Rao, 9 Jul 2026). Last commit on `main`: 2026-07-18 (#281, merged by `lhwa`). Repo: 144 open issues, pushed_at 2026-07-18.
  4. Rao's last authored item is 2026-04-17 (release and CLA admin pull requests).
- Channels: GitHub `aravindrao-openai` only. The profile has no name, company or bio; created 2024-07-09; updated 2026-09-14. No X or LinkedIn confirmed. His job title at OpenAI remains unverified. A web search for "Aravind Rao" with OpenAI and the protocol name returned nothing naming him.
- Reachability: low to medium, not medium. He holds the right seat, but the venue has been quiet for three months.
- Related: the Discussion "ACP pattern for custom quoting before checkout creation?" (#209, 1 Apr 2026, 3 comments, none from a steering member) is the nearest existing thread to an offer step.

## 3. Romain Huet (OpenAI). Verdict: confirmed

- Cited source checked **[P]**: GitHub API for `romainhuet`: bio "Head of Developer Experience @OpenAI. Previously, @Stripe @Twitter.", company "@OpenAI", blog "https://twitter.com/romainhuet", location "San Francisco, CA", updated 2026-10-03.
- Second primary source **[P][mirror]**: X bio "Head of Developer Experience @OpenAI, working on Codex and our API. Previously @Stripe. You can just build things!" (location "SF & NYC").
- Recent statement found (the researcher had none) **[P]**, read through X's embed endpoint, posted 2026-10-06T03:10:07Z: "ChatGPT plugins are a great way to get your product into more people's hands. So good to see @skirano and the @magicpathai team growing this fast!" https://x.com/romainhuet/status/2107307387262832883
- Also **[P][mirror]**, 23 Sep 2026: "Go through your email, calendar, finances, triage what matters, and take action through plugins, including ones built by developers." https://x.com/romainhuet/status/2102857660542706148
- Channels: both belong to him (GitHub profile links the X account; names match).
- Issues: his bio scopes him to "Codex and our API". Routing a plugin-directory policy question is plausible for a developer-experience lead but is inference; he does not own review decisions (the researcher says so).

## 4. Tibo (Thibault) Sottiaux (OpenAI). Verdict: confirmed

- Cited source checked **[S]**: https://www.lennysnewsletter.com/p/openais-head-of-chatgpt-were-entering , "Oct 04, 2026". Sentence on the page: "Tibo Sottiaux leads ChatGPT and Codex at OpenAI. Under his stewardship, OpenAI has shipped some of its most consequential consumer launches: Codex, ChatGPT Work, and most recently, the new Dots personal agent platform." The page's "Where to find Tibo Sottiaux" block lists "X: https://x.com/thsottiaux" and "LinkedIn: https://www.linkedin.com/in/thibault-sottiaux-27195366".
- Fortune checked **[S]**, 29 Sep 2026: "said Thibault Sottiaux, head of core products and platform, on X."
- Primary evidence added **[P][mirror]**: X bio of `@thsottiaux` (display name "Tibo"): "Codex & ChatGPT @OpenAI". Account joined August 2025. Posting daily; latest 13 Oct 2026.
- Statement checked **[S]**: I fetched the Teahose page myself. Text there: "We look at retention numbers. We look at, you know, how successful the plugin, the quality, and then, you know, that's what we then start to recommend to users in conversations... Obviously, if your plugin is not quite good, it will stop being recommended." — Tibo Sottiaux 00:13:53. It is a machine transcript, as the researcher says.
- Channels: X confirmed by the interviewer's page and by content. GitHub `tibo-openai` has name "Thibault Sottiaux", no company field. LinkedIn URL is from the interviewer's page; not fetched.
- Issues: none on role. Reachability low is right. His recent posts are about usage limits and Codex; nothing about commerce.

## 5. Holly Li (OpenAI). Verdict: drop

- Cited source checked **[S]**: https://futurism.com/artificial-intelligence/openai-agent-fails-live-demo . Sentence on the page: "Dots didn't seem quite switched on, though, when OpenAI product team member Holly Li tried to show off its capabilities."
- Searches for a title, a profile or any statement returned nothing that names her. openai.com (DevDay recap) and axios.com returned 403 to me as well.
- No public channel. No evidence that she decides anything about plugins, commerce or connectors. The researcher already concluded "do not write to her"; drop her from the list.

## 6. Roman Ugarte (SpaceXAI, Grok Bot). Verdict: confirmed

- Cited source checked **[S]**: https://www.lennysnewsletter.com/p/how-we-built-grok-bot-in-a-month , "Sep 08, 2026". Sentence on the page: "Roman Ugarte helped incubate and build Grok Bot, the popular new knowledge-work agent from SpaceXAI." Also: "Before Grok Bot, Roman led Growth at Cursor, where he helped scale the company from 15 people to over 1,000 before its acquisition by SpaceX." The "Where to find Roman Ugarte" block lists "X: https://x.com/romanugarte_" and "LinkedIn: https://www.linkedin.com/in/romanugarte".
- X bio read directly, not as a search snippet **[P][mirror]**: "Building @Bot at @SpaceXAI, prev: @cursor_ai @harvard" (location "San Francisco").
- Statement checked **[P]** through X's embed endpoint: posted 2026-08-12T01:02:55Z by `romanugarte_`, text exactly as quoted, quoting @bot's "Introducing Grok Bot, now in early beta."
- Newer own post **[P]**, 2026-10-07T22:43:13Z: "Grok Bot now has X data built in. I've got mine listening for customer feedback, sending me new blog posts that are gaining traction, and a lot more." https://x.com/romanugarte_/status/2107964995783074269
- Relevant repost **[P]**: on 8 Oct 2026 he reposted @bot: "Grok Bot can now help run your Shopify store. Connect Shopify, then ask it to check orders, track inventory, and keep product listings up to date." https://x.com/bot/status/2108228871938359347 (that post quotes @Shopify: "New connectors just dropped: Connect to @grok to ask questions about your business Or connect to @bot to build a team of agents that help you run it"). This is the seller side of Shopify, which is a more honest hook for a note than the buyer side.
- Musk post checked **[P]**: 2026-10-10T21:04:52Z, text exactly as quoted. https://x.com/elonmusk/status/2109027407185277123
- Issues:
  1. "Leads product for Grok Bot" is still unverified; the strongest wording is his own "Building @Bot at @SpaceXAI".
  2. He has said nothing in public about commerce, offers or connectors of his own; the only links are reposts.
  3. A better-matched person exists and was missed: Matt Palmer (section 14).
- A "Grok Connectors team at SpaceXAI" exists **[P]**: Cursor careers page "Software Engineer, Grok Connectors" says "As a Product Engineer on the Grok Connectors team at SpaceXAI, you'll build the integrations that let Grok, Cursor and Grok Bot do real work inside the tools people use every day ... and a fast-growing marketplace of third-party MCP plugins." https://cursor.com/careers/software-engineer-grok-connectors . It names no lead.

## 7. Dmitry Shevelenko (Perplexity). Verdict: confirmed

- Cited source checked **[P on another organisation's page]**: https://www.lazard.com/our-people/dmitry-shevelenko/ , fetched today, footer "© 2026 Lazard". Text: "Dmitry Shevelenko was appointed a Director of Lazard effective September 2025. Mr. Shevelenko is the Chief Business Officer of Perplexity, where he is responsible for all operations of the company." The page is undated.
- Dated 2026 source checked **[S]**: Fast Company via Yahoo, "Thu, June 18, 2026": "Shevelenko, Perplexity's chief business officer overseeing operations, is helping build that future through the company's Computer platform, launched in 2026".
- Searches for a departure in 2026 found none.
- Channels: none verified. I did not find an X handle or LinkedIn URL on a page he controls.
- Recent statement: none in the last six months on shopping, offers or merchants. The quoted remarks searches return are from 2024 and 2025.
- Perplexity help article checked **[P]**: "For questions about a new or proposed connector, email [EMAIL REDACTED]." and "Use this form if you represent a company that would like to explore building a connector for Perplexity." and "Last modified on September 25, 2026".
- Issues: the role is current, but there is nothing to refer to and no channel. He is a name for context, not a target. The connector form requires a company.

## 8. Nayna Sheth (Microsoft). Verdict: unverified (title confirmed for 8 Jan 2026 only)

- Cited source checked **[P]**: https://about.ads.microsoft.com/en/blog/author/nayna-sheth , fetched today: "Nayna Sheth HEAD OF PRODUCT FOR AGENTIC PAYMENTS, MICROSOFT". The only post listed is "Conversations that Convert: Copilot Checkout and Brand Agents", "January 08, 2026".
- Blog post checked **[P]**: "by Nayna Sheth, Ravi Yada January 08, 2026"; authors block "Nayna Sheth HEAD OF PRODUCT FOR AGENTIC PAYMENTS, MICROSOFT" and "Ravi Yada HEAD OF PRODUCT FOR MICROSOFT CLARITY & BRAND AGENTS, MICROSOFT".
- Statement checked **[P, partner press release]**: https://stripe.com/newsroom/news/microsoft-copilot-and-stripe : the quoted sentence is there, followed by "said Nayna Sheth, head of product for agentic payments at Microsoft."
- Microsoft agentic commerce page checked **[P]**: "MMC will support Universal Commerce Protocol (UCP), enabling richer signals (returns/support policies) so AI can assess products with confidence."
- What I could not do: find anything dated after 8 Jan 2026 that names her. Three searches on her name returned no profile, no later post and no later quote. An author page stays up after a person moves, so it does not prove she holds the role today.
- Channels: none.
- Issues: nine-month-old title, no channel, no statement on discount codes. Do not draft a note to her; if Microsoft matters, use the UCP route.

## 9. Patrick Jordan (Microsoft, UCP Shopping Tech Council). Verdict: confirmed

- Cited source checked **[P]**: `MAINTAINERS.md` in `Universal-Commerce-Protocol/.github`, section "Shopping Tech Council", row "| Patrick Jordan  | Microsoft  |". File last changed 2026-10-12 (#80, a Payments council change).
- Currency confirmed by minutes **[P]**: `meeting-minutes/tc/shopping/2026/2026-10-09.md`, "**Present:** ... Niranjan Manjunath, Patrick Jordan, Prasad Wangikar ...". Also `docs/documentation/announcements.md`: "Patrick Jordan (Microsoft)".
- GitHub handle found (the researcher had none) **[P for the account, I for the match]**: `pjordan`, name "Patrick R. Jordan", bio "I am a scientist with interests in decision theory, game theory, optimization, economic theory, and artificial intelligence." The profile does not state Microsoft. The match rests on: same name; four commits in the UCP org in April and May 2026; python-sdk issues #36 and #37 (July 2026); pull-request reviews in `ucp` on 12 Oct 2026 (#915, #625); and the minutes of 12 Jun 2026, which say SDK repair would get "additional support from Patrick Jordan and other enterprise software partner contributors". Treat it as very likely, not proven.
- What he works on, from the record: SDKs, conformance and whether "an agent can establish that a UCP endpoint is trustworthy and functional" (minutes of 4 Sep 2026). His 12 Oct 2026 reviews are labelled as generated with an AI tool and posted by him.
- Corrections to relevance:
  1. He has not commented on #738 ("[Proposal]: State-bound Offer extension for merchant-proposed Cart changes", 15 comments) or #929 ("[Proposal]: Quote extension — Business-authoritative quotation binding on Cart and Checkout", 2 comments). No council member has commented on either issue; every commenter has author association NONE or CONTRIBUTOR.
  2. The offer proposal is being carried by someone else. Minutes of 2 Oct 2026 **[P]**: "**Topic:** Structured Cart Modifications and State-Bound Offers ... Greg Smith presented a community contribution pull request proposing a structured mechanism for businesses to propose cart modifications and merchant offers bound to specific cart states." and "Greg Smith will carry the topic into Monday's deep dive session to evaluate potential inclusion in the December milestone." Patrick Jordan is not in that day's attendance list. Greg Smith (Google) is covered in sibling file G4.
  3. His title at Microsoft is still not found, and nothing shows he can speak for Copilot Checkout. The proposed ask ("would Copilot Checkout declare it in its agent profile?") is one he may not be able to answer.
- Channels: the UCP repositories; GitHub `pjordan` (very likely his). A personal address appears in commit metadata; it is not published by him for contact and must not be used.

## 10. Harry Gao (Decagon, PACT). Verdict: confirmed

- Cited source checked **[P]**: https://decagon.ai/blog/introducing-the-personal-agent-consent-trust-protocol-pact : "Posted on October 6, 2026 Harry Gao Member of Technical Staff, ASWE Gram Liu Member of Technical Staff".
- Own site checked **[P]**: https://www.harrygao.dev/ : "Member of Technical Staff Decagon • January 2026 - Present Agent engineering." The site links https://github.com/harrygao56 and https://x.com/hrygao .
- X bio **[P][mirror]**: "engineering @decagonai", website harrygao.dev.
- Statement checked **[P]**: "By publishing the specification openly, we're inviting other personal-agent developers, businesses, and agent platforms to implement it and help shape its evolution." is in the post.
- Repository checked **[P]**: `openpactprotocol/openpactprotocol` created 2026-10-01, pushed 2026-10-06, 109 stars, 19 open issues, Discussions off. All 5 commits on `main` are by `harrygao56`. Issue #59 exists as described (opened 2026-10-09 by `sourabhnk`, 0 comments). Issue #56 body confirms the quoted GitHub message: "An owner of this repository has limited the ability to open a pull request to users that are collaborators on this repository."
- Issues:
  1. **Scope.** PACT's own site says it "lets a personal agent contact a Brand's support agent with a verifiable identity and only the permissions the User granted." It is an identity and consent profile on A2A for support conversations. An offer message would be a scope extension, not a gap in the current design.
  2. **Possible convergence.** The same Decagon post says: "We're also excited to join the Personal Agent Protocol working group announced by the team behind Meta's Muse to help shape an industry standard." A commerce message may be steered to that group.
  3. Neither maintainer has replied to any outside issue. Of 72 issue comments in the repo, all before 7 Oct are bots; the nine since are by outside users.
  4. Outside pull requests #41 and #43 are open (opened 7 Oct 2026), so the collaborator-only limit came after that date or has exceptions.

## 11. Gram Liu (Decagon, PACT). Verdict: corrected

- Role checked **[P]**: byline "Gram Liu Member of Technical Staff" on the 6 Oct 2026 post. GitHub bio "Engineering @ Decagon | CMU" (the separate company field still says "Carnegie Mellon University"; updated 2026-10-09). X bio **[P][mirror]**: "building @decagonai | ex @stripe @carnegiemellon". His site links https://github.com/gramliu and https://www.linkedin.com/in/gramliu/ .
- Statement checked **[P]**: "Personal agents like Muse, Instinct, and dots are starting to book travel, manage purchases, and resolve issues on their users' behalf." is in the post.
- Correction: the researcher wrote "no commits of his are visible in the public repo". The commit history was squashed into "feat: initial public release", but the pull-request list shows **13 merged pull requests by `gramliu`** between 1 and 2 Oct 2026 (#8 to #14 and #17 to #22), including "protocol, client: add optional delegation modules for spec §5" (#21) and "reference: example PACT Delegated flow behind DELEGATION_ENABLED" (#22). He also **closed outside pull request #44 on 2026-10-07** (issue event: closed by `gramliu`). He is an active maintainer who triages, and the delegated-authority part of the spec is his work.
- Consequence: for a question about a new message type he is at least as good a target as Harry Gao. The rule "do not send both separate notes" still holds; one issue, both can be mentioned.

## 12. Jesse Zhang (Decagon). Verdict: confirmed

- Cited source checked **[P]**: https://decagon.ai/blog/personal-agents-are-here : "Posted on October 1, 2026 Jesse Zhang Co-founder & CEO Ashwin Sreenivas Co-founder & President".
- Statement checked **[P]**: "In the past month, Meta launched Muse, OpenAI introduced dots, and Instinct started placing phone calls for its users. These personal agents book, buy, cancel, and negotiate on their owners' behalf." and "The customer chooses who acts for them. The business sets the terms."
- Own post **[P]** through X's embed endpoint, 2026-10-01T17:56:31Z: "Personal AI assistants like Muse, Instinct, Dots, and Grok Bot are taking off. They're already starting to buy, book, cancel, and negotiate with businesses on behalf of consumers." https://x.com/thejessezhang/status/2105718516058063080
- Channels checked **[P]**: jessezhang.org links https://twitter.com/thejessezhang and https://www.linkedin.com/in/thejessezhang/ . X bio **[mirror]**: "CEO @DecagonAI", website jessezhang.org.
- Issues: none on facts. Reachability low is right.

## 13. Noah Shinn (Instinct). Verdict: corrected

- Cited source checked **[S, press-release text]**: The AI Insider, "29 September 2026": "said Noah Shinn, Founder of Instinct." and "Founded by Noah Shinn, Instinct aims to make people's lives easier".
- **Primary role source the researcher missed [P]**, read through X's embed endpoint: `@noahrshinn` ("Noah Shinn"), posted 2026-08-26T19:11:11Z: "I'm Noah, the founder of Instinct." https://x.com/noahrshinn/status/2092691344456351744 . Fortune's profile of 30 Sep 2026 links this post, which ties the account to him. X bio **[mirror]**: "@Instinct", location "San Francisco", website noahshinn.com.
- Fortune checked **[S]**, "September 30, 2026": "Noah Shinn is the founder of Instinct, whose viral AI assistant is emerging as a competitor to Meta's Muse." Other press says "founder and CEO"; I found no primary source for "CEO".
- **Relevant statement the researcher missed [P]**, 2026-09-28T17:45:02Z, first lines confirmed on X's embed endpoint: "Instinct + Shopify. 35% of our users use Instinct for personal shopping. Today, we're partnering with @Shopify to bring product discovery, checkout and order updates into one conversation." https://x.com/noahrshinn/status/2104628465488306183 . The rest of the post **[mirror]**: "Instinct can now search Shopify's merchant network for products, and find live information on prices, sizes and availability. When you're ready to buy, Instinct sets up your order with the store so you can check out with Shop Pay using your saved payment and shipping details." and a list that ends "Access automatic discounts and promo codes tied to your Shop account". PYMNTS coverage found by search repeats the checkout sentence.
- Other recent posts **[P][mirror]**: 7 Oct 2026: "Your Instinct can now find you the best deals, book with a single tap" (flights) https://x.com/noahrshinn/status/2107926694388801646 ; 7 Oct 2026: "When your Instinct connects with participating businesses on @SierraPlatform and @DecagonAI, the agents will be able to work together to solve your problem" https://x.com/noahrshinn/status/2107875073038385546
- Channels:
  - X `@noahrshinn`: his (linked by Fortune, own first-person post, website field matches).
  - GitHub `noahshinn`: name "Noah Shinn", blog https://noahshinn.com .
  - https://noahshinn.com : the Contact block reads "Email: noahrshinn[at]gmail[dot]com". Published by him, but the page says "Last updated: 08/2025" and describes him as "Previously, I was a researcher at Sierra". It predates Instinct's launch; a personal address on a stale academic page is a poor channel for a product question.
  - instinct.com footer: "comms[at]instinct[dot]com" (company press address).
- Issues:
  1. Role status should be primary, not secondary.
  2. The ask should be rewritten around the Shopify path he announced. A sharper one: "When Instinct sets up a Shopify order for Shop Pay checkout, can it pass a merchant-issued single-use discount code, or only the promo codes tied to the user's Shop account?"
  3. A business-side person was reported and missed (section 14, Ben Schwerin).

---

## 14. People in this scope the researcher missed

1. **Matt Palmer, SpaceXAI (via Cursor), developer relations and product for Grok Bot.** **[P]** His site title: "Matt Palmer - DevRel & Product"; text: "I work at SpaceXAI (via Cursor), but you might know me from my work at Replit or Conductor." https://palmer.gg . X `@mattyp` bio **[mirror]**: "cursor & @bot at @spacexsi" (spelled so in the bio). Recent posts **[mirror]**: 2 Oct 2026 "we just launched a typescript sdk the @spacexai developer experience will be first class" https://x.com/mattyp/status/2106094647571534040 ; 7 Oct 2026 "What's new in Grok Bot ... 4:39 Plugin search with Command K" https://x.com/mattyp/status/2107886668892057614 . Channels: X `@mattyp`, site palmer.gg, LinkedIn https://www.linkedin.com/in/matt-palmer/ (linked from his site). He is the developer-relations route for a working Grok Bot connector and a better first contact than Roman Ugarte. Small ask: "Is there a path for a plugin that fetches a seller's verified offer before Bot orders, and who reviews that kind of plugin for Connect apps?"
2. **`@n2parko`, product at SpaceXAI.** **[P][mirror]** X bio: "product @spacexai co-founder @cdr_fyi". Posted the Team Bots launch on 28 Sep 2026: "Today we're launching Team Bots for Grok Bot". https://x.com/n2parko/status/2104663299485020568 . His Substack lists the author as "Kevin"; full name not verified. Listed as a lead, not a confirmed person.
3. **Ben Schwerin, reported as joining Instinct as chief business officer.** **[S]** TBPN post of 2026-09-29T15:46:34Z: "BREAKING: @BenSchwerin is joining Instinct as chief business officer, per The Information" https://x.com/tbpn/status/2104961037195993445 ; Noah Shinn reposted it. A web search did not find the article itself. Press report only; no channel verified (the handle in the post did not resolve on the mirror). If true, he is the partnerships owner at Instinct.
4. **Ravi Yada, Microsoft.** **[P]** "Ravi Yada HEAD OF PRODUCT FOR MICROSOFT CLARITY & BRAND AGENTS, MICROSOFT" (authors block, 8 Jan 2026 post). Brand Agents is Microsoft's seller-side agent for Shopify merchants, which is closer to "the seller answers with an offer" than Copilot Checkout payments. Same staleness caveat as Nayna Sheth; no channel found.
5. **Ashwin Sreenivas, Decagon.** **[P]** Byline "Ashwin Sreenivas Co-founder & President" on the 1 Oct 2026 post about the Personal Agent Gateway. No channel checked.
6. **Rahul Bansal, OpenAI (likely `rb-oai`).** **[P]** Co-author named in #191. The account `rb-oai` (no name on profile) wrote the merged pull requests #190 and #192 that implemented Product Feeds and Promotions. The identity link is not confirmed. He is the hands-on author of the Promotions API.
7. **Already covered by siblings, but they change who to write to in this scope:** Greg Smith (Google; carries the UCP Offer extension; G4), Tomas Taylor (`0xtotaylor`; wrote the "Reconsideration Offers" sentence; G2 and G5), Prasad Wangikar (`prasad-stripe`; ACP seat 2; merged both the Intent Traces and Promotions pull requests; G2), Lee Hwa (`lhwa`; ACP seat 3 for Meta; merged the most recent ACP commit; G2).
8. **Still no named owner after my own searches:** OpenAI's ChatGPT shopping or commerce lead; the owner of OpenAI's plugin directory policy; the lead of the Grok Connectors team; Perplexity's shopping or Comet lead; Anthropic's directory policy owner.

## 15. Side finding outside this scope (for the parent)

- Alexandr Wang's own X bio today **[P][mirror]**: "chief ai officer @meta, founder meta superintelligence labs, founder @scale_ai". Fortune, 30 Sep 2026 **[S]**: "Meta chief AI officer Alexandr Wang". His posts of 8 Sep 2026 about Muse were read through X's embed endpoint ("muse is way hotter than the other personal agents (and also way faster, but mostly hotter)"). Tobi Lutke was not checked here; the mirror did not return his profile.

## 16. What I could not verify

1. X profile bios and post lists come from a third-party mirror, because X's own profile embed returned 429. Single posts quoted as **[P]** without the mirror label were read on X's embed endpoint, which truncates long posts.
2. LinkedIn pages were not fetched; URLs are given only where the person's own site or an interviewer's page links them.
3. openai.com, axios.com and geekwire.com returned 403.
4. That `pjordan` is the Microsoft council member (very likely, not stated on the profile).
5. Whether Nayna Sheth and Ravi Yada hold their January 2026 roles today.
6. Ben Schwerin's move (one press report relayed on X).
7. Whether the Disrupt session takes audience questions.
