'use client'

import Link from 'next/link'
import { logoutAction } from '@/server/auth-actions'
import { LANGUAGES, useDict, useLang } from '../i18n/lang'

const DICT = {
  en: {
    title: 'Settings',
    account: 'Account',
    language: 'Language',
    manage: 'Manage',
    docs: 'Documents & verification',
    addresses: 'Saved addresses',
    payment: 'Payment methods',
    profileHome: 'Profile home',
    newRental: 'Start a new rental',
    signOut: 'Sign out',
  },
  ru: {
    title: 'Настройки',
    account: 'Аккаунт',
    language: 'Язык',
    manage: 'Управление',
    docs: 'Документы и проверка',
    addresses: 'Сохранённые адреса',
    payment: 'Способы оплаты',
    profileHome: 'Профиль',
    newRental: 'Новая аренда',
    signOut: 'Выйти',
  },
  tr: {
    title: 'Ayarlar',
    account: 'Hesap',
    language: 'Dil',
    manage: 'Yönetim',
    docs: 'Belgeler ve doğrulama',
    addresses: 'Kayıtlı adresler',
    payment: 'Ödeme yöntemleri',
    profileHome: 'Profil ana sayfası',
    newRental: 'Yeni kiralama başlat',
    signOut: 'Çıkış yap',
  },
  es: {
    title: 'Ajustes',
    account: 'Cuenta',
    language: 'Idioma',
    manage: 'Gestión',
    docs: 'Documentos y verificación',
    addresses: 'Direcciones guardadas',
    payment: 'Métodos de pago',
    profileHome: 'Inicio del perfil',
    newRental: 'Iniciar un nuevo alquiler',
    signOut: 'Cerrar sesión',
  },
  de: {
    title: 'Einstellungen',
    account: 'Konto',
    language: 'Sprache',
    manage: 'Verwalten',
    docs: 'Dokumente & Verifizierung',
    addresses: 'Gespeicherte Adressen',
    payment: 'Zahlungsmethoden',
    profileHome: 'Profil-Startseite',
    newRental: 'Neue Anmietung starten',
    signOut: 'Abmelden',
  },
}

const cardStyle: React.CSSProperties = {
  borderRadius: 20,
  background: '#fff',
  border: '1px solid rgba(20,153,174,.14)',
  boxShadow: '0 20px 46px -34px rgba(11,85,96,.5)',
  padding: '18px 18px 20px',
}
const sectionLabel: React.CSSProperties = {
  font: '700 11px var(--f-ui)',
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: 'var(--av-muted)',
}
const rowLink: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: 48,
  padding: '10px 4px',
  font: '600 14px var(--f-ui)',
  color: 'var(--av-text)',
  textDecoration: 'none',
  borderBottom: '1px solid rgba(20,153,174,.08)',
}

export default function SettingsView({ name, email, phone }: { name: string; email: string; phone: string | null }) {
  const t = useDict(DICT)
  const { lang, setLang } = useLang()
  const initials = name.trim().slice(0, 1).toUpperCase() || 'A'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ margin: '2px 0 0', font: '800 24px var(--f-display)', color: 'var(--av-text)' }}>{t.title}</h1>

      {/* Identity */}
      <div style={cardStyle}>
        <div style={sectionLabel}>{t.account}</div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#0e7e90,#14b8c6)', color: '#fff', font: '800 20px var(--f-display)' }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ font: '800 18px var(--f-display)', color: 'var(--av-text)' }}>{name}</div>
            <div style={{ marginTop: 2, font: '500 13px var(--f-ui)', color: 'var(--av-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
            {phone && <div style={{ marginTop: 1, font: '500 13px var(--f-ui)', color: 'var(--av-muted)' }}>{phone}</div>}
          </div>
        </div>
      </div>

      {/* Language */}
      <div style={cardStyle}>
        <div style={sectionLabel}>{t.language}</div>
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {LANGUAGES.map((l) => {
            const active = l.code === lang
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                aria-pressed={active}
                className="av-tap"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7, minHeight: 42, padding: '8px 14px',
                  borderRadius: 999, cursor: 'pointer',
                  border: active ? '1.5px solid var(--av-teal)' : '1.5px solid rgba(20,153,174,.18)',
                  background: active ? 'rgba(20,153,174,.1)' : '#fff',
                  color: active ? 'var(--av-teal)' : 'var(--av-text)',
                  font: '700 13px var(--f-ui)',
                }}
              >
                <span aria-hidden style={{ fontSize: 16 }}>{l.flag}</span>
                {l.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Manage links */}
      <div style={cardStyle}>
        <div style={sectionLabel}>{t.manage}</div>
        <div style={{ marginTop: 6 }}>
          <Link href="/account" className="av-tap" style={rowLink}>
            <span>{t.profileHome}</span><span aria-hidden style={{ color: 'var(--av-teal)' }}>›</span>
          </Link>
          <Link href="/account/documents" className="av-tap" style={rowLink}>
            <span>{t.docs}</span><span aria-hidden style={{ color: 'var(--av-teal)' }}>›</span>
          </Link>
          <Link href="/account/addresses" className="av-tap" style={rowLink}>
            <span>{t.addresses}</span><span aria-hidden style={{ color: 'var(--av-teal)' }}>›</span>
          </Link>
          <Link href="/account/payment-methods" className="av-tap" style={rowLink}>
            <span>{t.payment}</span><span aria-hidden style={{ color: 'var(--av-teal)' }}>›</span>
          </Link>
          <Link href="/catalog" className="av-tap" style={{ ...rowLink, borderBottom: 'none' }}>
            <span>{t.newRental}</span><span aria-hidden style={{ color: 'var(--av-teal)' }}>›</span>
          </Link>
        </div>
      </div>

      {/* Sign out */}
      <form action={logoutAction}>
        <button type="submit" className="av-tap" style={{ width: '100%', minHeight: 48, padding: '13px', borderRadius: 14, border: '1px solid rgba(198,57,43,.28)', background: 'rgba(198,57,43,.05)', color: '#C6392B', font: '700 14px var(--f-ui)', cursor: 'pointer' }}>
          {t.signOut}
        </button>
      </form>
    </div>
  )
}
