import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useProfile } from './useProfile'
import * as profileApi from '../api/profile.api'
import { useSession } from '@/modules/auth'
import { createMockProfile, createMockUser } from '@/shared/test-utils/test-data'

// Mock dependencies
vi.mock('../api/profile.api', () => ({
  getProfile: vi.fn(),
}))

vi.mock('@/modules/auth', () => ({
  useSession: vi.fn(),
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

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return loading state when auth is loading', () => {
    vi.mocked(useSession).mockReturnValue({
      user: null,
      session: null,
      isLoading: true,
    })

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should fetch profile when user is authenticated', async () => {
    const mockUser = createMockUser()
    const mockProfile = createMockProfile()

    vi.mocked(useSession).mockReturnValue({
      user: mockUser,
      session: { user: mockUser } as any,
      isLoading: false,
    })

    vi.mocked(profileApi.getProfile).mockResolvedValue(mockProfile)

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toEqual(mockProfile)
    expect(result.current.isAuthenticated).toBe(true)
    expect(profileApi.getProfile).toHaveBeenCalledWith(mockUser.id)
  })

  it('should not fetch profile when user is not authenticated', () => {
    vi.mocked(useSession).mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
    })

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
    expect(profileApi.getProfile).not.toHaveBeenCalled()
  })

  it('should handle profile fetch error gracefully', async () => {
    const mockUser = createMockUser()

    vi.mocked(useSession).mockReturnValue({
      user: mockUser,
      session: { user: mockUser } as any,
      isLoading: false,
    })

    vi.mocked(profileApi.getProfile).mockResolvedValue(null)

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toBeNull()
  })
})

