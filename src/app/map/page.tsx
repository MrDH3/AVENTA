import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { listEnabledOffices } from '@/lib/locations'
import { getMapClientConfig } from '@/lib/map-provider'
import { prisma } from '@/lib/db'
import ClientShell from '@/components/ClientShell'
import SavedPlaces, { type OfficePoint } from '@/components/SavedPlaces'
import type { SavedPlaceView } from '@/server/map-actions'

export const dynamic = 'force-dynamic'

/** "Map" tab — saved places + directions, full-page (mirrors the /account map card). */
export default async function MapPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth')

  const [offices, placeRows, mapCfg] = await Promise.all([
    listEnabledOffices(),
    prisma.savedPlace.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
    getMapClientConfig(),
  ])

  const places: SavedPlaceView[] = placeRows.map((p) => ({ id: p.id, label: p.label, lat: p.lat, lng: p.lng, address: p.address }))
  const officePoints: OfficePoint[] = offices.map((o) => ({ id: o.id, name: o.name, address: o.address, city: o.city, lat: o.lat, lng: o.lng }))

  return (
    <ClientShell>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '22px 16px 40px' }}>
        <SavedPlaces provider={mapCfg.provider} apiKey={mapCfg.apiKey} offices={officePoints} places={places} />
      </div>
    </ClientShell>
  )
}
