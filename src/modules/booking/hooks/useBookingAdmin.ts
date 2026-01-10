/**
 * Booking Admin Hooks
 * React Query hooks for admin booking operations
 * 
 * @module booking/hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    cancelBookingAdmin,
    promoteFromWaitlist,
    getBookingsAdmin,
    getEventBookingsAdmin,
} from '../api/booking.admin.api'
import type { BookingFilters } from '../types/booking.types'

/**
 * Query key for booking admin operations
 */
export const BOOKING_ADMIN_QUERY_KEY = ['booking', 'admin'] as const

/**
 * Hook to get bookings with filters for admin
 */
export function useBookingsAdmin(eventId: number | null, filters?: BookingFilters) {
    return useQuery({
        queryKey: [...BOOKING_ADMIN_QUERY_KEY, eventId, filters],
        queryFn: () => eventId ? getBookingsAdmin(eventId, filters) : Promise.resolve({ data: [], count: 0 }),
        enabled: !!eventId,
    })
}

/**
 * Hook to get all bookings for an event (admin)
 */
export function useEventBookingsAdmin(eventId: number | null) {
    return useQuery({
        queryKey: [...BOOKING_ADMIN_QUERY_KEY, 'event', eventId],
        queryFn: () => eventId ? getEventBookingsAdmin(eventId) : Promise.resolve([]),
        enabled: !!eventId,
    })
}

/**
 * Hook to cancel a booking (admin)
 */
export function useCancelBookingAdmin() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ bookingId, eventId }: { bookingId: number; eventId: number }) =>
            cancelBookingAdmin(bookingId, eventId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BOOKING_ADMIN_QUERY_KEY })
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
            queryClient.invalidateQueries({ queryKey: ['activeEvent'] })
        },
    })
}

/**
 * Hook to promote from waitlist (admin)
 */
export function usePromoteFromWaitlist() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (eventId: number) => promoteFromWaitlist(eventId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BOOKING_ADMIN_QUERY_KEY })
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
        },
    })
}
