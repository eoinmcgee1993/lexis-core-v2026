#!/bin/bash
#
# SessionStart hook — installs Node dependencies so that builds, the
# prerender step, and the backend test suite work in Claude Code on the web.
#
# Runs SYNCHRONOUSLY (no async header). The session waits for it, which is
# slower to start but removes the race where the agent runs `npm run build`
# or a test before its dependencies exist. Switch to async by making the
# first line of output: echo '{"async": true, "asyncTimeout": 300000}'
#
set -euo pipefail

# Local machines already have their own setup; this is a web-session concern
# only. $CLAUDE_CODE_REMOTE is "true" only in the remote environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"

# `npm install` rather than `npm ci`: the container image is cached after this
# hook completes, and install reuses an existing node_modules instead of
# deleting and refetching it, so warm starts are much faster. Both are
# idempotent here — the lockfiles are committed.
#
# --no-audit --no-fund keep the output to what actually matters.
for pkg in backend frontend; do
  if [ -f "$ROOT/$pkg/package.json" ]; then
    echo "[session-start] installing $pkg dependencies"
    ( cd "$ROOT/$pkg" && npm install --no-audit --no-fund )
  fi
done

# voice-service/ is deliberately NOT installed. It is an optional, standalone
# ChatTTS service whose requirements.txt pulls torch + torchaudio (multiple
# GB), it is not imported by the frontend or backend, and nothing in the
# normal dev loop touches it. Install it by hand if you are actually working
# on speech generation.

echo "[session-start] done"
