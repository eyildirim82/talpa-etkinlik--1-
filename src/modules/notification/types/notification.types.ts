/**
 * Notification Module Types
 */

export type NotificationType = 'TICKET_ASSIGNED' | 'REGISTRATION_RECEIVED' | 'PAYMENT_RECEIVED' | 'WAITLIST_PROMOTED'

export interface NotificationPayload {
  eventTitle?: string
  userName?: string
  pdfUrl?: string
  [key: string]: any
}

export interface NotificationResponse {
  success: boolean
  message: string
}

