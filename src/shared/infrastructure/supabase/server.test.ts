import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from './server'

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn((name: string) => ({
      value: `cookie-${name}`,
    })),
    set: vi.fn(),
  })),
}))

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((url, key, options) => ({
    url,
    key,
    options,
  })),
}))

describe('createClient (Server)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a server client with correct configuration', async () => {
    // Mock environment variables
    const originalEnv = import.meta.env
    // @ts-ignore
    import.meta.env = {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    }

    const client = await createClient()

    expect(client).toBeDefined()
    expect(client.url).toBe('https://test.supabase.co')
    expect(client.key).toBe('test-anon-key')
    expect(client.options).toBeDefined()
    expect(client.options.cookies).toBeDefined()

    // Restore
    // @ts-ignore
    import.meta.env = originalEnv
  })

  it('should handle cookie operations', async () => {
    const originalEnv = import.meta.env
    // @ts-ignore
    import.meta.env = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://fallback.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'fallback-key',
    }

    const client = await createClient()

    expect(client).toBeDefined()
    expect(client.options.cookies.get).toBeDefined()
    expect(client.options.cookies.set).toBeDefined()
    expect(client.options.cookies.remove).toBeDefined()

    // Restore
    // @ts-ignore
    import.meta.env = originalEnv
  })
})

