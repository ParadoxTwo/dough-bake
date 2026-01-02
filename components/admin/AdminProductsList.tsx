'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ThemedText from '@/components/ui/ThemedText'
import SearchBar from '@/components/ui/SearchBar'
import ProductFormModal from './ProductFormModal'
import { createProduct } from '@/lib/actions/product'
import type { ProductFormData } from '@/lib/types/variant'
import type { Database } from '@/lib/types/database.types'
import { useCurrency } from '@/lib/currency/context'

type ProductRow = Database['public']['Tables']['products']['Row']
type ProductVariantRow = Database['public']['Tables']['product_variants']['Row']

type ProductWithVariants = ProductRow & {
  product_variants: Array<{ id: string; name: string; product_id: string }> | null;
}

interface AdminProductsListProps {
  products: ProductWithVariants[]
}

export default function AdminProductsList({ products: initialProducts }: AdminProductsListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [products, setProducts] = useState(initialProducts)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredProducts, setFilteredProducts] = useState(initialProducts)
  const router = useRouter()
  const { formatPrice, convertPrice } = useCurrency()

  // Sync products when prop changes (e.g., after router.refresh())
  useEffect(() => {
    setProducts(initialProducts)
    setFilteredProducts(initialProducts)
  }, [initialProducts])

  // Filter products based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products)
      return
    }

    const query = searchQuery.toLowerCase().trim()
    const filtered = products.filter((product) => {
      // Search by name
      const nameMatch = product.name?.toLowerCase().includes(query)
      
      // Search by category
      const categoryMatch = product.category?.toLowerCase().includes(query)
      
      // Search by price
      const priceStr = formatPrice(convertPrice(product.price)).toLowerCase()
      const priceMatch = priceStr.includes(query) || product.price.toString().includes(query)
      
      // Search by availability
      const availabilityMatch = 
        (product.available && (query === 'available' || query === 'yes' || query === 'true')) ||
        (!product.available && (query === 'unavailable' || query === 'no' || query === 'false'))
      
      // Search by variant name
      const variantMatch = product.product_variants?.some((variant) =>
        variant.name?.toLowerCase().includes(query)
      ) || false

      return nameMatch || categoryMatch || priceMatch || availabilityMatch || variantMatch
    })

    setFilteredProducts(filtered)
  }, [searchQuery, products, formatPrice, convertPrice])

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

  const handleDelete = async (productId: string, productName: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent navigation to product page
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${productName}"? This action cannot be undone and will delete the product, all its variants, and all associated images.`
    )

    if (!confirmed) {
      return
    }

    setDeletingProductId(productId)
    try {
      const response = await fetch(`/api/products/delete?productId=${productId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete product')
      }

      // Update UI by removing the deleted product
      setProducts((prevProducts) => prevProducts.filter((p) => p.id !== productId))
      
      // Also refresh the page to ensure consistency
      router.refresh()
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete product')
    } finally {
      setDeletingProductId(null)
    }
  }

  return (
    <>
      <Card>
        <div className="mb-6">
          <div className="flex flex justify-between items-center gap-4 mb-4">
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
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, category, price, availability, or variant..."
          />
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between border-b pb-4 cursor-pointer hover:opacity-80 transition-opacity pr-2"
                style={{ borderColor: 'var(--theme-secondary)' }}
                onClick={() => router.push(`/product/${product.id}`)}
              >
                <div className="flex-1">
                  <ThemedText as="h3" weight="semibold">
                    {product.name}
                  </ThemedText>
                  <ThemedText as="p" size="sm" tone="secondary">
                    {product.category}
                  </ThemedText>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
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
                  <button
                    onClick={(e) => handleDelete(product.id, product.name, e)}
                    disabled={deletingProductId === product.id}
                    className="p-2 hover:opacity-70 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ color: '#ef4444' }}
                    aria-label={`Delete ${product.name}`}
                    title="Delete product"
                  >
                    {deletingProductId === product.id ? (
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : searchQuery ? (
            <ThemedText as="p" tone="secondary" className="text-center py-8">
              No products found matching "{searchQuery}".
            </ThemedText>
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

