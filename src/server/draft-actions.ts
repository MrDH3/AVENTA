'use server'

import { headers } from 'next/headers'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser, hashPassword, createSession } from '@/lib/auth'
import { emailSchema, passwordSchema } from '@/lib/validation'
import { saveDraft, claimAnonDraftForUser, discardDraftForCar } from '@/lib/booking-draft'
import { isDisposableEmail, domainCanReceiveMail } from '@/lib/email-validation'
import { sendVerificationEmail } from '@/lib/email-verify'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { safeInternalPath } from '@/lib/safe-path'

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
  redirectTo?: string // on success — where the now-signed-in client should land
}

/**
 * Sign-up: email + name + password + data-processing consent. The visitor CHOOSES their password
 * here (no emailed set-password link), we BIND their own anonymous booking draft (cookie-scoped —
 * a user can only bind a draft they created), send a CONFIRMATION email to verify the address, and
 * sign them in immediately. The unverified state drives the "confirm your email" banner in the
 * cabinet until they click the link. Throwaway / dead-domain emails are rejected.
 */
export async function requestAccountAction(input: {
  email: string
  name: string
  password: string
  consentPersonalData: boolean
  next?: string
}): Promise<RequestAccountResult> {
  const rl = rateLimit(`signup:${clientIp()}`, 5, 600)
  if (!rl.ok) return { ok: false, error: 'Слишком много попыток. Попробуйте позже.' }

  const email = emailSchema.safeParse(input.email)
  if (!email.success) return { ok: false, fieldErrors: { email: 'Некорректный email' } }
  const name = String(input.name ?? '').trim()
  if (name.length < 1) return { ok: false, fieldErrors: { name: 'Укажите имя' } }
  const pw = passwordSchema.safeParse(String(input.password ?? ''))
  if (!pw.success) return { ok: false, fieldErrors: { password: pw.error.issues[0]?.message ?? 'Минимум 8 символов' } }
  if (!input.consentPersonalData) return { ok: false, fieldErrors: { consentPersonalData: 'Требуется согласие на обработку данных' } }

  // Reject throwaway / temporary-mail providers up front (cheap, in-memory).
  if (isDisposableEmail(email.data)) {
    return { ok: false, fieldErrors: { email: 'Укажите постоянный email — временные адреса не принимаются' } }
  }

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

  // Deliverability: reject dead / mistyped domains that can't receive mail (best-effort, fails open).
  if (!(await domainCanReceiveMail(email.data))) {
    return { ok: false, fieldErrors: { email: 'Похоже, такого почтового домена не существует — проверьте адрес' } }
  }

  const passwordHash = await hashPassword(pw.data)
  if (!user) {
    const [firstName, ...rest] = name.split(/\s+/)
    user = await prisma.user.create({
      data: { email: email.data, firstName, lastName: rest.join(' ') || null, role: 'CLIENT', passwordHash },
    })
    await prisma.consentRecord.create({ data: { userId: user.id, type: 'personal_data', ...consentMeta } }).catch(() => {})
  } else {
    // An existing passwordless account (created via OAuth/OTP) — set the password they just chose.
    user = await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
  }

  // Bind the visitor's OWN anon draft to this account (cookie-scoped; safe).
  await claimAnonDraftForUser(user.id).catch(() => null)

  // Email a confirmation link (verify the address), then sign them in right away.
  await sendVerificationEmail({ id: user.id, email: user.email, firstName: user.firstName })
  await createSession(user.id)
  await logAudit({ userId: user.id, action: 'auth.signup', meta: { hasNext: !!next } })

  return { ok: true, redirectTo: next ?? '/account' }
}
