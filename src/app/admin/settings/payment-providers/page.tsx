import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import AdminShell from '@/components/AdminShell'
import { getPaymentProviderStatuses } from '@/lib/payment-providers'
import PaymentProviders from '@/views/PaymentProviders'

export const dynamic = 'force-dynamic'

export default async function PaymentProvidersPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth')
  if (user.role !== 'OWNER' && !user.settingsAccess) redirect('/admin') // owner + granted admins only

  // Public status only — secret credentials are never returned to the browser.
  const statuses = await getPaymentProviderStatuses()

  return (
    <AdminShell active="settings" title="Платёжные провайдеры" subtitle="Эквайринг · Stripe · PayPal · PayTR · iyzico">
      <PaymentProviders statuses={statuses} />
    </AdminShell>
  )
}
