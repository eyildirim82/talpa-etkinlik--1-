import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useAuth } from './useAuth'
import * as authApi from '../api/auth.api'
import { createMockUser } from '@/shared/test-utils/test-data'

// Mock auth API
vi.mock('../api/auth.api', () => ({
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
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

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide login, signup, and logout functions', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    expect(result.current.login).toBeDefined()
    expect(result.current.signup).toBeDefined()
    expect(result.current.logout).toBeDefined()
    expect(typeof result.current.login).toBe('function')
    expect(typeof result.current.signup).toBe('function')
    expect(typeof result.current.logout).toBe('function')
  })

  it('should call login API when login is called', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      success: true,
      message: 'Giriş başarılı.',
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    result.current.login({
      email: 'test@example.com',
      password: 'password123',
    })

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('should call signup API when signup is called', async () => {
    vi.mocked(authApi.signup).mockResolvedValue({
      success: true,
      message: 'Kayıt başarılı.',
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    result.current.signup({
      email: 'newuser@example.com',
      password: 'password123',
      fullName: 'New User',
      sicilNo: 'TALPA-002',
    })

    await waitFor(() => {
      expect(authApi.signup).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
        sicilNo: 'TALPA-002',
      })
    })
  })

  it('should call logout API when logout is called', async () => {
    vi.mocked(authApi.logout).mockResolvedValue({
      success: true,
      message: 'Çıkış başarılı.',
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    result.current.logout()

    await waitFor(() => {
      expect(authApi.logout).toHaveBeenCalled()
    })
  })

  it('should show loading state during login', async () => {
    vi.mocked(authApi.login).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true, message: 'Success' }), 100))
    )

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    result.current.login({
      email: 'test@example.com',
      password: 'password123',
    })

    // Loading should be true initially
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })
})

