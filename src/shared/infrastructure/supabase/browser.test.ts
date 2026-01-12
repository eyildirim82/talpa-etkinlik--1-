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
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')

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

    vi.unstubAllEnvs()
  })

  it('should throw error if VITE_ env vars are missing', () => {
    vi.unstubAllEnvs()
    delete import.meta.env.VITE_SUPABASE_URL
    delete import.meta.env.VITE_SUPABASE_ANON_KEY

    expect(() => createClient()).toThrow('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables are required')
  })
})

