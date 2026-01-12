/**
 * Ticket Module Types
 */
import type { Database } from '@/shared/infrastructure/supabase/types'

export type TicketPool = Database['public']['Tables']['ticket_pool']['Row']
export type TicketPoolInsert = Database['public']['Tables']['ticket_pool']['Insert']
export type TicketPoolUpdate = Database['public']['Tables']['ticket_pool']['Update']

export interface TicketResponse {
  success: boolean
  message: string
  ticket_id?: number
  file_path?: string
}

export interface TicketStats {
  total: number
  assigned: number
  unassigned: number
}

/**
 * Admin Ticket type for admin dashboard display
 */
export interface AdminTicket {
  id: string
  event_id: string
  user_id: string
  qr_code: string
  status: 'pending' | 'paid' | 'cancelled'
  purchase_date: string
  seat_number: string | null
  gate: string | null
  event_title?: string
  user_name?: string
}
