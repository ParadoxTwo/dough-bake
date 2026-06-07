import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getCachedAdminStatus } = vi.hoisted(() => ({ getCachedAdminStatus: vi.fn() }))
const { getDeliverySettings, getDeliveryPickup } = vi.hoisted(() => ({
  getDeliverySettings: vi.fn(),
  getDeliveryPickup: vi.fn(),
}))

vi.mock('@/lib/utils/query-optimization', () => ({ getCachedAdminStatus }))
vi.mock('@/lib/actions/delivery', () => ({ getDeliverySettings, getDeliveryPickup }))

import { getDeliveryConfigStatus } from './config-status'

describe('getDeliveryConfigStatus', () => {
  beforeEach(() => {
    getCachedAdminStatus.mockReset()
    getDeliverySettings.mockReset()
    getDeliveryPickup.mockReset()
  })

  it('returns ok with no issues for non-admins (no config leak)', async () => {
    getCachedAdminStatus.mockResolvedValue(false)
    expect(await getDeliveryConfigStatus()).toEqual({ ok: true, issues: [] })
  })

  it('never throws — returns ok:true on an internal error', async () => {
    getCachedAdminStatus.mockRejectedValue(new Error('boom'))
    expect(await getDeliveryConfigStatus()).toEqual({ ok: true, issues: [] })
  })

  it('reports issues for an admin with missing config', async () => {
    getCachedAdminStatus.mockResolvedValue(true)
    getDeliverySettings.mockResolvedValue({ provider: 'borzo', enabled: false, config: {} })
    getDeliveryPickup.mockResolvedValue(null)

    const prev = process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    const result = await getDeliveryConfigStatus()
    if (prev !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = prev

    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.key === 'service_role')).toBe(true)
  })
})
