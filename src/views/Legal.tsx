'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import ClientShell from '../components/ClientShell'
import { Container, Kicker } from '../components/ui'
import { useDict, type Lang } from '../i18n/lang'
import { recordConsentAction } from '@/server/misc-actions'
import { LEGAL_ROUTES, LEGAL_VERSION } from '@/lib/legal'

/* ------------------------------------------------------------------ *
 * /legal — a hub that links the three regulated documents (each on its
 * own route) and hosts the cookie banner + consent screen. The binding
 * text of the regulated docs is placeholder pending lawyer review.
 * ------------------------------------------------------------------ */

interface LegalCopy {
  pageTitle: string
  pageSub: string
  kicker: string
  banner: string
  docsTitle: string
  openWord: string
  docs: { key: 'privacy' | 'distance' | 'returns'; title: string; tr: string; desc: string; href: string }[]
  reopenConsent: string
  version: string
  // cookie banner
  cookieTitle: string
  cookieText: string
  cookiePolicyWord: string
  cookieAccept: string
  cookieNecessary: string
  cookieSettings: string
  cookieDismissed: string
  // consent modal
  consentTitle: string
  consentLead: string
  consentPersonal: string
  consentPersonalLink: string
  consentOffer: string
  consentOfferLink: string
  consentMarketing: string
  consentSubmit: string
  consentRevoke: string
  consentRequiredHint: string
  consentDone: string
}

const dict: Record<Lang, LegalCopy> = {
  ru: {
    pageTitle: 'Юридические документы',
    pageSub: 'Политика конфиденциальности · договор оферты · доставка и возврат · cookie · согласие',
    kicker: 'ДОКУМЕНТЫ',
    banner:
      'Регулируемые документы ниже — черновые шаблоны. Замените их реальным юридическим текстом, проверенным юристом, перед запуском.',
    docsTitle: 'Регулируемые документы',
    openWord: 'Открыть',
    docs: [
      { key: 'privacy', title: 'Политика конфиденциальности', tr: 'Gizlilik Politikası (KVKK)', desc: 'Какие данные мы собираем, цели, правовые основания KVKK, хранение, передача, права субъекта.', href: LEGAL_ROUTES.privacy },
      { key: 'distance', title: 'Договор оферты (дистанционной продажи)', tr: 'Mesafeli Satış Sözleşmesi', desc: 'Стороны, предмет, цена, оплата, доставка, право на отказ, отмена, разрешение споров.', href: LEGAL_ROUTES.distanceSelling },
      { key: 'returns', title: 'Политика доставки и возврата', tr: 'Teslimat ve İade Koşulları', desc: 'Условия отмены, обработка залога, способ и сроки возврата средств.', href: LEGAL_ROUTES.deliveryReturns },
    ],
    reopenConsent: 'Открыть экран согласия',
    version: 'Редакция',
    cookieTitle: 'Мы используем cookie',
    cookieText: 'Для работы сайта и аналитики. Продолжая, вы соглашаетесь с',
    cookiePolicyWord: 'политикой',
    cookieAccept: 'Принять все',
    cookieNecessary: 'Только нужные',
    cookieSettings: 'Настроить',
    cookieDismissed: 'Спасибо! Ваш выбор по cookie сохранён.',
    consentTitle: 'Согласие на обработку данных',
    consentLead:
      'Для оформления аренды, договора и страховки нам нужно обработать ваши персональные данные и документы.',
    consentPersonal: 'Согласие на обработку персональных данных согласно',
    consentPersonalLink: 'политике конфиденциальности',
    consentOffer: 'Принимаю условия',
    consentOfferLink: 'договора оферты',
    consentMarketing: 'Хочу получать спецпредложения (необязательно)',
    consentSubmit: 'Подтвердить и продолжить',
    consentRevoke: 'Вы можете отозвать согласие в любой момент',
    consentRequiredHint: 'Отметьте согласие на обработку данных и условия оферты, чтобы продолжить.',
    consentDone: 'Согласие принято — спасибо!',
  },
  en: {
    pageTitle: 'Legal documents',
    pageSub: 'Privacy policy · distance selling contract · delivery & returns · cookies · consent',
    kicker: 'DOCUMENTS',
    banner:
      'The regulated documents below are draft templates. Replace them with real, lawyer-reviewed legal text before launch.',
    docsTitle: 'Regulated documents',
    openWord: 'Open',
    docs: [
      { key: 'privacy', title: 'Privacy Policy', tr: 'Gizlilik Politikası (KVKK)', desc: 'What data we collect, purposes, KVKK legal bases, storage, transfers, and data-subject rights.', href: LEGAL_ROUTES.privacy },
      { key: 'distance', title: 'Distance Selling Contract', tr: 'Mesafeli Satış Sözleşmesi', desc: 'Parties, subject, price, payment, delivery, right of withdrawal, cancellation, dispute resolution.', href: LEGAL_ROUTES.distanceSelling },
      { key: 'returns', title: 'Delivery & Returns Policy', tr: 'Teslimat ve İade Koşulları', desc: 'Cancellation terms, deposit handling, refund method and timeline.', href: LEGAL_ROUTES.deliveryReturns },
    ],
    reopenConsent: 'Open consent screen',
    version: 'Revision',
    cookieTitle: 'We use cookies',
    cookieText: 'For the site to work and for analytics. By continuing, you agree to the',
    cookiePolicyWord: 'policy',
    cookieAccept: 'Accept all',
    cookieNecessary: 'Only necessary',
    cookieSettings: 'Customise',
    cookieDismissed: 'Thanks! Your cookie choice has been saved.',
    consentTitle: 'Consent to data processing',
    consentLead:
      'To arrange the rental, the contract and the insurance we need to process your personal data and documents.',
    consentPersonal: 'Consent to the processing of personal data in line with the',
    consentPersonalLink: 'privacy policy',
    consentOffer: 'I accept the terms of the',
    consentOfferLink: 'distance selling contract',
    consentMarketing: 'I want to receive special offers (optional)',
    consentSubmit: 'Confirm and continue',
    consentRevoke: 'You can withdraw consent at any time',
    consentRequiredHint: 'Tick consent to data processing and the contract terms to continue.',
    consentDone: 'Consent accepted — thank you!',
  },
  tr: {
    pageTitle: 'Yasal belgeler',
    pageSub: 'Gizlilik politikası · mesafeli satış sözleşmesi · teslimat ve iade · cookie · onay',
    kicker: 'BELGELER',
    banner:
      'Aşağıdaki düzenlemeye tabi belgeler taslak şablonlardır. Yayına almadan önce bunları avukat onaylı gerçek yasal metinlerle değiştirin.',
    docsTitle: 'Düzenlemeye tabi belgeler',
    openWord: 'Aç',
    docs: [
      { key: 'privacy', title: 'Gizlilik Politikası', tr: 'Gizlilik Politikası (KVKK)', desc: 'Hangi verileri topladığımız, amaçlar, KVKK hukuki dayanakları, saklama, aktarım ve ilgili kişinin hakları.', href: LEGAL_ROUTES.privacy },
      { key: 'distance', title: 'Mesafeli Satış Sözleşmesi', tr: 'Mesafeli Satış Sözleşmesi', desc: 'Taraflar, konu, fiyat, ödeme, teslimat, cayma hakkı, iptal ve uyuşmazlık çözümü.', href: LEGAL_ROUTES.distanceSelling },
      { key: 'returns', title: 'Teslimat ve İade Politikası', tr: 'Teslimat ve İade Koşulları', desc: 'İptal koşulları, depozito işlemleri, iade yöntemi ve süresi.', href: LEGAL_ROUTES.deliveryReturns },
    ],
    reopenConsent: 'Onay ekranını aç',
    version: 'Sürüm',
    cookieTitle: 'Cookie kullanıyoruz',
    cookieText: 'Sitenin çalışması ve analiz içindir. Devam ederek şu belgeyi kabul etmiş olursunuz:',
    cookiePolicyWord: 'gizlilik politikası',
    cookieAccept: 'Tümünü kabul et',
    cookieNecessary: 'Yalnızca gerekli olanlar',
    cookieSettings: 'Özelleştir',
    cookieDismissed: 'Teşekkürler! Cookie tercihiniz kaydedildi.',
    consentTitle: 'Veri işleme onayı',
    consentLead:
      'Kiralama, sözleşme ve sigorta işlemlerini yürütmek için kişisel verilerinizi ve belgelerinizi işlememiz gerekir.',
    consentPersonal: 'Kişisel verilerimin işlenmesine onay veriyorum:',
    consentPersonalLink: 'gizlilik politikası',
    consentOffer: 'Şu sözleşmenin şartlarını kabul ediyorum:',
    consentOfferLink: 'mesafeli satış sözleşmesi',
    consentMarketing: 'Özel teklifler almak istiyorum (isteğe bağlı)',
    consentSubmit: 'Onayla ve devam et',
    consentRevoke: 'Onayınızı istediğiniz zaman geri çekebilirsiniz',
    consentRequiredHint: 'Devam etmek için veri işleme ve sözleşme şartlarına onay verin.',
    consentDone: 'Onay alındı — teşekkürler!',
  },
  es: {
    pageTitle: 'Documentos legales',
    pageSub: 'Política de privacidad · contrato de venta a distancia · entrega y devoluciones · cookies · consentimiento',
    kicker: 'DOCUMENTOS',
    banner:
      'Los documentos regulados que figuran a continuación son plantillas provisionales. Sustitúyalos por textos legales reales, revisados por un abogado, antes del lanzamiento.',
    docsTitle: 'Documentos regulados',
    openWord: 'Abrir',
    docs: [
      { key: 'privacy', title: 'Política de privacidad', tr: 'Gizlilik Politikası (KVKK)', desc: 'Qué datos recopilamos, finalidades, bases legales de la KVKK, conservación, transferencias y derechos del interesado.', href: LEGAL_ROUTES.privacy },
      { key: 'distance', title: 'Contrato de venta a distancia', tr: 'Mesafeli Satış Sözleşmesi', desc: 'Partes, objeto, precio, pago, entrega, derecho de desistimiento, cancelación y resolución de conflictos.', href: LEGAL_ROUTES.distanceSelling },
      { key: 'returns', title: 'Política de entrega y devoluciones', tr: 'Teslimat ve İade Koşulları', desc: 'Condiciones de cancelación, gestión del depósito, método y plazos de reembolso.', href: LEGAL_ROUTES.deliveryReturns },
    ],
    reopenConsent: 'Abrir la pantalla de consentimiento',
    version: 'Revisión',
    cookieTitle: 'Usamos cookies',
    cookieText: 'Para que el sitio funcione y para analítica. Al continuar, acepta la',
    cookiePolicyWord: 'política',
    cookieAccept: 'Aceptar todas',
    cookieNecessary: 'Solo las necesarias',
    cookieSettings: 'Personalizar',
    cookieDismissed: '¡Gracias! Se ha guardado su preferencia de cookies.',
    consentTitle: 'Consentimiento para el tratamiento de datos',
    consentLead:
      'Para gestionar el alquiler, el contrato y el seguro necesitamos tratar sus datos personales y documentos.',
    consentPersonal: 'Consiento el tratamiento de mis datos personales conforme a la',
    consentPersonalLink: 'política de privacidad',
    consentOffer: 'Acepto las condiciones del',
    consentOfferLink: 'contrato de venta a distancia',
    consentMarketing: 'Quiero recibir ofertas especiales (opcional)',
    consentSubmit: 'Confirmar y continuar',
    consentRevoke: 'Puede retirar su consentimiento en cualquier momento',
    consentRequiredHint: 'Marque el consentimiento para el tratamiento de datos y las condiciones del contrato para continuar.',
    consentDone: 'Consentimiento aceptado — ¡gracias!',
  },
  de: {
    pageTitle: 'Rechtliche Dokumente',
    pageSub: 'Datenschutzerklärung · Fernabsatzvertrag · Lieferung & Rückgabe · Cookies · Einwilligung',
    kicker: 'DOKUMENTE',
    banner:
      'Die unten aufgeführten regulierten Dokumente sind Entwurfsvorlagen. Ersetzen Sie sie vor dem Start durch echte, anwaltlich geprüfte Rechtstexte.',
    docsTitle: 'Regulierte Dokumente',
    openWord: 'Öffnen',
    docs: [
      { key: 'privacy', title: 'Datenschutzerklärung', tr: 'Gizlilik Politikası (KVKK)', desc: 'Welche Daten wir erheben, Zwecke, KVKK-Rechtsgrundlagen, Speicherung, Übermittlung und Rechte der betroffenen Person.', href: LEGAL_ROUTES.privacy },
      { key: 'distance', title: 'Fernabsatzvertrag', tr: 'Mesafeli Satış Sözleşmesi', desc: 'Parteien, Gegenstand, Preis, Zahlung, Lieferung, Widerrufsrecht, Stornierung und Streitbeilegung.', href: LEGAL_ROUTES.distanceSelling },
      { key: 'returns', title: 'Liefer- und Rückgabebedingungen', tr: 'Teslimat ve İade Koşulları', desc: 'Stornobedingungen, Umgang mit der Kaution, Erstattungsmethode und -frist.', href: LEGAL_ROUTES.deliveryReturns },
    ],
    reopenConsent: 'Einwilligungsdialog öffnen',
    version: 'Fassung',
    cookieTitle: 'Wir verwenden Cookies',
    cookieText: 'Damit die Website funktioniert und für Analysen. Wenn Sie fortfahren, akzeptieren Sie die',
    cookiePolicyWord: 'Richtlinie',
    cookieAccept: 'Alle akzeptieren',
    cookieNecessary: 'Nur notwendige',
    cookieSettings: 'Anpassen',
    cookieDismissed: 'Danke! Ihre Cookie-Auswahl wurde gespeichert.',
    consentTitle: 'Einwilligung in die Datenverarbeitung',
    consentLead:
      'Um die Anmietung, den Vertrag und die Versicherung abzuwickeln, müssen wir Ihre personenbezogenen Daten und Dokumente verarbeiten.',
    consentPersonal: 'Einwilligung in die Verarbeitung personenbezogener Daten gemäß der',
    consentPersonalLink: 'Datenschutzerklärung',
    consentOffer: 'Ich akzeptiere die Bedingungen im',
    consentOfferLink: 'Fernabsatzvertrag',
    consentMarketing: 'Ich möchte Sonderangebote erhalten (optional)',
    consentSubmit: 'Bestätigen und fortfahren',
    consentRevoke: 'Sie können Ihre Einwilligung jederzeit widerrufen',
    consentRequiredHint: 'Bestätigen Sie die Einwilligung in die Datenverarbeitung und die Vertragsbedingungen, um fortzufahren.',
    consentDone: 'Einwilligung erteilt — vielen Dank!',
  },
}

const C = {
  ink: '#0C3B45',
  body: '#3F6670',
  muted: '#5E8A92',
  teal: '#0E7E90',
  coralGrad: 'linear-gradient(180deg,#FF8A5B,#FF6F61)',
  green: '#27B576',
  cardShadow: '0 24px 60px -34px rgba(11,85,96,.5)',
} as const

/* ---- cookie banner ---- */
function CookieBanner({
  t,
  onAccept,
  onReject,
  onSettings,
}: {
  t: LegalCopy
  onAccept: () => void
  onReject: () => void
  onSettings: () => void
}) {
  return (
    <div
      role="dialog"
      aria-label={t.cookieTitle}
      style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 60, display: 'flex', justifyContent: 'center', padding: '0 16px 18px', pointerEvents: 'none' }}
    >
      <div style={{ pointerEvents: 'auto', width: '100%', maxWidth: 560, background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 20px 50px -20px rgba(11,85,96,.5)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#FFF3D6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }} aria-hidden>🍪</div>
          <div style={{ flex: 1 }}>
            <div style={{ font: '700 14px var(--f-display)', color: C.ink }}>{t.cookieTitle}</div>
            <div style={{ marginTop: 5, font: '500 12px/1.55 var(--f-ui)', color: C.muted }}>
              {t.cookieText}{' '}
              <Link href={LEGAL_ROUTES.privacy} style={{ color: C.teal, fontWeight: 700 }}>{t.cookiePolicyWord}</Link>.
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={onAccept} className="av-cta" style={{ flex: '1 1 140px', textAlign: 'center', padding: 11, background: C.coralGrad, color: '#fff', border: 'none', borderRadius: 10, font: '700 12px var(--f-ui)', cursor: 'pointer' }}>{t.cookieAccept}</button>
          <button type="button" onClick={onReject} style={{ padding: '11px 16px', border: '1.5px solid rgba(20,153,174,.3)', color: C.teal, background: 'transparent', borderRadius: 10, font: '700 12px var(--f-ui)', cursor: 'pointer' }}>{t.cookieNecessary}</button>
          <button type="button" onClick={onSettings} style={{ padding: '11px 14px', color: C.muted, background: 'transparent', border: 'none', font: '700 12px var(--f-ui)', cursor: 'pointer' }}>{t.cookieSettings}</button>
        </div>
      </div>
    </div>
  )
}

/* ---- consent modal ---- */
type ConsentKey = 'personal' | 'offer' | 'marketing'

function CheckRow({ checked, onToggle, children }: { checked: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onToggle} role="checkbox" aria-checked={checked} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', width: '100%' }}>
      <span style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', font: '700 11px var(--f-ui)', background: checked ? C.green : 'transparent', border: checked ? 'none' : '1.5px solid rgba(20,153,174,.3)' }} aria-hidden>{checked ? '✓' : ''}</span>
      <span style={{ font: '500 12px/1.5 var(--f-ui)', color: checked ? C.ink : C.muted }}>{children}</span>
    </button>
  )
}

function ConsentModal({ t, onClose }: { t: LegalCopy; onClose: (accepted: boolean) => void }) {
  const [checks, setChecks] = useState<Record<ConsentKey, boolean>>({ personal: false, offer: false, marketing: false })
  const required = checks.personal && checks.offer
  const toggle = (k: ConsentKey) => setChecks((c) => ({ ...c, [k]: !c[k] }))
  const docLink = (label: string, href: string) => (
    <Link href={href} target="_blank" style={{ color: C.teal, fontWeight: 700 }}>{label}</Link>
  )

  return (
    <div role="dialog" aria-modal="true" aria-label={t.consentTitle} onClick={() => onClose(false)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(8,42,51,.46)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 20, padding: 30, boxShadow: '0 24px 60px -28px rgba(11,85,96,.6)' }}>
        <div style={{ font: '800 21px var(--f-display)', color: C.ink }}>{t.consentTitle}</div>
        <div style={{ marginTop: 8, font: '500 13px/1.6 var(--f-ui)', color: C.muted }}>{t.consentLead}</div>
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <CheckRow checked={checks.personal} onToggle={() => toggle('personal')}>
            {t.consentPersonal} {docLink(t.consentPersonalLink, LEGAL_ROUTES.privacy)}
          </CheckRow>
          <CheckRow checked={checks.offer} onToggle={() => toggle('offer')}>
            {t.consentOffer} {docLink(t.consentOfferLink, LEGAL_ROUTES.distanceSelling)}
          </CheckRow>
          <CheckRow checked={checks.marketing} onToggle={() => toggle('marketing')}>
            {t.consentMarketing}
          </CheckRow>
        </div>
        <button type="button" disabled={!required} onClick={() => onClose(true)} className={required ? 'av-cta' : undefined} style={{ marginTop: 22, width: '100%', textAlign: 'center', padding: 14, background: C.coralGrad, color: '#fff', border: 'none', borderRadius: 12, font: '700 14px var(--f-ui)', boxShadow: required ? '0 14px 28px -10px rgba(255,111,97,.7)' : 'none', opacity: required ? 1 : 0.5, cursor: required ? 'pointer' : 'not-allowed' }}>{t.consentSubmit}</button>
        {!required && <div style={{ marginTop: 10, textAlign: 'center', font: '500 11px var(--f-ui)', color: C.muted }}>{t.consentRequiredHint}</div>}
        <div style={{ marginTop: 12, textAlign: 'center', font: '500 11px var(--f-ui)', color: C.muted }}>{t.consentRevoke}</div>
      </div>
    </div>
  )
}

export default function Legal() {
  const t = useDict(dict)
  const [cookieOpen, setCookieOpen] = useState(true)
  const [cookieNote, setCookieNote] = useState<string | null>(null)
  const [consentOpen, setConsentOpen] = useState(false)
  const [consentNote, setConsentNote] = useState<string | null>(null)

  const dismissCookie = () => {
    setCookieOpen(false)
    setCookieNote(t.cookieDismissed)
  }
  const acceptCookies = () => {
    void recordConsentAction(['cookies'])
    dismissCookie()
  }

  return (
    <ClientShell>
      <Container pt={28} pb={110} style={{ maxWidth: 980 }}>
        <Kicker color={C.teal}>{t.kicker}</Kicker>
        <h1 style={{ margin: '10px 0 0', font: '800 clamp(26px,3.4vw,34px) var(--f-display)', color: C.ink, letterSpacing: '-0.01em' }}>
          AVENTA — {t.pageTitle}
        </h1>
        <div style={{ marginTop: 8, font: '500 14px var(--f-ui)', color: C.muted }}>{t.pageSub}</div>

        {/* placeholder banner */}
        <div role="alert" style={{ marginTop: 20, display: 'flex', alignItems: 'flex-start', gap: 12, padding: '15px 18px', borderRadius: 14, background: 'linear-gradient(180deg,#FFF4E0,#FFEACB)', border: '1.5px solid #F0B45E' }}>
          <span aria-hidden style={{ fontSize: 18 }}>⚠️</span>
          <div style={{ font: '600 12.5px/1.6 var(--f-ui)', color: '#9A5A22' }}>{t.banner}</div>
        </div>

        {/* document cards */}
        <div style={{ marginTop: 26, font: '700 11px var(--f-mono)', letterSpacing: '.14em', color: C.muted }}>{t.docsTitle.toUpperCase()}</div>
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
          {t.docs.map((d) => (
            <Link key={d.key} href={d.href} style={{ textDecoration: 'none', display: 'block', background: '#fff', borderRadius: 18, padding: 22, boxShadow: C.cardShadow, border: '1px solid rgba(20,153,174,.1)' }}>
              <div style={{ font: '800 16px var(--f-display)', color: C.ink }}>{d.title}</div>
              <div style={{ marginTop: 3, font: '600 11.5px var(--f-ui)', color: C.muted }}>{d.tr}</div>
              <div style={{ marginTop: 10, font: '500 12.5px/1.6 var(--f-ui)', color: C.body }}>{d.desc}</div>
              <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, font: '700 12px var(--f-ui)', color: C.teal }}>
                {t.openWord} <span aria-hidden>→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* consent screen + version */}
        <div style={{ marginTop: 30, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => { setConsentNote(null); setConsentOpen(true) }} className="av-cta" style={{ padding: '13px 22px', background: C.coralGrad, color: '#fff', border: 'none', borderRadius: 12, font: '700 13px var(--f-ui)', boxShadow: '0 14px 28px -12px rgba(255,111,97,.65)', cursor: 'pointer' }}>
            {t.reopenConsent}
          </button>
          <span style={{ font: '600 11px var(--f-mono)', color: C.muted }}>{t.version} {LEGAL_VERSION}</span>
          {consentNote && <span style={{ padding: '9px 12px', borderRadius: 10, background: 'var(--av-success-bg)', color: 'var(--av-success-text)', font: '600 12px var(--f-ui)' }}>{consentNote}</span>}
          {cookieNote && <span style={{ padding: '9px 12px', borderRadius: 10, background: 'var(--av-info-bg)', color: 'var(--av-info)', font: '600 12px var(--f-ui)' }}>{cookieNote}</span>}
        </div>
      </Container>

      {cookieOpen && (
        <CookieBanner t={t} onAccept={acceptCookies} onReject={dismissCookie} onSettings={() => { setConsentNote(null); setConsentOpen(true) }} />
      )}
      {consentOpen && (
        <ConsentModal
          t={t}
          onClose={(accepted) => {
            setConsentOpen(false)
            if (accepted) {
              void recordConsentAction(['personal_data', 'offer', 'cookies'])
              setConsentNote(t.consentDone)
            }
          }}
        />
      )}
    </ClientShell>
  )
}
