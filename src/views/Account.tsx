'use client'

import { useEffect, useState, useMemo, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import LangToggle from '../components/LangToggle'
import ClientFooter from '../components/ClientFooter'
import VerifyEmailBanner from '@/components/VerifyEmailBanner'
import { useIsMobile } from '@/components/useIsMobile'
import { useDict, useLang, type Dict, type Lang } from '../i18n/lang'
import { logoutAction } from '@/server/auth-actions'
import type { DerivedVerification } from '@/lib/verification'
import type {
  AccountUser,
  AccountBooking,
  AccountCar,
  AccountDocument,
} from '@/app/account/page'
import type { OfficeRow } from '@/lib/locations'
import type { SavedPlaceView } from '@/server/map-actions'
import SavedPlaces from '../components/SavedPlaces'

interface Props {
  user: AccountUser
  emailUnverified: boolean
  bookings: AccountBooking[]
  favouriteCar: AccountCar | null
  lastPickupCity: string | null
  tripCount: number
  documents: AccountDocument[]
  hasProfile: boolean
  verification: DerivedVerification
  offices: OfficeRow[]
  savedPlaces: SavedPlaceView[]
  mapProvider: 'osm' | 'google' | 'yandex'
  mapApiKey: string | null
}

type BookingStatus =
  | 'NEW'
  | 'AWAITING_CONFIRMATION'
  | 'AWAITING_PAYMENT'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'DELIVERED'
  | 'ACTIVE'
  | 'RETURNED'
  | 'CLOSED'
  | 'CANCELLED'

interface Strings {
  kicker: string
  welcome: (name: string) => string
  loyalDefault: string
  trips: (n: number) => string
  favCar: string
  freeNow: string
  perDay: string
  bookAgain: string
  dates: string
  pickup: string
  pickupDefault: string
  prefilled: string
  bookAgainCta: string
  history: string
  noBookings: string
  allBookings: string
  details: string
  contract: string
  docs: string
  update: string
  noDocs: string
  verified: string
  underReview: string
  rejected: string
  uploaded: string
  encrypted: string
  addresses: string
  noAddresses: string
  byDefault: string
  payments: string
  noPayments: string
  paymentsSoon: string
  paymentsSoonSub: string
  soon: string
  manage: string
  manager: string
  write: string
  logout: string
  browseAll: string
  browseAllSub: string
  bookNew: string
  ourLocations: string
  ourLocationsSub: string
  rebookKicker: string
  activeRental: string
  nextBooking: string
  inRental: string
  returnsOn: string
  startsOn: string
  open: string
  noActive: string
  noActiveSub: string
  yourDetails: string
  startFirst: string
  firstSub: string
  statusLabels: Record<BookingStatus, string>
  months: string[]
}

const dict: Dict<Strings> = {
  ru: {
    kicker: 'ЛИЧНЫЙ КАБИНЕТ',
    welcome: (name) => `С возвращением, ${name}`,
    loyalDefault: 'Программа лояльности',
    trips: (n) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'поездка' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'поездки' : 'поездок'}`,
    favCar: 'ВАШ ЛЮБИМЫЙ АВТОМОБИЛЬ',
    freeNow: 'свободен',
    perDay: '/сут',
    bookAgain: 'Забронировать снова',
    dates: 'ДАТЫ',
    pickup: 'ПОДАЧА',
    pickupDefault: 'Аэропорт AYT',
    prefilled: 'Данные, документы и оплата заполнены',
    bookAgainCta: 'Забронировать снова · ≈45 сек',
    history: 'История бронирований',
    noBookings: 'У вас пока нет бронирований',
    allBookings: 'Все',
    details: 'Детали',
    contract: 'Договор',
    docs: 'Мои документы',
    update: 'Обновить',
    noDocs: 'Документы ещё не загружены',
    verified: 'проверен',
    underReview: 'на проверке',
    rejected: 'отклонён',
    uploaded: 'загружен',
    encrypted: 'Документы хранятся в зашифрованном виде, доступны только администратору.',
    addresses: 'Сохранённые адреса',
    noAddresses: 'Нет сохранённых адресов',
    byDefault: 'по умолчанию',
    payments: 'Способы оплаты',
    noPayments: 'Нет сохранённых способов оплаты',
    paymentsSoon: 'Сохранённые карты',
    paymentsSoonSub: 'Появятся после подключения онлайн-оплаты картой',
    soon: 'Скоро',
    manage: 'Управлять',
    manager: 'Ваш менеджер',
    write: 'Написать',
    logout: 'Выйти',
    browseAll: 'Все автомобили',
    browseAllSub: 'Весь парк — всегда в один клик',
    bookNew: 'Забронировать авто',
    ourLocations: 'Точки выдачи',
    ourLocationsSub: 'Где можно забрать автомобиль',
    rebookKicker: 'ПОВТОР · ~45 СЕК',
    activeRental: 'Ваша активная аренда',
    nextBooking: 'Ваше следующее бронирование',
    inRental: 'В аренде',
    returnsOn: 'возврат',
    startsOn: 'начало',
    open: 'Открыть',
    noActive: 'Сейчас нет активной аренды',
    noActiveSub: 'Ваша следующая поездка — в каталоге.',
    yourDetails: 'ВАШИ ДАННЫЕ И СПРАВКА',
    startFirst: 'Оформите первую аренду',
    firstSub: 'Выберите авто — остальное займёт пару минут.',
    statusLabels: {
      NEW: 'Новое',
      AWAITING_CONFIRMATION: 'Ожидает подтверждения',
      AWAITING_PAYMENT: 'Ожидает оплаты',
      CONFIRMED: 'Подтверждено',
      PREPARING: 'Готовится',
      DELIVERED: 'Передан',
      ACTIVE: 'В аренде',
      RETURNED: 'Возвращён',
      CLOSED: 'Завершено',
      CANCELLED: 'Отменено',
    },
    months: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  },
  en: {
    kicker: 'PERSONAL CABINET',
    welcome: (name) => `Welcome back, ${name}`,
    loyalDefault: 'Loyalty programme',
    trips: (n) => `${n} ${n === 1 ? 'trip' : 'trips'}`,
    favCar: 'YOUR FAVOURITE CAR',
    freeNow: 'available',
    perDay: '/day',
    bookAgain: 'Book again',
    dates: 'DATES',
    pickup: 'PICK-UP',
    pickupDefault: 'AYT Airport',
    prefilled: 'Details, documents and payment are filled in',
    bookAgainCta: 'Book again · ≈45 sec',
    history: 'Booking history',
    noBookings: 'You have no bookings yet',
    allBookings: 'All',
    details: 'Details',
    contract: 'Contract',
    docs: 'My documents',
    update: 'Update',
    noDocs: 'No documents uploaded yet',
    verified: 'verified',
    underReview: 'under review',
    rejected: 'rejected',
    uploaded: 'uploaded',
    encrypted: 'Documents are stored encrypted, accessible only to the administrator.',
    addresses: 'Saved addresses',
    noAddresses: 'No saved addresses',
    byDefault: 'default',
    payments: 'Payment methods',
    noPayments: 'No saved payment methods',
    paymentsSoon: 'Saved cards',
    paymentsSoonSub: 'Available once online card payments are enabled',
    soon: 'Soon',
    manage: 'Manage',
    manager: 'Your manager',
    write: 'Message',
    logout: 'Sign out',
    browseAll: 'Browse all cars',
    browseAllSub: 'The full fleet, always one click away',
    bookNew: 'Book a car',
    ourLocations: 'Pickup locations',
    ourLocationsSub: 'Where you can collect your car',
    rebookKicker: 'REBOOK · ~45 SEC',
    activeRental: 'Your active rental',
    nextBooking: 'Your next booking',
    inRental: 'In rental',
    returnsOn: 'returns',
    startsOn: 'starts',
    open: 'Open',
    noActive: 'No active booking right now',
    noActiveSub: 'Your next trip starts in the catalogue.',
    yourDetails: 'YOUR DETAILS & REFERENCE',
    startFirst: 'Book your first car',
    firstSub: 'Pick a car — the rest takes a couple of minutes.',
    statusLabels: {
      NEW: 'New',
      AWAITING_CONFIRMATION: 'Awaiting confirmation',
      AWAITING_PAYMENT: 'Awaiting payment',
      CONFIRMED: 'Confirmed',
      PREPARING: 'Preparing',
      DELIVERED: 'Delivered',
      ACTIVE: 'Active',
      RETURNED: 'Returned',
      CLOSED: 'Completed',
      CANCELLED: 'Cancelled',
    },
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
  tr: {
    kicker: 'HESABIM',
    welcome: (name) => `Tekrar hoş geldiniz, ${name}`,
    loyalDefault: 'Sadakat programı',
    trips: (n) => `${n} yolculuk`,
    favCar: 'FAVORİ ARACINIZ',
    freeNow: 'müsait',
    perDay: '/gün',
    bookAgain: 'Tekrar kirala',
    dates: 'TARİHLER',
    pickup: 'ALIŞ',
    pickupDefault: 'AYT Havalimanı',
    prefilled: 'Bilgiler, belgeler ve ödeme hazır',
    bookAgainCta: 'Tekrar kirala · ≈45 sn',
    history: 'Rezervasyon geçmişi',
    noBookings: 'Henüz rezervasyonunuz yok',
    allBookings: 'Tümü',
    details: 'Detaylar',
    contract: 'Sözleşme',
    docs: 'Belgelerim',
    update: 'Güncelle',
    noDocs: 'Henüz belge yüklenmedi',
    verified: 'onaylandı',
    underReview: 'inceleniyor',
    rejected: 'reddedildi',
    uploaded: 'yüklendi',
    encrypted: 'Belgeler şifreli olarak saklanır ve yalnızca yönetici tarafından erişilebilir.',
    addresses: 'Kayıtlı adresler',
    noAddresses: 'Kayıtlı adres yok',
    byDefault: 'varsayılan',
    payments: 'Ödeme yöntemleri',
    noPayments: 'Kayıtlı ödeme yöntemi yok',
    paymentsSoon: 'Kayıtlı kartlar',
    paymentsSoonSub: 'Çevrimiçi kart ödemeleri etkinleştirildiğinde kullanılabilir',
    soon: 'Yakında',
    manage: 'Yönet',
    manager: 'Danışmanınız',
    write: 'Mesaj',
    logout: 'Çıkış yap',
    browseAll: 'Tüm araçlar',
    browseAllSub: 'Tüm filo, her zaman tek tık uzağınızda',
    bookNew: 'Araç kirala',
    ourLocations: 'Teslim noktaları',
    ourLocationsSub: 'Aracınızı nereden alabilirsiniz',
    rebookKicker: 'TEKRAR KİRALA · ~45 SN',
    activeRental: 'Aktif kiralamanız',
    nextBooking: 'Sonraki rezervasyonunuz',
    inRental: 'Kirada',
    returnsOn: 'iade',
    startsOn: 'başlangıç',
    open: 'Aç',
    noActive: 'Şu anda aktif rezervasyon yok',
    noActiveSub: 'Bir sonraki yolculuğunuz katalogda başlıyor.',
    yourDetails: 'BİLGİLERİNİZ VE REFERANS',
    startFirst: 'İlk aracınızı kiralayın',
    firstSub: 'Bir araç seçin — gerisi birkaç dakika sürer.',
    statusLabels: {
      NEW: 'Yeni',
      AWAITING_CONFIRMATION: 'Onay bekliyor',
      AWAITING_PAYMENT: 'Ödeme bekliyor',
      CONFIRMED: 'Onaylandı',
      PREPARING: 'Hazırlanıyor',
      DELIVERED: 'Teslim edildi',
      ACTIVE: 'Aktif',
      RETURNED: 'İade edildi',
      CLOSED: 'Tamamlandı',
      CANCELLED: 'İptal edildi',
    },
    months: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  },
  es: {
    kicker: 'ÁREA PERSONAL',
    welcome: (name) => `Bienvenido de nuevo, ${name}`,
    loyalDefault: 'Programa de fidelidad',
    trips: (n) => `${n} ${n === 1 ? 'viaje' : 'viajes'}`,
    favCar: 'TU COCHE FAVORITO',
    freeNow: 'disponible',
    perDay: '/día',
    bookAgain: 'Reservar de nuevo',
    dates: 'FECHAS',
    pickup: 'RECOGIDA',
    pickupDefault: 'Aeropuerto AYT',
    prefilled: 'Datos, documentos y pago ya completados',
    bookAgainCta: 'Reservar de nuevo · ≈45 s',
    history: 'Historial de reservas',
    noBookings: 'Aún no tienes reservas',
    allBookings: 'Todas',
    details: 'Detalles',
    contract: 'Contrato',
    docs: 'Mis documentos',
    update: 'Actualizar',
    noDocs: 'Aún no se han subido documentos',
    verified: 'verificado',
    underReview: 'en revisión',
    rejected: 'rechazado',
    uploaded: 'subido',
    encrypted: 'Los documentos se almacenan cifrados y solo el administrador puede acceder a ellos.',
    addresses: 'Direcciones guardadas',
    noAddresses: 'No hay direcciones guardadas',
    byDefault: 'predeterminada',
    payments: 'Métodos de pago',
    noPayments: 'No hay métodos de pago guardados',
    paymentsSoon: 'Tarjetas guardadas',
    paymentsSoonSub: 'Disponible cuando se activen los pagos con tarjeta en línea',
    soon: 'Pronto',
    manage: 'Gestionar',
    manager: 'Tu gestor',
    write: 'Mensaje',
    logout: 'Cerrar sesión',
    browseAll: 'Todos los coches',
    browseAllSub: 'Toda la flota, siempre a un clic',
    bookNew: 'Reservar un coche',
    ourLocations: 'Puntos de recogida',
    ourLocationsSub: 'Dónde puedes recoger tu coche',
    rebookKicker: 'RESERVAR DE NUEVO · ~45 S',
    activeRental: 'Tu alquiler activo',
    nextBooking: 'Tu próxima reserva',
    inRental: 'En alquiler',
    returnsOn: 'devolución',
    startsOn: 'inicio',
    open: 'Abrir',
    noActive: 'No hay reservas activas ahora mismo',
    noActiveSub: 'Tu próximo viaje comienza en el catálogo.',
    yourDetails: 'TUS DATOS Y REFERENCIA',
    startFirst: 'Reserva tu primer coche',
    firstSub: 'Elige un coche — el resto lleva un par de minutos.',
    statusLabels: {
      NEW: 'Nuevo',
      AWAITING_CONFIRMATION: 'Esperando confirmación',
      AWAITING_PAYMENT: 'Esperando pago',
      CONFIRMED: 'Confirmado',
      PREPARING: 'En preparación',
      DELIVERED: 'Entregado',
      ACTIVE: 'Activo',
      RETURNED: 'Devuelto',
      CLOSED: 'Completado',
      CANCELLED: 'Cancelado',
    },
    months: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  },
  de: {
    kicker: 'MEIN KONTO',
    welcome: (name) => `Willkommen zurück, ${name}`,
    loyalDefault: 'Treueprogramm',
    trips: (n) => `${n} ${n === 1 ? 'Fahrt' : 'Fahrten'}`,
    favCar: 'IHR LIEBLINGSAUTO',
    freeNow: 'verfügbar',
    perDay: '/Tag',
    bookAgain: 'Erneut buchen',
    dates: 'ZEITRAUM',
    pickup: 'ABHOLUNG',
    pickupDefault: 'Flughafen AYT',
    prefilled: 'Daten, Dokumente und Zahlung sind hinterlegt',
    bookAgainCta: 'Erneut buchen · ≈45 Sek.',
    history: 'Buchungsverlauf',
    noBookings: 'Sie haben noch keine Buchungen',
    allBookings: 'Alle',
    details: 'Details',
    contract: 'Vertrag',
    docs: 'Meine Dokumente',
    update: 'Aktualisieren',
    noDocs: 'Noch keine Dokumente hochgeladen',
    verified: 'verifiziert',
    underReview: 'in Prüfung',
    rejected: 'abgelehnt',
    uploaded: 'hochgeladen',
    encrypted: 'Dokumente werden verschlüsselt gespeichert und sind nur für den Administrator zugänglich.',
    addresses: 'Gespeicherte Adressen',
    noAddresses: 'Keine gespeicherten Adressen',
    byDefault: 'Standard',
    payments: 'Zahlungsmethoden',
    noPayments: 'Keine gespeicherten Zahlungsmethoden',
    paymentsSoon: 'Gespeicherte Karten',
    paymentsSoonSub: 'Verfügbar, sobald Online-Kartenzahlungen aktiviert sind',
    soon: 'Bald',
    manage: 'Verwalten',
    manager: 'Ihr Ansprechpartner',
    write: 'Nachricht',
    logout: 'Abmelden',
    browseAll: 'Alle Autos',
    browseAllSub: 'Die ganze Flotte, immer nur einen Klick entfernt',
    bookNew: 'Auto buchen',
    ourLocations: 'Abholstationen',
    ourLocationsSub: 'Wo Sie Ihr Auto abholen können',
    rebookKicker: 'ERNEUT BUCHEN · ~45 SEK.',
    activeRental: 'Ihre aktive Miete',
    nextBooking: 'Ihre nächste Buchung',
    inRental: 'Läuft',
    returnsOn: 'Rückgabe',
    startsOn: 'Beginn',
    open: 'Öffnen',
    noActive: 'Derzeit keine aktive Buchung',
    noActiveSub: 'Ihre nächste Reise beginnt im Katalog.',
    yourDetails: 'IHRE DATEN & REFERENZ',
    startFirst: 'Buchen Sie Ihr erstes Auto',
    firstSub: 'Wählen Sie ein Auto — der Rest dauert nur ein paar Minuten.',
    statusLabels: {
      NEW: 'Neu',
      AWAITING_CONFIRMATION: 'Wartet auf Bestätigung',
      AWAITING_PAYMENT: 'Wartet auf Zahlung',
      CONFIRMED: 'Bestätigt',
      PREPARING: 'In Vorbereitung',
      DELIVERED: 'Übergeben',
      ACTIVE: 'Aktiv',
      RETURNED: 'Zurückgegeben',
      CLOSED: 'Abgeschlossen',
      CANCELLED: 'Storniert',
    },
    months: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
  },
}

const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: '€',
  USD: '$',
  RUB: '₽',
  TRY: '₺',
  USDT: '₮',
  USDC: 'USDC',
}

function money(amount: number, currency: string): string {
  const isCrypto = currency === 'USDT' || currency === 'USDC'
  const body = amount.toLocaleString('en-US', {
    minimumFractionDigits: isCrypto ? 2 : 0,
    maximumFractionDigits: 2,
  })
  if (currency === 'USDC') return `${body} USDC`
  if (currency === 'USDT') return `₮${body}`
  return `${CURRENCY_SYMBOL[currency] ?? ''}${body}`
}

const DOC_LABELS: Dict<Record<string, string>> = {
  ru: {
    PASSPORT: 'Паспорт / ID',
    LICENSE_FRONT: 'Вод. удостоверение (лицевая)',
    LICENSE_BACK: 'Вод. удостоверение (оборот)',
    PAYMENT_PROOF: 'Подтверждение оплаты',
    CONTRACT: 'Договор',
    OTHER: 'Документ',
  },
  en: {
    PASSPORT: 'Passport / ID',
    LICENSE_FRONT: 'Driving licence (front)',
    LICENSE_BACK: 'Driving licence (back)',
    PAYMENT_PROOF: 'Payment proof',
    CONTRACT: 'Contract',
    OTHER: 'Document',
  },
  tr: {
    PASSPORT: 'Pasaport / Kimlik',
    LICENSE_FRONT: 'Ehliyet (ön)',
    LICENSE_BACK: 'Ehliyet (arka)',
    PAYMENT_PROOF: 'Ödeme belgesi',
    CONTRACT: 'Sözleşme',
    OTHER: 'Belge',
  },
  es: {
    PASSPORT: 'Pasaporte / ID',
    LICENSE_FRONT: 'Carné de conducir (anverso)',
    LICENSE_BACK: 'Carné de conducir (reverso)',
    PAYMENT_PROOF: 'Justificante de pago',
    CONTRACT: 'Contrato',
    OTHER: 'Documento',
  },
  de: {
    PASSPORT: 'Reisepass / Ausweis',
    LICENSE_FRONT: 'Führerschein (Vorderseite)',
    LICENSE_BACK: 'Führerschein (Rückseite)',
    PAYMENT_PROOF: 'Zahlungsnachweis',
    CONTRACT: 'Vertrag',
    OTHER: 'Dokument',
  },
}

const carThumb: CSSProperties = {
  background: 'linear-gradient(135deg,#DCF3F6,#B6E6EE)',
}

const docRowBase: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderRadius: 11,
  padding: '12px 14px',
}

const addrIcon: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 9,
  background: '#E0F6F2',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const addrName: CSSProperties = { color: 'var(--av-text)' }
const addrSub: CSSProperties = { font: '500 11px var(--f-ui)', color: 'var(--av-muted)' }
const docName: CSSProperties = { font: '700 13px var(--f-ui)', color: 'var(--av-text)' }
const emptyNote: CSSProperties = { font: '500 12px var(--f-ui)', color: 'var(--av-muted)' }

// Supporting (reference) cards — deliberately QUIETER than the primary region: lighter shadow, a
// thin hairline, an uppercase-mono micro-title. Prominence is spent on rebook / active booking only.
// minWidth:0 lets these grid cards shrink to their track on mobile — without it, a card's min-content
// (the map / long inline rows) forces the single `1fr` column wider than the phone and clips the right edge.
const quietCard: CSSProperties = { minWidth: 0, background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 8px 22px -20px rgba(11,85,96,.28)', border: '1px solid rgba(20,153,174,.09)' }
const quietTitle: CSSProperties = { font: '700 10px var(--f-mono)', letterSpacing: '.1em', color: 'var(--av-label)', textTransform: 'uppercase', display: 'block' }

// Status → accent colours for the active-booking card's strip + border (keyed by StatusPill tone).
const TONE_BAR: Record<string, string> = { info: '#3F6FD1', warn: '#E7A32A', success: '#27B576', neutral: '#8AA0A6', danger: '#DC5050' }
const TONE_BORDER: Record<string, string> = { info: 'rgba(63,111,209,.22)', warn: 'rgba(231,163,42,.28)', success: 'rgba(39,181,118,.3)', neutral: 'rgba(138,160,166,.22)', danger: 'rgba(220,80,80,.28)' }

/** Green (verified) vs neutral surface for a document row, keyed by status. */
function docRowStyle(status: string): CSSProperties {
  if (status === 'VERIFIED') {
    return { ...docRowBase, background: '#E9FBF2', border: '1px solid rgba(39,181,118,.3)' }
  }
  if (status === 'REJECTED') {
    return { ...docRowBase, background: 'var(--av-danger-bg)', border: '1px solid rgba(220,80,80,.25)' }
  }
  return { ...docRowBase, background: 'var(--av-field)', border: '1px solid rgba(20,153,174,.18)' }
}

function docStatusText(status: string, t: Strings): { label: string; color: string; mark: string } {
  switch (status) {
    case 'VERIFIED':
      return { label: t.verified, color: '#1F9E6B', mark: '✓' }
    case 'REJECTED':
      return { label: t.rejected, color: 'var(--av-danger)', mark: '✕' }
    case 'UNDER_REVIEW':
      return { label: t.underReview, color: 'var(--av-warn-text)', mark: '⧗' }
    default:
      return { label: t.uploaded, color: 'var(--av-muted)', mark: '•' }
  }
}

/* ══════════════════ Redesign shell (scoped `.cab`) — client cabinet dashboard ═══════════════
   Same data/logic as before, re-laid-out to the design_handoff_aventa_cabinet spec.
   Sidebar + top bar + overview/stats/loyalty + rebook/active hero + reminders + booking
   history (filterable) + documents/payments/manager + places (SavedPlaces). No spend chart. */

const CAB_FONTS =
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap'

const CAB_CSS = `
.cab{--ink:#0a2225;--muted:#5b7678;--muted-2:#8aa2a3;--bg:#eef6f5;--bg-2:#e7f1ef;--surface:#fff;--line:rgba(10,34,37,.10);--teal:#0d9488;--teal-700:#0f6d68;--teal-deep:#0b4f52;--teal-bright:#67e3d3;--teal-soft:rgba(13,148,136,.1);--accent:#fb6d4c;--accent-strong:#ef5c3a;--accent-soft:rgba(251,109,76,.12);--ok:#0f9d6f;--ok-soft:rgba(16,185,129,.12);--gold:#f5b400;--f-display:'Space Grotesk',system-ui,sans-serif;--f-ui:'Manrope',system-ui,sans-serif;--f-mono:'JetBrains Mono',ui-monospace,monospace;position:relative;display:flex;min-height:100vh;font-family:var(--f-ui);color:var(--ink);background:var(--bg)}
.cab *{box-sizing:border-box}
.cab a{text-decoration:none;color:inherit}
.cab input:focus{border-color:var(--teal)!important;box-shadow:0 0 0 4px var(--teal-soft)}
.cab .cab-navitem{transition:background .22s,color .22s}
.cab .cab-navitem:hover{background:rgba(255,255,255,.08);color:#fff}
.cab .cab-lift{transition:transform .2s,box-shadow .2s,background .2s,border-color .2s}
.cab .cab-lift:hover{transform:translateY(-2px)}
.cab .cab-row{transition:transform .3s cubic-bezier(.2,.7,.3,1),box-shadow .3s,border-color .3s}
.cab .cab-row:hover{transform:translateX(5px);box-shadow:0 18px 40px -28px rgba(6,33,38,.5);border-color:rgba(13,148,136,.35)}
.cab .cab-docrow{transition:border-color .2s,transform .2s}
.cab .cab-docrow:hover{border-color:rgba(16,185,129,.4);transform:translateX(3px)}
.cab .cab-cta{transition:transform .22s,background .22s,box-shadow .22s}
.cab .cab-cta:hover{transform:translateY(-2px);background:var(--accent-strong);box-shadow:0 20px 36px -12px var(--accent-strong)}
.cab .cab-sheen{position:absolute;top:0;bottom:0;left:0;width:55%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.32),transparent);animation:cab-sheen 3.9s ease-in-out infinite;pointer-events:none}
.cab .cab-orb{position:absolute;border-radius:50%;pointer-events:none}
.cab .cab-orb1{animation:cab-fl 15s ease-in-out infinite}
.cab .cab-orb2{animation:cab-fls 13s ease-in-out infinite}
@keyframes cab-fl{0%,100%{transform:translate(0,0)}50%{transform:translate(14px,-22px)}}
@keyframes cab-fls{0%,100%{transform:translate(0,0)}50%{transform:translate(-20px,24px)}}
@keyframes cab-dot{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes cab-sheen{0%{transform:translateX(-130%)}55%,100%{transform:translateX(240%)}}
.cab .cab-scrim{position:fixed;inset:0;z-index:98;background:rgba(4,20,23,.5);opacity:0;pointer-events:none;transition:opacity .3s}
.cab.nav-open .cab-scrim{opacity:1;pointer-events:auto}
.cab .cab-side{position:sticky;top:0;align-self:flex-start;flex-shrink:0;width:264px;height:100vh;z-index:99;overflow:hidden}
.cab .cab-burger{display:none}
@media(max-width:1000px){
  .cab .cab-side{position:fixed;left:0;top:0;transform:translateX(-108%);transition:transform .34s cubic-bezier(.16,.84,.34,1);box-shadow:0 20px 60px -20px rgba(0,0,0,.6)}
  .cab.nav-open .cab-side{transform:translateX(0)}
  .cab .cab-burger{display:inline-flex}
  .cab .cab-stats{grid-template-columns:repeat(2,1fr)!important}
  .cab .cab-hero{grid-template-columns:1fr!important}
  .cab .cab-rem{grid-template-columns:1fr!important}
  .cab .cab-details{grid-template-columns:1fr!important}
}
@media(max-width:640px){.cab .cab-stats{grid-template-columns:1fr!important}.cab .cab-hide-narrow{display:none}}
@media(prefers-reduced-motion:reduce){.cab .cab-orb1,.cab .cab-orb2,.cab .cab-sheen{animation:none}}
/* ── mobile 5-tab app ── */
.cabm{position:fixed;inset:0;z-index:70;flex-direction:column;min-height:0}
.cab .cab-mscroll{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch}
.cab .cab-mscroll::-webkit-scrollbar{width:0}
.cab .cab-mview{animation:cab-viewin .42s cubic-bezier(.16,.84,.34,1) both}
@keyframes cab-viewin{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.cab .cab-tabbar{flex-shrink:0;display:grid;grid-template-columns:repeat(5,1fr);padding:9px 6px calc(env(safe-area-inset-bottom,0px) + 12px);background:linear-gradient(180deg,#0b5457,#072f33);border-top:1px solid rgba(255,255,255,.08);box-shadow:0 -12px 30px -18px rgba(0,0,0,.5)}
.cab .cab-tab{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px 0 4px;border:none;background:transparent;cursor:pointer}
.cab .cab-tab:active{transform:scale(.94)}
.cab .cab-mcard:active{transform:scale(.985)}
`

/* new design-specific copy (EN/RU authored; tr/es/de fall back to EN). Existing `dict` covers the rest. */
const cab = {
  en: {
    menu: 'Menu', navOverview: 'Overview', navBookings: 'My bookings', navDocuments: 'Documents', navPayments: 'Payments', navPlaces: 'Places', navSupport: 'Support',
    chooseCar: 'Choose a car', overview: 'Overview', searchPh: 'Search bookings…',
    welSub: 'Your active rental, bookings and documents — all in one place. Everything’s in order for your next trip.',
    statTrips: 'Total trips', statSpend: 'Total spend', statPoints: 'Loyalty points', statDays: 'Days on the road',
    loyMember: (tier: string) => `${tier} member`, loyOf: (n: number) => `/ ${n.toLocaleString('en-US')}`, loyNext: (n: number, tier: string) => `${n.toLocaleString('en-US')} points to ${tier}`, loyMax: 'Top tier reached',
    tierSilver: 'SILVER', tierGold: 'GOLD', tierPlat: 'PLATINUM',
    returnsIn: 'Returns in', daysUnit: 'days', pickedUp: 'picked up', returnLbl: 'return',
    thingsToDo: 'Things to do', allSet: 'You’re all set', allSetSub: 'No pending actions right now — enjoy the ride.',
    remPay: (car: string) => `Finish payment for ${car}`, remPaySub: (id: string) => `${id} · deposit due`,
    remRet: (car: string) => `Return ${car} soon`, remRetSub: (d: string) => `by ${d} · Antalya office`,
    remLic: 'Re-check your documents', remLicSub: 'One document needs your attention',
    remRate: (car: string) => `Rate your ${car} trip`, remRateSub: 'Help us keep quality high',
    tabAll: 'All', tabActive: 'Active', tabConfirmed: 'Confirmed', tabAwaiting: 'Awaiting payment', tabCancelled: 'Cancelled',
    depositBalance: 'Deposit balance', addCard: 'Add a card', payNote: 'Online card payments are enabled. Cash deposit is also accepted at handover.', noCard: 'No saved card', noCardSub: 'Add a card for faster checkout',
    mgrOnline: 'Online · replies in ~5 min', mgrDesc: 'Questions about your rental, extending dates or a special request? We’re here for you in your language.',
    officeLabel: 'AVENTA office', directions: 'Directions',
    hi: 'Hi,', mHome: 'Home', mTrips: 'Trips', mDocs: 'Docs', mWallet: 'Wallet', mSupport: 'Support', support247: '24/7 support',
    actPay: 'Pay now', actRate: 'Rate', bookNewCar: 'Book a new car',
    mPayments: 'Payments', paymentsDue: 'Payments due', paymentPending: 'Payment pending', allPaid: 'All paid up', allPaidSub: 'No payments due right now', manageAll: 'Manage all payments', depositHeld: 'Deposits are held on your card and released when you return the car.',
  },
  ru: {
    menu: 'Меню', navOverview: 'Обзор', navBookings: 'Мои брони', navDocuments: 'Документы', navPayments: 'Оплата', navPlaces: 'Места', navSupport: 'Поддержка',
    chooseCar: 'Выбрать авто', overview: 'Обзор', searchPh: 'Поиск броней…',
    welSub: 'Ваша аренда, брони и документы — всё в одном месте. Всё готово к следующей поездке.',
    statTrips: 'Всего поездок', statSpend: 'Всего потрачено', statPoints: 'Баллы лояльности', statDays: 'Дней в пути',
    loyMember: (tier: string) => `Уровень ${tier}`, loyOf: (n: number) => `/ ${n.toLocaleString('ru-RU')}`, loyNext: (n: number, tier: string) => `${n.toLocaleString('ru-RU')} баллов до ${tier}`, loyMax: 'Высший уровень',
    tierSilver: 'SILVER', tierGold: 'GOLD', tierPlat: 'PLATINUM',
    returnsIn: 'Возврат через', daysUnit: 'дн.', pickedUp: 'получено', returnLbl: 'возврат',
    thingsToDo: 'Что сделать', allSet: 'Всё готово', allSetSub: 'Активных задач нет — приятной поездки.',
    remPay: (car: string) => `Завершите оплату ${car}`, remPaySub: (id: string) => `${id} · нужен депозит`,
    remRet: (car: string) => `Скоро вернуть ${car}`, remRetSub: (d: string) => `до ${d} · офис Анталия`,
    remLic: 'Проверьте документы', remLicSub: 'Один документ требует внимания',
    remRate: (car: string) => `Оцените поездку на ${car}`, remRateSub: 'Помогите держать качество',
    tabAll: 'Все', tabActive: 'В аренде', tabConfirmed: 'Подтверждено', tabAwaiting: 'Ожидает оплаты', tabCancelled: 'Отменено',
    depositBalance: 'Баланс депозита', addCard: 'Добавить карту', payNote: 'Онлайн-оплата картой включена. Наличный депозит также принимается при выдаче.', noCard: 'Нет сохранённой карты', noCardSub: 'Добавьте карту для быстрой оплаты',
    mgrOnline: 'Онлайн · отвечает ~5 мин', mgrDesc: 'Вопросы по аренде, продление дат или особая просьба? Мы поможем на вашем языке.',
    officeLabel: 'Офис AVENTA', directions: 'Маршрут',
    hi: 'Привет,', mHome: 'Дом', mTrips: 'Поездки', mDocs: 'Док-ты', mWallet: 'Кошелёк', mSupport: 'Помощь', support247: 'Поддержка 24/7',
    actPay: 'Оплатить', actRate: 'Оценить', bookNewCar: 'Забронировать новое авто',
    mPayments: 'Оплата', paymentsDue: 'К оплате', paymentPending: 'Ожидает оплаты', allPaid: 'Всё оплачено', allPaidSub: 'Нет задолженностей', manageAll: 'Все платежи', depositHeld: 'Депозит блокируется на карте и возвращается при возврате авто.',
  },
}
type CabCopy = (typeof cab)['en']
const cabFor = (l: Lang): CabCopy => (cab as Record<string, CabCopy>)[l] ?? cab.en

/** Lucide-style icon. */
function Ic({ d, s = 19, c = 'currentColor', sw = 1.8, fill = 'none' }: { d: ReactNode; s?: number; c?: string; sw?: number; fill?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill={fill} stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
}
const CI = {
  grid: <><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></>,
  cal: <><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="m9 16 2 2 4-4" /></>,
  file: <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></>,
  card: <><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></>,
  pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
  headset: <><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></>,
  car: <><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></>,
  out: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  star: <polygon points="12 2 15 9 22 9.3 16.5 13.8 18.3 21 12 17 5.7 21 7.5 13.8 2 9.3 9 9" />,
  clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  refresh: <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></>,
  upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></>,
  shield: <><rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  building: <><path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" /></>,
  nav: <polygon points="3 11 22 2 13 21 11 13 3 11" />,
  plus: <><path d="M5 12h14" /><path d="M12 5v14" /></>,
  wa: <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
  tg: <><path d="M14.54 21.69a.5.5 0 0 0 .94-.02l6.5-19a.5.5 0 0 0-.64-.64l-19 6.5a.5.5 0 0 0-.02.94l7.93 3.18a2 2 0 0 1 1.11 1.11z" /><path d="m21.85 2.15-10.94 10.94" /></>,
  menu: <><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="18" y2="18" /></>,
  idcard: <><rect width="18" height="14" x="3" y="5" rx="2" /><circle cx="9" cy="12" r="2" /><path d="M15 10h3" /><path d="M15 14h3" /></>,
  selfie: <><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></>,
}

/** Sidebar nav item (icon + label + optional trailing node). Active = filled bg + coral left bar. */
function NavItem({ id, label, icon, active, trailing, onNav }: { id: string; label: string; icon: ReactNode; active: boolean; trailing?: ReactNode; onNav: (id: string) => void }) {
  return (
    <a
      href={`#${id}`}
      onClick={(e) => { e.preventDefault(); onNav(id) }}
      className="cab-navitem"
      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 12, color: active ? '#fff' : 'rgba(255,255,255,.72)', background: active ? 'rgba(255,255,255,.1)' : 'transparent', fontWeight: 600, fontSize: 14.5 }}
    >
      {active && <span style={{ position: 'absolute', left: -18, top: 8, bottom: 8, width: 3, borderRadius: 3, background: 'var(--accent)', boxShadow: '0 0 14px var(--accent)' }} />}
      <Ic d={icon} s={19} />
      <span style={{ flex: 1 }}>{label}</span>
      {trailing}
    </a>
  )
}

/** Overview stat card (icon tile + number + label). */
function StatCard({ icon, tint, ink, value, label }: { icon: ReactNode; tint: string; ink: string; value: string; label: string }) {
  return (
    <div className="cab-lift" style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18, padding: '20px 20px 18px', boxShadow: '0 1px 2px rgba(6,33,38,.04),0 18px 40px -32px rgba(6,33,38,.5)' }}>
      <span style={{ width: 40, height: 40, borderRadius: 11, background: tint, color: ink, display: 'grid', placeItems: 'center' }}><Ic d={icon} s={20} sw={1.7} /></span>
      <div style={{ font: '700 clamp(28px,3.4vw,38px)/1 var(--f-display)', color: 'var(--ink)', marginTop: 16 }}>{value}</div>
      <div style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 6, fontWeight: 500 }}>{label}</div>
    </div>
  )
}

export default function Account({
  user,
  emailUnverified,
  bookings,
  favouriteCar,
  lastPickupCity,
  tripCount,
  documents,
  verification,
  offices,
  savedPlaces,
  mapProvider,
  mapApiKey,
}: Props) {
  const t = useDict(dict)
  const { lang } = useLang()
  const isMobile = useIsMobile()
  const router = useRouter()

  // Poll-while-pending: while any document is under review, re-fetch server state so an admin
  // approve/reject appears in the cabinet automatically (no manual reload). Stops when none pending.
  const anyPending = verification.anyPending
  useEffect(() => {
    if (!anyPending) return
    const id = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(id)
  }, [anyPending, router])

  const c = cabFor(lang)

  // ── UI-only state added for the dashboard (no backend change) ──
  const [filter, setFilter] = useState<'all' | 'active' | 'confirmed' | 'awaiting' | 'cancelled'>('all')
  // Reminder completion, tracked in localStorage: id → { date it was completed, + display info }.
  const [todoDone, setTodoDone] = useState<Record<string, { date: string; title: string; sub: string; key: string }>>({})
  const [navOpen, setNavOpen] = useState(false)
  const [activeSec, setActiveSec] = useState('c-overview')
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<'home' | 'trips' | 'docs' | 'payments' | 'support'>('home') // mobile tab app ('support' reached via header icon)

  // scroll-spy: the section whose top passed 32% of the viewport is "active" in the sidebar
  useEffect(() => {
    const ids = ['c-overview', 'c-bookings', 'c-documents', 'c-payments', 'c-support', 'c-places']
    const onScroll = () => {
      const mark = window.innerHeight * 0.32
      let cur = ids[0]
      for (const id of ids) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= mark) cur = id }
      setActiveSec(cur)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const onNav = (id: string) => {
    setNavOpen(false)
    const el = document.getElementById(id)
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 74, behavior: 'smooth' })
    setActiveSec(id)
  }

  const guestFallback: Record<Lang, string> = { ru: 'гость', en: 'guest', tr: 'misafir', es: 'invitado', de: 'Gast' }
  const firstName = user.firstName?.trim() || (guestFallback[lang] ?? guestFallback.en)
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
  const initial = (user.firstName?.[0] ?? user.email[0] ?? 'A').toUpperCase()

  const fmtDate = (isoStr: string): string => {
    const d = new Date(isoStr)
    return lang === 'ru' ? `${d.getDate()} ${t.months[d.getMonth()]}` : `${t.months[d.getMonth()]} ${d.getDate()}`
  }
  const fmtRange = (startIso: string, endIso: string): string =>
    `${fmtDate(startIso)} – ${fmtDate(endIso)} ${new Date(endIso).getFullYear()}`
  const carThumbBg = (coverUrl: string | null): CSSProperties =>
    coverUrl ? { backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}

  // ── the ONE booking to surface as the active/next highlight ──
  const nowMs = Date.now()
  const LIVE: BookingStatus[] = ['NEW', 'AWAITING_CONFIRMATION', 'AWAITING_PAYMENT', 'CONFIRMED', 'PREPARING', 'DELIVERED', 'ACTIVE']
  const liveBookings = bookings
    .filter((b) => LIVE.includes(b.status as BookingStatus) && new Date(b.endAt).getTime() >= nowMs)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  const inRentalNow = liveBookings.find((b) => new Date(b.startAt).getTime() <= nowMs && new Date(b.endAt).getTime() >= nowMs)
  const heroBooking = inRentalNow ?? liveBookings[0] ?? null
  const isInRental = !!inRentalNow && heroBooking?.id === inRentalNow.id

  // rental countdown (active hero): fraction of the period elapsed
  const heroPct = heroBooking && isInRental
    ? Math.min(100, Math.max(0, Math.round(((nowMs - new Date(heroBooking.startAt).getTime()) / (new Date(heroBooking.endAt).getTime() - new Date(heroBooking.startAt).getTime())) * 100)))
    : 0
  const heroDaysLeft = heroBooking ? Math.max(0, Math.ceil((new Date(heroBooking.endAt).getTime() - nowMs) / 86400000)) : 0

  const STATUS_ORDER: Record<BookingStatus, number> = {
    ACTIVE: 0, DELIVERED: 1, PREPARING: 2, CONFIRMED: 3, AWAITING_PAYMENT: 4,
    AWAITING_CONFIRMATION: 5, NEW: 6, RETURNED: 7, CLOSED: 8, CANCELLED: 9,
  }
  const sortedBookings = useMemo(
    () => [...bookings].sort((a, b) => {
      const d = STATUS_ORDER[a.status as BookingStatus] - STATUS_ORDER[b.status as BookingStatus]
      return d !== 0 ? d : new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
    }),
    [bookings],
  )

  // ── stats (derived from real bookings) ──
  const nonCancelled = bookings.filter((b) => b.status !== 'CANCELLED')
  const spendTotal = nonCancelled.reduce((s, b) => s + b.subtotal, 0)
  const daysTotal = nonCancelled.reduce((s, b) => s + (b.days || 0), 0)
  const loyaltyPoints = Math.round(spendTotal) // 1 point / €
  const tierRaw = (user.loyaltyTier || '').toUpperCase()
  const tierName = user.loyaltyTier?.trim() || 'Bronze'
  const TIER_TARGET: Record<string, number> = { BRONZE: 2000, SILVER: 5000, GOLD: 10000, PLATINUM: 10000 }
  const NEXT_TIER: Record<string, string> = { BRONZE: 'Silver', SILVER: 'Gold', GOLD: 'Platinum', PLATINUM: '' }
  const loyaltyTarget = TIER_TARGET[tierRaw] ?? 10000
  const nextTier = NEXT_TIER[tierRaw] ?? 'Gold'
  const loyaltyPct = Math.min(100, Math.round((loyaltyPoints / loyaltyTarget) * 100))
  const pointsToNext = Math.max(0, loyaltyTarget - loyaltyPoints)
  const money0 = (n: number) => `€${Math.round(n).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')}`

  // ── booking status → design group / colours ──
  const groupOf = (s: BookingStatus): 'active' | 'confirmed' | 'awaiting' | 'cancelled' => {
    if (s === 'ACTIVE' || s === 'DELIVERED') return 'active'
    if (s === 'AWAITING_PAYMENT') return 'awaiting'
    if (s === 'CANCELLED') return 'cancelled'
    return 'confirmed'
  }
  const statusStyle = (s: BookingStatus) => {
    const g = groupOf(s)
    if (g === 'active') return { color: 'var(--teal-700)', bg: 'var(--teal-soft)', dot: 'var(--teal)', stripe: 'var(--teal)' }
    if (g === 'awaiting') return { color: '#b7791f', bg: 'rgba(245,180,0,.14)', dot: 'var(--gold)', stripe: 'var(--gold)' }
    if (g === 'cancelled') return { color: 'var(--accent-strong)', bg: 'rgba(251,109,76,.11)', dot: 'var(--accent)', stripe: 'var(--accent)' }
    return { color: 'var(--ok)', bg: 'var(--ok-soft)', dot: 'var(--ok)', stripe: 'var(--ok)' }
  }
  const tabs: { key: typeof filter; label: string }[] = [
    { key: 'all', label: c.tabAll }, { key: 'active', label: c.tabActive }, { key: 'confirmed', label: c.tabConfirmed }, { key: 'awaiting', label: c.tabAwaiting }, { key: 'cancelled', label: c.tabCancelled },
  ]
  const tabCount = (k: typeof filter) => (k === 'all' ? sortedBookings.length : sortedBookings.filter((b) => groupOf(b.status as BookingStatus) === k).length)
  const qq = q.trim().toLowerCase()
  const shownBookings = sortedBookings
    .filter((b) => filter === 'all' || groupOf(b.status as BookingStatus) === filter)
    .filter((b) => !qq || `${b.car.brand} ${b.car.model} ${b.number}`.toLowerCase().includes(qq))

  // ── derived reminders (real conditions) + tap-to-do lifecycle ──
  // Each reminder is a real task with an ACTION button (tap → go do it). It turns GREEN once its
  // underlying condition genuinely resolves (e.g. the awaiting-payment booking gets paid) and then
  // drops off the next day. Completion is tracked in localStorage via a `seen`→`done` reconcile.
  const payDue = bookings.filter((b) => b.status === 'AWAITING_PAYMENT')
  const goToPayments = () => { if (isMobile) { setTab('payments'); window.scrollTo({ top: 0 }) } else document.getElementById('c-payments')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  type Rem = { id: string; key: string; urgent: boolean; icon: ReactNode; title: string; sub: string; href?: string; action?: string; manual?: boolean; done?: boolean; onAction?: () => void }
  const derivedReminders: Rem[] = []
  const awaitingBk = bookings.find((b) => b.status === 'AWAITING_PAYMENT')
  if (awaitingBk) derivedReminders.push({ id: `pay:${awaitingBk.number}`, key: 'pay', urgent: true, icon: CI.card, title: c.remPay(`${awaitingBk.car.brand} ${awaitingBk.car.model}`), sub: c.remPaySub(awaitingBk.number), onAction: goToPayments, action: c.actPay })
  if (inRentalNow) derivedReminders.push({ id: `ret:${inRentalNow.number}`, key: 'ret', urgent: false, icon: CI.car, title: c.remRet(`${inRentalNow.car.brand} ${inRentalNow.car.model}`), sub: c.remRetSub(fmtDate(inRentalNow.endAt)), href: `/success?b=${encodeURIComponent(inRentalNow.number)}`, action: t.details })
  if (verification.anyRejected || verification.anyExpired) derivedReminders.push({ id: 'lic', key: 'lic', urgent: false, icon: CI.upload, title: c.remLic, sub: c.remLicSub, href: '/account/documents', action: t.update })
  const doneTrip = bookings.find((b) => b.status === 'RETURNED' || b.status === 'CLOSED')
  if (doneTrip) derivedReminders.push({ id: `rate:${doneTrip.number}`, key: 'rate', urgent: false, icon: CI.star, title: c.remRate(`${doneTrip.car.brand} ${doneTrip.car.model}`), sub: c.remRateSub, href: `/success?b=${encodeURIComponent(doneTrip.number)}`, action: c.actRate, manual: true })

  const dtoday = new Date()
  const todayStr = `${dtoday.getFullYear()}-${String(dtoday.getMonth() + 1).padStart(2, '0')}-${String(dtoday.getDate()).padStart(2, '0')}`
  const iconForKey = (k: string): ReactNode => (k === 'pay' ? CI.card : k === 'ret' ? CI.car : k === 'lic' ? CI.upload : CI.star)
  // On mount: any reminder that was showing last visit but is gone now = its task resolved → mark it
  // done today (so it shows green today); anything marked done on an earlier day is dropped.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    try {
      const st = JSON.parse(localStorage.getItem('aventa_cab_todos') || '{}')
      const seen: Record<string, { title: string; sub: string; key: string }> = st.seen || {}
      const done: Record<string, { date: string; title: string; sub: string; key: string }> = st.done || {}
      const curIds = derivedReminders.map((r) => r.id)
      for (const id of Object.keys(seen)) if (!curIds.includes(id) && !done[id]) done[id] = { date: todayStr, ...seen[id] }
      for (const id of Object.keys(done)) if (done[id].date !== todayStr) delete done[id]
      const newSeen: typeof seen = {}
      derivedReminders.forEach((r) => { newSeen[r.id] = { title: r.title, sub: r.sub, key: r.key } })
      localStorage.setItem('aventa_cab_todos', JSON.stringify({ seen: newSeen, done }))
      setTodoDone(done)
    } catch { /* ignore */ }
  }, [])
  const markDone = (r: Rem) => {
    setTodoDone((prev) => {
      const nx = { ...prev, [r.id]: { date: todayStr, title: r.title, sub: r.sub, key: r.key } }
      try { const st = JSON.parse(localStorage.getItem('aventa_cab_todos') || '{}'); localStorage.setItem('aventa_cab_todos', JSON.stringify({ seen: st.seen || {}, done: nx })) } catch { /* ignore */ }
      return nx
    })
  }
  const activeReminders: Rem[] = derivedReminders.filter((r) => todoDone[r.id]?.date !== todayStr)
  const doneReminders: Rem[] = Object.entries(todoDone).filter(([, v]) => v.date === todayStr).map(([id, v]) => ({ id, key: v.key, urgent: false, icon: iconForKey(v.key), title: v.title, sub: v.sub, done: true }))
  const shownReminders: Rem[] = [...activeReminders, ...doneReminders]
  const openTodos = activeReminders.length

  const actionBtnStyle: CSSProperties = { flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '9px 15px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', font: '700 12.5px var(--f-ui)', cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: '0 8px 18px -10px var(--accent)' }
  const reminderCard = (r: Rem) => {
    const urgent = r.urgent && !r.done
    return (
      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 15px', borderRadius: 16, background: r.done ? 'var(--ok-soft)' : urgent ? 'var(--accent-soft)' : 'var(--surface)', border: `1px solid ${r.done ? 'rgba(16,185,129,.3)' : urgent ? 'rgba(251,109,76,.3)' : 'var(--line)'}` }}>
        <span style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'grid', placeItems: 'center', background: r.done ? 'rgba(16,185,129,.14)' : urgent ? 'var(--accent-soft)' : 'var(--teal-soft)', color: r.done ? 'var(--ok)' : urgent ? 'var(--accent-strong)' : 'var(--teal)', opacity: r.done ? 0.7 : 1 }}><Ic d={r.icon} s={18} /></span>
        <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', font: '700 14px var(--f-ui)', color: r.done ? 'var(--muted)' : 'var(--ink)', textDecoration: r.done ? 'line-through' : 'none' }}>{r.title}</span><span style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{r.sub}</span></span>
        {r.done
          ? <span style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'var(--ok)' }}><Ic d={CI.check} s={14} c="#fff" sw={3} /></span>
          : r.onAction
            ? <button type="button" className="cab-mcard" onClick={r.onAction} style={actionBtnStyle}>{r.action}</button>
            : r.manual
              ? <button type="button" className="cab-mcard" onClick={() => { markDone(r); if (r.href) router.push(r.href) }} style={actionBtnStyle}>{r.action}</button>
              : <Link href={r.href || '#'} className="cab-mcard" style={actionBtnStyle}>{r.action}</Link>}
      </div>
    )
  }

  // ── Payments section body (amounts due → pay · payment method · manage) — shared desktop + mobile ──
  const paymentsBody = () => (
    <>
      {payDue.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {payDue.map((b) => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 14, background: 'var(--accent-soft)', border: '1px solid rgba(251,109,76,.28)' }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'rgba(251,109,76,.16)', color: 'var(--accent-strong)' }}><Ic d={CI.card} s={18} /></span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ font: '700 14px var(--f-ui)', color: 'var(--ink)' }}>{b.car.brand} {b.car.model}</div><div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{b.number} · {c.paymentPending}</div></div>
              <Link href="/account/payments" className="cab-mcard" style={actionBtnStyle}>{c.actPay}</Link>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 15px', borderRadius: 14, background: 'var(--ok-soft)', border: '1px solid rgba(16,185,129,.22)' }}>
          <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--ok)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Ic d={CI.check} s={16} c="#fff" sw={3} /></span>
          <div><div style={{ font: '700 14px var(--f-ui)', color: 'var(--ok)' }}>{c.allPaid}</div><div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{c.allPaidSub}</div></div>
        </div>
      )}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 15, padding: 18, color: '#fff', background: 'linear-gradient(120deg,#0f2a3d,#0b4f52)', boxShadow: '0 14px 30px -18px rgba(6,33,38,.8)', marginTop: 14 }}>
        <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle,rgba(45,212,191,.35),transparent 65%)', filter: 'blur(14px)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ width: 34, height: 24, borderRadius: 5, background: 'linear-gradient(135deg,#f5b400,#e59400)' }} /><span style={{ font: '11px var(--f-mono)', letterSpacing: '.1em', color: 'rgba(255,255,255,.7)' }}>{c.noCard}</span></div>
        <div style={{ position: 'relative', font: '15px var(--f-mono)', letterSpacing: '.14em', marginTop: 20, color: 'rgba(255,255,255,.55)' }}>•••• •••• •••• ••••</div>
        <div style={{ position: 'relative', marginTop: 14, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.75)' }}>{c.noCardSub}</div>
      </div>
      <Link href="/account/payment-methods" className="cab-mcard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, padding: 12, borderRadius: 12, border: '1.5px dashed var(--line)', background: 'var(--surface)', color: 'var(--teal-700)', font: '700 13.5px var(--f-ui)' }}><Ic d={CI.plus} s={16} c="currentColor" sw={2} />{c.addCard}</Link>
      <Link href="/account/payments" className="cab-mcard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, padding: 12, borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', font: '700 13.5px var(--f-ui)' }}>{c.manageAll}<Ic d={<path d="m9 18 6-6-6-6" />} s={13} c="currentColor" sw={2.2} /></Link>
      <p style={{ fontSize: 11.5, color: 'var(--muted-2)', margin: '13px 0 0', lineHeight: 1.5 }}>{c.payNote} {c.depositHeld}</p>
    </>
  )

  // ── documents (real) + verification banner ──
  const vBanner = verification.verified
    ? { icon: CI.check, title: t.verified, color: 'var(--ok)', bg: 'var(--ok-soft)', bd: 'rgba(16,185,129,.22)' }
    : verification.anyPending
      ? { icon: CI.clock, title: t.underReview, color: '#b7791f', bg: 'rgba(245,180,0,.14)', bd: 'rgba(245,180,0,.3)' }
      : { icon: CI.upload, title: t.rejected, color: 'var(--accent-strong)', bg: 'rgba(251,109,76,.11)', bd: 'rgba(251,109,76,.25)' }

  const navItems: { id: string; label: string; icon: ReactNode; trailing?: ReactNode }[] = [
    { id: 'c-overview', label: c.navOverview, icon: CI.grid },
    { id: 'c-bookings', label: c.navBookings, icon: CI.cal, trailing: <span style={{ font: '600 11px var(--f-mono)', padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#fff' }}>{bookings.length}</span> },
    { id: 'c-documents', label: c.navDocuments, icon: CI.file, trailing: <span style={{ width: 8, height: 8, borderRadius: '50%', background: verification.verified ? 'var(--ok)' : 'var(--gold)', boxShadow: '0 0 8px currentColor' }} /> },
    { id: 'c-payments', label: c.navPayments, icon: CI.card },
    { id: 'c-places', label: c.navPlaces, icon: CI.pin },
    { id: 'c-support', label: c.navSupport, icon: CI.headset },
  ]

  const rootStyle = {
    '--av-bg': '#eef6f5',
  } as CSSProperties

  const carThumb = (car: AccountCar, w: number, h: number, glyph = 30) => (
    <span style={{ position: 'relative', width: w, height: h, borderRadius: 12, overflow: 'hidden', background: 'linear-gradient(135deg,#0b4f52,#0a3438)', flexShrink: 0, display: 'grid', placeItems: 'center', border: '1px solid rgba(255,255,255,.12)', ...carThumbBg(car.coverUrl) }}>
      {!car.coverUrl && <Ic d={CI.car} s={glyph} c="rgba(255,255,255,.72)" sw={1.5} />}
    </span>
  )

  // ═══════════════════════ MOBILE — 5-tab native-style app ═══════════════════════
  if (isMobile) {
    const HOUSE = (<><path d="M3 9.5 12 3l9 6.5" /><path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" /><path d="M9 21v-6h6v6" /></>)
    const mtabs: { k: typeof tab; label: string; icon: ReactNode }[] = [
      { k: 'home', label: c.mHome, icon: HOUSE },
      { k: 'trips', label: c.mTrips, icon: CI.car },
      { k: 'docs', label: c.mDocs, icon: CI.file },
      { k: 'payments', label: c.mPayments, icon: CI.card },
    ]
    const mHead = (eyebrow: string, title: string) => (
      <header style={{ position: 'relative', overflow: 'hidden', padding: 'calc(env(safe-area-inset-top,0px) + 38px) 20px 24px', background: 'linear-gradient(135deg,#0b5457,#083a3e)', color: '#fff' }}>
        <div className="cab-orb cab-orb1" style={{ top: '-40%', right: '-10%', width: 200, height: 200, background: 'radial-gradient(circle,rgba(45,212,191,.34),transparent 62%)', filter: 'blur(24px)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ font: '600 10px var(--f-mono)', letterSpacing: '.18em', textTransform: 'uppercase', color: '#67e3d3' }}>{eyebrow}</div>
          <h1 style={{ font: '700 26px/1.05 var(--f-display)', letterSpacing: '-.02em', margin: '6px 0 0' }}>{title}</h1>
        </div>
      </header>
    )
    return (
      <div className="cab cabm" style={rootStyle}>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={CAB_FONTS} />
        <style dangerouslySetInnerHTML={{ __html: CAB_CSS }} />

        <div className="cab-mscroll">
          <div className="cab-mview" key={tab}>
            {emailUnverified && <div style={{ padding: '14px 16px 0' }}><VerifyEmailBanner email={user.email} /></div>}

            {tab === 'home' && (
              <>
                <header style={{ position: 'relative', overflow: 'hidden', padding: 'calc(env(safe-area-inset-top,0px) + 40px) 20px 58px', background: 'radial-gradient(130% 120% at 78% 4%,#0f7173 0%,#0a4247 48%,#05191d 100%)', color: '#fff' }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg,rgba(255,255,255,.045) 0 1.5px,transparent 1.5px 22px)', opacity: 0.55, pointerEvents: 'none' }} />
                  <div className="cab-orb cab-orb1" style={{ top: '-18%', right: '-16%', width: 250, height: 250, background: 'radial-gradient(circle,rgba(45,212,191,.46),transparent 62%)', filter: 'blur(26px)' }} />
                  <div className="cab-orb cab-orb2" style={{ bottom: '-30%', left: '-20%', width: 230, height: 230, background: 'radial-gradient(circle,rgba(251,109,76,.3),transparent 64%)', filter: 'blur(30px)' }} />
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ position: 'relative', width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg,var(--accent),var(--accent-strong))', display: 'grid', placeItems: 'center', color: '#fff', font: '700 20px var(--f-display)', flexShrink: 0, boxShadow: '0 10px 22px -10px var(--accent)' }}>{initial}<span style={{ position: 'absolute', right: -3, bottom: -3, width: 15, height: 15, borderRadius: '50%', background: 'var(--gold)', border: '2.5px solid #093a3e' }} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: '600 10px var(--f-mono)', letterSpacing: '.18em', textTransform: 'uppercase', color: '#67e3d3' }}>{t.kicker}</div>
                      <div style={{ font: '700 20px/1.1 var(--f-display)', color: '#fff', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.hi} {firstName}</div>
                    </div>
                    <button type="button" onClick={() => setTab('support')} title={c.mSupport} aria-label={c.mSupport} style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.16)', display: 'grid', placeItems: 'center', color: '#fff', cursor: 'pointer', flexShrink: 0 }}><Ic d={CI.headset} s={19} c="#fff" sw={1.9} /></button>
                    <button type="button" style={{ position: 'relative', width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.16)', display: 'grid', placeItems: 'center', color: '#fff', cursor: 'pointer', flexShrink: 0 }}><Ic d={CI.bell} s={19} c="#fff" sw={1.9} /><span style={{ position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', border: '2px solid #0a4247' }} /></button>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, marginTop: 20 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 999, background: 'linear-gradient(120deg,rgba(245,180,0,.24),rgba(245,180,0,.12))', border: '1px solid rgba(245,180,0,.4)', color: 'var(--gold)', font: '700 13px var(--f-display)' }}><Ic d={CI.star} s={14} c="var(--gold)" fill="var(--gold)" sw={0} />{tierName}</span>
                    <span style={{ marginLeft: 'auto', display: 'inline-flex' }}><LangToggle glass /></span>
                  </div>
                </header>

                <div style={{ padding: '0 16px 22px', marginTop: -40, position: 'relative', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* active rental */}
                  {heroBooking ? (() => {
                    const ss = statusStyle(heroBooking.status as BookingStatus)
                    return (
                      <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, boxShadow: '0 18px 44px -26px rgba(6,33,38,.6)' }}>
                        <div style={{ height: 5, background: ss.stripe }} />
                        <div style={{ padding: 18 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                            <span style={{ font: '600 10.5px var(--f-mono)', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>{isInRental ? t.activeRental : t.nextBooking}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: ss.bg, color: ss.color, font: '600 10.5px var(--f-mono)' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: ss.dot }} />{t.statusLabels[heroBooking.status as BookingStatus]}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginTop: 14 }}>
                            {carThumb(heroBooking.car, 74, 54, 26)}
                            <div style={{ minWidth: 0 }}><h3 style={{ font: '700 17px var(--f-display)', color: 'var(--ink)', margin: 0 }}>{heroBooking.car.brand} {heroBooking.car.model}</h3><div style={{ font: '11px var(--f-mono)', color: 'var(--muted-2)', marginTop: 2 }}>{heroBooking.number}</div></div>
                          </div>
                          <div style={{ marginTop: 15, padding: '13px 14px', borderRadius: 14, background: 'linear-gradient(120deg,var(--teal-soft),rgba(13,148,136,.02))', border: '1px solid rgba(13,148,136,.16)' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}><span style={{ fontSize: 12, color: 'var(--teal-700)', fontWeight: 600 }}>{isInRental ? c.returnsIn : t.startsOn}</span><span style={{ font: '700 24px var(--f-display)', color: 'var(--ink)', lineHeight: 1 }}>{heroDaysLeft}</span><span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600 }}>{c.daysUnit}</span></div>
                            <div style={{ position: 'relative', height: 8, borderRadius: 999, background: 'rgba(13,148,136,.15)', marginTop: 11, overflow: 'hidden' }}><div style={{ height: '100%', width: `${isInRental ? heroPct : 6}%`, borderRadius: 999, background: 'linear-gradient(90deg,var(--teal),var(--teal-bright))', transition: 'width 1.4s cubic-bezier(.16,.84,.34,1)' }} /></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, fontSize: 11, color: 'var(--muted)' }}><span>{fmtDate(heroBooking.startAt)} · {c.pickedUp}</span><span>{fmtDate(heroBooking.endAt)} · {c.returnLbl}</span></div>
                          </div>
                          <div style={{ display: 'flex', gap: 9, marginTop: 15 }}>
                            <Link href={`/success?b=${encodeURIComponent(heroBooking.number)}`} className="cab-mcard" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, border: '1.5px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', font: '700 14px var(--f-display)' }}>{t.open}</Link>
                            <Link href={`/success?b=${encodeURIComponent(heroBooking.number)}`} className="cab-mcard" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 12, borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', font: '700 14px var(--f-display)', boxShadow: '0 12px 24px -12px var(--accent)' }}><Ic d={CI.file} s={14} c="#fff" sw={1.9} />{t.contract}</Link>
                          </div>
                        </div>
                      </div>
                    )
                  })() : (
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, padding: '22px 18px', textAlign: 'center', boxShadow: '0 18px 44px -26px rgba(6,33,38,.6)' }}>
                      <div style={{ font: '700 16px var(--f-display)', color: 'var(--ink)' }}>{t.noActive}</div>
                      <Link href="/catalog" className="cab-mcard" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 12, padding: '11px 18px', borderRadius: 12, background: 'var(--accent)', color: '#fff', font: '700 14px var(--f-display)' }}>{t.bookNew}<Ic d={CI.arrow} s={14} c="#fff" sw={2.2} /></Link>
                    </div>
                  )}

                  {/* quick rebook */}
                  {favouriteCar && (
                    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, padding: 18, color: '#fff', background: 'linear-gradient(140deg,#0f7173,#0b5457 55%,#083a3e)', boxShadow: '0 18px 44px -28px rgba(6,33,38,.7)' }}>
                      <div className="cab-orb cab-orb1" style={{ top: '-40%', right: '-14%', width: 210, height: 210, background: 'radial-gradient(circle,rgba(45,212,191,.4),transparent 62%)', filter: 'blur(24px)' }} />
                      <div style={{ position: 'relative' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, font: '600 10px var(--f-mono)', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--teal-bright)' }}><Ic d={CI.refresh} s={12} c="var(--teal-bright)" sw={2.2} />{t.rebookKicker}</span>
                        <div style={{ marginTop: 12 }}><div style={{ font: '700 16px var(--f-display)' }}>{favouriteCar.brand} {favouriteCar.model}</div><div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.72)', marginTop: 2 }}>€{favouriteCar.pricePerDay}{t.perDay} · {lastPickupCity || t.pickupDefault}</div></div>
                        <Link href="/catalog" className="cab-mcard" style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 15, padding: 13, borderRadius: 12, background: 'var(--accent)', color: '#fff', font: '700 14.5px var(--f-display)', boxShadow: '0 12px 24px -12px var(--accent)' }}><span className="cab-sheen" /><span style={{ position: 'relative' }}>{t.bookAgain}</span><Ic d={CI.arrow} s={15} c="#fff" sw={2.2} /></Link>
                      </div>
                    </div>
                  )}

                  {/* stats 2×2 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
                    {([[CI.car, 'var(--teal-soft)', 'var(--teal)', String(tripCount), c.statTrips], [CI.card, 'var(--accent-soft)', 'var(--accent-strong)', money0(spendTotal), c.statSpend], [CI.star, 'rgba(245,180,0,.14)', '#b7791f', loyaltyPoints.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US'), c.statPoints], [CI.clock, 'var(--teal-soft)', 'var(--teal)', String(daysTotal), c.statDays]] as [ReactNode, string, string, string, string][]).map(([ic, tint, ink, val, lbl], i) => (
                      <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '15px 15px 13px', boxShadow: '0 1px 2px rgba(6,33,38,.04)' }}>
                        <span style={{ width: 34, height: 34, borderRadius: 10, background: tint, color: ink, display: 'grid', placeItems: 'center' }}><Ic d={ic} s={17} sw={1.7} /></span>
                        <div style={{ font: '700 26px/1 var(--f-display)', color: 'var(--ink)', marginTop: 12 }}>{val}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5, fontWeight: 500 }}>{lbl}</div>
                      </div>
                    ))}
                  </div>

                  {/* loyalty */}
                  <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(120deg,#0b5457,#083a3e)', borderRadius: 18, padding: 18, color: '#fff' }}>
                    <div style={{ position: 'absolute', top: '-40%', right: '4%', width: 190, height: 190, borderRadius: '50%', background: 'radial-gradient(circle,rgba(245,180,0,.26),transparent 64%)', filter: 'blur(18px)', pointerEvents: 'none' }} />
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <span style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245,180,0,.16)', color: 'var(--gold)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Ic d={CI.star} s={20} c="var(--gold)" fill="var(--gold)" sw={0} /></span>
                        <div><div style={{ font: '700 15px var(--f-display)' }}>{c.loyMember(tierName)}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,.72)', marginTop: 1 }}>{nextTier ? c.loyNext(pointsToNext, nextTier) : c.loyMax}</div></div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}><div style={{ font: '700 17px var(--f-display)' }}>{loyaltyPoints.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)' }}>{c.loyOf(loyaltyTarget)}</div></div>
                    </div>
                    <div style={{ position: 'relative', height: 9, borderRadius: 999, background: 'rgba(255,255,255,.14)', marginTop: 14, overflow: 'hidden' }}><div style={{ height: '100%', width: `${loyaltyPct}%`, borderRadius: 999, background: 'linear-gradient(90deg,var(--gold),#ffd766)', boxShadow: '0 0 14px rgba(245,180,0,.6)', transition: 'width 1.5s cubic-bezier(.16,.84,.34,1)' }} /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, font: '9.5px var(--f-mono)', letterSpacing: '.06em', color: 'rgba(255,255,255,.55)' }}><span>{c.tierSilver}</span><span style={{ color: 'var(--gold)' }}>● {c.tierGold}</span><span>{c.tierPlat}</span></div>
                  </div>

                  {/* reminders — each has an action button; turns green when its task resolves, gone next day */}
                  {shownReminders.length > 0 && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '0 2px' }}>
                        <h2 style={{ font: '700 19px var(--f-display)', letterSpacing: '-.02em', color: 'var(--ink)', margin: 0 }}>{c.thingsToDo}</h2>
                        <span style={{ display: 'inline-grid', placeItems: 'center', minWidth: 24, height: 24, padding: '0 8px', borderRadius: 999, background: 'var(--accent-soft)', color: 'var(--accent-strong)', font: '600 11.5px var(--f-mono)' }}>{openTodos}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {shownReminders.map(reminderCard)}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {tab === 'trips' && (
              <>
                {mHead(c.navBookings, t.history)}
                <div style={{ padding: '16px 16px 22px' }}>
                  <Link href="/catalog" className="cab-mcard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14, padding: 13, borderRadius: 13, background: 'var(--accent)', color: '#fff', font: '700 14.5px var(--f-display)', boxShadow: '0 12px 24px -12px var(--accent)' }}><Ic d={CI.plus} s={16} c="#fff" sw={2.2} />{c.bookNewCar}</Link>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -16px 16px', padding: '0 16px 2px' }}>
                    {tabs.map((tb) => {
                      const on = filter === tb.key
                      return <button key={tb.key} type="button" onClick={() => setFilter(tb.key)} style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 999, cursor: 'pointer', border: `1px solid ${on ? 'var(--teal)' : 'var(--line)'}`, background: on ? 'var(--teal-soft)' : 'var(--surface)', color: on ? 'var(--teal-700)' : 'var(--muted)', font: '700 12.5px var(--f-ui)', whiteSpace: 'nowrap' }}>{tb.label}<span style={{ font: '600 10.5px var(--f-mono)', padding: '1px 6px', borderRadius: 999, background: on ? 'var(--teal)' : 'var(--bg-2)', color: on ? '#fff' : 'var(--muted-2)' }}>{tabCount(tb.key)}</span></button>
                    })}
                  </div>
                  {shownBookings.length === 0 ? (
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '28px 18px', textAlign: 'center', color: 'var(--muted)', font: '500 13.5px var(--f-ui)' }}>{t.noBookings}</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                      {shownBookings.map((b) => {
                        const ss = statusStyle(b.status as BookingStatus)
                        return (
                          <div key={b.id} style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '14px 15px 14px 16px', boxShadow: '0 1px 2px rgba(6,33,38,.03)' }}>
                            <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: ss.stripe }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              {carThumb(b.car, 58, 44, 22)}
                              <div style={{ minWidth: 0, flex: 1 }}><div style={{ font: '700 15px var(--f-display)', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.car.brand} {b.car.model}</div><div style={{ font: '10.5px var(--f-mono)', letterSpacing: '.04em', color: 'var(--muted-2)', marginTop: 3 }}>{b.number}</div></div>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 999, background: ss.bg, color: ss.color, font: '600 10px var(--f-mono)', flexShrink: 0 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: ss.dot }} />{t.statusLabels[b.status as BookingStatus]}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 13, paddingTop: 13, borderTop: '1px solid var(--line)' }}>
                              <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{fmtRange(b.startAt, b.endAt)} · <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{money(b.subtotal, b.currency)}</span></div>
                              <Link href={`/success?b=${encodeURIComponent(b.number)}`} className="cab-mcard" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 10, border: '1.5px solid var(--line)', background: 'var(--surface)', color: 'var(--teal-700)', font: '700 12.5px var(--f-ui)', whiteSpace: 'nowrap', flexShrink: 0 }}>{t.details}<Ic d={<path d="m9 18 6-6-6-6" />} s={13} c="currentColor" sw={2.2} /></Link>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {tab === 'docs' && (
              <>
                {mHead(c.mDocs, t.docs)}
                <div style={{ padding: 16 }}>
                  {verification.anySubmitted && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 15px', borderRadius: 14, background: vBanner.bg, border: `1px solid ${vBanner.bd}`, marginBottom: 14 }}>
                      <span style={{ width: 30, height: 30, borderRadius: '50%', background: vBanner.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Ic d={vBanner.icon} s={16} c="#fff" sw={3} /></span>
                      <span style={{ font: '700 14px var(--f-ui)', color: vBanner.color }}>{vBanner.title}</span>
                    </div>
                  )}
                  {documents.length === 0 ? (
                    <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>{t.noDocs}</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {documents.map((d) => {
                        const st = docStatusText(d.status, t)
                        return (
                          <a key={d.id} href={`/api/documents/${d.id}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 14, border: '1px solid var(--line)', background: 'var(--surface)' }}>
                            <span style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--teal-soft)', color: 'var(--teal)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Ic d={CI.file} s={19} sw={1.7} /></span>
                            <span style={{ flex: 1, font: '600 14px var(--f-ui)', color: 'var(--ink)' }}>{(DOC_LABELS[lang] ?? DOC_LABELS.en)[d.type] ?? d.type}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: '700 12px var(--f-ui)', color: st.color }}>{st.mark === '✓' ? <Ic d={CI.check} s={13} c="currentColor" sw={3} /> : st.mark} {st.label}</span>
                          </a>
                        )
                      })}
                    </div>
                  )}
                  <Link href="/account/documents" className="cab-mcard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, padding: 13, borderRadius: 12, border: '1.5px dashed var(--line)', background: 'var(--surface)', color: 'var(--teal-700)', font: '700 13.5px var(--f-ui)' }}><Ic d={CI.upload} s={16} c="currentColor" sw={2} />{t.update}</Link>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 14, fontSize: 11.5, color: 'var(--muted-2)', lineHeight: 1.5 }}><Ic d={CI.shield} s={14} c="currentColor" sw={1.8} /><span>{t.encrypted}</span></div>
                </div>
              </>
            )}

            {tab === 'payments' && (
              <>
                {mHead(c.mPayments, t.payments)}
                <div style={{ padding: 16 }}>
                  {paymentsBody()}
                </div>
              </>
            )}

            {tab === 'support' && (
              <>
                {mHead(c.mSupport, t.manager)}
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 18, padding: 18, background: 'linear-gradient(155deg,#fff2ee,#ffe4dc)', border: '1px solid rgba(251,109,76,.2)' }}>
                    <div className="cab-orb cab-orb1" style={{ top: '-20%', right: '-10%', width: 150, height: 150, background: 'radial-gradient(circle,rgba(251,109,76,.24),transparent 64%)', filter: 'blur(20px)' }} />
                    <div style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                        <span style={{ position: 'relative', width: 54, height: 54, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent-strong))', display: 'grid', placeItems: 'center', color: '#fff', font: '700 21px var(--f-display)', flexShrink: 0 }}>A<span style={{ position: 'absolute', right: 0, bottom: 1, width: 14, height: 14, borderRadius: '50%', background: 'var(--ok)', border: '2.5px solid #ffe9e2' }} /></span>
                        <div><div style={{ font: '700 18px var(--f-display)', color: 'var(--ink)' }}>AVENTA</div><div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent-strong)', fontWeight: 600, marginTop: 2 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ok)' }} />{c.mgrOnline}</div></div>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.55, margin: '14px 0 0' }}>{c.mgrDesc}</p>
                      <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
                        <a href="https://wa.me/905000000000" target="_blank" rel="noopener noreferrer" className="cab-mcard" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1, padding: 12, borderRadius: 12, background: '#25d366', color: '#fff', font: '700 13.5px var(--f-display)' }}><Ic d={CI.wa} s={16} c="#fff" sw={1.9} />WhatsApp</a>
                        <a href="https://t.me/+905000000000" target="_blank" rel="noopener noreferrer" className="cab-mcard" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1, padding: 12, borderRadius: 12, background: '#229ed9', color: '#fff', font: '700 13.5px var(--f-display)' }}><Ic d={CI.tg} s={16} c="#fff" sw={1.9} />Telegram</a>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18, padding: 16 }}>
                    <div style={{ marginBottom: 12, font: '600 10.5px var(--f-mono)', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)' }}>{c.navPlaces} · {c.directions}</div>
                    <SavedPlaces provider={mapProvider} apiKey={mapApiKey} offices={offices.map((o) => ({ id: o.id, name: o.name, address: o.address, city: o.city, lat: o.lat, lng: o.lng }))} places={savedPlaces} />
                  </div>

                  <div style={{ background: '#04181b', borderRadius: 18, padding: 20, color: 'rgba(255,255,255,.72)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent)', display: 'grid', placeItems: 'center', color: '#fff', font: '700 16px var(--f-display)' }}>A</span><span style={{ font: '700 17px var(--f-display)', letterSpacing: '.14em', color: '#fff' }}>AVENTA</span></div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.7, marginTop: 14 }}>Antalya, Türkiye · Airport AYT<br /><a href="tel:+905000000000" style={{ color: '#fff', fontWeight: 600 }}>+90 500 000 00 00</a><br /><a href="mailto:hello@aventa.rent" style={{ color: 'var(--teal-bright)' }}>hello@aventa.rent</a></div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 14, color: 'var(--teal-bright)', font: '11px var(--f-mono)', letterSpacing: '.06em' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />{c.support247}</div>
                    <form action={logoutAction}><button type="submit" className="cab-mcard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 18, padding: 13, borderRadius: 12, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)', color: '#fff', font: '700 14px var(--f-display)', cursor: 'pointer' }}><Ic d={CI.out} s={15} c="#fff" sw={1.9} />{t.logout}</button></form>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* bottom tab bar */}
        <nav className="cab-tabbar" style={{ gridTemplateColumns: `repeat(${mtabs.length},1fr)` }}>
          {mtabs.map((m) => {
            const on = tab === m.k
            return (
              <button key={m.k} type="button" className="cab-tab" onClick={() => setTab(m.k)} aria-current={on ? 'page' : undefined}>
                <span style={{ position: 'absolute', top: 0, width: 5, height: 5, borderRadius: '50%', background: on ? 'var(--accent)' : 'transparent', boxShadow: on ? '0 0 8px var(--accent)' : 'none' }} />
                <Ic d={m.icon} s={23} c={on ? 'var(--accent)' : 'rgba(255,255,255,.6)'} sw={1.9} />
                <span style={{ font: '700 10px var(--f-ui)', color: on ? 'var(--accent)' : 'rgba(255,255,255,.55)' }}>{m.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    )
  }

  return (
    <div className={`cab${navOpen ? ' nav-open' : ''}`} style={rootStyle}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={CAB_FONTS} />
      <style dangerouslySetInnerHTML={{ __html: CAB_CSS }} />
      <div className="cab-scrim" onClick={() => setNavOpen(false)} />

      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside className="cab-side" style={{ display: 'flex', flexDirection: 'column', padding: '22px 18px', color: '#fff', background: 'linear-gradient(176deg,#0b5457 0%,#083a3e 46%,#052024 100%)' }}>
        <div className="cab-orb cab-orb1" style={{ top: '-6%', right: '-30%', width: 280, height: 280, background: 'radial-gradient(circle,rgba(45,212,191,.34),transparent 62%)', filter: 'blur(28px)' }} />
        <div className="cab-orb cab-orb2" style={{ bottom: '6%', left: '-34%', width: 260, height: 260, background: 'radial-gradient(circle,rgba(251,109,76,.24),transparent 62%)', filter: 'blur(30px)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg,rgba(255,255,255,.04) 0 1.5px,transparent 1.5px 22px)', opacity: 0.6, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 6px 2px' }}>
            <span style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--accent)', display: 'grid', placeItems: 'center', color: '#fff', font: '700 20px var(--f-display)', boxShadow: '0 10px 22px -8px var(--accent)' }}>A</span>
            <span style={{ font: '700 21px var(--f-display)', letterSpacing: '.17em', color: '#fff' }}>AVENTA</span>
          </Link>
          <div style={{ margin: '24px 6px 14px', height: 1, background: 'rgba(255,255,255,.12)' }} />
          <span style={{ padding: '0 8px', font: '600 10px var(--f-mono)', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.42)' }}>{c.menu}</span>
          <nav style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 3, marginTop: 12, paddingLeft: 18 }}>
            {navItems.map((n) => <NavItem key={n.id} id={n.id} label={n.label} icon={n.icon} active={activeSec === n.id} trailing={n.trailing} onNav={onNav} />)}
          </nav>
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link href="/catalog" className="cab-cta" style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '13px 16px', borderRadius: 13, background: 'var(--accent)', color: '#fff', font: '700 14.5px var(--f-display)', boxShadow: '0 14px 28px -12px var(--accent)' }}>
              <span className="cab-sheen" /><span style={{ position: 'relative' }}>{c.chooseCar}</span><Ic d={CI.arrow} s={16} c="#fff" sw={2.2} />
            </Link>
            <div style={{ height: 1, background: 'rgba(255,255,255,.12)', margin: '2px 6px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '6px 6px' }}>
              <span style={{ position: 'relative', width: 40, height: 40, borderRadius: 13, background: 'linear-gradient(135deg,var(--accent),var(--accent-strong))', display: 'grid', placeItems: 'center', color: '#fff', font: '700 16px var(--f-display)', flexShrink: 0 }}>{initial}<span style={{ position: 'absolute', right: -2, bottom: -2, width: 13, height: 13, borderRadius: '50%', background: 'var(--gold)', border: '2px solid #083a3e' }} /></span>
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ font: '700 14px var(--f-display)', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fullName}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '10.5px var(--f-mono)', letterSpacing: '.08em', color: 'var(--gold)' }}><Ic d={CI.star} s={11} c="var(--gold)" fill="var(--gold)" sw={0} />{tierName.toUpperCase()}</span>
              </span>
              <form action={logoutAction} style={{ marginLeft: 'auto', display: 'flex' }}>
                <button type="submit" title={t.logout} style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.6)', background: 'rgba(255,255,255,.06)', border: 'none', cursor: 'pointer' }}><Ic d={CI.out} s={17} c="currentColor" sw={1.9} /></button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══════════ MAIN ═══════════ */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* TOP BAR */}
        <header style={{ position: 'sticky', top: 0, zIndex: 60, display: 'flex', alignItems: 'center', gap: 14, padding: '13px 26px', background: 'rgba(238,246,245,.82)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid var(--line)' }}>
          <button className="cab-burger" onClick={() => setNavOpen(true)} style={{ width: 42, height: 42, borderRadius: 11, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><Ic d={CI.menu} s={20} sw={1.9} /></button>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ font: '600 10.5px var(--f-mono)', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>{t.kicker}</span>
            <span style={{ font: '700 16px var(--f-display)', color: 'var(--ink)', lineHeight: 1.1 }}>{c.overview}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
            {!isMobile && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', border: '1px solid var(--line)', borderRadius: 11, background: 'var(--surface)', width: 210 }}>
                <Ic d={CI.search} s={16} c="var(--muted-2)" sw={2} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={c.searchPh} style={{ border: 'none', background: 'transparent', outline: 'none', font: '13.5px var(--f-ui)', color: 'var(--ink)', width: '100%' }} />
              </label>
            )}
            <span style={{ display: 'inline-flex' }}><LangToggle glass={false} /></span>
          </div>
        </header>

        <main style={{ flex: 1, padding: 'clamp(20px,3vw,40px) clamp(18px,3vw,40px) 0' }}>
          {emailUnverified && <div style={{ marginBottom: 20 }}><VerifyEmailBanner email={user.email} /></div>}
          <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>

            {/* ══ OVERVIEW ══ */}
            <section id="c-overview" style={{ scrollMarginTop: 86 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                <div>
                  <span style={{ display: 'inline-block', font: '600 12px var(--f-mono)', letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--accent-strong)' }}>{t.kicker}</span>
                  <h1 style={{ font: '700 clamp(30px,4.4vw,50px)/1.02 var(--f-display)', letterSpacing: '-.025em', color: 'var(--ink)', margin: '12px 0 0' }}>{t.welcome('')}<span style={{ color: 'var(--teal-700)' }}>{firstName}</span></h1>
                  <p style={{ font: '15.5px/1.55 var(--f-ui)', color: 'var(--muted)', margin: '12px 0 0', maxWidth: 520 }}>{c.welSub}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 999, background: 'linear-gradient(120deg,#fff5d9,#ffe9b0)', border: '1px solid rgba(245,180,0,.4)', color: '#8a6400', font: '700 14px var(--f-display)' }}><Ic d={CI.star} s={16} c="#f5b400" fill="#f5b400" sw={0} />{tierName}</span>
                  <form action={logoutAction}><button type="submit" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 999, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', font: '600 14px var(--f-ui)', cursor: 'pointer', minHeight: isMobile ? 44 : undefined }}><Ic d={CI.out} s={15} sw={1.9} />{c.navOverview && t.logout}</button></form>
                </div>
              </div>

              {/* stat cards */}
              <div className="cab-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginTop: 28 }}>
                <StatCard icon={CI.car} tint="var(--teal-soft)" ink="var(--teal)" value={String(tripCount)} label={c.statTrips} />
                <StatCard icon={CI.card} tint="var(--accent-soft)" ink="var(--accent-strong)" value={money0(spendTotal)} label={c.statSpend} />
                <StatCard icon={CI.star} tint="rgba(245,180,0,.14)" ink="#b7791f" value={loyaltyPoints.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')} label={c.statPoints} />
                <StatCard icon={CI.clock} tint="var(--teal-soft)" ink="var(--teal)" value={String(daysTotal)} label={c.statDays} />
              </div>

              {/* loyalty band */}
              <div style={{ marginTop: 16, background: 'linear-gradient(120deg,#0b5457,#083a3e)', borderRadius: 18, padding: '22px 24px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-40%', right: '6%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,rgba(245,180,0,.28),transparent 64%)', filter: 'blur(20px)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                    <span style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(245,180,0,.16)', color: 'var(--gold)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Ic d={CI.star} s={22} c="var(--gold)" fill="var(--gold)" sw={0} /></span>
                    <div><div style={{ font: '700 17px var(--f-display)' }}>{c.loyMember(tierName)}</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,.72)', marginTop: 2 }}>{nextTier ? c.loyNext(pointsToNext, nextTier) : c.loyMax}</div></div>
                  </div>
                  <div style={{ textAlign: 'right' }}><div style={{ font: '700 22px var(--f-display)' }}>{loyaltyPoints.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')} <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', fontWeight: 500 }}>{c.loyOf(loyaltyTarget)}</span></div></div>
                </div>
                <div style={{ position: 'relative', height: 10, borderRadius: 999, background: 'rgba(255,255,255,.14)', marginTop: 16, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${loyaltyPct}%`, borderRadius: 999, background: 'linear-gradient(90deg,var(--gold),#ffd766)', boxShadow: '0 0 16px rgba(245,180,0,.6)', transition: 'width 1.4s cubic-bezier(.16,.84,.34,1)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9, font: '10.5px var(--f-mono)', letterSpacing: '.06em', color: 'rgba(255,255,255,.55)' }}><span>{c.tierSilver}</span><span style={{ color: 'var(--gold)' }}>● {c.tierGold}</span><span>{c.tierPlat}</span></div>
              </div>
            </section>

            {/* ══ HERO ROW: REBOOK + ACTIVE ══ */}
            <div className="cab-hero" style={{ display: 'grid', gridTemplateColumns: '1.08fr 1fr', gap: 18, marginTop: 18, alignItems: 'start' }}>
              {/* rebook */}
              <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, padding: 26, color: '#fff', background: 'linear-gradient(140deg,#0f7173 0%,#0b5457 52%,#083a3e 100%)', boxShadow: '0 1px 2px rgba(6,33,38,.06),0 26px 56px -34px rgba(6,33,38,.7)' }}>
                <div className="cab-orb cab-orb1" style={{ top: '-30%', right: '-12%', width: 280, height: 280, background: 'radial-gradient(circle,rgba(45,212,191,.4),transparent 62%)', filter: 'blur(26px)' }} />
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg,rgba(255,255,255,.045) 0 1.5px,transparent 1.5px 22px)', opacity: 0.6, pointerEvents: 'none' }} />
                <div style={{ position: 'relative' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: '600 11px var(--f-mono)', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--teal-bright)' }}><Ic d={CI.refresh} s={13} c="var(--teal-bright)" sw={2.2} />{t.rebookKicker}</span>
                  {favouriteCar ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginTop: 16 }}>
                        {carThumb(favouriteCar, 88, 64)}
                        <div><h2 style={{ font: '700 22px var(--f-display)', letterSpacing: '-.01em', margin: 0 }}>{favouriteCar.brand} {favouriteCar.model}</h2><div style={{ fontSize: 13.5, color: 'rgba(255,255,255,.72)', marginTop: 3 }}>€{favouriteCar.pricePerDay}{t.perDay} · {favouriteCar.clsLabel}</div></div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
                        <div style={{ padding: '11px 13px', borderRadius: 12, background: 'rgba(255,255,255,.09)', border: '1px solid rgba(255,255,255,.12)' }}><div style={{ font: '10px var(--f-mono)', letterSpacing: '.14em', color: 'rgba(255,255,255,.55)' }}>{t.dates}</div><div style={{ fontWeight: 700, fontSize: 14, marginTop: 3 }}>{bookings[0] ? fmtRange(bookings[0].startAt, bookings[0].endAt).replace(/ \d{4}$/, '') : '—'}</div></div>
                        <div style={{ padding: '11px 13px', borderRadius: 12, background: 'rgba(255,255,255,.09)', border: '1px solid rgba(255,255,255,.12)' }}><div style={{ font: '10px var(--f-mono)', letterSpacing: '.14em', color: 'rgba(255,255,255,.55)' }}>{t.pickup}</div><div style={{ fontWeight: 700, fontSize: 14, marginTop: 3 }}>{lastPickupCity || t.pickupDefault}</div></div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,.82)' }}><Ic d={CI.check} s={16} c="var(--teal-bright)" sw={2.4} />{t.prefilled}</div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                        <Link href="/catalog" className="cab-cta" style={{ position: 'relative', overflow: 'hidden', flex: '1 1 150px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '14px 18px', borderRadius: 13, background: 'var(--accent)', color: '#fff', font: '700 15px var(--f-display)', boxShadow: '0 14px 28px -12px var(--accent)' }}><span className="cab-sheen" /><span style={{ position: 'relative' }}>{t.bookAgain}</span><Ic d={CI.arrow} s={16} c="#fff" sw={2.2} /></Link>
                        <Link href="/catalog" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '14px 18px', borderRadius: 13, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.22)', color: '#fff', font: '700 14.5px var(--f-ui)' }}>{t.browseAll}</Link>
                      </div>
                    </>
                  ) : (
                    <div style={{ marginTop: 18 }}>
                      <h2 style={{ font: '700 22px var(--f-display)', margin: 0 }}>{t.startFirst}</h2>
                      <p style={{ fontSize: 14, color: 'rgba(255,255,255,.75)', margin: '8px 0 18px' }}>{t.firstSub}</p>
                      <Link href="/catalog" className="cab-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '14px 20px', borderRadius: 13, background: 'var(--accent)', color: '#fff', font: '700 15px var(--f-display)', boxShadow: '0 14px 28px -12px var(--accent)' }}>{t.bookNew}<Ic d={CI.arrow} s={16} c="#fff" sw={2.2} /></Link>
                    </div>
                  )}
                </div>
              </div>

              {/* active / next */}
              <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 22, boxShadow: '0 1px 2px rgba(6,33,38,.06),0 26px 56px -34px rgba(6,33,38,.55)' }}>
                <div style={{ height: 5, background: heroBooking ? statusStyle(heroBooking.status as BookingStatus).stripe : 'var(--line)' }} />
                <div style={{ padding: 24 }}>
                  {heroBooking ? (() => {
                    const ss = statusStyle(heroBooking.status as BookingStatus)
                    return (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                          <span style={{ font: '600 11px var(--f-mono)', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)' }}>{isInRental ? t.activeRental : t.nextBooking}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 999, background: ss.bg, color: ss.color, font: '600 11px var(--f-mono)' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: ss.dot, animation: isInRental ? 'cab-dot 1.8s ease-in-out infinite' : undefined }} />{t.statusLabels[heroBooking.status as BookingStatus]}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16 }}>
                          {carThumb(heroBooking.car, 84, 60, 28)}
                          <div><h3 style={{ font: '700 19px var(--f-display)', color: 'var(--ink)', margin: 0 }}>{heroBooking.car.brand} {heroBooking.car.model}</h3><div style={{ font: '11.5px var(--f-mono)', color: 'var(--muted-2)', marginTop: 3 }}>{heroBooking.number}</div></div>
                        </div>
                        <div style={{ marginTop: 18, padding: '15px 16px', borderRadius: 14, background: 'linear-gradient(120deg,var(--teal-soft),rgba(13,148,136,.02))', border: '1px solid rgba(13,148,136,.16)' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span style={{ fontSize: 12.5, color: 'var(--teal-700)', fontWeight: 600 }}>{isInRental ? c.returnsIn : t.startsOn}</span><span style={{ font: '700 26px var(--f-display)', color: 'var(--ink)', lineHeight: 1 }}>{heroDaysLeft}</span><span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{c.daysUnit}</span></div>
                          <div style={{ position: 'relative', height: 8, borderRadius: 999, background: 'rgba(13,148,136,.15)', marginTop: 12, overflow: 'hidden' }}><div style={{ height: '100%', width: `${isInRental ? heroPct : 6}%`, borderRadius: 999, background: 'linear-gradient(90deg,var(--teal),var(--teal-bright))', transition: 'width 1.4s cubic-bezier(.16,.84,.34,1)' }} /></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11.5, color: 'var(--muted)' }}><span>{fmtDate(heroBooking.startAt)} · {c.pickedUp}</span><span>{fmtDate(heroBooking.endAt)} · {c.returnLbl}</span></div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                          <Link href={`/success?b=${encodeURIComponent(heroBooking.number)}`} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 13, borderRadius: 12, border: '1.5px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', font: '700 14.5px var(--f-display)' }}>{t.open}</Link>
                          <Link href={`/success?b=${encodeURIComponent(heroBooking.number)}`} className="cab-cta" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 13, borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', font: '700 14.5px var(--f-display)', boxShadow: '0 12px 24px -12px var(--accent)' }}><Ic d={CI.file} s={15} c="#fff" sw={1.9} />{t.contract}</Link>
                        </div>
                      </>
                    )
                  })() : (
                    <div style={{ textAlign: 'center', padding: '20px 6px' }}>
                      <div style={{ font: '700 17px var(--f-display)', color: 'var(--ink)' }}>{t.noActive}</div>
                      <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '6px 0 16px' }}>{t.noActiveSub}</p>
                      <Link href="/catalog" className="cab-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, background: 'var(--accent)', color: '#fff', font: '700 14px var(--f-display)' }}>{t.bookNew}<Ic d={CI.arrow} s={15} c="#fff" sw={2.2} /></Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ══ REMINDERS — action button per task; green when it resolves, gone the next day ══ */}
            {shownReminders.length > 0 && (
              <section style={{ marginTop: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <h2 style={{ font: '700 clamp(20px,2.2vw,26px) var(--f-display)', letterSpacing: '-.02em', color: 'var(--ink)', margin: 0 }}>{c.thingsToDo}</h2>
                  <span style={{ display: 'inline-grid', placeItems: 'center', minWidth: 26, height: 26, padding: '0 8px', borderRadius: 999, background: 'var(--accent-soft)', color: 'var(--accent-strong)', font: '600 12px var(--f-mono)' }}>{openTodos}</span>
                </div>
                <div className="cab-rem" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                  {shownReminders.map(reminderCard)}
                </div>
              </section>
            )}

            {/* ══ BOOKING HISTORY ══ */}
            <section id="c-bookings" style={{ marginTop: 34, scrollMarginTop: 86 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                <div>
                  <span style={{ display: 'inline-block', font: '600 12px var(--f-mono)', letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--accent-strong)' }}>{c.navBookings}</span>
                  <h2 style={{ font: '700 clamp(22px,2.6vw,32px) var(--f-display)', letterSpacing: '-.02em', color: 'var(--ink)', margin: '10px 0 0' }}>{t.history}</h2>
                </div>
                <Link href="/catalog" className="cab-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 12, background: 'var(--accent)', color: '#fff', font: '700 13.5px var(--f-display)', boxShadow: '0 12px 24px -12px var(--accent)' }}><Ic d={CI.plus} s={15} c="#fff" sw={2.2} />{c.bookNewCar}</Link>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {tabs.map((tb) => {
                  const on = filter === tb.key
                  return (
                    <button key={tb.key} type="button" onClick={() => setFilter(tb.key)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 999, cursor: 'pointer', border: `1px solid ${on ? 'var(--teal)' : 'var(--line)'}`, background: on ? 'var(--teal-soft)' : 'var(--surface)', color: on ? 'var(--teal-700)' : 'var(--muted)', font: '700 13px var(--f-ui)' }}>{tb.label}<span style={{ font: '600 11px var(--f-mono)', padding: '1px 7px', borderRadius: 999, background: on ? 'var(--teal)' : 'var(--bg-2)', color: on ? '#fff' : 'var(--muted-2)' }}>{tabCount(tb.key)}</span></button>
                  )
                })}
              </div>
              {shownBookings.length === 0 ? (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '32px 20px', textAlign: 'center', color: 'var(--muted)', font: '500 14px var(--f-ui)' }}>{t.noBookings}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {shownBookings.map((b) => {
                    const ss = statusStyle(b.status as BookingStatus)
                    return (
                      <div key={b.id} className="cab-row" style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 16, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '14px 18px 14px 15px', boxShadow: '0 1px 2px rgba(6,33,38,.03)' }}>
                        <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: ss.stripe }} />
                        {carThumb(b.car, 66, 48, 24)}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}><span style={{ font: '700 15.5px var(--f-display)', color: 'var(--ink)' }}>{b.car.brand} {b.car.model}</span><span style={{ font: '10.5px var(--f-mono)', letterSpacing: '.06em', color: 'var(--muted-2)' }}>{b.number}</span></div>
                          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{fmtRange(b.startAt, b.endAt)} · <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{money(b.subtotal, b.currency)}</span></div>
                        </div>
                        {!isMobile && <span className="cab-hide-narrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 999, background: ss.bg, color: ss.color, font: '600 11px var(--f-mono)' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: ss.dot }} />{t.statusLabels[b.status as BookingStatus]}</span>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <Link href={`/success?b=${encodeURIComponent(b.number)}`} style={{ padding: '9px 15px', borderRadius: 11, border: '1.5px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', font: '700 13px var(--f-ui)', whiteSpace: 'nowrap' }}>{t.details}</Link>
                          {!isMobile && <Link href={`/success?b=${encodeURIComponent(b.number)}`} className="cab-cta" style={{ padding: '9px 15px', borderRadius: 11, border: 'none', background: 'var(--accent)', color: '#fff', font: '700 13px var(--f-ui)', whiteSpace: 'nowrap', boxShadow: '0 10px 20px -12px var(--accent)' }}>{t.contract}</Link>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* ══ DETAILS GRID: documents · payments · manager ══ */}
            <div className="cab-details" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, marginTop: 34, alignItems: 'start' }}>
              {/* documents */}
              <section id="c-documents" style={{ scrollMarginTop: 86, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, padding: 22, boxShadow: '0 1px 2px rgba(6,33,38,.04),0 22px 50px -34px rgba(6,33,38,.5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ font: '600 11px var(--f-mono)', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)' }}>{t.docs}</span>
                  <Link href="/account/documents" style={{ color: 'var(--teal-700)', font: '700 13px var(--f-ui)' }}>{t.update}</Link>
                </div>
                {verification.anySubmitted && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, background: vBanner.bg, border: `1px solid ${vBanner.bd}`, marginBottom: 14 }}>
                    <span style={{ width: 26, height: 26, borderRadius: '50%', background: vBanner.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Ic d={vBanner.icon} s={15} c="#fff" sw={3} /></span>
                    <span style={{ font: '700 13.5px var(--f-ui)', color: vBanner.color }}>{vBanner.title}</span>
                  </div>
                )}
                {documents.length === 0 ? (
                  <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>{t.noDocs}</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {documents.map((d) => {
                      const st = docStatusText(d.status, t)
                      return (
                        <a key={d.id} href={`/api/documents/${d.id}`} target="_blank" rel="noopener noreferrer" className="cab-docrow" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 12, border: '1px solid var(--line)', background: 'linear-gradient(180deg,#fbfdfc,#fff)' }}>
                          <Ic d={CI.file} s={17} c="var(--muted)" sw={1.7} />
                          <span style={{ flex: 1, font: '600 13.5px var(--f-ui)', color: 'var(--ink)' }}>{(DOC_LABELS[lang] ?? DOC_LABELS.en)[d.type] ?? d.type}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: '700 11.5px var(--f-ui)', color: st.color }}>{st.mark === '✓' ? <Ic d={CI.check} s={13} c="currentColor" sw={3} /> : st.mark} {st.label}</span>
                        </a>
                      )
                    })}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 14, fontSize: 11.5, color: 'var(--muted-2)', lineHeight: 1.5 }}><Ic d={CI.shield} s={14} c="currentColor" sw={1.8} /><span>{t.encrypted}</span></div>
              </section>

              {/* payments — honest (no fake card) */}
              <section id="c-payments" style={{ scrollMarginTop: 86, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, padding: 22, boxShadow: '0 1px 2px rgba(6,33,38,.04),0 22px 50px -34px rgba(6,33,38,.5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ font: '600 11px var(--f-mono)', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)' }}>{t.payments}</span>
                  <Link href="/account/payment-methods" style={{ color: 'var(--teal-700)', font: '700 13px var(--f-ui)' }}>{t.manage}</Link>
                </div>
                {paymentsBody()}
              </section>

              {/* manager */}
              <section id="c-support" style={{ scrollMarginTop: 86, position: 'relative', overflow: 'hidden', borderRadius: 20, padding: 22, background: 'linear-gradient(155deg,#fff2ee,#ffe4dc)', border: '1px solid rgba(251,109,76,.2)', boxShadow: '0 1px 2px rgba(6,33,38,.04),0 22px 50px -34px rgba(239,92,58,.5)' }}>
                <div className="cab-orb cab-orb1" style={{ top: '-20%', right: '-10%', width: 170, height: 170, background: 'radial-gradient(circle,rgba(251,109,76,.24),transparent 64%)', filter: 'blur(20px)' }} />
                <div style={{ position: 'relative' }}>
                  <span style={{ font: '600 11px var(--f-mono)', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--accent-strong)' }}>{t.manager}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16 }}>
                    <span style={{ position: 'relative', width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent-strong))', display: 'grid', placeItems: 'center', color: '#fff', font: '700 22px var(--f-display)', flexShrink: 0 }}>A<span style={{ position: 'absolute', right: 0, bottom: 1, width: 14, height: 14, borderRadius: '50%', background: 'var(--ok)', border: '2.5px solid #ffe9e2' }} /></span>
                    <div><div style={{ font: '700 19px var(--f-display)', color: 'var(--ink)' }}>AVENTA</div><div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--accent-strong)', fontWeight: 600, marginTop: 2 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ok)' }} />{c.mgrOnline}</div></div>
                  </div>
                  <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.55, margin: '16px 0 0' }}>{c.mgrDesc}</p>
                  <div style={{ display: 'flex', gap: 9, marginTop: 16 }}>
                    <a href="https://wa.me/905000000000" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1, padding: 12, borderRadius: 12, background: '#25d366', color: '#fff', font: '700 13.5px var(--f-display)', boxShadow: '0 10px 22px -12px #25d366' }}><Ic d={CI.wa} s={16} c="#fff" sw={1.9} />WhatsApp</a>
                    <a href="https://t.me/+905000000000" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1, padding: 12, borderRadius: 12, background: '#229ed9', color: '#fff', font: '700 13.5px var(--f-display)', boxShadow: '0 10px 22px -12px #229ed9' }}><Ic d={CI.tg} s={16} c="#fff" sw={1.9} />Telegram</a>
                  </div>
                </div>
              </section>
            </div>

            {/* ══ PLACES & MAP ══ */}
            <section id="c-places" style={{ marginTop: 34, scrollMarginTop: 86 }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, padding: 22, boxShadow: '0 1px 2px rgba(6,33,38,.04),0 22px 50px -34px rgba(6,33,38,.5)' }}>
                <div style={{ marginBottom: 16 }}><span style={{ font: '600 11px var(--f-mono)', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)' }}>{c.navPlaces} · {c.directions}</span></div>
                <SavedPlaces
                  provider={mapProvider}
                  apiKey={mapApiKey}
                  offices={offices.map((o) => ({ id: o.id, name: o.name, address: o.address, city: o.city, lat: o.lat, lng: o.lng }))}
                  places={savedPlaces}
                />
              </div>
            </section>

            <div style={{ height: 44 }} />
          </div>
        </main>

        <ClientFooter />
      </div>
    </div>
  )
}
