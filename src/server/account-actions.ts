'use server'

import { prisma } from '@/lib/db'
import { requireUser, verifyPassword, hashPassword, createSession } from '@/lib/auth'
import { passwordSchema } from '@/lib/validation'
import { logAudit } from '@/lib/audit'
import { rateLimit } from '@/lib/rate-limit'

export interface ChangePwResult {
  ok: boolean
  error?: string
}

/**
 * Self-service password change for ANY signed-in user (client, admin, owner): verify the current
 * password, then set the new one. Invalidates all other sessions for safety and keeps the current
 * session alive with a fresh cookie.
 */
export async function changePasswordAction(_prev: ChangePwResult, formData: FormData): Promise<ChangePwResult> {
  const user = await requireUser()
  const rl = rateLimit(`changepw:${user.id}`, 6, 900)
  if (!rl.ok) return { ok: false, error: 'Слишком часто — попробуйте позже' }

  const current = String(formData.get('current') ?? '')
  const parsed = passwordSchema.safeParse(String(formData.get('next') ?? ''))
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Слабый пароль (мин. 8 символов)' }

  // OAuth/OTP-only accounts have no password to compare — they set one via "forgot password".
  if (!user.passwordHash) return { ok: false, error: 'У аккаунта ещё нет пароля — задайте его через «Забыли пароль?».' }
  if (!(await verifyPassword(current, user.passwordHash))) return { ok: false, error: 'Неверный текущий пароль' }
  if (await verifyPassword(parsed.data, user.passwordHash)) return { ok: false, error: 'Новый пароль совпадает с текущим' }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data) } }),
    prisma.session.deleteMany({ where: { userId: user.id } }), // drop all sessions (incl. other devices)
  ])
  await createSession(user.id) // …then re-issue one so THIS session stays signed in
  await logAudit({ userId: user.id, action: 'auth.password.change' })
  return { ok: true }
}
