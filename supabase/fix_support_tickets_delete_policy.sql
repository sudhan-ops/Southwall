-- Add DELETE policy for support_tickets
-- Allows Admin and Operations Manager to delete tickets

DROP POLICY IF EXISTS "Admins can delete tickets" ON public.support_tickets;

CREATE POLICY "Admins can delete tickets" ON public.support_tickets
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role_id IN ('admin', 'operation_manager')
    )
  );

-- Also ensure admins can update ANY ticket (current policy might restrict to own tickets)
DROP POLICY IF EXISTS "Admins can update all tickets" ON public.support_tickets;
CREATE POLICY "Admins can update all tickets" ON public.support_tickets
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role_id IN ('admin', 'operation_manager', 'developer')
    )
  );

-- Verify policies
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'support_tickets';
