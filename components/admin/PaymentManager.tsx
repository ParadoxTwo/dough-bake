'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ThemedText from '@/components/ui/ThemedText'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import type { PaymentProvider } from '@/lib/payment/types'
import { PaymentProviderFactory } from '@/lib/payment/factory'

interface PaymentProviderConfig {
  stripe: {
    secretKey: string
    publishableKey: string
  }
  razorpay: {
    keyId: string
    keySecret: string
  }
  payu: {
    merchantKey: string
    merchantSalt: string
    baseUrl?: string
  }
  paytm: {
    merchantId: string
    merchantKey: string
    industryType?: string
    channelId?: string
    website?: string
    callbackUrl?: string
    baseUrl?: string
  }
}

export default function PaymentManager() {
  const [provider, setProvider] = useState<PaymentProvider>('stripe')
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Provider-specific configs
  const [stripeConfig, setStripeConfig] = useState<PaymentProviderConfig['stripe']>({
    secretKey: '',
    publishableKey: '',
  })
  const [razorpayConfig, setRazorpayConfig] = useState<PaymentProviderConfig['razorpay']>({
    keyId: '',
    keySecret: '',
  })
  const [payuConfig, setPayuConfig] = useState<PaymentProviderConfig['payu']>({
    merchantKey: '',
    merchantSalt: '',
    baseUrl: 'https://secure.payu.in',
  })
  const [paytmConfig, setPaytmConfig] = useState<PaymentProviderConfig['paytm']>({
    merchantId: '',
    merchantKey: '',
    industryType: 'Retail',
    channelId: 'WEB',
    website: 'WEBSTAGING',
    callbackUrl: '',
    baseUrl: 'https://securegw-stage.paytm.in/theia/processTransaction',
  })

  // Load current settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/payment/settings')
        if (response.ok) {
          const data = await response.json()
          if (data) {
            setProvider(data.provider || 'stripe')
            setEnabled(data.enabled !== undefined ? data.enabled : true)
            
            // Load provider-specific config
            if (data.config) {
              if (data.provider === 'stripe') {
                setStripeConfig({
                  secretKey: data.config.secretKey || '',
                  publishableKey: data.config.publishableKey || '',
                })
              } else if (data.provider === 'razorpay') {
                setRazorpayConfig({
                  keyId: data.config.keyId || '',
                  keySecret: data.config.keySecret || '',
                })
              } else if (data.provider === 'payu') {
                setPayuConfig({
                  merchantKey: data.config.merchantKey || '',
                  merchantSalt: data.config.merchantSalt || '',
                  baseUrl: data.config.baseUrl || 'https://secure.payu.in',
                })
              } else if (data.provider === 'paytm') {
                setPaytmConfig({
                  merchantId: data.config.merchantId || '',
                  merchantKey: data.config.merchantKey || '',
                  industryType: data.config.industryType || 'Retail',
                  channelId: data.config.channelId || 'WEB',
                  website: data.config.website || 'WEBSTAGING',
                  callbackUrl: data.config.callbackUrl || '',
                  baseUrl: data.config.baseUrl || 'https://securegw-stage.paytm.in/theia/processTransaction',
                })
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to load payment settings:', error)
      }
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      // Get config for selected provider
      let config: Record<string, any> = {}
      if (provider === 'stripe') {
        config = stripeConfig
      } else if (provider === 'razorpay') {
        config = razorpayConfig
      } else if (provider === 'payu') {
        config = payuConfig
      } else if (provider === 'paytm') {
        config = paytmConfig
      }

      const response = await fetch('/api/payment/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          provider,
          config,
          enabled,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setMessage({ type: 'success', text: 'Payment settings saved successfully' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save settings' })
      }
    } catch (error) {
      console.error('Failed to save payment settings:', error)
      setMessage({ type: 'error', text: 'Failed to save payment settings' })
    } finally {
      setLoading(false)
    }
  }

  const getCurrentConfig = () => {
    switch (provider) {
      case 'stripe':
        return stripeConfig
      case 'razorpay':
        return razorpayConfig
      case 'payu':
        return payuConfig
      case 'paytm':
        return paytmConfig
      default:
        return {}
    }
  }

  const renderProviderConfig = () => {
    switch (provider) {
      case 'stripe':
        return (
          <div className="space-y-4">
            <Input
              label="Secret Key"
              type="password"
              value={stripeConfig.secretKey}
              onChange={(e) => setStripeConfig({ ...stripeConfig, secretKey: e.target.value })}
              placeholder="sk_test_..."
            />
            <Input
              label="Publishable Key"
              type="text"
              value={stripeConfig.publishableKey}
              onChange={(e) => setStripeConfig({ ...stripeConfig, publishableKey: e.target.value })}
              placeholder="pk_test_..."
            />
            <ThemedText as="p" size="sm" tone="secondary">
              Get your Stripe keys from{' '}
              <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--theme-accent)' }}>
                Stripe Dashboard
              </a>
            </ThemedText>
          </div>
        )
      
      case 'razorpay':
        return (
          <div className="space-y-4">
            <Input
              label="Key ID"
              type="text"
              value={razorpayConfig.keyId}
              onChange={(e) => setRazorpayConfig({ ...razorpayConfig, keyId: e.target.value })}
              placeholder="rzp_test_..."
            />
            <Input
              label="Key Secret"
              type="password"
              value={razorpayConfig.keySecret}
              onChange={(e) => setRazorpayConfig({ ...razorpayConfig, keySecret: e.target.value })}
              placeholder="Your secret key"
            />
            <ThemedText as="p" size="sm" tone="secondary">
              Get your Razorpay keys from{' '}
              <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--theme-accent)' }}>
                Razorpay Dashboard
              </a>
            </ThemedText>
          </div>
        )
      
      case 'payu':
        return (
          <div className="space-y-4">
            <Input
              label="Merchant Key"
              type="text"
              value={payuConfig.merchantKey}
              onChange={(e) => setPayuConfig({ ...payuConfig, merchantKey: e.target.value })}
              placeholder="Your merchant key"
            />
            <Input
              label="Merchant Salt"
              type="password"
              value={payuConfig.merchantSalt}
              onChange={(e) => setPayuConfig({ ...payuConfig, merchantSalt: e.target.value })}
              placeholder="Your merchant salt"
            />
            <Input
              label="Base URL (optional)"
              type="text"
              value={payuConfig.baseUrl}
              onChange={(e) => setPayuConfig({ ...payuConfig, baseUrl: e.target.value })}
              placeholder="https://secure.payu.in"
            />
            <ThemedText as="p" size="sm" tone="secondary">
              Get your PayU credentials from{' '}
              <a href="https://dashboard.payu.in/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--theme-accent)' }}>
                PayU Dashboard
              </a>
            </ThemedText>
          </div>
        )
      
      case 'paytm':
        return (
          <div className="space-y-4">
            <Input
              label="Merchant ID"
              type="text"
              value={paytmConfig.merchantId}
              onChange={(e) => setPaytmConfig({ ...paytmConfig, merchantId: e.target.value })}
              placeholder="Your merchant ID"
            />
            <Input
              label="Merchant Key"
              type="password"
              value={paytmConfig.merchantKey}
              onChange={(e) => setPaytmConfig({ ...paytmConfig, merchantKey: e.target.value })}
              placeholder="Your merchant key"
            />
            <Input
              label="Industry Type"
              type="text"
              value={paytmConfig.industryType}
              onChange={(e) => setPaytmConfig({ ...paytmConfig, industryType: e.target.value })}
              placeholder="Retail"
            />
            <Input
              label="Channel ID"
              type="text"
              value={paytmConfig.channelId}
              onChange={(e) => setPaytmConfig({ ...paytmConfig, channelId: e.target.value })}
              placeholder="WEB"
            />
            <Input
              label="Website"
              type="text"
              value={paytmConfig.website}
              onChange={(e) => setPaytmConfig({ ...paytmConfig, website: e.target.value })}
              placeholder="WEBSTAGING"
            />
            <Input
              label="Callback URL"
              type="text"
              value={paytmConfig.callbackUrl}
              onChange={(e) => setPaytmConfig({ ...paytmConfig, callbackUrl: e.target.value })}
              placeholder="https://yoursite.com/api/payment/callback"
            />
            <Input
              label="Base URL (optional)"
              type="text"
              value={paytmConfig.baseUrl}
              onChange={(e) => setPaytmConfig({ ...paytmConfig, baseUrl: e.target.value })}
              placeholder="https://securegw-stage.paytm.in/theia/processTransaction"
            />
            <ThemedText as="p" size="sm" tone="secondary">
              Get your PayTM credentials from{' '}
              <a href="https://dashboard.paytm.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--theme-accent)' }}>
                PayTM Dashboard
              </a>
            </ThemedText>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <Card>
      <ThemedText as="h2" size="xl" weight="bold" className="mb-6">
        Payment Gateway Settings
      </ThemedText>

      {/* Enabled Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-4 rounded-lg border" style={{ borderColor: 'var(--theme-secondary)' }}>
          <div>
            <ThemedText as="div" weight="semibold" className="mb-1">
              Enable Payments
            </ThemedText>
            <ThemedText as="div" size="sm" tone="secondary">
              Enable or disable payment processing
            </ThemedText>
          </div>
          <ToggleSwitch
            checked={enabled}
            onChange={setEnabled}
          />
        </div>
      </div>

      {/* Provider Selection */}
      <div className="mb-6">
        <ThemedText as="h3" size="lg" weight="semibold" className="mb-4">
          Payment Provider
        </ThemedText>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PaymentProviderFactory.getSupportedProviders().map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProvider(p)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                provider === p
                  ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)] bg-opacity-10'
                  : 'border-[var(--theme-secondary)] hover:border-[var(--theme-accent)] hover:border-opacity-50'
              }`}
            >
              <ThemedText as="div" weight="semibold" className="capitalize" style={provider === p ? { color: 'white' } : { color: 'var(--theme-text)' }}>
                {p === 'payu' ? 'PayU' : p === 'paytm' ? 'PayTM' : p.charAt(0).toUpperCase() + p.slice(1)}
              </ThemedText>
            </button>
          ))}
        </div>
      </div>

      {/* Provider Configuration */}
      <div className="mb-6">
        <ThemedText as="h3" size="lg" weight="semibold" className="mb-4">
          {provider.charAt(0).toUpperCase() + provider.slice(1)} Configuration
        </ThemedText>
        {renderProviderConfig()}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg mb-4 ${
            message.type === 'success'
              ? 'bg-green-500 bg-opacity-10 border border-green-500'
              : 'bg-red-500 bg-opacity-10 border border-red-500'
          }`}
        >
          <ThemedText
            as="p"
            size="sm"
            style={{ color: 'white' }}
          >
            {message.text}
          </ThemedText>
        </div>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSave}
        loading={loading}
        disabled={loading}
        className="w-full"
      >
        Save Payment Settings
      </Button>
    </Card>
  )
}

