interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Reusable loading spinner component
 */
export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div 
      className={`${sizeClasses[size]} animate-pulse rounded-full ${className}`}
      style={{ backgroundColor: 'var(--theme-secondary)' }}
    />
  )
}

