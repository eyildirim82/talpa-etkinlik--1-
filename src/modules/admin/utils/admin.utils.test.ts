import { describe, it, expect, vi, beforeEach } from 'vitest'
import { promoteFromWaitlist } from './admin.utils'
import { createMockSupabaseClient } from '@/shared/test-utils/supabase-mock'

// Mock the supabase infrastructure
vi.mock('@/shared/infrastructure/supabase', () => ({
  createBrowserClient: vi.fn(),
}))

describe('Admin Utils', () => {
  let mockSupabase: any

  beforeEach(async () => {
    mockSupabase = createMockSupabaseClient()
    const { createBrowserClient } = await import('@/shared/infrastructure/supabase')
    vi.mocked(createBrowserClient).mockReturnValue(mockSupabase as any)
  })

  describe('promoteFromWaitlist', () => {
    it('should promote from waitlist successfully', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          status: 'success',
          message: 'Yedek listeden asile çıkarıldı',
        },
        error: null,
      })

      const result = await promoteFromWaitlist(1)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Yedek listeden asile çıkarıldı')
      expect(mockSupabase.rpc).toHaveBeenCalledWith('promote_from_waitlist', {
        event_id_param: 1,
      })
    })

    it('should handle RPC errors', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await promoteFromWaitlist(1)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Bağlantı hatası.')

      consoleSpy.mockRestore()
    })

    it('should handle business logic errors', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          status: 'error',
          message: 'Yedek liste boş',
        },
        error: null,
      })

      const result = await promoteFromWaitlist(1)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Yedek liste boş')
    })
  })
})

