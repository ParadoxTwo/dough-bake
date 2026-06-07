import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/delivery/dispatch', () => ({
  processPendingDeliveryJobs: vi.fn(() => Promise.resolve({ processed: 2, failed: 0 })),
}))

import { GET, POST } from './route'

function req(headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/jobs/process', { method: 'POST', headers })
}

describe('/api/jobs/process authorization', () => {
  const original = { ...process.env }

  beforeEach(() => {
    delete process.env.JOBS_PROCESS_SECRET
    delete process.env.CRON_SECRET
  })
  afterEach(() => {
    process.env = { ...original }
  })

  it('returns 401 when no secret is configured', async () => {
    const res = await POST(req({ authorization: 'Bearer anything' }))
    expect(res.status).toBe(401)
  })

  it('returns 401 with a wrong bearer token', async () => {
    process.env.JOBS_PROCESS_SECRET = 'sek'
    const res = await POST(req({ authorization: 'Bearer nope' }))
    expect(res.status).toBe(401)
  })

  it('returns 200 with the correct bearer token', async () => {
    process.env.JOBS_PROCESS_SECRET = 'sek'
    const res = await POST(req({ authorization: 'Bearer sek' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true, processed: 2 })
  })

  it('accepts the CRON_SECRET fallback', async () => {
    process.env.CRON_SECRET = 'cron'
    const res = await GET(req({ authorization: 'Bearer cron' }))
    expect(res.status).toBe(200)
  })
})
