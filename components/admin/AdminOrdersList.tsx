'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import ThemedText from '@/components/ui/ThemedText'
import SearchBar from '@/components/ui/SearchBar'
import OrderCard from './OrderCard'
import type { Database } from '@/lib/types/database.types'
import { OrderStatus } from '@/lib/types/order'
import { useCurrency } from '@/lib/currency/context'
import { filterOrders, getDisplayStatus } from '@/lib/utils/order-search'
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
}

interface AdminOrdersListProps {
  orders: OrderWithDetails[]
}

export default function AdminOrdersList({ orders: initialOrders }: AdminOrdersListProps) {
  const [orders, setOrders] = useState(initialOrders)
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null)
  const [paymentSettings, setPaymentSettings] = useState<PaymentConfig | null>(null)
  const router = useRouter()
  const { formatPrice, convertPrice } = useCurrency()

  // Fetch payment settings
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const response = await fetch('/api/payment/settings')
        if (response.ok) {
          const data = await response.json()
          setPaymentSettings(data)
        }
      } catch (error) {
        console.error('Failed to fetch payment settings:', error)
      }
    }
    fetchPaymentSettings()
  }, [])

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId)
    try {
      const response = await fetch('/api/orders/update-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update order status')
      }

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus === OrderStatus.FULFILLED ? 'completed' : 'cancelled',
                updated_at: new Date().toISOString(),
              }
            : order
        )
      )

      router.refresh()
    } catch (error) {
      console.error('Failed to update order status:', error)
      alert(error instanceof Error ? error.message : 'Failed to update order status')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const handleDelete = async (orderId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this order? This action cannot be undone and will delete all associated order items.'
    )

    if (!confirmed) {
      return
    }

    setDeletingOrderId(orderId)
    try {
      const response = await fetch(`/api/orders/delete?orderId=${orderId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete order')
      }

      // Update UI by removing the deleted order
      setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId))
      router.refresh()
    } catch (error) {
      console.error('Failed to delete order:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete order')
    } finally {
      setDeletingOrderId(null)
    }
  }

  // Filter orders based on search query
  const filteredOrders = useMemo(
    () => filterOrders(orders, searchQuery, formatPrice, convertPrice),
    [searchQuery, orders, formatPrice, convertPrice]
  )

  return (
    <Card>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
          <ThemedText as="h2" size="xl" weight="bold">
            All Orders
          </ThemedText>
        </div>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by order ID, status, customer, address, items..."
        />
      </div>

      <div className="space-y-6">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              updatingOrderId={updatingOrderId}
              deletingOrderId={deletingOrderId}
              getDisplayStatus={getDisplayStatus}
              paymentSettings={paymentSettings}
            />
          ))
        ) : searchQuery ? (
          <ThemedText as="p" tone="secondary" className="text-center py-8">
            No orders found matching "{searchQuery}".
          </ThemedText>
        ) : (
          <ThemedText as="p" tone="secondary" className="text-center py-8">
            No orders found.
          </ThemedText>
        )}
      </div>
    </Card>
  )
}

