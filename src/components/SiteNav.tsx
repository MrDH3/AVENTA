'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useDict } from '../i18n/lang'
import LanguageDropdown from './LanguageDropdown'
import { Ic, I } from './RdKit'

/**
 * SiteNav — the marketing/storefront navigation bar, matching the landing page's
 * SOLID nav exactly (coral "A" mark, the same section links, Sign in + Choose a car).
 * Self-contained (own tokens + labels scoped to `.snav`) so it renders identically on
 * any page, including the `.rdb` booking flow where the landing's `.rd`-scoped nav
 * styles aren't available. Meant to sit inside a sticky wrapper (e.g. `.av-sticky-header`).
 * Links target the landing sections (`/#fleet`, …) so they work from any page.
 */
const dict = {
  ru: { cars: 'Автомобили', how: 'Как это работает', why: 'Почему Aventa', about: 'О нас', reviews: 'Отзывы', signIn: 'Войти', choose: 'Выбрать авто', menu: 'Меню' },
  en: { cars: 'Cars', how: 'How it works', why: 'Why Aventa', about: 'About', reviews: 'Reviews', signIn: 'Sign in', choose: 'Choose a car', menu: 'Menu' },
  tr: { cars: 'Araçlar', how: 'Nasıl çalışır', why: 'Neden Aventa', about: 'Hakkımızda', reviews: 'Yorumlar', signIn: 'Giriş', choose: 'Araç seç', menu: 'Menü' },
  es: { cars: 'Coches', how: 'Cómo funciona', why: 'Por qué Aventa', about: 'Nosotros', reviews: 'Opiniones', signIn: 'Entrar', choose: 'Elegir coche', menu: 'Menú' },
  de: { cars: 'Autos', how: 'So funktioniert’s', why: 'Warum Aventa', about: 'Über uns', reviews: 'Bewertungen', signIn: 'Anmelden', choose: 'Auto wählen', menu: 'Menü' },
}

const SNAV_CSS = `
.snav{--sn-accent:#fb6d4c;--sn-accent-strong:#ef5c3a;--sn-ink:#0a2225;--sn-line:rgba(10,34,37,.10);--sn-bg:#eef6f5;--sn-fd:'Space Grotesk',system-ui,sans-serif;--sn-fu:'Manrope',system-ui,sans-serif}
.snav-nav{background:rgba(255,255,255,.86);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--sn-line);box-shadow:0 8px 30px -18px rgba(6,33,38,.45)}
.snav-in{max-width:1240px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;gap:20px}
.snav-logo{display:flex;align-items:center;gap:11px;color:var(--sn-ink);text-decoration:none}
.snav-mark{width:36px;height:36px;border-radius:11px;background:var(--sn-accent);color:#fff;display:grid;place-items:center;font:700 20px var(--sn-fd)}
.snav-logo b{font:700 21px var(--sn-fd);letter-spacing:.16em}
.snav-links{display:flex;gap:26px;margin-left:8px}
.snav-links a{font:600 15px var(--sn-fu);color:var(--sn-ink);text-decoration:none}
.snav-links a:hover{opacity:.6}
.snav-right{margin-left:auto;display:flex;align-items:center;gap:12px}
.snav-lang{display:inline-flex}
.snav-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;font:700 14px var(--sn-fu);border-radius:11px;padding:10px 16px;text-decoration:none;transition:transform .16s,box-shadow .2s,background .16s,color .16s}
.snav-ghost{background:transparent;color:var(--sn-ink);border:1.5px solid var(--sn-line)}
.snav-ghost:hover{background:rgba(10,34,37,.04)}
.snav-coral{background:var(--sn-accent);color:#fff;box-shadow:0 14px 30px -12px var(--sn-accent)}
.snav-coral:hover{background:var(--sn-accent-strong);transform:translateY(-2px)}
.snav-burger{display:none;width:44px;height:44px;border-radius:11px;border:1.5px solid var(--sn-line);background:transparent;color:var(--sn-ink);align-items:center;justify-content:center;cursor:pointer}
.snav-menu{margin:0 24px 10px;background:#fff;border-radius:18px;box-shadow:0 20px 50px -24px rgba(6,33,38,.5);padding:12px;display:flex;flex-direction:column;gap:4px}
.snav-menu a{padding:12px 14px;font:600 15px var(--sn-fu);color:var(--sn-ink);border-radius:10px;text-decoration:none}
.snav-menu a:hover{background:var(--sn-bg)}
.snav-menu .snav-btn{margin-top:6px}
.snav-menu-lang{padding:6px 6px 8px}
@media(max-width:900px){.snav-links,.snav-right .snav-btn,.snav-lang{display:none}.snav-burger{display:inline-flex}}
`

export default function SiteNav() {
  const t = useDict(dict)
  const [open, setOpen] = useState(false)
  // Close the mobile menu when tapping/clicking anywhere outside the nav.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      const nav = document.querySelector('.snav')
      if (nav && !nav.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown) }
  }, [open])
  const links: [string, string][] = [
    ['/#fleet', t.cars],
    ['/#how', t.how],
    ['/#why', t.why],
    ['/#about', t.about],
    ['/#reviews', t.reviews],
  ]
  return (
    <div className="snav">
      <style dangerouslySetInnerHTML={{ __html: SNAV_CSS }} />
      <header className="snav-nav">
        <div className="snav-in">
          <Link href="/" className="snav-logo"><span className="snav-mark">A</span><b>AVENTA</b></Link>
          <nav className="snav-links">{links.map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}</nav>
          <div className="snav-right">
            <span className="snav-lang"><LanguageDropdown variant="bar" /></span>
            <Link href="/auth" className="snav-btn snav-ghost">{t.signIn}</Link>
            <Link href="/catalog" className="snav-btn snav-coral">{t.choose}<Ic d={I.arrow} s={16} c="#fff" /></Link>
            <button className="snav-burger" aria-label={t.menu} onClick={() => setOpen((v) => !v)}><Ic d={I.menu} s={22} /></button>
          </div>
        </div>
        {open && (
          <div className="snav-menu">
            <div className="snav-menu-lang"><LanguageDropdown variant="bar" /></div>
            {links.map(([h, l]) => <Link key={h} href={h} onClick={() => setOpen(false)}>{l}</Link>)}
            <Link href="/auth" onClick={() => setOpen(false)}>{t.signIn}</Link>
            <Link href="/catalog" className="snav-btn snav-coral" onClick={() => setOpen(false)}>{t.choose}</Link>
          </div>
        )}
      </header>
    </div>
  )
}
