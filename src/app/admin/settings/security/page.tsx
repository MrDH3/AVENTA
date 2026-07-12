import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import AdminShell from '@/components/AdminShell'
import ChangePasswordCard from '@/components/ChangePasswordCard'

export const dynamic = 'force-dynamic'

/** Admin/owner self-service password change. */
export default async function AdminSecurityPage() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) redirect('/auth')

  return (
    <AdminShell active="settings" title="Пароль и безопасность" subtitle="Смена пароля вашего аккаунта" isOwner={user.role === 'OWNER'}>
      <ChangePasswordCard dark />
    </AdminShell>
  )
}
