import { z } from 'zod'

export const emailSchema = z.string().trim().toLowerCase().email().max(200)
export const passwordSchema = z.string().min(8, 'Min 8 characters').max(200)

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: emailSchema,
    phone: z.string().trim().max(40).optional().or(z.literal('')),
    password: passwordSchema,
    consentPersonalData: z.literal(true, {
      errorMap: () => ({ message: 'Consent to personal-data processing is required' }),
    }),
    consentOffer: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the public offer' }),
    }),
  })
  .strip()

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(200),
})

export const currencyEnum = z.enum(['EUR', 'USD', 'RUB', 'TRY', 'USDT', 'USDC'])
export const insuranceEnum = z.enum(['BASIC', 'EXTENDED', 'FULL_NO_FRANCHISE'])
export const tripGoalEnum = z.enum([
  'LEISURE',
  'BUSINESS',
  'PROPERTY_PURCHASE',
  'PROPERTY_VIEWING',
  'MEDICAL',
  'RELOCATION',
  'LONG_STAY',
  'VISITING',
  'OTHER',
])
export const locationKindEnum = z.enum(['AIRPORT', 'HOTEL', 'COMPLEX', 'ADDRESS', 'OFFICE', 'DELIVERY', 'OTHER'])

export const locationSchema = z.object({
  kind: locationKindEnum.default('AIRPORT'),
  country: z.string().trim().max(80).optional().or(z.literal('')),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  district: z.string().trim().max(80).optional().or(z.literal('')),
  address: z.string().trim().max(300).optional().or(z.literal('')),
  comment: z.string().trim().max(500).optional().or(z.literal('')),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
})

export const bookingCreateSchema = z.object({
  carId: z.string().min(1),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  currency: currencyEnum.default('EUR'),
  pickup: locationSchema,
  returnSameAsPickup: z.boolean().default(true),
  returnLocation: locationSchema.optional(),
  extras: z
    .array(z.object({ serviceId: z.string(), qty: z.number().int().min(1).max(9).default(1) }))
    .default([]),
  insuranceType: insuranceEnum.default('BASIC'),
  // DORMANT: the server can nest-create additional drivers, but there is NO client UI for it — the
  // booking form never sends any. Kept optional (ready) rather than wired; omitted by the client.
  additionalDrivers: z
    .array(
      z.object({
        firstName: z.string().trim().min(1).max(80),
        lastName: z.string().trim().min(1).max(80),
        licenseNo: z.string().trim().max(60).optional().or(z.literal('')),
        licenseCountry: z.string().trim().max(80).optional().or(z.literal('')),
      }),
    )
    .max(4)
    .optional(),
  tripGoal: tripGoalEnum.optional(),
  smartNeeds: z.array(z.string()).max(40).default([]),
  // contract / personal data
  profile: z
    .object({
      firstName: z.string().trim().min(1).max(80),
      lastName: z.string().trim().min(1).max(80),
      birthDate: z.coerce.date().optional(),
      citizenship: z.string().trim().max(80).optional().or(z.literal('')),
      phone: z.string().trim().max(40).optional().or(z.literal('')),
      whatsapp: z.string().trim().max(80).optional().or(z.literal('')),
      // Additional phone + per-number messenger apps (whatsapp | telegram | max).
      additionalPhone: z.string().trim().max(40).optional().or(z.literal('')),
      phoneMessengers: z.array(z.enum(['whatsapp', 'telegram', 'max'])).max(3).optional(),
      additionalPhoneMessengers: z.array(z.enum(['whatsapp', 'telegram', 'max'])).max(3).optional(),
      // Document issuing region (chosen on the Documents step before uploading).
      docCountry: z.string().trim().max(80).optional().or(z.literal('')),
      docRegion: z.string().trim().max(120).optional().or(z.literal('')),
      passportNo: z.string().trim().max(60).optional().or(z.literal('')),
      passportIssue: z.coerce.date().optional(),
      // SECURITY: passportExpiry / licenseExpiry are intentionally NOT accepted here.
      // Expiry dates are verification-authoritative (they drive the "APPROVED-but-expired must
      // re-verify" gate) and are written ONLY by staff (setCustomerVerificationAction) or the
      // signature-verified Sumsub webhook. Excluding them from the customer-facing schema means
      // zod strips them from any crafted booking payload before the write path ever sees them —
      // defense-in-depth against the mass-assignment class of bug, even if the upsert is later refactored.
      licenseNo: z.string().trim().max(60).optional().or(z.literal('')),
      licenseIssue: z.coerce.date().optional(),
      licenseCountry: z.string().trim().max(80).optional().or(z.literal('')),
      addressLine: z.string().trim().max(300).optional().or(z.literal('')),
    })
    .optional(),
  consentPersonalData: z.literal(true),
  consentOffer: z.literal(true),
})

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>

export const carUpsertSchema = z.object({
  brand: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(80),
  year: z.number().int().min(1990).max(2100),
  class: z.enum(['ECONOMY', 'COMFORT', 'BUSINESS', 'PREMIUM', 'SUV', 'MINIVAN']),
  gearbox: z.enum(['AUTOMATIC', 'MANUAL']).default('AUTOMATIC'),
  fuel: z.enum(['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC']).default('PETROL'),
  seats: z.number().int().min(1).max(20).default(5),
  doors: z.number().int().min(2).max(6).default(4),
  airConditioning: z.boolean().default(true),
  pricePerDay: z.number().min(0),
  deposit: z.number().min(0),
  mileageLimitPerDay: z.number().int().min(0).nullable().optional(),
  minRentalDays: z.number().int().min(1).max(60).default(1),
  prepHoursBetween: z.number().int().min(0).max(168).default(3),
  active: z.boolean().default(true),
})

export const serviceCategoryEnum = z.enum([
  'RENTAL',
  'TRANSFER',
  'REAL_ESTATE',
  'TOURS',
  'INSURANCE',
  'CONCIERGE',
  'CONNECTIVITY',
  'OTHER',
])
export const serviceUnitEnum = z.enum(['flat', 'per_day', 'per_trip'])

export const serviceUpsertSchema = z.object({
  category: serviceCategoryEnum.default('OTHER'),
  nameRu: z.string().trim().min(1).max(120),
  nameEn: z.string().trim().min(1).max(120),
  descRu: z.string().trim().max(1000).optional().or(z.literal('')),
  descEn: z.string().trim().max(1000).optional().or(z.literal('')),
  price: z.number().min(0).max(1_000_000),
  unit: serviceUnitEnum.default('flat'),
  forGoals: z.array(tripGoalEnum).max(9).default([]),
  active: z.boolean().default(true),
})

const MAX_UPLOAD = 8 * 1024 * 1024 // 8 MB
export const ALLOWED_DOC_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
export function validateUpload(file: { size: number; type: string }): string | null {
  if (file.size > MAX_UPLOAD) return 'File too large (max 8 MB)'
  if (!ALLOWED_DOC_MIME.includes(file.type)) return 'Only JPG, PNG, WEBP or PDF allowed'
  return null
}

/** Flatten a ZodError into a { field: message } map for forms. */
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_'
    if (!out[key]) out[key] = issue.message
  }
  return out
}
