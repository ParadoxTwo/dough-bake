/**
 * Delivery provider abstraction.
 *
 * Mirrors the payment provider layer (lib/payment): a normalized interface that
 * concrete providers (Borzo, Porter, ...) implement, with the active provider and
 * its credentials stored in site_settings and selected via DeliveryProviderFactory.
 */

export type DeliveryProvider = 'borzo' | 'porter'

export interface DeliveryConfig {
  provider: DeliveryProvider
  // Provider-specific configuration stored as JSON (credentials, test mode,
  // default vehicle type, callback secret, etc.)
  config: Record<string, any>
  enabled: boolean
}

/**
 * Normalized delivery status used across the app, independent of any provider's
 * own vocabulary. Each provider maps its statuses onto these.
 */
export enum DeliveryStatus {
  PENDING = 'pending', // created locally, not yet sent to provider
  CREATED = 'created', // accepted by provider, awaiting a courier
  ASSIGNED = 'assigned', // courier assigned
  PICKED_UP = 'picked_up', // parcel collected from the bakery
  IN_TRANSIT = 'in_transit', // on the way to the customer
  DELIVERED = 'delivered', // completed
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export interface DeliveryAddress {
  address: string
  lat?: number
  lng?: number
  contactName: string
  contactPhone: string
  note?: string
}

export interface DeliveryQuoteRequest {
  pickup: DeliveryAddress
  dropoff: DeliveryAddress
  matter?: string // description of contents
  weightKg?: number
}

export interface DeliveryQuoteResponse {
  success: boolean
  available: boolean // is the route serviceable?
  fee?: number
  currency?: string
  etaMinutes?: number
  raw?: Record<string, any>
  error?: string
}

export interface DeliveryCreateRequest {
  orderId: string // our internal order id (for reference/metadata)
  pickup: DeliveryAddress
  dropoff: DeliveryAddress
  matter: string // description of contents (e.g. "Bakery order #1234")
  weightKg?: number
  metadata?: Record<string, string>
}

export interface DeliveryCreateResponse {
  success: boolean
  externalId?: string // the provider's delivery/order id
  status?: DeliveryStatus
  trackingUrl?: string
  fee?: number
  currency?: string
  raw?: Record<string, any>
  error?: string
}

export interface DeliveryStatusResponse {
  success: boolean
  status?: DeliveryStatus
  rawStatus?: string // the provider's own status string, for debugging
  riderName?: string
  riderPhone?: string
  trackingUrl?: string
  raw?: Record<string, any>
  error?: string
}

export interface DeliveryCancelResponse {
  success: boolean
  status?: DeliveryStatus
  error?: string
}

/**
 * Result of parsing/verifying a provider webhook (status callback). The webhook
 * route handler uses this to update the local `deliveries` row.
 */
export interface DeliveryWebhookResult {
  verified: boolean // signature check passed
  externalId?: string
  status?: DeliveryStatus
  rawStatus?: string
  riderName?: string
  riderPhone?: string
  raw?: Record<string, any>
  error?: string
}

export interface IDeliveryProvider {
  /**
   * Get a price quote / serviceability check before creating a delivery.
   */
  getQuote(request: DeliveryQuoteRequest): Promise<DeliveryQuoteResponse>

  /**
   * Create (dispatch) a delivery with the provider.
   */
  createDelivery(request: DeliveryCreateRequest): Promise<DeliveryCreateResponse>

  /**
   * Poll the current status of a delivery by the provider's id.
   */
  getStatus(externalId: string): Promise<DeliveryStatusResponse>

  /**
   * Cancel a delivery by the provider's id.
   */
  cancelDelivery(externalId: string): Promise<DeliveryCancelResponse>

  /**
   * Parse and verify an incoming status webhook from the provider.
   * `rawBody` is the exact request body string (needed for signature checks).
   */
  handleWebhook(
    rawBody: string,
    headers: Record<string, string>
  ): Promise<DeliveryWebhookResult> | DeliveryWebhookResult

  /**
   * Get provider name.
   */
  getProviderName(): DeliveryProvider
}
