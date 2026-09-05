---
name: recap
description: Report where LEXIS actually stands right now — branch and unpushed work, the PR's real state, both Vercel deploys, and the open items that are blocked on a decision. Use when asked for a recap, status, "where are we", or when picking a long session back up.
---

# Recap

Sessions on this repo run long and span three deployed surfaces plus live
Stripe and Supabase. State drifts from memory fast. Gather it, do not recall
it.

## Gather

```bash
git branch --show-current
git status --porcelain
git log --oneline origin/main..HEAD
git fetch origin main -q && git log --oneline -1 origin/main
```

Then, using the GitHub MCP tools:

- `pull_request_read` (`get`) for the branch's PR. Report `state`, **`draft`**,
  `mergeable_state` and the head SHA.
- `pull_request_read` (`get_check_runs`) for CI on that head.

Then Vercel (`list_deployments` / `get_deployment`, team
`team_PdCxIAYmQD0aJxntG3YYT7Q7`) for both projects:

| Project | Deploys | Serves |
|---|---|---|
| `lexis-core-v026` | `frontend/` | learnwithlexis.com |
| `lexis-commerce` | `backend/` | the API |

A commit to either directory triggers **both** projects, so check both and
report the SHA each is on — not just "deployed".

## The trap to check every time

**A PR still flagged `draft` is not merged and will not merge.** This has
already happened once here: work was reported as merged, `main` had not moved,
and the cause was the draft flag. If `draft: true`, say so as the headline,
not as a footnote.

## Report

Three sections, in this order:

1. **Shipped** — commits pushed, with what each actually changes. One line each.
2. **Verified vs assumed** — what was proven by running something, and what
   could not be checked from this environment (a live Stripe write, a real
   purchase, anything needing credentials this session does not hold). Never
   let the second list silently join the first.
3. **Blocked on a decision** — items that are not yours to settle. Say what
   the decision is and who it belongs to, not just that it is pending.

Known standing items, unless resolved since:

- Stripe **account-wide** branding (business name, statement descriptor,
  receipts) belongs to a shared account and is the account owner's call.
  Per-session Checkout branding is already overridden in `app.mjs`.
- A live PromptPay purchase is the only real proof the revenue path works
  end to end. Nothing in this repo can substitute for it.
- The Mobbin connector returns `requires a paid plan` for every query. It is
  account-level, not transient — do not present it as a retry away.
