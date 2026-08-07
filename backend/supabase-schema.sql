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

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

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
