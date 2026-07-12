'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

export interface SelectOption {
  value: string
  label: string
  icon?: ReactNode
}

/**
 * A searchable single-select dropdown styled for the customer (teal/coral) UI. Handles large option
 * lists (thousands) by rendering only the first N matches for a query and prompting to refine.
 */
export default function SearchSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  disabled,
  emptyText,
  maxRender = 60,
}: {
  options: SelectOption[]
  value: string | null
  onChange: (value: string) => void
  placeholder: string
  searchPlaceholder: string
  disabled?: boolean
  emptyText: string
  maxRender?: number
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value) ?? null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])
  const shown = filtered.slice(0, maxRender)
  const overflow = filtered.length - shown.length

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    const id = window.setTimeout(() => inputRef.current?.focus(), 20)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); window.clearTimeout(id) }
  }, [open])

  const choose = (v: string) => { onChange(v); setOpen(false); setQuery('') }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          minHeight: 46,
          padding: '10px 12px',
          borderRadius: 12,
          border: '1px solid var(--av-hair-soft)',
          background: disabled ? 'var(--av-field, #F3FAFB)' : '#fff',
          color: selected ? 'var(--av-text)' : 'var(--av-muted)',
          font: '600 15px var(--f-ui)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          opacity: disabled ? 0.7 : 1,
        }}
      >
        {selected?.icon}
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--av-teal)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform .18s', transform: open ? 'rotate(180deg)' : 'none' }}><path d="M6 9l6 6 6-6" /></svg>
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 90,
            background: '#fff',
            border: '1px solid var(--av-hair-strong)',
            borderRadius: 14,
            boxShadow: '0 22px 48px -20px rgba(11,85,96,.5)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: 8, borderBottom: '1px solid var(--av-hair-soft)' }}>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--av-hair-soft)', background: 'var(--av-field, #F3FAFB)', font: '600 15px var(--f-ui)', color: 'var(--av-text)', outline: 'none' }}
            />
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto', padding: 6 }}>
            {shown.length === 0 ? (
              <div style={{ padding: '14px 12px', font: '500 13px var(--f-ui)', color: 'var(--av-muted)', textAlign: 'center' }}>{emptyText}</div>
            ) : (
              shown.map((o) => {
                const active = o.value === value
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => choose(o.value)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: 'none',
                      background: active ? 'rgba(20,153,174,.10)' : 'transparent',
                      color: 'var(--av-text)',
                      font: active ? '700 15px var(--f-ui)' : '600 15px var(--f-ui)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--av-field, #F3FAFB)' }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
                  >
                    {o.icon}
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>
                    {active && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--av-teal)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                  </button>
                )
              })
            )}
            {overflow > 0 && (
              <div style={{ padding: '8px 12px', font: '500 12px var(--f-ui)', color: 'var(--av-muted)', textAlign: 'center' }}>
                +{overflow} — {searchPlaceholder.toLowerCase()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
