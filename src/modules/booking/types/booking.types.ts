/**
 * Booking Module Types
 */
import type { Database } from '@/shared/infrastructure/supabase/types'

export type Booking = Database['public']['Tables']['bookings']['Row']
export type BookingInsert = Database['public']['Tables']['bookings']['Insert']
export type BookingUpdate = Database['public']['Tables']['bookings']['Update']

// Queue Status Enum (matches database enum)
export type QueueStatus = 'ASIL' | 'YEDEK' | 'IPTAL'

export const QueueStatus = {
  ASIL: 'ASIL',
  YEDEK: 'YEDEK',
  IPTAL: 'IPTAL'
} as const

// Payment Status Enum (matches database enum)
export type PaymentStatus = 'WAITING' | 'PAID'

export const PaymentStatus = {
  WAITING: 'WAITING',
  PAID: 'PAID'
} as const

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

export interface BookingWithProfile extends Booking {
  profiles?: {
    full_name: string | null
    email: string | null
    tckn: string | null
    sicil_no: string | null
  } | null
}

export interface BookingsWithCount {
  data: BookingWithProfile[]
  count: number
}

