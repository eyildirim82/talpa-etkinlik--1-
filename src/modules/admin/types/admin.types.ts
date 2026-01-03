/**
 * Admin Module Types
 */

export interface AdminResponse {
  success: boolean
  message: string
}

export interface AdminStats {
  totalEvents: number
  activeEvent: { id: number; title: string } | null
  totalBookings: number
  asilCount: number
  yedekCount: number
  paidCount: number
  totalRevenue: number
  occupancyRate: number
}

export interface AdminEvent {
  id: number
  title: string
  description: string | null
  banner_image: string | null
  event_date: string
  location_url: string | null
  price: number
  quota_asil: number
  quota_yedek: number
  cut_off_date: string
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  created_at: string
  updated_at: string
  asil_count?: number
  yedek_count?: number
  paid_count?: number
  // Backward compatibility
  image_url?: string | null
  location?: string | null
  total_quota?: number
  is_active?: boolean
  sold_tickets?: number
}

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

export interface AdminUser {
  id: string
  full_name: string
  email?: string
  talpa_sicil_no: string | null
  phone: string | null
  role: 'admin' | 'member'
  created_at: string
  updated_at: string
}

