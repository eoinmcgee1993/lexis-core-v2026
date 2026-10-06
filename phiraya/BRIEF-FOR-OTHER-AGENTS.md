# Phiraya: brief for any agent working on it

Paste this whole file into any AI agent before it touches Phiraya work.
Last updated 6 Oct 2026.

## The facts

- **Name: Phiraya.** Thai spelling: **พิรยา**. Never "Phitara", "Piyara" or anything else.
  Rename any files, prompts or pages that say "Phitara".
- **What it is:** client communication for clinics, premium services and medium-sized
  businesses across Thailand and the West: outreach, calls, bookings, follow-up, in
  English and Thai.
- **LEXIS is a separate business** (an English tutor, learnwithlexis.com). Never put
  Phiraya material on LEXIS sites, and never reuse LEXIS code, avatars, Stripe,
  Supabase or other accounts for Phiraya. Phiraya gets its own accounts.
- **How Phiraya is presented (owner's decision):** never mention AI, bots, automation or
  voice synthesis anywhere public: site, videos, captions, scripts, file names shown to
  clients. Also never claim she is human, a "real person" or "live staff".
  If a caller sincerely asks whether they're talking to a real person, she must not say yes.
  She says she's Phiraya from the clinic's booking team and offers to connect them to the staff.
  Label generated videos and chats as **demos**, never "live" or "real".
- **No medical advice.** For clinics she helps with bookings and questions. She does not
  "advise on your health".

## Brand look

- Colours: ink `#0E1116`, gold `#C9A45C`, ivory `#F4EFE6`. Do not invent a new navy palette.
- Fonts: Cormorant Garamond (headings) and Inter (body).
- Line: "Every client connection, handled."

## Assets that already exist (don't regenerate them)

All in the GitHub repo `eoinmcgee1993/lexis-core-v2026`, branch **`phiraya`**:

- `phiraya/site/index.html`: the website (single file).
- `phiraya/site/assets/*-original.jpg`: her five approved portraits. Upload these files for
  any new image or video job; don't rely on expiring links.
- `phiraya/site/assets/call-demo.mp4`: the 10s call demo video.
- `phiraya/voice/`: the Thai greeting takes (ElevenLabs, voice "Aom").
- `phiraya-promo-9x16.mp4`: the 29s promo.

## Rules

- Don't spend credits on new videos or variations until the owner says so.
- Don't send emails, post publicly, buy domains or contact anyone without the owner's approval.
- Never paste API keys, signed URLs or tokens into chats, pages or repos.
- The backend (`aether`) must be reviewed before it gets real keys or real patient data:
  per-clinic data isolation (Supabase row-level security, including realtime), no phone
  numbers or transcripts in logs, verified webhook signatures, PDPA explicit consent for
  health data and cross-border transfer.
