'use server'

import { headers } from 'next/headers'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { bookingCreateSchema, fieldErrors, type BookingCreateInput } from '@/lib/validation'
import { checkCarAvailability, hasBlockingOverlap, nextFreeInterval, rentalDays } from '@/lib/availability'
import { quote } from '@/lib/pricing'
import { loadRates } from '@/lib/money'
import { fxRate } from '@/lib/money'
import { notifyNewBooking } from '@/lib/notify'
import { verificationRequired } from '@/lib/verification-method'
import { getVerificationForUser } from '@/lib/verification-server'
import { LEGAL_VERSION } from '@/lib/legal'
import { logAudit } from '@/lib/audit'
import { formatMoney } from '@/lib/money'
import { normalizePhone } from '@/lib/phone'
import { stripe, stripeSupports, toStripeAmount } from '@/lib/payments'
import { getPaymentConfig } from '@/lib/payment-settings'
import { recomputeBookingBalance } from '@/lib/balance'

export interface BookingResult {
  ok: boolean
  error?: string
  fieldErrors?: Record<string, string>
  redirectTo?: string
  suggestion?: { start: string; end: string } | null
  bookingNumber?: string
  bookingId?: string
}

async function nextBookingNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const latest = await prisma.booking.findMany({
    where: { number: { startsWith: `AVN-${year}-` } },
    select: { number: true },
  })
  let max = 0
  for (const b of latest) {
    const n = parseInt(b.number.split('-')[2] ?? '0', 10)
    if (n > max) max = n
  }
  return `AVN-${year}-${String(max + 1).padStart(4, '0')}`
}

/** Thrown inside the create transaction when the in-tx overlap re-check finds the car was taken by a
 *  concurrent booking (the advisory-lock guard). Handled specially so the card path refunds cleanly. */
class CarTakenError extends Error {}

/** The reservation prepayment ("pay now") = the admin deposit % of the subtotal, in booking currency.
 *  This is the SAME amount charged by crypto/bank/card everywhere — NOT the refundable security deposit. */
async function reservationDeposit(subtotal: number): Promise<number> {
  const config = await getPaymentConfig()
  return Math.round(subtotal * (config.depositPercent / 100) * 100) / 100
}

/** Refund a Stripe PaymentIntent. Used when a card deposit was charged but the booking cannot be
 *  created. Returns whether the refund succeeded so the caller can AUDIT it — a failed refund must be
 *  visible (customer charged with no booking), never silently swallowed. */
async function refundIntent(intentId: string): Promise<boolean> {
  const s = stripe()
  if (!s) return false
  try {
    await s.refunds.create({ payment_intent: intentId })
    return true
  } catch {
    return false
  }
}

/** The caller's OWN booking already backed by this intent, or null. Used for idempotent replays and to
 *  recognise a concurrent winner without ever refunding it. The `booking: { userId }` filter also stops
 *  a request replaying ANOTHER user's intent id from learning that user's booking (ownership guard). */
async function ownBookingForIntent(userId: string, intentId: string): Promise<{ id: string; number: string } | null> {
  const p = await prisma.payment.findFirst({
    where: { providerRef: intentId, booking: { userId } },
    select: { booking: { select: { id: true, number: true } } },
  })
  return p?.booking ?? null
}

/** Refund a charged deposit for a booking that won't be created, and always record the outcome — a
 *  failed refund leaves the customer charged with no booking, so it MUST be alertable in the audit log.
 *
 *  SAFETY NET (single choke point): never refund an intent that already backs a booking — a concurrent
 *  request may have created the paid booking with THIS charge (the intent + car are the same on a
 *  replay), and refunding here would credit back money a live CONFIRMED booking depends on. Every
 *  refund path funnels through here, so no caller can violate this even if it forgets to pre-check. */
async function refundAndAudit(userId: string, intentId: string, reason: string): Promise<void> {
  // 1) Never refund an intent that already backs a booking (concurrent-winner protection).
  const backed = await ownBookingForIntent(userId, intentId)
  if (backed) {
    await logAudit({ userId, action: 'payment.stripe.refund_skipped', entity: 'PaymentIntent', entityId: intentId, meta: { reason, booking: backed.number } }).catch(() => {})
    return
  }
  // 2) OWNERSHIP: the intent id is client-supplied (input.cardPaymentIntentId) and the prepare_failed
  //    path refunds BEFORE verifyCardDeposit's metadata.userId check ever runs. Verify with Stripe here
  //    that this is THIS user's CAPTURED deposit before issuing any refund — otherwise an attacker could
  //    pass a victim's intent id + a deliberately-failing input to refund the victim's charge. Only a
  //    succeeded intent whose server-set metadata.userId is the caller may be refunded.
  const s = stripe()
  if (!s) return
  let pi
  try {
    pi = await s.paymentIntents.retrieve(intentId)
  } catch {
    await logAudit({ userId, action: 'payment.stripe.refund_skipped', entity: 'PaymentIntent', entityId: intentId, meta: { reason, cause: 'not_found' } }).catch(() => {})
    return
  }
  if ((pi.metadata?.userId ?? '') !== userId || pi.status !== 'succeeded') {
    await logAudit({ userId, action: 'payment.stripe.refund_skipped', entity: 'PaymentIntent', entityId: intentId, meta: { reason, cause: 'not_owner_or_uncaptured' } }).catch(() => {})
    return
  }
  const refunded = await refundIntent(intentId)
  await logAudit({
    userId,
    action: refunded ? 'payment.stripe.refunded' : 'payment.stripe.refund_failed',
    entity: 'PaymentIntent',
    entityId: intentId,
    meta: { reason, refunded },
  }).catch(() => {})
}

/**
 * Shared front-half of booking creation: auth-independent validation, the AUTHORITATIVE
 * verification gate, car resolution, availability re-check, server-side re-pricing, and phone
 * uniqueness. Both createBookingAction and prepareCardBookingAction go through this so the price/gates
 * (and therefore the charged deposit) are IDENTICAL — a card intent prepared here always matches the
 * deposit re-computed at create time.
 */
type Prepared =
  | { ok: false; error?: string; fieldErrors?: Record<string, string>; suggestion?: { start: string; end: string } | null }
  | {
      ok: true
      car: NonNullable<Awaited<ReturnType<typeof prisma.car.findFirst>>>
      data: BookingCreateInput
      q: ReturnType<typeof quote>
      rates: Awaited<ReturnType<typeof loadRates>>
      extraSel: { service: Awaited<ReturnType<typeof prisma.service.findMany>>[number]; qty: number }[]
      bookingPhone: string | null
    }

async function prepareBooking(userId: string, input: BookingCreateInput): Promise<Prepared> {
  const parsed = bookingCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) }
  const data = parsed.data

  // Authoritative ID-verification gate — the single server-side enforcement (the UI step-lock is
  // bypassable). Card and bank/crypto BOTH pass through here, so paying by card can NEVER skip it.
  if (await verificationRequired()) {
    if (!(await getVerificationForUser(userId)).verified) {
      return { ok: false, error: 'Требуется подтверждение личности: проверка не пройдена или истёк срок действия документа.' }
    }
  }

  const car = await prisma.car.findFirst({ where: { OR: [{ slug: data.carId }, { id: data.carId }] } })
  if (!car || !car.active) return { ok: false, error: 'Автомобиль недоступен' }

  const start = data.startAt
  const end = data.endAt

  // Server-side availability re-check (never trust the client).
  const avail = await checkCarAvailability(car.id, start, end)
  if (!avail.available) {
    if (avail.reason === 'MIN_RENTAL') {
      return { ok: false, error: `Минимальный срок аренды — ${avail.minRentalDays} дн.` }
    }
    const suggestion = await nextFreeInterval(car.id, rentalDays(start, end), start)
    return {
      ok: false,
      error: avail.reason === 'OVERLAP' ? 'На выбранные даты автомобиль уже занят.' : 'Выбранные даты недоступны.',
      suggestion: suggestion ? { start: suggestion.start.toISOString(), end: suggestion.end.toISOString() } : null,
    }
  }

  // Price server-side.
  const rates = await loadRates()
  const extraServices = data.extras.length
    ? await prisma.service.findMany({ where: { id: { in: data.extras.map((e) => e.serviceId) } } })
    : []
  const extraSel = data.extras
    .map((e) => {
      const svc = extraServices.find((s) => s.id === e.serviceId)
      return svc ? { service: svc, qty: e.qty } : null
    })
    .filter((x): x is { service: (typeof extraServices)[number]; qty: number } => x !== null)

  const q = quote({
    car,
    start,
    end,
    extras: extraSel.map((e) => ({ service: e.service, qty: e.qty })),
    insuranceType: data.insuranceType,
    currency: data.currency,
    rates,
  })

  // Phone uniqueness (normalized): a booking must not claim a phone belonging to a DIFFERENT account.
  const bookingPhone = normalizePhone(data.profile?.phone)
  if (bookingPhone) {
    const owner = await prisma.user.findFirst({ where: { phone: bookingPhone } })
    if (owner && owner.id !== userId) {
      return { ok: false, fieldErrors: { 'profile.phone': 'Этот телефон уже привязан к другому аккаунту' } }
    }
  }

  return { ok: true, car, data, q, rates, extraSel, bookingPhone }
}

export interface CardBookingInit {
  ok: boolean
  clientSecret?: string
  publishableKey?: string
  amountLabel?: string
  intentId?: string
  error?: string
}

/**
 * OPTION A — card pays FIRST. Validate/price/verify the would-be booking (WITHOUT creating it), then
 * create a Stripe PaymentIntent for the reservation deposit. No Booking or Payment row is written —
 * the car is NOT held yet. The client confirms via Stripe Elements, then calls createBookingAction
 * with the resulting intent id; only then is the (paid) booking created and the car held.
 */
export async function prepareCardBookingAction(input: BookingCreateInput): Promise<CardBookingInit> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'Войдите, чтобы оформить бронирование' }

  const prep = await prepareBooking(user.id, input)
  if (!prep.ok) {
    return { ok: false, error: prep.error ?? (prep.fieldErrors ? Object.values(prep.fieldErrors)[0] : 'Проверьте введённые данные') }
  }

  const s = stripe()
  if (!s) return { ok: false, error: 'Оплата картой не настроена (нет ключей Stripe).' }
  if (!stripeSupports(prep.data.currency)) return { ok: false, error: `Stripe не поддерживает ${prep.data.currency}` }

  const payNow = await reservationDeposit(Number(prep.q.subtotal))
  if (!(payNow > 0)) return { ok: false, error: 'Нулевая сумма депозита' }

  try {
    const intent = await s.paymentIntents.create({
      amount: toStripeAmount(payNow, prep.data.currency),
      currency: prep.data.currency.toLowerCase(),
      payment_method_types: ['card'],
      metadata: { userId: user.id, purpose: 'booking_deposit', currency: prep.data.currency, carSlug: prep.car.slug },
      description: `AVENTA booking deposit · ${prep.car.brand} ${prep.car.model}`,
    })
    // Audit the charge at init so a charged-but-never-created deposit is traceable even if the client
    // never calls back (the booking-create path may fail/refund; both outcomes get their own audit rows).
    await logAudit({
      userId: user.id,
      action: 'payment.stripe.init',
      entity: 'PaymentIntent',
      entityId: intent.id,
      meta: { amount: payNow, currency: prep.data.currency, purpose: 'booking_deposit', carSlug: prep.car.slug },
    }).catch(() => {})
    return {
      ok: true,
      clientSecret: intent.client_secret ?? undefined,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      amountLabel: formatMoney(payNow, prep.data.currency),
      intentId: intent.id,
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? `Stripe: ${e.message}` : 'Не удалось создать платёж Stripe' }
  }
}

/**
 * Verify a pre-paid card deposit intent against the freshly-re-priced booking. Returns the amount (in
 * booking currency) that was paid, or an error. When `refundNeeded` is set the intent was GENUINELY
 * CHARGED but can't back this booking (price/FX/deposit% drifted between pay and create) — the caller
 * must refund so the customer isn't charged for a booking that won't exist.
 *
 * Idempotency of a REUSED intent is handled by the caller (an early lookup + a DB-unique on
 * providerRef), so this only talks to Stripe. It expands the latest charge to reject a REFUNDED intent:
 * a refunded PaymentIntent still reports status:'succeeded' with amount_received unchanged (the refund
 * lives on the charge), so without this an already-refunded deposit could be replayed into a free booking.
 */
async function verifyCardDeposit(
  intentId: string,
  userId: string,
  subtotal: number,
  currency: string,
  carSlug: string,
): Promise<{ ok: true; payNow: number } | { ok: false; error: string; refundNeeded?: boolean }> {
  const s = stripe()
  if (!s) return { ok: false, error: 'Оплата картой не настроена' }
  let pi
  try {
    pi = await s.paymentIntents.retrieve(intentId, { expand: ['latest_charge'] })
  } catch {
    return { ok: false, error: 'Платёж не найден' }
  }
  // Not captured (incl. 'processing') → no funds to refund yet; owner mismatch → not ours to refund.
  if (pi.status !== 'succeeded') return { ok: false, error: 'Оплата не завершена' }
  if ((pi.metadata?.userId ?? '') !== userId) return { ok: false, error: 'Платёж принадлежит другому пользователю' }
  // Bind the intent to THIS booking attempt: it must be a booking-deposit intent for this exact car.
  // Stops reusing one succeeded intent to back a DIFFERENT car (which, with a coincidentally-equal
  // deposit, could otherwise pass the amount check and let one intent back two bookings).
  if (pi.metadata?.purpose !== 'booking_deposit' || (pi.metadata?.carSlug ?? '') !== carSlug) {
    return { ok: false, error: 'Платёж не соответствует брони' }
  }

  const charge = typeof pi.latest_charge === 'object' && pi.latest_charge ? pi.latest_charge : null
  if (charge && (charge.refunded || (charge.amount_refunded ?? 0) > 0)) {
    return { ok: false, error: 'Этот платёж был возвращён' } // already refunded — do NOT re-refund or re-use
  }

  const payNow = await reservationDeposit(subtotal)
  const expected = toStripeAmount(payNow, currency as never)
  if (pi.currency.toUpperCase() !== currency || (pi.amount_received ?? pi.amount) !== expected) {
    // Charged, but the deposit re-priced differently now → unusable for this booking. Refund it.
    return { ok: false, error: 'Сумма оплаты изменилась — платёж будет возвращён', refundNeeded: true }
  }
  return { ok: true, payNow }
}

export async function createBookingAction(
  input: BookingCreateInput & { documentIds?: string[]; cardPaymentIntentId?: string },
): Promise<BookingResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'Войдите, чтобы оформить бронирование', redirectTo: '/auth' }

  const cardIntentId = input.cardPaymentIntentId

  // IDEMPOTENT REPLAY (must run BEFORE prepareBooking): if this intent already backs the caller's
  // booking, return it. Otherwise a resubmit would fail availability (the car is now held by that very
  // booking) and wrongly refund the paid booking's deposit. A unique constraint on Payment.providerRef
  // is the concurrent-race backstop for the window before either request has committed.
  if (cardIntentId) {
    const own = await ownBookingForIntent(user.id, cardIntentId)
    if (own) return { ok: true, bookingNumber: own.number, bookingId: own.id, redirectTo: `/success?b=${own.number}` }
  }

  const prep = await prepareBooking(user.id, input)
  if (!prep.ok) {
    if (cardIntentId) {
      // A concurrent request may have consumed this intent between the idempotency check above and here
      // (its booking is exactly why prepare now fails on availability) → return that winner, don't refund.
      const winner = await ownBookingForIntent(user.id, cardIntentId)
      if (winner) return { ok: true, bookingNumber: winner.number, bookingId: winner.id, redirectTo: `/success?b=${winner.number}` }
      // The customer PAID but we genuinely can't create (car taken by a different booking, verification
      // lost, …) → refund so they aren't charged for a booking that doesn't exist, and audit it.
      await refundAndAudit(user.id, cardIntentId, 'prepare_failed')
    }
    return { ok: false, error: prep.error, fieldErrors: prep.fieldErrors, suggestion: prep.suggestion }
  }
  const { car, data, q, rates, extraSel, bookingPhone } = prep

  // Card path: the deposit must already be paid. Verify the intent server-side (authoritative — we
  // ask Stripe directly, never trust the client) before creating an already-paid booking.
  let cardPaid = false
  let cardPayNow = 0
  if (cardIntentId) {
    const v = await verifyCardDeposit(cardIntentId, user.id, Number(q.subtotal), data.currency, car.slug)
    if (!v.ok) {
      // Charged-but-unusable (price/FX drift) → refund so the customer isn't stranded. Other rejects
      // (not-captured / foreign / already-refunded) must NOT refund — nothing (re)fundable of ours.
      if (v.refundNeeded) await refundAndAudit(user.id, cardIntentId, 'amount_mismatch')
      return { ok: false, error: v.error }
    }
    cardPaid = true
    cardPayNow = v.payNow
  }
  // Card bookings are born CONFIRMED (deposit received → the car is held only now); bank/crypto stay NEW
  // (request-then-confirm). Verification was already enforced above for both.
  const initialStatus = cardPaid ? 'CONFIRMED' : 'NEW'

  const h = headers()
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || null
  const ua = h.get('user-agent')?.slice(0, 300) ?? null

  let booking
  let number = ''
  // Retry on booking-number collision: nextBookingNumber() is a non-atomic max+1, so concurrent creates
  // (any cars) can pick the same unique `number`. Retrying with a fresh number turns that collision into
  // a normal success instead of a create-failure — which on the card path matters, because a create-fail
  // there triggers a deposit refund (and, in a same-intent race, could otherwise refund a valid booking).
  for (let attempt = 0; ; attempt++) {
   try {
    number = await nextBookingNumber()
    booking = await prisma.$transaction(async (tx) => {
      // Overbooking guard: take a per-car advisory lock, then RE-CHECK overlap inside the tx. The
      // pre-tx checkCarAvailability is a TOCTOU read — two concurrent requests both see the car free
      // before either commits. The advisory lock serializes creates for THIS car, so the re-check here
      // sees any competitor that just committed and rejects (→ refund on the card path). Auto-released
      // on commit/rollback since it is transaction-scoped.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${car.id})::bigint)`
      if (await hasBlockingOverlap(tx, car.id, data.startAt, data.endAt, car.prepHoursBetween)) {
        throw new CarTakenError()
      }

      const b = await tx.booking.create({
        data: {
          number,
          carId: car.id,
          userId: user.id,
          status: initialStatus,
          startAt: data.startAt,
          endAt: data.endAt,
          days: q.days,
          pickupKind: data.pickup.kind,
          pickupCountry: data.pickup.country || null,
          pickupCity: data.pickup.city || null,
          pickupDistrict: data.pickup.district || null,
          pickupAddress: data.pickup.address || null,
          pickupComment: data.pickup.comment || null,
          pickupLat: data.pickup.lat ?? null,
          pickupLng: data.pickup.lng ?? null,
          returnSameAsPickup: data.returnSameAsPickup,
          returnKind: data.returnLocation?.kind,
          returnCountry: data.returnLocation?.country || null,
          returnCity: data.returnLocation?.city || null,
          returnAddress: data.returnLocation?.address || null,
          currency: data.currency,
          fxRate: new Prisma.Decimal(fxRate(data.currency, rates)),
          rentTotal: q.rentTotal,
          extrasTotal: q.extrasTotal,
          insuranceTotal: q.insuranceTotal,
          subtotal: q.subtotal,
          depositAmount: q.deposit,
          balanceAmount: q.subtotal,
          baseTotal: q.baseTotal,
          tripGoal: data.tripGoal,
          extras: {
            create: extraSel.map((e) => ({
              serviceId: e.service.id,
              nameRu: e.service.nameRu,
              nameEn: e.service.nameEn,
              unitPrice: e.service.price,
              qty: e.qty,
              perDay: e.service.unit === 'per_day',
              total: new Prisma.Decimal(
                e.service.unit === 'per_day' ? Number(e.service.price) * q.days * e.qty : Number(e.service.price) * e.qty,
              ),
            })),
          },
          insurance: {
            create: { type: data.insuranceType, status: 'PENDING', price: q.insuranceTotal },
          },
          // Dormant capability: no client currently sends additional drivers (no UI).
          additionalDrivers: {
            create: (data.additionalDrivers ?? []).map((d) => ({
              firstName: d.firstName,
              lastName: d.lastName,
              licenseNo: d.licenseNo || null,
              licenseCountry: d.licenseCountry || null,
            })),
          },
          statusHistory: {
            create: {
              status: initialStatus,
              byUserId: user.id,
              comment: cardPaid ? 'Заявка создана · депозит оплачен картой' : 'Заявка создана',
            },
          },
          consents: {
            create: [
              { userId: user.id, type: 'personal_data', version: LEGAL_VERSION, ip, userAgent: ua },
              { userId: user.id, type: 'offer', version: LEGAL_VERSION, ip, userAgent: ua },
            ],
          },
          // Card path: record the collected deposit as a CONFIRMED (PAID) payment atomically with the
          // booking — never rely on a separate post-create client call for a payment we already took.
          ...(cardPaid && cardIntentId
            ? {
                payments: {
                  create: {
                    method: 'CARD_STRIPE' as const,
                    kind: 'PREPAY' as const,
                    currency: data.currency,
                    amount: new Prisma.Decimal(cardPayNow),
                    status: 'PAID' as const,
                    provider: 'stripe',
                    providerRef: cardIntentId,
                  },
                },
              }
            : {}),
        },
      })

      if (data.tripGoal || data.smartNeeds.length) {
        await tx.smartServiceResponse.create({
          data: { bookingId: b.id, userId: user.id, tripGoal: data.tripGoal ?? 'OTHER', needs: data.smartNeeds },
        })
      }

      if (data.profile) {
        const p = data.profile
        await tx.clientProfile.upsert({
          where: { userId: user.id },
          update: {
            birthDate: p.birthDate,
            citizenship: p.citizenship || undefined,
            passportNo: p.passportNo || undefined,
            passportIssue: p.passportIssue,
            // SECURITY: passportExpiry / licenseExpiry are verification-authoritative — written ONLY by
            // the signature-verified Sumsub webhook. Never let a booking payload set them.
            licenseNo: p.licenseNo || undefined,
            licenseIssue: p.licenseIssue,
            licenseCountry: p.licenseCountry || undefined,
            addressLine: p.addressLine || undefined,
            additionalPhone: p.additionalPhone || undefined,
            phoneMessengers: p.phoneMessengers ?? undefined,
            additionalPhoneMessengers: p.additionalPhoneMessengers ?? undefined,
            docCountry: p.docCountry || undefined,
            docRegion: p.docRegion || undefined,
          },
          create: {
            userId: user.id,
            birthDate: p.birthDate,
            citizenship: p.citizenship || undefined,
            passportNo: p.passportNo || undefined,
            licenseNo: p.licenseNo || undefined,
            licenseCountry: p.licenseCountry || undefined,
            addressLine: p.addressLine || undefined,
            additionalPhone: p.additionalPhone || undefined,
            phoneMessengers: p.phoneMessengers ?? [],
            additionalPhoneMessengers: p.additionalPhoneMessengers ?? [],
            docCountry: p.docCountry || undefined,
            docRegion: p.docRegion || undefined,
          },
        })
        if (bookingPhone || p.whatsapp) {
          await tx.user.update({
            where: { id: user.id },
            data: { phone: bookingPhone ?? undefined, whatsapp: p.whatsapp || undefined },
          })
        }
      }

      if (input.documentIds?.length) {
        await tx.document.updateMany({
          where: { id: { in: input.documentIds }, userId: user.id },
          data: { bookingId: b.id },
        })
      }

      return b
    })
    break
   } catch (e) {
    // Booking-number collision → retry with a fresh number (bounded) rather than failing/refunding.
    const numberDup = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002' && String(e.meta?.target ?? '').includes('number')
    if (numberDup && attempt < 5) continue

    // CONCURRENT SAME-INTENT REPLAY: a parallel request with this same card intent may have already
    // committed the booking. It surfaces here either as the in-tx overlap re-check (CarTakenError —
    // it sees the winner's now-blocking booking) OR as a P2002 on the unique providerRef. In BOTH
    // cases return the winner and NEVER refund — its paid booking depends on that charge.
    if (cardIntentId) {
      const winner = await ownBookingForIntent(user.id, cardIntentId)
      if (winner) {
        return { ok: true, bookingNumber: winner.number, bookingId: winner.id, redirectTo: `/success?b=${winner.number}` }
      }
    }

    // The car was taken by a DIFFERENT booking (not this intent's own winner) → refund the card deposit.
    if (e instanceof CarTakenError) {
      if (cardPaid && cardIntentId) await refundAndAudit(user.id, cardIntentId, 'car_taken')
      const suggestion = await nextFreeInterval(car.id, q.days, data.startAt)
      return {
        ok: false,
        error: 'На выбранные даты автомобиль уже занят.',
        suggestion: suggestion ? { start: suggestion.start.toISOString(), end: suggestion.end.toISOString() } : null,
      }
    }

    // Any other failure: if a card deposit was collected, refund it (refundAndAudit will skip if a
    // concurrent winner already backs the intent) — we must not keep money for a booking not made.
    const p2002 = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
    if (cardPaid && cardIntentId) await refundAndAudit(user.id, cardIntentId, 'create_failed')
    return { ok: false, error: p2002 ? 'Не удалось оформить (повторите).' : 'Не удалось создать бронирование.' }
   }
  }

  // Card path: fold the just-collected PAID deposit into prepaid/balance (authoritative recompute).
  if (cardPaid) {
    await recomputeBookingBalance(booking.id)
    await logAudit({ userId: user.id, action: 'payment.stripe.succeeded', entity: 'Booking', entityId: booking.id, meta: { amount: cardPayNow, currency: data.currency, atBooking: true } })
  }

  await logAudit({ userId: user.id, action: 'booking.create', entity: 'Booking', entityId: booking.id, meta: { number, paidByCard: cardPaid } })

  await prisma.bookingDraft.deleteMany({ where: { userId: user.id, carSlug: car.slug } }).catch(() => {})

  notifyNewBooking({
    bookingId: booking.id,
    number,
    clientName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
    clientEmail: user.email,
    carName: `${car.brand} ${car.model}`,
    period: `${data.startAt.toLocaleDateString('ru-RU')} → ${data.endAt.toLocaleDateString('ru-RU')}`,
    total: formatMoney(q.subtotal, data.currency),
  }).catch(() => {})

  return { ok: true, bookingNumber: number, bookingId: booking.id, redirectTo: `/success?b=${number}` }
}
