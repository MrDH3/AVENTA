import { redirect } from 'next/navigation'
import { getCurrentUser, canManageSettings } from '@/lib/auth'
import AdminShell from '@/components/AdminShell'
import ChangePasswordCard from '@/components/ChangePasswordCard'

export const dynamic = 'force-dynamic'

/** Admin/owner self-service password change. Personal — open to ALL staff, not gated by settings access. */
export default async function AdminSecurityPage() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) redirect('/auth')

  return (
    <AdminShell active="settings" title="Пароль и безопасность" subtitle="Смена пароля вашего аккаунта" isOwner={user.role === 'OWNER'} canSettings={canManageSettings(user)}>
      <ChangePasswordCard dark />
    </AdminShell>
  )
}
