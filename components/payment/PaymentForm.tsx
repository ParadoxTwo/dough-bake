'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ThemedText from '@/components/ui/ThemedText'
import StripePaymentForm from './StripePaymentForm'
import type { PaymentProvider, PaymentInitiateResponse } from '@/lib/payment/types'

interface PaymentFormProps {
  provider: PaymentProvider
  paymentConfig: Record<string, any>
  orderId: string
  amount: number
  currency: string
  customerId: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  onSuccess: () => void
  onError: (error: string) => void
}

export default function PaymentForm({
  provider,
  paymentConfig,
  orderId,
  amount,
  currency,
  customerId,
  customerName,
  customerEmail,
  customerPhone,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const [paymentData, setPaymentData] = useState<PaymentInitiateResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const initiatePayment = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/payment/initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            amount,
            currency,
            customer: {
              id: customerId,
              email: customerEmail,
              name: customerName,
              phone: customerPhone,
            },
          }),
        })

        const result = await response.json()
        if (result.success) {
          setPaymentData(result)
        } else {
          onError(result.error || 'Failed to initiate payment')
        }
      } catch (error: any) {
        onError(error.message || 'Failed to initiate payment')
      } finally {
        setLoading(false)
      }
    }

    if (orderId && amount && currency && customerId && customerName) {
      initiatePayment()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, amount, currency, customerId, customerName, customerEmail, customerPhone])

  const handleStripeSuccess = async (paymentIntentId: string) => {
    try {
      setProcessing(true)
      // Verify payment
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: paymentIntentId,
          orderId,
          provider: 'stripe',
        }),
      })

      const result = await response.json()
      if (result.verified) {
        onSuccess()
      } else {
        onError(result.error || 'Payment verification failed')
      }
    } catch (error: any) {
      onError(error.message || 'Payment verification failed')
    } finally {
      setProcessing(false)
    }
  }

  const handleRazorpayPayment = () => {
    if (!paymentData?.keyId) {
      onError('Razorpay configuration missing')
      return
    }

    // Load Razorpay script dynamically
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => {
      const Razorpay = (window as any).Razorpay
      if (Razorpay && paymentData) {
        const options = {
          key: paymentData.keyId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          name: 'Dough Bake',
          description: `Order ${orderId}`,
          order_id: paymentData.orderId,
          handler: async (response: any) => {
            try {
              // Verify payment
              const verifyResponse = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  paymentId: response.razorpay_payment_id,
                  orderId,
                  provider: 'razorpay',
                  metadata: {
                    razorpay_signature: response.razorpay_signature,
                    razorpay_order_id: response.razorpay_order_id,
                  },
                }),
              })

              const result = await verifyResponse.json()
              if (result.verified) {
                onSuccess()
              } else {
                onError(result.error || 'Payment verification failed')
              }
            } catch (error: any) {
              onError(error.message || 'Payment verification failed')
            }
          },
          prefill: {
            name: customerName,
            email: customerEmail,
            contact: customerPhone,
          },
          theme: {
            color: '#6366f1',
          },
        }

        const razorpay = new Razorpay(options)
        razorpay.open()
      }
    }
    script.onerror = () => {
      onError('Failed to load Razorpay SDK')
    }
    document.body.appendChild(script)
  }

  const handleRedirectPayment = () => {
    if (paymentData?.redirectUrl) {
      window.location.href = paymentData.redirectUrl
    } else {
      onError('Payment gateway URL not available')
    }
  }

  if (loading) {
    return (
      <Card>
        <ThemedText as="p" tone="secondary">
          Loading payment options...
        </ThemedText>
      </Card>
    )
  }

  if (!paymentData) {
    return (
      <Card>
        <ThemedText as="p" style={{ color: '#ef4444' }}>
          Failed to initialize payment
        </ThemedText>
      </Card>
    )
  }

  // Render based on payment provider
  if (provider === 'stripe') {
    if (!paymentData.clientSecret || !paymentConfig.publishableKey) {
      return (
        <Card>
          <ThemedText as="p" style={{ color: '#ef4444' }}>
            Stripe configuration is incomplete
          </ThemedText>
        </Card>
      )
    }

    return (
      <Card>
        <ThemedText as="h2" size="xl" weight="bold" className="mb-6">
          Payment
        </ThemedText>
        <StripePaymentForm
          clientSecret={paymentData.clientSecret}
          publishableKey={paymentConfig.publishableKey}
          amount={amount}
          currency={currency}
          onSuccess={handleStripeSuccess}
          onError={onError}
        />
      </Card>
    )
  }

  if (provider === 'razorpay') {
    return (
      <Card>
        <ThemedText as="h2" size="xl" weight="bold" className="mb-6">
          Payment
        </ThemedText>
        <div className="space-y-4">
          <ThemedText as="p" tone="secondary">
            You will be redirected to Razorpay to complete your payment.
          </ThemedText>
          <Button
            onClick={handleRazorpayPayment}
            disabled={processing}
            loading={processing}
            className="w-full"
          >
            Proceed to Razorpay
          </Button>
        </div>
      </Card>
    )
  }

  // PayU and PayTM - redirect to payment gateway
  return (
    <Card>
      <ThemedText as="h2" size="xl" weight="bold" className="mb-6">
        Payment
      </ThemedText>
      <div className="space-y-4">
        <ThemedText as="p" tone="secondary">
          You will be redirected to {provider === 'payu' ? 'PayU' : 'PayTM'} to complete your payment.
        </ThemedText>
        <Button
          onClick={handleRedirectPayment}
          disabled={processing || !paymentData.redirectUrl}
          loading={processing}
          className="w-full"
        >
          Proceed to {provider === 'payu' ? 'PayU' : 'PayTM'}
        </Button>
      </div>
    </Card>
  )
}

