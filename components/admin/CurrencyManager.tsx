'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ThemedText from '@/components/ui/ThemedText'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import { CurrencyCode, CurrencyMode, currencies } from '@/lib/currency/types'

export default function CurrencyManager() {
  const [mode, setMode] = useState<CurrencyMode>('fixed')
  const [fixedCurrency, setFixedCurrency] = useState<CurrencyCode>('INR')
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [fetchingRates, setFetchingRates] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load current settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/currency/settings')
        if (response.ok) {
          const data = await response.json()
          if (data) {
            setMode(data.mode || 'fixed')
            setFixedCurrency(data.fixedCurrency || 'INR')
            setExchangeRates(data.exchangeRates || { USD: 0.012, AUD: 0.018 })
          } else {
            // No settings found, use defaults
            setExchangeRates({ USD: 0.012, AUD: 0.018 })
          }
        }
      } catch (error) {
        console.error('Failed to load currency settings:', error)
        // Use default rates on error
        setExchangeRates({ USD: 0.012, AUD: 0.018 })
      }
    }
    loadSettings()
  }, [])

  const handleFetchExchangeRates = async () => {
    setFetchingRates(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/currency/exchange-rates')
      const data = await response.json()
      
      if (data.success && data.rates) {
        setExchangeRates(data.rates)
        setMessage({ type: 'success', text: 'Exchange rates updated successfully' })
      } else {
        // Use fallback rates
        setExchangeRates(data.rates || {})
        setMessage({ type: 'success', text: 'Using fallback exchange rates' })
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error)
      setMessage({ type: 'error', text: 'Failed to fetch exchange rates' })
    } finally {
      setFetchingRates(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/currency/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          mode,
          fixedCurrency: mode === 'fixed' ? fixedCurrency : undefined,
          exchangeRates,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setMessage({ type: 'success', text: 'Currency settings saved.' })
        // Notify CurrencyProvider (and any listeners) to update in-place
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('currencySettingsUpdated', {
              detail: {
                mode,
                fixedCurrency,
                exchangeRates,
              },
            })
          )
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save settings' })
      }
    } catch (error) {
      console.error('Failed to save currency settings:', error)
      setMessage({ type: 'error', text: 'Failed to save currency settings' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <ThemedText as="h2" size="xl" weight="bold" className="mb-6">
        Currency Management
      </ThemedText>

      {/* Currency Mode Selection */}
      <div className="mb-6">
        <ThemedText as="h3" size="lg" weight="semibold" className="mb-4">
          Currency Display Mode
        </ThemedText>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border" style={{ borderColor: 'var(--theme-secondary)' }}>
            <div>
              <ThemedText as="div" weight="semibold" className="mb-1">
                Fixed Currency
              </ThemedText>
              <ThemedText as="div" size="sm" tone="secondary">
                All users see prices in the selected currency
              </ThemedText>
            </div>
            <ToggleSwitch
              checked={mode === 'fixed'}
              onChange={(checked) => setMode(checked ? 'fixed' : 'regional')}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border" style={{ borderColor: 'var(--theme-secondary)' }}>
            <div>
              <ThemedText as="div" weight="semibold" className="mb-1">
                Regional Currency
              </ThemedText>
              <ThemedText as="div" size="sm" tone="secondary">
                Currency automatically selected based on user location (India: INR, Australia: AUD, US: USD)
              </ThemedText>
            </div>
            <ToggleSwitch
              checked={mode === 'regional'}
              onChange={(checked) => setMode(checked ? 'regional' : 'fixed')}
            />
          </div>
        </div>
      </div>

      {/* Fixed Currency Selection */}
      {mode === 'fixed' && (
        <div className="mb-6">
          <ThemedText as="h3" size="lg" weight="semibold" className="mb-4">
            Select Currency
          </ThemedText>
          <div className="grid grid-cols-3 gap-4">
            {(['INR', 'USD', 'AUD'] as CurrencyCode[]).map((code) => {
              const currency = currencies[code]
              return (
                <button
                  key={code}
                  onClick={() => setFixedCurrency(code)}
                  className={`p-4 rounded-lg border-2 transition ${
                    fixedCurrency === code
                      ? 'border-accent'
                      : 'border-secondary hover:border-tertiary'
                  }`}
                  style={{
                    borderColor: fixedCurrency === code 
                      ? 'var(--theme-accent)' 
                      : 'var(--theme-secondary)',
                    backgroundColor: fixedCurrency === code 
                      ? 'var(--theme-surface)' 
                      : 'transparent',
                  }}
                >
                  <ThemedText as="div" weight="bold" size="lg" className="mb-1">
                    {currency.symbol} {code}
                  </ThemedText>
                  <ThemedText as="div" size="sm" tone="secondary">
                    {currency.name}
                  </ThemedText>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Exchange Rates */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <ThemedText as="h3" size="lg" weight="semibold">
            Exchange Rates (Base: INR)
          </ThemedText>
          <Button
            onClick={handleFetchExchangeRates}
            disabled={fetchingRates}
            loading={fetchingRates}
            size="sm"
            variant="secondary"
          >
            {fetchingRates ? 'Fetching...' : 'Update Rates'}
          </Button>
        </div>
        
        <div className="space-y-3">
          {(['USD', 'AUD'] as CurrencyCode[]).map((code) => {
            const currency = currencies[code]
            return (
              <div
                key={code}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: 'var(--theme-surface)' }}
              >
                <ThemedText as="div" weight="semibold">
                  {currency.symbol} {code} ({currency.name})
                </ThemedText>
                <div className="flex items-center gap-4">
                  <ThemedText as="div" tone="secondary" size="sm">
                    1 INR = {exchangeRates[code]?.toFixed(4) || '0.0000'} {code}
                  </ThemedText>
                  <input
                    type="number"
                    step="0.0001"
                    value={exchangeRates[code] || 0}
                    onChange={(e) =>
                      setExchangeRates({
                        ...exchangeRates,
                        [code]: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-24 px-2 py-1 rounded border"
                    style={{
                      backgroundColor: 'var(--theme-background)',
                      borderColor: 'var(--theme-secondary)',
                      color: 'var(--theme-text)',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg mb-4 ${
            message.type === 'success' ? 'bg-green-100' : 'bg-red-100'
          }`}
        >
          <ThemedText
            as="div"
            size="sm"
            style={{
              color: message.type === 'success' ? '#065f46' : '#991b1b',
            }}
          >
            {message.text}
          </ThemedText>
        </div>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={loading}
        loading={loading}
        variant="primary"
        size="lg"
        fullWidth={true}
      >
        Save Currency Settings
      </Button>
    </Card>
  )
}

