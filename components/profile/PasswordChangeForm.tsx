'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import PasswordInput from '@/components/auth/PasswordInput'
import Card from '@/components/ui/Card'

interface PasswordChangeFormProps {
  isChanging: boolean
  error?: string
  onPasswordChange: (currentPassword: string, newPassword: string) => Promise<void>
}

export default function PasswordChangeForm({
  isChanging,
  error,
  onPasswordChange,
}: PasswordChangeFormProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationError, setValidationError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setValidationError('All fields are required')
      return
    }

    if (newPassword.length < 6) {
      setValidationError('New password must be at least 6 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setValidationError('New passwords do not match')
      return
    }

    if (currentPassword === newPassword) {
      setValidationError('New password must be different from current password')
      return
    }

    try {
      await onPasswordChange(currentPassword, newPassword)
      // Reset form on success
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      // Error is handled by parent component
    }
  }

  const displayError = validationError || error

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-6" style={{ color: 'var(--theme-text)' }}>
          Change Password
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput
            label="Current Password"
            name="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isChanging}
            required
          />

          <PasswordInput
            label="New Password"
            name="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isChanging}
            required
            minLength={6}
          />

          <PasswordInput
            label="Confirm New Password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isChanging}
            required
            minLength={6}
          />

          {displayError && (
            <p className="text-sm" style={{ color: '#dc2626' }}>
              {displayError}
            </p>
          )}

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isChanging} fullWidth={false}>
              {isChanging ? 'Changing Password...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}

