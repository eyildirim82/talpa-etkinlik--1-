/**
 * Reporting API
 * Statistics and reporting operations
 * 
 * @module reporting/api
 */
import { createBrowserClient } from '@/shared/infrastructure/supabase'
import { checkAdmin } from '@/modules/auth'
import { logger } from '@/shared/utils/logger'
import type { EventStats, DashboardStats } from '../types/reporting.types'

/**
 * Get event statistics
 */
export async function getEventStats(eventId: number): Promise<EventStats | null> {
  const isAdmin = await checkAdmin()
  if (!isAdmin) {
    return null
  }
  const supabase = createBrowserClient()

  // Get event with booking counts
  const { data: event } = await supabase
    .from('events')
    .select('quota_asil, quota_yedek, price')
    .eq('id', eventId)
    .single()

  if (!event) {
    return null
  }

  // Get booking counts
  const { count: asilCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('queue_status', 'ASIL')

  const { count: yedekCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('queue_status', 'YEDEK')

  const { count: paidCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('payment_status', 'PAID')

  return {
    quota_asil: event.quota_asil,
    quota_yedek: event.quota_yedek,
    asil_count: asilCount || 0,
    yedek_count: yedekCount || 0,
    paid_count: paidCount || 0,
    revenue: (paidCount || 0) * event.price
  }
}

/**
 * Get dashboard statistics for admin overview
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const isAdmin = await checkAdmin()
  if (!isAdmin) {
    throw new Error('Yetkisiz erişim.')
  }

  const supabase = createBrowserClient()

  try {
    // Get all events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')

    if (eventsError) throw eventsError

    // Get active event directly from database (more secure, ensures single active event)
    const { data: activeEventData, error: activeEventError } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'ACTIVE')
      .maybeSingle()

    if (activeEventError && activeEventError.code !== 'PGRST116') {
      logger.error('Get Active Event Error:', activeEventError)
    }

    const activeEvent = activeEventData || null

    // Get all bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*, events!inner(price)')
      .in('queue_status', ['ASIL', 'YEDEK'])

    if (bookingsError) throw bookingsError

    const totalBookings = bookings?.length || 0
    const asilCount = bookings?.filter((b: any) => b.queue_status === 'ASIL').length || 0
    const yedekCount = bookings?.filter((b: any) => b.queue_status === 'YEDEK').length || 0
    const paidCount = bookings?.filter((b: any) => b.payment_status === 'PAID').length || 0
    const totalRevenue = bookings?.reduce((sum, b: any) => {
      if (b.payment_status === 'PAID') {
        return sum + (b.events?.price || 0)
      }
      return sum
    }, 0) || 0

    // Calculate occupancy for active event
    let occupancyRate = 0
    if (activeEvent) {
      const activeEventBookings = bookings?.filter((b: any) => b.event_id === activeEvent.id).length || 0
      const totalQuota = activeEvent.quota_asil + activeEvent.quota_yedek
      occupancyRate = totalQuota > 0
        ? Math.round((activeEventBookings / totalQuota) * 100)
        : 0
    }

    return {
      totalEvents: events?.length || 0,
      activeEvent: activeEvent ? { id: activeEvent.id, title: activeEvent.title } : null,
      totalBookings,
      asilCount,
      yedekCount,
      paidCount,
      totalRevenue,
      occupancyRate,
    }
  } catch (err) {
    logger.error('Dashboard Stats Error:', err)
    throw err
  }
}
