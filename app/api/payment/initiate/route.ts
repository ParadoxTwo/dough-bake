import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPaymentSettings } from '@/lib/actions/payment'
import { PaymentProviderFactory } from '@/lib/payment/factory'
import type { PaymentInitiateRequest } from '@/lib/payment/types'

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

    const body = await request.json() as PaymentInitiateRequest

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

    // Initiate payment
    const result = await provider.initiatePayment(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to initiate payment' },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error initiating payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}

