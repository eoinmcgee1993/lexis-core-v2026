---
name: verify
description: Run LEXIS's full verification chain — syntax gate, all three test suites, the production build including prerender, and the checks that have actually caught bugs here (Tailwind classes and opacity steps that generate no CSS, horizontal overflow, page errors per route). Use before committing anything that touches app.mjs, a page component, or index.css, and whenever asked to verify, health check, or confirm work is sound.
---

# Verify

This repo has no linter, no formatter and no test runner. Every check is a
command someone has to remember. This is that list, in the order that fails
fastest first.

Run everything. Report what passed and what failed with the actual output —
never summarise a failure as "mostly fine".

## 1. Syntax gate (seconds)

```bash
node --check backend/app.mjs
```

`app.mjs` is ~1500 lines and holds all backend logic. A syntax error here
takes down checkout, the webhook and the realtime token mint at once.

## 2. All three test suites

```bash
cd backend && npm test        # fair-use.test.mjs && checkout.test.mjs
node frontend/scripts/visemes.test.mjs
```

Expect `30 passed, 0 failed`, then `22 passed, 0 failed`, then the viseme
counts. The two backend suites test `app.mjs` from opposite directions and
you need both:

- `fair-use.test.mjs` extracts helpers out of `app.mjs` **by source text**,
  so renaming `fairUseCapSeconds`, `periodSecondsUsed`, `passDays` or
  `paidAccessActive` fails it loudly. That is intentional — do not "fix" the
  test by loosening the match, fix the call sites.
- `checkout.test.mjs` imports `app.mjs` for real and drives the handlers
  against local fake Stripe and Supabase servers, so what it pins is the
  params object those handlers actually build. It will tell you if the
  Community add-on stops being offered, if both of its mutually exclusive
  paths ever fire at once, or if `optional_items` gets carried into the
  branding-failure retry — which runs on the SDK's pinned `2024-06-20` and
  cannot accept it.

`checkout.test.mjs` prints a `StripeInvalidRequestError` and a stack trace
partway through. That is the branding-rejection case working as designed, not
a failure — read the counts at the end, not the scariest thing on screen.

Both backend suites also run in CI on every PR and on pushes to `main`
(`.github/workflows/test.yml`). The viseme suite does not; nothing but you
runs that one.

There is a PostToolUse hook (`.claude/hooks/run-affected-tests.sh`) that runs
whichever suites cover a file you just edited, silently on success — editing
`app.mjs` runs both backend suites. It only fires on Write/Edit, so a change
made through Bash will not trigger it: run these by hand after any
`sed`/`python` patch.

## 3. Production build, including prerender

```bash
cd frontend && npm run build
```

Must print `[prerender] done.` after writing **17** routes. `build:vite-only`
skips prerender and is only for a quick typecheck of the bundle — it does not
count as a build passing. Chromium is preinstalled at `/opt/pw-browsers`;
never run `playwright install`.

## 4. Classes that generate no CSS

Any custom or arbitrary Tailwind class must be confirmed present in the built
stylesheet, not assumed from the class looking valid. This has caught a real
invisible-element bug: `from-lexis-ink/12` is not a step this project's
Tailwind generates, so the class produced nothing, `--tw-gradient-stops` was
never set, and a divider rendered as blank space in two places.

```bash
cd frontend && node -e "
const fs=require('fs'),path=require('path');
const dir='dist/assets';
const css=fs.readdirSync(dir).filter(f=>f.endsWith('.css'))
  .map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('');
for (const c of process.argv.slice(1)) {
  console.log(c.padEnd(22), css.includes('.'+c) ? 'present' : 'GENERATES NOTHING');
}
" lexis-lift lexis-lift-soft lexis-band lexis-stage lexis-clip-x
```

Add whatever classes the change introduced to that argument list. This is not
only about the `lexis-*` utilities — **arbitrary opacity steps are the same
trap**. A contrast pass on 9 Sep 2026 moved 83 occurrences of body text to
`/65`, `/70` and `/75`; those three had never been used in this project
before, and a step Tailwind does not generate produces no rule at all rather
than an error. Check the built stylesheet for the literal declaration:

```bash
cd frontend && grep -o 'text-lexis-ink\\/65{[^}]*}' dist/assets/*.css | head -1
```

## 5. Routes: page errors and horizontal overflow

Serve `frontend/dist` and load each route in headless Chromium, capturing
`pageerror` and comparing `documentElement.scrollWidth` to `clientWidth` at
375 / 414 / 768 / 1024. Overflow here is not cosmetic: a decorative element
with a negative horizontal inset put 2–12px of sideways scroll on every
width, which on a phone is a wobble nobody ever files a bug about.

Routes worth covering: `/`, `/pricing`, `/community`, `/auth`, `/app`,
`/terms`, `/refund`, `/th`, `/th/pricing`.

When a fix is available at the source of the overflow, fix it there rather
than masking it with `overflow-x: clip` — clip is Safari 16+, so masking
alone lets it return on an older iPhone.

## 6. If the change touched billing

Read `CLAUDE.md`'s billing section first, then confirm against it:

- Checkout is `mode: 'payment'` with **one-time** prices. A recurring price
  in payment mode is a hard Stripe error.
- `payment_method_types` stays unset — naming any method silently overrides
  the Stripe Dashboard, and that is what kept PromptPay off the page.
- Entitlement is `profiles.access_expires_at` via `paidAccessActive()`.
  NULL means "legacy recurring subscription", not "expired".
- Any new `profiles` column must ALSO be added to the commented migration
  block at the bottom of `backend/supabase-schema.sql`. `CREATE TABLE IF NOT
  EXISTS` is a no-op on the live database, so without that the functions get
  recreated against columns that do not exist — plpgsql resolves names at
  execution, so it reports success and then every call 500s.

To exercise SQL against production without writing anything, use the
established pattern: a `DO $$ ... RAISE EXCEPTION $$` block, where the
exception carries the results out and rolls the transaction back.

## Reporting

State plainly what ran and what it said. If something could not be verified
from this environment — a live Stripe call, a real purchase — say so and say
why, rather than implying coverage that does not exist.
