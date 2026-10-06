# Phiraya

Moved out of the LEXIS session on 3 Oct 2026 at the owner's request so it
doesn't clutter LEXIS. This orphan branch (`phiraya`) shares no history with
LEXIS; everything Phiraya lives here.

## Brand truth sheet (from the owner)

- **Brand name:** Phiraya
- **Service:** agent/secretary support for clinics, premium services and
  medium-sized businesses
- **Core role:** outreach, cold calls, client booking, coordination, ongoing
  communication
- **Market bridge:** Thailand and Western markets
- **Core promise:** seamless communication across Thailand and the West
- **Availability claim:** 24/7 (owner's brief)
- **Positioning:** professional support and access for premium and
  medium-sized businesses
- **Audience:** business owners and managers who need international client
  outreach and coordination
- **Language:** English for the initial social promo
- **Tone:** warm, capable, discreet, responsive, internationally minded
- **Creative direction:** "Every Client Connection, Handled."

The owner first called it the "Piyara agent". It isn't yet confirmed whether
Phiraya is run by people, by an AI voice agent, or both. Until it is, nothing
should call it "human". The brief's "dependable human bridge" wording was
left out of the promo on purpose.

## What exists

| Path | What |
|---|---|
| `phiraya-promo-9x16.mp4` | 29s 1080x1920 English promo with voiceover |
| `promo/` | the HyperFrames project it was rendered from |
| `promo/assets/vo.mp3` | ElevenLabs eleven_v4, voice "Sarah – Warm & Conversational" |
| `promo/assets/fonts/` | Cormorant Garamond + Inter (Google Fonts, OFL) |
| `site/index.html` | the website: one self-contained file (fonts and portraits inlined, no libraries). Background is a live nonlocal Kuramoto oscillator field (spiral waves drawn as gold isophase lines); pointer = pacemaker ripples, tap = new vortex pair, pinch / ctrl+scroll = zoom, scroll morphs the phase lag |
| `site/src.html` | editable source of the page; run `python3 site/build.py site` after editing to rebuild `index.html` |
| `site/assets/phiraya-*-original.jpg` | Phiraya's two portraits as supplied by the owner (6 Oct 2026) |
| `site/assets/phiraya-standing.webp`, `phiraya-avatar.webp` | background-removed cut-outs made with `site/cutout.py` |
| `site/assets/phiraya-{ivory,closeup,full}-original.jpg` | three more portraits from the owner (6 Oct 2026), shown in the arched gallery |
| `site/assets/call-demo.mp4` | owner's call demo: 10s silent MiniMax Hailuo clip (768×768), played in the "Hear a call" section |
| `site/assets/call-voice.mp3` | Thai greeting (6 Oct 2026): "สวัสดีค่ะ ดิฉันพิรยาค่ะ ยินดีช่วยนัดหมายและตอบคำถามของคุณค่ะ วันนี้ให้ช่วยอะไรดีคะ" ("Hello, I'm Phiraya. I'm happy to help you book an appointment and answer your questions. What can I help you with today?"). ElevenLabs eleven_v3, voice "Aom – Gentle, Confident, Smooth". Take 2 of `voice/` |
| `voice/phiraya-greeting-th-take{1-4}.mp3` | all four takes of that greeting, so a different one can be swapped in |

Voiceover script: "Every client connection, handled. A new enquiry from London
at three a.m. A booking request from Bangkok over lunch. Phiraya answers,
follows up, and books, in English and in Thai. Outreach. Calls. Bookings.
Follow-through. For clinics, premium services, and growing businesses.
Seamless communication across Thailand and the West, day and night. Phiraya.
Every client connection, handled."

Scenes (the timings in `index.html` are measured from the VO's pauses):
title → London/Bangkok enquiry cards with Answered/Booked badges →
Outreach/Calls/Bookings/Follow-through → Made for → Thailand ↔ The West arc,
"Day & night" → PHIRAYA end card with "Thailand · The West · 24/7".

## Re-rendering

HyperFrames 0.8.114 (`npx hyperframes@0.8.114 render -o out.mp4` from
`promo/`). It needs Node 22, ffmpeg and ffprobe on PATH, and a Chromium
headless shell via `HYPERFRAMES_BROWSER_PATH`. In the Claude cloud container
that is `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`.
ffprobe comes from the `ffprobe-static` npm package. `npm run check` flags
the scene sections as "needs sub-composition", which only affects Studio's
timeline view, not the render.

## Separation from LEXIS

LEXIS is the English tutor; Phiraya is the business-agent service. They are
separate brands: never reuse LEXIS assets (its tutor avatar is a different
person), code, Stripe or Supabase here.

## Owner decisions (6 Oct 2026)

- Name is **Phiraya** (พิรยา); "Phitara" is retired.
- **Never mention AI** anywhere public. Also never claim she is human; if a caller sincerely
  asks, she must not say she is a person (she offers to connect them to staff instead).
- No health advice in scripts; she helps with bookings and questions.
- Brief to paste into other agents: `BRIEF-FOR-OTHER-AGENTS.md`.

## Open items for the owner

1. Decided 6 Oct: never mention AI, never claim human (see Owner decisions).
2. Website, LINE ID or booking link for the end card. Nothing exists yet
   (3 Oct 2026). `phiraya.com` was free at $10.46/yr when checked; not bought.
   Suggested setup: domain, business email on it, LINE Official Account,
   WhatsApp Business, Cal.com/Calendly booking page. The contact buttons in
   `site/index.html` are greyed-out placeholders marked `TODO(owner)`.
3. "Finish off the Phiraya agent": if this means an AI receptionist, the
   brief needs hours, services, prices, booking method, and what it must
   never say or promise.
4. Done: name confirmed as **Phiraya** (Thai spelling used: พิรยา). Greeting offers bookings and answers, not health advice.
5. The owner's `landing.html` (Windows path on their PC) was never uploaded, so it isn't in this branch.
6. Other formats (1:1, 16:9) or a Thai version if wanted.
