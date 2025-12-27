'use server'

import { createClient } from '@/lib/supabase/server'
import { CurrencyCode, CurrencyMode, CurrencySettings } from '@/lib/currency/types'
import type { Database } from '@/lib/types/database.types'

type SiteSettingsInsert = Database['public']['Tables']['site_settings']['Insert']

export async function getCurrencySettings(): Promise<CurrencySettings | null> {
  const supabase = await createClient()

  try {
    // Get currency mode
    const { data: modeData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'currency_mode')
      .single()
    
    const typedModeData = modeData as { value: string } | null

    // Get fixed currency
    const { data: fixedCurrencyData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'currency_fixed')
      .single()
    
    const typedFixedCurrencyData = fixedCurrencyData as { value: string } | null

    // Get exchange rates (stored as JSON)
    const { data: ratesData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'currency_exchange_rates')
      .single()
    
    const typedRatesData = ratesData as { value: string } | null

    // Get last updated timestamp
    const { data: lastUpdatedData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'currency_last_updated')
      .single()
    
    const typedLastUpdatedData = lastUpdatedData as { value: string } | null

    const mode = (typedModeData?.value as CurrencyMode) || 'fixed'
    const fixedCurrency = (typedFixedCurrencyData?.value as CurrencyCode) || 'INR'
    
    let exchangeRates: Record<string, number> = {}
    try {
      exchangeRates = typedRatesData?.value ? JSON.parse(typedRatesData.value) : {}
    } catch (e) {
      console.error('Failed to parse exchange rates:', e)
    }

    const lastUpdated = typedLastUpdatedData?.value || undefined

    return {
      mode,
      fixedCurrency,
      exchangeRates,
      lastUpdated,
    }
  } catch (error) {
    console.error('Error fetching currency settings:', error)
    return null
  }
}

export async function updateCurrencySettings(
  mode: CurrencyMode,
  fixedCurrency?: CurrencyCode,
  exchangeRates?: Record<string, number>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    const typedProfile = profile as { role: 'customer' | 'admin' } | null

    if (typedProfile?.role !== 'admin') {
      return { success: false, error: 'Admin access required' }
    }

    // Update currency mode
    const modeInsert: SiteSettingsInsert = {
      key: 'currency_mode',
      value: mode,
      updated_at: new Date().toISOString(),
    }
    
    const siteSettingsQuery = supabase.from('site_settings') as unknown as {
      upsert: (
        values: SiteSettingsInsert,
        options?: { onConflict?: string }
      ) => Promise<{ error: { message: string } | null }>
    }
    
    const { error: modeError } = await siteSettingsQuery.upsert(modeInsert, {
      onConflict: 'key',
    })

    if (modeError) {
      console.error('Failed to update currency_mode:', modeError)
      return { success: false, error: modeError.message }
    }

    // Update fixed currency if provided
    if (fixedCurrency) {
      const fixedInsert: SiteSettingsInsert = {
        key: 'currency_fixed',
        value: fixedCurrency,
        updated_at: new Date().toISOString(),
      }
      
      const { error: fixedError } = await siteSettingsQuery.upsert(fixedInsert, {
        onConflict: 'key',
      })

      if (fixedError) {
        console.error('Failed to update currency_fixed:', fixedError)
        return { success: false, error: fixedError.message }
      }
    }

    // Update exchange rates if provided
    if (exchangeRates) {
      const ratesInsert: SiteSettingsInsert = {
        key: 'currency_exchange_rates',
        value: JSON.stringify(exchangeRates),
        updated_at: new Date().toISOString(),
      }
      
      const { error: ratesError } = await siteSettingsQuery.upsert(ratesInsert, {
        onConflict: 'key',
      })

      if (ratesError) {
        console.error('Failed to update currency_exchange_rates:', ratesError)
        return { success: false, error: ratesError.message }
      }

      // Update last updated timestamp
      const lastUpdatedInsert: SiteSettingsInsert = {
        key: 'currency_last_updated',
        value: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      const { error: updatedError } = await siteSettingsQuery.upsert(lastUpdatedInsert, {
        onConflict: 'key',
      })

      if (updatedError) {
        console.error('Failed to update currency_last_updated:', updatedError)
        return { success: false, error: updatedError.message }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating currency settings:', error)
    return { success: false, error: 'Failed to update currency settings' }
  }
}

