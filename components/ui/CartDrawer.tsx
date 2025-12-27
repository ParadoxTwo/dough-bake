'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import CartContent from './CartContent'
import ThemedText from './ThemedText'

interface CartDrawerProps {
  isHovered: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
}

const NAVBAR_HEIGHT = 64 // 4rem = 64px (h-16)

export default function CartDrawer({ isHovered, onMouseEnter, onMouseLeave }: CartDrawerProps) {
  const pathname = usePathname()
  const drawerRef = useRef<HTMLDivElement>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [windowHeight, setWindowHeight] = useState(0)

  // Don't show drawer on mobile or when on cart page
  const shouldShow = isDesktop && pathname !== '/cart'

  useEffect(() => {
    // Check if we're on desktop (sm breakpoint and above)
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 640) // sm breakpoint in Tailwind
      setWindowHeight(window.innerHeight)
    }

    checkDesktop()
    window.addEventListener('resize', checkDesktop)

    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  useEffect(() => {
    // Track scroll position
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    // Set initial scroll position
    setScrollY(window.scrollY)

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!shouldShow) {
    return null
  }

  // Calculate top position and height based on scroll - smooth interpolation
  // Gradually transition from NAVBAR_HEIGHT to 0 as scroll increases
  // Clamp scrollY between 0 and NAVBAR_HEIGHT for smooth transition
  const clampedScroll = Math.max(0, Math.min(scrollY, NAVBAR_HEIGHT))
  const topPosition = NAVBAR_HEIGHT - clampedScroll
  const maxHeight = windowHeight > 0 ? windowHeight - topPosition : 0

  return (
    <div
      ref={drawerRef}
      className="fixed right-0 w-96 z-50 overflow-hidden"
      style={{
        top: `${topPosition}px`,
        height: isHovered ? `${maxHeight}px` : '0px',
        transition: 'height 300ms ease-out, top 200ms ease-out',
        backgroundColor: 'var(--theme-surface)',
        borderLeft: '1px solid var(--theme-secondary)',
        boxShadow: '-2px 4px 6px rgba(0, 0, 0, 0.1)'
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="h-full flex flex-col">
        <div 
          className="px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: 'var(--theme-secondary)' }}
        >
          <ThemedText as="h2" size="lg" weight="bold">
            Shopping Cart
          </ThemedText>
        </div>
        <div className="flex-1 min-h-0">
          <CartContent 
            layout="drawer"
            className="h-full"
          />
        </div>
      </div>
    </div>
  )
}

