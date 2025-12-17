-- Create app_modules table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.app_modules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    permissions TEXT[] DEFAULT '{}'::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist (in case table existed but lacks them)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_modules' AND column_name = 'created_at') THEN
        ALTER TABLE public.app_modules ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_modules' AND column_name = 'updated_at') THEN
        ALTER TABLE public.app_modules ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.app_modules ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Admin can do everything
CREATE POLICY "Admins can manage modules" ON public.app_modules
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND (users.role_id = 'admin' OR users.role_id = 'operations_manager')
        )
    );

-- Everyone can view modules
CREATE POLICY "Authenticated users can view modules" ON public.app_modules
    FOR SELECT
    USING (
        auth.role() = 'authenticated'
    );

-- Insert Default Modules
INSERT INTO public.app_modules (id, name, description, permissions) VALUES
('mod_admin', 'Admin & Access Control', 'Permissions for managing users, roles, and system modules.', ARRAY['manage_users', 'manage_roles_and_permissions', 'manage_modules']),
('mod_billing', 'Billing & Costing', 'Permissions related to invoices and verification cost analysis.', ARRAY['view_invoice_summary', 'view_verification_costing']),
('mod_dashboards', 'Dashboards & Tracking', 'Access to various dashboards and user activity tracking.', ARRAY['view_operations_dashboard', 'view_site_dashboard', 'view_field_officer_tracking']),
('mod_self_service', 'Employee Self-Service', 'Basic permissions for all employees.', ARRAY['view_own_attendance', 'apply_for_leave', 'download_attendance_report']),
('mod_hr_tasks', 'HR Tasks & Management', 'Manage leaves, policies, insurance, uniforms, and tasks.', ARRAY['manage_leave_requests', 'manage_policies', 'manage_insurance', 'manage_uniforms', 'manage_approval_workflow', 'view_all_attendance', 'manage_tasks']),
('mod_office_staff', 'Office Staff', 'Office Staff permissions.', ARRAY['view_all_attendance', 'view_all_submissions']),
('mod_org_setup', 'Organization & HR Setup', 'Manage sites, clients, and rules for enrollment and attendance.', ARRAY['view_entity_management', 'manage_attendance_rules', 'manage_enrollment_rules', 'manage_sites']),
('mod_submissions', 'Submissions & Verification', 'View and manage employee onboarding submissions and approval workflows.', ARRAY['view_all_submissions', 'create_enrollment']),
('mod_support', 'Support Desk', 'Access and manage support tickets.', ARRAY['access_support_desk']),
('mod_system', 'System & Developer', 'Access developer settings and system configurations.', ARRAY['view_developer_settings']),
('mod_ops', 'OPS', 'OPS Management.', ARRAY['manage_sites', 'manage_tasks'])
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();
