/**
 * Small, crisp SVG flag for the language switcher. Emoji flags don't render on
 * many desktop browsers (Windows has no flag glyphs), so known languages get a
 * hand-drawn SVG; anything else falls back to the emoji passed from LANGUAGES.
 * Normalised to a 28×20 box so every flag lines up in a list.
 */
export default function Flag({ code, emoji, size = 24 }: { code: string; emoji?: string; size?: number }) {
  const w = size
  const h = Math.round((size * 20) / 28)
  const box = {
    width: w,
    height: h,
    display: 'block',
    borderRadius: 4,
    boxShadow: '0 0 0 1px rgba(11,85,96,.12)',
    flex: '0 0 auto',
  } as const

  if (code === 'ru') {
    return (
      <svg viewBox="0 0 28 20" style={box} aria-hidden="true">
        <rect width="28" height="20" fill="#fff" />
        <rect y="6.67" width="28" height="6.66" fill="#0039A6" />
        <rect y="13.33" width="28" height="6.67" fill="#D52B1E" />
      </svg>
    )
  }

  if (code === 'en') {
    // Union Jack — simplified (diagonals not counter-changed), reads correctly at icon size.
    return (
      <svg viewBox="0 0 28 20" style={box} aria-hidden="true">
        <rect width="28" height="20" fill="#012169" />
        <path d="M0 0 L28 20 M28 0 L0 20" stroke="#fff" strokeWidth="4" />
        <path d="M0 0 L28 20 M28 0 L0 20" stroke="#C8102E" strokeWidth="2" />
        <path d="M14 0 V20 M0 10 H28" stroke="#fff" strokeWidth="6" />
        <path d="M14 0 V20 M0 10 H28" stroke="#C8102E" strokeWidth="3.4" />
      </svg>
    )
  }

  if (code === 'tr') {
    // Turkey — red field, white crescent + star (approximate, reads correctly at icon size).
    return (
      <svg viewBox="0 0 28 20" style={box} aria-hidden="true">
        <rect width="28" height="20" fill="#E30A17" />
        <circle cx="11" cy="10" r="5" fill="#fff" />
        <circle cx="12.6" cy="10" r="4" fill="#E30A17" />
        <path d="M17.6 10 L15.1 10.8 L16.6 8.7 L16.6 11.3 L15.1 9.2 Z" fill="#fff" />
      </svg>
    )
  }

  if (code === 'es') {
    // Spain — red / yellow (double height) / red horizontal bands.
    return (
      <svg viewBox="0 0 28 20" style={box} aria-hidden="true">
        <rect width="28" height="20" fill="#AA151B" />
        <rect y="5" width="28" height="10" fill="#F1BF00" />
      </svg>
    )
  }

  if (code === 'de') {
    // Germany — black / red / gold horizontal thirds.
    return (
      <svg viewBox="0 0 28 20" style={box} aria-hidden="true">
        <rect width="28" height="6.67" fill="#000" />
        <rect y="6.67" width="28" height="6.66" fill="#DD0000" />
        <rect y="13.33" width="28" height="6.67" fill="#FFCE00" />
      </svg>
    )
  }

  // Not-yet-drawn language: fall back to the emoji flag from the data list.
  return (
    <span aria-hidden="true" style={{ fontSize: h, lineHeight: 1, width: w, textAlign: 'center', flex: '0 0 auto' }}>
      {emoji}
    </span>
  )
}
