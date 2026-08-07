# LEXIS LAUNCH PLAYBOOK
LEXIS OS v2026.3 Commerce — GO-LIVE OPERATIONS & 7‑DAY SPRINT

Status
- Live: Frontend https://lexis.vercel.app
- Backend: Railway (health: Operational)
- Billing: Stripe checkout configured (฿199/week, ฿599/month)
- Auth/DB: Supabase with RLS, triggers, RPCs
- Realtime audio: OpenAI Realtime + WebRTC (sub-300ms)

Immediate wins (already validated by smoke tests)
- /health returns Operational
- SPA routing + TH/EN toggle renders
- Auth guard returns 401 for unauthenticated /api/session
- DB triggers & RPCs live
- Stripe webhook origin + signature verification working

7‑Day Sprint (tactical)
Day 1 — Beta invites
- Invite 5–10 Thai students. Ask for 3 short tasks to perform and gather quantitative usage (minutes, sessions).
- Create a single Google Form for structured feedback.

Day 2 — Fix bugs from beta
- Triage top 5 issues from feedback; patch critical bugs (audio, auth, webhook).
- Deploy quick fixes to staging then prod.

Day 3 — Stripe live
- Switch Stripe from test → live (change STRIPE_SECRET_KEY to live key in Railway env).
- Run a live payment test using a small amount or Stripe test first, then live.

Day 4 — Social post
- Post a 15–30s demo clip to TikTok/Instagram showing LEXIS speaking + visualizer.
- CTA: sign up for 30-min free trial.

Day 5 — Community engagement
- Share in Thai study groups, ask existing beta users to share.

Day 6 — LINE integration prep
- Create LINE Official Account; plan simple welcome flow linking to landing page.

Day 7 — Metrics review + plan
- Review signups, conversions, session mins, errors.
- Decide Week 2 priorities.

Week 1–2: Beta program
- Invite 10–20 students, collect recordings and session transcripts (privacy consent).
- Measure: daily active users, sessions per user, avg session length, drop-off points.
- Fix UX friction (signup, email confirmation, mic permissions).

Week 3–4: Live payments & retention
- Enable live Stripe, monitor conversion rate from trial → paid.
- Add simple onboarding emails (welcome, tips, how to practice).
- Offer promo: first-week discount or referral credit.

Month 2: Security & scaling
- Add Redis-backed rate limiter for /api/session and /api/heartbeat.
- Add structured logging (pino) and error monitoring (Sentry).
- Add alerts for: 5xx rate > threshold, OpenAI errors spike, heartbeat failures, high cost per minute.
- Add cost cap monitoring for OpenAI usage and automated alerting.

Month 3+: Growth
- Targeted TikTok/IG campaigns, LINE bot, referral program, teacher partnerships.

What to monitor now (minimum)
- Availability: /health every 1–5m (UptimeRobot, Pingdom)
- Errors: 5xx rate, webhook failures (Sentry)
- Billing:
  - Stripe payments and webhook delivery failures
  - OpenAI usage/cost per minute (daily)
- Usage: new signups, active users, session minutes used, trial exhaustion rates
- Performance: average token/time to mint session, WebRTC connection time, real-time latency distribution

Immediate ops checklist (first 48h)
- Alerts:
  - Create Uptime monitor for https://<backend>/health
  - Create Sentry project and add DSN to backend env
- Logging:
  - Switch console.log → structured logger (pino) for backend
  - Emit request ids + user id (obfuscated) for critical flows
- Secrets:
  - Rotate any demo/test keys; ensure SUPABASE_SERVICE_ROLE_KEY and STRIPE_SECRET_KEY are only set in Railway
- Backups:
  - Export a snapshot of the Supabase DB now (and schedule daily backups)
- Webhook:
  - Confirm Stripe webhook retries are visible; ensure stripe_webhook_events table is receiving entries
- OpenAI:
  - Set usage alerts on OpenAI dashboard (if available) and record model used and avg tokens per session

Security quick checklist
- SUPABASE_SERVICE_ROLE_KEY only in Railway env, never in frontend or repo
- STRIPE_WEBHOOK_SECRET stored in Railway only
- ALLOWED_ORIGINS exact match Vercel domain
- Restrict Railway project access to trusted accounts
- Add a quick secrets-scan (git-secrets or GitHub secret scanning enabled)
- Ensure RLS policies remain intact for profiles & usage_logs

Incident & rollback plan (concise)
- If Webhook / Billing breaks:
  - Disable webhook processing by returning 200 early or set STRIPE_WEBHOOK_SECRET to invalid temporarily to stop processing (investigate logs).
- If OpenAI token minting fails:
  - Fail fast with customer-friendly message; enable a maintenance banner on the frontend; revert to old behavior (if any) or temporarily disable INITIATE button.
- If high cost / runaway usage:
  - Set OPENAI_API_KEY to a read-only/test key in Railway to stop new sessions, or update backend to refuse new sessions (return 503) until fixed.
- Rollback: deploy the previous main tag branch (CI should keep previous artifacts). Keep a small downtime notice page if rollback required.

Customer support triage template
- Ask: browser & OS, time, user email, steps to reproduce, screenshot/video, console logs
- If payment: Stripe payment id, webhook id, timestamp
- If audio: WebRTC logs (client side) and backend /api/session logs with request id

Quick verification commands (you or I can run)
- Health:
  curl -sS https://YOUR_BACKEND_DOMAIN/health
- Test session mint (requires a valid user session token — do not share tokens publicly):
  curl -X POST https://YOUR_BACKEND_DOMAIN/api/session -H "Authorization: Bearer <user_access_token>" -H "Content-Type: application/json"
- Inspect webhook events in Supabase:
  SELECT * FROM public.stripe_webhook_events ORDER BY processed_at DESC LIMIT 10;

Operational runbook: daily checks
- 09:00 — Check /health & Uptime alerts
- 12:00 — Review Sentry for new errors
- 18:00 — Check Stripe payouts & failed webhooks
- Weekly — Export usage metrics, plan retention actions

KPIs & 90‑day targets
- 90-day targets (example):
  - 500 signups
  - 50 paid subscribers
  - ฿25,000 MRR
- Key metrics to track daily:
  - New signups
  - Sessions started
  - Average minutes per user
  - Trial→paid conversion rate
  - Churn (7/30 day)

What I can do next (pick one)
- Commit this playbook to the repo (I’ll create a commit/PR) — I will need push access or you’ll run the git commands I provide.
- Configure basic monitoring (Uptime + Sentry) for you (I can add Actions or docs to do so).
- Harden rate limiting: I can open a PR to replace in-memory Map with Redis + short TTLs and a fallback TTL cleanup script.
- Add a release tag + GitHub Release notes summarizing go-live.

If you want me to commit the playbook, say: “Commit playbook” and confirm I can push (or tell me to give you the git commands to add the file locally). If you want immediate operational help, say which of the “What I can do next” options to start with.
