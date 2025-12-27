'use client'

import Link from 'next/link'
import LoadingSkeleton from './LoadingSkeleton'
import Button from './Button'
import CartItemCard from './CartItemCard'
import OrderSummary from './OrderSummary'
import { CartItem, getCart, updateCartItemQuantity, removeFromCart } from '@/lib/utils/cart'
import { useEffect, useState } from 'react'

interface CartContentProps {
  showCheckoutButton?: boolean
  emptyStateTitle?: string
  emptyStateSubtitle?: string
  emptyStateActionLabel?: string
  emptyStateActionHref?: string
  className?: string
  layout?: 'page' | 'drawer'
}

export default function CartContent({
  showCheckoutButton = true,
  emptyStateTitle = "Your cart is empty",
  emptyStateSubtitle = "Add some delicious baked goods to get started!",
  emptyStateActionLabel = "Browse Menu",
  emptyStateActionHref = "/menu",
  className = '',
  layout = 'page'
}: CartContentProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedCart = getCart()
    setCart(savedCart)
    setLoading(false)

    // Listen for cart updates
    const handleCartUpdate = () => {
      setCart(getCart())
    }

    window.addEventListener('cartUpdated', handleCartUpdate)
    window.addEventListener('storage', (e) => {
      if (e.key === 'cart') {
        handleCartUpdate()
      }
    })

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
      window.removeEventListener('storage', handleCartUpdate)
    }
  }, [])

  const handleQuantityChange = (id: string, quantity: number) => {
    if (quantity < 1) return
    updateCartItemQuantity(id, quantity)
    setCart(getCart())
  }

  const handleRemove = (id: string) => {
    removeFromCart(id)
    setCart(getCart())
  }

  if (loading) {
    return (
      <div className={className}>
        <LoadingSkeleton />
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-6xl mb-4">🛒</div>
        <h2 
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--theme-text)' }}
        >
          {emptyStateTitle}
        </h2>
        {emptyStateSubtitle && (
          <p 
            className="text-sm mb-6"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            {emptyStateSubtitle}
          </p>
        )}
        {showCheckoutButton && emptyStateActionHref && (
          <Link href={emptyStateActionHref}>
            <Button size="lg" fullWidth={false}>{emptyStateActionLabel}</Button>
          </Link>
        )}
      </div>
    )
  }

  if (layout === 'drawer') {
    // Drawer layout: scrollable list with order summary at bottom
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="flex-1 overflow-y-auto space-y-4 px-4 py-2">
          {cart.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemove}
              forceMobileStyle={true}
            />
          ))}
        </div>
        <div className="border-t p-4" style={{ borderColor: 'var(--theme-secondary)' }}>
          <OrderSummary 
            items={cart} 
            showCheckoutButton={showCheckoutButton}
          />
        </div>
      </div>
    )
  }

  // Page layout: grid with items on left, summary on right
  return (
    <div className={className}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemove}
            />
          ))}
        </div>

        <div className="lg:col-span-1">
          <OrderSummary 
            items={cart} 
            className="sticky top-4"
            showCheckoutButton={showCheckoutButton}
          />
        </div>
      </div>
    </div>
  )
}

