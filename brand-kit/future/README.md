# Future: partner and closer (Digital Renaissance)

Split out of the LEXIS marketing session on 1 Oct 2026 at the owner's
request, so Future's work lives in one place. This branch (`future-partner`)
is the home for it; the LEXIS branch no longer carries these files.

## Who she is and what she does

Future is the owner's (Eoin's) partner in Thailand. Three jobs:

1. **LEXIS referrals.** Code `FUTURE`, link `learnwithlexis.com/th?ref=future`.
2. **Cold email outreach.** Eoin gives her lead lists of up to 500 businesses
   at a time. Names and details auto-fill from the list (mail merge); she
   spot-checks 2–3 emails before sending. Max 50/day for deliverability,
   one follow-up after 3–4 days, then stop.
3. **Closer for Digital Renaissance's own systems** (separate from LEXIS),
   which start at **$5,000 USD per month**. The systems need no one to talk
   to anyone, to buy or to use, so closing is **written only: email or chat,
   no calls, no meetings**.

## Her terms

| Source | Her cut | Paid |
|---|---|---|
| LEXIS | 60% of what customers actually pay, 1–28 Oct 2026; 20% after | 5th of each month by PromptPay, for the previous month |
| LEXIS bonuses (proposal) | ฿300 at 10 paying customers/month, ฿1,000 at 25, ฿1,000 per organisation with 5+ paid seats | same |
| Digital Renaissance | 30% of each month the client pays, for the client's first 3 months ($1,500 ≈ ฿54,750/month, $4,500 ≈ ฿164,250 per client). Starting rate, can rise. | after the client pays each month, **schedule not yet set by Eoin** |

The ฿50 LEXIS Community add-on never counts toward her share.
Self-purchases or family purchases don't count. Refunds/chargebacks don't count.

## Stripe (live account acct_1T1zS9F1FdEsYK5E)

| Code | What | Notes |
|---|---|---|
| `FUTURE` | coupon rCjUURW2, 50% off once | expires 23 Oct 2026. Plan: replace with 10% off from 24 Oct, **owner to confirm** |
| `FUTUREPASS` | free 30-day pass, max 1 redemption | for Future herself to try LEXIS |

A reminder Routine `trig_011sKSEGJUvwM5k1zhVnQJv3` fires on 24 Oct into the
original LEXIS session about swapping FUTURE to 10%.

## Files here

| File | What |
|---|---|
| `Future's-Future.pdf` / `futures-future-th.html` | 9-page motivational doc (Thai): letter, 60%→20% offer, $5k systems + 30%×3 months, codes, closer role (written-only), cold-email page, 4-week plan, rules + signature |
| `คู่มือการทำงาน-Future.pdf` / `future-manual-th.html` | 9-page instructions manual (Thai): day one, daily routine, LEXIS referral links + FAQ, cold-email steps, reply handling + written close, tracking sheet + daily report, payouts, security, when to ask Eoin |
| `ภาพอนาคตของ-Future.pdf` / `future-clarity-th.html` | 8-page clarity questionnaire (Thai): 29 questions on strengths, goals, her own business ideas, work with DR, obstacles, first steps, plus a joint 30-day plan page |
| `โปรแกรมพาร์ตเนอร์-Future.pdf` / `future-partner-th.html` | LEXIS partner programme (Thai) |
| `Future-partner-programme-EN.pdf` / `future-partner-en.html` | same in English, for Eoin, includes the cost of 60% |
| `digital-renaissance-logo.png` | logo used on the covers |

## How the PDFs are built

HTML is self-contained (fonts and logo embedded as data URIs). Render with
playwright-core from `frontend/node_modules`, Chromium at
`/opt/pw-browsers/chromium`, `page.pdf({preferCSSPageSize:true,
printBackground:true})`. Each `.pg` section is one A4 page with
`overflow:hidden`, so check content clears the `.foot` footer after edits.
Thai headings need explicit `<br>` where a line must break.

## Rules that apply to everything she says

- LEXIS is a **virtual** conversation partner (คู่สนทนาเสมือน), never a person or teacher.
- LEXIS prices are one-off passes: ฿199 for 7 days, ฿599 for 30 days. Never "per month" or "subscription".
- Never target language schools or tutors (competitors).
- No promised results, no fake reviews or numbers.
- DR prices and terms only as Eoin sets them; she never discounts, never takes payment or card details herself.
- Lead lists are Digital Renaissance's, deleted after use (PDPA). Every email names DR and offers an opt-out.

## Open items for the owner

1. Work email account for her (ideally on a separate domain from the main one).
2. Approved DR email template + follow-up (needs a short description of the systems).
3. Tracking sheet.
4. DR commission payout schedule.
5. Confirm FUTURE → 10% after 23 Oct.
6. Send her the PDFs.
7. Optional: light (printable) version of the questionnaire.

## Hiring ad for this role (`hiring/`)

Social ad to recruit a second partner/closer, 1080×1350 (4:5) PNGs, English and
Thai: `hiring-<lang>-single.png` is the all-in-one post,
`hiring-<lang>-carousel-1..6.png` the carousel (cover + quote, the job, pay,
what 2–3 clients would pay, you/we give you, how to apply). Rebuild with `node hiring/build.mjs <fonts.css>`,
where the CSS is Google Fonts' Prompt + Fraunces with the woff2 URLs inlined as
data URIs (the script's header comment says why). The build warns if any text
overflows a slide.

Pay shown is the standing rate (LEXIS 20%, DR 30% × first 3 months), not
Future's 60% launch window. Applications are "send us a message on this page",
so the ad needs no email address.

### Video version (`hiring/hiring-video-<lang>.mp4`)

9:16 (1080×1920), 33 s, for Reels / TikTok / Stories. It features LEXIS:
the landing page's real hero clip plays inside a phone showing the real
landing page (`hiring/lexis-site-<lang>.png`), with her voice and burned-in
captions from the clip's own `.vtt`, then the Digital Renaissance offer, the
2–3 clients table, what we give, and how to apply. Only her first 8.3 s is
used; the rest is silent so a music track can be added in the app.
Rebuild with `node hiring/video.mjs <fonts.css>` (about 2 min per language;
`PREVIEW=2,7,15 node …` renders stills of those seconds instead).

### LEXIS reads the ad (`hiring/hiring-lexis-reads-en.mp4`)

9:16, 38 s, lip-synced. LEXIS presents the Digital Renaissance role in her own
voice (ElevenLabs eleven_v4, "Sarah – Warm & Conversational", the voice of
the earlier LEXIS reels), with word-timed captions and fact cards that change
as she says each point. Her face is her real landing-page hero footage,
lip-synced to the new read with MuseTalk v1 run locally on CPU (free; paid
lip-sync was out of credits on 8 Oct 2026). Rebuild with
`node hiring/reads.mjs <fonts.css> en`; inputs and how they were made are in
`hiring/reads.mjs`'s header.

**The role is Digital Renaissance's only** (owner, 8 Oct 2026): the LEXIS
tutor is a separate project, so no ad here asks the hire to sell LEXIS or puts
a LEXIS price or commission next to the $5,000. LEXIS appears only as the
presenter.

Not done: a Thai read needs ~600 ElevenLabs credits for the voice track
(voice "Aom"), then the same lip-sync run.
