'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createSumsubAccessTokenAction, getMyVerificationStatusAction } from '@/server/sumsub-actions'
import type { VerificationState } from '@/lib/verification'
import type { Lang } from '@/i18n/lang'

// The Sumsub WebSDK attaches a builder to window when the script loads.
declare global {
  interface Window {
    snsWebSdk?: {
      init: (token: string, onExpire: () => Promise<string>) => SnsBuilder
    }
  }
}
interface SnsBuilder {
  withConf: (c: Record<string, unknown>) => SnsBuilder
  withOptions: (o: Record<string, unknown>) => SnsBuilder
  on: (event: string, cb: (p: unknown) => void) => SnsBuilder
  build: () => { launch: (sel: string) => void }
}

const SDK_SRC = 'https://static.sumsub.com/idensic/static/sns-websdk-builder.js'

const T = {
  ru: {
    verifiedTitle: 'Личность подтверждена',
    validThrough: 'Действительно до',
    passport: 'Паспорт/ID',
    license: 'Вод. удостоверение',
    pendingTitle: 'Проверка на рассмотрении',
    pendingBody: 'Мы получили ваши документы. Обычно проверка занимает несколько минут.',
    refresh: 'Обновить статус',
    rejectedTitle: 'Проверка не пройдена',
    rejectedBody: 'Мы не смогли подтвердить вашу личность. Свяжитесь с поддержкой.',
    resubmitTitle: 'Нужно отправить документы заново',
    startTitle: 'Подтвердите личность',
    startBody: 'Для завершения брони подтвердите паспорт/ID и водительское удостоверение (с селфи). Это делается один раз.',
    start: 'Начать проверку',
    again: 'Пройти проверку заново',
    expiredTitle: 'Срок действия документа истёк',
    expiredBody: 'Документ, использованный при проверке, истёк. Пройдите проверку заново с действующим документом.',
    launching: 'Загрузка проверки…',
    unavailable: 'Проверка сейчас недоступна. Свяжитесь с поддержкой.',
  },
  en: {
    verifiedTitle: 'Identity verified',
    validThrough: 'Valid through',
    passport: 'Passport/ID',
    license: 'Driving licence',
    pendingTitle: 'Verification in review',
    pendingBody: 'We received your documents. Review usually takes a few minutes.',
    refresh: 'Refresh status',
    rejectedTitle: 'Verification failed',
    rejectedBody: 'We could not verify your identity. Please contact support.',
    resubmitTitle: 'Please resubmit your documents',
    startTitle: 'Verify your identity',
    startBody: 'To complete the booking, verify your passport/ID and driving licence (with a selfie). This is a one-time step.',
    start: 'Start verification',
    again: 'Verify again',
    expiredTitle: 'A document has expired',
    expiredBody: 'A document used at verification has expired. Please re-verify with a valid document.',
    launching: 'Loading verification…',
    unavailable: 'Verification is temporarily unavailable. Please contact support.',
  },
  tr: {
    verifiedTitle: 'Kimlik doğrulandı',
    validThrough: 'Geçerlilik tarihi',
    passport: 'Pasaport/Kimlik',
    license: 'Sürücü belgesi',
    pendingTitle: 'Doğrulama inceleniyor',
    pendingBody: 'Belgelerinizi aldık. İnceleme genellikle birkaç dakika sürer.',
    refresh: 'Durumu yenile',
    rejectedTitle: 'Doğrulama başarısız',
    rejectedBody: 'Kimliğinizi doğrulayamadık. Lütfen destek ekibiyle iletişime geçin.',
    resubmitTitle: 'Lütfen belgelerinizi yeniden gönderin',
    startTitle: 'Kimliğinizi doğrulayın',
    startBody: 'Rezervasyonu tamamlamak için pasaportunuzu/kimliğinizi ve sürücü belgenizi (bir selfie ile) doğrulayın. Bu, tek seferlik bir adımdır.',
    start: 'Doğrulamayı başlat',
    again: 'Yeniden doğrula',
    expiredTitle: 'Bir belgenin süresi doldu',
    expiredBody: 'Doğrulamada kullanılan bir belgenin süresi doldu. Lütfen geçerli bir belgeyle yeniden doğrulayın.',
    launching: 'Doğrulama yükleniyor…',
    unavailable: 'Doğrulama geçici olarak kullanılamıyor. Lütfen destek ekibiyle iletişime geçin.',
  },
  es: {
    verifiedTitle: 'Identidad verificada',
    validThrough: 'Válido hasta',
    passport: 'Pasaporte/DNI',
    license: 'Permiso de conducir',
    pendingTitle: 'Verificación en revisión',
    pendingBody: 'Hemos recibido sus documentos. La revisión suele tardar unos minutos.',
    refresh: 'Actualizar estado',
    rejectedTitle: 'Verificación fallida',
    rejectedBody: 'No hemos podido verificar su identidad. Póngase en contacto con el servicio de soporte.',
    resubmitTitle: 'Vuelva a enviar sus documentos',
    startTitle: 'Verifique su identidad',
    startBody: 'Para completar la reserva, verifique su pasaporte/DNI y su permiso de conducir (con un selfie). Es un paso único.',
    start: 'Iniciar verificación',
    again: 'Verificar de nuevo',
    expiredTitle: 'Un documento ha caducado',
    expiredBody: 'Un documento usado en la verificación ha caducado. Vuelva a verificar con un documento válido.',
    launching: 'Cargando verificación…',
    unavailable: 'La verificación no está disponible temporalmente. Póngase en contacto con el servicio de soporte.',
  },
  de: {
    verifiedTitle: 'Identität bestätigt',
    validThrough: 'Gültig bis',
    passport: 'Reisepass/Ausweis',
    license: 'Führerschein',
    pendingTitle: 'Verifizierung wird geprüft',
    pendingBody: 'Wir haben Ihre Dokumente erhalten. Die Prüfung dauert in der Regel einige Minuten.',
    refresh: 'Status aktualisieren',
    rejectedTitle: 'Verifizierung fehlgeschlagen',
    rejectedBody: 'Wir konnten Ihre Identität nicht bestätigen. Bitte wenden Sie sich an den Support.',
    resubmitTitle: 'Bitte reichen Sie Ihre Dokumente erneut ein',
    startTitle: 'Bestätigen Sie Ihre Identität',
    startBody: 'Um die Buchung abzuschließen, verifizieren Sie Ihren Reisepass/Ausweis und Ihren Führerschein (mit einem Selfie). Dies ist ein einmaliger Schritt.',
    start: 'Verifizierung starten',
    again: 'Erneut verifizieren',
    expiredTitle: 'Ein Dokument ist abgelaufen',
    expiredBody: 'Ein bei der Verifizierung verwendetes Dokument ist abgelaufen. Bitte verifizieren Sie sich erneut mit einem gültigen Dokument.',
    launching: 'Verifizierung wird geladen…',
    unavailable: 'Die Verifizierung ist vorübergehend nicht verfügbar. Bitte wenden Sie sich an den Support.',
  },
}

function loadSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('no window'))
    if (window.snsWebSdk) return resolve()
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SDK_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('sdk load error')))
      return
    }
    const s = document.createElement('script')
    s.src = SDK_SRC
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('sdk load error'))
    document.head.appendChild(s)
  })
}

function fmtDate(iso: string | null, lang: Lang): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB')
}

export default function SumsubVerification({
  initial,
  lang,
  onStateChange,
}: {
  initial: VerificationState | null
  lang: Lang
  onStateChange?: (s: VerificationState) => void
}) {
  const t = T[lang] ?? T.en
  const [state, setState] = useState<VerificationState>(
    initial ?? { status: 'NONE', valid: false, passportExpired: false, licenseExpired: false, passportExpiry: null, licenseExpiry: null, verifiedAt: null, reason: null },
  )
  const [launching, setLaunching] = useState(false)
  const [sdkActive, setSdkActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const emit = useCallback((s: VerificationState) => { setState(s); onStateChange?.(s) }, [onStateChange])

  const refresh = useCallback(async () => {
    const res = await getMyVerificationStatusAction()
    if (res.ok && res.state) emit(res.state)
    return res.state
  }, [emit])

  // poll while the SDK is active or status is pending, reflecting the webhook result
  useEffect(() => {
    const active = sdkActive || state.status === 'PENDING'
    if (!active) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      return
    }
    if (pollRef.current) return
    pollRef.current = setInterval(async () => {
      const s = await refresh()
      if (s && (s.status === 'APPROVED' || s.status === 'REJECTED')) {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
        setSdkActive(false)
      }
    }, 4000)
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }
  }, [sdkActive, state.status, refresh])

  const launch = useCallback(async () => {
    setError(null)
    setLaunching(true)
    const tok = await createSumsubAccessTokenAction()
    if (!tok.ok || !tok.token) {
      setLaunching(false)
      setError(t.unavailable)
      return
    }
    try {
      await loadSdk()
      const builder = window.snsWebSdk!.init(tok.token, async () => {
        const r = await createSumsubAccessTokenAction()
        return r.token ?? ''
      })
      builder
        .withConf({ lang })
        .withOptions({ addViewportTag: false, adaptIframeHeight: true })
        .on('idCheck.onApplicantStatusChanged', () => { void refresh() })
        .on('idCheck.onApplicantSubmitted', () => { void refresh() })
        .build()
        .launch('#sumsub-websdk-container')
      setSdkActive(true)
    } catch {
      setError(t.unavailable)
    } finally {
      setLaunching(false)
    }
  }, [lang, refresh, t.unavailable])

  const card = (bg: string, border: string): React.CSSProperties => ({ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: 16 })
  const btn: React.CSSProperties = { marginTop: 12, padding: '11px 18px', borderRadius: 11, border: 'none', background: 'var(--grad-coral)', color: '#fff', font: '700 13px var(--f-ui)', cursor: 'pointer' }

  // ── VALID (approved + not expired) ──
  if (state.valid) {
    return (
      <div style={card('#E9FBF2', 'rgba(39,181,118,.3)')}>
        <div style={{ font: '700 14px var(--f-ui)', color: '#1F9E6B' }}>✓ {t.verifiedTitle}</div>
        <div style={{ marginTop: 8, display: 'flex', gap: 18, flexWrap: 'wrap', font: '500 12px var(--f-ui)', color: '#0C3B45' }}>
          {state.passportExpiry && <span>{t.passport}: {t.validThrough} {fmtDate(state.passportExpiry, lang)}</span>}
          {state.licenseExpiry && <span>{t.license}: {t.validThrough} {fmtDate(state.licenseExpiry, lang)}</span>}
        </div>
      </div>
    )
  }

  // ── REJECTED (final) ──
  if (state.status === 'REJECTED') {
    return (
      <div style={card('#FCEEE9', 'rgba(214,75,61,.3)')}>
        <div style={{ font: '700 14px var(--f-ui)', color: '#C6392B' }}>✕ {t.rejectedTitle}</div>
        <div style={{ marginTop: 6, font: '500 12.5px/1.5 var(--f-ui)', color: '#0C3B45' }}>{state.reason || t.rejectedBody}</div>
      </div>
    )
  }

  // ── PENDING (in review) ──
  if (state.status === 'PENDING' && !sdkActive) {
    return (
      <div style={card('#FFF6E9', 'rgba(224,161,6,.3)')}>
        <div style={{ font: '700 14px var(--f-ui)', color: '#B45309' }}>⏳ {t.pendingTitle}</div>
        <div style={{ marginTop: 6, font: '500 12.5px/1.5 var(--f-ui)', color: '#0C3B45' }}>{t.pendingBody}</div>
        <button type="button" onClick={() => void refresh()} style={{ ...btn, background: '#0E7E90' }}>{t.refresh}</button>
        <div id="sumsub-websdk-container" style={{ marginTop: 14 }} />
      </div>
    )
  }

  // ── NONE / RESUBMISSION / EXPIRED → action needed ──
  const expired = state.status === 'APPROVED' && (state.passportExpired || state.licenseExpired)
  const title = expired ? t.expiredTitle : state.status === 'RESUBMISSION' ? t.resubmitTitle : t.startTitle
  const body = expired ? t.expiredBody : state.status === 'RESUBMISSION' ? state.reason || '' : t.startBody
  const btnLabel = state.status === 'NONE' ? t.start : t.again

  return (
    <div style={card('#F2FAFB', 'rgba(20,153,174,.22)')}>
      <div style={{ font: '700 14px var(--f-ui)', color: '#0C3B45' }}>🪪 {title}</div>
      {body && <div style={{ marginTop: 6, font: '500 12.5px/1.6 var(--f-ui)', color: '#5E8A92' }}>{body}</div>}
      {!sdkActive && (
        <button type="button" onClick={() => void launch()} disabled={launching} style={{ ...btn, opacity: launching ? 0.6 : 1, cursor: launching ? 'wait' : 'pointer' }}>
          {launching ? t.launching : btnLabel}
        </button>
      )}
      {error && <div style={{ marginTop: 10, font: '600 12px var(--f-ui)', color: '#C6392B' }}>{error}</div>}
      <div id="sumsub-websdk-container" style={{ marginTop: 14 }} />
    </div>
  )
}
