-- Diagnostic script to check current user status and function behavior
-- Run this in Supabase SQL Editor

-- 1. Check your own user details from the users table
SELECT id, name, email, role_id 
FROM public.users 
WHERE id = auth.uid();

-- 2. Test the helper function (should return 'admin')
SELECT public.get_my_role_id();

-- 3. Check if the policy exists
SELECT policyname, tablename, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users' AND policyname = 'Admins can manage all users';
