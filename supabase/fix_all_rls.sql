-- ==============================================================================
--  COMPREHENSIVE RLS FIX: ALL REMAINING TABLES
--  Run this in Supabase SQL Editor to fix all RLS issues at once
-- ==============================================================================

-- ============================================================================
-- 1. NOTIFICATIONS TABLE
-- ============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role has full access to notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to notifications" ON public.notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 2. SETTINGS TABLE (Global app settings - everyone can read)
-- ============================================================================
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read settings" ON public.settings;
DROP POLICY IF EXISTS "Service role has full access to settings" ON public.settings;

CREATE POLICY "Authenticated users can read settings" ON public.settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role has full access to settings" ON public.settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;
CREATE POLICY "Admins can update settings" ON public.settings
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role_id IN ('admin', 'hr'))
  );

-- ============================================================================
-- 3. ROLES TABLE (Everyone needs to read roles)
-- ============================================================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read roles" ON public.roles;
DROP POLICY IF EXISTS "Service role has full access to roles" ON public.roles;

CREATE POLICY "Anyone can read roles" ON public.roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role has full access to roles" ON public.roles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 4. TASKS TABLE
-- ============================================================================
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Service role has full access to tasks" ON public.tasks;

CREATE POLICY "Users can view assigned tasks" ON public.tasks
  FOR SELECT TO authenticated USING (
    auth.uid() = assigned_to_id 
    OR auth.uid() = created_by_id
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role_id IN ('admin', 'hr', 'operation_manager'))
  );

CREATE POLICY "Users can insert tasks" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update assigned tasks" ON public.tasks
  FOR UPDATE TO authenticated USING (
    auth.uid() = assigned_to_id 
    OR auth.uid() = created_by_id
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role_id IN ('admin', 'hr', 'operation_manager'))
  );

CREATE POLICY "Service role has full access to tasks" ON public.tasks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 5. LEAVE REQUESTS TABLE
-- ============================================================================
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can insert own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can update own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Managers can view team leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Service role has full access to leave_requests" ON public.leave_requests;

CREATE POLICY "Users can view own leave requests" ON public.leave_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leave requests" ON public.leave_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leave requests" ON public.leave_requests
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Managers can view team leave requests" ON public.leave_requests
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role_id IN ('admin', 'hr', 'operation_manager', 'site_manager'))
  );

CREATE POLICY "Service role has full access to leave_requests" ON public.leave_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 6. ONBOARDING SUBMISSIONS TABLE
-- ============================================================================
ALTER TABLE public.onboarding_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own submissions" ON public.onboarding_submissions;
DROP POLICY IF EXISTS "Users can insert own submissions" ON public.onboarding_submissions;
DROP POLICY IF EXISTS "Users can update own submissions" ON public.onboarding_submissions;
DROP POLICY IF EXISTS "HR can view all submissions" ON public.onboarding_submissions;
DROP POLICY IF EXISTS "Service role has full access to onboarding" ON public.onboarding_submissions;

CREATE POLICY "Users can view own submissions" ON public.onboarding_submissions
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = created_user_id);

CREATE POLICY "Users can insert own submissions" ON public.onboarding_submissions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update own submissions" ON public.onboarding_submissions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR auth.uid() = created_user_id);

CREATE POLICY "HR can view all submissions" ON public.onboarding_submissions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role_id IN ('admin', 'hr', 'operation_manager'))
  );

CREATE POLICY "Service role has full access to onboarding" ON public.onboarding_submissions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 7. HOLIDAYS TABLE
-- ============================================================================
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read holidays" ON public.holidays;
DROP POLICY IF EXISTS "Service role has full access to holidays" ON public.holidays;

CREATE POLICY "Authenticated users can read holidays" ON public.holidays
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role has full access to holidays" ON public.holidays
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 8. ORGANIZATIONS TABLE
-- ============================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read organizations" ON public.organizations;
DROP POLICY IF EXISTS "Service role has full access to organizations" ON public.organizations;

CREATE POLICY "Authenticated users can read organizations" ON public.organizations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role has full access to organizations" ON public.organizations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 9. SUPPORT TICKETS TABLE
-- ============================================================================
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can insert tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Service role has full access to tickets" ON public.support_tickets;

CREATE POLICY "Users can view own tickets" ON public.support_tickets
  FOR SELECT TO authenticated USING (auth.uid() = raised_by_id OR auth.uid() = assigned_to_id);

CREATE POLICY "Users can insert tickets" ON public.support_tickets
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update own tickets" ON public.support_tickets
  FOR UPDATE TO authenticated USING (auth.uid() = raised_by_id OR auth.uid() = assigned_to_id);

CREATE POLICY "Admins can view all tickets" ON public.support_tickets
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role_id IN ('admin', 'hr', 'developer'))
  );

CREATE POLICY "Service role has full access to tickets" ON public.support_tickets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 10. COMP OFF LOGS TABLE
-- ============================================================================
ALTER TABLE public.comp_off_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own comp off" ON public.comp_off_logs;
DROP POLICY IF EXISTS "Users can insert comp off" ON public.comp_off_logs;
DROP POLICY IF EXISTS "Managers can view all comp off" ON public.comp_off_logs;
DROP POLICY IF EXISTS "Service role has full access to comp_off" ON public.comp_off_logs;

CREATE POLICY "Users can view own comp off" ON public.comp_off_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert comp off" ON public.comp_off_logs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Managers can view all comp off" ON public.comp_off_logs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role_id IN ('admin', 'hr', 'operation_manager'))
  );

CREATE POLICY "Service role has full access to comp_off" ON public.comp_off_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- ALSO: Insert default settings if not exists and set approval_workflow_settings
-- ============================================================================
INSERT INTO public.settings (id, attendance_settings, enrollment_rules, approval_workflow_settings)
VALUES (
  'singleton',
  '{"office": {"enableAttendanceNotifications": true}, "field": {"enableAttendanceNotifications": true}}'::jsonb,
  '{}'::jsonb,
  '{"final_confirmation_role": "hr"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  approval_workflow_settings = COALESCE(public.settings.approval_workflow_settings, '{"final_confirmation_role": "hr"}'::jsonb);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT tablename, count(*) as policy_count 
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
