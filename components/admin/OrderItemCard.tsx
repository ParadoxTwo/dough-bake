import ThemedText from '@/components/ui/ThemedText'
import CurrencyText from '@/components/ui/CurrencyText'

type OrderItemRow = {
  id: string
  quantity: number
  unit_price: number
  products: {
    name: string | null
    category: string | null
  } | null
}

interface OrderItemCardProps {
  item: OrderItemRow
}

export default function OrderItemCard({ item }: OrderItemCardProps) {
  return (
    <div
      className="flex items-center justify-between p-3 rounded"
      style={{ backgroundColor: 'var(--theme-background)' }}
    >
      <div className="flex-1">
        <ThemedText as="div" weight="semibold">
          {item.products?.name || 'Unknown Product'}
        </ThemedText>
        {item.products?.category && (
          <ThemedText as="p" size="sm" tone="secondary">
            {item.products.category}
          </ThemedText>
        )}
        <ThemedText as="p" size="sm" tone="secondary">
          Quantity: {item.quantity}
        </ThemedText>
      </div>
      <div className="text-right">
        <ThemedText as="div" weight="bold">
          <CurrencyText amount={parseFloat(item.unit_price.toString())} />
        </ThemedText>
        <ThemedText as="p" size="sm" tone="secondary">
          Total:{' '}
          <CurrencyText
            amount={parseFloat(item.unit_price.toString()) * item.quantity}
          />
        </ThemedText>
      </div>
    </div>
  )
}

