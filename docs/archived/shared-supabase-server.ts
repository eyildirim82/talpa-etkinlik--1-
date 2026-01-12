/**
 * ARCHIVED: Server-Side Supabase Client (src/shared/infrastructure/supabase/server.ts)
 * 
 * Bu dosya Next.js server-side Supabase client implementasyonunu içerir.
 * Vite projesine geçiş nedeniyle arşivlenmiştir.
 * 
 * Vite SPA olduğu için server-side client'a gerek yoktur.
 * Tüm Supabase işlemleri browser client ile yapılmaktadır.
 * 
 * Arşivlenme Tarihi: 2026-01-XX
 */

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
    return () => ({ get: () => null, set: () => { }, delete: () => { } })
  }
}

export async function createClient() {
  const cookiesFn = await getCookies()
  const cookieStore = await cookiesFn()

  // Use standard Next.js env vars
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
