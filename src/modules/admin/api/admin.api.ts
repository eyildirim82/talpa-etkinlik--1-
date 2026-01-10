/**
 * @deprecated Admin API - Use domain module APIs instead
 * 
 * This file is kept for backward compatibility only.
 * New code should import from domain modules:
 * 
 * - Booking operations: @/modules/booking
 *   - cancelBookingAdmin, exportBookingsToExcel
 * 
 * - Event operations: @/modules/event
 *   - createEventAdmin, updateEventAdmin, deleteEventAdmin, setActiveEventAdmin
 * 
 * - Profile operations: @/modules/profile
 *   - getAllUsersAdmin, updateUserRoleAdmin
 * 
 * - Reporting: @/modules/reporting
 *   - getDashboardStats, getEventStats
 */

// Re-export from domain modules for backward compatibility
export { cancelBookingAdmin as cancelBooking, exportBookingsToExcel } from '@/modules/booking'
export type { BookingAdminResponse as AdminResponse } from '@/modules/booking'
