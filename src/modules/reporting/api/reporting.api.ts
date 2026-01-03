import { createBrowserClient } from '@/shared/infrastructure/supabase'
import type { EventStats } from '../types/reporting.types'

// Helper to check admin role
async function checkAdmin(): Promise<boolean> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, role')
    .eq('id', user.id)
    .single()

  return !!(profile?.is_admin || profile?.role === 'admin')
}

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

