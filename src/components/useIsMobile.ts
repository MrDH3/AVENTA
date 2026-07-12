'use client'

import { useEffect, useState } from 'react'

/**
 * Client hook: true when the viewport is at or below `breakpoint` (px). Used to switch inline-styled
 * layouts between desktop and a thumb-friendly mobile variant (this codebase styles inline, so CSS
 * media queries can't reach most layout — components branch on this instead).
 *
 * SSR-safe: returns `false` (desktop) on the server + first client render, then corrects after mount.
 * 760px is the default customer-flow breakpoint (two-column → single-column, sidebar → drawer, etc.).
 */
export function useIsMobile(breakpoint = 760): boolean {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const on = () => setIsMobile(mq.matches)
    on()
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [breakpoint])
  return isMobile
}
