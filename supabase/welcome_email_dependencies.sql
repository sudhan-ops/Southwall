-- ==============================================================================
--  WELCOME EMAIL DEPENDENCIES
--  Run this to support the 'send-welcome-email' Edge Function
-- ==============================================================================

-- 1. Create user_activity table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_activity (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES public.users(id), -- Nullable as per function logic
  event_type text NOT NULL,
  details jsonb NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_activity_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Policy: Allow Service Role full access (for Edge Functions)
CREATE POLICY "Service Role Access User Activity" ON public.user_activity
  AS PERMISSIVE FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow admins to view logs (optional)
-- CREATE POLICY "Admins view activity" ON public.user_activity FOR SELECT TO authenticated USING (public.is_admin());
