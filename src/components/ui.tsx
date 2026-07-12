'use client'

import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'

/** Max-width centred container with responsive side padding. */
export function Container({
  children,
  style,
  narrow = false,
  pt,
  pb,
}: {
  children: ReactNode
  style?: CSSProperties
  narrow?: boolean
  pt?: number | string
  pb?: number | string
}) {
  return (
    <div
      style={{
        maxWidth: narrow ? 'var(--container-narrow)' : 'var(--container)',
        margin: '0 auto',
        padding: '0 var(--pad-x)',
        paddingTop: pt,
        paddingBottom: pb,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Mono uppercase micro-label. */
export function Kicker({
  children,
  color = 'var(--av-coral)',
  style,
}: {
  children: ReactNode
  color?: string
  style?: CSSProperties
}) {
  return (
    <div style={{ font: "700 12px var(--f-mono)", letterSpacing: '.16em', color, ...style }}>
      {children}
    </div>
  )
}

const coralBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 9,
  padding: '14px 24px',
  background: 'var(--grad-coral)',
  color: '#fff',
  borderRadius: 'var(--r-btn)',
  font: "700 14px var(--f-ui)",
  border: 'none',
  boxShadow: 'var(--sh-cta)',
}

export function CoralButton({
  children,
  to,
  onClick,
  type = 'button',
  style,
  full,
}: {
  children: ReactNode
  to?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  style?: CSSProperties
  full?: boolean
}) {
  const s = { ...coralBtn, ...(full ? { width: '100%' } : {}), ...style }
  if (to)
    return (
      <Link href={to} className="av-cta" style={s}>
        {children}
      </Link>
    )
  return (
    <button type={type} onClick={onClick} className="av-cta" style={s}>
      {children}
    </button>
  )
}

export function OutlineButton({
  children,
  to,
  onClick,
  style,
}: {
  children: ReactNode
  to?: string
  onClick?: () => void
  style?: CSSProperties
}) {
  const s: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px 20px',
    border: '1.5px solid var(--av-coral)',
    color: 'var(--av-coral-2)',
    background: 'transparent',
    borderRadius: 'var(--r-btn)',
    font: "700 13px var(--f-ui)",
    ...style,
  }
  if (to)
    return (
      <Link href={to} className="av-cta" style={s}>
        {children}
      </Link>
    )
  return (
    <button onClick={onClick} className="av-cta" style={s}>
      {children}
    </button>
  )
}

export type StatusTone = 'success' | 'warn' | 'danger' | 'info' | 'neutral'

const toneMap: Record<StatusTone, { bg: string; text: string; dot: string }> = {
  success: { bg: 'var(--av-success-bg)', text: 'var(--av-success-text)', dot: 'var(--av-success)' },
  warn: { bg: 'var(--av-warn-bg)', text: 'var(--av-warn-text)', dot: 'var(--av-warn)' },
  danger: { bg: 'var(--av-danger-bg)', text: 'var(--av-danger)', dot: 'var(--av-danger)' },
  info: { bg: 'var(--av-info-bg)', text: 'var(--av-info)', dot: 'var(--av-info)' },
  neutral: { bg: 'var(--av-field)', text: 'var(--av-muted)', dot: 'var(--av-muted)' },
}

export function StatusPill({
  children,
  tone = 'success',
  dot = true,
  style,
}: {
  children: ReactNode
  tone?: StatusTone
  dot?: boolean
  style?: CSSProperties
}) {
  const c = toneMap[tone]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 11px',
        background: c.bg,
        borderRadius: 999,
        font: "700 10px var(--f-ui)",
        color: c.text,
        ...style,
      }}
    >
      {dot && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot }} />
      )}
      {children}
    </span>
  )
}

/** White rounded card surface. */
export function Card({
  children,
  style,
  pad = 24,
  hover = false,
}: {
  children: ReactNode
  style?: CSSProperties
  pad?: number | string
  hover?: boolean
}) {
  return (
    <div
      className={hover ? 'av-lift' : undefined}
      style={{
        background: 'var(--av-surface)',
        borderRadius: 'var(--r-card)',
        padding: pad,
        boxShadow: 'var(--sh-card)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
