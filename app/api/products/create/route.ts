import { createClient } from '@/lib/supabase/server'
import { generateUniqueProductSlug, generateUniqueVariantSlug } from '@/lib/utils/slug'
import { uploadProductImage, saveProductImage } from '@/lib/utils/images'
import { NextResponse } from 'next/server'

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

    if (profile?.role !== 'admin') {
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
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name,
        description: description || null,
        price,
        category: category || null,
        stock_type: stockType,
        stock_quantity: stockQuantity,
        slug: productSlug,
        available: true,
      })
      .select('id')
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: `Failed to create product: ${productError?.message}` },
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
      const priceAdjustment = parseFloat(formData.get(`variants[${v}][priceAdjustment]`) as string || '0')
      const variantStockType = formData.get(`variants[${v}][stockType]`) as 'unlimited' | 'limited'
      const variantStockQuantity = formData.get(`variants[${v}][stockQuantity]`)
        ? parseInt(formData.get(`variants[${v}][stockQuantity]`) as string)
        : null

      if (!variantName) continue

      const variantSlug = await generateUniqueVariantSlug(product.id, variantName, supabase)

      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .insert({
          product_id: product.id,
          name: variantName,
          slug: variantSlug,
          description: variantDescription || null,
          price_adjustment: priceAdjustment,
          stock_type: variantStockType,
          stock_quantity: variantStockQuantity,
          available: true,
        })
        .select('id')
        .single()

      if (variantError || !variant) {
        console.error(`Failed to create variant: ${variantError?.message}`)
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

