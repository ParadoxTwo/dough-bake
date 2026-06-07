import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Badge from './Badge'

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>New</Badge>)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('merges a custom className', () => {
    render(<Badge className="custom-class">Sale</Badge>)
    expect(screen.getByText('Sale')).toHaveClass('custom-class')
  })
})
