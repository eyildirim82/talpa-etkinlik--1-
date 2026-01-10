/**
 * Profile Module Types
 */
import type { Database } from '@/shared/infrastructure/supabase/types'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

/**
 * User interface - matches 'profiles' table
 * Backward compatibility alias for Profile
 */
export interface User {
  id: string
  full_name: string
  talpa_sicil_no: string | null
  phone: string | null
  is_admin: boolean | null
  created_at: string
  updated_at: string
  email?: string
}
