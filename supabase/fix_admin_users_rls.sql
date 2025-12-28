-- ==============================================================================
-- FIX: ALLOW ADMINS TO MANAGE USERS
-- Run this in Supabase SQL Editor.
-- This enables Admins to create and update user profiles, fixing the client-side fallback.
-- ==============================================================================

-- 1. Admins can UPDATE all users
-- This allows updating the profile after creation or editing existing users
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role_id = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role_id = 'admin')
  );

-- 2. Admins can INSERT all users
-- This allows creating the profile row if the trigger fails or during bulk imports
DROP POLICY IF EXISTS "Admins can insert all users" ON public.users;
CREATE POLICY "Admins can insert all users" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role_id = 'admin')
  );

-- 3. Admins can DELETE all users (optional, but good for management)
DROP POLICY IF EXISTS "Admins can delete all users" ON public.users;
CREATE POLICY "Admins can delete all users" ON public.users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role_id = 'admin')
  );
