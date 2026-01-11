'use client'

import { useState } from 'react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import ImageUpload from './ImageUpload'
import type { VariantFormData } from '@/lib/types/variant'

interface VariantFormProps {
  variant: VariantFormData
  onVariantChange: (variant: VariantFormData) => void
  onRemove: () => void
  index: number
}

export default function VariantForm({
  variant,
  onVariantChange,
  onRemove,
  index,
}: VariantFormProps) {
  const updateField = <K extends keyof VariantFormData>(
    field: K,
    value: VariantFormData[K]
  ) => {
    onVariantChange({ ...variant, [field]: value })
  }

  return (
    <div
      className="p-4 rounded-lg space-y-4"
      style={{
        backgroundColor: 'var(--theme-surface)',
        border: '1px solid var(--theme-secondary)',
      }}
    >
      <div className="flex justify-between items-center">
        <h3 className="font-semibold" style={{ color: 'var(--theme-text)' }}>
          Variant {index + 1}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          fullWidth={false}
          onClick={onRemove}
        >
          Remove
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Variant Name"
          value={variant.name}
          onChange={(e) => updateField('name', e.target.value)}
          required
        />

        <Input
          label="Price (INR)"
          type="number"
          step="0.01"
          value={variant.price}
          onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
        />
      </div>

      <Input
        label="Description"
        value={variant.description}
        onChange={(e) => updateField('description', e.target.value)}
        multiline
        rows={3}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Stock Type"
          name={`stockType-${index}`}
          value={variant.stockType}
          onChange={(e) => updateField('stockType', e.target.value as 'unlimited' | 'limited')}
          options={[
            { value: 'unlimited', label: 'Unlimited' },
            { value: 'limited', label: 'Limited' },
          ]}
        />

        {variant.stockType === 'limited' && (
          <Input
            label="Stock Quantity"
            type="number"
            min="0"
            value={variant.stockQuantity || ''}
            onChange={(e) => updateField('stockQuantity', e.target.value ? parseInt(e.target.value) : null)}
            required
          />
        )}
      </div>

      <ImageUpload
        images={variant.images}
        onImagesChange={(images) => updateField('images', images)}
        maxImages={10}
        label="Variant Images"
      />
    </div>
  )
}

