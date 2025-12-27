'use client'

import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import ImageUpload from './ImageUpload'
import type { VariantFormData } from '@/lib/types/variant'
import { createVariant } from '@/lib/actions/product'

interface VariantAddModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  onVariantCreated: (variantId: string) => void
}

const initialVariant: VariantFormData = {
  name: '',
  description: '',
  priceAdjustment: 0,
  stockType: 'unlimited',
  stockQuantity: null,
  images: [],
}

export default function VariantAddModal({
  isOpen,
  onClose,
  productId,
  onVariantCreated,
}: VariantAddModalProps) {
  const [formData, setFormData] = useState<VariantFormData>({ ...initialVariant })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const updateField = <K extends keyof VariantFormData>(
    field: K,
    value: VariantFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validate = (): boolean => {
    const next: Record<string, string> = {}

    if (!formData.name.trim()) {
      next.name = 'Variant name is required'
    }

    if (formData.stockType === 'limited' && (formData.stockQuantity === null || formData.stockQuantity < 0)) {
      next.stockQuantity = 'Stock quantity is required for limited stock'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setErrors(prev => {
      const { submit, ...rest } = prev
      return rest
    })

    try {
      const { id } = await createVariant(productId, {
        name: formData.name,
        description: formData.description || null,
        priceAdjustment: formData.priceAdjustment,
        stockType: formData.stockType,
        stockQuantity: formData.stockQuantity,
        images: formData.images,
      })

      setFormData({ ...initialVariant })
      onVariantCreated(id)
      onClose()
    } catch (error) {
      console.error('Failed to create variant:', error)
      setErrors(prev => ({
        ...prev,
        submit: error instanceof Error ? error.message : 'Failed to create variant',
      }))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl"
        style={{ backgroundColor: 'var(--theme-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
              Add Variant
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Variant Name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                error={errors.name}
                required
              />

              <Input
                label="Price Adjustment"
                type="number"
                step="0.01"
                value={formData.priceAdjustment}
                onChange={(e) => updateField('priceAdjustment', parseFloat(e.target.value) || 0)}
              />
            </div>

            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              multiline
              rows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-text)' }}>
                  Stock Type
                </label>
                <select
                  value={formData.stockType}
                  onChange={(e) => updateField('stockType', e.target.value as 'unlimited' | 'limited')}
                  className="w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent transition-all"
                  style={{
                    border: '1px solid var(--theme-secondary)',
                    backgroundColor: 'var(--theme-background)',
                    color: 'var(--theme-text)',
                  }}
                >
                  <option value="unlimited">Unlimited</option>
                  <option value="limited">Limited</option>
                </select>
              </div>

              {formData.stockType === 'limited' && (
                <Input
                  label="Stock Quantity"
                  type="number"
                  min="0"
                  value={formData.stockQuantity || ''}
                  onChange={(e) =>
                    updateField('stockQuantity', e.target.value ? parseInt(e.target.value) : null)
                  }
                  error={errors.stockQuantity}
                  required
                />
              )}
            </div>

            <ImageUpload
              images={formData.images}
              onImagesChange={(images) => updateField('images', images)}
              maxImages={10}
              label="Variant Images"
            />

            {errors.submit && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                <p className="text-sm" style={{ color: '#dc2626' }}>
                  {errors.submit}
                </p>
              </div>
            )}

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={submitting}
              >
                Create Variant
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
