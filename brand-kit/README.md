# LEXIS Brand Kit

Assembled 21 Aug 2026, rebuilt in full 26 Aug 2026. Everything here is
built from what already exists in the product and codebase: the real logo
mark, the real depiction of LEXIS, the real palette and type from
`scripts/design/lexis-visual-system.md`, and only verified facts (pricing,
trial terms, what the product actually does) read out of
`frontend/src/content/facts.js`. Nothing here invents a new logo, a new
face, a user count, a testimonial, or a superlative claim ("#1 in
Thailand," "trusted by thousands") that isn't backed by something real,
the same discipline as every other piece of copy shipped on
learnwithlexis.com this cycle. If you want to add a real number or claim
later (a user count, a partner name, a press mention), swap it in
deliberately; don't let anyone (human or AI) pad this with a
plausible-sounding fake one.

**Regenerate everything with one command**, run from inside `frontend/`:

```
node scripts/images/generate_brand_kit_assets.mjs
```

Never re-export one of these by hand. The script is the source of truth
for sizing and treatment, so a hand-made one-off drifts from the rest
immediately.

## 0. Read this before you post LEXIS's face anywhere

`avatars/lexis-photo-*` are crops of a **synthetic, generated portrait**
(see `scripts/avatar/lexis-tutor-photo-notes.md` for provenance). She is
not a real person and there is no photographer or model release behind
her, because there is nobody to release.

Inside the product that is uncontroversial: she is the tutor's avatar, and
the privacy page describes what the product is. Using the same face as
the **public profile photo of a brand account** is a different thing, and
worth deciding deliberately rather than by default:

- Meta, TikTok and YouTube all now have synthetic-media labelling rules
  for realistic AI-generated people. Those rules move; check each
  platform's current policy at the moment you set the account up, don't
  take this paragraph as current.
- A viewer who assumes she is a real teacher, and later learns otherwise,
  has been misled even though no individual claim was false.
- The site itself carries no "AI-generated" caption, a deliberate
  positioning call made 20 Aug 2026 and still in effect. That decision
  was made about the website. It was not a decision about social profile
  photos, and it does not automatically extend to them.

**The safe default, and my recommendation:** use the waveform mark
(`avatars/lexis-mark-avatar-*`) as the profile photo for the brand
account, and use LEXIS's face inside the content, where the surrounding
post makes it obvious she is the product's tutor persona rather than a
staff member. That gets you the warmth of a face without the profile
photo itself making a claim about who is behind the account.

Both sets are generated so the choice is yours; this is a flag, not a
refusal.

## 1. Logo

The mark is a literal five-bar audio waveform, not a generic sparkle or
abstract icon, deliberate since LEXIS's entire product is a live voice
conversation (see `frontend/src/components/LexisMark.jsx`'s own header
comment for the reasoning). It's the same shape used as the favicon, the
header badge on every page, and every social avatar in this kit.

### `logo/` — the mark

Real, editable SVG (the mark is pure rectangles), plus PNG exports.

| File | What it is |
|---|---|
| `lexis-mark-badge.svg` | White mark on the teal rounded square. The primary form: favicon, app icon, profile photo. |
| `lexis-mark-badge-navy.svg` | Same, on navy. For placement on teal or on a busy photo. |
| `lexis-mark-teal.svg` | Bare teal mark, transparent background. On cream/white surfaces. |
| `lexis-mark-white.svg` | Bare white mark, transparent. On navy, teal, or photography. |
| `lexis-mark-black.svg` | Bare ink mark, transparent. One-colour print, faxes, embroidery, anywhere colour is unavailable. |
| `lexis-mark-badge-{1024,512,256,192,180,128,64,32}.png` | Raster badge at every size a platform asks for. 180 is Apple touch icon, 192/512 are PWA. |
| `lexis-mark-{teal,white,black}-1024.png` | Raster of each bare colourway, transparent background. |

### `wordmark/` — text logos and lockups

Set in Fraunces 600, the site's real display face. **These are PNG, not
SVG, on purpose:** an SVG wordmark would either need Fraunces converted to
outlines (no tool for that in this repo) or would name the font family and
silently fall back to Georgia on any machine without Fraunces installed,
which is worse than a raster in a brand kit. All are rendered at 2x with
transparent backgrounds.

| File | Use |
|---|---|
| `lexis-wordmark-{ink,white,teal}.png` | Text logo alone, no mark. When the mark already appears elsewhere in the layout. |
| `lexis-lockup-horizontal-{light,dark}.png` | Mark + wordmark side by side. The default lockup: email signatures, letterheads, wide headers. |
| `lexis-lockup-stacked-{light,dark}.png` | Mark over wordmark over the one-line pitch. For square and tall spaces. |
| `lexis-lockup-stacked-th.png` | Stacked lockup with the Thai pitch, set in IBM Plex Sans Thai. |

"light" means built for a light background; "dark" means built for a dark
one. Both have transparent backgrounds, so pick by the surface you're
placing it on.

### `avatars/` — square profile photos

Every platform in this kit (Instagram, Facebook, TikTok, LINE, X,
YouTube, LinkedIn) crops a square upload to a circle. Both sets below are
centred for that crop.

| File | What it is |
|---|---|
| `lexis-mark-avatar-{1024,512,400,180,128}.png` | The waveform badge. **The recommended profile photo, see §0.** |
| `lexis-photo-circle-{1024,512,400,180,128}.png` | LEXIS's portrait, circular, transparent corners. |
| `lexis-photo-navy-{1024,512,400}.png` | Same portrait on a navy square, for anywhere shown square rather than circular. |
| `lexis-photo-ring-{1024,512,400}.png` | Same portrait with the teal ring the live conversation screen uses. The most on-brand of the three. |

Upload the largest size the platform accepts and let it downscale; its
resampling beats shipping it a small file.

### `covers/` — one per platform that asks for a banner

Sized to each platform's own current spec. Re-check the spec before
uploading; platforms change these without notice.

| File | Platform |
|---|---|
| `x-header-1500x500.png` | X / Twitter header. Content is centred and kept clear of the bottom-left profile-photo overlap. |
| `youtube-channel-2560x1440.png` | YouTube channel art. Everything sits inside the 1546x423 centre safe area, so it survives the TV/desktop/mobile crops. |
| `linkedin-page-1128x191.png` | LinkedIn company page banner. |
| `facebook-cover-820x312.png` | Facebook page cover (desktop spec). |
| `line-oa-cover-1080x878.png` | LINE Official Account cover. Thai copy, since that account's audience is Thai. |
| `og-share-card-1200x630.png` | Generic link-preview card, for anywhere you need one that isn't the site's own auto-generated OG image. |

### `templates/` — ready to post

Finished posts, not layered files. Every line of copy on them is a
verified product fact.

| File | Content |
|---|---|
| `post-square-1080-speak.png` | "Practice speaking English out loud, not typing." + trial terms. |
| `post-square-1080-partner.png` | "A real conversation partner, not a course." + trial terms and price. |
| `post-square-1080-th.png` | Thai pitch + Thai trial terms. |
| `story-1080x1920-en.png` | Story / Reel / TikTok vertical, English, amber CTA. |
| `story-1080x1920-th.png` | Same, Thai. |

To change the copy on any of these, edit the strings at the top of
`generate_brand_kit_assets.mjs` and re-run it. Don't edit the PNGs.

**Usage rules for the mark:**
- Don't recolour it outside the combinations shipped above.
- Don't stretch it off 1:1. Every export already is square.
- Leave clear space around it at least equal to one bar's width on every
  side; the exports build this in.

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
- **No editable source files.** No .ai, .psd, .fig or layered .svg for
  the composed pieces. The generator script *is* the editable source:
  change a string or a colour at the top of it and re-run. If a designer
  later needs true layered files, they should rebuild from the mark SVG
  and the tokens in §2/§3 rather than tracing these PNGs.
- **No video, motion or audiogram templates.** Worth having for TikTok
  and Reels, but they are a different craft from static layout and would
  need a real editing pass, not a generated still.
- **No second face or alternate persona.** One LEXIS, the one already in
  the product. See §0 on where it is and isn't appropriate to use her.
