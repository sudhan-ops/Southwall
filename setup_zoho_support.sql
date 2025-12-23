-- ==============================================================================
-- ZOHO MAIL SUPPORT & AUTO-VERIFICATION
-- Automatically verifies and sets roles for users signing up with Zoho Mail.
-- ==============================================================================

BEGIN;

-- 1. Create a function to auto-verify Zoho users in auth.users
-- This function needs SECURITY DEFINER to modify the auth schema.
CREATE OR REPLACE FUNCTION public.auto_verify_zoho_users()
RETURNS TRIGGER SECURITY DEFINER AS $$
BEGIN
  -- Check if the email is from Zoho or the organization domain
  IF (NEW.email LIKE '%@zoho.com' OR 
      NEW.email LIKE '%@zoho.in' OR 
      NEW.email LIKE '%@southwallsecurity.com') THEN
    
    -- Force confirm the email in auth.users
    UPDATE auth.users 
    SET email_confirmed_at = now(),
        confirmed_at = now(),
        last_sign_in_at = now()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach the auto-verify trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_verify ON auth.users;
CREATE TRIGGER on_auth_user_created_verify
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.auto_verify_zoho_users();


-- 3. Update handle_new_auth_user to assign 'employee' role to Zoho users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  default_role TEXT;
BEGIN
  -- Determine default role
  IF (NEW.email LIKE '%@zoho.com' OR 
      NEW.email LIKE '%@zoho.in' OR 
      NEW.email LIKE '%@southwallsecurity.com') THEN
    default_role := 'employee';
  ELSE
    default_role := 'unverified';
  END IF;

  INSERT INTO public.users (id, name, email, role_id)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'), 
    NEW.email, 
    default_role
  )
  ON CONFLICT (id) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    name = EXCLUDED.name;
    
  RETURN NEW;
END;
$$;

COMMIT;
