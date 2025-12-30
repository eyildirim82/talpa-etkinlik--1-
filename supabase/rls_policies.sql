-- ============================================
-- TALPA Etkinlik Platform - Row Level Security (RLS) Policies
-- ============================================
-- Description: Security policies to control data access at row level
-- Version: 1.0.0
-- Date: 2025-12-29

-- ============================================
-- Enable RLS on all tables
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- Policy: Admins can update any profile
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: New users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================
-- EVENTS TABLE POLICIES
-- ============================================

-- Policy: Everyone can view active events
CREATE POLICY "Anyone can view active events"
ON public.events
FOR SELECT
USING (is_active = true);

-- Policy: Admins can view all events
CREATE POLICY "Admins can view all events"
ON public.events
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Only admins can insert events
CREATE POLICY "Only admins can insert events"
ON public.events
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Only admins can update events
CREATE POLICY "Only admins can update events"
ON public.events
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Only admins can delete events
CREATE POLICY "Only admins can delete events"
ON public.events
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- TICKETS TABLE POLICIES
-- ============================================

-- Policy: Users can view their own tickets
CREATE POLICY "Users can view own tickets"
ON public.tickets
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
ON public.tickets
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Ticket creation is handled by RPC function (purchase_ticket)
-- This prevents direct inserts and enforces business logic
CREATE POLICY "No direct ticket inserts"
ON public.tickets
FOR INSERT
WITH CHECK (false);

-- Policy: Only admins can update tickets (e.g., change status, assign seat)
CREATE POLICY "Only admins can update tickets"
ON public.tickets
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Only admins can delete tickets
CREATE POLICY "Only admins can delete tickets"
ON public.tickets
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- Helper function to check if user is admin
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_admin IS 'Check if current user is an admin';

-- ============================================
-- RLS Policies Complete
-- ============================================
