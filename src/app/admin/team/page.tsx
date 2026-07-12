import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { listStaffAction, listRecoveryEmailsAction } from '@/server/owner-actions'
import AdminShell from '@/components/AdminShell'
import OwnerTeam from '@/views/OwnerTeam'

export const dynamic = 'force-dynamic'

/** Owner-only: manage admins (add / archive / remove) + the owner's recovery emails. */
export default async function TeamPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth')
  if (user.role !== 'OWNER') redirect('/admin')

  const [staff, recovery] = await Promise.all([listStaffAction(), listRecoveryEmailsAction()])

  return (
    <AdminShell active="team" title="Команда и восстановление" subtitle="Администраторы · доступ · восстановление владельца" isOwner>
      <OwnerTeam staff={staff} recovery={recovery} />
    </AdminShell>
  )
}
