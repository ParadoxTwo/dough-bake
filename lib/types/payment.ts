/**
 * Payment status enum
 * Matches the database constraint: CHECK (payment_status IN ('pending', 'completed', 'failed'))
 */
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Type alias for payment status values
 */
export type PaymentStatusType = PaymentStatus | 'pending' | 'completed' | 'failed'

