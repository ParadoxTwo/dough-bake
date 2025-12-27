import { NextResponse } from 'next/server'
import { updateCurrencySettings } from '@/lib/actions/currency'
import type { CurrencyMode, CurrencyCode } from '@/lib/currency/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { mode, fixedCurrency, exchangeRates } = body as {
      mode: string
      fixedCurrency?: string
      exchangeRates?: Record<string, number>
    }

    if (!mode || (mode !== 'fixed' && mode !== 'regional')) {
      return NextResponse.json(
        { success: false, error: 'Invalid mode' },
        { status: 400 }
      )
    }

    const result = await updateCurrencySettings(
      mode as CurrencyMode,
      fixedCurrency as CurrencyCode | undefined,
      exchangeRates
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to update currency settings' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in /api/currency/update:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}


