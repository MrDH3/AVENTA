'use server'

import { prisma } from '@/lib/db'
import { checkCarAvailability, nextFreeInterval, rentalDays } from '@/lib/availability'

/**
 * The calendar's authoritative selection gate. It calls the EXACT same
 * `checkCarAvailability` that `createBookingAction` calls on submit, and the same
 * `nextFreeInterval` used by the submit error path to suggest a nearby range — so a
 * range the calendar accepts here is guaranteed to be accepted on submit, and one it
 * rejects is guaranteed to be rejected on submit. No availability logic is duplicated.
 */
export interface RangeCheckResult {
  ok: boolean
  reason?: 'OVERLAP' | 'MIN_RENTAL' | 'PAST' | 'INACTIVE' | 'INVALID_RANGE'
  minRentalDays?: number
  suggestion?: { start: string; end: string } | null
}

export async function validateCarRangeAction(input: {
  carId: string // slug or id (the booking flow passes the slug)
  start: string // ISO
  end: string // ISO
}): Promise<RangeCheckResult> {
  const car = await prisma.car.findFirst({
    where: { OR: [{ slug: input.carId }, { id: input.carId }] },
    select: { id: true },
  })
  if (!car) return { ok: false, reason: 'INACTIVE' }

  const start = new Date(input.start)
  const end = new Date(input.end)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return { ok: false, reason: 'INVALID_RANGE' }

  const res = await checkCarAvailability(car.id, start, end)
  if (res.available) return { ok: true }

  // Same nearest-range suggestion the submit path offers; honour min-rental for the length.
  const wanted = Math.max(rentalDays(start, end), res.minRentalDays ?? 1)
  const sugg = await nextFreeInterval(car.id, wanted, start)
  return {
    ok: false,
    reason: res.reason,
    minRentalDays: res.minRentalDays,
    suggestion: sugg ? { start: sugg.start.toISOString(), end: sugg.end.toISOString() } : null,
  }
}
