interface LoadingSkeletonProps {
  variant?: 'product' | 'default'
  className?: string
}

export default function LoadingSkeleton({ 
  variant = 'default',
  className = ''
}: LoadingSkeletonProps) {
  if (variant === 'product') {
    return (
      <div className={`animate-pulse ${className}`}>
        <div 
          className="h-96 lg:h-[500px] rounded-lg mb-8"
          style={{ backgroundColor: 'var(--theme-secondary)' }}
        ></div>
        <div 
          className="h-8 rounded w-1/3 mb-4"
          style={{ backgroundColor: 'var(--theme-secondary)' }}
        ></div>
        <div 
          className="h-4 rounded w-2/3 mb-8"
          style={{ backgroundColor: 'var(--theme-secondary)' }}
        ></div>
      </div>
    )
  }

  return (
    <div className={`animate-pulse ${className}`}>
      <div 
        className="h-8 rounded w-1/4 mb-8"
        style={{ backgroundColor: 'var(--theme-secondary)' }}
      ></div>
      <div className="space-y-4">
        <div 
          className="h-12 rounded"
          style={{ backgroundColor: 'var(--theme-secondary)' }}
        ></div>
        <div 
          className="h-12 rounded"
          style={{ backgroundColor: 'var(--theme-secondary)' }}
        ></div>
      </div>
    </div>
  )
}

