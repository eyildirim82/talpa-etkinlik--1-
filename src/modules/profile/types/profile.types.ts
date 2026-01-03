/**
 * Profile Module Types
 */
import type { Database } from '@/shared/infrastructure/supabase/types'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

