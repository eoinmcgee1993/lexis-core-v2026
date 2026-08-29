# LEXIS launch action plan

Written 26 Aug 2026, for the question "it's finished, where do I start?"

The product is built, deployed, and taking payments. Nothing below is
engineering. It is the ordered list of things that have to happen for
anyone to actually find it, and an honest read on which of them you
should do yourself versus pay someone else to do.

Read §1 and §2. Skip to §5 if you already know you want to outsource.

---

## 0. The single most important thing to understand

**You have zero distribution.** Not "a little". Zero. No social
accounts exist. No ads have run. No partner has been contacted. Nobody
outside this project knows the product exists.

That is not a criticism, it is just the actual starting position, and it
matters because it determines the order of everything else. The
temptation when overwhelmed is to keep polishing the product. Do not.
The product is further along than the distribution by a wide margin, and
more product work right now makes that gap worse, not better.

The first real goal is not revenue. It is **ten people who are not you
using it and telling you what happened.** Everything in Week 1 below
serves that.

---

## 1. Week 1: prove someone wants it

Nothing here costs money. All of it is doable in a few evenings.

### 1.1 Use it yourself, as a stranger would
Sign up fresh, on your phone, on mobile data, in a browser you have
never signed into. Take the whole trial. Write down every moment you
hesitated. You are the only person who can do this without briefing
someone first, and it is the cheapest bug-finding hour available.

### 1.2 Get ten real people to try it
Not a launch. Ten people, individually, by message. Friends, family, ex
colleagues, anyone learning English or Thai, anyone who teaches either.
The `OUTREACH-DRAFTS.md` file has 52 drafts you can pull from, but for
this step personal beats polished every time.

Ask each one the same three questions afterwards:
- Where did you get confused?
- Would you pay ฿199 a week for this? If no, what would you pay?
- Who else do you know who should try it?

Ten answers to those three questions is worth more than any analytics
dashboard you could build this month.

### 1.3 Set up the accounts
Instagram, TikTok, and a LINE Official Account, using `brand-kit/`.
Facebook page if you want it, but LINE matters more for a Thai audience
than Facebook does now. Creating them is maybe an hour total. Do not
start posting yet; just claim the handles before someone else does.

### 1.4 Read the analytics you already have
**Correction to an earlier version of this plan, which said there was no
analytics: that was wrong.** LEXIS has had first-party analytics since
before launch — `frontend/src/lib/analytics.js` posts to
`/api/analytics/event`, and the events land in the `analytics_events`
table in Supabase. It tracks `pageview`, `signup_completed`,
`checkout_started`, `checkout_completed`, `session_connected` and
`plan_cancelled`. No third-party script, no cookies, nothing to switch
on. Do not add Vercel Analytics; you would be paying to duplicate it.

So the step is not "turn it on", it is "go and look". As of 28 Aug 2026
it says:

| | |
|---|---|
| Landing-page sessions (19–28 Aug) | **105** |
| Accounts created | **5** |
| Practice sessions actually connected | **2** |
| Checkouts started | **0** |
| Checkouts completed | **0**, ever |

Daily sessions are also trending down, not up: 19, 21, 9, 6, 10, 9, 17,
10, 3, 3.

That changes the advice in this document more than anything else in it.
The problem is not that you cannot see the funnel. The problem is that
the funnel is visible and almost nobody is entering it — 105 visits
produced 5 accounts and not one attempt to pay. Traffic is the
constraint, and no amount of landing-page tuning fixes a denominator of
105. That is what §1.1 and §2.1 are for.

Query it yourself any time:

```sql
select event_name, count(*) events, count(distinct session_id) sessions
from analytics_events
where created_at > now() - interval '7 days'
group by 1 order by 2 desc;
```

---

## 2. Weeks 2 to 4: find one channel that works

Do **not** run five channels badly. Pick the two below with the best odds
and give them a real month.

### 2.1 The highest-odds channel: partners, not ads
`PARTNER-CODES.md` already works end to end. A Stripe promo code is the
entire onboarding mechanism, so a language school can be live the same
day it says yes, with zero engineering.

This is your best channel and it is the one you are least likely to
choose, because it involves talking to people. Target: language centres,
tutoring schools, and university English departments in Chiang Mai and
Bangkok. Ten conversations. One yes gives you a cohort of real users at
once instead of one at a time.

Why this beats ads at your stage: a school's endorsement carries trust
you cannot buy, and their students are exactly the audience. Ads spend
money to reach strangers who have no reason to believe you yet.

### 2.2 The second channel: organic short video
TikTok and Reels, Thai language, showing the actual product. A 20-second
clip of someone speaking badly, being gently corrected, and speaking
better is the entire pitch and it demos itself. This is the format your
product is luckiest in, because the thing it does is inherently
watchable.

Post 3 to 5 a week for a month. Most will do nothing. That is normal and
is not a signal to stop before roughly 20 posts.

### 2.3 What to deliberately not do yet
- **Paid ads.** Not until `UNIT-ECONOMICS.md` is filled in with your real
  per-minute Realtime cost, and not until you know from §1.2 what people
  actually say the product is worth. The funnel is measured — that part is
  fine. The risk is the other end: a 15-minute free trial with no card can
  cost several dollars per signup, and the ฿599 plan currently promises
  "unlimited" practice with no cap in the code. Buying traffic into that
  scales a loss with perfect visibility.
- **Google/SEO effort.** The pages are already built and correct. SEO
  compounds over months regardless of what you do next; it will not
  produce your first customer.
- **More product features.** See §0.

---

## 3. What to measure, and the only numbers that matter

Weekly, five minutes, in a note on your phone:

| Number | Where | Why it matters |
|---|---|---|
| Landing page visitors | `analytics_events`, `pageview` | Denominator for everything else. |
| Trial starts | Supabase `profiles` count | Did the page convince anyone? |
| Trials that finished the 15 min | Supabase | Did the product hold them? |
| Paid conversions | Stripe | The only number that is revenue. |
| Cancellations | Stripe | The one that tells you it did not stick. |

If trial starts are low, the landing page is the problem. If trials start
but do not finish, the product is the problem. If trials finish but do
not convert, the price or the paywall moment is the problem. Those three
have completely different fixes, which is why the split matters more than
any single total.

---

## 4. The honest risk list

Things that could sink this that are not "not enough marketing":

1. **Unit economics are unverified.** Every minute of conversation costs
   you real OpenAI Realtime money. At ฿599/month with no stated fair-use
   ceiling, one heavy user could cost more than they pay. Work out the
   per-minute cost and the break-even minutes **before** you scale
   traffic, not after. This is the single biggest financial risk and it
   gets worse with success, not better.
2. **The name.** LEXIS collides with LexisNexis, a large legal-data
   company with lawyers. Worth twenty minutes of a Thai trademark
   search before you print anything or buy a brand.
3. **You are the only person who can answer support.**
   `privacy@learnwithlexis.com` reaches you directly and nowhere else.
4. **No self-serve account deletion**, under a policy that invokes PDPA
   and an audience that includes minors. A parent asking you to delete a
   child's data and getting no reply is the complaint that escalates.

Items 1 and 4 are the ones I would not let sit.

---

## 5. Should you outsource the whole thing?

You said this is not your forte and it is your biggest flaw. Taking that
at face value, here is the straight answer.

### Outsource: yes, mostly. But not yet, and not all of it.

**Hire for execution, not for strategy.** A VA or agency can run
accounts, post consistently, reply to DMs, and manage ad campaigns. That
is real work, it is repeatable, and it does not need you.

**Do not outsource the first ten conversations.** §1.2 and §2.1 need
someone who can answer "why did you build this?" and actually care about
the answer. A ฿15,000/month VA cannot sell a school on a product they
started using yesterday. Founder-led selling is genuinely different at
this stage, and it is also how you learn what the product is really for.

The sequencing that follows from that:

| When | What | Who |
|---|---|---|
| Now | §1 in full: ten users, accounts claimed, analytics **read** | You. Roughly two evenings. |
| Now | Measure per-minute Realtime cost — `UNIT-ECONOMICS.md` has the method and the model | You. Half an hour. |
| Now | Decide the fair-use cap, and drop "unlimited" from the pricing copy in the same deploy | You, then me |
| Week 2 | Partner outreach, first ten schools | You. This is the part that does not delegate. |
| Week 3+ | Hire the VA. Brief is already written and ready to post. | `GROWTH-DELEGATION-BRIEF.md` |
| Week 4+ | VA runs daily posting, DMs, and reporting | Them |
| Once a channel shows signs of life | Ads, with a real budget | Them, your budget approval |

### What it costs, roughly

- **Part-time Thai marketing VA:** commonly ฿15,000 to ฿30,000/month for
  part-time remote in Thailand. Treat those as a starting range to
  sanity-check quotes against, not a quoted rate; verify against current
  listings on the boards in the delegation brief when you post.
- **Agency:** materially more, and generally poor value at pre-revenue,
  because you are paying for account management on a budget too small to
  manage. Skip until there is a channel worth scaling.
- **Ad budget:** don't commit one until §1.4 and §4.1 are done.

### The brief is already written

`GROWTH-DELEGATION-BRIEF.md` has a ready-to-post job description, the
task list, and the platforms to post it on. It needs one thing from you
that I deliberately left blank: **hours and pay.** That is a real
decision with your money and I would not guess it on your behalf.

---

## 6. If you do exactly one thing this week

Get ten people to take the trial and answer the three questions in §1.2.

Everything else in this document is downstream of knowing whether people
want it. You cannot outsource finding that out, it costs nothing, and
until you know the answer, every other decision here is a guess.
