import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import AdminShell from '@/components/AdminShell'
import { getPaymentSettingsAdmin } from '@/lib/payment-settings'
import { getReservationHoldHours } from '@/lib/reservation-timeout'
import { getBookingDraftTtlHours } from '@/lib/booking-draft'
import { getCardReconcileGraceMinutes } from '@/lib/card-reconcile'
import { loadRates } from '@/lib/money'
import PaymentSettings from '@/views/PaymentSettings'

export const dynamic = 'force-dynamic'

export default async function PaymentSettingsPage() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) redirect('/auth')

  const [settings, rates, holdHours, draftTtlHours, reconcileGraceMinutes] = await Promise.all([
    getPaymentSettingsAdmin(),
    loadRates(),
    getReservationHoldHours(),
    getBookingDraftTtlHours(),
    getCardReconcileGraceMinutes(),
  ])

  return (
    <AdminShell active="settings" title="Платежи и валюты" subtitle="Депозит · способы оплаты · криптокошельки · банк · курсы">
      <PaymentSettings settings={settings} rates={rates} holdHours={holdHours} draftTtlHours={draftTtlHours} reconcileGraceMinutes={reconcileGraceMinutes} />
    </AdminShell>
  )
}
