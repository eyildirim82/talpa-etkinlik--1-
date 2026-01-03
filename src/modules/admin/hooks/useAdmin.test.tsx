import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import {
  useAdminEvents,
  useAdminTickets,
  useAdminUsers,
  useAdminStats,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useSetActiveEvent,
} from './useAdmin'
import { createMockSupabaseClient, setupMockAuth } from '@/shared/test-utils/supabase-mock'
import { createMockUser, createMockAdminEvent, createMockAdminTicket, createMockAdminUser } from '@/shared/test-utils/test-data'

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

describe('useAdmin Hooks', () => {
  let mockSupabase: any

  beforeEach(async () => {
    mockSupabase = createMockSupabaseClient()
    const { createBrowserClient } = await import('@/shared/infrastructure/supabase')
    vi.mocked(createBrowserClient).mockReturnValue(mockSupabase as any)
  })

  describe('useAdminEvents', () => {
    it('should fetch admin events successfully', async () => {
      const mockEvents = [createMockAdminEvent()]

      const eventsQueryBuilder = {
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: mockEvents,
            error: null,
          }),
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
        if (table === 'events') return eventsQueryBuilder
        if (table === 'bookings') return bookingsQueryBuilder
        return createMockSupabaseClient().from(table)
      })

      const { result } = renderHook(() => useAdminEvents(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
    })
  })

  describe('useAdminTickets', () => {
    it('should fetch admin tickets successfully', async () => {
      const mockTickets = [createMockAdminTicket()]

      const queryBuilder = {
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: mockTickets,
            error: null,
          }),
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: mockTickets,
              error: null,
            }),
          })),
        })),
      }

      mockSupabase.from.mockReturnValue(queryBuilder)

      const { result } = renderHook(() => useAdminTickets('1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
    })
  })

  describe('useAdminUsers', () => {
    it('should fetch admin users successfully', async () => {
      const mockUsers = [createMockAdminUser()]

      const queryBuilder = {
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: mockUsers,
            error: null,
          }),
        })),
      }

      mockSupabase.from.mockReturnValue(queryBuilder)

      const { result } = renderHook(() => useAdminUsers(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockUsers)
    })
  })

  describe('useAdminStats', () => {
    it('should calculate admin stats correctly', async () => {
      const mockEvents = [
        createMockAdminEvent({ status: 'ACTIVE' }),
        createMockAdminEvent({ status: 'DRAFT' }),
      ]

      const eventsQueryBuilder = {
        select: vi.fn().mockResolvedValue({
          data: mockEvents,
          error: null,
        }),
      }

      const bookingsQueryBuilder = {
        select: vi.fn(() => ({
          in: vi.fn().mockResolvedValue({
            data: [
              { event_id: 1, queue_status: 'ASIL', payment_status: 'PAID' },
              { event_id: 1, queue_status: 'YEDEK', payment_status: 'WAITING' },
            ],
            error: null,
          }),
        })),
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'events') return eventsQueryBuilder
        if (table === 'bookings') return bookingsQueryBuilder
        return createMockSupabaseClient().from(table)
      })

      const { result } = renderHook(() => useAdminStats(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.totalEvents).toBe(2)
    })
  })

  describe('useCreateEvent', () => {
    it('should create event successfully', async () => {
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
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: createMockAdminEvent(),
              error: null,
            }),
          })),
        })),
      }

      mockSupabase.from.mockReturnValue(queryBuilder)

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: createWrapper(),
      })

      await result.current.mutateAsync({
        title: 'New Event',
        description: 'Test',
        event_date: '2024-12-31T18:00:00Z',
        location_url: 'https://example.com',
        price: 100,
        quota_asil: 50,
        quota_yedek: 30,
        cut_off_date: '2024-12-30T18:00:00Z',
        banner_image: 'https://example.com/banner.jpg',
        status: 'DRAFT',
      })

      expect(mockSupabase.from).toHaveBeenCalled()
    })
  })

  describe('useSetActiveEvent', () => {
    it('should set active event successfully', async () => {
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

      const { result } = renderHook(() => useSetActiveEvent(), {
        wrapper: createWrapper(),
      })

      await result.current.mutateAsync(1)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('set_active_event', {
        p_event_id: 1,
      })
    })
  })
})

