---
name: feedback
description: Critique the current working-tree change against LEXIS's own recorded conventions — why-comments, facts.js as the single source of prices and claims, the billing constraints, and copy that makes a commercial promise. Use when asked for feedback, a critique, or a second opinion on work in progress, before committing.
---

# Feedback

A review of the change in front of you, judged against what THIS repo has
already decided — not against generic best practice. Start from:

```bash
git diff
git diff --stat origin/main..HEAD
```

## What to actually check

### Facts appear in exactly one place

`frontend/src/content/facts.js` is the single source of truth for prices,
trial length, VAT status, billing semantics and FAQ copy. Pages, JSON-LD
(`src/data/structuredData.js`), the prerender step, the brand-kit generators
and `scripts/unit-economics.mjs` all import from it.

Flag any hardcoded price, period or trial length anywhere else. This is not
tidiness: those numbers were once wrong in three places at once, and once
JSON-LD existed the inconsistency was being published as machine-readable
fact.

Prefer fixing the shared fact over patching the symptom at each call site.

### Commercial claims are factual assertions

"cancel anytime", "/week", `billingDuration` in structured data, "unlimited"
— treat each as a claim that must still be true after the change. LEXIS sells
**one-off passes**; nothing auto-renews. Copy implying a subscription is a
defect, not a phrasing preference.

### Comments explain why, at the density already here

Terse code with no rationale reads as a regression in this codebase. Where a
line looks wrong or arbitrary, the comment should say what was tried, what
broke, and what the alternative would cost.

Specifically check that reverted work stays reverted: several comments exist
only to record an approach that failed (the lip-sync fix in
`TutorAvatarPhoto.jsx` and `LexisApp.jsx`) so it is not attempted the same way
again. A diff that re-introduces one of those without addressing the recorded
reason is the single most likely defect in this repo.

### Billing changes

Re-read `CLAUDE.md`'s billing section and check the change against it rather
than from memory. The failure modes there are all silent: a recurring price in
payment mode, a hardcoded `payment_method_types`, a new `profiles` column
missing from the migration block, an idempotency marker that is a slot rather
than a set.

### Verification claims

Any statement that something "works" should name the command that proved it.
Where nothing could prove it — a live Stripe write, a real purchase — the
change should carry a fallback or the claim should be withdrawn.

## How to deliver it

Lead with the most severe finding. For each: what is wrong, the concrete
scenario where it bites, and the fix. Do not pad the list to look thorough —
if the diff is clean, say it is clean and stop.
