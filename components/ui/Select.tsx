import React, { useId, type CSSProperties } from 'react'

export const selectBaseClasses =
  'w-full px-4 py-3 pr-10 rounded-lg outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent transition-all appearance-none'

export const selectBaseStyle = (error?: string): CSSProperties => ({
  border: `1px solid ${error ? 'rgba(239, 68, 68, 0.5)' : 'var(--theme-secondary)'}`,
  backgroundColor: 'var(--theme-background)',
  color: 'var(--theme-text)',
})

interface Option {
  value: string
  label: string
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  options: Option[] | { value: string; label: string }[]
  children?: never // Prevent direct children, use options prop instead
}

/**
 * Reusable select component with theme styling
 */
export default function Select({ 
  label, 
  error, 
  id, 
  className = '', 
  options,
  ...props 
}: SelectProps) {
  // Use React's useId hook for stable IDs that match between server and client
  const generatedId = useId()
  // Prefer provided id, then label-based id, then name-based id, then generated id
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : (props.name ? `select-${props.name}` : generatedId))

  return (
    <div>
      {label && (
        <label 
          htmlFor={selectId}
          className="block text-sm font-medium mb-2"
          style={{ color: 'var(--theme-text)' }}
        >
          {label}
        </label>
      )}
      <div className="select-arrow">
        <select
          id={selectId}
          className={`${selectBaseClasses} ${className}`}
          style={selectBaseStyle(error)}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="mt-1 text-sm" style={{ color: '#dc2626' }}>
          {error}
        </p>
      )}
    </div>
  )
}
