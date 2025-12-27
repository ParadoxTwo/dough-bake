import { User } from '@supabase/supabase-js'
import { navItems, NavItem } from './navItems'
import MobileNavLink from './MobileNavLink'
import UserAuthSection from './UserAuthSection'
import LoadingSpinner from '../ui/LoadingSpinner'

interface MobileMenuProps {
  isOpen: boolean
  pathname: string
  user: User | null
  isAdmin: boolean
  loading: boolean
  onSignOut: () => void
  onLinkClick: () => void
}

/**
 * Mobile menu component
 * Handles navigation links and user authentication section
 */
export default function MobileMenu({
  isOpen,
  pathname,
  user,
  isAdmin,
  loading,
  onSignOut,
  onLinkClick,
}: MobileMenuProps) {
  const isItemActive = (item: NavItem): boolean => {
    if (item.matchExact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  const shouldShowItem = (item: NavItem): boolean => {
    if (item.requiresAuth && !user) return false
    if (item.requiresAdmin && !isAdmin) return false
    return true
  }

  const visibleItems = navItems.filter(shouldShowItem)

  return (
    <>
      {/* Backdrop - starts below navbar */}
      <div
        className={`sm:hidden fixed top-16 left-0 right-0 bottom-0 bg-black z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onLinkClick}
        aria-hidden="true"
      />
      {/* Full-screen menu - starts below navbar */}
      <div
        className={`sm:hidden fixed top-16 left-0 right-0 bottom-0 z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : '-translate-y-full pointer-events-none'
        }`}
        style={{
          backgroundColor: 'var(--theme-surface)',
        }}
        aria-hidden={!isOpen}
      >
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {/* Navigation Links */}
          <div className="flex flex-col space-y-1 mb-6">
            {visibleItems.map((item) => (
              <MobileNavLink
                key={item.href}
                item={item}
                isActive={isItemActive(item)}
                onClick={onLinkClick}
              />
            ))}
          </div>

          {/* Divider */}
          {(user || !loading) && (
            <div className="border-t my-6" style={{ borderColor: 'var(--theme-secondary)' }}></div>
          )}

          {/* User Account Section */}
          <UserAuthSection
            user={user}
            loading={loading}
            onSignOut={onSignOut}
            onLinkClick={onLinkClick}
            variant="mobile"
          />
        </div>
      </div>
    </>
  )
}

