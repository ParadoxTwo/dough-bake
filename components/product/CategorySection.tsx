import { Product } from '@/lib/types/product'
import ProductGrid from './ProductGrid'
import ThemedText from '../ui/ThemedText'

interface CategorySectionProps {
  category: string
  products: Product[]
  showCategory?: boolean
  variant?: 'default' | 'compact'
}

export default function CategorySection({ 
  category, 
  products,
  showCategory = false,
  variant = 'default'
}: CategorySectionProps) {
  if (!products || products.length === 0) {
    return null
  }

  return (
    <div className="mb-16">
      <ThemedText as="h2" size="3xl" weight="bold" className="mb-8 pb-2 border-b-2">
        {category}
      </ThemedText>
      <ProductGrid 
        products={products} 
        showCategory={showCategory}
        variant={variant}
      />
    </div>
  )
}

