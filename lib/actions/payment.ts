'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database.types'
import type { PaymentProvider, PaymentConfig } from '@/lib/payment/types'
import { getCachedAdminStatus } from '@/lib/utils/query-optimization'

type SiteSettingsInsert = Database['public']['Tables']['site_settings']['Insert']

export async function getPaymentSettings(): Promise<PaymentConfig | null> {
  const supabase = await createClient()

  try {
    // Fetch all payment settings in parallel
    const [providerResult, configResult, enabledResult] = await Promise.all([
      supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'payment_provider')
        .single(),
      supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'payment_config')
        .single(),
      supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'payment_enabled')
        .single(),
    ])

    const { data: providerData } = providerResult
    const { data: configData } = configResult
    const { data: enabledData } = enabledResult

    const typedProviderData = providerData as { value: string } | null
    const typedConfigData = configData as { value: string } | null
    const typedEnabledData = enabledData as { value: string } | null

    if (!typedProviderData?.value) {
      return null
    }

    let config: Record<string, any> = {}
    try {
      config = typedConfigData?.value ? JSON.parse(typedConfigData.value) : {}
    } catch (e) {
      console.error('Failed to parse payment config:', e)
    }

    const enabled = typedEnabledData?.value === 'true' || false

    return {
      provider: typedProviderData.value as PaymentProvider,
      config,
      enabled,
    }
  } catch (error) {
    console.error('Error fetching payment settings:', error)
    return null
  }
}

export async function updatePaymentSettings(
  provider: PaymentProvider,
  config: Record<string, any>,
  enabled: boolean = true
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    // Verify admin access using cached check
    const isAdmin = await getCachedAdminStatus()
    if (!isAdmin) {
      return { success: false, error: 'Admin access required' }
    }

    // Update payment provider
    const providerInsert: SiteSettingsInsert = {
      key: 'payment_provider',
      value: provider,
      updated_at: new Date().toISOString(),
    }
    
    const siteSettingsQuery = supabase.from('site_settings') as unknown as {
      upsert: (
        values: SiteSettingsInsert,
        options?: { onConflict?: string }
      ) => Promise<{ error: { message: string } | null }>
    }
    
    const { error: providerError } = await siteSettingsQuery.upsert(providerInsert, {
      onConflict: 'key',
    })

    if (providerError) {
      console.error('Failed to update payment_provider:', providerError)
      return { success: false, error: providerError.message }
    }

    // Update payment config
    const configInsert: SiteSettingsInsert = {
      key: 'payment_config',
      value: JSON.stringify(config),
      updated_at: new Date().toISOString(),
    }
    
    const { error: configError } = await siteSettingsQuery.upsert(configInsert, {
      onConflict: 'key',
    })

    if (configError) {
      console.error('Failed to update payment_config:', configError)
      return { success: false, error: configError.message }
    }

    // Update payment enabled status
    const enabledInsert: SiteSettingsInsert = {
      key: 'payment_enabled',
      value: enabled.toString(),
      updated_at: new Date().toISOString(),
    }
    
    const { error: enabledError } = await siteSettingsQuery.upsert(enabledInsert, {
      onConflict: 'key',
    })

    if (enabledError) {
      console.error('Failed to update payment_enabled:', enabledError)
      return { success: false, error: enabledError.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error updating payment settings:', error)
    return { success: false, error: error.message || 'Failed to update payment settings' }
  }
}

