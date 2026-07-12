import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import AccountShell from '@/components/AccountShell'
import { toShellUser } from '@/lib/shell-user'
import PaymentMethods from '@/views/PaymentMethods'

export const dynamic = 'force-dynamic'

/** Standalone "Payment methods" page — honest placeholder until a card processor is enabled. */
export default async function PaymentMethodsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth')

  return (
    <AccountShell active="payments" user={toShellUser(user)}>
      <PaymentMethods />
    </AccountShell>
  )
}
