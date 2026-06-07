import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import { BorzoProvider } from './borzo'
import { DeliveryStatus } from '../types'

function sign(body: string, secret: string, algo = 'sha1'): string {
  return crypto.createHmac(algo, secret).update(body).digest('hex')
}

describe('BorzoProvider.handleWebhook', () => {
  const secret = 'cb-secret'
  const provider = new BorzoProvider({ authToken: 'tok', callbackSecret: secret })

  it('verifies a correctly signed webhook and maps the status', () => {
    const body = JSON.stringify({ order: { order_id: 123, status: 'completed' } })
    const res = provider.handleWebhook(body, { 'x-dv-signature': sign(body, secret) })
    expect(res.verified).toBe(true)
    expect(res.externalId).toBe('123')
    expect(res.status).toBe(DeliveryStatus.DELIVERED)
  })

  it('rejects a tampered signature', () => {
    const body = JSON.stringify({ order: { order_id: 1, status: 'active' } })
    const res = provider.handleWebhook(body, { 'x-dv-signature': 'deadbeef' })
    expect(res.verified).toBe(false)
  })

  it('is unverified when no callback secret is configured', () => {
    const noSecret = new BorzoProvider({ authToken: 'tok' })
    const body = JSON.stringify({ order: { order_id: 1, status: 'new' } })
    const res = noSecret.handleWebhook(body, { 'x-dv-signature': 'whatever' })
    expect(res.verified).toBe(false)
  })

  it('reports an error on an invalid JSON body', () => {
    const body = 'not-json'
    const res = provider.handleWebhook(body, { 'x-dv-signature': sign(body, secret) })
    expect(res.error).toBeDefined()
  })
})
