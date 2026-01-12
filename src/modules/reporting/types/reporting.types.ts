/**
 * Reporting Module Types
 * 
 * @module reporting/types
 */

/**
 * Statistics for a single event
 */
export interface EventStats {
  quota_asil: number
  quota_yedek: number
  asil_count: number
  yedek_count: number
  paid_count: number
  revenue: number
}

/**
 * Dashboard statistics for admin overview
 */
export interface DashboardStats {
  totalEvents: number
  activeEvent: { id: number; title: string } | null
  totalBookings: number
  asilCount: number
  yedekCount: number
  paidCount: number
  totalRevenue: number
  occupancyRate: number
}
