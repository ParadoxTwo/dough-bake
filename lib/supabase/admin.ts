import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

/**
 * Service-role Supabase client for server-only privileged operations that run
 * WITHOUT a user session — queue processing and provider webhooks. It bypasses
 * RLS, so it must NEVER be imported into client components or exposed to the
 * browser. The service-role key is server-only and must not live in a
 * NEXT_PUBLIC_* variable.
 */
export function createAdminClient() {
  // Defense-in-depth: the service-role key must never run in the browser.
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient must only be used on the server')
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set — required for privileged delivery operations'
    )
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
