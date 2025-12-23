-- ==============================================================================
-- FIX FOR SIGNUP 500 ERROR (ZOHO SUPPORT REFINE)
-- This script fixes the transaction conflict caused by the previous triggers.
-- ==============================================================================

BEGIN;

-- 1. Remove the problematic AFTER INSERT trigger (it causes conflicts)
DROP TRIGGER IF EXISTS on_auth_user_created_verify ON auth.users;

-- 2. Create/Update the auto-verify function to work BEFORE INSERT
-- This way we modify the record before it's saved, avoiding an extra UPDATE statement.
CREATE OR REPLACE FUNCTION public.auto_verify_zoho_users()
RETURNS TRIGGER SECURITY DEFINER AS $$
BEGIN
  -- Logic: If Zoho or Org domain, mark as confirmed immediately.
  IF (NEW.email LIKE '%@zoho.com' OR 
      NEW.email LIKE '%@zoho.in' OR 
      NEW.email LIKE '%@southwallsecurity.com') THEN
    
    NEW.email_confirmed_at := now();
    NEW.confirmed_at := now();
    -- We can also set some metadata if needed
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach as BEFORE INSERT trigger (The safe way to auto-confirm)
DROP TRIGGER IF EXISTS on_auth_user_created_verify_before ON auth.users;
CREATE TRIGGER on_auth_user_created_verify_before
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.auto_verify_zoho_users();


-- 4. Refine handle_new_auth_user for efficiency and safety
-- We add 'SET search_path = public' to prevent schema resolution errors.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  default_role TEXT;
BEGIN
  -- Determine default role based on domain
  IF (NEW.email LIKE '%@zoho.com' OR 
      NEW.email LIKE '%@zoho.in' OR 
      NEW.email LIKE '%@southwallsecurity.com') THEN
    default_role := 'employee';
  ELSE
    default_role := 'unverified';
  END IF;

  -- Insert into our public.users table
  -- We use ON CONFLICT to avoid 500 errors if a profile accidentally exists.
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

-- Ensure the triggers are in the correct sequence
-- handle_new_auth_user should stay as AFTER INSERT since it needs the auth user record to exist.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

COMMIT;
