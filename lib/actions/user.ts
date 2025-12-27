'use server'

import { createClient } from '@/lib/supabase/server'

export interface UserProfile {
  id: string
  email: string
  role: 'customer' | 'admin'
}

/**
 * Get current user and their profile (including admin status)
 * Returns null if not authenticated
 */
export async function getCurrentUserProfile(): Promise<{
  user: { id: string; email?: string } | null
  profile: UserProfile | null
  isAdmin: boolean
} | null> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      user: null,
      profile: null,
      isAdmin: false,
    }
  }

  // Fetch profile from database
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', user.id)
    .maybeSingle()
  
  const typedProfile = profile as { id: string; email: string; role: 'customer' | 'admin' } | null

  if (profileError) {
    console.error('Error fetching profile:', profileError)
    // Return user info but no profile if there's an error
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
      role: typedProfile.role as 'customer' | 'admin',
    } : null,
    isAdmin: typedProfile?.role === 'admin',
  }
}

