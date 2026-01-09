'use client'

import { useEffect } from 'react'

interface ImageModalProps {
  imageUrl: string
  alt: string
  isOpen: boolean
  onClose: () => void
}

export default function ImageModal({
  imageUrl,
  alt,
  isOpen,
  onClose,
}: ImageModalProps) {
  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--theme-surface)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-2 z-20 p-2 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 shadow-lg transition-all"
          aria-label="Close image"
        >
          <svg className="w-6 h-6" style={{ color: 'var(--theme-text)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image */}
        <img
          src={imageUrl}
          alt={alt}
          className="max-w-full w-auto max-h-full object-contain"
        />
      </div>
    </div>
  )
}
