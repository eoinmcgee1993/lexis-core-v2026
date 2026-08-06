// backend/server.mjs - Production GA Broker with Supabase Auth, Billing Guard & Usage Telemetry
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const app = express();
const PORT = process.env.PORT || 3001;

/* ─────────────────────────────────────────────────────────────────────── */
/* 1. ENVIRONMENT VALIDATION                                              */
/* ─────────────────────────────────────────────────────────────────────── */
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

for (const [name, value] of Object.entries({ OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY })) {
  if (!value) {
    console.error(`[LEXIS FATAL] ${name} environment variable is not set.`);
    process.exit(1);
  }
}
if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
  console.warn('[LEXIS WARN] STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET not set — /api/webhook/stripe will reject all events.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

/* ─────────────────────────────────────────────────────────────────────── */
/* 2. CORS DOMAIN WHITELIST                                                */
/* ─────────────────────────────────────────────────────────────────────── */
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`[LEXIS Security] CORS blocked origin: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/* ─────────────────────────────────────────────────────────────────────── */
/* 3. STRIPE WEBHOOK — mounted BEFORE express.json() so we get the raw    */
/*    body Stripe's signature check requires. Everything else uses JSON.  */
/* ─────────────────────────────────────────────────────────────────────── */
app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ error: 'Stripe webhook not configured on this server.' });
  }

  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[LEXIS Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userEmail = session.customer_details?.email || session.customer_email;
      const tier = session.metadata?.tier || 'weekly'; // 'weekly' or 'monthly'

      if (!userEmail) {
        console.error('[LEXIS Stripe Webhook] checkout.session.completed had no customer email; cannot activate a subscription.', session.id);
      } else {
        const { error, count } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_tier: tier,
            stripe_customer_id: session.customer
          }, { count: 'exact' })
          .eq('email', userEmail);

        if (error) {
          console.error('[LEXIS Stripe Webhook] Failed to activate subscription:', error);
        } else if (!count) {
          console.warn(`[LEXIS Stripe Webhook] No profile found for email ${userEmail} — payment received but account not activated.`);
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[LEXIS Stripe Webhook Error]', err);
    // A 500 here makes Stripe retry the event, which is what we want if our
    // own DB write failed — don't ack with 200 just to silence retries.
    res.status(500).json({ error: 'Webhook handler failed.' });
  }
});

app.use(express.json());

/* ─────────────────────────────────────────────────────────────────────── */
/* 4. IN-MEMORY RATE LIMITING (per-IP, separate buckets per route)        */
/* ─────────────────────────────────────────────────────────────────────── */
function makeRateLimiter({ windowMs, max }) {
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
      return res.status(429).json({ error: 'Too many requests. Rate limit exceeded.' });
    }
    next();
  };
}

const sessionRateLimiter = makeRateLimiter({ windowMs: 60_000, max: 10 });
// Legit clients heartbeat every 30s (~2/min); allow headroom for retries/reconnects.
const heartbeatRateLimiter = makeRateLimiter({ windowMs: 60_000, max: 6 });

/* ─────────────────────────────────────────────────────────────────────── */
/* 5. AUTH & BILLING GUARD — verifies the Supabase JWT, loads the         */
/*    profile, and enforces trial/subscription bounds before proceeding.  */
/* ─────────────────────────────────────────────────────────────────────── */
async function authenticateAndCheckBilling(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
    }

    const token = authHeader.split(' ')[1];

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid user session.' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: 'User profile not found.' });
    }

    if (profile.subscription_status === 'expired') {
      return res.status(402).json({ error: 'Subscription expired. Please upgrade to continue.' });
    }

    if (
      profile.subscription_status === 'free_trial' &&
      profile.seconds_used >= profile.max_allowed_seconds
    ) {
      return res.status(402).json({ error: 'Free trial usage limit reached. Please purchase a pass.' });
    }

    req.user = user;
    req.profile = profile;
    next();
  } catch (err) {
    console.error('[LEXIS Auth Middleware Error]', err);
    res.status(500).json({ error: 'Authentication internal error.' });
  }
}

/* ─────────────────────────────────────────────────────────────────────── */
/* 6. SESSION TOKEN GENERATION (GA — /v1/realtime/client_secrets)         */
/* ─────────────────────────────────────────────────────────────────────── */
app.post('/api/session', sessionRateLimiter, authenticateAndCheckBilling, async (req, res) => {
  try {
    const safetyIdentifier = crypto.createHash('sha256')
      .update(req.user.id + (process.env.LEXIS_SALT || 'lexis_salt'))
      .digest('hex').substring(0, 32);

    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Safety-Identifier': safetyIdentifier
      },
      body: JSON.stringify({
        expires_after: {
          anchor: 'created_at',
          seconds: 600
        },
        session: {
          type: 'realtime',
          model: process.env.OPENAI_MODEL || 'gpt-4o-realtime-preview-2024-12-17',
          instructions: `You are LEXIS, an elite AI English language tutor designed specifically for Thai youth.
Speak clearly, naturally, warmly, and at a measured pace.
Keep each response short (15 to 25 words max) to maximize student speaking time.
Correct speech errors gently by providing the corrected phrase, then ask a simple follow-up question.
Be patient when the student pauses or hesitates.`,
          audio: {
            output: { voice: 'verse', format: 'pcm' },
            input: { transcription: { model: 'whisper-1' } }
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 400,
            silence_duration_ms: 800
          },
          max_response_output_tokens: 4096
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LEXIS OpenAI Error]', response.status, errorText);
      return res.status(response.status).json({ error: 'Failed to mint ephemeral WebRTC session token.' });
    }

    const sessionData = await response.json();
    const ephemeralToken = sessionData.value;

    if (!ephemeralToken) {
      console.error('[LEXIS OpenAI Error] Unexpected response shape:', sessionData);
      return res.status(500).json({ error: 'No ephemeral token in OpenAI response.' });
    }

    const { error: rpcError } = await supabase.rpc('increment_sessions', { user_id_param: req.user.id });
    if (rpcError) {
      console.error('[LEXIS Supabase] increment_sessions RPC failed (non-fatal):', rpcError);
    }

    res.json({
      client_secret: ephemeralToken,
      expires_at: sessionData.expires_at,
      session_id: sessionData.session?.id || null
    });

  } catch (err) {
    console.error('[LEXIS Session Error]', err);
    res.status(500).json({ error: 'Internal server error initializing WebRTC session.' });
  }
});

/* ─────────────────────────────────────────────────────────────────────── */
/* 7. USAGE HEARTBEAT — client pings every 30s while a session is live    */
/* ─────────────────────────────────────────────────────────────────────── */
app.post('/api/heartbeat', heartbeatRateLimiter, authenticateAndCheckBilling, async (req, res) => {
  try {
    const HEARTBEAT_SECONDS = 30;
    const newSeconds = req.profile.seconds_used + HEARTBEAT_SECONDS;

    const updateData = { seconds_used: newSeconds };

    if (
      req.profile.subscription_status === 'free_trial' &&
      newSeconds >= req.profile.max_allowed_seconds
    ) {
      updateData.subscription_status = 'expired';
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', req.user.id);

    if (error) {
      console.error('[LEXIS Heartbeat] Supabase update failed:', error);
      return res.status(500).json({ error: 'Heartbeat log failed.' });
    }

    res.json({
      status: 'ack',
      seconds_used: newSeconds,
      subscription_status: updateData.subscription_status || req.profile.subscription_status
    });
  } catch (err) {
    console.error('[LEXIS Heartbeat Error]', err);
    res.status(500).json({ error: 'Heartbeat log failed.' });
  }
});

/* ─────────────────────────────────────────────────────────────────────── */
/* 8. HEALTH CHECK                                                        */
/* ─────────────────────────────────────────────────────────────────────── */
app.get('/health', (req, res) => {
  res.json({ status: 'Operational', system: 'LEXIS OS v2026.3', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  LEXIS Auth & Billing Broker active on port ${PORT}`);
  console.log(`  Allowed Origins: ${allowedOrigins.join(', ')}`);
  console.log(`  Stripe Webhook: ${stripe && STRIPE_WEBHOOK_SECRET ? 'configured' : 'NOT configured'}`);
  console.log(`=======================================================`);
});
