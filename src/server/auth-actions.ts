'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { hashPassword, verifyPassword, createSession, destroySession, getCurrentUser } from '@/lib/auth'
import { registerSchema, loginSchema, fieldErrors } from '@/lib/validation'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { normalizePhone } from '@/lib/phone'
import { safeInternalPath } from '@/lib/safe-path'

export interface ActionResult {
  ok: boolean
  error?: string
  fieldErrors?: Record<string, string>
  redirectTo?: string
}

function recordConsent(userId: string, type: string) {
  const h = headers()
  return prisma.consentRecord.create({
    data: {
      userId,
      type,
      ip: (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || null,
      userAgent: h.get('user-agent')?.slice(0, 300) ?? null,
    },
  })
}

export async function registerAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const rl = rateLimit(`register:${clientIp()}`, 5, 600)
  if (!rl.ok) return { ok: false, error: `Слишком много попыток. Повторите через ${rl.retryAfterSec}с.` }

  const parsed = registerSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone') ?? '',
    password: formData.get('password'),
    consentPersonalData: formData.get('consentPersonalData') === 'on' || formData.get('consentPersonalData') === 'true',
    consentOffer: formData.get('consentOffer') === 'on' || formData.get('consentOffer') === 'true',
  })
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) }

  const data = parsed.data
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) return { ok: false, fieldErrors: { email: 'Этот email уже зарегистрирован' } }

  // Phone uniqueness (normalized) — reject a number already tied to another account.
  const phone = normalizePhone(data.phone)
  if (phone) {
    const phoneTaken = await prisma.user.findFirst({ where: { phone } })
    if (phoneTaken) {
      return { ok: false, fieldErrors: { phone: 'Этот телефон уже привязан к другому аккаунту' } }
    }
  }

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash: await hashPassword(data.password),
      firstName: data.firstName,
      lastName: data.lastName,
      phone,
      role: 'CLIENT',
    },
  })
  await recordConsent(user.id, 'personal_data')
  await recordConsent(user.id, 'offer')
  await createSession(user.id)
  await logAudit({ userId: user.id, action: 'auth.register', entity: 'User', entityId: user.id })

  redirect('/account')
}

export async function loginAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const rl = rateLimit(`login:${clientIp()}`, 8, 300)
  if (!rl.ok) return { ok: false, error: `Слишком много попыток. Повторите через ${rl.retryAfterSec}с.` }

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  const ok = user?.passwordHash ? await verifyPassword(parsed.data.password, user.passwordHash) : false
  if (!user || !ok) {
    // Guide OAuth-only accounts toward social sign-in without leaking existence.
    if (user && !user.passwordHash) {
      return { ok: false, error: 'Этот аккаунт использует вход через Google/Yandex или код. Задайте пароль через «Забыли пароль?».' }
    }
    await logAudit({ action: 'auth.login.fail', meta: { email: parsed.data.email } })
    return { ok: false, error: 'Неверный email или пароль' }
  }

  if (user.archivedAt) {
    await logAudit({ action: 'auth.login.archived', meta: { email: user.email } })
    return { ok: false, error: 'Этот аккаунт отключён. Обратитесь к владельцу компании.' }
  }

  await createSession(user.id)
  await logAudit({ userId: user.id, action: 'auth.login', entity: 'User', entityId: user.id })
  // Return a client to where they came from (e.g. their in-progress booking) when it's a safe
  // same-origin path; staff always go to the admin panel.
  const next = safeInternalPath(String(formData.get('next') ?? ''))
  redirect(user.role === 'CLIENT' ? next ?? '/account' : '/admin')
}

export async function logoutAction(): Promise<void> {
  const user = await getCurrentUser()
  await destroySession()
  if (user) await logAudit({ userId: user.id, action: 'auth.logout' })
  redirect('/')
}
