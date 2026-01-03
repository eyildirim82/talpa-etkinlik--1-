import { describe, it, expect } from 'vitest'
import { render, screen } from '@/shared/test-utils/test-utils'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('should render empty state message', () => {
    render(<EmptyState />)

    expect(screen.getByText('NO ACTIVE SORTIES')).toBeInTheDocument()
    expect(screen.getByText('RADAR CLEAR')).toBeInTheDocument()
    expect(screen.getByText(/Şu anda planlanmış aktif bir etkinlik/i)).toBeInTheDocument()
  })

  it('should display system standby status', () => {
    render(<EmptyState />)

    expect(screen.getByText('SYSTEM STANDBY')).toBeInTheDocument()
  })

  it('should render plane icon', () => {
    render(<EmptyState />)

    // Plane icon should be rendered (checking for icon presence)
    const planeIcon = document.querySelector('svg')
    expect(planeIcon).toBeTruthy()
  })
})

