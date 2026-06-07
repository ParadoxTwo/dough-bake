import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBadge from './StatusBadge'

describe('StatusBadge', () => {
  it('humanizes underscores in delivery statuses', () => {
    render(<StatusBadge status="in_transit" />)
    expect(screen.getByText('in transit')).toBeInTheDocument()
  })

  it('maps delivered to the green token (not the cancelled fallback)', () => {
    render(<StatusBadge status="delivered" />)
    expect(screen.getByText('delivered')).toHaveStyle({ color: 'rgb(22, 163, 74)' })
  })

  it('falls back to the cancelled (red) token for unknown statuses', () => {
    render(<StatusBadge status="something-unknown" />)
    expect(screen.getByText('something-unknown')).toHaveStyle({ color: 'rgb(185, 28, 28)' })
  })
})
