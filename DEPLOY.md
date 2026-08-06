# LEXIS v2026.3 — Production Deployment Guide

## Prerequisites
- Node.js 18+
- OpenAI API key with Realtime API access
- Supabase project (Auth + Postgres)
- Stripe account with two Payment Links (Weekly, Monthly)
- Railway account (backend)
- Vercel account (frontend)
- GitHub repository

## Project Structure
```
lexis-core-v2026/
├── backend/
│   ├── server.mjs          # Session broker + Supabase auth/billing guard + heartbeat + Stripe webhook
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   └── supabaseClient.js  # Browser Supabase client (anon key)
│   │   ├── LandingPage.jsx        # Public "/" — bilingual marketing + pricing
│   │   ├── AuthGate.jsx           # Sign in/up form, loads session + profile for "/app"
│   │   ├── App.jsx                # WebRTC client + visualizer + transcripts + heartbeat
│   │   └── main.jsx                # Two-route client router ("/" vs "/app")
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── supabase/
│   └── schema.sql          # profiles table, RLS policy, signup trigger, increment_sessions RPC
├── railway.toml
├── vercel.json
└── DEPLOY.md
```

## 1. Supabase Setup
1. Create a project at https://supabase.com.
2. **SQL Editor** → paste and run `supabase/schema.sql`. This creates:
   - `public.profiles` (subscription status/tier, usage counters, Stripe customer id)
   - a `SELECT`-only RLS policy so users can read their own row
   - a trigger that inserts a `profiles` row automatically on signup
   - an `increment_sessions` RPC used by the backend (service-role only)
3. **Authentication → Providers**: Email is enabled by default; decide whether to require email confirmation (Authentication → Settings) — the sign-up form in `AuthGate.jsx` assumes confirmation is on and tells the user to check their inbox.
4. **Project Settings → API**: copy the Project URL, `anon` public key, and `service_role` secret key — you'll need all three below.

## 2. Stripe Setup
1. **Payment Links** → create one for the Weekly pass (฿199) and one for the Monthly pass (฿599).
   - Under each link's settings, add metadata `tier=weekly` / `tier=monthly` — the webhook reads this to set `subscription_tier`.
   - Require the customer's email at checkout — the webhook matches the paying customer back to a `profiles` row by email.
2. **Developers → Webhooks** → add an endpoint at `https://your-backend.up.railway.app/api/webhook/stripe`, subscribed to `checkout.session.completed`. Copy the endpoint's **Signing secret** (`whsec_...`).

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
To test the Stripe webhook locally, run `stripe listen --forward-to localhost:3001/api/webhook/stripe` (Stripe CLI) and use the signing secret it prints.

### 2. Frontend
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local:
#   VITE_BACKEND_URL=http://localhost:3001
#   VITE_SUPABASE_URL=...
#   VITE_SUPABASE_ANON_KEY=...
#   VITE_STRIPE_WEEKLY_LINK=...
#   VITE_STRIPE_MONTHLY_LINK=...

npm install
npm run dev
# → http://localhost:5173
```

### 3. Test
- Open http://localhost:5173 — the bilingual landing page.
- Click **Launch App** (or **Start Free Practice**) → routes to `/app`.
- Sign up with an email/password, confirm the email if confirmation is enabled, sign in.
- Click **INITIATE LEXIS** (or press Space), allow microphone access, and speak.
- Watch the trial countdown in the top bar tick down every 30s (via `/api/heartbeat`); at 0 the session ends and a "usage limit reached" banner links back to pricing.

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
   - `VITE_STRIPE_WEEKLY_LINK`, `VITE_STRIPE_MONTHLY_LINK`
4. Deploy. `vercel.json` already rewrites all paths to `index.html` so `/app` works on refresh.

### Post-Deployment
- [ ] Update `ALLOWED_ORIGINS` in Railway to match Vercel production domain
- [ ] Verify `/health` returns `{"status":"Operational"}`
- [ ] Send a Stripe test payment through each Payment Link and confirm the buyer's `profiles` row flips to `active`
- [ ] Test a full sign-up → free trial → 402 expiry flow from the Vercel URL
- [ ] Confirm mic permissions on mobile Safari/Chrome
- [ ] Set up Railway log drains for monitoring

## Security Checklist
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set only on the backend (Railway) — never in frontend env vars or committed files
- [ ] `STRIPE_WEBHOOK_SECRET` is set — without it, `/api/webhook/stripe` refuses every event rather than trusting an unsigned body
- [ ] `ALLOWED_ORIGINS` restricts CORS to production domain only
- [ ] `.env` / `.env.local` files are in `.gitignore` and never committed
- [ ] `OpenAI-Safety-Identifier` headers are active (hashed Supabase user id + salt)
- [ ] Rate limiting is active (10 req/min per IP on `/api/session`, 6 req/min on `/api/heartbeat`)
- [ ] RLS is enabled on `public.profiles` with only a `SELECT` policy — all writes happen server-side via the service-role key

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `CORS policy violation` | Add Vercel domain to `ALLOWED_ORIGINS` |
| `401 Unauthorized` on `/api/session` | User isn't signed in, or the Supabase session expired — sign in again |
| `402 Payment Required` | Trial exhausted or subscription expired — expected; user needs to buy a pass |
| `403 User profile not found` | The signup trigger didn't fire — re-run `supabase/schema.sql`, or check Postgres logs for the trigger |
| Stripe webhook `400 signature verification failed` | `STRIPE_WEBHOOK_SECRET` doesn't match the endpoint in the Stripe Dashboard |
| Payment succeeded but account still shows `free_trial` | The Payment Link didn't collect the same email as the Supabase account, or the webhook endpoint isn't reachable — check Stripe's webhook delivery logs |
| `OpenAI API Error 404` | Check `OPENAI_MODEL` is valid Realtime model |
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
