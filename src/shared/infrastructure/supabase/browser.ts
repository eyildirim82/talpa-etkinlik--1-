// Client-side Supabase client for Vite
import { createBrowserClient } from '@supabase/ssr'

// Vite uses import.meta.env instead of process.env
// Check VITE_ prefix first, then fall back to NEXT_PUBLIC_ for compatibility
// @ts-ignore - Vite types for env vars
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_URL
// @ts-ignore - Vite types for env vars  
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY

export function createClient() {
    return createBrowserClient(supabaseUrl!, supabaseAnonKey!, {
        db: {
            schema: 'public'
        },
        auth: {
            persistSession: true,
            autoRefreshToken: true
        }
    })
}

