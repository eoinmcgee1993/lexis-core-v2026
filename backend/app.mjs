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
/* 6. ROUTES                                                               */
/* ─────────────────────────────────────────────────────────────────────── */
app.get('/health', (req, res) => {
  res.json({
    status: missingEnv.length ? 'Misconfigured' : 'Operational',
    system: 'LEXIS Commerce v2026.3',
    timestamp: new Date().toISOString(),
    // Host only, never the key — lets a misconfigured-but-non-empty
    // SUPABASE_URL (wrong project, truncated value, etc.) be spotted from
    // the outside without needing Vercel dashboard access.
    supabaseUrlHost: process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).host : null,
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
          model: process.env.OPENAI_MODEL || 'gpt-4o-realtime-preview-2024-12-17',
          audio: {
            output: { voice: 'verse' },
            input: { transcription: { model: 'whisper-1' } }
          },
          instructions: `You are LEXIS, an elite AI English tutor designed specifically for Thai youth.
Speak clearly, naturally, warmly, and at a measured pace.
Keep each response short (15-25 words max) to maximize student speaking time.
Correct speech errors gently by modeling the proper phrase, then ask a simple follow-up question.
Be patient when the student pauses or hesitates.`,
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 400,
            silence_duration_ms: 800
          }
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LEXIS OpenAI Error]', response.status, errorText);
      return res.status(response.status).json({ error: 'Failed to mint session token.' });
    }

    const sessionData = await response.json();

    const { error: rpcError } = await supabase.rpc('increment_sessions', { user_id_param: req.user.id });
    if (rpcError) {
      console.error('[LEXIS Supabase] increment_sessions RPC failed (non-fatal):', rpcError);
    }

    res.json({
      client_secret: sessionData.client_secret?.value,
      expires_at: sessionData.client_secret?.expires_at
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
