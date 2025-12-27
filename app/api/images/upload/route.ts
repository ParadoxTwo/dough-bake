import { createClient } from '@/lib/supabase/server'
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

    const formData = await request.formData()
    const productId = formData.get('productId') as string
    const variantId = formData.get('variantId') as string | null
    const displayOrder = parseInt(formData.get('displayOrder') as string || '0')
    const file = formData.get('file') as File

    if (!file || !productId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const imageData = await uploadProductImage(file, productId, variantId, displayOrder)
    const imageId = await saveProductImage(productId, imageData, variantId, null, displayOrder)

    return NextResponse.json({ success: true, imageId, imageData })
  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload image' },
      { status: 500 }
    )
  }
}

