-- LEXIS OS v2026.3 — SaaS schema (Supabase)
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New Query).
-- Idempotent-ish: safe to re-run individual sections after a partial failure,
-- but CREATE TABLE / CREATE TRIGGER will error if already applied — that's fine.

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────
-- Profiles table: one row per auth.users row, tracks plan + usage
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  subscription_status TEXT DEFAULT 'free_trial', -- 'free_trial', 'active', 'expired'
  subscription_tier TEXT DEFAULT 'free',          -- 'free', 'weekly', 'monthly'
  sessions_used INT DEFAULT 0,
  seconds_used INT DEFAULT 0,
  max_allowed_seconds INT DEFAULT 1800,           -- 30 min trial allowance
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS: users may read (and only read) their own profile. All writes in this
-- app happen server-side via the Supabase service-role key, which bypasses
-- RLS entirely, so no client-facing INSERT/UPDATE policy is defined here.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual read access" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────
-- Trigger: create a profile row automatically on signup
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────
-- RPC: atomic session counter increment, called from backend/server.mjs
-- (a plain "read profile, write count+1" from Node would race under
-- concurrent requests from the same user; this keeps the increment atomic
-- in the database).
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_sessions(user_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET sessions_used = sessions_used + 1
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Only the backend (service_role) calls this RPC, but lock it down anyway
-- since SECURITY DEFINER functions are otherwise callable by any signed-in
-- user via PostgREST.
REVOKE EXECUTE ON FUNCTION public.increment_sessions(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_sessions(UUID) TO service_role;
