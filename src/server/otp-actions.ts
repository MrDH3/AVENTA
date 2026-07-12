'use server'

import { prisma } from '@/lib/db'
import { createSession } from '@/lib/auth'
import { linkOrCreateUser } from '@/lib/identity'
import { issueOtp, verifyOtp, OTP_CHANNELS, type OtpChannel } from '@/lib/otp'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { normalizePhone } from '@/lib/phone'

const isEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)

function normalizeIdentifier(channel: OtpChannel, raw: string): string {
  const v = raw.trim()
  // shared canonical phone form (falls back to the raw stripped digits if too short)
  return channel === 'email' ? v.toLowerCase() : normalizePhone(v) ?? v.replace(/[^\d+]/g, '')
}

export interface OtpResult {
  ok: boolean
  error?: string
  devCode?: string
  sent?: boolean
}

/** Request a one-time code over the chosen channel. */
export async function requestOtpAction(channelRaw: string, identifierRaw: string): Promise<OtpResult> {
  const channel = OTP_CHANNELS.includes(channelRaw as OtpChannel) ? (channelRaw as OtpChannel) : null
  if (!channel) return { ok: false, error: 'Неизвестный канал' }
  const identifier = normalizeIdentifier(channel, identifierRaw)

  if (channel === 'email' && !isEmail(identifier)) return { ok: false, error: 'Некорректный email' }
  if (channel !== 'email' && identifier.replace(/\D/g, '').length < 8) return { ok: false, error: 'Некорректный номер' }

  const rl = rateLimit(`otp:${clientIp()}:${identifier}`, 5, 600)
  if (!rl.ok) return { ok: false, error: `Слишком часто. Повторите через ${rl.retryAfterSec}с.` }

  const { devCode } = await issueOtp(identifier, channel)
  await logAudit({ action: 'auth.otp.request', meta: { channel, identifier } })
  return { ok: true, sent: true, devCode }
}

export interface OtpVerifyResult {
  ok: boolean
  error?: string
  redirectTo?: string
}

/** Verify a code and sign the user in (creating the account if needed). */
export async function verifyOtpAction(
  channelRaw: string,
  identifierRaw: string,
  code: string,
  firstName?: string,
): Promise<OtpVerifyResult> {
  const channel = OTP_CHANNELS.includes(channelRaw as OtpChannel) ? (channelRaw as OtpChannel) : null
  if (!channel) return { ok: false, error: 'Неизвестный канал' }
  const identifier = normalizeIdentifier(channel, identifierRaw)

  const rl = rateLimit(`otpv:${clientIp()}:${identifier}`, 10, 600)
  if (!rl.ok) return { ok: false, error: 'Слишком много попыток' }

  const valid = await verifyOtp(identifier, channel, code.trim())
  if (!valid) return { ok: false, error: 'Неверный или просроченный код' }

  const user = await linkOrCreateUser({
    provider: channel === 'email' ? 'email' : 'phone',
    providerAccountId: identifier,
    email: channel === 'email' ? identifier : undefined,
    phone: channel !== 'email' ? identifier : undefined,
    firstName: firstName?.trim() || undefined,
  })
  await createSession(user.id)
  await logAudit({ userId: user.id, action: `auth.otp.${channel}`, entity: 'User', entityId: user.id })
  return { ok: true, redirectTo: '/account' }
}
