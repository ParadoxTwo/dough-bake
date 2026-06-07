import { NextResponse } from 'next/server'
import { DeliveryProviderFactory } from '@/lib/delivery/factory'
import { handleDeliveryWebhook } from '@/lib/delivery/dispatch'
import type { DeliveryProvider } from '@/lib/delivery/types'

export const runtime = 'nodejs'

// Provider status callbacks (e.g. Borzo). The raw body is read before parsing so
// the provider can verify its HMAC signature. /api/* is excluded from the auth
// middleware (see proxy.ts), so these requests are not session-gated.
export async function POST(
  request: Request,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params

  if (!DeliveryProviderFactory.getSupportedProviders().includes(provider as DeliveryProvider)) {
    return NextResponse.json({ error: 'Unknown delivery provider' }, { status: 400 })
  }

  try {
    const rawBody = await request.text()
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value
    })

    const result = await handleDeliveryWebhook(provider as DeliveryProvider, rawBody, headers)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? 'Webhook rejected' },
        { status: result.status ?? 400 }
      )
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
