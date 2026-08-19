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
  max_allowed_seconds INT NOT NULL DEFAULT 1800, -- 30 Minutes Free Trial Total
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
    1800
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
CREATE OR REPLACE FUNCTION public.record_heartbeat(user_id_param UUID, increment_seconds INT)
RETURNS TABLE(new_seconds_used INT, current_status TEXT) AS $$
DECLARE
  v_seconds INT;
  v_max_seconds INT;
  v_status TEXT;
BEGIN
  -- Per-heartbeat telemetry row (usage_logs was otherwise write-only-in-name —
  -- defined with a SELECT policy but nothing ever inserted into it).
  INSERT INTO public.usage_logs (user_id, duration_seconds)
  VALUES (user_id_param, increment_seconds);

  UPDATE public.profiles
  SET
    seconds_used = seconds_used + increment_seconds,
    updated_at = timezone('utc'::text, now())
  WHERE id = user_id_param
  RETURNING seconds_used, max_allowed_seconds, subscription_status INTO v_seconds, v_max_seconds, v_status;

  -- Auto-expire free trial if 30-minute ceiling reached
  IF v_status = 'free_trial' AND v_seconds >= v_max_seconds THEN
    UPDATE public.profiles
    SET subscription_status = 'expired'
    WHERE id = user_id_param;
    v_status := 'expired';
  END IF;

  RETURN QUERY SELECT v_seconds, v_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- These SECURITY DEFINER functions are only ever called by the backend with
-- the service_role key, but PostgREST exposes them to any signed-in user by
-- default unless revoked — lock them down.
REVOKE EXECUTE ON FUNCTION public.increment_sessions(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_sessions(UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION public.record_heartbeat(UUID, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_heartbeat(UUID, INT) TO service_role;

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
-- then run sections 3-8 above (usage_logs table, RLS, trigger, RPCs).
-- ============================================================================
