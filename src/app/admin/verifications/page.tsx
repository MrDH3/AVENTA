import { redirect } from 'next/navigation'
import { getCurrentUser, canManageSettings } from '@/lib/auth'
import AdminShell from '@/components/AdminShell'
import { getVerificationQueue, getPendingVerificationCount } from '@/lib/verification-queue'
import VerificationQueue from '@/views/VerificationQueue'

export const dynamic = 'force-dynamic'

export default async function VerificationsPage({ searchParams }: { searchParams: { filter?: string } }) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) redirect('/auth')

  const filter: 'pending' | 'reviewed' = searchParams.filter === 'reviewed' ? 'reviewed' : 'pending'
  const [rows, pendingCount] = await Promise.all([getVerificationQueue(filter), getPendingVerificationCount()])

  return (
    <AdminShell active="verifications" title="Проверка личности — очередь" subtitle="Ручная проверка документов клиентов · одобрение и отклонение с причиной" canSettings={canManageSettings(user)}>
      <VerificationQueue rows={rows} filter={filter} pendingCount={pendingCount} />
    </AdminShell>
  )
}
