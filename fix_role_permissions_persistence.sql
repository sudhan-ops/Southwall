-- ==============================================================================
--  FIX ROLE PERMISSIONS PERSISTENCE
--  Enables server-side storage of permissions for each role.
-- ==============================================================================

-- 1. Add permissions column to roles table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='roles' AND column_name='permissions') THEN
        ALTER TABLE public.roles ADD COLUMN permissions text[] NOT NULL DEFAULT '{}'::text[];
    END IF;
END $$;

-- 2. Initialize default permissions for existing roles
-- This helps populate the DB so that new users/browsers get the correct initial state.

-- Admin
UPDATE public.roles SET permissions = ARRAY[
    'view_all_submissions', 'manage_users', 'manage_sites', 'view_entity_management',
    'view_developer_settings', 'view_operations_dashboard', 'view_site_dashboard',
    'create_enrollment', 'manage_roles_and_permissions', 'manage_attendance_rules',
    'view_all_attendance', 'view_own_attendance', 'apply_for_leave', 'manage_leave_requests',
    'manage_approval_workflow', 'download_attendance_report', 'manage_tasks',
    'manage_policies', 'manage_insurance', 'manage_enrollment_rules',
    'manage_uniforms', 'view_invoice_summary', 'view_verification_costing',
    'view_field_officer_tracking', 'manage_modules', 'access_support_desk'
] WHERE id = 'admin';

-- HR
UPDATE public.roles SET permissions = ARRAY[
    'view_all_submissions', 'manage_users', 'manage_sites', 'view_entity_management',
    'manage_attendance_rules', 'view_all_attendance', 'view_own_attendance',
    'apply_for_leave', 'manage_leave_requests', 'download_attendance_report',
    'manage_policies', 'manage_insurance', 'manage_enrollment_rules',
    'manage_uniforms', 'view_invoice_summary', 'view_verification_costing', 'access_support_desk'
] WHERE id = 'hr';

-- Finance
UPDATE public.roles SET permissions = ARRAY[
    'view_invoice_summary', 'view_verification_costing', 'view_own_attendance', 'apply_for_leave'
] WHERE id = 'finance';

-- Operation Manager
UPDATE public.roles SET permissions = ARRAY[
    'view_operations_dashboard', 'view_all_attendance', 'view_own_attendance', 
    'apply_for_leave', 'manage_leave_requests', 'manage_tasks', 'access_support_desk'
] WHERE id = 'operation_manager';

-- Site Manager
UPDATE public.roles SET permissions = ARRAY[
    'view_site_dashboard', 'create_enrollment', 'view_own_attendance', 'apply_for_leave', 'access_support_desk'
] WHERE id = 'site_manager';

-- Field Officer
UPDATE public.roles SET permissions = ARRAY[
    'create_enrollment', 'view_own_attendance', 'apply_for_leave', 'access_support_desk'
] WHERE id = 'field_officer';

-- Developer
UPDATE public.roles SET permissions = ARRAY['view_developer_settings'] WHERE id = 'developer';

-- 3. Ensure RLS policies allow authenticated users to read roles (needed for initialization)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='roles' AND policyname='Anyone can read roles') THEN
        CREATE POLICY "Anyone can read roles" ON public.roles FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='roles' AND policyname='Admins can manage roles') THEN
        CREATE POLICY "Admins can manage roles" ON public.roles FOR ALL 
        TO authenticated 
        USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role_id = 'admin'));
    END IF;
END $$;
