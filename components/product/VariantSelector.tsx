'use client'

import { useState } from 'react'
import { ProductVariantWithImages } from '@/lib/types/variant'
import InlineEditable from '@/components/admin/InlineEditable'
import { createVariant, deleteVariant, updateVariant } from '@/lib/actions/product'
import { useRouter } from 'next/navigation'
import VariantAddModal from '@/components/admin/VariantAddModal'

interface VariantSelectorProps {
  variants: ProductVariantWithImages[]
  selectedVariantId: string | null
  onVariantSelect: (variantId: string | null) => void
  isAdmin?: boolean
  productId: string
  onVariantUpdate?: () => Promise<void>
}

export default function VariantSelector({
  variants,
  selectedVariantId,
  onVariantSelect,
  isAdmin = false,
  productId,
  onVariantUpdate,
}: VariantSelectorProps) {
  const router = useRouter()
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  if (variants.length === 0) {
    return null
  }

  const handleVariantUpdate = async (variantId: string, field: string, value: string | number) => {
    try {
      if (field === 'name') {
        await updateVariant(productId, variantId, { name: value as string })
      }

      // Refresh the product data in the parent component
      if (onVariantUpdate) {
        await onVariantUpdate()
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update variant:', error)
    }
  }

  const handleAddVariantClick = () => {
    setIsAddModalOpen(true)
  }

  return (
    <div className="mb-6">
      <label 
        className="block text-sm font-medium mb-3"
        style={{ color: 'var(--theme-text)' }}
      >
        Select Variant
      </label>
      <div className="flex flex-wrap gap-3 items-center group">
        <button
          onClick={() => onVariantSelect(null)}
          className={`px-4 py-2 rounded-lg border-2 transition-all ${
            selectedVariantId === null
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          style={{
            backgroundColor: selectedVariantId === null 
              ? 'var(--theme-primary)' 
              : 'transparent',
            borderColor: selectedVariantId === null 
              ? 'var(--theme-accent)' 
              : 'var(--theme-border)',
            color: 'var(--theme-text)',
          }}
        >
          Default
        </button>
        {variants.map((variant) => {
          const isSelected = selectedVariantId === variant.id
          const isAvailable = variant.available && (
            variant.stock_type === 'unlimited' || 
            (variant.stock_type === 'limited' && (variant.stock_quantity ?? 0) > 0)
          )

          const baseClassName = `px-4 py-2 rounded-lg border-2 transition-all ${
            isSelected
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
              : 'border-gray-300 hover:border-gray-400'
          } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : isAdmin ? 'cursor-default' : 'cursor-pointer'}`

          const baseStyle = {
            backgroundColor: isSelected 
              ? 'var(--theme-primary)' 
              : 'transparent',
            borderColor: isSelected 
              ? 'var(--theme-accent)' 
              : 'var(--theme-border)',
            color: 'var(--theme-text)',
          }

          // Use div for admin mode to avoid button nesting (InlineEditable contains buttons)
          if (isAdmin) {
            return (
              <div
                key={variant.id}
                onClick={(e) => {
                  const target = e.target as HTMLElement
                  // If clicking on a button inside (e.g. delete/save/cancel), don't change selection
                  if (target.closest('button')) return
                  // Otherwise, select the variant
                  if (!target.closest('.inline-editable-container')) {
                    isAvailable && onVariantSelect(variant.id)
                  }
                }}
                className={baseClassName}
                style={baseStyle}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-editable-container">
                    <InlineEditable
                      handleClick={() => isAvailable && onVariantSelect(variant.id)}
                      value={variant.name}
                      onSave={(value) => handleVariantUpdate(variant.id, 'name', value)}
                      className="inline-block"
                      onEditingChange={(editing) => {
                        setEditingVariantId((current) => {
                          if (editing) return variant.id
                          return current === variant.id ? null : current
                        })
                      }}
                      onDelete={async () => {
                        const confirmed = window.confirm('Are you sure you want to delete this variant?')
                        if (!confirmed) return

                        try {
                          await deleteVariant(variant.id)
                          if (selectedVariantId === variant.id) {
                            onVariantSelect(null)
                          }
                          setEditingVariantId(null)
                          // Refresh the product data in the parent component
                          if (onVariantUpdate) {
                            await onVariantUpdate()
                          } else {
                            router.refresh()
                          }
                        } catch (error) {
                          console.error('Failed to delete variant:', error)
                        }
                      }}
                    />
                  </span>
                </div>
                {!isAvailable && (
                  <span className="ml-2 text-xs opacity-75">(Out of Stock)</span>
                )}
              </div>
            )
          }

          return (
            <button
              key={variant.id}
              onClick={() => isAvailable && onVariantSelect(variant.id)}
              disabled={!isAvailable}
              className={baseClassName}
              style={baseStyle}
            >
              {variant.name}
              {!isAvailable && (
                <span className="ml-2 text-xs opacity-75">(Out of Stock)</span>
              )}
            </button>
          )
        })}

        {isAdmin && (
          <button
            type="button"
            onClick={handleAddVariantClick}
            className="p-2 rounded-full border text-sm leading-none opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              borderColor: 'var(--theme-secondary)',
              color: 'var(--theme-text)',
            }}
            title="Add variant"
          >
            +
          </button>
        )}
      </div>
      {isAdmin && (
        <VariantAddModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          productId={productId}
          onVariantCreated={async (variantId) => {
            onVariantSelect(variantId)
            setIsAddModalOpen(false)
            // Refresh the product data in the parent component
            if (onVariantUpdate) {
              await onVariantUpdate()
            } else {
              router.refresh()
            }
          }}
        />
      )}
    </div>
  )
}

