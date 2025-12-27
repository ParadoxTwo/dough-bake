/**
 * Generate a URL-friendly slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug by checking for existing slugs and appending a number if needed
 */
export async function generateUniqueSlug(
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = generateSlug(baseSlug)
  let counter = 1
  let uniqueSlug = slug

  while (await checkExists(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`
    counter++
  }

  return uniqueSlug
}

/**
 * Generate a unique product slug
 */
export async function generateUniqueProductSlug(
  name: string,
  supabase: any
): Promise<string> {
  return generateUniqueSlug(name, async (slug) => {
    const { data } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .single()
    return !!data
  })
}

/**
 * Generate a unique variant slug for a product
 */
export async function generateUniqueVariantSlug(
  productId: string,
  name: string,
  supabase: any
): Promise<string> {
  return generateUniqueSlug(name, async (slug) => {
    const { data } = await supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', productId)
      .eq('slug', slug)
      .single()
    return !!data
  })
}

