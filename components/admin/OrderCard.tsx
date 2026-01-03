'use client'

import { useState } from 'react'
import ThemedText from '@/components/ui/ThemedText'
import OrderHeader from './OrderHeader'
import OrderActions from './OrderActions'
import OrderItemsAccordion from './OrderItemsAccordion'
import { OrderStatus } from '@/lib/types/order'
import { PaymentStatus } from '@/lib/types/payment'
import type { Database } from '@/lib/types/database.types'

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

interface OrderCardProps {
  order: OrderWithDetails
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void
  onDelete: (orderId: string) => void
  updatingOrderId: string | null
  deletingOrderId: string | null
  getDisplayStatus: (status: string) => string
}

export default function OrderCard({
  order,
  onStatusChange,
  onDelete,
  updatingOrderId,
  deletingOrderId,
  getDisplayStatus,
}: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const currentStatus = order.status
  const displayStatus = getDisplayStatus(currentStatus)

  return (
    <div
      className="border rounded-lg p-4"
      style={{ borderColor: 'var(--theme-secondary)' }}
    >
      <OrderHeader
        orderId={order.id}
        displayStatus={displayStatus}
        paymentStatus={order.payment_status}
        customer={order.customers}
        totalAmount={order.total_amount}
        createdAt={order.created_at}
      >
        <OrderActions
          orderId={order.id}
          currentStatus={currentStatus}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
          updatingOrderId={updatingOrderId}
          deletingOrderId={deletingOrderId}
        />
      </OrderHeader>

      <OrderItemsAccordion
        items={order.order_items}
        orderId={order.id}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
      />
    </div>
  )
}

