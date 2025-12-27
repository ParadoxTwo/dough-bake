'use client'

import Image from 'next/image'
import { CartItem } from '@/lib/utils/cart'
import Card from './Card'
import Button from './Button'
import ThemedText from './ThemedText'
import { useCurrency } from '@/lib/currency/context'

interface CartItemCardProps {
  item: CartItem
  onQuantityChange: (id: string, quantity: number) => void
  onRemove: (id: string) => void
  forceMobileStyle?: boolean
}

export default function CartItemCard({
  item,
  onQuantityChange,
  onRemove,
  forceMobileStyle = false
}: CartItemCardProps) {
  const { formatPrice, convertPrice } = useCurrency()
  // Convert price from base currency (INR) to current currency
  const displayPrice = convertPrice(item.price)
  const displayTotal = displayPrice * item.quantity

  return (
    <Card className={`flex flex-col ${forceMobileStyle ? '' : 'md:flex-row md:items-center'} gap-4`}>
      {/* Mobile: Image and Delete button row */}
      <div className="flex items-start gap-4 justify-between md:gap-0">
        {/* Image */}
        {item.imageUrl ? (
          <div className="w-20 h-20 rounded overflow-hidden flex-shrink-0 relative">
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
        ) : (
          <div 
            className="w-20 h-20 rounded flex items-center justify-center flex-shrink-0"
            style={{ 
              background: `linear-gradient(135deg, var(--theme-secondary), var(--theme-primary))`
            }}
          >
            <span className="text-3xl">🥖</span>
          </div>
        )}

        {/* Mobile: Delete button next to image */}
        <button
          onClick={() => onRemove(item.id)}
          className={`text-red-500 hover:text-red-700 transition-colors ${forceMobileStyle ? '' : 'md:hidden'}`}
          aria-label="Remove item"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
        </button>
      </div>

      {/* Content - Name and Price */}
      <div className="flex-1">
        {/* Mobile: Name and Price side by side */}
        <div className={`flex items-center justify-between mb-3 ${forceMobileStyle ? '' : 'md:block md:mb-2'}`}>
          <ThemedText as="h3" size="lg" weight="semibold" className="md:mb-2">
            {item.name}
          </ThemedText>
          <ThemedText as="p" size="lg" weight="semibold" tone="accent" className="md:mb-0">
            {formatPrice(displayPrice)}
          </ThemedText>
        </div>

        {/* Mobile: Quantity and Total side by side */}
        <div className={`flex items-center justify-between ${forceMobileStyle ? '' : 'md:hidden'}`}>
          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onQuantityChange(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              fullWidth={false}
              className="!w-8 !h-8 !p-0 !rounded-full"
            >
              -
            </Button>
            <span 
              className="text-lg font-semibold w-8 text-center"
              style={{ color: 'var(--theme-text)' }}
            >
              {item.quantity}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onQuantityChange(item.id, item.quantity + 1)}
              fullWidth={false}
              className="!w-8 !h-8 !p-0 !rounded-full"
            >
              +
            </Button>
          </div>

          <div 
            className="text-lg font-bold"
            style={{ color: 'var(--theme-text)' }}
          >
            {formatPrice(displayTotal)}
          </div>
        </div>
      </div>

      {/* Desktop: Quantity controls */}
      <div className={`${forceMobileStyle ? 'hidden' : 'hidden md:flex'} items-center space-x-3`}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onQuantityChange(item.id, item.quantity - 1)}
          disabled={item.quantity <= 1}
          fullWidth={false}
          className="!w-8 !h-8 !p-0 !rounded-full"
        >
          -
        </Button>
        <span 
          className="text-lg font-semibold w-8 text-center"
          style={{ color: 'var(--theme-text)' }}
        >
          {item.quantity}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onQuantityChange(item.id, item.quantity + 1)}
          fullWidth={false}
          className="!w-8 !h-8 !p-0 !rounded-full"
        >
          +
        </Button>
      </div>

      {/* Desktop: Total cost */}
      <div 
        className={`${forceMobileStyle ? 'hidden' : 'hidden md:block'} text-lg font-bold w-24 text-right`}
        style={{ color: 'var(--theme-text)' }}
      >
        {formatPrice(displayTotal)}
      </div>

      {/* Desktop: Remove button */}
      <button
        onClick={() => onRemove(item.id)}
        className={`${forceMobileStyle ? 'hidden' : 'hidden md:block'} text-red-500 hover:text-red-700 transition-colors`}
        aria-label="Remove item"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
          />
        </svg>
      </button>
    </Card>
  )
}

