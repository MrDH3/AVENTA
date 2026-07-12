'use client'

import Link from 'next/link'
import { StatusPill, type StatusTone } from '../components/ui'
import { useDict, useLang } from '../i18n/lang'
import type { ActiveBookingView } from '@/app/active/page'

const STATUS_TONE: Record<string, StatusTone> = {
  NEW: 'info',
  AWAITING_CONFIRMATION: 'warn',
  AWAITING_PAYMENT: 'warn',
  CONFIRMED: 'info',
  PREPARING: 'info',
  DELIVERED: 'success',
  ACTIVE: 'success',
}

const DICT = {
  en: {
    title: 'My car',
    none: 'No active rental',
    noneSub: 'When you book a car, its live details show up here — dates, status, and quick links.',
    browse: 'Browse cars',
    inRental: 'In rental now',
    returnsOn: 'Return by',
    startsOn: 'Starts',
    open: 'Booking details',
    contract: 'Contract',
    labels: {
      NEW: 'New', AWAITING_CONFIRMATION: 'Awaiting confirmation', AWAITING_PAYMENT: 'Awaiting payment',
      CONFIRMED: 'Confirmed', PREPARING: 'Preparing', DELIVERED: 'Delivered', ACTIVE: 'Active',
    } as Record<string, string>,
  },
  ru: {
    title: 'Моё авто',
    none: 'Нет активной аренды',
    noneSub: 'После бронирования здесь появятся детали текущей аренды — даты, статус и быстрые ссылки.',
    browse: 'Выбрать авто',
    inRental: 'Сейчас в аренде',
    returnsOn: 'Вернуть до',
    startsOn: 'Начало',
    open: 'Детали брони',
    contract: 'Договор',
    labels: {
      NEW: 'Новая', AWAITING_CONFIRMATION: 'Ждёт подтверждения', AWAITING_PAYMENT: 'Ждёт оплаты',
      CONFIRMED: 'Подтверждена', PREPARING: 'Готовим', DELIVERED: 'Выдана', ACTIVE: 'В аренде',
    } as Record<string, string>,
  },
  tr: {
    title: 'Aracım',
    none: 'Aktif kiralama yok',
    noneSub: 'Bir araç kiraladığınızda güncel bilgileri burada görünür — tarihler, durum ve hızlı bağlantılar.',
    browse: 'Araçlara göz at',
    inRental: 'Şu anda kirada',
    returnsOn: 'İade tarihi',
    startsOn: 'Başlangıç',
    open: 'Rezervasyon detayları',
    contract: 'Sözleşme',
    labels: {
      NEW: 'Yeni', AWAITING_CONFIRMATION: 'Onay bekliyor', AWAITING_PAYMENT: 'Ödeme bekliyor',
      CONFIRMED: 'Onaylandı', PREPARING: 'Hazırlanıyor', DELIVERED: 'Teslim edildi', ACTIVE: 'Aktif',
    } as Record<string, string>,
  },
  es: {
    title: 'Mi coche',
    none: 'Sin alquiler activo',
    noneSub: 'Cuando reserves un coche, sus datos en tiempo real aparecerán aquí: fechas, estado y enlaces rápidos.',
    browse: 'Ver coches',
    inRental: 'En alquiler ahora',
    returnsOn: 'Devolver antes del',
    startsOn: 'Comienza',
    open: 'Detalles de la reserva',
    contract: 'Contrato',
    labels: {
      NEW: 'Nueva', AWAITING_CONFIRMATION: 'Esperando confirmación', AWAITING_PAYMENT: 'Esperando pago',
      CONFIRMED: 'Confirmada', PREPARING: 'Preparando', DELIVERED: 'Entregada', ACTIVE: 'Activa',
    } as Record<string, string>,
  },
  de: {
    title: 'Mein Auto',
    none: 'Keine aktive Anmietung',
    noneSub: 'Sobald Sie ein Auto buchen, erscheinen hier die aktuellen Details — Daten, Status und Schnelllinks.',
    browse: 'Autos ansehen',
    inRental: 'Jetzt angemietet',
    returnsOn: 'Rückgabe bis',
    startsOn: 'Beginnt',
    open: 'Buchungsdetails',
    contract: 'Vertrag',
    labels: {
      NEW: 'Neu', AWAITING_CONFIRMATION: 'Wartet auf Bestätigung', AWAITING_PAYMENT: 'Wartet auf Zahlung',
      CONFIRMED: 'Bestätigt', PREPARING: 'In Vorbereitung', DELIVERED: 'Übergeben', ACTIVE: 'Aktiv',
    } as Record<string, string>,
  },
}

export default function ActiveRental({ booking }: { booking: ActiveBookingView | null }) {
  const t = useDict(DICT)
  const { lang } = useLang()

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short' })
  const fmtRange = (a: string, b: string) => `${fmtDate(a)} — ${fmtDate(b)}`

  if (!booking) {
    return (
      <div style={{ borderRadius: 22, background: '#fff', border: '1px solid rgba(20,153,174,.14)', boxShadow: '0 24px 50px -34px rgba(11,85,96,.5)', padding: '40px 26px', textAlign: 'center' }}>
        <div aria-hidden style={{ fontSize: 38, lineHeight: 1 }}>🚗</div>
        <div style={{ marginTop: 12, font: '800 20px var(--f-display)', color: 'var(--av-text)' }}>{t.none}</div>
        <p style={{ margin: '8px auto 0', maxWidth: 320, font: '500 13px/1.5 var(--f-ui)', color: 'var(--av-muted)' }}>{t.noneSub}</p>
        <Link href="/catalog" className="av-cta av-tap" style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 46, padding: '12px 22px', border: 'none', color: '#fff', background: 'linear-gradient(180deg,#FF8A5B,#FF6F61)', borderRadius: 12, font: '700 14px var(--f-ui)', textDecoration: 'none' }}>{t.browse}</Link>
      </div>
    )
  }

  const tone = STATUS_TONE[booking.status] ?? 'neutral'

  return (
    <div style={{ borderRadius: 22, background: '#fff', border: '1px solid rgba(20,153,174,.16)', boxShadow: '0 26px 54px -32px rgba(11,85,96,.55)', overflow: 'hidden' }}>
      <div style={{ height: 5, background: booking.inRentalNow ? 'linear-gradient(90deg,#16A34A,#22C55E)' : 'linear-gradient(90deg,#0e7e90,#14b8c6)' }} />
      <div style={{ padding: '20px 20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ font: '700 11px var(--f-ui)', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--av-muted)' }}>{t.title}</div>
          <StatusPill tone={tone} dot={false} style={{ whiteSpace: 'nowrap' }}>{t.labels[booking.status] ?? booking.status}</StatusPill>
        </div>

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 108, height: 72, borderRadius: 13, flexShrink: 0, background: booking.car.coverUrl ? `#eef6f7 center/cover url(${booking.car.coverUrl})` : 'linear-gradient(135deg,#d7eef1,#bfe6ea)' }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ font: '800 21px var(--f-display)', color: 'var(--av-text)', lineHeight: 1.15 }}>{booking.car.brand} {booking.car.model}</div>
            <div style={{ marginTop: 4, font: '600 12px var(--f-ui)', color: 'var(--av-muted)' }}>{booking.car.clsLabel} · {booking.car.year}</div>
            <div style={{ marginTop: 3, font: '600 11px var(--f-mono)', color: 'var(--av-muted)' }}>{booking.number}</div>
          </div>
        </div>

        <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 13, background: booking.inRentalNow ? 'rgba(22,163,74,.08)' : 'rgba(20,153,174,.07)', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ font: '800 14px var(--f-ui)', color: 'var(--av-text)' }}>{fmtRange(booking.startAt, booking.endAt)}</div>
          <div style={{ font: '600 12px var(--f-ui)', color: booking.inRentalNow ? '#15803d' : 'var(--av-teal)' }}>
            {booking.inRentalNow ? `${t.inRental} · ${t.returnsOn} ${fmtDate(booking.endAt)}` : `${t.startsOn} ${fmtDate(booking.startAt)}`}
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
          <Link href={`/success?b=${encodeURIComponent(booking.number)}`} className="av-cta av-tap" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 46, padding: '12px 14px', border: '1.5px solid rgba(20,153,174,.3)', color: 'var(--av-teal)', background: 'transparent', borderRadius: 12, font: '700 13px var(--f-ui)', textDecoration: 'none' }}>{t.open}</Link>
          <Link href={`/success?b=${encodeURIComponent(booking.number)}`} className="av-cta av-tap" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 46, padding: '12px 14px', border: 'none', color: '#fff', background: 'linear-gradient(180deg,#FF8A5B,#FF6F61)', borderRadius: 12, font: '700 13px var(--f-ui)', textDecoration: 'none' }}>{t.contract}</Link>
        </div>
      </div>
    </div>
  )
}
