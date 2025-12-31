import type { PaymentProvider, PaymentConfig } from './types'
import { StripeProvider, RazorpayProvider, PayUProvider, PayTMProvider } from './providers'

export class PaymentProviderFactory {
  static createProvider(config: PaymentConfig) {
    if (!config.enabled) {
      throw new Error(`Payment provider ${config.provider} is not enabled`)
    }

    switch (config.provider) {
      case 'stripe':
        return new StripeProvider(config.config)
      case 'razorpay':
        return new RazorpayProvider(config.config)
      case 'payu':
        return new PayUProvider(config.config)
      case 'paytm':
        return new PayTMProvider(config.config)
      default:
        throw new Error(`Unsupported payment provider: ${config.provider}`)
    }
  }

  static getSupportedProviders(): PaymentProvider[] {
    return ['stripe', 'razorpay', 'payu', 'paytm']
  }
}

