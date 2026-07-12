'use client'

import { useState, useTransition, type CSSProperties } from 'react'
import ClientShell from '../components/ClientShell'
import { Container, Kicker } from '../components/ui'
import { useDict } from '../i18n/lang'
import { sendContactMessageAction } from '@/server/contact-actions'

/* ------------------------------------------------------------------ *
 * Contact page — real, usable placeholder details + a working form.
 * Replace the phone/email/WhatsApp/Telegram/address values with the real
 * ones before launch (they are marked below).
 * ------------------------------------------------------------------ */

const dict = {
  ru: {
    kicker: 'КОНТАКТЫ',
    title: 'Свяжитесь с AVENTA',
    lead: 'Ответим на русском, английском и турецком. Поддержка 24/7 в течение всей аренды — звоните, пишите в мессенджеры или заполните форму.',
    reach: 'Способы связи',
    phone: 'Телефон',
    email: 'Email',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    address: 'Адрес',
    addressVal: 'Анталия, Коньяалты, Türkiye · выдача в аэропорту AYT и по адресу',
    hours: 'Часы работы',
    hoursVal: 'Пн–Вс, 09:00–21:00 · поддержка по брони 24/7',
    formTitle: 'Написать нам',
    fName: 'Имя',
    fEmail: 'Email',
    fPhone: 'Телефон (необязательно)',
    fMessage: 'Сообщение',
    send: 'Отправить сообщение',
    sending: 'Отправляем…',
    okTitle: 'Сообщение отправлено!',
    okBody: 'Спасибо за обращение. Мы ответим в ближайшее время.',
    errGeneric: 'Не удалось отправить. Попробуйте позже или напишите нам напрямую.',
    placeholderNote: 'Контактные данные — заглушки, замените реальными перед запуском.',
  },
  en: {
    kicker: 'CONTACT',
    title: 'Get in touch with AVENTA',
    lead: 'We reply in Russian, English and Turkish. 24/7 support throughout your rental — call us, message us, or fill in the form.',
    reach: 'Ways to reach us',
    phone: 'Phone',
    email: 'Email',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    address: 'Address',
    addressVal: 'Antalya, Konyaaltı, Türkiye · pickup at AYT airport & to your address',
    hours: 'Opening hours',
    hoursVal: 'Mon–Sun, 09:00–21:00 · 24/7 support for active rentals',
    formTitle: 'Send us a message',
    fName: 'Name',
    fEmail: 'Email',
    fPhone: 'Phone (optional)',
    fMessage: 'Message',
    send: 'Send message',
    sending: 'Sending…',
    okTitle: 'Message sent!',
    okBody: 'Thanks for reaching out. We’ll get back to you shortly.',
    errGeneric: 'Could not send. Please try again later or contact us directly.',
    placeholderNote: 'Contact details are placeholders — replace with real values before launch.',
  },
  tr: {
    kicker: 'İLETİŞİM',
    title: 'AVENTA ile iletişime geçin',
    lead: 'Rusça, İngilizce ve Türkçe yanıt veriyoruz. Kiralama süreniz boyunca 7/24 destek — bizi arayın, mesaj gönderin veya formu doldurun.',
    reach: 'Bize ulaşma yolları',
    phone: 'Telefon',
    email: 'E-posta',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    address: 'Adres',
    addressVal: 'Antalya, Konyaaltı, Türkiye · AYT havalimanında ve adresinize teslim',
    hours: 'Çalışma saatleri',
    hoursVal: 'Pzt–Paz, 09:00–21:00 · aktif kiralamalar için 7/24 destek',
    formTitle: 'Bize mesaj gönderin',
    fName: 'Ad',
    fEmail: 'E-posta',
    fPhone: 'Telefon (isteğe bağlı)',
    fMessage: 'Mesaj',
    send: 'Mesaj gönder',
    sending: 'Gönderiliyor…',
    okTitle: 'Mesaj gönderildi!',
    okBody: 'Bize ulaştığınız için teşekkürler. En kısa sürede size geri döneceğiz.',
    errGeneric: 'Gönderilemedi. Lütfen daha sonra tekrar deneyin veya bizimle doğrudan iletişime geçin.',
    placeholderNote: 'İletişim bilgileri yer tutucudur — lansmandan önce gerçek bilgilerle değiştirin.',
  },
  es: {
    kicker: 'CONTACTO',
    title: 'Ponte en contacto con AVENTA',
    lead: 'Respondemos en ruso, inglés y turco. Soporte 24/7 durante todo tu alquiler — llámanos, escríbenos o rellena el formulario.',
    reach: 'Formas de contactarnos',
    phone: 'Teléfono',
    email: 'Correo electrónico',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    address: 'Dirección',
    addressVal: 'Antalya, Konyaaltı, Türkiye · recogida en el aeropuerto AYT y en tu dirección',
    hours: 'Horario de atención',
    hoursVal: 'Lun–Dom, 09:00–21:00 · soporte 24/7 para alquileres activos',
    formTitle: 'Envíanos un mensaje',
    fName: 'Nombre',
    fEmail: 'Correo electrónico',
    fPhone: 'Teléfono (opcional)',
    fMessage: 'Mensaje',
    send: 'Enviar mensaje',
    sending: 'Enviando…',
    okTitle: '¡Mensaje enviado!',
    okBody: 'Gracias por escribirnos. Te responderemos en breve.',
    errGeneric: 'No se pudo enviar. Inténtalo de nuevo más tarde o contáctanos directamente.',
    placeholderNote: 'Los datos de contacto son de ejemplo — reemplázalos con los valores reales antes del lanzamiento.',
  },
  de: {
    kicker: 'KONTAKT',
    title: 'Kontaktieren Sie AVENTA',
    lead: 'Wir antworten auf Russisch, Englisch und Türkisch. 24/7-Support während Ihrer gesamten Mietdauer — rufen Sie uns an, schreiben Sie uns oder füllen Sie das Formular aus.',
    reach: 'So erreichen Sie uns',
    phone: 'Telefon',
    email: 'E-Mail',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    address: 'Adresse',
    addressVal: 'Antalya, Konyaaltı, Türkiye · Abholung am Flughafen AYT & an Ihrer Adresse',
    hours: 'Öffnungszeiten',
    hoursVal: 'Mo–So, 09:00–21:00 · 24/7-Support für aktive Mieten',
    formTitle: 'Senden Sie uns eine Nachricht',
    fName: 'Name',
    fEmail: 'E-Mail',
    fPhone: 'Telefon (optional)',
    fMessage: 'Nachricht',
    send: 'Nachricht senden',
    sending: 'Wird gesendet…',
    okTitle: 'Nachricht gesendet!',
    okBody: 'Danke für Ihre Nachricht. Wir melden uns in Kürze bei Ihnen.',
    errGeneric: 'Senden fehlgeschlagen. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns direkt.',
    placeholderNote: 'Die Kontaktdaten sind Platzhalter — vor dem Start durch echte Werte ersetzen.',
  },
}

// ⚠️ PLACEHOLDER contact values — replace with the real ones before launch.
const CONTACT = {
  phone: '+90 555 000 00 00',
  phoneHref: 'tel:+905550000000',
  email: 'hello@aventa-rental.com',
  whatsapp: '+90 555 000 00 00',
  whatsappHref: 'https://wa.me/905550000000',
  telegram: '@aventa',
  telegramHref: 'https://t.me/aventa',
}

const C = {
  ink: '#0C3B45',
  body: '#3F6670',
  muted: '#5E8A92',
  teal: '#0E7E90',
  green: '#27B576',
  coralGrad: 'linear-gradient(180deg,#FF8A5B,#FF6F61)',
  cardShadow: '0 22px 54px -32px rgba(11,85,96,.5)',
} as const

function Icon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0E7E90" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  )
}

const ICONS = {
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z',
  email: 'M4 4h16v16H4z M22 6l-10 7L2 6',
  chat: 'M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.2-5.6A8.4 8.4 0 1 1 21 11.5z',
  send: 'M21 4 3 11l5 2 2 6 3-4 5 4z',
  pin: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2',
}

function DetailRow({ icon, label, value, href }: { icon: string; label: string; value: string; href?: string }) {
  const body = (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <span style={{ width: 38, height: 38, borderRadius: 11, background: '#E0F6F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon d={icon} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ font: '700 10px var(--f-mono)', letterSpacing: '.1em', color: C.muted }}>{label.toUpperCase()}</div>
        <div style={{ marginTop: 3, font: '600 13.5px/1.5 var(--f-ui)', color: href ? C.teal : C.ink, wordBreak: 'break-word' }}>{value}</div>
      </div>
    </div>
  )
  return href ? (
    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" style={{ textDecoration: 'none' }}>
      {body}
    </a>
  ) : (
    body
  )
}

export default function Contact() {
  const t = useDict(dict)
  const [pending, start] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', company: '' })

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = () => {
    setError(null)
    setFieldErrors({})
    start(async () => {
      const r = await sendContactMessageAction(form)
      if (r.ok) {
        setDone(true)
        setForm({ name: '', email: '', phone: '', message: '', company: '' })
      } else if (r.fieldErrors) {
        setFieldErrors(r.fieldErrors)
      } else {
        setError(r.error ?? t.errGeneric)
      }
    })
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 11,
    border: '1.5px solid rgba(20,153,174,.22)',
    background: 'var(--av-field)',
    color: C.ink,
    font: '500 14px var(--f-ui)',
    outline: 'none',
  }
  const labelStyle: CSSProperties = { font: '700 10px var(--f-mono)', letterSpacing: '.1em', color: C.muted, marginBottom: 6, display: 'block' }
  const errStyle: CSSProperties = { marginTop: 5, display: 'block', font: '600 11px var(--f-ui)', color: '#D64545' }

  return (
    <ClientShell>
      <Container pt={28} pb={110} style={{ maxWidth: 1040 }}>
        <Kicker color={C.teal}>{t.kicker}</Kicker>
        <h1 style={{ margin: '10px 0 0', font: '800 clamp(28px,3.8vw,38px) var(--f-display)', color: C.ink, letterSpacing: '-0.01em' }}>
          {t.title}
        </h1>
        <p style={{ margin: '12px 0 0', maxWidth: 560, font: '500 15px/1.65 var(--f-ui)', color: C.muted }}>{t.lead}</p>

        <div style={{ marginTop: 30, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 22, alignItems: 'start' }}>
          {/* details */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 26, boxShadow: C.cardShadow }}>
            <div style={{ font: '700 11px var(--f-mono)', letterSpacing: '.14em', color: C.muted }}>{t.reach.toUpperCase()}</div>
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <DetailRow icon={ICONS.phone} label={t.phone} value={CONTACT.phone} href={CONTACT.phoneHref} />
              <DetailRow icon={ICONS.email} label={t.email} value={CONTACT.email} href={`mailto:${CONTACT.email}`} />
              <DetailRow icon={ICONS.chat} label={t.whatsapp} value={CONTACT.whatsapp} href={CONTACT.whatsappHref} />
              <DetailRow icon={ICONS.send} label={t.telegram} value={CONTACT.telegram} href={CONTACT.telegramHref} />
              <DetailRow icon={ICONS.pin} label={t.address} value={t.addressVal} />
              <DetailRow icon={ICONS.clock} label={t.hours} value={t.hoursVal} />
            </div>
            <div style={{ marginTop: 18, padding: '9px 12px', borderRadius: 10, background: '#FFF4E0', border: '1px solid #F0B45E', font: '600 11px/1.5 var(--f-ui)', color: '#9A5A22' }}>
              ⚠️ {t.placeholderNote}
            </div>
          </div>

          {/* form */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 26, boxShadow: C.cardShadow }}>
            <div style={{ font: '800 18px var(--f-display)', color: C.ink }}>{t.formTitle}</div>
            {done ? (
              <div style={{ marginTop: 20, padding: 22, borderRadius: 14, background: 'var(--av-success-bg)', textAlign: 'center' }}>
                <div style={{ fontSize: 34 }} aria-hidden>✅</div>
                <div style={{ marginTop: 8, font: '800 16px var(--f-display)', color: 'var(--av-success-text)' }}>{t.okTitle}</div>
                <div style={{ marginTop: 6, font: '500 13px/1.6 var(--f-ui)', color: C.body }}>{t.okBody}</div>
              </div>
            ) : (
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label style={{ display: 'block' }}>
                  <span style={labelStyle}>{t.fName.toUpperCase()}</span>
                  <input type="text" value={form.name} onChange={upd('name')} style={inputStyle} />
                  {fieldErrors.name && <span style={errStyle}>{fieldErrors.name}</span>}
                </label>
                <label style={{ display: 'block' }}>
                  <span style={labelStyle}>{t.fEmail.toUpperCase()}</span>
                  <input type="email" value={form.email} onChange={upd('email')} style={inputStyle} />
                  {fieldErrors.email && <span style={errStyle}>{fieldErrors.email}</span>}
                </label>
                <label style={{ display: 'block' }}>
                  <span style={labelStyle}>{t.fPhone.toUpperCase()}</span>
                  <input type="tel" value={form.phone} onChange={upd('phone')} style={inputStyle} />
                  {fieldErrors.phone && <span style={errStyle}>{fieldErrors.phone}</span>}
                </label>
                <label style={{ display: 'block' }}>
                  <span style={labelStyle}>{t.fMessage.toUpperCase()}</span>
                  <textarea value={form.message} onChange={upd('message')} rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
                  {fieldErrors.message && <span style={errStyle}>{fieldErrors.message}</span>}
                </label>
                {/* honeypot — hidden from users, catches bots */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  value={form.company}
                  onChange={upd('company')}
                  style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
                />
                {error && <div style={{ font: '600 12px var(--f-ui)', color: '#D64545' }}>{error}</div>}
                <button
                  type="button"
                  onClick={submit}
                  disabled={pending}
                  className="av-cta"
                  style={{ marginTop: 4, padding: 14, background: C.coralGrad, color: '#fff', border: 'none', borderRadius: 12, font: '700 14px var(--f-ui)', boxShadow: '0 14px 28px -10px rgba(255,111,97,.7)', cursor: pending ? 'wait' : 'pointer', opacity: pending ? 0.7 : 1 }}
                >
                  {pending ? t.sending : t.send}
                </button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </ClientShell>
  )
}
