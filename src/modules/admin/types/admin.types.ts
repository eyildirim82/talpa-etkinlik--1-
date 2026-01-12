/**
 * Admin Module Types
 * 
 * Note: All types are now defined in their respective domain modules.
 * These re-exports provide backward compatibility.
 */

// Re-export from domain modules
export type { BookingAdminResponse as AdminResponse } from '@/modules/booking'
export type { DashboardStats as AdminStats } from '@/modules/reporting'
export type { AdminEvent } from '@/modules/event'
export type { AdminUser } from '@/modules/profile'
export type { AdminTicket } from '@/modules/ticket'
