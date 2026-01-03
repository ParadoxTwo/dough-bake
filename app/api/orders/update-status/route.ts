import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database.types'
import { OrderStatus } from '@/lib/types/order'

type OrderUpdate = Database['public']['Tables']['orders']['Update']

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if ((profile as { role: 'customer' | 'admin' } | null)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { orderId, status } = body

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 })
    }

    // Validate status - only allow fulfilled or cancelled
    if (status !== OrderStatus.FULFILLED && status !== OrderStatus.CANCELLED) {
      return NextResponse.json(
        { error: 'Invalid status. Only "fulfilled" or "cancelled" are allowed' },
        { status: 400 }
      )
    }

    // Update order status
    const updateData: OrderUpdate = {
      status: status === OrderStatus.FULFILLED ? 'completed' : 'cancelled',
      updated_at: new Date().toISOString(),
    }

    const ordersUpdateQuery = supabase.from('orders') as unknown as {
      update: (values: OrderUpdate) => {
        eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
      }
    }

    const { error: updateError } = await ordersUpdateQuery
      .update(updateData)
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order status:', updateError)
      return NextResponse.json(
        { error: `Failed to update order status: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update order status' },
      { status: 500 }
    )
  }
}

