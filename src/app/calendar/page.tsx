import { redirect } from 'next/navigation'
import type { BookingStatus } from '@prisma/client'
import { getCurrentUser, isStaff, canManageSettings } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { BLOCKING_STATUSES } from '@/lib/availability'
import { CLASS_LABEL, formatDayMonth } from '@/lib/view'
import FleetCalendar, {
  type BarSegment,
  type BookingKind,
  type CarRow,
  type DayCell,
  type KpiChip,
} from '@/views/FleetCalendar'

export const dynamic = 'force-dynamic'

const WD = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] as const
const MONTHS_RU = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
] as const

/** Blocking status → the 4-color bar palette used by the Gantt view. */
function statusKind(status: BookingStatus): BookingKind {
  switch (status) {
    case 'ACTIVE':
    case 'DELIVERED':
      return 'active'
    case 'CONFIRMED':
    case 'PREPARING':
      return 'confirmed'
    case 'NEW':
    case 'AWAITING_CONFIRMATION':
    case 'AWAITING_PAYMENT':
      return 'pending'
    default:
      return 'closed'
  }
}

/** Short RU status word shown inside a bar. */
function statusWord(status: BookingStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'активна'
    case 'DELIVERED':
      return 'выдан'
    case 'CONFIRMED':
      return 'подтв.'
    case 'PREPARING':
      return 'подготовка'
    case 'AWAITING_PAYMENT':
      return 'оплата'
    case 'AWAITING_CONFIRMATION':
      return 'ожидает'
    case 'NEW':
      return 'новая'
    default:
      return status.toLowerCase()
  }
}

function clientName(user: { firstName: string | null; lastName: string | null; email: string }): string {
  const first = user.firstName?.trim() ?? ''
  const last = user.lastName?.trim() ?? ''
  if (first && last) return `${first[0]}. ${last}`
  const full = `${first} ${last}`.trim()
  return full || user.email.split('@')[0]
}

/** Parse ?month=YYYY-MM to a valid month; fall back to the current month. */
function resolveMonth(raw: string | undefined): { year: number; monthIdx: number } {
  const now = new Date()
  if (raw) {
    const m = /^(\d{4})-(\d{2})$/.exec(raw)
    if (m) {
      const year = Number(m[1])
      const monthIdx = Number(m[2]) - 1
      if (year >= 2000 && year <= 2100 && monthIdx >= 0 && monthIdx <= 11) {
        return { year, monthIdx }
      }
    }
  }
  return { year: now.getFullYear(), monthIdx: now.getMonth() }
}

function monthKey(year: number, monthIdx: number): string {
  return `${year}-${String(monthIdx + 1).padStart(2, '0')}`
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { month?: string }
}) {
  const user = await getCurrentUser()
  if (!user || !isStaff(user.role)) redirect('/auth')

  const { year, monthIdx } = resolveMonth(searchParams.month)
  const monthStart = new Date(year, monthIdx, 1)
  const monthEnd = new Date(year, monthIdx + 1, 1) // exclusive
  const daysIn = new Date(year, monthIdx + 1, 0).getDate()
  const spanMs = monthEnd.getTime() - monthStart.getTime()
  const now = new Date()

  const [cars, bookings] = await Promise.all([
    prisma.car.findMany({
      orderBy: [{ sortOrder: 'asc' }, { brand: 'asc' }, { model: 'asc' }],
    }),
    // Bookings with a blocking status overlapping the shown month.
    prisma.booking.findMany({
      where: {
        status: { in: BLOCKING_STATUSES },
        startAt: { lt: monthEnd },
        endAt: { gt: monthStart },
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { startAt: 'asc' },
    }),
  ])

  // Day header for the real month.
  const days: DayCell[] = Array.from({ length: daysIn }, (_, i) => {
    const day = i + 1
    const dow = new Date(year, monthIdx, day).getDay()
    return { day, wd: WD[dow], isWeekend: dow === 0 || dow === 6 }
  })

  // Group bookings by car and build clipped bar segments.
  const byCar = new Map<string, typeof bookings>()
  for (const b of bookings) {
    const list = byCar.get(b.carId)
    if (list) list.push(b)
    else byCar.set(b.carId, [b])
  }

  const rows: CarRow[] = cars.map((car) => {
    const list = byCar.get(car.id) ?? []
    const segments: BarSegment[] = list.map((b) => {
      const segStart = b.startAt < monthStart ? monthStart : b.startAt
      const segEnd = b.endAt > monthEnd ? monthEnd : b.endAt
      const leftPct = ((segStart.getTime() - monthStart.getTime()) / spanMs) * 100
      const widthPct = Math.max(
        0.8,
        ((segEnd.getTime() - segStart.getTime()) / spanMs) * 100,
      )
      const client = clientName(b.user)
      return {
        leftPct,
        widthPct,
        status: statusKind(b.status),
        client,
        label: `${client} · ${statusWord(b.status)}`,
        // Mobile-list extras: true booking dates + whether it spans the present moment.
        range: `${formatDayMonth(b.startAt, 'ru')} — ${formatDayMonth(b.endAt, 'ru')}`,
        statusWord: statusWord(b.status),
        spansNow: b.startAt <= now && b.endAt >= now,
      }
    })
    return {
      name: `${car.brand} ${car.model}`,
      cls: CLASS_LABEL[car.class].ru ?? CLASS_LABEL[car.class].en,
      segments,
    }
  })

  // ── KPIs (real) ────────────────────────────────────────────────────────
  // "In rental now": a blocking booking spanning the present moment.
  const inRentalCarIds = new Set(
    bookings.filter((b) => b.startAt <= now && b.endAt >= now).map((b) => b.carId),
  )
  const activeCarCount = cars.filter((c) => c.active).length
  const freeNow = Math.max(0, activeCarCount - inRentalCarIds.size)
  // "Returns today": blocking bookings ending today.
  const returnsToday = bookings.filter((b) => sameDay(b.endAt, now)).length
  // "New requests": bookings awaiting staff action (NEW / AWAITING_CONFIRMATION).
  const newRequests = bookings.filter(
    (b) => b.status === 'NEW' || b.status === 'AWAITING_CONFIRMATION',
  ).length

  const showingCurrentMonth = year === now.getFullYear() && monthIdx === now.getMonth()
  const freeLabel = showingCurrentMonth
    ? `СВОБОДНО СЕЙЧАС`
    : `АКТИВНЫЙ ПАРК`
  const freeValue = showingCurrentMonth
    ? `${freeNow} авто`
    : `${activeCarCount} авто`

  const kpis: KpiChip[] = [
    { label: freeLabel, value: freeValue, color: '#8FD7AD' },
    { label: 'В АРЕНДЕ СЕЙЧАС', value: `${inRentalCarIds.size} авто`, color: 'var(--d-text)' },
    { label: 'ВОЗВРАТЫ СЕГОДНЯ', value: `${returnsToday}`, color: 'var(--d-text)' },
    {
      label: 'НОВЫЕ ЗАЯВКИ',
      value: `${newRequests}`,
      color: newRequests > 0 ? '#FFB48A' : 'var(--d-text)',
    },
  ]

  // ── Fleet-load subtitle: share of car-days occupied this month ──────────
  const totalCarDays = activeCarCount * daysIn
  let occupiedDayMs = 0
  for (const b of bookings) {
    const s = b.startAt < monthStart ? monthStart : b.startAt
    const e = b.endAt > monthEnd ? monthEnd : b.endAt
    occupiedDayMs += Math.max(0, e.getTime() - s.getTime())
  }
  const occupiedCarDays = occupiedDayMs / 86_400_000
  const loadPct = totalCarDays > 0 ? Math.round((occupiedCarDays / totalCarDays) * 100) : 0
  const monthLabel = `${MONTHS_RU[monthIdx]} ${year}`
  const subtitle = `${cars.length} ${carsWord(cars.length)} · загрузка парка ${loadPct}% (${MONTHS_RU[monthIdx].toLowerCase()})`

  const prevDate = new Date(year, monthIdx - 1, 1)
  const nextDate = new Date(year, monthIdx + 1, 1)

  return (
    <FleetCalendar
      rows={rows}
      days={days}
      monthLabel={monthLabel}
      subtitle={subtitle}
      kpis={kpis}
      prevMonth={monthKey(prevDate.getFullYear(), prevDate.getMonth())}
      nextMonth={monthKey(nextDate.getFullYear(), nextDate.getMonth())}
      canSettings={canManageSettings(user)}
    />
  )
}

/** RU noun agreement for "автомобиль". */
function carsWord(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'автомобиль'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'автомобиля'
  return 'автомобилей'
}
