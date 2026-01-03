import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { joinEvent, getUserBooking, cancelBooking, getBookingQueuePosition } from '../api/booking.api'
import type { Booking, QueueStatus } from '../types/booking.types'
import { useSession } from '@/modules/auth'

/**
 * Get user's booking for a specific event
 */
export function useBooking(eventId: number | null) {
  return useQuery({
    queryKey: ['booking', eventId],
    queryFn: () => eventId ? getUserBooking(eventId) : null,
    enabled: !!eventId,
  })
}

/**
 * Join event mutation
 */
export function useJoinEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      eventId, 
      consentKvkk, 
      consentPayment 
    }: { 
      eventId: number
      consentKvkk: boolean
      consentPayment: boolean
    }) => {
      return await joinEvent(eventId, consentKvkk, consentPayment)
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        // Invalidate booking query to refetch status
        queryClient.invalidateQueries({ queryKey: ['booking', variables.eventId] })
        queryClient.invalidateQueries({ queryKey: ['activeEvent'] })
      }
    },
  })
}

/**
 * Cancel booking mutation
 */
export function useCancelBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bookingId: number) => {
      return await cancelBooking(bookingId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking'] })
      queryClient.invalidateQueries({ queryKey: ['activeEvent'] })
    },
  })
}

/**
 * Get booking queue position (for yedek list)
 */
export function useBookingQueuePosition(eventId: number | null, userId: string | null) {
  return useQuery({
    queryKey: ['bookingQueuePosition', eventId, userId],
    queryFn: () => eventId && userId ? getBookingQueuePosition(eventId, userId) : null,
    enabled: !!eventId && !!userId,
  })
}

