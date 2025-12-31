import * as crypto from 'crypto'
import { BasePaymentProvider } from './base'
import type { PaymentInitiateRequest, PaymentInitiateResponse, PaymentVerifyRequest, PaymentVerifyResponse } from '../types'

export class RazorpayProvider extends BasePaymentProvider {
  constructor(config: Record<string, any>) {
    super(config)
    this.validateConfig(['keyId', 'keySecret'])
  }

  getProviderName(): 'razorpay' {
    return 'razorpay'
  }

  async initiatePayment(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    try {
      // Convert amount to paise (Razorpay uses smallest currency unit for INR)
      const amountInPaise = Math.round(request.amount)

      // In a real implementation, you would create an order via Razorpay API
      // For now, we return the necessary data for the frontend to create the order
      // The frontend will use Razorpay's JavaScript SDK to create and process the order

      return {
        success: true,
        orderId: request.orderId,
        keyId: this.config.keyId,
        amount: amountInPaise,
        currency: request.currency,
      }
    } catch (error: any) {
      console.error('Razorpay payment initiation error:', error)
      return {
        success: false,
        error: error.message || 'Failed to initiate Razorpay payment',
      }
    }
  }

  async verifyPayment(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse> {
    try {
      const { paymentId, metadata } = request
      const signature = metadata?.razorpay_signature
      const orderId = metadata?.razorpay_order_id

      if (!signature || !orderId) {
        return {
          success: false,
          verified: false,
          error: 'Missing signature or order ID',
        }
      }

      // Verify signature
      const text = `${orderId}|${paymentId}`
      const generatedSignature = crypto
        .createHmac('sha256', this.config.keySecret)
        .update(text)
        .digest('hex')

      const isVerified = generatedSignature === signature

      return {
        success: true,
        verified: isVerified,
        paymentId,
        status: isVerified ? 'success' : 'failed',
      }
    } catch (error: any) {
      console.error('Razorpay payment verification error:', error)
      return {
        success: false,
        verified: false,
        error: error.message || 'Failed to verify Razorpay payment',
      }
    }
  }
}

