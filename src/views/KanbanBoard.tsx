'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { BookingStatus } from '@prisma/client'
import { setBookingStatus } from '@/server/admin-actions'
import { useIsMobile } from '@/components/useIsMobile'
import {
  BOOKING_STATUS_ALL,
  BOOKING_STATUS_KIND,
  KIND_COLORS,
  statusLabel,
  statusShort,
  canTransition,
} from '@/lib/booking-status'
import { useDict, useLang, type Dict } from '../i18n/lang'

export interface BoardCard {
  id: string
  number: string
  status: BookingStatus
  customer: string
  car: string
  startAt: string // ISO
  endAt: string // ISO
  pay: 'paid' | 'partial' | 'none'
  depositHeld: boolean
  verification: string
  returnFlag: 'today' | 'overdue' | null
}

const dmy = (iso: string) => {
  const d = new Date(iso)
  return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

interface Strings {
  // payment chips
  payPaid: string
  payPartial: string
  payNone: string
  // verification chips
  verifApproved: string
  verifPending: string
  verifRejected: string
  verifNone: string
  // legend / hints
  hintMobile: string
  hintDesktop: string
  legendReturnToday: string
  legendOverdue: string
  // card return flags
  flagOverdueReturn: string
  flagReturnToday: string
  deposit: string
  // toasts
  invalidTransition: (from: string, to: string) => string
  movedTo: (status: string) => string
  statusChangeFailed: string
  // aria
  cardAria: (number: string, customer: string, status: string) => string
}

const dict: Dict<Strings> = {
  ru: {
    payPaid: 'Оплачено',
    payPartial: 'Частично',
    payNone: 'Не оплачено',
    verifApproved: 'Пров. ✓',
    verifPending: 'Проверка',
    verifRejected: 'Откл.',
    verifNone: 'Не пров.',
    hintMobile: 'Листайте колонки вбок. Нажмите на карточку, чтобы открыть заказ.',
    hintDesktop: 'Перетащите карточку в соседнюю колонку, чтобы продвинуть заказ. Доступен только следующий логичный шаг.',
    legendReturnToday: 'Возврат сегодня',
    legendOverdue: 'Просрочен',
    flagOverdueReturn: '⚠ Просрочен возврат',
    flagReturnToday: '⏰ Возврат сегодня',
    deposit: 'Залог',
    invalidTransition: (from, to) => `Недопустимый переход: ${from} → ${to}`,
    movedTo: (status) => `Переведено в «${status}»`,
    statusChangeFailed: 'Не удалось сменить статус',
    cardAria: (number, customer, status) => `Заказ ${number}, ${customer}, статус ${status}`,
  },
  en: {
    payPaid: 'Paid',
    payPartial: 'Partial',
    payNone: 'Unpaid',
    verifApproved: 'Ver. ✓',
    verifPending: 'Review',
    verifRejected: 'Rej.',
    verifNone: 'Not ver.',
    hintMobile: 'Swipe columns sideways. Tap a card to open the booking.',
    hintDesktop: 'Drag a card to an adjacent column to advance the booking. Only the next logical step is available.',
    legendReturnToday: 'Return today',
    legendOverdue: 'Overdue',
    flagOverdueReturn: '⚠ Return overdue',
    flagReturnToday: '⏰ Return today',
    deposit: 'Deposit',
    invalidTransition: (from, to) => `Invalid transition: ${from} → ${to}`,
    movedTo: (status) => `Moved to “${status}”`,
    statusChangeFailed: 'Could not change status',
    cardAria: (number, customer, status) => `Booking ${number}, ${customer}, status ${status}`,
  },
  tr: {
    payPaid: 'Ödendi',
    payPartial: 'Kısmi',
    payNone: 'Ödenmedi',
    verifApproved: 'Doğr. ✓',
    verifPending: 'İnceleme',
    verifRejected: 'Red',
    verifNone: 'Doğr. yok',
    hintMobile: 'Sütunları yana kaydırın. Rezervasyonu açmak için bir karta dokunun.',
    hintDesktop: 'Rezervasyonu ilerletmek için kartı bitişik sütuna sürükleyin. Yalnızca bir sonraki mantıklı adım kullanılabilir.',
    legendReturnToday: 'Bugün iade',
    legendOverdue: 'Gecikmiş',
    flagOverdueReturn: '⚠ İade gecikti',
    flagReturnToday: '⏰ Bugün iade',
    deposit: 'Depozito',
    invalidTransition: (from, to) => `Geçersiz geçiş: ${from} → ${to}`,
    movedTo: (status) => `"${status}" durumuna taşındı`,
    statusChangeFailed: 'Durum değiştirilemedi',
    cardAria: (number, customer, status) => `Rezervasyon ${number}, ${customer}, durum ${status}`,
  },
  es: {
    payPaid: 'Pagado',
    payPartial: 'Parcial',
    payNone: 'Sin pagar',
    verifApproved: 'Verif. ✓',
    verifPending: 'Revisión',
    verifRejected: 'Rech.',
    verifNone: 'Sin verif.',
    hintMobile: 'Deslice las columnas hacia los lados. Toque una tarjeta para abrir la reserva.',
    hintDesktop: 'Arrastre una tarjeta a la columna contigua para avanzar la reserva. Solo está disponible el siguiente paso lógico.',
    legendReturnToday: 'Devolución hoy',
    legendOverdue: 'Vencido',
    flagOverdueReturn: '⚠ Devolución vencida',
    flagReturnToday: '⏰ Devolución hoy',
    deposit: 'Depósito',
    invalidTransition: (from, to) => `Transición no válida: ${from} → ${to}`,
    movedTo: (status) => `Movido a «${status}»`,
    statusChangeFailed: 'No se pudo cambiar el estado',
    cardAria: (number, customer, status) => `Reserva ${number}, ${customer}, estado ${status}`,
  },
  de: {
    payPaid: 'Bezahlt',
    payPartial: 'Teilweise',
    payNone: 'Unbezahlt',
    verifApproved: 'Geprüft ✓',
    verifPending: 'Prüfung',
    verifRejected: 'Abgel.',
    verifNone: 'Ungeprüft',
    hintMobile: 'Spalten seitlich wischen. Tippen Sie auf eine Karte, um die Buchung zu öffnen.',
    hintDesktop: 'Ziehen Sie eine Karte in die benachbarte Spalte, um die Buchung voranzubringen. Nur der nächste logische Schritt ist verfügbar.',
    legendReturnToday: 'Rückgabe heute',
    legendOverdue: 'Überfällig',
    flagOverdueReturn: '⚠ Rückgabe überfällig',
    flagReturnToday: '⏰ Rückgabe heute',
    deposit: 'Kaution',
    invalidTransition: (from, to) => `Ungültiger Übergang: ${from} → ${to}`,
    movedTo: (status) => `Verschoben zu „${status}“`,
    statusChangeFailed: 'Status konnte nicht geändert werden',
    cardAria: (number, customer, status) => `Buchung ${number}, ${customer}, Status ${status}`,
  },
}

const PAY_META: Record<BoardCard['pay'], { labelKey: 'payPaid' | 'payPartial' | 'payNone'; kind: keyof typeof KIND_COLORS }> = {
  paid: { labelKey: 'payPaid', kind: 'green' },
  partial: { labelKey: 'payPartial', kind: 'amber' },
  none: { labelKey: 'payNone', kind: 'red' },
}

function verifChip(v: string, t: Strings): { label: string; kind: keyof typeof KIND_COLORS } {
  if (v === 'APPROVED') return { label: t.verifApproved, kind: 'green' }
  if (v === 'PENDING') return { label: t.verifPending, kind: 'amber' }
  if (v === 'REJECTED' || v === 'RESUBMISSION') return { label: t.verifRejected, kind: 'red' }
  return { label: t.verifNone, kind: 'grey' }
}

function Chip({ label, kind }: { label: string; kind: keyof typeof KIND_COLORS }) {
  const c = KIND_COLORS[kind]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 7px',
        borderRadius: 999,
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        font: '700 9.5px var(--f-ui)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

export default function KanbanBoard({ cards: initial }: { cards: BoardCard[] }) {
  const t = useDict(dict)
  const { lang } = useLang()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [cards, setCards] = useState<BoardCard[]>(initial)
  const [drag, setDrag] = useState<{ id: string; from: BookingStatus } | null>(null)
  const [over, setOver] = useState<BookingStatus | null>(null)
  const [toast, setToast] = useState<{ text: string; bad: boolean } | null>(null)
  const [pending, startTransition] = useTransition()
  const [reduce, setReduce] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Server is the source of truth: whenever fresh props arrive (after router.refresh), resync.
  useEffect(() => setCards(initial), [initial])
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduce(m.matches)
    const h = () => setReduce(m.matches)
    m.addEventListener?.('change', h)
    return () => m.removeEventListener?.('change', h)
  }, [])
  // Clear any pending toast timer on unmount.
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  const flash = (text: string, bad: boolean) => {
    setToast({ text, bad })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }

  const byStatus = useMemo(() => {
    const m = new Map<BookingStatus, BoardCard[]>()
    for (const s of BOOKING_STATUS_ALL) m.set(s, [])
    for (const c of cards) m.get(c.status)?.push(c)
    return m
  }, [cards])

  const drop = (to: BookingStatus) => {
    const d = drag
    setDrag(null)
    setOver(null)
    if (!d || pending) return // one status change in flight at a time (cards are also non-draggable while pending)
    if (d.from === to) return
    if (!canTransition(d.from, to)) {
      flash(t.invalidTransition(statusLabel(d.from, lang), statusLabel(to, lang)), true)
      return
    }
    // Optimistic move, reconciled by router.refresh on success. On error, revert ONLY this card with a
    // functional update — never a whole-array snapshot, so it can't clobber other cards or fresher server state.
    setCards((cs) => cs.map((c) => (c.id === d.id ? { ...c, status: to } : c)))
    startTransition(async () => {
      const r = await setBookingStatus(d.id, to)
      if (r.ok) {
        flash(t.movedTo(statusLabel(to, lang)), false)
        router.refresh()
      } else {
        setCards((cs) => cs.map((c) => (c.id === d.id ? { ...c, status: d.from } : c)))
        flash(r.error ?? t.statusChangeFailed, true)
      }
    })
  }

  return (
    <div>
      {/* legend / hint */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ font: '500 12px var(--f-ui)', color: 'var(--d-muted)' }}>
          {isMobile ? t.hintMobile : t.hintDesktop}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <Chip label={t.legendReturnToday} kind="amber" />
          <Chip label={t.legendOverdue} kind="red" />
        </div>
      </div>

      {/* board — columns scroll horizontally (never break) */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12, alignItems: 'flex-start' }}>
        {BOOKING_STATUS_ALL.map((status) => {
          const col = byStatus.get(status) ?? []
          const c = KIND_COLORS[BOOKING_STATUS_KIND[status]]
          const isValidTarget = drag != null && drag.from !== status && canTransition(drag.from, status)
          const isInvalidTarget = drag != null && drag.from !== status && !canTransition(drag.from, status)
          const isOver = over === status
          return (
            <section
              key={status}
              onDragOver={(e) => {
                if (!drag) return
                e.preventDefault() // accept the drop so we can give explicit feedback
                if (over !== status) setOver(status)
              }}
              onDragLeave={(e) => {
                // Ignore dragleave fired when the pointer merely crosses onto a child card inside this
                // column — only clear the highlight when it actually leaves the column.
                if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
                setOver((o) => (o === status ? null : o))
              }}
              onDrop={(e) => {
                e.preventDefault()
                drop(status)
              }}
              style={{
                flex: isMobile ? '0 0 80vw' : '0 0 236px',
                width: isMobile ? '80vw' : 236,
                maxWidth: isMobile ? 320 : undefined,
                background: 'var(--d-panel)',
                border: `1px solid ${isOver && isValidTarget ? c.border : 'rgba(255,255,255,.07)'}`,
                borderRadius: 14,
                padding: 10,
                opacity: isInvalidTarget ? 0.45 : 1,
                outline: isOver && isValidTarget ? `2px solid ${c.dot}` : 'none',
                outlineOffset: -2,
                transition: reduce ? 'none' : 'opacity .15s ease, border-color .15s ease',
              }}
            >
              {/* column header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px 12px' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
                <span style={{ font: '700 12px var(--f-ui)', color: c.text, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {statusShort(status, lang)}
                </span>
                <span style={{ font: '700 11px var(--f-ui)', color: 'var(--d-muted)', background: 'var(--d-el)', borderRadius: 999, padding: '1px 8px' }}>
                  {col.length}
                </span>
              </div>

              {/* cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 40 }}>
                {col.length === 0 && (
                  <div style={{ font: '400 11px var(--f-ui)', color: 'var(--d-muted-2)', textAlign: 'center', padding: '14px 0' }}>
                    —
                  </div>
                )}
                {col.map((card) => {
                  const rf = card.returnFlag
                  const rk = rf === 'overdue' ? KIND_COLORS.red : rf === 'today' ? KIND_COLORS.amber : null
                  const pm = PAY_META[card.pay]
                  const vf = verifChip(card.verification, t)
                  const dragging = drag?.id === card.id
                  return (
                    <div
                      key={card.id}
                      draggable={!pending}
                      onDragStart={(e) => {
                        if (pending) {
                          e.preventDefault()
                          return
                        }
                        e.dataTransfer.effectAllowed = 'move'
                        e.dataTransfer.setData('text/plain', card.id)
                        setDrag({ id: card.id, from: card.status })
                      }}
                      onDragEnd={() => {
                        setDrag(null)
                        setOver(null)
                      }}
                      onClick={() => router.push(`/admin?tab=bookings&booking=${card.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          router.push(`/admin?tab=bookings&booking=${card.id}`)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={t.cardAria(card.number, card.customer, statusLabel(card.status, lang))}
                      style={{
                        background: 'var(--d-card)',
                        border: `1px solid ${rk ? rk.border : 'rgba(255,255,255,.08)'}`,
                        borderLeft: rk ? `3px solid ${rk.dot}` : '1px solid rgba(255,255,255,.08)',
                        borderRadius: 11,
                        padding: '10px 12px',
                        cursor: pending ? 'wait' : 'grab',
                        opacity: dragging ? 0.4 : 1,
                        boxShadow: rk ? `0 0 0 1px ${rk.bg}` : 'none',
                      }}
                    >
                      {rf && (
                        <div style={{ marginBottom: 6 }}>
                          <Chip label={rf === 'overdue' ? t.flagOverdueReturn : t.flagReturnToday} kind={rf === 'overdue' ? 'red' : 'amber'} />
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ font: '700 11px var(--f-mono)', color: 'var(--d-accent-light)' }}>{card.number}</span>
                        <Chip label={t[pm.labelKey]} kind={pm.kind} />
                      </div>
                      <div style={{ marginTop: 6, font: '700 13px var(--f-ui)', color: 'var(--d-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {card.customer}
                      </div>
                      <div style={{ marginTop: 2, font: '500 11px var(--f-ui)', color: 'var(--d-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {card.car}
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ font: '600 11px var(--f-mono)', color: '#C9D4E4' }}>
                          {dmy(card.startAt)} – {dmy(card.endAt)}
                        </span>
                        <span style={{ display: 'flex', gap: 5 }}>
                          {card.depositHeld && <Chip label={t.deposit} kind="green" />}
                          <Chip label={vf.label} kind={vf.kind} />
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {/* toast */}
      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 26,
            transform: 'translateX(-50%)',
            zIndex: 50,
            padding: '11px 18px',
            borderRadius: 12,
            background: toast.bad ? 'rgba(206,74,74,.16)' : 'rgba(111,191,143,.16)',
            border: `1px solid ${toast.bad ? KIND_COLORS.red.border : KIND_COLORS.green.border}`,
            color: toast.bad ? KIND_COLORS.red.text : KIND_COLORS.green.text,
            font: '700 12px var(--f-ui)',
            backdropFilter: 'blur(6px)',
          }}
        >
          {toast.text}
        </div>
      )}
    </div>
  )
}
