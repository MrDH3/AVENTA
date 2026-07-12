import { redirect } from 'next/navigation'
import { getLocale } from '@/lib/i18n'
import { prisma } from '@/lib/db'
import { getFleetViews } from '@/lib/queries'
import { getCurrentUser, isStaff } from '@/lib/auth'
import Home from '@/views/Home'
import type { AboutReview } from '@/components/AboutSection'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // The landing "/" is the PUBLIC storefront for logged-out visitors. Signed-in users land on their
  // own home instead of the generic hero — staff → admin panel, customers → their profile. The full
  // catalog (/catalog) and booking flow stay reachable for everyone (see the nav "Browse cars" link).
  const user = await getCurrentUser()
  if (user) redirect(isStaff(user.role) ? '/admin' : '/account')

  const lang = getLocale()
  const [cars, rows] = await Promise.all([
    getFleetViews(lang),
    prisma.review.findMany({ where: { approved: true }, orderBy: { createdAt: 'desc' } }),
  ])
  const reviews: AboutReview[] = rows.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    text: r.text,
    locale: r.locale,
    createdAt: r.createdAt.toISOString(),
  }))
  // Logged-out storefront only reaches here — no user, so no in-progress-draft "resume" state.
  return <Home cars={cars} reviews={reviews} resumeSlugs={[]} />
}
