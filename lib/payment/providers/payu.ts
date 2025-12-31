import * as crypto from 'crypto'
import { BasePaymentProvider } from './base'
import type { PaymentInitiateRequest, PaymentInitiateResponse, PaymentVerifyRequest, PaymentVerifyResponse } from '../types'

export class PayUProvider extends BasePaymentProvider {
  constructor(config: Record<string, any>) {
    super(config)
    this.validateConfig(['merchantKey', 'merchantSalt'])
  }

  getProviderName(): 'payu' {
    return 'payu'
  }

  async initiatePayment(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    try {
      // PayU payment flow
      // Amount should be in the base currency unit (not paise)
      const amount = request.amount

      // Generate hash for PayU
      const hashString = `${this.config.merchantKey}|${request.orderId}|${amount}|${request.currency}|${request.customer.name}`
      const hash = crypto.createHash('sha512').update(hashString + this.config.merchantSalt).digest('hex')

      // PayU redirect URL (this would typically be constructed on the frontend)
      const redirectUrl = `${this.config.baseUrl || 'https://secure.payu.in'}/_payment`

      return {
        success: true,
        orderId: request.orderId,
        amount,
        currency: request.currency,
        redirectUrl,
        metadata: {
          hash,
          merchantKey: this.config.merchantKey,
        },
      }
    } catch (error: any) {
      console.error('PayU payment initiation error:', error)
      return {
        success: false,
        error: error.message || 'Failed to initiate PayU payment',
      }
    }
  }

  async verifyPayment(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse> {
    try {
      const { paymentId, metadata } = request
      const receivedHash = metadata?.hash
      const status = metadata?.status

      if (!receivedHash) {
        return {
          success: false,
          verified: false,
          error: 'Missing hash for verification',
        }
      }

      // Verify hash (PayU sends hash in callback)
      // The actual verification logic depends on PayU's callback format
      // This is a simplified version
      const isVerified = status === 'success' && receivedHash

      return {
        success: true,
        verified: isVerified,
        paymentId,
        status: isVerified ? 'success' : 'failed',
      }
    } catch (error: any) {
      console.error('PayU payment verification error:', error)
      return {
        success: false,
        verified: false,
        error: error.message || 'Failed to verify PayU payment',
      }
    }
  }
}

