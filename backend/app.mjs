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

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`[LEXIS Security] CORS blocked request from origin: ${origin}`));
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
    return res.status(503).json({ error: `Server misconfigured — missing environment variable(s): ${missingEnv.join(', ')}` });
  }
  next();
});

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
    console.error('[LEXIS Auth Middleware Error]', err);
    res.status(500).json({ error: 'Internal security authentication failure.' });
  }
}

function requireEntitlement(req, res, next) {
  const profile = req.profile;
  const isPaid = profile.subscription_status === 'active';
  const isTrialValid = profile.subscription_status === 'free_trial' && profile.seconds_used < profile.max_allowed_seconds;

  if (!isPaid && !isTrialValid) {
    const message = profile.subscription_status === 'free_trial' || profile.subscription_status === 'expired'
      ? 'Free trial limit reached. Please upgrade to a Weekly or Monthly Pass.'
      : 'Your pass has ended. Please renew to continue.';
    return res.status(403).json({ error: 'TRIAL_EXHAUSTED', message });
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
function buildTutorInstructions(direction) {
  const learningThai = direction === 'th';

  const role = learningThai
    ? 'You are LEXIS, an elite AI Thai tutor for English speakers learning Thai.'
    : 'You are LEXIS, an elite AI English tutor designed specifically for Thai youth.';

  const correction = learningThai
    ? "Correct speech errors gently by modeling the proper Thai phrase, then ask a simple follow-up question."
    : 'Correct speech errors gently by modeling the proper phrase, then ask a simple follow-up question.';

  // Previously this told the model to "follow their lead" on language with
  // no fixed anchor — live-verified that reads as permission to actually
  // switch which language it's teaching mid-session (student replies in
  // English for a bit -> LEXIS drifts into teaching English, even in a
  // 'th' session), not just to acknowledge them in it. The target language
  // is chosen once, at session start, and must not drift — so state that
  // explicitly and demote the other language to "brief clarification only".
  const bilingual = learningThai
    ? `Fixed target language: Thai. This is the language you are teaching for the entire session — it does not change based on what the student says. The student may speak Thai, English, or a mix while practicing; meet them wherever they are, and never block or scold them for using English. But always keep teaching and modeling Thai — that's the lesson. If they seem stuck, you may clarify briefly in English, then immediately continue the lesson in Thai. Do not fully switch into teaching English just because they used it.`
    : `Fixed target language: English. This is the language you are teaching for the entire session — it does not change based on what the student says. The student may speak English, Thai, or a mix while practicing; meet them wherever they are, and never block or scold them for using Thai. But always keep teaching and modeling English — that's the lesson. If they seem stuck, you may clarify briefly in Thai, then immediately continue the lesson in English. Do not fully switch into teaching Thai just because they used it.`;

  const curriculumTarget = learningThai ? 'Thai' : 'English';
  // The language the student can already lean on comfortably — the fixed
  // target's opposite number. Used only to soften the very first turn.
  const baseLanguage = learningThai ? 'English' : 'Thai';

  // Live-verified: pinning the target language firmly (above) fixed the
  // drifting-mid-session problem, but exposed a worse first impression —
  // with nothing yet said by the student, LEXIS opened sessions with a
  // long stretch of pure target-language speech. For the 'th' direction
  // especially, a student who doesn't know any Thai yet got a wall of
  // unparseable Thai as their very first sound from the app — confusing,
  // and also the single longest continuous run of target-language audio
  // in the whole session, which is exactly where Thai audio synthesis is
  // most likely to glitch (see the marin-voice fix above). The fix for
  // that (a short, mostly-base-language first line) is folded into a
  // fuller onboarding flow below — requested explicitly: introduce
  // herself, get the student's name, then establish level and topic
  // before the lesson proper starts. Kept conversational and prompt-
  // driven rather than a rigid script or new stateful backend, matching
  // the "lightweight curriculum in the system prompt" approach already
  // chosen for this product over a stateful lesson-tracking system.
  const onboarding = `Onboarding (first few turns only, before the lesson proper begins):
1. Your very first message: introduce yourself as LEXIS and ask the student's name. Keep it short (max ~15 words), mostly in ${baseLanguage}. Include at most ONE short ${curriculumTarget} word or phrase here, never a full sentence or several phrases back to back — do not front-load a long run of ${curriculumTarget} before the student has spoken at all.
2. Once they give their name, greet them by it, then ask two things in one short turn: (a) whether they're a complete beginner or already know some ${curriculumTarget}, so you can set the right pace, and (b) what they'd like to practice today. If they seem unsure what to pick, offer 2-3 concrete example topics pulled from the curriculum below (e.g. greetings & introductions, ordering food, everyday small talk) rather than leaving it open-ended.
3. Once you know their level and topic (or they've picked one of your examples, or stayed quiet and you've defaulted to the easiest one), begin the lesson itself. A stated beginner gets single words and very short 2-3 word phrases, heavy repetition, and a slow pace with no grammar talk yet. Anyone with some experience starts at the normal pace described below.
Keep every onboarding turn short and conversational — this is a spoken exchange, not a menu being read aloud.`;

  return `${role}
Speak clearly, naturally, warmly, and at a measured pace.
Keep each response short (15-25 words max) to maximize student speaking time.
${correction}
Be patient when the student pauses or hesitates.

${bilingual}

${onboarding}

CRITICAL: Always speak every word of your reply out loud — in English and in Thai alike. Never go silent, mute, or skip the audio for Thai words or phrases; the student needs to actually hear the Thai pronunciation, not just read it. If a sentence mixes English and Thai, voice both parts audibly with no gaps.

Curriculum: guide the conversation through everyday topics, rotating naturally across a session — greetings & daily routine, family & friends, school life, hobbies & interests, food & ordering, shopping, travel & directions, weather & plans, technology & social media, future dreams. Don't announce the topic; just steer toward it. Start with simple present-tense, everyday ${curriculumTarget} vocabulary. If the student is doing well, introduce more complex grammar (past/future tense, connecting ideas, opinions). If they're struggling, simplify and slow down. Adjust level continuously based on how they're actually doing, not on a fixed schedule.`;
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
  res.json({ user: { id: req.user.id, email: req.user.email }, profile: req.profile });
});

// Ephemeral Token Minting (GA Endpoint)
app.post('/api/session', sessionRateLimiter, authenticate, requireEntitlement, async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const safetyIdentifier = crypto.createHash('sha256')
      .update(req.user.id + (process.env.LEXIS_SALT || 'lexis_salt'))
      .digest('hex').substring(0, 32);
    const direction = req.body?.direction === 'th' ? 'th' : 'en';

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
          // gpt-4o-realtime-preview-2024-12-17 (the old default here) 404s
          // on POST /v1/realtime/calls — that dated preview snapshot isn't
          // routable through the newer WebRTC calls gateway paired with
          // client_secrets; OpenAI's own docs for this exact flow only ever
          // reference the gpt-realtime family. Fixed once before (git log),
          // regressed; the frontend's SDP-exchange model query param
          // (LexisApp.jsx) independently hardcodes the same name and needs
          // to stay in sync with this one — they're two separate strings,
          // not shared config, so a future model change means updating both.
          model: process.env.OPENAI_MODEL || 'gpt-realtime',
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
            output: { voice: 'marin' },
            input: {
              transcription: { model: 'whisper-1' },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 400,
                silence_duration_ms: 800
              }
            }
          },
          instructions: buildTutorInstructions(direction)
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
      expires_at: clientSecretExpiresAt
    });

  } catch (err) {
    console.error('[LEXIS Session Error]', err);
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
    console.error('[LEXIS Heartbeat Error]', err);
    res.status(500).json({ error: 'Failed to record usage telemetry.' });
  }
});

// Stripe Checkout — auth required, but NOT entitlement-gated: a user whose
// trial just expired is exactly who needs to reach this endpoint.
app.post('/api/stripe/checkout', authenticate, async (req, res) => {
  try {
    const { priceId, planTier } = req.body || {};
    if (!priceId) return res.status(400).json({ error: 'Missing priceId parameter.' });
    if (planTier && !['weekly', 'monthly'].includes(planTier)) {
      return res.status(400).json({ error: 'Invalid planTier — expected "weekly" or "monthly".' });
    }

    const frontendOrigin = resolveFrontendOrigin(req);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: req.user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { user_id: req.user.id, plan_tier: planTier || 'weekly' },
      success_url: `${frontendOrigin}/app?payment=success`,
      cancel_url: `${frontendOrigin}/pricing?payment=cancelled`,
      allow_promotion_codes: true
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[LEXIS Stripe Checkout Error]', err);
    res.status(500).json({ error: 'Failed to create payment checkout session.' });
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
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_tier: session.metadata?.plan_tier || 'weekly',
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.metadata?.user_id);
      if (error) console.error('[LEXIS Webhook] Failed to activate subscription:', error);

    } else if (event.type === 'customer.subscription.updated') {
      // Covers payment failures / recoveries mid-cycle (Stripe status:
      // active, past_due, unpaid, canceled, incomplete, incomplete_expired).
      const subscription = event.data.object;
      const statusMap = { active: 'active', past_due: 'past_due', canceled: 'canceled', unpaid: 'past_due' };
      const mapped = statusMap[subscription.status];
      if (mapped) {
        const { error } = await supabase
          .from('profiles')
          .update({ subscription_status: mapped, updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscription.id);
        if (error) console.error('[LEXIS Webhook] Failed to update subscription status:', error);
      }

    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'canceled', subscription_tier: 'free', updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', subscription.id);
      if (error) console.error('[LEXIS Webhook] Failed to cancel subscription:', error);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[LEXIS Webhook Handler Error]', err);
    // A 500 makes Stripe retry — appropriate if our own DB write failed.
    res.status(500).json({ error: 'Webhook handler failed.' });
  }
});

export default app;
