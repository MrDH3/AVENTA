'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import ClientShell from '../components/ClientShell'
import { Container } from '../components/ui'
import { useDict, useLang, type Lang, type Dict } from '../i18n/lang'

/* ------------------------------------------------------------------ *
 * Bilingual copy (ported from AVENTA-13-States.dc.html)
 * ------------------------------------------------------------------ */
interface Copy {
  pageTitle: string
  pageSub: string

  secDocs: string
  secNoCars: string
  secNoBookings: string
  secPayFail: string

  // Doc upload card
  docsTitle: string
  docsSub: string
  passport: string
  uploading: string // shown as "{uploading} {n}%"
  dlFront: string
  verified: string
  dlBack: string
  rejected: string
  reupload: string
  selfie: string
  underReview: string
  dropTitle: string
  dropHint: string

  // No cars
  dateRange: string
  change: string
  noCarsTitle: string
  noCarsSub: string
  showOn: string
  joinQueue: string
  slotFree: (n: number) => string

  // No bookings
  noBookTitle: string
  noBookSub: string
  createManual: string
  configNotify: string

  // Payment failure
  payFailTitle: string
  payFailSub: string
  errCode: string
  retryPay: string
  altMethod: string
  needHelp: string
  contactManager: string
}

const dict: Dict<Copy> = {
  ru: {
    pageTitle: 'AVENTA — Состояния: документы, пустые экраны, ошибки',
    pageSub: 'Загрузка/проверка/отклонение · нет авто · нет заявок · сбой оплаты · «морской» стиль',

    secDocs: 'Загрузка документов · состояния',
    secNoCars: 'Пусто · нет авто на даты',
    secNoBookings: 'Пусто · нет заявок (админ)',
    secPayFail: 'Ошибка · сбой оплаты',

    docsTitle: 'Документы',
    docsSub: 'Загрузите фото — данные хранятся в зашифрованном виде',
    passport: 'Паспорт / ID',
    uploading: 'Загрузка…',
    dlFront: 'ВУ · лицевая сторона',
    verified: 'Проверено · принято',
    dlBack: 'ВУ · обратная сторона',
    rejected: 'Отклонено — фото размыто',
    reupload: 'Загрузить заново',
    selfie: 'Селфи с документом',
    underReview: 'На проверке модератором',
    dropTitle: 'Перетащите фото или нажмите для загрузки',
    dropHint: 'JPG, PNG, HEIC · до 10 МБ',

    dateRange: '22 авг → 24 авг · Аэропорт AYT',
    change: 'Изменить',
    noCarsTitle: 'На эти даты свободных авто нет',
    noCarsSub: 'Весь парк занят 22–24 августа. Вот ближайшие свободные интервалы:',
    showOn: 'Показать на 25–27 авг',
    joinQueue: 'Встать в очередь',
    slotFree: (n) => `${n} авто свободно`,

    noBookTitle: 'Заявок пока нет',
    noBookSub: 'Новые заявки появятся здесь автоматически. Уведомления придут в Telegram и на email.',
    createManual: 'Создать заявку вручную',
    configNotify: 'Настроить уведомления',

    payFailTitle: 'Оплата не прошла',
    payFailSub:
      'Банк отклонил транзакцию. Средства не списаны. Попробуйте снова или выберите другой способ оплаты.',
    errCode: 'Код ошибки',
    retryPay: 'Повторить оплату',
    altMethod: 'Другой способ · карта, перевод, крипто',
    needHelp: 'Нужна помощь?',
    contactManager: 'Написать менеджеру',
  },
  en: {
    pageTitle: 'AVENTA — States: documents, empty screens, errors',
    pageSub: 'Upload/review/rejection · no cars · no bookings · payment failure · coastal style',

    secDocs: 'Document upload · states',
    secNoCars: 'Empty · no cars for dates',
    secNoBookings: 'Empty · no bookings (admin)',
    secPayFail: 'Error · payment failure',

    docsTitle: 'Documents',
    docsSub: 'Upload a photo — your data is stored encrypted',
    passport: 'Passport / ID',
    uploading: 'Uploading…',
    dlFront: "Driver's licence · front",
    verified: 'Verified · accepted',
    dlBack: "Driver's licence · back",
    rejected: 'Rejected — photo is blurry',
    reupload: 'Upload again',
    selfie: 'Selfie with document',
    underReview: 'Under moderator review',
    dropTitle: 'Drag a photo here or click to upload',
    dropHint: 'JPG, PNG, HEIC · up to 10 MB',

    dateRange: 'Aug 22 → Aug 24 · AYT Airport',
    change: 'Change',
    noCarsTitle: 'No cars available for these dates',
    noCarsSub: 'The whole fleet is booked Aug 22–24. Here are the nearest free intervals:',
    showOn: 'Show for Aug 25–27',
    joinQueue: 'Join the queue',
    slotFree: (n) => `${n} cars free`,

    noBookTitle: 'No bookings yet',
    noBookSub: 'New bookings will appear here automatically. Alerts arrive via Telegram and email.',
    createManual: 'Create booking manually',
    configNotify: 'Configure notifications',

    payFailTitle: 'Payment failed',
    payFailSub:
      'The bank declined the transaction. No funds were charged. Try again or pick another payment method.',
    errCode: 'Error code',
    retryPay: 'Retry payment',
    altMethod: 'Another method · card, transfer, crypto',
    needHelp: 'Need help?',
    contactManager: 'Message a manager',
  },
  tr: {
    pageTitle: 'AVENTA — Durumlar: belgeler, boş ekranlar, hatalar',
    pageSub: 'Yükleme/inceleme/ret · araç yok · rezervasyon yok · ödeme hatası · kıyı stili',

    secDocs: 'Belge yükleme · durumlar',
    secNoCars: 'Boş · tarihlere uygun araç yok',
    secNoBookings: 'Boş · rezervasyon yok (yönetici)',
    secPayFail: 'Hata · ödeme başarısız',

    docsTitle: 'Belgeler',
    docsSub: 'Bir fotoğraf yükleyin — verileriniz şifreli olarak saklanır',
    passport: 'Pasaport / Kimlik',
    uploading: 'Yükleniyor…',
    dlFront: 'Sürücü belgesi · ön yüz',
    verified: 'Doğrulandı · kabul edildi',
    dlBack: 'Sürücü belgesi · arka yüz',
    rejected: 'Reddedildi — fotoğraf bulanık',
    reupload: 'Yeniden yükle',
    selfie: 'Belgeyle özçekim',
    underReview: 'Moderatör incelemesinde',
    dropTitle: 'Fotoğrafı buraya sürükleyin veya yüklemek için tıklayın',
    dropHint: 'JPG, PNG, HEIC · en fazla 10 MB',

    dateRange: '22 Ağu → 24 Ağu · AYT Havalimanı',
    change: 'Değiştir',
    noCarsTitle: 'Bu tarihlerde uygun araç yok',
    noCarsSub: 'Tüm filo 22–24 Ağustos için dolu. En yakın müsait aralıklar şunlar:',
    showOn: '25–27 Ağu için göster',
    joinQueue: 'Sıraya katıl',
    slotFree: (n) => `${n} araç müsait`,

    noBookTitle: 'Henüz rezervasyon yok',
    noBookSub: 'Yeni rezervasyonlar burada otomatik olarak görünecek. Bildirimler Telegram ve e-posta ile gelir.',
    createManual: 'Rezervasyonu elle oluştur',
    configNotify: 'Bildirimleri yapılandır',

    payFailTitle: 'Ödeme başarısız',
    payFailSub:
      'Banka işlemi reddetti. Hesabınızdan para çekilmedi. Tekrar deneyin veya başka bir ödeme yöntemi seçin.',
    errCode: 'Hata kodu',
    retryPay: 'Ödemeyi tekrar dene',
    altMethod: 'Başka yöntem · kart, havale, kripto',
    needHelp: 'Yardım gerekli mi?',
    contactManager: 'Yöneticiye yaz',
  },
  es: {
    pageTitle: 'AVENTA — Estados: documentos, pantallas vacías, errores',
    pageSub: 'Subida/revisión/rechazo · sin coches · sin reservas · error de pago · estilo costero',

    secDocs: 'Subida de documentos · estados',
    secNoCars: 'Vacío · sin coches para las fechas',
    secNoBookings: 'Vacío · sin reservas (administrador)',
    secPayFail: 'Error · fallo de pago',

    docsTitle: 'Documentos',
    docsSub: 'Sube una foto — tus datos se guardan cifrados',
    passport: 'Pasaporte / DNI',
    uploading: 'Subiendo…',
    dlFront: 'Carné de conducir · anverso',
    verified: 'Verificado · aceptado',
    dlBack: 'Carné de conducir · reverso',
    rejected: 'Rechazado — la foto está borrosa',
    reupload: 'Subir de nuevo',
    selfie: 'Selfi con el documento',
    underReview: 'En revisión por el moderador',
    dropTitle: 'Arrastra una foto aquí o haz clic para subir',
    dropHint: 'JPG, PNG, HEIC · hasta 10 MB',

    dateRange: '22 ago → 24 ago · Aeropuerto AYT',
    change: 'Cambiar',
    noCarsTitle: 'No hay coches disponibles para estas fechas',
    noCarsSub: 'Toda la flota está reservada del 22 al 24 de agosto. Estos son los intervalos libres más cercanos:',
    showOn: 'Mostrar 25–27 ago',
    joinQueue: 'Unirse a la cola',
    slotFree: (n) => `${n} coches libres`,

    noBookTitle: 'Aún no hay reservas',
    noBookSub: 'Las nuevas reservas aparecerán aquí automáticamente. Los avisos llegan por Telegram y correo electrónico.',
    createManual: 'Crear reserva manualmente',
    configNotify: 'Configurar notificaciones',

    payFailTitle: 'Pago fallido',
    payFailSub:
      'El banco rechazó la transacción. No se realizó ningún cargo. Inténtalo de nuevo o elige otro método de pago.',
    errCode: 'Código de error',
    retryPay: 'Reintentar el pago',
    altMethod: 'Otro método · tarjeta, transferencia, cripto',
    needHelp: '¿Necesitas ayuda?',
    contactManager: 'Escribir a un gestor',
  },
  de: {
    pageTitle: 'AVENTA — Zustände: Dokumente, leere Bildschirme, Fehler',
    pageSub: 'Hochladen/Prüfung/Ablehnung · keine Fahrzeuge · keine Buchungen · Zahlungsfehler · Küstenstil',

    secDocs: 'Dokument-Upload · Zustände',
    secNoCars: 'Leer · keine Fahrzeuge für diese Daten',
    secNoBookings: 'Leer · keine Buchungen (Admin)',
    secPayFail: 'Fehler · Zahlung fehlgeschlagen',

    docsTitle: 'Dokumente',
    docsSub: 'Laden Sie ein Foto hoch — Ihre Daten werden verschlüsselt gespeichert',
    passport: 'Reisepass / Ausweis',
    uploading: 'Wird hochgeladen…',
    dlFront: 'Führerschein · Vorderseite',
    verified: 'Verifiziert · akzeptiert',
    dlBack: 'Führerschein · Rückseite',
    rejected: 'Abgelehnt — Foto ist unscharf',
    reupload: 'Erneut hochladen',
    selfie: 'Selfie mit Dokument',
    underReview: 'Wird vom Moderator geprüft',
    dropTitle: 'Foto hierher ziehen oder zum Hochladen klicken',
    dropHint: 'JPG, PNG, HEIC · bis zu 10 MB',

    dateRange: '22. Aug → 24. Aug · Flughafen AYT',
    change: 'Ändern',
    noCarsTitle: 'Keine Fahrzeuge für diese Daten verfügbar',
    noCarsSub: 'Die gesamte Flotte ist vom 22.–24. August ausgebucht. Hier sind die nächstgelegenen freien Zeiträume:',
    showOn: '25.–27. Aug anzeigen',
    joinQueue: 'Warteliste beitreten',
    slotFree: (n) => `${n} Fahrzeuge frei`,

    noBookTitle: 'Noch keine Buchungen',
    noBookSub: 'Neue Buchungen erscheinen hier automatisch. Benachrichtigungen kommen per Telegram und E-Mail.',
    createManual: 'Buchung manuell erstellen',
    configNotify: 'Benachrichtigungen konfigurieren',

    payFailTitle: 'Zahlung fehlgeschlagen',
    payFailSub:
      'Die Bank hat die Transaktion abgelehnt. Es wurde kein Betrag abgebucht. Versuchen Sie es erneut oder wählen Sie eine andere Zahlungsmethode.',
    errCode: 'Fehlercode',
    retryPay: 'Zahlung wiederholen',
    altMethod: 'Andere Methode · Karte, Überweisung, Krypto',
    needHelp: 'Brauchen Sie Hilfe?',
    contactManager: 'Einem Manager schreiben',
  },
}

/* Free-interval data (date labels kept verbatim from the design) */
interface Slot {
  id: string
  ru: string
  en: string
  tr: string
  es: string
  de: string
  free: number
  highlight: boolean
}
const SLOTS: Slot[] = [
  { id: 's1', ru: '25–27 авг', en: 'Aug 25–27', tr: '25–27 Ağu', es: '25–27 ago', de: '25.–27. Aug', free: 3, highlight: true },
  { id: 's2', ru: '28–31 авг', en: 'Aug 28–31', tr: '28–31 Ağu', es: '28–31 ago', de: '28.–31. Aug', free: 5, highlight: false },
  { id: 's3', ru: '01–05 сен', en: 'Sep 01–05', tr: '01–05 Eyl', es: '01–05 sep', de: '01.–05. Sep', free: 5, highlight: false },
]

/* ------------------------------------------------------------------ *
 * Tokens & small shared bits
 * ------------------------------------------------------------------ */
const FONT_UI = 'var(--f-ui)'
const FONT_DISPLAY = 'var(--f-display)'
const FONT_MONO = 'var(--f-mono)'

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ font: `700 13px ${FONT_MONO}`, color: '#5E8A92', marginBottom: 14 }}>
      {children}
    </div>
  )
}

/** White comp card with the design's soft deep shadow. */
function CompCard({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 30px 70px -34px rgba(11,85,96,.5)',
        background: '#fff',
        fontFamily: FONT_UI,
        color: '#0C3B45',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

const thumbIcon: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 10,
  background: 'linear-gradient(135deg,#DCF3F6,#B6E6EE)',
  flexShrink: 0,
}

/** Pressable shim so the design's static "buttons" become real, focusable controls. */
function Press({
  children,
  onClick,
  style,
}: {
  children: ReactNode
  onClick?: () => void
  style?: CSSProperties
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="av-cta"
      style={{ appearance: 'none', border: 'none', cursor: 'pointer', font: 'inherit', ...style }}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ *
 * 1) Document upload states
 * ------------------------------------------------------------------ */
function DocUploadCard({ t }: { t: Copy }) {
  // Animate the upload progress so the bar visibly moves (ping-pong 40–88%).
  const [pct, setPct] = useState(64)
  const dir = useRef(1)
  useEffect(() => {
    const id = window.setInterval(() => {
      setPct((p) => {
        let next = p + dir.current * 6
        if (next >= 88) {
          next = 88
          dir.current = -1
        } else if (next <= 40) {
          next = 40
          dir.current = 1
        }
        return next
      })
    }, 600)
    return () => window.clearInterval(id)
  }, [])

  const [reuploaded, setReuploaded] = useState(false)

  return (
    <CompCard style={{ padding: 28 }}>
      <div style={{ font: `800 20px ${FONT_DISPLAY}`, color: '#0C3B45' }}>{t.docsTitle}</div>
      <div style={{ marginTop: 4, font: `500 12px ${FONT_UI}`, color: '#5E8A92' }}>{t.docsSub}</div>

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 11 }}>
        {/* Uploading — with % PROGRESS bar */}
        <div style={{ background: '#F2FAFB', border: '1.5px solid #FF7A5C', borderRadius: 13, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={thumbIcon} />
            <div style={{ flex: 1 }}>
              <div style={{ font: `700 13px ${FONT_UI}`, color: '#0C3B45' }}>{t.passport}</div>
              <div style={{ font: `600 11px ${FONT_MONO}`, color: '#FF6F61' }}>
                {t.uploading} {pct}%
              </div>
            </div>
          </div>
          <div
            style={{ marginTop: 11, height: 6, borderRadius: 3, background: '#E4EEF0', overflow: 'hidden' }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background: 'linear-gradient(90deg,#FF8A5B,#FF6F61)',
                borderRadius: 3,
                transition: 'width .6s linear',
              }}
            />
          </div>
        </div>

        {/* Verified */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: '#E9FBF2',
            border: '1px solid rgba(39,181,118,.35)',
            borderRadius: 13,
            padding: 14,
          }}
        >
          <div style={thumbIcon} />
          <div style={{ flex: 1 }}>
            <div style={{ font: `700 13px ${FONT_UI}`, color: '#0C3B45' }}>{t.dlFront}</div>
            <div style={{ font: `600 11px ${FONT_UI}`, color: '#1F9E6B' }}>{t.verified}</div>
          </div>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#27B576"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M8.5 12l2.5 2.5 4.5-5" />
          </svg>
        </div>

        {/* Rejected — with re-upload (re-upload flips it to an uploading state) */}
        <div
          style={{
            background: reuploaded ? '#F2FAFB' : '#FFF4F1',
            border: reuploaded ? '1.5px solid #FF7A5C' : '1px solid rgba(255,111,97,.4)',
            borderRadius: 13,
            padding: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: reuploaded ? 'linear-gradient(135deg,#DCF3F6,#B6E6EE)' : '#FFE3DB',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ font: `700 13px ${FONT_UI}`, color: '#0C3B45' }}>{t.dlBack}</div>
              <div style={{ font: `600 11px ${FONT_UI}`, color: reuploaded ? '#FF6F61' : '#E0533E' }}>
                {reuploaded ? `${t.uploading} 12%` : t.rejected}
              </div>
            </div>
            {reuploaded ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FF6F61"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ animation: 'av-spin 1s linear infinite' }}
              >
                <path d="M12 3a9 9 0 109 9" />
              </svg>
            ) : (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#E0533E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            )}
          </div>
          {!reuploaded && (
            <div style={{ marginTop: 10 }}>
              <Press
                onClick={() => setReuploaded(true)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'center',
                  padding: 9,
                  background: '#FFE3DB',
                  color: '#E0533E',
                  borderRadius: 9,
                  font: `700 11px ${FONT_UI}`,
                }}
              >
                {t.reupload}
              </Press>
            </div>
          )}
        </div>

        {/* Under review — 1s linear SPINNER via global av-spin keyframe */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: '#EAF4FB',
            border: '1px solid rgba(46,134,201,.3)',
            borderRadius: 13,
            padding: 14,
          }}
        >
          <div style={thumbIcon} />
          <div style={{ flex: 1 }}>
            <div style={{ font: `700 13px ${FONT_UI}`, color: '#0C3B45' }}>{t.selfie}</div>
            <div style={{ font: `600 11px ${FONT_UI}`, color: '#2E86C9' }}>{t.underReview}</div>
          </div>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2E86C9"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ animation: 'av-spin 1s linear infinite' }}
          >
            <path d="M12 3a9 9 0 109 9" />
          </svg>
        </div>

        {/* Empty dropzone */}
        <div
          style={{
            border: '1.5px dashed rgba(20,153,174,.35)',
            borderRadius: 13,
            padding: 20,
            textAlign: 'center',
            background: '#F2FAFB',
          }}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0E7E90"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 16V4M8 8l4-4 4 4" />
            <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
          </svg>
          <div style={{ marginTop: 8, font: `600 12px ${FONT_UI}`, color: '#0E7E90' }}>{t.dropTitle}</div>
          <div style={{ marginTop: 3, font: `500 10px ${FONT_MONO}`, color: '#9AB4BC' }}>{t.dropHint}</div>
        </div>
      </div>
    </CompCard>
  )
}

/* ------------------------------------------------------------------ *
 * 2) No cars for dates
 * ------------------------------------------------------------------ */
function NoCarsCard({ t, lang }: { t: Copy; lang: Lang }) {
  const [selected, setSelected] = useState<string>('s1')

  return (
    <CompCard style={{ padding: 28 }}>
      {/* Date header */}
      <div
        style={{
          background: '#F2FAFB',
          border: '1px solid rgba(20,153,174,.22)',
          borderRadius: 13,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0E7E90"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="5" width="16" height="16" rx="2" />
            <path d="M4 9h16M8 3v4M16 3v4" />
          </svg>
          <span style={{ font: `700 13px ${FONT_UI}`, color: '#0C3B45' }}>{t.dateRange}</span>
        </div>
        <Press style={{ background: 'transparent', font: `700 12px ${FONT_UI}`, color: '#FF6F61', padding: 0 }}>
          {t.change}
        </Press>
      </div>

      {/* Empty body */}
      <div
        style={{
          marginTop: 26,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: 14,
        }}
      >
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: '50%',
            background: '#E0F6F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0E7E90"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l1.6-4.6A2 2 0 018.5 7h7a2 2 0 011.9 1.4L19 13v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H8v1a1 1 0 01-1 1H6a1 1 0 01-1-1z" />
            <path d="M3 3l18 18" />
          </svg>
        </div>
        <div style={{ marginTop: 18, font: `800 22px ${FONT_DISPLAY}`, color: '#0C3B45' }}>
          {t.noCarsTitle}
        </div>
        <div style={{ marginTop: 8, font: `500 14px/1.5 ${FONT_UI}`, color: '#5E8A92', maxWidth: 380 }}>
          {t.noCarsSub}
        </div>

        {/* Nearest free intervals (selectable) */}
        <div
          style={{
            marginTop: 20,
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {SLOTS.map((s) => {
            const active = selected === s.id
            return (
              <Press
                key={s.id}
                onClick={() => setSelected(s.id)}
                style={{
                  background: active ? '#E9FBF2' : '#F2FAFB',
                  border: active ? '1.5px solid #27B576' : '1px solid rgba(20,153,174,.2)',
                  borderRadius: 13,
                  padding: '12px 18px',
                  textAlign: 'center',
                }}
              >
                <div style={{ font: `700 13px ${FONT_UI}`, color: '#0C3B45' }}>
                  {s[lang] ?? s.en}
                </div>
                <div style={{ font: `600 11px ${FONT_UI}`, color: '#1F9E6B' }}>{t.slotFree(s.free)}</div>
              </Press>
            )
          })}
        </div>

        {/* CTA row: show on nearest + join queue */}
        <div
          style={{ marginTop: 22, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <Press
            style={{
              padding: '13px 24px',
              background: 'linear-gradient(180deg,#FF8A5B,#FF6F61)',
              color: '#fff',
              borderRadius: 12,
              font: `700 13px ${FONT_UI}`,
              boxShadow: '0 12px 26px -10px rgba(255,111,97,.7)',
            }}
          >
            {t.showOn}
          </Press>
          <Press
            style={{
              padding: '13px 22px',
              background: 'transparent',
              border: '1.5px solid rgba(20,153,174,.3)',
              color: '#0E7E90',
              borderRadius: 12,
              font: `700 13px ${FONT_UI}`,
            }}
          >
            {t.joinQueue}
          </Press>
        </div>
      </div>
    </CompCard>
  )
}

/* ------------------------------------------------------------------ *
 * 3) No bookings (admin empty state)
 * ------------------------------------------------------------------ */
function NoBookingsCard({ t }: { t: Copy }) {
  return (
    <CompCard style={{ padding: '40px 30px' }}>
      <div
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
      >
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: '50%',
            background: '#E0F6F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="38"
            height="38"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0E7E90"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 4h16v12H14l-2 3-2-3H4z" />
            <path d="M8 9h8M8 12h4" />
          </svg>
        </div>
        <div style={{ marginTop: 18, font: `800 22px ${FONT_DISPLAY}`, color: '#0C3B45' }}>
          {t.noBookTitle}
        </div>
        <div style={{ marginTop: 8, font: `500 14px/1.5 ${FONT_UI}`, color: '#5E8A92', maxWidth: 360 }}>
          {t.noBookSub}
        </div>
        <div
          style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <Press
            style={{
              padding: '12px 22px',
              background: 'linear-gradient(180deg,#FF8A5B,#FF6F61)',
              color: '#fff',
              borderRadius: 12,
              font: `700 13px ${FONT_UI}`,
              boxShadow: '0 12px 26px -10px rgba(255,111,97,.7)',
            }}
          >
            {t.createManual}
          </Press>
          <Press
            style={{
              padding: '12px 20px',
              background: 'transparent',
              border: '1.5px solid rgba(20,153,174,.3)',
              color: '#0E7E90',
              borderRadius: 12,
              font: `700 13px ${FONT_UI}`,
            }}
          >
            {t.configNotify}
          </Press>
        </div>
      </div>
    </CompCard>
  )
}

/* ------------------------------------------------------------------ *
 * 4) Payment failure
 * ------------------------------------------------------------------ */
function PaymentFailureCard({ t }: { t: Copy }) {
  return (
    <CompCard style={{ padding: '40px 34px', background: 'linear-gradient(180deg,#FFF1EC,#FFE3DB)' }}>
      <div
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 16px 36px -16px rgba(224,83,62,.5)',
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#E0533E"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16.5v.5" />
          </svg>
        </div>
        <div style={{ marginTop: 18, font: `800 24px ${FONT_DISPLAY}`, color: '#0C3B45' }}>
          {t.payFailTitle}
        </div>
        <div style={{ marginTop: 8, font: `500 14px/1.55 ${FONT_UI}`, color: '#7A5550', maxWidth: 340 }}>
          {t.payFailSub}
        </div>

        {/* Error code row */}
        <div
          style={{
            marginTop: 16,
            width: '100%',
            background: '#fff',
            borderRadius: 11,
            padding: '12px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            font: `600 12px ${FONT_UI}`,
          }}
        >
          <span style={{ color: '#7A5550' }}>{t.errCode}</span>
          <span style={{ color: '#E0533E', fontFamily: FONT_MONO }}>DECLINED_51</span>
        </div>

        {/* Actions: retry + alt method */}
        <div
          style={{ marginTop: 18, width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <Press
            style={{
              width: '100%',
              textAlign: 'center',
              padding: 14,
              background: 'linear-gradient(180deg,#FF8A5B,#FF6F61)',
              color: '#fff',
              borderRadius: 12,
              font: `700 14px ${FONT_UI}`,
              boxShadow: '0 14px 28px -10px rgba(255,111,97,.7)',
            }}
          >
            {t.retryPay}
          </Press>
          <Press
            style={{
              width: '100%',
              textAlign: 'center',
              padding: 13,
              background: '#fff',
              color: '#0E7E90',
              borderRadius: 12,
              font: `700 13px ${FONT_UI}`,
            }}
          >
            {t.altMethod}
          </Press>
        </div>

        <div style={{ marginTop: 16, font: `500 12px ${FONT_UI}`, color: '#7A5550' }}>
          {t.needHelp}{' '}
          <span style={{ color: '#FF6F61', fontWeight: 700, cursor: 'pointer' }}>{t.contactManager}</span>
        </div>
      </div>
    </CompCard>
  )
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */
export default function States() {
  const t = useDict(dict)
  const { lang } = useLang()

  return (
    <ClientShell>
      <Container pt={40} pb={72}>
        {/* Light heading */}
        <header style={{ marginBottom: 36, maxWidth: 760 }}>
          <div style={{ font: `700 12px ${FONT_MONO}`, letterSpacing: '.16em', color: '#FF7A5C' }}>
            UI · STATES
          </div>
          <h1
            style={{
              margin: '10px 0 0',
              font: `800 30px ${FONT_DISPLAY}`,
              color: '#0C3B45',
              lineHeight: 1.15,
            }}
          >
            {t.pageTitle}
          </h1>
          <p style={{ margin: '8px 0 0', font: `500 13px ${FONT_MONO}`, color: '#5E8A92' }}>
            {t.pageSub}
          </p>
        </header>

        {/* Gallery grid of state cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
            gap: 40,
            alignItems: 'start',
          }}
        >
          <section>
            <SectionLabel>{t.secDocs}</SectionLabel>
            <DocUploadCard t={t} />
          </section>

          <section>
            <SectionLabel>{t.secNoCars}</SectionLabel>
            <NoCarsCard t={t} lang={lang} />
          </section>

          <section>
            <SectionLabel>{t.secNoBookings}</SectionLabel>
            <NoBookingsCard t={t} />
          </section>

          <section>
            <SectionLabel>{t.secPayFail}</SectionLabel>
            <PaymentFailureCard t={t} />
          </section>
        </div>
      </Container>
    </ClientShell>
  )
}
