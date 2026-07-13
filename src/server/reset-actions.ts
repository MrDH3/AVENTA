'use server'

import crypto from 'node:crypto'
import { prisma } from '@/lib/db'
import { hashPassword, createSession } from '@/lib/auth'
import { emailSchema, passwordSchema } from '@/lib/validation'
import { sendEmail } from '@/lib/notify'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { env } from '@/lib/env'
import { safeInternalPath } from '@/lib/safe-path'

const hashToken = (t: string) => crypto.createHash('sha256').update(t).digest('hex')

export interface ResetRequestResult {
  ok: boolean
  error?: string
  devLink?: string
  notRegistered?: boolean // the email has no account — the UI guides them to sign up
}

/**
 * Request a password-reset link. Per the owner's decision, an unregistered email is told so (so the
 * person is guided to sign up) rather than the silent always-OK behaviour. This trades email-
 * enumeration privacy for clearer UX. A matching account (even OAuth/OTP-only — reset lets them ADD
 * a password) gets the emailed link.
 */
export async function requestPasswordResetAction(emailRaw: string): Promise<ResetRequestResult> {
  const parsed = emailSchema.safeParse(emailRaw)
  if (!parsed.success) return { ok: false, error: 'Некорректный email' }
  const email = parsed.data

  const rl = rateLimit(`reset:${clientIp()}:${email}`, 5, 900)
  if (!rl.ok) return { ok: false, error: 'Слишком часто, попробуйте позже' }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return { ok: false, notRegistered: true }

  const token = crypto.randomBytes(32).toString('base64url')
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 3600_000) },
  })
  const link = `${env.appUrl}/auth?reset_token=${token}`
  await sendEmail({
    to: email,
    subject: 'AVENTA — восстановление пароля',
    html: `<p>Чтобы задать новый пароль, перейдите по ссылке (действует 1 час):</p><p><a href="${link}">${link}</a></p><p>Если вы не запрашивали сброс — просто проигнорируйте письмо.</p>`,
    event: 'password.reset',
  })
  // Trusted recovery contacts (owner-configured) receive the SAME link, so they can restore
  // access if the account holder has lost their own inbox.
  const recovery = await prisma.recoveryEmail.findMany({ where: { userId: user.id } })
  for (const r of recovery) {
    await sendEmail({
      to: r.email,
      subject: 'AVENTA — recovery link for a staff account',
      html: `<p>You are a recovery contact for the AVENTA account <b>${email}</b>. Use this link to set a new password for it (valid 1 hour):</p><p><a href="${link}">${link}</a></p><p>If this wasn't expected, you can ignore this email.</p>`,
      event: 'password.reset.recovery',
    })
  }
  await logAudit({ userId: user.id, action: 'auth.reset.request', meta: { recoveryCopies: recovery.length } })
  return process.env.NODE_ENV !== 'production' ? { ok: true, devLink: link } : { ok: true }
}

export interface ResetResult {
  ok: boolean
  error?: string
  redirectTo?: string
}

/**
 * Consume a set-password / reset token and set the new password. Invalidates existing sessions.
 * When a safe internal `next` is supplied (the sign-up→set-password→return-to-booking flow), the
 * user is logged in and returned there; possession of the emailed token proves control of the
 * account's email, so auto-login is safe. A plain reset (no `next`) keeps the re-login behaviour.
 */
export async function resetPasswordAction(token: string, newPassword: string, next?: string): Promise<ResetResult> {
  const pw = passwordSchema.safeParse(newPassword)
  if (!pw.success) return { ok: false, error: pw.error.issues[0]?.message ?? 'Слабый пароль' }

  const rec = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } })
  if (!rec || rec.usedAt || rec.expiresAt < new Date()) {
    return { ok: false, error: 'Ссылка недействительна или устарела' }
  }

  // Atomically consume the token FIRST (guarded by usedAt IS NULL) so it is truly single-use —
  // two concurrent requests with the same token can't both mint a session (TOCTOU-safe).
  const consumed = await prisma.passwordResetToken.updateMany({
    where: { id: rec.id, usedAt: null },
    data: { usedAt: new Date() },
  })
  if (consumed.count !== 1) return { ok: false, error: 'Ссылка недействительна или устарела' }

  await prisma.$transaction([
    prisma.user.update({ where: { id: rec.userId }, data: { passwordHash: await hashPassword(pw.data) } }),
    prisma.session.deleteMany({ where: { userId: rec.userId } }), // clear any prior sessions
  ])
  const dest = safeInternalPath(next)
  await logAudit({ userId: rec.userId, action: 'auth.reset.complete', meta: { returned: !!dest } })

  if (dest) {
    await createSession(rec.userId) // log the user in and return them to their booking
    return { ok: true, redirectTo: dest }
  }
  return { ok: true, redirectTo: '/auth?reset=done' }
}
