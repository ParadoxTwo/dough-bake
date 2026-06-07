'use client'

import ThemedText from '@/components/ui/ThemedText'
import StatusBadge from '@/components/ui/StatusBadge'
import Button from '@/components/ui/Button'
import CurrencyText from '@/components/ui/CurrencyText'
import type { Database } from '@/lib/types/database.types'

export type DeliveryInfo = Pick<
  Database['public']['Tables']['deliveries']['Row'],
  'status' | 'tracking_url' | 'rider_name' | 'rider_phone' | 'fee' | 'external_id'
>

interface OrderDeliveryProps {
  delivery: DeliveryInfo | null
  orderId: string
  onCancel: (orderId: string) => void
  cancellingOrderId: string | null
}

const TERMINAL_STATUSES = new Set(['delivered', 'cancelled', 'failed'])

export default function OrderDelivery({
  delivery,
  orderId,
  onCancel,
  cancellingOrderId,
}: OrderDeliveryProps) {
  const containerClass = 'mt-4 pt-4 border-t'
  const containerStyle = { borderColor: 'var(--theme-secondary)' }

  if (!delivery) {
    return (
      <div className={containerClass} style={containerStyle}>
        <ThemedText as="p" size="sm" tone="secondary">
          No delivery dispatched.
        </ThemedText>
      </div>
    )
  }

  const isCancelling = cancellingOrderId === orderId
  const canCancel = !TERMINAL_STATUSES.has(delivery.status.toLowerCase())

  return (
    <div className={containerClass} style={containerStyle}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:flex-wrap">
        <div className="flex flex-wrap items-center gap-3">
          <ThemedText as="span" size="sm" weight="semibold">
            Delivery
          </ThemedText>
          <StatusBadge status={delivery.status} />
          {delivery.rider_name && (
            <ThemedText as="span" size="sm" tone="secondary">
              {delivery.rider_name}
              {delivery.rider_phone ? ` · ${delivery.rider_phone}` : ''}
            </ThemedText>
          )}
          {delivery.fee != null && (
            <ThemedText as="span" size="sm" tone="secondary">
              Fee: <CurrencyText amount={delivery.fee} />
            </ThemedText>
          )}
        </div>

        <div className="flex items-center gap-3">
          {delivery.tracking_url && (
            <a
              href={delivery.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:opacity-70 transition-opacity"
              style={{ color: 'var(--theme-accent)' }}
              aria-label={`Track delivery for order ${orderId}`}
            >
              Track delivery
            </a>
          )}
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              onClick={() => onCancel(orderId)}
              loading={isCancelling}
              disabled={isCancelling}
              aria-label={`Cancel delivery for order ${orderId}`}
              style={{ backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444' }}
            >
              Cancel delivery
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
