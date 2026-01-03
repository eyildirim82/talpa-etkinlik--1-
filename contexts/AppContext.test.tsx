import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { AppProvider, useApp } from './AppContext'
import { useActiveEvent } from '@/modules/event'
import { useProfile } from '@/modules/profile'
import { logout } from '@/modules/auth'
import { createMockActiveEvent, createMockProfile } from '@/shared/test-utils/test-data'

// Mock dependencies
vi.mock('@/modules/event', () => ({
  useActiveEvent: vi.fn(),
}))

vi.mock('@/modules/profile', () => ({
  useProfile: vi.fn(),
}))

vi.mock('@/modules/auth', () => ({
  logout: vi.fn(),
}))

vi.mock('window', () => ({
  location: {
    reload: vi.fn(),
  },
}))

const createWrapper = (initialEvent: any, initialUser: any) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AppProvider initialEvent={initialEvent} initialUser={initialUser}>
        {children}
      </AppProvider>
    </QueryClientProvider>
  )
}

describe('AppContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide event and user from hooks', async () => {
    const mockEvent = createMockActiveEvent()
    const mockUser = createMockProfile()

    vi.mocked(useActiveEvent).mockReturnValue({
      data: mockEvent,
      isLoading: false,
    } as any)

    vi.mocked(useProfile).mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
    })

    const { result } = renderHook(() => useApp(), {
      wrapper: createWrapper(null, null),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.event).toEqual(mockEvent)
    expect(result.current.user).toEqual(mockUser)
  })

  it('should use initial values as fallback', async () => {
    const initialEvent = createMockActiveEvent()
    const initialUser = createMockProfile()

    vi.mocked(useActiveEvent).mockReturnValue({
      data: null,
      isLoading: false,
    } as any)

    vi.mocked(useProfile).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    })

    const { result } = renderHook(() => useApp(), {
      wrapper: createWrapper(initialEvent, initialUser),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.event).toEqual(initialEvent)
    expect(result.current.user).toEqual(initialUser)
  })

  it('should handle logout correctly', async () => {
    vi.mocked(useActiveEvent).mockReturnValue({
      data: null,
      isLoading: false,
    } as any)

    vi.mocked(useProfile).mockReturnValue({
      user: createMockProfile(),
      isLoading: false,
      isAuthenticated: true,
    })

    vi.mocked(logout).mockResolvedValue({
      success: true,
      message: 'Logged out',
    })

    const { result } = renderHook(() => useApp(), {
      wrapper: createWrapper(null, null),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await result.current.logout()

    expect(logout).toHaveBeenCalled()
  })

  it('should show loading state when hooks are loading', () => {
    vi.mocked(useActiveEvent).mockReturnValue({
      data: null,
      isLoading: true,
    } as any)

    vi.mocked(useProfile).mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
    })

    const { result } = renderHook(() => useApp(), {
      wrapper: createWrapper(null, null),
    })

    expect(result.current.isLoading).toBe(true)
  })
})

