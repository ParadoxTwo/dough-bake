'use server'

import { createClient } from '@/lib/supabase/server'
import { Product } from '@/lib/types/product'
import { ProductFormData, ProductWithVariants } from '@/lib/types/variant'
import { Database } from '@/lib/types/database.types'
import { notFound } from 'next/navigation'
import { generateUniqueProductSlug, generateUniqueVariantSlug } from '@/lib/utils/slug'
import { uploadProductImage, saveProductImage } from '@/lib/utils/images'

type ProductRow = Database['public']['Tables']['products']['Row']
type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']
type ProductVariantRow = Database['public']['Tables']['product_variants']['Row']
type ProductVariantInsert = Database['public']['Tables']['product_variants']['Insert']
type ProductVariantUpdate = Database['public']['Tables']['product_variants']['Update']
type ProductImageRow = Database['public']['Tables']['product_images']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

/**
 * Get products with their first image for listing pages
 */
export async function getProductsWithImages(): Promise<Array<Product & { firstImage?: ProductImageRow | null }>> {
  const supabase = await createClient()

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('available', true)
    .order('category', { ascending: true })

  if (productsError || !products) {
    return []
  }

  const typedProducts: ProductRow[] = (products || []) as ProductRow[]

  // Get first image for each product
  const productIds = typedProducts.map((p) => p.id)
  const { data: images } = productIds.length > 0
    ? await supabase
        .from('product_images')
        .select('*')
        .in('product_id', productIds)
        .is('variant_id', null)
        .order('display_order', { ascending: true })
    : { data: null }

  const typedImages: ProductImageRow[] = (images || []) as ProductImageRow[]

  // Group images by product_id and get the first one
  const imagesByProductId = new Map<string, ProductImageRow>()
  for (const image of typedImages) {
    if (!imagesByProductId.has(image.product_id)) {
      imagesByProductId.set(image.product_id, image)
    }
  }

  // Combine products with their first image
  return typedProducts.map((product) => ({
    ...product,
    firstImage: imagesByProductId.get(product.id) || null,
  })) as Array<Product & { firstImage?: ProductImageRow | null }>
}

/**
 * Get product with variants and images by ID
 */
export async function getProductWithDetails(id: string): Promise<ProductWithVariants | null> {
  const supabase = await createClient()

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (productError || !product) {
    return null
  }

  // Get variants
  const { data: variants } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', id)
    .order('created_at', { ascending: true })
  const typedVariants: ProductVariantRow[] = (variants || []) as ProductVariantRow[]

  // Get product images
  const { data: productImages } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', id)
    .is('variant_id', null)
    .order('display_order', { ascending: true })
  const typedProductImages: ProductImageRow[] = (productImages || []) as ProductImageRow[]

  // Get variant images
  const variantIds = typedVariants.map((v) => v.id)
  const { data: variantImages } = variantIds.length > 0
    ? await supabase
        .from('product_images')
        .select('*')
        .in('variant_id', variantIds)
        .order('display_order', { ascending: true })
    : { data: null }
  const typedVariantImages: ProductImageRow[] = (variantImages || []) as ProductImageRow[]

  // Combine variants with their images
  const variantsWithImages = typedVariants.map((variant) => ({
    ...variant,
    images: typedVariantImages.filter((img) => img.variant_id === variant.id),
  }))

  const productWithDetails: ProductWithVariants = {
    ...(product as ProductRow),
    variants: variantsWithImages,
    images: typedProductImages,
  }
  return productWithDetails
}

/**
 * Create a product directly (no API route needed)
 */
export async function createProduct(formData: ProductFormData): Promise<{ productId: string; slug: string }> {
  const supabase = await createClient()

  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profile as ProfileRow | null)?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }

  // Generate unique slug
  const productSlug = await generateUniqueProductSlug(formData.name, supabase)

  // Create product
  const productInsert: ProductInsert = {
    name: formData.name,
    description: formData.description || null,
    price: formData.price,
    category: formData.category || null,
    stock_type: formData.stockType,
    stock_quantity: formData.stockQuantity,
    slug: productSlug,
    available: true,
  }

  // Type assertion needed because Supabase's type inference doesn't always work correctly
  // We know productInsert matches ProductInsert type, so we assert the insert call
  const productsQuery = supabase.from('products') as unknown as {
    insert: (values: ProductInsert) => {
      select: (columns: string) => {
        single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>
      }
    }
  }
  const insertResult = await productsQuery
    .insert(productInsert)
    .select('id')
    .single()
  
  // Type the result explicitly
  type ProductIdResult = { id: string }
  const product = insertResult.data as ProductIdResult | null
  const productError = insertResult.error

  if (productError || !product) {
    throw new Error(`Failed to create product: ${productError?.message || 'Unknown error'}`)
  }

  // Upload product images
  for (let i = 0; i < formData.images.length; i++) {
    const imageFile = formData.images[i]
    if (imageFile.size > 0) {
      try {
        const imageData = await uploadProductImage(imageFile, product.id, null, i)
        await saveProductImage(product.id, imageData, null, null, i)
      } catch (error) {
        console.error(`Failed to upload product image ${i}:`, error)
        // Continue with other images
      }
    }
  }

  // Create variants
  for (const variantData of formData.variants) {
    if (!variantData.name) continue

    const variantSlug = await generateUniqueVariantSlug(product.id, variantData.name, supabase)

    const variantInsert: ProductVariantInsert = {
      product_id: product.id,
      name: variantData.name,
      slug: variantSlug,
      description: variantData.description || null,
      price_adjustment: variantData.priceAdjustment,
      stock_type: variantData.stockType,
      stock_quantity: variantData.stockQuantity,
      available: true,
    }

    // Type assertion needed because Supabase's type inference doesn't always work correctly
    // We know variantInsert matches ProductVariantInsert type, so we assert the insert call
    const variantsQuery = supabase.from('product_variants') as unknown as {
      insert: (values: ProductVariantInsert) => {
        select: (columns: string) => {
          single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>
        }
      }
    }
    const variantInsertResult = await variantsQuery
      .insert(variantInsert)
      .select('id')
      .single()
    
    type VariantIdResult = { id: string }
    const variant = variantInsertResult.data as VariantIdResult | null
    const variantError = variantInsertResult.error

    if (variantError || !variant) {
      console.error(`Failed to create variant: ${variantError?.message}`)
      continue
    }

    // Upload variant images
    for (let i = 0; i < variantData.images.length; i++) {
      const imageFile = variantData.images[i]
      if (imageFile.size > 0) {
        try {
          const imageData = await uploadProductImage(imageFile, product.id, variant.id, i)
          await saveProductImage(product.id, imageData, variant.id, null, i)
        } catch (error) {
          console.error(`Failed to upload variant image ${i}:`, error)
          // Continue with other images
        }
      }
    }
  }

  return {
    productId: product.id,
    slug: productSlug,
  }
}

/**
 * Update product
 */
export async function updateProduct(
  productId: string,
  updates: Partial<{
    name: string
    description: string
    price: number
    category: string
    stockType: 'unlimited' | 'limited'
    stockQuantity: number | null
    available: boolean
  }>
): Promise<void> {
  const supabase = await createClient()

  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profile as ProfileRow | null)?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }

  const updateData: ProductUpdate = {}
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.price !== undefined) updateData.price = updates.price
  if (updates.category !== undefined) updateData.category = updates.category
  if (updates.stockType !== undefined) updateData.stock_type = updates.stockType
  if (updates.stockQuantity !== undefined) updateData.stock_quantity = updates.stockQuantity
  if (updates.available !== undefined) updateData.available = updates.available

  // If name changed, update slug
  if (updates.name) {
    const newSlug = await generateUniqueProductSlug(updates.name, supabase)
    updateData.slug = newSlug
  }

  // Type assertion needed because Supabase's type inference doesn't always work correctly
  // We know updateData matches ProductUpdate type, so we assert the update call
  const productsUpdateQuery = supabase.from('products') as unknown as {
    update: (values: ProductUpdate) => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
    }
  }
  const updateResult = await productsUpdateQuery
    .update(updateData)
    .eq('id', productId)
  
  const error = updateResult.error

  if (error) {
    throw new Error(`Failed to update product: ${error.message}`)
  }
}

/**
 * Update a product variant
 */
export async function updateVariant(
  productId: string,
  variantId: string,
  updates: Partial<{
    name: string
    description: string
    priceAdjustment: number
    stockType: 'unlimited' | 'limited'
    stockQuantity: number | null
    available: boolean
  }>
): Promise<void> {
  const supabase = await createClient()

  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profile as ProfileRow | null)?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }

  const updateData: ProductVariantUpdate = {}
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.priceAdjustment !== undefined) updateData.price_adjustment = updates.priceAdjustment
  if (updates.stockType !== undefined) updateData.stock_type = updates.stockType
  if (updates.stockQuantity !== undefined) updateData.stock_quantity = updates.stockQuantity
  if (updates.available !== undefined) updateData.available = updates.available

  // If name changed, update slug
  if (updates.name) {
    const newSlug = await generateUniqueVariantSlug(productId, updates.name, supabase)
    updateData.slug = newSlug
  }

  const variantsUpdateQuery = supabase.from('product_variants') as unknown as {
    update: (values: ProductVariantUpdate) => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
    }
  }

  const updateResult = await variantsUpdateQuery
    .update(updateData)
    .eq('id', variantId)

  const error = updateResult.error

  if (error) {
    throw new Error(`Failed to update variant: ${error.message}`)
  }
}

/**
 * Delete a product variant
 */
export async function deleteVariant(variantId: string): Promise<void> {
  const supabase = await createClient()

  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profile as ProfileRow | null)?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }

  const { error } = await supabase
    .from('product_variants')
    .delete()
    .eq('id', variantId)

  if (error) {
    throw new Error(`Failed to delete variant: ${error.message}`)
  }
}

/**
 * Create a new variant with default values
 */
export async function createVariant(
  productId: string,
  options?: Partial<{
    name: string
    description: string | null
    priceAdjustment: number
    stockType: 'unlimited' | 'limited'
    stockQuantity: number | null
    images: File[]
  }>
): Promise<{ id: string }> {
  const supabase = await createClient()

  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profile as ProfileRow | null)?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }

  const name = options?.name || 'New variant'
  const description = options?.description ?? null
  const priceAdjustment = options?.priceAdjustment ?? 0
  const stockType = options?.stockType ?? 'unlimited'
  const stockQuantity = options?.stockQuantity ?? null
  const images = options?.images ?? []

  const slug = await generateUniqueVariantSlug(productId, name, supabase)

  const variantInsert: ProductVariantInsert = {
    product_id: productId,
    name,
    slug,
    description,
    price_adjustment: priceAdjustment,
    stock_type: stockType,
    stock_quantity: stockQuantity,
    available: true,
  }

  const variantsInsertQuery = supabase.from('product_variants') as unknown as {
    insert: (values: ProductVariantInsert) => {
      select: (columns: string) => {
        single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>
      }
    }
  }

  const insertResult = await variantsInsertQuery
    .insert(variantInsert)
    .select('id')
    .single()

  type VariantIdResult = { id: string }
  const variant = insertResult.data as VariantIdResult | null
  const error = insertResult.error

  if (error || !variant) {
    throw new Error(`Failed to create variant: ${error?.message || 'Unknown error'}`)
  }

  // Upload variant images if provided
  for (let i = 0; i < images.length; i++) {
    const imageFile = images[i]
    if (imageFile.size > 0) {
      try {
        const imageData = await uploadProductImage(imageFile, productId, variant.id, i)
        await saveProductImage(productId, imageData, variant.id, null, i)
      } catch (err) {
        console.error(`Failed to upload variant image ${i}:`, err)
        // Continue with other images
      }
    }
  }

  return { id: variant.id }
}
