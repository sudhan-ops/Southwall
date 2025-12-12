-- ==============================================================================
--  FIX: ATTENDANCE_EVENTS TABLE RLS POLICIES
--  Run this in Supabase SQL Editor to allow attendance check-in/check-out
--  This fixes the "new row violates row-level security policy" error
-- ==============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.attendance_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own attendance" ON public.attendance_events;
DROP POLICY IF EXISTS "Users can insert their own attendance" ON public.attendance_events;
DROP POLICY IF EXISTS "Users can update their own attendance" ON public.attendance_events;
DROP POLICY IF EXISTS "Managers can view team attendance" ON public.attendance_events;
DROP POLICY IF EXISTS "Service role has full access to attendance" ON public.attendance_events;

-- 1. Users can view their own attendance
CREATE POLICY "Users can view their own attendance" ON public.attendance_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Users can insert their own attendance (for check-in/check-out)
CREATE POLICY "Users can insert their own attendance" ON public.attendance_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own attendance
CREATE POLICY "Users can update their own attendance" ON public.attendance_events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Managers/HR/Admin can view all attendance (for reporting)
CREATE POLICY "Managers can view team attendance" ON public.attendance_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role_id IN ('admin', 'hr', 'operation_manager', 'site_manager', 'field_officer')
    )
  );

-- 5. Service role has full access
CREATE POLICY "Service role has full access to attendance" ON public.attendance_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
--  ALSO FIX: LOCATIONS TABLE (needed for geofencing during check-in)
-- ==============================================================================

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated users can create locations" ON public.locations;
DROP POLICY IF EXISTS "Service role has full access to locations" ON public.locations;

CREATE POLICY "Authenticated users can view locations" ON public.locations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create locations" ON public.locations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Service role has full access to locations" ON public.locations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ==============================================================================
--  ALSO FIX: USER_LOCATIONS TABLE (needed for geofencing)
-- ==============================================================================

ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their location assignments" ON public.user_locations;
DROP POLICY IF EXISTS "Users can create location assignments" ON public.user_locations;
DROP POLICY IF EXISTS "Service role has full access to user_locations" ON public.user_locations;

CREATE POLICY "Users can view their location assignments" ON public.user_locations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create location assignments" ON public.user_locations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role has full access to user_locations" ON public.user_locations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ==============================================================================
--  VERIFICATION
-- ==============================================================================
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('attendance_events', 'locations', 'user_locations')
ORDER BY tablename, policyname;
