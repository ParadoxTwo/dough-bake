'use client'

import { Product } from '@/lib/types/product'
import { ProductWithVariants } from '@/lib/types/variant'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import QuantitySelector from './QuantitySelector'
import ProductFeatures from './ProductFeatures'
import UnavailableMessage from './UnavailableMessage'
import VariantSelector from './VariantSelector'
import { useCurrency } from '@/lib/currency/context'

interface ProductInfoProps {
  product: Product
  productWithDetails?: ProductWithVariants | null
  selectedVariantId?: string | null
  onVariantSelect?: (variantId: string | null) => void
  quantity: number
  onQuantityChange: (quantity: number) => void
  onAddToCart: () => void
  addingToCart: boolean
}

export default function ProductInfo({
  product,
  productWithDetails,
  selectedVariantId,
  onVariantSelect,
  quantity,
  onQuantityChange,
  onAddToCart,
  addingToCart
}: ProductInfoProps) {
  const { formatPrice, convertPrice } = useCurrency()
  const variants = productWithDetails?.variants || []

  // Use variant price if selected, otherwise use base product price
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || null
  const effectivePrice = selectedVariant?.price ?? product.price

  // Convert to current currency for display
  const finalPrice = convertPrice(effectivePrice)

  return (
    <div>
      {product.category && (
        <div className="mb-4">
          <Badge>{product.category}</Badge>
        </div>
      )}
      
      <h1 
        className="text-4xl font-bold mb-4"
        style={{ color: 'var(--theme-text)' }}
      >
        {product.name}
      </h1>
      
      {product.description && (
        <p 
          className="text-lg mb-6"
          style={{ color: 'var(--theme-text-secondary)' }}
        >
          {product.description}
        </p>
      )}

      {variants.length > 0 && onVariantSelect && (
        <VariantSelector
          variants={variants}
          selectedVariantId={selectedVariantId || null}
          onVariantSelect={onVariantSelect}
          isAdmin={false}
          productId={product.id}
        />
      )}

      <div className="mb-8">
        <span 
          className="text-4xl font-bold"
          style={{ color: 'var(--theme-accent)' }}
        >
          {formatPrice(finalPrice)}
        </span>
      </div>

      {product.available ? (
        <div className="space-y-6">
          <QuantitySelector
            quantity={quantity}
            onQuantityChange={onQuantityChange}
          />
          
          <Button
            onClick={onAddToCart}
            disabled={addingToCart}
            loading={addingToCart}
            className="w-full py-4 text-lg"
          >
            Add to Cart
          </Button>

          <ProductFeatures />
        </div>
      ) : (
        <UnavailableMessage />
      )}
    </div>
  )
}

