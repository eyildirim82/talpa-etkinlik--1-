import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getEventStats } from './reporting.api'
import { createMockSupabaseClient, setupMockAuth } from '@/shared/test-utils/supabase-mock'
import { createMockUser } from '@/shared/test-utils/test-data'

// Mock the supabase infrastructure
vi.mock('@/shared/infrastructure/supabase', () => ({
  createBrowserClient: vi.fn(),
}))

describe('Reporting API', () => {
  let mockSupabase: any

  beforeEach(async () => {
    mockSupabase = createMockSupabaseClient()
    const { createBrowserClient } = await import('@/shared/infrastructure/supabase')
    vi.mocked(createBrowserClient).mockReturnValue(mockSupabase as any)
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

      expect(result).toBeDefined()
      expect(result?.quota_asil).toBe(50)
      expect(result?.quota_yedek).toBe(30)
      expect(result?.asil_count).toBe(10)
      expect(result?.revenue).toBe(1000) // 10 * 100
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

      const result = await getEventStats(1)

      expect(result).toBeNull()
    })

    it('should return null when event does not exist', async () => {
      const adminUser = createMockUser({ is_admin: true })
      setupMockAuth(mockSupabase, adminUser)

      const eventQueryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          })),
        })),
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'events') return eventQueryBuilder
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

      const result = await getEventStats(999)

      expect(result).toBeNull()
    })
  })
})

