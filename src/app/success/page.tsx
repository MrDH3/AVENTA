import { redirect } from 'next/navigation'
import type { Currency } from '@prisma/client'
import type { Lang } from '@/i18n/lang'
import { getLocale } from '@/lib/i18n'
import { getCurrentUser, isStaff } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatMoney } from '@/lib/money'
import { formatDayMonth } from '@/lib/view'
import Success from '@/views/Success'

export const dynamic = 'force-dynamic'

/**
 * Plain, JSON-serializable booking snapshot handed to the client <Success> view.
 * All Decimals are converted to numbers and Dates to ISO strings; money is
 * pre-formatted server-side so the client view stays free of Prisma types.
 */
export interface SuccessBooking {
  id: string
  number: string
  status: string
  createdAtISO: string
  // car
  carBrand: string
  carModel: string
  carYear: number
  carName: string
  // period
  startISO: string
  endISO: string
  days: number
  datesLabel: string // e.g. "10–15 авг · 5 сут · AYT → AYT"
  periodLabel: string // e.g. "10.08.2026 12:00 — 15.08.2026 12:00"
  periodLong: string // e.g. "11 – 31 Jul 2026" (clean date range for the hero/vehicle strip)
  routeText: string // e.g. "AYT → AYT" (pickup → return)
  carClass: string // e.g. "Business · 2024" (localized class + year)
  // money (numbers + formatted strings)
  currency: Currency
  rentTotal: number
  extrasTotal: number
  insuranceTotal: number
  subtotal: number
  depositAmount: number
  prepaidAmount: number
  balanceAmount: number
  pricePerDay: number
  rentMoney: string
  extrasMoney: string
  insuranceMoney: string
  subtotalMoney: string
  depositMoney: string
  prepaidMoney: string
  balanceMoney: string
  pricePerDayMoney: string
  // client + pickup
  clientName: string
  clientPhone: string | null
  clientPassport: string | null
  clientLicense: string | null
  pickupAddress: string
  pickupCode: string // short code shown in the "AYT → AYT" chip
  insuranceLabel: string | null
}

/** Bank-transfer coordinates shown in the payment panel (from the Setting table). */
export interface SuccessBankDetails {
  iban: string
  swift: string
  holder: string
}

/** Company support contact shown in the contract's "Your manager" sidebar card (from Settings + env). */
export interface SuccessSupport {
  name: string
  phone: string | null
  email: string | null
  whatsappHref: string | null
  telegramHref: string | null
}

/** Logged-in user summary for the left-sidebar shell profile chip. */
export interface SuccessShellUser {
  fullName: string
  initial: string
  tierName: string
}

/** Localized label for the car's class enum (Business / SUV / …). */
const CARCLASS_LABEL: Record<string, Record<Lang, string>> = {
  ECONOMY: { ru: 'Эконом', en: 'Economy', tr: 'Ekonomi', es: 'Económico', de: 'Economy' },
  STANDARD: { ru: 'Стандарт', en: 'Standard', tr: 'Standart', es: 'Estándar', de: 'Standard' },
  COMFORT: { ru: 'Комфорт', en: 'Comfort', tr: 'Konfor', es: 'Confort', de: 'Komfort' },
  BUSINESS: { ru: 'Бизнес', en: 'Business', tr: 'İş sınıfı', es: 'Business', de: 'Business' },
  PREMIUM: { ru: 'Премиум', en: 'Premium', tr: 'Premium', es: 'Premium', de: 'Premium' },
  SUV: { ru: 'Внедорожник', en: 'SUV', tr: 'SUV', es: 'SUV', de: 'SUV' },
  LUXURY: { ru: 'Люкс', en: 'Luxury', tr: 'Lüks', es: 'Lujo', de: 'Luxus' },
}

/** BCP-47 tag per UI language, for Intl date formatting of the clean period range. */
const LOCALE_TAG: Record<Lang, string> = { ru: 'ru-RU', en: 'en-GB', tr: 'tr-TR', es: 'es-ES', de: 'de-DE' }

/** "11 – 31 Jul 2026" style compact range (collapses shared month/year). */
function periodRange(start: Date, end: Date, lang: Lang): string {
  const tag = LOCALE_TAG[lang] ?? LOCALE_TAG.en
  const mon = (d: Date) => new Intl.DateTimeFormat(tag, { month: 'short' }).format(d).replace('.', '')
  const sameYear = start.getFullYear() === end.getFullYear()
  const sameMonth = sameYear && start.getMonth() === end.getMonth()
  if (sameMonth) return `${start.getDate()} – ${end.getDate()} ${mon(end)} ${end.getFullYear()}`
  if (sameYear) return `${start.getDate()} ${mon(start)} – ${end.getDate()} ${mon(end)} ${end.getFullYear()}`
  return `${start.getDate()} ${mon(start)} ${start.getFullYear()} – ${end.getDate()} ${mon(end)} ${end.getFullYear()}`
}

const PICKUP_KIND_LABEL: Record<string, Record<Lang, string>> = {
  AIRPORT: { ru: 'Аэропорт', en: 'Airport', tr: 'Havalimanı', es: 'Aeropuerto', de: 'Flughafen' },
  HOTEL: { ru: 'Отель', en: 'Hotel', tr: 'Otel', es: 'Hotel', de: 'Hotel' },
  COMPLEX: { ru: 'Комплекс', en: 'Complex', tr: 'Kompleks', es: 'Complejo', de: 'Komplex' },
  ADDRESS: { ru: 'Адрес', en: 'Address', tr: 'Adres', es: 'Dirección', de: 'Adresse' },
  OTHER: { ru: 'Другое', en: 'Other', tr: 'Diğer', es: 'Otro', de: 'Sonstiges' },
}

const INSURANCE_LABEL: Record<string, Record<Lang, string>> = {
  BASIC: { ru: 'Базовая', en: 'Basic', tr: 'Temel', es: 'Básico', de: 'Basis' },
  EXTENDED: { ru: 'Расширенная', en: 'Extended', tr: 'Genişletilmiş', es: 'Ampliado', de: 'Erweitert' },
  FULL_NO_FRANCHISE: {
    ru: 'Полная без франшизы',
    en: 'Full, no deductible',
    tr: 'Tam, muafiyetsiz',
    es: 'Completo, sin franquicia',
    de: 'Voll, ohne Selbstbeteiligung',
  },
}

const SUT: Record<Lang, string> = { ru: 'сут', en: 'days', tr: 'gün', es: 'días', de: 'Tage' }

/** Localized fallbacks for an empty pickup address and a nameless client (all UI languages). */
const NOT_SPECIFIED: Record<Lang, string> = {
  ru: 'Не указано',
  en: 'Not specified',
  tr: 'Belirtilmemiş',
  es: 'No especificado',
  de: 'Nicht angegeben',
}
const CLIENT_FALLBACK: Record<Lang, string> = {
  ru: 'Клиент',
  en: 'Client',
  tr: 'Müşteri',
  es: 'Cliente',
  de: 'Kunde',
}

/** Compose the human pickup address from the booking's structured location fields. */
function pickupAddress(
  b: {
    pickupKind: string
    pickupCountry: string | null
    pickupCity: string | null
    pickupDistrict: string | null
    pickupAddress: string | null
  },
  lang: Lang,
): string {
  if (b.pickupAddress) return b.pickupAddress
  const parts = [
    PICKUP_KIND_LABEL[b.pickupKind]?.[lang] ?? b.pickupKind,
    b.pickupDistrict,
    b.pickupCity,
    b.pickupCountry,
  ].filter((x): x is string => Boolean(x && x.length))
  return parts.join(', ') || (NOT_SPECIFIED[lang] ?? NOT_SPECIFIED.en)
}

/** Short uppercase code for the pickup chip (e.g. AYT from "Antalya Airport (AYT)"). */
function pickupCode(address: string, city: string | null): string {
  const paren = address.match(/\(([A-Z]{3,4})\)/)
  if (paren) return paren[1]
  const source = (city ?? address).trim()
  return source ? source.slice(0, 3).toUpperCase() : '—'
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** "10.08.2026 12:00" style timestamp for the contract subject table. */
function stamp(d: Date): string {
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { b?: string }
}) {
  const lang = getLocale()
  const number = searchParams.b

  const user = await getCurrentUser()
  if (!user) redirect('/auth')

  // Logged-in user summary for the shared left-sidebar shell (same chrome as the /account cabinet).
  const shellUser: SuccessShellUser = {
    fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'AVENTA',
    initial: ((user.firstName || user.email || 'A').trim()[0] || 'A').toUpperCase(),
    tierName: user.loyaltyTier || 'SILVER',
  }

  // No booking number → clean "no booking found" empty state (never fabricated booking data / PII).
  if (!number) {
    return <Success booking={null} notFound shellUser={shellUser} />
  }

  const booking = await prisma.booking.findUnique({
    where: { number },
    include: {
      car: true,
      user: true,
      extras: true,
      insurance: true,
      additionalDrivers: true,
    },
  })

  // Graceful not-found state (do not leak whether the number exists via redirect).
  if (!booking) {
    return <Success booking={null} notFound shellUser={shellUser} />
  }

  // Authorize: owner of the booking, or staff (ADMIN/OWNER). Otherwise bounce.
  const allowed = booking.userId === user.id || isStaff(user.role)
  if (!allowed) redirect('/account')

  const currency = booking.currency
  const money = (v: unknown): string => formatMoney(Number(v), currency)

  const start = booking.startAt
  const end = booking.endAt
  const addr = pickupAddress(booking, lang)
  const code = pickupCode(addr, booking.pickupCity)

  const client = booking.user
  const clientName =
    [client.firstName, client.lastName].filter(Boolean).join(' ') ||
    client.email ||
    (CLIENT_FALLBACK[lang] ?? CLIENT_FALLBACK.en)

  const datesLabel = `${formatDayMonth(start, lang)}–${formatDayMonth(end, lang)} · ${booking.days} ${
    SUT[lang] ?? SUT.en
  } · ${code} → ${code}`

  const periodLong = periodRange(start, end, lang)
  const routePoint = booking.pickupCity || code
  const routeText = `${routePoint} → ${routePoint}`
  const carClass = `${CARCLASS_LABEL[booking.car.class]?.[lang] ?? booking.car.class} · ${booking.car.year}`

  // Company support contact for the "Your manager" sidebar card (never fabricated: only real Settings/env).
  const supportRows = await prisma.setting.findMany({
    where: { key: { in: ['company_name', 'company_phone', 'company_email'] } },
  })
  const sget = (k: string): string => supportRows.find((r) => r.key === k)?.value ?? ''
  const supportPhone = sget('company_phone')
  const waDigits = supportPhone.replace(/[^0-9]/g, '')
  const tgUser = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? '').replace(/^@/, '').trim()
  const support: SuccessSupport = {
    name: sget('company_name') || 'AVENTA',
    phone: supportPhone || null,
    email: sget('company_email') || null,
    whatsappHref: waDigits ? `https://wa.me/${waDigits}` : null,
    telegramHref: tgUser ? `https://t.me/${tgUser}` : null,
  }

  const dto: SuccessBooking = {
    id: booking.id,
    number: booking.number,
    status: booking.status,
    createdAtISO: booking.createdAt.toISOString(),
    carBrand: booking.car.brand,
    carModel: booking.car.model,
    carYear: booking.car.year,
    carName: `${booking.car.brand} ${booking.car.model}`,
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    days: booking.days,
    datesLabel,
    periodLabel: `${stamp(start)} — ${stamp(end)}`,
    periodLong,
    routeText,
    carClass,
    currency,
    rentTotal: Number(booking.rentTotal),
    extrasTotal: Number(booking.extrasTotal),
    insuranceTotal: Number(booking.insuranceTotal),
    subtotal: Number(booking.subtotal),
    depositAmount: Number(booking.depositAmount),
    prepaidAmount: Number(booking.prepaidAmount),
    balanceAmount: Number(booking.balanceAmount),
    pricePerDay: Number(booking.car.pricePerDay),
    rentMoney: money(booking.rentTotal),
    extrasMoney: money(booking.extrasTotal),
    insuranceMoney: money(booking.insuranceTotal),
    subtotalMoney: money(booking.subtotal),
    depositMoney: money(booking.depositAmount),
    prepaidMoney: money(booking.prepaidAmount),
    balanceMoney: money(booking.balanceAmount),
    pricePerDayMoney: money(booking.car.pricePerDay),
    clientName,
    clientPhone: client.phone,
    clientPassport: null,
    clientLicense: null,
    pickupAddress: addr,
    pickupCode: code,
    insuranceLabel: booking.insurance
      ? INSURANCE_LABEL[booking.insurance.type]?.[lang] ?? booking.insurance.type
      : null,
  }

  return <Success booking={dto} support={support} shellUser={shellUser} />
}
