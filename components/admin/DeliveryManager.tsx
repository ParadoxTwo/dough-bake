'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ThemedText from '@/components/ui/ThemedText'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import type { DeliveryProvider } from '@/lib/delivery/types'
import { DeliveryProviderFactory } from '@/lib/delivery/factory'
import {
  getDeliverySettings,
  updateDeliverySettings,
  getDeliveryPickup,
  updateDeliveryPickup,
} from '@/lib/actions/delivery'

interface BorzoConfig {
  authToken: string
  testMode: boolean
  callbackSecret: string
  vehicleTypeId: string
}

interface PickupForm {
  address: string
  lat: string
  lng: string
  contactName: string
  contactPhone: string
  note: string
}

const PROVIDER_LABELS: Record<DeliveryProvider, string> = {
  borzo: 'Borzo',
  porter: 'Porter',
}

export default function DeliveryManager() {
  const [provider, setProvider] = useState<DeliveryProvider>('borzo')
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [borzoConfig, setBorzoConfig] = useState<BorzoConfig>({
    authToken: '',
    testMode: true,
    callbackSecret: '',
    vehicleTypeId: '8',
  })

  const [pickup, setPickup] = useState<PickupForm>({
    address: '',
    lat: '',
    lng: '',
    contactName: '',
    contactPhone: '',
    note: '',
  })

  // Load current settings
  useEffect(() => {
    const load = async () => {
      try {
        const settings = await getDeliverySettings()
        if (settings) {
          setProvider(settings.provider)
          setEnabled(settings.enabled)
          if (settings.provider === 'borzo') {
            const c = settings.config as {
              authToken?: string
              testMode?: boolean | string
              callbackSecret?: string
              vehicleTypeId?: number | string
            }
            setBorzoConfig({
              authToken: c.authToken ?? '',
              testMode: c.testMode === true || c.testMode === 'true',
              callbackSecret: c.callbackSecret ?? '',
              vehicleTypeId: c.vehicleTypeId != null ? String(c.vehicleTypeId) : '8',
            })
          }
        }

        const p = await getDeliveryPickup()
        if (p) {
          setPickup({
            address: p.address ?? '',
            lat: p.lat != null ? String(p.lat) : '',
            lng: p.lng != null ? String(p.lng) : '',
            contactName: p.contactName ?? '',
            contactPhone: p.contactPhone ?? '',
            note: p.note ?? '',
          })
        }
      } catch (error) {
        console.error('Failed to load delivery settings:', error)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const config =
        provider === 'borzo'
          ? {
              authToken: borzoConfig.authToken,
              testMode: borzoConfig.testMode,
              callbackSecret: borzoConfig.callbackSecret,
              vehicleTypeId: borzoConfig.vehicleTypeId,
            }
          : {}

      const settingsResult = await updateDeliverySettings(provider, config, enabled)
      if (!settingsResult.success) {
        setMessage({ type: 'error', text: settingsResult.error || 'Failed to save settings' })
        return
      }

      const pickupResult = await updateDeliveryPickup({
        address: pickup.address,
        contactName: pickup.contactName,
        contactPhone: pickup.contactPhone,
        note: pickup.note || undefined,
        lat: pickup.lat ? parseFloat(pickup.lat) : undefined,
        lng: pickup.lng ? parseFloat(pickup.lng) : undefined,
      })
      if (!pickupResult.success) {
        setMessage({ type: 'error', text: pickupResult.error || 'Failed to save pickup address' })
        return
      }

      setMessage({ type: 'success', text: 'Delivery settings saved successfully' })
    } catch (error) {
      console.error('Failed to save delivery settings:', error)
      setMessage({ type: 'error', text: 'Failed to save delivery settings' })
    } finally {
      setLoading(false)
    }
  }

  const renderProviderConfig = () => {
    if (provider === 'porter') {
      return (
        <ThemedText as="p" size="sm" tone="secondary">
          Porter integration is not yet available — select Borzo. A Porter business
          account and API credentials are required to enable it.
        </ThemedText>
      )
    }

    return (
      <div className="space-y-4">
        <Input
          label="Auth Token"
          type="password"
          value={borzoConfig.authToken}
          onChange={(e) => setBorzoConfig({ ...borzoConfig, authToken: e.target.value })}
          placeholder="X-DV-Auth-Token from the Borzo cabinet"
        />
        <div
          className="flex items-center justify-between p-4 rounded-lg border"
          style={{ borderColor: 'var(--theme-secondary)' }}
        >
          <div>
            <ThemedText as="div" weight="semibold" className="mb-1">
              Test mode (sandbox)
            </ThemedText>
            <ThemedText as="div" size="sm" tone="secondary">
              Use the Borzo sandbox host instead of production
            </ThemedText>
          </div>
          <ToggleSwitch
            checked={borzoConfig.testMode}
            onChange={(checked) => setBorzoConfig({ ...borzoConfig, testMode: checked })}
          />
        </div>
        <Input
          label="Callback Secret"
          type="password"
          value={borzoConfig.callbackSecret}
          onChange={(e) => setBorzoConfig({ ...borzoConfig, callbackSecret: e.target.value })}
          placeholder="Used to verify status webhooks"
        />
        <Input
          label="Vehicle Type ID"
          type="text"
          inputMode="numeric"
          value={borzoConfig.vehicleTypeId}
          onChange={(e) => setBorzoConfig({ ...borzoConfig, vehicleTypeId: e.target.value })}
          placeholder="8 (motorbike)"
        />
        <ThemedText as="p" size="sm" tone="secondary">
          Get your token from the{' '}
          <a
            href="https://borzodelivery.com/in/business-api/doc"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--theme-accent)' }}
          >
            Borzo Business API
          </a>{' '}
          personal cabinet.
        </ThemedText>
      </div>
    )
  }

  return (
    <Card>
      <ThemedText as="h2" size="xl" weight="bold" className="mb-6">
        Delivery Settings
      </ThemedText>

      {/* Enabled Toggle */}
      <div className="mb-6">
        <div
          className="flex items-center justify-between p-4 rounded-lg border"
          style={{ borderColor: 'var(--theme-secondary)' }}
        >
          <div>
            <ThemedText as="div" weight="semibold" className="mb-1">
              Enable Delivery
            </ThemedText>
            <ThemedText as="div" size="sm" tone="secondary">
              Automatically dispatch couriers for paid orders
            </ThemedText>
          </div>
          <ToggleSwitch checked={enabled} onChange={setEnabled} />
        </div>
      </div>

      {/* Provider Selection */}
      <div className="mb-6">
        <ThemedText as="h3" size="lg" weight="semibold" className="mb-4">
          Delivery Provider
        </ThemedText>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {DeliveryProviderFactory.getSupportedProviders().map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={provider === p}
              onClick={() => setProvider(p)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                provider === p
                  ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)] bg-opacity-10'
                  : 'border-[var(--theme-secondary)] hover:border-[var(--theme-accent)] hover:border-opacity-50'
              }`}
            >
              <ThemedText
                as="div"
                weight="semibold"
                style={provider === p ? { color: 'white' } : { color: 'var(--theme-text)' }}
              >
                {PROVIDER_LABELS[p]}
              </ThemedText>
            </button>
          ))}
        </div>
      </div>

      {/* Provider Configuration */}
      <div className="mb-6">
        <ThemedText as="h3" size="lg" weight="semibold" className="mb-4">
          {PROVIDER_LABELS[provider]} Configuration
        </ThemedText>
        {renderProviderConfig()}
      </div>

      {/* Pickup Address */}
      <div className="mb-6">
        <ThemedText as="h3" size="lg" weight="semibold" className="mb-1">
          Pickup Address (Bakery)
        </ThemedText>
        <ThemedText as="p" size="sm" tone="secondary" className="mb-4">
          Where couriers collect orders. Coordinates improve accuracy but are optional.
        </ThemedText>
        <div className="space-y-4">
          <Input
            label="Address"
            multiline
            rows={2}
            value={pickup.address}
            onChange={(e) => setPickup({ ...pickup, address: e.target.value })}
            placeholder="Shop no, street, area, city, postal code"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Latitude (optional)"
              type="text"
              inputMode="decimal"
              value={pickup.lat}
              onChange={(e) => setPickup({ ...pickup, lat: e.target.value })}
              placeholder="18.5204"
            />
            <Input
              label="Longitude (optional)"
              type="text"
              inputMode="decimal"
              value={pickup.lng}
              onChange={(e) => setPickup({ ...pickup, lng: e.target.value })}
              placeholder="73.8567"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Contact Name"
              type="text"
              value={pickup.contactName}
              onChange={(e) => setPickup({ ...pickup, contactName: e.target.value })}
              placeholder="Bakery contact person"
            />
            <Input
              label="Contact Phone"
              type="tel"
              value={pickup.contactPhone}
              onChange={(e) => setPickup({ ...pickup, contactPhone: e.target.value })}
              placeholder="Phone for the courier"
            />
          </div>
          <Input
            label="Note (optional)"
            multiline
            rows={2}
            value={pickup.note}
            onChange={(e) => setPickup({ ...pickup, note: e.target.value })}
            placeholder="Pickup instructions for the courier"
          />
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          role={message.type === 'success' ? 'status' : 'alert'}
          className={`p-4 rounded-lg mb-4 ${
            message.type === 'success'
              ? 'bg-green-500 bg-opacity-10 border border-green-500'
              : 'bg-red-500 bg-opacity-10 border border-red-500'
          }`}
        >
          <ThemedText as="p" size="sm" style={{ color: 'white' }}>
            {message.text}
          </ThemedText>
        </div>
      )}

      {/* Save Button */}
      <Button onClick={handleSave} loading={loading} disabled={loading} className="w-full">
        Save Delivery Settings
      </Button>
    </Card>
  )
}
