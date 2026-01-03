import type { PaymentResponse } from '../types/payment.types'

/**
 * Payment API
 * Note: Payment logic is currently handled within booking module
 * This module provides a placeholder for future payment gateway integration
 */

export async function processPayment(bookingId: number, amount: number): Promise<PaymentResponse> {
  // Placeholder for payment processing
  // Future: Integrate with payment gateway (iyzico, Stripe, etc.)
  return {
    success: false,
    message: 'Ödeme işlemi henüz implement edilmedi.'
  }
}

