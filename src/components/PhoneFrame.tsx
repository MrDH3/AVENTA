'use client'

import type { CSSProperties, ReactNode } from 'react'

/**
 * iPhone-style device frame. `dark={false}` (light) for client mobile screens,
 * `dark` for the mobile-admin set. Inner content scrolls within the screen.
 */
export default function PhoneFrame({
  children,
  dark = false,
  label,
  width = 300,
  height = 620,
  statusTime = '9:41',
}: {
  children: ReactNode
  dark?: boolean
  label?: string
  width?: number
  height?: number
  statusTime?: string
}) {
  const screenBg = dark ? 'var(--d-base)' : 'var(--av-bg)'
  const frameBorder = dark ? '#0a323d' : '#0c3b45'
  const statusColor = dark ? '#ECF1F8' : '#0C3B45'
  const wrap: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }
  return (
    <div style={wrap}>
      <div
        style={{
          width,
          height,
          borderRadius: 44,
          background: frameBorder,
          padding: 11,
          boxShadow: '0 40px 80px -40px rgba(11,85,96,.6), 0 6px 16px -8px rgba(11,85,96,.4)',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 34,
            background: screenBg,
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* notch */}
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 116,
              height: 26,
              borderRadius: 999,
              background: frameBorder,
              zIndex: 30,
            }}
          />
          {/* status bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 22px 6px',
              font: "700 12px var(--f-ui)",
              color: statusColor,
              zIndex: 20,
            }}
          >
            <span>{statusTime}</span>
            <span style={{ display: 'flex', gap: 5, alignItems: 'center', opacity: 0.85 }}>
              <span style={{ font: "700 10px var(--f-ui)" }}>5G</span>
              <span
                style={{
                  width: 22,
                  height: 11,
                  border: `1px solid ${statusColor}`,
                  borderRadius: 3,
                  position: 'relative',
                  opacity: 0.7,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    inset: 1.5,
                    width: '70%',
                    background: statusColor,
                    borderRadius: 1,
                  }}
                />
              </span>
            </span>
          </div>
          {/* scrollable content */}
          <div className="av-noscroll" style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
            {children}
          </div>
        </div>
      </div>
      {label && (
        <div style={{ font: "600 12px var(--f-mono)", letterSpacing: '.08em', color: 'var(--av-muted)' }}>
          {label}
        </div>
      )}
    </div>
  )
}
