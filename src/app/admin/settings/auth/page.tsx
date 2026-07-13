import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import AdminShell from '@/components/AdminShell'
import { listProviderStatuses } from '@/lib/provider-credentials'
import { env } from '@/lib/env'
import AuthSettings from '@/views/AuthSettings'

export const dynamic = 'force-dynamic'

export default async function AuthSettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth')
  if (user.role !== 'OWNER' && !user.settingsAccess) redirect('/admin') // owner + granted admins only

  // Public status only — never the secret.
  const statuses = await listProviderStatuses()

  return (
    <AdminShell active="settings" title="Вход через соцсети" subtitle="Ключи OAuth · Google · Yandex · Telegram">
      <AuthSettings statuses={statuses} appUrl={env.appUrl} />
    </AdminShell>
  )
}
