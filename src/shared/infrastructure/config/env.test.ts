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
      vi.stubEnv('VITE_SUPABASE_URL', 'https://vite.supabase.co')

      expect(getSupabaseUrl()).toBe('https://vite.supabase.co')

      vi.unstubAllEnvs()
    })

    it('should throw error if VITE_SUPABASE_URL is not set', () => {
      vi.unstubAllEnvs()
      delete import.meta.env.VITE_SUPABASE_URL

      expect(() => getSupabaseUrl()).toThrow('VITE_SUPABASE_URL environment variable is required')
    })
  })

  describe('getSupabaseAnonKey', () => {
    it('should return VITE_SUPABASE_ANON_KEY if available', () => {
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'vite-key')

      expect(getSupabaseAnonKey()).toBe('vite-key')

      vi.unstubAllEnvs()
    })

    it('should throw error if VITE_SUPABASE_ANON_KEY is not set', () => {
      vi.unstubAllEnvs()
      delete import.meta.env.VITE_SUPABASE_ANON_KEY

      expect(() => getSupabaseAnonKey()).toThrow('VITE_SUPABASE_ANON_KEY environment variable is required')
    })
  })

  describe('validateEnv', () => {
    it('should return valid: true when all env vars are set', () => {
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key')

      const result = validateEnv()

      expect(result.valid).toBe(true)
      expect(result.missing).toEqual([])

      vi.unstubAllEnvs()
    })

    it('should return valid: false when SUPABASE_URL is missing', () => {
      vi.unstubAllEnvs()
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key')
      delete import.meta.env.VITE_SUPABASE_URL

      const result = validateEnv()

      expect(result.valid).toBe(false)
      expect(result.missing).toContain('SUPABASE_URL')

      vi.unstubAllEnvs()
    })

    it('should return valid: false when SUPABASE_ANON_KEY is missing', () => {
      vi.unstubAllEnvs()
      vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
      delete import.meta.env.VITE_SUPABASE_ANON_KEY

      const result = validateEnv()

      expect(result.valid).toBe(false)
      expect(result.missing).toContain('SUPABASE_ANON_KEY')

      vi.unstubAllEnvs()
    })

    it('should return all missing vars when none are set', () => {
      vi.unstubAllEnvs()
      delete import.meta.env.VITE_SUPABASE_URL
      delete import.meta.env.VITE_SUPABASE_ANON_KEY

      const result = validateEnv()

      expect(result.valid).toBe(false)
      expect(result.missing).toContain('SUPABASE_URL')
      expect(result.missing).toContain('SUPABASE_ANON_KEY')
    })
  })
})

