/**
 * Payment Module Types
 */

export type PaymentStatus = 'WAITING' | 'PAID'

export interface PaymentResponse {
  success: boolean
  message: string
}

