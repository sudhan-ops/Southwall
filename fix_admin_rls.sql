-- ==============================================================================
-- COMPREHENSIVE ADMIN RLS OVERRIDES (V2)
-- This script ensures Admins, HR, and Operations Managers have full CRUD 
-- permissions (Insert, Update, Delete) for all management tables.
-- ==============================================================================

BEGIN;

-- Helper function to check if the current user is an admin/hr
-- This uses the existing get_my_role_id() if available, or defines a local check.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role_id IN ('admin', 'hr', 'operation_manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. NOTIFICATIONS
DROP POLICY IF EXISTS "Management full access to notifications" ON public.notifications;
CREATE POLICY "Management full access to notifications" ON public.notifications
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- 2. LEAVE REQUESTS
DROP POLICY IF EXISTS "Management full access to leave requests" ON public.leave_requests;
CREATE POLICY "Management full access to leave requests" ON public.leave_requests
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- 3. ONBOARDING SUBMISSIONS
DROP POLICY IF EXISTS "Management full access to submissions" ON public.onboarding_submissions;
CREATE POLICY "Management full access to submissions" ON public.onboarding_submissions
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- 4. SUPPORT TICKETS
DROP POLICY IF EXISTS "Management full access to tickets" ON public.support_tickets;
CREATE POLICY "Management full access to tickets" ON public.support_tickets
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role_id IN ('admin', 'hr', 'developer'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role_id IN ('admin', 'hr', 'developer'))
  );


-- 5. TASKS
DROP POLICY IF EXISTS "Management full access to tasks" ON public.tasks;
CREATE POLICY "Management full access to tasks" ON public.tasks
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- 6. ATTENDANCE & TRACKING
DROP POLICY IF EXISTS "Management full access to attendance_events" ON public.attendance_events;
CREATE POLICY "Management full access to attendance_events" ON public.attendance_events
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Management full access to user_locations" ON public.user_locations;
CREATE POLICY "Management full access to user_locations" ON public.user_locations
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Management full access to user_location_logs" ON public.user_location_logs;
CREATE POLICY "Management full access to user_location_logs" ON public.user_location_logs
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- 7. ACTIVITY & OTHERS
DROP POLICY IF EXISTS "Management full access to user_activity" ON public.user_activity;
CREATE POLICY "Management full access to user_activity" ON public.user_activity
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Management full access to invoices" ON public.invoices;
CREATE POLICY "Management full access to invoices" ON public.invoices
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

COMMIT;
