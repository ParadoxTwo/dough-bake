import { createClient } from '@/lib/supabase/server'

/**
 * Ensure the products storage bucket exists and is configured correctly
 */
export async function ensureProductsBucket(): Promise<void> {
  const supabase = await createClient()
  
  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  
  if (listError) {
    throw new Error(`Failed to list buckets: ${listError.message}`)
  }
  
  const productsBucket = buckets?.find(b => b.name === 'products')
  
  if (!productsBucket) {
    // Note: Creating buckets requires service role key
    // This should be done via Supabase dashboard or migration script
    throw new Error('Products bucket does not exist. Please create it in Supabase dashboard.')
  }
  
  // Verify bucket is public
  if (!productsBucket.public) {
    console.warn('Products bucket is not public. Images may not be accessible.')
  }
}

/**
 * Get public URL for a storage path
 */
export function getStoragePublicUrl(path: string): string {
  // This will be used client-side
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/products/${path}`
}

