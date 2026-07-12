'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { env } from '@/lib/env'
import { getCurrentUser } from '@/lib/auth'
import { sendEmail, sendTelegram } from '@/lib/notify'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Укажите имя').max(120),
  email: z.string().trim().email('Некорректный email').max(160),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  message: z.string().trim().min(5, 'Сообщение слишком короткое').max(4000),
  // Honeypot — must stay empty. Bots fill every field.
  company: z.string().max(0).optional().or(z.literal('')),
})

export interface ContactResult {
  ok: boolean
  error?: string
  fieldErrors?: Record<string, string>
}

/** Handle a contact-form submission: validate, rate-limit, notify the business, record. */
export async function sendContactMessageAction(input: {
  name: string
  email: string
  phone?: string
  message: string
  company?: string
}): Promise<ContactResult> {
  // Per-IP limit is the first line, but clientIp() derives from X-Forwarded-For which a client
  // can spoof/rotate; a global backstop bounds the blast radius of a spoofed-IP flood regardless.
  // (Hardening clientIp() to a trusted-proxy hop is a recommended app-wide infra follow-up.)
  const rl = rateLimit(`contact:${clientIp()}`, 5, 600)
  if (!rl.ok) return { ok: false, error: 'Слишком много обращений. Попробуйте позже.' }
  const rlGlobal = rateLimit('contact:global', 60, 600)
  if (!rlGlobal.ok) return { ok: false, error: 'Слишком много обращений. Попробуйте позже.' }

  const parsed = contactSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    // A tripped honeypot pretends to succeed (don't tell the bot).
    if (fieldErrors.company) return { ok: true }
    return { ok: false, fieldErrors }
  }

  const { name, email, phone, message } = parsed.data
  const user = await getCurrentUser()
  const h = headers()
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || null

  // HTML-entity-encode (NOT delete) before both sinks: the email HTML body and Telegram's
  // parse_mode:'HTML'. Escaping & first is required — Telegram rejects unescaped '&'/entities
  // with a 400 (silently dropping the alert), and deleting '<'/'>' would eat legit user text.
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const subject = `Новое обращение с сайта — ${esc(name)}`
  const html = `
    <h2>Обращение с формы «Контакты»</h2>
    <p><b>Имя:</b> ${esc(name)}</p>
    <p><b>Email:</b> ${esc(email)}</p>
    ${phone ? `<p><b>Телефон:</b> ${esc(phone)}</p>` : ''}
    <p><b>Сообщение:</b><br/>${esc(message).replace(/\n/g, '<br/>')}</p>
    <hr/><p style="color:#888">${user ? `Пользователь: ${esc(user.email)}` : 'Гость'} · IP: ${esc(ip ?? '—')}</p>`

  // Fan out to the business; both degrade gracefully to a console log without keys.
  await Promise.all([
    sendEmail({ to: env.mail.adminEmail, subject, html, event: 'contact.message' }),
    sendTelegram(
      `✉️ <b>Новое обращение</b>\n${esc(name)} · ${esc(email)}${phone ? ` · ${esc(phone)}` : ''}\n${esc(message).slice(0, 500)}`,
      'contact.message',
    ),
  ])
  await logAudit({ userId: user?.id, action: 'contact.message', meta: { name, email, hasPhone: !!phone } })

  return { ok: true }
}
