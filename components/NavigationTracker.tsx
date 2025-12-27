'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { storeNavigationHistory } from '@/lib/utils/navigation'

/**
 * Client component that tracks navigation history
 * Should be placed in the root layout
 */
export default function NavigationTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Store the current pathname in navigation history
    if (pathname) {
      storeNavigationHistory(pathname)
    }
  }, [pathname])

  return null
}

