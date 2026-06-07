export interface ConfigIssue {
  key: string
  severity: 'error' | 'warning'
  label: string
  detail: string
  where: string
}

export interface ConfigStatusInput {
  hasServiceRoleKey: boolean
  hasJobsSecret: boolean
  hasMapboxToken: boolean
  deliveryEnabled: boolean
  provider: string | null
  hasProviderAuthToken: boolean
  hasPickupAddress: boolean
}

/**
 * Pure check that turns the current config posture into a list of actionable
 * issues. Drives the admin setup warning + modal. No I/O so it is easy to test.
 */
export function buildConfigIssues(input: ConfigStatusInput): ConfigIssue[] {
  const issues: ConfigIssue[] = []

  if (!input.hasServiceRoleKey) {
    issues.push({
      key: 'service_role',
      severity: 'error',
      label: 'SUPABASE_SERVICE_ROLE_KEY is not set',
      detail:
        'Delivery dispatch and provider webhooks cannot write to the database, so deliveries are never created or updated.',
      where:
        'Set SUPABASE_SERVICE_ROLE_KEY as a server-only environment variable (e.g. Vercel → Project → Settings → Environment Variables, or .env.local for local dev).',
    })
  }

  if (!input.hasJobsSecret) {
    issues.push({
      key: 'jobs_secret',
      severity: 'warning',
      label: 'JOBS_PROCESS_SECRET is not set',
      detail:
        'The delivery queue drainer (/api/jobs/process) rejects every call, so the scheduled cron cannot process dispatch jobs.',
      where:
        'Set JOBS_PROCESS_SECRET (server env). On Vercel, set CRON_SECRET to the same value so scheduled cron runs are authorized.',
    })
  }

  if (!input.hasMapboxToken) {
    issues.push({
      key: 'mapbox',
      severity: 'warning',
      label: 'NEXT_PUBLIC_MAPBOX_TOKEN is not set',
      detail:
        'The checkout map picker is hidden. Customers can still share their location via the browser or enter coordinates manually.',
      where: 'Set NEXT_PUBLIC_MAPBOX_TOKEN (a public, URL-restricted Mapbox token) in your environment variables.',
    })
  }

  if (!input.deliveryEnabled) {
    issues.push({
      key: 'delivery_disabled',
      severity: 'warning',
      label: 'Delivery is turned off',
      detail: 'Paid orders will not dispatch a courier while delivery is disabled.',
      where: 'Admin dashboard → Delivery Settings → Enable Delivery.',
    })
  } else {
    if (input.provider === 'borzo' && !input.hasProviderAuthToken) {
      issues.push({
        key: 'provider_auth',
        severity: 'error',
        label: 'Borzo auth token is missing',
        detail: 'Delivery is enabled but the provider has no credentials, so dispatch will fail.',
        where: 'Admin dashboard → Delivery Settings → Auth Token.',
      })
    }
    if (!input.hasPickupAddress) {
      issues.push({
        key: 'pickup',
        severity: 'error',
        label: 'Pickup address is not configured',
        detail: 'Delivery is enabled but couriers have no pickup location, so dispatch will fail.',
        where: 'Admin dashboard → Delivery Settings → Pickup Address.',
      })
    }
  }

  return issues
}
