import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useAdmin } from './useAdmin'
import { useProfile } from './useProfile'
import { createMockProfile } from '@/shared/test-utils/test-data'

// Mock useProfile
vi.mock('./useProfile', () => ({
  useProfile: vi.fn(),
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

describe('useAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return false when user is not admin', async () => {
    const mockProfile = createMockProfile({ is_admin: false, role: 'member' })

    vi.mocked(useProfile).mockReturnValue({
      user: mockProfile,
      isLoading: false,
      isAuthenticated: true,
    })

    const { result } = renderHook(() => useAdmin(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isAdmin).toBe(false)
  })

  it('should return true when user is admin (is_admin flag)', async () => {
    const mockProfile = createMockProfile({ is_admin: true, role: 'member' })

    vi.mocked(useProfile).mockReturnValue({
      user: mockProfile,
      isLoading: false,
      isAuthenticated: true,
    })

    const { result } = renderHook(() => useAdmin(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isAdmin).toBe(true)
  })

  it('should return true when user is admin (role)', async () => {
    const mockProfile = createMockProfile({ is_admin: false, role: 'admin' })

    vi.mocked(useProfile).mockReturnValue({
      user: mockProfile,
      isLoading: false,
      isAuthenticated: true,
    })

    const { result } = renderHook(() => useAdmin(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isAdmin).toBe(true)
  })

  it('should return loading state when profile is loading', () => {
    vi.mocked(useProfile).mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
    })

    const { result } = renderHook(() => useAdmin(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
  })

  it('should return false when user is not authenticated', () => {
    vi.mocked(useProfile).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    })

    const { result } = renderHook(() => useAdmin(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })
})

