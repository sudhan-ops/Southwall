-- ==============================================================================
--  COMPLETE SUPABASE SETUP - RUN THESE IN ORDER
--  Copy each section and run in Supabase SQL Editor
-- ==============================================================================

-- ============================================================================
-- 1. MAIN SCHEMA (Core tables, functions, triggers, RLS policies)
-- ============================================================================
-- File: supabase/manual_full_schema.sql
-- Status: ✅ You should have run this already
-- This creates all the core tables like users, roles, notifications, etc.


-- ============================================================================
-- 2. ENABLE RLS ON REMAINING TABLES
-- ============================================================================
-- File: supabase/enable_rls_remaining.sql
-- Status: ⚠️ RUN THIS IF NOT DONE YET

ALTER TABLE public.location_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_gents_uniform_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_ladies_uniform_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_staff_designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_uniform_details_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uniform_requests ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 3. INVOICE DEPENDENCIES (for generate-invoice & invoices functions)
-- ============================================================================
-- File: supabase/invoice_dependencies.sql
-- Status: ⚠️ RUN THIS

-- Add missing columns to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS period_start date,
ADD COLUMN IF NOT EXISTS period_end date;

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);


-- ============================================================================
-- 4. USER ACTIVITY TABLE (for send-welcome-email function)
-- ============================================================================
-- File: supabase/welcome_email_dependencies.sql
-- Status: ⚠️ RUN THIS

CREATE TABLE IF NOT EXISTS public.user_activity (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES public.users(id),
  event_type text NOT NULL,
  details jsonb NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_activity_pkey PRIMARY KEY (id)
);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service Role Access User Activity" ON public.user_activity;
CREATE POLICY "Service Role Access User Activity" ON public.user_activity
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================================
-- 5. SUBMIT ATTENDANCE DEPENDENCIES (profiles & attendance tables)
-- ============================================================================
-- File: supabase/submit_attendance_dependencies.sql
-- Status: ⚠️ RUN THIS

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_uid uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_auth_uid_key UNIQUE (auth_uid)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service Role Access Profiles" ON public.profiles;
CREATE POLICY "Service Role Access Profiles" ON public.profiles
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (auth_uid)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Backfill existing users
INSERT INTO public.profiles (auth_uid)
SELECT id FROM auth.users
ON CONFLICT DO NOTHING;

-- Attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id text NOT NULL,
  profile_id uuid NOT NULL REFERENCES public.profiles(id),
  checkin_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT attendance_pkey PRIMARY KEY (id)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service Role Access Attendance" ON public.attendance;
CREATE POLICY "Service Role Access Attendance" ON public.attendance
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================================================
-- 6. VALIDATION RULES (for validate-submission function)
-- ============================================================================
-- File: supabase/validate_submission_dependencies.sql
-- Status: ⚠️ RUN THIS

CREATE TABLE IF NOT EXISTS public.validation_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  submission_type text NOT NULL,
  schema jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT validation_rules_pkey PRIMARY KEY (id),
  CONSTRAINT validation_rules_submission_type_key UNIQUE (submission_type)
);

ALTER TABLE public.validation_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service Role Access Validation Rules" ON public.validation_rules;
CREATE POLICY "Service Role Access Validation Rules" ON public.validation_rules
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can read rules" ON public.validation_rules;
CREATE POLICY "Authenticated users can read rules" ON public.validation_rules
  FOR SELECT TO authenticated USING (true);

-- Sample validation rule
INSERT INTO public.validation_rules (submission_type, schema)
VALUES (
  'attendance_submission',
  '{
    "type": "object",
    "properties": {
      "site_id": { "type": "string" },
      "profile_id": { "type": "string" }
    },
    "required": ["site_id", "profile_id"],
    "additionalProperties": false
  }'::jsonb
)
ON CONFLICT (submission_type) DO UPDATE
SET schema = EXCLUDED.schema;


-- ============================================================================
-- 7. VERIFY EVERYTHING
-- ============================================================================

-- Check that all tables have RLS enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;
-- This should return 0 rows

-- Verify roles exist
SELECT * FROM public.roles ORDER BY display_name;
-- Should show: admin, developer, field_officer, field_staff, finance, hr, operation_manager, site_manager, unverified

-- Done! Your Supabase backend is fully configured.
