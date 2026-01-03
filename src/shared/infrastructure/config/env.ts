/**
 * Environment Configuration
 * Centralized environment variable access with fallbacks
 */

// Supabase Configuration
export function getSupabaseUrl(): string {
  // @ts-ignore - Vite types for env vars
  return import.meta.env?.VITE_SUPABASE_URL || 
         import.meta.env?.NEXT_PUBLIC_SUPABASE_URL || 
         import.meta.env?.VITE_NEXT_PUBLIC_SUPABASE_URL || 
         process.env?.NEXT_PUBLIC_SUPABASE_URL || 
         ''
}

export function getSupabaseAnonKey(): string {
  // @ts-ignore - Vite types for env vars
  return import.meta.env?.VITE_SUPABASE_ANON_KEY || 
         import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
         import.meta.env?.VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY || 
         process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
         ''
}

// Validate environment variables
export function validateEnv(): { valid: boolean; missing: string[] } {
  const missing: string[] = []
  
  if (!getSupabaseUrl()) missing.push('SUPABASE_URL')
  if (!getSupabaseAnonKey()) missing.push('SUPABASE_ANON_KEY')
  
  return {
    valid: missing.length === 0,
    missing
  }
}

