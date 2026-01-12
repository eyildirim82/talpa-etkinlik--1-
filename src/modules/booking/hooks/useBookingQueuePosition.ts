import { useQuery } from '@tanstack/react-query'
import { getBookingQueuePosition } from '../api/booking.api'

export function useBookingQueuePosition(eventId: number | null, userId: string | null) {
  return useQuery({
    queryKey: ['booking-queue-position', eventId, userId],
    queryFn: async () => {
      if (!eventId || !userId) return null
      return getBookingQueuePosition(eventId, userId)
    },
    enabled: !!eventId && !!userId
  })
}
