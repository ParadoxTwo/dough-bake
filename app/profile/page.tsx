import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ProfilePage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/signin?redirect=/profile')
  }

  // Get user's username
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  const typedProfile = profile as { username: string | null } | null
  if (!typedProfile?.username) {
    // If no username, redirect to signin or show error
    redirect('/auth/signin?redirect=/profile')
  }

  // Redirect to user's own profile using username
  redirect(`/profile/${typedProfile.username}`)
}

