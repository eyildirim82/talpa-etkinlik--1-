/**
 * Admin Hooks
 * Re-exports domain module hooks for backward compatibility
 * 
 * @module admin/hooks
 * @deprecated Import directly from domain modules (@/modules/event, @/modules/booking, @/modules/profile, @/modules/reporting, @/modules/ticket)
 */

// Re-export event admin hooks
export {
    useAdminEvents,
    useCreateEvent,
    useUpdateEvent,
    useDeleteEvent,
    useSetActiveEvent
} from '@/modules/event'

// Re-export booking admin hooks
export {
    useCancelBookingAdmin,
    usePromoteFromWaitlist
} from '@/modules/booking'

// Re-export profile admin hooks
export {
    useAdminUsers,
    useUpdateUserRole
} from '@/modules/profile'

// Re-export reporting hooks
export { useDashboardStats as useAdminStats } from '@/modules/reporting'

// Re-export ticket admin hooks
export { useAdminTickets, useCancelTicket } from '@/modules/ticket'
