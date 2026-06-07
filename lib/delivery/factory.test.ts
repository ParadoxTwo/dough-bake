import { describe, it, expect } from 'vitest'
import { DeliveryProviderFactory } from './factory'

describe('DeliveryProviderFactory', () => {
  it('lists the supported providers', () => {
    expect(DeliveryProviderFactory.getSupportedProviders()).toEqual(['borzo', 'porter'])
  })

  it('throws when the configured provider is disabled', () => {
    expect(() =>
      DeliveryProviderFactory.createProvider({
        provider: 'borzo',
        config: { authToken: 'test-token' },
        enabled: false,
      })
    ).toThrow(/not enabled/i)
  })

  it('creates a Borzo provider when enabled', () => {
    const provider = DeliveryProviderFactory.createProvider({
      provider: 'borzo',
      config: { authToken: 'test-token' },
      enabled: true,
    })
    expect(provider.getProviderName()).toBe('borzo')
  })

  it('throws for an unsupported provider', () => {
    expect(() =>
      DeliveryProviderFactory.createProvider({
        // @ts-expect-error intentionally invalid provider for the test
        provider: 'unknown',
        config: {},
        enabled: true,
      })
    ).toThrow(/unsupported/i)
  })
})
