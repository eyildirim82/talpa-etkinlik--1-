import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProfile } from './profile.api'
import { createMockSupabaseClient, setupMockQuery } from '@/shared/test-utils/supabase-mock'
import { createMockProfile } from '@/shared/test-utils/test-data'

// Mock the supabase infrastructure
vi.mock('@/shared/infrastructure/supabase', () => ({
  createBrowserClient: vi.fn(),
}))

describe('Profile API', () => {
  let mockSupabase: any

  beforeEach(async () => {
    mockSupabase = createMockSupabaseClient()
    const { createBrowserClient } = await import('@/shared/infrastructure/supabase')
    vi.mocked(createBrowserClient).mockReturnValue(mockSupabase as any)
  })

  describe('getProfile', () => {
    it('should fetch profile successfully', async () => {
      const mockProfile = createMockProfile()
      setupMockQuery(mockSupabase, 'profiles', mockProfile)

      const result = await getProfile('user-1')

      expect(result).toEqual(mockProfile)
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    })

    it('should return null on error', async () => {
      const queryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Profile not found' },
            }),
          })),
        })),
      }

      mockSupabase.from.mockReturnValue(queryBuilder)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await getProfile('invalid-user')

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should query with correct userId', async () => {
      const mockProfile = createMockProfile({ id: 'user-2' })
      setupMockQuery(mockSupabase, 'profiles', mockProfile)

      await getProfile('user-2')

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    })
  })
})

