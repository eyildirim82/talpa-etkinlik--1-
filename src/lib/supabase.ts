
import { createBrowserClient } from '@supabase/ssr';

// Robust environment variable loading (Vite + fallback)
// @ts-ignore
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_URL || '';
// @ts-ignore
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Key is missing from environment variables! Check your .env file.');
} else {
    console.log('Supabase Client Initialized', { url: supabaseUrl });
}

// Export a single instance to match previous usage in Login.tsx
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    db: {
        schema: 'public'
    },
    auth: {
        persistSession: true,
        autoRefreshToken: true
    }
});
