import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export default function Button({ 
  children, 
  loading = false, 
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  disabled,
  className = '',
  ...props 
}: ButtonProps) {
  const isDisabled = disabled || loading

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 font-medium',
    md: 'px-4 py-2 font-medium',
    lg: 'px-8 py-3 text-lg font-medium'
  }
  
  const widthClass = fullWidth ? 'w-full' : ''
  
  const textColorClass = variant === 'outline' || variant === 'ghost' ? '' : 'text-white'

  const getButtonStyles = () => {
    if (isDisabled) {
      return { backgroundColor: 'var(--theme-secondary)' }
    }
    
    if (variant === 'outline') {
      return {
        backgroundColor: 'transparent',
        color: 'var(--theme-accent)',
        border: '2px solid var(--theme-accent)'
      }
    }
    
    if (variant === 'ghost') {
      return {
        backgroundColor: 'transparent',
        color: 'var(--theme-text-secondary)',
        border: '1px solid var(--theme-secondary)'
      }
    }
    
    if (variant === 'secondary') {
      return { 
        backgroundColor: 'var(--theme-secondary)',
        color: 'var(--theme-text)'
      }
    }
    
    return { backgroundColor: 'var(--theme-accent)' }
  }

  return (
    <button
      disabled={isDisabled}
      className={`${widthClass} ${sizeClasses[size]} rounded-md hover:opacity-90 transition-opacity ${textColorClass} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={getButtonStyles()}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  )
}

