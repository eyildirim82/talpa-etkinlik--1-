
import { createBrowserClient } from '@supabase/ssr';

// Robust environment variable loading (Vite + fallback)
// Robust environment variable loading
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
