-- ============================================
-- TALPA Etkinlik Platform - Database Schema
-- ============================================
-- Description: Complete database schema for TALPA event management platform
-- Version: 1.0.0
-- Date: 2025-12-29

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
-- Stores user profile information linked to auth.users

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    talpa_sicil_no TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.profiles IS 'User profiles linked to auth.users';
COMMENT ON COLUMN public.profiles.role IS 'User role: admin or member';

-- ============================================
-- 2. EVENTS TABLE
-- ============================================
-- Stores event information

CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'TL',
    total_quota INTEGER NOT NULL DEFAULT 0 CHECK (total_quota >= 0),
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for active event queries
CREATE INDEX IF NOT EXISTS idx_events_active ON public.events(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);

CREATE TRIGGER set_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.events IS 'Event information and configuration';
COMMENT ON COLUMN public.events.is_active IS 'Only one event can be active at a time (enforced by RPC function)';

-- ============================================
-- 3. TICKETS TABLE
-- ============================================
-- Stores purchased tickets

CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    seat_number TEXT,
    qr_code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    gate TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_tickets_event ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_qr_code ON public.tickets(qr_code);

COMMENT ON TABLE public.tickets IS 'Ticket purchases for events';
COMMENT ON COLUMN public.tickets.qr_code IS 'Unique QR code for digital boarding pass';

-- ============================================
-- 4. ACTIVE EVENT VIEW
-- ============================================
-- View that shows the active event with calculated remaining stock

CREATE OR REPLACE VIEW public.active_event_view AS
SELECT 
    e.id,
    e.title,
    e.description,
    e.image_url,
    e.event_date,
    e.location,
    e.price,
    e.currency,
    e.total_quota,
    e.is_active,
    e.created_at,
    e.updated_at,
    COALESCE(
        e.total_quota - (
            SELECT COUNT(*)
            FROM public.tickets t
            WHERE t.event_id = e.id 
            AND t.status IN ('pending', 'paid')
        ), 
        e.total_quota
    ) AS remaining_stock
FROM public.events e
WHERE e.is_active = true;

COMMENT ON VIEW public.active_event_view IS 'Active event with calculated remaining stock';

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function to get remaining stock for an event
CREATE OR REPLACE FUNCTION public.get_remaining_stock(p_event_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_total_quota INTEGER;
    v_sold_tickets INTEGER;
BEGIN
    -- Get total quota
    SELECT total_quota INTO v_total_quota
    FROM public.events
    WHERE id = p_event_id;
    
    IF v_total_quota IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Get sold tickets count
    SELECT COUNT(*) INTO v_sold_tickets
    FROM public.tickets
    WHERE event_id = p_event_id
    AND status IN ('pending', 'paid');
    
    RETURN GREATEST(v_total_quota - v_sold_tickets, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_remaining_stock IS 'Calculate remaining stock for an event';

-- ============================================
-- Schema Creation Complete
-- ============================================
