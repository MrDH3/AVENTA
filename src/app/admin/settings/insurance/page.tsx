import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import AdminShell from '@/components/AdminShell'
import { getInsuranceTiersAdmin, anyInsurancePlaceholder } from '@/lib/insurance'
import InsuranceAdmin from '@/views/InsuranceAdmin'

export const dynamic = 'force-dynamic'

export default async function InsuranceSettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth')
  if (user.role !== 'OWNER' && !user.settingsAccess) redirect('/admin') // owner + granted admins only

  const [tiers, placeholder] = await Promise.all([getInsuranceTiersAdmin(), anyInsurancePlaceholder()])

  return (
    <AdminShell active="settings" title="Страховка — покрытие" subtitle="Что включено в каждый тариф · редактируется владельцем">
      <InsuranceAdmin tiers={tiers} anyPlaceholder={placeholder} />
    </AdminShell>
  )
}
