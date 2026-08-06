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
│   │   └── main.jsx                 # Four-route client router
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── railway.toml
├── vercel.json
└── DEPLOY.md
```

## 1. Supabase Setup
1. Create a project at https://supabase.com (Singapore region recommended for Thai users' latency).
2. **SQL Editor** → paste and run `backend/supabase-schema.sql`. This creates:
   - `public.profiles` (subscription status/tier, usage counters, Stripe customer + subscription ids)
   - `public.usage_logs` (per-session telemetry log table)
   - RLS policies (`SELECT`/`UPDATE` own row on `profiles`, `SELECT` own rows on `usage_logs`)
   - a trigger that inserts a `profiles` row automatically on signup
   - `increment_sessions` and `record_heartbeat` RPCs used by the backend (service-role only)
3. **Authentication → Providers**: Email is enabled by default; decide whether to require email confirmation (Authentication → Settings) — the sign-up form on `/auth` assumes confirmation is on and tells the user to check their inbox.
4. **Project Settings → API**: copy the Project URL, `anon` public key, and `service_role` secret key — you'll need all three below.

## 2. Stripe Setup
1. **Product catalog** → create a "Weekly Pass" product with a recurring ฿199/week Price, and a "Monthly Immersion" product with a recurring ฿599/month Price. Copy each Price ID (`price_...`) — the frontend sends these to the backend, which creates the Checkout Session server-side (no Payment Links involved).
2. **Developers → Webhooks** → add an endpoint at `https://your-backend.up.railway.app/api/stripe/webhook`, subscribed to `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`. Copy the endpoint's **Signing secret** (`whsec_...`).

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
#   FRONTEND_URL=http://localhost:5173

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
#   VITE_STRIPE_WEEKLY_PRICE_ID=price_...
#   VITE_STRIPE_MONTHLY_PRICE_ID=price_...

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
3. Railway auto-detects Node.js via `railway.toml`.
4. Railway Dashboard → **Variables**:
   - `OPENAI_API_KEY`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `LEXIS_SALT` (any random string for hashing)
   - `ALLOWED_ORIGINS` (your Vercel domain, e.g. `https://lexis.vercel.app`)
   - `FRONTEND_URL` (same Vercel domain — used for Stripe Checkout success/cancel redirects)
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
   - `VITE_STRIPE_WEEKLY_PRICE_ID`, `VITE_STRIPE_MONTHLY_PRICE_ID`
4. Deploy. `vercel.json` already rewrites all paths to `index.html` so `/pricing`, `/auth`, and `/app` all work on refresh.

### Post-Deployment
- [ ] Update `ALLOWED_ORIGINS` and `FRONTEND_URL` in Railway to match the Vercel production domain
- [ ] Verify `/health` returns `{"status":"Operational"}`
- [ ] Complete a real Stripe test-mode purchase from `/pricing` and confirm the buyer's `profiles` row flips to `active` with the right `subscription_tier`
- [ ] Cancel that test subscription in the Stripe Dashboard and confirm the webhook flips the row to `canceled`
- [ ] Test a full sign-up → free trial → 403 expiry → upgrade flow from the Vercel URL
- [ ] Confirm mic permissions on mobile Safari/Chrome
- [ ] Set up Railway log drains for monitoring

## Security Checklist
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set only on the backend (Railway) — never in frontend env vars or committed files
- [ ] `STRIPE_WEBHOOK_SECRET` is set — without it the server won't boot, and `/api/stripe/webhook` never trusts an unsigned body
- [ ] `ALLOWED_ORIGINS` restricts CORS to production domain only
- [ ] `.env` / `.env.local` files are in `.gitignore` and never committed
- [ ] `OpenAI-Safety-Identifier` headers are active (hashed Supabase user id + salt)
- [ ] Rate limiting is active (10 req/min per IP on `/api/session`, 6 req/min on `/api/heartbeat`)
- [ ] RLS is enabled on `public.profiles`/`public.usage_logs`; all billing/usage writes still happen server-side via the service-role key regardless of the client-facing policies
- [ ] `/api/stripe/checkout` and `/api/me` require only a valid session (not an active plan) — a user whose trial just expired must still be able to reach checkout

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
