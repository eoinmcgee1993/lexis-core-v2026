# Growth delegation brief

Written 21 Aug 2026. What I can actually automate today, what genuinely
needs a human, and a ready-to-post VA brief if you want to hire one.
Nothing in here was set up by spending your money or creating an account
on your behalf — every action that costs money or creates a new account
is flagged explicitly, not done quietly.

## What I can't do, and why

I don't have the ability to:
- **Hire anyone.** No platform connection can post a job, review
  candidates, or pay someone on your behalf. The VA brief below is a
  ready-to-paste draft, not a posted listing.
- **Spend ad budget.** Even where a tool exists to manage a live ad
  campaign (Meta/Google/TikTok Ads, via the Windsor_ai connector), that
  only works once real ad accounts with real billing exist, and I won't
  push budget/spend changes without you confirming the specific number
  first.
- **Create new social accounts.** Instagram, TikTok, and LINE Official
  Account all need to be created and verified by you (or the VA, once
  hired) — I can't do that from here.

## What's genuinely automatable right now

- **Email.** Resend (already wired up for LEXIS's own transactional
  email this cycle) can send real outreach or drip sequences once you
  give me actual recipients — this is not automatic prospecting, it's
  automatic sending once a list exists.
- **Partner/lead discovery.** Apollo.io is connected and can search for
  real contacts at Thai schools, language centers, and youth
  organizations, feeding directly into the LEXIS Community partner
  outreach that PARTNER-CODES.md already supports end-to-end (a Stripe
  promo code is the entire onboarding mechanism, no engineering work
  needed once a partner says yes). Apollo searches consume paid credits,
  so I'd run this only once you say go, not preemptively.
- **Cross-posting, once accounts exist.** Zapier is connected and can
  wire up "post to X, then also post to Y" once real Instagram/
  Facebook/TikTok accounts exist to post to. Not useful to configure
  before those accounts exist.
- **Ad platform management, once ad accounts exist.** Windsor_ai can
  read performance and push campaign/budget/bid changes across Meta,
  Google, TikTok, and Bing Ads, but only once real ad accounts with
  billing are set up — and I'd confirm every specific spend change with
  you rather than adjusting budget autonomously.

## What needs a human — the VA task list

Everything below is real, concrete, repeatable work, not busywork:

1. **Create and run the social accounts.** Instagram, TikTok, and a LINE
   Official Account, using the brand kit (`brand-kit/README.md`, PR #78)
   for avatars/bios/voice. Post a regular cadence using the ad copy in
   that same kit as a starting point, not a script to repeat verbatim.
2. **Launch and manage paid ads**, once you've approved a real budget —
   Meta and TikTok ads targeting Thai students/young professionals are
   the obvious first channel given the product's actual audience.
3. **Partner outreach for LEXIS Community** — schools, youth
   organizations, language centers. The mechanism already works
   (PARTNER-CODES.md); what's missing is someone actually reaching out,
   following up, and closing the first few.
4. **Respond to `privacy@learnwithlexis.com`** and any social DMs —
   currently reaching you directly with no triage layer.
5. **Basic reporting** — a weekly check of Stripe (signups, revenue) and
   whatever social/ad platforms are live, summarized simply. Not
   dashboard-building, just a regular human glance so nothing silently
   drifts.

## VA job brief (ready to post)

**Role:** Part-time Marketing & Growth VA — LEXIS (learnwithlexis.com)

**About:** LEXIS is a voice conversation partner for Thai speakers
practicing English and English speakers practicing Thai — talk out loud,
get gentle real-time corrections. Free 15-minute trial, ฿199/week or
฿599/month after that.

**What you'll do:**
- Set up and run LEXIS's Instagram, TikTok, and LINE Official Account
  presence (brand assets and starting copy provided).
- Help launch and monitor paid social ads once budget is approved.
- Reach out to Thai schools, language centers, and youth organizations
  about the LEXIS Community partner program.
- Handle incoming inquiries via a shared inbox.
- Send a simple weekly update on what was posted, what ran, and what
  came in.

**What we're looking for:**
- Comfortable posting/managing Instagram, TikTok, and LINE for a
  business, ideally with a Thai youth/education or SaaS audience.
- Native or fluent Thai, comfortable working in English too (the
  product and most of this codebase's documentation are in English).
- Self-directed — this is a remote, async, part-time role; you'll get a
  brand kit and a task list, not daily supervision.
- Bonus: any experience with Meta/TikTok Ads Manager directly.

**Hours / pay:** Not specified here on purpose — that's a real decision
for you to make and post yourself, not something to guess at on your
behalf.

**Where to post this** (real platforms fitting a Thailand-based, remote,
part-time hire — not an exhaustive list, just a reasonable starting set):
- OnlineJobs.ph — despite the name, widely used across Southeast Asia
  including Thailand for exactly this kind of remote marketing VA role.
- JobsDB Thailand / JobThai — mainstream Thai job boards if you'd rather
  hire more formally/locally.
- Upwork — for a contractor relationship instead of an ongoing hire.
- A direct post in a relevant Facebook group (Thailand digital
  marketing/VA communities exist and are active) — often faster and
  cheaper than a formal board for a part-time role like this.

## Suggested order, once you're back

1. Skim the interface redesign (PR #77, merged) and the brand kit
   (PR #78) — say if anything needs adjusting before it's the face of
   any outreach.
2. Decide the VA question: hire, or handle growth yourself for now. If
   hiring, the brief above is ready to post as-is or edited first.
3. Once there's a real person or a real ad budget, tell me and I'll
   actually wire up the Zapier cross-posting / Windsor_ai ad management
   pieces above rather than leaving them as descriptions.
4. Separately: the Netlify account audit (delivered in this same
   session) found a live-but-non-converting lead form on
   `digital-renaissance.tech` and a handful of half-finished products
   with real domains attached (ClearMark, `claude-university`). Worth a
   look when you have a minute — that's a different kind of "stone
   unturned" than LEXIS's own growth, but it was explicitly asked for.
