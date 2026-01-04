/**
 * Environment Configuration
 * Centralized environment variable access with fallbacks
 */

// Supabase Configuration
// Supabase Configuration
export function getSupabaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
}

export function getSupabaseAnonKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
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

