# LEXIS advertising

Written 27 Aug 2026. Extends `brand-kit/README.md` §6, which holds the
original short ad copy, and `OUTREACH-DRAFTS.md`, which holds 52 one-to-one
outreach drafts. This file is the paid-media set: copy written to each
platform's own field limits, plus which creative goes with it.

Refreshed 21 Oct 2026. The launch offer is now marked as ending, and an
evergreen set becomes the default from 24 Oct. The analytics events are
corrected, and finished reels are paired with video placements. Starting
audiences are added, labelled as untested.

**Nothing here has been published or spent against.** No ad account is
connected, no budget is set. This is the asset, not the campaign.

## Ground rules these were written under

1. **Every claim is a verified product fact**, taken from
   `frontend/src/content/facts.js`: a free 15-minute trial, no card required,
   then a one-off ฿199 pass for 7 days or ฿599 for 30 days. Nothing renews,
   so no copy may say "/week", "a month" or "per week": that advertises a
   recurring charge (facts.js BILLING).
2. **No volume promise.** Nothing says "unlimited", "as much as you want" or
   "talk all day". Each pass now carries a disclosed fair-use allowance
   (150 minutes a week, 450 a month, from `facts.js`); an ad that implies
   more is a claim the product will contradict. Quote the minutes, or say
   nothing about volume.
3. **No outcome promise.** Nothing claims fluency, a score, a job, or a
   timeframe to any of them. Those need evidence nobody has yet.
4. **No superlatives and no social proof.** No "best", "#1", "trusted by",
   no invented user counts.
5. **Ad language matches the landing page.** The CTA is "Try It Free" in
   English and "ลองใช้ฟรี" in Thai, the same words the page uses. Ad-to-page
   copy match is a real measured conversion factor, not a style preference.
6. **LEXIS is a virtual conversation partner (คู่สนทนาเสมือน).** No line
   calls it, or implies it is, a person, teacher or tutor. No ad mentions,
   compares itself with, or targets tutors or language schools. They are
   competitors.

## Before you spend anything

Three things from `LAUNCH-ACTION-PLAN.md` that gate paid media, in order:

- **Unit economics.** See `UNIT-ECONOMICS.md`. At $0.20/min of Realtime
  audio the free trial costs about $3 per signup (15 minutes). Paid passes
  are now bounded by the fair-use cap, so a heavy user can no longer run a
  pass at an open-ended loss, but the real per-minute rate is still an
  estimate until the OpenAI invoice for a measured period is in.
- **Analytics.** Already built, contrary to an earlier version of this file
  that said there was none — that was wrong. `frontend/src/lib/analytics.js`
  posts first-party events to `/api/analytics/event` and they land in the
  `analytics_events` table. The backend accepts eight event names
  (`ANALYTICS_EVENTS` in `backend/app.mjs`): `pageview`,
  `signup_completed`, `checkout_started`, `checkout_completed`,
  `session_connected`, `plan_cancelled`, `google_signin_started` and
  `result_card_shared`. The last two were added on 3 Oct.
  `google_signin_started` counts taps on Google sign-in. Those accounts are
  created during Google's redirect, so `signup_completed` never fires for
  them. Read it beside `signup_completed`, not added to it: it counts taps,
  not finished accounts. `result_card_shared`
  counts learners posting their result card. The funnel is measurable today.
  On 27 Aug it showed 105 sessions, 5 accounts and **zero checkouts, ever**.
  The landing page was not the bottleneck that paid traffic would fix. Run
  the query under "Link tagging" for the current figures before spending.
- **The auth wall.** ~~Tapping "Try It Free" lands a brand-new visitor on a
  **Sign in** form.~~ **Fixed** in PR #90 — `AuthPage.jsx` now opens on
  "Create your account" for anyone without a prior sign-in on the device,
  and only defaults to sign-in for returning visitors. No longer a gate.

- **Attribution.** Every ad URL must carry UTM tags, or its traffic is
  invisible in `analytics_events` (source capture added 25 Sep 2026; see
  "Link tagging" below).

---

## Launch offer set (ENDS 23 Oct 2026, 23:59 Bangkok)

`LEXIS50`: 50% off the Weekly Pass, ฿99.50 instead of ฿199, 100 uses, ends
23 Oct 2026 at 23:59 Bangkok time (`LAUNCH_OFFER` in `facts.js`). **Pull
every ad in this block when it ends or the uses run out, whichever comes
first.** An ad for a code that no longer works is the fastest way to turn a
click into a complaint. From 24 Oct the **evergreen set below is the
default**: put it in the slots these ads leave.

Once `launchOfferActive()` returns false, the generator stops rebuilding
the `launch-*` PNGs. The old files stay in `brand-kit/ads/` as a record.
They are not for use.

### Meta
- **LN-1 Primary:** Launch week: your first Weekly Pass is half price with code LEXIS50. Start with 15 free minutes, no card.
- **Headline:** Half price launch week
- **Description:** Code LEXIS50
- **Creative:** `ads/launch-en-1080x1350.png`, story `ads/launch-en-story-1080x1920.png`
- **LN-TH Primary:** เปิดตัว LEXIS: ใช้โค้ด LEXIS50 ลด 50% สำหรับ Weekly Pass เริ่มจากทดลองฟรี 15 นาที ไม่ต้องผูกบัตร
- **Headline:** ลดครึ่งราคาช่วงเปิดตัว
- **Description:** โค้ด LEXIS50
- **Creative:** `ads/launch-th-1080x1350.png`, story `ads/launch-th-story-1080x1920.png`

### TikTok
- Launch offer: code LEXIS50 halves your first Weekly Pass. Try 15 min free.
- **TH:** โค้ด LEXIS50 ลด 50% Weekly Pass ทดลองฟรี 15 นาทีก่อน

### Google RSA extra lines
- Headline: Launch Code LEXIS50
- Headline: Weekly Pass ฿99.50
- Description: Launch offer: code LEXIS50 takes 50% off your first Weekly Pass, until 23 Oct.

---

## Evergreen set (default from 24 Oct 2026)

There is no code, no end date and no discount. The offer is the free trial,
which never expires, so nothing here needs pulling on a date. The images
give the pass prices and their fair-use minutes in small print. Every number
on them is read from `facts.js`.

### Meta
- **EV-EN Primary:** Say it out loud. Get it wrong. Say it again. Practise speaking English or Thai with LEXIS: 15 min free, no card.
- **Headline:** 15 minutes free, no card
- **Description:** One-off passes, no renewal
- **Creative:** `ads/evergreen-en-1080x1350.png` (4:5 feed); `ads/evergreen-en-story-1080x1920.png` (Stories, Reels)
- **EV-TH Primary:** ไม่ต้องกลัวพูดผิด พูดออกมาเลย ผิดก็แค่ลองใหม่ ฝึกพูดภาษาอังกฤษกับ LEXIS ทดลองฟรี 15 นาที ไม่ต้องผูกบัตร
- **Headline:** ทดลองฟรี 15 นาที
- **Description:** จ่ายครั้งเดียว ไม่ต่ออายุ
- **Creative:** `ads/evergreen-th-1080x1350.png` (4:5 feed); `ads/evergreen-th-story-1080x1920.png` (Stories, Reels)

Upload each pair as **one** ad, with the 4:5 for feeds and the 9:16 for
Stories and Reels. They share a photo and a headline so the two read as
the same ad.

### TikTok
- Say it out loud. Get it wrong. Say it again. Try LEXIS free for 15 minutes.
- **TH:** ไม่ต้องกลัวพูดผิด ฝึกพูดภาษาอังกฤษกับ LEXIS ทดลองฟรี 15 นาที
- **Creative:** in the TikTok feed, video. See "Video for paid placements"
  below. The 9:16 static is for placements that take an image.

---

## Link tagging

Use these exact tags so the numbers group cleanly. Lowercase, no spaces.

| Where | Link |
|---|---|
| Meta ads | `https://learnwithlexis.com/?utm_source=meta&utm_medium=paid&utm_campaign=evergreen&utm_content=<ad-id>` |
| TikTok ads | `https://learnwithlexis.com/?utm_source=tiktok&utm_medium=paid&utm_campaign=evergreen&utm_content=<ad-id>` |
| Google ads | `https://learnwithlexis.com/?utm_source=google&utm_medium=paid&utm_campaign=evergreen&utm_content=<ad-id>` |
| Instagram bio | `https://learnwithlexis.com/?utm_source=instagram&utm_medium=social&utm_content=bio` |
| Instagram / Facebook / YouTube posts | `https://learnwithlexis.com/?utm_source=<platform>&utm_medium=social&utm_campaign=<campaign>&utm_content=<post-id>` |
| TikTok bio | `https://learnwithlexis.com/?utm_source=tiktok&utm_medium=social&utm_content=bio` |
| Facebook groups | `https://learnwithlexis.com/?utm_source=facebook&utm_medium=community&utm_content=<post-id>` |
| LINE | `https://learnwithlexis.com/th?utm_source=line&utm_medium=social&utm_content=<post-id>` |
| Partner / outreach email | `https://learnwithlexis.com/?ref=<partner-slug>` |

`utm_content` names the one ad or post the visit came from: the creative's
file stem for ads (`evergreen-th-story`, `meta-en-1-words`), the schedule
slot for daily posts (`day01`, `day02`…). Without it,
visits from a channel still count, but no single ad or post can be credited
with them. It follows the same rule as the other tags, lowercase
`[a-z0-9._-]` only.

Launch-offer ads, until 23 Oct, use `utm_campaign=launch` instead of
`evergreen`. That keeps the two sets apart in the numbers. Thai ads point
at `/th` instead of `/`, with the same tags.

Read it back with:

```sql
select coalesce(metadata->>'src', metadata->>'refHost', 'direct') source,
       coalesce(metadata->>'cmp', '-') campaign,
       count(distinct session_id) filter (where event_name='pageview') visits,
       count(*) filter (where event_name='signup_completed') signups,
       count(*) filter (where event_name='checkout_started') checkouts
from analytics_events where created_at > now() - interval '7 days'
group by 1, 2 order by 3 desc;
```

`campaign` is `utm_campaign`, which `analytics.js` stores as
`metadata.cmp`. It is what splits `meta` / `launch` from `meta` /
`evergreen`. Without it the two sets add up into one `meta` row, and the
switch on 24 Oct cannot be seen.

Signups happen after an email confirmation, often in a new tab, so a
signup can lose its source. For a purchase, the per-channel promo code in
Stripe is the reliable attribution (`PARTNER-CODES.md`).

---

## Meta (Facebook / Instagram) feed

Primary text is truncated at roughly 125 characters on mobile; headline at
roughly 40; description at roughly 27. Everything below is inside those.

### EN-1 — the core one
- **Primary:** You already know the words. Saying them out loud is the hard part. LEXIS is a voice partner you can practise with.
- **Headline:** Practise speaking, out loud
- **Description:** Free 15-min trial
- **Creative:** `ads/meta-en-1-words-1080x1350.png` (4:5 feed); `post-a-words.png` for square placements

### EN-2 — against courses
**On hold (21 Oct).** "You need someone to talk to" reads as a person, and
"not a course" sets LEXIS against the courses that competitors sell. Both
break ground rule 6. Run EV-EN in this slot until the line is rewritten.
`LINES.course` also feeds `templates/post-a-course.png`, so the line and
both PNGs change together.
- **Primary:** You don't need another course. You need someone to talk to. Talk to LEXIS out loud and get gentle corrections.
- **Headline:** A partner, not a course
- **Description:** No card required
- **Creative:** `ads/meta-en-2-course-1080x1350.png` (4:5 feed); `post-a-course.png` for square

### EN-3 — the trial
- **Primary:** Fifteen minutes, free, no card. Find out whether you can actually hold a conversation in English.
- **Headline:** Fifteen free minutes
- **Description:** Then ฿199 for 7 days
- **Creative:** `ads/meta-en-3-find-1080x1350.png` (4:5 feed); `post-b-find.png` for square

### TH-1
- **Primary:** คุณรู้คำศัพท์อยู่แล้ว แค่ยังไม่ได้พูดออกมา ฝึกพูดกับ LEXIS ได้ทุกเมื่อ
- **Headline:** ฝึกพูดออกเสียงจริง
- **Description:** ทดลองฟรี 15 นาที
- **Creative:** `ads/meta-th-1-words-1080x1350.png` (4:5 feed); `post-b-th.png` for square

### TH-2
- **Primary:** บทสนทนาแรกของคุณไม่ควรเป็นกับคนแปลกหน้า ฝึกกับ LEXIS ก่อน
- **Headline:** ฝึกก่อนใช้จริง
- **Description:** ไม่ต้องผูกบัตร
- **Creative:** `ads/meta-th-2-first-1080x1350.png` (4:5 feed); `post-d-th.png` for square

---

## Google Responsive Search Ads

Headlines max 30 characters, descriptions max 90. Google mixes them, so each
headline has to stand alone and none may contradict another.

Headline 3 and description 2 are **on hold**, for the same reason as EN-2.
"Real" partner reads as a person, and "Not a course" sets LEXIS against
competitors (ground rule 6). Leave both out of the ad until they are
rewritten.

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
4. Free 15 minutes, no card. Then ฿199 for 7 days or ฿599 for 30. One-off.

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

### Paid formats, `brand-kit/ads/` (25 Sep 2026)

Meta gives a 4:5 portrait the most feed space, and a square in a 4:5 slot
is letterboxed, so every Meta ad above has its own 4:5 piece whose headline
is that ad's primary line.

| File | Use |
|---|---|
| `meta-{en-1,en-2,en-3,th-1,th-2}-*-1080x1350.png` | Meta feed ads EN-1 to TH-2 |
| `landscape-{en,th}-1200x628.png` | Meta link ads; Google Responsive Display landscape slot |
| `evergreen-{en,th}-1080x1350.png` | Evergreen EV-EN / EV-TH, feed. **Default from 24 Oct.** |
| `evergreen-{en,th}-story-1080x1920.png` | Evergreen, Stories/Reels; TikTok only where it takes an image |
| `launch-{en,th}-1080x1350.png` | Launch offer, feed. **Expires 23 Oct 2026.** |
| `launch-{en,th}-story-1080x1920.png` | Launch offer, Stories/Reels/TikTok. **Expires 23 Oct 2026.** |

The launch pieces print code, price, strike price and end date, all read
from `LAUNCH_OFFER` in `facts.js`. **They expire with the offer on 23 Oct
2026.** Delete them from every ad set that day. After that the generator
skips them. The files stay in the folder as a record.

The evergreen 9:16 is laid out for Reels, the strictest of its placements.
The headline, the trial and the button sit between 270px from the top and
about 35% from the bottom. Reels lays its caption over that bottom 35%.
Only the price line and the address run lower, where Stories still shows
them.

Regenerate with `node scripts/images/generate_brand_kit_social.mjs --only=ads`
from `frontend/`.

To change any line, edit `LINES` at the top of
`frontend/scripts/images/generate_brand_kit_social.mjs` and re-run it. Never
edit the PNGs.

---

## Video for paid placements

Finished 9:16 reels now exist, so a static no longer has to stand in for
video. Lead with these:

| Placement | Lead with | Then test | Landing page |
|---|---|---|---|
| TikTok in-feed, Thai | `reels/lexis-reel-th.mp4` | `voiceovers/lexis-vo-reel-th-work.mp4`, `-th-travel`, `-th-interview`, `-th` (hospitality) | `/th`, or the matching `/th/practice/*` page |
| Instagram & Facebook Reels, Thai | `voiceovers/lexis-vo-reel-th.mp4` (hospitality) | `-th-work`, `-th-travel`, `-th-interview` | the matching `/th/practice/*` page |
| Reels, English (expats learning Thai) | `voiceovers/lexis-vo-reel-en-learn-thai.mp4` | `voiceovers/lexis-vo-reel-en.mp4` | `/` |
| YouTube Shorts | `reels/lexis-reel-th.mp4`, `reels/lexis-reel-en.mp4` | `voiceovers/lexis-vo-reel-en.mp4` | `/th`, `/` |

Why these reels. Each one either shows LEXIS in a session or says what a
session is, and each ends on the free trial. The topic reels each match a
topic page that already exists: hospitality, business, travel and
interview English. That makes the ad-to-page match in ground rule 5 exact.
`reels/lexis-reel-*` were built around TikTok's overlay (see
`reels/build_reels.py`): nothing that has to be read sits in the bottom
~400px or in the strip down the right edge.

The entertainment reels are not in the table: Thinglish, airport, mai-mai,
etiquette and nicknames. They mention LEXIS only at the end, which works for
a follow and is weak for a cold paid view. Post them organically first. Put
money behind one only after it has earned engagement on its own, as a TikTok
Spark Ad or a boosted Reel.

Ad text for each reel is its caption in `brand-kit/voiceovers/README.md`,
cut to 100 characters for TikTok. **Use the caption's words but not its
link.** Those links are tagged for organic posts on one platform:
`utm_source=tiktok` on the Thai reels, `facebook` on learn-Thai. A paid
Reels or Shorts click carrying them would be counted as TikTok or Facebook
traffic. Build each paid link fresh, with the source set by where the ad
runs:

| Ad runs on | Link |
|---|---|
| TikTok in-feed | `<page>?utm_source=tiktok&utm_medium=paid&utm_campaign=evergreen&utm_content=<reel-key>` |
| Instagram / Facebook Reels | `<page>?utm_source=meta&utm_medium=paid&utm_campaign=evergreen&utm_content=<reel-key>` |
| YouTube Shorts | `<page>?utm_source=youtube&utm_medium=paid&utm_campaign=evergreen&utm_content=<reel-key>` |

`<page>` is the reel's landing page from the table above, for example
`https://learnwithlexis.com/th/practice/hospitality-english`. `<reel-key>`
is the file stem without `lexis-`, so `vo-reel-th-work` or `reel-th`. The
same reel on two platforms then shows as two rows that can be compared.

---

## Starting audiences — untested hypotheses

**None of this has been tested.** These are first guesses, there to be
proved wrong by the numbers. Replace each one with what the first test
shows. Platforms rename interests often, so use the closest one on offer.

**Spend is the owner's decision.** This file recommends no budget and no
bid. The owner's own first-test range is ฿100–300 a day across everything
that is running.

**A. Thai speakers practising English**
- Location Thailand, language Thai, ages about 18–34.
- Interests: speaking English and learning English; travel abroad;
  hospitality, hotel and tourism work; office and business work.
- Creative: EV-TH, TH-1 and TH-2, plus the Thai reels. Give each topic reel
  the interest it matches: work with office/business, travel and airport
  with travel, hospitality with hotel/tourism work. Run interview to job
  seekers if the platform offers that interest.

**B. Expats in Thailand learning Thai**
- Location Thailand, language English. Leave age broad to start.
- Interests: expat life in Thailand, learning Thai, Thai culture.
- Creative: EV-EN and `voiceovers/lexis-vo-reel-en-learn-thai.mp4`.

**Never.** Do not target tutors or language schools, their pages, their
followers, or lookalikes built from any of them. They are competitors
(ground rule 6). This applies to interests, custom audiences and
lookalikes alike.

---

## What is deliberately not here

- **No budget or bid recommendations.** Those depend on numbers that do not
  exist yet. Guessing them would be inventing a media plan. The audiences
  above are labelled as hypotheses for the same reason.
- **No new landing pages per campaign.** The `/th/practice/*` topic pages
  already exist and match the topic reels. Build more only once a channel
  shows signs of life.
