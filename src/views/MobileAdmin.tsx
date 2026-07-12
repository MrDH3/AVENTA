'use client'

import type { CSSProperties, ReactNode } from 'react'
import PhoneFrame from '../components/PhoneFrame'
import { useDict, type Dict } from '../i18n/lang'

/* ============================================================================
 * AVENTA — Mobile Admin & CRM showcase (RU-only, NOT wrapped in AdminShell)
 * Port of AVENTA-16-Mobile-Admin.dc.html. Three dark iPhone screens:
 * заявки · карточка заявки · CRM дашборд — rendered in <PhoneFrame dark/>.
 * ========================================================================== */

/* ----------------------------------------------------------------------------
 * i18n — every user-facing string, authored in Russian, translated to en/tr/es/de.
 * Module-level data arrays are builders that take `t` and are called inside the
 * components (never call the hook at module scope). Brand/model, currency, airport
 * and provider codes (AVENTA, Mercedes-Benz, AYT, USDT, WhatsApp, iPhone) stay verbatim.
 * -------------------------------------------------------------------------- */
interface Strings {
  // bottom tab bar
  tabDashboard: string
  tabRequests: string
  tabCalendar: string
  tabMore: string
  // bookings list
  bookingsTitle: string
  filterAll: string
  filterNew: string
  filterActive: string
  clientName: string
  b1Car: string
  b1Note: string
  b1Status: string
  b2Car: string
  b2Note: string
  b2Status: string
  b3Car: string
  b3Note: string
  b3Status: string
  // booking detail
  statusHeading: string
  detailStatus: string
  confirmBtn: string
  cancelBtn: string
  clientInitials: string
  clientLocation: string
  callBtn: string
  carTrip: string
  payRentServices: string
  payPrepay: string
  payBalanceDeposit: string
  docsHeading: string
  doc1: string
  doc2: string
  doc3: string
  // dashboard
  dashTitle: string
  dashMonth: string
  statIncome: string
  statUtil: string
  statUtilSub: string
  statAvg: string
  statReturns: string
  parkStatus: string
  parkInRent: string
  parkFree: string
  donutCars: string
  eventsHeading: string
  event1: string
  event2: string
  // showcase page
  screenBookings: string
  screenDetail: string
  screenDashboard: string
  pageTitle: string
  pageDesc: string
  tagRequests: string
  tagRequestCard: string
  tagDashboard: string
}

const dict: Dict<Strings> = {
  ru: {
    tabDashboard: 'Дашборд',
    tabRequests: 'Заявки',
    tabCalendar: 'Календарь',
    tabMore: 'Ещё',
    bookingsTitle: 'Заявки',
    filterAll: 'Все · 24',
    filterNew: 'Новые · 2',
    filterActive: 'Активные',
    clientName: 'Иван Петров',
    b1Car: 'Mercedes-Benz E 200 · 10–15 авг',
    b1Note: 'предоплата €210',
    b1Status: 'Ожидает',
    b2Car: 'BMW 520i · 05–18 авг',
    b2Note: 'оплачено',
    b2Status: 'Активна',
    b3Car: 'Range Rover Velar · 12–19 авг',
    b3Note: 'частично',
    b3Status: 'Подтв.',
    statusHeading: 'СТАТУС',
    detailStatus: 'Ожидает подтверждения',
    confirmBtn: 'Подтвердить',
    cancelBtn: 'Отмена',
    clientInitials: 'ИП',
    clientLocation: 'Россия · +90 555 123 45 67',
    callBtn: 'Позвонить',
    carTrip: '10–15 авг · AYT → AYT',
    payRentServices: 'Аренда + услуги',
    payPrepay: 'Предоплата',
    payBalanceDeposit: 'Остаток / залог',
    docsHeading: 'ДОКУМЕНТЫ',
    doc1: 'Паспорт ✓',
    doc2: 'ВУ ✓',
    doc3: 'ВУ обр. ⚠',
    dashTitle: 'Дашборд',
    dashMonth: 'Август 2026',
    statIncome: 'ДОХОД ЗА МЕСЯЦ',
    statUtil: 'ЗАГРУЗКА',
    statUtilSub: '3 в аренде',
    statAvg: 'СРЕДНИЙ ЧЕК',
    statReturns: 'ВОЗВРАТЫ СЕГОДНЯ',
    parkStatus: 'Статус парка',
    parkInRent: 'В аренде',
    parkFree: 'Свободно',
    donutCars: 'авто',
    eventsHeading: 'СОБЫТИЯ СЕГОДНЯ',
    event1: 'Возврат · Audi A6',
    event2: 'Выдача · Mercedes E 200',
    screenBookings: 'Админ · заявки',
    screenDetail: 'Админ · карточка заявки',
    screenDashboard: 'CRM · дашборд',
    pageTitle: 'Мобильная админка и CRM',
    pageDesc: 'Менеджер на ходу — заявки, карточка заявки и дашборд бизнеса прямо в кармане. Подтверждайте брони, проверяйте документы, звоните клиенту и следите за загрузкой парка с iPhone.',
    tagRequests: 'Заявки',
    tagRequestCard: 'Карточка заявки',
    tagDashboard: 'Дашборд бизнеса',
  },
  en: {
    tabDashboard: 'Dashboard',
    tabRequests: 'Requests',
    tabCalendar: 'Calendar',
    tabMore: 'More',
    bookingsTitle: 'Requests',
    filterAll: 'All · 24',
    filterNew: 'New · 2',
    filterActive: 'Active',
    clientName: 'Ivan Petrov',
    b1Car: 'Mercedes-Benz E 200 · 10–15 Aug',
    b1Note: 'prepaid €210',
    b1Status: 'Pending',
    b2Car: 'BMW 520i · 05–18 Aug',
    b2Note: 'paid',
    b2Status: 'Active',
    b3Car: 'Range Rover Velar · 12–19 Aug',
    b3Note: 'partial',
    b3Status: 'Conf.',
    statusHeading: 'STATUS',
    detailStatus: 'Awaiting confirmation',
    confirmBtn: 'Confirm',
    cancelBtn: 'Cancel',
    clientInitials: 'IP',
    clientLocation: 'Russia · +90 555 123 45 67',
    callBtn: 'Call',
    carTrip: '10–15 Aug · AYT → AYT',
    payRentServices: 'Rental + services',
    payPrepay: 'Prepayment',
    payBalanceDeposit: 'Balance / deposit',
    docsHeading: 'DOCUMENTS',
    doc1: 'Passport ✓',
    doc2: 'DL ✓',
    doc3: 'DL back ⚠',
    dashTitle: 'Dashboard',
    dashMonth: 'August 2026',
    statIncome: 'MONTHLY INCOME',
    statUtil: 'UTILIZATION',
    statUtilSub: '3 rented',
    statAvg: 'AVERAGE TICKET',
    statReturns: 'RETURNS TODAY',
    parkStatus: 'Fleet status',
    parkInRent: 'Rented',
    parkFree: 'Available',
    donutCars: 'cars',
    eventsHeading: 'TODAY’S EVENTS',
    event1: 'Return · Audi A6',
    event2: 'Handover · Mercedes E 200',
    screenBookings: 'Admin · requests',
    screenDetail: 'Admin · request card',
    screenDashboard: 'CRM · dashboard',
    pageTitle: 'Mobile admin & CRM',
    pageDesc: 'A manager on the go — requests, the request card and the business dashboard right in your pocket. Confirm bookings, check documents, call the customer and track fleet utilization from your iPhone.',
    tagRequests: 'Requests',
    tagRequestCard: 'Request card',
    tagDashboard: 'Business dashboard',
  },
  tr: {
    tabDashboard: 'Panel',
    tabRequests: 'Talepler',
    tabCalendar: 'Takvim',
    tabMore: 'Daha',
    bookingsTitle: 'Talepler',
    filterAll: 'Tümü · 24',
    filterNew: 'Yeni · 2',
    filterActive: 'Aktif',
    clientName: 'Ivan Petrov',
    b1Car: 'Mercedes-Benz E 200 · 10–15 Ağu',
    b1Note: 'ön ödeme €210',
    b1Status: 'Bekliyor',
    b2Car: 'BMW 520i · 05–18 Ağu',
    b2Note: 'ödendi',
    b2Status: 'Aktif',
    b3Car: 'Range Rover Velar · 12–19 Ağu',
    b3Note: 'kısmi',
    b3Status: 'Onaylı',
    statusHeading: 'DURUM',
    detailStatus: 'Onay bekliyor',
    confirmBtn: 'Onayla',
    cancelBtn: 'İptal',
    clientInitials: 'IP',
    clientLocation: 'Rusya · +90 555 123 45 67',
    callBtn: 'Ara',
    carTrip: '10–15 Ağu · AYT → AYT',
    payRentServices: 'Kiralama + hizmetler',
    payPrepay: 'Ön ödeme',
    payBalanceDeposit: 'Kalan / depozito',
    docsHeading: 'BELGELER',
    doc1: 'Pasaport ✓',
    doc2: 'Ehliyet ✓',
    doc3: 'Ehliyet ark. ⚠',
    dashTitle: 'Panel',
    dashMonth: 'Ağustos 2026',
    statIncome: 'AYLIK GELİR',
    statUtil: 'DOLULUK',
    statUtilSub: '3 kirada',
    statAvg: 'ORTALAMA TUTAR',
    statReturns: 'BUGÜN İADELER',
    parkStatus: 'Filo durumu',
    parkInRent: 'Kirada',
    parkFree: 'Müsait',
    donutCars: 'araç',
    eventsHeading: 'BUGÜNKÜ ETKİNLİKLER',
    event1: 'İade · Audi A6',
    event2: 'Teslim · Mercedes E 200',
    screenBookings: 'Yönetici · talepler',
    screenDetail: 'Yönetici · talep kartı',
    screenDashboard: 'CRM · panel',
    pageTitle: 'Mobil yönetim ve CRM',
    pageDesc: 'Hareket halindeki yönetici — talepler, talep kartı ve iş panosu cebinizde. Rezervasyonları onaylayın, belgeleri kontrol edin, müşteriyi arayın ve filo doluluğunu iPhone’unuzdan takip edin.',
    tagRequests: 'Talepler',
    tagRequestCard: 'Talep kartı',
    tagDashboard: 'İş panosu',
  },
  es: {
    tabDashboard: 'Panel',
    tabRequests: 'Solicitudes',
    tabCalendar: 'Calendario',
    tabMore: 'Más',
    bookingsTitle: 'Solicitudes',
    filterAll: 'Todas · 24',
    filterNew: 'Nuevas · 2',
    filterActive: 'Activas',
    clientName: 'Ivan Petrov',
    b1Car: 'Mercedes-Benz E 200 · 10–15 ago',
    b1Note: 'anticipo €210',
    b1Status: 'Pendiente',
    b2Car: 'BMW 520i · 05–18 ago',
    b2Note: 'pagado',
    b2Status: 'Activa',
    b3Car: 'Range Rover Velar · 12–19 ago',
    b3Note: 'parcial',
    b3Status: 'Confir.',
    statusHeading: 'ESTADO',
    detailStatus: 'Esperando confirmación',
    confirmBtn: 'Confirmar',
    cancelBtn: 'Cancelar',
    clientInitials: 'IP',
    clientLocation: 'Rusia · +90 555 123 45 67',
    callBtn: 'Llamar',
    carTrip: '10–15 ago · AYT → AYT',
    payRentServices: 'Alquiler + servicios',
    payPrepay: 'Anticipo',
    payBalanceDeposit: 'Saldo / depósito',
    docsHeading: 'DOCUMENTOS',
    doc1: 'Pasaporte ✓',
    doc2: 'Carnet ✓',
    doc3: 'Carnet rev. ⚠',
    dashTitle: 'Panel',
    dashMonth: 'Agosto 2026',
    statIncome: 'INGRESOS DEL MES',
    statUtil: 'OCUPACIÓN',
    statUtilSub: '3 alquilados',
    statAvg: 'TICKET MEDIO',
    statReturns: 'DEVOLUCIONES HOY',
    parkStatus: 'Estado de la flota',
    parkInRent: 'Alquilados',
    parkFree: 'Disponibles',
    donutCars: 'autos',
    eventsHeading: 'EVENTOS DE HOY',
    event1: 'Devolución · Audi A6',
    event2: 'Entrega · Mercedes E 200',
    screenBookings: 'Admin · solicitudes',
    screenDetail: 'Admin · ficha de solicitud',
    screenDashboard: 'CRM · panel',
    pageTitle: 'Panel de administración móvil y CRM',
    pageDesc: 'Un gestor sobre la marcha: solicitudes, ficha de solicitud y panel del negocio en el bolsillo. Confirme reservas, revise documentos, llame al cliente y controle la ocupación de la flota desde el iPhone.',
    tagRequests: 'Solicitudes',
    tagRequestCard: 'Ficha de solicitud',
    tagDashboard: 'Panel del negocio',
  },
  de: {
    tabDashboard: 'Dashboard',
    tabRequests: 'Anfragen',
    tabCalendar: 'Kalender',
    tabMore: 'Mehr',
    bookingsTitle: 'Anfragen',
    filterAll: 'Alle · 24',
    filterNew: 'Neue · 2',
    filterActive: 'Aktive',
    clientName: 'Ivan Petrov',
    b1Car: 'Mercedes-Benz E 200 · 10–15 Aug',
    b1Note: 'Anzahlung €210',
    b1Status: 'Ausstehend',
    b2Car: 'BMW 520i · 05–18 Aug',
    b2Note: 'bezahlt',
    b2Status: 'Aktiv',
    b3Car: 'Range Rover Velar · 12–19 Aug',
    b3Note: 'teilweise',
    b3Status: 'Best.',
    statusHeading: 'STATUS',
    detailStatus: 'Wartet auf Bestätigung',
    confirmBtn: 'Bestätigen',
    cancelBtn: 'Abbrechen',
    clientInitials: 'IP',
    clientLocation: 'Russland · +90 555 123 45 67',
    callBtn: 'Anrufen',
    carTrip: '10–15 Aug · AYT → AYT',
    payRentServices: 'Miete + Leistungen',
    payPrepay: 'Anzahlung',
    payBalanceDeposit: 'Restbetrag / Kaution',
    docsHeading: 'DOKUMENTE',
    doc1: 'Reisepass ✓',
    doc2: 'FS ✓',
    doc3: 'FS Rücks. ⚠',
    dashTitle: 'Dashboard',
    dashMonth: 'August 2026',
    statIncome: 'MONATSEINNAHMEN',
    statUtil: 'AUSLASTUNG',
    statUtilSub: '3 vermietet',
    statAvg: 'Ø BESTELLWERT',
    statReturns: 'RÜCKGABEN HEUTE',
    parkStatus: 'Flottenstatus',
    parkInRent: 'Vermietet',
    parkFree: 'Verfügbar',
    donutCars: 'Autos',
    eventsHeading: 'TERMINE HEUTE',
    event1: 'Rückgabe · Audi A6',
    event2: 'Übergabe · Mercedes E 200',
    screenBookings: 'Admin · Anfragen',
    screenDetail: 'Admin · Anfragekarte',
    screenDashboard: 'CRM · Dashboard',
    pageTitle: 'Mobile Verwaltung & CRM',
    pageDesc: 'Ein Manager für unterwegs — Anfragen, Anfragekarte und Business-Dashboard direkt in der Tasche. Bestätigen Sie Buchungen, prüfen Sie Dokumente, rufen Sie Kunden an und behalten Sie die Flottenauslastung vom iPhone aus im Blick.',
    tagRequests: 'Anfragen',
    tagRequestCard: 'Anfragekarte',
    tagDashboard: 'Business-Dashboard',
  },
}

/* ---- shared dark tokens / fonts ---- */
const F_DISPLAY = 'var(--f-display)'
const F_UI = 'var(--f-ui)'
const F_MONO = 'var(--f-mono)'

const SCREEN_PAD = '6px 0 0'
const HAIRLINE = '1px solid rgba(255,255,255,.07)'

/* base screen wrapper: fills the phone, dark base, pins bottom tab bar */
const screen: CSSProperties = {
  minHeight: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--d-base)',
  color: 'var(--d-text)',
  fontFamily: F_UI,
  padding: SCREEN_PAD,
}

/* ----------------------------------------------------------------------------
 * Icons (stroke icons render correctly here because JSX honours camelCase props)
 * -------------------------------------------------------------------------- */
type IconProps = { color?: string; size?: number }

function IconGrid({ color = 'currentColor', size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}
function IconRequests({ color = 'currentColor', size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16v12H14l-2 3-2-3H4z" />
      <path d="M8 9h8M8 12h5" />
    </svg>
  )
}
function IconCalendar({ color = 'currentColor', size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M4 9h16M8 3v4M16 3v4" />
    </svg>
  )
}
function IconMore({ color = 'currentColor', size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="19" cy="12" r="1.4" />
    </svg>
  )
}
function IconBell({ color = '#9CB0CB', size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9a6 6 0 1112 0c0 5 2 6 2 7H4c0-1 2-2 2-7z" />
      <path d="M10 22a2 2 0 004 0" />
    </svg>
  )
}
function IconPhone({ color = '#8FD7AD', size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h3.5l1.5 4-2 1.5a11 11 0 005.5 5.5l1.5-2 4 1.5V19a2 2 0 01-2 2A15 15 0 014 6a2 2 0 011-2z" />
    </svg>
  )
}

/* AVENTA logo mark (mountain "A") used in the bookings header */
function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="2.5" y="2.5" width="43" height="43" rx="13" fill="#0E3A45" stroke="#FF7A5C" strokeWidth={1.5} />
      <path d="M14 35 L24 12 L34 35" stroke="#FFB48A" strokeWidth={3.1} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.6 27.2 H29.4" stroke="#FFB48A" strokeWidth={3.1} strokeLinecap="round" />
      <circle cx="24" cy="12" r="2.4" fill="#FFB48A" />
    </svg>
  )
}

/* ----------------------------------------------------------------------------
 * Bottom tab bar — shared across screens (active key drives highlight colour)
 * -------------------------------------------------------------------------- */
type TabKey = 'dashboard' | 'requests' | 'calendar' | 'more'
const TABS: { key: TabKey; Icon: (p: IconProps) => ReactNode }[] = [
  { key: 'dashboard', Icon: IconGrid },
  { key: 'requests', Icon: IconRequests },
  { key: 'calendar', Icon: IconCalendar },
  { key: 'more', Icon: IconMore },
]

function TabBar({ active }: { active: TabKey }) {
  const t = useDict(dict)
  const labels: Record<TabKey, string> = {
    dashboard: t.tabDashboard,
    requests: t.tabRequests,
    calendar: t.tabCalendar,
    more: t.tabMore,
  }
  return (
    <div
      style={{
        marginTop: 'auto',
        position: 'sticky',
        bottom: 0,
        background: 'var(--d-deep)',
        borderTop: '1px solid rgba(255,255,255,.08)',
        padding: '12px 24px 16px',
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      {TABS.map((tab) => {
        const on = tab.key === active
        const color = on ? 'var(--d-accent-light)' : 'var(--d-muted-2)'
        return (
          <div key={tab.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color }}>
            {tab.Icon({ color, size: 22 })}
            <span style={{ font: `600 9px ${F_UI}` }}>{labels[tab.key]}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ----------------------------------------------------------------------------
 * Status pill — coloured dot + label, tinted background
 * -------------------------------------------------------------------------- */
type StatusTone = 'amber' | 'green' | 'blue'
const STATUS_TONES: Record<StatusTone, { dot: string; text: string; bg: string }> = {
  amber: { dot: '#E0A23E', text: '#ECC481', bg: 'rgba(224,162,62,.14)' },
  green: { dot: '#6FBF8F', text: '#8FD7AD', bg: 'rgba(111,191,143,.14)' },
  blue: { dot: '#4E7FE0', text: '#A6BEF2', bg: 'rgba(78,127,224,.14)' },
}

function StatusPill({ tone, label }: { tone: StatusTone; label: string }) {
  const c = STATUS_TONES[tone]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 9px',
        borderRadius: 999,
        background: c.bg,
        color: c.text,
        font: `600 10px ${F_UI}`,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot }} />
      {label}
    </span>
  )
}

/* ============================================================================
 * SCREEN 1 — Заявки (bookings list)
 * ========================================================================== */
type Booking = {
  id: string
  client: string
  car: string
  total: string
  note: string
  noteTone: 'green' | 'amber'
  status: StatusTone
  statusLabel: string
  flagged?: boolean
}
const bookings = (t: Strings): Booking[] => [
  { id: 'AVN-0042', client: t.clientName, car: t.b1Car, total: '€700', note: t.b1Note, noteTone: 'amber', status: 'amber', statusLabel: t.b1Status, flagged: true },
  { id: 'AVN-0041', client: 'M. Yılmaz', car: t.b2Car, total: '€1 430', note: t.b2Note, noteTone: 'green', status: 'green', statusLabel: t.b2Status },
  { id: 'AVN-0040', client: 'L. Braun', car: t.b3Car, total: '€1 260', note: t.b3Note, noteTone: 'amber', status: 'blue', statusLabel: t.b3Status },
]
const bookingFilters = (t: Strings): { label: string; active: boolean }[] => [
  { label: t.filterAll, active: true },
  { label: t.filterNew, active: false },
  { label: t.filterActive, active: false },
]

function BookingsScreen() {
  const t = useDict(dict)
  const BOOKINGS = bookings(t)
  const BOOKING_FILTERS = bookingFilters(t)
  return (
    <div style={screen}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 18px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <LogoMark size={28} />
          <div style={{ font: `600 19px ${F_DISPLAY}`, color: 'var(--d-text-bright)' }}>{t.bookingsTitle}</div>
        </div>
        <div style={{ position: 'relative' }}>
          <IconBell />
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--d-amber)',
              border: '1.5px solid var(--d-base)',
            }}
          />
        </div>
      </div>

      {/* filter chips */}
      <div style={{ display: 'flex', gap: 8, padding: '0 18px 14px', overflow: 'hidden' }}>
        {BOOKING_FILTERS.map((f) => (
          <span
            key={f.label}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              whiteSpace: 'nowrap',
              background: f.active ? 'var(--d-accent)' : 'var(--d-card)',
              border: f.active ? 'none' : '1px solid rgba(255,255,255,.1)',
              color: f.active ? 'var(--d-base)' : 'var(--d-muted)',
              font: `${f.active ? 600 : 500} 12px ${F_UI}`,
            }}
          >
            {f.label}
          </span>
        ))}
      </div>

      {/* cards */}
      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 11 }}>
        {BOOKINGS.map((b) => (
          <div
            key={b.id}
            style={{
              background: 'var(--d-card)',
              border: b.flagged ? '1px solid rgba(224,162,62,.3)' : HAIRLINE,
              borderRadius: 14,
              padding: 15,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ font: `700 11px ${F_MONO}`, color: 'var(--d-accent-light)' }}>{b.id}</span>
              <StatusPill tone={b.status} label={b.statusLabel} />
            </div>
            <div style={{ marginTop: 10, font: `600 15px ${F_UI}`, color: 'var(--d-text)' }}>{b.client}</div>
            <div style={{ marginTop: 3, font: `400 12px ${F_UI}`, color: 'var(--d-muted)' }}>{b.car}</div>
            <div
              style={{
                marginTop: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: HAIRLINE,
                paddingTop: 10,
              }}
            >
              <span style={{ font: `700 15px ${F_UI}`, color: 'var(--d-text-bright)' }}>{b.total}</span>
              <span style={{ font: `500 11px ${F_UI}`, color: b.noteTone === 'green' ? '#8FD7AD' : '#E7B463' }}>{b.note}</span>
            </div>
          </div>
        ))}
      </div>

      <TabBar active="requests" />
    </div>
  )
}

/* ============================================================================
 * SCREEN 2 — Карточка заявки (booking detail)
 * ========================================================================== */
const payRows = (t: Strings): { label: string; value: string; tone: 'text' | 'green' }[] => [
  { label: t.payRentServices, value: '€700', tone: 'text' },
  { label: t.payPrepay, value: '€210 ✓ USDT', tone: 'green' },
  { label: t.payBalanceDeposit, value: '€490 / €800', tone: 'text' },
]
type DocState = 'ok' | 'warn'
const docList = (t: Strings): { label: string; state: DocState }[] => [
  { label: t.doc1, state: 'ok' },
  { label: t.doc2, state: 'ok' },
  { label: t.doc3, state: 'warn' },
]

function detailCard(extra?: CSSProperties): CSSProperties {
  return {
    marginTop: 14,
    background: 'var(--d-card)',
    border: HAIRLINE,
    borderRadius: 14,
    padding: 16,
    ...extra,
  }
}
const microLabel: CSSProperties = { font: `400 10px ${F_MONO}`, letterSpacing: '.12em', color: 'var(--d-muted-2)' }

function BookingDetailScreen() {
  const t = useDict(dict)
  const PAY_ROWS = payRows(t)
  const DOCS = docList(t)
  return (
    <div style={{ ...screen, padding: '6px 0 24px' }}>
      {/* nav row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 18px 14px' }}>
        <span style={{ font: `600 20px ${F_UI}`, color: 'var(--d-muted)' }}>‹</span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ font: `700 13px ${F_MONO}`, color: 'var(--d-accent-light)' }}>AVN-2026-0042</div>
        </div>
        <span style={{ font: `600 16px ${F_UI}`, color: 'var(--d-muted)' }}>⋯</span>
      </div>

      <div style={{ padding: '0 18px' }}>
        {/* status / actions */}
        <div
          style={{
            background: 'linear-gradient(120deg,#125060,#0E3A45)',
            border: '1px solid rgba(224,162,62,.4)',
            borderRadius: 14,
            padding: 16,
          }}
        >
          <div style={microLabel}>{t.statusHeading}</div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ font: `600 16px ${F_UI}`, color: '#E7B463' }}>{t.detailStatus}</span>
            <span style={{ color: 'var(--d-muted)' }}>▾</span>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <span
              style={{
                flex: 1,
                textAlign: 'center',
                padding: 11,
                background: 'linear-gradient(180deg,#FFB48A,#FF7A5C)',
                color: 'var(--d-base)',
                borderRadius: 9,
                font: `700 12px ${F_UI}`,
              }}
            >
              {t.confirmBtn}
            </span>
            <span
              style={{
                padding: '11px 14px',
                border: '1px solid rgba(206,74,74,.4)',
                color: '#E58A8A',
                borderRadius: 9,
                font: `600 12px ${F_UI}`,
              }}
            >
              {t.cancelBtn}
            </span>
          </div>
        </div>

        {/* client */}
        <div style={detailCard()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--d-el)',
                border: '1px solid rgba(255,122,92,.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                font: `600 15px ${F_UI}`,
                color: 'var(--d-accent-light)',
              }}
            >
              {t.clientInitials}
            </div>
            <div>
              <div style={{ font: `600 16px ${F_UI}`, color: 'var(--d-text)' }}>{t.clientName}</div>
              <div style={{ font: `400 11px ${F_UI}`, color: 'var(--d-muted)' }}>{t.clientLocation}</div>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <span
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: 10,
                background: 'var(--d-el)',
                borderRadius: 9,
                font: `600 12px ${F_UI}`,
                color: 'var(--d-text)',
              }}
            >
              <IconPhone />
              {t.callBtn}
            </span>
            <span
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: 10,
                background: 'var(--d-el)',
                borderRadius: 9,
                font: `600 12px ${F_UI}`,
                color: 'var(--d-text)',
              }}
            >
              WhatsApp
            </span>
          </div>
        </div>

        {/* car + money */}
        <div style={detailCard()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 56,
                height: 40,
                borderRadius: 8,
                background: 'repeating-linear-gradient(135deg,#114451 0 8px,#125060 8px 16px)',
              }}
            />
            <div>
              <div style={{ font: `600 14px ${F_UI}`, color: 'var(--d-text)' }}>Mercedes-Benz E 200</div>
              <div style={{ font: `400 11px ${F_UI}`, color: 'var(--d-muted)' }}>{t.carTrip}</div>
            </div>
          </div>
          <div
            style={{
              marginTop: 12,
              borderTop: HAIRLINE,
              paddingTop: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 7,
              font: `500 12px ${F_UI}`,
            }}
          >
            {PAY_ROWS.map((r) => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--d-muted)' }}>{r.label}</span>
                <span style={{ color: r.tone === 'green' ? '#8FD7AD' : 'var(--d-text)' }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* documents */}
        <div style={detailCard()}>
          <div style={{ ...microLabel, marginBottom: 10 }}>{t.docsHeading}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {DOCS.map((d) => {
              const ok = d.state === 'ok'
              return (
                <span
                  key={d.label}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: 8,
                    border: ok ? '1px solid rgba(111,191,143,.4)' : '1px dashed rgba(224,162,62,.5)',
                    background: ok ? 'rgba(111,191,143,.06)' : 'rgba(224,162,62,.06)',
                    borderRadius: 8,
                    font: `600 11px ${F_UI}`,
                    color: ok ? '#8FD7AD' : '#E7B463',
                  }}
                >
                  {d.label}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================================
 * SCREEN 3 — CRM Дашборд (dashboard)
 * ========================================================================== */
type Stat = { label: string; value: string; valueColor: string; sub?: string; subColor?: string; accent?: boolean }
const stats = (t: Strings): Stat[] => [
  { label: t.statIncome, value: '€7 240', valueColor: 'var(--d-text-bright)', sub: '▲ 18%', subColor: '#8FD7AD' },
  { label: t.statUtil, value: '74%', valueColor: 'var(--d-accent-light)', sub: t.statUtilSub, subColor: 'var(--d-muted)', accent: true },
  { label: t.statAvg, value: '€905', valueColor: 'var(--d-text-bright)' },
  { label: t.statReturns, value: '1', valueColor: 'var(--d-text-bright)' },
]
const parkLegend = (t: Strings): { label: string; dot: string; value: string }[] => [
  { label: t.parkInRent, dot: '#6FBF8F', value: '3' },
  { label: t.parkFree, dot: '#E0A23E', value: '2' },
]
const events = (t: Strings): { label: string; time: string; timeColor: string }[] => [
  { label: t.event1, time: '14:00', timeColor: '#E7B463' },
  { label: t.event2, time: '12:00', timeColor: '#8FD7AD' },
]
const statMono: CSSProperties = { font: `400 9px ${F_MONO}`, color: 'var(--d-muted-2)' }

function DashboardScreen() {
  const t = useDict(dict)
  const STATS = stats(t)
  const PARK_LEGEND = parkLegend(t)
  const EVENTS = events(t)
  return (
    <div style={screen}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 18px 14px' }}>
        <div>
          <div style={{ font: `600 20px ${F_DISPLAY}`, color: 'var(--d-text-bright)' }}>{t.dashTitle}</div>
          <div style={{ font: `400 11px ${F_UI}`, color: 'var(--d-muted)' }}>{t.dashMonth}</div>
        </div>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#FFB48A,#FF7A5C)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--d-base)',
            font: `700 13px ${F_UI}`,
          }}
        >
          A
        </div>
      </div>

      <div style={{ padding: '0 18px' }}>
        {/* stat grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
          {STATS.map((s) => (
            <div
              key={s.label}
              style={{
                background: s.accent ? 'linear-gradient(150deg,#125060,#0E3A45)' : 'var(--d-card)',
                border: s.accent ? '1px solid rgba(255,122,92,.3)' : HAIRLINE,
                borderRadius: 14,
                padding: 15,
              }}
            >
              <div style={statMono}>{s.label}</div>
              <div style={{ marginTop: 6, font: `700 22px ${F_UI}`, color: s.valueColor }}>{s.value}</div>
              {s.sub && <div style={{ marginTop: 4, font: `600 11px ${F_UI}`, color: s.subColor }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* park status — donut + legend */}
        <div style={{ marginTop: 14, background: 'var(--d-card)', border: HAIRLINE, borderRadius: 14, padding: 16 }}>
          <div style={{ font: `600 14px ${F_UI}`, color: 'var(--d-text)', marginBottom: 14 }}>{t.parkStatus}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                flexShrink: 0,
                background: 'conic-gradient(#6FBF8F 0 60%,#E0A23E 60% 74%,rgba(255,255,255,.08) 74% 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: '50%',
                  background: 'var(--d-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ font: `700 17px ${F_UI}`, color: 'var(--d-text-bright)' }}>5</div>
                <div style={{ font: `400 8px ${F_MONO}`, color: 'var(--d-muted-2)' }}>{t.donutCars}</div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {PARK_LEGEND.map((p) => (
                <div key={p.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, font: `500 12px ${F_UI}`, color: 'var(--d-text)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: p.dot }} />
                    {p.label}
                  </span>
                  <span style={{ font: `700 13px ${F_UI}`, color: 'var(--d-text-bright)' }}>{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* events today */}
        <div style={{ marginTop: 14, background: 'var(--d-card)', border: HAIRLINE, borderRadius: 14, padding: 16 }}>
          <div style={{ ...microLabel, letterSpacing: '.1em', marginBottom: 12 }}>{t.eventsHeading}</div>
          {EVENTS.map((e, i) => (
            <div
              key={e.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: i < EVENTS.length - 1 ? 10 : 0,
              }}
            >
              <span style={{ font: `500 13px ${F_UI}`, color: 'var(--d-text)' }}>{e.label}</span>
              <span style={{ font: `500 11px ${F_UI}`, color: e.timeColor }}>{e.time}</span>
            </div>
          ))}
        </div>
      </div>

      <TabBar active="dashboard" />
    </div>
  )
}

/* ============================================================================
 * Showcase page
 * ========================================================================== */
export default function MobileAdmin() {
  const t = useDict(dict)
  const screens: { label: string; el: ReactNode }[] = [
    { label: t.screenBookings, el: <BookingsScreen /> },
    { label: t.screenDetail, el: <BookingDetailScreen /> },
    { label: t.screenDashboard, el: <DashboardScreen /> },
  ]
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--d-base)',
        color: 'var(--d-text)',
        fontFamily: F_UI,
        padding: '64px 24px 96px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* intro */}
        <header style={{ maxWidth: 720 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 999,
              background: 'var(--d-card)',
              border: HAIRLINE,
              font: `700 11px ${F_MONO}`,
              letterSpacing: '.14em',
              color: 'var(--d-accent-light)',
            }}
          >
            <LogoMark size={18} />
            AVENTA · MOBILE
          </div>
          <h1 style={{ margin: '18px 0 0', font: `800 38px ${F_DISPLAY}`, letterSpacing: '-0.02em', color: 'var(--d-text-bright)' }}>
            {t.pageTitle}
          </h1>
          <p style={{ margin: '12px 0 0', font: `400 15px ${F_UI}`, lineHeight: 1.6, color: 'var(--d-muted)' }}>
            {t.pageDesc}
          </p>
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[t.tagRequests, t.tagRequestCard, t.tagDashboard, 'iPhone'].map((tag) => (
              <span
                key={tag}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  background: 'var(--d-panel)',
                  border: HAIRLINE,
                  font: `500 12px ${F_UI}`,
                  color: 'var(--d-muted)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        {/* phone frames */}
        <div
          style={{
            marginTop: 48,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 44,
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          {screens.map((s) => (
            <PhoneFrame key={s.label} dark label={s.label} width={320} height={680}>
              {s.el}
            </PhoneFrame>
          ))}
        </div>
      </div>
    </div>
  )
}
