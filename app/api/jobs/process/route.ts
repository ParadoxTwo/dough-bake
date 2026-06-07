import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { processPendingDeliveryJobs } from '@/lib/delivery/dispatch'

export const runtime = 'nodejs'

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

// Secret-guarded queue drainer. Triggered by Vercel Cron (sends
// `Authorization: Bearer ${CRON_SECRET}`) and by the in-app low-latency kick
// (sends `Authorization: Bearer ${JOBS_PROCESS_SECRET}`).
function isAuthorized(request: Request): boolean {
  const secret = process.env.JOBS_PROCESS_SECRET ?? process.env.CRON_SECRET
  if (!secret) return false

  const header = request.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : header
  return safeEqual(token, secret)
}

async function handle(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await processPendingDeliveryJobs()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Job processing failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return handle(request)
}

export async function POST(request: Request) {
  return handle(request)
}
