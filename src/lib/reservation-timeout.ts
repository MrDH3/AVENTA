import 'server-only'
import type { BookingStatus } from '@prisma/client'
import { prisma } from './db'
import { canTransition } from './booking-status'
import { logAudit } from './audit'
import { lockBookingRow } from './booking-lock'

/**
 * 24-hour reservation-hold timeout.
 *
 * A MANUAL (bank/crypto) booking is created immediately holding the car in a pre-CONFIRMED status
 * (request-then-confirm). If an admin does not confirm payment within the configured window (default
 * 24h from creation), the hold auto-expires: the booking is CANCELLED and the car released. Automatic
 * (card) bookings are born CONFIRMED and are never in a hold status, so they are never touched.
 *
 * BEING-CONFIRMED-WINS / atomicity: a hold is expired only inside a transaction that LOCKS the booking
 * row (lockBookingRow) and re-checks, under the lock, that it is STILL a hold status AND has NO ACTIVE
 * payment (PAID/PARTIAL confirmed, OR AWAITING declared / a card payment in flight). Because CANCELLED
 * is terminal (a cancelled hold can never be un-cancelled per the rulebook), we must never cancel a
 * hold that is mid-payment — so the guard treats any in-flight payment as "being confirmed" and skips
 * it. Every path that mutates the booking under contention takes the same row lock: setPaymentStatus /
 * recordPayment / the Stripe webhook lock it before writing a payment, and setBookingStatus locks +
 * re-reads + re-checks canTransition inside its own transaction — so a status change or confirmation
 * that commits first is always observed, and neither side can clobber the other. All status changes go
 * through canTransition (no rulebook bypass).
 */

const HOLD_KEY = 'reservation_hold_hours'
const DEFAULT_HOLD_HOURS = 24

/**
 * The pre-CONFIRMED holding statuses from which CANCELLED is a valid transition — derived from the
 * single rulebook so it can never drift from it. These are exactly the unconfirmed MANUAL holds
 * (card bookings are born CONFIRMED and never sit here).
 */
export const HOLD_STATUSES: BookingStatus[] = (
  ['NEW', 'AWAITING_CONFIRMATION', 'AWAITING_PAYMENT'] as BookingStatus[]
).filter((s) => canTransition(s, 'CANCELLED'))

/** Configured hold window in hours (admin setting; default 24). */
export async function getReservationHoldHours(): Promise<number> {
  const s = await prisma.setting.findUnique({ where: { key: HOLD_KEY } })
  const n = parseInt(s?.value ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_HOLD_HOURS
}

export async function setReservationHoldHours(hours: number): Promise<void> {
  const v = String(Math.max(1, Math.floor(hours)))
  await prisma.setting.upsert({
    where: { key: HOLD_KEY },
    update: { value: v, group: 'booking' },
    create: { key: HOLD_KEY, value: v, group: 'booking' },
  })
}

export interface ReservationTimeoutResult {
  scanned: number
  expired: number
  holdHours: number
}

/**
 * Run the sweep. Pass `now` to make it deterministic in tests. Returns how many holds were scanned and
 * expired plus the window used. Safe to run repeatedly / concurrently (each booking is guarded).
 */
export async function runReservationTimeout(now: Date = new Date()): Promise<ReservationTimeoutResult> {
  const holdHours = await getReservationHoldHours()
  const cutoff = new Date(now.getTime() - holdHours * 3_600_000)

  // Cheap, non-authoritative pre-filter — the per-booking transaction below is authoritative.
  const candidates = await prisma.booking.findMany({
    where: { status: { in: HOLD_STATUSES }, createdAt: { lt: cutoff } },
    select: { id: true },
  })

  let expired = 0
  for (const { id } of candidates) {
    const didExpire = await prisma.$transaction(async (tx) => {
      await lockBookingRow(tx, id) // serialize vs a concurrent confirmation on THIS booking
      const b = await tx.booking.findUnique({ where: { id }, select: { status: true, createdAt: true } })
      if (!b || !HOLD_STATUSES.includes(b.status)) return false // advanced / confirmed / cancelled → skip
      if (b.createdAt >= cutoff) return false // no longer past the window (defensive)
      // ANY active payment protects the hold: PAID/PARTIAL (confirmed) OR AWAITING (declared / a card
      // payment in flight, i.e. "being confirmed"). Since the rulebook makes CANCELLED terminal — a
      // cancelled hold can never be un-cancelled — we must NOT cancel a hold that has a payment in
      // progress, or a confirmation landing just after the sweep would strand money on a released car.
      // Only holds with zero payment activity (no payment, or only dead NOT_PAID/ERROR/CANCELLED rows)
      // are genuinely abandoned and expire.
      const active = await tx.payment.count({ where: { bookingId: id, status: { in: ['PAID', 'PARTIAL', 'AWAITING'] } } })
      if (active > 0) return false
      if (!canTransition(b.status, 'CANCELLED')) return false // rulebook guard (single source of truth)

      await tx.booking.update({ where: { id }, data: { status: 'CANCELLED' } })
      await tx.bookingStatusEvent.create({
        data: { bookingId: id, status: 'CANCELLED', comment: `Автоотмена: бронь не подтверждена за ${holdHours} ч` },
      })
      return true
    })
    if (didExpire) {
      expired++
      await logAudit({ action: 'booking.hold.expired', entity: 'Booking', entityId: id, meta: { holdHours } }).catch(() => {})
    }
  }

  await logAudit({
    action: 'booking.hold.sweep',
    entity: 'Booking',
    entityId: 'reservation-timeout',
    meta: { holdHours, scanned: candidates.length, expired },
  }).catch(() => {})

  return { scanned: candidates.length, expired, holdHours }
}
