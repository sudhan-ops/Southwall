-- ==============================================================================
--  INSERT DEFAULT ROLES
--  Run this to populate the roles table with default roles
-- ==============================================================================

-- Insert default roles using the correct column names (id, display_name)
INSERT INTO public.roles (id, display_name) VALUES
  ('admin', 'Admin'),
  ('employee', 'Employee'),
  ('manager', 'Manager'),
  ('unverified', 'Unverified')
ON CONFLICT (id) DO NOTHING;

-- Verify roles were inserted
SELECT * FROM public.roles ORDER BY display_name;
