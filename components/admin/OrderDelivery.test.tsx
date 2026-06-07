import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrderDelivery, { type DeliveryInfo } from './OrderDelivery'

vi.mock('@/components/ui/CurrencyText', () => ({
  default: ({ amount }: { amount: number }) => <span>₹{amount}</span>,
}))

function delivery(overrides: Partial<DeliveryInfo> = {}): DeliveryInfo {
  return {
    status: 'in_transit',
    tracking_url: null,
    rider_name: null,
    rider_phone: null,
    fee: null,
    external_id: 'BZ1',
    ...overrides,
  }
}

describe('OrderDelivery', () => {
  it('renders an empty state when there is no delivery', () => {
    render(<OrderDelivery delivery={null} orderId="o1" onCancel={vi.fn()} cancellingOrderId={null} />)
    expect(screen.getByText('No delivery dispatched.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cancel delivery/i })).not.toBeInTheDocument()
  })

  it('shows a cancel action for non-terminal statuses and calls onCancel', async () => {
    const onCancel = vi.fn()
    render(
      <OrderDelivery delivery={delivery({ status: 'created' })} orderId="o1" onCancel={onCancel} cancellingOrderId={null} />
    )
    const button = screen.getByRole('button', { name: /cancel delivery/i })
    await userEvent.click(button)
    expect(onCancel).toHaveBeenCalledWith('o1')
  })

  it('hides the cancel action for terminal statuses', () => {
    render(
      <OrderDelivery delivery={delivery({ status: 'delivered' })} orderId="o1" onCancel={vi.fn()} cancellingOrderId={null} />
    )
    expect(screen.getByText('delivered')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cancel delivery/i })).not.toBeInTheDocument()
  })

  it('renders the fee and tracking link when present', () => {
    render(
      <OrderDelivery
        delivery={delivery({ fee: 80, tracking_url: 'https://track.example' })}
        orderId="o1"
        onCancel={vi.fn()}
        cancellingOrderId={null}
      />
    )
    expect(screen.getByText('₹80')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /track delivery/i })).toHaveAttribute(
      'href',
      'https://track.example'
    )
  })
})
