import { describe, it, expect, vi, beforeEach } from 'vitest'
import { joinEvent } from '@/modules/booking'
import { getActiveEvent } from '@/modules/event'
import { createMockSupabaseClient, setupMockAuth } from '@/shared/test-utils/supabase-mock'
import { createMockUser, createMockEvent } from '@/shared/test-utils/test-data'

// Mock the supabase infrastructure
vi.mock('@/shared/infrastructure/supabase', () => ({
  createBrowserClient: vi.fn(),
}))

describe('Booking → Event Integration', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    const { createBrowserClient } = await import('@/shared/infrastructure/supabase')
    vi.mocked(createBrowserClient).mockReturnValue(mockSupabase as any)
  })

  it('should join event and update event quota', async () => {
    const mockUser = createMockUser()
    const mockEvent = createMockEvent({ id: 1, quota_asil: 50 })

    setupMockAuth(mockSupabase, mockUser)

    // Mock active event
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
            count: 0,
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

    // Mock join event RPC
    mockSupabase.rpc.mockResolvedValue({
      data: {
        status: 'success',
        queue: 'ASIL',
        message: 'Başvurunuz başarıyla alındı!',
      },
      error: null,
    })

    // Get active event first
    const activeEvent = await getActiveEvent()
    expect(activeEvent).toBeDefined()
    expect(activeEvent?.id).toBe('1')

    // Join event
    const joinResult = await joinEvent(1, true, true)

    expect(joinResult.success).toBe(true)
    expect(joinResult.queue).toBe('ASIL')
  })

  it('should handle quota full scenario', async () => {
    const mockUser = createMockUser()
    setupMockAuth(mockSupabase, mockUser)

    mockSupabase.rpc.mockResolvedValue({
      data: {
        status: 'success',
        queue: 'YEDEK',
        message: 'Kota doldu, yedek listesine eklendiniz.',
      },
      error: null,
    })

    const result = await joinEvent(1, true, true)

    expect(result.success).toBe(true)
    expect(result.queue).toBe('YEDEK')
  })
})

