import { createClient } from '@/lib/supabase/server'
import { generateUniqueProductSlug, generateUniqueVariantSlug } from '@/lib/utils/slug'
import { uploadProductImage, saveProductImage } from '@/lib/utils/images'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/types/database.types'

type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductVariantInsert = Database['public']['Tables']['product_variants']['Insert']

// Increase body size limit for image uploads
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    const typedProfile = profile as { role: 'customer' | 'admin' } | null

    if (typedProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch (error) {
      console.error('Failed to parse form data:', error)
      return NextResponse.json(
        { error: 'Failed to parse form data. The request may be too large.' },
        { status: 400 }
      )
    }

    // Extract product data
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const category = formData.get('category') as string
    const stockType = formData.get('stockType') as 'unlimited' | 'limited'
    const stockQuantity = formData.get('stockQuantity') 
      ? parseInt(formData.get('stockQuantity') as string) 
      : null

    // Generate unique slug
    const productSlug = await generateUniqueProductSlug(name, supabase)

    // Create product
    const productInsert: ProductInsert = {
      name,
      description: description || null,
      price,
      category: category || null,
      stock_type: stockType,
      stock_quantity: stockQuantity,
      slug: productSlug,
      available: true,
    }

    // Type assertion needed because Supabase's type inference doesn't always work correctly
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
    
    type ProductIdResult = { id: string }
    const product = insertResult.data as ProductIdResult | null
    const productError = insertResult.error

    if (productError || !product) {
      return NextResponse.json(
        { error: `Failed to create product: ${productError?.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    // Upload product images
    const productImageFiles = formData.getAll('productImages') as File[]
    for (let i = 0; i < productImageFiles.length; i++) {
      const imageFile = productImageFiles[i]
      if (imageFile.size > 0) {
        try {
          const imageData = await uploadProductImage(imageFile, product.id, null, i)
          await saveProductImage(product.id, imageData, null, null, i)
        } catch (error) {
          console.error(`Failed to upload product image ${i}:`, error)
        }
      }
    }

    // Handle variants
    const variantCount = parseInt(formData.get('variantCount') as string) || 0
    const variantIds: string[] = []

    for (let v = 0; v < variantCount; v++) {
      const variantName = formData.get(`variants[${v}][name]`) as string
      const variantDescription = formData.get(`variants[${v}][description]`) as string
      const variantPrice = parseFloat(formData.get(`variants[${v}][price]`) as string || price.toString())
      const variantStockType = formData.get(`variants[${v}][stockType]`) as 'unlimited' | 'limited'
      const variantStockQuantity = formData.get(`variants[${v}][stockQuantity]`)
        ? parseInt(formData.get(`variants[${v}][stockQuantity]`) as string)
        : null

      if (!variantName) continue

      const variantSlug = await generateUniqueVariantSlug(product.id, variantName, supabase)

      const variantInsert: ProductVariantInsert = {
        product_id: product.id,
        name: variantName,
        slug: variantSlug,
        description: variantDescription || null,
        price: variantPrice,
        stock_type: variantStockType,
        stock_quantity: variantStockQuantity,
        available: true,
      }

      // Type assertion needed because Supabase's type inference doesn't always work correctly
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
        console.error(`Failed to create variant: ${variantError?.message || 'Unknown error'}`)
        continue
      }

      variantIds.push(variant.id)

      // Upload variant images
      const variantImageFiles = formData.getAll(`variants[${v}][images]`) as File[]
      for (let i = 0; i < variantImageFiles.length; i++) {
        const imageFile = variantImageFiles[i]
        if (imageFile.size > 0) {
          try {
            const imageData = await uploadProductImage(imageFile, product.id, variant.id, i)
            await saveProductImage(product.id, imageData, variant.id, null, i)
          } catch (error) {
            console.error(`Failed to upload variant image ${i}:`, error)
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      productId: product.id,
      slug: productSlug 
    })
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    )
  }
}

