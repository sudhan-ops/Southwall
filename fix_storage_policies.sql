-- ==============================================================================
--  FIX STORAGE POLICIES
--  Creates necessary buckets and sets up RLS policies for file uploads.
-- ==============================================================================

-- 1. Create Buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('avatars', 'avatars', true),
    ('onboarding-documents', 'onboarding-documents', false),
    ('support-attachments', 'support-attachments', false),
    ('logo', 'logo', true),
    ('background', 'background', true),
    ('task-attachments', 'task-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- 2. (Skipped) Enable RLS on storage.objects (Usually enabled by default, 
-- and may require higher privileges to alter).

-- 3. DROP existing policies for these buckets to avoid conflicts
DROP POLICY IF EXISTS "Avatar Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

DROP POLICY IF EXISTS "Logo and Background Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage branding" ON storage.objects;

-- --- AVATARS POLICIES ---

-- Allow everyone to read avatars (since it's a public bucket)
CREATE POLICY "Avatar Public Read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow users to upload to their own folder (folder name matches user ID)
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    -- Ensure the first part of the path is the user's ID
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);


-- --- BRANDING POLICIES (Logo & Background) ---

CREATE POLICY "Logo and Background Public Read"
ON storage.objects FOR SELECT
USING (bucket_id IN ('logo', 'background'));

CREATE POLICY "Admins can manage branding"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id IN ('logo', 'background')
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role_id = 'admin'
    )
);

-- --- DOCUMENT POLICIES (Onboarding & Support & Tasks) ---

DROP POLICY IF EXISTS "Users can manage their own documents" ON storage.objects;
CREATE POLICY "Users can manage their own documents"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id IN ('onboarding-documents', 'support-attachments', 'task-attachments')
    AND (
        -- Admins can see everything
        EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role_id = 'admin')
        OR
        -- Users can see their own folder
        (storage.foldername(name))[1] = auth.uid()::text
    )
);
