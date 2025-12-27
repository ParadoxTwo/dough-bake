/**
 * Client-safe image utility functions
 * These can be imported in both client and server components
 */

/**
 * Check if an image URL is from local Supabase (127.0.0.1 or localhost)
 * Local Supabase images should use unoptimized={true} to avoid Next.js Image optimization issues
 */
export function isLocalSupabaseUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const urlObj = new URL(url)
    return (
      (urlObj.hostname === '127.0.0.1' || urlObj.hostname === 'localhost') &&
      urlObj.port === '54321'
    )
  } catch {
    return false
  }
}

