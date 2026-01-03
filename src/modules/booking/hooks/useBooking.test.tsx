import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import {
  useBooking,
  useJoinEvent,
  useCancelBooking,
  useBookingQueuePosition,
} from './useBooking'
import * as bookingApi from '../api/booking.api'
import { createMockBooking } from '@/shared/test-utils/test-data'

// Mock dependencies
vi.mock('../api/booking.api', () => ({
  joinEvent: vi.fn(),
  getUserBooking: vi.fn(),
  cancelBooking: vi.fn(),
  getBookingQueuePosition: vi.fn(),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch booking when eventId is provided', async () => {
    const mockBooking = createMockBooking()
    vi.mocked(bookingApi.getUserBooking).mockResolvedValue(mockBooking)

    const { result } = renderHook(() => useBooking(1), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockBooking)
    expect(bookingApi.getUserBooking).toHaveBeenCalledWith(1)
  })

  it('should not fetch when eventId is null', () => {
    const { result } = renderHook(() => useBooking(null), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(false)
    expect(bookingApi.getUserBooking).not.toHaveBeenCalled()
  })
})

describe('useJoinEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call joinEvent API and invalidate queries on success', async () => {
    vi.mocked(bookingApi.joinEvent).mockResolvedValue({
      success: true,
      queue: 'ASIL',
      message: 'Success',
    })

    const { result } = renderHook(() => useJoinEvent(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({
      eventId: 1,
      consentKvkk: true,
      consentPayment: true,
    })

    expect(bookingApi.joinEvent).toHaveBeenCalledWith(1, true, true)
  })

  it('should handle mutation errors', async () => {
    vi.mocked(bookingApi.joinEvent).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useJoinEvent(), {
      wrapper: createWrapper(),
    })

    await expect(
      result.current.mutateAsync({
        eventId: 1,
        consentKvkk: true,
        consentPayment: true,
      })
    ).rejects.toThrow('Network error')
  })
})

describe('useCancelBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call cancelBooking API', async () => {
    vi.mocked(bookingApi.cancelBooking).mockResolvedValue({
      success: true,
      message: 'Cancelled',
    })

    const { result } = renderHook(() => useCancelBooking(), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync(1)

    expect(bookingApi.cancelBooking).toHaveBeenCalledWith(1)
  })
})

describe('useBookingQueuePosition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch queue position when eventId and userId are provided', async () => {
    vi.mocked(bookingApi.getBookingQueuePosition).mockResolvedValue(5)

    const { result } = renderHook(
      () => useBookingQueuePosition(1, 'user-1'),
      {
        wrapper: createWrapper(),
      }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBe(5)
    expect(bookingApi.getBookingQueuePosition).toHaveBeenCalledWith(1, 'user-1')
  })

  it('should not fetch when eventId or userId is null', () => {
    const { result } = renderHook(
      () => useBookingQueuePosition(null, null),
      {
        wrapper: createWrapper(),
      }
    )

    expect(result.current.isLoading).toBe(false)
    expect(bookingApi.getBookingQueuePosition).not.toHaveBeenCalled()
  })
})

