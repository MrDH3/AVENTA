'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useIsMobile } from '@/components/useIsMobile'
import type { QueueRow } from '@/lib/verification-queue'
import VerificationReview from './VerificationReview'
import { useDict, type Dict } from '../i18n/lang'

interface Strings {
  justNow: string
  minsAgo: (n: number) => string
  hoursAgo: (n: number) => string
  daysAgo: (n: number) => string
  awaitsReviewOne: string
  awaitsReviewMany: string
  underReview: string
  tabReviewed: string
  emptyPending: string
  emptyReviewed: string
  pillVerified: string
  pillNotPassed: string
  collapse: string
  review: string
  docsHeader: string
}

const dict: Dict<Strings> = {
  ru: {
    justNow: 'только что',
    minsAgo: (n) => `${n} мин назад`,
    hoursAgo: (n) => `${n} ч назад`,
    daysAgo: (n) => `${n} дн назад`,
    awaitsReviewOne: 'ожидает проверки',
    awaitsReviewMany: 'ожидают проверки',
    underReview: 'На проверке',
    tabReviewed: 'Проверенные',
    emptyPending: '🎉 Очередь пуста — все документы проверены.',
    emptyReviewed: 'Пока нет проверенных заявок.',
    pillVerified: 'Подтверждён',
    pillNotPassed: 'Не пройдена',
    collapse: 'Свернуть ▲',
    review: 'Проверить ▾',
    docsHeader: 'ДОКУМЕНТЫ ЛИЧНОСТИ — ПОДОКУМЕНТНОЕ РЕШЕНИЕ (зашифрованы · только для персонала)',
  },
  en: {
    justNow: 'just now',
    minsAgo: (n) => `${n} min ago`,
    hoursAgo: (n) => `${n} h ago`,
    daysAgo: (n) => `${n} d ago`,
    awaitsReviewOne: 'awaiting review',
    awaitsReviewMany: 'awaiting review',
    underReview: 'Under review',
    tabReviewed: 'Reviewed',
    emptyPending: '🎉 Queue is empty — all documents reviewed.',
    emptyReviewed: 'No reviewed requests yet.',
    pillVerified: 'Verified',
    pillNotPassed: 'Not passed',
    collapse: 'Collapse ▲',
    review: 'Review ▾',
    docsHeader: 'IDENTITY DOCUMENTS — PER-DOCUMENT DECISION (encrypted · staff only)',
  },
  tr: {
    justNow: 'az önce',
    minsAgo: (n) => `${n} dk önce`,
    hoursAgo: (n) => `${n} sa önce`,
    daysAgo: (n) => `${n} gün önce`,
    awaitsReviewOne: 'inceleme bekliyor',
    awaitsReviewMany: 'inceleme bekliyor',
    underReview: 'İncelemede',
    tabReviewed: 'İncelenenler',
    emptyPending: '🎉 Kuyruk boş — tüm belgeler incelendi.',
    emptyReviewed: 'Henüz incelenmiş başvuru yok.',
    pillVerified: 'Doğrulandı',
    pillNotPassed: 'Geçmedi',
    collapse: 'Daralt ▲',
    review: 'İncele ▾',
    docsHeader: 'KİMLİK BELGELERİ — BELGE BAZINDA KARAR (şifreli · yalnızca personel)',
  },
  es: {
    justNow: 'ahora mismo',
    minsAgo: (n) => `hace ${n} min`,
    hoursAgo: (n) => `hace ${n} h`,
    daysAgo: (n) => `hace ${n} d`,
    awaitsReviewOne: 'espera revisión',
    awaitsReviewMany: 'esperan revisión',
    underReview: 'En revisión',
    tabReviewed: 'Revisadas',
    emptyPending: '🎉 La cola está vacía — todos los documentos revisados.',
    emptyReviewed: 'Aún no hay solicitudes revisadas.',
    pillVerified: 'Verificado',
    pillNotPassed: 'No superada',
    collapse: 'Contraer ▲',
    review: 'Revisar ▾',
    docsHeader: 'DOCUMENTOS DE IDENTIDAD — DECISIÓN POR DOCUMENTO (cifrados · solo personal)',
  },
  de: {
    justNow: 'gerade eben',
    minsAgo: (n) => `vor ${n} Min.`,
    hoursAgo: (n) => `vor ${n} Std.`,
    daysAgo: (n) => `vor ${n} Tg.`,
    awaitsReviewOne: 'wartet auf Prüfung',
    awaitsReviewMany: 'warten auf Prüfung',
    underReview: 'In Prüfung',
    tabReviewed: 'Geprüfte',
    emptyPending: '🎉 Warteschlange ist leer — alle Dokumente geprüft.',
    emptyReviewed: 'Noch keine geprüften Anträge.',
    pillVerified: 'Verifiziert',
    pillNotPassed: 'Nicht bestanden',
    collapse: 'Einklappen ▲',
    review: 'Prüfen ▾',
    docsHeader: 'IDENTITÄTSDOKUMENTE — ENTSCHEIDUNG PRO DOKUMENT (verschlüsselt · nur für Personal)',
  },
}

/** Human "time ago" — how long a customer has waited / when last reviewed. */
function ago(iso: string | null, t: Strings): string {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return '—'
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000))
  if (mins < 1) return t.justNow
  if (mins < 60) return t.minsAgo(mins)
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return t.hoursAgo(hrs)
  return t.daysAgo(Math.round(hrs / 24))
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '—'
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const DOC_MARK: Record<string, { m: string; c: string }> = {
  APPROVED: { m: '✓', c: 'var(--d-green)' },
  PENDING: { m: '⏳', c: '#E7B463' },
  REJECTED: { m: '✕', c: 'var(--d-red)' },
  NONE: { m: '–', c: 'var(--d-muted-2)' },
}

export default function VerificationQueue({
  rows,
  filter,
  pendingCount,
}: {
  rows: QueueRow[]
  filter: 'pending' | 'reviewed'
  pendingCount: number
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const isMobile = useIsMobile()
  const t = useDict(dict)

  const tab = (key: 'pending' | 'reviewed', label: string) => {
    const on = filter === key
    return (
      <Link href={`/admin/verifications?filter=${key}`} className="av-tap" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '11px 16px' : '9px 16px', borderRadius: 10, textDecoration: 'none', font: '700 12px var(--f-ui)', background: on ? 'var(--d-accent)' : 'var(--d-el)', color: on ? '#082A33' : 'var(--d-muted)', border: on ? 'none' : '1px solid var(--d-hair)' }}>
        {label}
      </Link>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* count summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '10px 16px', borderRadius: 12, background: pendingCount > 0 ? 'rgba(224,162,62,.14)' : 'rgba(39,181,118,.12)', border: `1px solid ${pendingCount > 0 ? 'rgba(224,162,62,.3)' : 'rgba(39,181,118,.3)'}` }}>
          <span style={{ font: '800 20px var(--f-display)', color: pendingCount > 0 ? '#E7B463' : 'var(--d-green)' }}>{pendingCount}</span>
          <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-muted)' }}>{pendingCount === 1 ? t.awaitsReviewOne : t.awaitsReviewMany}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: isMobile ? 0 : 'auto', width: isMobile ? '100%' : 'auto' }}>
          {tab('pending', `${t.underReview}${pendingCount ? ` · ${pendingCount}` : ''}`)}
          {tab('reviewed', t.tabReviewed)}
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', borderRadius: 14, background: 'var(--d-panel)', border: '1px solid var(--d-hair)', font: '600 13px var(--f-ui)', color: 'var(--d-muted)' }}>
          {filter === 'pending' ? t.emptyPending : t.emptyReviewed}
        </div>
      ) : (
        <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--d-panel)', border: '1px solid var(--d-hair)' }}>
          {rows.map((r) => {
            const isOpen = expanded === r.userId
            return (
              <div key={r.userId} style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                <button type="button" onClick={() => setExpanded(isOpen ? null : r.userId)} style={{ width: '100%', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1.3fr) 1fr 1.1fr auto', gap: isMobile ? 10 : 14, alignItems: isMobile ? 'stretch' : 'center', padding: isMobile ? '14px' : '14px 18px', background: isOpen ? 'rgba(255,255,255,.03)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', minHeight: isMobile ? 56 : undefined }}>
                  {/* customer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                    <span style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: 'var(--d-el)', border: '1px solid rgba(255,122,92,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 11px var(--f-ui)', color: 'var(--d-accent-light)' }}>{initialsOf(r.name)}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', font: '700 13px var(--f-ui)', color: 'var(--d-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                      <span style={{ display: 'block', font: '500 11px var(--f-ui)', color: 'var(--d-muted-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.email}</span>
                    </span>
                  </div>
                  {/* time */}
                  <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-muted)' }}>
                    {filter === 'pending' ? `⏱ ${ago(r.submittedAt, t)}` : ago(r.reviewedAt, t)}
                  </span>
                  {/* per-document marks */}
                  <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {r.docs.map((d) => {
                      const mk = DOC_MARK[d.expired ? 'REJECTED' : d.decision] ?? DOC_MARK.NONE
                      return (
                        <span key={d.type} title={d.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, font: '700 11px var(--f-ui)', color: mk.c }}>
                          <span>{mk.m}</span>
                          <span style={{ color: 'var(--d-muted-2)', font: '600 10px var(--f-ui)' }}>{d.label.split(' ')[0].slice(0, 4)}</span>
                        </span>
                      )
                    })}
                  </span>
                  {/* verified badge + affordance */}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, justifySelf: isMobile ? 'stretch' : 'end', justifyContent: isMobile ? 'space-between' : 'flex-end', width: isMobile ? '100%' : 'auto' }}>
                    <span style={{ padding: isMobile ? '6px 12px' : '4px 10px', borderRadius: 999, background: r.verified ? 'rgba(39,181,118,.14)' : r.pendingCount ? 'rgba(224,162,62,.14)' : 'rgba(224,69,69,.14)', color: r.verified ? 'var(--d-green)' : r.pendingCount ? '#E7B463' : 'var(--d-red)', font: '700 10px var(--f-ui)' }}>
                      {r.verified ? t.pillVerified : r.pendingCount ? `${t.underReview} · ${r.pendingCount}` : t.pillNotPassed}
                    </span>
                    <span style={{ font: '700 12px var(--f-ui)', color: 'var(--d-accent-light)' }}>{isOpen ? t.collapse : t.review}</span>
                  </span>
                </button>

                {isOpen && (
                  <div style={{ padding: isMobile ? '4px 12px 14px' : '4px 18px 18px', background: 'rgba(255,255,255,.02)' }}>
                    <div style={{ font: '400 10px var(--f-mono)', letterSpacing: '.1em', color: 'var(--d-muted-2)', margin: '2px 0 10px' }}>
                      {t.docsHeader}
                      {r.bookings.length > 0 && <span style={{ marginLeft: 10, color: '#C9D4E4', font: '500 11px var(--f-mono)' }}>· {r.bookings.map((b) => b.number).join(', ')}</span>}
                    </div>
                    <VerificationReview docs={r.docs} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
