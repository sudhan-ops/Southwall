-- ==============================================================================
--  VALIDATION RULES DEPENDENCIES
--  Run this to support the 'validate-submission' Edge Function
-- ==============================================================================

-- 1. Create validation_rules table
CREATE TABLE IF NOT EXISTS public.validation_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  submission_type text NOT NULL,
  schema jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT validation_rules_pkey PRIMARY KEY (id),
  CONSTRAINT validation_rules_submission_type_key UNIQUE (submission_type)
);

-- Enable RLS
ALTER TABLE public.validation_rules ENABLE ROW LEVEL SECURITY;

-- Policy: Allow Service Role full access
CREATE POLICY "Service Role Access Validation Rules" ON public.validation_rules
  AS PERMISSIVE FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to READ rules (if client-side validation needed)
CREATE POLICY "Authenticated users can read rules" ON public.validation_rules
  FOR SELECT TO authenticated
  USING (true);

-- 2. Insert a sample rule for testing
-- Example: 'attendance_submission' requires site_id and profile_id
INSERT INTO public.validation_rules (submission_type, schema)
VALUES (
  'attendance_submission',
  '{
    "type": "object",
    "properties": {
      "site_id": { "type": "string" },
      "profile_id": { "type": "string" }
    },
    "required": ["site_id", "profile_id"],
    "additionalProperties": false
  }'::jsonb
)
ON CONFLICT (submission_type) DO UPDATE
SET schema = EXCLUDED.schema;
