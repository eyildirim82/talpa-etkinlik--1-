import { createBrowserClient } from '@/shared/infrastructure/supabase'
import { logger } from '@/shared/utils/logger'
import type { Booking, JoinEventResult, BookingResponse, BookingFilters, BookingsWithCount, QueueStatus, BookingWithProfile } from '../types/booking.types'

/**
 * Join event queue system
 * Calls join_event RPC function which handles race conditions and queue assignment
 */
export async function joinEvent(
  eventId: number,
  consentKvkk: boolean,
  consentPayment: boolean
): Promise<JoinEventResult> {
  const supabase = createBrowserClient()

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: 'İşlem için giriş yapmalısınız.' }
  }

  // 2. Validate consents
  if (!consentKvkk || !consentPayment) {
    return { success: false, message: 'KVKK ve ödeme onaylarını vermelisiniz.' }
  }

  try {
    // 3. Call Database RPC - Returns JSON with status, queue, or error
    const { data, error } = await supabase.rpc('join_event', {
      event_id_param: eventId
    })

    // Handle RPC call errors (network, permission, etc.)
    if (error) {
      logger.error('Join Event RPC Error:', error)
      return { success: false, message: 'Bağlantı hatası. Lütfen tekrar deneyin.' }
    }

    // Handle business logic errors from function
    if (data.status === 'error') {
      return { success: false, message: data.message || 'Başvuru yapılamadı.' }
    }

    // Success - Return queue status
    return {
      success: true,
      queue: data.queue as QueueStatus,
      message: data.message || 'Başvurunuz başarıyla alındı!'
    }

  } catch (err) {
    logger.error('Unexpected Error:', err)
    return { success: false, message: 'Beklenmeyen bir hata oluştu.' }
  }
}

/**
 * Get user's booking for a specific event
 */
export async function getUserBooking(eventId: number): Promise<Booking | null> {
  const supabase = createBrowserClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .maybeSingle()

    if (error) {
      logger.error('Error fetching user booking:', error)
      return null
    }

    return data as Booking | null
  } catch (error) {
    logger.warn('Failed to fetch user booking', error)
    return null
  }
}

/**
 * Cancel booking (user can cancel before cut-off date)
 */
export async function cancelBooking(bookingId: number): Promise<BookingResponse> {
  const supabase = createBrowserClient()

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: 'İşlem için giriş yapmalısınız.' }
  }

  try {
    // 2. Get booking to check ownership and cut-off date
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*, events!inner(cut_off_date)')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !booking) {
      return { success: false, message: 'Başvuru bulunamadı.' }
    }

    // 3. Check cut-off date
    const cutOffDate = new Date((booking as any).events.cut_off_date)
    const now = new Date()
    if (now > cutOffDate) {
      return { success: false, message: 'İptal tarihi geçmiş. Başvurunuzu iptal edemezsiniz.' }
    }

    // 4. Update booking status to IPTAL
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ queue_status: 'IPTAL' })
      .eq('id', bookingId)
      .eq('user_id', user.id)

    if (updateError) {
      logger.error('Error canceling booking:', updateError)
      return { success: false, message: 'Başvuru iptal edilemedi. Lütfen tekrar deneyin.' }
    }

    return { success: true, message: 'Başvurunuz iptal edildi.' }

  } catch (err) {
    logger.error('Unexpected Error:', err)
    return { success: false, message: 'Beklenmeyen bir hata oluştu.' }
  }
}

/**
 * Get booking queue position (for yedek list)
 */
export async function getBookingQueuePosition(eventId: number, userId: string): Promise<number | null> {
  const supabase = createBrowserClient()

  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select('booking_date, queue_status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single()

    if (!booking || booking.queue_status !== 'YEDEK') {
      return null
    }

    // Count bookings before this one in yedek list
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('queue_status', 'YEDEK')
      .lt('booking_date', booking.booking_date)

    return (count || 0) + 1 // Position (1-indexed)
  } catch (error) {
    logger.error('Error getting queue position:', error)
    return null
  }
}

/**
 * Get all bookings for an event (admin only)
 */
export const getEventBookings = async (eventId: number): Promise<Booking[]> => {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      profiles!inner(full_name, email, tckn, sicil_no)
    `)
    .eq('event_id', eventId)
    .order('booking_date', { ascending: true })

  if (error) throw error
  return (data || []) as Booking[]
}

/**
 * Get booking by ID
 */
export const getBookingById = async (bookingId: number): Promise<Booking | null> => {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle()

  if (error) throw error
  return data as Booking | null
}

/**
 * Get bookings with filters
 */
export const getBookingsWithFilters = async (
  eventId: number,
  filters?: BookingFilters
): Promise<BookingsWithCount> => {
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

  if (error) throw error
  return { data: (data || []) as unknown as BookingWithProfile[], count: count || 0 }
}

