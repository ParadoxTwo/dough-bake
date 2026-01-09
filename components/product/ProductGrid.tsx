import { Product } from '@/lib/types/product'
import ProductCard from './ProductCard'

interface ProductGridProps {
  products: Product[]
  columns?: 1 | 2 | 3 | 4
  showCategory?: boolean
  variant?: 'default' | 'compact'
}

export default function ProductGrid({ 
  products, 
  columns = 3,
  showCategory = false,
  variant = 'default'
}: ProductGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  if (!products || products.length === 0) {
    return null
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-8`}>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          showCategory={showCategory}
          variant={variant}
          priority={index < 6} // Prioritize first 6 products (above the fold)
        />
      ))}
    </div>
  )
}

