import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/ui/PageHeader'
import AdminOrdersList from '@/components/admin/AdminOrdersList'
import type { Database } from '@/lib/types/database.types'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type OrderRow = Database['public']['Tables']['orders']['Row']
type OrderItemRow = Database['public']['Tables']['order_items']['Row']
type CustomerRow = Database['public']['Tables']['customers']['Row']
type ProductRow = Database['public']['Tables']['products']['Row']

type OrderWithDetails = OrderRow & {
  customers: Pick<CustomerRow, 'name' | 'phone' | 'address' | 'city' | 'state' | 'postal_code'> | null
  order_items: (OrderItemRow & {
    products: Pick<ProductRow, 'name' | 'category'> | null
  })[]
}

export default async function AdminOrdersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin?redirect=/admin/orders')
  }

  const profileResult = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const profile = profileResult.data as Pick<ProfileRow, 'role'> | null

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  // Fetch all orders with customer and order items details
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (
        name,
        phone,
        address,
        city,
        state,
        postal_code
      ),
      order_items (
        id,
        order_id,
        product_id,
        quantity,
        unit_price,
        created_at,
        products (
          name,
          category
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
  }

  const ordersWithDetails = (orders || []) as OrderWithDetails[]

  return (
    <PageContainer>
      <PageHeader
        title="Order Management"
        subtitle="View and manage all orders"
        className="mb-8"
      />

      <AdminOrdersList orders={ordersWithDetails} />
    </PageContainer>
  )
}

