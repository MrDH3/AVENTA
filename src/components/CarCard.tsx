'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { CarView } from '../lib/view'
import { useDict } from '../i18n/lang'
import CarPhotos, { type CarPhoto } from './CarPhotos'
import ImageSlot from './ImageSlot'
import { useIsMobile } from './useIsMobile'

const dict = {
  ru: {
    perDay: '/ сутки', book: 'Забронировать', fromDate: 'С этой даты',
    depositKm: (d: number, km: number) => `Залог €${d} · ${km} км/сут`,
    depositUnlim: (d: number) => `Залог €${d} · `,
    unlimited: 'Без лимита',
    seats: (n: number) => `${n} мест`, doors: (n: number) => `${n} двери`, ac: 'Климат',
    bInstant: 'Мгновенное бронирование', bNew: 'Новый авто', bCash: 'Оплата залога наличными', bNoCard: 'Без кредитной карты',
    resumeTag: 'Продолжить бронирование', resumeCta: 'Продолжить',
  },
  en: {
    perDay: '/ day', book: 'Book now', fromDate: 'From this date',
    depositKm: (d: number, km: number) => `Deposit €${d} · ${km} km/day`,
    depositUnlim: (d: number) => `Deposit €${d} · `,
    unlimited: 'Unlimited km',
    seats: (n: number) => `${n} seats`, doors: (n: number) => `${n} doors`, ac: 'A/C',
    bInstant: 'Instant booking', bNew: 'New car', bCash: 'Cash deposit possible', bNoCard: 'No credit card',
    resumeTag: 'Continue your booking', resumeCta: 'Continue',
  },
  tr: {
    perDay: '/ gün', book: 'Hemen kirala', fromDate: 'Bu tarihten itibaren',
    depositKm: (d: number, km: number) => `Depozito €${d} · ${km} km/gün`,
    depositUnlim: (d: number) => `Depozito €${d} · `,
    unlimited: 'Sınırsız km',
    seats: (n: number) => `${n} koltuk`, doors: (n: number) => `${n} kapı`, ac: 'Klima',
    bInstant: 'Anında rezervasyon', bNew: 'Yeni araç', bCash: 'Nakit depozito mümkün', bNoCard: 'Kredi kartı gerekmez',
    resumeTag: 'Rezervasyonuna devam et', resumeCta: 'Devam et',
  },
  es: {
    perDay: '/ día', book: 'Reservar', fromDate: 'Desde esta fecha',
    depositKm: (d: number, km: number) => `Depósito €${d} · ${km} km/día`,
    depositUnlim: (d: number) => `Depósito €${d} · `,
    unlimited: 'Km ilimitados',
    seats: (n: number) => `${n} plazas`, doors: (n: number) => `${n} puertas`, ac: 'A/A',
    bInstant: 'Reserva inmediata', bNew: 'Coche nuevo', bCash: 'Depósito en efectivo posible', bNoCard: 'Sin tarjeta de crédito',
    resumeTag: 'Continúa tu reserva', resumeCta: 'Continuar',
  },
  de: {
    perDay: '/ Tag', book: 'Jetzt buchen', fromDate: 'Ab diesem Datum',
    depositKm: (d: number, km: number) => `Kaution €${d} · ${km} km/Tag`,
    depositUnlim: (d: number) => `Kaution €${d} · `,
    unlimited: 'Unbegrenzte km',
    seats: (n: number) => `${n} Sitze`, doors: (n: number) => `${n} Türen`, ac: 'Klima',
    bInstant: 'Sofortbuchung', bNew: 'Neuwagen', bCash: 'Kaution in bar möglich', bNoCard: 'Keine Kreditkarte',
    resumeTag: 'Buchung fortsetzen', resumeCta: 'Fortsetzen',
  },
}

/** Small info chip shown under the price rail (Instant booking / New car / …). */
function Badge({ label, tone }: { label: string; tone: 'accent' | 'new' | 'plain' }) {
  const styles =
    tone === 'accent'
      ? { bg: '#FFF3D6', fg: '#B57A12', bd: 'rgba(181,122,18,.22)' }
      : tone === 'new'
        ? { bg: '#F3E8FB', fg: '#7A3F9E', bd: 'rgba(122,63,158,.22)' }
        : { bg: 'var(--av-field)', fg: 'var(--av-body)', bd: 'var(--av-hair)' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 999, background: styles.bg, color: styles.fg, border: `1px solid ${styles.bd}`, font: '700 10px var(--f-ui)', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

const iconBase = {
  width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'var(--av-teal)', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function GearIcon() {
  return (<svg {...iconBase}><circle cx="12" cy="4.6" r="1.8" /><path d="M12 6.4V18M6 18v-6M18 18v-6M6 12h12" /></svg>)
}
function FuelIcon() {
  return (<svg {...iconBase}><path d="M4 20V5.5A1.5 1.5 0 0 1 5.5 4H12a1.5 1.5 0 0 1 1.5 1.5V20" /><path d="M3 20h11.5M4.5 10.5h8.5" /><path d="M13.5 7.5l3 3V17a1.75 1.75 0 0 0 3.5 0V11l-2.5-2.5" /></svg>)
}
function BoltIcon() {
  return (<svg {...iconBase}><path d="M13 2.5 5 13h5l-1 8.5L18 10h-5l1-7.5z" /></svg>)
}
function LeafIcon() {
  return (<svg {...iconBase}><path d="M4.5 20C4.5 12 10 4.5 20 4.5c0 8.5-6 15.5-14.5 15.5-.7 0-1.4-.1-2-.4" /><path d="M9 15.5c2-3.2 5-5.4 8.5-6.5" /></svg>)
}
function SeatIcon() {
  return (<svg {...iconBase}><circle cx="12" cy="7" r="3" /><path d="M5.5 20v-.5a6.5 6.5 0 0 1 13 0V20" /></svg>)
}
function SnowIcon() {
  return (<svg {...iconBase}><path d="M12 2.5v19M3.7 7.25l16.6 9.5M20.3 7.25 3.7 16.75" /><path d="M12 6l2 1.6M12 6l-2 1.6M12 18l2-1.6M12 18l-2-1.6" /></svg>)
}
function DoorIcon() {
  return (<svg {...iconBase}><path d="M4 21h13M15.5 21V4.2a1 1 0 0 0-1.2-1L5.8 5.1A1 1 0 0 0 5 6.1V21" /><path d="M12.5 12.5h.01" /></svg>)
}

function fuelIcon(label: string) {
  if (/electric|электро/i.test(label)) return <BoltIcon />
  if (/hybrid|гибрид/i.test(label)) return <LeafIcon />
  return <FuelIcon />
}

function SpecCell({ icon, label, last }: { icon: React.ReactNode; label: string; last?: boolean }) {
  return (
    <div
      style={{
        flex: 1, minWidth: 0, padding: '10px 6px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        borderRight: last ? 'none' : '.5px solid var(--av-hair)',
      }}
    >
      {icon}
      <span style={{ font: '400 clamp(9px, 2.5vw, 10px) var(--f-mono)', color: 'var(--av-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
        {label}
      </span>
    </div>
  )
}

function ArrowRight() {
  return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>)
}

export default function CarCard({
  car,
  to = '/booking',
  radius = 20,
  resumable = false,
}: {
  car: CarView
  to?: string
  radius?: number
  /** The signed-in user has an in-progress draft for this car → show a "continue booking" state. */
  resumable?: boolean
}) {
  const t = useDict(dict)
  const isMobile = useIsMobile()
  const [hover, setHover] = useState(false)
  const busy = !car.available

  const photos: CarPhoto[] = car.photos && car.photos.length > 0 ? car.photos : []
  const href = `${to}?car=${car.slug}${busy && car.nextFree ? `&from=${car.nextFree.slice(0, 10)}` : ''}`

  const fourthCell = car.airConditioning
    ? <SpecCell icon={<SnowIcon />} label={t.ac} last />
    : <SpecCell icon={<DoorIcon />} label={t.doors(car.doors)} last />

  return (
    <article
      className="av-lift"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        width: '100%',
        background: 'var(--av-surface)',
        borderRadius: radius,
        overflow: 'hidden',
        // A coral ring highlights a car the user can resume booking.
        boxShadow: resumable
          ? `0 0 0 2px var(--av-coral), ${hover ? 'var(--sh-card-hover)' : 'var(--sh-card)'}`
          : hover ? 'var(--sh-card-hover)' : 'var(--sh-card)',
      }}
    >
      {/* Continue-booking ribbon (sits above the stretched cover link) */}
      {resumable && (
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 3, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'var(--grad-coral)', color: '#fff', font: '700 11px var(--f-ui)', boxShadow: '0 8px 18px -8px rgba(255,111,97,.7)' }}>
          ⏵ {t.resumeTag}
        </div>
      )}

      {/* Region 1 — media stage */}
      {photos.length > 0 ? (
        <CarPhotos
          photos={photos}
          brand={car.brand}
          model={car.model}
          year={car.year}
          clsLabel={car.clsLabel}
          statusText={car.statusText}
          available={car.available}
        />
      ) : (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', overflow: 'hidden' }}>
          <ImageSlot id={`fleet-${car.slug}`} height={240} caption={`${car.brand} ${car.model}`} placeholderBg="linear-gradient(135deg,#DCF3F6,#B6E6EE)" />
        </div>
      )}

      {/* Region 2 — body */}
      <div style={{ position: 'relative', padding: '16px 18px 18px' }}>
        {/* Spec instrument rail */}
        <div style={{ display: 'flex', border: '.5px solid var(--av-hair)', borderRadius: 13, overflow: 'hidden' }}>
          <SpecCell icon={<GearIcon />} label={car.gearboxLabel} />
          <SpecCell icon={fuelIcon(car.fuelLabel)} label={car.fuelLabel} />
          <SpecCell icon={<SeatIcon />} label={t.seats(car.seats)} />
          {fourthCell}
        </div>

        {/* Info badges — booking facts. On mobile keep only the high-signal ones (Instant / New)
            so the card stays uncluttered; desktop also shows the deposit/no-card reassurance. */}
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {car.available && <Badge label={`⚡ ${t.bInstant}`} tone="accent" />}
          {car.isNew && <Badge label={`✦ ${t.bNew}`} tone="new" />}
          {!isMobile && <Badge label={t.bCash} tone="plain" />}
          {!isMobile && <Badge label={t.bNoCard} tone="plain" />}
        </div>

        <div style={{ marginTop: 14, height: 1, background: 'var(--av-hair)' }} />

        {/* Price + CTA baseline — on mobile stack so the book action is full-width & thumb-sized */}
        <div style={{ marginTop: 14, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ font: '800 24px var(--f-display)', color: 'var(--av-text)', letterSpacing: '-.02em' }}>
              €{car.pricePerDay}
              <span style={{ font: '600 12px var(--f-ui)', color: 'var(--av-muted)' }}> {t.perDay}</span>
            </div>
            <div style={{ marginTop: 3, font: '500 10.5px var(--f-mono)', color: 'var(--av-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {car.mileageLimitPerDay === null ? (
                <>
                  {t.depositUnlim(car.deposit)}
                  <span style={{ color: 'var(--av-success-text)' }}>{t.unlimited}</span>
                </>
              ) : (
                t.depositKm(car.deposit, car.mileageLimitPerDay)
              )}
            </div>
          </div>

          {/* CTA — decorative (whole card is the link) */}
          {resumable ? (
            <span
              className="av-cta"
              style={{
                pointerEvents: 'none', flexShrink: 0, width: isMobile ? '100%' : undefined,
                padding: isMobile ? '13px 20px' : '11px 18px', minHeight: isMobile ? 46 : undefined,
                background: 'var(--grad-coral)', color: '#fff',
                borderRadius: isMobile ? 13 : 999, font: '700 clamp(12px, 2.8vw, 13px) var(--f-ui)', letterSpacing: '.01em',
                boxShadow: 'var(--sh-cta)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, whiteSpace: 'nowrap',
              }}
            >
              {t.resumeCta}
              <ArrowRight />
            </span>
          ) : car.available ? (
            <span
              className="av-cta"
              style={{
                pointerEvents: 'none', flexShrink: 0, width: isMobile ? '100%' : undefined,
                padding: isMobile ? '13px 20px' : '11px 18px', minHeight: isMobile ? 46 : undefined,
                background: 'var(--grad-coral)', color: '#fff',
                borderRadius: isMobile ? 13 : 999, font: '700 clamp(12px, 2.8vw, 13px) var(--f-ui)', letterSpacing: '.01em',
                boxShadow: 'var(--sh-cta)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, whiteSpace: 'nowrap',
              }}
            >
              {t.book}
              <ArrowRight />
            </span>
          ) : (
            <span
              style={{
                pointerEvents: 'none', flexShrink: 0, width: isMobile ? '100%' : undefined,
                padding: isMobile ? '13px 18px' : '11px 16px', minHeight: isMobile ? 46 : undefined,
                background: 'transparent', border: '1.5px solid var(--av-coral)',
                color: 'var(--av-coral-2)', borderRadius: isMobile ? 13 : 999, font: '700 clamp(11px, 2.6vw, 12px) var(--f-ui)', whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {t.fromDate} →
            </span>
          )}
        </div>
      </div>

      {/* Stretched cover link — the single booking navigation + accessible name.
          Empty + transparent; carousel controls sit above it (z-index 2). */}
      <Link
        href={href}
        aria-label={`${car.brand} ${car.model}, ${car.clsLabel}, €${car.pricePerDay} ${t.perDay}`}
        style={{ position: 'absolute', inset: 0, zIndex: 1, borderRadius: 'inherit' } as CSSProperties}
      />
    </article>
  )
}
