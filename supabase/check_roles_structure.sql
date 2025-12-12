-- ==============================================================================
--  CHECK ROLES TABLE STRUCTURE
--  Run this to see what the roles table actually looks like
-- ==============================================================================

-- Check what columns exist in the roles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'roles'
ORDER BY ordinal_position;

-- Show all existing data in roles table
SELECT * FROM public.roles;
