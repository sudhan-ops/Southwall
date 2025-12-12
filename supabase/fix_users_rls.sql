-- ==============================================================================
--  FIX: USERS TABLE RLS POLICIES
--  Run this in Supabase SQL Editor to allow authenticated users to access the users table
--  This fixes the "Login successful, but failed to retrieve user profile" error
-- ==============================================================================

-- First, ensure RLS is enabled on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to prevent duplicates)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON public.users;
DROP POLICY IF EXISTS "Service role has full access to users" ON public.users;

-- 1. Allow users to view their own profile (SELECT)
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. Allow users to insert their own profile (INSERT)
--    This is needed for auto-creation of profile on first login
CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3. Allow users to update their own profile (UPDATE)
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Allow authenticated users to view all users (needed for managers, approvals, etc.)
--    This is a common pattern in business apps where users need to see other users' names
CREATE POLICY "Authenticated users can view all users" ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- 5. Service role can do anything (for backend/edge functions)
CREATE POLICY "Service role has full access to users" ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
--  VERIFICATION: Run this query to confirm policies were created
-- ==============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'users';
