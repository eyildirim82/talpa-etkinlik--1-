import { createBrowserClient } from '@/shared/infrastructure/supabase'
import type { ActiveEvent, CreateEventData, EventStats, EventResponse } from '../types/event.types'

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

  // Check both is_admin and role for backward compatibility
  return !!(profile?.is_admin || profile?.role === 'admin')
}

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

export async function createEvent(eventData: CreateEventData): Promise<EventResponse> {
  const isAdmin = await checkAdmin()
  if (!isAdmin) {
    return { success: false, message: 'Yetkisiz erişim.' }
  }
  const supabase = createBrowserClient()

  const {
    title,
    description,
    event_date,
    location_url,
    price,
    quota_asil,
    quota_yedek,
    cut_off_date,
    banner_image,
    status = 'DRAFT'
  } = eventData

  const eventDate = new Date(event_date).toISOString()
  const cutOffDateISO = cut_off_date ? new Date(cut_off_date).toISOString() : eventDate

  const { error } = await supabase
    .from('events')
    .insert({
      title,
      description,
      event_date: eventDate,
      location_url: location_url,
      price,
      quota_asil,
      quota_yedek,
      cut_off_date: cutOffDateISO,
      banner_image: banner_image,
      status
    })

  if (error) {
    console.error('Create Event Error:', error)
    return { success: false, message: 'Etkinlik oluşturulamadı.' }
  }

  return { success: true, message: 'Etkinlik başarıyla oluşturuldu.' }
}

export async function setActiveEvent(eventId: number): Promise<EventResponse> {
  const isAdmin = await checkAdmin()
  if (!isAdmin) {
    return { success: false, message: 'Yetkisiz erişim.' }
  }
  const supabase = createBrowserClient()

  const { data, error } = await supabase.rpc('set_active_event', {
    p_event_id: eventId
  })

  if (error) {
    console.error('Set Active RPC Error:', error)
    return { success: false, message: 'Bağlantı hatası.' }
  }

  if (!data.success) {
    return { success: false, message: data.error || 'Etkinlik aktif edilemedi.' }
  }

  return { success: true, message: data.message || 'Etkinlik aktif edildi.' }
}

export async function getEventStats(eventId: number): Promise<EventResponse> {
  const isAdmin = await checkAdmin()
  if (!isAdmin) {
    return { success: false, message: 'Yetkisiz erişim.' }
  }
  const supabase = createBrowserClient()

  // Get event with booking counts
  const { data: event } = await supabase
    .from('events')
    .select('quota_asil, quota_yedek, price')
    .eq('id', eventId)
    .single()

  if (!event) {
    return { success: false, message: 'Etkinlik bulunamadı.' }
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
    success: true,
    message: 'İstatistikler başarıyla alındı.',
    stats: {
      quota_asil: event.quota_asil,
      quota_yedek: event.quota_yedek,
      asil_count: asilCount || 0,
      yedek_count: yedekCount || 0,
      paid_count: paidCount || 0,
      revenue: (paidCount || 0) * event.price
    }
  }
}

