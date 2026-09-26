---
name: run-lexis-core
description: Build, run, and drive LEXIS's frontend (Vite/React) and backend (Express) locally with placeholder env vars — start the dev servers, screenshot the running app via a headless-Chromium REPL driver, curl the backend's API, and run the test suites. Use when asked to run, start, launch, screenshot, or smoke-test the app, or to confirm a change actually works (not just passes tests).
---

LEXIS is two separately-deployed pieces from one repo (see the root
`CLAUDE.md`): `frontend/` (Vite/React SPA — marketing site, the `/app`
tutor, and `/studio`, a Higgsfield text-to-video tool) and `backend/`
(Express). Both boot fine locally with placeholder secrets — real
Supabase/Stripe/OpenAI/Higgsfield calls fail at that call, which is
normally far enough to prove a change. `voice-service/` is a separate,
undeployed Python/torch experiment; this skill doesn't cover it.

Drive the frontend with the Playwright REPL at
`.claude/skills/run-lexis-core/driver.mjs`, headless Chromium, no
`chromium-cli` binary available in this container. Drive the backend
with plain `curl`. All paths below are relative to the repo root.

## Prerequisites

Nothing beyond what the repo already needs — `npm install` in both
`backend/` and `frontend/` (the SessionStart hook does this automatically
on a fresh container; `npm run dev`/`npm test` fail immediately with a
clear `Cannot find package` error if it hasn't run). The container's
Chromium lives at `/opt/pw-browsers/chromium` — do not `npx playwright
install`; the driver points `executablePath` there directly, and it must:
`frontend/node_modules/playwright-core` is pinned to `1.62.1`, older than
whatever `playwright install` would fetch, and a bare `chromium.launch()`
with no `executablePath` fails to find a matching browser build.

## Build

Nothing to build for local dev — both `dev` scripts run straight from
source. (`frontend`'s `npm run build` additionally prerenders via
headless Chromium — see `CLAUDE.md` — but isn't needed just to run the
app.)

## Run (agent path)

**1. Placeholder env files** (git-ignored, safe to recreate each session):

```bash
cat > backend/.env <<'EOF'
OPENAI_API_KEY=sk-proj-placeholder
OPENAI_MODEL=gpt-realtime-2.1
OPENAI_TEXT_MODEL=gpt-4o-mini
SUPABASE_URL=https://placeholder.supabase.co
SUPABASE_SERVICE_ROLE_KEY=placeholder_service_role_key
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
PORT=3001
# Higgsfield (/studio, /api/generations*) is optional — leave these blank
# and the app still boots fine; those routes just answer 503/401. See
# Gotchas.
HF_API_KEY_ID=
HF_API_KEY_SECRET=
HIGGSFIELD_ALLOWED_EMAILS=
HIGGSFIELD_DAILY_LIMIT=5
HIGGSFIELD_TIMEOUT_MINUTES=30
HIGGSFIELD_WEBHOOK_BASE_URL=
HIGGSFIELD_WEBHOOK_SECRET=
EOF

cat > frontend/.env <<'EOF'
VITE_BACKEND_URL=http://localhost:3001
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder_anon_key
EOF
```

**2. Start both dev servers, backgrounded, and wait for each to actually serve:**

```bash
(cd backend && node server.mjs > /tmp/lexis-backend.log 2>&1 &)
timeout 15 bash -c 'until curl -sf http://localhost:3001/health >/dev/null; do sleep 1; done'

(cd frontend && npm run dev -- --port 5173 --strictPort > /tmp/lexis-frontend.log 2>&1 &)
timeout 30 bash -c 'until curl -sf http://localhost:5173 >/dev/null; do sleep 1; done'
```

Stop either by killing its port's listener (`npm`'s child PID doesn't
forward SIGTERM, so `$!` alone won't stop the real server):

```bash
lsof -ti:3001 -sTCP:LISTEN | xargs -r kill   # backend
lsof -ti:5173 -sTCP:LISTEN | xargs -r kill   # frontend
```

**3. Backend: plain `curl`.**

```bash
curl -s http://localhost:3001/health
# {"status":"Operational","system":"LEXIS Commerce v2026.3","timestamp":"..."}
curl -s http://localhost:3001/api/me
# 401 {"error":"Unauthorized: Missing authorization header."} — expected, no token
curl -s http://localhost:3001/api/generations
# 401, same shape — the Higgsfield routes sit behind `authenticate` same as everything else
```

Every other route in `app.mjs` needs a Supabase-issued bearer token
(`authenticate` middleware) — not reachable with placeholder Supabase
creds. `/health` and the 401 shape on a protected route are the useful
smoke signal without one.

**4. Frontend: the driver, under tmux for interactive use.**

```bash
tmux new-session -d -s lexis -x 200 -y 50
tmux send-keys -t lexis 'cd frontend && node ../.claude/skills/run-lexis-core/driver.mjs' Enter
timeout 15 bash -c 'until tmux capture-pane -t lexis -p | grep -q "driver>"; do sleep 0.3; done'

tmux send-keys -t lexis 'launch' Enter
timeout 20 bash -c 'until tmux capture-pane -t lexis -p | tail -3 | grep -q launched; do sleep 0.3; done'

tmux send-keys -t lexis 'nav http://localhost:5173' Enter
tmux send-keys -t lexis 'wait-for body' Enter
tmux send-keys -t lexis 'screenshot landing' Enter
timeout 10 bash -c 'until tmux capture-pane -t lexis -p | tail -3 | grep -q screenshot:; do sleep 0.3; done'
tmux send-keys -t lexis 'console --errors' Enter
tmux capture-pane -t lexis -p
```

Screenshots land in `/tmp/lexis-driver-shots/` (override: `SCREENSHOT_DIR`
env var on the driver process). Actually open the PNG — a blank canvas or
an error page still exits `screenshot` cleanly.

### Driver commands

| command | what it does |
|---|---|
| `launch` | launch headless Chromium |
| `nav <url>` | navigate |
| `wait-for <sel \| text=... \| role=name[name="..."]>` | wait up to 15s, visible |
| `click <sel \| text=... \| role=...>` | click via Playwright locator |
| `fill <sel> <text...>` | fill a form field (real input events — see Gotchas) |
| `type <text>` / `press <key>` | keyboard input |
| `screenshot [name]` | full-page PNG → `SCREENSHOT_DIR` |
| `screenshot-element <sel> [name]` | crop to one element |
| `text [sel]` | print `innerText` (body if no selector) |
| `eval <js>` | run in-page, print JSON result |
| `console [--errors]` | print buffered console/page errors since last `nav` |
| `url` | print current page URL |
| `quit` | close browser, exit REPL |

### Verified example: Home → Pricing

This exact sequence was run in this container and screenshotted both
pages — the landing hero, and the pricing cards showing the real one-time
passes (฿0 / ฿199 / ฿599, "ends by itself... nothing to cancel", matching
the billing model `CLAUDE.md` describes) with zero console errors:

```bash
tmux send-keys -t lexis 'click text=Pricing' Enter
tmux send-keys -t lexis 'wait-for text=7 days' Enter
tmux send-keys -t lexis 'screenshot pricing' Enter
```

### Verified example: `/studio` (auth-gated route)

`/studio` (Higgsfield text-to-video, added 23 Sep 2026) is gated exactly
like `/app` — signed out, it renders the sign-up form, not the studio UI.
Confirmed by navigating straight to it with no session:

```bash
tmux send-keys -t lexis 'nav http://localhost:5173/studio' Enter
tmux send-keys -t lexis 'wait-for body' Enter
tmux send-keys -t lexis 'screenshot studio-gated' Enter
```

Zero console errors either way. There's no local path to the signed-in
studio UI itself without a real Supabase session — see Gotchas.

## Run (human path)

```bash
cd backend && npm run dev     # node --watch server.mjs, needs backend/.env
cd frontend && npm run dev    # vite, opens nothing headless-useful on its own
```

## Test

```bash
cd backend && npm test        # fair-use + checkout + higgsfield suites, 65 assertions, no real Stripe/Supabase/Higgsfield reached
```

`higgsfield.test.mjs` runs a local mock HTTP server standing in for
`api.higgsfield.ai` — it needs no real `HF_API_KEY_ID`/`HF_API_KEY_SECRET`
and passes fully with the placeholder `backend/.env` above.

Frontend has no standalone test command; `npm run build` (full prerender)
is its closest correctness check and needs a working Supabase URL shape
to get through prerender's route list — the placeholder `.env` above is
enough since prerender doesn't make live Supabase calls, just imports
`facts.js`.

## Gotchas

- **Bare `import 'playwright-core'` in the driver fails from every cwd.**
  The driver lives under `.claude/skills/run-lexis-core/`, and Node's ESM
  resolver looks for bare-specifier packages starting at the *importing
  file's own directory*, walking up — never from `process.cwd()`. There's
  no `node_modules` anywhere under `.claude/`, so a plain `import {
  chromium } from 'playwright-core'` throws `ERR_MODULE_NOT_FOUND`
  regardless of which directory you launch `node` from. The driver works
  around this with a `pathToFileURL` dynamic import straight at
  `frontend/node_modules/playwright-core/index.mjs`, resolved from the
  driver's own path — don't revert that to a plain import.
- **`chromium.launch()` with no `executablePath` fails.** This repo pins
  `playwright-core@1.62.1`; the browser build that version's own
  `npx playwright install` would fetch doesn't match what's already
  installed at `/opt/pw-browsers/`. Always pass
  `executablePath: '/opt/pw-browsers/chromium'` (the driver does this by
  default via `CHROMIUM_PATH`).
- **`npm` doesn't forward `SIGTERM` to `vite`/`node --watch`.** Killing
  the backgrounded shell's `$!` PID leaves the real dev server running
  and the next launch hits `EADDRINUSE`. Kill by port
  (`lsof -ti:<port> -sTCP:LISTEN | xargs -r kill`), not by PID.
- **Almost every backend route needs a real Supabase-issued JWT.** With
  placeholder Supabase credentials there is no way to mint one locally —
  `/health` (200, no auth) and the 401 shape on any protected route
  (`authenticate` middleware rejecting a missing/invalid token) are the
  full smoke-test surface without wiring real Supabase creds into
  `backend/.env`.
- **Controlled React inputs need the driver's `fill`, never `eval`.**
  `page.evaluate(el => el.value = '...')` sets the DOM value without
  firing React's `onChange`, so the app's state never updates — use the
  `fill` command, which goes through Playwright's real input pipeline.
- **Leaving the Higgsfield vars blank doesn't break anything — it's the
  designed-in state.** `backend/.env.example`'s own comment says so:
  unset `HF_API_KEY_ID`/`HF_API_KEY_SECRET` means `/api/generations*`
  answers 503 and "nothing else in the app is affected." Don't invent
  placeholder-looking values for these the way the other providers get
  `sk-proj-placeholder` etc. — blank is the correct local-dev value, not
  a gap to fill in.
- **The signed-in `/studio` UI itself isn't reachable locally without a
  real Supabase session** — same as the rest of `/app`. The gated
  sign-up-form view (this skill's verified example) is as far as the
  driver gets without real Supabase creds in `backend/.env` /
  `frontend/.env`.

## Troubleshooting

- **`Cannot find package 'playwright-core'` when running `driver.mjs`
  directly** (not through the wrapper above): confirm
  `frontend/node_modules/playwright-core` exists (`cd frontend && npm
  install` if not) — the driver imports it by explicit path from there,
  so it must be installed under `frontend/`, not the repo root or
  `.claude/`.
- **Backend refuses to boot / crashes on startup:** check
  `backend/.env` exists and defines all four Stripe vars — `app.mjs`
  refuses to start without them, even placeholders. Real values aren't
  needed to boot; empty/missing ones are refused.
- **`EADDRINUSE` on port 3001 or 5173:** a previous run's server is still
  alive. `lsof -ti:<port> -sTCP:LISTEN | xargs -r kill`, then relaunch.
- **`chromium.launch()` times out or can't find the executable:** confirm
  `/opt/pw-browsers/chromium` exists in this container; if the container
  image ever changes, that path (or `CHROMIUM_PATH`) needs updating.
