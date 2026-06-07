'use client'

import { useEffect, useRef, useState } from 'react'
import type { Map as MapboxMap, Marker as MapboxMarker } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import ThemedText from '@/components/ui/ThemedText'

export interface Coordinates {
  lat: number
  lng: number
}

interface LocationPickerProps {
  value: { lat: number | null; lng: number | null } | null
  onChange: (coords: Coordinates | null) => void
  disabled?: boolean
}

// Centre of India — a neutral fallback when no coordinates are set yet.
const DEFAULT_CENTER: [number, number] = [78.9629, 20.5937]
const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12'
const MARKER_COLOR = '#ef6c1a'

const round = (n: number) => Math.round(n * 1e6) / 1e6
const inLatRange = (n: number) => n >= -90 && n <= 90
const inLngRange = (n: number) => n >= -180 && n <= 180

export default function LocationPicker({ value, onChange, disabled = false }: LocationPickerProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  const [latText, setLatText] = useState(value?.lat != null ? String(value.lat) : '')
  const [lngText, setLngText] = useState(value?.lng != null ? String(value.lng) : '')
  const [latError, setLatError] = useState<string | undefined>()
  const [lngError, setLngError] = useState<string | undefined>()
  const [geoStatus, setGeoStatus] = useState<'idle' | 'requesting' | 'denied' | 'unavailable' | 'ok'>('idle')
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('')

  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapboxMap | null>(null)
  const markerRef = useRef<MapboxMarker | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapboxglRef = useRef<any>(null)

  const hasCoords = value?.lat != null && value?.lng != null

  // Coordinates set by the map or geolocation (authoritative — also updates text).
  const applyCoords = (lat: number, lng: number) => {
    const rl = round(lat)
    const rg = round(lng)
    setLatText(String(rl))
    setLngText(String(rg))
    setLatError(undefined)
    setLngError(undefined)
    setMessage('Location captured')
    onChange({ lat: rl, lng: rg })
  }
  const applyCoordsRef = useRef(applyCoords)
  applyCoordsRef.current = applyCoords
  const valueRef = useRef(value)
  valueRef.current = value

  // Manual entry: validate, push up only when both are valid.
  const commit = (latStr: string, lngStr: string) => {
    const la = parseFloat(latStr)
    const ln = parseFloat(lngStr)
    const laOk = latStr.trim() !== '' && !Number.isNaN(la) && inLatRange(la)
    const lnOk = lngStr.trim() !== '' && !Number.isNaN(ln) && inLngRange(ln)
    setLatError(latStr.trim() !== '' && !laOk ? 'Enter a latitude between -90 and 90' : undefined)
    setLngError(lngStr.trim() !== '' && !lnOk ? 'Enter a longitude between -180 and 180' : undefined)
    onChange(laOk && lnOk ? { lat: round(la), lng: round(ln) } : null)
  }

  const clearCoords = () => {
    setLatText('')
    setLngText('')
    setLatError(undefined)
    setLngError(undefined)
    setMessage('Location cleared')
    onChange(null)
  }

  const requestGeolocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoStatus('unavailable')
      setMessage("Your browser can't share a location — drag the map pin or enter coordinates manually.")
      return
    }
    setGeoStatus('requesting')
    setMessage('Requesting your location…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoStatus('ok')
        applyCoords(pos.coords.latitude, pos.coords.longitude)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoStatus('denied')
          setMessage('Location access was blocked. Drag the map pin or enter coordinates manually.')
        } else {
          setGeoStatus('unavailable')
          setMessage("Couldn't get your location. Drag the map pin or enter coordinates manually.")
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Prefill the text fields once when coordinates arrive asynchronously and the
  // fields are still empty (does not clobber active typing).
  useEffect(() => {
    if (value?.lat != null && value?.lng != null && latText === '' && lngText === '') {
      setLatText(String(value.lat))
      setLngText(String(value.lng))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng])

  // Initialise the map once (only when a token is configured).
  useEffect(() => {
    if (!token || !containerRef.current) return
    let cancelled = false

    ;(async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default
        if (cancelled || !containerRef.current) return
        mapboxgl.accessToken = token
        mapboxglRef.current = mapboxgl

        const initial = valueRef.current
        const center: [number, number] =
          initial?.lat != null && initial?.lng != null
            ? [initial.lng, initial.lat]
            : DEFAULT_CENTER

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          center,
          zoom: initial?.lat != null ? 14 : 4,
        })
        mapRef.current = map
        map.on('load', () => !cancelled && setMapStatus('ready'))
        map.on('error', () => !cancelled && setMapStatus('error'))
        map.on('click', (e) => applyCoordsRef.current(e.lngLat.lat, e.lngLat.lng))
      } catch {
        if (!cancelled) setMapStatus('error')
      }
    })()

    return () => {
      cancelled = true
      markerRef.current = null
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [token])

  // Keep the marker in sync with the controlled value.
  useEffect(() => {
    const map = mapRef.current
    const mapboxgl = mapboxglRef.current
    if (!map || !mapboxgl || mapStatus !== 'ready') return

    if (value?.lat != null && value?.lng != null) {
      if (!markerRef.current) {
        markerRef.current = new mapboxgl.Marker({ draggable: true, color: MARKER_COLOR })
          .setLngLat([value.lng, value.lat])
          .addTo(map)
        markerRef.current!.on('dragend', () => {
          const ll = markerRef.current!.getLngLat()
          applyCoordsRef.current(ll.lat, ll.lng)
        })
      } else {
        markerRef.current.setLngLat([value.lng, value.lat])
      }
      map.flyTo({ center: [value.lng, value.lat], zoom: Math.max(map.getZoom(), 14) })
    } else if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }
  }, [value?.lat, value?.lng, mapStatus])

  return (
    <section
      aria-labelledby="location-picker-heading"
      className="mt-6 pt-6 border-t"
      style={{ borderColor: 'var(--theme-secondary)' }}
    >
      <ThemedText id="location-picker-heading" as="h3" weight="semibold" className="mb-1">
        Drop-off location (optional)
      </ThemedText>
      <ThemedText as="p" size="sm" tone="secondary" className="mb-4">
        Pin your exact location to help the courier find you. You can skip this — we
        also use your address above.
      </ThemedText>

      <Button
        type="button"
        variant="outline"
        onClick={requestGeolocation}
        loading={geoStatus === 'requesting'}
        disabled={disabled || geoStatus === 'requesting'}
      >
        Use my current location
      </Button>

      {token && (
        <div
          ref={containerRef}
          aria-hidden="true"
          className="w-full h-56 sm:h-64 md:h-72 rounded-lg overflow-hidden mt-4"
          style={{ backgroundColor: 'var(--theme-surface)' }}
        >
          {mapStatus === 'error' && (
            <ThemedText as="p" size="sm" tone="secondary" className="p-4">
              Map unavailable — you can still enter coordinates below.
            </ThemedText>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Input
          label="Latitude"
          type="text"
          inputMode="decimal"
          value={latText}
          error={latError}
          disabled={disabled}
          onChange={(e) => {
            setLatText(e.target.value)
            commit(e.target.value, lngText)
          }}
          placeholder="18.5204"
        />
        <Input
          label="Longitude"
          type="text"
          inputMode="decimal"
          value={lngText}
          error={lngError}
          disabled={disabled}
          onChange={(e) => {
            setLngText(e.target.value)
            commit(latText, e.target.value)
          }}
          placeholder="73.8567"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3">
        <ThemedText as="p" size="sm" tone="secondary" aria-live="polite" className="min-h-[1.25rem]">
          {message || (hasCoords ? 'Location captured ✓' : '')}
        </ThemedText>
        {(hasCoords || latText !== '' || lngText !== '') && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            fullWidth={false}
            onClick={clearCoords}
            disabled={disabled}
          >
            Clear pinned location
          </Button>
        )}
      </div>
    </section>
  )
}
