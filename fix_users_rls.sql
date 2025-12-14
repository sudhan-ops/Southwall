-- Robust fix for RLS policies
-- 1. Drop the policy if it exists to ensure a clean update
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- 2. Drop the function to recreate it with better options
DROP FUNCTION IF EXISTS public.get_my_role_id();

-- 3. Recreate the helper function with search_path and ownership protections
CREATE OR REPLACE FUNCTION public.get_my_role_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp -- Prevent search_path hijacking
AS $$
BEGIN
  -- Return the role_id, defaulting to empty string if null
  RETURN (SELECT COALESCE(role_id, '') FROM public.users WHERE id = auth.uid());
END;
$$;

-- Ensure the function is owned by postgres (superuser) to bypass RLS recursion
ALTER FUNCTION public.get_my_role_id() OWNER TO postgres;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_my_role_id() TO authenticated;

-- 4. Recreate the policy with case-insensitive check
CREATE POLICY "Admins can manage all users"
  ON public.users
  FOR ALL
  USING (
    LOWER(public.get_my_role_id()) = 'admin'
  );
