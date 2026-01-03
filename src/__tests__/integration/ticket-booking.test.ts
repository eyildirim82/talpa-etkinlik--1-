import { describe, it, expect, vi, beforeEach } from 'vitest'
import { assignTicket } from '@/modules/ticket'
import { createMockSupabaseClient, setupMockAuth } from '@/shared/test-utils/supabase-mock'
import { createMockUser } from '@/shared/test-utils/test-data'

// Mock the supabase infrastructure
vi.mock('@/shared/infrastructure/supabase', () => ({
  createBrowserClient: vi.fn(),
}))

describe('Ticket → Booking Integration', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    const { createBrowserClient } = await import('@/shared/infrastructure/supabase')
    vi.mocked(createBrowserClient).mockReturnValue(mockSupabase as any)
  })

  it('should assign ticket to booking successfully', async () => {
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
    expect(result.ticket_id).toBe('ticket-123')
    expect(result.file_path).toBe('tickets/ticket-123.pdf')
    expect(mockSupabase.rpc).toHaveBeenCalledWith('assign_ticket', {
      booking_id_param: 1,
    })
  })

  it('should handle ticket pool empty scenario', async () => {
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

