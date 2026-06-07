'use server'

import { getCachedAdminStatus } from '@/lib/utils/query-optimization'
import { getDeliverySettings, getDeliveryPickup } from './delivery'
import { buildConfigIssues, type ConfigIssue } from '@/lib/delivery/config-issues'

/**
 * Admin-only report of missing/incomplete delivery configuration. Never throws —
 * returns an empty list on any failure so callers can render safely.
 */
export async function getDeliveryConfigStatus(): Promise<{ ok: boolean; issues: ConfigIssue[] }> {
  try {
    const isAdmin = await getCachedAdminStatus()
    if (!isAdmin) return { ok: true, issues: [] }

    const settings = await getDeliverySettings()
    const pickup = await getDeliveryPickup()
    const config = (settings?.config ?? {}) as { authToken?: string }

    const issues = buildConfigIssues({
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasJobsSecret: Boolean(process.env.JOBS_PROCESS_SECRET || process.env.CRON_SECRET),
      hasMapboxToken: Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN),
      deliveryEnabled: Boolean(settings?.enabled),
      provider: settings?.provider ?? null,
      hasProviderAuthToken: Boolean(config.authToken),
      hasPickupAddress: Boolean(pickup && pickup.address && pickup.contactPhone),
    })

    return { ok: issues.length === 0, issues }
  } catch (error) {
    console.error('Failed to compute delivery config status:', error)
    return { ok: true, issues: [] }
  }
}
