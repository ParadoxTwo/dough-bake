import { ReactNode } from 'react'
import ThemedText from '@/components/ui/ThemedText'
import StatusBadge from '@/components/ui/StatusBadge'
import CurrencyText from '@/components/ui/CurrencyText'
import { PaymentStatus } from '@/lib/types/payment'
import type { PaymentConfig } from '@/lib/payment/types'
import { buildStripeTransactionUrl } from '@/lib/utils/stripe-url'

type CustomerRow = {
  name: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
}

interface OrderHeaderProps {
  orderId: string
  displayStatus: string
  paymentStatus: PaymentStatus
  paymentId: string | null
  customer: CustomerRow | null
  totalAmount: number
  createdAt: string
  paymentSettings: PaymentConfig | null
  children?: ReactNode
}

export default function OrderHeader({
  orderId,
  displayStatus,
  paymentStatus,
  paymentId,
  customer,
  totalAmount,
  createdAt,
  paymentSettings,
  children,
}: OrderHeaderProps) {
  const getPaymentStatusLabel = () => {
    if (paymentStatus === PaymentStatus.COMPLETED) return 'paid'
    if (paymentStatus === PaymentStatus.PENDING) return 'pending payment'
    return 'payment failed'
  }

  const getStripeTransactionUrl = (): string | null => {
    // Only show link if payment is completed, provider is Stripe, and payment_id starts with pi_
    if (
      paymentStatus !== PaymentStatus.COMPLETED ||
      paymentSettings?.provider !== 'stripe' ||
      !paymentId ||
      !paymentId.startsWith('pi_')
    ) {
      return null
    }

    const stripeConfig = paymentSettings.config
    const publishableKey = stripeConfig?.publishableKey || ''
    const secretKey = stripeConfig?.secretKey || ''

    if (!publishableKey || !secretKey) {
      return null
    }

    return buildStripeTransactionUrl(paymentId, publishableKey, secretKey)
  }

  const stripeUrl = getStripeTransactionUrl()

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-2">
          <ThemedText as="h3" weight="semibold">
            Order #{orderId.slice(0, 8)}
          </ThemedText>
          <StatusBadge status={displayStatus} />
          {stripeUrl ? (
            <a
              href={stripeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition-opacity hover:opacity-80 cursor-pointer"
              title="View transaction in Stripe Dashboard"
            >
              <StatusBadge status={getPaymentStatusLabel()} />
            </a>
          ) : (
            <StatusBadge status={getPaymentStatusLabel()} />
          )}
        </div>
        <ThemedText as="p" size="sm" tone="secondary">
          Customer: {customer?.name || 'Unknown'}
        </ThemedText>
        <ThemedText as="p" size="sm" tone="secondary">
          Date: {new Date(createdAt).toLocaleString()}
        </ThemedText>
        {customer?.phone && (
          <ThemedText as="p" size="sm" tone="secondary">
            Phone: {customer.phone}
          </ThemedText>
        )}
        {customer?.address && (
          <ThemedText as="p" size="sm" tone="secondary">
            Address: {customer.address}, {customer.city}, {customer.state}{' '}
            {customer.postal_code}
          </ThemedText>
        )}
      </div>

      <div className="flex flex-col md:items-end gap-2">
        <ThemedText as="div" weight="bold" size="lg" tone="accent">
          <CurrencyText amount={parseFloat(totalAmount.toString())} />
        </ThemedText>
        {children}
      </div>
    </div>
  )
}

