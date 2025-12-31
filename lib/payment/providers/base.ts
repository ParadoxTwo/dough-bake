import type { IPaymentProvider, PaymentInitiateRequest, PaymentInitiateResponse, PaymentVerifyRequest, PaymentVerifyResponse, PaymentProvider } from '../types'

export abstract class BasePaymentProvider implements IPaymentProvider {
  protected config: Record<string, any>

  constructor(config: Record<string, any>) {
    this.config = config
  }

  abstract initiatePayment(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse>
  abstract verifyPayment(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse>
  abstract getProviderName(): PaymentProvider

  protected validateConfig(requiredKeys: string[]): void {
    for (const key of requiredKeys) {
      if (!this.config[key]) {
        throw new Error(`Missing required configuration key: ${key}`)
      }
    }
  }
}

