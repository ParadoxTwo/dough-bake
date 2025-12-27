import { Product } from '@/lib/types/product'

/**
 * Group products by category
 */
export function groupProductsByCategory(products: Product[] | null): Record<string, Product[]> {
  if (!products) {
    return {}
  }

  return products.reduce((acc, product) => {
    const category = product.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(product)
    return acc
  }, {} as Record<string, Product[]>)
}

