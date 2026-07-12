import type { BookingStatus } from '@prisma/client'
import type { Lang } from '@/i18n/lang'

/**
 * SINGLE SOURCE OF TRUTH for the booking lifecycle: RU labels, pill colours, the ordered
 * lifecycle, and — most importantly — the valid status transitions. Enforced server-side in
 * `setBookingStatus` AND consumed by every UI that changes status (the order-detail control and
 * the kanban board), so there is exactly ONE rulebook for "what move is allowed", not two.
 *
 * Pure + isomorphic (only a type import) so it runs on the server (the action) and the client
 * (Admin.tsx, KanbanBoard.tsx) identically.
 */

/** Pill colour family used by the admin StatusPill + kanban/stepper surfaces. */
export type StatusKind = 'green' | 'blue' | 'amber' | 'gold' | 'grey' | 'red'

/** Full status label per UI language (admin was RU-first; now all five languages). */
export const BOOKING_STATUS_LABELS: Record<Lang, Record<BookingStatus, string>> = {
  ru: { NEW: 'Новая заявка', AWAITING_CONFIRMATION: 'Ожидает подтверждения', AWAITING_PAYMENT: 'Ожидает оплаты', CONFIRMED: 'Подтверждена', PREPARING: 'Подготовка', DELIVERED: 'Авто доставлено', ACTIVE: 'Аренда активна', RETURNED: 'Возвращена', CLOSED: 'Закрыта', CANCELLED: 'Отменена' },
  en: { NEW: 'New request', AWAITING_CONFIRMATION: 'Awaiting confirmation', AWAITING_PAYMENT: 'Awaiting payment', CONFIRMED: 'Confirmed', PREPARING: 'Preparing', DELIVERED: 'Car delivered', ACTIVE: 'Rental active', RETURNED: 'Returned', CLOSED: 'Closed', CANCELLED: 'Cancelled' },
  tr: { NEW: 'Yeni talep', AWAITING_CONFIRMATION: 'Onay bekliyor', AWAITING_PAYMENT: 'Ödeme bekliyor', CONFIRMED: 'Onaylandı', PREPARING: 'Hazırlanıyor', DELIVERED: 'Araç teslim edildi', ACTIVE: 'Kiralama aktif', RETURNED: 'İade edildi', CLOSED: 'Kapatıldı', CANCELLED: 'İptal edildi' },
  es: { NEW: 'Nueva solicitud', AWAITING_CONFIRMATION: 'Pendiente de confirmación', AWAITING_PAYMENT: 'Pendiente de pago', CONFIRMED: 'Confirmada', PREPARING: 'En preparación', DELIVERED: 'Coche entregado', ACTIVE: 'Alquiler activo', RETURNED: 'Devuelto', CLOSED: 'Cerrada', CANCELLED: 'Cancelada' },
  de: { NEW: 'Neue Anfrage', AWAITING_CONFIRMATION: 'Wartet auf Bestätigung', AWAITING_PAYMENT: 'Wartet auf Zahlung', CONFIRMED: 'Bestätigt', PREPARING: 'In Vorbereitung', DELIVERED: 'Fahrzeug geliefert', ACTIVE: 'Miete aktiv', RETURNED: 'Zurückgegeben', CLOSED: 'Abgeschlossen', CANCELLED: 'Storniert' },
}

/** Short status label for tight spots (kanban column headers, stepper nodes). */
export const BOOKING_STATUS_SHORT_LABELS: Record<Lang, Record<BookingStatus, string>> = {
  ru: { NEW: 'Новая', AWAITING_CONFIRMATION: 'Ожидает подтв.', AWAITING_PAYMENT: 'Ожидает оплаты', CONFIRMED: 'Подтверждена', PREPARING: 'Подготовка', DELIVERED: 'Доставлено', ACTIVE: 'Активна', RETURNED: 'Возвращена', CLOSED: 'Закрыта', CANCELLED: 'Отменена' },
  en: { NEW: 'New', AWAITING_CONFIRMATION: 'To confirm', AWAITING_PAYMENT: 'To pay', CONFIRMED: 'Confirmed', PREPARING: 'Preparing', DELIVERED: 'Delivered', ACTIVE: 'Active', RETURNED: 'Returned', CLOSED: 'Closed', CANCELLED: 'Cancelled' },
  tr: { NEW: 'Yeni', AWAITING_CONFIRMATION: 'Onay bekl.', AWAITING_PAYMENT: 'Ödeme bekl.', CONFIRMED: 'Onaylı', PREPARING: 'Hazırlık', DELIVERED: 'Teslim', ACTIVE: 'Aktif', RETURNED: 'İade', CLOSED: 'Kapalı', CANCELLED: 'İptal' },
  es: { NEW: 'Nueva', AWAITING_CONFIRMATION: 'Confirmar', AWAITING_PAYMENT: 'Cobro', CONFIRMED: 'Confirmada', PREPARING: 'Preparación', DELIVERED: 'Entregado', ACTIVE: 'Activo', RETURNED: 'Devuelto', CLOSED: 'Cerrada', CANCELLED: 'Cancelada' },
  de: { NEW: 'Neu', AWAITING_CONFIRMATION: 'Bestätigen', AWAITING_PAYMENT: 'Zahlung', CONFIRMED: 'Bestätigt', PREPARING: 'Vorbereitung', DELIVERED: 'Geliefert', ACTIVE: 'Aktiv', RETURNED: 'Zurück', CLOSED: 'Geschlossen', CANCELLED: 'Storniert' },
}

/**
 * Active-voice label for the button that ADVANCES an order INTO this status — says what the click
 * does, while the resulting state is statusLabel(target, lang). Used by the order-detail control.
 */
export const STATUS_ACTION_LABELS: Record<Lang, Record<BookingStatus, string>> = {
  ru: { NEW: 'Вернуть в новые', AWAITING_CONFIRMATION: 'Отправить на подтверждение', AWAITING_PAYMENT: 'Выставить на оплату', CONFIRMED: 'Подтвердить заявку', PREPARING: 'Начать подготовку', DELIVERED: 'Отметить доставку авто', ACTIVE: 'Начать аренду', RETURNED: 'Принять возврат', CLOSED: 'Закрыть заявку', CANCELLED: 'Отменить заявку' },
  en: { NEW: 'Move back to new', AWAITING_CONFIRMATION: 'Send for confirmation', AWAITING_PAYMENT: 'Request payment', CONFIRMED: 'Confirm booking', PREPARING: 'Start preparation', DELIVERED: 'Mark car delivered', ACTIVE: 'Start rental', RETURNED: 'Accept return', CLOSED: 'Close booking', CANCELLED: 'Cancel booking' },
  tr: { NEW: 'Yeniye geri al', AWAITING_CONFIRMATION: 'Onaya gönder', AWAITING_PAYMENT: 'Ödemeye çıkar', CONFIRMED: 'Talebi onayla', PREPARING: 'Hazırlığa başla', DELIVERED: 'Teslimatı işaretle', ACTIVE: 'Kiralamayı başlat', RETURNED: 'İadeyi al', CLOSED: 'Talebi kapat', CANCELLED: 'Talebi iptal et' },
  es: { NEW: 'Volver a nueva', AWAITING_CONFIRMATION: 'Enviar a confirmación', AWAITING_PAYMENT: 'Solicitar pago', CONFIRMED: 'Confirmar reserva', PREPARING: 'Iniciar preparación', DELIVERED: 'Marcar entregado', ACTIVE: 'Iniciar alquiler', RETURNED: 'Aceptar devolución', CLOSED: 'Cerrar reserva', CANCELLED: 'Cancelar reserva' },
  de: { NEW: 'Zurück zu Neu', AWAITING_CONFIRMATION: 'Zur Bestätigung senden', AWAITING_PAYMENT: 'Zur Zahlung stellen', CONFIRMED: 'Buchung bestätigen', PREPARING: 'Vorbereitung starten', DELIVERED: 'Als geliefert markieren', ACTIVE: 'Miete starten', RETURNED: 'Rückgabe annehmen', CLOSED: 'Buchung abschließen', CANCELLED: 'Buchung stornieren' },
}

/** Localized full status label (falls back to English). */
export function statusLabel(s: BookingStatus, lang: Lang): string {
  return (BOOKING_STATUS_LABELS[lang] ?? BOOKING_STATUS_LABELS.en)[s]
}
/** Localized short status label for tight spots. */
export function statusShort(s: BookingStatus, lang: Lang): string {
  return (BOOKING_STATUS_SHORT_LABELS[lang] ?? BOOKING_STATUS_SHORT_LABELS.en)[s]
}
/** Localized advance-into-status action verb. */
export function statusAction(s: BookingStatus, lang: Lang): string {
  return (STATUS_ACTION_LABELS[lang] ?? STATUS_ACTION_LABELS.en)[s]
}

/** Back-compat RU maps — used by the one server action error message pending server-side i18n. */
export const BOOKING_STATUS_RU = BOOKING_STATUS_LABELS.ru
export const BOOKING_STATUS_SHORT = BOOKING_STATUS_SHORT_LABELS.ru
export const STATUS_ACTION_RU = STATUS_ACTION_LABELS.ru

export const BOOKING_STATUS_KIND: Record<BookingStatus, StatusKind> = {
  NEW: 'gold',
  AWAITING_CONFIRMATION: 'amber',
  AWAITING_PAYMENT: 'amber',
  CONFIRMED: 'blue',
  PREPARING: 'blue',
  DELIVERED: 'blue',
  ACTIVE: 'green',
  RETURNED: 'grey',
  CLOSED: 'grey',
  CANCELLED: 'red',
}

/** Hex accents per kind — for surfaces that render their own chips (kanban, stepper, status hero). */
export const KIND_COLORS: Record<StatusKind, { text: string; dot: string; bg: string; border: string }> = {
  green: { text: '#8FD7AD', dot: '#6FBF8F', bg: 'rgba(111,191,143,.14)', border: 'rgba(111,191,143,.30)' },
  blue: { text: '#A6BEF2', dot: '#4E7FE0', bg: 'rgba(78,127,224,.14)', border: 'rgba(78,127,224,.30)' },
  amber: { text: '#ECC481', dot: '#E0A23E', bg: 'rgba(224,162,62,.14)', border: 'rgba(224,162,62,.32)' },
  gold: { text: '#FFB48A', dot: '#FF7A5C', bg: 'rgba(255,122,92,.14)', border: 'rgba(255,122,92,.34)' },
  grey: { text: '#9CB0CB', dot: '#5b6f8a', bg: 'rgba(255,255,255,.05)', border: 'rgba(255,255,255,.12)' },
  red: { text: '#E58A8A', dot: '#CE4A4A', bg: 'rgba(206,74,74,.14)', border: 'rgba(206,74,74,.32)' },
}

/** The linear rental lifecycle. CANCELLED is an exit branch, not part of the line. */
export const BOOKING_LIFECYCLE: BookingStatus[] = [
  'NEW',
  'AWAITING_CONFIRMATION',
  'AWAITING_PAYMENT',
  'CONFIRMED',
  'PREPARING',
  'DELIVERED',
  'ACTIVE',
  'RETURNED',
  'CLOSED',
]

/** Lifecycle + CANCELLED — for kanban columns and any full-list dropdown. */
export const BOOKING_STATUS_ALL: BookingStatus[] = [...BOOKING_LIFECYCLE, 'CANCELLED']

/**
 * THE valid transitions. Forward one step along the lifecycle, plus CANCELLED — but only while the
 * car is still with us (NEW…PREPARING); once DELIVERED/ACTIVE the car is out, so the only way out is
 * RETURNED → CLOSED, never a cancel. CLOSED and CANCELLED are terminal. This forbids every illogical
 * jump from the scrambled history (e.g. CLOSED → ACTIVE, NEW → RETURNED).
 */
export const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  NEW: ['AWAITING_CONFIRMATION', 'CANCELLED'],
  AWAITING_CONFIRMATION: ['AWAITING_PAYMENT', 'CANCELLED'],
  AWAITING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['ACTIVE'],
  ACTIVE: ['RETURNED'],
  RETURNED: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
}

/** Is `to` a valid next status from `from`? (Same-status is not a transition.) */
export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  if (from === to) return false
  return ALLOWED_TRANSITIONS[from].includes(to)
}

/** The logical forward next step(s) — the primary action(s). Excludes CANCELLED. */
export function nextStatuses(from: BookingStatus): BookingStatus[] {
  return ALLOWED_TRANSITIONS[from].filter((s) => s !== 'CANCELLED')
}

/** May this order be cancelled from its current status? */
export function canCancel(from: BookingStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes('CANCELLED')
}

/** No outgoing transitions (CLOSED / CANCELLED). */
export function isTerminal(from: BookingStatus): boolean {
  return ALLOWED_TRANSITIONS[from].length === 0
}
