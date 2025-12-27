'use client'

import { useState, useEffect } from 'react'
import type { ProductImage as ProductImageType } from '@/lib/types/variant'

interface ImageGalleryModalProps {
  images: ProductImageType[]
  initialIndex: number
  productName: string
  isOpen: boolean
  onClose: () => void
  onIndexChange?: (index: number) => void
  isAdmin?: boolean
  productId?: string
  variantId?: string | null
  onImageUpdate?: () => Promise<void>
}

export default function ImageGalleryModal({
  images,
  initialIndex,
  productName,
  isOpen,
  onClose,
  onIndexChange,
  isAdmin = false,
  productId,
  variantId = null,
  onImageUpdate,
}: ImageGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [showControls, setShowControls] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Update current index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, images.length, onClose])

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

  if (!isOpen || images.length === 0) return null

  const currentImage = images[currentIndex]

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index)
  }

  const handleEdit = async () => {
    if (!currentImage || !productId) return
    
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setUploading(true)
      try {
        await fetch(`/api/images/delete?imageId=${currentImage.id}`, { method: 'DELETE' })
        
        const formData = new FormData()
        formData.append('file', file)
        formData.append('productId', productId)
        if (variantId) formData.append('variantId', variantId)
        formData.append('displayOrder', currentIndex.toString())
        
        await fetch('/api/images/upload', {
          method: 'POST',
          body: formData,
        })
        
        if (onImageUpdate) {
          await onImageUpdate()
        }
      } catch (error) {
        console.error('Failed to update image:', error)
        alert('Failed to update image. Please try again.')
      } finally {
        setUploading(false)
      }
    }
    input.click()
  }

  const handleAdd = async () => {
    if (!productId) return
    
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      if (files.length === 0) return

      setUploading(true)
      try {
        for (let i = 0; i < files.length; i++) {
          const formData = new FormData()
          formData.append('file', files[i])
          formData.append('productId', productId)
          if (variantId) formData.append('variantId', variantId)
          formData.append('displayOrder', (images.length + i).toString())
          
          await fetch('/api/images/upload', {
            method: 'POST',
            body: formData,
          })
        }
        
        if (onImageUpdate) {
          await onImageUpdate()
        }
      } catch (error) {
        console.error('Failed to add images:', error)
        alert('Failed to add images. Please try again.')
      } finally {
        setUploading(false)
      }
    }
    input.click()
  }

  const handleRemove = async () => {
    if (!currentImage || !productId) return
    
    if (images.length === 1) {
      alert('Cannot remove the last image. You can edit it or add a new one first.')
      return
    }

    if (!confirm('Are you sure you want to remove this image?')) {
      return
    }

    setUploading(true)
    try {
      await fetch(`/api/images/delete?imageId=${currentImage.id}`, { method: 'DELETE' })
      
      // Adjust current index if needed
      if (currentIndex >= images.length - 1) {
        setCurrentIndex(Math.max(0, images.length - 2))
      }
      
      if (onImageUpdate) {
        await onImageUpdate()
      }
    } catch (error) {
      console.error('Failed to remove image:', error)
      alert('Failed to remove image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full h-full max-w-7xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button - always visible in top-right */}
        <button
          onClick={() => {
            if (onIndexChange) {
              onIndexChange(currentIndex)
            }
            onClose()
          }}
          className="absolute top-4 right-4 z-20 p-1 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 shadow-lg transition-all"
          aria-label="Close gallery"
        >
          <svg className="w-6 h-6" style={{ color: 'var(--theme-text)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Main image container */}
        <div
          className="flex-1 relative flex items-center justify-center mb-24"
          onMouseEnter={() => isAdmin && setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          {/* Main image */}
          <img
            src={currentImage.large_url}
            alt={currentImage.alt_text || `${productName} - Image ${currentIndex + 1}`}
            className="max-w-full w-auto max-h-full object-contain"
          />

          {/* Admin controls - appear on hover */}
          {isAdmin && showControls && (
            <div className="absolute top-8 right-24 flex gap-2 z-10">
              <button
                onClick={handleEdit}
                disabled={uploading}
                className="p-2 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 shadow-lg transition-all disabled:opacity-50"
                title="Edit image"
              >
                <svg className="w-5 h-5" style={{ color: 'var(--theme-text)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={handleAdd}
                disabled={uploading}
                className="p-2 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 shadow-lg transition-all disabled:opacity-50"
                title="Add image"
              >
                <svg className="w-5 h-5" style={{ color: 'var(--theme-text)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              {images.length > 1 && (
                <button
                  onClick={handleRemove}
                  disabled={uploading}
                  className="p-2 rounded-full bg-red-500 bg-opacity-90 hover:bg-opacity-100 text-white shadow-lg transition-all disabled:opacity-50"
                  title="Remove image"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black bg-opacity-50 text-white text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Navigation arrows */}
        {images.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 text-white transition-all z-10"
                aria-label="Previous image"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 text-white transition-all z-10"
                aria-label="Next image"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

        {/* Thumbnail strip at bottom */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4 py-2 bg-black bg-opacity-50 rounded-lg">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => handleThumbnailClick(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-white scale-110'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                aria-label={`View image ${index + 1}`}
              >
                <img
                  src={image.thumbnail_url}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

