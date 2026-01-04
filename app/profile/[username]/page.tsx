import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfileByUsername } from '@/lib/actions/user'
import ProfilePageClient from '@/components/profile/ProfilePageClient'

interface ProfilePageProps {
  params: Promise<{ username: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username: rawUsername } = await params
  // URL decode the username in case it's encoded
  const username = decodeURIComponent(rawUsername).trim()
  const supabase = await createClient()
  
  // Validate username is not empty
  if (!username) {
    redirect('/profile')
  }

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/signin?redirect=/profile')
  }

  // Check if user is admin or viewing their own profile
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role, username')
    .eq('id', user.id)
    .single()

  const typedCurrentProfile = currentProfile as { role: 'customer' | 'admin'; username: string | null } | null
  const isAdmin = typedCurrentProfile?.role === 'admin'
  const isOwnProfile = typedCurrentProfile?.username === username

  if (!isAdmin && !isOwnProfile) {
    redirect('/profile')
  }

  // Fetch profile data by username
  const profile = await getUserProfileByUsername(username)

  if (!profile) {
    redirect('/profile')
  }

  return (
    <ProfilePageClient
      profile={profile}
      currentUserId={user.id}
      isAdmin={isAdmin}
      isOwnProfile={isOwnProfile}
    />
  )
}
