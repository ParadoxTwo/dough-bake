export type CurrencyCode = 'INR' | 'USD' | 'AUD'

export type CurrencyMode = 'fixed' | 'regional'

export interface Currency {
  code: CurrencyCode
  name: string
  symbol: string
  locale: string
}

export const currencies: Record<CurrencyCode, Currency> = {
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    locale: 'en-IN',
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    locale: 'en-US',
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    locale: 'en-AU',
  },
}

export interface CurrencySettings {
  mode: CurrencyMode
  fixedCurrency: CurrencyCode
  exchangeRates: Record<string, number> // e.g., { "USD": 0.012, "AUD": 0.018 }
  lastUpdated?: string
}

export interface CurrencyContextType {
  currency: CurrencyCode
  currencyInfo: Currency
  mode: CurrencyMode
  formatPrice: (amount: number) => string
  convertPrice: (amount: number, fromCurrency?: CurrencyCode) => number
}

