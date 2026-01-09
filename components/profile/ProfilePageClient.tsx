'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserProfileWithCustomer } from '@/lib/actions/user'
import { updateUserProfile } from '@/lib/actions/user'
import PageHeader from '@/components/ui/PageHeader'
import ErrorMessage from '@/components/auth/ErrorMessage'
import ProfilePictureSection from './ProfilePictureSection'
import ProfileInfoForm from './ProfileInfoForm'
import PasswordChangeForm from './PasswordChangeForm'

interface ProfilePageClientProps {
  profile: UserProfileWithCustomer
  currentUserId: string
  isAdmin: boolean
  isOwnProfile: boolean
}

export default function ProfilePageClient({
  profile,
  currentUserId,
  isAdmin,
  isOwnProfile,
}: ProfilePageClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profilePicture, setProfilePicture] = useState(profile.profile_picture_url)
  const [formData, setFormData] = useState({
    name: profile.customer?.name || '',
    phone: profile.customer?.phone || '',
    address: profile.customer?.address || '',
    city: profile.customer?.city || '',
    state: profile.customer?.state || '',
    postal_code: profile.customer?.postal_code || '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [sendingReset, setSendingReset] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [selectedRole, setSelectedRole] = useState<'customer' | 'admin'>(profile.role)

  // Update form data when profile changes (e.g., after refresh)
  useEffect(() => {
    setFormData({
      name: profile.customer?.name || '',
      phone: profile.customer?.phone || '',
      address: profile.customer?.address || '',
      city: profile.customer?.city || '',
      state: profile.customer?.state || '',
      postal_code: profile.customer?.postal_code || '',
    })
    setProfilePicture(profile.profile_picture_url)
    setSelectedRole(profile.role)
  }, [profile])

  const handlePictureChange = async (file: File) => {
    setIsUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile/picture', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }

      setProfilePicture(data.url)
      setSuccess('Profile picture updated successfully')
      setTimeout(() => setSuccess(''), 3000)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeletePicture = async () => {
    if (!confirm('Are you sure you want to delete your profile picture?')) {
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const response = await fetch('/api/profile/picture', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete image')
      }

      setProfilePicture(null)
      setSuccess('Profile picture deleted successfully')
      setTimeout(() => setSuccess(''), 3000)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const updates: {
        customer?: {
          name?: string
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
        }
        role?: 'customer' | 'admin'
      } = {
        customer: {
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          postal_code: formData.postal_code.trim() || null,
        },
      }

      // Include role change if admin is editing another user and role changed
      if (isAdmin && !isOwnProfile && selectedRole !== profile.role) {
        updates.role = selectedRole
      }

      const result = await updateUserProfile(profile.id, updates)

      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile')
      }

      setSuccess('Profile updated successfully')
      setIsEditing(false)
      setTimeout(() => setSuccess(''), 3000)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!confirm('Send password reset email to this user?')) {
      return
    }

    setSendingReset(true)
    setError('')

    try {
      const response = await fetch('/api/profile/password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: profile.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send password reset email')
      }

      setSuccess('Password reset email sent successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send password reset email')
    } finally {
      setSendingReset(false)
    }
  }

  const handleFormDataChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false)
      // Reset form data
      setFormData({
        name: profile.customer?.name || '',
        phone: profile.customer?.phone || '',
        address: profile.customer?.address || '',
        city: profile.customer?.city || '',
        state: profile.customer?.state || '',
        postal_code: profile.customer?.postal_code || '',
      })
    } else {
      setIsEditing(true)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      name: profile.customer?.name || '',
      phone: profile.customer?.phone || '',
      address: profile.customer?.address || '',
      city: profile.customer?.city || '',
      state: profile.customer?.state || '',
      postal_code: profile.customer?.postal_code || '',
    })
    setSelectedRole(profile.role)
  }

  const handleRoleChange = (role: 'customer' | 'admin') => {
    setSelectedRole(role)
  }

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    setIsChangingPassword(true)
    setPasswordError('')
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      setSuccess('Password changed successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password'
      setPasswordError(errorMessage)
      setError(errorMessage)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const displayName = profile.customer?.name || profile.email

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-background)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title={isOwnProfile ? 'My Profile' : `${displayName}'s Profile`}
          subtitle={isOwnProfile ? 'Manage your account settings and information' : 'View and manage user profile'}
        />

        <ErrorMessage message={error} />
        {success && (
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ProfilePictureSection
            profilePicture={profilePicture}
            displayName={displayName}
            email={profile.email}
            username={profile.username}
            isOwnProfile={isOwnProfile}
            isAdmin={isAdmin}
            isUploading={isUploading}
            sendingReset={sendingReset}
            onPictureChange={handlePictureChange}
            onPictureDelete={handleDeletePicture}
            onPasswordReset={isAdmin && !isOwnProfile ? handlePasswordReset : undefined}
          />

          <ProfileInfoForm
            profile={profile}
            formData={formData}
            selectedRole={selectedRole}
            isEditing={isEditing}
            isSaving={isSaving}
            isOwnProfile={isOwnProfile}
            isAdmin={isAdmin}
            onFormDataChange={handleFormDataChange}
            onRoleChange={isAdmin && !isOwnProfile ? handleRoleChange : undefined}
            onEditToggle={handleEditToggle}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>

        {/* Password change form - only visible to users viewing their own profile */}
        {isOwnProfile && (
          <div className="mt-6">
            <PasswordChangeForm
              isChanging={isChangingPassword}
              error={passwordError}
              onPasswordChange={handlePasswordChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}

