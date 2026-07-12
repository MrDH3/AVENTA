'use client'

import dynamic from 'next/dynamic'
import type { MapPickerProps } from './MapPicker'

// One map abstraction, swappable provider. The server resolves which provider is active (OSM always;
// Google/Yandex only when their key is configured) and passes it here. OSM is the working default and
// the fallback, so maps never break — switching provider is a setting, not a code change.
const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false })
const GoogleMapView = dynamic(() => import('./GoogleMapView'), { ssr: false })
const YandexMapView = dynamic(() => import('./YandexMapView'), { ssr: false })

export interface MapViewProps extends MapPickerProps {
  provider?: 'osm' | 'google' | 'yandex'
  apiKey?: string | null
}

export default function MapView({ provider = 'osm', apiKey, ...rest }: MapViewProps) {
  if (provider === 'google' && apiKey) return <GoogleMapView apiKey={apiKey} {...rest} />
  if (provider === 'yandex' && apiKey) return <YandexMapView apiKey={apiKey} {...rest} />
  return <MapPicker {...rest} />
}
