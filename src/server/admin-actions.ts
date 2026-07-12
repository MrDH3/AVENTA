'use server'

import { revalidatePath } from 'next/cache'
import type { BookingStatus, DocumentStatus, InsuranceStatus, PaymentStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireStaff, requireSettingsAccess } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { carUpsertSchema, serviceUpsertSchema, fieldErrors } from '@/lib/validation'
import { recomputeBookingBalance } from '@/lib/balance'
import { canTransition, BOOKING_STATUS_RU } from '@/lib/booking-status'
import { writeFinanceAudit } from '@/lib/finance-audit'
import { lockBookingRow } from '@/lib/booking-lock'
import { runReservationTimeout, setReservationHoldHours } from '@/lib/reservation-timeout'
import { runBookingDraftCleanup, setBookingDraftTtlHours } from '@/lib/booking-draft'
import { reconcileOrphanedCardDeposits, setCardReconcileGraceMinutes } from '@/lib/card-reconcile'

export interface StaffResult {
  ok: boolean
  error?: string
  fieldErrors?: Record<string, string>
}

export async function setBookingStatus(bookingId: string, status: BookingStatus, comment?: string): Promise<StaffResult> {
  const staff = await requireStaff()
  // Enforce the lifecycle rulebook (lib/booking-status) — the SAME rules the UI offers. Illogical
  // jumps (e.g. CLOSED → ACTIVE, NEW → RETURNED) are rejected here. The read + canTransition check +
  // write happen INSIDE one row-locked transaction so a concurrent write (e.g. the reservation-timeout
  // sweep committing CANCELLED) can never be clobbered by a stale-snapshot decision — the re-read under
  // the lock sees it and canTransition(CANCELLED, …) rejects the move.
  const result = await prisma.$transaction(async (tx) => {
    await lockBookingRow(tx, bookingId)
    const current = await tx.booking.findUnique({ where: { id: bookingId }, select: { status: true } })
    if (!current) return { ok: false as const, error: 'Бронь не найдена' }
    if (current.status === status) return { ok: false as const, error: 'Статус уже установлен' }
    if (!canTransition(current.status, status)) {
      return { ok: false as const, error: `Недопустимый переход: ${BOOKING_STATUS_RU[current.status]} → ${BOOKING_STATUS_RU[status]}` }
    }
    await tx.booking.update({ where: { id: bookingId }, data: { status } })
    await tx.bookingStatusEvent.create({ data: { bookingId, status, byUserId: staff.id, comment } })
    return { ok: true as const, from: current.status }
  })
  if (!result.ok) return { ok: false, error: result.error }
  await logAudit({ userId: staff.id, action: 'booking.status', entity: 'Booking', entityId: bookingId, meta: { from: result.from, status } })
  revalidatePath('/admin')
  revalidatePath('/crm')
  revalidatePath('/admin/board')
  return { ok: true }
}

/** Admin/owner: run the reservation-hold timeout sweep now (also runs on a schedule via cron). */
export async function runReservationTimeoutAction(): Promise<{ ok: boolean; scanned?: number; expired?: number; holdHours?: number }> {
  const staff = await requireSettingsAccess()
  const res = await runReservationTimeout()
  await logAudit({ userId: staff.id, action: 'booking.hold.sweep.manual', entity: 'Booking', entityId: 'reservation-timeout', meta: { ...res } })
  revalidatePath('/admin')
  revalidatePath('/admin/board')
  return { ok: true, ...res }
}

/** Admin/owner: set how many hours an unconfirmed MANUAL (bank/crypto) booking holds the car before it
 *  auto-expires. Default 24. Applies to the next sweep. */
export async function setReservationHoldHoursAction(hours: number): Promise<StaffResult> {
  const staff = await requireSettingsAccess()
  if (!Number.isFinite(hours) || hours < 1) return { ok: false, error: 'Минимум 1 час' }
  await setReservationHoldHours(hours)
  await logAudit({ userId: staff.id, action: 'setting.reservation_hold_hours', entity: 'Setting', entityId: 'reservation_hold_hours', meta: { hours: Math.floor(hours) } })
  revalidatePath('/admin')
  return { ok: true }
}

/** Admin/owner: run the abandoned-DRAFT sweep now (deletes half-filled booking forms past their TTL).
 *  DISTINCT from the reservation-hold sweep above — this touches no booking/car, only draft form data. */
export async function runBookingDraftCleanupAction(): Promise<{ ok: boolean; deleted?: number; ttlHours?: number }> {
  const staff = await requireSettingsAccess()
  const res = await runBookingDraftCleanup()
  await logAudit({ userId: staff.id, action: 'booking.draft.sweep.manual', entity: 'BookingDraft', entityId: 'draft-sweep', meta: { ...res } })
  return { ok: true, ...res }
}

/** Admin/owner: set how many hours a saved booking DRAFT is kept before auto-delete. Default 24. */
export async function setBookingDraftTtlHoursAction(hours: number): Promise<StaffResult> {
  const staff = await requireSettingsAccess()
  if (!Number.isFinite(hours) || hours < 1) return { ok: false, error: 'Минимум 1 час' }
  await setBookingDraftTtlHours(hours)
  await logAudit({ userId: staff.id, action: 'setting.booking_draft_ttl_hours', entity: 'Setting', entityId: 'booking_draft_ttl_hours', meta: { hours: Math.floor(hours) } })
  revalidatePath('/admin')
  return { ok: true }
}

/** Admin/owner: run the stranded card-deposit reconciliation now (refunds captured deposits that never
 *  became a booking). SEPARATE from the reservation-hold + draft sweeps — touches only Stripe charges. */
export async function runCardReconcileAction(): Promise<{ ok: boolean; scanned?: number; refunded?: number; refundFailed?: number; graceMinutes?: number }> {
  const staff = await requireSettingsAccess()
  const res = await reconcileOrphanedCardDeposits()
  await logAudit({ userId: staff.id, action: 'payment.stripe.reconcile.manual', entity: 'PaymentIntent', entityId: 'card-reconcile', meta: { ...res } })
  return { ok: true, ...res }
}

/** Admin/owner: set the grace window (minutes) before a captured-but-unbooked deposit is treated as
 *  stranded and refunded. Default 30. Longer = more time for a slow create to complete before refunding. */
export async function setCardReconcileGraceMinutesAction(minutes: number): Promise<StaffResult> {
  const staff = await requireSettingsAccess()
  if (!Number.isFinite(minutes) || minutes < 1) return { ok: false, error: 'Минимум 1 минута' }
  await setCardReconcileGraceMinutes(minutes)
  await logAudit({ userId: staff.id, action: 'setting.card_reconcile_grace_minutes', entity: 'Setting', entityId: 'card_reconcile_grace_minutes', meta: { minutes: Math.floor(minutes) } })
  revalidatePath('/admin')
  return { ok: true }
}

export async function addBookingComment(bookingId: string, comment: string): Promise<StaffResult> {
  const staff = await requireStaff()
  if (!comment.trim()) return { ok: false, error: 'Пустой комментарий' }
  await prisma.booking.update({ where: { id: bookingId }, data: { adminComment: comment.slice(0, 2000) } })
  await logAudit({ userId: staff.id, action: 'booking.comment', entity: 'Booking', entityId: bookingId })
  revalidatePath('/admin')
  return { ok: true }
}

export async function setInsuranceStatus(bookingId: string, status: InsuranceStatus): Promise<StaffResult> {
  const staff = await requireStaff()
  await prisma.insurance.update({ where: { bookingId }, data: { status } })
  await logAudit({ userId: staff.id, action: 'insurance.status', entity: 'Booking', entityId: bookingId, meta: { status } })
  revalidatePath('/admin')
  return { ok: true }
}

export async function toggleCarActive(carId: string, active: boolean): Promise<StaffResult> {
  const staff = await requireStaff()
  await prisma.car.update({ where: { id: carId }, data: { active } })
  await logAudit({ userId: staff.id, action: 'car.active', entity: 'Car', entityId: carId, meta: { active } })
  revalidatePath('/admin')
  revalidatePath('/catalog')
  return { ok: true }
}

export async function upsertCar(carId: string | null, raw: unknown): Promise<StaffResult> {
  const staff = await requireStaff()
  const parsed = carUpsertSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) }
  const d = parsed.data
  const slug = `${d.brand}-${d.model}-${d.year}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const data = { ...d, slug, mileageLimitPerDay: d.mileageLimitPerDay ?? null }
  if (carId) {
    await prisma.car.update({ where: { id: carId }, data })
  } else {
    await prisma.car.create({ data })
  }
  await logAudit({ userId: staff.id, action: carId ? 'car.update' : 'car.create', entity: 'Car', entityId: carId ?? slug })
  revalidatePath('/admin')
  revalidatePath('/catalog')
  return { ok: true }
}

export async function deleteCar(carId: string): Promise<StaffResult> {
  const staff = await requireStaff()
  const bookings = await prisma.booking.count({ where: { carId, status: { notIn: ['CLOSED', 'CANCELLED'] } } })
  if (bookings > 0) return { ok: false, error: 'У автомобиля есть активные брони' }
  await prisma.car.delete({ where: { id: carId } })
  await logAudit({ userId: staff.id, action: 'car.delete', entity: 'Car', entityId: carId })
  revalidatePath('/admin')
  return { ok: true }
}

export async function reviewDocument(documentId: string, status: DocumentStatus, reason?: string): Promise<StaffResult> {
  const staff = await requireStaff()
  await prisma.document.update({
    where: { id: documentId },
    data: { status, rejectionReason: status === 'REJECTED' ? reason ?? null : null, reviewedAt: new Date(), reviewedById: staff.id },
  })
  await logAudit({ userId: staff.id, action: 'document.review', entity: 'Document', entityId: documentId, meta: { status } })
  revalidatePath('/admin')
  return { ok: true }
}

export async function recordPayment(input: {
  bookingId: string
  method: string
  currency: string
  amount: number
  kind?: string
  status?: PaymentStatus
  txHash?: string
  adminComment?: string
}): Promise<StaffResult> {
  const staff = await requireStaff()
  const kind = input.kind ?? 'RENT'
  const status = input.status ?? 'PAID'
  // Lock the booking row while writing the payment so this confirmation serializes with the
  // reservation-timeout sweep — a booking with a just-recorded PAID payment can never be expired.
  const p = await prisma.$transaction(async (tx) => {
    await lockBookingRow(tx, input.bookingId)
    return tx.payment.create({
      data: {
        bookingId: input.bookingId,
        method: input.method as never,
        currency: input.currency as never,
        amount: input.amount,
        kind: kind as never,
        status: status as never,
        txHash: input.txHash,
        adminComment: input.adminComment,
      },
    })
  })
  await recomputeBookingBalance(input.bookingId)
  // A directly-recorded payment can land as confirmed income — write the immutable finance audit
  // entry too (not just the general log), so the finance trail has no gap for income-producing writes.
  await writeFinanceAudit({ entityType: 'payment', entityId: p.id, action: 'create', staff, changes: [{ field: 'amount', from: null, to: `${input.amount} ${input.currency}` }, { field: 'status', from: null, to: status }] })
  await logAudit({ userId: staff.id, action: 'payment.record', entity: 'Booking', entityId: input.bookingId })
  revalidatePath('/admin')
  revalidatePath('/admin/finance')
  return { ok: true }
}

/**
 * Confirm/adjust a client-submitted payment (e.g. an AWAITING crypto/bank tx). Staff-only + server-
 * authoritative — the customer never reaches this. `accountId` optionally records which wallet the
 * money landed in (income/deposit → finance accounts). Every status change is written to the
 * immutable finance audit trail.
 */
export async function setPaymentStatus(paymentId: string, status: PaymentStatus, accountId?: string | null): Promise<StaffResult> {
  const staff = await requireStaff()
  const before = await prisma.payment.findUnique({ where: { id: paymentId }, select: { status: true, accountId: true, kind: true, bookingId: true } })
  if (!before) return { ok: false, error: 'Платёж не найден' }
  // Kind/status compatibility — a DEPOSIT can only be held/returned; a rental payment can't be
  // held/returned. An incompatible pair would fall outside every finance balance bucket (money would
  // silently vanish from the cash position), so reject it server-side regardless of the UI.
  const isDeposit = before.kind === 'DEPOSIT'
  if (isDeposit && (status === 'PAID' || status === 'PARTIAL')) return { ok: false, error: 'Залог нельзя пометить как оплату — используйте «Залог получен/возвращён»' }
  if (!isDeposit && (status === 'DEPOSIT_HELD' || status === 'DEPOSIT_RETURNED')) return { ok: false, error: 'Обычный платёж нельзя пометить как залог' }

  // Resolve the optional wallet — ignore unknown/archived accounts.
  let acctId: string | null | undefined = undefined
  if (accountId !== undefined) {
    acctId = null
    if (accountId) {
      const a = await prisma.account.findUnique({ where: { id: accountId }, select: { id: true, archived: true } })
      if (a && !a.archived) acctId = a.id
    }
  }

  // Lock the booking row while flipping the payment status so a confirmation serializes with the
  // reservation-timeout sweep — the sweep (which locks the same row) then always sees this PAID/PARTIAL
  // payment and never expires the hold.
  const payment = await prisma.$transaction(async (tx) => {
    await lockBookingRow(tx, before.bookingId)
    return tx.payment.update({
      where: { id: paymentId },
      data: { status, ...(acctId !== undefined ? { accountId: acctId } : {}) },
    })
  })
  await recomputeBookingBalance(payment.bookingId)
  // When the rental is fully covered, move the booking forward — but ONLY when that is a legal
  // transition per the shared rulebook (AWAITING_PAYMENT → CONFIRMED). A full payment on a NEW or
  // AWAITING_CONFIRMATION booking must NOT skip lifecycle steps; staff walk it forward via the
  // order-detail control. This keeps canTransition the single source of truth even for this
  // system-driven advance, so the status history can't be scrambled from here either.
  if (status === 'PAID') {
    const b = await prisma.booking.findUnique({ where: { id: payment.bookingId }, select: { balanceAmount: true, status: true } })
    if (b && Number(b.balanceAmount) <= 0 && canTransition(b.status, 'CONFIRMED')) {
      await prisma.booking.update({ where: { id: payment.bookingId }, data: { status: 'CONFIRMED' } })
      await prisma.bookingStatusEvent.create({ data: { bookingId: payment.bookingId, status: 'CONFIRMED', byUserId: staff.id, comment: 'Оплата подтверждена' } })
    }
  }

  // Immutable finance audit: a payment confirmation IS a financial event.
  const changes: { field: string; from: string | null; to: string | null }[] = [{ field: 'status', from: before.status, to: status }]
  if (acctId !== undefined && acctId !== before.accountId) {
    const nameOf = async (id: string | null) => (id ? (await prisma.account.findUnique({ where: { id }, select: { name: true } }))?.name ?? id : null)
    changes.push({ field: 'account', from: await nameOf(before.accountId), to: await nameOf(acctId) })
  }
  await writeFinanceAudit({ entityType: 'payment', entityId: paymentId, action: 'confirm', staff, changes })

  await logAudit({ userId: staff.id, action: 'payment.status', entity: 'Payment', entityId: paymentId, meta: { status } })
  revalidatePath('/admin')
  revalidatePath('/admin/board')
  revalidatePath('/admin/finance')
  return { ok: true }
}

export async function toggleServiceActive(serviceId: string, active: boolean): Promise<StaffResult> {
  const staff = await requireStaff()
  await prisma.service.update({ where: { id: serviceId }, data: { active } })
  await logAudit({ userId: staff.id, action: 'service.active', entity: 'Service', entityId: serviceId })
  revalidatePath('/admin')
  revalidatePath('/services')
  return { ok: true }
}

/**
 * Create or edit an additional service (extras/tours/transfers…). Mirrors upsertCar: zod-validated,
 * staff-only, audited. The stable programmatic `key` is derived from the English name ONCE on create
 * and never rewritten on edit — SmartServiceResponse.needs stores these keys by value, so a changing
 * key would orphan recommendations. New services land at the end of the order.
 */
export async function upsertService(serviceId: string | null, raw: unknown): Promise<StaffResult> {
  const staff = await requireStaff()
  const parsed = serviceUpsertSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) }
  const d = parsed.data
  const data = {
    category: d.category,
    nameRu: d.nameRu,
    nameEn: d.nameEn,
    descRu: d.descRu?.trim() ? d.descRu.trim() : null,
    descEn: d.descEn?.trim() ? d.descEn.trim() : null,
    price: d.price,
    unit: d.unit,
    forGoals: d.forGoals,
    active: d.active,
  }
  if (serviceId) {
    await prisma.service.update({ where: { id: serviceId }, data })
  } else {
    const base = d.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'service'
    let key = base
    let n = 2
    while (await prisma.service.findUnique({ where: { key }, select: { id: true } })) key = `${base}_${n++}`
    const count = await prisma.service.count()
    await prisma.service.create({ data: { ...data, key, sortOrder: count } })
  }
  await logAudit({ userId: staff.id, action: serviceId ? 'service.update' : 'service.create', entity: 'Service', entityId: serviceId ?? 'new' })
  revalidatePath('/admin')
  revalidatePath('/services')
  return { ok: true }
}

/**
 * Delete a service. BookingExtra keeps its own name/price snapshot, so past orders stay intact — we
 * proactively null any references first (in a transaction) so the delete can never hit a FK error
 * regardless of the DB's referential action.
 */
export async function deleteService(serviceId: string): Promise<StaffResult> {
  const staff = await requireStaff()
  await prisma.$transaction([
    prisma.bookingExtra.updateMany({ where: { serviceId }, data: { serviceId: null } }),
    prisma.service.delete({ where: { id: serviceId } }),
  ])
  await logAudit({ userId: staff.id, action: 'service.delete', entity: 'Service', entityId: serviceId })
  revalidatePath('/admin')
  revalidatePath('/services')
  return { ok: true }
}

/**
 * Move a service one place up/down. Reassigns sortOrder to the whole list sequentially (0..n-1) so
 * the move is deterministic even when existing sortOrder values collide (e.g. all seeded to 0).
 */
export async function reorderService(serviceId: string, direction: 'up' | 'down'): Promise<StaffResult> {
  const staff = await requireStaff()
  const all = await prisma.service.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }], select: { id: true } })
  const i = all.findIndex((s) => s.id === serviceId)
  if (i === -1) return { ok: false, error: 'Услуга не найдена' }
  const j = direction === 'up' ? i - 1 : i + 1
  if (j < 0 || j >= all.length) return { ok: true } // already at the edge — nothing to do
  const ids = all.map((s) => s.id)
  ;[ids[i], ids[j]] = [ids[j], ids[i]]
  await prisma.$transaction(ids.map((id, idx) => prisma.service.update({ where: { id }, data: { sortOrder: idx } })))
  await logAudit({ userId: staff.id, action: 'service.reorder', entity: 'Service', entityId: serviceId, meta: { direction } })
  revalidatePath('/admin')
  revalidatePath('/services')
  return { ok: true }
}

export async function updateSetting(key: string, value: string): Promise<StaffResult> {
  const staff = await requireStaff()
  await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
  await logAudit({ userId: staff.id, action: 'setting.update', entity: 'Setting', entityId: key })
  revalidatePath('/admin')
  return { ok: true }
}

export async function updateRate(code: string, rateFromBase: number): Promise<StaffResult> {
  const staff = await requireStaff()
  await prisma.currencyRate.update({ where: { code: code as never }, data: { rateFromBase } })
  await logAudit({ userId: staff.id, action: 'rate.update', entity: 'CurrencyRate', entityId: code })
  revalidatePath('/admin')
  return { ok: true }
}

export async function updateSiteContent(key: string, locale: string, value: string): Promise<StaffResult> {
  const staff = await requireStaff()
  await prisma.siteContent.upsert({
    where: { key_locale: { key, locale } },
    update: { value },
    create: { key, locale, value },
  })
  await logAudit({ userId: staff.id, action: 'content.update', entity: 'SiteContent', entityId: `${key}:${locale}` })
  revalidatePath('/', 'layout')
  return { ok: true }
}
