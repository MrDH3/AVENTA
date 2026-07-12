'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { LogoMark } from './Logo'
import { useIsMobile } from '@/components/useIsMobile'
import { logoutAction } from '@/server/auth-actions'
import { useDict, type Dict } from '../i18n/lang'

export type AdminNavKey =
  | 'dashboard'
  | 'bookings'
  | 'board'
  | 'cars'
  | 'calendar'
  | 'clients'
  | 'verifications'
  | 'payments'
  | 'finance'
  | 'services'
  | 'notifications'
  | 'settings'
  | 'team'

interface Strings {
  // nav item labels (keyed to AdminNavKey)
  navDashboard: string
  navBookings: string
  navBoard: string
  navCars: string
  navCalendar: string
  navClients: string
  navVerifications: string
  navPayments: string
  navFinance: string
  navServices: string
  navNotifications: string
  navSettings: string
  navTeam: string
  // sidebar section label
  sectionManagement: string
  // profile card + menu
  logout: string
  roleAdmin: string
  officeLine: string
  // top bar
  openMenu: string
  searchPlaceholder: string
}

const dict: Dict<Strings> = {
  ru: {
    navDashboard: 'Дашборд',
    navBookings: 'Бронирования',
    navBoard: 'Доска',
    navCars: 'Автомобили',
    navCalendar: 'Календарь',
    navClients: 'Клиенты',
    navVerifications: 'Проверки',
    navPayments: 'Оплаты',
    navFinance: 'Финансы',
    navServices: 'Услуги',
    navNotifications: 'Уведомления',
    navSettings: 'Настройки',
    navTeam: 'Команда',
    sectionManagement: 'УПРАВЛЕНИЕ',
    logout: 'Выйти',
    roleAdmin: 'Администратор',
    officeLine: 'Анталия · офис',
    openMenu: 'Открыть меню',
    searchPlaceholder: 'Поиск…',
  },
  en: {
    navDashboard: 'Dashboard',
    navBookings: 'Bookings',
    navBoard: 'Board',
    navCars: 'Cars',
    navCalendar: 'Calendar',
    navClients: 'Clients',
    navVerifications: 'Verifications',
    navPayments: 'Payments',
    navFinance: 'Finance',
    navServices: 'Services',
    navNotifications: 'Notifications',
    navSettings: 'Settings',
    navTeam: 'Team',
    sectionManagement: 'MANAGEMENT',
    logout: 'Log out',
    roleAdmin: 'Administrator',
    officeLine: 'Antalya · office',
    openMenu: 'Open menu',
    searchPlaceholder: 'Search…',
  },
  tr: {
    navDashboard: 'Panel',
    navBookings: 'Rezervasyonlar',
    navBoard: 'Pano',
    navCars: 'Araçlar',
    navCalendar: 'Takvim',
    navClients: 'Müşteriler',
    navVerifications: 'Doğrulamalar',
    navPayments: 'Ödemeler',
    navFinance: 'Finans',
    navServices: 'Hizmetler',
    navNotifications: 'Bildirimler',
    navSettings: 'Ayarlar',
    navTeam: 'Ekip',
    sectionManagement: 'YÖNETİM',
    logout: 'Çıkış',
    roleAdmin: 'Yönetici',
    officeLine: 'Antalya · ofis',
    openMenu: 'Menüyü aç',
    searchPlaceholder: 'Ara…',
  },
  es: {
    navDashboard: 'Panel',
    navBookings: 'Reservas',
    navBoard: 'Tablero',
    navCars: 'Coches',
    navCalendar: 'Calendario',
    navClients: 'Clientes',
    navVerifications: 'Verificaciones',
    navPayments: 'Pagos',
    navFinance: 'Finanzas',
    navServices: 'Servicios',
    navNotifications: 'Notificaciones',
    navSettings: 'Ajustes',
    navTeam: 'Equipo',
    sectionManagement: 'GESTIÓN',
    logout: 'Cerrar sesión',
    roleAdmin: 'Administrador',
    officeLine: 'Antalya · oficina',
    openMenu: 'Abrir menú',
    searchPlaceholder: 'Buscar…',
  },
  de: {
    navDashboard: 'Dashboard',
    navBookings: 'Buchungen',
    navBoard: 'Board',
    navCars: 'Fahrzeuge',
    navCalendar: 'Kalender',
    navClients: 'Kunden',
    navVerifications: 'Prüfungen',
    navPayments: 'Zahlungen',
    navFinance: 'Finanzen',
    navServices: 'Leistungen',
    navNotifications: 'Benachrichtigungen',
    navSettings: 'Einstellungen',
    navTeam: 'Team',
    sectionManagement: 'VERWALTUNG',
    logout: 'Abmelden',
    roleAdmin: 'Administrator',
    officeLine: 'Antalya · Büro',
    openMenu: 'Menü öffnen',
    searchPlaceholder: 'Suchen…',
  },
}

const icon = (key: AdminNavKey) => {
  const p = {
    width: 17,
    height: 17,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (key) {
    case 'team':
      return (
        <svg {...p}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'dashboard':
      return (
        <svg {...p}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      )
    case 'bookings':
      return (
        <svg {...p}>
          <path d="M4 4h16v12H14l-2 3-2-3H4z" />
          <path d="M8 9h8M8 12h5" />
        </svg>
      )
    case 'board':
      return (
        <svg {...p}>
          <rect x="3" y="4" width="5" height="16" rx="1.5" />
          <rect x="10" y="4" width="5" height="11" rx="1.5" />
          <rect x="17" y="4" width="4" height="7" rx="1.5" />
        </svg>
      )
    case 'cars':
      return (
        <svg {...p}>
          <path d="M5 13l1.6-4.6A2 2 0 018.5 7h7a2 2 0 011.9 1.4L19 13v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H8v1a1 1 0 01-1 1H6a1 1 0 01-1-1z" />
          <circle cx="8" cy="16" r="0.7" />
          <circle cx="16" cy="16" r="0.7" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...p}>
          <rect x="4" y="5" width="16" height="16" rx="2" />
          <path d="M4 9h16M8 3v4M16 3v4" />
        </svg>
      )
    case 'clients':
      return (
        <svg {...p}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20a6 6 0 0112 0" />
          <path d="M16 6a3 3 0 010 6M21 20a5.5 5.5 0 00-4-5.3" />
        </svg>
      )
    case 'verifications':
      return (
        <svg {...p}>
          <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      )
    case 'payments':
      return (
        <svg {...p}>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18M7 15h3" />
        </svg>
      )
    case 'finance':
      return (
        <svg {...p}>
          <path d="M3 20V10M8.5 20V4M14 20v-7M19.5 20V8" />
        </svg>
      )
    case 'services':
      return (
        <svg {...p}>
          <path d="M12 3l2 5 5 .4-3.8 3.3 1.2 4.9L12 14l-4.6 2.6 1.2-4.9L5 8.4 10 8z" />
        </svg>
      )
    case 'notifications':
      return (
        <svg {...p}>
          <path d="M6 9a6 6 0 1112 0c0 5 2 6 2 7H4c0-1 2-2 2-7z" />
          <path d="M10 21a2 2 0 004 0" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
        </svg>
      )
  }
}

interface NavDef {
  key: AdminNavKey
  to: string
  badge?: string
}

const NAV: NavDef[] = [
  { key: 'dashboard', to: '/crm' },
  { key: 'bookings', to: '/admin?tab=bookings', badge: '4' },
  { key: 'board', to: '/admin/board' },
  { key: 'cars', to: '/admin?tab=cars' },
  { key: 'calendar', to: '/calendar' },
  { key: 'clients', to: '/admin?tab=clients' },
  { key: 'verifications', to: '/admin/verifications' },
  { key: 'payments', to: '/admin?tab=payments' },
  { key: 'finance', to: '/admin/finance' },
  { key: 'services', to: '/admin?tab=services' },
  { key: 'notifications', to: '/notifications' },
  { key: 'settings', to: '/admin?tab=settings' },
]

/**
 * Dark "deep-sea" application shell for internal tools (Admin, CRM, Calendar,
 * Notifications). RU-first, fixed working width. `active` highlights the nav item.
 */
export default function AdminShell({
  active,
  title,
  subtitle,
  children,
  headerExtra,
  isOwner = false,
}: {
  active: AdminNavKey
  title: string
  subtitle?: string
  children: ReactNode
  headerExtra?: ReactNode
  isOwner?: boolean
}) {
  const isMobile = useIsMobile()
  const t = useDict(dict)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false) // profile-card dropdown (log out)
  const profileRef = useRef<HTMLDivElement>(null)

  // Close the drawer whenever we leave mobile so it can't stay stuck open.
  useEffect(() => {
    if (!isMobile) setDrawerOpen(false)
  }, [isMobile])

  // Close the profile menu on an outside click or Escape.
  useEffect(() => {
    if (!profileMenuOpen) return
    const onDoc = (e: MouseEvent) => { if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileMenuOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setProfileMenuOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [profileMenuOpen])

  const closeDrawer = () => setDrawerOpen(false)

  // Localized nav labels, keyed to the stable AdminNavKey (the NAV list is language-agnostic).
  const navLabel: Record<AdminNavKey, string> = {
    dashboard: t.navDashboard,
    bookings: t.navBookings,
    board: t.navBoard,
    cars: t.navCars,
    calendar: t.navCalendar,
    clients: t.navClients,
    verifications: t.navVerifications,
    payments: t.navPayments,
    finance: t.navFinance,
    services: t.navServices,
    notifications: t.navNotifications,
    settings: t.navSettings,
    team: t.navTeam,
  }

  // Sidebar inner content, shared between the desktop rail and the mobile drawer.
  const sidebarInner = (
    <>
      <Link
        href="/"
        onClick={closeDrawer}
        style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px 22px' }}
      >
        <svg width="29" height="29" viewBox="0 0 48 48" fill="none">
          <rect x="2.5" y="2.5" width="43" height="43" rx="13" fill="#082A33" stroke="#FF7A5C" strokeWidth="1.5" />
          <path d="M14 35 L24 12 L34 35" stroke="#FFB48A" strokeWidth="3.1" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18.6 27.2 H29.4" stroke="#FFB48A" strokeWidth="3.1" strokeLinecap="round" />
          <circle cx="24" cy="12" r="2.4" fill="#FFB48A" />
        </svg>
        <div style={{ font: "600 21px var(--f-display)", letterSpacing: '.2em', color: 'var(--d-text)' }}>
          AVENTA
        </div>
      </Link>
      <div
        style={{
          font: "400 10px var(--f-mono)",
          letterSpacing: '.16em',
          color: '#5b6f8a',
          padding: '0 10px 10px',
        }}
      >
        {t.sectionManagement}
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 5 : 3 }}>
        {(isOwner ? [...NAV, { key: 'team' as const, to: '/admin/team' }] : NAV).map((n) => {
          const on = n.key === active
          return (
            <Link
              key={n.key}
              href={n.to}
              onClick={closeDrawer}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                minHeight: isMobile ? 44 : undefined,
                padding: isMobile ? '12px 14px' : '11px 12px',
                borderRadius: 11,
                font: "600 13px var(--f-ui)",
                color: on ? '#082A33' : 'var(--d-muted)',
                background: on ? 'var(--d-accent)' : 'transparent',
                transition: 'background .15s ease, color .15s ease',
              }}
            >
              {icon(n.key)}
              {navLabel[n.key]}
              {n.badge && (
                <span
                  style={{
                    marginLeft: 'auto',
                    font: "700 10px var(--f-ui)",
                    background: on ? '#082A33' : 'var(--d-accent)',
                    color: on ? 'var(--d-accent-light)' : '#082A33',
                    borderRadius: 999,
                    padding: '2px 7px',
                  }}
                >
                  {n.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
      <div ref={profileRef} style={{ marginTop: 'auto', position: 'relative' }}>
        {/* profile menu — pops up above the card (sidebar sits at the bottom) */}
        {profileMenuOpen && (
          <div
            role="menu"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 'calc(100% + 8px)',
              zIndex: 5,
              background: 'var(--d-card)',
              border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 12,
              boxShadow: '0 20px 44px -18px rgba(0,0,0,.6)',
              padding: 6,
            }}
          >
            <form action={logoutAction}>
              <button
                type="submit"
                role="menuitem"
                className="av-tap"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 9,
                  color: '#FF9B85',
                  font: "600 13px var(--f-ui)",
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>
                {t.logout}
              </button>
            </form>
          </div>
        )}
        <button
          type="button"
          onClick={() => setProfileMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={profileMenuOpen}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            padding: 12,
            borderRadius: 12,
            background: 'rgba(255,255,255,.04)',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              flexShrink: 0,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#FFB48A,#FF7A5C)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#082A33',
              font: "700 13px var(--f-ui)",
            }}
          >
            A
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ font: "600 12px var(--f-ui)", color: 'var(--d-text)' }}>{t.roleAdmin}</div>
            <div style={{ font: "400 11px var(--f-ui)", color: 'var(--d-muted-2)' }}>{t.officeLine}</div>
          </div>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--d-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', flexShrink: 0, transition: 'transform .15s ease', transform: profileMenuOpen ? 'rotate(180deg)' : 'none' }}><path d="M6 9l6 6 6-6" /></svg>
        </button>
      </div>
    </>
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        fontFamily: 'var(--f-ui)',
        background: 'var(--d-base)',
        color: 'var(--d-text)',
      }}
    >
      {/* Desktop sidebar rail — hidden on mobile (replaced by top-bar hamburger + drawer). */}
      {!isMobile && (
        <aside
          style={{
            width: 228,
            flexShrink: 0,
            background: 'var(--d-deep)',
            borderRight: '1px solid rgba(255,255,255,.06)',
            display: 'flex',
            flexDirection: 'column',
            padding: '22px 16px',
            position: 'sticky',
            top: 0,
            height: '100vh',
          }}
        >
          {sidebarInner}
        </aside>
      )}

      {/* Mobile drawer: dimmed backdrop (tap to close) + slide-in nav panel. */}
      {isMobile && drawerOpen && (
        <>
          <div
            onClick={closeDrawer}
            aria-hidden
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(4,15,20,.6)',
              zIndex: 70,
            }}
          />
          <aside
            className="av-drawer"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 'min(280px, 84vw)',
              maxWidth: '100%',
              background: 'var(--d-deep)',
              borderRight: '1px solid rgba(255,255,255,.06)',
              display: 'flex',
              flexDirection: 'column',
              padding: '18px 14px calc(18px + env(safe-area-inset-bottom, 0px))',
              zIndex: 71,
              overflowY: 'auto',
            }}
          >
            {sidebarInner}
          </aside>
        </>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile top bar — hamburger opens the nav drawer. */}
        {isMobile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderBottom: '1px solid rgba(255,255,255,.06)',
              background: 'var(--d-deep)',
            }}
          >
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={t.openMenu}
              aria-expanded={drawerOpen}
              className="av-tap"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: 10,
                background: 'var(--d-card)',
                border: '1px solid rgba(255,255,255,.08)',
                color: 'var(--d-text)',
                cursor: 'pointer',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                <rect x="2.5" y="2.5" width="43" height="43" rx="13" fill="#082A33" stroke="#FF7A5C" strokeWidth="1.5" />
                <path d="M14 35 L24 12 L34 35" stroke="#FFB48A" strokeWidth="3.1" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.6 27.2 H29.4" stroke="#FFB48A" strokeWidth="3.1" strokeLinecap="round" />
                <circle cx="24" cy="12" r="2.4" fill="#FFB48A" />
              </svg>
              <div style={{ font: "600 17px var(--f-display)", letterSpacing: '.2em', color: 'var(--d-text)' }}>
                AVENTA
              </div>
            </Link>
          </div>
        )}
        <header
          style={{
            display: 'flex',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between',
            gap: isMobile ? 12 : 16,
            padding: isMobile ? '14px 16px' : '18px 32px',
            borderBottom: '1px solid rgba(255,255,255,.06)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                font: `600 ${isMobile ? 'clamp(19px, 6vw, 23px)' : '23px'} var(--f-display)`,
                color: 'var(--d-text-bright)',
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div style={{ marginTop: 2, font: "400 12px var(--f-ui)", color: 'var(--d-muted)' }}>
                {subtitle}
              </div>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 10 : 12,
              flexWrap: 'wrap',
              width: isMobile ? '100%' : undefined,
            }}
          >
            {headerExtra}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--d-card)',
                border: '1px solid rgba(255,255,255,.08)',
                borderRadius: 10,
                padding: isMobile ? '11px 14px' : '9px 14px',
                width: isMobile ? '100%' : 240,
                flex: isMobile ? '1 1 160px' : undefined,
                minWidth: 0,
                maxWidth: isMobile ? '100%' : '40vw',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7E92AE" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <span style={{ font: "400 13px var(--f-ui)", color: '#6f86a3' }}>{t.searchPlaceholder}</span>
            </div>
            <span
              style={{
                width: isMobile ? 44 : 38,
                height: isMobile ? 44 : 38,
                flexShrink: 0,
                borderRadius: 10,
                background: 'var(--d-card)',
                border: '1px solid rgba(255,255,255,.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--d-muted)',
                position: 'relative',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9a6 6 0 1112 0c0 5 2 6 2 7H4c0-1 2-2 2-7z" />
                <path d="M10 21a2 2 0 004 0" />
              </svg>
              <span style={{ position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: '50%', background: 'var(--d-amber)' }} />
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 12 : 8,
                minHeight: isMobile ? 44 : undefined,
                font: "600 12px var(--f-ui)",
              }}
            >
              <span style={{ color: 'var(--d-accent)' }}>RU</span>
              <span style={{ color: '#5b6f8a' }}>EN</span>
            </div>
          </div>
        </header>
        <div
          className="av-dark-scroll"
          style={{ flex: 1, minWidth: 0, padding: isMobile ? '16px 14px 40px' : '24px 32px 48px' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
