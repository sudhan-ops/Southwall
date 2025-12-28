-- ==============================================================================
-- VERIFICATION: Check if trigger has SECURITY DEFINER
-- Run this query FIRST to see if the fix was applied
-- ==============================================================================

-- Check if trigger function has SECURITY DEFINER (should return 't' for true)
SELECT 
  proname as function_name,
  prosecdef as has_security_definer,
  CASE 
    WHEN prosecdef = true THEN '✅ CORRECT - Has SECURITY DEFINER'
    ELSE '❌ MISSING - Needs SECURITY DEFINER'
  END as status
FROM pg_proc 
WHERE proname = 'handle_new_auth_user';

-- Expected result: has_security_definer = t (true)
-- If you see "f" (false), the fix was NOT applied correctly
