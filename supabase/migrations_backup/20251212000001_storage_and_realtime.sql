-- Storage Buckets and Policies

-- Create buckets
insert into storage.buckets (id, name, public)
values 
  ('documents', 'documents', false),
  ('photos', 'photos', false)
on conflict (id) do nothing;

-- Policies for 'documents'
-- Authenticated users can upload to their own folder (assuming structure user_id/filename)
-- Or just allow authenticated upload for now as per schema logic
do $$
begin
  if not exists (
    select 1 from pg_policies where polname = 'Authenticated users can upload documents' and tablename = 'objects'
  ) then
    create policy "Authenticated users can upload documents"
      on storage.objects for insert
      with check (bucket_id = 'documents' and auth.role() = 'authenticated');
  end if;
  
  if not exists (
    select 1 from pg_policies where polname = 'Users can view their own documents' and tablename = 'objects'
  ) then
      -- This policy assumes a specific path structure or metadata. 
      -- For simplicity in this setup, we allow reading if you are the owner (owner field in objects).
    create policy "Users can view their own documents"
      on storage.objects for select
      using (bucket_id = 'documents' and auth.uid() = owner);
  end if;
end$$;

-- Realtime Setup
-- Add tables to the publication
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.attendance_events;
alter publication supabase_realtime add table public.onboarding_submissions;
