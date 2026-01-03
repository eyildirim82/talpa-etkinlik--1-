import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  joinEvent,
  getUserBooking,
  cancelBooking,
  getBookingQueuePosition,
  getBookingsWithFilters,
} from './booking.api'
import { createMockSupabaseClient, setupMockAuth } from '@/shared/test-utils/supabase-mock'
import { createMockUser, createMockBooking } from '@/shared/test-utils/test-data'

// Mock the supabase infrastructure
vi.mock('@/shared/infrastructure/supabase', () => ({
  createBrowserClient: vi.fn(),
}))

describe('Booking API', () => {
  let mockSupabase: any

  beforeEach(async () => {
    mockSupabase = createMockSupabaseClient()
    const { createBrowserClient } = await import('@/shared/infrastructure/supabase')
    vi.mocked(createBrowserClient).mockReturnValue(mockSupabase as any)
  })

  describe('joinEvent', () => {
    it('should join event successfully and return ASIL status', async () => {
      const mockUser = createMockUser()
      setupMockAuth(mockSupabase, mockUser)

      mockSupabase.rpc.mockResolvedValue({
        data: {
          status: 'success',
          queue: 'ASIL',
          message: 'Başvurunuz başarıyla alındı!',
        },
        error: null,
      })

      const result = await joinEvent(1, true, true)

      expect(result.success).toBe(true)
      expect(result.queue).toBe('ASIL')
      expect(mockSupabase.rpc).toHaveBeenCalledWith('join_event', {
        event_id_param: 1,
      })
    })

    it('should return YEDEK status when quota is full', async () => {
      const mockUser = createMockUser()
      setupMockAuth(mockSupabase, mockUser)

      mockSupabase.rpc.mockResolvedValue({
        data: {
          status: 'success',
          queue: 'YEDEK',
          message: 'Yedek listesine eklendiniz.',
        },
        error: null,
      })

      const result = await joinEvent(1, true, true)

      expect(result.success).toBe(true)
      expect(result.queue).toBe('YEDEK')
    })

    it('should return error when user is not authenticated', async () => {
      setupMockAuth(mockSupabase, null)

      const result = await joinEvent(1, true, true)

      expect(result.success).toBe(false)
      expect(result.message).toBe('İşlem için giriş yapmalısınız.')
    })

    it('should return error when consents are not given', async () => {
      const mockUser = createMockUser()
      setupMockAuth(mockSupabase, mockUser)

      const result = await joinEvent(1, false, false)

      expect(result.success).toBe(false)
      expect(result.message).toBe('KVKK ve ödeme onaylarını vermelisiniz.')
    })

    it('should handle RPC errors', async () => {
      const mockUser = createMockUser()
      setupMockAuth(mockSupabase, mockUser)

      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await joinEvent(1, true, true)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Bağlantı hatası. Lütfen tekrar deneyin.')

      consoleSpy.mockRestore()
    })

    it('should handle business logic errors from RPC', async () => {
      const mockUser = createMockUser()
      setupMockAuth(mockSupabase, mockUser)

      mockSupabase.rpc.mockResolvedValue({
        data: {
          status: 'error',
          message: 'Etkinlik bulunamadı.',
        },
        error: null,
      })

      const result = await joinEvent(999, true, true)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Etkinlik bulunamadı.')
    })
  })

  describe('getUserBooking', () => {
    it('should fetch user booking successfully', async () => {
      const mockUser = createMockUser()
      const mockBooking = createMockBooking()
      setupMockAuth(mockSupabase, mockUser)

      const queryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: mockBooking,
                error: null,
              }),
            })),
          })),
        })),
      }

      mockSupabase.from.mockReturnValue(queryBuilder)

      const result = await getUserBooking(1)

      expect(result).toEqual(mockBooking)
    })

    it('should return null when user is not authenticated', async () => {
      setupMockAuth(mockSupabase, null)

      const result = await getUserBooking(1)

      expect(result).toBeNull()
    })

    it('should return null when booking does not exist', async () => {
      const mockUser = createMockUser()
      setupMockAuth(mockSupabase, mockUser)

      const queryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            })),
          })),
        })),
      }

      mockSupabase.from.mockReturnValue(queryBuilder)

      const result = await getUserBooking(1)

      expect(result).toBeNull()
    })
  })

  describe('cancelBooking', () => {
    it('should cancel booking successfully before cut-off date', async () => {
      const mockUser = createMockUser()
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1) // Tomorrow

      setupMockAuth(mockSupabase, mockUser)

      const fetchQueryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 1,
                  user_id: mockUser.id,
                  events: {
                    cut_off_date: futureDate.toISOString(),
                  },
                },
                error: null,
              }),
            })),
          })),
        })),
      }

      const updateQueryBuilder = {
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          })),
        })),
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'bookings') {
          return {
            ...fetchQueryBuilder,
            ...updateQueryBuilder,
          }
        }
        return createMockSupabaseClient().from(table)
      })

      const result = await cancelBooking(1)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Başvurunuz iptal edildi.')
    })

    it('should return error when cut-off date has passed', async () => {
      const mockUser = createMockUser()
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1) // Yesterday

      setupMockAuth(mockSupabase, mockUser)

      const queryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 1,
                  user_id: mockUser.id,
                  events: {
                    cut_off_date: pastDate.toISOString(),
                  },
                },
                error: null,
              }),
            })),
          })),
        })),
      }

      mockSupabase.from.mockReturnValue(queryBuilder)

      const result = await cancelBooking(1)

      expect(result.success).toBe(false)
      expect(result.message).toBe('İptal tarihi geçmiş. Başvurunuzu iptal edemezsiniz.')
    })

    it('should return error when user is not authenticated', async () => {
      setupMockAuth(mockSupabase, null)

      const result = await cancelBooking(1)

      expect(result.success).toBe(false)
      expect(result.message).toBe('İşlem için giriş yapmalısınız.')
    })
  })

  describe('getBookingsWithFilters', () => {
    it('should fetch bookings with filters', async () => {
      const mockBookings = [createMockBooking(), createMockBooking()]

      const queryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn().mockResolvedValue({
                  data: mockBookings,
                  error: null,
                  count: 2,
                }),
              })),
            })),
            order: vi.fn(() => ({
              range: vi.fn().mockResolvedValue({
                data: mockBookings,
                error: null,
                count: 2,
              }),
            })),
          })),
          order: vi.fn(() => ({
            range: vi.fn().mockResolvedValue({
              data: mockBookings,
              error: null,
              count: 2,
            }),
          })),
        })),
      }

      mockSupabase.from.mockReturnValue(queryBuilder)

      const result = await getBookingsWithFilters(1, {
        queue_status: 'ASIL',
        payment_status: 'PAID',
        page: 1,
        pageSize: 20,
      })

      expect(result.data).toEqual(mockBookings)
      expect(result.count).toBe(2)
    })
  })
})

