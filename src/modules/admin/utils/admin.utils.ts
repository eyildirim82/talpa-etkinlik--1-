import { createBrowserClient } from '@/shared/infrastructure/supabase'
import type { AdminResponse } from '../types/admin.types'

/**
 * Promote first yedek to asil (admin only)
 */
export async function promoteFromWaitlist(eventId: number): Promise<AdminResponse> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.rpc('promote_from_waitlist', {
    event_id_param: eventId
  })

  if (error) {
    console.error('Promote Waitlist RPC Error:', error)
    return { success: false, message: 'Bağlantı hatası.' }
  }

  if (data.status === 'error') {
    return { success: false, message: data.message || 'Yedekten asile geçiş yapılamadı.' }
  }

  return { success: true, message: data.message || 'Yedek listeden asile çıkarıldı.' }
}

