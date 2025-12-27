import { Database } from './database.types'
import type { ProductImage } from './variant'

export type Product = Database['public']['Tables']['products']['Row']

export interface ProductCardProps {
  product: Product & { firstImage?: ProductImage | null }
  href?: string
  showCategory?: boolean
  variant?: 'default' | 'compact'
}

