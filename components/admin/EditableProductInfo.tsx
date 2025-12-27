'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUserProfile } from '@/lib/actions/user'
import { updateProduct, updateVariant } from '@/lib/actions/product'
import InlineEditable from './InlineEditable'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import QuantitySelector from '@/components/product/QuantitySelector'
import ProductFeatures from '@/components/product/ProductFeatures'
import UnavailableMessage from '@/components/product/UnavailableMessage'
import VariantSelector from '@/components/product/VariantSelector'
import type { ProductWithVariants } from '@/lib/types/variant'
import { useCurrency } from '@/lib/currency/context'

interface EditableProductInfoProps {
  product: ProductWithVariants
  selectedVariantId?: string | null
  onVariantSelect?: (variantId: string | null) => void
  quantity: number
  onQuantityChange: (quantity: number) => void
  onAddToCart: () => void
  addingToCart: boolean
}

export default function EditableProductInfo({
  product,
  selectedVariantId,
  onVariantSelect,
  quantity,
  onQuantityChange,
  onAddToCart,
  addingToCart,
}: EditableProductInfoProps) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAdmin = async () => {
      const profile = await getCurrentUserProfile()
      setIsAdmin(profile?.isAdmin || false)
      setLoading(false)
    }
    checkAdmin()
  }, [])

  const { formatPrice, convertPrice } = useCurrency()
  
  // ProductWithVariants extends products Row, so it has all product properties
  const baseProduct = product as any
  const variants = product.variants || []
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || null

  // Base product price in INR
  const basePrice = baseProduct.price as number

  // Effective base price including selected variant adjustment (in INR)
  const effectiveBasePrice = basePrice + (selectedVariant?.price_adjustment ?? 0)

  // Converted price for display (uses current currency)
  const finalDisplayPrice = convertPrice(effectiveBasePrice)

  const handleSave = async (field: string, value: string | number) => {
    try {
      const numericValue = typeof value === 'string' ? parseFloat(value) : value

      // Special handling for price: update variant adjustment if a variant is selected,
      // otherwise update the base product price.
      if (field === 'price') {
        const productId = baseProduct.id as string

        if (selectedVariant && selectedVariantId) {
          await updateVariant(productId, selectedVariantId, {
            priceAdjustment: numericValue,
          })
        } else {
          await updateProduct(productId, {
            price: numericValue,
          })
        }
      } else {
        const updates: any = {}
        updates[field] = value
        // ProductWithVariants extends products Row, so it has id
        const productId = baseProduct.id as string
        await updateProduct(productId, updates)
      }

      router.refresh()
    } catch (error) {
      throw error
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      {baseProduct.category && (
        <div className="mb-4">
          {isAdmin ? (
            <InlineEditable
              value={baseProduct.category}
              onSave={(value) => handleSave('category', value)}
              className="inline-block"
            />
          ) : (
            <Badge>{baseProduct.category}</Badge>
          )}
        </div>
      )}
      
      <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--theme-text)' }}>
        {isAdmin ? (
          <InlineEditable
            value={baseProduct.name}
            onSave={(value) => handleSave('name', value)}
            className="block"
          />
        ) : (
          baseProduct.name
        )}
      </h1>
      
      <div className="mb-6">
        {isAdmin ? (
          <InlineEditable
            value={baseProduct.description || ''}
            onSave={(value) => handleSave('description', value)}
            multiline
            rows={4}
            className="block"
          />
        ) : (
          baseProduct.description && (
            <p 
              className="text-lg"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
              {baseProduct.description}
            </p>
          )
        )}
      </div>

      {variants.length > 0 && onVariantSelect && (
        <VariantSelector
          variants={variants}
          selectedVariantId={selectedVariantId || null}
          onVariantSelect={onVariantSelect}
          isAdmin={isAdmin}
          productId={baseProduct.id as string}
        />
      )}

      <div className="mb-8">
        {isAdmin ? (
          <div>
            <InlineEditable
              value={selectedVariant ? (selectedVariant.price_adjustment ?? 0) : basePrice}
              onSave={(value) => handleSave('price', value)}
              type="number"
              className="text-4xl font-bold block"
              displayFormatter={() => formatPrice(finalDisplayPrice)}
            />
            <span className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
              Base price in INR (₹{basePrice.toFixed(2)}) • Current selection price: {formatPrice(finalDisplayPrice)}
            </span>
          </div>
        ) : (
          <span 
            className="text-4xl font-bold"
            style={{ color: 'var(--theme-accent)' }}
          >
            {formatPrice(finalDisplayPrice)}
          </span>
        )}
      </div>

      {baseProduct.available ? (
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

