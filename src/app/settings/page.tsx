import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import ClientShell from '@/components/ClientShell'
import SettingsView from '@/views/SettingsView'

export const dynamic = 'force-dynamic'

/** "Settings" tab — account identity, language, and sign out. */
export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth')

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
  return (
    <ClientShell>
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '22px 16px 40px' }}>
        <SettingsView name={name} email={user.email} phone={user.phone} />
      </div>
    </ClientShell>
  )
}
