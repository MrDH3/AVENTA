import 'server-only'
import crypto from 'node:crypto'
import { prisma } from './db'
import { sendEmail, sendTelegram } from './notify'

export type OtpChannel = 'sms' | 'whatsapp' | 'telegram' | 'max' | 'email'
export const OTP_CHANNELS: OtpChannel[] = ['sms', 'whatsapp', 'telegram', 'max', 'email']

const TTL_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 5

const hashCode = (code: string) => crypto.createHash('sha256').update(code).digest('hex')

/** Create + "send" a one-time code. In dev (no provider) the code is logged and
 *  returned so it can be surfaced in the UI; in production it is never returned. */
export async function issueOtp(
  identifier: string,
  channel: OtpChannel,
  purpose: 'login' | 'register' = 'login',
): Promise<{ devCode?: string }> {
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
  await prisma.otpCode.create({
    data: { identifier, channel, codeHash: hashCode(code), purpose, expiresAt: new Date(Date.now() + TTL_MS) },
  })

  const text = `AVENTA — ваш код подтверждения: ${code}. Действует 10 минут.`
  if (channel === 'email') {
    await sendEmail({ to: identifier, subject: 'AVENTA — код подтверждения', html: `<p>${text}</p>`, event: 'otp.email' })
  } else if (channel === 'telegram') {
    await sendTelegram(`Код для входа: <b>${code}</b> (${identifier})`, 'otp.telegram')
  } else {
    // sms / whatsapp / max — provider required in production; log in dev.
    console.info(`\n[OTP ${channel} → ${identifier}] ${code}\n`)
    await prisma.notification.create({
      data: { event: `otp.${channel}`, channel: 'INAPP', toAddress: identifier, body: text, status: 'PENDING' },
    }).catch(() => {})
  }

  return process.env.NODE_ENV === 'production' ? {} : { devCode: code }
}

/** Verify a submitted code for an identifier+channel. */
export async function verifyOtp(identifier: string, channel: OtpChannel, code: string): Promise<boolean> {
  const rec = await prisma.otpCode.findFirst({
    where: { identifier, channel, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
  if (!rec) return false
  if (rec.attempts >= MAX_ATTEMPTS) return false

  const ok = rec.codeHash === hashCode(code)
  await prisma.otpCode.update({
    where: { id: rec.id },
    data: ok ? { consumedAt: new Date() } : { attempts: { increment: 1 } },
  })
  return ok
}
