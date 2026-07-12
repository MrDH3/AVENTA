'use client'

import { useEffect, useRef, useState } from 'react'
import { useDict } from '../i18n/lang'
import { useIsMobile } from './useIsMobile'

export interface CarPhoto {
  full: string
  thumb: string
}

const dict = {
  ru: {
    photoOf: (n: number, t: number) => `Фото ${n} из ${t}`,
    prev: 'Предыдущее фото',
    next: 'Следующее фото',
    gallery: (b: string, m: string) => `Фотографии — ${b} ${m}`,
  },
  en: {
    photoOf: (n: number, t: number) => `Photo ${n} of ${t}`,
    prev: 'Previous photo',
    next: 'Next photo',
    gallery: (b: string, m: string) => `${b} ${m} photos`,
  },
  tr: {
    photoOf: (n: number, t: number) => `Fotoğraf ${n}/${t}`,
    prev: 'Önceki fotoğraf',
    next: 'Sonraki fotoğraf',
    gallery: (b: string, m: string) => `${b} ${m} fotoğrafları`,
  },
  es: {
    photoOf: (n: number, t: number) => `Foto ${n} de ${t}`,
    prev: 'Foto anterior',
    next: 'Foto siguiente',
    gallery: (b: string, m: string) => `Fotos de ${b} ${m}`,
  },
  de: {
    photoOf: (n: number, t: number) => `Foto ${n} von ${t}`,
    prev: 'Vorheriges Foto',
    next: 'Nächstes Foto',
    gallery: (b: string, m: string) => `Fotos von ${b} ${m}`,
  },
}

/** Respects the user's reduced-motion preference (SSR-safe: starts false). */
function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduce(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return reduce
}

const AUTOPLAY_MS = 4200

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--av-text)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {dir === 'left' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
    </svg>
  )
}

/**
 * The media stage for a car card: a cross-fading photo carousel with the class
 * pill, status pill and title plate composited over it. Single-photo cars show
 * one image with NO controls. Multi-photo cars auto-slide (pause on hover/focus,
 * disabled under prefers-reduced-motion) with dot + arrow controls and keyboard
 * paging. Carousel controls are the ONLY interactive elements here — they sit at
 * z-index 2, above the card's stretched cover link (z-index 1).
 */
export default function CarPhotos({
  photos,
  brand,
  model,
  year,
  clsLabel,
  statusText,
  available,
}: {
  photos: CarPhoto[]
  brand: string
  model: string
  year: number
  clsLabel: string
  statusText: string
  available: boolean
}) {
  const t = useDict(dict)
  const reduce = useReducedMotion()
  const isMobile = useIsMobile()
  const [i, setI] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)

  const n = photos.length
  const multi = n > 1
  const paused = hovered || focused // pause on EITHER hover or keyboard focus
  const autoplay = multi && !paused && !reduce

  useEffect(() => {
    if (!autoplay) return
    const id = setInterval(() => {
      if (!document.hidden) setI((v) => (v + 1) % n)
    }, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [autoplay, n])

  // Keep the index in range if the photo set shrinks (functional update → no re-trigger loop).
  useEffect(() => {
    setI((p) => (p >= n && n > 0 ? 0 : p))
  }, [n])

  const go = (idx: number) => setI(((idx % n) + n) % n)
  const imgFilter = available ? 'none' : 'saturate(.62) brightness(.97)'

  // Touch swipe paging (mobile has no arrows). Horizontal swipe past the threshold
  // pages the same way ArrowLeft/ArrowRight do — no new state, just drives go().
  const touch = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    const p = e.touches[0]
    touch.current = { x: p.clientX, y: p.clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touch.current
    touch.current = null
    if (!start) return
    const p = e.changedTouches[0]
    const dx = p.clientX - start.x
    const dy = p.clientY - start.y
    // Only treat as a swipe if mostly-horizontal and past a comfortable threshold.
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      e.stopPropagation()
      go(dx < 0 ? i + 1 : i - 1)
    }
  }

  const stage = {
    position: 'relative',
    width: '100%',
    aspectRatio: '4 / 3',
    overflow: 'hidden',
    background: 'linear-gradient(135deg,#DCF3F6,#B6E6EE)',
  } as const

  const groupProps = multi
    ? {
        role: 'group' as const,
        'aria-roledescription': 'carousel',
        'aria-label': t.gallery(brand, model),
        tabIndex: 0,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); go(i + 1) }
          else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); go(i - 1) }
        },
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
        onFocusCapture: () => setFocused(true),
        onBlurCapture: () => setFocused(false),
        onTouchStart,
        onTouchEnd,
      }
    : {}

  return (
    <div style={stage} {...groupProps}>
      {/* Slides */}
      {photos.map((p, k) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={k}
          src={p.thumb}
          alt={k === 0 ? `${brand} ${model}` : ''}
          aria-hidden={multi && k !== i}
          draggable={false}
          loading={k === 0 ? 'eager' : 'lazy'}
          decoding="async"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
            opacity: !multi || k === i ? 1 : 0,
            transition: reduce ? 'none' : 'opacity 520ms cubic-bezier(.4,0,.2,1)',
            transform: 'translateZ(0)',
            filter: imgFilter,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Busy veil — seaside tint, never gray */}
      {!available && <div style={{ position: 'absolute', inset: 0, background: 'rgba(234,247,248,.28)', pointerEvents: 'none' }} />}

      {/* Scrim: legibility for pills (top) + title plate (bottom) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(6,42,49,.40) 0%, transparent 20%, transparent 55%, rgba(6,42,49,.58) 100%)',
        }}
      />

      {/* Class pill — top-left, opaque white, teal mono */}
      <span
        style={{
          position: 'absolute', top: 12, left: 12, pointerEvents: 'none',
          padding: '5px 10px', borderRadius: 999, background: '#fff',
          font: '700 10px var(--f-mono)', letterSpacing: '.06em', textTransform: 'uppercase',
          color: 'var(--av-teal)', boxShadow: '0 4px 12px -6px rgba(11,85,96,.4)',
        }}
      >
        {clsLabel}
      </span>

      {/* Status pill — top-right, ~94% white chip, text+color */}
      <span
        style={{
          position: 'absolute', top: 12, right: 12, pointerEvents: 'none',
          display: 'flex', alignItems: 'center', gap: 6, maxWidth: '62%',
          padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,.94)',
          boxShadow: '0 4px 12px -6px rgba(11,85,96,.4)',
          font: '700 10px var(--f-ui)', whiteSpace: 'nowrap',
          color: available ? 'var(--av-success-text)' : 'var(--av-warn-text)',
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: available ? 'var(--av-success)' : 'var(--av-warn)' }} />
        {statusText}
      </span>

      {/* Title plate — brand / model / year over the bottom scrim */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: multi ? 32 : 16,
          padding: '0 16px', pointerEvents: 'none',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ font: '700 clamp(19px, 6vw, 22px)/1.05 var(--f-display)', letterSpacing: '-.01em', color: '#fff', textShadow: '0 1px 12px rgba(6,42,49,.5)' }}>
            {brand}
          </div>
          <div
            style={{
              font: '600 clamp(18px, 5.6vw, 22px) var(--f-display)', color: '#fff', opacity: 0.86,
              textShadow: '0 1px 12px rgba(6,42,49,.5)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            {model}
          </div>
        </div>
        <div style={{ font: '400 13px var(--f-mono)', letterSpacing: '.04em', color: 'rgba(255,255,255,.82)', textShadow: '0 1px 10px rgba(6,42,49,.5)', flexShrink: 0 }}>
          {year}
        </div>
      </div>

      {/* Controls (multi-photo only) */}
      {multi && (
        <>
          {/* Dots — the signature coral progress tick */}
          <div style={{ position: 'absolute', left: '50%', bottom: 13, transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 2 }}>
            {photos.map((_, k) => {
              const active = k === i
              return (
                <button
                  key={k}
                  type="button"
                  className="av-dot"
                  aria-label={t.photoOf(k + 1, n)}
                  aria-current={active ? 'true' : undefined}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); go(k) }}
                  style={{
                    // Bigger vertical hit area on mobile (~44px tall) without shifting the visual tick.
                    padding: isMobile ? '20px 6px' : 10,
                    margin: isMobile ? '-20px -6px' : -10,
                    border: 'none', background: 'transparent', cursor: 'pointer', lineHeight: 0, borderRadius: 999,
                  }}
                >
                  <span
                    style={{
                      display: 'block', position: 'relative', overflow: 'hidden',
                      height: 4, width: active ? 26 : 8, borderRadius: 999,
                      background: active ? (autoplay ? 'rgba(255,122,92,.5)' : 'var(--av-coral)') : 'rgba(255,255,255,.55)',
                      transition: reduce ? 'none' : 'width .32s ease, background .32s ease',
                    }}
                  >
                    {active && autoplay && (
                      <span
                        key={i}
                        className="av-tick"
                        style={{ position: 'absolute', inset: 0, background: 'var(--av-coral)', transformOrigin: 'left' }}
                      />
                    )}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Arrows — hover/focus only, hidden on touch (av-arrow) */}
          <button
            type="button"
            aria-label={t.prev}
            className="av-arrow"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); go(i - 1) }}
            style={{ ...arrowStyle, left: 12, opacity: hovered ? 1 : 0 }}
          >
            <Chevron dir="left" />
          </button>
          <button
            type="button"
            aria-label={t.next}
            className="av-arrow"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); go(i + 1) }}
            style={{ ...arrowStyle, right: 12, opacity: hovered ? 1 : 0 }}
          >
            <Chevron dir="right" />
          </button>

          {/* Screen-reader live region */}
          <span aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
            {t.photoOf(i + 1, n)}
          </span>
        </>
      )}
    </div>
  )
}

const arrowStyle = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 2,
  width: 30,
  height: 30,
  borderRadius: '50%',
  border: 'none',
  background: 'rgba(255,255,255,.92)',
  boxShadow: '0 4px 12px -6px rgba(11,85,96,.5)',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
} as const
