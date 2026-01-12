/**
 * Event User API
 * User-facing operations for events
 * 
 * Note: Admin operations have been moved to event.admin.api.ts
 * 
 * @module event/api
 */
import { createBrowserClient } from '@/shared/infrastructure/supabase'
import type { ActiveEvent } from '../types/event.types'

/**
 * Get the currently active event
 * User-facing API - no admin check required
 */
export const getActiveEvent = async (): Promise<ActiveEvent | null> => {
  const supabase = createBrowserClient()

  // Try view first (backward compatibility)
  const { data: viewData, error: viewError } = await supabase
    .from('active_event_view')
    .select('*')
    .maybeSingle()

  if (!viewError && viewData) {
    return viewData
  }

  // Fallback: get active event directly
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'ACTIVE')
    .maybeSingle()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  if (!data) return null

  // Calculate remaining stock
  const { count: asilCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', data.id)
    .eq('queue_status', 'ASIL')

  const { count: yedekCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', data.id)
    .eq('queue_status', 'YEDEK')

  const totalBookings = (asilCount || 0) + (yedekCount || 0)
  const remainingStock = (data.quota_asil + data.quota_yedek) - totalBookings

  // Return in backward compatible format
  return {
    ...data,
    id: data.id.toString(), // Convert BIGINT to string for compatibility
    image_url: data.banner_image,
    location: data.location_url || '',
    currency: 'TL',
    total_quota: data.quota_asil + data.quota_yedek,
    is_active: true,
    remaining_stock: Math.max(remainingStock, 0)
  } as ActiveEvent
}
