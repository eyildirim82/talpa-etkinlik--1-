// Supabase Infrastructure Exports
export { createClient as createBrowserClient } from './browser'
export type { Database, Json } from './types'

// Server client is only for Next.js
// Use type-only import to avoid Vite parsing the server.ts file
// The actual export is done conditionally below
type ServerClient = typeof import('./server').createClient

// Re-export server client only if we're in a Next.js environment
// In Vite, this will be undefined (which is fine since it's not used)
let createServerClient: ServerClient | undefined

// Only import server.ts in Next.js context (not in Vite)
if (typeof window === 'undefined' && typeof process !== 'undefined' && process.env.NEXT_RUNTIME) {
  // @ts-ignore - Dynamic import to avoid Vite parsing
  const serverModule = await import('./server')
  createServerClient = serverModule.createClient
}

export { createServerClient }

