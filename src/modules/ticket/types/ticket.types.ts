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

