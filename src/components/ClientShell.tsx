'use client'

import type { ReactNode } from 'react'
import ClientNav from './ClientNav'
import ClientFooter from './ClientFooter'

/**
 * Standard client page wrapper: a soft sky band holds the nav (optionally with a
 * hero), then page content on the app background, then the dark footer.
 * Home renders its own animated hero, so it uses ClientNav/ClientFooter directly.
 */
export default function ClientShell({
  children,
  hero,
  headerBg = 'linear-gradient(180deg,#CDEFF6 0%,#A7E2EC 80%,#EAF7F8 100%)',
}: {
  children: ReactNode
  hero?: ReactNode
  headerBg?: string
}) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--av-bg)', overflowX: 'clip' }}>
      {/* Sticky nav band (pinned on scroll). The hero, if any, sits in its own band below so only the
          nav stays fixed — not the hero. */}
      <div className="av-sticky-header" style={{ background: headerBg }}>
        <ClientNav glass />
      </div>
      {hero && <div style={{ background: headerBg, position: 'relative' }}>{hero}</div>}
      <main>{children}</main>
      <ClientFooter />
    </div>
  )
}
