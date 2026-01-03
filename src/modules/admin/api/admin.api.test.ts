import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cancelBooking, exportBookingsToExcel } from './admin.api'
import { createMockSupabaseClient, setupMockAuth } from '@/shared/test-utils/supabase-mock'
import { createMockUser, createMockBooking } from '@/shared/test-utils/test-data'

// Mock dependencies
vi.mock('@/modules/ticket', () => ({
  assignTicket: vi.fn(),
}))

vi.mock('./admin.utils', () => ({
  promoteFromWaitlist: vi.fn(),
}))

// Mock the supabase infrastructure
vi.mock('@/shared/infrastructure/supabase', () => ({
  createBrowserClient: vi.fn(),
}))

describe('Admin API', () => {
  let mockSupabase: any

  beforeEach(async () => {
    mockSupabase = createMockSupabaseClient()
    const { createBrowserClient } = await import('@/shared/infrastructure/supabase')
    vi.mocked(createBrowserClient).mockReturnValue(mockSupabase as any)
  })

  describe('cancelBooking', () => {
    it('should cancel booking successfully as admin', async () => {
      const adminUser = createMockUser({ is_admin: true })
      setupMockAuth(mockSupabase, adminUser)

      const { promoteFromWaitlist } = await import('./admin.utils')
      vi.mocked(promoteFromWaitlist).mockResolvedValue({
        success: true,
        message: 'Yedek listeden geçiş yapıldı',
      })

      const queryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { is_admin: true, role: 'admin' },
              error: null,
            }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        })),
      }

      mockSupabase.from.mockReturnValue(queryBuilder)

      const result = await cancelBooking(1, 1)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Başvuru iptal edildi')
      expect(promoteFromWaitlist).toHaveBeenCalledWith(1)
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

      const result = await cancelBooking(1, 1)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Yetkisiz erişim.')
    })

    it('should handle update errors', async () => {
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
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Update failed' },
          }),
        })),
      }

      mockSupabase.from.mockReturnValue(queryBuilder)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await cancelBooking(1, 1)

      expect(result.success).toBe(false)
      expect(result.message).toBe('İptal işlemi başarısız.')

      consoleSpy.mockRestore()
    })
  })

  describe('exportBookingsToExcel', () => {
    it('should export bookings to Excel successfully as admin', async () => {
      const adminUser = createMockUser({ is_admin: true })
      setupMockAuth(mockSupabase, adminUser)

      const mockBookings = [
        {
          id: 1,
          booking_date: '2024-01-15T10:00:00Z',
          queue_status: 'ASIL',
          payment_status: 'PAID',
          profiles: {
            full_name: 'Test User',
            email: 'test@example.com',
            tckn: '12345678901',
            sicil_no: 'TALPA-001',
          },
        },
      ]

      const queryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: mockBookings,
              error: null,
            }),
          })),
        })),
      }

      mockSupabase.from.mockReturnValue(queryBuilder)

      const result = await exportBookingsToExcel(1)

      expect(result).toBeInstanceOf(Blob)
      expect(result?.type).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
    })

    it('should return null when user is not admin', async () => {
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

      const result = await exportBookingsToExcel(1)

      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      const adminUser = createMockUser({ is_admin: true })
      setupMockAuth(mockSupabase, adminUser)

      const queryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Query failed' },
            }),
          })),
        })),
      }

      mockSupabase.from.mockReturnValue(queryBuilder)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await exportBookingsToExcel(1)

      expect(result).toBeNull()

      consoleSpy.mockRestore()
    })
  })
})

