-- Migration to support multiple questions (Safe Version)

-- 1. Update patrol_qr_codes
ALTER TABLE public.patrol_qr_codes ADD COLUMN IF NOT EXISTS questions TEXT[] DEFAULT ARRAY['Is the area secure?'];

-- Migrate existing data (if any)
-- UPDATE public.patrol_qr_codes SET questions = ARRAY[question] WHERE question IS NOT NULL; -- Optional, might fail if column dropped

-- Make old column nullable
ALTER TABLE public.patrol_qr_codes ALTER COLUMN question DROP NOT NULL;


-- 2. Update patrol_logs
ALTER TABLE public.patrol_logs ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '[]'::jsonb;

-- Make old column nullable so we can ignore it
ALTER TABLE public.patrol_logs ALTER COLUMN answer DROP NOT NULL;

-- We do NOT drop the check constraint on 'answer' because we don't know its name. 
-- Since we will insert NULL into 'answer', the check constraint won't trigger.
