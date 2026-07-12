import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getLocale } from '@/lib/i18n'
import { prisma } from '@/lib/db'
import { CLASS_LABEL } from '@/lib/view'
import type { BookingStatus } from '@prisma/client'
import ClientShell from '@/components/ClientShell'
import ActiveRental from '@/views/ActiveRental'

export const dynamic = 'force-dynamic'

/** The customer's current or next rental, surfaced to the "My car" tab. */
export interface ActiveBookingView {
  number: string
  status: BookingStatus
  startAt: string // ISO
  endAt: string // ISO
  inRentalNow: boolean
  car: { brand: string; model: string; year: number; clsLabel: string; coverUrl: string | null }
}

function coverUrlFor(car: { slug: string; photos: { storageKey: string; isExternal: boolean; isCover: boolean }[] }): string | null {
  const cover = car.photos.find((p) => p.isCover) ?? car.photos[0]
  if (!cover) return null
  return cover.isExternal ? cover.storageKey : `/api/car-photo/${car.slug}?size=thumb`
}

// Bookings that still represent a "live" rental (mirror of the /account hero logic).
const LIVE: BookingStatus[] = ['NEW', 'AWAITING_CONFIRMATION', 'AWAITING_PAYMENT', 'CONFIRMED', 'PREPARING', 'DELIVERED', 'ACTIVE']

export default async function ActivePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth')

  const lang = getLocale()
  const bookings = await prisma.booking.findMany({
    where: { userId: user.id, status: { in: LIVE } },
    orderBy: { startAt: 'asc' },
    include: { car: { include: { photos: true } } },
  })

  const now = Date.now()
  const inRental = bookings.find((b) => b.startAt.getTime() <= now && b.endAt.getTime() >= now)
  const b = inRental ?? bookings[0] ?? null

  const active: ActiveBookingView | null = b
    ? {
        number: b.number,
        status: b.status,
        startAt: b.startAt.toISOString(),
        endAt: b.endAt.toISOString(),
        inRentalNow: !!inRental && inRental.id === b.id,
        car: {
          brand: b.car.brand,
          model: b.car.model,
          year: b.car.year,
          clsLabel: CLASS_LABEL[b.car.class][lang] ?? CLASS_LABEL[b.car.class].en,
          coverUrl: coverUrlFor(b.car),
        },
      }
    : null

  return (
    <ClientShell>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '22px 16px 40px' }}>
        <ActiveRental booking={active} />
      </div>
    </ClientShell>
  )
}
