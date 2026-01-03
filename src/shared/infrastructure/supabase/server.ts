import { createServerClient, type CookieOptions } from '@supabase/ssr'
// Vite'ta next/headers kullanılamaz, bu dosya sadece Next.js için
// @ts-ignore - Dynamic import to avoid Vite parsing errors
const getCookies = async () => {
  try {
    // @ts-ignore
    const { cookies } = await import('next/headers')
    return cookies
  } catch {
    // Vite context - return stub
    return () => ({ get: () => null, set: () => {}, delete: () => {} })
  }
}

export async function createClient() {
  const cookiesFn = await getCookies()
  const cookieStore = await cookiesFn()

  // Check VITE_ prefix first (Vite), then fall back to NEXT_PUBLIC_ (Next.js/Compat)
  // @ts-ignore - Vite types for env vars
  const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || import.meta.env?.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  // @ts-ignore - Vite types for env vars
  const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase variables missing!', { supabaseUrl, supabaseAnonKey })
  }

  return createServerClient(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

