/**
 * Booking Module Types
 */
import type { Database } from '@/shared/infrastructure/supabase/types'

export type Booking = Database['public']['Tables']['bookings']['Row']
export type BookingInsert = Database['public']['Tables']['bookings']['Insert']
export type BookingUpdate = Database['public']['Tables']['bookings']['Update']

export type QueueStatus = 'ASIL' | 'YEDEK' | 'IPTAL'
export type PaymentStatus = 'WAITING' | 'PAID'

export interface JoinEventResult {
  success: boolean
  queue?: QueueStatus
  message: string
}

export interface BookingResponse {
  success: boolean
  message: string
}

export interface BookingFilters {
  queue_status?: QueueStatus
  payment_status?: PaymentStatus
  page?: number
  pageSize?: number
}

export interface BookingsWithCount {
  data: Booking[]
  count: number
}

