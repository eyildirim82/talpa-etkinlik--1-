import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cancelBooking } from '@/modules/admin'
import { promoteFromWaitlist } from '@/modules/admin/utils/admin.utils'
import { createMockSupabaseClient, setupMockAuth } from '@/shared/test-utils/supabase-mock'
import { createMockUser } from '@/shared/test-utils/test-data'

// Mock dependencies
vi.mock('@/modules/admin/utils/admin.utils', () => ({
  promoteFromWaitlist: vi.fn(),
}))

// Mock the supabase infrastructure
vi.mock('@/shared/infrastructure/supabase', () => ({
  createBrowserClient: vi.fn(),
}))

describe('Admin → Booking Integration', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    const { createBrowserClient } = await import('@/shared/infrastructure/supabase')
    vi.mocked(createBrowserClient).mockReturnValue(mockSupabase as any)
  })

  it('should cancel booking and promote from waitlist', async () => {
    const adminUser = createMockUser({ is_admin: true })
    setupMockAuth(mockSupabase, adminUser)

    vi.mocked(promoteFromWaitlist).mockResolvedValue({
      success: true,
      message: 'Yedek listeden asile çıkarıldı',
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
        })),
      })),
    }

    mockSupabase.from.mockReturnValue(queryBuilder)

    const result = await cancelBooking(1, 1)

    expect(result.success).toBe(true)
    expect(result.message).toContain('Başvuru iptal edildi')
    expect(result.message).toContain('Yedek listeden asile çıkarıldı')
    expect(promoteFromWaitlist).toHaveBeenCalledWith(1)
  })

  it('should handle waitlist promotion failure gracefully', async () => {
    const adminUser = createMockUser({ is_admin: true })
    setupMockAuth(mockSupabase, adminUser)

    vi.mocked(promoteFromWaitlist).mockResolvedValue({
      success: false,
      message: 'Yedek liste boş',
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
        })),
      })),
    }

    mockSupabase.from.mockReturnValue(queryBuilder)

    const result = await cancelBooking(1, 1)

    expect(result.success).toBe(true)
    expect(result.message).toContain('Başvuru iptal edildi')
    expect(result.message).toContain('Yedek listeden geçiş yapılamadı')
  })
})

