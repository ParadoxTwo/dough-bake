/**
 * Query Optimization Utilities
 * 
 * This module provides utilities for optimizing database queries:
 * - Parallel query execution
 * - Query batching
 * - Caching helpers
 */

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * Execute multiple queries in parallel
 * Returns results in the same order as queries
 */
export async function executeParallel<T extends readonly unknown[]>(
  queries: [...{ [K in keyof T]: () => Promise<T[K]> }]
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const results = await Promise.all(queries.map(q => q()))
  // Type assertion is safe here because Promise.all preserves order
  return results as unknown as { [K in keyof T]: Awaited<T[K]> }
}

/**
 * Batch multiple queries with a shared Supabase client
 * Useful when you need to ensure queries use the same connection
 */
export async function batchQueries<T>(
  queries: (supabase: Awaited<ReturnType<typeof createClient>>) => Promise<T>
): Promise<T> {
  const supabase = await createClient()
  return queries(supabase)
}

/**
 * Cache a function result using React's cache
 * This is useful for server components to avoid duplicate queries
 */
export function cachedQuery<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  // Type assertion is safe here - cache preserves function signature
  return cache(fn) as unknown as T
}

/**
 * Get user and profile in a single optimized call
 * Caches the result for the request lifecycle
 */
export const getCachedUserAndProfile = cache(async () => {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return {
      user: null,
      profile: null,
      isAdmin: false,
    }
  }

  // Fetch profile in parallel with user (already have user, but this pattern is consistent)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, username, profile_picture_url, role')
    .eq('id', user.id)
    .maybeSingle()
  
  const typedProfile = profile as { 
    id: string
    email: string
    username: string | null
    profile_picture_url: string | null
    role: 'customer' | 'admin'
  } | null

  if (profileError) {
    console.error('Error fetching profile:', profileError)
    return {
      user: { id: user.id, email: user.email },
      profile: null,
      isAdmin: false,
    }
  }

  return {
    user: { id: user.id, email: user.email },
    profile: typedProfile ? {
      id: typedProfile.id,
      email: typedProfile.email,
      username: typedProfile.username,
      profile_picture_url: typedProfile.profile_picture_url,
      role: typedProfile.role as 'customer' | 'admin',
    } : null,
    isAdmin: typedProfile?.role === 'admin',
  }
})

/**
 * Get admin status with caching
 * Returns null if not authenticated, false if not admin, true if admin
 */
export const getCachedAdminStatus = cache(async (): Promise<boolean | null> => {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  const typedProfile = profile as { role: 'customer' | 'admin' } | null
  return typedProfile?.role === 'admin' || false
})

/**
 * Verify admin access with caching
 * Throws error if not admin, returns user if admin
 */
export async function requireAdmin(): Promise<{ id: string; email?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const isAdmin = await getCachedAdminStatus()
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  return { id: user.id, email: user.email }
}
