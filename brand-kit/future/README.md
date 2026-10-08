# Digital Renaissance: hiring ad for a partner/closer

Recruitment ads (images, motion video, and LEXIS reading the ad) for a
written-only closer for Digital Renaissance's own systems, which start at
$5,000/month. The previous partner's materials, terms and documents were
removed on 8 Oct 2026 at the owner's request; they remain in git history
(before this commit) if ever needed.

How everything here renders: self-contained HTML (fonts and logo as data
URIs) -> playwright-core from `frontend/node_modules`, Chromium at
`/opt/pw-browsers/chromium` -> PNG or video frames -> ffmpeg.

## Hiring ad (`hiring/`)

Social ad to recruit a second partner/closer, 1080×1350 (4:5) PNGs, English and
Thai: `hiring-<lang>-single.png` is the all-in-one post,
`hiring-<lang>-carousel-1..6.png` the carousel (cover + quote, the job, pay,
what 2–3 clients would pay, you/we give you, how to apply). Rebuild with `node hiring/build.mjs <fonts.css>`,
where the CSS is Google Fonts' Prompt + Fraunces with the woff2 URLs inlined as
data URIs (the script's header comment says why). The build warns if any text
overflows a slide.

Pay shown is the standing DR rate (30% × each client's first 3 months). Applications are "send us a message on this page",
so the ad needs no email address.

Tone (owner, 8 Oct 2026): the pay is framed as "you work for yourself and earn
in your own time", not "commission only / nothing is guaranteed". Both say the
same true thing; the old wording read as a warning. The 2–3 clients figures
stay labelled "example figures" so they are not read as a promise.

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

9:16, ~38 s, lip-synced. LEXIS presents the Digital Renaissance role in her own
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
