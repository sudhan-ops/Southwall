-- ==============================================================================
--  SUBMIT ATTENDANCE DEPENDENCIES
--  Run this to support the 'submit-attendance' Edge Function
-- ==============================================================================

-- 1. Create profiles table (separating auth user from profile data, as implied by code)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_uid uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_auth_uid_key UNIQUE (auth_uid)
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow Service Role full access
CREATE POLICY "Service Role Access Profiles" ON public.profiles
  AS PERMISSIVE FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Trigger to create profile when user signs up?
-- (Optional, but good to have if we rely on it. For now, we assume manually populated or existing logic)
-- Actually, let's add a trigger to auto-create profile just in case users already exist
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (auth_uid)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Also backfill for existing users if any?
INSERT INTO public.profiles (auth_uid)
SELECT id FROM auth.users
ON CONFLICT DO NOTHING;


-- 2. Create attendance table (distinct from attendance_events based on code requirements)
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  site_id text NOT NULL, -- User code validates this as UUID string
  profile_id uuid NOT NULL REFERENCES public.profiles(id),
  checkin_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT attendance_pkey PRIMARY KEY (id)
);

-- Enable RLS for attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Policy: Allow Service Role full access
CREATE POLICY "Service Role Access Attendance" ON public.attendance
  AS PERMISSIVE FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
