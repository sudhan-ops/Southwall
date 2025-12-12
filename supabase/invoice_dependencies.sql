-- ==============================================================================
--  INVOICE FEATURE DEPENDENCIES
--  Run this to support the 'generate-invoice' Edge Function
-- ==============================================================================

-- 1. Create Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  enrollment_id text NULL, -- References onboarding_submissions(enrollment_id) or similar if exists
  amount numeric NULL,
  currency text NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'generated',
  generated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoices_pkey PRIMARY KEY (id)
);

-- Enable RLS (Recommended)
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Allow Service Role (Edge Functions) full access
CREATE POLICY "Enable access for service role" ON public.invoices
  AS PERMISSIVE FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to view their own (optional, adjust as needed)
-- CREATE POLICY "Users see own invoices" ON public.invoices FOR SELECT TO authenticated USING (auth.uid() = user_id);


-- 2. Create Invoices Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow Service Role to upload/read invoices
CREATE POLICY "Service Role Access Invoices" ON storage.objects
  AS PERMISSIVE FOR ALL
  TO service_role
  USING (bucket_id = 'invoices')
  WITH CHECK (bucket_id = 'invoices');

-- Policy: Allow authenticated users to READ invoices (via signed URL) 
-- (Signed URLs technically work without RLS if the signer has permission, but bucket policy is good practice)
