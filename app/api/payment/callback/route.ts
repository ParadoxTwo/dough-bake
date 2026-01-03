import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPaymentSettings } from '@/lib/actions/payment'
import { PaymentProviderFactory } from '@/lib/payment/factory'
import type { Database } from '@/lib/types/database.types'
import { PaymentStatus } from '@/lib/types/payment'

type OrderUpdate = Database['public']['Tables']['orders']['Update']

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { paymentId, orderId, status, metadata } = body

    if (!paymentId || !orderId) {
      return NextResponse.json(
        { error: 'Missing payment ID or order ID' },
        { status: 400 }
      )
    }

    // Get payment settings
    const paymentConfig = await getPaymentSettings()
    if (!paymentConfig || !paymentConfig.enabled) {
      return NextResponse.json(
        { error: 'Payment is not configured' },
        { status: 400 }
      )
    }

    // Create payment provider
    const provider = PaymentProviderFactory.createProvider(paymentConfig)

    // Verify payment
    const verifyResult = await provider.verifyPayment({
      paymentId,
      orderId,
      provider: paymentConfig.provider,
      metadata: metadata || {},
    })

    if (verifyResult.verified && verifyResult.status === 'success') {
      // Update order payment status
      const updateData: OrderUpdate = {
        payment_status: PaymentStatus.COMPLETED,
        payment_id: paymentId,
        updated_at: new Date().toISOString(),
      }
      // Type assertion needed because Supabase's type inference doesn't always work correctly
      const ordersUpdateQuery = supabase.from('orders') as unknown as {
        update: (values: OrderUpdate) => {
          eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
        }
      }
      const { error: updateError } = await ordersUpdateQuery
        .update(updateData)
        .eq('id', orderId)

      if (updateError) {
        console.error('Error updating order:', updateError)
        return NextResponse.json(
          { error: 'Payment verified but failed to update order' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, verified: true })
    }

    // Payment failed or not verified
    const failedUpdateData: OrderUpdate = {
      payment_status: PaymentStatus.FAILED,
      payment_id: paymentId,
      updated_at: new Date().toISOString(),
    }
    // Type assertion needed because Supabase's type inference doesn't always work correctly
    const ordersUpdateQueryFailed = supabase.from('orders') as unknown as {
      update: (values: OrderUpdate) => {
        eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
      }
    }
    await ordersUpdateQueryFailed
      .update(failedUpdateData)
      .eq('id', orderId)

    return NextResponse.json({
      success: true,
      verified: false,
      error: verifyResult.error || 'Payment verification failed',
    })
  } catch (error: any) {
    console.error('Error processing payment callback:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process payment callback' },
      { status: 500 }
    )
  }
}

