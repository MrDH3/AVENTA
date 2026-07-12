'use client'

import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import type { BookingStatus, PaymentMethod, PaymentKind, PaymentStatus } from '@prisma/client'
import { useDict, useLang, type Dict, type Lang } from '@/i18n/lang'
import { formatMoney } from '@/lib/money'
import LangToggle from '@/components/LangToggle'
import { useIsMobile } from '@/components/useIsMobile'
import { PaymentPanel, type PayPanelBooking } from './Success'
import type { PayBooking, PayHistoryRow } from '@/app/account/payments/page'
import type { SuccessBankDetails } from '@/app/success/page'

/**
 * Customer Payments surface. Shows what each booking owes (total / paid / balance + the security
 * deposit), lets the customer pay the outstanding balance by reusing the exact booking payment
 * components (<PaymentPanel>: Stripe card + bank/crypto declaration), and lists payment history.
 * Mobile-first; the bottom tab-bar renders its own in-flow spacer so nothing is hidden behind it.
 */

interface Strings {
  kicker: string
  title: string
  sub: string
  allSettled: string
  allSettledSub: string
  outstanding: string
  total: string
  paid: string
  balance: string
  deposit: string
  depositHint: string
  payNow: string
  hide: string
  historyTitle: string
  noHistory: string
  booking: string
  statusLabels: Record<BookingStatus, string>
  methodLabels: Record<PaymentMethod, string>
  kindLabels: Record<PaymentKind, string>
  payStatusLabels: Record<PaymentStatus, string>
}

const dict: Dict<Strings> = {
  ru: {
    kicker: 'ОПЛАТА',
    title: 'Платежи',
    sub: 'Всё, что нужно оплатить, и история платежей — в одном месте.',
    allSettled: 'Всё оплачено',
    allSettledSub: 'Сейчас нет задолженностей по вашим бронированиям.',
    outstanding: 'К оплате',
    total: 'Итого',
    paid: 'Оплачено',
    balance: 'Остаток',
    deposit: 'Залог',
    depositHint: 'Возвращается после аренды. Не списывается сейчас.',
    payNow: 'Оплатить',
    hide: 'Скрыть оплату',
    historyTitle: 'История платежей',
    noHistory: 'Платежей пока нет.',
    booking: 'Бронь',
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
    methodLabels: {
      CARD_STRIPE: 'Карта',
      CARD_PAYPAL: 'PayPal',
      BANK_TRANSFER: 'Банковский перевод',
      CRYPTO: 'Криптовалюта',
      CASH: 'Наличные',
      MANUAL: 'Вручную',
    },
    kindLabels: {
      RENT: 'Аренда',
      DEPOSIT: 'Залог',
      PREPAY: 'Предоплата',
      BALANCE: 'Остаток',
      FULL: 'Полная оплата',
    },
    payStatusLabels: {
      NOT_PAID: 'Не оплачено',
      AWAITING: 'Ожидает подтверждения',
      PARTIAL: 'Частично',
      PAID: 'Оплачено',
      DEPOSIT_HELD: 'Залог удержан',
      DEPOSIT_RETURNED: 'Залог возвращён',
      ERROR: 'Ошибка',
      CANCELLED: 'Отменён',
    },
  },
  en: {
    kicker: 'PAYMENTS',
    title: 'Payments',
    sub: 'Everything you owe, and your payment history, in one place.',
    allSettled: 'All settled',
    allSettledSub: 'There is nothing outstanding on your bookings right now.',
    outstanding: 'Outstanding',
    total: 'Total',
    paid: 'Paid',
    balance: 'Balance',
    deposit: 'Security deposit',
    depositHint: 'Refunded after the rental. Not charged now.',
    payNow: 'Pay now',
    hide: 'Hide payment',
    historyTitle: 'Payment history',
    noHistory: 'No payments yet.',
    booking: 'Booking',
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
    methodLabels: {
      CARD_STRIPE: 'Card',
      CARD_PAYPAL: 'PayPal',
      BANK_TRANSFER: 'Bank transfer',
      CRYPTO: 'Crypto',
      CASH: 'Cash',
      MANUAL: 'Manual',
    },
    kindLabels: {
      RENT: 'Rent',
      DEPOSIT: 'Deposit',
      PREPAY: 'Prepayment',
      BALANCE: 'Balance',
      FULL: 'Full payment',
    },
    payStatusLabels: {
      NOT_PAID: 'Not paid',
      AWAITING: 'Awaiting confirmation',
      PARTIAL: 'Partial',
      PAID: 'Paid',
      DEPOSIT_HELD: 'Deposit held',
      DEPOSIT_RETURNED: 'Deposit returned',
      ERROR: 'Error',
      CANCELLED: 'Cancelled',
    },
  },
  tr: {
    kicker: 'ÖDEMELER',
    title: 'Ödemeler',
    sub: 'Ödemeniz gereken her şey ve ödeme geçmişiniz tek bir yerde.',
    allSettled: 'Her şey ödendi',
    allSettledSub: 'Şu anda rezervasyonlarınızda ödenmemiş bir tutar yok.',
    outstanding: 'Ödenecek tutar',
    total: 'Toplam',
    paid: 'Ödendi',
    balance: 'Kalan',
    deposit: 'Güvence bedeli',
    depositHint: 'Kiralama sonrası iade edilir. Şu anda tahsil edilmez.',
    payNow: 'Şimdi öde',
    hide: 'Ödemeyi gizle',
    historyTitle: 'Ödeme geçmişi',
    noHistory: 'Henüz ödeme yok.',
    booking: 'Rezervasyon',
    statusLabels: {
      NEW: 'Yeni',
      AWAITING_CONFIRMATION: 'Onay bekliyor',
      AWAITING_PAYMENT: 'Ödeme bekliyor',
      CONFIRMED: 'Onaylandı',
      PREPARING: 'Hazırlanıyor',
      DELIVERED: 'Teslim edildi',
      ACTIVE: 'Kirada',
      RETURNED: 'İade edildi',
      CLOSED: 'Tamamlandı',
      CANCELLED: 'İptal edildi',
    },
    methodLabels: {
      CARD_STRIPE: 'Kart',
      CARD_PAYPAL: 'PayPal',
      BANK_TRANSFER: 'Banka havalesi',
      CRYPTO: 'Kripto',
      CASH: 'Nakit',
      MANUAL: 'Manuel',
    },
    kindLabels: {
      RENT: 'Kira',
      DEPOSIT: 'Depozito',
      PREPAY: 'Ön ödeme',
      BALANCE: 'Kalan',
      FULL: 'Tam ödeme',
    },
    payStatusLabels: {
      NOT_PAID: 'Ödenmedi',
      AWAITING: 'Onay bekliyor',
      PARTIAL: 'Kısmi',
      PAID: 'Ödendi',
      DEPOSIT_HELD: 'Depozito tutuldu',
      DEPOSIT_RETURNED: 'Depozito iade edildi',
      ERROR: 'Hata',
      CANCELLED: 'İptal edildi',
    },
  },
  es: {
    kicker: 'PAGOS',
    title: 'Pagos',
    sub: 'Todo lo que debes y tu historial de pagos, en un solo lugar.',
    allSettled: 'Todo pagado',
    allSettledSub: 'Ahora mismo no tienes nada pendiente en tus reservas.',
    outstanding: 'Pendiente',
    total: 'Total',
    paid: 'Pagado',
    balance: 'Saldo',
    deposit: 'Fianza',
    depositHint: 'Se reembolsa tras el alquiler. No se cobra ahora.',
    payNow: 'Pagar ahora',
    hide: 'Ocultar pago',
    historyTitle: 'Historial de pagos',
    noHistory: 'Aún no hay pagos.',
    booking: 'Reserva',
    statusLabels: {
      NEW: 'Nueva',
      AWAITING_CONFIRMATION: 'Pendiente de confirmación',
      AWAITING_PAYMENT: 'Pendiente de pago',
      CONFIRMED: 'Confirmada',
      PREPARING: 'En preparación',
      DELIVERED: 'Entregada',
      ACTIVE: 'Activa',
      RETURNED: 'Devuelta',
      CLOSED: 'Completada',
      CANCELLED: 'Cancelada',
    },
    methodLabels: {
      CARD_STRIPE: 'Tarjeta',
      CARD_PAYPAL: 'PayPal',
      BANK_TRANSFER: 'Transferencia bancaria',
      CRYPTO: 'Cripto',
      CASH: 'Efectivo',
      MANUAL: 'Manual',
    },
    kindLabels: {
      RENT: 'Alquiler',
      DEPOSIT: 'Depósito',
      PREPAY: 'Anticipo',
      BALANCE: 'Saldo',
      FULL: 'Pago completo',
    },
    payStatusLabels: {
      NOT_PAID: 'No pagado',
      AWAITING: 'Pendiente de confirmación',
      PARTIAL: 'Parcial',
      PAID: 'Pagado',
      DEPOSIT_HELD: 'Fianza retenida',
      DEPOSIT_RETURNED: 'Fianza devuelta',
      ERROR: 'Error',
      CANCELLED: 'Cancelado',
    },
  },
  de: {
    kicker: 'ZAHLUNGEN',
    title: 'Zahlungen',
    sub: 'Alles, was Sie schulden, und Ihr Zahlungsverlauf – an einem Ort.',
    allSettled: 'Alles beglichen',
    allSettledSub: 'Für Ihre Buchungen ist derzeit nichts offen.',
    outstanding: 'Offener Betrag',
    total: 'Gesamt',
    paid: 'Bezahlt',
    balance: 'Restbetrag',
    deposit: 'Kaution',
    depositHint: 'Wird nach der Miete erstattet. Jetzt keine Belastung.',
    payNow: 'Jetzt bezahlen',
    hide: 'Zahlung ausblenden',
    historyTitle: 'Zahlungsverlauf',
    noHistory: 'Noch keine Zahlungen.',
    booking: 'Buchung',
    statusLabels: {
      NEW: 'Neu',
      AWAITING_CONFIRMATION: 'Bestätigung ausstehend',
      AWAITING_PAYMENT: 'Zahlung ausstehend',
      CONFIRMED: 'Bestätigt',
      PREPARING: 'In Vorbereitung',
      DELIVERED: 'Übergeben',
      ACTIVE: 'Aktiv',
      RETURNED: 'Zurückgegeben',
      CLOSED: 'Abgeschlossen',
      CANCELLED: 'Storniert',
    },
    methodLabels: {
      CARD_STRIPE: 'Karte',
      CARD_PAYPAL: 'PayPal',
      BANK_TRANSFER: 'Banküberweisung',
      CRYPTO: 'Krypto',
      CASH: 'Bar',
      MANUAL: 'Manuell',
    },
    kindLabels: {
      RENT: 'Miete',
      DEPOSIT: 'Kaution',
      PREPAY: 'Anzahlung',
      BALANCE: 'Restbetrag',
      FULL: 'Vollständige Zahlung',
    },
    payStatusLabels: {
      NOT_PAID: 'Nicht bezahlt',
      AWAITING: 'Bestätigung ausstehend',
      PARTIAL: 'Teilweise',
      PAID: 'Bezahlt',
      DEPOSIT_HELD: 'Kaution hinterlegt',
      DEPOSIT_RETURNED: 'Kaution erstattet',
      ERROR: 'Fehler',
      CANCELLED: 'Storniert',
    },
  },
}

/** Tone (bg/fg) for a payment status pill — cabinet palette. */
function payTone(s: PaymentStatus): { bg: string; fg: string } {
  switch (s) {
    case 'PAID':
    case 'DEPOSIT_RETURNED':
      return { bg: 'var(--ok-soft)', fg: 'var(--ok)' }
    case 'PARTIAL':
    case 'DEPOSIT_HELD':
      return { bg: 'var(--teal-soft)', fg: 'var(--teal-700)' }
    case 'AWAITING':
      return { bg: 'rgba(245,180,0,.14)', fg: '#b7791f' }
    case 'ERROR':
      return { bg: 'rgba(251,109,76,.11)', fg: 'var(--accent-strong)' }
    default:
      return { bg: 'var(--bg-2)', fg: 'var(--muted)' }
  }
}

function fmtDate(iso: string, lang: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const PAY_FONTS =
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap'
const PAY_CSS = `
.paymob input:focus,.paymob select:focus,.paymob textarea:focus{border-color:#0d9488 !important;box-shadow:0 0 0 4px rgba(13,148,136,.10) !important}
.paymob .pay-cta{transition:transform .18s,background .2s,box-shadow .2s}
.paymob .pay-cta:hover{transform:translateY(-2px);background:var(--accent-strong);box-shadow:0 18px 34px -12px var(--accent-strong)}
.paymob .pay-cta:active{transform:translateY(0)}
.paymob .pay-lift{transition:transform .25s cubic-bezier(.2,.7,.3,1),box-shadow .25s,border-color .25s}
.paymob .pay-lift:hover{box-shadow:0 22px 50px -34px rgba(6,33,38,.55)}
.paymob .pay-back:hover{color:var(--accent-strong)}
`
// Cabinet design tokens + fonts, scoped to `.paymob` so this page matches the redesigned cabinet.
const wrapStyle = {
  '--f-display': "'Space Grotesk',system-ui,sans-serif",
  '--f-ui': "'Manrope',system-ui,sans-serif",
  '--f-mono': "'JetBrains Mono',ui-monospace,monospace",
  '--ink': '#0a2225', '--muted': '#5b7678', '--muted-2': '#8aa2a3', '--line': 'rgba(10,34,37,.10)',
  '--bg': '#eef6f5', '--bg-2': '#e7f1ef', '--surface': '#fff',
  '--teal': '#0d9488', '--teal-700': '#0f6d68', '--teal-deep': '#0b4f52', '--teal-soft': 'rgba(13,148,136,.1)',
  '--accent': '#fb6d4c', '--accent-strong': '#ef5c3a', '--accent-soft': 'rgba(251,109,76,.12)',
  '--ok': '#0f9d6f', '--ok-soft': 'rgba(16,185,129,.12)', '--gold': '#f5b400',
  // Renders inside the shared AccountShell (left sidebar) — a plain content wrapper, not a full page.
  background: 'transparent', color: 'var(--ink)', fontFamily: 'var(--f-ui)',
} as CSSProperties

const cabCard: CSSProperties = {
  borderRadius: 18,
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  boxShadow: '0 1px 2px rgba(6,33,38,.04),0 18px 40px -32px rgba(6,33,38,.5)',
}

// Standalone labels outside the main dictionary — read as `map[lang] ?? map.en` so a missing
// language can never render undefined. English is the source of truth for the translations.
const closeLabel: Record<Lang, string> = {
  ru: 'Закрыть',
  en: 'Close',
  tr: 'Kapat',
  es: 'Cerrar',
  de: 'Schließen',
}

export default function MyPayments({
  bookings,
  history,
  bank,
  cardEnabled,
}: {
  bookings: PayBooking[]
  history: PayHistoryRow[]
  bank: SuccessBankDetails | null
  cardEnabled: boolean
}) {
  const t = useDict(dict)
  const { lang } = useLang()
  const isMobile = useIsMobile()
  const [openId, setOpenId] = useState<string | null>(null)
  const [payTab, setPayTab] = useState<'due' | 'history'>('due')

  // Escape closes the payment modal; lock body scroll while it is open.
  useEffect(() => {
    if (!openId) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenId(null) }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [openId])

  const payable = bookings.filter((b) => b.payable)
  const totalOwed = payable.reduce((s, b) => s + b.balance, 0)
  // Only show an aggregate total when every payable booking shares a currency (summing across
  // currencies is meaningless); the per-booking rows still show what's owed in the mixed case.
  const sameCurrency = payable.length > 0 && payable.every((b) => b.currency === payable[0].currency)
  const owedMoney = sameCurrency ? formatMoney(totalOwed, payable[0].currency) : ''

  // ═══════════════════════ MOBILE — dedicated Payments app (seaside handoff) ═══════════════════════
  if (isMobile) {
    const dueCount = payable.length
    const mlAll: Record<string, { due: string; history: string; across: (n: number) => string; payAll: string; totalDue: string; secDeposit: string; securedNote: string; paidInFull: string; refunded: string }> = {
      en: { due: 'Due', history: 'History', across: (n) => `across ${n} booking${n === 1 ? '' : 's'}`, payAll: 'Pay all', totalDue: 'Total due', secDeposit: 'Security deposit', securedNote: 'Payments are secured by Stripe. The security deposit is refunded after the car is returned.', paidInFull: 'Paid in full', refunded: 'Refunded' },
      ru: { due: 'К оплате', history: 'История', across: (n) => `по ${n} бронир.`, payAll: 'Оплатить всё', totalDue: 'К оплате', secDeposit: 'Залог', securedNote: 'Платежи защищены Stripe. Залог возвращается после возврата авто.', paidInFull: 'Оплачено полностью', refunded: 'Возврат' },
      tr: { due: 'Ödenecek', history: 'Geçmiş', across: (n) => `${n} rezervasyon`, payAll: 'Tümünü öde', totalDue: 'Toplam borç', secDeposit: 'Depozito', securedNote: 'Ödemeler Stripe ile güvence altındadır. Depozito, araç iade edildikten sonra iade edilir.', paidInFull: 'Tamamı ödendi', refunded: 'İade edildi' },
      es: { due: 'A pagar', history: 'Historial', across: (n) => `en ${n} reserva${n === 1 ? '' : 's'}`, payAll: 'Pagar todo', totalDue: 'Total a pagar', secDeposit: 'Depósito', securedNote: 'Los pagos están protegidos por Stripe. El depósito se devuelve tras la entrega del coche.', paidInFull: 'Pagado por completo', refunded: 'Reembolsado' },
      de: { due: 'Offen', history: 'Verlauf', across: (n) => `über ${n} Buchung${n === 1 ? '' : 'en'}`, payAll: 'Alles zahlen', totalDue: 'Fällig gesamt', secDeposit: 'Kaution', securedNote: 'Zahlungen sind durch Stripe gesichert. Die Kaution wird nach Rückgabe des Autos erstattet.', paidInFull: 'Vollständig bezahlt', refunded: 'Erstattet' },
    }
    const ml = mlAll[lang] ?? mlAll.en
    const dateTag = (iso: string): string => {
      try { return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : lang === 'tr' ? 'tr-TR' : lang === 'es' ? 'es-ES' : lang === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'short' }).format(new Date(iso)) } catch { return '' }
    }
    const isRefund = (h: PayHistoryRow): boolean => h.status === 'DEPOSIT_RETURNED'
    const panelBooking = (() => { const b = bookings.find((x) => x.id === openId); return b ? { id: b.id, number: b.number, currency: b.currency, subtotal: b.balance, subtotalMoney: b.balanceMoney } as PayPanelBooking : null })()
    const openBooking = bookings.find((x) => x.id === openId) || null
    const seg = (on: boolean): CSSProperties => ({ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 0', border: 'none', borderRadius: 10, cursor: 'pointer', font: '600 13.5px var(--f-display)', transition: 'all .22s', ...(on ? { background: 'var(--accent)', color: '#fff', boxShadow: '0 8px 18px -8px var(--accent)' } : { background: 'transparent', color: 'var(--muted)' }) })

    return (
      <div className="paymob" style={{ ...wrapStyle, position: 'fixed', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', background: '#05191d' }}>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={PAY_FONTS} />
        <style dangerouslySetInnerHTML={{ __html: PAY_CSS }} />
        <style dangerouslySetInnerHTML={{ __html: `@keyframes pmFloat{0%,100%{transform:translate(0,0)}50%{transform:translate(-12px,14px)}}@keyframes pmFloatS{0%,100%{transform:translate(0,0)}50%{transform:translate(16px,-18px)}}@keyframes pmDot{0%,100%{opacity:1}50%{opacity:.4}}@keyframes pmSheen{0%{transform:translateX(-130%)}58%,100%{transform:translateX(360%)}}.pm-orb1{animation:pmFloat 15s ease-in-out infinite}.pm-orb2{animation:pmFloatS 18s ease-in-out infinite}.pm-dot{animation:pmDot 2s ease-in-out infinite}.pm-sheen{animation:pmSheen 3.8s ease-in-out infinite}.pm-sheet{transition:transform .42s cubic-bezier(.16,.84,.34,1)}.pm-press:active{transform:scale(.985)}@media(prefers-reduced-motion:reduce){.pm-orb1,.pm-orb2,.pm-dot,.pm-sheen{animation:none}}` }} />

        {/* ── scroll area ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
          {/* HERO */}
          <header style={{ position: 'relative', overflow: 'hidden', padding: '52px 20px 58px', background: 'radial-gradient(130% 120% at 80% 2%,#0f7173 0%,#0a4247 46%,#05191d 100%)', color: '#fff' }}>
            <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg,rgba(255,255,255,.045) 0 1.5px,transparent 1.5px 22px)', opacity: 0.5, pointerEvents: 'none' }} />
            <div className="pm-orb1" aria-hidden style={{ position: 'absolute', top: '-16%', right: '-14%', width: 230, height: 230, borderRadius: '50%', background: 'radial-gradient(circle,rgba(45,212,191,.4),transparent 62%)', filter: 'blur(26px)', pointerEvents: 'none' }} />
            <div className="pm-orb2" aria-hidden style={{ position: 'absolute', bottom: '-30%', left: '-20%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,rgba(251,109,76,.26),transparent 64%)', filter: 'blur(30px)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link href="/account" style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.16)', display: 'grid', placeItems: 'center', color: '#fff', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </Link>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '600 9.5px var(--f-mono)', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--teal-bright)' }}>{t.kicker}</div>
              </div>
              <span style={{ display: 'inline-flex' }}><LangToggle glass /></span>
            </div>
            <h1 style={{ position: 'relative', font: '700 32px var(--f-display)', letterSpacing: '-.02em', color: '#fff', margin: '20px 0 0' }}>{t.title}</h1>
            <p style={{ position: 'relative', font: '500 13.5px/1.5 var(--f-ui)', color: 'rgba(255,255,255,.78)', margin: '8px 0 0', maxWidth: 300 }}>{t.sub}</p>
          </header>

          {/* SHEET */}
          <div style={{ position: 'relative', marginTop: -34, borderRadius: '26px 26px 0 0', background: 'var(--bg)', padding: '8px 16px calc(env(safe-area-inset-bottom,0px) + 30px)', minHeight: 200 }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--line)', margin: '0 auto 16px' }} />

            {/* outstanding banner */}
            {totalOwed > 0 && owedMoney && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '16px 18px', borderRadius: 20, background: 'linear-gradient(135deg,#fff2ee,#ffe4dc)', border: '1px solid rgba(251,109,76,.22)' }}>
                <span style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'rgba(251,109,76,.16)', color: 'var(--accent-strong)', display: 'grid', placeItems: 'center' }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '700 14px var(--f-display)', color: 'var(--ink)' }}>{t.outstanding}</div>
                  <div style={{ font: '500 11.5px var(--f-ui)', color: 'var(--muted)' }}>{ml.across(dueCount)}</div>
                </div>
                <span style={{ font: '700 24px var(--f-display)', color: 'var(--accent-strong)', whiteSpace: 'nowrap' }}>{owedMoney}</span>
              </div>
            )}

            {/* segmented Due / History */}
            <div style={{ display: 'flex', gap: 4, marginTop: 14, padding: 4, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 13 }}>
              <button type="button" onClick={() => setPayTab('due')} style={seg(payTab === 'due')}>
                {ml.due}{dueCount > 0 && <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, display: 'inline-grid', placeItems: 'center', font: '700 10px var(--f-mono)', background: payTab === 'due' ? 'rgba(255,255,255,.25)' : 'var(--accent-soft)', color: payTab === 'due' ? '#fff' : 'var(--accent-strong)' }}>{dueCount}</span>}
              </button>
              <button type="button" onClick={() => setPayTab('history')} style={seg(payTab === 'history')}>{ml.history}</button>
            </div>

            {payTab === 'due' ? (
              payable.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginTop: 14 }}>
                  {payable.map((b) => (
                    <div key={b.id} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, padding: 16, boxShadow: '0 14px 36px -26px rgba(6,33,38,.5)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ flex: 1, minWidth: 0, font: '700 16px var(--f-display)', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.carName}</span>
                        <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'var(--ok-soft)', color: 'var(--ok)', font: '600 9.5px var(--f-mono)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                          <span className="pm-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ok)' }} />{t.statusLabels[b.status]}
                        </span>
                      </div>
                      <div style={{ marginTop: 6, font: '600 11.5px var(--f-mono)', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.number} · {b.datesLabel}</div>
                      <div style={{ marginTop: 12, padding: '13px 14px', borderRadius: 14, background: 'var(--bg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={{ font: '500 13px var(--f-ui)', color: 'var(--muted)' }}>{t.total}</span><span style={{ font: '700 14px var(--f-display)', color: 'var(--ink)' }}>{b.subtotalMoney}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 7 }}><span style={{ font: '500 13px var(--f-ui)', color: 'var(--teal-700)' }}>{t.paid}</span><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '700 14px var(--f-display)', color: 'var(--ok)' }}><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>{b.paidMoney}</span></div>
                        <div style={{ height: 1, background: 'var(--line)', margin: '11px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={{ font: '700 13px var(--f-ui)', color: 'var(--ink)' }}>{t.balance}</span><span style={{ font: '700 20px var(--f-display)', color: 'var(--accent-strong)' }}>{b.balanceMoney}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}><span style={{ font: '500 12px var(--f-ui)', color: 'var(--muted-2)' }}>{ml.secDeposit}</span><span style={{ font: '500 12px var(--f-mono)', color: 'var(--muted-2)' }}>{b.depositMoney}</span></div>
                      </div>
                      <button type="button" onClick={() => setOpenId(b.id)} className="pm-press" style={{ position: 'relative', overflow: 'hidden', width: '100%', marginTop: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, border: 'none', borderRadius: 13, background: 'var(--accent)', color: '#fff', font: '700 14.5px var(--f-display)', cursor: 'pointer', boxShadow: '0 12px 26px -12px var(--accent)' }}>
                        <span className="pm-sheen" aria-hidden style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '55%', background: 'linear-gradient(100deg,transparent,rgba(255,255,255,.32),transparent)', pointerEvents: 'none' }} />
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative' }}><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                        <span style={{ position: 'relative' }}>{t.payNow} · {b.balanceMoney}</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ marginTop: 14, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, padding: '30px 22px', textAlign: 'center', boxShadow: '0 14px 36px -26px rgba(6,33,38,.5)' }}>
                  <div style={{ width: 46, height: 46, margin: '0 auto', borderRadius: '50%', background: 'var(--ok)', display: 'grid', placeItems: 'center' }}><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></div>
                  <div style={{ marginTop: 14, font: '700 19px var(--f-display)', color: 'var(--ink)' }}>{t.allSettled}</div>
                  <p style={{ margin: '8px auto 0', maxWidth: 320, font: '400 13.5px/1.6 var(--f-ui)', color: 'var(--muted)' }}>{t.allSettledSub}</p>
                </div>
              )
            ) : (
              history.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                  {history.map((h) => {
                    const refund = isRefund(h)
                    return (
                      <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '13px 15px' }}>
                        <span style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'grid', placeItems: 'center', background: refund ? 'var(--accent-soft)' : 'var(--ok-soft)', color: refund ? 'var(--accent-strong)' : 'var(--ok)' }}>
                          {refund ? <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg> : <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ font: '600 13.5px var(--f-display)', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.bookingNumber}</div>
                          <div style={{ font: '500 11.5px var(--f-ui)', color: 'var(--muted)' }}>{dateTag(h.createdAtISO)} · {t.methodLabels[h.method]}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ font: '700 14px var(--f-display)', color: refund ? 'var(--accent-strong)' : 'var(--ink)' }}>{refund ? '−' : ''}{h.amountMoney}</div>
                          <div style={{ font: '600 9px var(--f-mono)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>{refund ? ml.refunded : ml.paidInFull}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ marginTop: 14, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, padding: '30px 22px', textAlign: 'center', color: 'var(--muted)', font: '500 14px var(--f-ui)' }}>{t.noHistory}</div>
              )
            )}

            {payTab === 'due' && payable.length > 0 && (
              <p style={{ margin: '16px 4px 0', font: '400 11.5px/1.55 var(--f-ui)', color: 'var(--muted-2)' }}>{ml.securedNote}</p>
            )}
          </div>
        </div>

        {/* ── sticky Pay-all bar (Due tab, balance due) ── */}
        {payTab === 'due' && totalOwed > 0 && owedMoney && (
          <div style={{ flexShrink: 0, position: 'relative', zIndex: 5, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px calc(env(safe-area-inset-bottom,0px) + 14px)', background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderTop: '1px solid var(--line)' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ font: '600 9.5px var(--f-mono)', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>{ml.totalDue}</div>
              <div style={{ font: '700 20px var(--f-display)', color: 'var(--accent-strong)' }}>{owedMoney}</div>
            </div>
            <button type="button" onClick={() => setOpenId(payable[0].id)} className="pm-press" style={{ position: 'relative', overflow: 'hidden', marginLeft: 'auto', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 22px', border: 'none', borderRadius: 13, background: 'var(--accent)', color: '#fff', font: '700 14.5px var(--f-display)', cursor: 'pointer', boxShadow: '0 12px 26px -12px var(--accent)' }}>
              <span className="pm-sheen" aria-hidden style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '55%', background: 'linear-gradient(100deg,transparent,rgba(255,255,255,.32),transparent)', pointerEvents: 'none' }} />
              <span style={{ position: 'relative' }}>{ml.payAll}</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative' }}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </button>
          </div>
        )}

        {/* ── pay sheet (slide-up) — reuses PaymentPanel (card / bank / crypto) ── */}
        <div onClick={() => setOpenId(null)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(4,20,23,.55)', opacity: openId ? 1 : 0, pointerEvents: openId ? 'auto' : 'none', transition: 'opacity .32s' }} />
        <div className="pm-sheet" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, top: 40, zIndex: 81, display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderRadius: '24px 24px 0 0', overflow: 'hidden', transform: openId ? 'translateY(0)' : 'translateY(101%)', pointerEvents: openId ? 'auto' : 'none', boxShadow: '0 -20px 50px -20px rgba(6,33,38,.4)' }}>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: '700 16px var(--f-display)', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{openBooking?.carName ?? t.payNow}</div>
              {openBooking && <div style={{ marginTop: 2, font: '600 12px var(--f-mono)', color: 'var(--muted)' }}>{openBooking.number} · {t.balance} {openBooking.balanceMoney}</div>}
            </div>
            <button type="button" onClick={() => setOpenId(null)} aria-label={closeLabel[lang] ?? closeLabel.en} style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg></button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 16px calc(env(safe-area-inset-bottom,0px) + 20px)' }}>
            {panelBooking && <PaymentPanel booking={panelBooking} bank={bank} lang={lang} cardEnabled={cardEnabled} />}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="paymob" style={wrapStyle}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={PAY_FONTS} />
      <style dangerouslySetInnerHTML={{ __html: PAY_CSS }} />

      <main style={{ width: '100%', maxWidth: 720, margin: '0 auto', padding: 'clamp(22px,4vw,38px) clamp(16px,4vw,28px) 56px' }}>
        {/* heading */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ font: '600 12px var(--f-mono)', letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--accent-strong)' }}>{t.kicker}</div>
          <h1 style={{ margin: '10px 0 0', font: '700 clamp(28px,4vw,40px) var(--f-display)', letterSpacing: '-.02em', color: 'var(--ink)' }}>{t.title}</h1>
          <p style={{ margin: '10px 0 0', font: '400 15px/1.6 var(--f-ui)', color: 'var(--muted)', maxWidth: 460 }}>{t.sub}</p>
        </div>

        {/* outstanding banner */}
        {totalOwed > 0 && owedMoney && (
          <div style={{ ...cabCard, marginBottom: 20, padding: '16px 20px', background: 'linear-gradient(120deg,#fff2ee,#ffe4dc)', border: '1px solid rgba(251,109,76,.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, font: '700 13.5px var(--f-ui)', color: 'var(--ink)' }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'rgba(251,109,76,.16)', color: 'var(--accent-strong)', display: 'grid', placeItems: 'center' }}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg></span>
              {t.outstanding}
            </span>
            <span style={{ font: '700 24px var(--f-display)', color: 'var(--accent-strong)' }}>{owedMoney}</span>
          </div>
        )}

        {/* payable bookings */}
        {payable.length === 0 ? (
          <div style={{ ...cabCard, padding: '30px 22px', textAlign: 'center', background: 'var(--ok-soft)', border: '1px solid rgba(16,185,129,.22)' }}>
            <div style={{ width: 46, height: 46, margin: '0 auto', borderRadius: '50%', background: 'var(--ok)', display: 'grid', placeItems: 'center' }}><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></div>
            <div style={{ marginTop: 14, font: '700 19px var(--f-display)', color: 'var(--ink)' }}>{t.allSettled}</div>
            <p style={{ margin: '8px auto 0', maxWidth: 380, font: '400 14px/1.6 var(--f-ui)', color: 'var(--muted)' }}>{t.allSettledSub}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {payable.map((b) => (
              <div key={b.id} className="pay-lift" style={{ ...cabCard, overflow: 'hidden' }}>
                <div style={{ padding: '18px 20px 6px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ font: '700 17px var(--f-display)', color: 'var(--ink)' }}>{b.carName}</div>
                      <div style={{ marginTop: 4, font: '600 11.5px var(--f-mono)', letterSpacing: '.04em', color: 'var(--muted-2)' }}>{b.number} · {b.datesLabel}</div>
                    </div>
                    <span style={{ flexShrink: 0, font: '600 10.5px var(--f-mono)', color: 'var(--teal-700)', background: 'var(--teal-soft)', borderRadius: 999, padding: '5px 11px' }}>{t.statusLabels[b.status]}</span>
                  </div>
                  <div style={{ marginTop: 15, display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 16px', borderRadius: 14, background: 'linear-gradient(180deg,#fbfdfc,#f4faf9)', border: '1px solid var(--line)' }}>
                    <MoneyRow label={t.total} value={b.subtotalMoney} />
                    {b.paid > 0 && <MoneyRow label={t.paid} value={b.paidMoney} tone="var(--ok)" prefix="✓ " />}
                    <div style={{ height: 1, background: 'var(--line)', margin: '3px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ font: '700 14px var(--f-ui)', color: 'var(--ink)' }}>{t.balance}</span>
                      <span style={{ font: '700 22px var(--f-display)', color: 'var(--accent-strong)' }}>{b.balanceMoney}</span>
                    </div>
                    {b.deposit > 0 && (
                      <div style={{ marginTop: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ font: '500 11.5px var(--f-ui)', color: 'var(--muted-2)' }} title={t.depositHint}>{t.deposit}</span>
                        <span style={{ font: '500 12px var(--f-mono)', color: 'var(--muted-2)' }}>{b.depositMoney}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ padding: '12px 20px 18px' }}>
                  <button type="button" onClick={() => setOpenId(b.id)} className="pay-cta" style={{ width: '100%', minHeight: 50, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 18px', borderRadius: 13, border: 'none', background: 'var(--accent)', color: '#fff', font: '700 15px var(--f-display)', cursor: 'pointer', boxShadow: '0 14px 28px -12px var(--accent)' }}>
                    {t.payNow} · {b.balanceMoney}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* payment history */}
        <div style={{ marginTop: 34 }}>
          <h2 style={{ margin: '0 0 14px', font: '700 clamp(18px,2.4vw,22px) var(--f-display)', letterSpacing: '-.02em', color: 'var(--ink)' }}>{t.historyTitle}</h2>
          {history.length === 0 ? (
            <div style={{ ...cabCard, padding: '22px 18px', font: '500 14px var(--f-ui)', color: 'var(--muted)', textAlign: 'center' }}>{t.noHistory}</div>
          ) : (
            <div style={{ ...cabCard, overflow: 'hidden' }}>
              {history.map((p, i) => {
                const tone = payTone(p.status)
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 18px', borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ font: '700 13.5px var(--f-ui)', color: 'var(--ink)' }}>{t.methodLabels[p.method]} <span style={{ font: '500 12px var(--f-ui)', color: 'var(--muted-2)' }}>· {t.kindLabels[p.kind]}</span></div>
                      <div style={{ marginTop: 3, font: '500 11px var(--f-mono)', color: 'var(--muted-2)' }}>{t.booking} {p.bookingNumber} · {fmtDate(p.createdAtISO, lang)}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ font: '700 15px var(--f-display)', color: 'var(--ink)' }}>{p.amountMoney}</div>
                      <span style={{ display: 'inline-block', marginTop: 4, font: '600 9.5px var(--f-mono)', letterSpacing: '.04em', color: tone.fg, background: tone.bg, borderRadius: 999, padding: '3px 9px' }}>{t.payStatusLabels[p.status]}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* PAYMENT MODAL — the reused PaymentPanel (Stripe card, or bank/crypto) in a pop-up */}
      {(() => {
        const b = bookings.find((x) => x.id === openId)
        if (!b) return null
        const panelBooking: PayPanelBooking = { id: b.id, number: b.number, currency: b.currency, subtotal: b.balance, subtotalMoney: b.balanceMoney }
        return (
          <div role="dialog" aria-modal="true" aria-label={b.carName} onClick={() => setOpenId(null)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(4,20,23,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(12px,3vw,28px)' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 90px -30px rgba(6,33,38,.7)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '700 15px var(--f-display)', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.carName}</div>
                  <div style={{ marginTop: 2, font: '600 12px var(--f-mono)', color: 'var(--muted)' }}>{b.number} · {t.balance} {b.balanceMoney}</div>
                </div>
                <button type="button" onClick={() => setOpenId(null)} aria-label={closeLabel[lang] ?? closeLabel.en} style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer', font: '700 16px var(--f-ui)' }}>✕</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', WebkitOverflowScrolling: 'touch' }}>
                <PaymentPanel booking={panelBooking} bank={bank} lang={lang} cardEnabled={cardEnabled} />
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

function MoneyRow({ label, value, tone, prefix }: { label: string; value: string; tone?: string; prefix?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ font: '500 13px var(--f-ui)', color: tone ?? 'var(--muted)' }}>{label}</span>
      <span style={{ font: '600 13px var(--f-mono)', color: tone ?? 'var(--ink)' }}>{prefix}{value}</span>
    </div>
  )
}
