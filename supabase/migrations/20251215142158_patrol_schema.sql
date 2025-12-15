-- Security Patrolling Module Schema

-- 1. Patrol QR Codes
CREATE TABLE IF NOT EXISTS public.patrol_qr_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id TEXT NOT NULL, -- References organizations(id) which is TEXT
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    radius_meters NUMERIC DEFAULT 30,
    active_from DATE,
    active_to DATE,
    assigned_role_id TEXT, -- Optional: restrict to specific role
    question TEXT NOT NULL DEFAULT 'Is the area secure?',
    require_photo_on_no BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Patrol Logs (Submission history)
CREATE TABLE IF NOT EXISTS public.patrol_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    qr_id UUID NOT NULL REFERENCES public.patrol_qr_codes(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    scan_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    is_within_radius BOOLEAN DEFAULT false,
    answer TEXT CHECK (answer IN ('YES', 'NO')),
    photo_url TEXT,
    reason TEXT,
    status TEXT NOT NULL, -- 'Completed', 'Failed', 'Exception'
    score_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Patrol Daily Scores
CREATE TABLE IF NOT EXISTS public.patrol_daily_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    date DATE NOT NULL,
    total_score INTEGER DEFAULT 100,
    score_status TEXT DEFAULT 'OK', -- 'OK', 'Concern'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.patrol_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patrol_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patrol_daily_scores ENABLE ROW LEVEL SECURITY;

-- Policies
-- Patrol QR Codes: Admins/Managers can full access, Field Officers/Staff can view active
CREATE POLICY "Manage patrol QRs" ON public.patrol_qr_codes
    USING (auth.uid() IN (SELECT id FROM public.users WHERE role_id IN ('admin', 'operations_manager', 'site_manager')))
    WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role_id IN ('admin', 'operations_manager', 'site_manager')));

CREATE POLICY "View active QRs" ON public.patrol_qr_codes
    FOR SELECT
    USING (status = 'active');

-- Patrol Logs: Staff inserts own logs, Admins view all
CREATE POLICY "Insert own logs" ON public.patrol_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "View all logs" ON public.patrol_logs
    FOR SELECT
    USING (
        auth.uid() IN (SELECT id FROM public.users WHERE role_id IN ('admin', 'operations_manager', 'site_manager'))
        OR auth.uid() = user_id
    );

-- Patrol Scores: Admins view all, Users view own
CREATE POLICY "View scores" ON public.patrol_daily_scores
    FOR SELECT
    USING (
        auth.uid() IN (SELECT id FROM public.users WHERE role_id IN ('admin', 'operations_manager', 'site_manager'))
        OR auth.uid() = user_id
    );
