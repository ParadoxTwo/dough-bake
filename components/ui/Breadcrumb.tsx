import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={`mb-8 ${className}`}>
      <div className="flex items-center space-x-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            {index > 0 && (
              <span style={{ color: 'var(--theme-text-secondary)' }}>/</span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:opacity-70 transition-opacity"
                style={{ color: 'var(--theme-accent)' }}
              >
                {item.label}
              </Link>
            ) : (
              <span style={{ color: 'var(--theme-text-secondary)' }}>
                {item.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </nav>
  )
}

