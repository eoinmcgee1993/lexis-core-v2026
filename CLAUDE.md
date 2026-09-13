# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

LEXIS is a voice-native AI tutor for spoken English and Thai. A browser talks
directly to the OpenAI Realtime API over WebRTC; the backend never proxies
audio. It only mints short-lived client secrets, meters usage, and gates access.

Three deployed pieces, from one repo:

| Directory | Deploys as | Notes |
|---|---|---|
| `frontend/` | Vercel project `lexis-core-v026` → learnwithlexis.com | Vite + React SPA, Tailwind |
| `backend/` | Vercel project `lexis-commerce` | Express; `api/index.js` imports `app.mjs` without `.listen()` |
| `voice-service/` | not deployed | Python/torch TTS experiment; heavy deps, kept out of installs |

`backend/server.mjs` is the long-running entrypoint (Railway/local dev) and
`backend/api/index.js` the serverless one. Both import the same `app.mjs`, which
is where essentially all backend logic lives, organised under numbered section
banners (`1. ENV CHECK` … `7. ROUTES`).

## Commands

```bash
# Backend
cd backend
npm test                       # runs both suites below in sequence
node test/fair-use.test.mjs    # there is no runner; each suite is a plain script
node test/checkout.test.mjs    # boots app.mjs against local fake Stripe/Supabase
npm run dev                    # node --watch server.mjs (needs backend/.env)
node --check app.mjs           # fast syntax gate before committing

# Frontend
cd frontend
npm run dev                    # vite
npm run build                  # vite build && node scripts/prerender.mjs
npm run build:vite-only        # skip prerender when you only need to typecheck the bundle
```

There is no linter and no formatter configured. Don't add one incidentally.

`npm run build` runs the prerender step, which launches headless Chromium via
Playwright. Chromium is preinstalled at `/opt/pw-browsers` in the remote
container — never run `playwright install`.

### Running the backend without real secrets

`app.mjs` boots fine with placeholder env values, which makes the webhook and
auth paths drivable locally. Signature verification uses whatever
`STRIPE_WEBHOOK_SECRET` you set, so you can sign your own payloads and exercise
the real handler end to end. Anything that reaches Supabase or Stripe will fail
at that call, which is usually far enough to prove the branch you changed.

## Billing model — read before touching anything payment-shaped

**LEXIS sells one-off passes, not subscriptions** (changed 2 Sep 2026). A pass
is a single Stripe charge buying a fixed window: 7 days weekly, 30 days monthly.
Nothing auto-renews.

This is not a preference, it is a constraint. Thailand pays by PromptPay bank QR,
and Stripe does not support PromptPay in subscription-mode Checkout at all.
Recurring billing and being payable by the target market were mutually exclusive.

Consequences that are easy to break:

- Checkout runs in `mode: 'payment'` with **one-time** prices. A recurring price
  here is a hard Stripe error. The env var names carry an `_ONETIME` suffix
  specifically so a stale `STRIPE_PRICE_WEEKLY` can't silently point at the old
  recurring price. As of 11 Sep 2026 that naming is no longer the only guard:
  the three legacy recurring prices are archived in live Stripe, so there is
  nothing left on either product for a stale env var to resolve to. Archiving
  them first required repointing each product's `default_price` — both still
  pointed at the *recurring* price, which Stripe refuses to archive while it
  holds that slot, and which anything resolving a product rather than a price
  would have picked up. Both products now carry exactly one active price.
- `payment_method_types` is deliberately **not** set. Which methods appear is
  decided in the Stripe Dashboard; naming any method here silently overrides it.
- Entitlement is `profiles.access_expires_at`, checked by `paidAccessActive()`.
  Nothing in Stripe fires when a one-time charge gets old, so that check is the
  *only* thing that ends a pass. `subscription_status` stays `'active'` forever
  on its own.
- A **NULL** `access_expires_at` means "legacy recurring subscription, Stripe
  reports its liveness". Some of those are still live and still billing. The
  `customer.subscription.*` handlers exist only for them and carry a live-pass
  guard so they cannot cancel a pass someone just bought.
- Fulfilment goes through the `redeem_pass()` SQL function, not a read-then-write
  in the handler. It is idempotent against `redeemed_checkout_sessions`
  (a set, keyed by session id — not a "most recent" marker, which loses to
  out-of-order delivery), stacks purchases without losing paid days, and never
  downgrades a monthly tier.
- The webhook grants only on `payment_status: 'paid'` / `'no_payment_required'`.
  A delayed method arrives first as `completed` + `'unpaid'`, then as
  `checkout.session.async_payment_succeeded`. Both event types must stay
  subscribed in Stripe or PromptPay customers pay and get nothing.

`backend/supabase-schema.sql` is applied by pasting it into Supabase's SQL
Editor. `CREATE TABLE IF NOT EXISTS` is a no-op on an existing database, so **any
new column must also be added to the commented migration block at the bottom of
the file** — otherwise re-running the schema recreates the functions against
columns that don't exist, and plpgsql resolves those names at execution, so it
reports success and then every call 500s.

## Facts live in exactly one place

`frontend/src/content/facts.js` is the single source of truth for prices, trial
length, VAT status, billing semantics and FAQ copy. Pages, JSON-LD
(`src/data/structuredData.js`), the prerender step, the brand-kit generators in
`frontend/scripts/images/`, and `scripts/unit-economics.mjs` all import from it.
Never hardcode a price, a period, or a trial length anywhere else — the file
exists because those numbers were once wrong in three places at once, and once
JSON-LD existed the inconsistency was being published as machine-readable fact.

Copy that makes a commercial claim ("cancel anytime", "/week", `billingDuration`
in structured data) is treated as a factual assertion, not phrasing.

## Usage metering and fair use

Two separate counters on `profiles`, deliberately not merged:

- `seconds_used` / `max_allowed_seconds` — the free trial's lifetime total.
- `period_seconds_used` / `period_started_at` — a paying user's per-period
  fair-use window, reset by `record_heartbeat`.

The window rolls forward **by whole periods**, time-based and self-healing, never
driven by a Stripe invoice webhook — a webhook-driven reset would permanently cap
every subscriber if that event were ever unsubscribed. `PERIOD_DAYS` in
`app.mjs` and the interval inside `record_heartbeat` must agree exactly; a
calendar month in one and 30 days in the other disagree at the boundary.

`fairUseCapSeconds()` fails **closed** on an unrecognised tier. That state is
reachable without an attacker, so returning "no cap" there would lift the ceiling
on the one account already in a bad state.

RLS on `profiles` grants SELECT only. There is deliberately no client UPDATE
policy, so usage counters cannot be tampered with through PostgREST *directly*
— but RLS is only half of it. The `SECURITY DEFINER` functions bypass RLS by
design, and PostgREST exposes every function in `public` as an RPC, so their
EXECUTE grants are the other half of the same boundary.

That half had failed. On 10 Sep 2026 production was found with
`record_heartbeat` still executable by PUBLIC, `anon` and `authenticated`,
while the other three functions were correctly locked to `service_role`. The
REVOKE was in this repo's schema and had simply never been run against the
live database — `record_heartbeat` is created with `DROP FUNCTION` +
`CREATE FUNCTION` rather than `CREATE OR REPLACE`, and a DROP discards the
grants while the CREATE hands EXECUTE back to PUBLIC by default. Anyone with
the publishable anon key could call it against any `user_id`, and
`increment_seconds` was added unchecked, so a negative value subtracted from
the counters: unlimited Realtime minutes at the owner's expense.

Both halves are fixed and the increment is now clamped with `GREATEST(...,0)`.
The check is one query — Supabase's own linter reports it as **"Public Can
Execute SECURITY DEFINER Function"** — and it is worth running after any
schema application, because applying only part of the file is exactly how it
drifted.

## Testing

`backend/test/fair-use.test.mjs` extracts helper functions out of `app.mjs` **by
source text** rather than importing it (importing starts a server and needs full
production env). Renaming `fairUseCapSeconds`, `periodSecondsUsed`, `passDays`
or `paidAccessActive` will fail the suite loudly — that's intentional, not a bug
to work around.

Assertions are written against the live constants, not hardcoded minutes, so
retuning a cap can't silently invalidate the suite.

`backend/test/checkout.test.mjs` takes the opposite approach and runs the real
handlers: it stands up local HTTP servers for Stripe and Supabase, points the
app at them, and then imports `app.mjs` for real. Nothing inside the app is
stubbed, so what it asserts is the shipped params object. The seam is
`test/stripe-local-loader.mjs`, a module-resolution hook that swaps the
`stripe` specifier for a shim — deliberately outside `app.mjs`, because a
production code path that exists only for tests is the last thing payment code
needs. It covers the Community add-on's two mutually exclusive paths and the
branding fallback, and it fails loudly if `optional_items` is ever carried into
that fallback, where the SDK's pinned API version cannot accept it.

Both suites run in CI on every pull request and on pushes to `main`
(`.github/workflows/test.yml`). Nothing else does: the build is left to
Vercel, which already runs it on both projects and reports each as a commit
status, and the workflow needs no secrets because neither suite reaches a real
service. The repo's other workflow, `manual.yml`, is GitHub's stock
dispatch template and does nothing.

For SQL, the established pattern is to exercise a function against production
inside a `DO $$ ... RAISE EXCEPTION $$` block — the exception carries the results
out and rolls the transaction back, so nothing is written.

## Conventions

Comments here explain **why**, especially where a line looks wrong or arbitrary:
what was tried, what broke, what the alternative would cost. Several comments
record reverted work (the lip-sync fix in `TutorAvatarPhoto.jsx` and
`LexisApp.jsx`) so it isn't attempted again the same way. Match that density —
terse code with no rationale reads as a regression here.

Prefer fixing the shared fact over patching the symptom at each call site.
