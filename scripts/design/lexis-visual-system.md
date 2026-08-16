# LEXIS v2026.4 visual system

Replaces the "hacker terminal" look (cyan/emerald gradients, uppercase
tracking-widest mono labels, dark-everywhere) that shipped through
v2026.3. Two things drove this:

1. A copy/tone pass (Aug 2026) found the product's language read like an
   enterprise ops dashboard — "INITIATE LEXIS", "TERMINATE", "Sub-300ms
   WebRTC Stream" — for a voice tutor aimed at Thai youth. See the git
   history around that change for the full before/after.
2. A follow-up design review compared LEXIS against three reference
   products (a human-tutor-avatar voice app, a warm/approachable
   onboarding flow, and a dense AI-tutor app) and converged on a specific
   synthesis: borrow the *interaction pattern* from each (avatar-as-person,
   warm onboarding hierarchy, tutor-at-top live layout) without copying
   their surface style (no colorful gradient cards, no cartoon mascot —
   LEXIS's audience skews older than "kids' education app," per that
   review: university students, young professionals, people prepping for
   interviews, embarrassed-about-their-English adults).

## Semantic color system

Three colors, three jobs — deliberately not one accent doing everything:

| Token | Value | Job |
|---|---|---|
| `lexis-action` (amber) | `#FF9E00` | "Do something." Every primary CTA — Start Talking, Practice Again, topic cards. |
| Tailwind `teal-*` (e.g. `teal-600` = `#0D9488`) | stock Tailwind | "LEXIS is listening / alive." The live-session accent only — avatar glow ring, waveform, in-call status. No custom token needed: Tailwind's own teal-600 already *is* this exact hex, so existing `teal-*` utilities are reused rather than duplicated under a new name. |
| `lexis-navy` | `#050B14` | "You're inside the conversation." Background *only* on the Live Conversation stage — nowhere else. |
| `lexis-canvas` | `#FAFAF7` | Warm neutral foundation for every stage that isn't live conversation (Welcome, Topic picker, Feedback, and the marketing/auth/pricing pages). |
| `lexis-ink` | `#1E293B` | Primary text on `lexis-canvas` surfaces. |

Picking a color off this table should be legible from the *meaning*, not
just "which one looks good here" — if a new screen needs a CTA, it's
amber; if it needs to signal "live," it's teal; anything else warm-neutral.

## Typography

- **Display** (`font-display` → Fraunces 600, self-hosted woff2 in
  `frontend/public/fonts/`): headlines only. A warm serif reads as "a
  person," not "a system" — deliberately not the geometric sans (Sora,
  Space Grotesk, etc.) that most AI-product UIs reach for by default.
- **Body** (`font-sans`): plain system stack (`-apple-system`, `Segoe UI`,
  Roboto, ...). `Inter` used to be named here but was never actually
  loaded (no `@font-face`, no `<link>`) — every render silently fell back
  to the system stack anyway, so this just names what was actually
  rendering instead of a font that was never present. No perf cost to
  loading a real body face that the system stack already covers well.

## The four-state session flow

`LexisApp.jsx` is a state machine over `stage`:
`welcome → topics → live → feedback`, implemented as four components under
`frontend/src/components/stages/`. `LexisApp.jsx` itself keeps owning the
WebRTC session lifecycle (unchanged from v2026.3) and passes it down.

1. **Welcome** (`lexis-canvas`) — headline, language pill, single "Start
   Talking" CTA. No dashboard, no secondary features competing for
   attention.
2. **Topics** (`lexis-canvas`) — "What do you want to practice today?"
   Everyday Talk / Work & Business / Travel & Culture, or "Just Talk" to
   skip and let LEXIS's existing natural topic rotation run. Selecting a
   topic actually steers `buildTutorInstructions()` server-side (see
   `backend/app.mjs`) — it's not cosmetic.
3. **Live Conversation** (`lexis-navy`) — the one screen that stays dark.
   Avatar with a teal glow ring, live transcript with real EN↔TH
   translation subtitles (`/api/translate`, fired per completed LEXIS
   turn — see the endpoint's own comment for why it's a separate async
   call rather than blocking the realtime audio), minimal exit control.
4. **Feedback** (`lexis-canvas`) — one real LLM pass over the session's
   *actual* transcript (`/api/feedback`) — a confidence score, genuine
   strengths, and up to a few concrete corrections grounded in what the
   student actually said. Sessions too short to evaluate honestly get a
   plain "talk a bit more next time" message instead of a fabricated
   score — see that endpoint's comment for the word-count floor.

## What deliberately didn't change

- The illustrated-mascot / bright-cartoon aesthetic from one of the
  reference apps was explicitly rejected — LEXIS's addressable audience
  is wider than "kids' app," and a mascot narrows that perception.
- The marketing/auth/pricing pages (`LandingPage.jsx`, `AuthPage.jsx`,
  `PricingPage.jsx`) got the palette/type tokens for consistency but kept
  their existing information architecture — the four-state rebuild was
  scoped to the in-app session flow specifically.
