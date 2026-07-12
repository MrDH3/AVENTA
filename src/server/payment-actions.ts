'use server'

import { prisma } from '@/lib/db'
import { getCurrentUser, isStaff } from '@/lib/auth'
import { walletQr, stripe, stripeSupports, toStripeAmount, createPayPalOrder, paypalConfigured } from '@/lib/payments'
import { loadRates, formatMoney } from '@/lib/money'
import { getPaymentConfig } from '@/lib/payment-settings'
import { recomputeBookingBalance } from '@/lib/balance'
import { canTransition } from '@/lib/booking-status'
import { logAudit } from '@/lib/audit'
import { sendTelegram } from '@/lib/notify'

async function ownedBooking(bookingId: string) {
  const user = await getCurrentUser()
  if (!user) return { user: null, booking: null }
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
  if (!booking) return { user, booking: null }
  if (booking.userId !== user.id && !isStaff(user.role)) return { user, booking: null }
  return { user, booking }
}

export interface CryptoInfo {
  ok: boolean
  amountUsd?: number
  options?: { token: string; network: string; address: string; qr: string }[]
  error?: string
}

/** Admin-configured wallet options + server-generated QR codes + the OUTSTANDING BALANCE in USD-pegged
 *  crypto. Consistent with the card + bank options on the Payments surface, which also collect the
 *  balance — never a fresh deposit. Converts booking-currency balance → base(EUR) → USD. */
export async function getCryptoPaymentInfo(bookingId: string): Promise<CryptoInfo> {
  const { booking } = await ownedBooking(bookingId)
  if (!booking) return { ok: false, error: 'Нет доступа' }
  const [rates, config] = await Promise.all([loadRates(), getPaymentConfig()])
  const fx = Number(booking.fxRate) > 0 ? Number(booking.fxRate) : 1
  const balanceBase = Math.round((Number(booking.balanceAmount) / fx) * 100) / 100 // booking currency → base(EUR)
  const amountUsd = Math.round(balanceBase * (rates.USDT ?? 1.08) * 100) / 100
  const withQr = await Promise.all(
    config.wallets.map(async (o) => ({ token: o.token, network: o.network, address: o.address, qr: await walletQr(o.address) })),
  )
  return { ok: true, amountUsd, options: withQr }
}

export interface StripeInit {
  ok: boolean
  clientSecret?: string
  publishableKey?: string
  /** The (deposit) amount being charged, pre-formatted for display, e.g. "€90". */
  amountLabel?: string
  error?: string
}

/**
 * Create a Stripe PaymentIntent for a booking's OUTSTANDING BALANCE (what the Payments surface
 * advertises — total minus what's already been paid), in the booking's currency, and record an
 * AWAITING Payment row keyed by the intent id. The card number never touches our server — the client
 * confirms via Stripe Elements, and the signature-verified webhook (/api/webhooks/stripe) flips the
 * Payment to PAID + advances the booking (via canTransition).
 *
 * Idempotent per amount: if an open (AWAITING) card intent for the SAME balance already exists (the
 * customer re-opened the card form), we reuse it instead of creating a new PaymentIntent + Payment row
 * — so re-opening the form doesn't litter the customer's payment history with orphan AWAITING rows.
 */
export async function createStripeIntentAction(bookingId: string): Promise<StripeInit> {
  const { user, booking } = await ownedBooking(bookingId)
  if (!booking || !user) return { ok: false, error: 'Нет доступа' }
  const s = stripe()
  if (!s) return { ok: false, error: 'Оплата картой не настроена (нет ключей Stripe). Используйте перевод или крипто.' }
  if (!stripeSupports(booking.currency)) return { ok: false, error: `Stripe не поддерживает ${booking.currency}` }

  // Charge the outstanding balance (consistent with what the surface shows and with bank/crypto).
  const amount = Math.round(Number(booking.balanceAmount) * 100) / 100
  if (!(amount > 0)) return { ok: false, error: 'Нет суммы к оплате' }

  try {
    // Reuse an existing open intent for the same amount rather than spawning a new AWAITING row per open.
    const open = await prisma.payment.findFirst({
      where: { bookingId: booking.id, method: 'CARD_STRIPE', provider: 'stripe', status: 'AWAITING' },
      orderBy: { createdAt: 'desc' },
    })
    if (open?.providerRef && Number(open.amount) === amount) {
      const existing = await s.paymentIntents.retrieve(open.providerRef).catch(() => null)
      if (existing && ['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(existing.status)) {
        return {
          ok: true,
          clientSecret: existing.client_secret ?? undefined,
          publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
          amountLabel: formatMoney(amount, booking.currency),
        }
      }
    }

    const intent = await s.paymentIntents.create({
      amount: toStripeAmount(amount, booking.currency),
      currency: booking.currency.toLowerCase(),
      payment_method_types: ['card'],
      metadata: { bookingId: booking.id, number: booking.number, kind: 'BALANCE' },
      description: `AVENTA ${booking.number} · balance`,
    })
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        method: 'CARD_STRIPE',
        kind: 'BALANCE',
        currency: booking.currency,
        amount,
        status: 'AWAITING',
        provider: 'stripe',
        providerRef: intent.id,
      },
    })
    await logAudit({ userId: user.id, action: 'payment.stripe.init', entity: 'Booking', entityId: booking.id, meta: { amount, currency: booking.currency, kind: 'BALANCE' } })
    return {
      ok: true,
      clientSecret: intent.client_secret ?? undefined,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      amountLabel: formatMoney(amount, booking.currency),
    }
  } catch (e) {
    // Invalid/missing key, unsupported params, etc. — surface a clean error to the card form.
    return { ok: false, error: e instanceof Error ? `Stripe: ${e.message}` : 'Не удалось создать платёж Stripe' }
  }
}

export async function createPayPalOrderAction(bookingId: string): Promise<{ ok: boolean; approveUrl?: string; error?: string }> {
  const { user, booking } = await ownedBooking(bookingId)
  if (!booking || !user) return { ok: false, error: 'Нет доступа' }
  if (!paypalConfigured()) return { ok: false, error: 'PayPal не настроен' }
  const order = await createPayPalOrder(Number(booking.subtotal), booking.currency, booking.number)
  if (!order) return { ok: false, error: 'Не удалось создать заказ PayPal' }
  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      method: 'CARD_PAYPAL',
      kind: 'FULL',
      currency: booking.currency,
      amount: booking.subtotal,
      status: 'AWAITING',
      provider: 'paypal',
      providerRef: order.id,
    },
  })
  await logAudit({ userId: user.id, action: 'payment.paypal.init', entity: 'Booking', entityId: booking.id })
  return { ok: true, approveUrl: order.approveUrl }
}

/** Manual payment: client declares a bank transfer / crypto tx (+optional proof doc). Admin confirms. */
export async function submitManualPaymentAction(input: {
  bookingId: string
  method: 'BANK_TRANSFER' | 'CRYPTO' | 'CASH'
  kind?: 'PREPAY' | 'FULL' | 'DEPOSIT' | 'BALANCE'
  amount: number
  currency: string
  fxRate?: number
  txHash?: string
  cryptoNetwork?: string
  cryptoAddress?: string
  proofDocId?: string
}): Promise<{ ok: boolean; error?: string }> {
  const { user, booking } = await ownedBooking(input.bookingId)
  if (!booking || !user) return { ok: false, error: 'Нет доступа' }
  if (!(input.amount > 0)) return { ok: false, error: 'Некорректная сумма' }

  // Only attach a proof document the caller actually OWNS — never trust an arbitrary id
  // (a customer must not be able to reference another user's document as their receipt).
  let proofDocId: string | null = null
  if (input.proofDocId) {
    const doc = await prisma.document.findFirst({ where: { id: input.proofDocId, userId: user.id }, select: { id: true } })
    proofDocId = doc?.id ?? null
  }

  // SECURITY — mass-assignment defense (same discipline as verification status):
  // payment status is AUTHORITATIVE and staff-confirmed. The customer declares a payment
  // (method/amount/txHash/proof) but can NEVER set it "paid"/"confirmed". The input type has
  // no `status` field, and we hard-code status:'AWAITING' below — so a crafted request cannot
  // mark itself PAID. Only staff (setPaymentStatus/recordPayment, requireStaff) writes a
  // confirmed status, and only confirmed payments (PAID/PARTIAL) count toward the balance.
  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      method: input.method,
      // Reservation prepayment by default (the admin deposit %); admin confirms it.
      kind: (input.kind ?? 'PREPAY') as never,
      currency: input.currency as never,
      amount: input.amount,
      fxRate: input.fxRate && input.fxRate > 0 ? input.fxRate : 1,
      status: 'AWAITING', // server-forced; never taken from the client payload
      txHash: input.txHash?.trim() || null,
      cryptoNetwork: (input.cryptoNetwork as never) ?? null,
      cryptoAddress: input.cryptoAddress?.trim() || null,
      proofDocId,
    },
  })
  if (proofDocId) {
    await prisma.document.update({ where: { id: proofDocId }, data: { bookingId: booking.id } })
  }
  // Advance to AWAITING_PAYMENT only when the rulebook (single source of truth) allows it from the
  // current state. A customer declaring a payment must never force an illegal lifecycle jump (e.g. from
  // ACTIVE/CLOSED, or skipping AWAITING_CONFIRMATION). If the move isn't valid, the status is left
  // untouched — the payment is still recorded (AWAITING) and staff advance the booking.
  if (canTransition(booking.status, 'AWAITING_PAYMENT')) {
    await prisma.booking.update({ where: { id: booking.id }, data: { status: 'AWAITING_PAYMENT' } })
  }
  // Recompute prepaid/balance from confirmed payments (the submitted one is AWAITING until admin confirms).
  await recomputeBookingBalance(booking.id)
  await logAudit({ userId: user.id, action: 'payment.manual.submit', entity: 'Booking', entityId: booking.id, meta: { method: input.method, kind: input.kind ?? 'PREPAY' } })
  sendTelegram(
    `💳 <b>Оплата заявлена</b> ${booking.number}\n${input.method} · ${formatMoney(input.amount, input.currency as never)}${input.txHash ? `\nTX: ${input.txHash}` : ''}`,
    'payment.manual',
    booking.id,
  ).catch(() => {})
  return { ok: true }
}
