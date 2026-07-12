'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  createAdminAction,
  archiveAdminAction,
  unarchiveAdminAction,
  removeAdminAction,
  addRecoveryEmailAction,
  removeRecoveryEmailAction,
  type StaffRow,
  type RecoveryRow,
  type ActionResult,
} from '../server/owner-actions'

const INIT: ActionResult = { ok: false }

const card: CSSProperties = { background: 'var(--d-el)', border: '1px solid var(--d-hair)', borderRadius: 16, padding: 20 }
const label: CSSProperties = { display: 'block', font: '600 10px var(--f-mono,monospace)', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--d-muted)', marginBottom: 6 }
const input: CSSProperties = { width: '100%', boxSizing: 'border-box', background: 'var(--d-bg,#06222a)', border: '1px solid var(--d-hair)', borderRadius: 10, padding: '11px 13px', font: '500 14px var(--f-ui)', color: 'var(--d-text)', outline: 'none' }
const h2: CSSProperties = { font: '700 18px var(--f-display)', color: 'var(--d-text)', margin: 0 }
const sub: CSSProperties = { font: '500 13px var(--f-ui)', color: 'var(--d-muted)', margin: '4px 0 0' }

function primaryBtn(pending: boolean): CSSProperties {
  return { padding: '11px 18px', borderRadius: 11, border: 'none', background: 'var(--d-accent)', color: '#082A33', font: '700 13px var(--f-ui)', cursor: pending ? 'wait' : 'pointer', opacity: pending ? 0.7 : 1 }
}
const ghostBtn: CSSProperties = { padding: '8px 13px', borderRadius: 9, border: '1px solid var(--d-hair)', background: 'transparent', color: 'var(--d-text)', font: '700 12px var(--f-ui)', cursor: 'pointer' }
const dangerBtn: CSSProperties = { padding: '8px 13px', borderRadius: 9, border: '1px solid rgba(214,75,61,.4)', background: 'rgba(214,75,61,.12)', color: 'var(--d-red,#e06a5a)', font: '700 12px var(--f-ui)', cursor: 'pointer' }

function Submit({ children }: { children: string }) {
  const { pending } = useFormStatus()
  return <button type="submit" disabled={pending} style={primaryBtn(pending)}>{pending ? '…' : children}</button>
}

function FormError({ state }: { state: ActionResult }) {
  if (state.ok || !state.error) return null
  return <div style={{ font: '600 12px var(--f-ui)', color: 'var(--d-red,#e06a5a)', marginTop: 8 }}>{state.error}</div>
}

export default function OwnerTeam({ staff, recovery }: { staff: StaffRow[]; recovery: RecoveryRow[] }) {
  const router = useRouter()
  const [createState, createAction] = useFormState(createAdminAction, INIT)
  const [recState, recAction] = useFormState(addRecoveryEmailAction, INIT)
  const [busy, setBusy] = useState<string | null>(null)

  // After a successful create/add, re-fetch the server data so the lists update.
  useEffect(() => { if (createState.ok) router.refresh() }, [createState, router])
  useEffect(() => { if (recState.ok) router.refresh() }, [recState, router])

  // Reset the add-admin form fields after a successful create.
  const createForm = useRef<HTMLFormElement>(null)
  useEffect(() => { if (createState.ok) createForm.current?.reset() }, [createState.ok])

  const run = async (id: string, fn: (id: string) => Promise<ActionResult>) => {
    setBusy(id)
    const r = await fn(id)
    setBusy(null)
    if (r.ok) router.refresh()
    else alert(r.error ?? 'Ошибка')
  }

  const admins = staff.filter((s) => s.role === 'ADMIN')
  const canAddRecovery = recovery.length < 2

  return (
    <div style={{ display: 'grid', gap: 22, maxWidth: 860 }}>

      {/* ───────── Admins ───────── */}
      <section style={card}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div><h2 style={h2}>Администраторы</h2><p style={sub}>Добавляйте, архивируйте и удаляйте администраторов. Доступно только владельцу.</p></div>
          <span style={{ font: '700 12px var(--f-mono,monospace)', color: 'var(--d-muted)' }}>{admins.length} админ.</span>
        </div>

        {/* invite sent — the admin sets their own password via the emailed link */}
        {createState.ok && createState.inviteLink && (
          <div style={{ marginTop: 14, background: 'rgba(39,181,118,.12)', border: '1px solid rgba(39,181,118,.35)', borderRadius: 12, padding: '13px 15px' }}>
            <div style={{ font: '700 12px var(--f-ui)', color: 'var(--d-green,#3fb883)' }}>Приглашение отправлено на {createState.invitedEmail}. Администратор задаст свой пароль по ссылке из письма и сможет войти.</div>
            <div style={{ marginTop: 8, font: '500 11.5px var(--f-ui)', color: 'var(--d-muted)' }}>Если письмо не пришло (почта ещё не настроена) — передайте ссылку вручную:</div>
            <div style={{ marginTop: 6, font: '600 12px var(--f-mono,monospace)', color: 'var(--d-text)', background: 'var(--d-bg,#06222a)', border: '1px solid var(--d-hair)', borderRadius: 9, padding: '10px 13px', userSelect: 'all', wordBreak: 'break-all' }}>{createState.inviteLink}</div>
          </div>
        )}

        {/* add-admin form */}
        <form ref={createForm} action={createAction} style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
            <div><span style={label}>Email *</span><input name="email" type="email" required placeholder="admin@example.com" style={input} /></div>
            <div><span style={label}>Имя</span><input name="firstName" style={input} /></div>
            <div><span style={label}>Фамилия</span><input name="lastName" style={input} /></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Submit>Добавить администратора</Submit>
            <FormError state={createState} />
          </div>
        </form>

        {/* staff table */}
        <div style={{ marginTop: 18, display: 'grid', gap: 8 }}>
          {staff.map((s) => {
            const name = [s.firstName, s.lastName].filter(Boolean).join(' ') || '—'
            const isOwnerRow = s.role === 'OWNER'
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 14px', borderRadius: 12, background: 'var(--d-bg,#06222a)', border: '1px solid var(--d-hair)', opacity: s.archived ? 0.6 : 1 }}>
                <div style={{ minWidth: 0, flex: '1 1 200px' }}>
                  <div style={{ font: '700 14px var(--f-ui)', color: 'var(--d-text)' }}>{name}</div>
                  <div style={{ font: '500 12px var(--f-ui)', color: 'var(--d-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</div>
                </div>
                <span style={{ font: '700 9.5px var(--f-mono,monospace)', letterSpacing: '.08em', padding: '4px 9px', borderRadius: 999, background: isOwnerRow ? 'rgba(245,180,0,.16)' : 'rgba(13,148,136,.16)', color: isOwnerRow ? '#e7b94b' : 'var(--d-accent)' }}>{isOwnerRow ? 'ВЛАДЕЛЕЦ' : 'АДМИН'}</span>
                {s.archived && <span style={{ font: '700 9.5px var(--f-mono,monospace)', letterSpacing: '.08em', padding: '4px 9px', borderRadius: 999, background: 'rgba(214,75,61,.14)', color: 'var(--d-red,#e06a5a)' }}>В АРХИВЕ</span>}
                {!isOwnerRow && (
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    {s.archived
                      ? <button type="button" disabled={busy === s.id} style={ghostBtn} onClick={() => run(s.id, unarchiveAdminAction)}>Вернуть</button>
                      : <button type="button" disabled={busy === s.id} style={ghostBtn} onClick={() => run(s.id, archiveAdminAction)}>Архивировать</button>}
                    <button type="button" disabled={busy === s.id} style={dangerBtn} onClick={() => { if (confirm(`Удалить администратора ${s.email} безвозвратно?`)) run(s.id, removeAdminAction) }}>Удалить</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ───────── Owner recovery ───────── */}
      <section style={card}>
        <h2 style={h2}>Восстановление владельца</h2>
        <p style={sub}>До 2 доверенных адресов. Если владелец забудет пароль, ссылка для сброса придёт и на эти адреса — доверенный человек поможет вернуть доступ.</p>

        <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
          {recovery.length === 0 && <div style={{ font: '500 13px var(--f-ui)', color: 'var(--d-muted)' }}>Пока не добавлено ни одного адреса восстановления.</div>}
          {recovery.map((r) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, background: 'var(--d-bg,#06222a)', border: '1px solid var(--d-hair)' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ font: '700 14px var(--f-ui)', color: 'var(--d-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.email}</div>
                {r.label && <div style={{ font: '500 12px var(--f-ui)', color: 'var(--d-muted)' }}>{r.label}</div>}
              </div>
              <button type="button" disabled={busy === r.id} style={dangerBtn} onClick={() => run(r.id, removeRecoveryEmailAction)}>Убрать</button>
            </div>
          ))}
        </div>

        {canAddRecovery ? (
          <form action={recAction} style={{ marginTop: 14, display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
              <div><span style={label}>Email для восстановления *</span><input name="email" type="email" required placeholder="trusted@example.com" style={input} /></div>
              <div><span style={label}>Кто это (необязательно)</span><input name="label" placeholder="Партнёр / бухгалтер" style={input} /></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Submit>Добавить адрес</Submit>
              <FormError state={recState} />
            </div>
          </form>
        ) : (
          <div style={{ marginTop: 12, font: '600 12px var(--f-ui)', color: 'var(--d-muted)' }}>Добавлено 2 из 2 — уберите один, чтобы добавить другой.</div>
        )}
      </section>
    </div>
  )
}
