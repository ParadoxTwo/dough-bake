'use client'

import { useEffect, useState } from 'react'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import Button from '@/components/ui/Button'
import ThemedText from '@/components/ui/ThemedText'
import Card from '@/components/ui/Card'

interface StripePaymentFormProps {
  clientSecret: string
  publishableKey: string
  amount: number
  currency: string
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
}

function PaymentFormInner({
  onSuccess,
  onError,
}: {
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setErrorMessage(null)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
      redirect: 'if_required',
    })

    if (error) {
      setErrorMessage(error.message || 'Payment failed')
      setProcessing(false)
      onError(error.message || 'Payment failed')
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id)
    } else {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-500 bg-opacity-10 border border-red-500">
          <ThemedText as="p" size="sm" style={{ color: 'white' }}>
            {errorMessage}
          </ThemedText>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || !elements || processing}
        loading={processing}
        className="w-full"
      >
        {processing ? 'Processing...' : 'Complete Payment'}
      </Button>
    </form>
  )
}

export default function StripePaymentForm({
  clientSecret,
  publishableKey,
  amount,
  currency,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const [stripePromise, setStripePromise] = useState<any>(null)

  useEffect(() => {
    if (publishableKey) {
      const stripe = loadStripe(publishableKey)
      setStripePromise(stripe)
    }
  }, [publishableKey])

  if (!stripePromise) {
    return (
      <Card>
        <ThemedText as="p" tone="secondary">
          Loading payment form...
        </ThemedText>
      </Card>
    )
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: 'var(--theme-accent)',
        colorBackground: 'var(--theme-background)',
        colorText: 'var(--theme-text)',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentFormInner onSuccess={onSuccess} onError={onError} />
    </Elements>
  )
}

