-- ==============================================================================
--  ENABLE RLS ON REMAINING TABLES
--  Run this to enable RLS on the 15 tables that are still showing as unrestricted
-- ==============================================================================

-- Tables from the verification query that still have rls_enabled: false
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

-- Verify all tables now have RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;

-- This query should return 0 rows if all tables have RLS enabled
