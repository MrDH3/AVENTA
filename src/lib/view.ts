import type { Car, CarClass, Fuel, Gearbox } from '@prisma/client'
import type { Lang, Dict } from '@/i18n/lang'

/** Pick a localized label, falling back to English for languages without a translation. */
function pick<T>(m: Dict<T>, l: Lang): T {
  return m[l] ?? m.en
}

export const CLASS_LABEL: Record<CarClass, Dict<string>> = {
  ECONOMY: { ru: 'Эконом', en: 'Economy', tr: 'Ekonomi', es: 'Económico', de: 'Economy' },
  COMFORT: { ru: 'Комфорт', en: 'Comfort', tr: 'Konfor', es: 'Confort', de: 'Komfort' },
  BUSINESS: { ru: 'Бизнес', en: 'Business', tr: 'Business', es: 'Business', de: 'Business' },
  PREMIUM: { ru: 'Премиум', en: 'Premium', tr: 'Premium', es: 'Premium', de: 'Premium' },
  SUV: { ru: 'Премиум SUV', en: 'Premium SUV', tr: 'Premium SUV', es: 'SUV Premium', de: 'Premium SUV' },
  MINIVAN: { ru: 'Минивэн VIP', en: 'Minivan VIP', tr: 'Minivan VIP', es: 'Monovolumen VIP', de: 'Minivan VIP' },
}
export const FUEL_LABEL: Record<Fuel, Dict<string>> = {
  PETROL: { ru: 'Бензин', en: 'Petrol', tr: 'Benzin', es: 'Gasolina', de: 'Benzin' },
  DIESEL: { ru: 'Дизель', en: 'Diesel', tr: 'Dizel', es: 'Diésel', de: 'Diesel' },
  HYBRID: { ru: 'Гибрид', en: 'Hybrid', tr: 'Hibrit', es: 'Híbrido', de: 'Hybrid' },
  ELECTRIC: { ru: 'Электро', en: 'Electric', tr: 'Elektrik', es: 'Eléctrico', de: 'Elektro' },
}
export const GEARBOX_LABEL: Record<Gearbox, Dict<string>> = {
  AUTOMATIC: { ru: 'Автомат', en: 'Automatic', tr: 'Otomatik', es: 'Automático', de: 'Automatik' },
  MANUAL: { ru: 'Механика', en: 'Manual', tr: 'Manuel', es: 'Manual', de: 'Manuell' },
}
const SEATS_WORD: Dict<string> = { ru: 'мест', en: 'seats', tr: 'koltuk', es: 'plazas', de: 'Sitze' }

const STATUS_FREE: Dict<string> = { ru: 'Свободен', en: 'Available', tr: 'Müsait', es: 'Disponible', de: 'Verfügbar' }
const STATUS_BUSY: Dict<string> = { ru: 'Занят', en: 'Busy', tr: 'Dolu', es: 'Ocupado', de: 'Belegt' }
const STATUS_BUSY_UNTIL: Dict<(d: string) => string> = {
  ru: (d) => `Занят до ${d}`,
  en: (d) => `Busy until ${d}`,
  tr: (d) => `${d} tarihine kadar dolu`,
  es: (d) => `Ocupado hasta el ${d}`,
  de: (d) => `Belegt bis ${d}`,
}

const MONTHS: Dict<string[]> = {
  ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  tr: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
}
export function formatDayMonth(d: Date, lang: Lang): string {
  const months = pick(MONTHS, lang)
  return lang === 'ru' ? `${d.getDate()} ${months[d.getMonth()]}` : `${months[d.getMonth()]} ${d.getDate()}`
}

/** Serializable car view model consumed by CarCard / catalog / booking UIs. */
export interface CarView {
  id: string
  slug: string
  brand: string
  model: string
  year: number
  cls: CarClass
  clsLabel: string
  fuelLabel: string
  gearboxLabel: string
  seats: number
  doors: number
  airConditioning: boolean
  specs: string
  pricePerDay: number
  deposit: number
  mileageLimitPerDay: number | null
  conditions: string | null
  available: boolean
  /** Recent model year → shows a "New car" badge on the card. */
  isNew: boolean
  statusText: string
  nextFree: string | null // ISO
  coverUrl: string | null
  photos: { full: string; thumb: string }[] // cover first; for the card carousel
}

export interface CarStatusInfo {
  available: boolean
  nextFree: Date | null
}

export function carToView(
  car: Car & { photos?: { storageKey: string; isExternal: boolean; isCover: boolean }[] },
  lang: Lang,
  status: CarStatusInfo,
): CarView {
  const cover =
    car.photos?.find((p) => p.isCover) ?? car.photos?.[0]
  const coverUrl = cover ? (cover.isExternal ? cover.storageKey : `/api/car-photo/${car.slug}`) : null

  // Cover first, then the rest in sortOrder. Local files serve directly from
  // /uploads/cars (full = main WebP, thumb = the .t.webp rendition for cards).
  const orderedPhotos = [
    ...(car.photos ?? []).filter((p) => p.isCover),
    ...(car.photos ?? []).filter((p) => !p.isCover),
  ]
  const photos = orderedPhotos.map((p) => {
    if (p.isExternal) return { full: p.storageKey, thumb: p.storageKey }
    const full = `/uploads/cars/${p.storageKey}`
    const thumb = /\.webp$/i.test(p.storageKey) ? `/uploads/cars/${p.storageKey.replace(/\.webp$/i, '.t.webp')}` : full
    return { full, thumb }
  })
  const specs = `${pick(GEARBOX_LABEL[car.gearbox], lang)} · ${pick(FUEL_LABEL[car.fuel], lang)} · ${car.seats} ${pick(SEATS_WORD, lang)}`
  const statusText = status.available
    ? pick(STATUS_FREE, lang)
    : status.nextFree
      ? pick(STATUS_BUSY_UNTIL, lang)(formatDayMonth(status.nextFree, lang))
      : pick(STATUS_BUSY, lang)
  return {
    id: car.id,
    slug: car.slug,
    brand: car.brand,
    model: car.model,
    year: car.year,
    cls: car.class,
    clsLabel: pick(CLASS_LABEL[car.class], lang),
    fuelLabel: pick(FUEL_LABEL[car.fuel], lang),
    gearboxLabel: pick(GEARBOX_LABEL[car.gearbox], lang),
    seats: car.seats,
    doors: car.doors,
    airConditioning: car.airConditioning,
    specs,
    pricePerDay: Number(car.pricePerDay),
    deposit: Number(car.deposit),
    mileageLimitPerDay: car.mileageLimitPerDay,
    conditions: lang === 'ru' ? car.conditionsRu : car.conditionsEn,
    available: status.available,
    isNew: car.year >= new Date().getFullYear() - 1,
    statusText,
    nextFree: status.nextFree ? status.nextFree.toISOString() : null,
    coverUrl,
    photos,
  }
}
