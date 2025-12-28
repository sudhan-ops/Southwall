-- ==============================================================================
-- COMPLETE USER CREATION FIX
-- This script fixes ALL issues preventing user creation:
-- 1. Updates trigger function to bypass RLS (SECURITY DEFINER)
-- 2. Grants Admin users permission to manage other users
-- 3. Ensures 'unverified' role exists
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- PART 1: Fix the trigger function to bypass RLS
-- ==============================================================================

-- The trigger MUST run with SECURITY DEFINER to bypass RLS policies
-- Otherwise, when RLS is enabled on public.users, the trigger fails
-- and causes the entire auth.users insert to rollback
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- This is CRITICAL - runs with function owner's privileges
SET search_path = public, auth  -- Security best practice
AS $$
BEGIN
  -- Insert new user profile with 'unverified' role
  INSERT INTO public.users (id, name, email, role_id)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'name', 
    NEW.email, 
    'unverified'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Ensure the trigger is properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE CONSTRAINT TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ==============================================================================
-- PART 2: Ensure 'unverified' role exists
-- ==============================================================================

-- Check if 'unverified' role exists, if not create it
INSERT INTO public.roles (id, display_name)
VALUES ('unverified', 'Unverified')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- PART 3: Grant Admin users permission to manage other users
-- ==============================================================================

-- These policies allow Admins to create, update, and delete users
-- This fixes the client-side fallback when the Edge Function fails

DROP POLICY IF EXISTS "Admins can insert all users" ON public.users;
CREATE POLICY "Admins can insert all users" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role_id = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role_id = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role_id = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete all users" ON public.users;
CREATE POLICY "Admins can delete all users" ON public.users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role_id = 'admin'
    )
  );

COMMIT;

-- ==============================================================================
-- VERIFICATION QUERIES (Run these separately after executing the above)
-- ==============================================================================

-- Verify trigger function has SECURITY DEFINER
-- SELECT proname, prosecdef 
-- FROM pg_proc 
-- WHERE proname = 'handle_new_auth_user';
-- Expected: prosecdef = true

-- Verify trigger is attached
-- SELECT tgname, tgtype, tgenabled 
-- FROM pg_trigger 
-- WHERE tgname = 'on_auth_user_created';

-- Verify 'unverified' role exists
-- SELECT * FROM public.roles WHERE id = 'unverified';

-- Verify RLS policies
-- SELECT policyname, cmd, roles
-- FROM pg_policies 
-- WHERE tablename = 'users' AND policyname LIKE '%Admin%';
