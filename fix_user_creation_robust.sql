-- ==============================================================================
-- ROBUST USER CREATION TRIGGER
-- This script updates handle_new_auth_user to be more resilient by cleaning 
-- up orphaned records in public.users that might have the same email.
-- ==============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  default_role TEXT;
BEGIN
  -- 1. CRITICAL FIX: Delete any orphaned records with the same email but different ID.
  -- This prevents 500 errors and 409 Conflicts if a "zombie" profile exists.
  DELETE FROM public.users WHERE email = NEW.email AND id != NEW.id;

  -- 2. Determine default role based on domain (if any specific logic exists)
  -- Default to unverified for safety.
  IF (NEW.email LIKE '%@southwallsecurity.com') THEN
    default_role := 'employee';
  ELSE
    default_role := 'unverified';
  END IF;

  -- 3. Insert or Update the profile
  INSERT INTO public.users (id, name, email, role_id)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'), 
    NEW.email, 
    default_role
  )
  ON CONFLICT (id) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = now();
    
  RETURN NEW;
END;
$$;

COMMIT;
