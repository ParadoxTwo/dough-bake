'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import Logo from './Logo'
import CartIcon from './ui/CartIcon'
import CartDrawer from './ui/CartDrawer'
import DesktopNavLink from './nav/DesktopNavLink'
import MobileMenuButton from './nav/MobileMenuButton'
import MobileMenu from './nav/MobileMenu'
import UserAuthSection from './nav/UserAuthSection'
import { navItems, NavItem } from './nav/navItems'

export default function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartDrawerHovered, setCartDrawerHovered] = useState(false)
  const cartDrawerCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        // Get user from client-side auth (for session management)
        const { data: { user: authUser } } = await supabase.auth.getUser()
        setUser(authUser || null)

        if (authUser) {
          // Fetch profile directly from Supabase instead of server action to avoid routing issues
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authUser.id)
            .single()

          const typedProfile = profile as { role: 'customer' | 'admin' } | null
          setIsAdmin(typedProfile?.role === 'admin' || false)
        } else {
          setIsAdmin(false)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        try {
          // Fetch profile directly from Supabase
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

          const typedProfile = profile as { role: 'customer' | 'admin' } | null
          setIsAdmin(typedProfile?.role === 'admin' || false)
        } catch (error) {
          console.error('Error fetching profile on auth change:', error)
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setMobileMenuOpen(false)
    window.location.href = '/'
  }

  const handleMobileLinkClick = () => {
    setMobileMenuOpen(false)
  }

  const handleCartDrawerEnter = () => {
    // Clear any pending close timeout
    if (cartDrawerCloseTimeoutRef.current) {
      clearTimeout(cartDrawerCloseTimeoutRef.current)
      cartDrawerCloseTimeoutRef.current = null
    }
    setCartDrawerHovered(true)
  }

  const handleCartDrawerLeave = () => {
    // Set a timeout to close the drawer after 500ms
    if (cartDrawerCloseTimeoutRef.current) {
      clearTimeout(cartDrawerCloseTimeoutRef.current)
    }
    cartDrawerCloseTimeoutRef.current = setTimeout(() => {
      setCartDrawerHovered(false)
      cartDrawerCloseTimeoutRef.current = null
    }, 500)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (cartDrawerCloseTimeoutRef.current) {
        clearTimeout(cartDrawerCloseTimeoutRef.current)
      }
    }
  }, [])

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
      <nav 
        className={`bg-opacity-90 relative z-60 ${mobileMenuOpen ? '' : 'shadow-md backdrop-blur-sm'}`}
        style={{ 
          backgroundColor: 'var(--theme-surface)',
          borderBottom: '1px solid var(--theme-secondary)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link href="/" className="flex items-center">
                <Logo size={40} className="mr-2" />
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {visibleItems.map((item) => (
                  <DesktopNavLink
                    key={item.href}
                    item={item}
                    isActive={isItemActive(item)}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <div
                onMouseEnter={handleCartDrawerEnter}
                onMouseLeave={handleCartDrawerLeave}
              >
                <CartIcon 
                  onClick={handleMobileLinkClick}
                  onMouseEnter={handleCartDrawerEnter}
                  onMouseLeave={handleCartDrawerLeave}
                />
              </div>
              {/* Desktop user/auth section */}
              <div className="hidden sm:flex items-center ml-4">
                <UserAuthSection
                  user={user}
                  loading={loading}
                  onSignOut={handleSignOut}
                  variant="desktop"
                />
              </div>
              <MobileMenuButton
                isOpen={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              />
            </div>
          </div>
        </div>
      </nav>
      <MobileMenu
        isOpen={mobileMenuOpen}
        pathname={pathname}
        user={user}
        isAdmin={isAdmin}
        loading={loading}
        onSignOut={handleSignOut}
        onLinkClick={handleMobileLinkClick}
      />
      <CartDrawer
        isHovered={cartDrawerHovered}
        onMouseEnter={handleCartDrawerEnter}
        onMouseLeave={handleCartDrawerLeave}
      />
    </>
  )
}
