import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import AdminShell from '@/components/AdminShell'
import { getSumsubConfig } from '@/lib/sumsub'
import { getRetentionDays } from '@/lib/id-documents'
import { getVerificationMethod } from '@/lib/verification-method'
import SumsubSettings from '@/views/SumsubSettings'

export const dynamic = 'force-dynamic'

export default async function SumsubSettingsPage() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) redirect('/auth')

  const [config, retentionDays, method] = await Promise.all([getSumsubConfig(), getRetentionDays(), getVerificationMethod()])

  const h = headers()
  const host = h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  const webhookUrl = `${proto}://${host}/api/sumsub/webhook`

  return (
    <AdminShell active="settings" title="Проверка личности" subtitle="Метод проверки · ручная (админ) или Sumsub (авто)">
      <SumsubSettings config={config} webhookUrl={webhookUrl} retentionDays={retentionDays} method={method} />
    </AdminShell>
  )
}
