import { Database } from './database.types'

export type ProductVariant = Database['public']['Tables']['product_variants']['Row']
export type ProductImage = Database['public']['Tables']['product_images']['Row']
export type JobQueue = Database['public']['Tables']['job_queue']['Row']
export type Product = Database['public']['Tables']['products']['Row']

export interface ProductVariantWithImages extends ProductVariant {
  images: ProductImage[]
}

export interface ProductWithVariants extends Product {
  variants?: ProductVariantWithImages[]
  images?: ProductImage[]
}

export interface ProductFormData {
  name: string
  description: string
  price: number
  category: string
  stockType: 'unlimited' | 'limited'
  stockQuantity: number | null
  images: File[]
  variants: VariantFormData[]
}

export interface VariantFormData {
  name: string
  description: string
  priceAdjustment: number
  stockType: 'unlimited' | 'limited'
  stockQuantity: number | null
  images: File[]
}

export interface ImageUploadResult {
  storagePath: string
  originalUrl: string
  largeUrl: string
  mediumUrl: string
  smallUrl: string
  ogUrl: string
  thumbnailUrl: string
}

