import { BaseDeliveryProvider } from './base'
import {
  DeliveryStatus,
  type DeliveryProvider,
  type DeliveryQuoteRequest,
  type DeliveryQuoteResponse,
  type DeliveryCreateRequest,
  type DeliveryCreateResponse,
  type DeliveryStatusResponse,
  type DeliveryCancelResponse,
  type DeliveryWebhookResult,
} from '../types'

/**
 * Porter (porter.in) delivery adapter — PLACEHOLDER.
 *
 * Porter's intra-city API is enterprise/contract-gated: there is no self-serve
 * developer portal. To finish this adapter you need a Porter business account and
 * their API reference + credentials from your Porter account manager.
 *
 * Once you have the docs, fill in the request/response mapping below. The status
 * mapping is already wired to Porter's documented lifecycle:
 *   open -> looking for a driver        => CREATED
 *   accept -> driver assigned           => ASSIGNED
 *   Live -> picked up, en route         => IN_TRANSIT
 *   Ended -> delivered                  => DELIVERED
 *
 * Config keys (to confirm against Porter docs):
 *   - apiKey / authToken
 *   - baseUrl
 *   - testMode
 *   - callbackSecret
 */
export class PorterProvider extends BaseDeliveryProvider {
  getProviderName(): DeliveryProvider {
    return 'porter'
  }

  /** Map a Porter order status onto our normalized DeliveryStatus. */
  static mapStatus(status?: string): DeliveryStatus {
    switch ((status || '').toLowerCase()) {
      case 'open':
        return DeliveryStatus.CREATED
      case 'accept':
      case 'accepted':
        return DeliveryStatus.ASSIGNED
      case 'live':
        return DeliveryStatus.IN_TRANSIT
      case 'ended':
        return DeliveryStatus.DELIVERED
      case 'cancelled':
      case 'canceled':
        return DeliveryStatus.CANCELLED
      default:
        return DeliveryStatus.PENDING
    }
  }

  private static notImplemented(): never {
    throw new Error(
      'Porter adapter is not configured yet. Obtain Porter Business API ' +
        'credentials and documentation, then implement lib/delivery/providers/porter.ts.'
    )
  }

  async getQuote(_request: DeliveryQuoteRequest): Promise<DeliveryQuoteResponse> {
    void _request
    // TODO: POST to Porter's fare/quote endpoint and map the response.
    return { success: false, available: false, error: 'Porter adapter not implemented' }
  }

  async createDelivery(_request: DeliveryCreateRequest): Promise<DeliveryCreateResponse> {
    void _request
    // TODO: POST to Porter's create-order endpoint; return externalId + status.
    PorterProvider.notImplemented()
  }

  async getStatus(_externalId: string): Promise<DeliveryStatusResponse> {
    void _externalId
    // TODO: GET Porter's order status and map via PorterProvider.mapStatus().
    return { success: false, error: 'Porter adapter not implemented' }
  }

  async cancelDelivery(_externalId: string): Promise<DeliveryCancelResponse> {
    void _externalId
    // TODO: POST to Porter's cancel endpoint.
    return { success: false, error: 'Porter adapter not implemented' }
  }

  handleWebhook(_rawBody: string, _headers: Record<string, string>): DeliveryWebhookResult {
    void _rawBody
    void _headers
    // TODO: verify Porter's webhook signature and map order status updates.
    return { verified: false, error: 'Porter adapter not implemented' }
  }
}
