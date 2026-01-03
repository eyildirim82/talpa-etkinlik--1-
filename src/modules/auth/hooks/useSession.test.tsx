import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useSession } from './useSession'
import { createMockSupabaseClient, setupMockAuth } from '@/shared/test-utils/supabase-mock'
import { createMockUser } from '@/shared/test-utils/test-data'

// Mock the supabase infrastructure
vi.mock('@/shared/infrastructure/supabase', () => ({
  createBrowserClient: vi.fn(),
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

describe('useSession', () => {
  let mockSupabase: any

  beforeEach(async () => {
    mockSupabase = createMockSupabaseClient()
    const { createBrowserClient } = await import('@/shared/infrastructure/supabase')
    vi.mocked(createBrowserClient).mockReturnValue(mockSupabase as any)
  })

  it('should return null user when not authenticated', async () => {
    setupMockAuth(mockSupabase, null)

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
  })

  it('should return user when authenticated', async () => {
    const mockUser = createMockUser()
    const mockSession = {
      user: mockUser,
      access_token: 'token',
      expires_at: 1234567890,
    }

    setupMockAuth(mockSupabase, mockUser)

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    })

    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.session).toEqual(mockSession)
  })

  it('should subscribe to auth state changes', async () => {
    setupMockAuth(mockSupabase, null)

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    const { result, unmount } = renderHook(() => useSession(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()

    // Cleanup
    unmount()
  })

  it('should handle auth state change events', async () => {
    const mockUser = createMockUser()
    setupMockAuth(mockSupabase, mockUser)

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    })

    let authStateChangeCallback: any

    mockSupabase.auth.onAuthStateChange.mockImplementation((callback: any) => {
      authStateChangeCallback = callback
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      }
    })

    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Simulate auth state change
    if (authStateChangeCallback) {
      authStateChangeCallback('SIGNED_IN', { user: mockUser })
    }

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
    })
  })
})

