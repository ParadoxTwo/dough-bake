import Link from 'next/link'
import Image from 'next/image'
import { User } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import LoadingSpinner from '../ui/LoadingSpinner'
import Button from '../ui/Button'

interface UserAuthSectionProps {
  user: User | null
  loading: boolean
  onSignOut: () => void
  onLinkClick?: () => void
  variant?: 'desktop' | 'mobile'
}

interface UserProfile {
  profile_picture_url: string | null
  username: string | null
  customer?: {
    name: string
  } | null
}

export default function UserAuthSection({
  user,
  loading,
  onSignOut,
  onLinkClick,
  variant = 'desktop',
}: UserAuthSectionProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [showTooltip, setShowTooltip] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setProfileLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select(`
            profile_picture_url,
            username,
            customers (name)
          `)
          .eq('id', user.id)
          .single()

        if (data) {
          const typedData = data as {
            profile_picture_url: string | null
            username: string | null
            customers: Array<{ name: string }> | null
          }
          setProfile({
            profile_picture_url: typedData.profile_picture_url,
            username: typedData.username,
            customer: typedData.customers && typedData.customers.length > 0
              ? typedData.customers[0]
              : null,
          })
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [user, supabase])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading || profileLoading) {
    return variant === 'desktop' ? (
      <LoadingSpinner size="md" />
    ) : (
      <div className="px-4 py-3">
        <div 
          className="h-6 w-32 animate-pulse rounded"
          style={{ backgroundColor: 'var(--theme-secondary)' }}
        />
      </div>
    )
  }

  if (user) {
    const displayName = profile?.customer?.name || user.email || 'User'
    const profilePicture = profile?.profile_picture_url

    if (variant === 'desktop') {
      return (
        <div className="flex items-center space-x-4">
          <Link
            href={profile?.username ? `/profile/${profile.username}` : '/profile'}
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {profilePicture ? (
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 cursor-pointer transition-transform hover:scale-110" style={{ borderColor: 'var(--theme-primary)' }}>
                <Image
                  src={profilePicture}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 cursor-pointer transition-transform hover:scale-110"
                style={{
                  backgroundColor: 'var(--theme-primary)',
                  color: 'white',
                  borderColor: 'var(--theme-primary)',
                }}
              >
                {getInitials(displayName)}
              </div>
            )}
            {showTooltip && (
              <div
                className="absolute right-0 top-full mt-2 px-3 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap"
                style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-secondary)' }}
              >
                <p className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                  {displayName}
                </p>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            fullWidth={false}
          >
            Sign Out
          </Button>
        </div>
      )
    }

    return (
      <div className="px-4 space-y-3">
        <div className="flex items-center space-x-3 pb-3 border-b" style={{ borderColor: 'var(--theme-secondary)' }}>
          <Link href={profile?.username ? `/profile/${profile.username}` : '/profile'} onClick={onLinkClick}>
            {profilePicture ? (
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2" style={{ borderColor: 'var(--theme-primary)' }}>
                <Image
                  src={profilePicture}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold border-2"
                style={{
                  backgroundColor: 'var(--theme-primary)',
                  color: 'white',
                  borderColor: 'var(--theme-primary)',
                }}
              >
                {getInitials(displayName)}
              </div>
            )}
          </Link>
          <div className="flex flex-col flex-1 min-w-0">
            <span 
              className="text-sm font-medium mb-1 truncate"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
              Signed in as
            </span>
            <Link href={profile?.username ? `/profile/${profile.username}` : '/profile'} onClick={onLinkClick}>
              <span 
                className="text-base font-semibold break-all hover:underline"
                style={{ color: 'var(--theme-text)' }}
              >
                {displayName}
              </span>
            </Link>
          </div>
        </div>
        <Button onClick={onSignOut} className="w-full">
          Sign Out
        </Button>
      </div>
    )
  }

  if (variant === 'desktop') {
    return (
      <div className="flex items-center space-x-4">
        <Link href="/auth/signin">
          <Button variant="ghost" size="sm" fullWidth={false}>
            Sign In
          </Button>
        </Link>
        <Link href="/auth/signup">
          <Button size="sm" fullWidth={false}>Sign Up</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="px-4 space-y-3">
      <Link href="/auth/signin" onClick={onLinkClick} className="block">
        <Button variant="ghost" className="w-full">Sign In</Button>
      </Link>
      <Link href="/auth/signup" onClick={onLinkClick} className="block">
        <Button className="w-full">Sign Up</Button>
      </Link>
    </div>
  )
}

