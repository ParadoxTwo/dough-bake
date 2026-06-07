import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DeliveryStatus } from './types'

let mockClient: unknown
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => mockClient }))

const handleWebhook = vi.fn()
vi.mock('./factory', () => ({
  DeliveryProviderFactory: {
    createProvider: () => ({ handleWebhook, getProviderName: () => 'borzo' }),
    getSupportedProviders: () => ['borzo', 'porter'],
  },
}))

import { handleDeliveryWebhook } from './dispatch'

const configRows = {
  data: [
    { key: 'delivery_provider', value: 'borzo' },
    { key: 'delivery_config', value: JSON.stringify({ callbackSecret: 's' }) },
    { key: 'delivery_enabled', value: 'true' },
  ],
}

function makeAdmin(
  results: Record<string, { data: unknown }>,
  updateSpies: Record<string, (...args: unknown[]) => void> = {}
) {
  return {
    from(table: string) {
      const result = results[table] ?? { data: null }
      const updateSpy = updateSpies[table]
      const b: Record<string, unknown> = {
        select: () => b,
        update: (...args: unknown[]) => {
          updateSpy?.(...args)
          return b
        },
        insert: () => b,
        upsert: () => b,
        eq: () => b,
        in: () => b,
        filter: () => b,
        order: () => b,
        limit: () => b,
        maybeSingle: () => Promise.resolve(result),
        single: () => Promise.resolve(result),
        then: (resolve: (v: unknown) => unknown) => resolve(result),
      }
      return b
    },
  }
}

describe('handleDeliveryWebhook', () => {
  beforeEach(() => handleWebhook.mockReset())

  it('rejects an unverified webhook with 401 when a callback secret is configured', async () => {
    handleWebhook.mockReturnValue({
      verified: false,
      externalId: 'BZ1',
      status: DeliveryStatus.IN_TRANSIT,
    })
    const deliveriesUpdate = vi.fn()
    mockClient = makeAdmin(
      { site_settings: configRows, deliveries: { data: { order_id: 'o1' } } },
      { deliveries: deliveriesUpdate }
    )

    const res = await handleDeliveryWebhook('borzo', '{}', {})
    expect(res).toMatchObject({ ok: false, status: 401 })
    expect(deliveriesUpdate).not.toHaveBeenCalled()
  })

  it('marks the order completed on a verified delivered webhook', async () => {
    handleWebhook.mockReturnValue({
      verified: true,
      externalId: 'BZ1',
      status: DeliveryStatus.DELIVERED,
    })
    const ordersUpdate = vi.fn()
    mockClient = makeAdmin(
      { site_settings: configRows, deliveries: { data: { order_id: 'o1' } } },
      { orders: ordersUpdate }
    )

    const res = await handleDeliveryWebhook('borzo', '{}', {})
    expect(res).toMatchObject({ ok: true, verified: true })
    expect(ordersUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }))
  })

  it('rejects when the named provider is not the active one', async () => {
    mockClient = makeAdmin({ site_settings: configRows })
    const res = await handleDeliveryWebhook('porter', '{}', {})
    expect(res).toMatchObject({ ok: false, status: 400 })
    expect(handleWebhook).not.toHaveBeenCalled()
  })
})
