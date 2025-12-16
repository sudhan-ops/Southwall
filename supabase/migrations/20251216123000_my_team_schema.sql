-- My Team Module - Location Tracking Schema

-- 1. Create user_location_logs table
CREATE TABLE IF NOT EXISTS public.user_location_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,     -- in meters
    speed DOUBLE PRECISION,        -- in m/s
    battery_level NUMERIC,         -- 0.0 to 1.0 or percentage
    activity_type TEXT,            -- 'still', 'walking', 'driving', 'on_foot', etc.
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_location_logs_user_id ON public.user_location_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_location_logs_timestamp ON public.user_location_logs(timestamp DESC);

-- 3. Enable RLS
ALTER TABLE public.user_location_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Policy: Insert own logs (Field officers/Staff)
CREATE POLICY "Insert own location logs" ON public.user_location_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: View logs
-- 1. Users can view their own logs
-- 2. Managers can view logs of users who report to them
-- 3. Admins/Ops Managers can view all logs
CREATE POLICY "View location logs" ON public.user_location_logs
    FOR SELECT
    USING (
        -- 1. Own logs
        auth.uid() = user_id
        
        -- 2. Manager of the user
        OR auth.uid() IN (
            SELECT reporting_manager_id 
            FROM public.users 
            WHERE id = user_location_logs.user_id
        )
        
        -- 3. Admin/Ops access
        OR auth.uid() IN (
            SELECT id 
            FROM public.users 
            WHERE role_id IN ('admin', 'operations_manager', 'site_manager', 'hr')
        )
    );
