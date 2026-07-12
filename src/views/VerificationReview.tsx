'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useIsMobile } from '@/components/useIsMobile'
import { setDocumentDecisionAction } from '@/server/verification-actions'
import type { ReviewDoc } from '@/lib/verification'
import { useDict, type Dict } from '../i18n/lang'

/**
 * Staff-only PER-DOCUMENT verification review (dark admin theme). Renders one card per required
 * document with its encrypted thumbnail (gated /api/documents/[id], staff-or-owner only) and an
 * independent Approve (with expiry; selfie has none) / Reject (with a required reason) control.
 * Each decision hits setDocumentDecisionAction — staff-only, server-authoritative. "Verified?" is
 * derived elsewhere from all documents, so partial reviews (ID approved, licence pending) are normal.
 */

interface Strings {
  // status badges
  badgeApproved: string
  badgePending: string
  badgeRejected: string
  badgeNone: string
  badgeExpired: string
  // preset rejection reasons
  presetReasons: string[]
  // inline messages
  errNeedExpiry: string
  approvedOk: string
  errGeneric: string
  errNeedReason: string
  rejectedOk: string
  // card + controls
  noUpload: string
  until: string
  reasonPrefix: string
  changeDecision: string
  expiryLabel: string
  approveBtn: string
  rejectBtn: string
  cancel: string
  rejectReasonTitle: string
  reasonPlaceholder: string
  rejectWithReason: string
  // empty state
  noDocsRequired: string
}

const dict: Dict<Strings> = {
  ru: {
    badgeApproved: 'Одобрен',
    badgePending: 'На проверке',
    badgeRejected: 'Отклонён',
    badgeNone: 'Не загружен',
    badgeExpired: 'Одобрен · истёк',
    presetReasons: [
      'Фото документа нечёткое',
      'Данные не читаются',
      'Документ просрочен',
      'Обрезаны края документа',
      'Селфи не совпадает с документом',
      'Загружен не тот документ',
    ],
    errNeedExpiry: 'Укажите срок действия',
    approvedOk: 'Одобрено ✓',
    errGeneric: 'Ошибка',
    errNeedReason: 'Укажите причину отклонения',
    rejectedOk: 'Отклонено',
    noUpload: 'нет загрузки',
    until: 'до',
    reasonPrefix: 'Причина:',
    changeDecision: 'Изменить решение',
    expiryLabel: 'СРОК ДЕЙСТВИЯ',
    approveBtn: '✓ Одобрить',
    rejectBtn: '✕ Отклонить',
    cancel: 'Отмена',
    rejectReasonTitle: 'ПРИЧИНА ОТКЛОНЕНИЯ (ОБЯЗАТЕЛЬНО)',
    reasonPlaceholder: 'Что клиенту нужно исправить…',
    rejectWithReason: 'Отклонить с причиной',
    noDocsRequired: 'Документы личности не требуются.',
  },
  en: {
    badgeApproved: 'Approved',
    badgePending: 'Under review',
    badgeRejected: 'Rejected',
    badgeNone: 'Not uploaded',
    badgeExpired: 'Approved · expired',
    presetReasons: [
      'Document photo is blurry',
      'Data is not readable',
      'Document has expired',
      'Document edges are cut off',
      'Selfie does not match the document',
      'Wrong document uploaded',
    ],
    errNeedExpiry: 'Specify the expiry date',
    approvedOk: 'Approved ✓',
    errGeneric: 'Error',
    errNeedReason: 'Specify the rejection reason',
    rejectedOk: 'Rejected',
    noUpload: 'no upload',
    until: 'until',
    reasonPrefix: 'Reason:',
    changeDecision: 'Change decision',
    expiryLabel: 'EXPIRY DATE',
    approveBtn: '✓ Approve',
    rejectBtn: '✕ Reject',
    cancel: 'Cancel',
    rejectReasonTitle: 'REJECTION REASON (REQUIRED)',
    reasonPlaceholder: 'What the customer needs to fix…',
    rejectWithReason: 'Reject with reason',
    noDocsRequired: 'No identity documents required.',
  },
  tr: {
    badgeApproved: 'Onaylandı',
    badgePending: 'İncelemede',
    badgeRejected: 'Reddedildi',
    badgeNone: 'Yüklenmedi',
    badgeExpired: 'Onaylandı · süresi doldu',
    presetReasons: [
      'Belge fotoğrafı bulanık',
      'Veriler okunamıyor',
      'Belgenin süresi dolmuş',
      'Belgenin kenarları kesilmiş',
      'Selfie belgeyle eşleşmiyor',
      'Yanlış belge yüklendi',
    ],
    errNeedExpiry: 'Son geçerlilik tarihini belirtin',
    approvedOk: 'Onaylandı ✓',
    errGeneric: 'Hata',
    errNeedReason: 'Ret nedenini belirtin',
    rejectedOk: 'Reddedildi',
    noUpload: 'yükleme yok',
    until: 'bitiş',
    reasonPrefix: 'Neden:',
    changeDecision: 'Kararı değiştir',
    expiryLabel: 'GEÇERLİLİK TARİHİ',
    approveBtn: '✓ Onayla',
    rejectBtn: '✕ Reddet',
    cancel: 'İptal',
    rejectReasonTitle: 'RET NEDENİ (ZORUNLU)',
    reasonPlaceholder: 'Müşterinin neyi düzeltmesi gerektiği…',
    rejectWithReason: 'Nedenle reddet',
    noDocsRequired: 'Kimlik belgesi gerekmiyor.',
  },
  es: {
    badgeApproved: 'Aprobado',
    badgePending: 'En revisión',
    badgeRejected: 'Rechazado',
    badgeNone: 'No subido',
    badgeExpired: 'Aprobado · caducado',
    presetReasons: [
      'La foto del documento está borrosa',
      'Los datos no se leen',
      'El documento está caducado',
      'Los bordes del documento están cortados',
      'El selfi no coincide con el documento',
      'Documento incorrecto subido',
    ],
    errNeedExpiry: 'Indique la fecha de caducidad',
    approvedOk: 'Aprobado ✓',
    errGeneric: 'Error',
    errNeedReason: 'Indique el motivo del rechazo',
    rejectedOk: 'Rechazado',
    noUpload: 'sin subir',
    until: 'hasta',
    reasonPrefix: 'Motivo:',
    changeDecision: 'Cambiar decisión',
    expiryLabel: 'FECHA DE CADUCIDAD',
    approveBtn: '✓ Aprobar',
    rejectBtn: '✕ Rechazar',
    cancel: 'Cancelar',
    rejectReasonTitle: 'MOTIVO DEL RECHAZO (OBLIGATORIO)',
    reasonPlaceholder: 'Lo que el cliente debe corregir…',
    rejectWithReason: 'Rechazar con motivo',
    noDocsRequired: 'No se requieren documentos de identidad.',
  },
  de: {
    badgeApproved: 'Genehmigt',
    badgePending: 'In Prüfung',
    badgeRejected: 'Abgelehnt',
    badgeNone: 'Nicht hochgeladen',
    badgeExpired: 'Genehmigt · abgelaufen',
    presetReasons: [
      'Dokumentfoto ist unscharf',
      'Daten sind nicht lesbar',
      'Dokument ist abgelaufen',
      'Dokumentränder sind abgeschnitten',
      'Selfie stimmt nicht mit dem Dokument überein',
      'Falsches Dokument hochgeladen',
    ],
    errNeedExpiry: 'Bitte Ablaufdatum angeben',
    approvedOk: 'Genehmigt ✓',
    errGeneric: 'Fehler',
    errNeedReason: 'Bitte Ablehnungsgrund angeben',
    rejectedOk: 'Abgelehnt',
    noUpload: 'kein Upload',
    until: 'bis',
    reasonPrefix: 'Grund:',
    changeDecision: 'Entscheidung ändern',
    expiryLabel: 'ABLAUFDATUM',
    approveBtn: '✓ Genehmigen',
    rejectBtn: '✕ Ablehnen',
    cancel: 'Abbrechen',
    rejectReasonTitle: 'ABLEHNUNGSGRUND (ERFORDERLICH)',
    reasonPlaceholder: 'Was der Kunde korrigieren muss…',
    rejectWithReason: 'Mit Grund ablehnen',
    noDocsRequired: 'Keine Ausweisdokumente erforderlich.',
  },
}

const inputSt = { padding: '7px 9px', borderRadius: 8, border: '1px solid rgba(255,255,255,.14)', background: 'var(--d-base)', color: 'var(--d-text)', font: '600 12px var(--f-ui)' } as const

function DocCard({ doc, compact }: { doc: ReviewDoc; compact?: boolean }) {
  const t = useDict(dict)
  const router = useRouter()
  const isMobile = useIsMobile()
  const [pending, start] = useTransition()
  const [expiry, setExpiry] = useState((doc.expiresAt ?? '').slice(0, 10))
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  // A decided doc (approved/rejected) shows its result, NOT the action buttons — changing it is an
  // explicit opt-in ("Изменить решение") that reveals the controls. Pending docs show them by default.
  const [changing, setChanging] = useState(false)

  const needsExpiry = doc.type !== 'SELFIE'
  const isPending = doc.decision === 'PENDING'
  const decided = doc.decision === 'APPROVED' || doc.decision === 'REJECTED'
  const isImg = doc.mime ? /(jpeg|jpg|png|webp)/i.test(doc.mime) : false
  const badgeMap: Record<string, { t: string; c: string; bg: string }> = {
    APPROVED: { t: t.badgeApproved, c: 'var(--d-green)', bg: 'rgba(39,181,118,.14)' },
    PENDING: { t: t.badgePending, c: '#E7B463', bg: 'rgba(224,162,62,.14)' },
    REJECTED: { t: t.badgeRejected, c: 'var(--d-red)', bg: 'rgba(224,69,69,.14)' },
    NONE: { t: t.badgeNone, c: 'var(--d-muted)', bg: 'var(--d-el)' },
  }
  const badge = doc.expired ? { t: t.badgeExpired, c: 'var(--d-red)', bg: 'rgba(224,69,69,.14)' } : badgeMap[doc.decision] ?? badgeMap.NONE

  const approve = () => {
    if (!doc.documentId) return
    if (needsExpiry && !expiry) { setMsg({ ok: false, text: t.errNeedExpiry }); return }
    start(async () => {
      setMsg(null)
      const r = await setDocumentDecisionAction({ documentId: doc.documentId!, decision: 'APPROVED', expiresAt: expiry || undefined })
      if (r.ok) { setMsg({ ok: true, text: t.approvedOk }); setChanging(false); router.refresh() } else setMsg({ ok: false, text: r.error ?? t.errGeneric })
    })
  }
  const submitReject = () => {
    if (!doc.documentId) return
    const rr = reason.trim()
    if (!rr) { setMsg({ ok: false, text: t.errNeedReason }); return }
    start(async () => {
      setMsg(null)
      const r = await setDocumentDecisionAction({ documentId: doc.documentId!, decision: 'REJECTED', reason: rr })
      if (r.ok) { setMsg({ ok: true, text: t.rejectedOk }); setRejecting(false); setChanging(false); setReason(''); router.refresh() } else setMsg({ ok: false, text: r.error ?? t.errGeneric })
    })
  }
  const togglePreset = (p: string) =>
    setReason((cur) => {
      const lines = cur.split('\n').map((l) => l.trim()).filter(Boolean)
      return lines.includes(p) ? lines.filter((l) => l !== p).join('\n') : [...lines, p].join('\n')
    })

  const btn = (bg: string, fg: string) => ({ padding: isMobile ? '11px 14px' : '7px 12px', minHeight: isMobile ? 44 : undefined, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', background: bg, color: fg, font: '700 11px var(--f-ui)', cursor: pending ? 'wait' : 'pointer' }) as const

  const thumbW = isMobile ? '100%' : 96
  const thumbH = isMobile ? 150 : 66

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12, padding: 12, borderRadius: 12, background: 'var(--d-panel)', border: '1px solid var(--d-hair)' }}>
      {/* thumbnail */}
      <div style={{ flexShrink: 0, width: isMobile ? '100%' : undefined }}>
        {doc.documentId ? (
          <a href={`/api/documents/${doc.documentId}`} target="_blank" rel="noreferrer" style={{ display: 'block', width: thumbW }}>
            {isImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/documents/${doc.documentId}`} alt={doc.type} style={{ width: thumbW, height: thumbH, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,.12)' }} />
            ) : (
              <div style={{ width: thumbW, height: thumbH, borderRadius: 8, border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--d-card)', font: '700 11px var(--f-ui)', color: 'var(--d-muted)' }}>PDF</div>
            )}
          </a>
        ) : (
          <div style={{ width: thumbW, height: thumbH, borderRadius: 8, border: '1px dashed rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--d-el)', font: '600 10px var(--f-ui)', color: 'var(--d-muted-2)', textAlign: 'center' }}>{t.noUpload}</div>
        )}
      </div>

      {/* info + controls */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ font: '700 12px var(--f-ui)', color: 'var(--d-text)' }}>{doc.label}</span>
          <span style={{ padding: '3px 9px', borderRadius: 999, background: badge.bg, color: badge.c, font: '700 10px var(--f-ui)' }}>{badge.t}</span>
          {doc.decision === 'APPROVED' && doc.expiresAt && (
            <span style={{ font: '500 10.5px var(--f-mono)', color: doc.expired ? 'var(--d-red)' : 'var(--d-muted)' }}>{t.until} {doc.expiresAt.slice(0, 10)}</span>
          )}
        </div>
        {doc.decision === 'REJECTED' && doc.reason && (
          <div style={{ font: '500 11px var(--f-ui)', color: '#F3B0B0', whiteSpace: 'pre-wrap' }}>{t.reasonPrefix} {doc.reason}</div>
        )}

        {/* Decided (approved/rejected) → show the result only, with an explicit opt-in to change it.
            The default Approve/Reject buttons never persist on an already-decided document. */}
        {doc.documentId && decided && !changing && !rejecting && (
          <button
            type="button"
            onClick={() => { setMsg(null); setChanging(true) }}
            disabled={pending}
            style={{ alignSelf: 'flex-start', padding: isMobile ? '10px 14px' : '6px 11px', minHeight: isMobile ? 44 : undefined, borderRadius: 8, border: '1px solid rgba(255,255,255,.16)', background: 'var(--d-el)', color: 'var(--d-muted)', font: '700 11px var(--f-ui)', cursor: pending ? 'wait' : 'pointer' }}
          >
            {t.changeDecision}
          </button>
        )}

        {/* decision controls — for PENDING docs by default, or when explicitly changing a decided one */}
        {doc.documentId && !rejecting && (isPending || changing) && (
          <div style={{ display: 'flex', gap: isMobile ? 8 : 7, alignItems: isMobile ? 'stretch' : 'flex-end', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
            {needsExpiry && (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 2, font: '400 9px var(--f-mono)', letterSpacing: '.06em', color: 'var(--d-muted-2)', width: isMobile ? '100%' : undefined }}>
                {t.expiryLabel}
                <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} style={{ ...inputSt, width: isMobile ? '100%' : undefined }} />
              </label>
            )}
            <div style={{ display: 'flex', gap: 8, width: isMobile ? '100%' : undefined }}>
              <button type="button" onClick={approve} disabled={pending} style={{ ...btn('rgba(39,181,118,.18)', 'var(--d-green)'), flex: isMobile ? 1 : undefined }}>{t.approveBtn}</button>
              <button type="button" onClick={() => { setMsg(null); setRejecting(true) }} disabled={pending} style={{ ...btn('rgba(224,69,69,.14)', 'var(--d-red)'), flex: isMobile ? 1 : undefined }}>{t.rejectBtn}</button>
              {changing && <button type="button" onClick={() => setChanging(false)} disabled={pending} style={{ ...btn('var(--d-el)', 'var(--d-text)'), flex: isMobile ? 1 : undefined }}>{t.cancel}</button>}
            </div>
          </div>
        )}

        {doc.documentId && rejecting && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: 10, borderRadius: 9, background: 'rgba(224,69,69,.06)', border: '1px solid rgba(224,69,69,.22)' }}>
            <div style={{ font: '700 9px var(--f-mono)', letterSpacing: '.1em', color: 'var(--d-muted-2)' }}>{t.rejectReasonTitle}</div>
            <div style={{ display: 'flex', gap: isMobile ? 8 : 5, flexWrap: 'wrap' }}>
              {t.presetReasons.map((p) => {
                const on = reason.split('\n').map((l) => l.trim()).includes(p)
                return (
                  <button key={p} type="button" onClick={() => togglePreset(p)} style={{ padding: isMobile ? '9px 12px' : '4px 9px', minHeight: isMobile ? 40 : undefined, borderRadius: 999, cursor: 'pointer', border: on ? '1px solid var(--d-red)' : '1px solid rgba(255,255,255,.16)', background: on ? 'rgba(224,69,69,.2)' : 'var(--d-base)', color: on ? '#F3B0B0' : 'var(--d-muted)', font: '700 10px var(--f-ui)' }}>
                    {on ? '✓ ' : ''}{p}
                  </button>
                )
              })}
            </div>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder={t.reasonPlaceholder} style={{ ...inputSt, width: '100%', resize: 'vertical', font: '500 12px/1.5 var(--f-ui)' }} />
            <div style={{ display: 'flex', gap: isMobile ? 8 : 7, flexDirection: isMobile ? 'column' : 'row' }}>
              <button type="button" onClick={submitReject} disabled={pending || !reason.trim()} style={{ ...btn('rgba(224,69,69,.9)', '#fff'), width: isMobile ? '100%' : undefined, opacity: !reason.trim() ? 0.5 : 1, cursor: !reason.trim() ? 'not-allowed' : pending ? 'wait' : 'pointer' }}>{t.rejectWithReason}</button>
              <button type="button" onClick={() => { setRejecting(false); setReason('') }} disabled={pending} style={{ ...btn('var(--d-el)', 'var(--d-text)'), width: isMobile ? '100%' : undefined }}>{t.cancel}</button>
            </div>
          </div>
        )}

        {msg && <span style={{ font: '600 11px var(--f-ui)', color: msg.ok ? 'var(--d-green)' : 'var(--d-red)' }}>{msg.text}</span>}
      </div>
    </div>
  )
}

export default function VerificationReview({ docs, compact }: { docs: ReviewDoc[]; compact?: boolean }) {
  const t = useDict(dict)
  if (!docs.length) return <div style={{ font: '500 12px var(--f-ui)', color: 'var(--d-muted-2)' }}>{t.noDocsRequired}</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 8 : 10 }}>
      {docs.map((d) => <DocCard key={d.type} doc={d} compact={compact} />)}
    </div>
  )
}
