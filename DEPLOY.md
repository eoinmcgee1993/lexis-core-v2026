# LEXIS v2026.3 — Production Deployment Guide

## Prerequisites
- Node.js 18+
- OpenAI API key with Realtime API access
- Supabase project (Auth + Postgres)
- Stripe account with two recurring Prices (Weekly ฿199, Monthly ฿599)
- Railway account (backend)
- Vercel account (frontend)
- GitHub repository

## Project Structure
```
lexis-core-v2026/
├── backend/
│   ├── server.mjs               # Session broker + Supabase auth/billing guard + heartbeat + Stripe checkout/webhook
│   ├── supabase-schema.sql      # profiles + usage_logs tables, RLS, signup trigger, RPCs
│   ├── railway.toml             # Lives here, not repo root — see Root Directory note below
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   └── supabaseClient.js    # Browser Supabase client (anon key)
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Session + profile, signIn/signUp/signOut
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx      # "/" — bilingual marketing + pricing teaser
│   │   │   ├── PricingPage.jsx      # "/pricing" — Stripe Checkout gateway
│   │   │   ├── AuthPage.jsx         # "/auth" — sign in / sign up
│   │   │   └── LexisApp.jsx         # "/app" — sub-300ms WebRTC voice client + heartbeat
│   │   ├── App.jsx                  # Four-route client router (auth-gates /app)
│   │   └── main.jsx                 # Mounts <App/>
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── vercel.json
└── DEPLOY.md
```

## 1. Supabase Setup
1. Create a project at https://supabase.com (Singapore region recommended for Thai users' latency).
2. **SQL Editor** → paste and run `backend/supabase-schema.sql`. This creates:
   - `public.profiles` (subscription status/tier, usage counters, Stripe customer + subscription ids)
   - `public.usage_logs` (per-session telemetry log table)
   - RLS policies (`SELECT`-only own row on `profiles`, `SELECT` own rows on `usage_logs` — no client-facing `UPDATE` policy; see the security checklist below for why)
   - a trigger that inserts a `profiles` row automatically on signup
   - `increment_sessions` and `record_heartbeat` RPCs used by the backend (service-role only)
3. **Authentication → Providers**: Email is enabled by default; decide whether to require email confirmation (Authentication → Settings) — the sign-up form on `/auth` assumes confirmation is on and tells the user to check their inbox.
4. **Project Settings → API**: copy the Project URL, `anon` public key, and `service_role` secret key — you'll need all three below.

## 2. Stripe Setup
1. **Product catalog** → create a "Weekly Pass" product with a recurring ฿199/week Price, and a "Monthly Immersion" product with a recurring ฿599/month Price. Copy each Price ID (`price_...`, not the product id).
2. Edit `frontend/src/pages/PricingPage.jsx` and set the `STRIPE_PRICES` object to your real IDs:
   ```js
   const STRIPE_PRICES = {
     weekly: 'price_xxxxxxxxxxxxx',
     monthly: 'price_xxxxxxxxxxxxx'
   };
   ```
   The frontend sends the selected ID to the backend, which creates the Checkout Session server-side (no Payment Links involved).
3. **Developers → Webhooks** → add an endpoint at `https://your-backend.up.railway.app/api/stripe/webhook`, subscribed to `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`. Copy the endpoint's **Signing secret** (`whsec_...`).

## Local Development

### 1. Backend
```bash
cd backend
cp .env.example .env
# Edit .env:
#   OPENAI_API_KEY=sk-proj-...
#   SUPABASE_URL=...
#   SUPABASE_SERVICE_ROLE_KEY=...
#   STRIPE_SECRET_KEY=...
#   STRIPE_WEBHOOK_SECRET=...
#   ALLOWED_ORIGINS=http://localhost:5173

npm install
npm run dev
# → http://localhost:3001
# → Health check: http://localhost:3001/health
```
The server refuses to boot if `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, or `STRIPE_WEBHOOK_SECRET` is missing.

To test the Stripe webhook locally, run `stripe listen --forward-to localhost:3001/api/stripe/webhook` (Stripe CLI) and use the signing secret it prints.

### 2. Frontend
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local:
#   VITE_BACKEND_URL=http://localhost:3001
#   VITE_SUPABASE_URL=...
#   VITE_SUPABASE_ANON_KEY=...
# (Stripe price IDs are set directly in PricingPage.jsx — see Step 2 above)

npm install
npm run dev
# → http://localhost:5173
```

### 3. Test
- Open http://localhost:5173 — the bilingual landing page.
- Click **Launch App** → redirected to `/auth` (no session yet).
- Sign up with an email/password, confirm the email if confirmation is enabled, sign in → lands on `/app`.
- Click **INITIATE LEXIS**, allow microphone access, and speak.
- After ~30 minutes of trial usage (or immediately, by lowering `max_allowed_seconds` on your test row), the next `/api/heartbeat` returns 403 and the app shows an "upgrade" banner linking to `/pricing`.
- On `/pricing`, click a paid plan → redirected to Stripe Checkout → complete a test payment (`4242 4242 4242 4242`) → redirected back to `/app?payment=success` with the pass now active.

## Production Deployment

### Backend → Railway
1. Push repo to GitHub.
2. Railway: **New Project** → **Deploy from GitHub repo**.
3. **Settings → Root Directory → set to `backend`.** This is required, not optional: `backend/package.json` is nested, not at the repo root, and this is a two-app monorepo (backend + frontend) — without Root Directory set, Railway's nixpacks builder scans the repo root, finds no `package.json` there, and either fails outright or misdetects the app, regardless of what `railway.toml` says. Once Root Directory is `backend`, nixpacks auto-detects Node.js correctly and `railway.toml`'s `startCommand`/`healthcheckPath` apply.
4. Railway Dashboard → **Variables**:
   - `OPENAI_API_KEY`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `LEXIS_SALT` (any random string for hashing)
   - `ALLOWED_ORIGINS` (your Vercel domain(s), e.g. `https://lexis.vercel.app` — also doubles as the whitelist Stripe Checkout redirects are resolved against, see below)
   - `PORT` (Railway sets automatically)
5. Deploy. Railway provides URL: `https://lexis-api.up.railway.app`.
6. Point the Stripe webhook endpoint (step 2 above) at this URL.

### Frontend → Vercel
1. Vercel: **Add New Project** → **Import Git Repository**.
2. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Vercel Dashboard → **Environment Variables**:
   - `VITE_BACKEND_URL` = Railway backend URL
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. Deploy. `vercel.json` already rewrites all paths to `index.html` so `/pricing`, `/auth`, and `/app` all work on refresh.

### Post-Deployment
- [ ] Update `ALLOWED_ORIGINS` in Railway to match the Vercel production domain (include every domain checkout should be able to redirect back to — production and any preview domains you use)
- [ ] Verify `/health` returns `{"status":"Operational"}`
- [ ] Complete a real Stripe test-mode purchase from `/pricing` and confirm the buyer's `profiles` row flips to `active` with the right `subscription_tier`
- [ ] Cancel that test subscription in the Stripe Dashboard and confirm the webhook flips the row to `canceled`
- [ ] Test a full sign-up → free trial → 403 expiry → upgrade flow from the Vercel URL
- [ ] Confirm mic permissions on mobile Safari/Chrome
- [ ] Set up Railway log drains for monitoring

## Go-Live Verification
Run these against the actual deployed Railway/Vercel/Supabase/Stripe stack before calling it live — none of these are exercisable from a local sandbox without real accounts, so they're separate from the automated checks above.

1. **Schema applied cleanly.** Pasting `backend/supabase-schema.sql` into the Supabase SQL Editor should report success with no errors. Check **Database → Triggers** and confirm `on_auth_user_created` is attached to `auth.users`.
2. **CORS lockdown.** `curl -I -X OPTIONS -H "Origin: https://malicious-domain.com" -H "Access-Control-Request-Method: POST" https://your-railway-app.up.railway.app/api/session` should come back with no `Access-Control-Allow-Origin` header. (Verified locally against the dev server with an equivalent disallowed-origin request — see the security checklist below — but re-run it against the real Railway URL once deployed, since `ALLOWED_ORIGINS` there is a separate value.)
3. **Dynamic Stripe redirect.** From `https://<your-vercel-domain>/pricing`, start a checkout. The Stripe-hosted page's return URL should be `https://<your-vercel-domain>/app?payment=success` — i.e. it matches wherever the checkout was actually started from, not a hardcoded domain. This is the request-`Origin`-based resolution in `resolveFrontendOrigin()` (`backend/server.mjs`) — confirmed against multiple `ALLOWED_ORIGINS` entries (prod + a second origin) locally; worth a real end-to-end click-through once Stripe is live.
4. **Echo cancellation under load.** Run a live session on a laptop with built-in speakers at high volume (no headphones). LEXIS's response transcript should keep streaming without the barge-in / VAD logic falsely triggering from its own audio bleeding into the mic. If it does, that's `echoCancellation: false` on that device/browser — recommend headphones for the beta cohort.

## Security Checklist
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set only on the backend (Railway) — never in frontend env vars or committed files
- [ ] `STRIPE_WEBHOOK_SECRET` is set — without it the server won't boot, and `/api/stripe/webhook` never trusts an unsigned body
- [ ] `ALLOWED_ORIGINS` restricts CORS to production domain only
- [ ] `.env` / `.env.local` files are in `.gitignore` and never committed
- [ ] `OpenAI-Safety-Identifier` headers are active (hashed Supabase user id + salt)
- [ ] Rate limiting is active (10 req/min per IP on `/api/session`, 6 req/min on `/api/heartbeat`)
- [ ] RLS is enabled on `public.profiles`/`public.usage_logs` with **no client-facing `UPDATE` policy on `profiles`** — a `USING`-only update policy (no `WITH CHECK`) would let any signed-in user `PATCH` their own row directly via Supabase's REST API to `subscription_status: 'active'`, bypassing this backend entirely. All billing/usage writes happen server-side via the service-role key, which doesn't need a client policy to work.
- [ ] `/api/stripe/checkout` and `/api/me` require only a valid session (not an active plan) — a user whose trial just expired must still be able to reach checkout
- [ ] Stripe Checkout success/cancel URLs are resolved from the request's `Origin` header only after checking it against `ALLOWED_ORIGINS` — never trust `Origin` unchecked, it's attacker-controlled

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `CORS policy violation` | Add Vercel domain to `ALLOWED_ORIGINS` |
| `401 Unauthorized` | User isn't signed in, or the Supabase session expired — sign in again |
| `403 TRIAL_EXHAUSTED` on `/api/session` or `/api/heartbeat` | Trial exhausted or subscription lapsed — expected; user needs to buy/renew a pass via `/pricing` |
| `403 Profile not found` | The signup trigger didn't fire — re-run `backend/supabase-schema.sql`, or check Postgres logs for the trigger |
| Stripe checkout 500s | `priceId` sent from the frontend doesn't match a real Stripe Price, or `STRIPE_SECRET_KEY` is for the wrong mode (test vs live) |
| Stripe webhook `signature verification failed` | `STRIPE_WEBHOOK_SECRET` doesn't match the endpoint in the Stripe Dashboard |
| Payment succeeded but account still shows `free_trial` | The webhook endpoint isn't reachable, or isn't subscribed to `checkout.session.completed` — check Stripe's webhook delivery logs |
| `OpenAI API Error 404` | Check `OPENAI_MODEL` is a valid Realtime model |
| No audio output | Browser autoplay policy requires user interaction first |
| High latency | User proximity to OpenAI edge (US/EU) matters |
| ICE failed | Corporate firewalls may need TURN server |
| Transcripts not showing | Check browser console for DataChannel errors |

## API Endpoint Migration Notes
This build uses OpenAI's **GA (General Availability)** endpoints:
- `POST /v1/realtime/client_secrets` — ephemeral token minting
- `POST /v1/realtime/calls?model=` — WebRTC SDP exchange
- Nested `session` schema with `session.type: "realtime"`

If you encounter 404s, verify your OpenAI account has Realtime API access.
