'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ProductCardProps } from '@/lib/types/product'
import { addToCart, CartItem } from '@/lib/utils/cart'
import { isLocalSupabaseUrl } from '@/lib/utils/image-helpers'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { useCurrency } from '@/lib/currency/context'

export default function ProductCard({ 
  product, 
  href = `/product/${product.id}`,
  showCategory = false,
  variant = 'default'
}: ProductCardProps) {
  const router = useRouter()
  const { formatPrice, convertPrice } = useCurrency()
  const [addingToCart, setAddingToCart] = useState(false)
  const imageHeight = variant === 'compact' ? 'h-32' : 'h-48'
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setAddingToCart(true)
    
    // Get thumbnail image if available
    const thumbnailUrl = product.firstImage?.thumbnail_url || null
    
    // Store base price (INR) in cart, conversion happens on display
    const cartItem: CartItem = {
      id: product.id,
      name: product.name,
      price: product.price, // Base price in INR
      quantity: 1,
      imageUrl: thumbnailUrl,
    }
    
    addToCart(cartItem)
    
    // Small delay for visual feedback
    setTimeout(() => {
      setAddingToCart(false)
    }, 500)
  }
  
  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(href)
  }
  
  const displayPrice = convertPrice(product.price)
  
  return (
    <div
      className="rounded-lg shadow-md overflow-hidden hover:shadow-xl transition group"
      style={{ backgroundColor: 'var(--theme-surface)' }}
    >
      <Link href={href}>
        {product.firstImage ? (
          <div className={`${imageHeight} relative overflow-hidden`}>
            <Image
              src={product.firstImage.medium_url}
              alt={product.firstImage.alt_text || product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized={isLocalSupabaseUrl(product.firstImage.medium_url)}
            />
          </div>
        ) : (
          <div 
            className={`${imageHeight} flex items-center justify-center`}
            style={{
              background: `radial-gradient(circle, var(--theme-tertiary), var(--theme-primary))`,
            }}
          >
            <span className="text-6xl">🥖</span>
          </div>
        )}
      </Link>
      <div className="p-6">
        <Link href={href}>
          <h3 
            className="text-xl font-semibold mb-2 group-hover:opacity-70 transition"
            style={{ color: 'var(--theme-text)' }}
          >
            {product.name}
          </h3>
        </Link>
        {product.description && (
          <p 
            className="text-sm mb-4 line-clamp-2 min-h-[48px]"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between gap-4">
          <span 
            className="text-2xl font-bold"
            style={{ color: 'var(--theme-accent)' }}
          >
            {formatPrice(displayPrice)}
          </span>
          {showCategory && product.category && (
            <Badge variant="tertiary">
              {product.category}
            </Badge>
          )}
        </div>
        {variant === 'default' && (
          <div className="mt-4 flex gap-2">
            <Button
              onClick={handleAddToCart}
              disabled={addingToCart}
              loading={addingToCart}
              size="sm"
              variant="primary"
            >
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </Button>
            <Button
              onClick={handleViewDetails}
              size="sm"
              variant="outline"
            >
              View Details
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

