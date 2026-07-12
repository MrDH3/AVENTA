import type { BookingStatus, Prisma } from '@prisma/client'
import { prisma } from './db'

/** A Prisma client OR an interactive-transaction client — lets the overlap re-check run inside a $transaction. */
type Db = typeof prisma | Prisma.TransactionClient

/** Statuses that occupy a car (i.e. block overlapping bookings). */
export const BLOCKING_STATUSES: BookingStatus[] = [
  'NEW',
  'AWAITING_CONFIRMATION',
  'AWAITING_PAYMENT',
  'CONFIRMED',
  'PREPARING',
  'DELIVERED',
  'ACTIVE',
]

const MS_DAY = 86_400_000
const addHours = (d: Date, h: number) => new Date(d.getTime() + h * 3_600_000)

export function rentalDays(start: Date, end: Date): number {
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / MS_DAY))
}

/** Two ranges conflict when neither is separated by the required prep buffer. */
function conflicts(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
  prepHours: number,
): boolean {
  return aStart < addHours(bEnd, prepHours) && addHours(aEnd, prepHours) > bStart
}

export interface AvailabilityResult {
  available: boolean
  reason?: 'OVERLAP' | 'MIN_RENTAL' | 'PAST' | 'INACTIVE' | 'INVALID_RANGE'
  minRentalDays?: number
}

/** Is a specific car bookable for [start, end]? Enforces overlap, prep buffer, min rental. */
export async function checkCarAvailability(
  carId: string,
  start: Date,
  end: Date,
): Promise<AvailabilityResult> {
  if (!(start < end)) return { available: false, reason: 'INVALID_RANGE' }
  if (start.getTime() < Date.now() - MS_DAY) return { available: false, reason: 'PAST' }

  const car = await prisma.car.findUnique({ where: { id: carId } })
  if (!car || !car.active) return { available: false, reason: 'INACTIVE' }

  if (rentalDays(start, end) < car.minRentalDays) {
    return { available: false, reason: 'MIN_RENTAL', minRentalDays: car.minRentalDays }
  }

  const nearby = await prisma.booking.findMany({
    where: {
      carId,
      status: { in: BLOCKING_STATUSES },
      // pull anything remotely close; prep buffer handled precisely below
      endAt: { gte: addHours(start, -72) },
      startAt: { lte: addHours(end, 72) },
    },
    select: { startAt: true, endAt: true },
  })

  for (const b of nearby) {
    if (conflicts(start, end, b.startAt, b.endAt, car.prepHoursBetween)) {
      return { available: false, reason: 'OVERLAP' }
    }
  }
  return { available: true }
}

/**
 * Does any BLOCKING booking overlap [start, end] (incl. the prep buffer) for this car? Accepts a db
 * client so it can be re-run INSIDE the booking-create transaction (under a per-car advisory lock) to
 * close the check-then-create overbooking race — the pre-transaction checkCarAvailability alone can't,
 * because two concurrent requests both read "free" before either commits.
 */
export async function hasBlockingOverlap(
  db: Db,
  carId: string,
  start: Date,
  end: Date,
  prepHours: number,
): Promise<boolean> {
  const nearby = await db.booking.findMany({
    where: {
      carId,
      status: { in: BLOCKING_STATUSES },
      endAt: { gte: addHours(start, -72) },
      startAt: { lte: addHours(end, 72) },
    },
    select: { startAt: true, endAt: true },
  })
  return nearby.some((b) => conflicts(start, end, b.startAt, b.endAt, prepHours))
}

export interface BusyRange {
  start: Date
  end: Date
  status: BookingStatus
}

/** Occupied ranges for a car (for calendars), from `from` onward. */
export async function getBusyRanges(carId: string, from?: Date): Promise<BusyRange[]> {
  const bookings = await prisma.booking.findMany({
    where: {
      carId,
      status: { in: BLOCKING_STATUSES },
      ...(from ? { endAt: { gte: from } } : {}),
    },
    select: { startAt: true, endAt: true, status: true },
    orderBy: { startAt: 'asc' },
  })
  return bookings.map((b) => ({ start: b.startAt, end: b.endAt, status: b.status }))
}

/** Current status of a car: available now, or busy until a date. */
export async function carStatusNow(
  carId: string,
): Promise<{ availableNow: boolean; busyUntil: Date | null; nextFree: Date | null }> {
  const now = new Date()
  const ranges = await getBusyRanges(carId, now)
  const active = ranges.find((r) => r.start <= now && r.end >= now)
  if (!active) return { availableNow: true, busyUntil: null, nextFree: now }
  // walk contiguous bookings to find the real next-free moment
  const car = await prisma.car.findUnique({ where: { id: carId }, select: { prepHoursBetween: true } })
  const prep = car?.prepHoursBetween ?? 3
  let cursorEnd = active.end
  let advanced = true
  while (advanced) {
    advanced = false
    for (const r of ranges) {
      if (r.start <= addHours(cursorEnd, prep) && r.end > cursorEnd) {
        cursorEnd = r.end
        advanced = true
      }
    }
  }
  const nextFree = addHours(cursorEnd, prep)
  return { availableNow: false, busyUntil: active.end, nextFree }
}

/** Earliest date the car is free for `days` days, at/after `after`. */
export async function nextFreeInterval(
  carId: string,
  days: number,
  after: Date = new Date(),
): Promise<{ start: Date; end: Date } | null> {
  const car = await prisma.car.findUnique({ where: { id: carId } })
  if (!car) return null
  const ranges = await getBusyRanges(carId, after)
  const prep = car.prepHoursBetween
  let cursor = new Date(Math.max(after.getTime(), Date.now()))
  // try up to ~180 candidate gaps
  for (let i = 0; i < 200; i++) {
    const end = new Date(cursor.getTime() + days * MS_DAY)
    const clash = ranges.find((r) => conflicts(cursor, end, r.start, r.end, prep))
    if (!clash) return { start: cursor, end }
    cursor = addHours(clash.end, prep)
  }
  return null
}

/**
 * Per-day availability projection for the CALENDAR — derived from the exact same
 * primitives (getBusyRanges + car.prepHoursBetween + the `conflicts` helper) that
 * `checkCarAvailability` uses to validate a booking on submit. A day is:
 *   past  — before today (server-local); unselectable
 *   busy  — occupied by a blocking booking; unselectable (red)
 *   prep  — inside the turnaround/cleaning buffer around a booking; unselectable
 *   free  — bookable (green)
 * The `prep` verdict is literally "would a rental spanning this day conflict via the
 * prep buffer?" — so the calendar can never disagree with the submit gate about a day.
 */
export type DayState = 'past' | 'busy' | 'prep' | 'free'

export interface CalendarDay {
  date: string // YYYY-MM-DD (server-local)
  dow: number // 0=Sun … 6=Sat (server-local) — lets the client lay out weeks without TZ math
  state: DayState
}

export interface CarAvailability {
  carId: string
  prepHours: number
  minRentalDays: number
  serverNow: string // ISO
  availableNow: boolean
  busyUntil: string | null // ISO — "busy until" for a currently-rented car
  nextFree: string | null // ISO — first free moment (selection should start here)
  busy: { start: string; end: string; status: BookingStatus }[]
  days: CalendarDay[]
}

function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Calendar day-states for [from, to], plus busy ranges + car config + current status. */
export async function getCarAvailability(carId: string, from: Date, to: Date): Promise<CarAvailability | null> {
  const car = await prisma.car.findUnique({
    where: { id: carId },
    select: { prepHoursBetween: true, minRentalDays: true },
  })
  if (!car) return null
  const prep = car.prepHoursBetween

  // Pull bookings whose prep buffer could reach into the window (endAt within 72h before `from`).
  const ranges = await getBusyRanges(carId, addHours(from, -72))
  const status = await carStatusNow(carId)

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const days: CalendarDay[] = []
  const cur = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const last = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  // hard cap to avoid pathological ranges
  for (let i = 0; i < 400 && cur <= last; i++) {
    const dayStart = new Date(cur)
    const dayEnd = new Date(cur.getTime() + MS_DAY)
    let state: DayState
    if (dayStart < todayStart) {
      state = 'past'
    } else if (ranges.some((r) => dayStart < r.end && dayEnd > r.start)) {
      state = 'busy'
    } else if (ranges.some((r) => conflicts(dayStart, dayEnd, r.start, r.end, prep))) {
      // same `conflicts` the submit gate uses ⇒ a rental on this day would be rejected
      state = 'prep'
    } else {
      state = 'free'
    }
    days.push({ date: ymd(cur), dow: cur.getDay(), state })
    cur.setDate(cur.getDate() + 1)
  }

  return {
    carId,
    prepHours: prep,
    minRentalDays: car.minRentalDays,
    serverNow: now.toISOString(),
    availableNow: status.availableNow,
    busyUntil: status.busyUntil ? status.busyUntil.toISOString() : null,
    nextFree: status.nextFree ? status.nextFree.toISOString() : null,
    busy: ranges.map((r) => ({ start: r.start.toISOString(), end: r.end.toISOString(), status: r.status })),
    days,
  }
}

export interface CarFilter {
  classes?: string[]
  onlyActive?: boolean
}

/** "Show all free cars for my dates" — active cars with no conflict in [start,end]. */
export async function listAvailableCars(
  start: Date,
  end: Date,
  filter: CarFilter = {},
): Promise<string[]> {
  const cars = await prisma.car.findMany({
    where: { active: filter.onlyActive === false ? undefined : true },
    select: { id: true },
  })
  const results = await Promise.all(
    cars.map(async (c) => ({ id: c.id, res: await checkCarAvailability(c.id, start, end) })),
  )
  return results.filter((r) => r.res.available).map((r) => r.id)
}
