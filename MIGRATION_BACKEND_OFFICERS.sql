-- ============================================
-- MIGRATION: Support Multiple Backend Field Officers
-- Run these queries in your Supabase SQL Editor
-- ============================================

-- 1. Rename and change type of backend_field_officer_name to array
-- This converts existing single names into an array with one element
ALTER TABLE organizations
    ALTER COLUMN backend_field_officer_name TYPE TEXT[] 
    USING CASE 
        WHEN backend_field_officer_name IS NULL THEN NULL 
        ELSE ARRAY[backend_field_officer_name] 
    END;

-- 2. Rename the column to plural to match the new type
ALTER TABLE organizations 
    RENAME COLUMN backend_field_officer_name TO backend_field_officer_names;

-- 3. Update comment
COMMENT ON COLUMN organizations.backend_field_officer_names IS 'Array of backend field officer names';

-- 4. Verify the change
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'organizations'
AND column_name = 'backend_field_officer_names';

-- 5. (Optional) Test Update
-- UPDATE organizations 
-- SET backend_field_officer_names = ARRAY['Officer 1', 'Officer 2'] 
-- WHERE short_name = 'Test Site';
