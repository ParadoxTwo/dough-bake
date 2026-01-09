'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Product } from '@/lib/types/product'
import { groupProductsByCategory } from '@/lib/utils/products'
import CategorySection from '@/components/product/CategorySection'
import EmptyState from '@/components/ui/EmptyState'
import SearchBar from '@/components/ui/SearchBar'
import { useCurrency } from '@/lib/currency/context'

interface MenuPageClientProps {
  products: Product[]
  initialQuery?: string
}

export default function MenuPageClient({ products, initialQuery = '' }: MenuPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const { formatPrice, convertPrice } = useCurrency()

  // Sync search query with URL params (only when URL changes, not when searchQuery changes)
  useEffect(() => {
    const q = searchParams.get('q') || ''
    if (q !== searchQuery) {
      setSearchQuery(q)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Update URL when search query changes (with debounce)
  useEffect(() => {
    const currentQ = searchParams.get('q') || ''
    const trimmedQuery = searchQuery.trim()
    
    // Only update URL if the value has actually changed
    if (currentQ === trimmedQuery) {
      return
    }

    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (trimmedQuery) {
        params.set('q', trimmedQuery)
      } else {
        params.delete('q')
      }
      const newUrl = params.toString() ? `/menu?${params.toString()}` : '/menu'
      router.replace(newUrl, { scroll: false })
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, router, searchParams])

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products
    }

    const query = searchQuery.toLowerCase().trim()
    return products.filter((product) => {
      // Search by name
      const nameMatch = product.name?.toLowerCase().includes(query)
      
      // Search by category
      const categoryMatch = product.category?.toLowerCase().includes(query)
      
      // Search by price
      const priceStr = formatPrice(convertPrice(product.price)).toLowerCase()
      const priceMatch = priceStr.includes(query) || product.price.toString().includes(query)
      
      // Search by description
      const descriptionMatch = product.description?.toLowerCase().includes(query)

      return nameMatch || categoryMatch || priceMatch || descriptionMatch
    })
  }, [searchQuery, products, formatPrice, convertPrice])

  const productsByCategory = groupProductsByCategory(filteredProducts)

  return (
    <>
      <div className="mb-8">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="What are you looking for today?"
        />
      </div>

      {Object.keys(productsByCategory).length > 0 ? (
        Object.entries(productsByCategory).map(([category, items]) => (
          <CategorySection
            key={category}
            category={category}
            products={items}
            showCategory={false}
          />
        ))
      ) : searchQuery ? (
        <EmptyState message={`No products found matching "${searchQuery}".`} />
      ) : (
        <EmptyState message="No products available at the moment. Check back soon!" />
      )}
    </>
  )
}

