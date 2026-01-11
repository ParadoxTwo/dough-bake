'use client'

import { useState, useEffect } from 'react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import ImageUpload from './ImageUpload'
import VariantForm from './VariantForm'
import type { ProductFormData, VariantFormData } from '@/lib/types/variant'

interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ProductFormData) => Promise<void>
  loading?: boolean
}

const initialVariant: VariantFormData = {
  name: '',
  description: '',
  price: 0,
  stockType: 'unlimited',
  stockQuantity: null,
  images: [],
}

export default function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}: ProductFormModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    category: '',
    stockType: 'unlimited',
    stockQuantity: null,
    images: [],
    variants: [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!isOpen) return null

  const updateField = <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const addVariant = () => {
    updateField('variants', [
      ...formData.variants,
      { ...initialVariant, price: formData.price }
    ])
  }

  const updateVariant = (index: number, variant: VariantFormData) => {
    const newVariants = [...formData.variants]
    newVariants[index] = variant
    updateField('variants', newVariants)
  }

  const removeVariant = (index: number) => {
    updateField('variants', formData.variants.filter((_, i) => i !== index))
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required'
    }

    if (formData.price < 0) {
      newErrors.price = 'Price must be non-negative'
    }

    if (formData.stockType === 'limited' && (formData.stockQuantity === null || formData.stockQuantity < 0)) {
      newErrors.stockQuantity = 'Stock quantity is required for limited stock'
    }

    // Validate variants
    formData.variants.forEach((variant, index) => {
      if (!variant.name.trim()) {
        newErrors[`variant_${index}_name`] = 'Variant name is required'
      }
      if (variant.stockType === 'limited' && (variant.stockQuantity === null || variant.stockQuantity < 0)) {
        newErrors[`variant_${index}_stockQuantity`] = 'Stock quantity is required for limited stock'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    try {
      await onSubmit(formData)
      // Reset form on success
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: '',
        stockType: 'unlimited',
        stockQuantity: null,
        images: [],
        variants: [],
      })
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Failed to submit product:', error)
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create product' })
    }
  }


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl"
        style={{ backgroundColor: 'var(--theme-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
              Add New Product
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
                label="Product Name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                error={errors.name}
                required
              />

              <Input
                label="Category"
                value={formData.category}
                onChange={(e) => updateField('category', e.target.value)}
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
              <Input
                label="Price ($)"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
                error={errors.price}
                required
              />

              <Select
                label="Stock Type"
                name="stockType"
                value={formData.stockType}
                onChange={(e) => updateField('stockType', e.target.value as 'unlimited' | 'limited')}
                options={[
                  { value: 'unlimited', label: 'Unlimited' },
                  { value: 'limited', label: 'Limited' },
                ]}
              />
            </div>

            {formData.stockType === 'limited' && (
              <Input
                label="Stock Quantity"
                type="number"
                min="0"
                value={formData.stockQuantity || ''}
                onChange={(e) => updateField('stockQuantity', e.target.value ? parseInt(e.target.value) : null)}
                error={errors.stockQuantity}
                required
              />
            )}

            <ImageUpload
              images={formData.images}
              onImagesChange={(images) => updateField('images', images)}
              maxImages={10}
              label="Product Images"
            />

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold" style={{ color: 'var(--theme-text)' }}>
                  Variants
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  onClick={addVariant}
                >
                  Add Variant
                </Button>
              </div>

              <div className="space-y-4">
                {formData.variants.map((variant, index) => (
                  <VariantForm
                    key={index}
                    variant={variant}
                    onVariantChange={(v) => updateVariant(index, v)}
                    onRemove={() => removeVariant(index)}
                    index={index}
                  />
                ))}

                {formData.variants.length === 0 && (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--theme-text-secondary)' }}>
                    No variants added. Products can be sold without variants.
                  </p>
                )}
              </div>
            </div>

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
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
              >
                Create Product
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

