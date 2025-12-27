'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ThemePreset } from '@/lib/theme/types'
import type { Database } from '@/lib/types/database.types'

/**
 * Get theme settings from database
 */
export async function getThemeSettings() {
  const supabase = await createClient()

  const { data: themeSetting } = await (supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'theme')
    .single() as unknown as Promise<{
      data:
        | Pick<
            Database['public']['Tables']['site_settings']['Row'],
            'value'
          >
        | null
    }>)

  const { data: logoFilterSetting } = await (supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'apply_logo_filter')
    .single() as unknown as Promise<{
      data:
        | Pick<
            Database['public']['Tables']['site_settings']['Row'],
            'value'
          >
        | null
    }>)

  return {
    theme: (themeSetting?.value as ThemePreset) || 'baked',
    applyLogoFilter: logoFilterSetting
      ? logoFilterSetting.value === 'true'
      : true,
  }
}

/**
 * Update theme setting (admin only)
 */
export async function updateTheme(theme: ThemePreset) {
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: profile } = await (supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as unknown as Promise<{
      data:
        | Pick<
            Database['public']['Tables']['profiles']['Row'],
            'role'
          >
        | null
    }>)

  if (profile?.role !== 'admin') {
    throw new Error('Only admins can update theme settings')
  }

  // Update or insert theme setting
  const { error } = await (supabase
    .from('site_settings') as any).upsert(
    { key: 'theme', value: theme },
    { onConflict: 'key' }
  )

  if (error) {
    throw new Error(`Failed to update theme: ${error.message}`)
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

/**
 * Update logo filter setting (admin only)
 */
export async function updateLogoFilter(apply: boolean) {
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: profile } = await (supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as unknown as Promise<{
      data:
        | Pick<
            Database['public']['Tables']['profiles']['Row'],
            'role'
          >
        | null
    }>)

  if (profile?.role !== 'admin') {
    throw new Error('Only admins can update theme settings')
  }

  // Update or insert logo filter setting
  const { error } = await (supabase
    .from('site_settings') as any).upsert(
    { key: 'apply_logo_filter', value: apply.toString() },
    { onConflict: 'key' }
  )

  if (error) {
    throw new Error(`Failed to update logo filter setting: ${error.message}`)
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

