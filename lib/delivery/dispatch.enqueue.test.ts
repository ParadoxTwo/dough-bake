import { describe, it, expect, vi } from 'vitest'

// Mutable holder so each test can swap in its own mock admin client.
let mockClient: unknown
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockClient,
}))

import { enqueueCreateDelivery } from './dispatch'

const enabledSettings = {
  data: [
    { key: 'delivery_provider', value: 'borzo' },
    { key: 'delivery_config', value: '{}' },
    { key: 'delivery_enabled', value: 'true' },
  ],
}

// Minimal chainable + thenable Supabase-client stub. Each `from(table)` resolves
// (await / maybeSingle / single) to results[table]; insert is a shared spy.
function makeAdmin(overrides: Record<string, { data: unknown }> = {}) {
  const insert = vi.fn(() => Promise.resolve({ data: null, error: null }))
  const results: Record<string, { data: unknown }> = {
    site_settings: enabledSettings,
    deliveries: { data: null },
    job_queue: { data: [] },
    ...overrides,
  }
  const client = {
    from(table: string) {
      const result = results[table] ?? { data: null }
      const b: Record<string, unknown> = {
        select: () => b,
        update: () => b,
        eq: () => b,
        in: () => b,
        filter: () => b,
        order: () => b,
        limit: () => b,
        insert,
        upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        maybeSingle: () => Promise.resolve(result),
        single: () => Promise.resolve(result),
        then: (resolve: (v: unknown) => unknown) => resolve(result),
      }
      return b
    },
  }
  return { client, insert }
}

describe('enqueueCreateDelivery', () => {
  it('enqueues a create_delivery job when none exists', async () => {
    const { client, insert } = makeAdmin()
    mockClient = client
    await enqueueCreateDelivery('order-1')
    expect(insert).toHaveBeenCalledTimes(1)
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ job_type: 'create_delivery', payload: { orderId: 'order-1' } })
    )
  })

  it('skips when delivery is disabled', async () => {
    const { client, insert } = makeAdmin({
      site_settings: {
        data: [
          { key: 'delivery_provider', value: 'borzo' },
          { key: 'delivery_config', value: '{}' },
          { key: 'delivery_enabled', value: 'false' },
        ],
      },
    })
    mockClient = client
    await enqueueCreateDelivery('order-1')
    expect(insert).not.toHaveBeenCalled()
  })

  it('skips when a delivery already exists for the order', async () => {
    const { client, insert } = makeAdmin({ deliveries: { data: { id: 'd1' } } })
    mockClient = client
    await enqueueCreateDelivery('order-1')
    expect(insert).not.toHaveBeenCalled()
  })

  it('skips when an active job already exists for the order', async () => {
    const { client, insert } = makeAdmin({ job_queue: { data: [{ id: 'j1' }] } })
    mockClient = client
    await enqueueCreateDelivery('order-1')
    expect(insert).not.toHaveBeenCalled()
  })
})
