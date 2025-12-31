import Stripe from 'stripe'
import { BasePaymentProvider } from './base'
import type { PaymentInitiateRequest, PaymentInitiateResponse, PaymentVerifyRequest, PaymentVerifyResponse } from '../types'

export class StripeProvider extends BasePaymentProvider {
  private stripe: Stripe | null = null

  constructor(config: Record<string, any>) {
    super(config)
    this.validateConfig(['secretKey'])
    
    if (config.secretKey) {
      this.stripe = new Stripe(config.secretKey, {
        apiVersion: '2025-12-15.clover',
      })
    }
  }

  getProviderName(): 'stripe' {
    return 'stripe'
  }

  async initiatePayment(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    if (!this.stripe) {
      return {
        success: false,
        error: 'Stripe is not configured properly',
      }
    }

    try {
      // Convert amount to cents (Stripe uses smallest currency unit)
      const amountInCents = Math.round(request.amount)

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: request.currency.toLowerCase(),
        metadata: {
          orderId: request.orderId,
          customerId: request.customer.id,
          ...request.metadata,
        },
        receipt_email: request.customer.email,
      })

      return {
        success: true,
        paymentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined,
        amount: request.amount,
        currency: request.currency,
      }
    } catch (error: any) {
      console.error('Stripe payment initiation error:', error)
      return {
        success: false,
        error: error.message || 'Failed to initiate Stripe payment',
      }
    }
  }

  async verifyPayment(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse> {
    if (!this.stripe) {
      return {
        success: false,
        verified: false,
        error: 'Stripe is not configured properly',
      }
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(request.paymentId)

      const isSuccess = paymentIntent.status === 'succeeded'
      const status = isSuccess ? 'success' : paymentIntent.status === 'canceled' ? 'failed' : 'pending'

      return {
        success: true,
        verified: isSuccess,
        paymentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase(),
        status,
      }
    } catch (error: any) {
      console.error('Stripe payment verification error:', error)
      return {
        success: false,
        verified: false,
        error: error.message || 'Failed to verify Stripe payment',
      }
    }
  }
}

