'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ThemedText from '@/components/ui/ThemedText'
import ProductFormModal from './ProductFormModal'
import { createProduct } from '@/lib/actions/product'
import type { ProductFormData } from '@/lib/types/variant'
import type { Database } from '@/lib/types/database.types'
import { useCurrency } from '@/lib/currency/context'

type ProductRow = Database['public']['Tables']['products']['Row']

interface AdminProductsListProps {
  products: ProductRow[]
}

export default function AdminProductsList({ products }: AdminProductsListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { formatPrice, convertPrice } = useCurrency()

  const handleSubmit = async (formData: ProductFormData) => {
    setLoading(true)
    try {
      await createProduct(formData)
      router.refresh()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to create product:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-6">
          <ThemedText as="h2" size="xl" weight="bold">
            Products
          </ThemedText>
          <Button 
            size="sm" 
            fullWidth={false}
            onClick={() => setIsModalOpen(true)}
          >
            Add Product
          </Button>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {products.length > 0 ? (
            products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between border-b pb-4 cursor-pointer hover:opacity-80 transition-opacity pr-2"
                style={{ borderColor: 'var(--theme-secondary)' }}
                onClick={() => router.push(`/product/${product.id}`)}
              >
                <div>
                  <ThemedText as="h3" weight="semibold">
                    {product.name}
                  </ThemedText>
                  <ThemedText as="p" size="sm" tone="secondary">
                    {product.category}
                  </ThemedText>
                </div>
                <div className="text-right">
                  <ThemedText as="div" weight="bold" tone="accent">
                    {formatPrice(convertPrice(product.price))}
                  </ThemedText>
                  <div className="text-sm mt-1">
                    {product.available ? (
                      <Badge variant="default">Available</Badge>
                    ) : (
                      <span style={{ color: '#ef4444' }}>Unavailable</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <ThemedText as="p" tone="secondary" className="text-center py-8">
              No products yet. Click "Add Product" to create one.
            </ThemedText>
          )}
        </div>
      </Card>

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </>
  )
}

