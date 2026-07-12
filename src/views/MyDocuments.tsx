'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CountryRegionPicker from '../components/CountryRegionPicker'
import { useDict, useLang } from '../i18n/lang'
import { uploadDocumentAction, deleteDocumentAction, saveDocLocationAction } from '../server/document-actions'
import type { DerivedVerification } from '@/lib/verification'

type DocSlot = 'PASSPORT' | 'SELFIE' | 'LICENSE_FRONT' | 'LICENSE_BACK'
type Staged = { file: File; url: string }

const DICT = {
  en: {
    heading: 'My documents',
    intro: 'Manage the identity documents used to verify your account. Upload or replace them here — no booking required. Files are encrypted on upload.',
    back: 'Back to profile',
    readHint: 'Documents must be readable, glare-free and clear.',
    pickCountry: 'First select the document’s issuing country and region.',
    verified: 'Identity verified',
    pending: 'Documents submitted — awaiting review by our team.',
    rejected: 'Some documents need attention — please re-upload the ones marked below.',
    prompt: 'Upload your passport/ID and driving licence (front and back). Our team reviews them and approves your account.',
    sumsubNote: 'Identity verification for your account is handled by our verification provider during booking. There are no documents to manage here.',
    approved: 'Approved',
    underReview: 'Under review',
    expired: 'Expired',
    reject: 'Rejected',
    needed: 'Upload needed',
    validUntil: 'Valid until',
    attach: 'Attach file',
    replace: 'Replace',
    remove: 'Remove',
    del: 'Delete upload',
    view: 'View',
    delConfirm: "Delete this document? This can't be undone.",
    submit: (n: number) => `Submit for review (${n})`,
    uploading: '… uploading',
    passport: 'Passport',
    selfie: 'Selfie with document',
    dlFront: 'Licence front',
    dlBack: 'Licence back',
    approvedLock: 'Approved documents are your verified set and can’t be deleted here.',
  },
  ru: {
    heading: 'Мои документы',
    intro: 'Управляйте документами для проверки аккаунта. Загружайте или заменяйте их здесь — без оформления брони. Файлы шифруются при загрузке.',
    back: 'Назад в профиль',
    readHint: 'Документы должны быть читаемыми, без бликов и чёткими.',
    pickCountry: 'Сначала выберите страну и регион выдачи документа.',
    verified: 'Личность подтверждена',
    pending: 'Документы отправлены — ожидают проверки нашей командой.',
    rejected: 'Некоторые документы требуют внимания — загрузите заново отмеченные ниже.',
    prompt: 'Загрузите паспорт/ID и водительское удостоверение (обе стороны). Наша команда проверит и подтвердит аккаунт.',
    sumsubNote: 'Проверка личности выполняется нашим провайдером верификации во время бронирования. Здесь нет документов для управления.',
    approved: 'Одобрен',
    underReview: 'На проверке',
    expired: 'Истёк',
    reject: 'Отклонён',
    needed: 'Нужна загрузка',
    validUntil: 'Действителен до',
    attach: 'Прикрепить файл',
    replace: 'Заменить',
    remove: 'Убрать',
    del: 'Удалить загрузку',
    view: 'Просмотреть',
    delConfirm: 'Удалить этот документ? Это действие нельзя отменить.',
    submit: (n: number) => `Отправить на проверку (${n})`,
    uploading: '… загрузка',
    passport: 'Паспорт',
    selfie: 'Селфи с документом',
    dlFront: 'ВУ — лицевая',
    dlBack: 'ВУ — оборот',
    approvedLock: 'Одобренные документы — ваш подтверждённый набор, их нельзя удалить здесь.',
  },
  tr: {
    heading: 'Belgelerim',
    intro: 'Hesabınızı doğrulamak için kullanılan kimlik belgelerini yönetin. Bunları buradan yükleyin veya değiştirin — rezervasyon gerekmez. Dosyalar yükleme sırasında şifrelenir.',
    back: 'Profile dön',
    readHint: 'Belgeler okunaklı, parlamasız ve net olmalıdır.',
    pickCountry: 'Önce belgenin verildiği ülkeyi ve bölgeyi seçin.',
    verified: 'Kimlik doğrulandı',
    pending: 'Belgeler gönderildi — ekibimizin incelemesi bekleniyor.',
    rejected: 'Bazı belgeler dikkat gerektiriyor — lütfen aşağıda işaretlenenleri yeniden yükleyin.',
    prompt: 'Pasaportunuzu/kimliğinizi ve sürücü belgenizi (ön ve arka) yükleyin. Ekibimiz bunları inceleyip hesabınızı onaylar.',
    sumsubNote: 'Hesabınızın kimlik doğrulaması, rezervasyon sırasında doğrulama sağlayıcımız tarafından yapılır. Burada yönetilecek belge yoktur.',
    approved: 'Onaylandı',
    underReview: 'İnceleniyor',
    expired: 'Süresi doldu',
    reject: 'Reddedildi',
    needed: 'Yükleme gerekli',
    validUntil: 'Geçerlilik sonu',
    attach: 'Dosya ekle',
    replace: 'Değiştir',
    remove: 'Kaldır',
    del: 'Yüklemeyi sil',
    view: 'Görüntüle',
    delConfirm: 'Bu belge silinsin mi? Bu işlem geri alınamaz.',
    submit: (n: number) => `İncelemeye gönder (${n})`,
    uploading: '… yükleniyor',
    passport: 'Pasaport',
    selfie: 'Belgeyle selfie',
    dlFront: 'Ehliyet ön yüz',
    dlBack: 'Ehliyet arka yüz',
    approvedLock: 'Onaylanmış belgeler doğrulanmış kaydınızın parçasıdır ve buradan silinemez.',
  },
  es: {
    heading: 'Mis documentos',
    intro: 'Gestiona los documentos de identidad que se usan para verificar tu cuenta. Súbelos o reemplázalos aquí, sin necesidad de reservar. Los archivos se cifran al subirlos.',
    back: 'Volver al perfil',
    readHint: 'Los documentos deben ser legibles, sin reflejos y nítidos.',
    pickCountry: 'Primero selecciona el país y la región de emisión del documento.',
    verified: 'Identidad verificada',
    pending: 'Documentos enviados — pendientes de revisión por nuestro equipo.',
    rejected: 'Algunos documentos requieren atención — vuelve a subir los marcados a continuación.',
    prompt: 'Sube tu pasaporte o documento de identidad y tu permiso de conducir (anverso y reverso). Nuestro equipo los revisa y aprueba tu cuenta.',
    sumsubNote: 'La verificación de identidad de tu cuenta la realiza nuestro proveedor de verificación durante la reserva. Aquí no hay documentos que gestionar.',
    approved: 'Aprobado',
    underReview: 'En revisión',
    expired: 'Caducado',
    reject: 'Rechazado',
    needed: 'Subida necesaria',
    validUntil: 'Válido hasta',
    attach: 'Adjuntar archivo',
    replace: 'Reemplazar',
    remove: 'Quitar',
    del: 'Eliminar subida',
    view: 'Ver',
    delConfirm: '¿Eliminar este documento? Esta acción no se puede deshacer.',
    submit: (n: number) => `Enviar para revisión (${n})`,
    uploading: '… subiendo',
    passport: 'Pasaporte',
    selfie: 'Selfie con el documento',
    dlFront: 'Permiso (anverso)',
    dlBack: 'Permiso (reverso)',
    approvedLock: 'Los documentos aprobados son tu conjunto verificado y no se pueden eliminar aquí.',
  },
  de: {
    heading: 'Meine Dokumente',
    intro: 'Verwalten Sie die Ausweisdokumente, mit denen Ihr Konto verifiziert wird. Laden Sie sie hier hoch oder ersetzen Sie sie — ganz ohne Buchung. Dateien werden beim Hochladen verschlüsselt.',
    back: 'Zurück zum Profil',
    readHint: 'Dokumente müssen lesbar, blendfrei und scharf sein.',
    pickCountry: 'Wählen Sie zuerst das Ausstellungsland und die Region des Dokuments.',
    verified: 'Identität verifiziert',
    pending: 'Dokumente eingereicht — Prüfung durch unser Team steht aus.',
    rejected: 'Einige Dokumente erfordern Aufmerksamkeit — bitte laden Sie die unten markierten erneut hoch.',
    prompt: 'Laden Sie Ihren Reisepass/Ausweis und Ihren Führerschein (Vorder- und Rückseite) hoch. Unser Team prüft sie und gibt Ihr Konto frei.',
    sumsubNote: 'Die Identitätsprüfung für Ihr Konto übernimmt unser Verifizierungsdienstleister während der Buchung. Hier gibt es keine Dokumente zu verwalten.',
    approved: 'Genehmigt',
    underReview: 'In Prüfung',
    expired: 'Abgelaufen',
    reject: 'Abgelehnt',
    needed: 'Upload erforderlich',
    validUntil: 'Gültig bis',
    attach: 'Datei anhängen',
    replace: 'Ersetzen',
    remove: 'Entfernen',
    del: 'Upload löschen',
    view: 'Ansehen',
    delConfirm: 'Dieses Dokument löschen? Dies kann nicht rückgängig gemacht werden.',
    submit: (n: number) => `Zur Prüfung einreichen (${n})`,
    uploading: '… wird hochgeladen',
    passport: 'Reisepass',
    selfie: 'Selfie mit Dokument',
    dlFront: 'Führerschein Vorderseite',
    dlBack: 'Führerschein Rückseite',
    approvedLock: 'Genehmigte Dokumente gehören zu Ihren verifizierten Unterlagen und können hier nicht gelöscht werden.',
  },
}

export default function MyDocuments({
  verification,
  method,
  initialCountry,
  initialRegion,
}: {
  verification: DerivedVerification
  method: string
  initialCountry: string
  initialRegion: string
}) {
  const t = useDict(DICT)
  const { lang } = useLang()
  const router = useRouter()

  const [docCountry, setDocCountry] = useState(initialCountry)
  const [docRegion, setDocRegion] = useState(initialRegion)
  const [docLocValid, setDocLocValid] = useState(!!(initialCountry && initialCountry.trim()))
  const [staged, setStaged] = useState<Partial<Record<DocSlot, Staged>>>({})
  const [docError, setDocError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB')
  }

  // Revoke staged object URLs on unmount (don't leak blob URLs).
  const stagedRef = useRef(staged)
  stagedRef.current = staged
  useEffect(() => () => { Object.values(stagedRef.current).forEach((s) => s && URL.revokeObjectURL(s.url)) }, [])

  // Persist the issuing country/region to the profile once it's a valid selection, so it survives a
  // reload (the doc attach controls are gated on it) and is recorded for verification — mirroring the
  // booking flow. Only fires on a real change to a valid pair; the picker locks after selection.
  useEffect(() => {
    if (!docLocValid || !docCountry.trim()) return
    if (docCountry === initialCountry && docRegion === initialRegion) return // already persisted
    void saveDocLocationAction({ country: docCountry, region: docRegion })
  }, [docLocValid, docCountry, docRegion, initialCountry, initialRegion])

  // Poll while anything is under review so a staff approve/reject appears without a manual reload.
  const anyPending = verification?.anyPending ?? false
  useEffect(() => {
    if (method !== 'MANUAL' || !anyPending) return
    const id = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(id)
  }, [method, anyPending, router])

  const stageFile = (slot: DocSlot, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setDocError(null)
    setStaged((prev) => {
      const cur = prev[slot]
      if (cur) URL.revokeObjectURL(cur.url)
      return { ...prev, [slot]: { file, url: URL.createObjectURL(file) } }
    })
  }
  const unstage = (slot: DocSlot) =>
    setStaged((prev) => {
      const cur = prev[slot]
      if (cur) URL.revokeObjectURL(cur.url)
      const next = { ...prev }
      delete next[slot]
      return next
    })

  const submitDocuments = async () => {
    const entries = Object.entries(staged) as [DocSlot, Staged][]
    if (!entries.length || submitting) return
    setSubmitting(true)
    setDocError(null)
    const done: DocSlot[] = []
    let failed: string | null = null
    for (const [slot, s] of entries) {
      const fd = new FormData()
      fd.append('file', s.file)
      fd.append('type', slot)
      const res = await uploadDocumentAction(fd)
      if (!res.ok) { failed = res.error ?? 'Upload error'; break }
      URL.revokeObjectURL(s.url)
      done.push(slot)
    }
    if (done.length) setStaged((prev) => { const next = { ...prev }; for (const sl of done) delete next[sl]; return next })
    if (failed) setDocError(failed)
    setSubmitting(false)
    router.refresh()
  }

  const deleteUploadedDoc = async (documentId: string) => {
    if (!window.confirm(t.delConfirm)) return
    setDocError(null)
    const res = await deleteDocumentAction(documentId)
    if (!res.ok) { setDocError(res.error ?? 'Error'); return }
    router.refresh()
  }

  const labelFor = (ty: string) => (ty === 'PASSPORT' ? t.passport : ty === 'SELFIE' ? t.selfie : ty === 'LICENSE_FRONT' ? t.dlFront : t.dlBack)
  const countryReady = docLocValid
  const dvDocs = verification?.docs ?? []
  const stagedCount = Object.keys(staged).length
  const verified = verification?.verified ?? false

  const card: React.CSSProperties = { background: '#fff', borderRadius: 18, padding: 20, boxShadow: '0 18px 40px -30px rgba(11,85,96,.4)', border: '1px solid rgba(20,153,174,.1)' }

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '22px var(--pad-x) 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Link href="/account" style={{ font: '700 12px var(--f-ui)', color: 'var(--av-teal)', textDecoration: 'none' }}>‹ {t.back}</Link>
        <h1 style={{ margin: '8px 0 0', font: '800 26px var(--f-display)', color: 'var(--av-text)' }}>{t.heading}</h1>
        <p style={{ margin: '8px 0 0', font: '500 13px/1.6 var(--f-ui)', color: 'var(--av-muted)' }}>{t.intro}</p>
      </div>

      {method === 'SUMSUB' ? (
        <div style={card}>
          <div style={{ font: '600 13px/1.6 var(--f-ui)', color: 'var(--av-muted)' }}>{t.sumsubNote}</div>
        </div>
      ) : (
        <div style={card}>
          {/* readability guidance */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '11px 14px', borderRadius: 12, background: '#FFF6E9', border: '1px solid rgba(224,161,6,.28)' }}>
            <span aria-hidden>💡</span>
            <span style={{ font: '600 12px/1.5 var(--f-ui)', color: '#B45309' }}>{t.readHint}</span>
          </div>

          {/* issuing country + region */}
          <div style={{ marginTop: 14 }}>
            <CountryRegionPicker
              country={docCountry}
              region={docRegion}
              onChange={(c, r) => { setDocCountry(c); setDocRegion(r) }}
              onValidChange={setDocLocValid}
              disabled={verified}
            />
          </div>

          {/* overall status banner */}
          {verified ? (
            <div style={{ marginTop: 14, background: '#E9FBF2', border: '1px solid rgba(39,181,118,.3)', borderRadius: 14, padding: 16, font: '700 14px var(--f-ui)', color: '#1F9E6B' }}>✓ {t.verified}</div>
          ) : verification?.anyPending ? (
            <div style={{ marginTop: 14, background: '#FFF6E9', border: '1px solid rgba(224,161,6,.3)', borderRadius: 14, padding: 14, font: '600 12.5px/1.5 var(--f-ui)', color: '#B45309' }}>⏳ {t.pending}</div>
          ) : verification?.anyRejected || verification?.anyExpired ? (
            <div style={{ marginTop: 14, background: '#FCEEE9', border: '1px solid rgba(214,75,61,.3)', borderRadius: 14, padding: 14, font: '700 13px var(--f-ui)', color: '#C6392B' }}>✕ {t.rejected}</div>
          ) : (
            <div style={{ marginTop: 14, font: '500 12px/1.6 var(--f-ui)', color: '#5E8A92' }}>{t.prompt}</div>
          )}

          {!countryReady && !verified && (
            <div style={{ marginTop: 12, font: '600 12px var(--f-ui)', color: '#E07A1E' }}>{t.pickCountry}</div>
          )}

          {/* per-document cards */}
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dvDocs.map((d) => {
              const slot = d.type as DocSlot
              const label = labelFor(d.type)
              const st = staged[slot]
              const approved = d.valid
              const pending = d.decision === 'PENDING'
              const actionable = !approved && !pending // NONE / REJECTED / expired → user can (re)submit
              const border = approved ? 'rgba(39,181,118,.35)' : pending ? 'rgba(224,161,6,.3)' : d.decision === 'REJECTED' || d.expired ? 'rgba(214,75,61,.3)' : 'rgba(20,153,174,.18)'
              const bg = approved ? '#F1FBF6' : pending ? '#FFFBF0' : d.decision === 'REJECTED' || d.expired ? '#FDF1EE' : '#F9FDFE'
              return (
                <div key={d.type} style={{ border: `1px solid ${border}`, borderRadius: 12, padding: 12, background: bg }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ font: '700 12.5px var(--f-ui)', color: '#0C3B45' }}>{label}</span>
                    <span style={{ font: '700 11px var(--f-ui)', color: approved ? '#1F9E6B' : pending ? '#B45309' : d.decision === 'REJECTED' || d.expired ? '#C6392B' : '#5E8A92' }}>
                      {approved ? `✓ ${t.approved}` : pending ? `⏳ ${t.underReview}` : d.expired ? `✕ ${t.expired}` : d.decision === 'REJECTED' ? `✕ ${t.reject}` : t.needed}
                    </span>
                  </div>
                  {approved && d.expiresAt && (
                    <div style={{ marginTop: 5, font: '500 11px var(--f-mono)', color: '#5E8A92' }}>{t.validUntil} {fmtDate(d.expiresAt)}</div>
                  )}
                  {d.decision === 'REJECTED' && d.reason && (
                    <div style={{ marginTop: 6, font: '500 12px/1.5 var(--f-ui)', color: '#C6392B', whiteSpace: 'pre-wrap' }}>{d.reason}</div>
                  )}

                  {/* View own document (gated /api/documents route) + delete a PENDING/REJECTED upload.
                      Approved docs are viewable but NEVER deletable here (the server re-checks). */}
                  {d.documentId && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <a
                        href={`/api/documents/${d.documentId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="av-tap"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 40, font: '700 11px var(--f-ui)', color: '#0E7E90', textDecoration: 'none' }}
                      >
                        👁 {t.view}
                      </a>
                      {(d.decision === 'PENDING' || d.decision === 'REJECTED') && (
                        <button
                          type="button"
                          onClick={() => deleteUploadedDoc(d.documentId!)}
                          className="av-tap"
                          aria-label={t.del}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 40, padding: 0, background: 'none', border: 'none', cursor: 'pointer', font: '700 11px var(--f-ui)', color: '#C6392B' }}
                        >
                          🗑 {t.del}
                        </button>
                      )}
                    </div>
                  )}

                  {actionable && countryReady && (
                    <div style={{ marginTop: 10 }}>
                      {st ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {/^image\//.test(st.file.type) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={st.url} alt={label} style={{ width: 84, height: 58, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(20,153,174,.25)' }} />
                          ) : (
                            <div style={{ width: 84, height: 58, borderRadius: 8, border: '1px solid rgba(20,153,174,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', font: '700 10px var(--f-ui)', color: '#0E7E90' }}>PDF</div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ font: '600 11px var(--f-ui)', color: '#0C3B45', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.file.name}</div>
                            <div style={{ marginTop: 4, display: 'flex', gap: 8 }}>
                              <label style={{ cursor: 'pointer', font: '700 11px var(--f-ui)', color: '#0E7E90' }}>
                                {t.replace}
                                <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ display: 'none' }} onChange={(e) => stageFile(slot, e)} />
                              </label>
                              <button type="button" onClick={() => unstage(slot)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: '700 11px var(--f-ui)', color: '#C6392B' }}>{t.remove}</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label style={{ display: 'inline-block', cursor: 'pointer', border: '1.5px dashed rgba(255,122,92,.5)', borderRadius: 10, padding: '9px 14px', background: '#FFF6F1', font: '700 11px var(--f-ui)', color: '#E07A1E' }}>
                          + {t.attach}
                          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ display: 'none' }} onChange={(e) => stageFile(slot, e)} />
                        </label>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {docError && <div style={{ marginTop: 10, font: '600 11px var(--f-ui)', color: '#D64545' }}>{docError}</div>}

          {stagedCount > 0 && (
            <button type="button" onClick={submitDocuments} disabled={submitting} className="av-cta av-tap" style={{ marginTop: 14, width: '100%', padding: '13px 18px', borderRadius: 12, border: 'none', background: 'var(--grad-coral)', color: '#fff', font: '800 13px var(--f-ui)', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? t.uploading : t.submit(stagedCount)}
            </button>
          )}

          <div style={{ marginTop: 12, font: '500 11px/1.5 var(--f-ui)', color: 'var(--av-muted)' }}>{t.approvedLock}</div>
        </div>
      )}
    </div>
  )
}
