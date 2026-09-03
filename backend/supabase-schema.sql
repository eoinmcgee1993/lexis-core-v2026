-- ============================================================================
-- LEXIS OS COMMERCE EDITION — RECONCILED DATABASE SCHEMA
-- Target Database: Supabase PostgreSQL (Singapore Region: ap-southeast-1)
-- Run in Supabase SQL Editor. Supersedes the earlier supabase/schema.sql —
-- if you already ran that version, see the migration note at the bottom.
-- ============================================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'free_trial'
    CHECK (subscription_status IN ('free_trial', 'active', 'past_due', 'canceled', 'expired')),
  subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'weekly', 'monthly')),
  sessions_count INT NOT NULL DEFAULT 0,
  seconds_used INT NOT NULL DEFAULT 0,
  max_allowed_seconds INT NOT NULL DEFAULT 900, -- 15 Minutes Free Trial Total
  -- Fair-use accounting for paying subscribers, per billing period.
  -- Deliberately separate from seconds_used: that column is the trial's
  -- lifetime counter and is what WelcomeStage renders as "left in trial",
  -- so resetting it every period would corrupt both the trial semantics
  -- and the lifetime usage record.
  period_seconds_used INT NOT NULL DEFAULT 0,
  period_started_at TIMESTAMPTZ,
  -- When a one-off pass stops granting access. NULL means this row's
  -- access is not a pass: either it has never been paid for, or it is one
  -- of the recurring subscriptions sold before 2 Sep 2026, whose liveness
  -- Stripe reports through customer.subscription.* webhooks instead. A
  -- pass has no such events — nothing tells us a one-time charge got old
  -- — so the expiry has to be written down at purchase and checked on
  -- every request (paidAccessActive in backend/app.mjs).
  access_expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Usage Telemetry Log Table
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  duration_seconds INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- record_heartbeat (below) inserts here on every 30s tick — index the FK so
-- that doesn't degrade as usage_logs grows.
CREATE INDEX IF NOT EXISTS usage_logs_user_id_idx ON public.usage_logs(user_id);

-- 3b. Session History — past-session feedback summaries, viewable in-app
-- (frontend/src/components/stages/HistoryStage.jsx). Deliberately stores
-- only the FEEDBACK RESULT (confidence/strengths/improvements), never the
-- raw transcript — smaller footprint, and avoids retaining a full log of
-- everything a student said. Written only by POST /api/feedback, right
-- after it computes a result for a session that actually connected (see
-- LexisApp.jsx's wasConnectedRef for when that endpoint gets called at all).
CREATE TABLE IF NOT EXISTS public.session_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('en', 'th')),
  topic TEXT, -- 'everyday' | 'work' | 'travel' | NULL ("Just Talk")
  -- insufficient=true for a real session too short to grade honestly (see
  -- MIN_FEEDBACK_WORDS/MIN_FEEDBACK_TURNS in backend/app.mjs) — confidence
  -- and the two JSONB arrays stay empty/null in that case rather than
  -- faking a score, same honesty standard as the live feedback endpoint.
  insufficient BOOLEAN NOT NULL DEFAULT false,
  confidence INT CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 100)),
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  improvements JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Every read is "give me this user's history, newest first" — composite
-- index matches that access pattern directly.
CREATE INDEX IF NOT EXISTS session_history_user_id_created_at_idx
  ON public.session_history(user_id, created_at DESC);

-- 3c. Analytics Events — first-party, privacy-respecting event log (no
-- third-party tracker, no cookies, no PII beyond an anonymous per-browser-
-- session id and, for authenticated events, the user's own id). Written
-- only via POST /api/analytics/event (rate-limited, allowlisted event
-- names — see backend/app.mjs's ANALYTICS_EVENTS) using the backend's
-- service-role key — same "client never writes directly" shape as
-- usage_logs/session_history above, so no INSERT policy is needed either.
-- No SELECT policy: queried directly via the SQL editor for your own
-- reporting, not read back into the app for any user.
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_name TEXT NOT NULL,
  path TEXT,
  lang TEXT,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS analytics_events_event_name_created_at_idx
  ON public.analytics_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_session_id_idx
  ON public.analytics_events(session_id);

-- 3d. Error Logs — backend error monitoring, no third-party service
-- (Sentry etc.). Written by backend/app.mjs's logError() helper, called
-- from each route handler's own outer catch block — every route already
-- catches its own errors and responds directly rather than calling
-- next(err), so this is the actual visibility layer, not the Express
-- error-handling middleware (which only ever sees CorsOriginError in
-- practice). Same zero-client-access shape as analytics_events below.
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  context TEXT NOT NULL,
  message TEXT,
  stack TEXT,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS error_logs_created_at_idx
  ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS error_logs_context_idx
  ON public.error_logs(context);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
-- No policies for analytics_events or error_logs — RLS enabled with zero
-- policies means even authenticated/anon clients get nothing at all;
-- only the backend's service-role key (which bypasses RLS) can read or
-- write either table.

-- 5. RLS Policies
-- auth.uid() is wrapped in a scalar subquery — (select auth.uid()) — per
-- Supabase's own RLS performance guidance: written bare, it gets
-- re-evaluated on every row scanned instead of once per query.
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING ((select auth.uid()) = id);

-- No client-facing UPDATE policy on profiles, intentionally. A USING-only
-- UPDATE policy (auth.uid() = id, no WITH CHECK) lets a signed-in user PATCH
-- their own row directly via Supabase's REST API — bypassing this backend
-- entirely — to any column, including subscription_status/seconds_used. That
-- means "PATCH /rest/v1/profiles?id=eq.<self> {subscription_status:'active'}"
-- with nothing but their own anon-signed JWT grants free unlimited access.
-- Nothing in this app performs a client-side profile update (the frontend
-- only ever SELECTs; every write — checkout activation, heartbeat
-- accounting — goes through the backend's service-role key, which bypasses
-- RLS anyway), so there is no legitimate write path this omission breaks.
DROP POLICY IF EXISTS "Users can update own non-billing profile data" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own usage logs" ON public.usage_logs;
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
  FOR SELECT USING ((select auth.uid()) = user_id);

-- Same read-only-for-clients shape as usage_logs — the client never
-- writes this table directly, only the backend via the service-role key
-- (which bypasses RLS entirely), so there's no INSERT/UPDATE policy to
-- define, only SELECT.
DROP POLICY IF EXISTS "Users can read own session history" ON public.session_history;
CREATE POLICY "Users can read own session history" ON public.session_history
  FOR SELECT USING ((select auth.uid()) = user_id);

-- 6. Trigger: Auto-Create Profile on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, subscription_status, subscription_tier, max_allowed_seconds)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Thai Youth Learner'),
    'free_trial',
    'free',
    900
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- handle_new_user() is a TRIGGER function — only ever meant to run
-- implicitly via the trigger above — but PostgREST still exposes any
-- SECURITY DEFINER function as a callable RPC (/rest/v1/rpc/handle_new_user)
-- to anon/authenticated by default. A direct call would error out (trigger
-- functions require a real trigger context to populate NEW/OLD) but there's
-- no reason to leave the endpoint reachable at all. Revoking EXECUTE here
-- does not stop the trigger itself from firing — trigger invocation isn't
-- subject to the caller's EXECUTE grant the way a direct RPC call is.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 7. Stored Procedure: Atomic Session Counter
CREATE OR REPLACE FUNCTION public.increment_sessions(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET
    sessions_count = sessions_count + 1,
    updated_at = timezone('utc'::text, now())
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Stored Procedure: Record Telemetry Heartbeat & Enforce Trial Cutoff
-- The return type changed when the fair-use window was added, and
-- Postgres will not let CREATE OR REPLACE change a return type.
DROP FUNCTION IF EXISTS public.record_heartbeat(UUID, INT);

CREATE FUNCTION public.record_heartbeat(user_id_param UUID, increment_seconds INT)
RETURNS TABLE(new_seconds_used INT, current_status TEXT, period_seconds INT) AS $$
DECLARE
  v_seconds INT;
  v_max_seconds INT;
  v_status TEXT;
  v_tier TEXT;
  v_period_start TIMESTAMPTZ;
  v_period_seconds INT;
  v_window INTERVAL;
BEGIN
  -- Per-heartbeat telemetry row (usage_logs was otherwise write-only-in-name —
  -- defined with a SELECT policy but nothing ever inserted into it).
  INSERT INTO public.usage_logs (user_id, duration_seconds)
  VALUES (user_id_param, increment_seconds);

  SELECT subscription_status, subscription_tier, period_started_at
    INTO v_status, v_tier, v_period_start
  FROM public.profiles WHERE id = user_id_param;

  -- 30 days, not INTERVAL '1 month', so this matches PERIOD_DAYS in
  -- backend/app.mjs exactly. A calendar month here and a fixed 30 days
  -- there would disagree by up to a day at the boundary, and a user could
  -- be blocked by one while the other had already rolled their window.
  v_window := CASE WHEN v_tier = 'monthly' THEN INTERVAL '30 days' ELSE INTERVAL '7 days' END;

  -- Roll the fair-use window forward when it has elapsed. Deliberately
  -- time-based and self-healing rather than reset by a Stripe invoice
  -- webhook: if that webhook were ever not enabled in the dashboard, a
  -- webhook-driven reset would silently cap every paying subscriber
  -- forever after their first period. This cannot fail that way.
  IF v_status = 'active' AND (v_period_start IS NULL OR now() - v_period_start >= v_window) THEN
    UPDATE public.profiles
    SET period_seconds_used = 0,
        -- Advance by WHOLE windows rather than re-anchoring to now(). Setting
        -- it to now() would move the period boundary later every time a
        -- subscriber came back after a gap, drifting away from the fixed
        -- Stripe billing anchor it is supposed to track — so someone who
        -- paid on the 1st could still be blocked on the 4th while the error
        -- told them it "resets at the start of your next billing period".
        period_started_at = CASE
          WHEN v_period_start IS NULL THEN now()
          ELSE v_period_start + (
            floor(extract(epoch FROM (now() - v_period_start))
                  / extract(epoch FROM v_window))::int * v_window
          )
        END
    WHERE id = user_id_param;
  END IF;

  UPDATE public.profiles
  SET
    seconds_used = seconds_used + increment_seconds,
    period_seconds_used = period_seconds_used + increment_seconds,
    updated_at = timezone('utc'::text, now())
  WHERE id = user_id_param
  RETURNING seconds_used, max_allowed_seconds, subscription_status, period_seconds_used
  INTO v_seconds, v_max_seconds, v_status, v_period_seconds;

  -- Auto-expire free trial at its ceiling
  IF v_status = 'free_trial' AND v_seconds >= v_max_seconds THEN
    UPDATE public.profiles
    SET subscription_status = 'expired'
    WHERE id = user_id_param;
    v_status := 'expired';
  END IF;

  RETURN QUERY SELECT v_seconds, v_status, v_period_seconds;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Every Checkout Session that has already been turned into a pass.
--
-- This is a set, not a "most recent" marker, and that distinction is the
-- whole point. The first version of this kept one last_checkout_session_id
-- on the profile, which only rejects a duplicate that arrives immediately
-- after the original. Stripe offers no such ordering guarantee, and the
-- delayed-payment flow makes the bad interleaving ordinary rather than
-- exotic: session A completes, session B is bought and redeemed, and then
-- A's async_payment_succeeded finally lands. Against a single slot A no
-- longer matches B, so it is granted a second time — one payment, two
-- passes. A primary key on the session id cannot be fooled by ordering.
CREATE TABLE IF NOT EXISTS public.redeemed_checkout_sessions (
  session_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
-- RLS on with no policies at all: the backend reaches this through
-- redeem_pass with the service_role key (which bypasses RLS), and nothing
-- else has any business reading which sessions have been redeemed.
ALTER TABLE public.redeemed_checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Redeem a paid Stripe Checkout Session into a pass.
--
-- All of it in one statement under a row lock, rather than a read followed
-- by a write from the webhook handler, for three reasons that each cost
-- real money if got wrong:
--
--   * Idempotency. Stripe guarantees at-least-once webhook delivery, and a
--     PromptPay purchase can arrive as both checkout.session.completed and
--     checkout.session.async_payment_succeeded. The INSERT below is what
--     decides: it either claims the session id or loses the race, so one
--     paid session grants exactly one pass however often we are told.
--   * Stacking. Buying again while a pass is still running extends it from
--     the later of now and the current expiry, so nobody loses the days
--     they already paid for by renewing early.
--   * No silent downgrade. A monthly holder who adds a weekly pass keeps
--     the monthly tier. Tier is not a label here — it picks the fair-use
--     ceiling and the accounting window (FAIR_USE_MINUTES / PERIOD_DAYS in
--     backend/app.mjs), so overwriting it would have cut a monthly
--     subscriber from 450 minutes to 150 for a month they had paid for,
--     as a consequence of spending MORE money.
--
-- The fair-use window is re-anchored to now() on every redemption, so each
-- pass carries its own quota of minutes. Someone who has hit this period's
-- ceiling and buys another pass has paid twice for those minutes — that is
-- the intended outcome, not a loophole.
CREATE OR REPLACE FUNCTION public.redeem_pass(
  p_user_id UUID,
  p_tier TEXT,
  p_days INT,
  p_session_id TEXT,
  p_customer_id TEXT
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_expires TIMESTAMPTZ;
  v_tier TEXT;
  v_claimed INT;
BEGIN
  SELECT access_expires_at, subscription_tier
    INTO v_expires, v_tier
  FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.redeemed_checkout_sessions (session_id, user_id)
  VALUES (p_session_id, p_user_id)
  ON CONFLICT (session_id) DO NOTHING;
  GET DIAGNOSTICS v_claimed = ROW_COUNT;

  -- Someone already redeemed this session. Return the expiry that redemption
  -- produced, so a retry reads as success rather than as a failure worth
  -- retrying again.
  IF v_claimed = 0 THEN
    RETURN v_expires;
  END IF;

  -- Keep the longer tier while a pass is still live; see the header.
  IF NOT (v_expires IS NOT NULL AND v_expires > now() AND v_tier = 'monthly') THEN
    v_tier := p_tier;
  END IF;

  v_expires := GREATEST(COALESCE(v_expires, now()), now()) + (p_days || ' days')::INTERVAL;

  UPDATE public.profiles
  SET subscription_status = 'active',
      subscription_tier = v_tier,
      stripe_customer_id = COALESCE(p_customer_id, stripe_customer_id),
      access_expires_at = v_expires,
      period_seconds_used = 0,
      period_started_at = now(),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_user_id;

  RETURN v_expires;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- These SECURITY DEFINER functions are only ever called by the backend with
-- the service_role key, but PostgREST exposes them to any signed-in user by
-- default unless revoked — lock them down.
REVOKE EXECUTE ON FUNCTION public.increment_sessions(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_sessions(UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION public.record_heartbeat(UUID, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_heartbeat(UUID, INT) TO service_role;
-- redeem_pass grants paid access, so an exposed EXECUTE would be a free
-- unlimited pass for anyone with a signed-in session.
REVOKE EXECUTE ON FUNCTION public.redeem_pass(UUID, TEXT, INT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_pass(UUID, TEXT, INT, TEXT, TEXT) TO service_role;

-- ============================================================================
-- Migrating from the earlier supabase/schema.sql (sessions_used, no
-- usage_logs/stripe_subscription_id/past_due/canceled)? Run this once:
--
--   ALTER TABLE public.profiles RENAME COLUMN sessions_used TO sessions_count;
--   ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
--   ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE
--     DEFAULT timezone('utc'::text, now()) NOT NULL;
--   ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
--   ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_status_check
--     CHECK (subscription_status IN ('free_trial', 'active', 'past_due', 'canceled', 'expired'));
--   ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
--   ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_tier_check
--     CHECK (subscription_tier IN ('free', 'weekly', 'monthly'));
--
--   -- Fair-use accounting (29 Aug 2026). REQUIRED before section 8's
--   -- record_heartbeat is (re)created: CREATE TABLE IF NOT EXISTS is a no-op
--   -- on an existing database, so the two columns declared up in section 1
--   -- are NOT added by re-running this file — but the DROP/CREATE FUNCTION
--   -- below runs regardless. plpgsql resolves column names at execution,
--   -- not at definition, so the SQL Editor would report success and then
--   -- every /api/heartbeat would 500 and all usage accounting (trial
--   -- expiry included) would silently stop.
--   ALTER TABLE public.profiles
--     ADD COLUMN IF NOT EXISTS period_seconds_used INT NOT NULL DEFAULT 0,
--     ADD COLUMN IF NOT EXISTS period_started_at TIMESTAMPTZ;
--   -- New signups get 15 minutes; existing rows keep the 1800 they have.
--   ALTER TABLE public.profiles ALTER COLUMN max_allowed_seconds SET DEFAULT 900;
--
--   -- One-off passes (2 Sep 2026). Same trap as the fair-use columns
--   -- above: CREATE TABLE IF NOT EXISTS will not add these to an existing
--   -- database, but redeem_pass below is created regardless and resolves
--   -- its column names at execution — so without this every purchase
--   -- webhook would 500 AFTER Stripe had taken the money.
--   ALTER TABLE public.profiles
--     ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ;
--   -- Redemption bookkeeping moved out of profiles.last_checkout_session_id
--   -- into its own table the same day; drop the column if you ran the
--   -- first version of this migration. Nothing reads it.
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS last_checkout_session_id;
--
-- then run sections 3-8 above (usage_logs table, RLS, trigger, RPCs).
-- ============================================================================
