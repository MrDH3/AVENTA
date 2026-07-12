import { redirect } from 'next/navigation'
import type {
  BookingStatus,
  CarClass,
  Currency,
  DocumentStatus,
  DocumentType,
  Fuel,
  Gearbox,
  InsuranceStatus,
  InsuranceType,
  PaymentKind,
  PaymentMethod,
  PaymentStatus,
  ServiceCategory,
  TripGoal,
} from '@prisma/client'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { buildReviewDocs, type ReviewDoc } from '@/lib/verification'
import { getMapConfig } from '@/lib/map-provider'
import Admin from '@/views/Admin'
import type { AdminNavKey } from '@/components/AdminShell'

export const dynamic = 'force-dynamic'

/* ============================================================
   Serialized prop shapes crossing to the client Admin view.
   All dates -> ISO strings, all Prisma Decimals -> numbers.
   ============================================================ */

export interface AdminCarRef {
  id: string
  slug: string
  brand: string
  model: string
  year: number
  cls: CarClass
}

export interface AdminBookingRow {
  id: string
  number: string
  status: BookingStatus
  clientName: string
  carName: string
  startAt: string // ISO
  endAt: string // ISO
  days: number
  currency: Currency
  subtotal: number
  depositAmount: number
  prepaidAmount: number
  balanceAmount: number
}

export interface AdminDocument {
  id: string
  type: DocumentType
  filename: string
  status: DocumentStatus
  rejectionReason: string | null
  uploadedAt: string // ISO
}

export interface AdminPaymentLine {
  id: string
  method: PaymentMethod
  kind: PaymentKind
  currency: Currency
  amount: number
  status: PaymentStatus
  txHash: string | null
  proofDocId: string | null
  accountName: string | null
  createdAt: string // ISO
}

export interface AdminStatusEvent {
  id: string
  status: BookingStatus
  comment: string | null
  createdAt: string // ISO
}

export interface AdminBookingDetail {
  id: string
  number: string
  status: BookingStatus
  startAt: string
  endAt: string
  days: number
  currency: Currency
  rentTotal: number
  extrasTotal: number
  insuranceTotal: number
  subtotal: number
  depositAmount: number
  prepaidAmount: number
  balanceAmount: number
  adminComment: string | null
  tripGoal: TripGoal | null
  // pickup
  pickupKind: string
  pickupCountry: string | null
  pickupCity: string | null
  pickupDistrict: string | null
  pickupAddress: string | null
  pickupComment: string | null
  pickupLat: number | null
  pickupLng: number | null
  returnSameAsPickup: boolean
  returnCity: string | null
  returnAddress: string | null
  // client
  client: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    phone: string | null
    whatsapp: string | null
    telegram: string | null
    birthDate: string | null
    citizenship: string | null
    passportNo: string | null
    passportExpiry: string | null
    licenseNo: string | null
    licenseCountry: string | null
    licenseIssue: string | null
    licenseExpiry: string | null
    addressCountry: string | null
    addressCity: string | null
    addressLine: string | null
    verificationStatus: string
    verifiedAt: string | null
    verificationReason: string | null
    sumsubApplicantId: string | null
    reviewDocs: ReviewDoc[]
  }
  car: AdminCarRef & { clsLabel: string; specs: string }
  extras: { id: string; name: string; qty: number; total: number }[]
  insurance: { type: InsuranceType; status: InsuranceStatus; price: number } | null
  additionalDrivers: { id: string; firstName: string; lastName: string; licenseNo: string | null; licenseCountry: string | null }[]
  documents: AdminDocument[]
  idDocuments: { id: string; type: string; mime: string; filename: string }[]
  payments: AdminPaymentLine[]
  statusHistory: AdminStatusEvent[]
  smart: { tripGoal: TripGoal; needs: string[]; notes: string | null } | null
  accounts: { id: string; name: string }[]
}

export interface AdminCar {
  id: string
  slug: string
  brand: string
  model: string
  year: number
  cls: CarClass
  gearbox: Gearbox
  fuel: Fuel
  seats: number
  doors: number
  airConditioning: boolean
  pricePerDay: number
  deposit: number
  mileageLimitPerDay: number | null
  minRentalDays: number
  prepHoursBetween: number
  active: boolean
  coverUrl: string | null
  photos: { id: string; storageKey: string; isExternal: boolean; isCover: boolean; sortOrder: number }[]
}

export interface AdminClient {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  phone: string | null
  whatsapp: string | null
  citizenship: string | null
  tripCount: number
  hasPassport: boolean
  hasLicense: boolean
  verificationStatus: string
  passportExpiry: string | null
  licenseExpiry: string | null
  verificationReason: string | null
  idDocuments: { id: string; type: string; mime: string }[]
  reviewDocs: ReviewDoc[]
}

export interface AdminPaymentRow {
  id: string
  bookingNumber: string
  clientName: string
  method: PaymentMethod
  kind: PaymentKind
  currency: Currency
  amount: number
  status: PaymentStatus
  createdAt: string // ISO
}

export interface AdminService {
  id: string
  key: string
  category: ServiceCategory
  name: string
  nameRu: string
  nameEn: string
  descRu: string
  descEn: string
  price: number
  unit: string
  forGoals: TripGoal[]
  active: boolean
  sortOrder: number
}

export interface AdminRate {
  code: Currency
  symbol: string
  rateFromBase: number
  active: boolean
}

export interface AdminSetting {
  key: string
  value: string
  group: string
}

export interface AdminMapConfig {
  activeProvider: 'osm' | 'google' | 'yandex'
  configured: { google: boolean; yandex: boolean }
}

export interface AdminProps {
  tab: AdminNavKey
  bookings: AdminBookingRow[]
  statusCounts: Record<string, number>
  detail: AdminBookingDetail | null
  cars: AdminCar[]
  clients: AdminClient[]
  payments: AdminPaymentRow[]
  services: AdminService[]
  rates: AdminRate[]
  settings: AdminSetting[]
  mapConfig: AdminMapConfig
}

const KNOWN_TABS: AdminNavKey[] = ['bookings', 'cars', 'clients', 'payments', 'services', 'settings']

const CLASS_RU: Record<CarClass, string> = {
  ECONOMY: 'Эконом',
  COMFORT: 'Комфорт',
  BUSINESS: 'Бизнес',
  PREMIUM: 'Премиум',
  SUV: 'Премиум SUV',
  MINIVAN: 'Минивэн VIP',
}
const GEARBOX_RU: Record<Gearbox, string> = { AUTOMATIC: 'Автомат', MANUAL: 'Механика' }
const FUEL_RU: Record<Fuel, string> = { PETROL: 'Бензин', DIESEL: 'Дизель', HYBRID: 'Гибрид', ELECTRIC: 'Электро' }

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null
}

function coverUrlFor(car: {
  slug: string
  photos: { storageKey: string; isExternal: boolean; isCover: boolean }[]
}): string | null {
  const cover = car.photos.find((p) => p.isCover) ?? car.photos[0]
  if (!cover) return null
  return cover.isExternal ? cover.storageKey : `/api/car-photo/${car.slug}?size=thumb`
}

function fullName(u: { firstName: string | null; lastName: string | null; email: string }): string {
  const n = [u.firstName, u.lastName].filter(Boolean).join(' ').trim()
  return n || u.email
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { tab?: string; booking?: string }
}) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) redirect('/auth')

  const rawTab = searchParams.tab as AdminNavKey | undefined
  const tab: AdminNavKey = rawTab && KNOWN_TABS.includes(rawTab) ? rawTab : 'bookings'
  const bookingId = searchParams.booking

  const [
    bookingRows,
    grouped,
    carRows,
    clientRows,
    paymentRows,
    serviceRows,
    rateRows,
    settingRows,
    detailRaw,
    accountRows,
    mapCfg,
  ] = await Promise.all([
    prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      include: { car: true, user: true },
    }),
    prisma.booking.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.car.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { photos: { orderBy: { sortOrder: 'asc' } } },
    }),
    prisma.user.findMany({
      where: { role: 'CLIENT' },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { bookings: true } }, profile: true, documents: { select: { id: true, type: true, mime: true, status: true, expiresAt: true, rejectionReason: true, supersededAt: true, uploadedAt: true } } },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { booking: { include: { user: true } } },
    }),
    prisma.service.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] }),
    prisma.currencyRate.findMany(),
    prisma.setting.findMany(),
    bookingId
      ? prisma.booking.findUnique({
          where: { id: bookingId },
          include: {
            car: true,
            user: { include: { profile: true } },
            extras: true,
            insurance: true,
            additionalDrivers: true,
            documents: { orderBy: { uploadedAt: 'desc' } },
            payments: { orderBy: { createdAt: 'desc' }, include: { account: { select: { name: true } } } },
            statusHistory: { orderBy: { createdAt: 'desc' } },
            smartResponse: true,
          },
        })
      : Promise.resolve(null),
    prisma.account.findMany({ where: { archived: false }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], select: { id: true, name: true } }),
    getMapConfig(),
  ])

  const statusCounts: Record<string, number> = {}
  for (const g of grouped) statusCounts[g.status] = g._count.status

  const bookings: AdminBookingRow[] = bookingRows.map((b) => ({
    id: b.id,
    number: b.number,
    status: b.status,
    clientName: fullName(b.user),
    carName: `${b.car.brand} ${b.car.model}`,
    startAt: b.startAt.toISOString(),
    endAt: b.endAt.toISOString(),
    days: b.days,
    currency: b.currency,
    subtotal: Number(b.subtotal),
    depositAmount: Number(b.depositAmount),
    prepaidAmount: Number(b.prepaidAmount),
    balanceAmount: Number(b.balanceAmount),
  }))

  const cars: AdminCar[] = carRows.map((c) => ({
    id: c.id,
    slug: c.slug,
    brand: c.brand,
    model: c.model,
    year: c.year,
    cls: c.class,
    gearbox: c.gearbox,
    fuel: c.fuel,
    seats: c.seats,
    doors: c.doors,
    airConditioning: c.airConditioning,
    pricePerDay: Number(c.pricePerDay),
    deposit: Number(c.deposit),
    mileageLimitPerDay: c.mileageLimitPerDay,
    minRentalDays: c.minRentalDays,
    prepHoursBetween: c.prepHoursBetween,
    active: c.active,
    coverUrl: coverUrlFor(c),
    photos: c.photos.map((p) => ({
      id: p.id,
      storageKey: p.storageKey,
      isExternal: p.isExternal,
      isCover: p.isCover,
      sortOrder: p.sortOrder,
    })),
  }))

  const clients: AdminClient[] = clientRows.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    whatsapp: c.whatsapp,
    citizenship: c.profile?.citizenship ?? null,
    tripCount: c._count.bookings,
    hasPassport: c.documents.some((d) => d.type === 'PASSPORT'),
    hasLicense: c.documents.some((d) => d.type === 'LICENSE_FRONT' || d.type === 'LICENSE_BACK'),
    verificationStatus: c.profile?.verificationStatus ?? 'NONE',
    passportExpiry: iso(c.profile?.passportExpiry),
    licenseExpiry: iso(c.profile?.licenseExpiry),
    verificationReason: c.profile?.verificationReason ?? null,
    idDocuments: c.documents
      .filter((d) => d.type === 'PASSPORT' || d.type === 'SELFIE' || d.type === 'LICENSE_FRONT' || d.type === 'LICENSE_BACK')
      .map((d) => ({ id: d.id, type: d.type, mime: d.mime })),
    // Per-document review list (derived from CURRENT, non-superseded ID attempts).
    reviewDocs: buildReviewDocs(c.documents.filter((d) => d.supersededAt === null), 'ru'),
  }))

  const payments: AdminPaymentRow[] = paymentRows.map((p) => ({
    id: p.id,
    bookingNumber: p.booking.number,
    clientName: fullName(p.booking.user),
    method: p.method,
    kind: p.kind,
    currency: p.currency,
    amount: Number(p.amount),
    status: p.status,
    createdAt: p.createdAt.toISOString(),
  }))

  const services: AdminService[] = serviceRows.map((s) => ({
    id: s.id,
    key: s.key,
    category: s.category,
    name: s.nameRu,
    nameRu: s.nameRu,
    nameEn: s.nameEn,
    descRu: s.descRu ?? '',
    descEn: s.descEn ?? '',
    price: Number(s.price),
    unit: s.unit,
    forGoals: s.forGoals,
    active: s.active,
    sortOrder: s.sortOrder,
  }))

  const rates: AdminRate[] = rateRows.map((r) => ({
    code: r.code,
    symbol: r.symbol,
    rateFromBase: Number(r.rateFromBase),
    active: r.active,
  }))

  const settings: AdminSetting[] = settingRows.map((s) => ({ key: s.key, value: s.value, group: s.group }))

  const mapConfig = { activeProvider: mapCfg.activeProvider, configured: mapCfg.configured }

  let detail: AdminBookingDetail | null = null
  if (detailRaw) {
    const b = detailRaw
    const p = b.user.profile
    // Customer ID documents — manual uploads AND/OR Sumsub images (served ONLY via the gated /api/documents route).
    const idDocs = await prisma.document.findMany({
      where: { userId: b.user.id, type: { in: ['PASSPORT', 'SELFIE', 'LICENSE_FRONT', 'LICENSE_BACK'] } },
      orderBy: { type: 'asc' },
      select: { id: true, type: true, mime: true, filename: true, status: true, expiresAt: true, rejectionReason: true, supersededAt: true, uploadedAt: true },
    })
    // Per-document review list for the customer of this booking (CURRENT attempts only).
    const clientReviewDocs = buildReviewDocs(idDocs.filter((d) => d.supersededAt === null), 'ru')
    detail = {
      id: b.id,
      number: b.number,
      status: b.status,
      startAt: b.startAt.toISOString(),
      endAt: b.endAt.toISOString(),
      days: b.days,
      currency: b.currency,
      rentTotal: Number(b.rentTotal),
      extrasTotal: Number(b.extrasTotal),
      insuranceTotal: Number(b.insuranceTotal),
      subtotal: Number(b.subtotal),
      depositAmount: Number(b.depositAmount),
      prepaidAmount: Number(b.prepaidAmount),
      balanceAmount: Number(b.balanceAmount),
      adminComment: b.adminComment,
      tripGoal: b.tripGoal,
      pickupKind: b.pickupKind,
      pickupCountry: b.pickupCountry,
      pickupCity: b.pickupCity,
      pickupDistrict: b.pickupDistrict,
      pickupAddress: b.pickupAddress,
      pickupComment: b.pickupComment,
      pickupLat: b.pickupLat,
      pickupLng: b.pickupLng,
      returnSameAsPickup: b.returnSameAsPickup,
      returnCity: b.returnCity,
      returnAddress: b.returnAddress,
      client: {
        id: b.user.id,
        email: b.user.email,
        firstName: b.user.firstName,
        lastName: b.user.lastName,
        phone: b.user.phone,
        whatsapp: b.user.whatsapp,
        telegram: b.user.telegram,
        birthDate: iso(p?.birthDate),
        citizenship: p?.citizenship ?? null,
        passportNo: p?.passportNo ?? null,
        passportExpiry: iso(p?.passportExpiry),
        licenseNo: p?.licenseNo ?? null,
        licenseCountry: p?.licenseCountry ?? null,
        licenseIssue: iso(p?.licenseIssue),
        licenseExpiry: iso(p?.licenseExpiry),
        addressCountry: p?.addressCountry ?? null,
        addressCity: p?.addressCity ?? null,
        addressLine: p?.addressLine ?? null,
        verificationStatus: p?.verificationStatus ?? 'NONE',
        verifiedAt: iso(p?.verifiedAt),
        verificationReason: p?.verificationReason ?? null,
        sumsubApplicantId: p?.sumsubApplicantId ?? null,
        reviewDocs: clientReviewDocs,
      },
      car: {
        id: b.car.id,
        slug: b.car.slug,
        brand: b.car.brand,
        model: b.car.model,
        year: b.car.year,
        cls: b.car.class,
        clsLabel: CLASS_RU[b.car.class],
        specs: `${GEARBOX_RU[b.car.gearbox]} · ${FUEL_RU[b.car.fuel]} · ${b.car.seats} мест`,
      },
      extras: b.extras.map((e) => ({ id: e.id, name: e.nameRu, qty: e.qty, total: Number(e.total) })),
      insurance: b.insurance
        ? { type: b.insurance.type, status: b.insurance.status, price: Number(b.insurance.price) }
        : null,
      additionalDrivers: b.additionalDrivers.map((d) => ({
        id: d.id,
        firstName: d.firstName,
        lastName: d.lastName,
        licenseNo: d.licenseNo,
        licenseCountry: d.licenseCountry,
      })),
      documents: b.documents.map((d) => ({
        id: d.id,
        type: d.type,
        filename: d.filename,
        status: d.status,
        rejectionReason: d.rejectionReason,
        uploadedAt: d.uploadedAt.toISOString(),
      })),
      idDocuments: idDocs.map((d) => ({ id: d.id, type: d.type, mime: d.mime, filename: d.filename })),
      payments: b.payments.map((pay) => ({
        id: pay.id,
        method: pay.method,
        kind: pay.kind,
        currency: pay.currency,
        amount: Number(pay.amount),
        status: pay.status,
        txHash: pay.txHash,
        proofDocId: pay.proofDocId,
        accountName: pay.account?.name ?? null,
        createdAt: pay.createdAt.toISOString(),
      })),
      statusHistory: b.statusHistory.map((s) => ({
        id: s.id,
        status: s.status,
        comment: s.comment,
        createdAt: s.createdAt.toISOString(),
      })),
      smart: b.smartResponse
        ? { tripGoal: b.smartResponse.tripGoal, needs: b.smartResponse.needs, notes: b.smartResponse.notes }
        : null,
      accounts: accountRows,
    }
  }

  return (
    <Admin
      tab={tab}
      bookings={bookings}
      statusCounts={statusCounts}
      detail={detail}
      cars={cars}
      clients={clients}
      payments={payments}
      services={services}
      rates={rates}
      settings={settings}
      mapConfig={mapConfig}
    />
  )
}
