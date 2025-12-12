-- ==============================================================================
--  INVOICES TABLE UPDATE
--  Run this to support the 'invoices' Edge Function
-- ==============================================================================

-- Add missing columns if they don't exist
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS period_start date,
ADD COLUMN IF NOT EXISTS period_end date;

-- Add index for performance (optional but good)
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
