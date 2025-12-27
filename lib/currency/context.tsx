'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { CurrencyCode, CurrencyMode, CurrencySettings, CurrencyContextType, currencies } from './types'
import { formatPrice, convertPrice, detectRegionalCurrency } from './utils'
import { getCurrencySettings } from '@/lib/actions/currency'

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

interface CurrencyProviderProps {
  children: ReactNode
  initialCurrency?: CurrencyCode
  initialMode?: CurrencyMode
  initialExchangeRates?: Record<string, number>
  skipClientFetch?: boolean
}

export function CurrencyProvider({
  children,
  initialCurrency = 'INR',
  initialMode = 'fixed',
  initialExchangeRates = {},
  skipClientFetch = false,
}: CurrencyProviderProps) {
  const [currency, setCurrency] = useState<CurrencyCode>(initialCurrency)
  const [mode, setMode] = useState<CurrencyMode>(initialMode)
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(initialExchangeRates)
  const [mounted, setMounted] = useState(!skipClientFetch)

  useEffect(() => {
    if (skipClientFetch) {
      setMounted(true)
      // Set currency based on initial mode
      if (initialMode === 'regional') {
        const detectedCurrency = detectRegionalCurrency()
        setCurrency(detectedCurrency)
      } else {
        setCurrency(initialCurrency)
      }
      return
    }

    // Fetch currency settings from database on mount
    const loadCurrencySettings = async () => {
      try {
        const settings = await getCurrencySettings()
        if (settings) {
          setMode(settings.mode)
          setExchangeRates(settings.exchangeRates || {})
          
          if (settings.mode === 'fixed') {
            setCurrency(settings.fixedCurrency || 'INR')
          } else {
            // Regional mode - detect user's currency
            const detectedCurrency = detectRegionalCurrency()
            setCurrency(detectedCurrency)
          }
        } else {
          // No settings found, use initial values
          if (initialMode === 'regional') {
            const detectedCurrency = detectRegionalCurrency()
            setCurrency(detectedCurrency)
          }
        }
      } catch (error) {
        console.error('Failed to load currency settings:', error)
        // Fallback to initial values
        if (initialMode === 'regional') {
          const detectedCurrency = detectRegionalCurrency()
          setCurrency(detectedCurrency)
        }
      }
      setMounted(true)
    }

    loadCurrencySettings()
  }, [skipClientFetch, initialMode, initialCurrency])

  // Update currency when mode changes
  useEffect(() => {
    if (!mounted) return
    
    if (mode === 'regional') {
      const detectedCurrency = detectRegionalCurrency()
      setCurrency(detectedCurrency)
    } else {
      // In fixed mode, currency should be set by admin
      // This will be updated when settings are fetched
    }
  }, [mode, mounted])

  // Listen for client-side currency setting updates (from CurrencyManager)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handler = (event: Event) => {
      const custom = event as CustomEvent<{
        mode: CurrencyMode
        fixedCurrency: CurrencyCode
        exchangeRates: Record<string, number>
      }>

      const nextMode = custom.detail.mode
      const nextFixedCurrency = custom.detail.fixedCurrency
      const nextExchangeRates = custom.detail.exchangeRates || {}

      setMode(nextMode)
      setExchangeRates(nextExchangeRates)

      if (nextMode === 'fixed') {
        setCurrency(nextFixedCurrency || 'INR')
      } else {
        const detectedCurrency = detectRegionalCurrency()
        setCurrency(detectedCurrency)
      }
    }

    window.addEventListener('currencySettingsUpdated', handler as EventListener)
    return () => {
      window.removeEventListener('currencySettingsUpdated', handler as EventListener)
    }
  }, [])

  const formatPriceWithCurrency = (amount: number): string => {
    return formatPrice(amount, currency)
  }

  const convertPriceWithCurrency = (
    amount: number,
    fromCurrency: CurrencyCode = 'INR'
  ): number => {
    if (fromCurrency === currency) {
      return amount
    }
    return convertPrice(amount, fromCurrency, currency, exchangeRates)
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyInfo: currencies[currency],
        mode,
        formatPrice: formatPriceWithCurrency,
        convertPrice: convertPriceWithCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}

