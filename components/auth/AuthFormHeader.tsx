import Link from 'next/link'
import ThemedText from '../ui/ThemedText'

interface AuthFormHeaderProps {
  title: string
  subtitle: string
  linkText: string
  linkHref: string
}

/**
 * Header component for auth forms
 */
export default function AuthFormHeader({ title, subtitle, linkText, linkHref }: AuthFormHeaderProps) {
  return (
    <div>
      <ThemedText as="h2" size="3xl" weight="bold" className="mt-6 text-center">
        {title}
      </ThemedText>
      <ThemedText as="p" size="sm" tone="secondary" className="mt-2 text-center">
        {subtitle}{" "}
        <Link
          href={linkHref}
          className="font-medium hover:opacity-70 transition-opacity"
          style={{ color: 'var(--theme-accent)' }}
        >
          {linkText}
        </Link>
      </ThemedText>
    </div>
  )
}

