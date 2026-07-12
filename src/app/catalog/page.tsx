import { getLocale } from '@/lib/i18n'
import { getFleetViews } from '@/lib/queries'
import { getCurrentUser, isStaff } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { toShellUser } from '@/lib/shell-user'
import Catalog from '@/views/Catalog'

export const dynamic = 'force-dynamic'

/**
 * Standalone car catalogue — the full storefront, reachable by EVERYONE (logged-out visitors and
 * signed-in customers alike). Signed-in customers land on their profile but reach this via the nav
 * "Browse cars" link, so logging in never hides the catalog. Each card links into the booking flow.
 * `authed`/`isStaff` only decide the nav's account CTA (Sign in vs My account).
 */
export default async function CatalogPage() {
  const lang = getLocale()
  const [cars, user, phoneRow] = await Promise.all([
    getFleetViews(lang),
    getCurrentUser(),
    prisma.setting.findUnique({ where: { key: 'company_phone' } }),
  ])
  // WhatsApp deep link for the mobile "concierge" bar (real company number only, never fabricated).
  const waDigits = (phoneRow?.value ?? '').replace(/[^0-9]/g, '')
  const contactWhatsapp = waDigits ? `https://wa.me/${waDigits}` : null
  return (
    <Catalog
      cars={cars}
      authed={!!user}
      isStaff={user ? isStaff(user.role) : false}
      contactWhatsapp={contactWhatsapp}
      shellUser={user ? toShellUser(user) : null}
    />
  )
}
