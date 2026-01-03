import { describe, it, expect, vi, beforeEach } from 'vitest'
import { assignTicket, getTicketPool, getTicketStats } from './ticket.api'
import { createMockSupabaseClient, setupMockAuth } from '@/shared/test-utils/supabase-mock'
import { createMockUser } from '@/shared/test-utils/test-data'

// Mock the supabase infrastructure
vi.mock('@/shared/infrastructure/supabase', () => ({
  createBrowserClient: vi.fn(),
}))

describe('Ticket API', () => {
  let mockSupabase: any

  beforeEach(async () => {
    mockSupabase = createMockSupabaseClient()
    const { createBrowserClient } = await import('@/shared/infrastructure/supabase')
    vi.mocked(createBrowserClient).mockReturnValue(mockSupabase as any)
  })

  describe('assignTicket', () => {
    it('should assign ticket successfully as admin', async () => {
      const adminUser = createMockUser({ is_admin: true })
      setupMockAuth(mockSupabase, adminUser)

      const queryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { is_admin: true, role: 'admin' },
              error: null,
            }),
          })),
        })),
      }

      mockSupabase.from.mockReturnValue(queryBuilder)
      mockSupabase.rpc.mockResolvedValue({
        data: {
          status: 'success',
          message: 'Bilet atandı',
          ticket_id: 'ticket-123',
          file_path: 'tickets/ticket-123.pdf',
        },
        error: null,
      })

      const result = await assignTicket(1)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Bilet atandı')
      expect(result.ticket_id).toBe('ticket-123')
      expect(result.file_path).toBe('tickets/ticket-123.pdf')
      expect(mockSupabase.rpc).toHaveBeenCalledWith('assign_ticket', {
        booking_id_param: 1,
      })
    })

    it('should return error when user is not admin', async () => {
      const regularUser = createMockUser({ is_admin: false })
      setupMockAuth(mockSupabase, regularUser)

      const queryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { is_admin: false, role: 'member' },
              error: null,
            }),
          })),
        })),
      }

      mockSupabase.from.mockReturnValue(queryBuilder)

      const result = await assignTicket(1)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Yetkisiz erişim.')
    })

    it('should handle RPC errors', async () => {
      const adminUser = createMockUser({ is_admin: true })
      setupMockAuth(mockSupabase, adminUser)

      const queryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { is_admin: true, role: 'admin' },
              error: null,
            }),
          })),
        })),
      }

      mockSupabase.from.mockReturnValue(queryBuilder)
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await assignTicket(1)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Bağlantı hatası.')

      consoleSpy.mockRestore()
    })

    it('should handle business logic errors from RPC', async () => {
      const adminUser = createMockUser({ is_admin: true })
      setupMockAuth(mockSupabase, adminUser)

      const queryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { is_admin: true, role: 'admin' },
              error: null,
            }),
          })),
        })),
      }

      mockSupabase.from.mockReturnValue(queryBuilder)
      mockSupabase.rpc.mockResolvedValue({
        data: {
          status: 'error',
          message: 'Bilet havuzunda bilet yok',
        },
        error: null,
      })

      const result = await assignTicket(1)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Bilet havuzunda bilet yok')
    })
  })

  describe('getTicketPool', () => {
    it('should fetch ticket pool with pagination', async () => {
      const mockTickets = [
        { id: 1, event_id: 1, file_name: 'ticket1.pdf', is_assigned: false },
        { id: 2, event_id: 1, file_name: 'ticket2.pdf', is_assigned: true },
      ]

      const queryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn().mockResolvedValue({
                data: mockTickets,
                error: null,
                count: 2,
              }),
            })),
          })),
        })),
      }

      mockSupabase.from.mockReturnValue(queryBuilder)

      const result = await getTicketPool(1, 1, 20)

      expect(result.data).toEqual(mockTickets)
      expect(result.count).toBe(2)
    })

    it('should handle pagination correctly', async () => {
      const queryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn().mockResolvedValue({
                data: [],
                error: null,
                count: 0,
              }),
            })),
          })),
        })),
      }

      mockSupabase.from.mockReturnValue(queryBuilder)

      const result = await getTicketPool(1, 2, 10)

      expect(result.data).toEqual([])
      expect(result.count).toBe(0)
    })
  })

  describe('getTicketStats', () => {
    it('should calculate ticket stats correctly', async () => {
      const totalQueryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            count: 100,
          }),
        })),
      }

      const assignedQueryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              count: 75,
            }),
          })),
        })),
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'ticket_pool') {
          // First call for total, second for assigned
          let callCount = 0
          return {
            select: vi.fn(() => {
              callCount++
              if (callCount === 1) {
                return totalQueryBuilder.select()
              }
              return assignedQueryBuilder.select()
            }),
          }
        }
        return createMockSupabaseClient().from(table)
      })

      const result = await getTicketStats(1)

      expect(result.total).toBe(100)
      expect(result.assigned).toBe(75)
      expect(result.unassigned).toBe(25) // 100 - 75
    })

    it('should handle zero tickets', async () => {
      const queryBuilder = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              count: 0,
            }),
          })),
        })),
      }

      mockSupabase.from.mockReturnValue(queryBuilder)

      const result = await getTicketStats(1)

      expect(result.total).toBe(0)
      expect(result.assigned).toBe(0)
      expect(result.unassigned).toBe(0)
    })
  })
})

