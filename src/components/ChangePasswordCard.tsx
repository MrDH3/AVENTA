'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { changePasswordAction, type ChangePwResult } from '../server/account-actions'

/**
 * Self-service "change password" form (current → new → confirm) for any signed-in user.
 * Theme-aware: `dark` matches the admin panel (--d-* tokens); default matches the light cabinet.
 */
const INIT: ChangePwResult = { ok: false }

export default function ChangePasswordCard({ dark = false }: { dark?: boolean }) {
  const [state, action] = useFormState(changePasswordAction, INIT)
  const formRef = useRef<HTMLFormElement>(null)
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')

  useEffect(() => {
    if (state.ok) { formRef.current?.reset(); setNext(''); setConfirm('') }
  }, [state.ok])

  const mismatch = confirm.length > 0 && next !== confirm
  const c = dark
    ? { text: 'var(--d-text)', muted: 'var(--d-muted)', card: 'var(--d-el)', field: 'var(--d-bg,#06222a)', line: 'var(--d-hair)', accent: 'var(--d-accent)', accentInk: '#082A33', green: 'var(--d-green,#3fb883)', red: 'var(--d-red,#e06a5a)' }
    : { text: '#0a2225', muted: '#5b7678', card: '#fff', field: '#f5f9f8', line: 'rgba(10,34,37,.12)', accent: '#0d9488', accentInk: '#fff', green: '#0f9d6f', red: '#d64b3d' }

  const label: CSSProperties = { display: 'block', font: '600 10px var(--f-mono,monospace)', letterSpacing: '.12em', textTransform: 'uppercase', color: c.muted, marginBottom: 6 }
  const input: CSSProperties = { width: '100%', boxSizing: 'border-box', background: c.field, border: `1px solid ${c.line}`, borderRadius: 10, padding: '11px 13px', font: '500 14px var(--f-ui)', color: c.text, outline: 'none' }

  return (
    <div style={{ maxWidth: 460, background: c.card, border: `1px solid ${c.line}`, borderRadius: 16, padding: 20 }}>
      <h2 style={{ font: '700 18px var(--f-display)', color: c.text, margin: 0 }}>Смена пароля</h2>
      <p style={{ font: '500 13px var(--f-ui)', color: c.muted, margin: '4px 0 0' }}>Введите текущий пароль и новый. Остальные сессии будут завершены.</p>

      <form ref={formRef} action={action} style={{ marginTop: 16, display: 'grid', gap: 13 }}>
        <div>
          <span style={label}>Текущий пароль</span>
          <input name="current" type="password" autoComplete="current-password" required style={input} />
        </div>
        <div>
          <span style={label}>Новый пароль</span>
          <input name="next" type="password" autoComplete="new-password" required minLength={8} value={next} onChange={(e) => setNext(e.target.value)} style={input} />
        </div>
        <div>
          <span style={label}>Повторите новый пароль</span>
          <input type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} style={{ ...input, borderColor: mismatch ? c.red : c.line }} />
          {mismatch && <div style={{ marginTop: 6, font: '600 11.5px var(--f-ui)', color: c.red }}>Пароли не совпадают</div>}
        </div>

        {state.ok && <div style={{ font: '700 12.5px var(--f-ui)', color: c.green }}>✓ Пароль изменён</div>}
        {!state.ok && state.error && <div style={{ font: '600 12.5px var(--f-ui)', color: c.red }}>{state.error}</div>}

        <Submit disabled={mismatch || next.length < 8} accent={c.accent} accentInk={c.accentInk} />
      </form>
    </div>
  )
}

function Submit({ disabled, accent, accentInk }: { disabled: boolean; accent: string; accentInk: string }) {
  const { pending } = useFormStatus()
  const off = disabled || pending
  return (
    <button type="submit" disabled={off} style={{ justifySelf: 'start', padding: '11px 20px', borderRadius: 11, border: 'none', background: accent, color: accentInk, font: '700 13px var(--f-ui)', cursor: off ? 'not-allowed' : 'pointer', opacity: off ? 0.55 : 1 }}>
      {pending ? '…' : 'Сохранить новый пароль'}
    </button>
  )
}
