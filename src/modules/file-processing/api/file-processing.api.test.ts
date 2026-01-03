import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processTicketZip } from './file-processing.api'
import { createMockSupabaseClient, setupMockAuth } from '@/shared/test-utils/supabase-mock'
import { createMockUser } from '@/shared/test-utils/test-data'

// Mock the supabase infrastructure
vi.mock('@/shared/infrastructure/supabase', () => ({
  createBrowserClient: vi.fn(),
}))

describe('File Processing API', () => {
  let mockSupabase: any

  beforeEach(async () => {
    mockSupabase = createMockSupabaseClient()
    const { createBrowserClient } = await import('@/shared/infrastructure/supabase')
    vi.mocked(createBrowserClient).mockReturnValue(mockSupabase as any)
  })

  describe('processTicketZip', () => {
    it('should process ZIP file successfully as admin', async () => {
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
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          processedCount: 50,
        },
        error: null,
      })

      const result = await processTicketZip(1, 'tickets/upload.zip')

      expect(result.success).toBe(true)
      expect(result.count).toBe(50)
      expect(result.message).toBe('50 bilet başarıyla işlendi.')
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('process-zip', {
        body: {
          eventId: 1,
          filePath: 'tickets/upload.zip',
        },
      })
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

      const result = await processTicketZip(1, 'tickets/upload.zip')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Yetkisiz erişim.')
    })

    it('should handle Edge Function errors', async () => {
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
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Function error' },
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await processTicketZip(1, 'tickets/upload.zip')

      expect(result.success).toBe(false)
      expect(result.message).toBe('ZIP işleme hatası.')

      consoleSpy.mockRestore()
    })

    it('should handle function response errors', async () => {
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
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          success: false,
          error: 'Invalid ZIP format',
        },
        error: null,
      })

      const result = await processTicketZip(1, 'tickets/invalid.zip')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Invalid ZIP format')
    })
  })
})

