import { deleteProduct } from '@/lib/actions/product'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 })
    }

    await deleteProduct(productId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Product delete error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete product'
    
    // Return 409 Conflict if product cannot be deleted due to foreign key constraints
    const status = errorMessage.includes('associated with existing orders') ? 409 : 500
    
    return NextResponse.json(
      { error: errorMessage },
      { status }
    )
  }
}

