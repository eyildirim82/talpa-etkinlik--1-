import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useSession } from '@/modules/auth'
import { useProfile } from '@/modules/profile'
import { createMockSupabaseClient, setupMockAuth } from '@/shared/test-utils/supabase-mock'
import { createMockUser, createMockProfile } from '@/shared/test-utils/test-data'

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

describe('Auth → Profile Integration', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    const { createBrowserClient } = await import('@/shared/infrastructure/supabase')
    vi.mocked(createBrowserClient).mockReturnValue(mockSupabase as any)
  })

  it('should fetch profile after login', async () => {
    const mockUser = createMockUser()
    const mockProfile = createMockProfile()

    setupMockAuth(mockSupabase, mockUser)

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    })

    const sessionQueryBuilder = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        })),
      })),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') return sessionQueryBuilder
      return createMockSupabaseClient().from(table)
    })

    const { result: sessionResult } = renderHook(() => useSession(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(sessionResult.current.isLoading).toBe(false)
    })

    expect(sessionResult.current.user).toEqual(mockUser)

    // Profile should be fetched after session is established
    const { result: profileResult } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(profileResult.current.isLoading).toBe(false)
    })

    expect(profileResult.current.isAuthenticated).toBe(true)
  })

  it('should sync session and profile state', async () => {
    const mockUser = createMockUser()
    const mockProfile = createMockProfile()

    setupMockAuth(mockSupabase, mockUser)

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    })

    const queryBuilder = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        })),
      })),
    }

    mockSupabase.from.mockReturnValue(queryBuilder)

    const { result: sessionResult } = renderHook(() => useSession(), {
      wrapper: createWrapper(),
    })

    const { result: profileResult } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(sessionResult.current.isLoading).toBe(false)
      expect(profileResult.current.isLoading).toBe(false)
    })

    expect(sessionResult.current.user?.id).toBe(profileResult.current.user?.id)
  })
})

