import { Database } from './src/types/supabase';

export enum EventStatus {
  BOARDING = 'BOARDING',
  CLOSED = 'CLOSED',
  STANDBY = 'STANDBY'
}

// Matches 'active_event_view' structure. Note: remaining_stock is added to the view manually in SQL but should be in the generated types if the view was generated correctly.
export type EventData = Database['public']['Views']['active_event_view']['Row'];

// Matches 'profiles' table
export type User = Database['public']['Tables']['profiles']['Row'];

// Matches 'tickets' table
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

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  WAITLIST = 'waitlist',
  REJECTED = 'rejected'
}

export interface Request {
  id: string;
  user_id: string;
  event_id: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}