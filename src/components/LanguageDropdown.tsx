'use client'

import { useEffect, useRef, useState } from 'react'
import Flag from './Flag'
import { useLang, LANGUAGES } from '../i18n/lang'

/**
 * Language switcher as a flag + name DROPDOWN (replaces the RU/EN pills). Scales to any number of
 * languages from the LANGUAGES registry. Two variants:
 *  - `bar`    → desktop top bar: compact trigger + absolute popover menu.
 *  - `drawer` → mobile hamburger: full-width trigger + inline expanding list.
 */
export default function LanguageDropdown({ variant = 'bar', glass = true, onSelect }: { variant?: 'bar' | 'drawer'; glass?: boolean; onSelect?: () => void }) {
  const { lang, setLang } = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isDrawer = variant === 'drawer'
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  const choose = (code: typeof lang) => { setLang(code); setOpen(false); onSelect?.() }

  const chevron = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform .18s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )

  const trigger = (
    <button
      type="button"
      aria-haspopup="listbox"
      aria-expanded={open}
      onClick={() => setOpen((v) => !v)}
      className={isDrawer ? 'av-tap' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: isDrawer ? '100%' : undefined,
        justifyContent: isDrawer ? 'flex-start' : 'center',
        padding: isDrawer ? '10px 12px' : '7px 11px',
        borderRadius: 12,
        cursor: 'pointer',
        background: isDrawer ? 'transparent' : glass ? 'rgba(255,255,255,.7)' : '#fff',
        border: `1px solid ${isDrawer ? 'var(--av-hair)' : 'var(--av-hair-strong)'}`,
        color: 'var(--av-text)',
        font: '700 14px var(--f-ui)',
        backdropFilter: !isDrawer && glass ? 'blur(6px)' : undefined,
      }}
    >
      <Flag code={current.code} emoji={current.flag} size={22} />
      <span style={{ flex: isDrawer ? 1 : undefined }}>{isDrawer ? current.label : current.label}</span>
      <span style={{ display: 'inline-flex', color: 'var(--av-teal)' }}>{chevron}</span>
    </button>
  )

  const list = (
    <ul
      role="listbox"
      style={{
        listStyle: 'none',
        margin: isDrawer ? '6px 0 0' : 0,
        padding: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        ...(isDrawer
          ? { position: 'static' }
          : { position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 190, zIndex: 80, background: '#fff', border: '1px solid var(--av-hair-strong)', borderRadius: 14, boxShadow: '0 20px 44px -18px rgba(11,85,96,.5)' }),
      }}
    >
      {LANGUAGES.map((l) => {
        const active = l.code === lang
        return (
          <li key={l.code} role="option" aria-selected={active}>
            <button
              type="button"
              onClick={() => choose(l.code)}
              className={isDrawer ? 'av-tap' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                cursor: 'pointer',
                textAlign: 'left',
                background: active ? 'rgba(20,153,174,.10)' : 'transparent',
                border: active ? '1px solid rgba(20,153,174,.35)' : '1px solid transparent',
                color: 'var(--av-text)',
                font: '700 15px var(--f-ui)',
              }}
            >
              <Flag code={l.code} emoji={l.flag} size={24} />
              <span style={{ flex: 1 }}>{l.label}</span>
              {active && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--av-teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )

  return (
    <div ref={ref} style={{ position: isDrawer ? 'static' : 'relative', width: isDrawer ? '100%' : undefined }}>
      {trigger}
      {open && list}
    </div>
  )
}
