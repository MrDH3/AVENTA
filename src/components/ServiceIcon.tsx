import type { CSSProperties } from 'react'

/**
 * Distinct line icons for the booking extras, in the project's inline-SVG house
 * style (24-viewbox, currentColor stroke, round caps). Keyed by Service.key so
 * every add-on gets a recognizable, non-repeating glyph. Unknown keys fall back
 * to a generic "add-on" mark.
 */
export default function ServiceIcon({ serviceKey, size = 18, style }: { serviceKey: string; size?: number; style?: CSSProperties }) {
  const base = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    style,
  }
  switch (serviceKey) {
    case 'child_seat': // a car child-seat: backrest + base + harness
      return (
        <svg {...base}>
          <path d="M9 4h2.5a3 3 0 0 1 3 3v6H9z" />
          <path d="M9 13h6.5l-1 5H10z" />
          <path d="M11 7.5h2.6" />
        </svg>
      )
    case 'extra_driver': // person + plus
      return (
        <svg {...base}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.8 19a5.2 5.2 0 0 1 10.4 0" />
          <path d="M18 8v5M15.5 10.5h5" />
        </svg>
      )
    case 'delivery': // delivery van
      return (
        <svg {...base}>
          <path d="M3 6h9v8H3z" />
          <path d="M12 9h4l2.6 3v2H12z" />
          <circle cx="7" cy="16.4" r="1.6" />
          <circle cx="16" cy="16.4" r="1.6" />
        </svg>
      )
    case 'return_other': // two location pins = a different drop-off place
      return (
        <svg {...base}>
          <path d="M8 13.5s3.3-2.8 3.3-5.4A3.3 3.3 0 1 0 4.7 8.1C4.7 10.7 8 13.5 8 13.5z" />
          <circle cx="8" cy="8" r="1" />
          <path d="M16.2 20.5s3.3-2.8 3.3-5.4a3.3 3.3 0 1 0-6.6 0c0 2.6 3.3 5.4 3.3 5.4z" />
          <circle cx="16.2" cy="15" r="1" />
        </svg>
      )
    case 'unlimited_mileage': // infinity
      return (
        <svg {...base}>
          <path d="M9 9a3 3 0 1 0 0 6c2 0 2.4-3 3-3s1 3 3 3a3 3 0 1 0 0-6c-2 0-2.4 3-3 3s-1-3-3-3z" />
        </svg>
      )
    case 'transfer_airport': // airplane
      return (
        <svg {...base}>
          <path d="M21 4 3 11l6 2 2 6 3-4 4 3z" />
          <path d="M21 4 9 13" />
        </svg>
      )
    case 'vip_meet': // crown = VIP
      return (
        <svg {...base}>
          <path d="M4 9l3.5 3.4L12 6l4.5 6.4L20 9l-1.8 9H5.8z" />
          <path d="M5.8 18h12.4" />
        </svg>
      )
    case 'esim': // SIM card
      return (
        <svg {...base}>
          <path d="M7 4h5l5 5v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
          <rect x="9" y="11" width="6" height="6" rx="1" />
          <path d="M12 11v6M9 14h6" />
        </svg>
      )
    default: // generic add-on
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8.5v7M8.5 12h7" />
        </svg>
      )
  }
}
