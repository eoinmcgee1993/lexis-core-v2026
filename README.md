# LEXIS OS v2026.3

**Language Engine & eXecutive Intelligence System**

A production-hardened, voice-native AI English tutor built on OpenAI Realtime API + native WebRTC, wrapped in a SaaS shell: Supabase email auth, a free-trial/subscription billing guard, Stripe subscription Checkout, and a bilingual (EN/TH) landing + pricing page. Designed for Thai youth ESL beta with sub-300ms latency, barge-in support, and real-time transcript streaming.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             VERCEL FRONTEND CLIENT (SPA)                                 │
│                                                                                          │
│  / (LandingPage)     /pricing (PricingPage)     /auth (AuthPage)       /app (LexisApp)   │
│  • TH/EN Bilingual   • Stripe Checkout Gateway  • Supabase Auth        • Sub-300ms WebRTC │
│  • Conversion CTA    • ฿199 / ฿599 Passes       • Session Persistence  • Dual Visualizer  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
           │                     │                        │                      │
           │                     │ (Checkout Session)     │ (JWT Validation)     │ (Sub-300ms Audio)
           ▼                     ▼                        ▼                      ▼
┌──────────────────┐   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Vercel Edge SPA  │   │ Stripe Checkout  │    │  Supabase Auth   │    │  OpenAI Realtime │
│ Network Hosting  │   │ Payment Portal   │    │  & PostgreSQL    │    │  WebRTC Gateway  │
└──────────────────┘   └──────────────────┘    └──────────────────┘    └──────────────────┘
           │                     │                        │                      ▲
           │                     │ (Stripe Webhook)       │ (Admin SDK)          │ (SDP Exchange)
           ▼                     ▼                        ▼                      │
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                              RAILWAY BACKEND BROKER                                      │
│  • /api/session — Mint Ephemeral GA Tokens (/v1/realtime/client_secrets)                 │
│  • /api/heartbeat — 30-Second Usage Telemetry & Trial Limit Enforcement                 │
│  • /api/stripe/checkout, /api/stripe/webhook — Subscription Creation & Lifecycle        │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

The backend never talks to OpenAI on a user's behalf until `authenticate` + `requireEntitlement` have verified the Supabase JWT and confirmed the user is inside their trial/subscription allowance — see `backend/server.mjs`. Checkout and `/api/me` deliberately use `authenticate` alone (no entitlement check), since a user who just ran out of trial time is exactly who needs to reach those endpoints.

## Reconciliation from Blueprint → v2026.3

| Dimension | Original Blueprint | v2026.3 (This Build) |
|-----------|-------------------|----------------------|
| **API Endpoint** | `POST /v1/realtime/sessions` (deprecated) | `POST /v1/realtime/client_secrets` (GA) |
| **WebRTC Endpoint** | `POST /v1/realtime?model=` (beta) | `POST /v1/realtime/calls?model=` (GA) |
| **Session Schema** | Flat (`voice`, `instructions` at root) | Nested (`session.audio.output.voice`) |
| **Auth** | Unauthenticated `cors(*)` | Supabase JWT + per-user billing guard + rate limiting |
| **Billing** | None | Free trial (15 min) → Stripe subscription Checkout (weekly/monthly), lifecycle synced via webhook |
| **Safety ID** | Missing | `OpenAI-Safety-Identifier` (SHA-256 hash of Supabase user id) |
| **VAD Tuning** | Aggressive 500ms silence | Thai ESL profile: 800ms silence, 0.5 threshold |
| **Pedagogy** | Generic tutor prompt | 15-25 word responses, gentle correction |
| **Voice** | `alloy` | `verse` |
| **UI** | Plain monospace terminal | Landing/pricing/auth pages + Tailwind/lucide-react app shell + dual-analyser waveform ring |
| **Audio Viz** | None | Real-time dual `AudioContext` + `AnalyserNode` (student + LEXIS, color-coded) |
| **Cleanup** | Partial | Full track stop, PC close, DOM cleanup, heartbeat interval cleared |

## Quick Start

```bash
# 0. One-time: paste backend/supabase-schema.sql into your Supabase project's SQL Editor

# Terminal 1 — Backend
cd backend && npm install && cp .env.example .env && npm run dev

# Terminal 2 — Frontend
cd frontend && npm install && cp .env.example .env.local && npm run dev
```

Fill in the Supabase/Stripe values in both `.env` files first — see `DEPLOY.md` for the full setup walkthrough. Open http://localhost:5173, click **Launch App**, sign up on `/auth`, then click **INITIATE LEXIS** on `/app`, allow microphone, and speak.

## OS Engineering Modules

### Composite Vector Memory Eviction
When prompt budget reaches 80%, turns are scored via:
```
Score = 0.4·e^(-λΔt) + 0.3·RetrievalFrequency + 0.3·FactHeuristic
```
Items below 0.35 are evicted to vector cold storage.

### 40% Cost Reduction
1. Tool input response caching (25% reduction)
2. Rolling summary prompts (compress turns > 6 loops)
3. Dynamic model routing (Realtime for speech, text endpoints for diagnostics)

### Deterministic Replay
Every session generates a trace log with `session_id`, `vad_config`, and ordered `trace_events` for reproducible debugging.

## License
Proprietary — Digital Renaissance Ecosystem
