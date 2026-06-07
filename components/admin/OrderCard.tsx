'use client'

import { useState } from 'react'
import OrderHeader from './OrderHeader'
import OrderActions from './OrderActions'
import OrderItemsAccordion from './OrderItemsAccordion'
import OrderDelivery, { type DeliveryInfo } from './OrderDelivery'
import { OrderStatus } from '@/lib/types/order'
import type { Database } from '@/lib/types/database.types'
import type { PaymentConfig } from '@/lib/payment/types'

type OrderRow = Database['public']['Tables']['orders']['Row']
type OrderItemRow = Database['public']['Tables']['order_items']['Row']
type CustomerRow = Database['public']['Tables']['customers']['Row']
type ProductRow = Database['public']['Tables']['products']['Row']

type OrderWithDetails = OrderRow & {
  customers: Pick<CustomerRow, 'name' | 'phone' | 'address' | 'city' | 'state' | 'postal_code'> | null
  order_items: (OrderItemRow & {
    products: Pick<ProductRow, 'name' | 'category'> | null
  })[]
  deliveries: DeliveryInfo | DeliveryInfo[] | null
}

interface OrderCardProps {
  order: OrderWithDetails
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void
  onDelete: (orderId: string) => void
  onCancelDelivery: (orderId: string) => void
  updatingOrderId: string | null
  deletingOrderId: string | null
  cancellingOrderId: string | null
  getDisplayStatus: (status: string) => string
  paymentSettings: PaymentConfig | null
}

export default function OrderCard({
  order,
  onStatusChange,
  onDelete,
  onCancelDelivery,
  updatingOrderId,
  deletingOrderId,
  cancellingOrderId,
  getDisplayStatus,
  paymentSettings,
}: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const currentStatus = order.status
  const displayStatus = getDisplayStatus(currentStatus)
  const delivery = Array.isArray(order.deliveries)
    ? order.deliveries[0] ?? null
    : order.deliveries ?? null

  return (
    <div
      className="border rounded-lg p-4"
      style={{ borderColor: 'var(--theme-secondary)' }}
    >
      <OrderHeader
        orderId={order.id}
        displayStatus={displayStatus}
        paymentStatus={order.payment_status}
        paymentId={order.payment_id}
        customer={order.customers}
        totalAmount={order.total_amount}
        createdAt={order.created_at}
        paymentSettings={paymentSettings}
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

      <OrderDelivery
        delivery={delivery}
        orderId={order.id}
        onCancel={onCancelDelivery}
        cancellingOrderId={cancellingOrderId}
      />

      <OrderItemsAccordion
        items={order.order_items}
        orderId={order.id}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
      />
    </div>
  )
}

