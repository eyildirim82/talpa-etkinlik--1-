import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Check VITE_ prefix first (Vite), then fall back to NEXT_PUBLIC_ (Next.js/Compat)
  // @ts-ignore - Vite types for env vars
  const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || import.meta.env?.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  // @ts-ignore - Vite types for env vars
  const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase variables missing!', { supabaseUrl, supabaseAnonKey })
  }

  return createBrowserClient(
    supabaseUrl!,
    supabaseAnonKey!
  )
}