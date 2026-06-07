import { describe, it, expect } from 'vitest'
import { buildConfigIssues, type ConfigStatusInput } from './config-issues'

const allGood: ConfigStatusInput = {
  hasServiceRoleKey: true,
  hasJobsSecret: true,
  hasMapboxToken: true,
  deliveryEnabled: true,
  provider: 'borzo',
  hasProviderAuthToken: true,
  hasPickupAddress: true,
}

const keys = (input: ConfigStatusInput) => buildConfigIssues(input).map((i) => i.key)

describe('buildConfigIssues', () => {
  it('returns no issues when everything is configured', () => {
    expect(buildConfigIssues(allGood)).toEqual([])
  })

  it('flags a missing service role key as a blocking error', () => {
    const issues = buildConfigIssues({ ...allGood, hasServiceRoleKey: false })
    const sr = issues.find((i) => i.key === 'service_role')
    expect(sr?.severity).toBe('error')
  })

  it('flags missing jobs secret and mapbox token as warnings', () => {
    const issues = buildConfigIssues({ ...allGood, hasJobsSecret: false, hasMapboxToken: false })
    expect(issues.find((i) => i.key === 'jobs_secret')?.severity).toBe('warning')
    expect(issues.find((i) => i.key === 'mapbox')?.severity).toBe('warning')
  })

  it('when delivery is disabled, warns but skips provider/pickup checks', () => {
    const result = keys({
      ...allGood,
      deliveryEnabled: false,
      hasProviderAuthToken: false,
      hasPickupAddress: false,
    })
    expect(result).toContain('delivery_disabled')
    expect(result).not.toContain('provider_auth')
    expect(result).not.toContain('pickup')
  })

  it('when enabled, flags missing Borzo token and pickup address as errors', () => {
    const issues = buildConfigIssues({
      ...allGood,
      hasProviderAuthToken: false,
      hasPickupAddress: false,
    })
    expect(issues.find((i) => i.key === 'provider_auth')?.severity).toBe('error')
    expect(issues.find((i) => i.key === 'pickup')?.severity).toBe('error')
  })
})
