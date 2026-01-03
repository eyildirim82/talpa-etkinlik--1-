import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getActiveEvent, createEvent, setActiveEvent, getEventStats } from './event.api'
import { createMockSupabaseClient, setupMockAuth, setupMockQuery } from '@/shared/test-utils/supabase-mock'
import { createMockUser, createMockEvent, createMockActiveEvent } from '@/shared/test-utils/test-data'

// Mock the supabase infrastructure
vi.mock('@/shared/infrastructure/supabase', () => ({
  createBrowserClient: vi.fn(),
}))

describe('Event API', () => {
  let mockSupabase: any

  beforeEach(async () => {
    mockSupabase = createMockSupabaseClient()
    const { createBrowserClient } = await import('@/shared/infrastructure/supabase')
    vi.mocked(createBrowserClient).mockReturnValue(mockSupabase as any)
  })

  describe('getActiveEvent', () => {
    it('should return active event from view if available', async () => {
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
        if (table === 'active_event_view') {
          return viewQueryBuilder
        }
        return createMockSupabaseClient().from(table)
      })

      const result = await getActiveEvent()

      expect(result).toEqual(mockActiveEvent)
    })

    it('should fallback to events table if view fails', async () => {
      const mockEvent = createMockEvent({ status: 'ACTIVE' })
      
      // View returns error
      const viewQueryBuilder = {
        select: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        })),
      }

      // Events table returns active event
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

      // Bookings count queries
      const bookingsQueryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              count: 10,
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

      const result = await getActiveEvent()

      expect(result).toBeDefined()
      expect(result?.status).toBe('ACTIVE')
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

      const result = await getActiveEvent()

      expect(result).toBeNull()
    })
  })

  describe('createEvent', () => {
    it('should create event successfully as admin', async () => {
      const adminUser = createMockUser({ is_admin: true })
      setupMockAuth(mockSupabase, adminUser)

      const queryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { is_admin: true, role: 'admin' },
              error: null,
            }),
          })),
        })),
        insert: vi.fn().mockResolvedValue({
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(queryBuilder)

      const eventData = {
        title: 'New Event',
        description: 'Test event',
        event_date: '2024-12-31T18:00:00Z',
        location_url: 'https://example.com',
        price: 100,
        quota_asil: 50,
        quota_yedek: 30,
        cut_off_date: '2024-12-30T18:00:00Z',
        banner_image: 'https://example.com/banner.jpg',
        status: 'DRAFT' as const,
      }

      const result = await createEvent(eventData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Etkinlik başarıyla oluşturuldu.')
    })

    it('should return error when user is not admin', async () => {
      const regularUser = createMockUser({ is_admin: false })
      setupMockAuth(mockSupabase, regularUser)

      const queryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { is_admin: false, role: 'member' },
              error: null,
            }),
          })),
        })),
      }

      mockSupabase.from.mockReturnValue(queryBuilder)

      const eventData = {
        title: 'New Event',
        description: 'Test event',
        event_date: '2024-12-31T18:00:00Z',
        location_url: 'https://example.com',
        price: 100,
        quota_asil: 50,
        quota_yedek: 30,
        cut_off_date: '2024-12-30T18:00:00Z',
        banner_image: 'https://example.com/banner.jpg',
      }

      const result = await createEvent(eventData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Yetkisiz erişim.')
    })
  })

  describe('setActiveEvent', () => {
    it('should set active event successfully as admin', async () => {
      const adminUser = createMockUser({ is_admin: true })
      setupMockAuth(mockSupabase, adminUser)

      const queryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { is_admin: true, role: 'admin' },
              error: null,
            }),
          })),
        })),
      }

      mockSupabase.from.mockReturnValue(queryBuilder)
      mockSupabase.rpc.mockResolvedValue({
        data: { success: true, message: 'Event activated' },
        error: null,
      })

      const result = await setActiveEvent(1)

      expect(result.success).toBe(true)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('set_active_event', {
        p_event_id: 1,
      })
    })

    it('should return error when RPC fails', async () => {
      const adminUser = createMockUser({ is_admin: true })
      setupMockAuth(mockSupabase, adminUser)

      const queryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { is_admin: true, role: 'admin' },
              error: null,
            }),
          })),
        })),
      }

      mockSupabase.from.mockReturnValue(queryBuilder)
      mockSupabase.rpc.mockResolvedValue({
        data: { success: false, error: 'RPC error' },
        error: null,
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await setActiveEvent(1)

      expect(result.success).toBe(false)
      expect(result.message).toBe('RPC error')

      consoleSpy.mockRestore()
    })
  })

  describe('getEventStats', () => {
    it('should get event stats successfully as admin', async () => {
      const adminUser = createMockUser({ is_admin: true })
      setupMockAuth(mockSupabase, adminUser)

      const eventQueryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                quota_asil: 50,
                quota_yedek: 30,
                price: 100,
              },
              error: null,
            }),
          })),
        })),
      }

      const bookingsQueryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              count: 10,
            }),
          })),
        })),
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'events') return eventQueryBuilder
        if (table === 'bookings') return bookingsQueryBuilder
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { is_admin: true, role: 'admin' },
                  error: null,
                }),
              })),
            })),
          }
        }
        return createMockSupabaseClient().from(table)
      })

      const result = await getEventStats(1)

      expect(result.success).toBe(true)
      expect(result.stats).toBeDefined()
      expect(result.stats?.quota_asil).toBe(50)
      expect(result.stats?.quota_yedek).toBe(30)
    })
  })
})

