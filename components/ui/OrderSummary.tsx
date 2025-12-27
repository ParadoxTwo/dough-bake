'use client'

import Link from 'next/link'
import Card from './Card'
import Button from './Button'
import ThemedText from './ThemedText'
import { calculateCartTotals, CartItem } from '@/lib/utils/cart'
import { useCurrency } from '@/lib/currency/context'

interface OrderSummaryProps {
  items: CartItem[]
  taxRate?: number
  showItems?: boolean
  title?: string
  className?: string
  showCheckoutButton?: boolean
}

export default function OrderSummary({
  items,
  taxRate = 0.1,
  showItems = false,
  title = 'Order Summary',
  className,
  showCheckoutButton = true,
}: OrderSummaryProps) {
  const { formatPrice, convertPrice } = useCurrency()
  
  // Convert all prices from base currency (INR) to current currency
  const convertedItems = items.map(item => ({
    ...item,
    price: convertPrice(item.price)
  }))
  
  const { subtotal, tax, total } = calculateCartTotals(convertedItems, taxRate)

  return (
    <Card className={className}>
      <ThemedText as="h2" size="xl" weight="bold" className="mb-6">
        {title}
      </ThemedText>

      {showItems && (
        <div className="space-y-4 mb-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between"
            >
              <ThemedText as="span" size="sm" tone="secondary">
                {item.name} x {item.quantity}
              </ThemedText>
              <ThemedText as="span" size="sm" weight="semibold" tone="secondary">
                {formatPrice(item.price * item.quantity)}
              </ThemedText>
            </div>
          ))}
        </div>
      )}

      <div
        className={`pt-4 space-y-3 ${
          showItems ? 'border-t' : ''
        }`}
        style={showItems ? { borderColor: 'var(--theme-secondary)' } : undefined}
      >
        <div className="flex justify-between">
          <ThemedText as="span" size="sm" tone="secondary">
            Subtotal
          </ThemedText>
          <ThemedText as="span" size="sm" tone="secondary">
            {formatPrice(subtotal)}
          </ThemedText>
        </div>
        <div className="flex justify-between">
          <ThemedText as="span" size="sm" tone="secondary">
            Tax (10%)
          </ThemedText>
          <ThemedText as="span" size="sm" tone="secondary">
            {formatPrice(tax)}
          </ThemedText>
        </div>
        <div className="border-t pt-3 flex justify-between">
          <ThemedText as="span" size="lg" weight="bold">
            Total
          </ThemedText>
          <ThemedText as="span" size="lg" weight="bold">
            {formatPrice(total)}
          </ThemedText>
        </div>
      </div>

      {showCheckoutButton && items.length > 0 && (
        <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--theme-secondary)' }}>
          <Link href="/checkout">
            <Button
              variant="primary"
              size="lg"
              fullWidth={true}
              className="w-full"
            >
              Proceed to Checkout
            </Button>
          </Link>
        </div>
      )}
    </Card>
  )
}


