import { describe, it, expect } from 'vitest'
import { processPayment } from './payment.api'

describe('Payment API', () => {
  describe('processPayment', () => {
    it('should return placeholder response', async () => {
      const result = await processPayment(1, 100)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Ödeme işlemi henüz implement edilmedi.')
    })

    it('should accept bookingId and amount parameters', async () => {
      const result = await processPayment(123, 250)

      expect(result).toBeDefined()
      expect(result.success).toBe(false)
    })
  })
})

