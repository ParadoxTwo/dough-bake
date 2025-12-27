import { CurrencyCode, Currency, currencies } from './types'

/**
 * Format a price amount with the appropriate currency symbol and locale
 */
export function formatPrice(
  amount: number,
  currencyCode: CurrencyCode = 'INR'
): string {
  const currency = currencies[currencyCode]
  const formatter = new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return formatter.format(amount)
}

/**
 * Convert price from one currency to another using exchange rates
 */
export function convertPrice(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  exchangeRates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) {
    return amount
  }

  // Base currency is INR
  // If converting from INR to another currency, multiply by rate
  // If converting to INR from another currency, divide by rate
  if (fromCurrency === 'INR') {
    const rate = exchangeRates[toCurrency] || 1
    return amount * rate
  }

  if (toCurrency === 'INR') {
    const rate = exchangeRates[fromCurrency] || 1
    return amount / rate
  }

  // Converting between two non-INR currencies
  // First convert to INR, then to target currency
  const fromRate = exchangeRates[fromCurrency] || 1
  const toRate = exchangeRates[toCurrency] || 1
  const inrAmount = amount / fromRate
  return inrAmount * toRate
}

/**
 * Detect user's currency based on their location
 * Returns currency code based on country code or timezone
 */
export function detectRegionalCurrency(): CurrencyCode {
  if (typeof window === 'undefined') {
    return 'INR' // Default for server-side
  }

  try {
    // Try to get from browser locale
    const locale = navigator.language || navigator.languages?.[0] || 'en-IN'
    
    // Check timezone as fallback
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    
    // India timezone
    if (timezone.includes('Calcutta') || timezone.includes('Kolkata') || timezone.includes('Asia/Kolkata')) {
      return 'INR'
    }
    
    // Australia timezone
    if (timezone.includes('Australia') || timezone.includes('Sydney') || timezone.includes('Melbourne')) {
      return 'AUD'
    }
    
    // US timezone
    if (timezone.includes('America/') || timezone.includes('US/')) {
      return 'USD'
    }
    
    // Check locale
    if (locale.includes('en-IN') || locale.includes('hi-IN')) {
      return 'INR'
    }
    if (locale.includes('en-AU')) {
      return 'AUD'
    }
    if (locale.includes('en-US')) {
      return 'USD'
    }
  } catch (error) {
    console.error('Error detecting regional currency:', error)
  }

  return 'INR' // Default fallback
}

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currencyCode: CurrencyCode): string {
  return currencies[currencyCode].symbol
}

