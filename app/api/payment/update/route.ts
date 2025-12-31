import { NextResponse } from 'next/server'
import { updatePaymentSettings } from '@/lib/actions/payment'
import type { PaymentProvider } from '@/lib/payment/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { provider, config, enabled } = body

    if (!provider) {
      return NextResponse.json(
        { error: 'Payment provider is required' },
        { status: 400 }
      )
    }

    const result = await updatePaymentSettings(
      provider as PaymentProvider,
      config || {},
      enabled !== undefined ? enabled : true
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update payment settings' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating payment settings:', error)
    return NextResponse.json(
      { error: 'Failed to update payment settings' },
      { status: 500 }
    )
  }
}

