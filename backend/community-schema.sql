-- LEXIS Community data model
-- Apply after backend/supabase-schema.sql.
-- All public Community telemetry is derived from these tables with the
-- backend service-role client. No client-facing write policies are created.

CREATE TABLE IF NOT EXISTS public.community_partner_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_name TEXT NOT NULL,
  organization_type TEXT NOT NULL CHECK (organization_type IN ('school', 'nonprofit', 'youth_center')),
  location_region TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  overview TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'reviewing', 'approved', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS community_partner_applications_status_idx
  ON public.community_partner_applications(status);
CREATE INDEX IF NOT EXISTS community_partner_applications_created_at_idx
  ON public.community_partner_applications(created_at DESC);

CREATE TABLE IF NOT EXISTS public.community_partners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_name TEXT NOT NULL,
  organization_type TEXT NOT NULL CHECK (organization_type IN ('school', 'nonprofit', 'youth_center')),
  location_region TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS community_partners_status_idx
  ON public.community_partners(status);

CREATE TABLE IF NOT EXISTS public.community_contributions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  amount_thb NUMERIC(12, 2) NOT NULL CHECK (amount_thb > 0),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('week', 'month')),
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('pending', 'confirmed', 'refunded', 'cancelled')),
  stripe_subscription_id TEXT,
  stripe_checkout_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS community_contributions_checkout_session_uidx
  ON public.community_contributions(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS community_contributions_status_idx
  ON public.community_contributions(status);

CREATE TABLE IF NOT EXISTS public.community_deployments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  partner_id UUID REFERENCES public.community_partners(id) ON DELETE SET NULL,
  students_supported INT NOT NULL DEFAULT 0 CHECK (students_supported >= 0),
  practice_hours NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (practice_hours >= 0),
  funds_deployed_thb NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (funds_deployed_thb >= 0),
  notes TEXT,
  deployed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS community_deployments_partner_id_idx
  ON public.community_deployments(partner_id);
CREATE INDEX IF NOT EXISTS community_deployments_deployed_at_idx
  ON public.community_deployments(deployed_at DESC);

ALTER TABLE public.community_partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_deployments ENABLE ROW LEVEL SECURITY;

-- Service-role only. The browser never writes these tables directly.
REVOKE ALL ON TABLE public.community_partner_applications FROM anon, authenticated;
REVOKE ALL ON TABLE public.community_partners FROM anon, authenticated;
REVOKE ALL ON TABLE public.community_contributions FROM anon, authenticated;
REVOKE ALL ON TABLE public.community_deployments FROM anon, authenticated;
