import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendNotification } from './notification.api'
import { createMockSupabaseClient } from '@/shared/test-utils/supabase-mock'

// Mock the supabase infrastructure
vi.mock('@/shared/infrastructure/supabase', () => ({
  createBrowserClient: vi.fn(),
}))

describe('Notification API', () => {
  let mockSupabase: any

  beforeEach(async () => {
    mockSupabase = createMockSupabaseClient()
    const { createBrowserClient } = await import('@/shared/infrastructure/supabase')
    vi.mocked(createBrowserClient).mockReturnValue(mockSupabase as any)
  })

  describe('sendNotification', () => {
    it('should send notification successfully', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null,
      })

      const result = await sendNotification(
        'booking_confirmed',
        ['test@example.com'],
        { bookingId: 1, eventName: 'Test Event' }
      )

      expect(result.success).toBe(true)
      expect(result.message).toBe('E-posta başarıyla gönderildi.')
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('send-email', {
        body: {
          type: 'booking_confirmed',
          to: ['test@example.com'],
          payload: { bookingId: 1, eventName: 'Test Event' },
        },
      })
    })

    it('should handle Edge Function errors', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Function error' },
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await sendNotification(
        'booking_confirmed',
        ['test@example.com'],
        {}
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('E-posta gönderilemedi.')

      consoleSpy.mockRestore()
    })

    it('should handle unexpected errors', async () => {
      mockSupabase.functions.invoke.mockRejectedValue(new Error('Network error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await sendNotification(
        'booking_confirmed',
        ['test@example.com'],
        {}
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('Beklenmeyen bir hata oluştu.')

      consoleSpy.mockRestore()
    })
  })
})

