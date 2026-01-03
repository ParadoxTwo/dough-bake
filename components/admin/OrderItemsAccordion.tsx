'use client'

import { useState } from 'react'
import ThemedText from '@/components/ui/ThemedText'
import OrderItemCard from './OrderItemCard'

type OrderItemRow = {
  id: string
  quantity: number
  unit_price: number
  products: {
    name: string | null
    category: string | null
  } | null
}

interface OrderItemsAccordionProps {
  items: OrderItemRow[]
  orderId: string
  isExpanded: boolean
  onToggle: () => void
}

export default function OrderItemsAccordion({
  items,
  orderId,
  isExpanded,
  onToggle,
}: OrderItemsAccordionProps) {
  return (
    <>
      {/* Order Items Toggle */}
      <button
        onClick={onToggle}
        className="mt-4 w-full text-left flex items-center justify-between p-2 hover:opacity-70 transition-opacity"
        style={{ color: 'var(--theme-text)' }}
      >
        <ThemedText as="span" size="sm" weight="semibold">
          Order Items ({items.length})
        </ThemedText>
        <svg
          className={`h-5 w-5 transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Order Items Details */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
        }`}
      >
        <div
          className="pt-4 border-t"
          style={{ borderColor: 'var(--theme-secondary)' }}
        >
          <div className="space-y-3">
            {items.map((item) => (
              <OrderItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

