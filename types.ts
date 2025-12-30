export enum EventStatus {
  BOARDING = 'BOARDING',
  CLOSED = 'CLOSED',
  STANDBY = 'STANDBY'
}

// Matches 'active_event_view' structure
export interface EventData {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  event_date: string; // ISO string from DB
  location: string;
  price: number;
  currency: string;
  total_quota: number;
  remaining_stock: number; // Calculated field from View
  is_active: boolean;
}

// Matches 'profiles' table
export interface User {
  id: string;
  full_name: string;
  talpa_sicil_no?: string;
  phone?: string;
  role: 'admin' | 'member';
}

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

export interface EventData {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  event_date: string; // ISO string from DB
  location: string;
  price: number;
  currency: string;
  total_quota: number;
  remaining_stock: number; // Calculated field from View
  is_active: boolean;
  current_user_request?: Request | null; // Optional field for UI state
}