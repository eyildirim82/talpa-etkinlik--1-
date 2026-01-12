/**
 * Event Module Types
 */
import type { Database } from '@/shared/infrastructure/supabase/types'

// Event Status Enum (matches database enum)
export type EventStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

export const EventStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED'
} as const

export type Event = Database['public']['Tables']['events']['Row']
export type EventInsert = Database['public']['Tables']['events']['Insert']
export type EventUpdate = Database['public']['Tables']['events']['Update']
export type ActiveEvent = Database['public']['Views']['active_event_view']['Row']

export interface EventData extends ActiveEvent {
  // Backward compatibility fields
  quota_asil?: number
  quota_yedek?: number
  cut_off_date?: string
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
}

export interface CreateEventData {
  title: string
  description?: string
  event_date: string
  location_url?: string
  price: number
  quota_asil: number
  quota_yedek: number
  cut_off_date: string
  banner_image?: string
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
}

export interface EventStats {
  quota_asil: number
  quota_yedek: number
  asil_count: number
  yedek_count: number
  paid_count: number
  revenue: number
}

export interface EventResponse {
  success: boolean
  message: string
  stats?: EventStats
}

