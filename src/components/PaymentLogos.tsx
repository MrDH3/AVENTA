'use client'

/**
 * Payment-method logos required by iyzico for go-live (Visa / Mastercard / iyzico).
 * Self-contained inline SVG marks (no external assets — the site's CSP blocks remote images).
 * These are clean placeholder marks; swap for the official brand assets before launch if desired.
 * Rendered on white chips so they read on any footer background.
 */

function Chip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span
      aria-label={label}
      title={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 34,
        minWidth: 54,
        padding: '0 12px',
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 4px 12px -6px rgba(11,85,96,.4)',
      }}
    >
      {children}
    </span>
  )
}

function VisaMark() {
  return (
    <svg width="46" height="16" viewBox="0 0 46 16" role="img" aria-hidden>
      <text
        x="0"
        y="13"
        style={{ font: '900 15px "Plus Jakarta Sans", sans-serif', letterSpacing: '.02em' }}
        fill="#1A1F71"
      >
        VISA
      </text>
    </svg>
  )
}

function MastercardMark() {
  return (
    <svg width="40" height="26" viewBox="0 0 40 26" role="img" aria-hidden>
      <circle cx="15" cy="13" r="9" fill="#EB001B" />
      <circle cx="25" cy="13" r="9" fill="#F79E1B" />
      <path d="M20 6.2a9 9 0 0 0 0 13.6 9 9 0 0 0 0-13.6z" fill="#FF5F00" />
    </svg>
  )
}

function IyzicoMark() {
  return (
    <svg width="56" height="16" viewBox="0 0 56 16" role="img" aria-hidden>
      <text
        x="0"
        y="13"
        style={{ font: '800 14px "Plus Jakarta Sans", sans-serif', letterSpacing: '-.01em' }}
        fill="#1E64FF"
      >
        iyzico
      </text>
      <circle cx="3" cy="3.4" r="1.7" fill="#00CFB4" />
    </svg>
  )
}

export default function PaymentLogos({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', ...style }}>
      <Chip label="Visa">
        <VisaMark />
      </Chip>
      <Chip label="Mastercard">
        <MastercardMark />
      </Chip>
      <Chip label="iyzico">
        <IyzicoMark />
      </Chip>
    </div>
  )
}
