# V-G2: adversarial check of G2 (Meta, Sierra, Stripe)

Checked on 13 Oct 2026. Every source below was fetched by me today unless marked otherwise. Nobody was contacted; nothing was posted, followed, starred or submitted. All fetches were anonymous reads of public pages.

Labels: **[P]** primary (organisation's own page, the person's own profile or post, a maintainer file). **[S]** secondary (press, conference bio). **[snippet]** search-result summary only. **[inferred]** my reading.

How things were read:
- Web pages: `curl` with a browser User-Agent, text extracted locally, quoted strings searched for literally.
- X posts: the public embed endpoint (`cdn.syndication.twimg.com/tweet-result`). It returns author, date, counts and the first ~280 characters. Profile bios could not be read (the profile endpoint returned 429 all session).
- GitHub: the REST API was rate-limited (0 of 60 left), so I used public HTML profile pages and the public `.atom` commit feeds instead.
- LinkedIn: the logged-out public profile page loaded (HTTP 200) for most people and shows name, employer, location, follower count and recent public posts. Job titles are masked with asterisks on that view. Post dates are relative ("6d", "2w"), so dates derived from them are approximate.

## 1. Overall verdict

The researcher's list is mostly sound. No wrong person, no one who has left, no fabricated quote. Every quoted sentence I checked is on the cited page, word for word. The faults are of three kinds:

1. **Stale or weaker evidence than exists.** Jeff Weinstein's and Steve Kaliski's titles were cited from a 29 Sep 2025 page; Stripe printed both again on 18 Mar 2026. Kaliski's "Principal Software Engineer" is on Stripe's own Sessions 2026 speaker list, not only a conference bio.
2. **Channels and statements missed.** Prasad Wangikar, James Andersen, Clay Bavor, Bret Taylor, Kevin Miller and Steve Kaliski all have verifiable public LinkedIn profiles; Wangikar and Andersen link theirs from their own GitHub profiles. Wangikar and Kaliski both made first-person public statements on agent shopping in the last three weeks. Weinstein publishes a contact address himself. Bret Taylor publicly invited people to ask him about joining PAP.
3. **"Controls" claims that go beyond the evidence.** "Singleton controls whether Muse lists an extension" and "Wang controls the organisation that builds Muse" are inferences. What is evidenced: Singleton is Meta's named spokesperson on PAP; Wang is Chief AI Officer of MSL; the Muse product team is described by Zuckerberg as "Nat's team".

Verdict counts: 9 confirmed, 3 corrected (Wangikar, Kaliski, Weinstein), 0 unverified, 0 drop.

## 2. Person by person

### Alexandr Wang (Meta) - CONFIRMED
- **Role quote checked [S]:** "Mark Zuckerberg (founder and CEO, Meta) and Alexandr Wang (Chief AI Officer, Meta Superintelligence Labs) join John for a pint to discuss the launch of Muse Wonder and the future of personal AI agents." https://cheekypint.substack.com/p/muse-wonder-zuckerberg-and-wangs (page metadata `datePublished` 2026-10-12T19:26:48Z). Present, exact.
- **Supporting [S]:** CNBC 8 Sep 2026 "Meta AI chief Alexandr Wang"; TechCrunch 22 Sep 2026 "Meta's Chief AI Officer Alexandr Wang". Both re-fetched and present.
- **Statement checked:** "I think Muse is one of the first products where you're actually people are fully delegating purchases to the agents." Present in the transcript under the speaker label "Alexandr Wang". The next sentences are also usable: "we've been talking a lot about agentic shopping and like the possibility of it, but now it's like really happening."
- **Channel:** X `@alexandr_wang`. Embed data shows name "Alexandr Wang", verified, affiliation label "Meta". His.
- **Reply counts:** 24 Sep 2026 post (id 2102915571276992875): 358 replies, 6,589 likes today. Matches.
- **Anything newer that contradicts:** none found. An interview dated yesterday still uses the title.
- **Issues:**
  - No Meta-owned page states the title (Meta's executive gallery returned HTTP 400 for me too). The role stays "confirmed by an interview page and press".
  - March 2026 press (Storyboard18, 6 Mar 2026, summarising other reports) [S] says Meta reorganised: "some engineering teams, data pipelines and model oversight responsibilities that were previously part of the broader AI structure have been reassigned" and a new applied AI engineering organisation was set up under Maher Saba. So "controls the organisation that builds Muse" is broader than the evidence. Wikipedia's MSL page [S] lists the product group as "Products and Applied Research: Led by Friedman". Whether Friedman reports to Wang in 2026 is unverified, as the researcher said.
  - The Substack is John Collison's (Stripe). A note that cites it is citing a Stripe co-founder's show, which is fine but worth knowing.

### Nat Friedman (Meta) - CONFIRMED (press only)
- **Role quote checked [S]:** "According to an X post by Nat Friedman, head of product at Meta's Superintelligence Labs (MSL), Muse was "definitely heavily inspired as a product by OpenClaw."" https://techcrunch.com/2026/09/22/meta-admits-muses-likeness-to-openclaw-isnt-a-coincidence/ (`datePublished` 2026-09-22). Present.
- **Primary support checked:** Zuckerberg in the 12 Oct transcript: "whether they're the people in the lab who are working on that or the people on Nat's team who are working on the product". Present. Friedman's own X reply of 21 Sep 2026 (id 2102103707936768130): "After I used openclaw in january I bought hundreds of mac minis for the MSL team". Present.
- **Statement checked:** X, 2 Oct 2026 19:09 UTC (id 2106099383037309211): "Announcing Muse Gadgets, an open source ESP32 firmware and Linux sdk so that you can make hardware devices that work with Muse." Present; 411 replies, 7,167 likes. It is about a hardware SDK, not commerce. I also found no statement by him on offers, ads or shopping agents.
- **Channels:** X `@natfriedman` (name "Nat Friedman", verified; no Meta affiliation label, unlike Wang and Zuckerberg). https://nat.org/ re-fetched: no employer, no contact address. Both his.
- **Issues:**
  - Title is press-only. Wikipedia [S] also says "currently head of product at Meta Superintelligence Labs"; a search summary mentioned a variant "VP of Product and Applied Research" [snippet]. Treat the exact wording as press usage.
  - "He did answer a small app builder in public" overstates it. The 21 Sep reply was to a viral post (TechCrunch: "a post that had gone viral among the AI crowd") that accused Muse of copying OpenClaw. That is damage control on a trending thread, not evidence that he answers cold notes from builders.

### David Singleton (Meta) - CONFIRMED (and strengthened)
- **Role quote checked [S]:** "David Singleton, Meta's Superintelligence Labs vice president of engineering and consumer products, said in an interview with CNBC." Present at the cited URL, which redirects to https://siliconangle.com/2026/10/06/meta-teams-up-with-bret-taylors-sierra-technologies-on-new-standards-for-ai-agent-commerce/ (`datePublished` 2026-10-07T00:54Z, i.e. 6 Oct US time).
- **Original found (researcher could not):** CNBC, 6 Oct 2026 [S]: "David Singleton, vice president of engineering and consumer products at Meta Superintelligence Labs and former technology chief at Stripe, highlighted security." https://www.cnbc.com/2026/10/06/meta-joins-companies-to-tame-chaos-of-doing-business-with-ai-bots.html
- **Primary found:** his own LinkedIn (https://www.linkedin.com/in/davidpsingleton/, linked from his about page) has page title "David Singleton - Meta", San Francisco Bay Area, 43K followers. His own post there (shown as "6mo"; press dates the deal 23-24 Mar 2026): "Excited to announce that Hugo Barra, Nicholas Jitkoff and I are joining Meta Superintelligence Labs with the entire Dreamer team today." SiliconANGLE 23 Mar 2026 [S] says the team works "within Meta's Superintelligence Labs group under Chief AI Officer ... Alexandr Wang, according to a report in Bloomberg".
- **Statement checked:** X, 6 Oct 2026 20:17 UTC (id 2107565831257567324), exact as quoted; 15 replies, 216 likes. A fuller first-person version is on his LinkedIn (about 6-7 Oct 2026, 18 comments): "Email as a means of communicating took off because everyone agreed on addressing, delivery and bounces. No one owns it and anyone can build on it. We believe agent commerce will work the same way, which is why we want to define these rails together."
- **Channels:** X `@dps` (linked from both his about page and his GitHub profile), GitHub `dps` (name "David Singleton"), LinkedIn, https://blog.singleton.io/ . All his. The `[EMAIL REDACTED]` address is on his about page and is explicitly "For AI agents"; I agree it should not be used for a person-to-person note.
- **Issues:**
  - His partner list ("Genesys, NiCE, Decagon, Rocket, Shopify, Stripe, and Walmart") differs from Sierra's ("Genesys, Instinct, Rocket, Shopify, Stripe, and Walmart"). Decagon is not on the design-partner list at personalagentprotocol.org/docs/path-to-1 as of today. The quote is accurate, but a draft message should not repeat his list as the membership.
  - "Controls Meta's side of PAP, and so whether Muse lists a given extension" is inferred. Evidence supports "Meta's named spokesperson on PAP", nothing about who decides extension support.
  - Useful fact the researcher only had as a snippet: he was Stripe's technology chief (CNBC and SiliconANGLE, both fetched).

### Lee Hwa (Meta) - CONFIRMED (seat only)
- **Role quote checked [P]:** `| 3    | Meta        | lhwa              |` under "Current TSC Members" in `docs/governance.md` on `main`. The commit feed for that file shows the row's commit: 2026-04-24T16:44:27Z, author `lhwa`, "ADMIN: Add Meta as TSC member (#236)". No later commit to the file.
- **Identity:** https://github.com/lhwa page title "lhwa (Lee Hwa)"; no company, location, bio or links.
- **Statement checked:** PR #201 "SEP: Suggested Pricing on Checkout Create by lhwa", merged 22 May 2026: "the agent provides the seller with the information needed to make an informed decision about whether to honor the price the buyer saw." Present.
- **Activity:** commit feed on `main` shows `lhwa` commits on 7 May, 22 May (two) and 4 Jun 2026; last commit on `main` by anyone is 18 Jul 2026 (`vig-star`, #281). An issue-search page lists `lhwa` as involved in later open PRs (#284, #290), so the account still appears in the tracker after June; I could not read exact dates from that page.
- **Issues:**
  - Job title and team at Meta: not found by me either. Employer rests on the governance row and the Meta CLA entry (the latter not re-checked by me).
  - The researcher writes "his"; nothing public establishes gender. Use the name.
  - The statement is almost five months old.

### Vignesh Sreedhar (Meta) - CONFIRMED (and strengthened)
- **Role quote checked [P]:** GitHub profile bio "eng @ meta | fintech + ai", organisation "meta", location "san francisco". Present. I could not confirm the "profile updated 10 Oct 2026" date (API rate-limited).
- **Better primary, his own site (fetched today, undated):** "I moved to San Francisco at the start of 2025 to join Meta as a software engineer in their fintech org. I work on agentic commerce infra across Meta surfaces (Muse, Ads, Meta AI), shape industry protocols in collaboration with fintech leaders, and build systems that process hundreds of billions of dollars in payments." https://vigneshsreedhar.com/
- **Statement checked:** PR #281 "SEP: Optional product URL on checkout Item by vig-star": "This SEP adds an optional url field (a canonical product page URL, type: string , format: uri ) to Item . When present, sellers can map the URL to the exact product and brand." Present; opened 8 Jul, merged 18 Jul 2026.
- **Channels:** GitHub `vig-star`; X `@vigstar1` and LinkedIn https://www.linkedin.com/in/vignesh-sreedhar/ (both linked from his GitHub profile and his site; the LinkedIn page itself returned HTTP 999, not opened); https://vigneshsreedhar.com/ ; Substack vigstar.substack.com. He publishes a contact address on his own site in obfuscated form: "you can always reach me at vigneshsreedhar2002 [at] gmail [dot] com".
- **Issues:**
  - He is an early-career individual contributor (his site: born 2002, joined Meta at the start of 2025). He cannot speak for Meta and should not be asked to. A question about how the public ACP process works is fair; a question about Muse's internal roadmap ("which Meta team decides whether Muse sends intent traces") puts him in an awkward position. I suggest a narrower ask.
  - His site is the first primary evidence that Meta's fintech organisation, not only MSL, builds Muse's commerce plumbing. That points to Ginger Baker (section 3).

### James Andersen (Meta) - CONFIRMED
- **Role quote checked [P]:** `| James Andersen  | Meta       |` in the Shopping Tech Council table of `MAINTAINERS.md`. The file's last commit is 2026-10-12T18:17:18Z (a Payments council change by another person), so the roster is current to yesterday.
- **Identity:** https://github.com/jamesandersen page title "jamesandersen (James Andersen)", organisation "Meta", location "Washington, USA".
- **Statement checked:** PR #538 ("feat: `ask` capability for natural-language Q&A"), review comment by `jamesandersen` timestamped 2026-10-07T00:52:55Z: "Thanks @igrigorik for the move to common where this functionality can more broadly benefit the UCP ecosystem. ...and for that latest pass clarifying the use of ids that I was initially a bit worried about. Another great addition here." Present.
- **Channel the researcher missed:** his GitHub profile links https://www.linkedin.com/in/jamesjandersen/ . That page loads: "James Andersen - Meta", Greater Seattle Area, about text "Software application architect and developer specializing web applications with...", 982 followers.
- **Press [S]:** IT Brief (April 2026): "The new members are Greg Smith of Amazon, James Andersen of Meta, Patrick Jordan of Microsoft, Prasad Wangikar of Stripe and Scot DeDeo of Salesforce."
- **Issues:** he is one of 17 members of the Shopping Tech Council; "Meta's review voice" is right, "owner" would be wrong. Job title not public. The proposed ask ("would Meta's agents negotiate a merchant-proposed offer capability") asks him to commit Muse's behaviour, which a council reviewer may not be able to do; a review comment on the open proposal is the askable thing.

### Bret Taylor (Sierra) - CONFIRMED
- **Role quote checked [P]:** "Bret is Co-Founder of Sierra. Most recently, he served as Co-CEO of Salesforce." and "Bret serves on the board of OpenAI." https://sierra.ai/about (undated; fetched today). Byline "Bret Taylor Clay Bavor" on both PAP posts (6 Oct and 9 Oct 2026). Present.
- **Press [S]:** CNBC 6 Oct 2026: "Taylor, who's also chairman of OpenAI and is leading the initiative". So he personally leads PAP per CNBC.
- **Statement checked:** X, 6 Oct 2026 18:15 UTC (id 2107535182119244176), exact as quoted; 226 replies, 2,943 likes.
- **Channel the researcher missed:** LinkedIn https://www.linkedin.com/in/brettaylor/ (page title "Bret Taylor - OpenAI", San Francisco, 172K followers; the posts are Sierra's announcements, so it is his). His own post there (about 6-7 Oct 2026, 90 comments): "It will help define how personal agents interact with businesses and is open for anyone to implement. You can read more here - and if anyone is interested in joining let me know!"
- **Issues:** reachability is still low, but the public "let me know" is an explicit invitation the researcher did not record. It does not replace the feedback mailbox; it means a short LinkedIn comment or message that says "interested in joining as a technology provider, sent details to the feedback address" is on-topic by his own words. Note also that OpenAI is now a PAP design partner (site list), and he chairs OpenAI.

### Clay Bavor (Sierra) - CONFIRMED
- **Role quote checked [P]:** "Clay is Co-Founder of Sierra. Previously, Clay spent 18 years at Google, where he most recently led Google Labs." https://sierra.ai/about . Present.
- **Statement checked [P]:** "This draft is a starting point. Over the next month we will host design workshops and publish a reference implementation to help developers get started." https://sierra.ai/blog/poppy (`datePublished` 2026-10-09). Present. It is a co-signed company post, not his own words alone.
- **Channel found (researcher had none):** LinkedIn https://www.linkedin.com/in/claybavor/ loads as "Clay Bavor - Sierra", Mountain View, education Princeton, 22K followers. His own recent post (about 7-8 Oct 2026): "Thank you to everyone who spent the day with us at Sierra Summit in SF!" Everything on PAP there is a repost of Bret Taylor. No X handle verified.
- **Issues:** no first-person statement on PAP, shopping or offers exists. A note to him can only refer to the co-signed post.

### Prasad Wangikar (Stripe) - CORRECTED (channels, recent statement, job title)
- **Seat confirmed [P]:** `| 2    | Stripe      | prasad-stripe     |` in ACP `docs/governance.md`; "| Prasad Wangikar | Stripe |" in both the Shopping and Payments Tech Council tables of UCP `MAINTAINERS.md`. GitHub profile title "prasad-stripe (Prasad Wangikar)", organisation "Stripe", location "Princeton, NJ".
- **Authorship confirmed [P]:** commit feeds show `prasad-stripe` wrote "ADMIN: Revised governance model (#173)" (10 Mar 2026) and "ADMIN: Add TSC Operating Model documentation (#184)" (7 Apr 2026, the only commit to that file). The operating-model sentence quoted by the researcher is present. Stripe's veto is in the text: "the Founding Maintainers (OpenAI and Stripe) reserve a limited veto authority over TSC decisions"; "The veto can only be used to block a change".
- **Correction 1, channel:** "No personal channel published" is wrong. His GitHub profile links https://www.linkedin.com/in/prasad-wangikar/ (loads: "Prasad Wangikar", New York City Metropolitan Area, 2K followers).
- **Correction 2, recent statement:** "nothing from the last six months" is wrong. His own LinkedIn post, shown as "1w" (so about 1-6 Oct 2026; 3 comments): "Agents can already shop at scale. Muse, Grok Bot, and Instinct now run purchases on Stripe's Link, and agentic purchases on Link grew 38x in the past month. So the question is no longer whether agents will buy things for us. It's whether those purchases actually complete, and whether people trust them enough to keep saying yes." And: "Real checkouts are full of edge cases a person handles without thinking: the price changes after shipping is added, a card gets declined, a verification step appears."
- **Correction 3, job title:** a LeadDev speaker page [S] says "Prasad Wangikar, Principal Engineer at Stripe, leads Payments Intelligence, applying AI/ML to detect fraud and improve conversion in real-time transactions." https://leaddev.com/community/prasad-wangikar . The page metadata is dated 2025, so the title is not confirmed for 2026.
- **Issues:** his public writing is about checkout reliability and trust, which is the frame a note to him should use (an offer that "really applies at checkout" fits it). A LinkedIn post with 3 comments is a far more visible place for a short reply than the ACP tracker.

### Steve Kaliski (Stripe) - CORRECTED (role now primary; channels; recent statement)
- **Conference bio checked [S]:** the quoted sentence is present on https://www.ai.engineer/speakers/steve-kaliski ("Conference affiliation: Stripe · 2026"). The same page adds: "Kaliski also represents Stripe on the x402 technical steering committee".
- **Primary, 2026:**
  - Stripe Sessions 2026 speaker list (Stripe's own site, https://sessions-2026.vercelapp.stripe.dev/speakers): "Steve Kaliski Stripe Principal Software Engineer".
  - Stripe blog, 18 Mar 2026, byline: "Jeff Weinstein Product Lead, Agentic Commerce Steve Kaliski Engineering Lead, Agentic Commerce". https://stripe.com/blog/machine-payments-protocol
  - His own site (undated, live today): "I currently live in New York City and work on AI, agents, and commerce at Stripe." https://www.stevekaliski.com/
- **Recent statement found (researcher had none):** Stripe developer blog, 22 Sep 2026, authors "Cara Mecozzi, Steve Kaliski": "We believed WebMCP, an emerging standard gaining traction, was a strong candidate to improve the agent checkout experience." and "we enabled WebMCP on all Stripe Checkout UIs resulting in 42% fewer tokens consumed and 38% fewer tool calls invoked against baseline measurements." https://stripe.dev/blog/how-stripe-is-designing-checkout-for-ai-agents . His own LinkedIn post about it (shown as "2w", 5 comments): "We just rolled out support for WebMCP across Stripe Checkout UIs."
- **Channels:** GitHub `stevekaliski-stripe` (name "Steve Kaliski", organisation "@stripe"); X `@stevekaliski` (linked from his own site); LinkedIn https://www.linkedin.com/in/steve-kaliski-079a7710/ ("Steve Kaliski - Stripe", New York, 3K followers); his site, which has an "Email" link he publishes himself (a personal Gmail address; read it from the site rather than from these notes).
- **Issues:**
  - Not in San Francisco: New York City per his own site.
  - The stripe.dev author box on the 22 Sep 2026 post says "Steve is a Software Engineer on the Experimental Projects team", which conflicts with the other three sources and looks like an old stored bio. Use "Principal Software Engineer" / "Engineering Lead, Agentic Commerce".
  - The WebMCP post is a better hook than ACP intent traces: this project also ships a browser WebMCP tool.

### Jeff Weinstein (Stripe) - CORRECTED (title is confirmed for 2026; contact route exists)
- **Cited quote checked [P]:** "Jeff Weinstein Product Lead, Agentic Commerce" on the 29 Sep 2025 Stripe post. Present.
- **Newer primary:** the same byline on Stripe's 18 Mar 2026 post "Introducing the Machine Payments Protocol" (https://stripe.com/blog/machine-payments-protocol). So Stripe printed the title in 2026; "last printed 29 Sep 2025" is out of date. He is not on the Sessions 2026 speaker list.
- **Statement checked:** X, 6 Oct 2026 18:41 UTC (id 2107541730870632493), exact as quoted; 57 replies, 692 likes; affiliation label "Stripe".
- **More relevant statement found:** X, 1 Sep 2026 (id 2094849375436755441): "It's extremely cool[0] to have your agent coordinate "real-world" services for you. But, it's still kinda a pain. You can't always purchase easily via agent, there's slow back and forth with the service via browser, and sometimes it gets blocked." (21 replies.)
- **Contact he publishes himself:** X, 28 Jul 2026 (id 2082238948877996498, a reply in his own thread): "Reach out via DM or [EMAIL REDACTED]". Context: a hiring post for a Link product manager. The full text of the 1 Sep post, as mirrored by Digg [S], ends "Reach out => [EMAIL REDACTED]", in the context of a Stripe programme for 20 platforms selling real-world services through agents. So the address is public and offered by him, but each time for a specific purpose; a note should say why it is relevant to what he asked for.
- **Channel:** X `@jeff_weinstein`. His.
- **Namesake trap:** https://www.linkedin.com/in/jeffweinstein is a different Jeff Weinstein (manufacturing, Greater Boston). Do not use it. I did not find his real LinkedIn.
- **Issues:** the researcher's "no evidence of how often he answers" understates it; he repeatedly invites DMs and email in public. Reachability is medium to high for a short, specific note.

### Kevin Miller (Stripe) - CONFIRMED
- **Role quote checked [P]:** "Kevin Miller , Business Lead for Payments, Risk, Support and Global, Stripe" on https://stripe.com/sessions/2026/opening-remarks-and-product . Present. Also Stripe newsroom, 5 Mar 2026 [P]: "Kevin Miller, head of payments at Stripe, said:" (https://stripe.com/newsroom/news/stripe-named-a-leader-by-forrester-2026), and Sierra's post: "Kevin Miller, Head of Payments, Stripe".
- **Statement checked:** the quote in Sierra's 6 Oct 2026 post is present, exact.
- **Channel now verified (researcher had a snippet only):** https://www.linkedin.com/in/kevinmiller loads as "Kevin Miller - Stripe", Greater Seattle Area, 23K followers. It is the right Kevin Miller: his posts are Stripe's payments announcements. His own post on PAP (shown as "6d", 1 comment): "That's why Stripe is joining Meta, Sierra, Genesys, Instinct, Rocket, Shopify, and Walmart as a founding partner for the Personal Agent Protocol. It's an open standard we're developing to help businesses recognize their customers' agents, work with them directly, and curate their relationships." An earlier post (shown as "3mo"): "We talked about why checkout built for humans doesn't work for agents, how discovery is the real unsolved problem".
- **Issues:** his LinkedIn posts get 1 to 8 comments, so a comment there is seen more easily than the researcher's "no verified public handle" suggests. Still a senior executive; low for a direct note. No X handle verified.

## 3. People the researcher left out or under-ranked

1. **CJ Desai, Meta.** "Chirantan "CJ" Desai will join Meta as Chief Enterprise Platform Officer, reporting directly to me." Meta newsroom, 28 Sep 2026 [P], https://about.fb.com/news/2026/09/launching-meta-enterprise-platform/ . Scope in Zuckerberg's words: "bringing our full technology stack, including the Muse agent, Meta Business Agent, Muse API, Muse Code, and more to businesses and developers". The researcher parked him as "the business side, not the consumer agent". For this project the business side is the point: Meta Business Agent is the seller's agent, and Singleton's PAP post names "@muse and Meta Business Agent" together. Two weeks into the job and not reachable cold, but he is the executive whose remit covers a seller-side offer surface at Meta.
2. **Ginger Baker, Meta.** "Ginger Baker, VP, Product Management, Fintech and Payments, Meta" on Stripe's Sessions 2026 keynote page [P for the listing]. Vignesh Sreedhar's own site says Meta's fintech org builds "agentic commerce infra across Meta surfaces (Muse, Ads, Meta AI)" and shapes "industry protocols". So the fintech organisation, not only MSL, holds Meta's ACP and UCP work [inferred], and she is its product head. The researcher dismissed her as "checkout in Meta's apps and ads, not Muse"; Sreedhar's page contradicts that.
3. **Tomas Taylor (`0xtotaylor`).** Author of the ACP Intent Traces RFC, whose text names "Reconsideration Offers" as future work. GitHub profile "0xtotaylor (Tomas Taylor)", site https://totaylor.com , no employer shown. The researcher listed him under "others" while calling him "a natural co-author to ask". He is the single most askable person for the ACP route and belongs in the main list.
4. **Aravind Rao (`aravindrao-openai`), OpenAI.** Holds seat 1 on the ACP steering committee (governance table, checked). With three seats and a simple majority, any SEP needs two of OpenAI, Stripe, Meta. Outside G2's scope but the ACP plan cannot ignore him.
5. **Dan Hill, Stripe.** "Dan Hill Product Manager, Link Consumer Product", byline on "Helping personal agents shop more intelligently and reliably with Link", Stripe blog, 29 Sep 2026 [P]. Link is the wallet Muse, Grok Bot and Instinct pay with. X handle `@danhilltech` per Weinstein's 28 Jul 2026 post. He owns the agent-side payment step where a seller's single-use discount code has to survive.
6. **John Collison, Stripe.** Host of the 12 Oct 2026 interview; said there: "it's very interesting to look at the agentic commerce stats at Stripe ... it only as of September basically started going vertical." Not reachable cold; relevant because the Wang quote the owner will cite comes from his show.
7. **Allison Xu and Jennifer Lee, Stripe.** Both listed as "Stripe Product, Agentic Commerce" on the Sessions 2026 speaker list [P]. Product managers on the exact product; no channels checked.
8. **Jake Sinsheimer, Stripe.** "GTM Head of Agentic Commerce, Stripe"; "my team looks after our relationship with merchants." Sessions 2026 [P]. Already in the researcher's "others"; correct to keep out of the main list.
9. **Ajeet Grewal and Venu Satuluri, Sierra.** Bylines on "Caller ID in the age of agents", Sierra blog, 8 Oct 2026 [P]. The nearest named Sierra engineers to PAP. Titles not given; not confirmed as spec authors.
10. **Hugo Barra and Nicholas Jitkoff, Meta.** Joined MSL with Singleton (his own LinkedIn post). Current roles on Muse not verified.
11. **Mani Fazeli, Shopify.** "Mani Fazeli, VP Product, Shopify" is Shopify's named voice in the PAP announcement: "From answering product questions to supporting purchases, returns, and exchanges, the ambition is to turn a buyer's intent into an outcome that delights them." Belongs to the Shopify file; flag for whoever checks it, because he is a more reachable Shopify route on PAP than Tobi Lutke.

Still unnamed after my own search: the PAP spec authors (the site and the review kit say only "the authors"); any Meta-side PAP editor; a lead or developer-relations contact for the Muse Connector Platform. A search summary mentioned a Meta job advert for a "Head of Developer Relations & Community, AI" [snippet; the page returned 403], which, if real, suggests that role is not yet filled.

## 4. Facts in the researcher's notes that I re-checked

| Claim | Result |
|---|---|
| PAP design partners on the site include Meta, OpenAI, Instinct as personal agents and Shopify, Stripe, Sierra as technology providers | Confirmed, https://personalagentprotocol.org/docs/path-to-1 ("Draft 0.1 Updated Oct 12, 2026") |
| Feedback and design-partner requests go to one Sierra mailbox | Confirmed on the same page and in the review kit |
| "Feedback is welcome from anyone, whether or not you're a partner." | Confirmed |
| ACP: last commit on `main` 18 Jul 2026 | Confirmed by the commit feed |
| ACP: SEP needs a TSC sponsor, 7-business-day review, simple majority | Confirmed in `governance.md` |
| Sierra 9 Oct post announces 35 more design partners | Confirmed |
| Wang's 29 Sep connector list includes "@stripe (merchant)" and "@Shopify (merchant)" | Confirmed (id 2104925782644535438) |
| Zuckerberg's 18 Sep post on connectors | Confirmed (id 2101084678640066765) |
| CJ Desai announcement | Confirmed |
| Jake Sinsheimer, Allison Xu, Ginger Baker listings | Confirmed |

Not re-checked by me: the Muse connector guideline numbers (page fetched, 200, but I did not re-read each rule), the ACP CLA signatory file, discussion #209 and #304, the Meta help page on custom connectors.

## 5. What I could not do

- Read X profile bios (endpoint returned 429). Handles are verified by the author name and affiliation label on individual posts, not by bio text.
- Read masked LinkedIn job titles. I did not sign in.
- Open Vignesh Sreedhar's LinkedIn (HTTP 999) or Meta's executive gallery (HTTP 400).
- Use GitHub's API (rate limit exhausted by earlier work from this address); profile "updated at" dates are therefore unverified.
- Find any Meta-published page with Wang's or Friedman's title.

## 6. Raw files

Text extracts, JSON and commit feeds of everything I fetched are in `/Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/docs/vg2/` (the raw HTML stayed in session scratch space and will not persist). The researcher's own raw copies are in `/Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/docs/g2/`.
