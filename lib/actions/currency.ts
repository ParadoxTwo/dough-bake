'use server'

import { createClient } from '@/lib/supabase/server'
import { CurrencyCode, CurrencyMode, CurrencySettings } from '@/lib/currency/types'

export async function getCurrencySettings(): Promise<CurrencySettings | null> {
  const supabase = await createClient()

  try {
    // Get currency mode
    const { data: modeData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'currency_mode')
      .single()

    // Get fixed currency
    const { data: fixedCurrencyData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'currency_fixed')
      .single()

    // Get exchange rates (stored as JSON)
    const { data: ratesData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'currency_exchange_rates')
      .single()

    // Get last updated timestamp
    const { data: lastUpdatedData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'currency_last_updated')
      .single()

    const mode = (modeData?.value as CurrencyMode) || 'fixed'
    const fixedCurrency = (fixedCurrencyData?.value as CurrencyCode) || 'INR'
    
    let exchangeRates: Record<string, number> = {}
    try {
      exchangeRates = ratesData?.value ? JSON.parse(ratesData.value) : {}
    } catch (e) {
      console.error('Failed to parse exchange rates:', e)
    }

    const lastUpdated = lastUpdatedData?.value || undefined

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

    if (profile?.role !== 'admin') {
      return { success: false, error: 'Admin access required' }
    }

    // Update currency mode
    const { error: modeError } = await supabase
      .from('site_settings')
      .upsert(
        {
          key: 'currency_mode',
          value: mode,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'key',
        }
      )

    if (modeError) {
      console.error('Failed to update currency_mode:', modeError)
      return { success: false, error: modeError.message }
    }

    // Update fixed currency if provided
    if (fixedCurrency) {
      const { error: fixedError } = await supabase
        .from('site_settings')
        .upsert(
          {
            key: 'currency_fixed',
            value: fixedCurrency,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'key',
          }
        )

      if (fixedError) {
        console.error('Failed to update currency_fixed:', fixedError)
        return { success: false, error: fixedError.message }
      }
    }

    // Update exchange rates if provided
    if (exchangeRates) {
      const { error: ratesError } = await supabase
        .from('site_settings')
        .upsert(
          {
            key: 'currency_exchange_rates',
            value: JSON.stringify(exchangeRates),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'key',
          }
        )

      if (ratesError) {
        console.error('Failed to update currency_exchange_rates:', ratesError)
        return { success: false, error: ratesError.message }
      }

      // Update last updated timestamp
      const { error: updatedError } = await supabase
        .from('site_settings')
        .upsert(
          {
            key: 'currency_last_updated',
            value: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'key',
          }
        )

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

