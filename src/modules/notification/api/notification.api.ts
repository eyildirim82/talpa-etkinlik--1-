import { createBrowserClient } from '@/shared/infrastructure/supabase'
import { logger } from '@/shared/utils/logger'
import type { NotificationType, NotificationPayload, NotificationResponse } from '../types/notification.types'

/**
 * Send notification via email
 */
export async function sendNotification(
  type: NotificationType,
  to: string[],
  payload: NotificationPayload
): Promise<NotificationResponse> {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        type,
        to,
        payload
      }
    })

    if (error) {
      logger.error('Send Email Error:', error)
      return { success: false, message: 'E-posta gönderilemedi.' }
    }

    return { success: true, message: 'E-posta başarıyla gönderildi.' }
  } catch (err) {
    logger.error('Unexpected Error:', err)
    return { success: false, message: 'Beklenmeyen bir hata oluştu.' }
  }
}

