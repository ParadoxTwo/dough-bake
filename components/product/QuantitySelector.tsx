'use client'

import Button from '../ui/Button'

interface QuantitySelectorProps {
  quantity: number
  onQuantityChange: (quantity: number) => void
  min?: number
  max?: number
  label?: string
}

export default function QuantitySelector({
  quantity,
  onQuantityChange,
  min = 1,
  max,
  label = 'Quantity'
}: QuantitySelectorProps) {
  const handleDecrease = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1)
    }
  }

  const handleIncrease = () => {
    if (!max || quantity < max) {
      onQuantityChange(quantity + 1)
    }
  }

  return (
    <div>
      <label 
        className="block text-sm font-medium mb-2"
        style={{ color: 'var(--theme-text)' }}
      >
        {label}
      </label>
      <div className="flex items-center space-x-4">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleDecrease}
          disabled={quantity <= min}
          fullWidth={false}
          className="!w-10 !h-10 !p-0 !rounded-full"
        >
          -
        </Button>
        <span 
          className="text-xl font-semibold w-12 text-center"
          style={{ color: 'var(--theme-text)' }}
        >
          {quantity}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleIncrease}
          disabled={max !== undefined && quantity >= max}
          fullWidth={false}
          className="!w-10 !h-10 !p-0 !rounded-full"
        >
          +
        </Button>
      </div>
    </div>
  )
}

