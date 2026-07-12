'use server'

import crypto from 'node:crypto'
import { headers } from 'next/headers'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { emailSchema } from '@/lib/validation'
import { saveDraft, claimAnonDraftForUser, discardDraftForCar } from '@/lib/booking-draft'
import { sendEmail } from '@/lib/notify'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { env } from '@/lib/env'
import { safeInternalPath } from '@/lib/safe-path'

const hashToken = (t: string) => crypto.createHash('sha256').update(t).digest('hex')

/**
 * Persist the visitor's step-1 booking selections as a draft (bound to the user if signed in,
 * else to the anonymous `aventa_draft` cookie). Called when an anonymous visitor leaves step 1
 * for sign-up, so nothing is lost across the auth detour.
 */
export async function saveBookingDraftAction(input: {
  carSlug: string
  data: Record<string, unknown>
  step: number
}): Promise<{ ok: boolean; error?: string }> {
  const rl = rateLimit(`draft:${clientIp()}`, 40, 600)
  if (!rl.ok) return { ok: false, error: 'Слишком часто, попробуйте позже' }

  const slug = String(input.carSlug ?? '').trim().slice(0, 120)
  if (!slug) return { ok: false, error: 'Не указан автомобиль' }
  const car = await prisma.car.findUnique({ where: { slug }, select: { id: true } })
  if (!car) return { ok: false, error: 'Автомобиль не найден' }

  // The booking wizard is 0-indexed (0=Route … 5=Confirm); store the FURTHEST step reached.
  const step = Number.isFinite(input.step) ? Math.max(0, Math.min(5, Math.round(input.step))) : 0
  const data = input.data && typeof input.data === 'object' ? input.data : {}

  const user = await getCurrentUser()
  await saveDraft(user?.id ?? null, { carSlug: slug, data: data as Prisma.InputJsonValue, step })
  return { ok: true }
}

/** Discard the visitor's own draft for a car — powers "Don't save" (exit dialog) and "Start fresh"
 *  (resume prompt). Owner-scoped server-side; never trusts a draft id from the client. */
export async function discardBookingDraftAction(carSlug: string): Promise<{ ok: boolean }> {
  const slug = String(carSlug ?? '').trim().slice(0, 120)
  if (!slug) return { ok: false }
  const user = await getCurrentUser()
  await discardDraftForCar(user?.id ?? null, slug)
  return { ok: true }
}

export interface RequestAccountResult {
  ok: boolean
  error?: string
  fieldErrors?: Record<string, string>
  devLink?: string
}

/**
 * Simplified sign-up: email + name + data-processing consent only. Creates a passwordless
 * account, BINDS the visitor's own anonymous draft to it (server-side, cookie-scoped — a user
 * can only bind a draft they created), then emails a set-password link that returns them to
 * their in-progress booking. No password is collected here.
 */
export async function requestAccountAction(input: {
  email: string
  name: string
  consentPersonalData: boolean
  next?: string
}): Promise<RequestAccountResult> {
  const rl = rateLimit(`signup:${clientIp()}`, 5, 600)
  if (!rl.ok) return { ok: false, error: 'Слишком много попыток. Попробуйте позже.' }

  const email = emailSchema.safeParse(input.email)
  if (!email.success) return { ok: false, fieldErrors: { email: 'Некорректный email' } }
  const name = String(input.name ?? '').trim()
  if (name.length < 1) return { ok: false, fieldErrors: { name: 'Укажите имя' } }
  if (!input.consentPersonalData) return { ok: false, fieldErrors: { consentPersonalData: 'Требуется согласие на обработку данных' } }

  const next = safeInternalPath(input.next)
  const h = headers()
  const consentMeta = {
    ip: (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || null,
    userAgent: h.get('user-agent')?.slice(0, 300) ?? null,
  }

  let user = await prisma.user.findUnique({ where: { email: email.data } })
  if (user?.passwordHash) {
    // Existing full account — don't create a duplicate; guide them to sign in.
    return { ok: false, error: 'Этот email уже зарегистрирован — войдите в аккаунт.' }
  }
  if (!user) {
    const [firstName, ...rest] = name.split(/\s+/)
    user = await prisma.user.create({
      data: { email: email.data, firstName, lastName: rest.join(' ') || null, role: 'CLIENT' },
    })
    await prisma.consentRecord.create({ data: { userId: user.id, type: 'personal_data', ...consentMeta } }).catch(() => {})
  }

  // Bind the visitor's OWN anon draft to this account (cookie-scoped; safe).
  await claimAnonDraftForUser(user.id).catch(() => null)

  // Issue a single-use set-password token and email the return-to-booking link.
  const token = crypto.randomBytes(32).toString('base64url')
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 3600_000) },
  })
  const link = `${env.appUrl}/auth?reset_token=${token}${next ? `&next=${encodeURIComponent(next)}` : ''}`
  await sendEmail({
    to: email.data,
    subject: 'AVENTA — задайте пароль и продолжите бронирование',
    html: `<p>Здравствуйте${user.firstName ? `, ${user.firstName}` : ''}!</p><p>Чтобы завершить создание аккаунта, задайте пароль по ссылке (действует 1 час) — после этого вы вернётесь к своему бронированию:</p><p><a href="${link}">${link}</a></p><p>Если вы этого не запрашивали — просто проигнорируйте письмо.</p>`,
    event: 'account.setpassword',
  })
  await logAudit({ userId: user.id, action: 'auth.signup.request', meta: { hasNext: !!next } })
  return { ok: true, ...(process.env.NODE_ENV !== 'production' ? { devLink: link } : {}) }
}
