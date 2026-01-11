'use client'

import { useState, useRef, type ChangeEvent } from 'react'
import Button from '@/components/ui/Button'

interface ImageUploadProps {
  images: File[]
  onImagesChange: (images: File[]) => void
  maxImages?: number
  label?: string
  error?: string
}

export default function ImageUpload({
  images,
  onImagesChange,
  maxImages = 10,
  label = 'Images',
  error,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = useState<string[]>([])

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (images.length + imageFiles.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`)
      return
    }

    const newImages = [...images, ...imageFiles]
    onImagesChange(newImages)

    // Generate previews
    const newPreviews = imageFiles.map(file => URL.createObjectURL(file))
    setPreviews(prev => [...prev, ...newPreviews])
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)

    // Revoke preview URL and remove from state
    URL.revokeObjectURL(previews[index])
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const inputId = `image-upload-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-text)' }}>
        {label}
      </label>
      
      <div className="space-y-4">
        <div
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:opacity-80 transition-opacity"
          style={{
            borderColor: error ? '#dc2626' : 'var(--theme-secondary)',
            backgroundColor: 'var(--theme-background)',
          }}
          onClick={handleClick}
        >
          <input
            id={inputId}
            name="images"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            aria-label={label}
          />
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12"
              style={{ color: 'var(--theme-text-secondary)' }}
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p style={{ color: 'var(--theme-text-secondary)' }}>
              Click to upload images or drag and drop
            </p>
            <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
              {images.length} / {maxImages} images
            </p>
          </div>
        </div>

        {error && (
          <p className="text-sm" style={{ color: '#dc2626' }}>
            {error}
          </p>
        )}

        {previews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div
                key={index}
                className="relative group rounded-lg overflow-hidden"
                style={{ backgroundColor: 'var(--theme-secondary)' }}
              >
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  type="button"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50 text-white text-xs">
                  {images[index]?.name || 'Image'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

