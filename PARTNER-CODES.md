# Partner & affiliate codes

How to onboard a new outreach/growth partner (an affiliate, a school, an
influencer, anyone bringing users to LEXIS) without writing any code. This
already works end-to-end today — nothing here is aspirational.

## Why this needs no engineering

`backend/app.mjs`'s Checkout Session creation already sets
`allow_promotion_codes: true` (has since the original build). Any Stripe
Promotion Code linked to a Coupon works at checkout the moment it exists,
no deploy, no code change, no waiting on this repo. The only actual "work"
in onboarding a partner is two API calls in the Stripe dashboard (or via
the Stripe MCP tools, if this session has them).

Live example already in production: `LEXISSCHOOL` (created 19 Aug 2026),
75% off forever, for the first school/org partnership. It's a worked
reference for the steps below, not a template to reuse as-is — a new
partner should usually get its own coupon (see "One coupon per partner,"
below), not this one.

## Creating a new one (Stripe dashboard: Product catalog → Coupons)

1. **Create a Coupon** — the discount itself (percent or amount off, and a
   duration: once / forever / N months). Give it a short internal `name`
   (under 40 characters, Stripe's hard limit) so it's identifiable on the
   customer's invoice, not just an ID.
2. **Create a Promotion Code** attached to that Coupon — this is the
   human-typeable string (e.g. `LEXISSCHOOL`) a partner actually shares.
   A Coupon alone isn't enough; Checkout's promo-code field needs a
   Promotion Code.
3. Hand the partner the code string. That's the entire onboarding.

## One coupon per partner

Don't reuse one coupon/code across multiple partners. Separate codes are
how you tell them apart later, both for a partner asking "how many people
used my code" and for the ordinary case of turning one off (deleting or
expiring a Promotion Code, not the whole discount mechanism) if a specific
relationship ends.

## Attribution — already free, no dashboard to build

Stripe's own dashboard already shows, per Promotion Code: total
redemptions and the actual Checkout Sessions/customers that used it. This
is real attribution, not something that needs a custom analytics table.
For anything beyond that (e.g. a running leaderboard across many
partners), pull it from Stripe's API rather than duplicating it in
Supabase — Stripe is the source of truth for redemptions, LEXIS's own DB
isn't.

## What this is not

This is not a self-serve affiliate *platform* — there's no signup flow for
a partner to generate their own code, no commission/payout tracking, and
no click-tracking layer. At current scale (a handful of real users as of
Aug 2026), building that infrastructure ahead of having partners who'd use
it would be solving a problem that doesn't exist yet. Revisit this file if
that changes: the volume of partners at which "two Stripe API calls each
time" stops being fast enough is a real, obvious trigger to build more.
