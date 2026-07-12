'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import { useIsMobile } from './useIsMobile'
import type { Lang } from '../i18n/lang'

/** Server-computed day-state (mirrors lib/availability CalendarDay). The client ONLY
 *  reads these verdicts — it never computes availability from raw booking data. */
export type CalDay = { date: string; dow: number; state: 'past' | 'busy' | 'prep' | 'free' }

interface Props {
  days: CalDay[]
  selectedStart: string | null // YYYY-MM-DD
  selectedEnd: string | null // YYYY-MM-DD
  /** Called when a selectable (free) day is clicked. Parent owns the start/end state machine. */
  onPick: (date: string) => void
  lang: Lang
  /** Month (YYYY-MM) to open on first render, e.g. the next-free month. */
  initialMonth?: string | null
}

const MONTHS: Record<Lang, string[]> = {
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  tr: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
}
const WEEKDAYS: Record<Lang, string[]> = {
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  tr: ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'],
  es: ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'],
  de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
}

// Calendar chrome + legend microcopy, per language (English is the fallback via `?? T.en`).
const T: Record<
  Lang,
  {
    prevMonths: string
    nextMonths: string
    availability: string
    stateBusy: string
    statePrep: string
    statePast: string
    stateFree: string
    legendFree: string
    legendBooked: string
    legendTurnaround: string
    legendYourDates: string
    legendPast: string
  }
> = {
  en: {
    prevMonths: 'Previous months',
    nextMonths: 'Next months',
    availability: 'AVAILABILITY',
    stateBusy: 'booked',
    statePrep: 'turnaround',
    statePast: 'past',
    stateFree: 'free',
    legendFree: 'Free',
    legendBooked: 'Booked',
    legendTurnaround: 'Turnaround',
    legendYourDates: 'Your dates',
    legendPast: 'Past',
  },
  ru: {
    prevMonths: 'Предыдущие месяцы',
    nextMonths: 'Следующие месяцы',
    availability: 'ДОСТУПНОСТЬ',
    stateBusy: 'занято',
    statePrep: 'подготовка',
    statePast: 'прошло',
    stateFree: 'свободно',
    legendFree: 'Свободно',
    legendBooked: 'Занято',
    legendTurnaround: 'Подготовка',
    legendYourDates: 'Ваш выбор',
    legendPast: 'Прошло',
  },
  tr: {
    prevMonths: 'Önceki aylar',
    nextMonths: 'Sonraki aylar',
    availability: 'MÜSAİTLİK',
    stateBusy: 'dolu',
    statePrep: 'hazırlık',
    statePast: 'geçmiş',
    stateFree: 'müsait',
    legendFree: 'Müsait',
    legendBooked: 'Dolu',
    legendTurnaround: 'Hazırlık',
    legendYourDates: 'Tarihleriniz',
    legendPast: 'Geçmiş',
  },
  es: {
    prevMonths: 'Meses anteriores',
    nextMonths: 'Meses siguientes',
    availability: 'DISPONIBILIDAD',
    stateBusy: 'reservado',
    statePrep: 'preparación',
    statePast: 'pasado',
    stateFree: 'libre',
    legendFree: 'Libre',
    legendBooked: 'Reservado',
    legendTurnaround: 'Preparación',
    legendYourDates: 'Tus fechas',
    legendPast: 'Pasado',
  },
  de: {
    prevMonths: 'Vorherige Monate',
    nextMonths: 'Nächste Monate',
    availability: 'VERFÜGBARKEIT',
    stateBusy: 'belegt',
    statePrep: 'Aufbereitung',
    statePast: 'vergangen',
    stateFree: 'frei',
    legendFree: 'Frei',
    legendBooked: 'Belegt',
    legendTurnaround: 'Aufbereitung',
    legendYourDates: 'Ihr Zeitraum',
    legendPast: 'Vergangen',
  },
}

// Distinct visual language per state (design_handoff_aventa_cabinet_booking calendar).
// free = clean surface cell (teal-soft on hover, see global.css); booked = coral; past = muted.
const CELL: Record<CalDay['state'], CSSProperties> = {
  free: { background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line)' },
  busy: { background: 'rgba(251,109,76,.16)', color: 'var(--accent-strong)', border: '1px solid transparent' },
  // prep = turnaround buffer (no equivalent in the prototype): subtle gold hatch so it reads as
  // "not the same as booked or free" while staying on-palette.
  prep: {
    background: 'repeating-linear-gradient(45deg,#FBF4DD,#FBF4DD 5px,#F3E7BF 5px,#F3E7BF 10px)',
    color: '#9A7A1E',
    border: '1px solid rgba(245,180,0,.3)',
  },
  past: { background: 'var(--bg-2)', color: 'var(--muted-2)', border: '1px solid transparent' },
}

const PERE_PAGE = 2

export default function AvailabilityCalendar({ days, selectedStart, selectedEnd, onPick, lang, initialMonth }: Props) {
  // One month at a time on narrow screens (each fills the width, days are thumb-sized);
  // two-up on desktop. Only affects paging/layout — day-states still come from the server.
  const isMobile = useIsMobile()
  const perPage = isMobile ? 1 : PERE_PAGE
  const t = T[lang] ?? T.en

  const months = useMemo(() => {
    const map = new Map<string, CalDay[]>()
    for (const d of days) {
      const k = d.date.slice(0, 7)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(d)
    }
    return [...map.entries()].map(([key, cells]) => {
      const [y, m] = key.split('-').map(Number)
      return { key, year: y, monthIdx: m - 1, cells }
    })
  }, [days])

  const initialPage = useMemo(() => {
    const target = initialMonth ?? selectedStart?.slice(0, 7) ?? months[0]?.key
    const idx = months.findIndex((m) => m.key === target)
    return idx >= 0 ? Math.floor(idx / perPage) : 0
  }, [months, initialMonth, selectedStart, perPage])

  const [page, setPage] = useState(initialPage)
  const maxPage = Math.max(0, Math.ceil(months.length / perPage) - 1)
  const clamped = Math.min(page, maxPage)
  const visible = months.slice(clamped * perPage, clamped * perPage + perPage)

  return (
    <div className="av-cal">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          type="button"
          aria-label={t.prevMonths}
          onClick={() => setPage((p) => Math.max(0, Math.min(p, maxPage) - 1))}
          disabled={clamped === 0}
          style={navBtn(clamped === 0, isMobile)}
        >
          ‹
        </button>
        <div style={{ font: '700 12px var(--f-mono)', letterSpacing: '.08em', color: 'var(--teal-700)' }}>
          {t.availability}
        </div>
        <button
          type="button"
          aria-label={t.nextMonths}
          onClick={() => setPage((p) => Math.min(maxPage, Math.min(p, maxPage) + 1))}
          disabled={clamped >= maxPage}
          style={navBtn(clamped >= maxPage, isMobile)}
        >
          ›
        </button>
      </div>

      <div className="av-cal-months">
        {visible.map((mo) => {
          const lead = (mo.cells[0].dow + 6) % 7 // Monday-first offset
          return (
            <div key={mo.key} style={{ minWidth: 0 }}>
              <div style={{ font: `700 ${isMobile ? 16 : 14}px var(--f-display)`, color: 'var(--ink)', marginBottom: 8, textAlign: 'center' }}>
                {MONTHS[lang][mo.monthIdx]} {mo.year}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: isMobile ? 5 : 4, marginBottom: 4 }}>
                {WEEKDAYS[lang].map((w) => (
                  <div key={w} style={{ textAlign: 'center', font: `700 ${isMobile ? 11 : 9}px var(--f-mono)`, color: 'var(--muted-2)' }}>
                    {w}
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: isMobile ? 5 : 4 }}>
                {Array.from({ length: lead }).map((_, i) => (
                  <div key={`b${i}`} />
                ))}
                {mo.cells.map((d) => {
                  const dayNum = Number(d.date.slice(8, 10))
                  const isStart = d.date === selectedStart
                  const isEnd = d.date === selectedEnd
                  const inRange = !!selectedStart && !!selectedEnd && d.date > selectedStart && d.date < selectedEnd
                  const selectedEndpoint = isStart || isEnd
                  const selectable = d.state === 'free'

                  let style: CSSProperties = { ...CELL[d.state] }
                  if (selectedEndpoint) style = { background: 'var(--teal)', color: '#fff', border: '1px solid var(--teal)', boxShadow: '0 6px 14px -6px var(--teal)' }
                  else if (inRange) style = { background: 'var(--teal-soft)', color: 'var(--teal-700)', border: '1px solid transparent' }

                  const stateLabel =
                    d.state === 'busy' ? t.stateBusy :
                    d.state === 'prep' ? t.statePrep :
                    d.state === 'past' ? t.statePast :
                    t.stateFree

                  return (
                    <button
                      key={d.date}
                      type="button"
                      className={`av-cal-day${selectable && !selectedEndpoint && !inRange ? ' av-cal-day--free' : ''}`}
                      onClick={() => selectable && onPick(d.date)}
                      disabled={!selectable}
                      aria-label={`${d.date} — ${stateLabel}`}
                      aria-pressed={selectedEndpoint || inRange}
                      title={`${d.date} · ${stateLabel}`}
                      style={{
                        // Mobile: fill the column width but guarantee a ~44px-tall thumb target
                        // (a full 7-day week caps cell width at ~37-40px on a 360px screen).
                        aspectRatio: isMobile ? undefined : '1 / 1',
                        minHeight: isMobile ? 44 : undefined,
                        width: '100%',
                        borderRadius: isMobile ? 11 : 9,
                        font: `${selectedEndpoint ? 800 : 600} ${isMobile ? 15 : 13}px var(--f-display)`,
                        cursor: selectable ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        ...style,
                      }}
                    >
                      {dayNum}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* legend */}
      <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
        <Legend sw={CELL.free} label={t.legendFree} />
        <Legend sw={CELL.busy} label={t.legendBooked} />
        <Legend sw={CELL.prep} label={t.legendTurnaround} />
        <Legend sw={{ background: 'var(--teal)' }} label={t.legendYourDates} />
        <Legend sw={CELL.past} label={t.legendPast} />
      </div>
    </div>
  )
}

function Legend({ sw, label }: { sw: CSSProperties; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 14, height: 14, borderRadius: 4, display: 'inline-block', border: '1px solid var(--line)', ...sw }} />
      <span style={{ font: '600 11px var(--f-ui)', color: 'var(--muted)' }}>{label}</span>
    </div>
  )
}

function navBtn(disabled: boolean, isMobile = false): CSSProperties {
  const size = isMobile ? 44 : 34
  return {
    width: size,
    height: size,
    borderRadius: 10,
    border: '1px solid var(--line)',
    background: 'var(--surface)',
    color: 'var(--teal-700)',
    font: `700 ${isMobile ? 20 : 16}px var(--f-ui)`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    flexShrink: 0,
  }
}
