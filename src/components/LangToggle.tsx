'use client'

import { useLang } from '../i18n/lang'

/** RU / EN segmented pill. `glass` matches the translucent hero variant. */
export default function LangToggle({ glass = true }: { glass?: boolean }) {
  const { lang, setLang } = useLang()
  const on: React.CSSProperties = { padding: '6px 13px', background: '#0E7E90', color: '#fff' }
  const off: React.CSSProperties = { padding: '6px 13px', color: '#0E7E90' }
  return (
    <div
      style={{
        display: 'flex',
        background: glass ? 'rgba(255,255,255,.6)' : '#fff',
        border: glass ? '1px solid rgba(255,255,255,.9)' : '1px solid var(--av-hair)',
        borderRadius: 999,
        overflow: 'hidden',
        font: "700 12px var(--f-ui)",
        cursor: 'pointer',
        backdropFilter: glass ? 'blur(6px)' : undefined,
        userSelect: 'none',
      }}
    >
      <span style={lang === 'ru' ? on : off} onClick={() => setLang('ru')}>
        RU
      </span>
      <span style={lang === 'en' ? on : off} onClick={() => setLang('en')}>
        EN
      </span>
    </div>
  )
}
