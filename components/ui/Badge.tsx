import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'tertiary'
  className?: string
}

/**
 * Reusable badge component with theme styling
 */
export default function Badge({ 
  children, 
  variant = 'default',
  className = '' 
}: BadgeProps) {
  const baseStyles = 'inline-block text-sm px-2 py-1 rounded font-medium'
  
  const variantStyles = variant === 'tertiary' 
    ? { backgroundColor: 'var(--theme-tertiary)', color: 'white' }
    : { backgroundColor: 'var(--theme-secondary)', color: 'var(--theme-text-secondary)' }

  return (
    <span 
      className={`${baseStyles} ${className}`}
      style={variantStyles}
    >
      {children}
    </span>
  )
}

