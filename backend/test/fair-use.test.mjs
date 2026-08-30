#!/usr/bin/env node
//
// Fair-use ceiling tests.  Run:  node backend/test/fair-use.test.mjs
//
// There is no test runner in this repo, so this is a plain script: it exits
// non-zero on failure and prints one line per case.
//
// It extracts the real helpers out of app.mjs by source rather than
// importing it, because importing app.mjs starts an HTTP server and needs
// the full production env. The extraction is deliberately brittle — if
// someone renames these functions it fails loudly rather than testing a
// stale copy.
//
// Every assertion is written against the LIVE constants, not against
// hardcoded minute values, so retuning FAIR_USE_MINUTES can never silently
// invalidate the suite. The one exception is the final case, which asserts
// the design property the caps were derived from.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, '..', 'app.mjs'), 'utf8');

const grab = (name) => {
  const i = src.indexOf(`function ${name}(`);
  if (i < 0) throw new Error(`${name} not found in app.mjs — was it renamed?`);
  let depth = 0;
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    if (src[k] === '{') depth++;
    else if (src[k] === '}' && --depth === 0) return src.slice(i, k + 1);
  }
  throw new Error(`unbalanced braces extracting ${name}`);
};

const consts = src.slice(src.indexOf('const FAIR_USE_MINUTES'), src.indexOf('function fairUseCapSeconds'));
const tmp = path.join(here, '.fair-use-extract.mjs');
fs.writeFileSync(tmp, consts + grab('fairUseCapSeconds') + '\n' + grab('periodSecondsUsed') +
  '\nexport { fairUseCapSeconds, periodSecondsUsed, FAIR_USE_MINUTES };');
const m = await import(`file://${tmp}`);
fs.unlinkSync(tmp);

const W = m.FAIR_USE_MINUTES.weekly;
const M = m.FAIR_USE_MINUTES.monthly;
const STRICTEST = Math.min(W, M) * 60;

let pass = 0, fail = 0;
const t = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  got=${JSON.stringify(actual)} want=${JSON.stringify(expected)}`}`);
};
const ago = (days) => new Date(Date.now() - days * 864e5).toISOString();

console.log(`live caps: weekly ${W} min, monthly ${M} min\n`);

t('weekly cap matches configured minutes',  m.fairUseCapSeconds('weekly'),  W * 60);
t('monthly cap matches configured minutes', m.fairUseCapSeconds('monthly'), M * 60);

// Fails CLOSED. status 'active' against an unrecognised tier is reachable
// without an attacker: customer.subscription.deleted sets tier 'free' while
// customer.subscription.updated sets status without touching tier, so an
// out-of-order or replayed pair leaves exactly that state. Returning null
// there would lift the ceiling on the one account already in a bad state.
t('fails closed: tier "free"',   m.fairUseCapSeconds('free'),      STRICTEST);
t('fails closed: tier undefined',m.fairUseCapSeconds(undefined),   STRICTEST);
t('fails closed: tier null',     m.fairUseCapSeconds(null),        STRICTEST);
t('no prototype leak: constructor', m.fairUseCapSeconds('constructor'), STRICTEST);
t('no prototype leak: __proto__',   m.fairUseCapSeconds('__proto__'),   STRICTEST);
t('no prototype leak: toString',    m.fairUseCapSeconds('toString'),    STRICTEST);

t('weekly mid-window accumulates',  m.periodSecondsUsed({ subscription_tier: 'weekly',  period_started_at: ago(3),   period_seconds_used: 600 }), 600);
t('weekly day 6.9 still counts',    m.periodSecondsUsed({ subscription_tier: 'weekly',  period_started_at: ago(6.9), period_seconds_used: 600 }), 600);
t('weekly day 8 has rolled',        m.periodSecondsUsed({ subscription_tier: 'weekly',  period_started_at: ago(8),   period_seconds_used: 600 }), 0);
t('monthly day 20 still counts',    m.periodSecondsUsed({ subscription_tier: 'monthly', period_started_at: ago(20),  period_seconds_used: 900 }), 900);
t('monthly day 31 has rolled',      m.periodSecondsUsed({ subscription_tier: 'monthly', period_started_at: ago(31),  period_seconds_used: 900 }), 0);
t('unparseable timestamp -> 0',     m.periodSecondsUsed({ subscription_tier: 'weekly',  period_started_at: 'nope',   period_seconds_used: 600 }), 0);
t('absent anchor -> 0',             m.periodSecondsUsed({ subscription_tier: 'weekly',  period_seconds_used: 600 }), 0);
t('unknown tier uses 7-day window', m.periodSecondsUsed({ subscription_tier: 'free',    period_started_at: ago(8),   period_seconds_used: 600 }), 0);

// The property the caps were derived from: both tiers must carry the same
// worst-case minutes per baht of revenue per day. The first pass (180/720)
// violated this — monthly ran at 1.33x weekly's exposure for no reason.
// Prices mirror facts.js; if they change, this is meant to fail so the caps
// get re-derived rather than silently drifting apart again.
const weeklyRatio  = (W / 7)     / (199 / 7);
const monthlyRatio = (M / 30.44) / (599 / 30.44);
const symmetric = Math.abs(weeklyRatio - monthlyRatio) / weeklyRatio < 0.02;
symmetric ? pass++ : fail++;
console.log(`${symmetric ? 'PASS' : 'FAIL'}  tiers symmetric per baht-day  weekly=${weeklyRatio.toFixed(3)} monthly=${monthlyRatio.toFixed(3)}`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
