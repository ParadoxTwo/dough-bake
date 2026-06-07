import type {
  IDeliveryProvider,
  DeliveryProvider,
  DeliveryQuoteRequest,
  DeliveryQuoteResponse,
  DeliveryCreateRequest,
  DeliveryCreateResponse,
  DeliveryStatusResponse,
  DeliveryCancelResponse,
  DeliveryWebhookResult,
} from '../types'

/**
 * Shared base for delivery providers. Mirrors BasePaymentProvider: holds the
 * provider config and offers a small config validation helper.
 */
export abstract class BaseDeliveryProvider implements IDeliveryProvider {
  protected config: Record<string, any>

  constructor(config: Record<string, any>) {
    this.config = config
  }

  abstract getQuote(request: DeliveryQuoteRequest): Promise<DeliveryQuoteResponse>
  abstract createDelivery(request: DeliveryCreateRequest): Promise<DeliveryCreateResponse>
  abstract getStatus(externalId: string): Promise<DeliveryStatusResponse>
  abstract cancelDelivery(externalId: string): Promise<DeliveryCancelResponse>
  abstract handleWebhook(
    rawBody: string,
    headers: Record<string, string>
  ): Promise<DeliveryWebhookResult> | DeliveryWebhookResult
  abstract getProviderName(): DeliveryProvider

  protected validateConfig(requiredKeys: string[]): void {
    for (const key of requiredKeys) {
      if (!this.config[key]) {
        throw new Error(`Missing required configuration key: ${key}`)
      }
    }
  }

  protected isTestMode(): boolean {
    return this.config.testMode === true || this.config.testMode === 'true'
  }
}
