#!/usr/bin/env node
//
// LEXIS unit-economics model.
//
//   node scripts/unit-economics.mjs
//   node scripts/unit-economics.mjs --rate=0.24 --fx=36.5
//
// The one number this model cannot supply for itself is `--rate`: the
// blended USD cost of one minute of OpenAI Realtime conversation on the
// model this app actually mints sessions against (OPENAI_MODEL, default
// gpt-realtime-2.1 — see backend/app.mjs). Realtime is billed on audio
// input and output tokens, not on wall-clock minutes, so the per-minute
// figure is a derived quantity that depends on how much of each minute is
// LEXIS talking vs. the learner talking vs. silence. Read it off the
// OpenAI billing page (Usage → Cost, divided by the minutes in
// usage_logs for the same window) rather than off a rate card.
//
// Everything else here is either measured from this repo or from the
// production Supabase project, and is sourced inline.

import { TRIAL, PRICING } from '../frontend/src/content/facts.js';

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => { const [k, v] = a.slice(2).split('='); return [k, v === undefined ? 'true' : v]; })
);

const num = (k, d) => (args[k] === undefined ? d : Number(args[k]));

// ── Inputs ────────────────────────────────────────────────────────────

// THB per USD. Rough working figure — override with --fx. Affects every
// margin below, so it is worth setting to the rate Stripe actually
// settles you at, not the mid-market rate.
const FX = num('fx', 36.5);

// Stripe Thailand fee. VERIFY on your own dashboard before trusting any
// margin here — card-present/absent, domestic/international, and currency
// conversion all move it. Override with --feePct / --feeFixedTHB.
const FEE_PCT = num('feePct', 0.0365);
const FEE_FIXED_THB = num('feeFixedTHB', 11);

// Per-session text-model cost: one feedback call (max_tokens 600) plus
// live-translation calls (max_tokens 200 each) on gpt-4o-mini, per
// backend/app.mjs. Small but not zero. Override with --textPerSession.
const TEXT_PER_SESSION_USD = num('textPerSession', 0.004);

// Sessions a user starts per hour of talk time. Measured: the heaviest
// trial account ran 45 sessions inside 30 minutes of billed audio
// (profiles.sessions_count vs seconds_used), which is a reconnect-heavy
// pattern, not typical. 4/hour is the conservative middle. --sessionsPerHour
const SESSIONS_PER_HOUR = num('sessionsPerHour', 4);

// Imported from facts.js, not copied. This script previously re-declared
// 199/599/15 as literals — the exact duplication the same change removed
// from the two brand-kit generators, which is how those ended up rendering
// a 30-minute trial after the product moved to 15. A model that quietly
// prices the wrong plan is worse than no model.
const PLANS = [
  { name: 'Weekly Pass',       thb: PRICING.weekly.thb,  days: 7 },
  { name: 'Monthly Immersion', thb: PRICING.monthly.thb, days: 30.44 }
];

// The rate sweep. A single --rate prints one column; otherwise sweep.
const RATES = args.rate
  ? [Number(args.rate)]
  : [0.05, 0.10, 0.15, 0.20, 0.30, 0.45, 0.60];

// ── Model ─────────────────────────────────────────────────────────────

const netUSD = (thb) => ((thb * (1 - FEE_PCT)) - FEE_FIXED_THB) / FX;

// Total marginal cost of `mins` minutes of practice, including the text
// calls those minutes drag along with them.
const costUSD = (mins, rate) =>
  mins * rate + (mins / 60) * SESSIONS_PER_HOUR * TEXT_PER_SESSION_USD;

// Minutes at which contribution margin hits zero.
const breakevenMins = (thb, rate) =>
  netUSD(thb) / (rate + (SESSIONS_PER_HOUR * TEXT_PER_SESSION_USD) / 60);

// Minutes/period that leave `target` gross margin — i.e. the fair-use cap
// that guarantees that margin no matter how heavy the user is.
const capForMargin = (thb, rate, target) => breakevenMins(thb, rate) * (1 - target);

const f = (n, d = 1) => n.toFixed(d);
const pad = (s, w) => String(s).padStart(w);

console.log(`
LEXIS unit economics
====================
FX ${FX} THB/USD · Stripe ${(FEE_PCT * 100).toFixed(2)}% + THB ${FEE_FIXED_THB}
Text-model cost USD ${TEXT_PER_SESSION_USD}/session at ${SESSIONS_PER_HOUR} sessions/hour
`);

for (const plan of PLANS) {
  const net = netUSD(plan.thb);
  console.log(`\n── ${plan.name}: THB ${plan.thb} / ${plan.days} days → USD ${f(net, 2)} net\n`);
  console.log(
    '  ' + pad('USD/min', 8) + pad('break-even', 12) + pad('per day', 9) +
    pad('cap @70%', 10) + pad('cap @60%', 10) + pad('/day @70%', 11)
  );
  for (const rate of RATES) {
    const be = breakevenMins(plan.thb, rate);
    const c70 = capForMargin(plan.thb, rate, 0.70);
    const c60 = capForMargin(plan.thb, rate, 0.60);
    console.log(
      '  ' + pad(f(rate, 3), 8) + pad(f(be, 0) + ' min', 12) + pad(f(be / plan.days, 1), 9) +
      pad(f(c70, 0) + ' min', 10) + pad(f(c60, 0) + ' min', 10) + pad(f(c70 / plan.days, 1), 11)
    );
  }
}

// The free trial is a fully unrecovered cost per signup: 15 minutes of
// Realtime with no card on file (TRIAL.minutes in facts.js; the column
// default is now 900, though rows created before 29 Aug keep 1800). It
// is the real acquisition cost of this product, and it is paid whether or
// not the visitor ever converts.
const TRIAL_MINS = num('trialMins', TRIAL.minutes);

console.log('\n\n── The free trial, which is the acquisition cost\n');
console.log(
  '  ' + pad('USD/min', 8) + pad('per trial', 12) + pad('per 100', 10) +
  pad('conv. needed', 14) + '  (to recover trial cost from one monthly period)'
);
for (const rate of RATES) {
  const trial = costUSD(TRIAL_MINS, rate);
  const needed = trial / netUSD(PRICING.monthly.thb);
  console.log(
    '  ' + pad(f(rate, 3), 8) + pad('$' + f(trial, 2), 12) + pad('$' + f(trial * 100, 0), 10) +
    pad(f(needed * 100, 1) + '%', 14)
  );
}
console.log(
  '\n  That conversion figure assumes the converted user then costs nothing,' +
  '\n  which is false — subtract their own usage cost from the same period.' +
  '\n  Treat it as a floor, not a target.\n'
);

// Which plan binds first. Revenue per day of entitlement is what actually
// matters, and the monthly plan is the cheaper of the two on that basis —
// so it is the monthly plan, not the weekly, that sets any fair-use cap.
console.log('\n\n── Revenue per entitled day (this is why monthly is the binding plan)\n');
for (const plan of PLANS) {
  console.log(`  ${plan.name.padEnd(20)} THB ${f(plan.thb / plan.days, 2)}/day`);
}
const [w, m] = PLANS;
console.log(
  `\n  The monthly plan yields ${f((1 - (m.thb / m.days) / (w.thb / w.days)) * 100, 0)}% less per entitled day than the weekly.` +
  `\n  Any cap set from the weekly plan's break-even will lose money on the monthly one.\n`
);
