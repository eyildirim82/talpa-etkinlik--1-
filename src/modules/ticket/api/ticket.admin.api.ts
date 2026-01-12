/**
 * Ticket Admin API
 * Admin-only operations for ticket management
 * 
 * @module ticket/api
 */
import { createBrowserClient } from '@/shared/infrastructure/supabase'
import { checkAdmin } from '@/modules/auth'
import { logger } from '@/shared/utils/logger'
import type { AdminTicket, TicketResponse } from '../types/ticket.types'

/**
 * Get all tickets for admin (with user and event info)
 */
export async function getTicketsAdmin(eventId?: string): Promise<AdminTicket[]> {
    const isAdmin = await checkAdmin()
    if (!isAdmin) {
        return []
    }

    const supabase = createBrowserClient()
    let query = supabase
        .from('tickets')
        .select(`
            *,
            events!inner(title),
            profiles!inner(full_name)
        `)
        .order('purchase_date', { ascending: false })

    if (eventId) {
        query = query.eq('event_id', eventId)
    }

    const { data, error } = await query
    if (error) {
        logger.error('Get Tickets Admin Error:', error)
        throw error
    }

    return (data || []).map((ticket: any) => ({
        ...ticket,
        event_title: ticket.events?.title,
        user_name: ticket.profiles?.full_name,
    }))
}

/**
 * Cancel ticket (admin only)
 * Uses RPC function for atomic operation
 */
export async function cancelTicketAdmin(ticketId: string): Promise<TicketResponse> {
    const isAdmin = await checkAdmin()
    if (!isAdmin) {
        return { success: false, message: 'Yetkisiz erişim.' }
    }

    const supabase = createBrowserClient()
    const { data, error } = await supabase.rpc('cancel_ticket', {
        p_ticket_id: ticketId,
    })

    if (error) {
        logger.error('Cancel Ticket RPC Error:', error)
        return { success: false, message: 'Bağlantı hatası.' }
    }

    if (data && !data.success) {
        return { success: false, message: data.error || 'Bilet iptal edilemedi.' }
    }

    return { success: true, message: 'Bilet başarıyla iptal edildi.' }
}
