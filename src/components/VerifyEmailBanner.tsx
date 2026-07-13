'use client'

import { useState, useTransition, type CSSProperties } from 'react'
import { useDict, type Dict } from '@/i18n/lang'
import { resendVerificationEmailAction } from '@/server/account-actions'

interface Strings {
  title: string
  body: (email: string) => string
  resend: string
  sending: string
  sent: string
  failed: string
}

const dict: Dict<Strings> = {
  en: {
    title: 'Confirm your email address',
    body: (e) => `We sent a confirmation link to ${e}. Confirm it to secure your account.`,
    resend: 'Resend email',
    sending: 'Sending…',
    sent: 'Sent — check your inbox',
    failed: 'Could not send — try again later',
  },
  ru: {
    title: 'Подтвердите ваш email',
    body: (e) => `Мы отправили ссылку для подтверждения на ${e}. Подтвердите адрес, чтобы защитить аккаунт.`,
    resend: 'Отправить письмо снова',
    sending: 'Отправляем…',
    sent: 'Отправлено — проверьте почту',
    failed: 'Не удалось отправить — попробуйте позже',
  },
  tr: {
    title: 'E-posta adresinizi onaylayın',
    body: (e) => `${e} adresine bir onay bağlantısı gönderdik. Hesabınızı güvence altına almak için onaylayın.`,
    resend: 'E-postayı tekrar gönder',
    sending: 'Gönderiliyor…',
    sent: 'Gönderildi — gelen kutunuzu kontrol edin',
    failed: 'Gönderilemedi — daha sonra tekrar deneyin',
  },
  es: {
    title: 'Confirma tu correo electrónico',
    body: (e) => `Enviamos un enlace de confirmación a ${e}. Confírmalo para proteger tu cuenta.`,
    resend: 'Reenviar correo',
    sending: 'Enviando…',
    sent: 'Enviado — revisa tu bandeja',
    failed: 'No se pudo enviar — inténtalo más tarde',
  },
  de: {
    title: 'Bestätige deine E-Mail-Adresse',
    body: (e) => `Wir haben einen Bestätigungslink an ${e} gesendet. Bestätige ihn, um dein Konto zu sichern.`,
    resend: 'E-Mail erneut senden',
    sending: 'Senden…',
    sent: 'Gesendet — sieh in deinem Postfach nach',
    failed: 'Senden fehlgeschlagen — später erneut versuchen',
  },
}

const wrap: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  padding: '12px 16px',
  borderRadius: 12,
  background: '#FEF6E7',
  border: '1px solid #F2C879',
  color: '#7A4E00',
  font: '500 13.5px var(--f-ui, system-ui, sans-serif)',
}

/**
 * Top-of-cabinet nag shown to a signed-in client whose email isn't confirmed yet. The server only
 * renders it while unverified, so it disappears the moment the address is confirmed. "Resend" re-issues
 * the confirmation link (rate-limited server-side).
 */
export default function VerifyEmailBanner({ email }: { email: string }) {
  const t = useDict(dict)
  const [pending, start] = useTransition()
  const [state, setState] = useState<'idle' | 'sent' | 'failed'>('idle')

  const resend = () =>
    start(async () => {
      const r = await resendVerificationEmailAction()
      setState(r.ok ? 'sent' : 'failed')
    })

  const btnLabel = pending ? t.sending : state === 'sent' ? t.sent : state === 'failed' ? t.failed : t.resend

  return (
    <div role="status" style={wrap}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D9880B" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M4 4h16v16H4z" opacity="0" />
        <path d="M22 6l-10 7L2 6" />
        <rect x="2" y="4" width="20" height="16" rx="2" />
      </svg>
      <div style={{ flex: '1 1 260px', minWidth: 0, lineHeight: 1.4 }}>
        <strong style={{ font: '700 13.5px var(--f-ui, system-ui, sans-serif)', display: 'block' }}>{t.title}</strong>
        <span style={{ color: '#8A6524', wordBreak: 'break-word' }}>{t.body(email)}</span>
      </div>
      <button
        type="button"
        onClick={resend}
        disabled={pending || state === 'sent'}
        style={{
          flexShrink: 0,
          padding: '9px 15px',
          borderRadius: 9,
          border: 'none',
          background: state === 'sent' ? '#1E9E62' : '#D9880B',
          color: '#fff',
          font: '700 12.5px var(--f-ui, system-ui, sans-serif)',
          cursor: pending || state === 'sent' ? 'default' : 'pointer',
          opacity: pending ? 0.75 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        {btnLabel}
      </button>
    </div>
  )
}
