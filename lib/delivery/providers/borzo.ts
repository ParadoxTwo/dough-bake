import crypto from 'crypto'
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
  type DeliveryAddress,
} from '../types'

/**
 * Borzo (formerly WeFast / Dostavista) Business API adapter.
 * Docs: https://borzodelivery.com/in/business-api/doc
 *
 * Config keys (stored in site_settings -> delivery_config):
 *   - authToken:      X-DV-Auth-Token from the Borzo personal cabinet (required)
 *   - testMode:       boolean; when true, uses the apitest sandbox host
 *   - callbackSecret: secret used to verify status webhooks (optional but recommended)
 *   - vehicleTypeId:  numeric vehicle type (defaults to 8 = motorbike, up to 20kg)
 */
export class BorzoProvider extends BaseDeliveryProvider {
  private readonly authToken: string
  private readonly vehicleTypeId: number

  // API version is pinned; Borzo versions the path (.../api/business/1.6).
  private static readonly API_VERSION = '1.6'
  private static readonly PROD_HOST = 'https://robot-in.borzodelivery.com'
  private static readonly TEST_HOST = 'https://robotapitest-in.borzodelivery.com'

  constructor(config: Record<string, any>) {
    super(config)
    this.validateConfig(['authToken'])
    this.authToken = config.authToken
    this.vehicleTypeId = Number(config.vehicleTypeId) || 8
  }

  getProviderName(): DeliveryProvider {
    return 'borzo'
  }

  private baseUrl(): string {
    const host = this.isTestMode() ? BorzoProvider.TEST_HOST : BorzoProvider.PROD_HOST
    return `${host}/api/business/${BorzoProvider.API_VERSION}`
  }

  /** Map a Borzo order status onto our normalized DeliveryStatus. */
  private static mapStatus(status?: string): DeliveryStatus {
    switch ((status || '').toLowerCase()) {
      case 'new':
      case 'available':
        return DeliveryStatus.CREATED
      case 'active':
      case 'delayed':
        return DeliveryStatus.IN_TRANSIT
      case 'completed':
        return DeliveryStatus.DELIVERED
      case 'canceled':
      case 'cancelled':
        return DeliveryStatus.CANCELLED
      default:
        return DeliveryStatus.PENDING
    }
  }

  /** Build a Borzo "point" object from a normalized address. */
  private static toPoint(addr: DeliveryAddress): Record<string, any> {
    const point: Record<string, any> = {
      address: addr.address,
      contact_person: {
        name: addr.contactName,
        phone: addr.contactPhone,
      },
    }
    if (typeof addr.lat === 'number') point.latitude = addr.lat
    if (typeof addr.lng === 'number') point.longitude = addr.lng
    if (addr.note) point.note = addr.note
    return point
  }

  private async post(path: string, body: Record<string, any>): Promise<any> {
    const res = await fetch(`${this.baseUrl()}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DV-Auth-Token': this.authToken,
      },
      body: JSON.stringify(body),
    })
    return res.json()
  }

  private async get(path: string): Promise<any> {
    const res = await fetch(`${this.baseUrl()}${path}`, {
      method: 'GET',
      headers: { 'X-DV-Auth-Token': this.authToken },
    })
    return res.json()
  }

  private buildOrderBody(
    request: DeliveryCreateRequest | DeliveryQuoteRequest,
    matter: string
  ): Record<string, any> {
    const body: Record<string, any> = {
      type: 'standard',
      matter,
      vehicle_type_id: this.vehicleTypeId,
      points: [
        BorzoProvider.toPoint(request.pickup),
        BorzoProvider.toPoint(request.dropoff),
      ],
    }
    if (typeof request.weightKg === 'number') body.total_weight_kg = request.weightKg
    return body
  }

  async getQuote(request: DeliveryQuoteRequest): Promise<DeliveryQuoteResponse> {
    try {
      const body = this.buildOrderBody(request, request.matter || 'Quote')
      const data = await this.post('/calculate-order', body)

      if (!data?.is_successful) {
        return {
          success: false,
          available: false,
          raw: data,
          error: BorzoProvider.firstError(data) || 'Quote failed',
        }
      }

      const order = data.order || {}
      return {
        success: true,
        available: true,
        fee: order.payment_amount != null ? Number(order.payment_amount) : undefined,
        currency: 'INR',
        raw: data,
      }
    } catch (error: any) {
      return { success: false, available: false, error: error.message || 'Quote failed' }
    }
  }

  async createDelivery(request: DeliveryCreateRequest): Promise<DeliveryCreateResponse> {
    try {
      const body = this.buildOrderBody(request, request.matter)
      const data = await this.post('/create-order', body)

      if (!data?.is_successful) {
        return {
          success: false,
          raw: data,
          error: BorzoProvider.firstError(data) || 'Failed to create delivery',
        }
      }

      const order = data.order || {}
      return {
        success: true,
        externalId: order.order_id != null ? String(order.order_id) : undefined,
        status: BorzoProvider.mapStatus(order.status),
        trackingUrl: BorzoProvider.extractTrackingUrl(order),
        fee: order.payment_amount != null ? Number(order.payment_amount) : undefined,
        currency: 'INR',
        raw: data,
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to create delivery' }
    }
  }

  async getStatus(externalId: string): Promise<DeliveryStatusResponse> {
    try {
      const data = await this.get(`/orders?order_id[]=${encodeURIComponent(externalId)}`)

      if (!data?.is_successful) {
        return { success: false, raw: data, error: BorzoProvider.firstError(data) || 'Status lookup failed' }
      }

      const order = (data.orders || [])[0]
      if (!order) {
        return { success: false, error: 'Delivery not found' }
      }

      return {
        success: true,
        status: BorzoProvider.mapStatus(order.status),
        rawStatus: order.status,
        trackingUrl: BorzoProvider.extractTrackingUrl(order),
        raw: order,
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Status lookup failed' }
    }
  }

  async cancelDelivery(externalId: string): Promise<DeliveryCancelResponse> {
    try {
      const data = await this.post('/cancel-order', { order_id: Number(externalId) || externalId })

      if (!data?.is_successful) {
        return { success: false, error: BorzoProvider.firstError(data) || 'Failed to cancel delivery' }
      }

      return { success: true, status: BorzoProvider.mapStatus(data.order?.status) || DeliveryStatus.CANCELLED }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to cancel delivery' }
    }
  }

  handleWebhook(rawBody: string, headers: Record<string, string>): DeliveryWebhookResult {
    // Borzo signs callbacks with the X-DV-Signature header, an HMAC of the raw
    // request body keyed by the callback secret from the personal cabinet.
    // NOTE: confirm the exact HMAC algorithm against your Borzo callback docs;
    // it is configurable here via config.callbackAlgo (defaults to sha1).
    const callbackSecret = this.config.callbackSecret as string | undefined
    const algo = (this.config.callbackAlgo as string) || 'sha1'

    let verified = false
    if (callbackSecret) {
      const provided = headers['x-dv-signature'] || headers['X-DV-Signature']
      if (provided) {
        const expected = crypto.createHmac(algo, callbackSecret).update(rawBody).digest('hex')
        verified = BorzoProvider.safeEqual(provided, expected)
      }
    } else {
      // No secret configured -> cannot verify. Treat as unverified; the caller
      // decides whether to accept unverified webhooks (not recommended in prod).
      verified = false
    }

    let payload: any = {}
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return { verified, error: 'Invalid webhook body' }
    }

    // Borzo sends order/delivery change notifications; the order object carries
    // the id and status. Shape may vary by event type.
    const order = payload.order || payload
    return {
      verified,
      externalId: order?.order_id != null ? String(order.order_id) : undefined,
      status: BorzoProvider.mapStatus(order?.status),
      rawStatus: order?.status,
      raw: payload,
    }
  }

  private static extractTrackingUrl(order: any): string | undefined {
    const points: any[] = order?.points || []
    // The customer drop-off is the last point; prefer its tracking_url.
    for (let i = points.length - 1; i >= 0; i--) {
      if (points[i]?.tracking_url) return points[i].tracking_url
    }
    return order?.tracking_url || undefined
  }

  private static firstError(data: any): string | undefined {
    if (!data) return undefined
    if (Array.isArray(data.errors) && data.errors.length) return String(data.errors[0])
    if (data.parameter_errors) return JSON.stringify(data.parameter_errors)
    return undefined
  }

  private static safeEqual(a: string, b: string): boolean {
    const ab = Buffer.from(a)
    const bb = Buffer.from(b)
    if (ab.length !== bb.length) return false
    return crypto.timingSafeEqual(ab, bb)
  }
}
