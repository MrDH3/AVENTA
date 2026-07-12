'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Logo from './Logo'
import LanguageDropdown from './LanguageDropdown'
import { useDict } from '../i18n/lang'
import { useAuth } from './AuthProvider'
import { logoutAction } from '../server/auth-actions'
import { useIsMobile } from './useIsMobile'

const dict = {
  ru: { cars: 'Автомобили', about: 'О нас', contact: 'Контакты', cta: 'Выбрать авто', account: 'Кабинет', login: 'Войти', logout: 'Выйти', nav: 'Навигация', menu: 'Меню', close: 'Закрыть', language: 'Язык' },
  en: { cars: 'Cars', about: 'About', contact: 'Contact', cta: 'Choose a car', account: 'Account', login: 'Sign in', logout: 'Sign out', nav: 'Navigation', menu: 'Menu', close: 'Close', language: 'Language' },
  tr: { cars: 'Araçlar', about: 'Hakkımızda', contact: 'İletişim', cta: 'Araç seçin', account: 'Hesap', login: 'Giriş yap', logout: 'Çıkış yap', nav: 'Gezinme', menu: 'Menü', close: 'Kapat', language: 'Dil' },
  es: { cars: 'Coches', about: 'Nosotros', contact: 'Contacto', cta: 'Elegir un coche', account: 'Cuenta', login: 'Iniciar sesión', logout: 'Cerrar sesión', nav: 'Navegación', menu: 'Menú', close: 'Cerrar', language: 'Idioma' },
  de: { cars: 'Fahrzeuge', about: 'Über uns', contact: 'Kontakt', cta: 'Fahrzeug wählen', account: 'Konto', login: 'Anmelden', logout: 'Abmelden', nav: 'Navigation', menu: 'Menü', close: 'Schließen', language: 'Sprache' },
}

/** Top client navigation bar. Transparent background — sits over hero or sky band. */
export default function ClientNav({ glass = true }: { glass?: boolean }) {
  const t = useDict(dict)
  const user = useAuth()
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false) // desktop avatar dropdown
  const menuRef = useRef<HTMLDivElement>(null)
  const initial = (user?.firstName?.[0] || user?.email?.[0] || 'A').toUpperCase()

  // Close the avatar dropdown on an outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [menuOpen])

  // Smooth-scroll to a landing section when it's on the current page;
  // otherwise let the /#id link navigate to the landing and jump there.
  const onSectionClick = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof document === 'undefined') return
    const el = document.getElementById(id)
    if (!el) return
    e.preventDefault()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    history.replaceState(null, '', `/#${id}`)
  }

  const anchor = (id: string, label: string) => (
    <Link
      href={`/#${id}`}
      onClick={(e) => { onSectionClick(id)(e); setOpen(false) }}
      style={{ color: 'var(--av-text)', opacity: 0.92, paddingBottom: 2, borderBottom: '2px solid transparent', cursor: 'pointer' }}
    >
      {label}
    </Link>
  )

  // "Cars" → the standalone /catalog page for signed-in users (whose "/" redirects to their profile,
  // so a "/#fleet" anchor would bounce). Logged-out visitors keep the one-page scroll to #fleet.
  const carsNavLink = user ? (
    <Link href="/catalog" onClick={() => setOpen(false)} style={{ color: 'var(--av-text)', opacity: 0.92, paddingBottom: 2, borderBottom: '2px solid transparent', cursor: 'pointer' }}>
      {t.cars}
    </Link>
  ) : (
    anchor('fleet', t.cars)
  )

  // ---- Mobile: logo + lang + hamburger; links/auth/CTA live in a drawer ----
  if (isMobile) {
    return (
      <div
        style={{
          position: 'relative',
          maxWidth: 'var(--container)',
          margin: '0 auto',
          padding: '14px var(--pad-x)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <Logo size={36} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            aria-label={open ? t.close : t.menu}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="av-tap"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              background: glass ? 'rgba(255,255,255,.7)' : '#fff',
              border: '1px solid var(--av-hair-strong)',
              borderRadius: 12,
              color: 'var(--av-teal)',
              cursor: 'pointer',
              backdropFilter: glass ? 'blur(6px)' : undefined,
            }}
          >
            {open ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            )}
          </button>
        </div>

        {open && (
          <nav
            aria-label={t.nav}
            style={{
              position: 'absolute',
              left: 'var(--pad-x)',
              right: 'var(--pad-x)',
              top: 'calc(100% + 6px)',
              zIndex: 60,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: 12,
              background: '#fff',
              border: '1px solid var(--av-hair-strong)',
              borderRadius: 16,
              boxShadow: '0 20px 44px -18px rgba(11,85,96,.5)',
              font: '600 16px var(--f-ui)',
            }}
          >
            <div className="av-tap" style={{ display: 'flex', alignItems: 'center' }}>{carsNavLink}</div>
            <Link href="/about" onClick={() => setOpen(false)} className="av-tap" style={{ display: 'flex', alignItems: 'center', color: 'var(--av-text)' }}>
              {t.about}
            </Link>
            <Link href="/contact" onClick={() => setOpen(false)} className="av-tap" style={{ display: 'flex', alignItems: 'center', color: 'var(--av-text)' }}>
              {t.contact}
            </Link>

            <div style={{ height: 1, background: 'var(--av-hair)', margin: '6px 0' }} />

            {/* Language — dropdown (flag + name), scales past two languages */}
            <div style={{ font: '700 11px var(--f-ui)', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--av-muted)', padding: '2px 6px 4px' }}>
              {t.language}
            </div>
            <LanguageDropdown variant="drawer" onSelect={() => setOpen(false)} />

            <div style={{ height: 1, background: 'var(--av-hair)', margin: '6px 0' }} />

            {user ? (
              <>
                <Link
                  href="/account"
                  title={t.account}
                  onClick={() => setOpen(false)}
                  className="av-tap"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
                >
                  <span
                    style={{
                      width: 34,
                      height: 34,
                      flex: '0 0 auto',
                      borderRadius: '50%',
                      background: user.image ? `center/cover url(${user.image})` : 'var(--grad-coral)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      font: '700 13px var(--f-ui)',
                      border: '2px solid rgba(255,255,255,.7)',
                      boxShadow: '0 4px 12px -4px rgba(11,85,96,.4)',
                    }}
                  >
                    {!user.image && initial}
                  </span>
                  <span style={{ font: '700 15px var(--f-ui)', color: 'var(--av-text)' }}>
                    {user.firstName || t.account}
                  </span>
                </Link>
                <form action={logoutAction} style={{ display: 'flex' }}>
                  <button
                    type="submit"
                    className="av-tap"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'transparent',
                      border: '1px solid var(--av-hair)',
                      color: 'var(--av-muted)',
                      borderRadius: 12,
                      font: '700 14px var(--f-ui)',
                      cursor: 'pointer',
                    }}
                  >
                    {t.logout}
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/auth"
                onClick={() => setOpen(false)}
                className="av-tap"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '11px 18px',
                  background: '#fff',
                  border: '1px solid var(--av-hair-strong)',
                  color: 'var(--av-teal)',
                  borderRadius: 12,
                  font: '700 15px var(--f-ui)',
                }}
              >
                {t.login}
              </Link>
            )}

            <Link
              href="/catalog"
              className="av-cta av-tap"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '13px 22px',
                background: 'var(--grad-coral)',
                color: '#fff',
                borderRadius: 12,
                font: '700 15px var(--f-ui)',
                boxShadow: '0 10px 24px -8px rgba(255,111,97,.7)',
              }}
            >
              {t.cta}
            </Link>
          </nav>
        )}
      </div>
    )
  }

  // ---- Desktop / tablet ----
  return (
    <div
      style={{
        maxWidth: 'var(--container)',
        margin: '0 auto',
        padding: '20px var(--pad-x)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <Logo size={40} />
      <nav aria-label={t.nav} style={{ display: 'flex', alignItems: 'center', gap: 24, font: '600 14px var(--f-ui)', flexWrap: 'wrap' }}>
        {carsNavLink}
        <Link href="/about" style={{ color: 'var(--av-text)', opacity: 0.92, paddingBottom: 2, borderBottom: '2px solid transparent' }}>
          {t.about}
        </Link>
        <Link href="/contact" style={{ color: 'var(--av-text)', opacity: 0.92, paddingBottom: 2, borderBottom: '2px solid transparent' }}>
          {t.contact}
        </Link>
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <LanguageDropdown variant="bar" glass={glass} />

        {user ? (
          /* avatar → dropdown menu (account link + log out) */
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={t.account}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: user.image ? `center/cover url(${user.image})` : 'var(--grad-coral)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  font: '700 13px var(--f-ui)',
                  border: '2px solid rgba(255,255,255,.7)',
                  boxShadow: '0 4px 12px -4px rgba(11,85,96,.4)',
                }}
              >
                {!user.image && initial}
              </span>
              <span style={{ font: '700 13px var(--f-ui)', color: 'var(--av-text)' }}>
                {user.firstName || t.account}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--av-muted)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform .15s ease', transform: menuOpen ? 'rotate(180deg)' : 'none' }}><path d="M6 9l6 6 6-6" /></svg>
            </button>

            {menuOpen && (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 10px)',
                  zIndex: 60,
                  minWidth: 200,
                  background: '#fff',
                  border: '1px solid var(--av-hair-strong)',
                  borderRadius: 14,
                  boxShadow: '0 22px 46px -18px rgba(11,85,96,.5)',
                  padding: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <div style={{ padding: '6px 10px 8px' }}>
                  <div style={{ font: '700 13px var(--f-ui)', color: 'var(--av-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.firstName || t.account}</div>
                  <div style={{ font: '500 11px var(--f-ui)', color: 'var(--av-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                </div>
                <div style={{ height: 1, background: 'var(--av-hair)', margin: '2px 0' }} />
                <Link
                  href="/account"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 10px', borderRadius: 9, font: '700 13px var(--f-ui)', color: 'var(--av-text)', textDecoration: 'none' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--av-teal)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.2" /><path d="M5 20a7 7 0 0114 0" /></svg>
                  {t.account}
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    role="menuitem"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '10px 10px', borderRadius: 9, background: 'transparent', border: 'none', font: '700 13px var(--f-ui)', color: '#C6392B', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C6392B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>
                    {t.logout}
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/auth"
            style={{
              padding: '10px 18px',
              background: glass ? 'rgba(255,255,255,.7)' : '#fff',
              border: '1px solid var(--av-hair-strong)',
              color: 'var(--av-teal)',
              borderRadius: 999,
              font: '700 13px var(--f-ui)',
              backdropFilter: glass ? 'blur(6px)' : undefined,
            }}
          >
            {t.login}
          </Link>
        )}

        <Link
          href="/catalog"
          className="av-cta"
          style={{
            padding: '11px 22px',
            background: 'var(--grad-coral)',
            color: '#fff',
            borderRadius: 999,
            font: '700 13px var(--f-ui)',
            boxShadow: '0 10px 24px -8px rgba(255,111,97,.7)',
          }}
        >
          {t.cta}
        </Link>
      </div>
    </div>
  )
}
