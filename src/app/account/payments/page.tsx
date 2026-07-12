import { redirect } from 'next/navigation'
import type { Currency, BookingStatus, PaymentMethod, PaymentKind, PaymentStatus } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth'
import { getLocale, type Locale } from '@/lib/i18n'
import { prisma } from '@/lib/db'
import { formatMoney } from '@/lib/money'
import { formatDayMonth } from '@/lib/view'
import { stripeConfigured } from '@/lib/payments'
import AccountShell from '@/components/AccountShell'
import { toShellUser } from '@/lib/shell-user'
import MyPayments from '@/views/MyPayments'
import type { SuccessBankDetails } from '@/app/success/page'

export const dynamic = 'force-dynamic'

/**
 * Customer Payments surface (bottom-nav tab). Shows, per booking, what is owed (total / paid /
 * balance + the security deposit), lets the customer pay the outstanding balance — reusing the exact
 * booking payment components (Stripe card + bank/crypto declaration) — and lists their payment
 * history. All money is pre-formatted server-side so the client view stays free of Prisma types.
 */

export interface PayBooking {
  id: string
  number: string
  status: BookingStatus
  carName: string
  datesLabel: string
  currency: Currency
  subtotal: number
  paid: number
  balance: number
  deposit: number
  subtotalMoney: string
  paidMoney: string
  balanceMoney: string
  depositMoney: string
  /** balance still owed AND the booking is live (not cancelled/closed) → show the pay panel. */
  payable: boolean
}

export interface PayHistoryRow {
  id: string
  bookingNumber: string
  method: PaymentMethod
  kind: PaymentKind
  status: PaymentStatus
  amount: number
  amountMoney: string
  createdAtISO: string
}

const SUT: Record<Locale, string> = { ru: 'сут', en: 'days', tr: 'gün', es: 'días', de: 'Tage' }

// A booking is "settled / gone" for payment purposes once cancelled or fully closed.
const DEAD: BookingStatus[] = ['CANCELLED', 'CLOSED']

export default async function PaymentsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth')

  const lang = getLocale()

  const [bookings, bankRows] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { car: true, payments: { orderBy: { createdAt: 'desc' } } },
    }),
    prisma.setting.findMany({
      where: { key: { in: ['bank_iban', 'bank_swift', 'company_name', 'company_legal'] } },
    }),
  ])

  const settingOf = (k: string): string => bankRows.find((r) => r.key === k)?.value ?? ''
  const bank: SuccessBankDetails = {
    iban: settingOf('bank_iban'),
    swift: settingOf('bank_swift'),
    holder: settingOf('company_legal') || settingOf('company_name'),
  }

  const payBookings: PayBooking[] = bookings.map((b) => {
    const currency = b.currency
    const money = (v: unknown) => formatMoney(Number(v), currency)
    const subtotal = Number(b.subtotal)
    const paid = Number(b.prepaidAmount)
    const balance = Number(b.balanceAmount)
    const deposit = Number(b.depositAmount)
    const datesLabel = `${formatDayMonth(b.startAt, lang)}–${formatDayMonth(b.endAt, lang)} · ${b.days} ${SUT[lang]}`
    return {
      id: b.id,
      number: b.number,
      status: b.status,
      carName: `${b.car.brand} ${b.car.model}`,
      datesLabel,
      currency,
      subtotal,
      paid,
      balance,
      deposit,
      subtotalMoney: money(subtotal),
      paidMoney: money(paid),
      balanceMoney: money(balance),
      depositMoney: money(deposit),
      payable: balance > 0 && !DEAD.includes(b.status),
    }
  })

  // Flat payment history across all the customer's bookings, newest first. Skip AWAITING card intents:
  // one is created when the card form mounts and the customer may never pay it, so showing it would
  // clutter history with a payment they never made. Confirmed card payments and declared bank/crypto
  // payments (which the customer actively submitted) are always shown.
  const history: PayHistoryRow[] = bookings
    .flatMap((b) =>
      b.payments
        .filter((p) => !(p.method === 'CARD_STRIPE' && p.status === 'AWAITING'))
        .map((p) => ({
        id: p.id,
        bookingNumber: b.number,
        method: p.method,
        kind: p.kind,
        status: p.status,
        amount: Number(p.amount),
        amountMoney: formatMoney(Number(p.amount), p.currency),
        createdAtISO: p.createdAt.toISOString(),
      })),
    )
    .sort((a, b) => (a.createdAtISO < b.createdAtISO ? 1 : -1))

  return (
    <AccountShell active="payments" user={toShellUser(user)}>
      <MyPayments bookings={payBookings} history={history} bank={bank} cardEnabled={stripeConfigured()} />
    </AccountShell>
  )
}
