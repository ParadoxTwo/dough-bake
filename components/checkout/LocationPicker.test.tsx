import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LocationPicker from './LocationPicker'

// No NEXT_PUBLIC_MAPBOX_TOKEN in the test env, so the component runs in its
// degraded mode (geolocation + manual inputs, no Mapbox load).

const noCoords = { lat: null, lng: null }

describe('LocationPicker (degraded, no token)', () => {
  afterEach(() => {
    // @ts-expect-error cleanup test-injected geolocation
    delete navigator.geolocation
  })

  it('does not render a map and shows the manual inputs', () => {
    render(<LocationPicker value={noCoords} onChange={vi.fn()} />)
    expect(screen.getByText('Drop-off location (optional)')).toBeInTheDocument()
    expect(screen.getByLabelText('Latitude')).toBeInTheDocument()
    expect(screen.getByLabelText('Longitude')).toBeInTheDocument()
  })

  it('emits coordinates when both manual fields are valid', () => {
    const onChange = vi.fn()
    render(<LocationPicker value={noCoords} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '18.5204' } })
    fireEvent.change(screen.getByLabelText('Longitude'), { target: { value: '73.8567' } })
    expect(onChange).toHaveBeenLastCalledWith({ lat: 18.5204, lng: 73.8567 })
  })

  it('shows an error and emits null for an out-of-range latitude', () => {
    const onChange = vi.fn()
    render(<LocationPicker value={noCoords} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '200' } })
    expect(screen.getByText(/between -90 and 90/i)).toBeInTheDocument()
    expect(onChange).toHaveBeenLastCalledWith(null)
  })

  it('clears coordinates', () => {
    const onChange = vi.fn()
    render(<LocationPicker value={noCoords} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '18.5' } })
    fireEvent.click(screen.getByRole('button', { name: /clear pinned location/i }))
    expect(onChange).toHaveBeenLastCalledWith(null)
    expect(screen.getByLabelText('Latitude')).toHaveValue('')
  })

  it('captures the browser geolocation', () => {
    const onChange = vi.fn()
    const getCurrentPosition = vi.fn((success: PositionCallback) =>
      success({ coords: { latitude: 12.34, longitude: 56.78 } } as GeolocationPosition)
    )
    // @ts-expect-error inject a minimal geolocation mock
    navigator.geolocation = { getCurrentPosition }

    render(<LocationPicker value={noCoords} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /use my current location/i }))
    expect(onChange).toHaveBeenLastCalledWith({ lat: 12.34, lng: 56.78 })
  })

  it('reports a calm message when geolocation is denied', () => {
    const getCurrentPosition = vi.fn((_s: PositionCallback, error?: PositionErrorCallback) =>
      error?.({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError)
    )
    // @ts-expect-error inject a minimal geolocation mock
    navigator.geolocation = { getCurrentPosition }

    render(<LocationPicker value={noCoords} onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /use my current location/i }))
    expect(screen.getByText(/location access was blocked/i)).toBeInTheDocument()
  })
})
