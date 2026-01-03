/**
 * Order status enum
 * For admin management, orders can be 'fulfilled' or 'cancelled'
 * Note: 'fulfilled' maps to 'completed' in the database
 */
export enum OrderStatus {
  FULFILLED = 'completed', // Maps to 'completed' in database
  CANCELLED = 'cancelled',
}

/**
 * Type alias for order status values
 */
export type OrderStatusType = OrderStatus | 'completed' | 'cancelled'

