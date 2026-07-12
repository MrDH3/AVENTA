'use client'

import Link from 'next/link'

type LogoVariant = 'light' | 'onTeal' | 'mono-white'

interface LogoProps {
  size?: number
  wordmark?: boolean
  variant?: LogoVariant
  wordmarkSize?: number
  to?: string | null
  wordColor?: string
}

/**
 * AVENTA emblem — rounded square containing an "A" (teal apex + coral crossbar),
 * with a coral dot at the apex. See README "Logo".
 */
export function LogoMark({ size = 40, variant = 'light' }: { size?: number; variant?: LogoVariant }) {
  // square fill / stroke colors per surface
  const square = variant === 'onTeal' ? '#0E7E90' : variant === 'mono-white' ? '#ffffff' : '#ffffff'
  const apex = variant === 'onTeal' || variant === 'mono-white' ? '#ffffff' : '#0E7E90'
  const cross = variant === 'onTeal' ? '#FF8A5B' : '#FF7A5C'
  const dot = variant === 'onTeal' ? '#FF8A5B' : '#FF7A5C'

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="44" height="44" rx="14" fill={square} />
      <path
        d="M14 35 L24 12 L34 35"
        stroke={apex}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M18.6 27.2 H29.4" stroke={cross} strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="24" cy="12" r="2.6" fill={dot} />
    </svg>
  )
}

export default function Logo({
  size = 40,
  wordmark = true,
  variant = 'light',
  wordmarkSize = 24,
  to = '/',
  wordColor,
}: LogoProps) {
  const color = wordColor ?? (variant === 'light' ? '#0C3B45' : '#ffffff')
  const inner = (
    <span style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <LogoMark size={size} variant={variant} />
      {wordmark && (
        <span
          style={{
            font: `800 ${wordmarkSize}px var(--f-display)`,
            letterSpacing: '0.04em',
            color,
          }}
        >
          AVENTA
        </span>
      )}
    </span>
  )
  if (to === null) return inner
  return <Link href={to}>{inner}</Link>
}
