'use client'

import { useState, useEffect, useRef } from 'react'
import Input from '@/components/ui/Input'

interface InlineEditableProps {
  value: string | number
  onSave: (value: string | number) => Promise<void>
  handleClick?: () => void
  type?: 'text' | 'number' | 'textarea'
  label?: string
  className?: string
  multiline?: boolean
  rows?: number
  disabled?: boolean
  /**
   * Optional callback to notify parent when editing state changes.
   * Useful when parent needs to show/hide extra actions (e.g. delete).
   */
  onEditingChange?: (isEditing: boolean) => void
  /**
   * Optional delete handler. When provided, a destructive Delete button
   * will be shown next to Cancel while editing.
   */
  onDelete?: () => Promise<void> | void
  /**
   * Optional formatter for display when not editing. Useful for showing
   * currency or other formatted values while keeping the raw value editable.
   */
  displayFormatter?: (value: string | number) => React.ReactNode
}

export default function InlineEditable({
  value,
  onSave,
  type = 'text',
  label,
  className = '',
  multiline = false,
  rows = 3,
  disabled = false,
  onEditingChange,
  onDelete,
  displayFormatter,
  handleClick
}: InlineEditableProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value.toString())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (type === 'text' || multiline) {
        inputRef.current.select()
      }
    }
  }, [isEditing, type, multiline])

  const handleDoubleClick = () => {
    if (disabled) return
    setIsEditing(true)
    onEditingChange?.(true)
    setEditValue(value.toString())
    setError(null)
  }

  const handleSave = async () => {
    if (editValue === value.toString()) {
      setIsEditing(false)
      onEditingChange?.(false)
      return
    }

    setSaving(true)
    setError(null)

    try {
      const finalValue = type === 'number' ? parseFloat(editValue) : editValue
      await onSave(finalValue)
      setIsEditing(false)
      onEditingChange?.(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value.toString())
    setIsEditing(false)
    onEditingChange?.(false)
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className={`relative ${className}`}>
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={rows}
            className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-[var(--theme-accent)] transition-all resize-y"
            style={{
              border: `1px solid ${error ? 'rgba(239, 68, 68, 0.5)' : 'var(--theme-accent)'}`,
              backgroundColor: 'var(--theme-background)',
              color: 'var(--theme-text)',
            }}
            disabled={saving}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-[var(--theme-accent)] transition-all"
            style={{
              border: `1px solid ${error ? 'rgba(239, 68, 68, 0.5)' : 'var(--theme-accent)'}`,
              backgroundColor: 'var(--theme-background)',
              color: 'var(--theme-text)',
            }}
            disabled={saving}
          />
        )}
        
        {error && (
          <p className="mt-1 text-xs" style={{ color: '#dc2626' }}>
            {error}
          </p>
        )}

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1 text-xs rounded-md transition-opacity disabled:opacity-50"
            style={{ backgroundColor: 'var(--theme-accent)', color: 'white' }}
          >
            {saving ? 'Saving...' : '✓ Save'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="px-3 py-1 text-xs rounded-md transition-opacity disabled:opacity-50"
            style={{ 
              backgroundColor: 'var(--theme-secondary)', 
              color: 'var(--theme-text)' 
            }}
          >
            ✕ Cancel
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation()
                if (saving) return
                await onDelete()
              }}
              className="ml-1 px-3 py-1 text-xs rounded-md transition-opacity disabled:opacity-50"
              style={{
                backgroundColor: '#b91c1c', // red-700
                color: 'white',
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}
      className={`cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      style={{
        color: disabled ? 'var(--theme-text-secondary)' : 'var(--theme-text)',
      }}
      title={disabled ? undefined : 'Double-click to edit'}
    >
      {label && (
        <span className="text-sm opacity-70 mr-2">{label}:</span>
      )}
      {displayFormatter ? displayFormatter(value) : value}
    </div>
  )
}

