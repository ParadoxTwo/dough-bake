import Link from 'next/link'
import { NavItem } from './navItems'

interface DesktopNavLinkProps {
  item: NavItem
  isActive: boolean
}

/**
 * Desktop navigation link component
 */
export default function DesktopNavLink({ item, isActive }: DesktopNavLinkProps) {
  return (
    <Link
      href={item.href}
      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
        isActive
          ? 'text-theme-text'
          : 'border-transparent hover:opacity-70'
      }`}
      style={{
        borderBottomColor: isActive ? 'var(--theme-accent)' : 'transparent',
        color: isActive ? 'var(--theme-text)' : 'var(--theme-text-secondary)',
      }}
    >
      {item.label}
    </Link>
  )
}

