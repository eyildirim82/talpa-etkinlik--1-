import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from './browser'

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn((url, key, options) => ({
    url,
    key,
    options,
  })),
}))

describe('createClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a browser client with correct configuration', () => {
    // Mock environment variables
    const originalEnv = import.meta.env
    // @ts-ignore
    import.meta.env = {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    }

    const client = createClient()

    expect(client).toBeDefined()
    expect(client.url).toBe('https://test.supabase.co')
    expect(client.key).toBe('test-anon-key')
    expect(client.options).toMatchObject({
      db: { schema: 'public' },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })

    // Restore
    // @ts-ignore
    import.meta.env = originalEnv
  })

  it('should fallback to NEXT_PUBLIC_ prefix if VITE_ not available', () => {
    const originalEnv = import.meta.env
    // @ts-ignore
    import.meta.env = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://fallback.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'fallback-key',
    }

    const client = createClient()

    expect(client.url).toBe('https://fallback.supabase.co')
    expect(client.key).toBe('fallback-key')

    // Restore
    // @ts-ignore
    import.meta.env = originalEnv
  })
})

