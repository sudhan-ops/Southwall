-- ==============================================================================
-- ADMIN APPROVAL FLOW SETUP
-- Ensures all new signups are initially 'unverified' and require admin approval.
-- Also maintains Zoho auto-verification for email convenience.
-- ==============================================================================

BEGIN;

-- 1. Auto-verify Zoho domains (email only)
CREATE OR REPLACE FUNCTION public.auto_verify_zoho_users()
RETURNS TRIGGER SECURITY DEFINER AS $$
BEGIN
  IF (NEW.email LIKE '%@zoho.com' OR 
      NEW.email LIKE '%@zoho.in' OR 
      NEW.email LIKE '%@southwallsecurity.com') THEN
    NEW.email_confirmed_at := now();
    NEW.confirmed_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Handle new user creation - ALWAYS set to 'unverified'
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- All users start as 'unverified' regardless of email domain
  -- They must wait for an Admin to assign a role in the Client Panel.
  INSERT INTO public.users (id, name, email, role_id)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'), 
    NEW.email, 
    'unverified'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = now();
    
  RETURN NEW;
END;
$$;

COMMIT;
