# LEXIS OS v2026.3

**Language Engine & eXecutive Intelligence System**

A production-hardened, voice-native AI English tutor built on OpenAI Realtime API + native WebRTC, wrapped in a SaaS shell: Supabase email auth, a free-trial/subscription billing guard, Stripe Payment Links, and a bilingual (EN/TH) landing page. Designed for Thai youth ESL beta with sub-300ms latency, barge-in support, and real-time transcript streaming.

## Architecture

```
┌─────────────┐   sign in / sign up    ┌─────────────┐
│   Browser   │ ─────────────────────► │  Supabase   │
│  (React 18) │ ◄───────────────────── │ Auth + DB   │
└──────┬──────┘   JWT + profile row    └──────┬──────┘
       │ POST /api/session                    │ service-role
       │ POST /api/heartbeat (every 30s)       │ reads/writes
       │ Authorization: Bearer <jwt>           ▼
       ▼                              ┌─────────────┐
┌─────────────┐                       │   Node.js   │
│   Stripe    │ ── checkout.session ─►│   Broker    │
│ Payment Link│    .completed webhook │ (Express)   │
└─────────────┘                       └──────┬──────┘
                                              │
       WebRTC PeerConnection (SDP Offer/Answer)
       OPUS Audio + DataChannel Events        │
                                              ▼
┌─────────────────────────────────────────────────────────┐
│              OpenAI Realtime API (GA)                   │
│         gpt-4o-realtime-preview-2024-12-17              │
└─────────────────────────────────────────────────────────┘
```

The backend never talks to OpenAI on a user's behalf until `authenticateAndCheckBilling` has verified their Supabase JWT and confirmed they're inside their trial/subscription allowance — see `backend/server.mjs`.

## Reconciliation from Blueprint → v2026.3

| Dimension | Original Blueprint | v2026.3 (This Build) |
|-----------|-------------------|----------------------|
| **API Endpoint** | `POST /v1/realtime/sessions` (deprecated) | `POST /v1/realtime/client_secrets` (GA) |
| **WebRTC Endpoint** | `POST /v1/realtime?model=` (beta) | `POST /v1/realtime/calls?model=` (GA) |
| **Session Schema** | Flat (`voice`, `instructions` at root) | Nested (`session.audio.output.voice`) |
| **Auth** | Unauthenticated `cors(*)` | Supabase JWT + per-user billing guard + rate limiting |
| **Billing** | None | Free trial (30 min) → Stripe-activated weekly/monthly pass |
| **Safety ID** | Missing | `OpenAI-Safety-Identifier` (SHA-256 hash of Supabase user id) |
| **VAD Tuning** | Aggressive 500ms silence | Thai ESL profile: 800ms silence, 0.5 threshold |
| **Pedagogy** | Generic tutor prompt | 15-25 word responses, gentle correction |
| **Voice** | `alloy` | `verse` |
| **UI** | Plain monospace terminal | Landing page + Tailwind/lucide-react app shell + transcript bubbles |
| **Audio Viz** | None | Real-time `AudioContext` + `AnalyserNode` |
| **Reconnect** | None | 3-attempt exponential backoff |
| **Cleanup** | Partial | Full track stop, PC close, DOM cleanup, heartbeat interval cleared |

## Quick Start

```bash
# 0. One-time: paste supabase/schema.sql into your Supabase project's SQL Editor

# Terminal 1 — Backend
cd backend && npm install && cp .env.example .env && npm run dev

# Terminal 2 — Frontend
cd frontend && npm install && cp .env.example .env.local && npm run dev
```

Fill in the Supabase/Stripe values in both `.env` files first — see `DEPLOY.md` for the full setup walkthrough. Open http://localhost:5173, click **Launch App**, sign up, then press **Space**, allow microphone, and speak.

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
