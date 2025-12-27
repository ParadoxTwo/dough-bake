import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import LoadingSpinner from '../ui/LoadingSpinner'
import Button from '../ui/Button'

interface UserAuthSectionProps {
  user: User | null
  loading: boolean
  onSignOut: () => void
  onLinkClick?: () => void
  variant?: 'desktop' | 'mobile'
}

export default function UserAuthSection({
  user,
  loading,
  onSignOut,
  onLinkClick,
  variant = 'desktop',
}: UserAuthSectionProps) {
  if (loading) {
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
    if (variant === 'desktop') {
      return (
        <div className="flex items-center space-x-4">
          <span 
            className="text-sm"
            style={{ color: 'var(--theme-text)' }}
          >
            {user.email}
          </span>
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
        <div className="flex flex-col">
          <span 
            className="text-sm font-medium mb-1"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            Signed in as
          </span>
          <span 
            className="text-base font-semibold break-all"
            style={{ color: 'var(--theme-text)' }}
          >
            {user.email}
          </span>
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

