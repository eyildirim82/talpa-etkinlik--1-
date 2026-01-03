import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useActiveEvent } from './useActiveEvent'
import { createMockSupabaseClient } from '@/shared/test-utils/supabase-mock'
import { createMockActiveEvent } from '@/shared/test-utils/test-data'

// Mock the supabase infrastructure
vi.mock('@/shared/infrastructure/supabase', () => ({
  createBrowserClient: vi.fn(),
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

describe('useActiveEvent', () => {
  let mockSupabase: any

  beforeEach(async () => {
    mockSupabase = createMockSupabaseClient()
    const { createBrowserClient } = await import('@/shared/infrastructure/supabase')
    vi.mocked(createBrowserClient).mockReturnValue(mockSupabase as any)
  })

  it('should fetch active event successfully', async () => {
    const mockActiveEvent = createMockActiveEvent()

    const viewQueryBuilder = {
      select: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockActiveEvent,
          error: null,
        }),
      })),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'active_event_view') return viewQueryBuilder
      return createMockSupabaseClient().from(table)
    })

    const { result } = renderHook(() => useActiveEvent(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockActiveEvent)
  })

  it('should return null when no active event exists', async () => {
    const viewQueryBuilder = {
      select: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      })),
    }

    const eventsQueryBuilder = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        })),
      })),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'active_event_view') return viewQueryBuilder
      if (table === 'events') return eventsQueryBuilder
      return createMockSupabaseClient().from(table)
    })

    const { result } = renderHook(() => useActiveEvent(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeNull()
  })

  it('should calculate remaining stock correctly', async () => {
    const mockEvent = {
      id: 1,
      title: 'Test Event',
      status: 'ACTIVE',
      quota_asil: 50,
      quota_yedek: 30,
      banner_image: 'https://example.com/banner.jpg',
      event_date: '2024-12-31T18:00:00Z',
      location_url: 'https://example.com',
      cut_off_date: '2024-12-30T18:00:00Z',
    }

    const viewQueryBuilder = {
      select: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      })),
    }

    const eventsQueryBuilder = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: mockEvent,
            error: null,
          }),
        })),
      })),
    }

    const bookingsQueryBuilder = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            count: 20, // 20 bookings
          }),
        })),
      })),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'active_event_view') return viewQueryBuilder
      if (table === 'events') return eventsQueryBuilder
      if (table === 'bookings') return bookingsQueryBuilder
      return createMockSupabaseClient().from(table)
    })

    const { result } = renderHook(() => useActiveEvent(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.remaining_stock).toBe(60) // 80 - 20 = 60
  })
})

