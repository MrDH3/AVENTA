'use client'

import { useState, type ReactNode } from 'react'

/**
 * A collapsible admin panel (dark theme). Used to tuck less-frequently-needed order detail
 * (documents, full payment history) behind a header so the frequently-used controls are what you
 * see first. Keyboard-operable (native <button>), no motion beyond an instant chevron flip
 * (reduced-motion safe by construction).
 */
export default function Collapsible({
  title,
  count,
  defaultOpen = false,
  accent,
  children,
}: {
  title: string
  /** Optional right-aligned count/summary shown in the header (e.g. "8 файлов"). */
  count?: ReactNode
  defaultOpen?: boolean
  /** Optional left accent colour for the header bar. */
  accent?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div
      style={{
        background: 'var(--d-panel)',
        border: '1px solid rgba(255,255,255,.07)',
        borderLeft: accent ? `3px solid ${accent}` : '1px solid rgba(255,255,255,.07)',
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '15px 22px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: 12,
            fontSize: 10,
            color: 'var(--d-muted)',
            transform: open ? 'rotate(90deg)' : 'none',
          }}
        >
          ▶
        </span>
        <span style={{ font: '400 10px var(--f-mono)', letterSpacing: '.12em', color: 'var(--d-muted-2)', flex: 1 }}>
          {title}
        </span>
        {count != null && (
          <span style={{ font: '600 11px var(--f-ui)', color: 'var(--d-muted)' }}>{count}</span>
        )}
        <span style={{ font: '700 11px var(--f-ui)', color: 'var(--d-accent-light)' }}>
          {open ? 'Свернуть' : 'Показать'}
        </span>
      </button>
      {open && <div style={{ padding: '2px 22px 22px' }}>{children}</div>}
    </div>
  )
}
