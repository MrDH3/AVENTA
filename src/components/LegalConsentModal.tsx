'use client'

import { useEffect, useRef, useState } from 'react'
import { useDict, type Lang } from '../i18n/lang'
import { privacyContent, distanceSellingContent } from '../data/legal-docs'

/**
 * Scroll-to-confirm legal modal. Renders a regulated document (privacy policy or distance-selling
 * contract) in an in-page modal — NOT a new tab — and only enables the "I have read and agree" action
 * once the reader has actually scrolled to the BOTTOM of the document. The parent wires the result to a
 * consent checkbox (disabled until the reader has scrolled through). Reports `onReachedEnd` (so the
 * outside checkbox can enable even if they close without pressing Agree) and `onAgree` (agree + close).
 */

export type LegalDocKey = 'privacy' | 'distance-selling'

const CONTENT: Record<LegalDocKey, typeof privacyContent> = {
  privacy: privacyContent,
  'distance-selling': distanceSellingContent,
}

// Modal CHROME (buttons/hints) is UI and is translated. The regulated document BODY is NOT machine-
// translated — for tr/es/de it shows the English text with `pendingNotice`. ru/en have no notice.
const dict = {
  en: {
    scrollHint: 'Scroll to the end to continue',
    agree: 'I have read and agree',
    close: 'Close',
    reachedEnd: 'You’ve read the full document',
    pendingNotice: '',
  },
  ru: {
    scrollHint: 'Пролистайте до конца, чтобы продолжить',
    agree: 'Я прочитал(а) и согласен(на)',
    close: 'Закрыть',
    reachedEnd: 'Вы прочитали документ полностью',
    pendingNotice: '',
  },
  tr: {
    scrollHint: 'Devam etmek için sonuna kadar kaydırın',
    agree: 'Okudum ve kabul ediyorum',
    close: 'Kapat',
    reachedEnd: 'Belgeyi tamamen okudunuz',
    pendingNotice: 'Bu belge henüz Türkçeye profesyonel olarak çevrilmedi; bağlayıcı metin aşağıdaki İngilizce sürümdür.',
  },
  es: {
    scrollHint: 'Desplázate hasta el final para continuar',
    agree: 'He leído y acepto',
    close: 'Cerrar',
    reachedEnd: 'Has leído el documento completo',
    pendingNotice: 'Este documento aún no ha sido traducido profesionalmente al español; el texto vinculante es la versión en inglés que se muestra a continuación.',
  },
  de: {
    scrollHint: 'Zum Fortfahren bis zum Ende scrollen',
    agree: 'Ich habe es gelesen und stimme zu',
    close: 'Schließen',
    reachedEnd: 'Sie haben das gesamte Dokument gelesen',
    pendingNotice: 'Dieses Dokument wurde noch nicht professionell ins Deutsche übersetzt; rechtlich verbindlich ist die unten angezeigte englische Fassung.',
  },
}

export default function LegalConsentModal({
  open,
  docKey,
  lang,
  onClose,
  onReachedEnd,
  onAgree,
}: {
  open: boolean
  docKey: LegalDocKey
  lang: Lang
  onClose: () => void
  onReachedEnd: () => void
  onAgree: () => void
}) {
  const t = useDict(dict)
  const doc = CONTENT[docKey][lang === 'ru' ? 'ru' : 'en']
  const scrollRef = useRef<HTMLDivElement>(null)
  const [reachedEnd, setReachedEnd] = useState(false)

  // Reset the scroll gate whenever a fresh document is opened.
  useEffect(() => {
    if (!open) return
    setReachedEnd(false)
    // A very short document may already be fully visible with no scroll possible → count it as read.
    requestAnimationFrame(() => {
      const el = scrollRef.current
      if (el && el.scrollHeight <= el.clientHeight + 4) {
        setReachedEnd(true)
        onReachedEnd()
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, docKey])

  // Escape closes; lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, onClose])

  if (!open) return null

  const onScroll = () => {
    const el = scrollRef.current
    if (!el || reachedEnd) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      setReachedEnd(true)
      onReachedEnd()
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={doc.title}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(11,40,46,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(12px,3vw,28px)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 40px 90px -30px rgba(11,85,96,.7)' }}
      >
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 20px', background: 'linear-gradient(135deg,#127C90,#1AA1B0)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: '800 16px var(--f-display)', color: '#fff' }}>{doc.title}</div>
            <div style={{ marginTop: 3, font: '500 11.5px/1.5 var(--f-ui)', color: '#DDF4F7' }}>{doc.turkishTitle}</div>
          </div>
          <button type="button" onClick={onClose} aria-label={t.close} className="av-tap" style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,.2)', color: '#fff', cursor: 'pointer', font: '700 16px var(--f-ui)' }}>✕</button>
        </div>

        {/* scrollable document body */}
        <div ref={scrollRef} onScroll={onScroll} style={{ flex: 1, overflowY: 'auto', padding: 'clamp(18px,3vw,26px)', WebkitOverflowScrolling: 'touch' }}>
          {t.pendingNotice && (
            <div role="note" style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 12, background: '#EAF6FF', border: '1px solid #9CC2EA' }}>
              <span aria-hidden style={{ fontSize: 15, flexShrink: 0 }}>🌐</span>
              <div style={{ font: '600 11.5px/1.55 var(--f-ui)', color: '#2A5A8A' }}>{t.pendingNotice}</div>
            </div>
          )}
          <p style={{ margin: 0, font: '500 13px/1.7 var(--f-ui)', color: '#5E8A92' }}>{doc.intro}</p>
          {doc.sections.map((s, i) => (
            <section key={s.h} style={{ marginTop: 18 }}>
              <h3 style={{ margin: 0, font: '800 14px var(--f-display)', color: '#0E7E90' }}>{i + 1}. {s.h}</h3>
              <p style={{ margin: '7px 0 0', font: '500 13px/1.75 var(--f-ui)', color: '#3F6670' }}>{s.b}</p>
            </section>
          ))}
          <div style={{ height: 4 }} />
        </div>

        {/* footer — agree enables only after scrolling to the end */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #EAF3F4', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ flex: 1, minWidth: 140, font: '600 11.5px var(--f-ui)', color: reachedEnd ? '#1F9E6B' : '#8AA5AC' }}>
            {reachedEnd ? `✓ ${t.reachedEnd}` : `↓ ${t.scrollHint}`}
          </span>
          <button
            type="button"
            onClick={onAgree}
            disabled={!reachedEnd}
            className="av-tap"
            style={{ minHeight: 44, padding: '11px 20px', borderRadius: 11, border: 'none', background: reachedEnd ? 'linear-gradient(180deg,#2FC27F,#1F9E6B)' : '#CBD8DA', color: '#fff', font: '800 13px var(--f-ui)', cursor: reachedEnd ? 'pointer' : 'not-allowed', boxShadow: reachedEnd ? '0 12px 24px -12px rgba(31,158,107,.7)' : 'none' }}
          >
            {t.agree}
          </button>
        </div>
      </div>
    </div>
  )
}
