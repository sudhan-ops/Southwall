-- ==============================================================================
-- UNIVERSAL USER DELETION FIX (V3 - ACCURATE SCHEMA)
-- This script ensures that deleting a user (from App or Supabase Dashboard)
-- automatically cleans up all related data across the entire database.
-- ==============================================================================

BEGIN;

-- 1. ROOT LINKS (auth.users -> public.users)
-- Ensure public.users cascades from auth.users
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_id_fkey,
ADD CONSTRAINT users_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- 2. ATTENDANCE & TEAM TRACKING

-- Attendance Approvals
ALTER TABLE public.attendance_approvals 
DROP CONSTRAINT IF EXISTS attendance_approvals_manager_id_fkey,
ADD CONSTRAINT attendance_approvals_manager_id_fkey 
FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.attendance_approvals 
DROP CONSTRAINT IF EXISTS attendance_approvals_user_id_fkey,
ADD CONSTRAINT attendance_approvals_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Attendance Events
ALTER TABLE public.attendance_events 
DROP CONSTRAINT IF EXISTS attendance_events_user_id_fkey,
ADD CONSTRAINT attendance_events_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- 3. SUPPORT TICKETS

ALTER TABLE public.support_tickets 
DROP CONSTRAINT IF EXISTS support_tickets_assigned_to_id_fkey,
ADD CONSTRAINT support_tickets_assigned_to_id_fkey 
FOREIGN KEY (assigned_to_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.support_tickets 
DROP CONSTRAINT IF EXISTS support_tickets_raised_by_id_fkey,
ADD CONSTRAINT support_tickets_raised_by_id_fkey 
FOREIGN KEY (raised_by_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Ticket Posts
ALTER TABLE public.ticket_posts 
DROP CONSTRAINT IF EXISTS ticket_posts_author_id_fkey,
ADD CONSTRAINT ticket_posts_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- Ticket Comments
ALTER TABLE public.ticket_comments 
DROP CONSTRAINT IF EXISTS ticket_comments_author_id_fkey,
ADD CONSTRAINT ticket_comments_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;


-- 4. TASKS & NOTIFICATIONS

ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_assigned_to_id_fkey,
ADD CONSTRAINT tasks_assigned_to_id_fkey 
FOREIGN KEY (assigned_to_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_created_by_id_fkey,
ADD CONSTRAINT tasks_created_by_id_fkey 
FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- Notifications
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey,
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- 5. LOCATIONS & TRACKING

-- Locations (Static Definitions)
ALTER TABLE public.user_locations 
DROP CONSTRAINT IF EXISTS user_locations_user_id_fkey,
ADD CONSTRAINT user_locations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Location Creation
ALTER TABLE public.locations 
DROP CONSTRAINT IF EXISTS locations_created_by_fkey,
ADD CONSTRAINT locations_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


-- 6. ONBOARDING
ALTER TABLE public.onboarding_submissions 
DROP CONSTRAINT IF EXISTS onboarding_submissions_user_id_fkey,
ADD CONSTRAINT onboarding_submissions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.onboarding_submissions 
DROP CONSTRAINT IF EXISTS onboarding_submissions_created_user_id_fkey,
ADD CONSTRAINT onboarding_submissions_created_user_id_fkey 
FOREIGN KEY (created_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


-- 7. PATROL MODULE
ALTER TABLE public.patrol_qr_codes 
DROP CONSTRAINT IF EXISTS patrol_qr_codes_created_by_fkey,
ADD CONSTRAINT patrol_qr_codes_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.patrol_logs 
DROP CONSTRAINT IF EXISTS patrol_logs_user_id_fkey,
ADD CONSTRAINT patrol_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.patrol_daily_scores 
DROP CONSTRAINT IF EXISTS patrol_daily_scores_user_id_fkey,
ADD CONSTRAINT patrol_daily_scores_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- 8. COMP-OFF & LEAVE
ALTER TABLE public.comp_off_logs 
DROP CONSTRAINT IF EXISTS comp_off_logs_user_id_fkey,
ADD CONSTRAINT comp_off_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.comp_off_logs 
DROP CONSTRAINT IF EXISTS comp_off_logs_granted_by_id_fkey,
ADD CONSTRAINT comp_off_logs_granted_by_id_fkey 
FOREIGN KEY (granted_by_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.extra_work_logs 
DROP CONSTRAINT IF EXISTS extra_work_logs_user_id_fkey,
ADD CONSTRAINT extra_work_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.extra_work_logs 
DROP CONSTRAINT IF EXISTS extra_work_logs_approver_id_fkey,
ADD CONSTRAINT extra_work_logs_approver_id_fkey 
FOREIGN KEY (approver_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.leave_requests 
DROP CONSTRAINT IF EXISTS leave_requests_user_id_fkey,
ADD CONSTRAINT leave_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- 9. UNIFORM REQUESTS
ALTER TABLE public.uniform_requests 
DROP CONSTRAINT IF EXISTS uniform_requests_requested_by_id_fkey,
ADD CONSTRAINT uniform_requests_requested_by_id_fkey 
FOREIGN KEY (requested_by_id) REFERENCES public.users(id) ON DELETE SET NULL;

COMMIT;
