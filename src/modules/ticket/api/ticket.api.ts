import { createBrowserClient } from '@/shared/infrastructure/supabase'
import { checkAdmin } from '@/shared/services/authz'
import type { TicketResponse, TicketPool, TicketStats } from '../types/ticket.types'

/**
 * Assign ticket from pool to booking (admin only)
 */
export async function assignTicket(bookingId: number): Promise<TicketResponse> {
  const isAdmin = await checkAdmin()
  if (!isAdmin) {
    return { success: false, message: 'Yetkisiz erişim.' }
  }
  const supabase = createBrowserClient()

  const { data, error } = await supabase.rpc('assign_ticket', {
    booking_id_param: bookingId
  })

  if (error) {
    console.error('Assign Ticket RPC Error:', error)
    return { success: false, message: 'Bağlantı hatası.' }
  }

  if (data.status === 'error') {
    return { success: false, message: data.message || 'Bilet atanamadı.' }
  }

  return {
    success: true,
    message: data.message || 'Bilet başarıyla atandı.',
    ticket_id: data.ticket_id,
    file_path: data.file_path
  }
}

/**
 * Get ticket pool for an event
 */
export async function getTicketPool(eventId: number, page: number = 1, pageSize: number = 20): Promise<{ data: TicketPool[]; count: number }> {
  const supabase = createBrowserClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('ticket_pool')
    .select('*', { count: 'exact' })
    .eq('event_id', eventId)
    .order('file_name', { ascending: true })
    .range(from, to)

  if (error) throw error
  return { data: (data || []) as TicketPool[], count: count || 0 }
}

/**
 * Get ticket stats for an event
 */
export async function getTicketStats(eventId: number): Promise<TicketStats> {
  const supabase = createBrowserClient()

  const { count: total } = await supabase
    .from('ticket_pool')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)

  const { count: assigned } = await supabase
    .from('ticket_pool')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('is_assigned', true)

  return {
    total: total || 0,
    assigned: assigned || 0,
    unassigned: (total || 0) - (assigned || 0)
  }
}

