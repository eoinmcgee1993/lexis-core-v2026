# LEXIS unit economics

28 Aug 2026. Model lives in `scripts/unit-economics.mjs` — run it, don't
trust a table that has gone stale:

```
node scripts/unit-economics.mjs --rate=0.20 --fx=36.5
```

## The one number I cannot give you

**The blended USD cost of one minute of Realtime conversation.** I will not
quote a per-minute price I have not verified, and there is no honest way to
derive it from the repo: the Realtime API bills audio *tokens*, in and out,
not wall-clock minutes. The per-minute figure depends on how much of each
minute is LEXIS speaking, how much is the learner speaking, and how much is
silence — which is a property of your users, not of the price list.

Get it in about five minutes:

1. OpenAI dashboard → Usage → Cost, filtered to a date range.
2. Run this against production Supabase for the same range:
   ```sql
   select sum(duration_seconds)/60.0 as minutes
   from usage_logs
   where created_at between '<start>' and '<end>';
   ```
3. Divide. That is your real `--rate`, inclusive of the transcription and
   text calls riding along with it.

Everything below is a sweep across plausible rates because of that gap. Find
your row; ignore the others.

## The headline

At **$0.20/min**, the Monthly Immersion plan breaks even at **2.5 minutes of
practice per day**. Above that, every additional minute loses money, with no
ceiling.

| USD/min | Weekly ฿199 break-even | Monthly ฿599 break-even |
|---|---|---|
| 0.05 | 99 min/period (14.1/day) | 309 min/period (10.1/day) |
| 0.10 | 49 min (7.1/day) | 155 min (5.1/day) |
| 0.15 | 33 min (4.7/day) | 103 min (3.4/day) |
| 0.20 | 25 min (3.5/day) | 77 min (2.5/day) |
| 0.30 | 16 min (2.4/day) | 52 min (1.7/day) |
| 0.45 | 11 min (1.6/day) | 34 min (1.1/day) |
| 0.60 | 8 min (1.2/day) | 26 min (0.8/day) |

Net of Stripe at 3.65% + ฿11 and ฿36.5/USD. **Verify the Stripe number on
your own dashboard** — I used a plausible Thailand card rate, not one I read
off your account, and it moves every figure in the table.

## The structural problem, which is not the price

Three facts, each verified in the code:

1. **`backend/app.mjs:272-283`** — `requireEntitlement` reads
   `isPaid = subscription_status === 'active'`, and when that is true it
   short-circuits *every* usage check. `max_allowed_seconds` is never
   consulted for a paying user. **There is no fair-use ceiling in the
   product.**
2. **`frontend/src/content/facts.js:66`** — the pricing copy promises
   "**unlimited** voice practice in English or Thai". That is a commercial
   commitment, in writing, on a live page, in two languages.
3. **`profiles.seconds_used` is incremented for paid users too** —
   `/api/heartbeat` sits behind the same `requireEntitlement`, adds 30
   seconds per beat, and writes a row to `usage_logs`. So consumption *is*
   measured; it is simply not *bounded*.

Put together: one motivated user on a ฿599 month can consume an unbounded
amount of Realtime audio, and the copy says they may. At $0.20/min, a user
practising an hour a day costs **$366/month** against $15.51 of net revenue.
That is not a tail risk you price for; it is a single user who ends the
month.

This is the finding. The price is defensible at ordinary usage. The absence
of a cap is not.

## The free trial is your real acquisition cost

> **Superseded 29 Aug:** the trial is now **15 minutes** — see "What
> shipped" below. The table in this section is the analysis that motivated
> that change and is left at 30 minutes deliberately, because rewriting it
> would destroy the reasoning. Halve every figure in it for today's trial.

Every signup got 30 minutes with no card on file (`TRIAL.minutes`;
`max_allowed_seconds = 1800` on all five production rows).

| USD/min | Cost per trial | Per 100 signups | Conversion needed to break even |
|---|---|---|---|
| 0.05 | $1.51 | $151 | 9.7% |
| 0.10 | $3.01 | $301 | 19.4% |
| 0.20 | $6.01 | $601 | 38.7% |
| 0.30 | $9.01 | $901 | 58.1% |
| 0.45 | $13.51 | $1,351 | 87.1% |

The conversion column is a **floor**, not a target: it assumes the converted
user then costs nothing, which is false. Subtract their own usage from the
same period and the real requirement is higher.

This is the number that decides whether you can buy traffic at all. If your
rate lands near $0.20 and your trial-to-paid conversion is a normal 3–5%,
paid acquisition loses money on contact, before ad spend — which is why
`ADVERTISING.md` gates paid media on this document.

## Monthly is the binding plan, not weekly

| Plan | Revenue per entitled day |
|---|---|
| Weekly ฿199 | ฿28.43 |
| Monthly ฿599 | ฿19.68 |

The monthly plan yields **31% less per entitled day**. (The pricing page's
"about 25% less" is also correct — it compares against four weeks, not
against a calendar month. Both are true; this one is the one that matters
for cost.)

Consequence: **any fair-use cap derived from the weekly plan will lose money
on the monthly one.** Set the cap from the monthly plan, or set a per-plan
cap.

## What the production data does and does not tell you

Measured, 28 Aug 2026, project `ucgoqgwopnxiktlxlyhc`:

- **5 accounts.** 3 `free_trial`, 1 `expired`, 1 `past_due`.
- **Zero users have ever completed a checkout.** `analytics_events` has
  0 `checkout_started` and 0 `checkout_completed`, ever.
- **4,800 seconds** of billed audio total across all accounts — 80 minutes,
  lifetime.
- Heaviest real hour observed: **17.5 minutes** of talk in one hour by one
  user.

So: **there is no paid-usage data, because there are no paid users.** Every
usage assumption in this model is therefore an assumption. The correct
response to that is not a better forecast — it is a cap, which makes the
forecast unnecessary.

Two data caveats I will not paper over:

- `usage_logs` only starts 15 Aug 2026 and holds 3,000 of the 4,800
  measured seconds. The `INSERT` into it was added to `record_heartbeat`
  after launch; earlier heartbeats incremented `seconds_used` without
  leaving a row. Use `profiles.seconds_used` for lifetime totals and
  `usage_logs` only for windowed rate calculations after 15 Aug.
- The `past_due` account shows `sessions_count = 0` alongside
  `seconds_used = 1800`, which cannot both be true of organic usage. It
  looks seeded rather than accumulated. I have excluded it from the
  behavioural figures above and I would not trust it.

## Recommendation

**1. Ship a fair-use cap before you spend anything on acquisition.** Not a
price change — a cap. Concretely: keep `max_allowed_seconds` meaningful for
`active` subscribers instead of short-circuiting it, refill it per billing
period, and set it from the monthly plan's break-even at your measured rate,
targeting a 70% gross margin:

| USD/min | Monthly cap @70% margin | Per day |
|---|---|---|
| 0.10 | 46 min/month | 1.5 |
| 0.15 | 31 min/month | 1.0 |
| 0.20 | 23 min/month | 0.8 |

Those are uncomfortably small, and that discomfort is the actual signal: at
$0.15+/min this price point does not support a generous cap. Either the rate
has to come down (a cheaper model for part of the session, shorter default
sessions) or the price has to go up. **Do not resolve that by hoping nobody
uses it.**

**2. Change the word "unlimited" in the same deploy as the cap.** Shipping a
cap while the page still promises unlimited practice is a refund liability
and, in Thailand, a consumer-protection one. `facts.js` is the single source
— `PRICING_DESCRIPTION_EN` and `PRICING_DESCRIPTION_TH` both carry it, so
both languages change together.

**3. Measure your rate this week.** Steps at the top of this file. Until you
have it, every number here is a range, and ranges do not make decisions.

**4. Reconsider the 30-minute trial once the rate is known.** ~~If it lands
near $0.20, a 30-minute uncarded trial costs $6 per signup and is your
largest single line item.~~ **Done** — the trial is 15 minutes as of 29 Aug,
halving that line item to roughly $3 per signup at $0.20/min. A card-on-file
trial would cut it further and pre-qualify the funnel, but that is a
conversion trade-off worth making only with the measured rate in hand.

---

# What shipped (29 Aug 2026)

Recommendations 1 and 4 are now live. Recommendation 2 was deliberately
deferred — see the warning below.

## The fair-use cap

`requireEntitlement` no longer short-circuits on `isPaid`. Active
subscribers are now bounded per billing period:

| Tier | Default ceiling | Env var |
|---|---|---|
| Weekly | 180 min/period (~26 min/day) | `FAIR_USE_WEEKLY_MINUTES` |
| Monthly | 720 min/period (~24 min/day) | `FAIR_USE_MONTHLY_MINUTES` |

Set either to `0` to disable that tier's cap. **These defaults bound the
loss; they do not make it positive.** At $0.20/min a subscriber sitting at
the monthly ceiling costs $144 against $15.51 of net revenue. The point is
that $144 is now a known worst case instead of an unbounded one. Tighten
them to the "cap @70%" column above once you have measured your rate — it
is an env var, not a deploy.

Mechanics worth knowing:

- Two new columns, `period_seconds_used` and `period_started_at`.
  `seconds_used` is untouched, because it is the trial's lifetime counter
  and what the app renders as "left in trial".
- **The window is time-based and self-healing**, rolled forward inside
  `record_heartbeat` and re-checked in `requireEntitlement`. It is
  deliberately *not* reset by a Stripe invoice webhook: if that webhook
  were ever not enabled in the dashboard, a webhook-driven reset would
  silently cap every paying subscriber forever after their first period.
- 30 days, not a calendar month, in both the SQL and the JS — they have to
  agree or a user gets blocked by one after the other has rolled.
- Hitting the cap returns `FAIR_USE_REACHED`, not `TRIAL_EXHAUSTED`, and
  the UI drops the "View Pricing" button for it. Telling someone who
  already pays to upgrade is the obvious way to get this wrong.

## The trial: 30 → 15 minutes

`TRIAL.minutes` is 15 and the column default is 900. **Existing rows keep
their 1800** — this is a `DEFAULT` change, not a backfill, so nobody
mid-trial lost time they had already been promised. All copy in both
languages regenerates from `TRIAL.minutes`, so EN and TH moved together.

At $0.20/min this halves the acquisition cost per signup from ~$6.01 to
~$3.01, and roughly halves the conversion rate needed to recover it.

## ⚠️ The copy still says "unlimited"

`PRICING_DESCRIPTION_EN` and `PRICING_DESCRIPTION_TH` still promise
"unlimited voice practice" on live pages, in two languages, while the
backend now enforces a ceiling. **This was a deliberate call to defer, not
an oversight** — but it is a real refund and consumer-protection exposure
in Thailand for as long as it stands, and it is the single loose end here.

The in-app usage meter *was* changed, because leaving it reading
"unlimited" on the same screen that blocks you is a guaranteed support
ticket. It now shows minutes remaining this period. The marketing copy on
the pricing and landing pages is what remains.

Fixing it is a one-line change in `frontend/src/content/facts.js` — both
descriptions read from the same file, so both languages change together.

## Still outstanding

1. **Measure your per-minute rate.** Method at the top of this file. Every
   number here is a range until you do.
2. **Then tighten the two env vars** to the margin you actually want.
3. **Resolve the "unlimited" wording**, above.
