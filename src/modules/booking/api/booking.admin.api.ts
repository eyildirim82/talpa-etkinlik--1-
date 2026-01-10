/**
 * Booking Admin API
 * Admin-only operations for booking management
 * 
 * @module booking/api
 */
import { createBrowserClient } from '@/shared/infrastructure/supabase'
import { checkAdmin } from '@/modules/auth'
import { logger } from '@/shared/utils/logger'
import type { BookingResponse, BookingWithProfile, BookingFilters, BookingsWithCount } from '../types/booking.types'

/**
 * Admin response type for booking operations
 */
export interface BookingAdminResponse {
    success: boolean
    message: string
}

/**
 * Cancel a booking (admin only)
 * Also triggers promote from waitlist
 */
export async function cancelBookingAdmin(bookingId: number, eventId: number): Promise<BookingAdminResponse> {
    const isAdmin = await checkAdmin()
    if (!isAdmin) {
        return { success: false, message: 'Yetkisiz erişim.' }
    }

    const supabase = createBrowserClient()

    // 1. Update status to IPTAL
    const { error: updateError } = await supabase
        .from('bookings')
        .update({ queue_status: 'IPTAL', payment_status: 'WAITING' })
        .eq('id', bookingId)

    if (updateError) {
        logger.error('Cancel Booking Error:', updateError)
        return { success: false, message: 'İptal işlemi başarısız.' }
    }

    // 2. Trigger promote_from_waitlist
    const promoteResult = await promoteFromWaitlist(eventId)

    if (promoteResult.success) {
        return { success: true, message: `Başvuru iptal edildi. ${promoteResult.message}` }
    }

    return { success: true, message: 'Başvuru iptal edildi. Yedek listeden geçiş yapılamadı veya liste boş.' }
}

/**
 * Promote first yedek to asil (admin only)
 * Uses RPC function for atomic operation
 */
export async function promoteFromWaitlist(eventId: number): Promise<BookingAdminResponse> {
    const supabase = createBrowserClient()

    const { data, error } = await supabase.rpc('promote_from_waitlist', {
        event_id_param: eventId
    })

    if (error) {
        logger.error('Promote Waitlist RPC Error:', error)
        return { success: false, message: 'Bağlantı hatası.' }
    }

    if (data.status === 'error') {
        return { success: false, message: data.message || 'Yedekten asile geçiş yapılamadı.' }
    }

    return { success: true, message: data.message || 'Yedek listeden asile çıkarıldı.' }
}

/**
 * Get bookings with filters (admin view)
 * Returns paginated bookings with profile information
 */
export async function getBookingsAdmin(
    eventId: number,
    filters?: BookingFilters
): Promise<BookingsWithCount> {
    const isAdmin = await checkAdmin()
    if (!isAdmin) {
        return { data: [], count: 0 }
    }

    const supabase = createBrowserClient()
    let query = supabase
        .from('bookings')
        .select(`
            *,
            profiles!inner(full_name, email, tckn, sicil_no)
        `, { count: 'exact' })
        .eq('event_id', eventId)
        .order('booking_date', { ascending: true })

    if (filters?.queue_status) {
        query = query.eq('queue_status', filters.queue_status)
    }

    if (filters?.payment_status) {
        query = query.eq('payment_status', filters.payment_status)
    }

    // Pagination
    if (filters?.page !== undefined && filters?.pageSize !== undefined) {
        const from = (filters.page - 1) * filters.pageSize
        const to = from + filters.pageSize - 1
        query = query.range(from, to)
    }

    const { data, error, count } = await query

    if (error) {
        logger.error('Get Bookings Admin Error:', error)
        throw error
    }

    return { data: (data || []) as unknown as BookingWithProfile[], count: count || 0 }
}

/**
 * Get all bookings for an event (admin only)
 */
export async function getEventBookingsAdmin(eventId: number): Promise<BookingWithProfile[]> {
    const isAdmin = await checkAdmin()
    if (!isAdmin) {
        return []
    }

    const supabase = createBrowserClient()
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            profiles!inner(full_name, email, tckn, sicil_no)
        `)
        .eq('event_id', eventId)
        .order('booking_date', { ascending: true })

    if (error) {
        logger.error('Get Event Bookings Admin Error:', error)
        throw error
    }

    return (data || []) as unknown as BookingWithProfile[]
}
