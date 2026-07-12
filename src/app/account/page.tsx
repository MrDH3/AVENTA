import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getLocale } from '@/lib/i18n'
import { prisma } from '@/lib/db'
import { CLASS_LABEL } from '@/lib/view'
import { getVerificationForUser } from '@/lib/verification-server'
import { listEnabledOffices, type OfficeRow } from '@/lib/locations'
import { getMapClientConfig, type MapProvider } from '@/lib/map-provider'
import type { SavedPlaceView } from '@/server/map-actions'
import type { BookingStatus } from '@prisma/client'
import Account from '@/views/Account'

export const dynamic = 'force-dynamic'

/** Plain, JSON-serializable snapshot of the signed-in user. */
export interface AccountUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  whatsapp: string | null
  telegram: string | null
  loyaltyTier: string | null
}

/** A car reference used in booking rows / the "book again" hero. */
export interface AccountCar {
  slug: string
  brand: string
  model: string
  year: number
  clsLabel: string
  pricePerDay: number
  coverUrl: string | null
}

export interface AccountBooking {
  id: string
  number: string
  status: BookingStatus
  startAt: string // ISO
  endAt: string // ISO
  days: number
  currency: string
  subtotal: number
  car: AccountCar
}

export interface AccountDocument {
  id: string
  type: string
  filename: string
  status: string
  uploadedAt: string // ISO
}

function iso(d: Date): string {
  return d.toISOString()
}

function coverUrlFor(car: {
  slug: string
  photos: { storageKey: string; isExternal: boolean; isCover: boolean }[]
}): string | null {
  const cover = car.photos.find((p) => p.isCover) ?? car.photos[0]
  if (!cover) return null
  return cover.isExternal ? cover.storageKey : `/api/car-photo/${car.slug}?size=thumb`
}

export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth')

  const lang = getLocale()

  const [bookings, documents, profile, offices, placeRows, mapCfg] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { car: { include: { photos: true } } },
    }),
    // Cabinet shows ONLY the customer's currently-VALID documents (approved, not superseded, not
    // expired) — their accepted set. Rejected / superseded / pending / EXPIRED attempts are excluded
    // here; the derived verification banner surfaces any expired/rejected doc so the customer knows
    // what to resubmit (an expired doc must never render as a green "verified ✓" card).
    prisma.document.findMany({
      where: {
        userId: user.id,
        status: 'VERIFIED',
        supersededAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { uploadedAt: 'desc' },
    }),
    prisma.clientProfile.findUnique({ where: { userId: user.id } }),
    listEnabledOffices(),
    prisma.savedPlace.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
    getMapClientConfig(),
  ])

  const toAccountCar = (car: (typeof bookings)[number]['car']): AccountCar => ({
    slug: car.slug,
    brand: car.brand,
    model: car.model,
    year: car.year,
    clsLabel: CLASS_LABEL[car.class][lang] ?? CLASS_LABEL[car.class].en,
    pricePerDay: Number(car.pricePerDay),
    coverUrl: coverUrlFor(car),
  })

  const serializedBookings: AccountBooking[] = bookings.map((b) => ({
    id: b.id,
    number: b.number,
    status: b.status,
    startAt: iso(b.startAt),
    endAt: iso(b.endAt),
    days: b.days,
    currency: b.currency,
    subtotal: Number(b.subtotal),
    car: toAccountCar(b.car),
  }))

  // Favourite car = the car from the most recent booking (bookings are createdAt desc).
  const favouriteCar: AccountCar | null = bookings.length > 0 ? toAccountCar(bookings[0].car) : null
  const lastPickupCity = bookings.length > 0 ? bookings[0].pickupCity ?? bookings[0].pickupAddress : null

  const serializedUser: AccountUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    whatsapp: user.whatsapp,
    telegram: user.telegram,
    loyaltyTier: user.loyaltyTier,
  }

  const serializedDocuments: AccountDocument[] = documents.map((d) => ({
    id: d.id,
    type: d.type,
    filename: d.filename,
    status: d.status,
    uploadedAt: iso(d.uploadedAt),
  }))

  return (
    <Account
      user={serializedUser}
      bookings={serializedBookings}
      favouriteCar={favouriteCar}
      lastPickupCity={lastPickupCity}
      tripCount={bookings.length}
      documents={serializedDocuments}
      hasProfile={profile != null}
      verification={await getVerificationForUser(user.id)}
      offices={offices}
      savedPlaces={placeRows.map((p): SavedPlaceView => ({ id: p.id, label: p.label, lat: p.lat, lng: p.lng, address: p.address }))}
      mapProvider={mapCfg.provider as MapProvider}
      mapApiKey={mapCfg.apiKey}
    />
  )
}
