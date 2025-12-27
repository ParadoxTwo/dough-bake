import Link from 'next/link'
import { NavItem } from './navItems'

interface MobileNavLinkProps {
  item: NavItem
  isActive: boolean
  onClick?: () => void
}

/**
 * Mobile navigation link component
 */
export default function MobileNavLink({ item, isActive, onClick }: MobileNavLinkProps) {
  return (
    <Link
      href={item.href}
      className={`px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 ease-out ${
        isActive 
          ? '' 
          : 'hover:bg-opacity-10'
      }`}
      style={{
        background: isActive 
          ? `linear-gradient(to right, var(--theme-accent), var(--theme-primary))`
          : 'transparent',
        color: isActive ? '#ffffff' : 'var(--theme-text-secondary)',
        boxShadow: isActive 
          ? '0 2px 8px rgba(0, 0, 0, 0.08)' 
          : 'none',
      }}
      onClick={onClick}
    >
      {item.label}
    </Link>
  )
}

