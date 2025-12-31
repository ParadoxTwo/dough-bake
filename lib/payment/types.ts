export type PaymentProvider = 'stripe' | 'razorpay' | 'payu' | 'paytm'

export interface PaymentConfig {
  provider: PaymentProvider
  // Provider-specific configuration stored as JSON
  config: Record<string, any>
  enabled: boolean
}

export interface PaymentInitiateRequest {
  orderId: string
  amount: number // Amount in smallest currency unit (e.g., paise for INR, cents for USD)
  currency: string // ISO currency code (e.g., 'INR', 'USD')
  customer: {
    id: string
    email?: string
    name: string
    phone?: string
  }
  metadata?: Record<string, string>
}

export interface PaymentInitiateResponse {
  success: boolean
  paymentId?: string
  clientSecret?: string // For Stripe
  orderId?: string // For Razorpay, PayU, PayTM
  keyId?: string // For Razorpay
  amount?: number
  currency?: string
  redirectUrl?: string // For PayU, PayTM
  metadata?: Record<string, any> // For PayU, PayTM (checksum, hash, etc.)
  error?: string
}

export interface PaymentVerifyRequest {
  paymentId: string
  orderId: string
  provider: PaymentProvider
  metadata?: Record<string, any>
}

export interface PaymentVerifyResponse {
  success: boolean
  verified: boolean
  paymentId?: string
  amount?: number
  currency?: string
  status?: 'success' | 'failed' | 'pending'
  error?: string
}

export interface PaymentCallbackData {
  paymentId: string
  orderId: string
  status: 'success' | 'failed'
  amount?: number
  signature?: string // For Razorpay, PayU, PayTM verification
  metadata?: Record<string, any>
}

export interface IPaymentProvider {
  /**
   * Initialize payment and return payment details
   */
  initiatePayment(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse>

  /**
   * Verify payment after callback
   */
  verifyPayment(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse>

  /**
   * Get provider name
   */
  getProviderName(): PaymentProvider
}

