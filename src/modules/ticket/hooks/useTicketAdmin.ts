/**
 * Ticket Admin Hooks
 * React Query hooks for admin ticket operations
 * 
 * @module ticket/hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTicketsAdmin, cancelTicketAdmin } from '../api/ticket.admin.api'
import type { AdminTicket } from '../types/ticket.types'

export const TICKET_ADMIN_QUERY_KEY = ['admin', 'tickets'] as const

/**
 * Hook to get all tickets for admin dashboard
 */
export function useAdminTickets(eventId?: string) {
    return useQuery({
        queryKey: [...TICKET_ADMIN_QUERY_KEY, eventId],
        queryFn: async (): Promise<AdminTicket[]> => {
            return getTicketsAdmin(eventId)
        },
    })
}

/**
 * Hook to cancel a ticket (admin only)
 */
export function useCancelTicket() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (ticketId: string) => {
            const result = await cancelTicketAdmin(ticketId)
            if (!result.success) {
                throw new Error(result.message)
            }
            return result
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TICKET_ADMIN_QUERY_KEY })
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
        },
    })
}
