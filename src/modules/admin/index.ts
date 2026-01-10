// Admin Module Public API
// 
// Note: This module is an orchestration layer that re-exports domain module functionality.
// For new code, prefer importing directly from domain modules:
// - Event operations: @/modules/event
// - Booking operations: @/modules/booking  
// - Profile operations: @/modules/profile
// - Reporting/Stats: @/modules/reporting

// Legacy API (deprecated - use domain module APIs)
export * from './api/admin.api'

// Types
export * from './types/admin.types'

// Utils (deprecated - use domain module services)
export * from './utils/admin.utils'

// Hooks - Re-exports from domain modules for backward compatibility
export {
    // Event hooks (from @/modules/event)
    useAdminEvents,
    useCreateEvent,
    useUpdateEvent,
    useDeleteEvent,
    useSetActiveEvent,
    // Booking hooks (from @/modules/booking)
    useCancelBookingAdmin,
    usePromoteFromWaitlist,
    // Profile hooks (from @/modules/profile)
    useAdminUsers,
    useUpdateUserRole,
    // Reporting hooks (from @/modules/reporting)
    useAdminStats,
    // Legacy ticket hooks (kept in admin for now)
    useAdminTickets,
    useCancelTicket
} from './hooks/useAdmin'

// Also export AdminEvent type from event module for backward compat
export type { AdminEvent } from '@/modules/event'

// Components
export { AdminLayout } from './components/AdminLayout'
export type { AdminTab } from './components/AdminLayout'
export { OverviewPanel } from './components/OverviewPanel'
export { EventsPanel } from './components/EventsPanel'
export { TicketsPanel } from './components/TicketsPanel'
export { UsersPanel } from './components/UsersPanel'
