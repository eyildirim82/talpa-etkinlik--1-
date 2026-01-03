import { describe, it, expect, vi, beforeEach } from 'vitest'
import { login, signup, logout, loginWithFormData, signupWithFormData } from './auth.api'
import { createMockSupabaseClient, setupMockAuth } from '@/shared/test-utils/supabase-mock'
import { createMockUser } from '@/shared/test-utils/test-data'

// Mock the supabase infrastructure
vi.mock('@/shared/infrastructure/supabase', () => ({
  createBrowserClient: vi.fn(),
}))

describe('Auth API', () => {
  let mockSupabase: any

  beforeEach(async () => {
    mockSupabase = createMockSupabaseClient()
    const { createBrowserClient } = await import('@/shared/infrastructure/supabase')
    vi.mocked(createBrowserClient).mockReturnValue(mockSupabase as any)
  })

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = createMockUser()
      setupMockAuth(mockSupabase, mockUser)

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await login({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.success).toBe(true)
      expect(result.message).toBe('Giriş başarılı.')
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('should return error on invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' },
      })

      const result = await login({
        email: 'test@example.com',
        password: 'wrongpassword',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('Giriş başarısız. Bilgilerinizi kontrol ediniz.')
    })

    it('should handle network errors', async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValue(
        new Error('Network error')
      )

      const result = await login({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('signup', () => {
    it('should signup successfully with valid data', async () => {
      const mockUser = createMockUser()
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await signup({
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
        sicilNo: 'TALPA-002',
      })

      expect(result.success).toBe(true)
      expect(result.message).toBe('Kayıt başarılı. Giriş yapabilirsiniz.')
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'New User',
            talpa_sicil_no: 'TALPA-002',
          },
        },
      })
    })

    it('should return error on signup failure', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already exists' },
      })

      const result = await signup({
        email: 'existing@example.com',
        password: 'password123',
        fullName: 'Existing User',
        sicilNo: 'TALPA-001',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('Email already exists')
    })

    it('should return error when user is not created', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await signup({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        sicilNo: 'TALPA-001',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('Kayıt oluşturulamadı.')
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      })

      const result = await logout()

      expect(result.success).toBe(true)
      expect(result.message).toBe('Çıkış başarılı.')
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })
  })

  describe('loginWithFormData', () => {
    it('should extract credentials from FormData and login', async () => {
      const mockUser = createMockUser()
      setupMockAuth(mockSupabase, mockUser)

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')

      const result = await loginWithFormData(formData)

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  describe('signupWithFormData', () => {
    it('should extract data from FormData and signup', async () => {
      const mockUser = createMockUser()
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const formData = new FormData()
      formData.append('email', 'newuser@example.com')
      formData.append('password', 'password123')
      formData.append('fullName', 'New User')
      formData.append('sicilNo', 'TALPA-002')

      const result = await signupWithFormData(formData)

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'New User',
            talpa_sicil_no: 'TALPA-002',
          },
        },
      })
    })
  })
})

