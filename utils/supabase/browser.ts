// Client-side Supabase client for Vite
import { createBrowserClient } from '@supabase/ssr'

// Use process.env for Next.js, import.meta.env for Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
