 'use client'

import { useState, useEffect, useRef, type InputHTMLAttributes } from 'react'
import { inputBaseClasses, inputBaseStyle } from '../ui/Input'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
}

export default function PasswordInput({ 
  label, 
  error, 
  id, 
  value, 
  onChange, 
  className = '', 
  ...props 
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showNewChar, setShowNewChar] = useState(false)
  const inputId = id || `password-${label.toLowerCase().replace(/\s+/g, '-')}`
  const previousLengthRef = useRef(typeof value === 'string' ? value.length : 0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const currentLength = typeof value === 'string' ? value.length : 0
    
    if (currentLength > previousLengthRef.current) {
      setShowNewChar(true)
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      if (!showPassword) {
        timeoutRef.current = setTimeout(() => {
          setShowNewChar(false)
        }, 600)
      }
    } else if (currentLength < previousLengthRef.current) {
      if (!showPassword) {
        setShowNewChar(false)
      }
    }
    
    previousLengthRef.current = currentLength
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, showPassword])

  const togglePassword = () => {
    const newShowPassword = !showPassword
    setShowPassword(newShowPassword)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    if (newShowPassword) {
      setShowNewChar(true)
    } else {
      setShowNewChar(false)
    }
  }

  const shouldShow = showPassword || showNewChar

  return (
    <div>
      <label 
        htmlFor={inputId}
        className="block text-sm font-medium mb-2"
        style={{ color: 'var(--theme-text)' }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={shouldShow ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className={`${inputBaseClasses} pr-12 ${className}`}
          style={inputBaseStyle(error)}
          {...props}
        />
        <button
          type="button"
          onClick={togglePassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--theme-text-secondary)' }}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          )}
        </button>
      </div>
      {error && (
        <p className="mt-1 text-sm" style={{ color: '#dc2626' }}>
          {error}
        </p>
      )}
    </div>
  )
}

