'use client'

import { useState } from 'react'
import type { BookingStatus } from '@prisma/client'
import {
  BOOKING_LIFECYCLE,
  BOOKING_STATUS_KIND,
  KIND_COLORS,
  statusLabel,
  statusShort,
  statusAction,
  nextStatuses,
  canCancel,
  isTerminal,
} from '@/lib/booking-status'
import { useDict, useLang, type Dict } from '../i18n/lang'

interface Strings {
  orderStatus: string
  confirmCancel: string
  stepsAria: string
  cancelledBanner: string
  nextStep: string
  commentPlaceholder: string
  willBecome: string
  cancelRequest: string
  lifecycleHint: (withCancel: boolean) => string
  closedBanner: string
}

const dict: Dict<Strings> = {
  ru: {
    orderStatus: 'СТАТУС ЗАКАЗА',
    confirmCancel: 'Отменить эту заявку? Это конечный статус — продолжить лайфцикл будет нельзя.',
    stepsAria: 'Этапы заявки',
    cancelledBanner: 'Заявка отменена — это конечный статус, переходы недоступны.',
    nextStep: 'СЛЕДУЮЩИЙ ШАГ',
    commentPlaceholder: 'Комментарий к смене статуса (необязательно)…',
    willBecome: 'станет:',
    cancelRequest: 'Отменить заявку',
    lifecycleHint: (withCancel) =>
      `Заявка ведётся строго по лайфциклу — доступен только следующий логичный шаг${withCancel ? ' или отмена' : ''}.`,
    closedBanner: 'Заявка закрыта — это конечный статус, переходы недоступны.',
  },
  en: {
    orderStatus: 'BOOKING STATUS',
    confirmCancel: 'Cancel this booking? This is a final status — the lifecycle cannot be continued.',
    stepsAria: 'Booking stages',
    cancelledBanner: 'Booking cancelled — this is a final status, no transitions available.',
    nextStep: 'NEXT STEP',
    commentPlaceholder: 'Comment on the status change (optional)…',
    willBecome: 'becomes:',
    cancelRequest: 'Cancel booking',
    lifecycleHint: (withCancel) =>
      `The booking follows the lifecycle strictly — only the next logical step${withCancel ? ' or cancellation' : ''} is available.`,
    closedBanner: 'Booking closed — this is a final status, no transitions available.',
  },
  tr: {
    orderStatus: 'REZERVASYON DURUMU',
    confirmCancel: 'Bu rezervasyon iptal edilsin mi? Bu, nihai bir durumdur — yaşam döngüsü devam ettirilemez.',
    stepsAria: 'Rezervasyon aşamaları',
    cancelledBanner: 'Rezervasyon iptal edildi — bu nihai bir durumdur, geçiş yapılamaz.',
    nextStep: 'SONRAKİ ADIM',
    commentPlaceholder: 'Durum değişikliği hakkında yorum (isteğe bağlı)…',
    willBecome: 'yeni durum:',
    cancelRequest: 'Rezervasyonu iptal et',
    lifecycleHint: (withCancel) =>
      `Rezervasyon yaşam döngüsünü kesinlikle takip eder — yalnızca bir sonraki mantıklı adım${withCancel ? ' veya iptal' : ''} kullanılabilir.`,
    closedBanner: 'Rezervasyon kapatıldı — bu nihai bir durumdur, geçiş yapılamaz.',
  },
  es: {
    orderStatus: 'ESTADO DE LA RESERVA',
    confirmCancel: '¿Cancelar esta reserva? Es un estado final: el ciclo de vida no podrá continuar.',
    stepsAria: 'Etapas de la reserva',
    cancelledBanner: 'Reserva cancelada: es un estado final, no hay transiciones disponibles.',
    nextStep: 'SIGUIENTE PASO',
    commentPlaceholder: 'Comentario sobre el cambio de estado (opcional)…',
    willBecome: 'pasa a ser:',
    cancelRequest: 'Cancelar reserva',
    lifecycleHint: (withCancel) =>
      `La reserva sigue estrictamente el ciclo de vida: solo está disponible el siguiente paso lógico${withCancel ? ' o la cancelación' : ''}.`,
    closedBanner: 'Reserva cerrada: es un estado final, no hay transiciones disponibles.',
  },
  de: {
    orderStatus: 'BUCHUNGSSTATUS',
    confirmCancel: 'Diese Buchung stornieren? Dies ist ein finaler Status — der Lebenszyklus kann nicht fortgesetzt werden.',
    stepsAria: 'Buchungsphasen',
    cancelledBanner: 'Buchung storniert — dies ist ein finaler Status, keine Übergänge verfügbar.',
    nextStep: 'NÄCHSTER SCHRITT',
    commentPlaceholder: 'Kommentar zur Statusänderung (optional)…',
    willBecome: 'wird zu:',
    cancelRequest: 'Buchung stornieren',
    lifecycleHint: (withCancel) =>
      `Die Buchung folgt strikt dem Lebenszyklus — nur der nächste logische Schritt${withCancel ? ' oder die Stornierung' : ''} ist verfügbar.`,
    closedBanner: 'Buchung geschlossen — dies ist ein finaler Status, keine Übergänge verfügbar.',
  },
}

/**
 * The prominent, primary status control for the order detail page. Shows the current status large
 * and colour-coded, a lifecycle stepper for orientation, and the LOGICAL next step(s) as the main
 * action — because advancing an order through its lifecycle is the main thing the owner does here.
 * Only offers valid transitions (from lib/booking-status, the same rulebook the server enforces).
 */
export default function OrderStatusControl({
  status,
  number,
  pending,
  onSetStatus,
}: {
  status: BookingStatus
  number: string
  pending: boolean
  onSetStatus: (to: BookingStatus, comment?: string) => void
}) {
  const t = useDict(dict)
  const { lang } = useLang()
  const [comment, setComment] = useState('')
  const kind = BOOKING_STATUS_KIND[status]
  const c = KIND_COLORS[kind]
  const nexts = nextStatuses(status)
  const terminal = isTerminal(status)
  const cancelled = status === 'CANCELLED'
  const currentIndex = BOOKING_LIFECYCLE.indexOf(status) // -1 when CANCELLED

  const advance = (to: BookingStatus) => {
    onSetStatus(to, comment.trim() || undefined)
    setComment('')
  }
  const cancel = () => {
    if (!window.confirm(t.confirmCancel)) return
    onSetStatus('CANCELLED', comment.trim() || undefined)
    setComment('')
  }

  return (
    <section
      style={{
        background: 'var(--d-panel)',
        border: `1px solid ${c.border}`,
        borderRadius: 16,
        padding: '20px 24px 24px',
        boxShadow: `inset 0 0 0 1px ${c.bg}`,
      }}
    >
      {/* header: label + current status + order number */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: c.dot,
              boxShadow: `0 0 0 5px ${c.bg}`,
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ font: '400 10px var(--f-mono)', letterSpacing: '.14em', color: 'var(--d-muted-2)' }}>
              {t.orderStatus} · {number}
            </div>
            <div style={{ font: '800 24px var(--f-display)', color: c.text, lineHeight: 1.15, marginTop: 2 }}>
              {statusLabel(status, lang)}
            </div>
          </div>
        </div>
      </div>

      {/* lifecycle stepper */}
      <div
        style={{ marginTop: 18, display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}
        role="list"
        aria-label={t.stepsAria}
      >
        {BOOKING_LIFECYCLE.map((s, i) => {
          const done = currentIndex >= 0 && i < currentIndex
          const isCurrent = i === currentIndex
          const sk = KIND_COLORS[BOOKING_STATUS_KIND[s]]
          const bg = isCurrent ? sk.bg : done ? 'rgba(111,191,143,.12)' : 'var(--d-el)'
          const bd = isCurrent ? sk.border : done ? 'rgba(111,191,143,.28)' : 'rgba(255,255,255,.07)'
          const col = isCurrent ? sk.text : done ? '#8FD7AD' : 'var(--d-muted-2)'
          return (
            <div
              key={s}
              role="listitem"
              aria-current={isCurrent ? 'step' : undefined}
              title={statusLabel(s, lang)}
              style={{
                flex: '1 0 auto',
                minWidth: 72,
                background: bg,
                border: `1px solid ${bd}`,
                borderRadius: 8,
                padding: '7px 8px',
                textAlign: 'center',
                opacity: cancelled ? 0.4 : 1,
              }}
            >
              <div style={{ font: `${isCurrent ? 700 : 600} 10.5px var(--f-ui)`, color: col, whiteSpace: 'nowrap' }}>
                {done ? '✓ ' : ''}
                {statusShort(s, lang)}
              </div>
            </div>
          )
        })}
      </div>

      {cancelled && (
        <div
          style={{
            marginTop: 14,
            padding: '10px 14px',
            borderRadius: 10,
            background: KIND_COLORS.red.bg,
            border: `1px solid ${KIND_COLORS.red.border}`,
            font: '600 12px var(--f-ui)',
            color: KIND_COLORS.red.text,
          }}
        >
          {t.cancelledBanner}
        </div>
      )}

      {/* action zone */}
      {!terminal && (
        <div style={{ marginTop: 18 }}>
          <div style={{ font: '400 10px var(--f-mono)', letterSpacing: '.12em', color: 'var(--d-muted-2)', marginBottom: 10 }}>
            {t.nextStep}
          </div>

          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.commentPlaceholder}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              marginBottom: 12,
              background: 'var(--d-base)',
              border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 10,
              padding: '10px 13px',
              font: '400 12px var(--f-ui)',
              color: 'var(--d-text)',
              outline: 'none',
            }}
          />

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {nexts.map((to) => {
              const tk = KIND_COLORS[BOOKING_STATUS_KIND[to]]
              return (
                <button
                  key={to}
                  type="button"
                  onClick={() => advance(to)}
                  disabled={pending}
                  style={{
                    flex: '1 1 240px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 2,
                    padding: '13px 18px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'linear-gradient(180deg,#FFB48A,#FF7A5C)',
                    color: '#082A33',
                    cursor: pending ? 'wait' : 'pointer',
                    opacity: pending ? 0.6 : 1,
                    textAlign: 'left',
                  }}
                >
                  <span style={{ font: '800 14px var(--f-ui)' }}>{statusAction(to, lang)} →</span>
                  <span style={{ font: '600 11px var(--f-ui)', color: 'rgba(8,42,51,.72)' }}>
                    {t.willBecome} {statusLabel(to, lang)}
                  </span>
                </button>
              )
            })}

            {canCancel(status) && (
              <button
                type="button"
                onClick={cancel}
                disabled={pending}
                style={{
                  flex: '0 0 auto',
                  padding: '13px 18px',
                  borderRadius: 12,
                  border: `1px solid ${KIND_COLORS.red.border}`,
                  background: 'transparent',
                  color: KIND_COLORS.red.text,
                  font: '700 13px var(--f-ui)',
                  cursor: pending ? 'wait' : 'pointer',
                  opacity: pending ? 0.6 : 1,
                }}
              >
                {t.cancelRequest}
              </button>
            )}
          </div>
          <div style={{ marginTop: 10, font: '400 11px var(--f-ui)', color: 'var(--d-muted-2)' }}>
            {t.lifecycleHint(canCancel(status))}
          </div>
        </div>
      )}

      {terminal && !cancelled && (
        <div
          style={{
            marginTop: 14,
            padding: '10px 14px',
            borderRadius: 10,
            background: 'var(--d-el)',
            border: '1px solid rgba(255,255,255,.08)',
            font: '600 12px var(--f-ui)',
            color: 'var(--d-muted)',
          }}
        >
          {t.closedBanner}
        </div>
      )}
    </section>
  )
}
