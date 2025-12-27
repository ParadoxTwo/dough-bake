interface EmptyStateProps {
  message: string
  className?: string
}

export default function EmptyState({ 
  message, 
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <p 
        className="text-lg"
        style={{ color: 'var(--theme-text-secondary)' }}
      >
        {message}
      </p>
    </div>
  )
}

