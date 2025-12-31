import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPaymentSettings } from '@/lib/actions/payment'
import { PaymentProviderFactory } from '@/lib/payment/factory'
import type { PaymentVerifyRequest } from '@/lib/payment/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json() as PaymentVerifyRequest

    // Get payment settings
    const paymentConfig = await getPaymentSettings()
    if (!paymentConfig || !paymentConfig.enabled) {
      return NextResponse.json(
        { error: 'Payment is not configured or enabled' },
        { status: 400 }
      )
    }

    // Create payment provider
    const provider = PaymentProviderFactory.createProvider(paymentConfig)

    // Verify payment
    const result = await provider.verifyPayment({
      ...body,
      provider: paymentConfig.provider,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    )
  }
}

