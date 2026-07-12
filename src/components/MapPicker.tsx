'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet'

/**
 * Free OpenStreetMap / Leaflet map — SSR-safe (Leaflet is dynamically imported
 * inside the effect so it never runs on the server). Two modes:
 *  - 'pick'  → draggable + click-to-place marker; calls onChange(lat,lng).
 *  - 'view'  → fixed marker with a popup (e.g. the office), read-only.
 * Fully responsive (width 100%, invalidates size on mount/resize).
 */
export interface MapPickerProps {
  mode: 'pick' | 'view'
  lat: number | null
  lng: number | null
  onChange?: (lat: number, lng: number) => void
  zoom?: number
  height?: number
  popupHtml?: string
  /** Fallback centre when lat/lng are null (defaults to central Antalya). */
  fallback?: { lat: number; lng: number }
  /** view mode only — render MULTIPLE fixed markers and fit the map to them (e.g. all offices). */
  markers?: { lat: number; lng: number; popupHtml?: string }[]
}

const PIN_HTML =
  '<div style="width:26px;height:26px;transform:translate(-50%,-100%);filter:drop-shadow(0 3px 5px rgba(11,85,96,.5))">' +
  '<svg viewBox="0 0 24 24" width="26" height="26"><path fill="#FF6F61" stroke="#fff" stroke-width="1.5" d="M12 2c-3.9 0-7 3.1-7 7 0 5 7 13 7 13s7-8 7-13c0-3.9-3.1-7-7-7z"/><circle cx="12" cy="9" r="2.6" fill="#fff"/></svg>' +
  '</div>'

export default function MapPicker({ mode, lat, lng, onChange, zoom = 13, height = 260, popupHtml, fallback, markers }: MapPickerProps) {
  const elRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<LeafletMarker | null>(null)
  const LRef = useRef<typeof import('leaflet') | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const center = {
    lat: lat ?? fallback?.lat ?? 36.8969,
    lng: lng ?? fallback?.lng ?? 30.7133,
  }

  // init once
  useEffect(() => {
    let cancelled = false
    const sizeTimers: ReturnType<typeof setTimeout>[] = []
    ;(async () => {
      const mod = await import('leaflet')
      const L = (mod as unknown as { default?: typeof import('leaflet') }).default ?? mod
      if (cancelled || !elRef.current || mapRef.current) return
      LRef.current = L

      const map = L.map(elRef.current, { scrollWheelZoom: false, attributionControl: true }).setView([center.lat, center.lng], zoom)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map)

      const icon = L.divIcon({ html: PIN_HTML, className: '', iconSize: [26, 26], iconAnchor: [13, 26] })
      mapRef.current = map

      // Multi-marker view (e.g. all pickup offices) — drop each pin and fit the map to them.
      if (mode === 'view' && markers && markers.length > 0) {
        const pts: [number, number][] = []
        for (const m of markers) {
          const mk = L.marker([m.lat, m.lng], { icon, keyboard: false }).addTo(map)
          if (m.popupHtml) mk.bindPopup(m.popupHtml)
          pts.push([m.lat, m.lng])
        }
        if (pts.length === 1) map.setView(pts[0], zoom)
        else map.fitBounds(pts, { padding: [30, 30], maxZoom: 14 })
      } else {
        const marker = L.marker([center.lat, center.lng], { draggable: mode === 'pick', icon, keyboard: false }).addTo(map)
        markerRef.current = marker

        if (mode === 'view' && popupHtml) marker.bindPopup(popupHtml)

        if (mode === 'pick') {
          map.on('click', (e: import('leaflet').LeafletMouseEvent) => {
            marker.setLatLng(e.latlng)
            onChangeRef.current?.(round(e.latlng.lat), round(e.latlng.lng))
          })
          marker.on('dragend', () => {
            const p = marker.getLatLng()
            onChangeRef.current?.(round(p.lat), round(p.lng))
          })
        }
      }

      // sizing (Leaflet needs a nudge when the container was just revealed). Guard the deferred calls:
      // if the effect is torn down first (React StrictMode double-mount / route change), calling
      // invalidateSize on a removed map throws "Cannot read properties of undefined (reading '_leaflet_pos')".
      const nudge = () => {
        if (cancelled || mapRef.current !== map) return
        try { map.invalidateSize() } catch { /* map already torn down */ }
      }
      sizeTimers.push(setTimeout(nudge, 0), setTimeout(nudge, 250))
    })()

    const onResize = () => {
      try { mapRef.current?.invalidateSize() } catch { /* map already torn down */ }
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelled = true
      sizeTimers.forEach(clearTimeout)
      window.removeEventListener('resize', onResize)
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // keep marker/view in sync when parent-provided coords change (no onChange fired)
  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return
    if (lat != null && lng != null) {
      marker.setLatLng([lat, lng])
      map.panTo([lat, lng], { animate: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng])

  return <div ref={elRef} style={{ width: '100%', height, borderRadius: 14, overflow: 'hidden', zIndex: 0 }} aria-label="map" />
}

function round(n: number): number {
  return Math.round(n * 1e6) / 1e6
}
