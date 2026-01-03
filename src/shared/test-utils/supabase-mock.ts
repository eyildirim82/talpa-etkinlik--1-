import { vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Mock Supabase Client Factory
 * Creates a mock Supabase client for testing
 */
export function createMockSupabaseClient(): Partial<SupabaseClient> {
  const mockClient = {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(),
            single: vi.fn(),
          })),
          maybeSingle: vi.fn(),
          single: vi.fn(),
          order: vi.fn(() => ({
            range: vi.fn(),
          })),
          range: vi.fn(),
        })),
        maybeSingle: vi.fn(),
        single: vi.fn(),
        order: vi.fn(() => ({
          range: vi.fn(),
        })),
        range: vi.fn(),
        in: vi.fn(() => ({
          eq: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
    rpc: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
        list: vi.fn(),
      })),
    },
    functions: {
      invoke: vi.fn(),
    },
  }

  return mockClient as any
}

/**
 * Helper to setup mock responses
 */
export function setupMockAuth(mockClient: any, user: any = null) {
  mockClient.auth.getUser.mockResolvedValue({
    data: { user },
    error: null,
  })

  mockClient.auth.getSession.mockResolvedValue({
    data: { session: user ? { user } : null },
    error: null,
  })

  mockClient.auth.onAuthStateChange.mockImplementation((callback: any) => {
    callback('SIGNED_IN', { user })
    return {
      data: { subscription: { unsubscribe: vi.fn() } },
    }
  })
}

/**
 * Helper to setup mock database queries
 */
export function setupMockQuery(
  mockClient: any,
  table: string,
  response: any,
  options: { count?: number } = {}
) {
  const queryBuilder = {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: response,
            error: null,
            count: options.count,
          }),
          single: vi.fn().mockResolvedValue({
            data: response,
            error: null,
            count: options.count,
          }),
        })),
        maybeSingle: vi.fn().mockResolvedValue({
          data: response,
          error: null,
          count: options.count,
        }),
        single: vi.fn().mockResolvedValue({
          data: response,
          error: null,
          count: options.count,
        }),
        order: vi.fn(() => ({
          range: vi.fn().mockResolvedValue({
            data: response,
            error: null,
            count: options.count,
          }),
        })),
        range: vi.fn().mockResolvedValue({
          data: response,
          error: null,
          count: options.count,
        }),
        in: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: response,
            error: null,
            count: options.count,
          }),
        })),
      })),
      maybeSingle: vi.fn().mockResolvedValue({
        data: response,
        error: null,
        count: options.count,
      }),
      single: vi.fn().mockResolvedValue({
        data: response,
        error: null,
        count: options.count,
      }),
      order: vi.fn(() => ({
        range: vi.fn().mockResolvedValue({
          data: response,
          error: null,
          count: options.count,
        }),
      })),
      range: vi.fn().mockResolvedValue({
        data: response,
        error: null,
        count: options.count,
      }),
      in: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({
          data: response,
          error: null,
          count: options.count,
        }),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: response,
          error: null,
        }),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: response,
            error: null,
          }),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({
        error: null,
      }),
    })),
  }

  mockClient.from.mockImplementation((tableName: string) => {
    if (tableName === table) {
      return queryBuilder
    }
    return queryBuilder
  })
}

