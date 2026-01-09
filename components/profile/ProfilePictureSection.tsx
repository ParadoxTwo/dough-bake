'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Card from '@/components/ui/Card'
import ImageModal from '@/components/ui/ImageModal'

interface ProfilePictureSectionProps {
  profilePicture: string | null
  displayName: string
  email: string
  username: string | null
  isOwnProfile: boolean
  isAdmin: boolean
  isUploading: boolean
  sendingReset: boolean
  onPictureChange: (file: File) => Promise<void>
  onPictureDelete: () => Promise<void>
  onPasswordReset?: () => Promise<void>
}

export default function ProfilePictureSection({
  profilePicture,
  displayName,
  email,
  username,
  isOwnProfile,
  isAdmin,
  isUploading,
  sendingReset,
  onPictureChange,
  onPictureDelete,
  onPasswordReset,
}: ProfilePictureSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('File must be an image')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    await onPictureChange(file)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card className="lg:col-span-1">
      <div className="flex flex-col items-center p-6">
        <div className="relative mb-4">
          {profilePicture ? (
            <div 
              className="relative w-32 h-32 rounded-full overflow-hidden border-4 cursor-pointer transition-transform hover:scale-105" 
              style={{ borderColor: 'var(--theme-primary)' }}
              onClick={() => setIsModalOpen(true)}
            >
              <Image
                src={profilePicture}
                alt={displayName}
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
          ) : (
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold border-4"
              style={{
                backgroundColor: 'var(--theme-primary)',
                color: 'white',
                borderColor: 'var(--theme-primary)',
              }}
            >
              {getInitials(displayName)}
            </div>
          )}
          {isOwnProfile && (
            <div className="absolute bottom-0 right-0">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
                disabled={isUploading}
                className="p-2 rounded-full shadow-lg transition-transform hover:scale-110"
                style={{ backgroundColor: 'var(--theme-primary)', color: 'white' }}
                title="Change profile picture"
              >
                {isUploading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {profilePicture && (
          <ImageModal
            imageUrl={profilePicture}
            alt={`${displayName}'s profile picture`}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        )}

        <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--theme-text)' }}>
          {displayName}
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--theme-text-secondary)' }}>
          {email}
        </p>
        {username && (
          <p className="text-xs mb-4" style={{ color: 'var(--theme-text-secondary)' }}>
            @{username}
          </p>
        )}

        {isOwnProfile && profilePicture && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onPictureDelete}
            disabled={isUploading}
            className="mt-2"
            fullWidth={false}
          >
            Remove Picture
          </Button>
        )}

        {isAdmin && !isOwnProfile && onPasswordReset && (
          <Button
            variant="outline"
            size="sm"
            onClick={onPasswordReset}
            disabled={sendingReset}
            className="mt-4"
            fullWidth={false}
          >
            {sendingReset ? 'Sending...' : 'Send Password Reset'}
          </Button>
        )}
      </div>
    </Card>
  )
}

