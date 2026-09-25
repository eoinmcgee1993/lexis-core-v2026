---
name: babysit
description: Repo-specific override for PR CI-babysitting on lexis-core-v2026 — which checks actually gate a merge here, and the one check that is known-red and known-unfixable from this session. Read before acting on any CI-failure or check_run event on a PR against this repo.
---

# Babysitting overrides for lexis-core-v2026

This repo has two workflow files — `.github/workflows/test.yml` and
`manual.yml` (GitHub's stock dispatch template, does nothing). Anything
outside that isn't a rerunnable workflow you can act on the normal way.

## What actually gates a merge

`test.yml` runs two jobs on every PR and every push to `main`:

- **`backend`** — `fair-use.test.mjs` + `checkout.test.mjs` + `higgsfield.test.mjs`
  (65 assertions). Needs no real Stripe/Supabase/Higgsfield.
- **`frontend`** — the real `npm ci && npm run build`, prerender included.
  Added 22 Sep 2026 after PR #113 (vite 5→8) shipped with `backend` ✅,
  `Vercel Preview Comments` ✅ and CodeQL neutral, while Vercel's own build
  had failed at install on a peer-range conflict — a failing Vercel **build**
  produces no check run at all, so three green ticks were not proof. Both
  `test.yml` jobs must be green; that's the real signal.

Both `Vercel – lexis-commerce` / `Vercel – lexis-core-v026` commit statuses
and the `Vercel Preview Comments` check reflect *preview deploy* success, not
correctness — informational, not gating.

## Known-red, known-unfixable: `github-advanced-security`

This check is **not** a workflow in this repo — it's GitHub's own default
code-scanning setup, running outside `.github/workflows/`. It has failed
repeatedly (PR #115, PR #122) with the same GitHub-side error from its own
Autofind/Copilot step:

```
CAPIError: 400 The requested model is not supported.
```

Confirmed twice this is not the PR's fault — it fails the same way on PRs
touching nothing but markdown. `actions_run_trigger` (`rerun_failed_jobs`)
against its parent run always returns `403 This workflow run cannot be
retried`, regardless of what's in the diff — because it isn't a
retryable Actions run to begin with, not because of a missing grant. Retrying
it a second time after a 403 is not the fix; don't loop on it.

**Standing instruction:** on this repo, a red `github-advanced-security` gets
exactly one standdown comment (name the CAPIError, confirm the PR's changed
files couldn't trigger it, note the 403 on retry) and no further action.
Don't hold a PR open on this check alone once `backend` and `frontend` in
`test.yml` are green.
