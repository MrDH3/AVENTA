'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { useIsMobile } from './useIsMobile'
import { useDict } from '@/i18n/lang'

/**
 * Apple-style frosted tab bar, mobile only, for a signed-in customer.
 *
 * Four destinations mirror the customer app: profile home, payments,
 * the active rental, and account settings. Hidden entirely on desktop, for
 * staff, when signed out, and on flows that own the bottom edge (the booking
 * pay-now bar) or aren't part of the customer shell (admin, auth).
 *
 * "Native feel" without native code: `backdrop-filter` for the frosted glass,
 * `env(safe-area-inset-bottom)` to clear the iPhone home indicator, `aria-current`
 * for the active tab (also the styling hook), and a motion accent that a
 * `prefers-reduced-motion` user never sees. An in-flow spacer of the same height
 * keeps page content from hiding behind the fixed bar.
 */

type IconProps = { className?: string }

function HomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.6 12 3l9 7.6" />
      <path d="M5.5 9.4V19a1 1 0 0 0 1 1H10v-5.5h4V20h3.5a1 1 0 0 0 1-1V9.4" />
    </svg>
  )
}
function WalletIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="6" width="18" height="13" rx="2.4" />
      <path d="M3 10.2h18" />
      <path d="M16.5 14.6h1.6" />
    </svg>
  )
}
function CarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.2 12.4 6 7.4A2 2 0 0 1 7.9 6h8.2a2 2 0 0 1 1.9 1.4l1.8 5" />
      <path d="M3.6 12.4h16.8v4.2a1 1 0 0 1-1 1h-1.4a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H4.6a1 1 0 0 1-1-1v-4.2Z" />
      <path d="M7 15h.01M17 15h.01" />
    </svg>
  )
}
function GearIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.2M12 18.8V21M4.2 7.5l1.9 1.1M17.9 15.4l1.9 1.1M4.2 16.5l1.9-1.1M17.9 8.6l1.9-1.1" />
    </svg>
  )
}

const DICT = {
  en: { nav: 'Main navigation', home: 'Home', pay: 'Payments', active: 'My car', settings: 'Settings' },
  ru: { nav: 'Основная навигация', home: 'Профиль', pay: 'Оплата', active: 'Моё авто', settings: 'Настройки' },
  tr: { nav: 'Ana gezinme', home: 'Ana sayfa', pay: 'Ödemeler', active: 'Aracım', settings: 'Ayarlar' },
  es: { nav: 'Navegación principal', home: 'Inicio', pay: 'Pagos', active: 'Mi coche', settings: 'Ajustes' },
  de: { nav: 'Hauptnavigation', home: 'Start', pay: 'Zahlungen', active: 'Mein Auto', settings: 'Einstellungen' },
}

export default function BottomNav() {
  const user = useAuth()
  const isMobile = useIsMobile()
  const pathname = usePathname() || '/'
  const t = useDict(DICT)

  // Customers only, on mobile, on customer-shell pages.
  const isStaff = user?.role === 'ADMIN' || user?.role === 'OWNER'
  // The mobile client cabinet (/account exactly) renders its OWN 5-tab bottom bar, so the global
  // one is suppressed there; /account/* subpages still get it. The full-screen mobile apps —
  // /success (contract), /account/payments, and /catalog (fleet browser) — each own the bottom edge
  // with their own sticky bar (action bar / Pay-all / concierge), so suppress the global bar there.
  const excluded =
    /^\/(admin|auth|booking)(\/|$)/.test(pathname) ||
    pathname === '/account' ||
    pathname === '/success' ||
    pathname === '/account/payments' ||
    pathname === '/catalog'
  if (!user || isStaff || !isMobile || excluded) return null

  const tabs = [
    { href: '/account', label: t.home, icon: <HomeIcon />, match: (p: string) => p === '/account' },
    { href: '/account/payments', label: t.pay, icon: <WalletIcon />, match: (p: string) => p === '/account/payments' || p.startsWith('/account/payments/') },
    { href: '/active', label: t.active, icon: <CarIcon />, match: (p: string) => p === '/active' || p.startsWith('/active/') },
    { href: '/settings', label: t.settings, icon: <GearIcon />, match: (p: string) => p === '/settings' || p.startsWith('/settings/') },
  ]

  return (
    <>
      {/* In-flow spacer so fixed bar never covers page content / footer. */}
      <div aria-hidden="true" style={{ height: 'calc(50px + env(safe-area-inset-bottom, 0px))' }} />
      <nav className="av-tabbar" aria-label={t.nav}>
        {tabs.map((tab) => {
          const active = tab.match(pathname)
          return (
            <Link key={tab.href} href={tab.href} className="av-tabbar__tab" aria-current={active ? 'page' : undefined}>
              <span className="av-tabbar__ico">{tab.icon}</span>
              <span className="av-tabbar__lbl">{tab.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
