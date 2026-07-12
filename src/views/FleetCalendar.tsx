'use client'

import type { CSSProperties } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import AdminShell from '../components/AdminShell'
import { useIsMobile } from '@/components/useIsMobile'
import { useDict, type Dict } from '../i18n/lang'

/** A single day cell in the month header. */
export interface DayCell {
  day: number
  wd: string
  isWeekend: boolean
}

/** Booking status → drives bar colors (mapped from real BookingStatus on the server). */
export type BookingKind = 'active' | 'confirmed' | 'pending' | 'closed'

/** A positioned booking bar. left/width are already computed (percent of the month grid). */
export interface BarSegment {
  leftPct: number
  widthPct: number
  status: BookingKind
  client: string
  label: string
  /** Human date range of the booking, e.g. "3 авг — 10 авг" (mobile list). */
  range?: string
  /** Short RU status word, e.g. "активна" (mobile list). */
  statusWord?: string
  /** Whether the booking spans the present moment — drives the mobile "rented now" status. */
  spansNow?: boolean
}

/** One fleet row with its positioned bars for the shown month. */
export interface CarRow {
  name: string
  cls: string
  segments: BarSegment[]
}

/** Real KPI chip computed from live data. */
export interface KpiChip {
  label: string
  value: string
  color: string
}

interface PaletteEntry {
  bg: string
  bd: string
  tx: string
}

const PALETTE: Record<BookingKind, PaletteEntry> = {
  active: { bg: 'rgba(111,191,143,.16)', bd: '#6FBF8F', tx: '#A6E2BE' },
  confirmed: { bg: 'rgba(78,127,224,.16)', bd: '#4E7FE0', tx: '#A6BEF2' },
  pending: { bg: 'rgba(224,162,62,.16)', bd: '#E0A23E', tx: '#ECC481' },
  closed: { bg: 'rgba(255,255,255,.06)', bd: '#5b6f8a', tx: '#9CB0CB' },
}

interface LegendItem {
  key: BookingKind
  fill: string
  bar: string
}

const LEGEND: LegendItem[] = [
  { key: 'active', fill: 'rgba(111,191,143,.4)', bar: '#6FBF8F' },
  { key: 'confirmed', fill: 'rgba(78,127,224,.4)', bar: '#4E7FE0' },
  { key: 'pending', fill: 'rgba(224,162,62,.4)', bar: '#E0A23E' },
  { key: 'closed', fill: 'rgba(255,255,255,.18)', bar: '#5b6f8a' },
]

type ViewMode = 'month' | 'week'

const monoLabel: CSSProperties = {
  font: '400 10px var(--f-mono)',
  letterSpacing: '.1em',
  color: 'var(--d-muted-2)',
}

interface Strings {
  pageTitle: string
  prevMonthAria: string
  nextMonthAria: string
  viewMonth: string
  viewWeek: string
  addBooking: string
  legendLabels: Record<BookingKind, string>
  carColHeader: string
  noCars: string
  chipRented: string
  chipFree: string
  freesLabel: (d: string) => string
  noBookingsThisMonth: string
  bookingsForMonth: (m: string) => string
}

const dict: Dict<Strings> = {
  ru: {
    pageTitle: 'Календарь занятости',
    prevMonthAria: 'Предыдущий месяц',
    nextMonthAria: 'Следующий месяц',
    viewMonth: 'Месяц',
    viewWeek: 'Неделя',
    addBooking: '+ Бронь',
    legendLabels: { active: 'Аренда активна', confirmed: 'Подтверждена', pending: 'Ожидает', closed: 'Закрыта' },
    carColHeader: 'АВТОМОБИЛЬ',
    noCars: 'Автомобили не найдены',
    chipRented: 'В аренде',
    chipFree: 'Свободно',
    freesLabel: (d) => `Освободится ${d}`,
    noBookingsThisMonth: 'Броней в этом месяце нет',
    bookingsForMonth: (m) => `БРОНИ · ${m}`,
  },
  en: {
    pageTitle: 'Availability calendar',
    prevMonthAria: 'Previous month',
    nextMonthAria: 'Next month',
    viewMonth: 'Month',
    viewWeek: 'Week',
    addBooking: '+ Booking',
    legendLabels: { active: 'Rental active', confirmed: 'Confirmed', pending: 'Pending', closed: 'Closed' },
    carColHeader: 'VEHICLE',
    noCars: 'No cars found',
    chipRented: 'Rented',
    chipFree: 'Available',
    freesLabel: (d) => `Frees up ${d}`,
    noBookingsThisMonth: 'No bookings this month',
    bookingsForMonth: (m) => `BOOKINGS · ${m}`,
  },
  tr: {
    pageTitle: 'Doluluk takvimi',
    prevMonthAria: 'Önceki ay',
    nextMonthAria: 'Sonraki ay',
    viewMonth: 'Ay',
    viewWeek: 'Hafta',
    addBooking: '+ Rezervasyon',
    legendLabels: { active: 'Kiralama aktif', confirmed: 'Onaylandı', pending: 'Bekliyor', closed: 'Kapandı' },
    carColHeader: 'ARAÇ',
    noCars: 'Araç bulunamadı',
    chipRented: 'Kirada',
    chipFree: 'Müsait',
    freesLabel: (d) => `${d} tarihinde boşalıyor`,
    noBookingsThisMonth: 'Bu ay rezervasyon yok',
    bookingsForMonth: (m) => `REZERVASYONLAR · ${m}`,
  },
  es: {
    pageTitle: 'Calendario de ocupación',
    prevMonthAria: 'Mes anterior',
    nextMonthAria: 'Mes siguiente',
    viewMonth: 'Mes',
    viewWeek: 'Semana',
    addBooking: '+ Reserva',
    legendLabels: { active: 'Alquiler activo', confirmed: 'Confirmada', pending: 'Pendiente', closed: 'Cerrada' },
    carColHeader: 'VEHÍCULO',
    noCars: 'No se encontraron vehículos',
    chipRented: 'Alquilado',
    chipFree: 'Disponible',
    freesLabel: (d) => `Se libera el ${d}`,
    noBookingsThisMonth: 'Sin reservas este mes',
    bookingsForMonth: (m) => `RESERVAS · ${m}`,
  },
  de: {
    pageTitle: 'Belegungskalender',
    prevMonthAria: 'Vorheriger Monat',
    nextMonthAria: 'Nächster Monat',
    viewMonth: 'Monat',
    viewWeek: 'Woche',
    addBooking: '+ Buchung',
    legendLabels: { active: 'Vermietung aktiv', confirmed: 'Bestätigt', pending: 'Ausstehend', closed: 'Geschlossen' },
    carColHeader: 'FAHRZEUG',
    noCars: 'Keine Fahrzeuge gefunden',
    chipRented: 'Vermietet',
    chipFree: 'Verfügbar',
    freesLabel: (d) => `Frei ab ${d}`,
    noBookingsThisMonth: 'Keine Buchungen in diesem Monat',
    bookingsForMonth: (m) => `BUCHUNGEN · ${m}`,
  },
}

export interface FleetCalendarProps {
  /** Fleet rows with pre-positioned booking bars for the shown month. */
  rows: CarRow[]
  /** Day cells for the shown month's header. */
  days: DayCell[]
  /** Human month label, e.g. "Август 2026". */
  monthLabel: string
  /** Real KPI chips. */
  kpis: KpiChip[]
  /** Fleet-load subtitle line (e.g. "5 автомобилей · загрузка парка 74%"). */
  subtitle: string
  /** ?month= targets for the ‹ › navigation (YYYY-MM). */
  prevMonth: string
  nextMonth: string
}

export default function FleetCalendar({
  rows,
  days,
  monthLabel,
  kpis,
  subtitle,
  prevMonth,
  nextMonth,
}: FleetCalendarProps) {
  const [view, setView] = useState<ViewMode>('month')
  const isMobile = useIsMobile()
  const t = useDict(dict)
  const daysIn = days.length

  const navArrow: CSSProperties = { color: 'var(--d-muted)', cursor: 'pointer', textDecoration: 'none' }

  const headerExtra = (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: 'var(--d-card)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 10,
          padding: '9px 14px',
          font: '600 14px var(--f-ui)',
          color: 'var(--d-text)',
        }}
      >
        <Link href={`/calendar?month=${prevMonth}`} style={navArrow} aria-label={t.prevMonthAria}>
          ‹
        </Link>
        {monthLabel}
        <Link href={`/calendar?month=${nextMonth}`} style={navArrow} aria-label={t.nextMonthAria}>
          ›
        </Link>
      </div>
      <div
        style={{
          display: 'flex',
          border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 10,
          overflow: 'hidden',
          font: '600 12px var(--f-ui)',
        }}
      >
        <button
          type="button"
          onClick={() => setView('month')}
          style={{
            padding: '9px 14px',
            border: 'none',
            cursor: 'pointer',
            background: view === 'month' ? '#FF7A5C' : 'transparent',
            color: view === 'month' ? '#082A33' : 'var(--d-muted)',
            font: '600 12px var(--f-ui)',
          }}
        >
          {t.viewMonth}
        </button>
        <button
          type="button"
          onClick={() => setView('week')}
          style={{
            padding: '9px 14px',
            border: 'none',
            cursor: 'pointer',
            background: view === 'week' ? '#FF7A5C' : 'transparent',
            color: view === 'week' ? '#082A33' : 'var(--d-muted)',
            font: '600 12px var(--f-ui)',
          }}
        >
          {t.viewWeek}
        </button>
      </div>
      <button
        type="button"
        style={{
          padding: '10px 18px',
          border: 'none',
          cursor: 'pointer',
          background: 'linear-gradient(180deg,#FFB48A,#FF7A5C)',
          color: '#082A33',
          borderRadius: 10,
          font: '700 13px var(--f-ui)',
        }}
      >
        {t.addBooking}
      </button>
    </>
  )

  return (
    <AdminShell
      active="calendar"
      title={t.pageTitle}
      subtitle={subtitle}
      headerExtra={headerExtra}
    >
      {/* KPI chips + legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {kpis.map((k) => (
            <div
              key={k.label}
              style={{
                background: 'var(--d-card)',
                border: '1px solid rgba(255,255,255,.07)',
                borderRadius: 12,
                padding: '12px 18px',
              }}
            >
              <div style={monoLabel}>{k.label}</div>
              <div style={{ marginTop: 5, font: '700 20px var(--f-ui)', color: k.color }}>
                {k.value}
              </div>
            </div>
          ))}
        </div>
        {!isMobile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              font: '500 12px var(--f-ui)',
              color: 'var(--d-muted)',
              flexWrap: 'wrap',
            }}
          >
            {LEGEND.map((l) => (
              <span key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 3,
                    background: l.fill,
                    borderLeft: `3px solid ${l.bar}`,
                  }}
                />
                {t.legendLabels[l.key]}
              </span>
            ))}
          </div>
        )}
      </div>

      {isMobile ? (
        /* Mobile — a readable per-car LIST of the same occupancy (status + when it frees + bookings),
           instead of the wide car×days grid which is illegible on a phone. */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {rows.length === 0 && (
            <div style={{ padding: '28px 20px', textAlign: 'center', font: '400 13px var(--f-ui)', color: 'var(--d-muted-2)', background: 'var(--d-panel)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14 }}>
              {t.noCars}
            </div>
          )}
          {rows.map((car) => {
            const nowSeg = car.segments.find((s) => s.spansNow && s.status !== 'closed')
            const freesOn = nowSeg?.range ? nowSeg.range.split('—').pop()?.trim() : null
            const chip = nowSeg
              ? { t: t.chipRented, c: '#A6E2BE', bg: 'rgba(111,191,143,.16)', bd: 'rgba(111,191,143,.4)' }
              : { t: t.chipFree, c: '#8FD7AD', bg: 'rgba(111,191,143,.08)', bd: 'rgba(111,191,143,.22)' }
            return (
              <div key={car.name} style={{ background: 'var(--d-panel)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ font: '700 15px var(--f-ui)', color: 'var(--d-text)' }}>{car.name}</div>
                    <div style={{ marginTop: 2, font: '500 12px var(--f-ui)', color: 'var(--d-muted-2)' }}>{car.cls}</div>
                  </div>
                  <span style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 999, background: chip.bg, border: `1px solid ${chip.bd}`, color: chip.c, font: '700 12px var(--f-ui)', whiteSpace: 'nowrap' }}>{chip.t}</span>
                </div>
                {nowSeg && freesOn && (
                  <div style={{ marginTop: 8, font: '600 12.5px var(--f-ui)', color: '#E7B463' }}>{t.freesLabel(freesOn)}</div>
                )}
                {car.segments.length === 0 ? (
                  <div style={{ marginTop: 10, font: '500 12.5px var(--f-ui)', color: 'var(--d-muted)' }}>{t.noBookingsThisMonth}</div>
                ) : (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={monoLabel}>{t.bookingsForMonth(monthLabel.toUpperCase())}</div>
                    {car.segments.map((seg, i) => {
                      const p = PALETTE[seg.status]
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 10, background: 'var(--d-base)', border: '1px solid rgba(255,255,255,.06)' }}>
                          <span style={{ width: 8, height: 8, borderRadius: 3, background: p.bd, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ font: '600 13px var(--f-ui)', color: 'var(--d-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seg.client}</div>
                            <div style={{ marginTop: 2, font: '500 11.5px var(--f-mono)', color: 'var(--d-muted)' }}>{seg.range}</div>
                          </div>
                          <span style={{ flexShrink: 0, font: '700 10.5px var(--f-ui)', color: p.tx }}>{seg.statusWord}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
      /* Gantt timeline (desktop) */
      <div
        style={{
          background: 'var(--d-panel)',
          border: '1px solid rgba(255,255,255,.07)',
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 28,
        }}
      >
        {/* Day header */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255,255,255,.08)',
            background: 'var(--d-card)',
          }}
        >
          <div
            style={{
              width: 200,
              flexShrink: 0,
              padding: '12px 16px',
              font: '400 10px var(--f-mono)',
              letterSpacing: '.12em',
              color: 'var(--d-muted-2)',
              borderRight: '1px solid rgba(255,255,255,.08)',
            }}
          >
            {t.carColHeader}
          </div>
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: `repeat(${daysIn}, 1fr)`,
            }}
          >
            {days.map((d) => (
              <div
                key={d.day}
                style={{
                  textAlign: 'center',
                  padding: '7px 0',
                  background: d.isWeekend ? 'rgba(255,122,92,.05)' : undefined,
                }}
              >
                <div
                  style={{
                    font: '600 11px var(--f-ui)',
                    color: d.isWeekend ? '#FFB48A' : 'var(--d-muted)',
                  }}
                >
                  {d.day}
                </div>
                <div
                  style={{
                    font: '400 8px var(--f-mono)',
                    color: d.isWeekend ? '#C98A5E' : '#5b6f8a',
                  }}
                >
                  {d.wd}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Car rows */}
        {rows.length === 0 && (
          <div
            style={{
              padding: '28px 20px',
              textAlign: 'center',
              font: '400 13px var(--f-ui)',
              color: 'var(--d-muted-2)',
            }}
          >
            {t.noCars}
          </div>
        )}
        {rows.map((car) => (
          <div
            key={car.name}
            style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.05)' }}
          >
            <div
              style={{
                width: 200,
                flexShrink: 0,
                padding: '14px 16px',
                borderRight: '1px solid rgba(255,255,255,.08)',
              }}
            >
              <div style={{ font: '600 13px var(--f-ui)', color: 'var(--d-text)' }}>{car.name}</div>
              <div style={{ marginTop: 2, font: '400 11px var(--f-ui)', color: 'var(--d-muted-2)' }}>
                {car.cls}
              </div>
            </div>
            <div
              style={{
                flex: 1,
                position: 'relative',
                height: 60,
                backgroundImage:
                  'linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px)',
                backgroundSize: `calc(100% / ${daysIn}) 100%`,
              }}
            >
              {car.segments.map((b, i) => {
                const p = PALETTE[b.status]
                return (
                  <div
                    key={i}
                    title={b.label}
                    style={{
                      position: 'absolute',
                      top: 8,
                      height: 44,
                      left: `${b.leftPct}%`,
                      width: `${b.widthPct}%`,
                      background: p.bg,
                      borderLeft: `3px solid ${p.bd}`,
                      borderRadius: 7,
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 9px',
                      overflow: 'hidden',
                    }}
                  >
                    <span
                      style={{
                        font: '600 11px var(--f-ui)',
                        color: p.tx,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {b.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      )}
    </AdminShell>
  )
}
