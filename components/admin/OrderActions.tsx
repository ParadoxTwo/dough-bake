'use client'

import Button from '@/components/ui/Button'
import { OrderStatus } from '@/lib/types/order'

interface OrderActionsProps {
  orderId: string
  currentStatus: string
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void
  onDelete: (orderId: string) => void
  updatingOrderId: string | null
  deletingOrderId: string | null
}

export default function OrderActions({
  orderId,
  currentStatus,
  onStatusChange,
  onDelete,
  updatingOrderId,
  deletingOrderId,
}: OrderActionsProps) {
  const isUpdating = updatingOrderId === orderId
  const isDeleting = deletingOrderId === orderId

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={() => onStatusChange(orderId, OrderStatus.FULFILLED)}
        disabled={isUpdating || currentStatus === 'completed'}
        fullWidth={false}
      >
        {isUpdating ? 'Updating...' : 'Mark Fulfilled'}
      </Button>
      <Button
        size="sm"
        onClick={() => onStatusChange(orderId, OrderStatus.CANCELLED)}
        disabled={isUpdating || currentStatus === 'cancelled'}
        fullWidth={false}
        style={{ backgroundColor: '#ef4444' }}
      >
        Cancel Order
      </Button>
      <button
        onClick={() => onDelete(orderId)}
        disabled={isDeleting}
        className="p-2 hover:opacity-70 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed rounded"
        style={{ color: '#ef4444' }}
        aria-label="Delete order"
        title="Delete order"
      >
        {isDeleting ? (
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        )}
      </button>
    </div>
  )
}

