'use client'

import { useState } from 'react'
import { Product } from '@/lib/types/product'
import type { ProductImage as ProductImageType } from '@/lib/types/variant'
import ImageGalleryModal from './ImageGalleryModal'

interface ProductImageProps {
  product: Product
  images?: ProductImageType[]
  size?: 'default' | 'large'
  className?: string
  isAdmin?: boolean
  productId?: string
  variantId?: string | null
  onImageUpdate?: () => Promise<void>
}

export default function ProductImage({ 
  product, 
  images = [],
  size = 'default',
  className = '',
  isAdmin = false,
  productId,
  variantId = null,
  onImageUpdate,
}: ProductImageProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const height = size === 'large' ? 'h-96 lg:h-[500px]' : 'h-48'

  const currentImage = images.length > 0 ? images[currentIndex] : null

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
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

  // Fallback when no images
  if (images.length === 0) {
    return (
      <div 
        className={`relative rounded-lg ${height} flex items-center justify-center ${className}`}
        style={{
          background: `radial-gradient(circle, var(--theme-secondary), var(--theme-primary))`,
        }}
        onMouseEnter={() => isAdmin && setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <span className="text-9xl">🥖</span>
        
        {isAdmin && showControls && (
          <div className="absolute top-4 right-4 flex gap-2 z-10">
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
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div 
        className={`relative rounded-lg ${height} overflow-hidden cursor-pointer ${className}`}
        onMouseEnter={() => isAdmin && setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onClick={() => images.length > 0 && setIsGalleryOpen(true)}
      >
        {/* Main image */}
        {currentImage && (
          <img
            src={currentImage.large_url}
            alt={currentImage.alt_text || product.name}
            className="w-full h-full object-cover"
          />
        )}

      {/* Admin controls in top-right */}
      {isAdmin && showControls && (
        <div className="absolute top-4 right-4 flex gap-2 z-10">
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

      {/* Carousel navigation */}
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 text-white transition-all"
            aria-label="Previous image"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 text-white transition-all"
            aria-label="Next image"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Image indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'w-8 bg-white' 
                    : 'w-2 bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
      </div>

      {/* Gallery Modal */}
      {images.length > 0 && (
        <ImageGalleryModal
          images={images}
          initialIndex={currentIndex}
          productName={product.name}
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          onIndexChange={(index) => setCurrentIndex(index)}
          isAdmin={isAdmin}
          productId={productId}
          variantId={variantId}
          onImageUpdate={async () => {
            if (onImageUpdate) {
              await onImageUpdate()
            }
            // Reset to first image after update
            setCurrentIndex(0)
          }}
        />
      )}
    </>
  )
}

