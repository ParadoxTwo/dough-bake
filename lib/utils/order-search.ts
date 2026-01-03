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

export function getDisplayStatus(status: string): string {
  if (status === 'completed') return 'fulfilled'
  return status
}

export function filterOrders(
  orders: OrderWithDetails[],
  searchQuery: string,
  formatPrice: (amount: number) => string,
  convertPrice: (amount: number) => number
): OrderWithDetails[] {
  if (!searchQuery.trim()) {
    return orders
  }

  const query = searchQuery.toLowerCase().trim()

  return orders.filter((order) => {
    // Search by order ID
    const orderIdMatch = order.id.toLowerCase().includes(query)

    // Search by status
    const statusMatch =
      order.status.toLowerCase().includes(query) ||
      getDisplayStatus(order.status).toLowerCase().includes(query)

    // Search by payment status
    const paymentStatusMatch =
      (order.payment_status === PaymentStatus.COMPLETED &&
        (query === 'paid' || query === 'completed')) ||
      (order.payment_status === PaymentStatus.PENDING &&
        (query === 'pending' || query.includes('pending'))) ||
      (order.payment_status === PaymentStatus.FAILED &&
        (query === 'failed' || query.includes('failed'))) ||
      order.payment_status.toLowerCase().includes(query)

    // Search by customer name
    const customerNameMatch = order.customers?.name?.toLowerCase().includes(query) || false

    // Search by phone number
    const phoneMatch = order.customers?.phone?.toLowerCase().includes(query) || false

    // Search by address
    const addressMatch =
      order.customers?.address?.toLowerCase().includes(query) ||
      order.customers?.city?.toLowerCase().includes(query) ||
      order.customers?.state?.toLowerCase().includes(query) ||
      order.customers?.postal_code?.toLowerCase().includes(query) ||
      false

    // Search by order date
    const orderDate = new Date(order.created_at)
    const dateMatch =
      orderDate.toLocaleDateString().toLowerCase().includes(query) ||
      orderDate.toLocaleString().toLowerCase().includes(query) ||
      orderDate.toISOString().toLowerCase().includes(query)

    // Search by order price
    const priceStr = formatPrice(convertPrice(parseFloat(order.total_amount.toString()))).toLowerCase()
    const priceMatch = priceStr.includes(query) || order.total_amount.toString().includes(query)

    // Search by order item name
    const itemNameMatch = order.order_items.some((item) =>
      item.products?.name?.toLowerCase().includes(query)
    )

    // Search by order item category
    const itemCategoryMatch = order.order_items.some((item) =>
      item.products?.category?.toLowerCase().includes(query)
    )

    // Search by order item price
    const itemPriceMatch = order.order_items.some((item) => {
      const itemPrice = formatPrice(convertPrice(parseFloat(item.unit_price.toString()))).toLowerCase()
      return itemPrice.includes(query) || item.unit_price.toString().includes(query)
    })

    return (
      orderIdMatch ||
      statusMatch ||
      paymentStatusMatch ||
      customerNameMatch ||
      phoneMatch ||
      addressMatch ||
      dateMatch ||
      priceMatch ||
      itemNameMatch ||
      itemCategoryMatch ||
      itemPriceMatch
    )
  })
}

