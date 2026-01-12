/**
 * ARCHIVED: Server-Side Supabase Client (utils/supabase/server.ts)
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
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
