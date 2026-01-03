import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPaymentSettings } from '@/lib/actions/payment'
import { PaymentProviderFactory } from '@/lib/payment/factory'
import type { PaymentVerifyRequest } from '@/lib/payment/types'
import type { Database } from '@/lib/types/database.types'
import { PaymentStatus } from '@/lib/types/payment'

type OrderUpdate = Database['public']['Tables']['orders']['Update']

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

    if (!body.paymentId || !body.orderId) {
      return NextResponse.json(
        { error: 'Missing payment ID or order ID' },
        { status: 400 }
      )
    }

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

    // Update order based on verification result
    if (result.verified && result.status === 'success') {
      // Update order payment status to completed
      const updateData: OrderUpdate = {
        payment_status: PaymentStatus.COMPLETED,
        payment_id: body.paymentId,
        updated_at: new Date().toISOString(),
      }
      
      const ordersUpdateQuery = supabase.from('orders') as unknown as {
        update: (values: OrderUpdate) => {
          eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
        }
      }
      
      const { error: updateError } = await ordersUpdateQuery
        .update(updateData)
        .eq('id', body.orderId)

      if (updateError) {
        console.error('Error updating order:', updateError)
        return NextResponse.json(
          { 
            ...result,
            error: 'Payment verified but failed to update order',
            orderUpdateError: updateError.message 
          },
          { status: 500 }
        )
      }
    } else if (result.verified && result.status === 'failed') {
      // Update order payment status to failed
      const failedUpdateData: OrderUpdate = {
        payment_status: PaymentStatus.FAILED,
        payment_id: body.paymentId,
        updated_at: new Date().toISOString(),
      }
      
      const ordersUpdateQueryFailed = supabase.from('orders') as unknown as {
        update: (values: OrderUpdate) => {
          eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
        }
      }
      
      await ordersUpdateQueryFailed
        .update(failedUpdateData)
        .eq('id', body.orderId)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    )
  }
}

