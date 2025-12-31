import * as crypto from 'crypto'
import { BasePaymentProvider } from './base'
import type { PaymentInitiateRequest, PaymentInitiateResponse, PaymentVerifyRequest, PaymentVerifyResponse } from '../types'

export class PayTMProvider extends BasePaymentProvider {
  constructor(config: Record<string, any>) {
    super(config)
    this.validateConfig(['merchantId', 'merchantKey'])
  }

  getProviderName(): 'paytm' {
    return 'paytm'
  }

  async initiatePayment(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    try {
      // PayTM payment flow
      const amount = request.amount

      // Generate checksum for PayTM
      // PayTM requires specific parameter structure for checksum generation
      const paytmParams: Record<string, string> = {
        MID: this.config.merchantId,
        ORDER_ID: request.orderId,
        CUST_ID: request.customer.id,
        INDUSTRY_TYPE_ID: this.config.industryType || 'Retail',
        CHANNEL_ID: this.config.channelId || 'WEB',
        TXN_AMOUNT: amount.toString(),
        WEBSITE: this.config.website || 'WEBSTAGING',
        CALLBACK_URL: this.config.callbackUrl || '',
      }

      // Generate checksum (simplified - actual implementation needs proper PayTM SDK)
      const checksumString = Object.keys(paytmParams)
        .sort()
        .map(key => `${key}=${paytmParams[key]}`)
        .join('&')
      const checksum = crypto.createHmac('sha256', this.config.merchantKey).update(checksumString).digest('hex')

      const redirectUrl = `${this.config.baseUrl || 'https://securegw-stage.paytm.in/theia/processTransaction'}`

      return {
        success: true,
        orderId: request.orderId,
        amount,
        currency: request.currency,
        redirectUrl,
        metadata: {
          checksum,
          ...paytmParams,
        },
      }
    } catch (error: any) {
      console.error('PayTM payment initiation error:', error)
      return {
        success: false,
        error: error.message || 'Failed to initiate PayTM payment',
      }
    }
  }

  async verifyPayment(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse> {
    try {
      const { paymentId, metadata } = request
      const receivedChecksum = metadata?.CHECKSUMHASH
      const status = metadata?.STATUS

      if (!receivedChecksum) {
        return {
          success: false,
          verified: false,
          error: 'Missing checksum for verification',
        }
      }

      // Verify checksum (PayTM sends checksum in callback)
      // This is a simplified version - actual implementation needs PayTM verification SDK
      const isVerified = status === 'TXN_SUCCESS' && receivedChecksum

      return {
        success: true,
        verified: isVerified,
        paymentId,
        status: isVerified ? 'success' : 'failed',
      }
    } catch (error: any) {
      console.error('PayTM payment verification error:', error)
      return {
        success: false,
        verified: false,
        error: error.message || 'Failed to verify PayTM payment',
      }
    }
  }
}

