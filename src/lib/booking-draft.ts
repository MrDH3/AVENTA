import 'server-only'
import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { Prisma } from '@prisma/client'
import { prisma } from './db'
import { logAudit } from './audit'

/**
 * Draft bookings — an in-progress booking held for a visitor while anonymous (keyed by the
 * httpOnly `aventa_draft` cookie), then BOUND to the account at sign-up so nothing is lost
 * across the email→set-password detour. Also powers the "continue your booking" card state.
 *
 * SECURITY: the anon token is a 192-bit random value, httpOnly (not readable by page JS) and
 * server-only. A draft can be claimed ONLY by the account whose own cookie holds that token —
 * a user can never bind a draft they didn't create, and no draft id is ever accepted from input.
 */

const ANON_COOKIE = 'aventa_draft'
const ANON_COOKIE_TTL_MS = 30 * 864e5 // cookie token lives 30 days (the DRAFT expires sooner, below)

// A saved draft (a half-filled booking FORM — NOT a created booking) auto-deletes after this window
// if not completed. Configurable; default 24h. Distinct from the reservation-hold timeout, which
// releases a HELD CAR on a created manual booking (see aventa-reservation-timeout).
const DRAFT_TTL_KEY = 'booking_draft_ttl_hours'
const DEFAULT_DRAFT_TTL_HOURS = 24

export async function getBookingDraftTtlHours(): Promise<number> {
  const s = await prisma.setting.findUnique({ where: { key: DRAFT_TTL_KEY } })
  const n = parseInt(s?.value ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_DRAFT_TTL_HOURS
}

export async function setBookingDraftTtlHours(hours: number): Promise<void> {
  const v = String(Math.max(1, Math.floor(hours)))
  await prisma.setting.upsert({
    where: { key: DRAFT_TTL_KEY },
    update: { value: v, group: 'booking' },
    create: { key: DRAFT_TTL_KEY, value: v, group: 'booking' },
  })
}

/** Read the anon-draft cookie token (read-only; safe in any server context). */
export function readAnonId(): string | null {
  return cookies().get(ANON_COOKIE)?.value ?? null
}

/** Ensure an anon-draft cookie exists; returns the token. Call only from an action/route handler. */
export function ensureAnonId(): string {
  const existing = cookies().get(ANON_COOKIE)?.value
  if (existing) return existing
  const token = crypto.randomBytes(24).toString('base64url')
  cookies().set(ANON_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: ANON_COOKIE_TTL_MS / 1000 })
  return token
}

export interface DraftInput {
  carSlug: string
  data: Prisma.InputJsonValue
  step: number
}

/** Upsert the current visitor's draft (by userId when authed, else by the anon cookie). */
export async function saveDraft(userId: string | null, input: DraftInput): Promise<void> {
  const ttlHours = await getBookingDraftTtlHours()
  const expiresAt = new Date(Date.now() + ttlHours * 3_600_000)
  if (userId) {
    const existing = await prisma.bookingDraft.findFirst({ where: { userId, carSlug: input.carSlug } })
    if (existing) {
      await prisma.bookingDraft.update({ where: { id: existing.id }, data: { data: input.data, step: input.step, expiresAt } })
    } else {
      await prisma.bookingDraft.create({ data: { userId, carSlug: input.carSlug, data: input.data, step: input.step, expiresAt } })
    }
    return
  }
  const anonId = ensureAnonId()
  const existing = await prisma.bookingDraft.findFirst({ where: { anonId, userId: null } })
  if (existing) {
    await prisma.bookingDraft.update({ where: { id: existing.id }, data: { carSlug: input.carSlug, data: input.data, step: input.step, expiresAt } })
  } else {
    await prisma.bookingDraft.create({ data: { anonId, carSlug: input.carSlug, data: input.data, step: input.step, expiresAt } })
  }
}

export interface DraftView {
  carSlug: string
  data: Record<string, unknown>
  step: number
}

function toView(d: { carSlug: string; data: Prisma.JsonValue; step: number }): DraftView {
  return {
    carSlug: d.carSlug,
    data: d.data && typeof d.data === 'object' && !Array.isArray(d.data) ? (d.data as Record<string, unknown>) : {},
    step: d.step,
  }
}

/** The user's in-progress (non-expired) draft for a car, if any. */
export async function getUserDraftForCar(userId: string, carSlug: string): Promise<DraftView | null> {
  const d = await prisma.bookingDraft.findFirst({
    where: { userId, carSlug, expiresAt: { gt: new Date() } },
    orderBy: { updatedAt: 'desc' },
  })
  return d ? toView(d) : null
}

/** Car slugs the user currently has an in-progress draft for (for "continue booking" highlighting). */
export async function getUserDraftCarSlugs(userId: string): Promise<Set<string>> {
  const rows = await prisma.bookingDraft.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    select: { carSlug: true },
  })
  return new Set(rows.map((r) => r.carSlug))
}

/**
 * Bind the visitor's OWN anon draft to a user at sign-up. Enforced server-side: only the draft
 * whose anonId equals the claimer's own cookie token is bound. Returns the claimed car slug (for
 * the return-to-booking redirect), or null if there was no anon draft.
 */
export async function claimAnonDraftForUser(userId: string): Promise<{ carSlug: string } | null> {
  const anonId = readAnonId()
  if (!anonId) return null
  const draft = await prisma.bookingDraft.findFirst({ where: { anonId, userId: null } })
  if (!draft) return null
  // Prefer the freshly-created anon draft over any stale one the user already had for that car.
  await prisma.bookingDraft.deleteMany({ where: { userId, carSlug: draft.carSlug } })
  const claimed = await prisma.bookingDraft.update({ where: { id: draft.id }, data: { userId, anonId: null } })
  // Retire the anon cookie so the same token can never claim again.
  cookies().set(ANON_COOKIE, '', { path: '/', maxAge: 0 })
  return { carSlug: claimed.carSlug }
}

/** Discard the visitor's draft for a car — "Don't save" / "Start fresh". Owner-scoped (userId or the
 *  visitor's own anon cookie); never accepts a draft id from input. */
export async function discardDraftForCar(userId: string | null, carSlug: string): Promise<void> {
  if (userId) {
    await prisma.bookingDraft.deleteMany({ where: { userId, carSlug } })
    return
  }
  const anonId = readAnonId()
  if (anonId) await prisma.bookingDraft.deleteMany({ where: { anonId, userId: null, carSlug } })
}

/**
 * Background sweep: delete DRAFTS (half-filled forms) whose 24h window has elapsed. This is the draft
 * auto-delete — completely separate from the reservation-hold timeout (which cancels a CREATED manual
 * booking and releases its car). Run on a schedule (see /api/cron/booking-draft-cleanup) and/or manually.
 */
export async function runBookingDraftCleanup(now: Date = new Date()): Promise<{ deleted: number; ttlHours: number }> {
  const ttlHours = await getBookingDraftTtlHours()
  const res = await prisma.bookingDraft.deleteMany({ where: { expiresAt: { lt: now } } })
  await logAudit({ action: 'booking.draft.cleanup', entity: 'BookingDraft', entityId: 'draft-sweep', meta: { deleted: res.count, ttlHours } }).catch(() => {})
  return { deleted: res.count, ttlHours }
}
