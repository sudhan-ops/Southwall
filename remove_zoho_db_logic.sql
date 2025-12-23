-- ==============================================================================
-- REMOVE ZOHO DATABASE LOGIC
-- Reverts auto-verification and auto-role assignment for Zoho domains.
-- Keeps logic for @southwallsecurity.com.
-- ==============================================================================

BEGIN;

-- 1. Update auto-verify function to exclude Zoho
CREATE OR REPLACE FUNCTION public.auto_verify_zoho_users()
RETURNS TRIGGER SECURITY DEFINER AS $$
BEGIN
  -- Logic: ONLY auto-confirm organization domain.
  -- Zoho is no longer special-cased.
  IF (NEW.email LIKE '%@southwallsecurity.com') THEN
    NEW.email_confirmed_at := now();
    NEW.confirmed_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Update handle_new_auth_user to exclude Zoho from default 'employee' role
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  default_role TEXT;
BEGIN
  -- Zoho users will now correctly land as 'unverified' like everyone else.
  -- Only @southwallsecurity.com gets the 'employee' role automatically.
  IF (NEW.email LIKE '%@southwallsecurity.com') THEN
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
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = now();
    
  RETURN NEW;
END;
$$;

COMMIT;
