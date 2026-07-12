'use client'

import { useEffect, useRef, useState } from 'react'
import type { MapPickerProps } from './MapPicker'
import { loadMapScript, round6 } from './map-loader'

/**
 * Yandex Maps adapter for the MapView abstraction — dormant until an admin adds a Yandex key. Same
 * prop shape as the OSM/Leaflet MapPicker, so switching provider is a setting, not a code change.
 * The SDK is loaded at runtime with no @types installed, so its objects are intentionally untyped.
 */
export default function YandexMapView({ mode, lat, lng, onChange, zoom = 13, height = 260, popupHtml, fallback, markers, apiKey }: MapPickerProps & { apiKey: string }) {
  const elRef = useRef<HTMLDivElement | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const [failed, setFailed] = useState(false)
  const center: [number, number] = [lat ?? fallback?.lat ?? 36.8969, lng ?? fallback?.lng ?? 30.7133]

  useEffect(() => {
    let cancelled = false
    loadMapScript(`https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=en_US`, 'yandex-maps')
      .then(() => {
        const ymaps = (window as unknown as { ymaps?: any }).ymaps
        if (cancelled || !ymaps || !elRef.current) return
        ymaps.ready(() => {
          if (cancelled || !elRef.current) return
          const map = new ymaps.Map(elRef.current, { center, zoom, controls: ['zoomControl'] })
          if (mode === 'view' && markers && markers.length) {
            const coords: [number, number][] = []
            for (const m of markers) {
              map.geoObjects.add(new ymaps.Placemark([m.lat, m.lng], { balloonContent: m.popupHtml ?? '' }))
              coords.push([m.lat, m.lng])
            }
            if (coords.length > 1) map.setBounds(ymaps.util.bounds.fromPoints(coords), { checkZoomRange: true, zoomMargin: 30 })
          } else {
            const pm = new ymaps.Placemark(center, { balloonContent: popupHtml ?? '' }, { draggable: mode === 'pick' })
            map.geoObjects.add(pm)
            if (mode === 'pick') {
              map.events.add('click', (e: any) => {
                const c = e.get('coords') as [number, number]
                pm.geometry.setCoordinates(c)
                onChangeRef.current?.(round6(c[0]), round6(c[1]))
              })
              pm.events.add('dragend', () => {
                const c = pm.geometry.getCoordinates() as [number, number]
                onChangeRef.current?.(round6(c[0]), round6(c[1]))
              })
            }
          }
        })
      })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (failed) {
    return <div style={{ width: '100%', height, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--av-field,#F3FAFB)', border: '1px solid var(--av-hair-soft)', font: '600 12px var(--f-ui)', color: 'var(--av-muted)' }}>Yandex Maps недоступна</div>
  }
  return <div ref={elRef} style={{ width: '100%', height, borderRadius: 14, overflow: 'hidden', zIndex: 0 }} aria-label="map" />
}
