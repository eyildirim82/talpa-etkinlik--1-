// Client-side Supabase client for Vite
import { createBrowserClient } from '@supabase/ssr'

// Vite uses import.meta.env with VITE_ prefix
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables are required')
}

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

