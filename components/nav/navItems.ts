/**
 * Navigation items configuration
 * Add new navigation items here
 */
export interface NavItem {
  href: string
  label: string
  requiresAuth?: boolean
  requiresAdmin?: boolean
  matchExact?: boolean // If true, matches exact path; if false, matches pathname.startsWith
}

export const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    matchExact: true,
  },
  {
    href: '/menu',
    label: 'Menu',
    matchExact: true,
  },
  {
    href: '/admin',
    label: 'Admin',
    requiresAuth: true,
    requiresAdmin: true,
    matchExact: false, // Matches /admin and all sub-routes
  },
]

