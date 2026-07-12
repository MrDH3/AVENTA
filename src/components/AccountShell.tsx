'use client'

import { type ReactNode, type CSSProperties } from 'react'
import Link from 'next/link'
import { useLang, type Lang } from '@/i18n/lang'
import LangToggle from '@/components/LangToggle'
import { logoutAction } from '@/server/auth-actions'

/**
 * Shared authenticated-area shell: the cabinet's dark-green LEFT sidebar (logo → nav → Choose-a-car →
 * profile + sign-out) + a sticky top bar + a content slot. Extracted from the /account cabinet so every
 * account page (contract, documents, payments, …) opens in the SAME chrome instead of the old top navbar.
 * Nav items are real links (not the cabinet's scroll-spy) with an `active` prop. Design tokens/fonts are
 * scoped to `.acs`, matching the cabinet 1:1.
 */

const ACS_FONTS =
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap'

const ACS_CSS = `
.acs{--ink:#0a2225;--muted:#5b7678;--muted-2:#8aa2a3;--bg:#eef6f5;--bg-2:#e7f1ef;--surface:#fff;--line:rgba(10,34,37,.10);--teal:#0d9488;--teal-700:#0f6d68;--teal-bright:#67e3d3;--accent:#fb6d4c;--accent-strong:#ef5c3a;--ok:#0f9d6f;--gold:#f5b400;--f-display:'Space Grotesk',system-ui,sans-serif;--f-ui:'Manrope',system-ui,sans-serif;--f-mono:'JetBrains Mono',ui-monospace,monospace;position:relative;display:flex;min-height:100vh;font-family:var(--f-ui);color:var(--ink);background:var(--bg)}
.acs *{box-sizing:border-box}
.acs a{text-decoration:none;color:inherit}
.acs .acs-navitem{transition:background .22s,color .22s}
.acs .acs-navitem:hover{background:rgba(255,255,255,.08);color:#fff}
.acs .acs-cta{transition:transform .22s,background .22s,box-shadow .22s}
.acs .acs-cta:hover{transform:translateY(-2px);background:var(--accent-strong);box-shadow:0 20px 36px -12px var(--accent-strong)}
.acs .acs-sheen{position:absolute;top:0;bottom:0;left:0;width:55%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.32),transparent);animation:acs-sheen 3.9s ease-in-out infinite;pointer-events:none}
.acs .acs-signout{transition:background .2s,color .2s}
.acs .acs-signout:hover{background:rgba(255,255,255,.14);color:#fff}
.acs .acs-orb{position:absolute;border-radius:50%;pointer-events:none}
.acs .acs-orb1{animation:acs-fl 15s ease-in-out infinite}
.acs .acs-orb2{animation:acs-fls 13s ease-in-out infinite}
@keyframes acs-fl{0%,100%{transform:translate(0,0)}50%{transform:translate(14px,-22px)}}
@keyframes acs-fls{0%,100%{transform:translate(0,0)}50%{transform:translate(-20px,24px)}}
@keyframes acs-sheen{0%{transform:translateX(-130%)}55%,100%{transform:translateX(240%)}}
.acs .acs-side{position:sticky;top:0;align-self:flex-start;flex-shrink:0;width:264px;height:100vh;z-index:99;overflow:hidden}
.acs .acs-hd-d{display:flex;align-items:center;gap:14px}
.acs .acs-hd-m{display:none;align-items:center;gap:12px}
.acs .acs-mback{transition:background .2s}
.acs .acs-mback:active{background:rgba(255,255,255,.2)!important}
@media(max-width:1000px){
  .acs{display:block}
  .acs .acs-side{display:none!important}
  .acs .acs-hd-d{display:none}
  .acs .acs-hd-m{display:flex}
}
@media(prefers-reduced-motion:reduce){.acs .acs-orb1,.acs .acs-orb2,.acs .acs-sheen{animation:none}}
@media print{.acs{display:block!important}.acs .acs-side,.acs .acs-hd-d,.acs .acs-hd-m{display:none!important}.acs .acs-main{padding:0!important}}
`

/** Lucide-style icon (mirrors the cabinet's Ic). */
function Ic({ d, s = 19, c = 'currentColor', sw = 1.8, fill = 'none' }: { d: ReactNode; s?: number; c?: string; sw?: number; fill?: string }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={fill} stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  )
}

const I = {
  grid: (<><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></>),
  cal: (<><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="m9 16 2 2 4-4" /></>),
  file: (<><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></>),
  card: (<><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></>),
  pin: (<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>),
  headset: (<><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></>),
  out: (<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></>),
  arrow: (<><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>),
  star: <polygon points="12 2 15 9 22 9.3 16.5 13.8 18.3 21 12 17 5.7 21 7.5 13.8 2 9.3 9 9" />,
  menu: (<><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="18" y2="18" /></>),
  lock: (<><rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>),
}

export type AccountNavKey = 'overview' | 'bookings' | 'documents' | 'payments' | 'places' | 'support' | 'security'

const NAV: { key: AccountNavKey; href: string; icon: ReactNode }[] = [
  { key: 'overview', href: '/account', icon: I.grid },
  { key: 'bookings', href: '/account#c-bookings', icon: I.cal },
  { key: 'documents', href: '/account/documents', icon: I.file },
  { key: 'payments', href: '/account/payments', icon: I.card },
  { key: 'places', href: '/account#c-places', icon: I.pin },
  { key: 'security', href: '/account/security', icon: I.lock },
  { key: 'support', href: '/account#c-support', icon: I.headset },
]

type ShellStrings = {
  menu: string
  overview: string; bookings: string; documents: string; payments: string; places: string; support: string; security: string
  chooseCar: string; signOut: string; cabinet: string
}
const L10N: Record<Lang, ShellStrings> = {
  en: { menu: 'Menu', overview: 'Overview', bookings: 'My bookings', documents: 'Documents', payments: 'Payments', places: 'Places', support: 'Support', security: 'Password', chooseCar: 'Choose a car', signOut: 'Sign out', cabinet: 'Personal cabinet' },
  ru: { menu: 'Меню', overview: 'Обзор', bookings: 'Мои брони', documents: 'Документы', payments: 'Оплата', places: 'Места', support: 'Поддержка', security: 'Пароль', chooseCar: 'Выбрать авто', signOut: 'Выйти', cabinet: 'Личный кабинет' },
  tr: { menu: 'Menü', overview: 'Genel bakış', bookings: 'Rezervasyonlarım', documents: 'Belgeler', payments: 'Ödemeler', places: 'Yerler', support: 'Destek', security: 'Parola', chooseCar: 'Araç seç', signOut: 'Çıkış', cabinet: 'Kişisel hesap' },
  es: { menu: 'Menú', overview: 'Resumen', bookings: 'Mis reservas', documents: 'Documentos', payments: 'Pagos', places: 'Lugares', support: 'Soporte', security: 'Contraseña', chooseCar: 'Elegir coche', signOut: 'Salir', cabinet: 'Cuenta personal' },
  de: { menu: 'Menü', overview: 'Übersicht', bookings: 'Meine Buchungen', documents: 'Dokumente', payments: 'Zahlungen', places: 'Orte', support: 'Support', security: 'Passwort', chooseCar: 'Auto wählen', signOut: 'Abmelden', cabinet: 'Konto' },
}

export default function AccountShell({
  active,
  user,
  title,
  kicker,
  children,
}: {
  active: AccountNavKey
  user: { fullName: string; initial: string; tierName: string }
  title?: string
  kicker?: string
  children: ReactNode
}) {
  const { lang } = useLang()
  const L = L10N[lang] ?? L10N.en

  const rootStyle = { ['--av-bg' as keyof CSSProperties]: '#eef6f5' } as CSSProperties

  return (
    <div className="acs" style={rootStyle}>
      <link rel="stylesheet" href={ACS_FONTS} />
      <style dangerouslySetInnerHTML={{ __html: ACS_CSS }} />

      {/* ═══════════ SIDEBAR (desktop only) ═══════════ */}
      <aside className="acs-side" style={{ display: 'flex', flexDirection: 'column', padding: '22px 18px', color: '#fff', background: 'linear-gradient(176deg,#0b5457 0%,#083a3e 46%,#052024 100%)' }}>
        <div className="acs-orb acs-orb1" style={{ top: '-6%', right: '-30%', width: 280, height: 280, background: 'radial-gradient(circle,rgba(45,212,191,.34),transparent 62%)', filter: 'blur(28px)' }} />
        <div className="acs-orb acs-orb2" style={{ bottom: '6%', left: '-34%', width: 260, height: 260, background: 'radial-gradient(circle,rgba(251,109,76,.24),transparent 62%)', filter: 'blur(30px)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg,rgba(255,255,255,.04) 0 1.5px,transparent 1.5px 22px)', opacity: 0.6, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 6px 2px' }}>
            <span style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--accent)', display: 'grid', placeItems: 'center', color: '#fff', font: '700 20px var(--f-display)', boxShadow: '0 10px 22px -8px var(--accent)' }}>A</span>
            <span style={{ font: '700 21px var(--f-display)', letterSpacing: '.17em', color: '#fff' }}>AVENTA</span>
          </Link>
          <div style={{ margin: '24px 6px 14px', height: 1, background: 'rgba(255,255,255,.12)' }} />
          <span style={{ padding: '0 8px', font: '600 10px var(--f-mono)', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.42)' }}>{L.menu}</span>
          <nav style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 3, marginTop: 12, paddingLeft: 18 }}>
            {NAV.map((n) => {
              const on = n.key === active
              return (
                <Link
                  key={n.key}
                  href={n.href}
                  className="acs-navitem"
                  style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 12, color: on ? '#fff' : 'rgba(255,255,255,.72)', background: on ? 'rgba(255,255,255,.1)' : 'transparent', fontWeight: 600, fontSize: 14.5 }}
                >
                  {on && <span style={{ position: 'absolute', left: -18, top: 8, bottom: 8, width: 3, borderRadius: 3, background: 'var(--accent)', boxShadow: '0 0 14px var(--accent)' }} />}
                  <Ic d={n.icon} s={19} />
                  <span style={{ flex: 1 }}>{L[n.key]}</span>
                </Link>
              )
            })}
          </nav>
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link href="/catalog" className="acs-cta" style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '13px 16px', borderRadius: 13, background: 'var(--accent)', color: '#fff', font: '700 14.5px var(--f-display)', boxShadow: '0 14px 28px -12px var(--accent)' }}>
              <span className="acs-sheen" /><span style={{ position: 'relative' }}>{L.chooseCar}</span><Ic d={I.arrow} s={16} c="#fff" sw={2.2} />
            </Link>
            <div style={{ height: 1, background: 'rgba(255,255,255,.12)', margin: '2px 6px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '6px 6px' }}>
              <span style={{ position: 'relative', width: 40, height: 40, borderRadius: 13, background: 'linear-gradient(135deg,var(--accent),var(--accent-strong))', display: 'grid', placeItems: 'center', color: '#fff', font: '700 16px var(--f-display)', flexShrink: 0 }}>
                {user.initial}
                <span style={{ position: 'absolute', right: -2, bottom: -2, width: 13, height: 13, borderRadius: '50%', background: 'var(--gold)', border: '2px solid #083a3e' }} />
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ font: '700 14px var(--f-display)', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.fullName}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '10.5px var(--f-mono)', letterSpacing: '.08em', color: 'var(--gold)' }}>
                  <Ic d={I.star} s={11} c="var(--gold)" fill="var(--gold)" sw={0} />{user.tierName.toUpperCase()}
                </span>
              </span>
              <form action={logoutAction} style={{ marginLeft: 'auto', display: 'flex' }}>
                <button type="submit" className="acs-signout" title={L.signOut} style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.6)', background: 'rgba(255,255,255,.06)', border: 'none', cursor: 'pointer' }}>
                  <Ic d={I.out} s={17} c="currentColor" sw={1.9} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══════════ MAIN ═══════════ */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* desktop top bar (light — sidebar owns navigation) */}
        <header className="acs-header acs-hd-d" style={{ position: 'sticky', top: 0, zIndex: 60, padding: '13px 26px', background: 'rgba(238,246,245,.82)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ font: '600 10.5px var(--f-mono)', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>{kicker ?? L.cabinet}</span>
            <span style={{ font: '700 16px var(--f-display)', color: 'var(--ink)', lineHeight: 1.1 }}>{title ?? L[active]}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
            <span style={{ display: 'inline-flex' }}><LangToggle glass={false} /></span>
          </div>
        </header>

        {/* mobile top bar (dark green — matches the mobile cabinet hero; bottom-nav owns tabs) */}
        <header className="acs-header acs-hd-m" style={{ position: 'sticky', top: 0, zIndex: 60, padding: 'calc(env(safe-area-inset-top,0px) + 14px) 16px 14px', background: 'linear-gradient(135deg,#0b5457,#083a3e)', color: '#fff' }}>
          <Link href="/account" className="acs-mback" style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.16)', display: 'grid', placeItems: 'center', color: '#fff', flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: '600 9.5px var(--f-mono)', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(103,227,211,.92)' }}>{kicker ?? L.cabinet}</div>
            <div style={{ font: '700 18px var(--f-display)', color: '#fff', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title ?? L[active]}</div>
          </div>
          <span style={{ display: 'inline-flex' }}><LangToggle glass /></span>
        </header>

        <main className="acs-main" style={{ flex: 1, minWidth: 0 }}>{children}</main>
      </div>
    </div>
  )
}
