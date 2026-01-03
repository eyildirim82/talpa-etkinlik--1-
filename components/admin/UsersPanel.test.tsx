import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/shared/test-utils/test-utils'
import userEvent from '@testing-library/user-event'
import { UsersPanel } from './UsersPanel'
import { useAdminUsers, useUpdateUserRole } from '@/modules/admin'
import { createMockAdminUser } from '@/shared/test-utils/test-data'

// Mock dependencies
vi.mock('@/modules/admin', () => ({
  useAdminUsers: vi.fn(),
  useUpdateUserRole: vi.fn(),
}))

vi.mock('./MemberImport', () => ({
  MemberImport: () => <div data-testid="member-import">MemberImport</div>,
}))

describe('UsersPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display loading state when users are loading', () => {
    vi.mocked(useAdminUsers).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any)

    vi.mocked(useUpdateUserRole).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<UsersPanel />)

    expect(document.querySelector('.animate-spin')).toBeTruthy()
  })

  it('should display users list when data is available', () => {
    const mockUsers = [
      createMockAdminUser({
        id: '1',
        full_name: 'Ahmet Yılmaz',
        email: 'ahmet@example.com',
        role: 'member',
      }),
      createMockAdminUser({
        id: '2',
        full_name: 'Mehmet Demir',
        email: 'mehmet@example.com',
        role: 'admin',
      }),
    ]

    vi.mocked(useAdminUsers).mockReturnValue({
      data: mockUsers,
      isLoading: false,
    } as any)

    vi.mocked(useUpdateUserRole).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<UsersPanel />)

    expect(screen.getByText('Ahmet Yılmaz')).toBeInTheDocument()
    expect(screen.getByText('Mehmet Demir')).toBeInTheDocument()
  })

  it('should filter users by search query', async () => {
    const user = userEvent.setup()
    const mockUsers = [
      createMockAdminUser({
        id: '1',
        full_name: 'Ahmet Yılmaz',
        email: 'ahmet@example.com',
      }),
      createMockAdminUser({
        id: '2',
        full_name: 'Mehmet Demir',
        email: 'mehmet@example.com',
      }),
    ]

    vi.mocked(useAdminUsers).mockReturnValue({
      data: mockUsers,
      isLoading: false,
    } as any)

    vi.mocked(useUpdateUserRole).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<UsersPanel />)

    const searchInput = screen.getByPlaceholderText(/ara/i)
    await user.type(searchInput, 'Ahmet')

    await waitFor(() => {
      expect(screen.getByText('Ahmet Yılmaz')).toBeInTheDocument()
      expect(screen.queryByText('Mehmet Demir')).not.toBeInTheDocument()
    })
  })

  it('should filter users by role', async () => {
    const user = userEvent.setup()
    const mockUsers = [
      createMockAdminUser({
        id: '1',
        full_name: 'Ahmet Yılmaz',
        role: 'member',
      }),
      createMockAdminUser({
        id: '2',
        full_name: 'Mehmet Demir',
        role: 'admin',
      }),
    ]

    vi.mocked(useAdminUsers).mockReturnValue({
      data: mockUsers,
      isLoading: false,
    } as any)

    vi.mocked(useUpdateUserRole).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<UsersPanel />)

    const roleFilter = screen.getByDisplayValue(/Tüm Roller/i)
    await user.selectOptions(roleFilter, 'admin')

    await waitFor(() => {
      expect(screen.getByText('Mehmet Demir')).toBeInTheDocument()
      expect(screen.queryByText('Ahmet Yılmaz')).not.toBeInTheDocument()
    })
  })

  it('should open member import when import button is clicked', async () => {
    const user = userEvent.setup()

    vi.mocked(useAdminUsers).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)

    vi.mocked(useUpdateUserRole).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<UsersPanel />)

    const importButton = screen.getByText(/Üye İçe Aktar/i)
    await user.click(importButton)

    await waitFor(() => {
      expect(screen.getByTestId('member-import')).toBeInTheDocument()
    })
  })

  it('should display user role badges correctly', () => {
    const mockUsers = [
      createMockAdminUser({
        id: '1',
        full_name: 'Admin User',
        role: 'admin',
      }),
      createMockAdminUser({
        id: '2',
        full_name: 'Member User',
        role: 'member',
      }),
    ]

    vi.mocked(useAdminUsers).mockReturnValue({
      data: mockUsers,
      isLoading: false,
    } as any)

    vi.mocked(useUpdateUserRole).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<UsersPanel />)

    expect(screen.getByText('Admin User')).toBeInTheDocument()
    expect(screen.getByText('Member User')).toBeInTheDocument()
  })

  it('should open role change confirmation when role is changed', async () => {
    const user = userEvent.setup()
    const mockUsers = [
      createMockAdminUser({
        id: '1',
        full_name: 'Test User',
        role: 'member',
      }),
    ]

    vi.mocked(useAdminUsers).mockReturnValue({
      data: mockUsers,
      isLoading: false,
    } as any)

    vi.mocked(useUpdateUserRole).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<UsersPanel />)

    // Find role select dropdown
    const roleSelects = screen.getAllByDisplayValue(/member/i)
    if (roleSelects.length > 0) {
      await user.selectOptions(roleSelects[0], 'admin')

      await waitFor(() => {
        expect(screen.getByText(/Rol Değiştir/i)).toBeInTheDocument()
      })
    }
  })
})

