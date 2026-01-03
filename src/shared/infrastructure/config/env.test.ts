import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
  validateEnv,
} from './env'

describe('Environment Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSupabaseUrl', () => {
    it('should return VITE_SUPABASE_URL if available', () => {
      const originalEnv = import.meta.env
      // @ts-ignore
      import.meta.env = {
        VITE_SUPABASE_URL: 'https://vite.supabase.co',
        NEXT_PUBLIC_SUPABASE_URL: 'https://next.supabase.co',
      }

      expect(getSupabaseUrl()).toBe('https://vite.supabase.co')

      // Restore
      // @ts-ignore
      import.meta.env = originalEnv
    })

    it('should fallback to NEXT_PUBLIC_SUPABASE_URL', () => {
      const originalEnv = import.meta.env
      // @ts-ignore
      import.meta.env = {
        NEXT_PUBLIC_SUPABASE_URL: 'https://next.supabase.co',
      }

      expect(getSupabaseUrl()).toBe('https://next.supabase.co')

      // Restore
      // @ts-ignore
      import.meta.env = originalEnv
    })

    it('should return empty string if no env var is set', () => {
      const originalEnv = import.meta.env
      // @ts-ignore
      import.meta.env = {}

      expect(getSupabaseUrl()).toBe('')

      // Restore
      // @ts-ignore
      import.meta.env = originalEnv
    })
  })

  describe('getSupabaseAnonKey', () => {
    it('should return VITE_SUPABASE_ANON_KEY if available', () => {
      const originalEnv = import.meta.env
      // @ts-ignore
      import.meta.env = {
        VITE_SUPABASE_ANON_KEY: 'vite-key',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'next-key',
      }

      expect(getSupabaseAnonKey()).toBe('vite-key')

      // Restore
      // @ts-ignore
      import.meta.env = originalEnv
    })

    it('should fallback to NEXT_PUBLIC_SUPABASE_ANON_KEY', () => {
      const originalEnv = import.meta.env
      // @ts-ignore
      import.meta.env = {
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'next-key',
      }

      expect(getSupabaseAnonKey()).toBe('next-key')

      // Restore
      // @ts-ignore
      import.meta.env = originalEnv
    })
  })

  describe('validateEnv', () => {
    it('should return valid: true when all env vars are set', () => {
      const originalEnv = import.meta.env
      // @ts-ignore
      import.meta.env = {
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-key',
      }

      const result = validateEnv()

      expect(result.valid).toBe(true)
      expect(result.missing).toEqual([])

      // Restore
      // @ts-ignore
      import.meta.env = originalEnv
    })

    it('should return valid: false when SUPABASE_URL is missing', () => {
      const originalEnv = import.meta.env
      // @ts-ignore
      import.meta.env = {
        VITE_SUPABASE_ANON_KEY: 'test-key',
      }

      const result = validateEnv()

      expect(result.valid).toBe(false)
      expect(result.missing).toContain('SUPABASE_URL')

      // Restore
      // @ts-ignore
      import.meta.env = originalEnv
    })

    it('should return valid: false when SUPABASE_ANON_KEY is missing', () => {
      const originalEnv = import.meta.env
      // @ts-ignore
      import.meta.env = {
        VITE_SUPABASE_URL: 'https://test.supabase.co',
      }

      const result = validateEnv()

      expect(result.valid).toBe(false)
      expect(result.missing).toContain('SUPABASE_ANON_KEY')

      // Restore
      // @ts-ignore
      import.meta.env = originalEnv
    })

    it('should return all missing vars when none are set', () => {
      const originalEnv = import.meta.env
      // @ts-ignore
      import.meta.env = {}

      const result = validateEnv()

      expect(result.valid).toBe(false)
      expect(result.missing).toContain('SUPABASE_URL')
      expect(result.missing).toContain('SUPABASE_ANON_KEY')

      // Restore
      // @ts-ignore
      import.meta.env = originalEnv
    })
  })
})

