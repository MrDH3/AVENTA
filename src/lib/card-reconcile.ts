import 'server-only'
import { prisma } from './db'
import { stripe } from './payments'
import { logAudit } from './audit'

/**
 * CARD-DEPOSIT RECONCILIATION — the money-safety backstop for the pay-before-create card flow.
 *
 * A card deposit is charged by a Stripe PaymentIntent that is prepared WITHOUT a booking (the car is not
 * held yet); `prepareCardBookingAction` logs `payment.stripe.init` with the intent id, and only when the
 * client comes back and `createBookingAction` succeeds is a `Payment` row written with providerRef = the
 * intent id. If a prepared intent gets CAPTURED but never becomes a booking — a 3-D Secure redirect that
 * strands the tab, a lost session, an async-settled 'processing' charge, a client crash — the money is
 * charged with no booking and nothing else would ever refund it. This sweep finds those and refunds them.
 *
 * It is DISTINCT from the reservation-hold timeout (which cancels a created manual booking and releases
 * its car) and from the booking-draft cleanup (which deletes half-filled form data). This one touches
 * only stranded Stripe charges — no booking or car is involved.
 *
 * Idempotent & safe: it only refunds an intent that (a) has NO backing Payment row, (b) is `succeeded`,
 * (c) is one of OUR `booking_deposit` intents, and (d) is not already refunded — re-checked right before
 * the refund to shrink the create-vs-refund race to near-zero. A grace window keeps it from refunding an
 * intent whose booking is merely still being created.
 */

const GRACE_KEY = 'card_reconcile_grace_minutes'
const DEFAULT_GRACE_MINUTES = 30
const LOOKBACK_DAYS = 7 // don't rescan ancient audit rows every run; an orphan is caught within this window

export async function getCardReconcileGraceMinutes(): Promise<number> {
  const s = await prisma.setting.findUnique({ where: { key: GRACE_KEY } })
  const n = parseInt(s?.value ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_GRACE_MINUTES
}

export async function setCardReconcileGraceMinutes(minutes: number): Promise<void> {
  const v = String(Math.max(1, Math.floor(minutes)))
  await prisma.setting.upsert({
    where: { key: GRACE_KEY },
    update: { value: v, group: 'booking' },
    create: { key: GRACE_KEY, value: v, group: 'booking' },
  })
}

export interface CardReconcileResult {
  scanned: number
  refunded: number
  refundFailed: number
  graceMinutes: number
}

/** Sweep stranded (captured-but-never-booked) card deposits and refund them. Pass `now` for tests. */
export async function reconcileOrphanedCardDeposits(now: Date = new Date()): Promise<CardReconcileResult> {
  const graceMinutes = await getCardReconcileGraceMinutes()
  const s = stripe()
  if (!s) return { scanned: 0, refunded: 0, refundFailed: 0, graceMinutes }

  const cutoff = new Date(now.getTime() - graceMinutes * 60_000)
  const lookback = new Date(now.getTime() - LOOKBACK_DAYS * 864e5)

  // Candidate intents = every prepared deposit older than the grace window (from the init audit rows).
  const inits = await prisma.auditLog.findMany({
    where: { action: 'payment.stripe.init', entity: 'PaymentIntent', createdAt: { lt: cutoff, gt: lookback } },
    select: { entityId: true },
    orderBy: { createdAt: 'asc' },
  })
  const intentIds = Array.from(new Set(inits.map((r) => r.entityId).filter((x): x is string => !!x)))

  let refunded = 0
  let refundFailed = 0
  for (const intentId of intentIds) {
    // Backed a booking already? createBookingAction writes a Payment with this providerRef atomically
    // with the booking, so a Payment row means the deposit is legitimately tied to a booking — skip.
    if (await prisma.payment.findFirst({ where: { providerRef: intentId }, select: { id: true } })) continue

    let pi
    try {
      pi = await s.paymentIntents.retrieve(intentId, { expand: ['latest_charge'] })
    } catch {
      continue // not found / transient API error → reconsider next run
    }
    if (pi.status !== 'succeeded') continue // not captured → no funds stranded
    if (pi.metadata?.purpose !== 'booking_deposit') continue // only our booking deposits, never anything else
    const charge = typeof pi.latest_charge === 'object' && pi.latest_charge ? pi.latest_charge : null
    if (charge && (charge.refunded || (charge.amount_refunded ?? 0) > 0)) continue // already refunded

    // Re-check for a backing Payment as close to the refund as possible — closes the window where a late
    // createBookingAction committed between the first check and now (its verifyCardDeposit would also have
    // rejected a refunded intent, so the two guards together make double-spend/double-refund unreachable).
    if (await prisma.payment.findFirst({ where: { providerRef: intentId }, select: { id: true } })) continue

    try {
      await s.refunds.create({ payment_intent: intentId })
      refunded++
      await logAudit({
        userId: pi.metadata?.userId ?? null,
        action: 'payment.stripe.reconcile_refunded',
        entity: 'PaymentIntent',
        entityId: intentId,
        meta: { reason: 'orphaned_deposit', amount: pi.amount, currency: pi.currency, graceMinutes },
      }).catch(() => {})
    } catch (e) {
      refundFailed++
      // A failed refund of a stranded charge MUST be visible — the customer is charged with no booking.
      await logAudit({
        userId: pi.metadata?.userId ?? null,
        action: 'payment.stripe.reconcile_refund_failed',
        entity: 'PaymentIntent',
        entityId: intentId,
        meta: { reason: 'orphaned_deposit', error: e instanceof Error ? e.message : 'unknown' },
      }).catch(() => {})
    }
  }

  await logAudit({
    action: 'payment.stripe.reconcile.sweep',
    entity: 'PaymentIntent',
    entityId: 'card-reconcile',
    meta: { scanned: intentIds.length, refunded, refundFailed, graceMinutes },
  }).catch(() => {})
  return { scanned: intentIds.length, refunded, refundFailed, graceMinutes }
}
