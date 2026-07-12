import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/payments'
import { env } from '@/lib/env'
import { logAudit } from '@/lib/audit'
import { canTransition } from '@/lib/booking-status'
import { recomputeBookingBalance } from '@/lib/balance'
import { lockBookingRow } from '@/lib/booking-lock'

// Stripe needs the raw body for signature verification.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const s = stripe()
  if (!s || !env.stripe.webhookSecret) {
    return NextResponse.json({ received: true, note: 'stripe not configured' })
  }
  const sig = req.headers.get('stripe-signature')
  if (!sig) return new NextResponse('Missing signature', { status: 400 })

  let event: Stripe.Event
  try {
    const body = await req.text()
    event = s.webhooks.constructEvent(body, sig, env.stripe.webhookSecret)
  } catch (e) {
    return new NextResponse(`Webhook error: ${String(e)}`, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent
    const payment = await prisma.payment.findFirst({ where: { providerRef: intent.id } })
    if (payment) {
      // Lock the booking so this confirmation serializes with the reservation-timeout sweep (a hold
      // paid by card must never be expired), and re-read the status UNDER the lock. The payment is
      // marked PAID unconditionally; the booking only advances to CONFIRMED when the rulebook allows it
      // — a late/duplicate succeeded event on an ACTIVE/RETURNED/CLOSED booking must NOT scramble it.
      const result = await prisma.$transaction(async (tx) => {
        await lockBookingRow(tx, payment.bookingId)
        await tx.payment.update({ where: { id: payment.id }, data: { status: 'PAID' } })
        const booking = await tx.booking.findUnique({ where: { id: payment.bookingId }, select: { status: true } })
        const advance = booking ? canTransition(booking.status, 'CONFIRMED') : false
        if (advance) {
          await tx.booking.update({ where: { id: payment.bookingId }, data: { status: 'CONFIRMED' } })
          await tx.bookingStatusEvent.create({
            data: { bookingId: payment.bookingId, status: 'CONFIRMED', comment: 'Оплата картой получена (Stripe)' },
          })
        }
        return { advance, prevStatus: booking?.status ?? null }
      })
      await recomputeBookingBalance(payment.bookingId)
      await logAudit({
        action: result.advance ? 'payment.stripe.succeeded' : 'payment.stripe.succeeded.no_transition',
        entity: 'Booking',
        entityId: payment.bookingId,
        meta: result.advance ? undefined : { currentStatus: result.prevStatus },
      })
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as Stripe.PaymentIntent
    const payment = await prisma.payment.findFirst({ where: { providerRef: intent.id } })
    if (payment) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'ERROR' } })
      await logAudit({ action: 'payment.stripe.failed', entity: 'Booking', entityId: payment.bookingId })
    }
  }

  return NextResponse.json({ received: true })
}
