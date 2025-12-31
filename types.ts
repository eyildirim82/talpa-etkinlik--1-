import { Database } from './src/types/supabase';

// Event Status Enum (matches database enum)
export enum EventStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED'
}

// Queue Status Enum (matches database enum)
export enum QueueStatus {
  ASIL = 'ASIL',
  YEDEK = 'YEDEK',
  IPTAL = 'IPTAL'
}

// Payment Status Enum (matches database enum)
export enum PaymentStatus {
  WAITING = 'WAITING',
  PAID = 'PAID'
}

// Matches 'active_event_view' structure (backward compatibility)
export type EventData = Database['public']['Views']['active_event_view']['Row'];

// Matches 'profiles' table
export type User = Database['public']['Tables']['profiles']['Row'];

// Matches 'bookings' table
export type Booking = Database['public']['Tables']['bookings']['Row'];

// Matches 'ticket_pool' table
export type TicketPool = Database['public']['Tables']['ticket_pool']['Row'];

// Event type (from events table directly)
export type Event = Database['public']['Tables']['events']['Row'];

// Legacy ticket interface (deprecated, use Booking instead)
export interface Ticket {
  id: string;
  event_id: string;
  user_id: string;
  seat_number?: string;
  qr_code: string;
  status: 'pending' | 'paid' | 'cancelled';
  purchase_date: string;
  gate?: string;
}

// Legacy RequestStatus enum (deprecated, use QueueStatus instead)
export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  WAITLIST = 'waitlist',
  REJECTED = 'rejected'
}

// Legacy Request interface (deprecated, use Booking instead)
export interface Request {
  id: string;
  user_id: string;
  event_id: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}