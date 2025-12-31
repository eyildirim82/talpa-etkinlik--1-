import { supabase } from '../lib/supabase';
import { Booking } from '../../types';

/**
 * Get all bookings for an event (admin only)
 */
export const getEventBookings = async (eventId: number): Promise<Booking[]> => {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            profiles!inner(full_name, email, tckn, sicil_no)
        `)
        .eq('event_id', eventId)
        .order('booking_date', { ascending: true });

    if (error) throw error;
    return (data || []) as Booking[];
};

/**
 * Get booking by ID
 */
export const getBookingById = async (bookingId: number): Promise<Booking | null> => {
    const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .maybeSingle();

    if (error) throw error;
    return data as Booking | null;
};

/**
 * Get bookings with filters
 */
export const getBookingsWithFilters = async (
    eventId: number,
    filters?: {
        queue_status?: 'ASIL' | 'YEDEK' | 'IPTAL';
        payment_status?: 'WAITING' | 'PAID';
    }
): Promise<Booking[]> => {
    let query = supabase
        .from('bookings')
        .select(`
            *,
            profiles!inner(full_name, email, tckn, sicil_no)
        `)
        .eq('event_id', eventId)
        .order('booking_date', { ascending: true });

    if (filters?.queue_status) {
        query = query.eq('queue_status', filters.queue_status);
    }

    if (filters?.payment_status) {
        query = query.eq('payment_status', filters.payment_status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as Booking[];
};

