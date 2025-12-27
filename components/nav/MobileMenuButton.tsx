interface MobileMenuButtonProps {
  isOpen: boolean
  onClick: () => void
}

/**
 * Mobile menu toggle button
 */
export default function MobileMenuButton({ isOpen, onClick }: MobileMenuButtonProps) {
  return (
    <button
      type="button"
      className="sm:hidden ml-4 p-2 rounded-md hover:opacity-70 transition-opacity"
      style={{ color: 'var(--theme-text-secondary)' }}
      onClick={onClick}
      aria-label="Toggle menu"
      aria-expanded={isOpen}
    >
      {isOpen ? (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      )}
    </button>
  )
}

