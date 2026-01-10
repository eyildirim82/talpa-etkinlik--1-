/**
 * Event Admin API
 * Admin-only operations for event management
 * 
 * @module event/api
 */
import { createBrowserClient } from '@/shared/infrastructure/supabase'
import { checkAdmin } from '@/modules/auth'
import { logger } from '@/shared/utils/logger'
import type { Event, EventUpdate, CreateEventData, EventResponse } from '../types/event.types'

/**
 * Admin Event with computed fields for dashboard display
 */
export interface AdminEvent extends Event {
    asil_count: number
    yedek_count: number
    paid_count: number
    // Backward compatibility fields
    image_url?: string | null
    location?: string | null
    total_quota?: number
    is_active?: boolean
    sold_tickets?: number
}

/**
 * Get all events for admin dashboard
 * Includes booking counts for each event
 */
export async function getAllEventsAdmin(): Promise<AdminEvent[]> {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw error

    // Get booking counts for each event
    const eventsWithCounts = await Promise.all(
        (data || []).map(async (event) => {
            const eventSupabase = createBrowserClient()
            const { count: asilCount } = await eventSupabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', event.id)
                .eq('queue_status', 'ASIL')

            const { count: yedekCount } = await eventSupabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', event.id)
                .eq('queue_status', 'YEDEK')

            const { count: paidCount } = await eventSupabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', event.id)
                .eq('payment_status', 'PAID')

            return {
                ...event,
                asil_count: asilCount || 0,
                yedek_count: yedekCount || 0,
                paid_count: paidCount || 0,
                // Backward compatibility
                image_url: event.banner_image,
                location: event.location_url,
                total_quota: event.quota_asil + event.quota_yedek,
                is_active: event.status === 'ACTIVE',
                sold_tickets: (asilCount || 0) + (yedekCount || 0)
            }
        })
    )

    return eventsWithCounts
}

/**
 * Create a new event (admin only)
 */
export async function createEventAdmin(eventData: CreateEventData): Promise<Event> {
    const isAdmin = await checkAdmin()
    if (!isAdmin) {
        throw new Error('Yetkisiz erişim.')
    }

    const supabase = createBrowserClient()
    const { data, error } = await supabase
        .from('events')
        .insert({
            title: eventData.title,
            description: eventData.description,
            banner_image: eventData.banner_image,
            event_date: eventData.event_date,
            location_url: eventData.location_url,
            price: eventData.price,
            quota_asil: eventData.quota_asil,
            quota_yedek: eventData.quota_yedek,
            cut_off_date: eventData.cut_off_date,
            status: eventData.status || 'DRAFT'
        })
        .select()
        .single()

    if (error) {
        logger.error('Create Event Error:', error)
        throw error
    }

    return data
}

/**
 * Update an event (admin only)
 */
export async function updateEventAdmin(eventId: number, updates: Partial<AdminEvent>): Promise<Event> {
    const isAdmin = await checkAdmin()
    if (!isAdmin) {
        throw new Error('Yetkisiz erişim.')
    }

    const supabase = createBrowserClient()

    // Map backward compatibility fields
    const updateData: EventUpdate = {}
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.banner_image !== undefined) updateData.banner_image = updates.banner_image
    if (updates.image_url !== undefined) updateData.banner_image = updates.image_url // Backward compat
    if (updates.event_date !== undefined) updateData.event_date = updates.event_date
    if (updates.location_url !== undefined) updateData.location_url = updates.location_url
    if (updates.location !== undefined) updateData.location_url = updates.location // Backward compat
    if (updates.price !== undefined) updateData.price = updates.price
    if (updates.quota_asil !== undefined) updateData.quota_asil = updates.quota_asil
    if (updates.quota_yedek !== undefined) updateData.quota_yedek = updates.quota_yedek
    if (updates.cut_off_date !== undefined) updateData.cut_off_date = updates.cut_off_date
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.is_active !== undefined) {
        // Backward compatibility: convert is_active to status
        updateData.status = updates.is_active ? 'ACTIVE' : 'ARCHIVED'
    }

    const { data, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', eventId)
        .select()
        .single()

    if (error) {
        logger.error('Update Event Error:', error)
        throw error
    }

    return data
}

/**
 * Delete an event (admin only)
 */
export async function deleteEventAdmin(eventId: number): Promise<void> {
    const isAdmin = await checkAdmin()
    if (!isAdmin) {
        throw new Error('Yetkisiz erişim.')
    }

    const supabase = createBrowserClient()
    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

    if (error) {
        logger.error('Delete Event Error:', error)
        throw error
    }
}

/**
 * Set an event as active (admin only)
 * Uses RPC function for atomic operation
 */
export async function setActiveEventAdmin(eventId: number): Promise<EventResponse> {
    const isAdmin = await checkAdmin()
    if (!isAdmin) {
        return { success: false, message: 'Yetkisiz erişim.' }
    }

    const supabase = createBrowserClient()
    const { data, error } = await supabase.rpc('set_active_event', {
        p_event_id: eventId
    })

    if (error) {
        logger.error('Set Active Event RPC Error:', error)
        return { success: false, message: 'Bağlantı hatası.' }
    }

    if (!data.success) {
        return { success: false, message: data.error || 'Etkinlik aktif edilemedi.' }
    }

    return { success: true, message: data.message || 'Etkinlik aktif edildi.' }
}

/**
 * Get event statistics (admin only)
 */
export async function getEventStatsAdmin(eventId: number): Promise<EventResponse> {
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