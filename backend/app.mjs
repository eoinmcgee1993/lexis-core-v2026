// backend/app.mjs — LEXIS Commerce Express app, exported (not listened on)
// so it can be mounted by either a long-running process (server.mjs, for
// Railway/local dev) or a serverless handler (api/index.js, for Vercel).
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import crypto from 'crypto';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const app = express();
// Removes the "X-Powered-By: Express" response header — harmless on its
// own, but it's exactly the kind of implementation detail an error
// response shouldn't be volunteering to a caller (see the CORS error
// handler at the bottom of this file, which this same instinct led to).
app.disable('x-powered-by');

/* ─────────────────────────────────────────────────────────────────────── */
/* 1. ENV CHECK                                                            */
/*                                                                          */
/* Missing config fails every request with a clear 503 instead of crashing */
/* at import time — a hard process.exit() (or an uncaught throw from       */
/* constructing the Stripe/Supabase clients below with undefined creds)    */
/* works fine on a long-running server that a process manager restarts,    */
/* but on a serverless platform an import-time crash just produces an      */
/* opaque platform-level "function invocation failed" with none of our     */
/* own error detail. This degrades the same way on both hosts instead.     */
/* ─────────────────────────────────────────────────────────────────────── */
const requiredEnv = ['OPENAI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`[LEXIS Fatal Error] Missing required environment variable(s): ${missingEnv.join(', ')}`);
}

// Logged once at startup (Vercel runtime logs / Railway logs), never
// returned over HTTP — a non-empty-but-wrong SUPABASE_URL (wrong project,
// truncated value, stray character) needs to be diagnosable without
// dashboard access, but the host is still infra detail an unauthenticated
// caller has no reason to see. Guarded: a malformed value must not throw
// here and take the whole module down at import time.
if (process.env.SUPABASE_URL) {
  try {
    console.log(`[LEXIS] Configured SUPABASE_URL host: ${new URL(process.env.SUPABASE_URL).host}`);
  } catch {
    console.error(`[LEXIS Fatal Error] SUPABASE_URL is set but not a valid URL: "${process.env.SUPABASE_URL}"`);
  }
}

/* ─────────────────────────────────────────────────────────────────────── */
/* 2. CLIENTS                                                              */
/* ─────────────────────────────────────────────────────────────────────── */
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

/* ─────────────────────────────────────────────────────────────────────── */
/* 3. CORS LOCK                                                            */
/* ─────────────────────────────────────────────────────────────────────── */
export const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

// Where to send the browser back to after Stripe Checkout. Resolved per
// request from the Origin header rather than a fixed "first entry in
// ALLOWED_ORIGINS" — with multiple allowed origins (prod + a Vercel preview
// deployment, say), a static first-entry pick sends every preview's checkout
// back to production instead of itself, and if that first entry is ever a
// localhost dev origin, production checkout redirects break outright.
// Only trusts the Origin header when it's in the allowlist; the cors()
// middleware above already rejects disallowed origins before a request
// reaches this far, but the explicit check here doesn't depend on that.
function resolveFrontendOrigin(req) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) return origin;
  return allowedOrigins.find(o => o.startsWith('https://')) || allowedOrigins[0];
}

// Tagged with .status so the error handler at the bottom of this file can
// tell a rejected origin apart from a genuine server fault — previously
// this fell through to Express's default error handler, which returns a
// generic HTML page (stack trace included outside production) and an
// unconditional 500 for an outcome that's neither a real error nor a
// server fault, just a disallowed caller.
class CorsOriginError extends Error {
  constructor(origin) {
    super(`[LEXIS Security] CORS blocked request from origin: ${origin}`);
    this.status = 403;
  }
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new CorsOriginError(origin));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Raw body parser for Stripe webhook signatures; JSON everywhere else.
app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Everything past this point except /health needs full config to function
// safely — gate here rather than let a route handler dereference a null
// stripe/supabase client.
app.use((req, res, next) => {
  if (missingEnv.length && req.path !== '/health') {
    return res.status(503).json({ error: `Server misconfigured: missing environment variable(s): ${missingEnv.join(', ')}` });
  }
  next();
});

/* ─────────────────────────────────────────────────────────────────────── */
/* ERROR MONITORING (no third-party service — Sentry etc.)                 */
/*                                                                          */
/* Every route handler below catches its own errors and responds directly */
/* (res.status(500)...) rather than calling next(err), so the CORS error-  */
/* handling middleware at the bottom of this file only ever actually sees */
/* CorsOriginError in practice — it is NOT the real visibility layer for   */
/* genuine failures. This is: called from each route's own outer catch    */
/* block, right where it already did console.error (Vercel's own Runtime  */
/* Logs still capture that regardless), plus a best-effort row in          */
/* error_logs — "what broke, how often, for whom" becomes a query instead  */
/* of grepping platform logs by hand. Fire-and-forget by design: a failure */
/* to log an error must never throw a second error on top of the first.   */
/* ─────────────────────────────────────────────────────────────────────── */
function logError(context, err, extra = {}) {
  console.error(`[LEXIS ${context}]`, err);
  try {
    supabase?.from('error_logs').insert({
      context,
      message: err?.message || String(err),
      stack: err?.stack || null,
      extra
    }).then(({ error }) => {
      if (error) console.error('[LEXIS Error Logging Failed]', error);
    });
  } catch (loggingErr) {
    console.error('[LEXIS Error Logging Failed]', loggingErr);
  }
}

/* ─────────────────────────────────────────────────────────────────────── */
/* 4. RATE LIMITING (per-IP, separate buckets per route)                  */
/*                                                                          */
/* In-memory — works as intended on a long-running process (Railway/local).*/
/* On a serverless host each cold start gets its own empty Map, so this    */
/* degrades to "best-effort within a warm instance" rather than a hard     */
/* global limit. Accepted trade-off of the serverless deployment choice.   */
/* ─────────────────────────────────────────────────────────────────────── */
function makeRateLimiter({ windowMs, max, message }) {
  const hits = new Map();
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown_client';
    const now = Date.now();
    const record = hits.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count += 1;
    }
    hits.set(ip, record);

    if (record.count > max) {
      return res.status(429).json({ error: message || 'Rate limit exceeded. Please wait a minute.' });
    }
    next();
  };
}

const sessionRateLimiter = makeRateLimiter({ windowMs: 60_000, max: 10, message: 'Rate limit exceeded. Please wait one minute.' });
// Legit clients heartbeat every 30s (~2/min); allow headroom for retries.
const heartbeatRateLimiter = makeRateLimiter({ windowMs: 60_000, max: 6, message: 'Heartbeat rate limit exceeded.' });
// One translate call per completed LEXIS turn — a chatty session could
// plausibly hit ~20-30/min at a fast conversational pace; well above that.
const translateRateLimiter = makeRateLimiter({ windowMs: 60_000, max: 40, message: 'Translation rate limit exceeded. Please wait a moment.' });
// Feedback is requested once per finished session, not on a loop — tight.
const feedbackRateLimiter = makeRateLimiter({ windowMs: 60_000, max: 6, message: 'Feedback rate limit exceeded. Please wait a moment.' });
// Just a read of the student's own history — generous, since a page of
// results could plausibly re-fetch on every visit to the History screen.
const historyRateLimiter = makeRateLimiter({ windowMs: 60_000, max: 20, message: 'History rate limit exceeded. Please wait a moment.' });

const cancelRateLimiter = makeRateLimiter({ windowMs: 60_000, max: 5, message: 'Rate limit exceeded. Please wait a moment.' });

// Generous relative to the others — pageviews fire on every route change,
// not just a deliberate user action, so a normal browsing session can
// legitimately produce many more of these than, say, cancel attempts.
const analyticsRateLimiter = makeRateLimiter({ windowMs: 60_000, max: 60, message: 'Rate limit exceeded.' });

// A single buggy render loop could otherwise flood this endpoint (a React
// error boundary re-throwing, an unhandledrejection firing repeatedly) —
// capped tighter than analytics for exactly that reason.
const errorReportRateLimiter = makeRateLimiter({ windowMs: 60_000, max: 20, message: 'Rate limit exceeded.' });

// First-party analytics — see backend/supabase-schema.sql's
// analytics_events table and frontend/src/lib/analytics.js for the full
// picture. Allowlisted event names only, so this can't become an
// arbitrary write-anything-you-want endpoint just because it's
// unauthenticated (it has to be: pageviews happen on marketing pages
// before anyone signs in).
const ANALYTICS_EVENTS = new Set([
  'pageview',
  'signup_completed',
  'session_connected',
  'checkout_started',
  'checkout_completed',
  'plan_cancelled'
]);

/* ─────────────────────────────────────────────────────────────────────── */
/* 5. AUTH MIDDLEWARE                                                      */
/*                                                                          */
/* Split into two layers on purpose:                                       */
/*   authenticate        — verifies the Supabase JWT and loads the profile.*/
/*                          Used everywhere a signed-in user needs to read  */
/*                          or act on their own account.                   */
/*   requireEntitlement   — additionally enforces the trial/subscription    */
/*                          gate. Used ONLY on the endpoints that actually  */
/*                          consume paid usage (/api/session, /heartbeat). */
/*                                                                          */
/* Gating /api/stripe/checkout or /api/me behind requireEntitlement (as a  */
/* single combined middleware) would lock a user out of buying a pass or   */
/* even seeing their own status the moment their trial expires — exactly   */
/* the moment they need both. So checkout/me only require authentication.  */
/* ─────────────────────────────────────────────────────────────────────── */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing authorization header.' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid session token.' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: 'Forbidden: Profile not found.' });
    }

    req.user = user;
    req.profile = profile;
    next();
  } catch (err) {
    logError('Auth Middleware Error', err);
    res.status(500).json({ error: 'Internal security authentication failure.' });
  }
}

// Fair-use ceiling for *paying* subscribers, per billing period.
//
// Until this existed, `isPaid` short-circuited every usage check, so an
// active subscription bought a genuinely unbounded amount of Realtime
// audio — a cost line with no ceiling sitting behind a fixed THB 199/599.
// See UNIT-ECONOMICS.md for the break-even maths this is sized against.
//
// Minutes per period, overridable per environment without a code change.
// Setting either to 0 (or anything non-positive) disables the cap for that
// tier — the deliberate escape hatch if one ever needs lifting in a hurry.
//
// How these two numbers were chosen (30 Aug 2026). The first pass used 180
// and 720, which were round numbers rather than derived ones, and they were
// not consistent with each other: the monthly plan yields 31% less revenue
// per entitled day than the weekly, so 720/month handed a monthly
// subscriber 1.33x the worst-case cost per baht of revenue that a weekly
// subscriber got. Same product, same ceiling logic, materially different
// exposure — an asymmetry with no justification behind it.
//
// These are set so both tiers carry the SAME worst-case minutes per
// baht-of-revenue-per-day (0.75 for each, vs 0.90 and 1.20 before):
//
//   weekly   150 min /  7.00 days = 21.4 min/day  against THB 28.43/day
//   monthly  450 min / 30.44 days = 14.8 min/day  against THB 19.68/day
//
// They are still generous against any real behaviour — a committed learner
// practising 15-20 minutes a day never reaches either. They are NOT set
// from observed demand, because no such observation exists: every usage
// figure in the database is clipped by the trial ceiling (busiest day and
// heaviest account are both exactly 30.0 minutes, which is the old trial
// limit, i.e. those users were cut off rather than satisfied), and there
// has never been a paying subscriber to measure.
//
// What these do NOT do is make the ceiling profitable. At $0.20/min a
// subscriber sitting at the monthly cap still costs ~$90 against $15.51 of
// net revenue; the change takes the worst case from -$128 to -$74, a 42%
// improvement, not a positive number. No cap this product could ship makes
// the ceiling pay at THB 599 — margin has to come from average usage being
// far below the cap. Once the real per-minute rate is measured, size these
// from the "cap @70%" table in UNIT-ECONOMICS.md instead of from this
// symmetry argument.
//
// Null-prototype so a tier string can never resolve to an inherited Object
// member ('constructor', '__proto__') and land somewhere other than these
// two entries.
const FAIR_USE_MINUTES = Object.assign(Object.create(null), {
  weekly: Number(process.env.FAIR_USE_WEEKLY_MINUTES ?? 150),
  monthly: Number(process.env.FAIR_USE_MONTHLY_MINUTES ?? 450)
});

// 30 days rather than a calendar month, matching the identical constant
// in record_heartbeat (backend/supabase-schema.sql). The two must agree:
// a calendar month in one and a fixed 30 days in the other would disagree
// by up to a day at the boundary, and a user could be blocked by this
// check while the database had already rolled their window.
const PERIOD_DAYS = Object.assign(Object.create(null), { weekly: 7, monthly: 30 });

function fairUseCapSeconds(tier) {
  // Fail CLOSED on a tier this map doesn't know. `active` with some other
  // tier is reachable without any attacker: customer.subscription.deleted
  // sets subscription_tier to 'free', and customer.subscription.updated
  // sets subscription_status without ever setting a tier — so an
  // out-of-order or replayed pair can leave status 'active' against tier
  // 'free'. Returning null there would silently lift the ceiling on the
  // one account whose state is already wrong. The strictest known cap is
  // the safe default; only an explicit non-positive env value disables it.
  const known = Object.prototype.hasOwnProperty.call(FAIR_USE_MINUTES, tier);
  const minutes = known ? FAIR_USE_MINUTES[tier] : Math.min(FAIR_USE_MINUTES.weekly, FAIR_USE_MINUTES.monthly);
  if (!Number.isFinite(minutes)) return null;
  if (minutes <= 0) return null;
  return Math.round(minutes * 60);
}

// Seconds used inside the *current* period. The database rolls the window
// forward on each heartbeat, but a subscriber who has not spoken since
// their period elapsed still carries a stale counter until the next beat
// — so the same elapsed-window test has to run here too, or their first
// session of a new period would be refused by a count that no longer
// applies.
function periodSecondsUsed(profile) {
  const startedAt = profile.period_started_at ? Date.parse(profile.period_started_at) : NaN;
  if (!Number.isFinite(startedAt)) return 0;
  const windowMs = (PERIOD_DAYS[profile.subscription_tier] ?? 7) * 24 * 60 * 60 * 1000;
  if (Date.now() - startedAt >= windowMs) return 0;
  return profile.period_seconds_used || 0;
}

// Whether a paid entitlement is currently live.
//
// A one-off pass says when it ends; a legacy subscription does not, because
// its liveness is Stripe's to report through the customer.subscription.*
// webhooks. So a NULL access_expires_at means "not a pass" and is left to
// subscription_status alone — that is what keeps the subscribers created
// before 2 Sep 2026 working — while a pass that has run out stops counting
// here whether or not anything told us. There is no Stripe event for "a
// one-time charge got old", so this check is the only thing that ends a
// pass.
//
// A non-null value that will not parse is treated as expired rather than
// as valid: we cannot show the pass is still good, and the column is a
// timestamptz written by Postgres, so this is unreachable short of a
// schema change.
function paidAccessActive(profile) {
  if (profile.subscription_status !== 'active') return false;
  if (!profile.access_expires_at) return true;
  const expiresAt = Date.parse(profile.access_expires_at);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

function requireEntitlement(req, res, next) {
  const profile = req.profile;
  const isPaid = paidAccessActive(profile);
  const isTrialValid = profile.subscription_status === 'free_trial' && profile.seconds_used < profile.max_allowed_seconds;

  if (!isPaid && !isTrialValid) {
    const message = profile.subscription_status === 'free_trial' || profile.subscription_status === 'expired'
      ? 'Free trial limit reached. Please upgrade to a Weekly or Monthly Pass.'
      : 'Your pass has ended. Buy another one to keep going — passes never renew on their own.';
    return res.status(403).json({ error: 'TRIAL_EXHAUSTED', message });
  }

  if (isPaid) {
    const cap = fairUseCapSeconds(profile.subscription_tier);
    if (cap !== null && periodSecondsUsed(profile) >= cap) {
      // A distinct code from TRIAL_EXHAUSTED on purpose. This person is
      // already paying, so the frontend must not answer them with an
      // "upgrade your pass" prompt and a pricing link.
      return res.status(403).json({
        error: 'FAIR_USE_REACHED',
        message: `You've reached this period's fair-use limit of ${Math.round(cap / 60)} minutes. It resets at the start of your next billing period.`
      });
    }
  }

  next();
}

/* ─────────────────────────────────────────────────────────────────────── */
/* 6. TUTOR PERSONA                                                        */
/*                                                                          */
/* Parameterized by which language the student is learning. 'en' = a Thai  */
/* speaker learning English (the original product); 'th' = an English     */
/* speaker learning Thai — a full language-exchange direction, not just a */
/* translated label. Defaults to 'en' for any missing/unrecognized value   */
/* so a caller that doesn't send `direction` keeps prior behavior exactly. */
/* ─────────────────────────────────────────────────────────────────────── */
// The v2026.4 Topics stage (frontend/src/components/stages/TopicStage.jsx)
// lets the student pick a real focus before the call connects, rather than
// always leaving it to LEXIS's own rotation. Keyed to match the `topic`
// value LexisApp.jsx sends in POST /api/session's body; an unrecognized or
// missing key (e.g. "Just Talk") falls through to the original open
// rotation in buildTutorInstructions, unchanged from pre-Topics behavior.
const TOPIC_CURRICULA = {
  everyday: 'everyday conversation — daily routine, family and friends, hobbies and interests, food, weather and plans',
  work: 'work and business — meetings, emails, small talk with colleagues, describing your job, job interviews',
  travel: 'travel — hotels, asking for directions, ordering food, getting help, airports and transport'
};

function buildTutorInstructions(direction, topic) {
  const learningThai = direction === 'th';

  const role = learningThai
    ? 'You are LEXIS, an elite AI Thai tutor for English speakers learning Thai.'
    : 'You are LEXIS, an elite AI English tutor designed specifically for Thai youth.';

  // Reported live: LEXIS was correcting Thai speakers' English pronunciation
  // aggressively for things that are just a Thai accent, not a mistake —
  // e.g. "sh" realized closer to a Thai-influenced sound (a real example
  // reported: "pussy cat" heard/said as "pushy cat"), because Thai doesn't
  // distinguish some English consonants the same way. Jumping on every one
  // of those reads as pedantic and undermines exactly the thing this app is
  // supposed to build (confidence speaking out loud), and it's not
  // something a real conversation partner would nitpick either. The fix is
  // explicit scope: correct grammar/vocabulary/word-choice — the stuff that
  // actually is wrong — and leave native-language accent features alone
  // unless they've produced a genuinely different word that would actually
  // confuse a listener.
  const correction = learningThai
    ? "Correct speech errors gently by modeling the proper Thai phrase, then ask a simple follow-up question. Focus corrections on grammar, vocabulary, and word choice — not on accent or pronunciation quirks carried over from the student's first language that don't block understanding. Those aren't mistakes, they're just an accent; only step in on pronunciation if it produced a genuinely different, confusing word."
    : 'Correct speech errors gently by modeling the proper phrase, then ask a simple follow-up question. Focus corrections on grammar, vocabulary, and word choice — not on accent or pronunciation quirks carried over from the student\'s first language that don\'t block understanding (Thai speakers often don\'t distinguish English sounds like "sh" vs "s", final consonants, or "l" vs "r" the same way native speakers do — that\'s an accent, not an error). Only step in on pronunciation if it produced a genuinely different, confusing word, not just an accented version of the right one.';

  const curriculumTarget = learningThai ? 'Thai' : 'English';
  // The language the student can already lean on comfortably — the fixed
  // target's opposite number.
  const baseLanguage = learningThai ? 'English' : 'Thai';

  // Live-verified in BOTH directions, two rounds of bugs from the same
  // root cause:
  // 1) 'th' direction, first version of this text: an unanchored "follow
  //    their lead" on language let the model actually drift into teaching
  //    English mid-session. Fixed by pinning a firm target language.
  // 2) 'en' direction, after that fix: the pin's wording — "always keep
  //    teaching and modeling English... that's the lesson" — turned out
  //    strong enough that the model applied it even during onboarding and
  //    even when the student was visibly lost. Live-verified: a Thai
  //    speaker asked "อะไรนะ" ("what?/huh?", real confusion, in their own
  //    language) and got another pure-English reply back with no Thai at
  //    all — the "you may clarify briefly" carve-out never fired. Having
  //    the target-language pin and the onboarding softening as two
  //    separate blocks let the model resolve the conflict either way;
  //    rewritten as one explicit two-phase flow so there's no ambiguity
  //    about which rule applies when, and the clarification carve-out is
  //    now a MUST triggered by concrete confusion signals, not a "may".
  const languageRules = `Language rules — two phases, in order:

PHASE 1, Onboarding (the first 1-2 turns, before any lesson content): stay mostly in ${baseLanguage}. Introduce yourself, ask the student's name, then check their level and what they want to practice (see Onboarding below). At most ONE short ${curriculumTarget} word or phrase per turn here — the target-language rule in Phase 2 does not apply yet.

PHASE 2, The lesson itself (once name, level, and topic are established): now ${curriculumTarget} is the fixed target language for the rest of the session — it does not drift based on what the student says. The student may still speak ${baseLanguage}, ${curriculumTarget}, or a mix; meet them wherever they are, and never block or scold them for using ${baseLanguage}. But keep the actual lesson content in ${curriculumTarget}.

In BOTH phases: if the student seems confused — asks you to repeat, goes quiet, replies with something unrelated, or asks "what?" in ${baseLanguage} — you MUST switch briefly into ${baseLanguage} to clarify what you meant, then continue. Do not just repeat the same ${curriculumTarget} phrase again, louder or slower — that does not help someone who did not understand it the first time.`;

  const onboarding = `Onboarding (first few turns only, before the lesson proper begins — see Phase 1 above):
1. Your very first message: introduce yourself as LEXIS and ask the student's name. Keep it short (max ~15 words).
2. Once they give their name, greet them by it, then ask two things in one short turn: (a) whether they're a complete beginner or already know some ${curriculumTarget}, so you can set the right pace, and (b) what they'd like to practice today. If they seem unsure what to pick, offer 2-3 concrete example topics pulled from the curriculum below (e.g. greetings & introductions, ordering food, everyday small talk) rather than leaving it open-ended.
3. Once you know their level and topic (or they've picked one of your examples, or stayed quiet and you've defaulted to the easiest one), begin the lesson itself — this is where Phase 2 starts. A stated beginner gets single words and very short 2-3 word phrases, heavy repetition, and a slow pace with no grammar talk yet. Anyone with some experience starts at the normal pace described below.
Keep every onboarding turn short and conversational — this is a spoken exchange, not a menu being read aloud.`;

  const chosenCurriculum = TOPIC_CURRICULA[topic];
  const curriculum = chosenCurriculum
    ? `Curriculum: the student specifically chose to focus on ${chosenCurriculum}. Spend most of the session there — don't force it back rigidly if the conversation naturally drifts, but keep returning to it as the anchor rather than rotating through unrelated topics.`
    : `Curriculum: guide the conversation through everyday topics, rotating naturally across a session — greetings & daily routine, family & friends, school life, hobbies & interests, food & ordering, shopping, travel & directions, weather & plans, technology & social media, future dreams. Don't announce the topic; just steer toward it.`;

  return `${role}
Speak clearly, naturally, warmly, and at a measured pace.
Keep each response short (15-25 words max) to maximize student speaking time.
${correction}
Be patient when the student pauses or hesitates.

${languageRules}

${onboarding}

CRITICAL: Always speak every word of your reply out loud — in English and in Thai alike. Never go silent, mute, or skip the audio for Thai words or phrases; the student needs to actually hear the Thai pronunciation, not just read it. If a sentence mixes English and Thai, voice both parts audibly with no gaps.

${curriculum} Start with simple present-tense, everyday ${curriculumTarget} vocabulary. If the student is doing well, introduce more complex grammar (past/future tense, connecting ideas, opinions). If they're struggling, simplify and slow down. Adjust level continuously based on how they're actually doing, not on a fixed schedule.`;
}

/* ─────────────────────────────────────────────────────────────────────── */
/* 7. ROUTES                                                               */
/* ─────────────────────────────────────────────────────────────────────── */
app.get('/health', (req, res) => {
  res.json({
    status: missingEnv.length ? 'Misconfigured' : 'Operational',
    system: 'LEXIS Commerce v2026.3',
    timestamp: new Date().toISOString(),
    ...(missingEnv.length ? { missingEnv } : {})
  });
});

app.get('/api/me', authenticate, (req, res) => {
  // The fair-use ceiling lives in this process's env, so no client can
  // derive it — this endpoint is the only way to read it, along with the
  // *effective* period usage (periodSecondsUsed zeroes a window that has
  // elapsed but not yet been rolled by a heartbeat).
  //
  // Nothing in the frontend consumes this today: AuthContext selects the
  // profile straight from Supabase and never calls /api/me, and
  // WelcomeStage's meter deliberately shows no remaining-minutes figure
  // for exactly that reason. An earlier version of this comment claimed it
  // fed that meter, which was never true. Kept because it is the correct
  // shape for any client that does want the number (and it is already the
  // endpoint's job to describe the caller's own entitlement) — but if you
  // wire the meter up, read it from here rather than duplicating the cap.
  const profile = req.profile;
  const fairUseSeconds = paidAccessActive(profile)
    ? fairUseCapSeconds(profile.subscription_tier)
    : null;

  res.json({
    user: { id: req.user.id, email: req.user.email },
    profile: {
      ...profile,
      fair_use_seconds: fairUseSeconds,
      period_seconds_used: periodSecondsUsed(profile)
    }
  });
});

// Ephemeral Token Minting (GA Endpoint)
app.post('/api/session', sessionRateLimiter, authenticate, requireEntitlement, async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const safetyIdentifier = crypto.createHash('sha256')
      .update(req.user.id + (process.env.LEXIS_SALT || 'lexis_salt'))
      .digest('hex').substring(0, 32);
    const direction = req.body?.direction === 'th' ? 'th' : 'en';
    // Optional — set by the Topics stage (frontend/src/components/stages/
    // TopicStage.jsx). Anything not a recognized key (including "Just
    // Talk"'s undefined/null) falls through TOPIC_CURRICULA to LEXIS's
    // original open topic rotation inside buildTutorInstructions.
    const topic = ['everyday', 'work', 'travel'].includes(req.body?.topic) ? req.body.topic : undefined;

    // gpt-4o-realtime-preview-2024-12-17 (an old default here) 404s on
    // POST /v1/realtime/calls — that dated preview snapshot isn't routable
    // through the newer WebRTC calls gateway paired with client_secrets;
    // OpenAI's own docs for this exact flow only ever reference the
    // gpt-realtime family. Fixed once before (git log), regressed once
    // (that regression is exactly why .env.example's OPENAI_MODEL example
    // value used to name the broken snapshot — copy that file verbatim
    // into a real .env and this endpoint 404s). The frontend's SDP-
    // exchange call (LexisApp.jsx) used to independently hardcode this
    // same model name as a second literal kept in sync by hand — it now
    // reads the value this endpoint actually used, below, instead of
    // guessing it again.
    //
    // gpt-realtime-2.1 (22 Aug 2026): OpenAI's newer flagship Realtime
    // model, released 6 Jul 2026 — same price, same client_secrets/calls
    // endpoints and session shape as the base gpt-realtime family (voice,
    // VAD, and everything else below is unchanged), but cuts measured p95
    // voice latency by 25%+ and improves interruption handling — directly
    // relevant to a product whose whole pitch is "no awkward pauses."
    // reasoning.effort: 'low' is actually already 2.1's own default (kept
    // latency-optimized unless told otherwise), set explicitly here so
    // that stays true even if OpenAI ever changes the silent default.
    // Rollback if this regresses quality in real use: OPENAI_MODEL=
    // gpt-realtime in Vercel's env vars, no code change or redeploy
    // needed, since this already reads from that env var first.
    const realtimeModel = process.env.OPENAI_MODEL || 'gpt-realtime-2.1';

    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Safety-Identifier': safetyIdentifier
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model: realtimeModel,
          reasoning: { effort: 'low' },
          audio: {
            // 'verse' reads as male; the tutor avatar (frontend) is a
            // consistently female persona, so the voice should match.
            // Tried 'shimmer' (warm, clearly female) first, but it
            // live-verified going silent specifically on Thai portions of
            // mixed English/Thai replies — even after the system prompt was
            // told explicitly to never mute Thai audio (see buildTutorInstructions).
            // 'marin' is OpenAI's newer flagship female Realtime voice,
            // released alongside 'cedar' specifically with better handling
            // of "switching seamlessly between languages mid-sentence" —
            // exactly this bilingual use case — so trying it in place of a
            // prompt-only fix. If Thai audio still drops, that's a real
            // model-level Thai-audio-synthesis gap, not a voice-pick problem.
            //
            // Reported: LEXIS speaks too fast. `speed` is a real, dedicated
            // parameter here — a post-processing playback-rate multiplier
            // (0.25-1.5, default 1.0), independent of the "speak at a
            // measured pace" prompt wording already in
            // buildTutorInstructions(), which evidently isn't being
            // followed strongly enough on its own. 0.85 is a deliberately
            // modest slowdown (15%) rather than a guess at "much slower" —
            // easier to verify live and nudge further than to overshoot
            // into an unnaturally draggy voice on the first try.
            output: { voice: 'marin', speed: 0.85 },
            input: {
              transcription: { model: 'whisper-1' },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 400,
                // Reported: LEXIS "seems very sensitive to interruptions" —
                // jumping in with a response/correction while the student
                // was still mid-sentence. silence_duration_ms is how long a
                // pause has to be before server_vad decides the student's
                // turn is actually over; 800ms is short for a language
                // learner who pauses to find a word mid-thought (a totally
                // normal part of speaking a language you're still
                // learning, not the end of their turn). Bumped modestly —
                // not doubled — to give that real thinking-pause room
                // without making the conversation feel laggy for students
                // who don't need it.
                silence_duration_ms: 1000,
                // Explicit rather than relying on undocumented defaults —
                // OpenAI's reference doesn't state a default for either.
                //
                // create_response: auto-generate a reply once VAD decides
                // the student's turn ended. Was already happening in
                // practice (this app has never sent a manual
                // response.create), so this makes existing behavior
                // explicit rather than changing anything.
                //
                // interrupt_response: have the SERVER also auto-cancel
                // LEXIS's in-progress response the moment VAD detects the
                // student started talking — verified against OpenAI's
                // reference docs (quoted verbatim): "Whether or not to
                // automatically interrupt (cancel) any ongoing response...
                // when a VAD start event occurs." That's exactly what
                // LexisApp.jsx's client-side barge-in already does by hand
                // (pause the <audio> element, send response.cancel and
                // output_audio_buffer.clear on input_audio_buffer.speech_started
                // — see the dc.onmessage handler there). Added here as a
                // second, server-side layer alongside that existing client
                // logic, not a replacement for it — the client-side path
                // fixed a real "audio goes silent after any interruption"
                // bug before (see PR #29's history) and is left completely
                // unchanged; a redundant response.cancel from the client
                // after the server already cancelled it is a documented
                // no-op, not a conflict.
                create_response: true,
                interrupt_response: true
              }
            }
          },
          instructions: buildTutorInstructions(direction, topic)
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LEXIS OpenAI Error]', response.status, errorText);
      return res.status(response.status).json({ error: 'Failed to mint session token.' });
    }

    const sessionData = await response.json();

    // /v1/realtime/client_secrets returns a FLAT body — { value, expires_at,
    // session } — not { client_secret: { value, ... } }. Reading a nested
    // client_secret.value here silently resolves to undefined via the
    // optional chain instead of throwing, so the endpoint returns 200 with
    // an empty secret and the failure only surfaces client-side as "Received
    // invalid client secret from token broker." This exact bug has
    // regressed once already, so: prefer the flat shape, fall back to the
    // nested one in case OpenAI's response shape drifts again, and fail
    // loudly (not silently-200-with-nothing) if neither is present.
    const clientSecretValue = sessionData.value ?? sessionData.client_secret?.value;
    const clientSecretExpiresAt = sessionData.expires_at ?? sessionData.client_secret?.expires_at;
    if (!clientSecretValue) {
      console.error('[LEXIS OpenAI Error] client_secrets response missing value:', JSON.stringify(sessionData));
      return res.status(502).json({ error: 'OpenAI did not return a client secret.' });
    }

    const { error: rpcError } = await supabase.rpc('increment_sessions', { user_id_param: req.user.id });
    if (rpcError) {
      console.error('[LEXIS Supabase] increment_sessions RPC failed (non-fatal):', rpcError);
    }

    res.json({
      client_secret: clientSecretValue,
      expires_at: clientSecretExpiresAt,
      // Single source of truth for the model this client_secret was minted
      // against — LexisApp.jsx's SDP exchange reads this instead of
      // hardcoding a second copy of the same string (see realtimeModel
      // above for the regression that motivated this).
      model: realtimeModel
    });

  } catch (err) {
    logError('Session Error', err);
    res.status(500).json({ error: 'Internal server error during session initialization.' });
  }
});

// Telemetry Heartbeat
app.post('/api/heartbeat', heartbeatRateLimiter, authenticate, requireEntitlement, async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('record_heartbeat', {
      user_id_param: req.user.id,
      increment_seconds: 30
    });
    if (error) throw error;
    res.json({ status: 'ack', telemetry: data });
  } catch (err) {
    logError('Heartbeat Error', err);
    res.status(500).json({ error: 'Failed to record usage telemetry.' });
  }
});

// Live-translation subtitles for the Live Conversation stage
// (frontend/src/components/stages/LiveStage.jsx). Deliberately a separate,
// async, non-blocking call rather than asking the realtime session itself
// to produce a translation inline — a realtime turn's audio must not wait
// on a second model call before it starts playing, and the Realtime API
// has no clean way to attach a silent text-only translation to a spoken
// turn without touching turn-taking. The frontend fires this once a
// LEXIS turn's transcript is complete (`response.done`) and shows the
// translation as a second subtitle line whenever it resolves — the audio
// has typically already been playing for a beat by then, same as real
// closed captions lagging slightly behind speech.
app.post('/api/translate', translateRateLimiter, authenticate, requireEntitlement, async (req, res) => {
  try {
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    if (!text) return res.json({ translation: '' });
    // buildTutorInstructions() already caps LEXIS's own turns at 15-25
    // words; anything wildly past that isn't a real turn from this app and
    // isn't worth spending a model call on.
    if (text.length > 600) return res.status(400).json({ error: 'Text too long to translate.' });

    // The subtitle is a GLOSS: it exists so the learner can check what LEXIS
    // just said, so it must be in the language they already speak — the
    // opposite of the one they are learning.
    //
    //   direction 'en' -> Thai speaker learning English -> gloss in Thai
    //   direction 'th' -> English speaker learning Thai -> gloss in English
    //
    // (See buildTutorInstructions: direction 'th' means "Thai tutor for
    // English speakers".)
    //
    // This used to be left to the model to auto-detect from the input:
    // "if it's English translate to Thai, if it's Thai translate to
    // English". That reads as correct and is wrong in exactly the case
    // that matters. LEXIS is a bilingual tutor and code-switches
    // constantly — a word of Thai encouragement while teaching English,
    // an English scaffold while teaching Thai. Auto-detect keys off that
    // fragment rather than off the lesson, so the gloss flips to the
    // language the learner is trying to learn, which is precisely the one
    // they cannot read yet. The frontend has always sent `direction`
    // (LexisApp.jsx requestTranslation); this endpoint simply ignored it.
    const direction = req.body?.direction === 'th' ? 'th' : 'en';
    const targetLanguage = direction === 'th' ? 'English' : 'Thai';
    const systemPrompt =
      `You translate short spoken tutoring utterances for a language learner. ` +
      `Translate the given text into ${targetLanguage}, whatever language it is written in. ` +
      `If it is already entirely in ${targetLanguage}, repeat it unchanged. ` +
      `If it mixes languages, render the whole thing in ${targetLanguage}. ` +
      `Reply with ONLY the ${targetLanguage} translation — no quotes, no explanation, no romanization, no commentary.`;

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          { role: 'user', content: text }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LEXIS Translate Error]', response.status, errorText);
      return res.status(502).json({ error: 'Translation failed.' });
    }

    const data = await response.json();
    const translation = data.choices?.[0]?.message?.content?.trim();
    if (!translation) {
      console.error('[LEXIS Translate Error] Empty completion:', JSON.stringify(data));
      return res.status(502).json({ error: 'Translation returned no content.' });
    }

    res.json({ translation });
  } catch (err) {
    logError('Translate Error', err);
    res.status(500).json({ error: 'Internal server error during translation.' });
  }
});

// A floor below which there just isn't enough material to evaluate
// honestly — see the guard in /api/feedback below.
const MIN_FEEDBACK_WORDS = 12;
const MIN_FEEDBACK_TURNS = 2;
// Bounds how much transcript gets sent to the model — a long session
// shouldn't balloon this call's cost/latency. Keeps the first couple of
// lines (onboarding — name, level) plus as many of the MOST RECENT lines as
// fit in what's left of the budget, since sustained/current performance is
// more representative of "how are they doing" than the first minute of
// warming up.
const MAX_FEEDBACK_TRANSCRIPT_CHARS = 8000;

function summarizeTranscriptForFeedback(transcripts) {
  const lines = transcripts.map((t) => `${t.speaker === 'user' ? 'Student' : 'LEXIS'}: ${t.text}`);
  const joined = lines.join('\n');
  if (joined.length <= MAX_FEEDBACK_TRANSCRIPT_CHARS) return joined;

  const head = lines.slice(0, 2);
  const headText = head.join('\n');
  const budget = MAX_FEEDBACK_TRANSCRIPT_CHARS - headText.length - 50;
  const tail = [];
  let used = 0;
  for (let i = lines.length - 1; i >= 2 && used < budget; i--) {
    tail.unshift(lines[i]);
    used += lines[i].length + 1;
  }
  return `${headText}\n[... earlier turns omitted ...]\n${tail.join('\n')}`;
}

// Persists a feedback result to session_history (see backend/supabase-schema.sql)
// so it's viewable later via GET /api/history — non-fatal on failure. A
// student who was just given their feedback on screen shouldn't get an
// error over the *history record* of it failing to save; log and move on.
async function saveSessionHistory({ userId, direction, topic, insufficient, confidence, strengths, improvements }) {
  const { error } = await supabase.from('session_history').insert({
    user_id: userId,
    direction,
    topic,
    insufficient,
    confidence: confidence ?? null,
    strengths: strengths ?? [],
    improvements: improvements ?? []
  });
  if (error) console.error('[LEXIS History Error] Failed to save session_history row (non-fatal):', error);
}

// One real LLM pass over a just-finished session's actual transcript — the
// Feedback stage (frontend/src/components/stages/FeedbackStage.jsx). No
// static/fabricated score: short sessions get an honest "talk a bit more"
// message instead (see the word-count guard below), and every strength or
// correction the model returns is required to be grounded in what the
// student actually said, per the system prompt.
//
// Not gated by requireEntitlement — a user whose trial ran out mid-session
// still deserves to see feedback on the session they just finished (same
// reasoning as /api/stripe/checkout below). It IS rate-limited
// (feedbackRateLimiter) since it's still a real model call.
app.post('/api/feedback', feedbackRateLimiter, authenticate, async (req, res) => {
  try {
    const transcripts = Array.isArray(req.body?.transcripts) ? req.body.transcripts : [];
    const direction = req.body?.direction === 'th' ? 'th' : 'en';
    // Purely for session_history's own record — doesn't affect grading.
    // Same validation as /api/session's topic param.
    const topic = ['everyday', 'work', 'travel'].includes(req.body?.topic) ? req.body.topic : null;
    const targetLabel = direction === 'th' ? 'Thai' : 'English';
    // Same convention as buildTutorInstructions above — the language the
    // student is comfortable in, i.e. NOT the one they're learning.
    // Reported live: a Thai speaker learning English got their whole
    // feedback report back in English, which they can't necessarily read
    // any more easily than the lesson itself — the report needs to be
    // legible on its own, not just another thing to translate.
    const baseLanguage = direction === 'th' ? 'English' : 'Thai';

    const studentTurns = transcripts.filter((t) => t?.speaker === 'user' && typeof t.text === 'string' && t.text.trim());
    const studentWordCount = studentTurns.reduce((sum, t) => sum + t.text.trim().split(/\s+/).length, 0);

    // Honesty guard, same standard as the fabricated "Priority Server
    // Queue" pricing claim fixed earlier this project — a real score needs
    // real material. Faking a number from a couple of words would be worse
    // than showing no score at all.
    if (studentTurns.length < MIN_FEEDBACK_TURNS || studentWordCount < MIN_FEEDBACK_WORDS) {
      const insufficientMessage = direction === 'en'
        ? 'ครั้งนี้พูดสั้นไปหน่อยนะ! คุยให้นานขึ้นอีกนิดในครั้งหน้า แล้วฉันจะสรุปผลจริงๆ ให้ดูว่าคุณทำได้ดีแค่ไหน'
        : "That was a quick one! Talk a little more next time and I'll be able to show you real feedback on how you're doing.";
      await saveSessionHistory({ userId: req.user.id, direction, topic, insufficient: true, confidence: null, strengths: [], improvements: [] });
      return res.json({ insufficient: true, message: insufficientMessage });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini';
    const transcriptText = summarizeTranscriptForFeedback(transcripts);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 600,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'lexis_session_feedback',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                confidence: { type: 'integer', minimum: 0, maximum: 100 },
                strengths: { type: 'array', maxItems: 3, items: { type: 'string' } },
                improvements: {
                  type: 'array',
                  maxItems: 3,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      original: { type: 'string' },
                      corrected: { type: 'string' },
                      note: { type: 'string' }
                    },
                    required: ['original', 'corrected', 'note']
                  }
                }
              },
              required: ['confidence', 'strengths', 'improvements']
            }
          }
        },
        messages: [
          {
            role: 'system',
            content: `You are an encouraging but honest ${targetLabel} speaking-practice evaluator. You will be given a transcript of a spoken tutoring session between a student and their AI tutor LEXIS. Evaluate ONLY the Student's own lines — never the tutor's.

Ground every strength and correction in something the student ACTUALLY said in the transcript below — quote or closely paraphrase their real words. Never invent an example that isn't grounded in the transcript. If there isn't enough real material for 3 strengths or 3 corrections, return fewer rather than padding with filler.

LANGUAGE OF YOUR RESPONSE — this matters: the student's comfortable language is ${baseLanguage}, not ${targetLabel} (${targetLabel} is what they're actively learning and struggling with — that's the whole reason they need this report explained clearly). Write every "strengths" item and every "note" field entirely in ${baseLanguage}, so the student can actually read their own feedback without needing a translation. The "original" and "corrected" fields are the one exception — those stay in ${targetLabel}, since they're literal quotes/examples of the student's actual speech and the corrected version of it, not commentary.

Each "note" should be one short ${baseLanguage} sentence explaining *why* the correction matters — not a grammar lecture, just enough for the student to understand what changed and why, in their own language.

confidence (0-100) should reflect genuine fluency/accuracy signals — grammar, natural phrasing, vocabulary range, how well they responded to what LEXIS actually asked. Do NOT count native-language accent or pronunciation features against them (e.g. a Thai speaker not distinguishing "sh"/"s" in English, or similar first-language carryover) — that's an accent, not an error, and this score should reflect communication ability, not how native they sound. A short, simple, error-free exchange is NOT automatically a high score; a longer session with some mistakes but real recovery and range can still score well. Be honest, not just encouraging.`
          },
          { role: 'user', content: transcriptText }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LEXIS Feedback Error]', response.status, errorText);
      return res.status(502).json({ error: 'Could not generate feedback for this session.' });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error('[LEXIS Feedback Error] Non-JSON completion:', raw);
      return res.status(502).json({ error: 'Feedback response was malformed.' });
    }

    // Don't trust the model's shape blindly even with response_format set —
    // validate before any of it reaches the client.
    const confidence = Number.isInteger(parsed?.confidence) ? Math.max(0, Math.min(100, parsed.confidence)) : null;
    const strengths = Array.isArray(parsed?.strengths)
      ? parsed.strengths.filter((s) => typeof s === 'string' && s.trim()).slice(0, 3)
      : [];
    const improvements = Array.isArray(parsed?.improvements)
      ? parsed.improvements
          .filter((i) => i && typeof i.original === 'string' && typeof i.corrected === 'string')
          .map((i) => ({ original: i.original, corrected: i.corrected, note: typeof i.note === 'string' ? i.note : '' }))
          .slice(0, 3)
      : [];

    if (confidence === null) {
      console.error('[LEXIS Feedback Error] Missing/invalid confidence in parsed response:', JSON.stringify(parsed));
      return res.status(502).json({ error: 'Feedback response was incomplete.' });
    }

    await saveSessionHistory({ userId: req.user.id, direction, topic, insufficient: false, confidence, strengths, improvements });
    res.json({ confidence, strengths, improvements });
  } catch (err) {
    logError('Feedback Error', err);
    res.status(500).json({ error: 'Internal server error while generating feedback.' });
  }
});

// Past-session feedback history (frontend/src/components/stages/HistoryStage.jsx)
// — most recent first, capped at 30. Not entitlement-gated: viewing your
// own past feedback isn't consuming a new session, same reasoning as
// /api/feedback and /api/stripe/checkout.
app.get('/api/history', historyRateLimiter, authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('session_history')
      .select('id, direction, topic, insufficient, confidence, strengths, improvements, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;
    res.json({ history: data || [] });
  } catch (err) {
    logError('History Error', err);
    res.status(500).json({ error: 'Failed to load session history.' });
  }
});

// LEXIS Community — the pay-it-forward checkout add-on (see
// frontend's CommunityPage.jsx for the full framing). A flat amount per
// billing cycle, not a percentage, so it's a predictable, easy-to-explain
// line item rather than a surprise. Deliberately a single named constant
// so the one number is easy to find and change — not scattered across
// checkout logic and copy separately.
const SPONSOR_ADDON_THB = 50;

// Stripe recurring Price IDs — live mode, Clearmark account
// (acct_1T1zS9F1FdEsYK5E). Moved here from PricingPage.jsx (21 Aug 2026,
// re-audit B2): the client used to send its own priceId straight through
// to stripe.checkout.sessions.create with no server-side check that it
// matched planTier or was one of these two prices at all — meaning any
// client could POST an arbitrary price_id from this same Stripe account
// and get charged whatever that price says, not what the pricing page
// displayed. The backend is now the only place planTier resolves to a
// real price; the endpoint below no longer accepts a priceId from the
// client at all. process.env fallback to the known-real IDs means this
// keeps working with zero Vercel config changes, while still letting a
// price change happen via an env var update instead of a frontend
// deploy, if that's ever wanted.
//
// These are ONE-TIME prices (Stripe `type: one_time`), not the recurring
// ones this used to charge — see the checkout endpoint below for why the
// billing model changed. The recurring prices still exist and still bill
// the subscribers created before the change; nothing new is sold on them.
//
// Deliberately NOT the STRIPE_PRICE_WEEKLY / STRIPE_PRICE_MONTHLY env var
// names this used to read. Those may still be set in a deployed
// environment, pointing at the recurring prices, and a recurring price in
// a payment-mode Checkout Session is a hard Stripe error — so a stale
// value would silently break every checkout. New names mean an unset
// variable falls through to the correct default instead.
const STRIPE_PRICES = {
  weekly: process.env.STRIPE_PRICE_WEEKLY_ONETIME || 'price_1UBKYIF1FdEsYK5EmoapMorw',   // LEXIS Weekly Pass — 7-day, THB 199
  monthly: process.env.STRIPE_PRICE_MONTHLY_ONETIME || 'price_1UBKYMF1FdEsYK5EMo7f5rVQ'  // LEXIS Monthly Immersion — 30-day, THB 599
};

// How long a pass buys, in days, keyed by tier — the same PERIOD_DAYS the
// fair-use window uses, named here for the places that read it as an
// access duration rather than as an accounting window. Under one-off
// passes those two are the same span by construction: a pass IS one
// fair-use period.
function passDays(tier) {
  return PERIOD_DAYS[tier] ?? PERIOD_DAYS.weekly;
}

// Per-session Checkout branding (4 Sep 2026).
//
// This Stripe account is Clearmark's, and its account-wide branding says
// "Digital Renaissance", with that business's icon and Stripe's stock blue
// button. So a LEXIS customer who clicked Get Started was handed a payment
// page for a company they had never heard of, looking nothing like the site
// they arrived from — reported straight off the live checkout as "tab says
// digital renaissance" and "random stuff up top left". On a THB 199 impulse
// buy from a first-time visitor, that is not a cosmetic problem; it is the
// moment the purchase reads as a scam.
//
// The account-wide setting is shared with Clearmark's other products, so
// repointing it is not this codebase's call to make. branding_settings
// overrides it for THIS session only, which is exactly the right scope:
// LEXIS's checkout looks like LEXIS and nothing else on the account moves.
//
// Known limit, so nobody thinks this is finished: Stripe applies these to
// the Checkout PAGE only. Receipts, invoices and the card statement still
// carry the account's own business name and descriptor. This narrows the
// mismatch to after the payment; removing it entirely means changing
// account-wide settings, which is a decision for whoever owns the account.
//
// button_color is the teal from the mark (Tailwind's teal-600 — the same
// #0D9488 as frontend/public/favicon.svg) rather than the amber the site
// uses for its own CTAs. The amber only has contrast against DARK text; it
// is navy-on-amber everywhere in the app. Stripe picks the button's text
// colour itself, and a brand colour that works under only one foreground is
// a bad bet when something else chooses the foreground. Teal reads
// correctly under either, and it matches the icon sitting directly above it.
//
// The images are URLs on the live site rather than uploaded Stripe File
// objects. A File would be a second copy to keep in step with
// public/icon-*.png by hand; this way the badge on the checkout page is
// literally the same file as the PWA icon and the favicon, and updating the
// mark updates all three at once.
//
// Pinned to the production host rather than built from resolveFrontendOrigin
// below: Stripe fetches these server-side, and a Vercel preview origin sits
// behind deployment protection, so a preview's checkout would hand Stripe a
// URL it gets a login page from.
const LEXIS_CHECKOUT_BRANDING = {
  display_name: 'LEXIS',
  background_color: '#FAFAF7',  // lexis-canvas
  button_color: '#0D9488',      // teal-600 — the mark's own colour
  border_style: 'rounded',      // matches the app's rounded-2xl surfaces
  icon: { type: 'url', url: 'https://learnwithlexis.com/icon-192.png' },
  logo: { type: 'url', url: 'https://learnwithlexis.com/icon-512.png' }
};

// Stripe Checkout — auth required, but NOT entitlement-gated: a user whose
// trial just expired is exactly who needs to reach this endpoint.
//
// One-off passes, not subscriptions (2 Sep 2026). LEXIS sells to a Thai
// audience, and PromptPay — the bank QR standard the country actually pays
// with — is the payment method that matters most here. Stripe supports it,
// this account has it enabled, and it has already taken a live PromptPay
// charge. What Stripe will not do is offer it in a subscription-mode
// Checkout: its docs list PromptPay as "not supported when using Checkout
// in subscription mode", because it is a one-time customer-initiated
// payment. Subscriptions can take it only through the send_invoice
// collection method — i.e. emailing an invoice and waiting, which is not a
// checkout flow anyone completes for a THB 199 impulse buy. Card-only
// checkout was the real price of staying on subscriptions.
//
// So a pass is now a single charge buying a fixed window of access: 7 days
// weekly, 30 days monthly. Nothing auto-renews, and the consequences of
// that all land in the webhook below — access is granted as an explicit
// access_expires_at rather than implied by a live Stripe subscription, and
// a payment that confirms after the redirect has to be waited for rather
// than assumed.
app.post('/api/stripe/checkout', authenticate, async (req, res) => {
  try {
    const { planTier, sponsorAdd, lang } = req.body || {};
    if (!planTier || !['weekly', 'monthly'].includes(planTier)) {
      return res.status(400).json({ error: 'Invalid planTier: expected "weekly" or "monthly".' });
    }
    const priceId = STRIPE_PRICES[planTier];

    const lineItems = [{ price: priceId, quantity: 1 }];
    if (sponsorAdd) {
      // price_data creates the Price object on the fly, scoped to this one
      // Checkout Session — no pre-created Stripe Price ID needed (unlike
      // priceId above, which does require one). No `recurring` block: in
      // payment mode every line item has to be one-time, and the add-on is
      // now a single donation riding along with a single pass rather than
      // a standing commitment that outlives the pass that started it.
      lineItems.push({
        price_data: {
          currency: 'thb',
          product_data: { name: 'LEXIS Community: sponsor a student' },
          unit_amount: SPONSOR_ADDON_THB * 100 // satang
        },
        quantity: 1
      });
    }

    const frontendOrigin = resolveFrontendOrigin(req);
    const metadata = {
      user_id: req.user.id,
      plan_tier: planTier,
      pass_days: String(passDays(planTier)),
      sponsor_add: sponsorAdd ? 'true' : 'false'
    };

    // Stripe renders Checkout in the browser's locale by default. That is
    // the right guess on most sites and the wrong one here: a Thai learner
    // reading the Thai pricing page on a phone set to English should not be
    // handed an English payment page at the one moment they are deciding
    // whether to trust it. Pass through the language the page was actually
    // being read in. Anything unrecognised falls back to Stripe's own
    // detection rather than being forced to English.
    const checkoutLocale = lang === 'th' ? 'th' : lang === 'en' ? 'en' : null;

    const params = {
      // payment_method_types deliberately omitted. Hardcoding ['card'] meant
      // enabling a method in the Stripe Dashboard had no effect here, so the
      // dashboard and the code could silently disagree. Omitting it lets
      // Stripe offer whatever is enabled AND eligible for this session —
      // which, for a THB-denominated payment-mode session on this account,
      // is what puts PromptPay in front of a Thai customer alongside cards,
      // Apple Pay and Google Pay.
      mode: 'payment',
      customer_email: req.user.email,
      // In payment mode Stripe only creates a Customer when it has to, so
      // session.customer would otherwise come back null and we'd have no
      // stripe_customer_id to store against the profile.
      customer_creation: 'always',
      line_items: lineItems,
      metadata,
      // Mirrored onto the PaymentIntent so a charge opened in the Stripe
      // dashboard — for a refund, or a PromptPay payer asking where their
      // money went — still says which LEXIS account it belongs to. The
      // Checkout Session's own metadata is not visible from a charge.
      payment_intent_data: { metadata },
      success_url: `${frontendOrigin}/app?payment=success${sponsorAdd ? '&sponsor=1' : ''}`,
      cancel_url: `${frontendOrigin}/pricing?payment=cancelled`,
      allow_promotion_codes: true,
      branding_settings: LEXIS_CHECKOUT_BRANDING,
      ...(checkoutLocale ? { locale: checkoutLocale } : {})
    };

    // Branding must never be able to take checkout down. Two of those fields
    // are URLs Stripe fetches server-side while creating the session, so an
    // icon renamed in a future frontend deploy — or any branding field a
    // later Stripe API version stops accepting — would turn a cosmetic
    // problem into "nobody can pay", which is the single worst failure this
    // product has. Retry once without it and log loudly: a plainly branded
    // checkout that works beats a correctly branded one that doesn't exist.
    //
    // Deliberately catches everything rather than sniffing the error for a
    // branding-shaped message. A real fault (a bad price ID, Stripe down)
    // fails the retry too and lands in the outer catch exactly as before —
    // one extra API call on a request that was already failing.
    let session;
    try {
      session = await stripe.checkout.sessions.create(params);
    } catch (brandingErr) {
      const { branding_settings, ...unbranded } = params;
      session = await stripe.checkout.sessions.create(unbranded);
      logError('Stripe Checkout branding rejected - fell back to account branding', brandingErr);
    }

    res.json({ url: session.url });
  } catch (err) {
    logError('Stripe Checkout Error', err);
    res.status(500).json({ error: 'Failed to create payment checkout session.' });
  }
});

// Cancel a subscription — self-serve, per the Refund & Cancellation Policy
// (RefundPage.jsx): stops future renewal but leaves access in place for the
// rest of the period already paid for. cancel_at_period_end leaves Stripe's
// subscription.status as 'active' until the period naturally ends, at which
// point Stripe fires customer.subscription.deleted — already handled by the
// webhook below (sets subscription_status: 'canceled', subscription_tier:
// 'free') with no further changes needed here.
//
// Since 2 Sep 2026 no NEW purchase creates a subscription (see the checkout
// endpoint), so for anyone who bought a pass this endpoint has nothing to
// act on and says so — a pass ends by itself and cannot renew, which is a
// better answer than "no active subscription". The endpoint stays because
// the subscriptions created before that date are still live in Stripe and
// still renew every week, and their owners must still be able to stop them.
app.post('/api/stripe/cancel', cancelRateLimiter, authenticate, async (req, res) => {
  try {
    const subscriptionId = req.profile.stripe_subscription_id;
    if (!subscriptionId) {
      return res.status(400).json({
        error: 'NOTHING_TO_CANCEL',
        message: 'Your pass is a one-off purchase. It ends on its own and never renews, so there is nothing to cancel.'
      });
    }
    if (req.profile.subscription_status !== 'active') {
      return res.status(400).json({ error: 'No active paid subscription to cancel.' });
    }

    const subscription = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
    res.json({ cancelAtPeriodEnd: true, currentPeriodEnd: subscription.current_period_end });
  } catch (err) {
    logError('Stripe Cancel Error', err);
    res.status(500).json({ error: 'Failed to cancel subscription. Please try again or contact support.' });
  }
});

// First-party analytics — deliberately NOT gated behind authenticate:
// pageviews and signup happen before anyone has a session. When a bearer
// token IS present (post-login events like checkout/cancel), it's used
// on a best-effort basis to attach user_id — an invalid/expired token
// just means the event is recorded without one, not a rejected request,
// since losing a data point is a much smaller problem than an analytics
// call breaking whatever real action the user just took.
app.post('/api/analytics/event', analyticsRateLimiter, async (req, res) => {
  try {
    const { event, path, lang, sessionId, metadata } = req.body || {};
    if (!event || !ANALYTICS_EVENTS.has(event)) {
      return res.status(400).json({ error: 'Unknown or missing event name.' });
    }
    if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 100) {
      return res.status(400).json({ error: 'Missing or invalid sessionId.' });
    }

    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const { data } = await supabase.auth.getUser(authHeader.split(' ')[1]);
      if (data?.user) userId = data.user.id;
    }

    const { error } = await supabase.from('analytics_events').insert({
      event_name: event,
      path: typeof path === 'string' ? path.slice(0, 200) : null,
      lang: typeof lang === 'string' ? lang.slice(0, 10) : null,
      session_id: sessionId,
      user_id: userId,
      metadata: metadata && typeof metadata === 'object' ? metadata : {}
    });
    if (error) throw error;

    res.status(204).end();
  } catch (err) {
    console.error('[LEXIS Analytics Error]', err);
    res.status(500).json({ error: 'Failed to record event.' });
  }
});

// Frontend error reporting — see frontend/src/lib/errorReporting.js for
// the three real sources (window 'error', 'unhandledrejection', and the
// app-wide React ErrorBoundary in main.jsx). Same shape as the analytics
// endpoint above: unauthenticated (a crash can happen on any page, signed
// in or not), best-effort user_id from a bearer token if present, tightly
// bounded input sizes so one huge stack trace or message can't bloat a row.
app.post('/api/errors/log', errorReportRateLimiter, async (req, res) => {
  try {
    const { context, message, stack, url, extra } = req.body || {};
    if (typeof context !== 'string' || !context) {
      return res.status(400).json({ error: 'Missing context.' });
    }

    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const { data } = await supabase.auth.getUser(authHeader.split(' ')[1]);
      if (data?.user) userId = data.user.id;
    }

    const { error } = await supabase.from('error_logs').insert({
      context: `Frontend: ${context.slice(0, 100)}`,
      message: typeof message === 'string' ? message.slice(0, 2000) : null,
      stack: typeof stack === 'string' ? stack.slice(0, 8000) : null,
      extra: {
        url: typeof url === 'string' ? url.slice(0, 500) : null,
        userId,
        ...(extra && typeof extra === 'object' ? extra : {})
      }
    });
    if (error) throw error;

    res.status(204).end();
  } catch (err) {
    console.error('[LEXIS Error Reporting Error]', err);
    res.status(500).json({ error: 'Failed to record error report.' });
  }
});

// Stripe Webhook Listener
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[LEXIS Webhook Signature Error]', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object;

      // Two events, because a payment method can confirm after the customer
      // has already been redirected. Cards settle inside Checkout and
      // arrive here as `completed` with payment_status 'paid'; a delayed
      // method arrives as `completed` with payment_status 'unpaid' and then
      // as `async_payment_succeeded` once the money actually moves. Granting
      // on `completed` alone would hand out a pass for a payment that had
      // not happened and might never happen, so the payment_status test is
      // what makes the pair safe rather than the event name.
      //
      // 'no_payment_required' is the 100%-off promotion-code case — a real
      // entitlement, deliberately granted.
      if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
        // Not an error: this is the normal first half of a PromptPay or
        // other delayed payment. Nothing to do until it succeeds or fails.
        console.log('[LEXIS Webhook] Checkout session awaiting payment:', session.id, session.payment_status);
        return res.json({ received: true });
      }

      // This Stripe account sells more than LEXIS, and one webhook endpoint
      // receives checkout.session.completed for all of it. A session with
      // no user_id in its metadata was not created by /api/stripe/checkout
      // above, so it is not a LEXIS pass and there is nothing here to
      // fulfil — bail before redeem_pass, or every unrelated sale would
      // raise a "no profile for that user" alarm.
      const userId = session.metadata?.user_id;
      if (!userId) {
        console.log('[LEXIS Webhook] Ignoring checkout session with no LEXIS user_id:', session.id);
        return res.json({ received: true });
      }

      const planTier = ['weekly', 'monthly'].includes(session.metadata?.plan_tier)
        ? session.metadata.plan_tier
        : 'weekly';

      // redeem_pass (backend/supabase-schema.sql) does the whole grant in
      // one statement under a row lock: it extends access_expires_at from
      // the later of now and any pass still running, re-anchors the
      // fair-use window, and no-ops if this same Checkout Session has
      // already been redeemed. That last part is not optional — Stripe
      // guarantees at-least-once delivery, and a PromptPay purchase can
      // legitimately arrive as both of the two event types above, so a
      // read-then-write here would hand out one paid pass twice.
      const { data: expiresAt, error } = await supabase.rpc('redeem_pass', {
        p_user_id: userId,
        p_tier: planTier,
        p_days: PERIOD_DAYS[planTier] ?? PERIOD_DAYS.weekly,
        p_session_id: session.id,
        p_customer_id: session.customer || null
      });
      // A silent DB-write failure here is worse than most: Stripe already
      // has the customer's money. Unlike the old handler this one CAN
      // self-heal — it throws to the 500 below, Stripe retries, and
      // redeem_pass is idempotent, so a retry either fixes it or repeats
      // harmlessly. logError (not a plain console.error) so it also shows
      // up in error_logs rather than only in platform logs.
      if (error) {
        logError('Webhook Failed to Redeem Pass', error);
        throw error;
      }
      if (!expiresAt) {
        // The RPC found no profile for this user_id. Retrying will not
        // conjure one, so don't 500 into a Stripe retry loop — record it
        // loudly instead; it needs a human, and the money is already taken.
        logError('Webhook Redeemed Pass For Unknown Profile', new Error(`No profile for user_id ${userId} (session ${session.id})`));
      }

    } else if (event.type === 'checkout.session.async_payment_failed') {
      // The other half of the delayed-payment pair: the customer opened a
      // PromptPay QR (or similar) and never completed it, or the bank
      // rejected it. No entitlement was granted on `completed`, so there is
      // nothing to take back — this is recorded only so a support question
      // about a checkout that "went through" has an answer.
      const session = event.data.object;
      console.log('[LEXIS Webhook] Checkout payment failed:', session.id, session.metadata?.user_id);

    } else if (event.type === 'customer.subscription.updated') {
      // LEGACY. Nothing sold since 2 Sep 2026 creates a subscription, but
      // the ones created before it are still live in Stripe and still bill,
      // so these two handlers stay until the last of them is gone.
      //
      // They must not touch someone who has since bought a pass, and
      // matching on stripe_subscription_id alone does NOT achieve that: a
      // former subscriber keeps that id on their profile forever, so this
      // handler would happily set an active pass holder to 'past_due' —
      // and the deleted handler below would set them to 'canceled'/'free'
      // — destroying access they had just paid for. Two of these
      // subscriptions are past_due in Stripe right now, and past_due is
      // exactly the state that ends in a deletion event, so this is the
      // ordinary path rather than a corner case. Hence the live-pass guard
      // on both: NULL expiry (a real legacy subscriber) or an expiry
      // already in the past may be updated; a running pass may not.
      //
      // Covers payment failures / recoveries mid-cycle (Stripe status:
      // active, past_due, unpaid, canceled, incomplete, incomplete_expired).
      const subscription = event.data.object;
      const statusMap = { active: 'active', past_due: 'past_due', canceled: 'canceled', unpaid: 'past_due' };
      const mapped = statusMap[subscription.status];
      if (mapped) {
        const { error } = await supabase
          .from('profiles')
          .update({ subscription_status: mapped, updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscription.id)
          .or(`access_expires_at.is.null,access_expires_at.lt.${new Date().toISOString()}`);
        if (error) logError('Webhook Failed to Update Subscription Status', error);
      }

    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;

      // Same live-pass guard as above, and for the same reason: this is the
      // event that would otherwise cancel a pass somebody is currently
      // using, because they happened to also hold an old subscription.
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'canceled', subscription_tier: 'free', updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', subscription.id)
        .or(`access_expires_at.is.null,access_expires_at.lt.${new Date().toISOString()}`);
      if (error) logError('Webhook Failed to Cancel Subscription', error);

      // Forget the subscription itself either way. It no longer exists in
      // Stripe, so keeping the id only leaves a "Cancel plan" button that
      // errors and a row that a replayed event could match again. Runs
      // after the update above, which still needs the id to find the row.
      const { error: clearError } = await supabase
        .from('profiles')
        .update({ stripe_subscription_id: null, updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', subscription.id);
      if (clearError) logError('Webhook Failed to Clear Deleted Subscription Id', clearError);
    }

    res.json({ received: true });
  } catch (err) {
    logError('Webhook Handler Error', err);
    // A 500 makes Stripe retry — appropriate if our own DB write failed.
    res.status(500).json({ error: 'Webhook handler failed.' });
  }
});

// Final error handler — catches anything that reached here via next(err)
// rather than a route's own try/catch (in practice, today, that's just
// CorsOriginError from the cors() middleware above, since every route
// handler in this file catches its own errors). Always responds with the
// same shape as every other error in this API (JSON, { error: message })
// instead of falling through to Express's default HTML error page, which
// leaks a stack trace outside production and returns an unconditional 500
// even for an outcome — a disallowed CORS origin — that isn't a server
// fault at all. Four-argument signature is what makes Express treat this
// as an error handler rather than a normal middleware; it must stay last.
app.use((err, req, res, next) => {
  if (err instanceof CorsOriginError) {
    console.warn(err.message);
    return res.status(err.status).json({ error: 'Origin not allowed.' });
  }
  console.error('[LEXIS Unhandled Error]', err);
  res.status(err.status || 500).json({ error: 'Internal server error.' });
});

export default app;
