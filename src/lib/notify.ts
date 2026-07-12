import 'server-only'
import nodemailer from 'nodemailer'
import type { NotificationChannel } from '@prisma/client'
import { prisma } from './db'
import { env } from './env'

let transporter: nodemailer.Transporter | null = null
function mailer(): nodemailer.Transporter | null {
  if (!env.mail.host) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.port === 465,
      auth: env.mail.user ? { user: env.mail.user, pass: env.mail.pass } : undefined,
    })
  }
  return transporter
}

async function record(
  event: string,
  channel: NotificationChannel,
  to: string | undefined,
  subject: string | undefined,
  body: string,
  status: 'SENT' | 'FAILED' | 'PENDING',
  bookingId?: string,
  error?: string,
) {
  await prisma.notification
    .create({
      data: {
        event,
        channel,
        toAddress: to,
        subject,
        body,
        status,
        bookingId,
        error,
        sentAt: status === 'SENT' ? new Date() : null,
      },
    })
    .catch(() => {})
}

export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
  event?: string
  bookingId?: string
}): Promise<void> {
  const m = mailer()
  if (!m) {
    // Dev fallback: log instead of send.
    console.info(`\n[email→${opts.to}] ${opts.subject}\n${opts.html.replace(/<[^>]+>/g, ' ').slice(0, 400)}\n`)
    await record(opts.event ?? 'email', 'EMAIL', opts.to, opts.subject, opts.html, 'PENDING', opts.bookingId)
    return
  }
  try {
    await m.sendMail({ from: env.mail.from, to: opts.to, subject: opts.subject, html: opts.html })
    await record(opts.event ?? 'email', 'EMAIL', opts.to, opts.subject, opts.html, 'SENT', opts.bookingId)
  } catch (e) {
    await record(opts.event ?? 'email', 'EMAIL', opts.to, opts.subject, opts.html, 'FAILED', opts.bookingId, String(e))
  }
}

export async function sendTelegram(text: string, event = 'telegram', bookingId?: string): Promise<void> {
  const { botToken, adminChatId } = env.telegram
  if (!botToken || !adminChatId) {
    console.info(`\n[telegram] ${text.slice(0, 300)}\n`)
    await record(event, 'TELEGRAM', adminChatId, undefined, text, 'PENDING', bookingId)
    return
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: adminChatId, text, parse_mode: 'HTML' }),
    })
    await record(event, 'TELEGRAM', adminChatId, undefined, text, res.ok ? 'SENT' : 'FAILED', bookingId)
  } catch (e) {
    await record(event, 'TELEGRAM', adminChatId, undefined, text, 'FAILED', bookingId, String(e))
  }
}

/** Fan-out on a new booking: notify admin (email + telegram) and confirm to client. */
export async function notifyNewBooking(input: {
  bookingId: string
  number: string
  clientName: string
  clientEmail: string
  carName: string
  period: string
  total: string
}): Promise<void> {
  const adminHtml = `
    <h2>Новая заявка ${input.number}</h2>
    <p><b>Клиент:</b> ${input.clientName} (${input.clientEmail})</p>
    <p><b>Автомобиль:</b> ${input.carName}</p>
    <p><b>Период:</b> ${input.period}</p>
    <p><b>Сумма:</b> ${input.total}</p>
    <p><a href="${env.appUrl}/admin?tab=bookings">Открыть в админ-панели →</a></p>`
  const clientHtml = `
    <h2>Заявка принята — ${input.number}</h2>
    <p>Спасибо! Мы получили вашу заявку на аренду <b>${input.carName}</b> (${input.period}).</p>
    <p>Итоговая сумма: <b>${input.total}</b>. Администратор свяжется с вами в ближайшее время для подтверждения.</p>
    <p>— AVENTA · Премиум-аренда авто</p>`

  await Promise.all([
    sendEmail({ to: env.mail.adminEmail, subject: `Новая заявка ${input.number}`, html: adminHtml, event: 'booking.new.admin', bookingId: input.bookingId }),
    sendEmail({ to: input.clientEmail, subject: `AVENTA — заявка ${input.number} принята`, html: clientHtml, event: 'booking.new.client', bookingId: input.bookingId }),
    sendTelegram(
      `🚗 <b>Новая заявка ${input.number}</b>\n${input.clientName}\n${input.carName}\n${input.period}\n${input.total}`,
      'booking.new.admin',
      input.bookingId,
    ),
  ])
}
