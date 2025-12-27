import React, { type CSSProperties } from 'react'

export const inputBaseClasses =
  'w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent transition-all'

export const inputBaseStyle = (error?: string): CSSProperties => ({
  border: `1px solid ${error ? 'rgba(239, 68, 68, 0.5)' : 'var(--theme-secondary)'}`,
  backgroundColor: 'var(--theme-background)',
  color: 'var(--theme-text)',
})

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string
  error?: string
  multiline?: boolean
  rows?: number
}

/**
 * Reusable text input component with theme styling
 */
export default function Input({ 
  label, 
  error, 
  id, 
  className = '', 
  multiline = false,
  rows = 4,
  ...props 
}: InputProps) {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div>
      <label 
        htmlFor={inputId}
        className="block text-sm font-medium mb-2"
        style={{ color: 'var(--theme-text)' }}
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          id={inputId}
          rows={rows}
          className={`${inputBaseClasses} ${className} resize-y`}
          style={inputBaseStyle(error)}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={inputId}
          className={`${inputBaseClasses} ${className}`}
          style={inputBaseStyle(error)}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error && (
        <p className="mt-1 text-sm" style={{ color: '#dc2626' }}>
          {error}
        </p>
      )}
    </div>
  )
}

