import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { listEnabledOffices } from '@/lib/locations'
import { getMapClientConfig } from '@/lib/map-provider'
import { prisma } from '@/lib/db'
import AccountShell from '@/components/AccountShell'
import { toShellUser } from '@/lib/shell-user'
import Addresses from '@/views/Addresses'
import { type OfficePoint } from '@/components/SavedPlaces'
import type { SavedPlaceView } from '@/server/map-actions'

export const dynamic = 'force-dynamic'

/** Standalone "Saved addresses" page — view/add/edit/remove saved places on the map. */
export default async function AddressesPage() {
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
    <AccountShell active="places" user={toShellUser(user)}>
      <Addresses provider={mapCfg.provider} apiKey={mapCfg.apiKey} offices={officePoints} places={places} />
    </AccountShell>
  )
}
