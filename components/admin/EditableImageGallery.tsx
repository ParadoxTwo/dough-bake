'use client'

import { useState } from 'react'
import type { ProductImage } from '@/lib/types/variant'

interface EditableImageGalleryProps {
  images: ProductImage[]
  productId: string
  variantId?: string | null
  onImageUpdate: () => Promise<void>
  canEdit?: boolean
}

export default function EditableImageGallery({
  images,
  productId,
  variantId = null,
  onImageUpdate,
  canEdit = false,
}: EditableImageGalleryProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)

  if (!canEdit) {
    // Regular display mode
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative rounded-lg overflow-hidden"
            style={{ backgroundColor: 'var(--theme-secondary)' }}
          >
            <img
              src={image.medium_url}
              alt={image.alt_text || `Image ${index + 1}`}
              className="w-full h-48 object-cover"
            />
          </div>
        ))}
      </div>
    )
  }

  const handleEdit = async (imageId: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setUploading(true)
      try {
        // First delete the old image
        await fetch(`/api/images/delete?imageId=${imageId}`, { method: 'DELETE' })
        
        // Then upload the new one
        const formData = new FormData()
        formData.append('file', file)
        formData.append('productId', productId)
        if (variantId) formData.append('variantId', variantId)
        formData.append('displayOrder', images.findIndex(img => img.id === imageId).toString())
        
        await fetch('/api/images/upload', {
          method: 'POST',
          body: formData,
        })
        
        await onImageUpdate()
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
        
        await onImageUpdate()
      } catch (error) {
        console.error('Failed to add images:', error)
        alert('Failed to add images. Please try again.')
      } finally {
        setUploading(false)
      }
    }
    input.click()
  }

  const handleRemove = async (imageId: string) => {
    if (images.length === 1) {
      alert('Cannot remove the last image. You can edit it or add a new one first.')
      return
    }

    if (!confirm('Are you sure you want to remove this image?')) {
      return
    }

    setUploading(true)
    try {
      await fetch(`/api/images/delete?imageId=${imageId}`, { method: 'DELETE' })
      await onImageUpdate()
    } catch (error) {
      console.error('Failed to remove image:', error)
      alert('Failed to remove image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative group rounded-lg overflow-hidden"
            style={{ backgroundColor: 'var(--theme-secondary)' }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <img
              src={image.medium_url}
              alt={image.alt_text || `Image ${index + 1}`}
              className="w-full h-48 object-cover"
            />
            
            {hoveredIndex === index && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2">
                <button
                  onClick={() => handleEdit(image.id)}
                  disabled={uploading}
                  className="p-2 rounded-full bg-white text-gray-800 hover:bg-gray-100 transition-colors disabled:opacity-50"
                  title="Edit image"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                {images.length > 1 && (
                  <button
                    onClick={() => handleRemove(image.id)}
                    disabled={uploading}
                    className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                    title="Remove image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        
        {/* Add new image button */}
        <button
          onClick={handleAdd}
          disabled={uploading}
          className="flex items-center justify-center rounded-lg border-2 border-dashed hover:opacity-80 transition-opacity disabled:opacity-50"
          style={{
            borderColor: 'var(--theme-secondary)',
            backgroundColor: 'var(--theme-background)',
            minHeight: '12rem',
          }}
          title="Add new image"
        >
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 mb-2"
              style={{ color: 'var(--theme-text-secondary)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
              Add Image
            </p>
          </div>
        </button>
      </div>

      {uploading && (
        <div className="text-center py-4">
          <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
            Processing images...
          </p>
        </div>
      )}
    </div>
  )
}

