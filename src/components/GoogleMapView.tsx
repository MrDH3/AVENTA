'use client'

import { useEffect, useRef, useState } from 'react'
import type { MapPickerProps } from './MapPicker'
import { loadMapScript, round6 } from './map-loader'

/**
 * Google Maps adapter for the MapView abstraction — dormant until an admin adds a Google key. Same
 * prop shape as the OSM/Leaflet MapPicker (mode, lat/lng, markers, onChange), so switching provider
 * is a setting, not a code change. If the SDK can't load, it renders a graceful notice (the app has
 * already resolved to OSM in that case, so this only runs when a key IS configured).
 * The SDK is loaded at runtime with no @types installed, so its objects are intentionally untyped.
 */
export default function GoogleMapView({ mode, lat, lng, onChange, zoom = 13, height = 260, popupHtml, fallback, markers, apiKey }: MapPickerProps & { apiKey: string }) {
  const elRef = useRef<HTMLDivElement | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const [failed, setFailed] = useState(false)
  const center = { lat: lat ?? fallback?.lat ?? 36.8969, lng: lng ?? fallback?.lng ?? 30.7133 }

  useEffect(() => {
    let cancelled = false
    loadMapScript(`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`, 'google-maps')
      .then(() => {
        const g = (window as unknown as { google?: any }).google
        if (cancelled || !elRef.current || !g) return
        const map = new g.maps.Map(elRef.current, { center, zoom, clickableIcons: false })
        if (mode === 'view' && markers && markers.length) {
          const bounds = new g.maps.LatLngBounds()
          for (const m of markers) {
            const mk = new g.maps.Marker({ position: { lat: m.lat, lng: m.lng }, map })
            if (m.popupHtml) { const iw = new g.maps.InfoWindow({ content: m.popupHtml }); mk.addListener('click', () => iw.open(map, mk)) }
            bounds.extend({ lat: m.lat, lng: m.lng })
          }
          if (markers.length > 1) map.fitBounds(bounds)
        } else {
          const marker = new g.maps.Marker({ position: center, map, draggable: mode === 'pick' })
          if (mode === 'view' && popupHtml) { const iw = new g.maps.InfoWindow({ content: popupHtml }); marker.addListener('click', () => iw.open(map, marker)) }
          if (mode === 'pick') {
            map.addListener('click', (e: any) => {
              if (!e.latLng) return
              marker.setPosition(e.latLng)
              onChangeRef.current?.(round6(e.latLng.lat()), round6(e.latLng.lng()))
            })
            marker.addListener('dragend', () => {
              const p = marker.getPosition()
              if (p) onChangeRef.current?.(round6(p.lat()), round6(p.lng()))
            })
          }
        }
      })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (failed) {
    return <div style={{ width: '100%', height, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--av-field,#F3FAFB)', border: '1px solid var(--av-hair-soft)', font: '600 12px var(--f-ui)', color: 'var(--av-muted)' }}>Google Maps недоступна</div>
  }
  return <div ref={elRef} style={{ width: '100%', height, borderRadius: 14, overflow: 'hidden', zIndex: 0 }} aria-label="map" />
}
