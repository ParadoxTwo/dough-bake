import { createClient } from '@/lib/supabase/server'

export interface ImageSize {
  width: number
  height: number
  quality?: number
}

export const IMAGE_SIZES = {
  original: { width: 0, height: 0 }, // Keep original
  large: { width: 1200, height: 0, quality: 85 },
  medium: { width: 600, height: 0, quality: 85 },
  small: { width: 300, height: 0, quality: 80 },
  og: { width: 1200, height: 630, quality: 85 },
  thumbnail: { width: 200, height: 200, quality: 80 },
} as const

/**
 * Process and upload image to Supabase Storage
 * This will be called from a server action or API route
 */
export async function uploadProductImage(
  file: File,
  productId: string,
  variantId: string | null = null,
  displayOrder: number = 0
): Promise<{
  storagePath: string
  originalUrl: string
  largeUrl: string
  mediumUrl: string
  smallUrl: string
  ogUrl: string
  thumbnailUrl: string
}> {
  const supabase = await createClient()
  
  // Determine storage path
  const basePath = variantId 
    ? `${productId}/${variantId}`
    : productId
  
  const timestamp = Date.now()
  const fileExt = file.name.split('.').pop() || 'jpg'
  const fileName = `original-${timestamp}.${fileExt}`
  
  // Upload original file to products bucket
  const storagePath = `${basePath}/${fileName}`
  
  // Upload file directly (Supabase handles File objects)
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('products')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })
  
  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`)
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('products')
    .getPublicUrl(storagePath)
  
  // For now, we'll use the same URL for all sizes
  // In production, you'd generate different sizes using sharp or similar
  // and upload them as large.jpg, medium.jpg, etc.
  // For now, Next.js Image component will handle optimization
  const baseUrl = publicUrl
  
  return {
    storagePath,
    originalUrl: baseUrl,
    largeUrl: baseUrl, // Will be optimized by Next.js Image component
    mediumUrl: baseUrl,
    smallUrl: baseUrl,
    ogUrl: baseUrl,
    thumbnailUrl: baseUrl,
  }
}

/**
 * Save image metadata to database
 */
export async function saveProductImage(
  productId: string,
  imageData: {
    storagePath: string
    originalUrl: string
    largeUrl: string
    mediumUrl: string
    smallUrl: string
    ogUrl: string
    thumbnailUrl: string
  },
  variantId: string | null = null,
  altText: string | null = null,
  displayOrder: number = 0
): Promise<string> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('product_images')
    .insert({
      product_id: productId,
      variant_id: variantId,
      storage_path: imageData.storagePath,
      original_url: imageData.originalUrl,
      large_url: imageData.largeUrl,
      medium_url: imageData.mediumUrl,
      small_url: imageData.smallUrl,
      og_url: imageData.ogUrl,
      thumbnail_url: imageData.thumbnailUrl,
      alt_text: altText,
      display_order: displayOrder,
    })
    .select('id')
    .single()
  
  if (error) {
    throw new Error(`Failed to save image metadata: ${error.message}`)
  }
  
  return data.id
}

/**
 * Delete image from storage and database
 */
export async function deleteProductImage(imageId: string): Promise<void> {
  const supabase = await createClient()
  
  // Get image record
  const { data: image, error: fetchError } = await supabase
    .from('product_images')
    .select('storage_path')
    .eq('id', imageId)
    .single()
  
  if (fetchError || !image) {
    throw new Error(`Failed to find image: ${fetchError?.message || 'Image not found'}`)
  }
  
  // Delete from storage
  const { error: deleteError } = await supabase.storage
    .from('products')
    .remove([image.storage_path])
  
  if (deleteError) {
    console.error('Failed to delete image from storage:', deleteError)
    // Continue to delete from database even if storage delete fails
  }
  
  // Delete from database
  const { error: dbError } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId)
  
  if (dbError) {
    throw new Error(`Failed to delete image from database: ${dbError.message}`)
  }
}

/**
 * Get optimized image URL for a specific size
 */
export function getOptimizedImageUrl(
  baseUrl: string,
  size: keyof typeof IMAGE_SIZES
): string {
  // For now, return the base URL
  // In production, you could append query parameters for Next.js Image Optimization
  // or use different storage paths for different sizes
  return baseUrl
}

