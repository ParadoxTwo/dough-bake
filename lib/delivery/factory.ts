import type { DeliveryConfig, DeliveryProvider, IDeliveryProvider } from './types'
import { BorzoProvider, PorterProvider } from './providers'

/**
 * Selects and instantiates the configured delivery provider.
 * Mirrors PaymentProviderFactory.
 */
export class DeliveryProviderFactory {
  static createProvider(config: DeliveryConfig): IDeliveryProvider {
    if (!config.enabled) {
      throw new Error(`Delivery provider ${config.provider} is not enabled`)
    }

    switch (config.provider) {
      case 'borzo':
        return new BorzoProvider(config.config)
      case 'porter':
        return new PorterProvider(config.config)
      default:
        throw new Error(`Unsupported delivery provider: ${config.provider}`)
    }
  }

  static getSupportedProviders(): DeliveryProvider[] {
    return ['borzo', 'porter']
  }
}
