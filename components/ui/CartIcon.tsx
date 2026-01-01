'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCart } from '@/lib/utils/cart'

interface CartIconProps {
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  className?: string
}

/**
 * Reusable cart icon component with item count badge
 */
export default function CartIcon({ onClick, onMouseEnter, onMouseLeave, className = '' }: CartIconProps) {
  const [itemCount, setItemCount] = useState(0)

  useEffect(() => {
    // Calculate initial cart count
    const updateCartCount = () => {
      const cart = getCart()
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
      setItemCount(totalItems)
    }

    // Initial load
    updateCartCount()

    // Listen for storage changes (when cart is updated in other components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cart') {
        updateCartCount()
      }
    }

    // Listen for custom cart update events (for same-tab updates)
    const handleCartUpdate = () => {
      updateCartCount()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('cartUpdated', handleCartUpdate)

    // Poll for changes (fallback for same-tab updates)
    const interval = setInterval(updateCartCount, 500)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('cartUpdated', handleCartUpdate)
      clearInterval(interval)
    }
  }, [])

  return (
    <Link
      href="/cart"
      className={`p-2 hover:opacity-70 transition-opacity ${className}`}
      style={{ color: 'var(--theme-text-secondary)' }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="relative inline-block">
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
            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
          />
        </svg>
        {itemCount > 0 && (
          <span
            className="absolute top-0 right-0 -translate-y-3 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white pointer-events-none"
            style={{ backgroundColor: 'var(--theme-accent)' }}
          >
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </div>
    </Link>
  )
}

