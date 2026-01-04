'use server'

import { createClient } from '@/lib/supabase/server'

export interface UserProfile {
  id: string
  email: string
  username: string | null
  profile_picture_url: string | null
  role: 'customer' | 'admin'
}

export interface UserProfileWithCustomer extends UserProfile {
  customer?: {
    name: string
    phone: string | null
    address: string | null
    city: string | null
    state: string | null
    postal_code: string | null
  } | null
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
      username: typedProfile.username,
      profile_picture_url: typedProfile.profile_picture_url,
      role: typedProfile.role as 'customer' | 'admin',
    } : null,
    isAdmin: typedProfile?.role === 'admin',
  }
}

/**
 * Get user profile with customer details by user ID
 * Admins can view any user, regular users can only view themselves
 */
export async function getUserProfile(userId: string): Promise<UserProfileWithCustomer | null> {
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  // Check if user is admin or viewing their own profile
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const typedCurrentProfile = currentProfile as { role: 'customer' | 'admin' } | null
  const isAdmin = typedCurrentProfile?.role === 'admin'
  const isOwnProfile = user.id === userId

  if (!isAdmin && !isOwnProfile) {
    return null // Unauthorized
  }

  // Fetch profile and customer data in parallel for better performance
  // Note: We fetch customer separately due to RLS policy issues with relationship queries
  const [profileResult, customerResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, username, profile_picture_url, role')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('customers')
      .select('name, phone, address, city, state, postal_code')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const { data: profile, error: profileError } = profileResult
  const { data: customer } = customerResult

  if (profileError || !profile) {
    return null
  }

  const typedProfile = profile as {
    id: string
    email: string
    username: string | null
    profile_picture_url: string | null
    role: 'customer' | 'admin'
  }

  return {
    id: typedProfile.id,
    email: typedProfile.email,
    username: typedProfile.username,
    profile_picture_url: typedProfile.profile_picture_url,
    role: typedProfile.role,
    customer: customer || null,
  }
}

/**
 * Get user profile with customer details by username
 * Admins can view any user, regular users can only view themselves
 */
export async function getUserProfileByUsername(username: string): Promise<UserProfileWithCustomer | null> {
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  // Check if user is admin
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const typedCurrentProfile = currentProfile as { role: 'customer' | 'admin' } | null
  const isAdmin = typedCurrentProfile?.role === 'admin'

  // Fetch profile by username (case-insensitive)
  // Note: We fetch customer separately due to RLS policy issues with relationship queries
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, username, profile_picture_url, role')
    .ilike('username', username)
    .maybeSingle()

  if (profileError || !profile) {
    return null
  }

  const typedProfile = profile as {
    id: string
    email: string
    username: string | null
    profile_picture_url: string | null
    role: 'customer' | 'admin'
  }

  const isOwnProfile = user.id === typedProfile.id

  // Check permission: admin can view any profile, users can only view their own
  if (!isAdmin && !isOwnProfile) {
    return null // Unauthorized
  }

  // Fetch customer data directly (RLS will handle permissions)
  const { data: customer } = await supabase
    .from('customers')
    .select('name, phone, address, city, state, postal_code')
    .eq('user_id', typedProfile.id)
    .maybeSingle()

  return {
    id: typedProfile.id,
    email: typedProfile.email,
    username: typedProfile.username,
    profile_picture_url: typedProfile.profile_picture_url,
    role: typedProfile.role,
    customer: customer || null,
  }
}

/**
 * Update user profile and customer information
 * Admins can update any user, regular users can only update themselves
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    customer?: {
      name?: string
      phone?: string | null
      address?: string | null
      city?: string | null
      state?: string | null
      postal_code?: string | null
    }
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Check if user is admin or updating their own profile
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const typedCurrentProfile = currentProfile as { role: 'customer' | 'admin' } | null
  const isAdmin = typedCurrentProfile?.role === 'admin'
  const isOwnProfile = user.id === userId

  if (!isAdmin && !isOwnProfile) {
    return { success: false, error: 'Forbidden' }
  }

  // Update customer information if provided
  if (updates.customer) {
    const customersQuery = supabase.from('customers') as unknown as {
      upsert: (values: {
        user_id: string
        name?: string
        phone?: string | null
        address?: string | null
        city?: string | null
        state?: string | null
        postal_code?: string | null
      }, options?: { onConflict?: string }) => Promise<{ error: { message: string } | null }>
    }
    
    const { error: customerError } = await customersQuery.upsert({
      user_id: userId,
      name: updates.customer.name,
      phone: updates.customer.phone,
      address: updates.customer.address,
      city: updates.customer.city,
      state: updates.customer.state,
      postal_code: updates.customer.postal_code,
    }, {
      onConflict: 'user_id',
    })

    if (customerError) {
      return { success: false, error: customerError.message }
    }
  }

  return { success: true }
}

