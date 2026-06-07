import { describe, it, expect } from 'vitest'
import { buildDropoffAddress, mapResultToDeliveryRow } from './dispatch'
import { DeliveryStatus } from './types'

describe('buildDropoffAddress', () => {
  it('joins present address parts and carries customer contact', () => {
    const addr = buildDropoffAddress({
      name: 'Asha',
      phone: '9000000000',
      address: '12 Baker St',
      city: 'Pune',
      state: 'MH',
      postal_code: '411001',
    })
    expect(addr.address).toBe('12 Baker St, Pune, MH, 411001')
    expect(addr.contactName).toBe('Asha')
    expect(addr.contactPhone).toBe('9000000000')
  })

  it('omits missing parts and defaults a null phone to empty string', () => {
    const addr = buildDropoffAddress({
      name: 'Asha',
      phone: null,
      address: '12 Baker St',
      city: null,
      state: null,
      postal_code: '411001',
    })
    expect(addr.address).toBe('12 Baker St, 411001')
    expect(addr.contactPhone).toBe('')
  })
})

describe('mapResultToDeliveryRow', () => {
  it('maps a successful provider result', () => {
    const row = mapResultToDeliveryRow('order-1', 'borzo', {
      success: true,
      externalId: 'BZ1',
      status: DeliveryStatus.CREATED,
      trackingUrl: 'https://track',
      fee: 80,
    })
    expect(row).toMatchObject({
      order_id: 'order-1',
      provider: 'borzo',
      external_id: 'BZ1',
      status: DeliveryStatus.CREATED,
      tracking_url: 'https://track',
      fee: 80,
    })
  })

  it('marks the row failed when the provider fails', () => {
    const row = mapResultToDeliveryRow('order-1', 'borzo', { success: false, error: 'nope' })
    expect(row.status).toBe(DeliveryStatus.FAILED)
    expect(row.external_id).toBeNull()
    expect(row.fee).toBeNull()
  })
})
