-- Migration: Event Requests System
-- Date: 2025-12-30
-- Description: Adds enums for status, updates events table, creates requests table with RLS

-- 1. Create Enums
CREATE TYPE public.event_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'waitlist', 'rejected');

-- 2. Update Events Table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS status public.event_status NOT NULL DEFAULT 'active';

-- Migrate existing boolean status to enum
UPDATE public.events 
SET status = CASE 
    WHEN is_active = true THEN 'active'::public.event_status
    ELSE 'completed'::public.event_status 
END;

-- Drop old column safely (optional, keeping for now might be safer but user asked for enum)
-- ALTER TABLE public.events DROP COLUMN is_active; 

-- 3. Create Requests Table
CREATE TABLE IF NOT EXISTS public.requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    status public.request_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraint: One request per user per event
    CONSTRAINT unique_user_event_request UNIQUE(user_id, event_id)
);

-- Index for sorting requests by date (First Come First Served)
CREATE INDEX IF NOT EXISTS idx_requests_event_created ON public.requests(event_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_requests_user ON public.requests(user_id);

-- 4. Enable RLS
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Requests

-- Policy: Admin View All
CREATE POLICY "Admins can view all requests"
ON public.requests
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: User View Own
CREATE POLICY "Users can view own requests"
ON public.requests
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: User Insert Own
CREATE POLICY "Users can create own requests"
ON public.requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Admin Update (Approve/Reject)
CREATE POLICY "Admins can update requests"
ON public.requests
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 6. Trigger for updated_at on requests
CREATE TRIGGER set_requests_updated_at
    BEFORE UPDATE ON public.requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. Ensure Storage Bucket for Event Images matches requirements (Assuming id 'event-images')
-- Note: Storage buckets creation usually done via API/Dashboard, but we can set policy if bucket exists
-- This part assumes the bucket 'event-images' exists.
