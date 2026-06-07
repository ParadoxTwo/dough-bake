'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database.types'
import type { DeliveryProvider, DeliveryConfig } from '@/lib/delivery/types'
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
