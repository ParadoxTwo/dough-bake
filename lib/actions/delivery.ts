'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database.types'
import type { DeliveryProvider, DeliveryConfig, DeliveryPickup } from '@/lib/delivery/types'
import { DeliveryProviderFactory } from '@/lib/delivery/factory'
import { enqueueCreateDelivery } from '@/lib/delivery/dispatch'
import { getCachedAdminStatus } from '@/lib/utils/query-optimization'

type SiteSettingsInsert = Database['public']['Tables']['site_settings']['Insert']

/**
 * Read the active delivery provider configuration from site_settings.
 * Mirrors getPaymentSettings().
 */
export async function getDeliverySettings(): Promise<DeliveryConfig | null> {
  const supabase = await createClient()

  try {
    const [providerResult, configResult, enabledResult] = await Promise.all([
      supabase.from('site_settings').select('value').eq('key', 'delivery_provider').single(),
      supabase.from('site_settings').select('value').eq('key', 'delivery_config').single(),
      supabase.from('site_settings').select('value').eq('key', 'delivery_enabled').single(),
    ])

    const typedProviderData = providerResult.data as { value: string } | null
    const typedConfigData = configResult.data as { value: string } | null
    const typedEnabledData = enabledResult.data as { value: string } | null

    if (!typedProviderData?.value) {
      return null
    }

    let config: Record<string, any> = {}
    try {
      config = typedConfigData?.value ? JSON.parse(typedConfigData.value) : {}
    } catch (e) {
      console.error('Failed to parse delivery config:', e)
    }

    const enabled = typedEnabledData?.value === 'true' || false

    return {
      provider: typedProviderData.value as DeliveryProvider,
      config,
      enabled,
    }
  } catch (error) {
    console.error('Error fetching delivery settings:', error)
    return null
  }
}

/**
 * Update the active delivery provider configuration. Admin only.
 * Mirrors updatePaymentSettings().
 */
export async function updateDeliverySettings(
  provider: DeliveryProvider,
  config: Record<string, any>,
  enabled: boolean = true
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const isAdmin = await getCachedAdminStatus()
    if (!isAdmin) {
      return { success: false, error: 'Admin access required' }
    }

    const siteSettingsQuery = supabase.from('site_settings') as unknown as {
      upsert: (
        values: SiteSettingsInsert,
        options?: { onConflict?: string }
      ) => Promise<{ error: { message: string } | null }>
    }

    const updates: SiteSettingsInsert[] = [
      { key: 'delivery_provider', value: provider, updated_at: new Date().toISOString() },
      { key: 'delivery_config', value: JSON.stringify(config), updated_at: new Date().toISOString() },
      { key: 'delivery_enabled', value: enabled.toString(), updated_at: new Date().toISOString() },
    ]

    for (const update of updates) {
      const { error } = await siteSettingsQuery.upsert(update, { onConflict: 'key' })
      if (error) {
        console.error(`Failed to update ${update.key}:`, error)
        return { success: false, error: error.message }
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error updating delivery settings:', error)
    return { success: false, error: error.message || 'Failed to update delivery settings' }
  }
}

/**
 * Client-callable action that enqueues a delivery for an order the caller owns.
 * Used by the checkout no-payment branch. Ownership is enforced via RLS (the
 * caller can only see their own orders) before the privileged enqueue runs.
 */
export async function enqueueDeliveryForOrder(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: order } = await supabase
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .single()
  if (!order) return { success: false, error: 'Order not found' }

  try {
    await enqueueCreateDelivery(orderId)
    return { success: true }
  } catch (error: any) {
    console.error('Failed to enqueue delivery:', error)
    return { success: false, error: error.message || 'Failed to enqueue delivery' }
  }
}

/** Read the bakery pickup address from site_settings.delivery_pickup. */
export async function getDeliveryPickup(): Promise<Partial<DeliveryPickup> | null> {
  const supabase = await createClient()

  try {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'delivery_pickup')
      .single()

    const value = (data as { value: string } | null)?.value
    if (!value) return null
    return JSON.parse(value) as Partial<DeliveryPickup>
  } catch (error) {
    console.error('Error fetching delivery pickup address:', error)
    return null
  }
}

/** Update the bakery pickup address. Admin only. */
export async function updateDeliveryPickup(
  pickup: Partial<DeliveryPickup>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const isAdmin = await getCachedAdminStatus()
    if (!isAdmin) {
      return { success: false, error: 'Admin access required' }
    }

    const insert: SiteSettingsInsert = {
      key: 'delivery_pickup',
      value: JSON.stringify(pickup),
      updated_at: new Date().toISOString(),
    }

    const siteSettingsQuery = supabase.from('site_settings') as unknown as {
      upsert: (
        values: SiteSettingsInsert,
        options?: { onConflict?: string }
      ) => Promise<{ error: { message: string } | null }>
    }

    const { error } = await siteSettingsQuery.upsert(insert, { onConflict: 'key' })
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error: any) {
    console.error('Error updating delivery pickup address:', error)
    return { success: false, error: error.message || 'Failed to update pickup address' }
  }
}

/** Cancel the delivery for an order with the provider, then mark it cancelled. Admin only. */
export async function cancelDelivery(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const isAdmin = await getCachedAdminStatus()
    if (!isAdmin) {
      return { success: false, error: 'Admin access required' }
    }

    const { data } = await supabase
      .from('deliveries')
      .select('external_id, provider')
      .eq('order_id', orderId)
      .maybeSingle()
    const delivery = data as { external_id: string | null; provider: string } | null
    if (!delivery) return { success: false, error: 'No delivery found for this order' }
    if (!delivery.external_id) {
      return { success: false, error: 'Delivery has not been dispatched to the provider yet' }
    }

    const settings = await getDeliverySettings()
    if (!settings) return { success: false, error: 'Delivery is not configured' }

    const provider = DeliveryProviderFactory.createProvider({ ...settings, enabled: true })
    const result = await provider.cancelDelivery(delivery.external_id)
    if (!result.success) {
      return { success: false, error: result.error || 'Provider failed to cancel the delivery' }
    }

    const update = { status: 'cancelled', updated_at: new Date().toISOString() }
    const deliveriesQuery = supabase.from('deliveries') as unknown as {
      update: (values: typeof update) => {
        eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
      }
    }
    await deliveriesQuery.update(update).eq('order_id', orderId)

    return { success: true }
  } catch (error: any) {
    console.error('Error cancelling delivery:', error)
    return { success: false, error: error.message || 'Failed to cancel delivery' }
  }
}
