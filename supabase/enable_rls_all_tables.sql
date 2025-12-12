-- ==============================================================================
--  ENABLE RLS ON ALL TABLES
--  Run this to enable Row Level Security on all public tables
-- ==============================================================================

-- Enable RLS on all existing tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_modules ENABLE ROW LEVEL SECURITY;

-- Enable RLS on new tables from edge functions
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.validation_rules ENABLE ROW LEVEL SECURITY;

-- If you have any other custom tables, add them here:
-- ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS public.entities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS public.extra_work_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS public.comp_off_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS public.leave_requests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS public.insurances ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
