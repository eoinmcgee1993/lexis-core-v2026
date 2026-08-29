# LEXIS advertising

Written 27 Aug 2026. Extends `brand-kit/README.md` §6, which holds the
original short ad copy, and `OUTREACH-DRAFTS.md`, which holds 52 one-to-one
outreach drafts. This file is the paid-media set: copy written to each
platform's own field limits, plus which creative goes with it.

**Nothing here has been published or spent against.** No ad account is
connected, no budget is set. This is the asset, not the campaign.

## Ground rules these were written under

1. **Every claim is a verified product fact**, taken from
   `frontend/src/content/facts.js`: a free 15-minute trial, no card required,
   ฿199/week or ฿599/month after that.
2. **No volume promise.** Nothing says "unlimited", "as much as you want" or
   "talk all day". The product has no stated fair-use ceiling and a paid ad is
   the worst possible place for a customer to discover one. See
   `LAUNCH-ACTION-PLAN.md` risk 1.
3. **No outcome promise.** Nothing claims fluency, a score, a job, or a
   timeframe to any of them. Those need evidence nobody has yet.
4. **No superlatives and no social proof.** No "best", "#1", "trusted by",
   no invented user counts.
5. **Ad language matches the landing page.** The CTA is "Try It Free" in
   English and "ลองใช้ฟรี" in Thai, the same words the page uses. Ad-to-page
   copy match is a real measured conversion factor, not a style preference.

## Before you spend anything

Three things from `LAUNCH-ACTION-PLAN.md` that gate paid media, in order:

- **Unit economics.** See `UNIT-ECONOMICS.md`. This is now the hard gate,
  not analytics. At $0.20/min of Realtime audio the free trial costs about
  $6 per signup and the ฿599 plan breaks even at 2.5 minutes of practice a
  day, with no fair-use cap in the code to stop it. Until you have measured
  your real per-minute rate, paid acquisition may lose money on contact,
  before a single baht of ad spend.
- **Analytics.** Already built, contrary to an earlier version of this file
  that said there was none — that was wrong. `frontend/src/lib/analytics.js`
  posts first-party events to `/api/analytics/event` and they land in the
  `analytics_events` table: `pageview`, `signup_completed`,
  `checkout_started`, `checkout_completed`, `session_connected`,
  `plan_cancelled`. The funnel is measurable today. What it currently
  measures is 105 sessions, 5 accounts, and **zero checkouts, ever** — so
  the landing page is not the bottleneck you are buying your way past.
- **The auth wall.** ~~Tapping "Try It Free" lands a brand-new visitor on a
  **Sign in** form.~~ **Fixed** in PR #90 — `AuthPage.jsx` now opens on
  "Create your account" for anyone without a prior sign-in on the device,
  and only defaults to sign-in for returning visitors. No longer a gate.

---

## Meta (Facebook / Instagram) feed

Primary text is truncated at roughly 125 characters on mobile; headline at
roughly 40; description at roughly 27. Everything below is inside those.

### EN-1 — the core one
- **Primary:** You already know the words. Saying them out loud is the hard part. LEXIS is a voice partner you can practise with.
- **Headline:** Practise speaking, out loud
- **Description:** Free 15-min trial
- **Creative:** `post-a-words.png`

### EN-2 — against courses
- **Primary:** You don't need another course. You need someone to talk to. Talk to LEXIS out loud and get gentle corrections.
- **Headline:** A partner, not a course
- **Description:** No card required
- **Creative:** `post-a-course.png`

### EN-3 — the trial
- **Primary:** Fifteen minutes, free, no card. Find out whether you can actually hold a conversation in English.
- **Headline:** Thirty free minutes
- **Description:** Then ฿199/week
- **Creative:** `post-b-find.png`

### TH-1
- **Primary:** คุณรู้คำศัพท์อยู่แล้ว แค่ยังไม่ได้พูดออกมา ฝึกพูดกับ LEXIS ได้ทุกเมื่อ
- **Headline:** ฝึกพูดออกเสียงจริง
- **Description:** ทดลองฟรี 15 นาที
- **Creative:** `post-b-th.png`

### TH-2
- **Primary:** บทสนทนาแรกของคุณไม่ควรเป็นกับคนแปลกหน้า ฝึกกับ LEXIS ก่อน
- **Headline:** ฝึกก่อนใช้จริง
- **Description:** ไม่ต้องผูกบัตร
- **Creative:** `post-d-th.png`

---

## Google Responsive Search Ads

Headlines max 30 characters, descriptions max 90. Google mixes them, so each
headline has to stand alone and none may contradict another.

### Headlines
1. Practise Speaking English
2. Speak English Out Loud
3. A Real Conversation Partner
4. Free 15-Minute Trial
5. No Card Required
6. Practise English By Talking
7. Speaking Practice, Any Time
8. English And Thai Practice
9. Talk, Don't Type
10. Gentle Live Corrections

### Descriptions
1. Talk out loud and get gentle corrections as you speak. Free 15-minute trial.
2. Not a course. A voice partner you can practise a real conversation with.
3. Reading English is not speaking English. Practise the part that is hard.
4. Free 15 minutes, no card. Then ฿199 a week or ฿599 a month.

---

## TikTok

Ad text 12-100 characters. Vertical creative only.

- Reading English is not speaking English. Try 15 minutes free.
- You already know the words. Saying them out loud is the hard part.
- Practise the conversation before you have to have it. Free trial.
- **TH:** คุณรู้คำศัพท์อยู่แล้ว แค่ยังไม่ได้พูดออกมา ทดลองฟรี 15 นาที
- **Creative:** `story-en.png`, `story-th.png`

---

## Creative inventory

Twelve square posts across four layouts, in `brand-kit/templates/`. Rotate
layouts in a feed; six black squares in a row reads as a wall.

| Layout | Files | Character |
|---|---|---|
| A, photo-led | `post-a-words`, `post-a-course`, `post-a-swim` | Full-bleed portrait, headline low-left. Strongest scroll-stopper. |
| B, split | `post-b-reading`, `post-b-find`, `post-b-th` | Photo over solid black. For short lines. |
| C, type-led | `post-c-before`, `post-c-room`, `post-c-th-ask` | Black field, small circular portrait. Quiet. |
| D, light | `post-d-textbook`, `post-d-stranger`, `post-d-th` | Warm cream, portrait right. Air in the grid. |

Vertical: `story-en.png`, `story-th.png`.

To change any line, edit `LINES` at the top of
`frontend/scripts/images/generate_brand_kit_social.mjs` and re-run it. Never
edit the PNGs.

---

## What is deliberately not here

- **No video.** The single highest-performing format on TikTok and Reels, and
  the one asset this kit cannot generate. It needs a real editing pass.
- **No budget, bid or audience recommendations.** Those depend on numbers
  that do not exist yet. Guessing them would be inventing a media plan.
- **No landing pages per campaign.** Worth building once a channel shows
  signs of life; premature before that.
