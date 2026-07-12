import { getLocale } from '@/lib/i18n'
import { getMapClientConfig } from '@/lib/map-provider'
import { getCarViewBySlug, getBookingExtras, getRates } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { getPaymentConfig } from '@/lib/payment-settings'
import { getEnabledPaymentProviders } from '@/lib/payment-providers'
import { listEnabledCities, listEnabledOffices, getDefaultCountry } from '@/lib/locations'
import { getCarAvailability, type CarAvailability } from '@/lib/availability'
import { getInsuranceTiers, type InsuranceTierView } from '@/lib/insurance'
import { getVerificationMethod, verificationRequired } from '@/lib/verification-method'
import { verificationState, type DerivedVerification, type VerificationState } from '@/lib/verification'
import { getVerificationForUser } from '@/lib/verification-server'
import { getUserDraftForCar, type DraftView } from '@/lib/booking-draft'
import { safeInternalPath } from '@/lib/safe-path'
import { walletQr } from '@/lib/payments'
import { prisma } from '@/lib/db'
import Booking from '@/views/Booking'

export const dynamic = 'force-dynamic'

/** Service city surfaced to the booking form (enabled only). */
export interface BookingCity {
  id: string
  name: string
  country: string
}
/** Company office for "pick up from office". */
export interface BookingOffice {
  id: string
  name: string
  address: string
  city: string | null
  country: string
  lat: number
  lng: number
}

/** Payment config surfaced to the booking step (public — no secrets). */
export interface BookingWallet {
  token: string
  network: string
  address: string
  qr: string // server-generated data URL
}
/** An enabled online payment processor surfaced to checkout (public — no secrets). */
export interface BookingProvider {
  key: string
  name: string
  cards: boolean
  crypto: boolean
}
export interface BookingPayment {
  depositPercent: number
  methods: { card: boolean; bank: boolean; crypto: boolean }
  wallets: BookingWallet[]
  bank: { accountName: string; iban: string; swift: string; local: string }
  /** Live online processors (Stripe/PayPal/PayTR/…) — only enabled+configured+eligible ones. */
  providers: BookingProvider[]
}

/** Plain, JSON-serializable snapshot of the signed-in user for prefill. */
export interface BookingUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  whatsapp: string | null
  loyaltyTier: string
}

/** Plain, JSON-serializable client profile (dates → ISO) for prefill. */
export interface BookingProfile {
  birthDate: string | null
  citizenship: string | null
  passportNo: string | null
  passportIssue: string | null
  passportExpiry: string | null
  licenseNo: string | null
  licenseIssue: string | null
  licenseExpiry: string | null
  licenseCountry: string | null
  addressLine: string | null
  additionalPhone: string | null
  phoneMessengers: string[]
  additionalPhoneMessengers: string[]
  docCountry: string | null
  docRegion: string | null
}

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null
}

/** A bare YYYY-MM-DD (e.g. a car's next-free date) → a datetime-local seed at 10:00. */
function dateSeed(v: string | undefined): string | null {
  if (!v) return null
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) return v.slice(0, 16) // already valid datetime-local
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T10:00` // bare date → 10:00
  return null // ignore anything malformed
}

/** Only a same-origin absolute path is a safe internal back target ('/x', never '//host'). */
function safeBack(v: string | undefined): string | null {
  return safeInternalPath(v)
}

export default async function BookingPage({
  searchParams,
}: {
  searchParams: { car?: string; goal?: string; start?: string; end?: string; from?: string; back?: string }
}) {
  const lang = getLocale()
  const slug = searchParams.car ?? 'mercedes-benz-e-200'

  const [car, extras, rates, user, payConfig, providers, cities, offices, defaultCountry] = await Promise.all([
    getCarViewBySlug(slug, lang),
    getBookingExtras(lang),
    getRates(),
    getCurrentUser(),
    getPaymentConfig(),
    getEnabledPaymentProviders(),
    listEnabledCities(),
    listEnabledOffices(),
    getDefaultCountry(),
  ])
  const insuranceTiers = await getInsuranceTiers(lang)
  const [verifyMethod, verifyRequired, mapClient] = await Promise.all([getVerificationMethod(), verificationRequired(), getMapClientConfig()])

  const wallets: BookingWallet[] = await Promise.all(
    payConfig.wallets.map(async (w) => ({ token: w.token, network: w.network, address: w.address, qr: await walletQr(w.address) })),
  )
  const payment: BookingPayment = {
    depositPercent: payConfig.depositPercent,
    methods: payConfig.methods,
    wallets,
    bank: payConfig.bank,
    providers,
  }

  // Fall back to the flagship car if the requested slug is unknown.
  const resolvedCar = car ?? (await getCarViewBySlug('mercedes-benz-e-200', lang))

  // Calendar availability from the SAME server engine that validates bookings on submit.
  // From the 1st of this month (complete grids) through +6 months.
  const availFrom = new Date()
  availFrom.setDate(1)
  availFrom.setHours(0, 0, 0, 0)
  const availTo = new Date(availFrom)
  availTo.setMonth(availTo.getMonth() + 6)
  const availability: CarAvailability | null = resolvedCar
    ? await getCarAvailability(resolvedCar.id, availFrom, availTo)
    : null

  let currentUser: BookingUser | null = null
  let profile: BookingProfile | null = null
  let verification: DerivedVerification | null = null
  let sumsubInitial: VerificationState | null = null

  if (user) {
    currentUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      whatsapp: user.whatsapp,
      loyaltyTier: user.loyaltyTier ?? 'SILVER',
    }
    const p = await prisma.clientProfile.findUnique({ where: { userId: user.id } })
    verification = await getVerificationForUser(user.id) // derived per-document (gate + Step 3 agree)
    sumsubInitial = verificationState(p) // applicant-level state, only used by the Sumsub widget
    if (p) {
      profile = {
        birthDate: iso(p.birthDate),
        citizenship: p.citizenship,
        passportNo: p.passportNo,
        passportIssue: iso(p.passportIssue),
        passportExpiry: iso(p.passportExpiry),
        licenseNo: p.licenseNo,
        licenseIssue: iso(p.licenseIssue),
        licenseExpiry: iso(p.licenseExpiry),
        licenseCountry: p.licenseCountry,
        addressLine: p.addressLine,
        additionalPhone: p.additionalPhone,
        phoneMessengers: p.phoneMessengers,
        additionalPhoneMessengers: p.additionalPhoneMessengers,
        docCountry: p.docCountry,
        docRegion: p.docRegion,
      }
    }
  }

  const cityList: BookingCity[] = cities.map((c) => ({ id: c.id, name: c.name, country: c.country }))
  const officeList: BookingOffice[] = offices.map((o) => ({ id: o.id, name: o.name, address: o.address, city: o.city, country: o.country, lat: o.lat, lng: o.lng }))

  // In-progress draft (server-side) for THIS user + car — survives the sign-up email detour
  // and lets the flow resume where they left off. Only the owning account can load its draft.
  const draft: DraftView | null = user && resolvedCar ? await getUserDraftForCar(user.id, resolvedCar.slug) : null

  return (
    <Booking
      car={resolvedCar}
      draft={draft}
      extras={extras}
      rates={rates}
      currentUser={currentUser}
      profile={profile}
      tripGoal={searchParams.goal ?? null}
      payment={payment}
      cities={cityList}
      offices={officeList}
      defaultCountry={defaultCountry}
      initialStart={dateSeed(searchParams.start) ?? dateSeed(searchParams.from)}
      initialEnd={dateSeed(searchParams.end)}
      backHref={safeBack(searchParams.back)}
      availability={availability}
      insuranceTiers={insuranceTiers}
      verification={verification}
      sumsubInitial={sumsubInitial}
      verificationMethod={verifyMethod}
      verificationRequired={verifyRequired}
      mapProvider={mapClient.provider}
      mapApiKey={mapClient.apiKey}
    />
  )
}
