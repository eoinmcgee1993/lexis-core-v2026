# LEXIS Operations Reference

Updated 20 August 2026. Replaces the earlier pre-launch draft of this file,
which had drifted from reality on nearly every infrastructure claim
(Railway hosting, Sentry, the old `lexis.vercel.app` domain) and was
still framed as a Day-1-through-Day-7 pre-launch sprint for a product
that's been live, on real Stripe billing, for a while now. This version
describes what's actually running today.

## Current architecture

- **Frontend**: Vercel project `lexis-core-v026`, custom domain
  `learnwithlexis.com` (DNS on Cloudflare). Client-only Vite SPA with a
  hand-rolled router (`App.jsx`), pre-rendered at build time for the
  public marketing/legal routes so crawlers and answer engines see real
  content, not an empty `#root` (see `frontend/scripts/prerender.mjs`).
- **Backend**: Vercel project `lexis-commerce` — an Express app
  (`backend/app.mjs`) exported for Vercel's Node runtime, not a
  long-running Railway process. `backend/server.mjs` remains the
  long-running entrypoint for local dev only.
- **Auth & database**: Supabase project `lexis-production`, RLS-enforced,
  with triggers/RPCs for usage tracking and entitlement checks.
- **Billing**: Stripe, live mode (Clearmark account). Weekly (฿199) and
  Monthly (฿599) plans, a free 15-minute trial, an optional LEXIS
  Community sponsor add-on at checkout, and promotion-code-based partner
  discounts (see `PARTNER-CODES.md`).
- **Realtime voice**: OpenAI Realtime API over WebRTC.
- **Error monitoring & analytics**: first-party, not Sentry or any
  third-party service — `backend/app.mjs`'s own `error_logs` table/
  endpoint and `frontend/src/lib/errorReporting.js` / `analytics.js`.
  No third-party trackers anywhere on the site.
- **Security headers**: CSP + Permissions-Policy set in
  `frontend/vercel.json`.
- **Transactional email**: Supabase Auth's built-in mailer, being moved to
  custom SMTP via Resend on the `learnwithlexis.com` domain (domain
  verified 20 Aug 2026; wiring the SMTP settings into Supabase's
  dashboard is the remaining step).

## Status, honestly

LEXIS is live and taking real payments, but at early, pre-scale volume,
not the "500 signups / 50 paid / ฿25,000 MRR in 90 days" targets the old
version of this file guessed at before launch. Don't quote those numbers
as current; they were never real. If you want current numbers, pull them
from Stripe and Supabase directly rather than trusting anything written
here, they go stale the moment they're typed.

## Monitoring (what actually exists today)

- `/health` on the backend, checked manually rather than via an uptime
  monitor, no UptimeRobot/Pingdom is currently configured.
- Errors: query `error_logs` directly (Supabase `execute_sql` / the
  MCP tools this session used), not a Sentry dashboard.
- Billing: Stripe's own dashboard for payments, webhook delivery, and
  disputes.
- OpenAI usage/cost: OpenAI's own usage dashboard; no automated cost-cap
  alerting is wired up yet.

If any of the above ("no uptime monitor," "no cost-cap alerting") stops
being true, update this section rather than leaving it stale, that's
exactly the kind of drift that made the old version of this file useless.

## Security quick checklist

- `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY` (live) only in
  Vercel's `lexis-commerce` project env vars, never in the frontend
  bundle or committed to the repo.
- `ALLOWED_ORIGINS` matches the real production + preview Vercel domains.
- RLS policies intact for `profiles`, `session_history`, and usage
  tracking tables — re-check with `get_advisors` (security) after any
  schema change.
- No VAT registration currently, reflected honestly in Terms/Pricing
  copy rather than silently added to prices.

## Incident & rollback

- **Webhook / billing breaks**: check `stripe_webhook_events` for
  delivery failures before assuming the app itself is broken.
- **OpenAI token minting fails**: fails fast client-side with a plain
  error message today; there's no maintenance-banner mechanism yet.
- **Runaway OpenAI cost**: no automated circuit breaker yet, manual
  intervention (rotate to a restricted key, or ship a quick 503) is the
  current answer.
- **Rollback**: revert the offending commit and let Vercel's normal
  git-triggered redeploy handle it, no separate rollback tooling exists
  beyond that.

## Customer support triage

Ask for: browser & OS, time, account email, steps to reproduce. For a
payment issue: Stripe payment/session ID. For an audio issue: which
`voiceState` it failed in if visible, and roughly when.

## Growth / outreach

See `PARTNER-CODES.md` for onboarding an affiliate or partner
(no engineering required, it's two Stripe API calls). Long-tail SEO
landing pages live under `frontend/src/pages/*Page.jsx` following the
`InterviewEnglishPage.jsx` pattern, real product claims only, wired
into `App.jsx`, `prerender.mjs`, and `sitemap.xml`.
