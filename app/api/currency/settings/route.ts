import { NextResponse } from 'next/server'
import { getCurrencySettings } from '@/lib/actions/currency'

export async function GET() {
  try {
    const settings = await getCurrencySettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching currency settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch currency settings' },
      { status: 500 }
    )
  }
}

