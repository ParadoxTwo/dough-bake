import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database, Json } from '@/lib/types/database.types'
import { DeliveryProviderFactory } from './factory'
import {
  DeliveryStatus,
  type DeliveryConfig,
  type DeliveryProvider,
  type DeliveryAddress,
  type DeliveryCreateResponse,
} from './types'

type JobRow = Database['public']['Tables']['job_queue']['Row']
type DeliveryInsert = Database['public']['Tables']['deliveries']['Insert']
type CustomerRow = Database['public']['Tables']['customers']['Row']

const BATCH_SIZE = 10

// The hand-written Database type does not satisfy the supabase-js generic
// inference (the rest of the codebase casts around this); use a loosely-typed
// admin client and cast read results to explicit row types.
function adminDb(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient
}

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested) — no I/O.
// ---------------------------------------------------------------------------

/** Build a drop-off address from a customer record. */
export function buildDropoffAddress(
  customer: Pick<CustomerRow, 'name' | 'phone' | 'address' | 'city' | 'state' | 'postal_code'>
): DeliveryAddress {
  const address = [customer.address, customer.city, customer.state, customer.postal_code]
    .filter((part): part is string => Boolean(part))
    .join(', ')

  return {
    address,
    contactName: customer.name,
    contactPhone: customer.phone ?? '',
  }
}

/** Map a provider's createDelivery response onto a `deliveries` row. */
export function mapResultToDeliveryRow(
  orderId: string,
  provider: DeliveryProvider,
  result: DeliveryCreateResponse
): DeliveryInsert {
  return {
    order_id: orderId,
    provider,
    external_id: result.externalId ?? null,
    status: result.success ? result.status ?? DeliveryStatus.CREATED : DeliveryStatus.FAILED,
    tracking_url: result.trackingUrl ?? null,
    fee: result.fee ?? null,
    raw: (result.raw ?? null) as Json,
  }
}

// ---------------------------------------------------------------------------
// Settings (read with the admin client so this works without a user session).
// ---------------------------------------------------------------------------

async function readDeliveryConfig(db: SupabaseClient): Promise<DeliveryConfig | null> {
  const { data } = await db
    .from('site_settings')
    .select('key, value')
    .in('key', ['delivery_provider', 'delivery_config', 'delivery_enabled'])

  const rows = (data ?? []) as { key: string; value: string }[]
  if (rows.length === 0) return null
  const map = new Map(rows.map((row) => [row.key, row.value]))

  const provider = map.get('delivery_provider')
  if (!provider) return null

  let config: Record<string, unknown> = {}
  try {
    const raw = map.get('delivery_config')
    config = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
  } catch {
    config = {}
  }

  return {
    provider: provider as DeliveryProvider,
    config,
    enabled: map.get('delivery_enabled') === 'true',
  }
}

/** Read the configured bakery pickup address, or null if not fully configured. */
export async function getPickupAddress(): Promise<DeliveryAddress | null> {
  const { data } = await adminDb()
    .from('site_settings')
    .select('value')
    .eq('key', 'delivery_pickup')
    .maybeSingle()

  const value = (data as { value: string } | null)?.value
  if (!value) return null
  try {
    const p = JSON.parse(value) as Partial<DeliveryAddress>
    if (!p.address || !p.contactName || !p.contactPhone) return null
    return {
      address: p.address,
      lat: typeof p.lat === 'number' ? p.lat : undefined,
      lng: typeof p.lng === 'number' ? p.lng : undefined,
      contactName: p.contactName,
      contactPhone: p.contactPhone,
      note: p.note,
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Enqueue + process.
// ---------------------------------------------------------------------------

/**
 * Enqueue a create_delivery job for an order, unless delivery is disabled or a
 * delivery / active job already exists for it (idempotency).
 */
export async function enqueueCreateDelivery(orderId: string): Promise<void> {
  const db = adminDb()

  const config = await readDeliveryConfig(db)
  if (!config || !config.enabled) return

  // Idempotency: a delivery already exists for this order.
  const { data: existingDelivery } = await db
    .from('deliveries')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle()
  if (existingDelivery) return

  // Idempotency: an active job already exists for this order.
  const { data: activeJobs } = await db
    .from('job_queue')
    .select('id')
    .eq('job_type', 'create_delivery')
    .in('status', ['pending', 'processing'])
    .filter('payload->>orderId', 'eq', orderId)
  if (activeJobs && activeJobs.length > 0) return

  await db.from('job_queue').insert({
    job_type: 'create_delivery',
    status: 'pending',
    payload: { orderId },
  })
}

/** Create the delivery with the provider and upsert the deliveries row. */
export async function processCreateDelivery(job: Pick<JobRow, 'payload'>): Promise<void> {
  const db = adminDb()
  const orderId = (job.payload as { orderId?: string } | null)?.orderId
  if (!orderId) throw new Error('create_delivery job is missing orderId')

  // Idempotency: already dispatched to the provider.
  const { data: existing } = await db
    .from('deliveries')
    .select('external_id')
    .eq('order_id', orderId)
    .maybeSingle()
  if ((existing as { external_id: string | null } | null)?.external_id) return

  const config = await readDeliveryConfig(db)
  if (!config || !config.enabled) throw new Error('Delivery is not configured or enabled')

  const pickup = await getPickupAddress()
  if (!pickup) throw new Error('Pickup address is not configured (site_settings.delivery_pickup)')

  const { data: orderData } = await db
    .from('orders')
    .select('id, customer_id')
    .eq('id', orderId)
    .single()
  const order = orderData as { id: string; customer_id: string } | null
  if (!order) throw new Error('Order not found')

  const { data: customerData } = await db
    .from('customers')
    .select('name, phone, address, city, state, postal_code')
    .eq('id', order.customer_id)
    .single()
  const customer = customerData as Pick<
    CustomerRow,
    'name' | 'phone' | 'address' | 'city' | 'state' | 'postal_code'
  > | null
  if (!customer) throw new Error('Customer not found')
  if (!customer.phone) throw new Error('Customer phone number is required for delivery')

  const provider = DeliveryProviderFactory.createProvider(config)
  const result = await provider.createDelivery({
    orderId,
    pickup,
    dropoff: buildDropoffAddress(customer),
    matter: `Bakery order ${orderId}`,
  })

  const row = mapResultToDeliveryRow(orderId, config.provider, result)
  const { error } = await db.from('deliveries').upsert(row, { onConflict: 'order_id' })
  if (error) throw new Error(error.message)

  if (!result.success) {
    throw new Error(result.error || 'Provider failed to create the delivery')
  }
}

/**
 * Drain pending create_delivery jobs. Claims each job optimistically, processes
 * it, and on failure re-queues until max_attempts is exhausted (then marks it
 * failed). Returns counts for observability.
 */
export async function processPendingDeliveryJobs(): Promise<{ processed: number; failed: number }> {
  const db = adminDb()
  const { data, error } = await db
    .from('job_queue')
    .select('*')
    .eq('job_type', 'create_delivery')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)
  if (error) throw new Error(error.message)

  const jobs = (data ?? []) as JobRow[]
  let processed = 0
  let failed = 0

  for (const job of jobs) {
    const attempts = job.attempts + 1

    // Claim optimistically: only succeeds if the row is still pending.
    const { data: claimed } = await db
      .from('job_queue')
      .update({ status: 'processing', started_at: new Date().toISOString(), attempts })
      .eq('id', job.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle()
    if (!claimed) continue

    try {
      await processCreateDelivery(job)
      await db
        .from('job_queue')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', job.id)
      processed++
    } catch (err) {
      const exhausted = attempts >= job.max_attempts
      await db
        .from('job_queue')
        .update({
          status: exhausted ? 'failed' : 'pending',
          error_message: err instanceof Error ? err.message : String(err),
        })
        .eq('id', job.id)
      failed++
    }
  }

  return { processed, failed }
}

/**
 * Best-effort, non-blocking trigger of the queue drainer for low-latency
 * dispatch. The Vercel cron is the reliability backstop, so failures here are
 * intentionally swallowed.
 */
export function kickJobProcessor(): void {
  const base = process.env.NEXT_PUBLIC_SITE_URL
  const secret = process.env.JOBS_PROCESS_SECRET
  if (!base || !secret) return

  void fetch(`${base}/api/jobs/process`, {
    method: 'POST',
    headers: { authorization: `Bearer ${secret}` },
  }).catch(() => {})
}
