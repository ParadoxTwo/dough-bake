import { describe, it, expect, vi, beforeEach } from 'vitest'

const { handleDeliveryWebhook } = vi.hoisted(() => ({ handleDeliveryWebhook: vi.fn() }))
vi.mock('@/lib/delivery/dispatch', () => ({ handleDeliveryWebhook }))

import { POST } from './route'

function call(provider: string, headers: Record<string, string> = {}, body = '{}') {
  const request = new Request(`http://localhost/api/delivery/webhook/${provider}`, {
    method: 'POST',
    headers,
    body,
  })
  return POST(request, { params: Promise.resolve({ provider }) })
}

describe('delivery webhook route', () => {
  beforeEach(() => handleDeliveryWebhook.mockReset())

  it('returns 400 for an unknown provider without calling the handler', async () => {
    const res = await call('unknown')
    expect(res.status).toBe(400)
    expect(handleDeliveryWebhook).not.toHaveBeenCalled()
  })

  it('passes the raw body and lowercased headers, returning 200 on success', async () => {
    handleDeliveryWebhook.mockResolvedValueOnce({ ok: true, verified: true })
    const res = await call('borzo', { 'X-DV-Signature': 'sig' }, '{"order":{}}')
    expect(res.status).toBe(200)
    expect(handleDeliveryWebhook).toHaveBeenCalledWith(
      'borzo',
      '{"order":{}}',
      expect.objectContaining({ 'x-dv-signature': 'sig' })
    )
  })

  it('propagates the rejection status from the handler', async () => {
    handleDeliveryWebhook.mockResolvedValueOnce({
      ok: false,
      verified: false,
      status: 401,
      error: 'bad sig',
    })
    const res = await call('borzo', {}, '{}')
    expect(res.status).toBe(401)
  })
})
