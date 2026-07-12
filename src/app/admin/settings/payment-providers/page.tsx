import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import AdminShell from '@/components/AdminShell'
import { getPaymentProviderStatuses } from '@/lib/payment-providers'
import PaymentProviders from '@/views/PaymentProviders'

export const dynamic = 'force-dynamic'

export default async function PaymentProvidersPage() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) redirect('/auth')

  // Public status only — secret credentials are never returned to the browser.
  const statuses = await getPaymentProviderStatuses()

  return (
    <AdminShell active="settings" title="Платёжные провайдеры" subtitle="Эквайринг · Stripe · PayPal · PayTR · iyzico">
      <PaymentProviders statuses={statuses} />
    </AdminShell>
  )
}
