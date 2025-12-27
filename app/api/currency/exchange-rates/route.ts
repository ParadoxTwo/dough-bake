import { NextResponse } from 'next/server'

/**
 * Fetch exchange rates from a free API
 * Using exchangerate-api.com free tier (no API key required for basic usage)
 * Alternative: You can use fixer.io, currencylayer.com, or any other free service
 */
export async function GET() {
  try {
    // Using exchangerate-api.com (free, no API key needed for INR base)
    // Base currency is INR
    const response = await fetch(
      'https://api.exchangerate-api.com/v4/latest/INR',
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates')
    }

    const data = await response.json()

    // Extract only the currencies we need (USD and AUD)
    const exchangeRates: Record<string, number> = {
      USD: data.rates?.USD || 0.012,
      AUD: data.rates?.AUD || 0.018,
    }

    return NextResponse.json({
      success: true,
      rates: exchangeRates,
      base: 'INR',
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    
    // Fallback to default rates if API fails
    return NextResponse.json({
      success: false,
      rates: {
        USD: 0.012, // Approximate: 1 INR = 0.012 USD
        AUD: 0.018, // Approximate: 1 INR = 0.018 AUD
      },
      base: 'INR',
      lastUpdated: new Date().toISOString(),
      error: 'Using fallback rates',
    })
  }
}

