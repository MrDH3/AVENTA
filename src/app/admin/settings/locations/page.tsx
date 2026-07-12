import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import AdminShell from '@/components/AdminShell'
import { listCitiesAdmin, listOfficesAdmin } from '@/lib/locations'
import { getMapClientConfig } from '@/lib/map-provider'
import LocationsAdmin from '@/views/LocationsAdmin'

export const dynamic = 'force-dynamic'

export default async function LocationsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth')
  if (user.role !== 'OWNER' && !user.settingsAccess) redirect('/admin') // owner + granted admins only

  const [cities, offices, mapClient] = await Promise.all([listCitiesAdmin(), listOfficesAdmin(), getMapClientConfig()])

  return (
    <AdminShell active="settings" title="Города и офисы" subtitle="Города обслуживания · адреса выдачи · карта офиса">
      <LocationsAdmin cities={cities} offices={offices} map={{ provider: mapClient.provider, apiKey: mapClient.apiKey }} />
    </AdminShell>
  )
}
