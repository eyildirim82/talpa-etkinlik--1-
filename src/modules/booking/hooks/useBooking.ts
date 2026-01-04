import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { joinEvent, cancelBooking } from '@/modules/booking/api/booking.api'
import { createClient } from '@/utils/supabase/client'
import type { QueueStatus } from '../types/booking.types'

export function useJoinEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ eventId, consentKvkk, consentPayment }: {
      eventId: number, consentKvkk: boolean, consentPayment: boolean
    }) => {
      const result = await joinEvent(eventId, consentKvkk, consentPayment)
      if (!result.success) throw new Error(result.message)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-booking'] })
      queryClient.invalidateQueries({ queryKey: ['active-event'] })
      // Invalidate profile to update potential quota/role info if needed
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    }
  })
}

export function useCancelBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bookingId: number) => {
      const result = await cancelBooking(bookingId)
      if (!result.success) throw new Error(result.message)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-booking'] })
      queryClient.invalidateQueries({ queryKey: ['active-event'] })
    }
  })
}

export function useUserBooking(eventId: number) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['user-booking', eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle()
      return data
    }
  })
}
