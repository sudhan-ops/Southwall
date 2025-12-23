-- ==============================================================================
-- UNIVERSAL USER DELETION FIX
-- This script ensures that deleting a user (from App or Supabase Dashboard)
-- automatically cleans up all related data across the entire database.
-- ==============================================================================

BEGIN;

-- 1. Ensure public.users cascades from auth.users
-- This is the root link. If this is missing, Dashboard deletion won't work.
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_id_fkey,
ADD CONSTRAINT users_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Ensure public.profiles cascades from auth.users
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_auth_uid_fkey,
ADD CONSTRAINT profiles_auth_uid_fkey 
FOREIGN KEY (auth_uid) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Cleanup Attendance & Approvals
-- Manager refs must be SET NULL (so we don't delete approvals when a manager leaves)
ALTER TABLE public.attendance_approvals 
DROP CONSTRAINT IF EXISTS attendance_approvals_manager_id_fkey,
ADD CONSTRAINT attendance_approvals_manager_id_fkey 
FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- Requester refs must CASCADE (delete logs when user is gone)
ALTER TABLE public.attendance_approvals 
DROP CONSTRAINT IF EXISTS attendance_approvals_user_id_fkey,
ADD CONSTRAINT attendance_approvals_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Attendance events CASCADE
ALTER TABLE public.attendance_events 
DROP CONSTRAINT IF EXISTS attendance_events_user_id_fkey,
ADD CONSTRAINT attendance_events_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Attendance (profiles system) CASCADE
ALTER TABLE public.attendance 
DROP CONSTRAINT IF EXISTS attendance_profile_id_fkey,
ADD CONSTRAINT attendance_profile_id_fkey 
FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


-- 4. Cleanup Support Tickets
ALTER TABLE public.support_tickets 
DROP CONSTRAINT IF EXISTS support_tickets_assigned_to_id_fkey,
ADD CONSTRAINT support_tickets_assigned_to_id_fkey 
FOREIGN KEY (assigned_to_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.support_tickets 
DROP CONSTRAINT IF EXISTS support_tickets_raised_by_id_fkey,
ADD CONSTRAINT support_tickets_raised_by_id_fkey 
FOREIGN KEY (raised_by_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.ticket_posts 
DROP CONSTRAINT IF EXISTS ticket_posts_author_id_fkey,
ADD CONSTRAINT ticket_posts_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.ticket_comments 
DROP CONSTRAINT IF EXISTS ticket_comments_author_id_fkey,
ADD CONSTRAINT ticket_comments_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;


-- 5. Cleanup Tasks
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_assigned_to_id_fkey,
ADD CONSTRAINT tasks_assigned_to_id_fkey 
FOREIGN KEY (assigned_to_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_created_by_id_fkey,
ADD CONSTRAINT tasks_created_by_id_fkey 
FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


-- 6. Cleanup User Activity & Logs
ALTER TABLE public.user_activity 
DROP CONSTRAINT IF EXISTS user_activity_user_id_fkey,
ADD CONSTRAINT user_activity_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_locations 
DROP CONSTRAINT IF EXISTS user_locations_user_id_fkey,
ADD CONSTRAINT user_locations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- 7. Cleanup Onboarding
ALTER TABLE public.onboarding_submissions 
DROP CONSTRAINT IF EXISTS onboarding_submissions_user_id_fkey,
ADD CONSTRAINT onboarding_submissions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

COMMIT;
