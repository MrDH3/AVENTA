import { redirect } from 'next/navigation'
import { getCurrentUser, isStaff } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatMoney } from '@/lib/money'
import type { BookingStatus, TripGoal } from '@prisma/client'
import CRM from '@/views/CRM'

export const dynamic = 'force-dynamic'

/* ----------------------------------------------------------------------------
 * Serializable props (all plain numbers / strings — safe across the RSC boundary)
 * ------------------------------------------------------------------------- */

export interface CrmKpis {
  /** Revenue this calendar month, base currency (EUR), formatted. */
  revenueMonth: string
  /** Revenue today, base currency (EUR), formatted. */
  revenueToday: number
  revenueTodayLabel: string
  /** Handovers (deliveries) happening today. */
  handoversToday: number
  /** Average check across non-cancelled bookings (EUR), formatted. */
  averageCheck: string
  /** Average rental length in days across non-cancelled bookings. */
  averageDays: number
  /** Fleet utilization this month, 0–100. */
  utilizationPct: number
}

export interface CrmFleet {
  total: number
  rented: number
  free: number
  service: number
}

export interface CrmRevenueDay {
  /** Day-of-month label, e.g. "29". */
  day: string
  /** Sum of baseTotal for bookings created that day (EUR). */
  value: number
}

export interface CrmProfitCar {
  name: string
  /** Sum of baseTotal for this car this month (EUR). */
  value: number
  /** Pre-formatted "€2 140". */
  label: string
}

export interface CrmInterestRow {
  label: string
  /** Share of smart-service responses that selected this goal, 0–100. */
  pct: number
  count: number
}

export interface CrmTodayEvent {
  kind: 'return' | 'handover'
  title: string
  meta: string
}

/* ----------------------------------------------------------------------------
 * Labels (RU-only internal screen)
 * ------------------------------------------------------------------------- */

const GOAL_LABEL_RU: Record<TripGoal, string> = {
  LEISURE: 'Отдых',
  BUSINESS: 'Бизнес',
  PROPERTY_PURCHASE: 'Покупка недвижимости',
  PROPERTY_VIEWING: 'Просмотр недвижимости',
  MEDICAL: 'Медицинский туризм',
  RELOCATION: 'Переезд',
  LONG_STAY: 'Долгосрочная аренда',
  VISITING: 'Визит к близким',
  OTHER: 'Другое',
}

/** Bookings that never contribute revenue / utilization. */
const DEAD_STATUSES: BookingStatus[] = ['CANCELLED']
/** A car is "in rental now" when its live booking is in one of these states. */
const ON_ROAD_STATUSES: BookingStatus[] = ['DELIVERED', 'ACTIVE']

const MONTH_NAMES_RU = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
]

/* ----------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
/** Number of days [a, b) overlaps [rangeStart, rangeEnd), floored at 0. */
function overlapDays(a: Date, b: Date, rangeStart: Date, rangeEnd: Date): number {
  const s = Math.max(a.getTime(), rangeStart.getTime())
  const e = Math.min(b.getTime(), rangeEnd.getTime())
  if (e <= s) return 0
  return (e - s) / 86_400_000
}

export default async function CrmPage() {
  const user = await getCurrentUser()
  if (!user || !isStaff(user.role)) redirect('/auth')

  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = addDays(todayStart, 1)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const series14Start = addDays(todayStart, -13) // inclusive window of 14 days

  const [
    totalCars,
    onRoadBookings,
    returnsDueToday,
    handoversToday,
    revenueTodayAgg,
    revenueMonthAgg,
    checkAgg,
    monthBookings,
    profitGrouped,
    series14Rows,
    smartResponses,
  ] = await Promise.all([
    // Active fleet size (the pool the dashboard reports on).
    prisma.car.count({ where: { active: true } }),

    // Distinct cars currently out on the road (live booking spanning now).
    prisma.booking.findMany({
      where: {
        status: { in: ON_ROAD_STATUSES },
        startAt: { lte: now },
        endAt: { gt: now },
      },
      select: { carId: true },
      distinct: ['carId'],
    }),

    // Returns whose endAt falls inside today (excl. cancelled).
    prisma.booking.findMany({
      where: {
        status: { notIn: DEAD_STATUSES },
        endAt: { gte: todayStart, lt: todayEnd },
      },
      select: { number: true, endAt: true, car: { select: { brand: true, model: true } } },
      orderBy: { endAt: 'asc' },
    }),

    // Handovers (pickups) starting today (excl. cancelled).
    prisma.booking.findMany({
      where: {
        status: { notIn: DEAD_STATUSES },
        startAt: { gte: todayStart, lt: todayEnd },
      },
      select: { number: true, startAt: true, car: { select: { brand: true, model: true } } },
      orderBy: { startAt: 'asc' },
    }),

    // Revenue today: baseTotal of bookings created today (excl. cancelled).
    prisma.booking.aggregate({
      _sum: { baseTotal: true },
      where: { status: { notIn: DEAD_STATUSES }, createdAt: { gte: todayStart, lt: todayEnd } },
    }),

    // Revenue this month: baseTotal of bookings created this month (excl. cancelled).
    prisma.booking.aggregate({
      _sum: { baseTotal: true },
      where: { status: { notIn: DEAD_STATUSES }, createdAt: { gte: monthStart, lt: nextMonthStart } },
    }),

    // Average check + average rental length across all non-cancelled bookings.
    prisma.booking.aggregate({
      _avg: { baseTotal: true, days: true },
      where: { status: { notIn: DEAD_STATUSES } },
    }),

    // Bookings overlapping this month (for utilization car-days).
    prisma.booking.findMany({
      where: {
        status: { notIn: DEAD_STATUSES },
        startAt: { lt: nextMonthStart },
        endAt: { gt: monthStart },
      },
      select: { startAt: true, endAt: true },
    }),

    // Profit per car this month = sum(baseTotal) grouped by car (created this month).
    prisma.booking.groupBy({
      by: ['carId'],
      _sum: { baseTotal: true },
      where: { status: { notIn: DEAD_STATUSES }, createdAt: { gte: monthStart, lt: nextMonthStart } },
      orderBy: { _sum: { baseTotal: 'desc' } },
      take: 5,
    }),

    // 14-day series raw rows (grouped in JS by local calendar day).
    prisma.booking.findMany({
      where: {
        status: { notIn: DEAD_STATUSES },
        createdAt: { gte: series14Start, lt: todayEnd },
      },
      select: { createdAt: true, baseTotal: true },
    }),

    // Client interest: trip goals from smart-service responses.
    prisma.smartServiceResponse.groupBy({
      by: ['tripGoal'],
      _count: { tripGoal: true },
      orderBy: { _count: { tripGoal: 'desc' } },
    }),
  ])

  /* ---- Fleet ---- */
  const rented = onRoadBookings.length
  const fleet: CrmFleet = {
    total: totalCars,
    rented,
    free: Math.max(0, totalCars - rented),
    service: 0, // no maintenance model yet — kept for the donut's third slice.
  }

  /* ---- Utilization: booked car-days this month / capacity ---- */
  const daysElapsed = Math.max(1, overlapDays(monthStart, nextMonthStart, monthStart, now) || 1)
  const capacityCarDays = totalCars * daysElapsed
  const bookedCarDays = monthBookings.reduce(
    (acc, b) => acc + overlapDays(b.startAt, b.endAt, monthStart, now),
    0,
  )
  const utilizationPct =
    capacityCarDays > 0 ? Math.min(100, Math.round((bookedCarDays / capacityCarDays) * 100)) : 0

  /* ---- Money ---- */
  const revenueMonthNum = Number(revenueMonthAgg._sum.baseTotal ?? 0)
  const revenueTodayNum = Number(revenueTodayAgg._sum.baseTotal ?? 0)
  const averageCheckNum = Number(checkAgg._avg.baseTotal ?? 0)
  const averageDaysNum = Number(checkAgg._avg.days ?? 0)

  const kpis: CrmKpis = {
    revenueMonth: formatMoney(revenueMonthNum, 'EUR'),
    revenueToday: revenueTodayNum,
    revenueTodayLabel: formatMoney(revenueTodayNum, 'EUR'),
    handoversToday: handoversToday.length,
    averageCheck: formatMoney(averageCheckNum, 'EUR'),
    averageDays: Math.round(averageDaysNum * 10) / 10,
    utilizationPct,
  }

  /* ---- 14-day revenue series (one bucket per local calendar day) ---- */
  const buckets = new Map<string, number>()
  for (let i = 0; i < 14; i++) {
    const d = addDays(series14Start, i)
    buckets.set(startOfDay(d).toISOString(), 0)
  }
  for (const row of series14Rows) {
    const key = startOfDay(row.createdAt).toISOString()
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + Number(row.baseTotal))
  }
  const revenueSeries: CrmRevenueDay[] = Array.from(buckets.entries()).map(([iso, value]) => ({
    day: String(new Date(iso).getDate()),
    value: Math.round(value),
  }))

  /* ---- Profit per car (resolve car names for the grouped ids) ---- */
  const carIds = profitGrouped.map((g) => g.carId)
  const carRows = carIds.length
    ? await prisma.car.findMany({
        where: { id: { in: carIds } },
        select: { id: true, brand: true, model: true },
      })
    : []
  const carName = new Map(carRows.map((c) => [c.id, `${c.brand} ${c.model}`]))
  const profitCars: CrmProfitCar[] = profitGrouped.map((g) => {
    const value = Number(g._sum.baseTotal ?? 0)
    return {
      name: carName.get(g.carId) ?? '—',
      value: Math.round(value),
      label: formatMoney(value, 'EUR'),
    }
  })

  /* ---- Client interest (share of responses per goal) ---- */
  const totalResponses = smartResponses.reduce((acc, r) => acc + r._count.tripGoal, 0)
  const interest: CrmInterestRow[] = smartResponses.slice(0, 6).map((r) => ({
    label: GOAL_LABEL_RU[r.tripGoal],
    count: r._count.tripGoal,
    pct: totalResponses > 0 ? Math.round((r._count.tripGoal / totalResponses) * 100) : 0,
  }))

  /* ---- Today's events (returns + handovers, chronological) ---- */
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false })
  const todayEvents: CrmTodayEvent[] = [
    ...returnsDueToday.map((b): CrmTodayEvent & { at: number } => ({
      kind: 'return',
      title: `Возврат · ${b.car.brand} ${b.car.model}`,
      meta: `${fmtTime(b.endAt)} · ${b.number}`,
      at: b.endAt.getTime(),
    })),
    ...handoversToday.map((b): CrmTodayEvent & { at: number } => ({
      kind: 'handover',
      title: `Выдача · ${b.car.brand} ${b.car.model}`,
      meta: `${fmtTime(b.startAt)} · ${b.number}`,
      at: b.startAt.getTime(),
    })),
  ]
    .sort((a, b) => a.at - b.at)
    .slice(0, 6)
    .map(({ kind, title, meta }) => ({ kind, title, meta }))

  const monthLabel = `${MONTH_NAMES_RU[now.getMonth()]} ${now.getFullYear()}`

  return (
    <CRM
      monthLabel={monthLabel}
      kpis={kpis}
      fleet={fleet}
      revenueSeries={revenueSeries}
      profitCars={profitCars}
      interest={interest}
      todayEvents={todayEvents}
      returnsDueTodayCount={returnsDueToday.length}
    />
  )
}
