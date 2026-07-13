import 'server-only'
import crypto from 'node:crypto'
import { prisma } from './db'
import { env } from './env'
import { sendEmail } from './notify'

const TOKEN_TTL_HOURS = 48

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Issue a fresh single-use verification link and email it. Any earlier unused token for this user is
 * dropped first, so only the newest link works. Falls back to a console log when SMTP isn't configured
 * (see lib/notify) — the token is still created, so the printed link is usable in dev.
 */
export async function sendVerificationEmail(user: { id: string; email: string; firstName: string | null }): Promise<void> {
  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id, usedAt: null } })
  const token = crypto.randomBytes(32).toString('base64url')
  await prisma.emailVerificationToken.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + TOKEN_TTL_HOURS * 3600_000) },
  })
  const link = `${env.appUrl}/auth/verify-email?token=${token}`
  const hi = user.firstName ? `Здравствуйте, ${user.firstName}!` : 'Здравствуйте!'
  await sendEmail({
    to: user.email,
    subject: 'AVENTA — подтвердите ваш email',
    html:
      `<p>${hi}</p>` +
      `<p>Подтвердите адрес электронной почты, чтобы завершить регистрацию в AVENTA. Ссылка действует ${TOKEN_TTL_HOURS} часа:</p>` +
      `<p><a href="${link}">${link}</a></p>` +
      `<p>Если вы не регистрировались в AVENTA — просто проигнорируйте это письмо.</p>`,
    event: 'auth.verify_email',
  })
}

export type VerifyResult = 'ok' | 'already' | 'invalid' | 'expired'

/**
 * Redeem a verification token: flip User.emailVerified true and mark the token used (single-use),
 * inside one transaction. Idempotent — a token whose user is already verified returns 'already'.
 */
export async function verifyEmailToken(token: string): Promise<VerifyResult> {
  if (!token) return 'invalid'
  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, emailVerified: true } } },
  })
  if (!row) return 'invalid'
  if (row.user.emailVerified) return 'already'
  if (row.usedAt) return 'invalid'
  if (row.expiresAt < new Date()) return 'expired'

  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { emailVerified: true } }),
    prisma.emailVerificationToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
  ])
  return 'ok'
}
