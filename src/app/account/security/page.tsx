import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import AccountShell from '@/components/AccountShell'
import { toShellUser } from '@/lib/shell-user'
import ChangePasswordCard from '@/components/ChangePasswordCard'

export const dynamic = 'force-dynamic'

/** Customer self-service password change. */
export default async function AccountSecurityPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth')

  return (
    <AccountShell active="security" user={toShellUser(user)} title="Пароль">
      <ChangePasswordCard />
    </AccountShell>
  )
}
