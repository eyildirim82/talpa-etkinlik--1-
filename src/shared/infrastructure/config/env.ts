/**
 * Environment Configuration
 * Centralized environment variable access for Vite
 * 
 * Note: Vite uses VITE_ prefix for environment variables
 */

// Supabase Configuration
export function getSupabaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL
  if (!url) {
    throw new Error('VITE_SUPABASE_URL environment variable is required')
  }
  return url
}

export function getSupabaseAnonKey(): string {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!key) {
    throw new Error('VITE_SUPABASE_ANON_KEY environment variable is required')
  }
  return key
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

