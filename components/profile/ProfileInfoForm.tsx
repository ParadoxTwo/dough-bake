'use client'

import { UserProfileWithCustomer } from '@/lib/actions/user'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

interface ProfileInfoFormProps {
  profile: UserProfileWithCustomer
  formData: {
    name: string
    phone: string
    address: string
    city: string
    state: string
    postal_code: string
  }
  isEditing: boolean
  isSaving: boolean
  isOwnProfile: boolean
  onFormDataChange: (field: string, value: string) => void
  onEditToggle: () => void
  onSave: () => Promise<void>
  onCancel: () => void
}

export default function ProfileInfoForm({
  profile,
  formData,
  isEditing,
  isSaving,
  isOwnProfile,
  onFormDataChange,
  onEditToggle,
  onSave,
  onCancel,
}: ProfileInfoFormProps) {
  return (
    <Card className="lg:col-span-2">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
            Profile Information
          </h3>
          {isOwnProfile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditToggle}
              fullWidth={false}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
              Email
            </label>
            <Input
              type="email"
              name="email"
              value={profile.email}
              disabled
              className="opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
              Username
            </label>
            <Input
              type="text"
              name="username"
              value={profile.username || 'Not set'}
              disabled
              className="opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
              Role
            </label>
            <Input
              type="text"
              name="role"
              value={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              disabled
              className="opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
              Full Name
            </label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) => onFormDataChange('name', e.target.value)}
              disabled={!isEditing || !isOwnProfile}
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
              Phone
            </label>
            <Input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={(e) => onFormDataChange('phone', e.target.value)}
              disabled={!isEditing || !isOwnProfile}
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
              Address
            </label>
            <Input
              type="text"
              name="address"
              value={formData.address}
              onChange={(e) => onFormDataChange('address', e.target.value)}
              disabled={!isEditing || !isOwnProfile}
              placeholder="Enter your address"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
                City
              </label>
              <Input
                type="text"
                name="city"
                value={formData.city}
                onChange={(e) => onFormDataChange('city', e.target.value)}
                disabled={!isEditing || !isOwnProfile}
                placeholder="Enter your city"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
                State
              </label>
              <Input
                type="text"
                name="state"
                value={formData.state}
                onChange={(e) => onFormDataChange('state', e.target.value)}
                disabled={!isEditing || !isOwnProfile}
                placeholder="Enter your state"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
              Postal Code
            </label>
            <Input
              type="text"
              name="postal_code"
              value={formData.postal_code}
              onChange={(e) => onFormDataChange('postal_code', e.target.value)}
              disabled={!isEditing || !isOwnProfile}
              placeholder="Enter your postal code"
            />
          </div>

          {isEditing && isOwnProfile && (
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={onCancel}
                fullWidth={false}
              >
                Cancel
              </Button>
              <Button onClick={onSave} disabled={isSaving} fullWidth={false}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

