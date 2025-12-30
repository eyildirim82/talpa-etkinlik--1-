-- ============================================
-- TALPA Etkinlik Platform - Database Functions (RPC)
-- ============================================
-- Description: Business logic functions for ticket purchase and admin operations
-- Version: 1.0.0
-- Date: 2025-12-29

-- ============================================
-- 1. PURCHASE TICKET FUNCTION
-- ============================================
-- Race-condition safe ticket purchase with stock validation

CREATE OR REPLACE FUNCTION public.purchase_ticket(p_event_id UUID)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_total_quota INTEGER;
    v_sold_tickets INTEGER;
    v_remaining INTEGER;
    v_ticket_id UUID;
    v_qr_code TEXT;
    v_ticket RECORD;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Lütfen giriş yapınız.'
        );
    END IF;
    
    -- Lock the event row to prevent race conditions
    SELECT total_quota INTO v_total_quota
    FROM public.events
    WHERE id = p_event_id AND is_active = true
    FOR UPDATE;
    
    -- Check if event exists and is active
    IF v_total_quota IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Etkinlik bulunamadı veya aktif değil.'
        );
    END IF;
    
    -- Check if user already has a ticket for this event
    IF EXISTS (
        SELECT 1 FROM public.tickets
        WHERE event_id = p_event_id 
        AND user_id = v_user_id
        AND status IN ('pending', 'paid')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Bu etkinlik için zaten biletiniz var.'
        );
    END IF;
    
    -- Count sold tickets (with lock)
    SELECT COUNT(*) INTO v_sold_tickets
    FROM public.tickets
    WHERE event_id = p_event_id
    AND status IN ('pending', 'paid');
    
    -- Calculate remaining stock
    v_remaining := v_total_quota - v_sold_tickets;
    
    -- Check if stock is available
    IF v_remaining <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Maalesef kontenjan dolmuştur.'
        );
    END IF;
    
    -- Generate unique QR code
    v_qr_code := 'TALPA-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 13));
    
    -- Create ticket (bypass RLS using SECURITY DEFINER)
    INSERT INTO public.tickets (
        event_id,
        user_id,
        qr_code,
        status,
        purchase_date
    ) VALUES (
        p_event_id,
        v_user_id,
        v_qr_code,
        'paid',
        timezone('utc'::text, now())
    )
    RETURNING id, qr_code INTO v_ticket_id, v_qr_code;
    
    -- Get complete ticket information
    SELECT 
        t.id,
        t.event_id,
        t.user_id,
        t.qr_code,
        t.status,
        t.purchase_date,
        e.title AS event_title,
        e.event_date,
        e.location,
        p.full_name
    INTO v_ticket
    FROM public.tickets t
    JOIN public.events e ON e.id = t.event_id
    JOIN public.profiles p ON p.id = t.user_id
    WHERE t.id = v_ticket_id;
    
    -- Return success with ticket data
    RETURN json_build_object(
        'success', true,
        'ticket', json_build_object(
            'id', v_ticket.id,
            'event_id', v_ticket.event_id,
            'qr_code', v_ticket.qr_code,
            'status', v_ticket.status,
            'purchase_date', v_ticket.purchase_date,
            'event_title', v_ticket.event_title,
            'event_date', v_ticket.event_date,
            'location', v_ticket.location,
            'full_name', v_ticket.full_name
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Bilet satın alınırken bir hata oluştu: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.purchase_ticket IS 'Race-condition safe ticket purchase with stock validation';

-- ============================================
-- 2. SET ACTIVE EVENT FUNCTION
-- ============================================
-- Single active event enforcement (admin only)

CREATE OR REPLACE FUNCTION public.set_active_event(p_event_id UUID)
RETURNS JSON AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_event_exists BOOLEAN;
BEGIN
    -- Check if user is admin
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ) INTO v_is_admin;
    
    IF NOT v_is_admin THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Bu işlem için yetkiniz yok.'
        );
    END IF;
    
    -- Check if event exists
    SELECT EXISTS (
        SELECT 1 FROM public.events WHERE id = p_event_id
    ) INTO v_event_exists;
    
    IF NOT v_event_exists THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Etkinlik bulunamadı.'
        );
    END IF;
    
    -- Deactivate all events first (atomic transaction)
    UPDATE public.events SET is_active = false;
    
    -- Activate the selected event
    UPDATE public.events 
    SET is_active = true 
    WHERE id = p_event_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Etkinlik aktif edildi.'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Etkinlik aktif edilirken hata oluştu: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.set_active_event IS 'Set an event as active (admin only, ensures single active event)';

-- ============================================
-- 3. GET EVENT STATS FUNCTION
-- ============================================
-- Get detailed statistics for an event (admin only)

CREATE OR REPLACE FUNCTION public.get_event_stats(p_event_id UUID)
RETURNS JSON AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_total_quota INTEGER;
    v_sold_tickets INTEGER;
    v_cancelled_tickets INTEGER;
    v_revenue NUMERIC;
    v_price NUMERIC;
    v_remaining INTEGER;
    v_occupancy_rate NUMERIC;
BEGIN
    -- Check if user is admin
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ) INTO v_is_admin;
    
    IF NOT v_is_admin THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Bu işlem için yetkiniz yok.'
        );
    END IF;
    
    -- Get event details
    SELECT total_quota, price INTO v_total_quota, v_price
    FROM public.events
    WHERE id = p_event_id;
    
    IF v_total_quota IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Etkinlik bulunamadı.'
        );
    END IF;
    
    -- Count sold tickets
    SELECT COUNT(*) INTO v_sold_tickets
    FROM public.tickets
    WHERE event_id = p_event_id
    AND status IN ('pending', 'paid');
    
    -- Count cancelled tickets
    SELECT COUNT(*) INTO v_cancelled_tickets
    FROM public.tickets
    WHERE event_id = p_event_id
    AND status = 'cancelled';
    
    -- Calculate metrics
    v_remaining := GREATEST(v_total_quota - v_sold_tickets, 0);
    v_revenue := v_sold_tickets * v_price;
    v_occupancy_rate := CASE 
        WHEN v_total_quota > 0 THEN (v_sold_tickets::NUMERIC / v_total_quota * 100)
        ELSE 0 
    END;
    
    RETURN json_build_object(
        'success', true,
        'stats', json_build_object(
            'total_quota', v_total_quota,
            'sold_tickets', v_sold_tickets,
            'cancelled_tickets', v_cancelled_tickets,
            'remaining_stock', v_remaining,
            'revenue', v_revenue,
            'occupancy_rate', ROUND(v_occupancy_rate, 2)
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'İstatistikler alınırken hata oluştu: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_event_stats IS 'Get detailed event statistics (admin only)';

-- ============================================
-- 4. GET USER TICKETS FUNCTION
-- ============================================
-- Get all tickets for current user

CREATE OR REPLACE FUNCTION public.get_user_tickets()
RETURNS TABLE (
    id UUID,
    event_id UUID,
    event_title TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    qr_code TEXT,
    status TEXT,
    purchase_date TIMESTAMP WITH TIME ZONE,
    seat_number TEXT,
    gate TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.event_id,
        e.title AS event_title,
        e.event_date,
        e.location,
        t.qr_code,
        t.status,
        t.purchase_date,
        t.seat_number,
        t.gate
    FROM public.tickets t
    JOIN public.events e ON e.id = t.event_id
    WHERE t.user_id = auth.uid()
    ORDER BY t.purchase_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_tickets IS 'Get all tickets for the current user';

-- ============================================
-- 5. CANCEL TICKET FUNCTION
-- ============================================
-- Allow users to cancel their tickets (admin can cancel any)

CREATE OR REPLACE FUNCTION public.cancel_ticket(p_ticket_id UUID)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_ticket_user_id UUID;
    v_is_admin BOOLEAN;
    v_current_status TEXT;
BEGIN
    v_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Lütfen giriş yapınız.'
        );
    END IF;
    
    -- Check if user is admin
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = v_user_id AND role = 'admin'
    ) INTO v_is_admin;
    
    -- Get ticket details
    SELECT user_id, status INTO v_ticket_user_id, v_current_status
    FROM public.tickets
    WHERE id = p_ticket_id;
    
    -- Check if ticket exists
    IF v_ticket_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Bilet bulunamadı.'
        );
    END IF;
    
    -- Check permission (own ticket or admin)
    IF v_ticket_user_id != v_user_id AND NOT v_is_admin THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Bu işlem için yetkiniz yok.'
        );
    END IF;
    
    -- Check if already cancelled
    IF v_current_status = 'cancelled' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Bilet zaten iptal edilmiş.'
        );
    END IF;
    
    -- Cancel the ticket
    UPDATE public.tickets
    SET status = 'cancelled'
    WHERE id = p_ticket_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Bilet iptal edildi.'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Bilet iptal edilirken hata oluştu: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cancel_ticket IS 'Cancel a ticket (user can cancel own tickets, admin can cancel any)';

-- ============================================
-- Database Functions Complete
-- ============================================
