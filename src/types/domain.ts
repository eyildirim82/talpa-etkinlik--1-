/**
 * @deprecated This file is deprecated. Import types from domain modules directly:
 * 
 * - Event types: @/modules/event
 *   - EventStatus, Event, ActiveEvent, EventData, CreateEventData, EventStats, EventResponse
 * 
 * - Booking types: @/modules/booking
 *   - QueueStatus, PaymentStatus, Booking, BookingResponse, JoinEventResult
 * 
 * - Profile types: @/modules/profile
 *   - User, Profile
 * 
 * - Ticket types: @/modules/ticket
 *   - TicketPool, AdminTicket
 * 
 * This file re-exports from domain modules for backward compatibility only.
 */

// Re-export from event module
export { EventStatus } from '@/modules/event'
export type { Event, ActiveEvent, EventData, CreateEventData, EventStats, EventResponse } from '@/modules/event'

// Re-export from booking module
export { QueueStatus, PaymentStatus } from '@/modules/booking'
export type { Booking, BookingResponse, JoinEventResult } from '@/modules/booking'

// Re-export from profile module
export type { User, Profile } from '@/modules/profile'

// Re-export from ticket module
export type { TicketPool, AdminTicket } from '@/modules/ticket'

// Legacy types - DEPRECATED, do not use
/**
 * @deprecated Use Booking from @/modules/booking instead
 */
export interface Ticket {
  id: string
  event_id: string
  user_id: string
  seat_number?: string
  qr_code: string
  status: 'pending' | 'paid' | 'cancelled'
  purchase_date: string
  gate?: string
}

/**
 * @deprecated Use QueueStatus from @/modules/booking instead
 */
export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  WAITLIST = 'waitlist',
  REJECTED = 'rejected'
}

/**
 * @deprecated Use Booking from @/modules/booking instead
 */
export interface Request {
  id: string
  user_id: string
  event_id: string
  status: RequestStatus
  created_at: string
  updated_at: string
}
