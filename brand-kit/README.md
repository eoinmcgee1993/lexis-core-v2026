# LEXIS Brand Kit

Assembled 21 Aug 2026. Everything here is built from what already exists in
the product and codebase — the real logo mark, the real palette/type from
`scripts/design/lexis-visual-system.md`, and only verified facts (pricing,
trial terms, what the product actually does). Nothing here invents a new
logo, a user count, a testimonial, or a superlative claim ("#1 in
Thailand," "trusted by thousands") that isn't backed by something real —
same discipline as every other piece of copy shipped on learnwithlexis.com
this cycle. If you want to add a real number or claim later (a user count,
a partner name, a press mention), swap it in deliberately; don't let
anyone (human or AI) pad this with a plausible-sounding fake one.

## 1. Logo

The mark is a literal five-bar audio waveform, not a generic sparkle or
abstract icon — deliberate, since LEXIS's entire product is a live voice
conversation (see `frontend/src/components/LexisMark.jsx`'s own header
comment for the reasoning). It's the same shape used as the favicon, the
header badge on every page, and now every social avatar in this kit.

**Files** (`assets/`):
- `lexis-avatar-1024.png` / `-512.png` / `-192.png` / `-180.png` / `-128.png`
  — square profile-picture exports, teal (`#0D9488`) rounded-square
  background, white waveform. Use the largest size the platform accepts;
  Instagram/Facebook/TikTok/LINE all crop a square upload to a circle
  automatically, and the mark is centered with even padding so that crop
  is always safe.
- `lexis-facebook-cover-820x312.png` — Facebook's own recommended desktop
  cover-photo size. Navy canvas, mark, wordmark, and the one-line pitch.
  No other platform in this kit expects a separate cover image the way
  Facebook does.

**Usage rules:**
- Don't recolor the mark itself outside the two combinations already in
  use sitewide: white-on-teal (current avatar/favicon treatment) or
  teal-on-white/cream (the header badge treatment — teal mark, no
  background chip, on a light page).
- Don't stretch it off a 1:1 square — every export above already is one.
- Leave clear space around it at least equal to one bar's width on every
  side; the exports already build this in.
- Regenerate any new size from `frontend/public/favicon.svg` via
  `frontend/scripts/images/generate_brand_kit_assets.mjs` rather than
  re-exporting a raster by hand — keeps every size pixel-consistent with
  the others instead of drifting over time.

## 2. Color

Pulled directly from `frontend/tailwind.config.js`'s `lexis-*` tokens —
the same values the live site uses, not a separate "marketing palette."

| Token | Hex | Use |
|---|---|---|
| Teal (live accent) | `#0D9488` | The brand's identifying color — logo, links, the live/voice accent. Tailwind's stock `teal-600`, not a custom token. |
| Amber (action) | `#FF9E00` | The *only* action/CTA color sitewide — every "Try It Free" / "Get Started" button. Don't use it for anything that isn't a primary action; that discipline is why it still reads as "go" everywhere it appears. |
| Navy (deep canvas) | `#050B14` | Reserved for the live conversation screen and now this kit's cover/banner assets — deliberately never used as a marketing-page background (see the interface audit this kit's design choices follow). |
| Ink (text) | `#1E293B` | Primary text on light surfaces. |
| Canvas (warm neutral) | `#FAFAF7` | Background for every warm/light page. |

## 3. Typography

- **Display/headlines (Latin):** Fraunces, weight 600 only, self-hosted
  (`frontend/public/fonts/fraunces-600.woff2`). Falls back to Georgia/serif.
- **Body (Latin):** system sans stack (no webfont — see
  `tailwind.config.js`'s comment on why: a named-but-never-loaded font is
  worse than an honest system-font fallback).
- **Thai (any weight/role):** IBM Plex Sans Thai, 400/600, self-hosted
  (`frontend/public/fonts/ibm-plex-sans-thai-*.woff2`), added 21 Aug 2026
  specifically because Thai text previously had no dedicated typography at
  all. Use this for any new Thai-language creative, not the Latin faces
  above (neither has Thai glyph coverage).

## 4. Voice

- Personify LEXIS as "her/she," not "it," in any copy talking about her as
  a conversation partner — established sitewide since 20 Aug 2026.
- No em dashes anywhere (a deliberate, sitewide, verified-by-script rule —
  see `verify-final.mjs`'s em-dash sweep). Use a period, comma, or colon
  instead.
- No superlatives that aren't backed by something real: no "best,"
  "only," "#1," "trusted by," or invented numbers. Every claim in this kit
  is something the product actually, verifiably does today.
- No "AI-generated" / "AI-powered" framing in marketing copy — a
  deliberate, direct product-positioning call made 20 Aug 2026, still in
  effect. (Legal/liability copy on Terms/Privacy still says "AI model"
  where it needs to; that's a different context.)

---

## 5. Social bios

Every bio below states the same real facts (voice-first, English + Thai,
free 30-minute trial with no card, ฿199/week or ฿599/month after that),
sized to fit each platform's own limit. Swap in the right link
(`learnwithlexis.com`) in whichever field each platform gives you for one —
none of these bios below try to cram the URL into the text itself.

### Instagram (150 characters)
**EN:** Voice-first speaking practice for English & Thai. A real live conversation, not a chatbot: gentle corrections as you talk. Free 30-min trial, no card.

**TH:** ฝึกพูดภาษาอังกฤษและภาษาไทยด้วยเสียงจริง คุยสดกับ LEXIS ไม่ใช่แชทบอท แก้ไขให้อย่างอ่อนโยนระหว่างพูด ทดลองฟรี 30 นาที ไม่ต้องผูกบัตร

### TikTok (80 characters)
**EN:** Practice English & Thai out loud. Real voice, gentle live corrections.

**TH:** ฝึกพูดอังกฤษ-ไทยออกเสียงจริง คุยสด แก้ให้อย่างอ่อนโยน ทดลองฟรี 30 นาที

### Facebook Page (short description, ~255 characters)
**EN:** LEXIS is a voice conversation partner for practicing spoken English and Thai. Talk out loud, get gentle real-time corrections, and see what to work on next. Free 30-minute trial, no card required. ฿199/week or ฿599/month after that.

**TH:** LEXIS คือคู่สนทนาสำหรับฝึกพูดภาษาอังกฤษและภาษาไทย พูดออกเสียงจริง รับคำแนะนำแบบเรียลไทม์อย่างอ่อนโยน แล้วดูว่าควรฝึกอะไรต่อ ทดลองฟรี 30 นาที ไม่ต้องผูกบัตร หลังจากนั้น ฿199/สัปดาห์ หรือ ฿599/เดือน

### LINE Official Account (short intro)
*I don't have hands-on LINE OA admin experience to confirm its exact field limits — treat this as a starting draft to fit into whatever field LINE gives you at setup, not a verified-to-fit string the way the others above are.*

**EN:** Talk out loud, practice English or Thai, get gentle live corrections. Free 30-min trial.

**TH:** คุยออกเสียงจริง ฝึกอังกฤษหรือไทย รับคำแนะนำสด ๆ อย่างอ่อนโยน ทดลองฟรี 30 นาที

---

## 6. Ad copy (ready to paste into Meta/TikTok/Google ad managers)

Creative only — audience targeting, budget, and which platform to actually
run these on is a separate decision (see the delegation brief). Every line
below is a real, verified product fact; nothing here needs a legal review
for an unsubstantiated claim.

### Headlines (short — feed ads, display ads)
- EN: "Practice speaking English out loud, not typing."
- EN: "A real conversation partner, not a course."
- EN: "Free 30 minutes. No card. Just talk."
- TH: "ฝึกพูดภาษาอังกฤษออกเสียงจริง ไม่ใช่แค่พิมพ์"
- TH: "ทดลองฟรี 30 นาที ไม่ต้องผูกบัตร แค่เริ่มพูด"

### Body copy (feed ads)
- EN: "LEXIS listens, replies instantly, and corrects your English or Thai gently as you talk, out loud, no scripts. Free 30-minute trial, no card required."
- EN: "Stuck reading textbooks instead of actually speaking? LEXIS is a live voice conversation partner, available any time, correcting you gently as you go. Try 30 minutes free."
- TH: "LEXIS ฟัง ตอบกลับทันที และช่วยแก้ไขภาษาอังกฤษหรือภาษาไทยให้อย่างอ่อนโยนระหว่างที่คุณพูด ทดลองฟรี 30 นาที ไม่ต้องผูกบัตร"

### Call to action
- EN: "Try It Free" (matches the site's own CTA button — keep ad and
  landing-page language identical, a real conversion-rate factor).
- TH: "ลองใช้ฟรี"

---

## 7. What's deliberately not in this kit

- **No new logo or mascot.** The waveform mark already exists and is used
  consistently sitewide; inventing a second logo for social specifically
  would fragment the brand rather than extend it.
- **No fabricated social proof.** No follower counts, review scores, or
  "as seen in" claims — none of that exists yet. Add it here the day it's
  real.
- **No LINE/TikTok business-account setup.** This kit gives you the
  creative to paste in once those accounts exist; creating the accounts
  themselves is an action step, covered in the delegation brief, not a
  design decision.
