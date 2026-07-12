import 'server-only'
import type { Currency, Service, TripGoal } from '@prisma/client'
import type { Lang } from '@/i18n/lang'
import { prisma } from './db'
import { carStatusNow, checkCarAvailability, listAvailableCars } from './availability'
import { carToView, type CarView } from './view'
import { loadRates } from './money'

/** Full fleet as view models with live availability. Optionally scoped to a date range. */
export async function getFleetViews(
  lang: Lang,
  opts: { start?: Date; end?: Date; onlyAvailable?: boolean; includeInactive?: boolean } = {},
): Promise<CarView[]> {
  const cars = await prisma.car.findMany({
    where: opts.includeInactive ? {} : { active: true },
    include: { photos: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { sortOrder: 'asc' },
  })

  const rangeAvail =
    opts.start && opts.end
      ? new Set(await listAvailableCars(opts.start, opts.end))
      : null

  const views = await Promise.all(
    cars.map(async (car) => {
      if (rangeAvail) {
        const available = rangeAvail.has(car.id)
        return carToView(car, lang, { available, nextFree: null })
      }
      const s = await carStatusNow(car.id)
      return carToView(car, lang, { available: s.availableNow, nextFree: s.nextFree })
    }),
  )

  return opts.onlyAvailable ? views.filter((v) => v.available) : views
}

export async function getCarViewBySlug(slug: string, lang: Lang): Promise<CarView | null> {
  const car = await prisma.car.findUnique({
    where: { slug },
    include: { photos: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!car) return null
  const s = await carStatusNow(car.id)
  return carToView(car, lang, { available: s.availableNow, nextFree: s.nextFree })
}

/** Car detail incl. busy days for a mini calendar (this + next month). */
export async function getCarWithBusyDays(slug: string, lang: Lang) {
  const view = await getCarViewBySlug(slug, lang)
  if (!view) return null
  const car = await prisma.car.findUnique({ where: { slug } })
  if (!car) return null
  const from = new Date()
  from.setHours(0, 0, 0, 0)
  const bookings = await prisma.booking.findMany({
    where: {
      carId: car.id,
      status: { in: ['NEW', 'AWAITING_CONFIRMATION', 'AWAITING_PAYMENT', 'CONFIRMED', 'PREPARING', 'DELIVERED', 'ACTIVE'] },
      endAt: { gte: from },
    },
    select: { startAt: true, endAt: true },
  })
  return { view, busy: bookings.map((b) => ({ start: b.startAt.toISOString(), end: b.endAt.toISOString() })) }
}

export interface ServiceView {
  id: string
  key: string
  category: string
  name: string
  desc: string | null
  price: number
  unit: string
  forGoals: TripGoal[]
}

function serviceToView(s: Service, lang: Lang): ServiceView {
  return {
    id: s.id,
    key: s.key,
    category: s.category,
    name: lang === 'ru' ? s.nameRu : s.nameEn,
    desc: lang === 'ru' ? s.descRu : s.descEn,
    price: Number(s.price),
    unit: s.unit,
    forGoals: s.forGoals,
  }
}

export async function getServices(lang: Lang, goal?: TripGoal): Promise<ServiceView[]> {
  const services = await prisma.service.findMany({
    where: { active: true, ...(goal ? { forGoals: { has: goal } } : {}) },
    orderBy: { sortOrder: 'asc' },
  })
  return services.map((s) => serviceToView(s, lang))
}

/** Extras selectable during booking (excludes zero-price consultative real-estate items). */
export async function getBookingExtras(lang: Lang): Promise<ServiceView[]> {
  const services = await prisma.service.findMany({
    where: { active: true, category: { in: ['RENTAL', 'TRANSFER', 'CONNECTIVITY'] } },
    orderBy: { sortOrder: 'asc' },
  })
  return services.map((s) => serviceToView(s, lang))
}

export async function getRates(): Promise<Record<Currency, number>> {
  return loadRates()
}

export async function isRangeAvailable(carId: string, start: Date, end: Date) {
  return checkCarAvailability(carId, start, end)
}
