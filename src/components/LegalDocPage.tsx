'use client'

import Link from 'next/link'
import ClientShell from './ClientShell'
import { Container, Kicker } from './ui'
import { useDict, useLang, type Lang } from '../i18n/lang'
import { LEGAL_ROUTES, LEGAL_VERSION } from '../lib/legal'

/**
 * Regulated legal documents are NOT machine-translated (liability-sensitive). For any language
 * beyond the two authored ones (ru/en) the English text is shown with this clearly-labelled
 * notice, awaiting a professional translation. ru/en have no entry (they are authored).
 */
const TRANSLATION_PENDING: Partial<Record<Lang, string>> = {
  tr: 'Bu belge henüz Türkçeye profesyonel olarak çevrilmedi. Yasal olarak bağlayıcı metin, aşağıda gösterilen İngilizce sürümüdür.',
  es: 'Este documento aún no ha sido traducido profesionalmente al español. El texto legalmente vinculante es la versión en inglés que se muestra a continuación.',
  de: 'Dieses Dokument wurde noch nicht professionell ins Deutsche übersetzt. Rechtlich verbindlich ist die unten angezeigte englische Fassung.',
}

/* ------------------------------------------------------------------ *
 * Shared renderer for the three REGULATED legal documents
 * (Privacy Policy · Distance Selling Contract · Delivery & Returns).
 *
 * The structure and section headings are the value here; every body is
 * clearly-labelled PLACEHOLDER text. A prominent banner tells the reader
 * (and the operator) that the binding wording must be replaced with
 * lawyer-reviewed text before launch — same pattern as the insurance flags.
 * ------------------------------------------------------------------ */

export interface LegalSection {
  /** Section heading, e.g. "1. Какие данные мы собираем". */
  h: string
  /** Placeholder body — MUST be prefixed with the «[ШАБЛОН …]» marker by the caller. */
  b: string
}

export interface LegalDocContent {
  title: string
  /** Turkish name of the document (shown as a subtitle). */
  turkishTitle: string
  /** What this document is, one line. */
  intro: string
  sections: LegalSection[]
}

const chrome = {
  ru: {
    kicker: 'ЮРИДИЧЕСКИЙ ДОКУМЕНТ',
    bannerTitle: 'Это шаблон — не готовый юридический текст',
    bannerBody:
      'Замените реальным юридическим текстом, проверенным юристом, перед запуском. Разделы и заголовки соответствуют требованиям турецкого законодательства (KVKK, Положение о дистанционных продажах), но формулировки ниже — заглушки.',
    revision: 'Редакция',
    template: 'шаблон',
    otherDocs: 'Другие документы',
    privacy: 'Политика конфиденциальности',
    distance: 'Договор оферты',
    returns: 'Доставка и возврат',
    contactLine: 'Вопросы по документам:',
  },
  en: {
    kicker: 'LEGAL DOCUMENT',
    bannerTitle: 'This is a template — not finished legal text',
    bannerBody:
      'Replace with real, lawyer-reviewed legal text before launch. The sections and headings follow Turkish-law requirements (KVKK, Distance Selling Regulation), but the wording below is placeholder.',
    revision: 'Revision',
    template: 'template',
    otherDocs: 'Other documents',
    privacy: 'Privacy policy',
    distance: 'Distance selling contract',
    returns: 'Delivery & returns',
    contactLine: 'Questions about these documents:',
  },
}

const C = {
  ink: '#0C3B45',
  body: '#3F6670',
  muted: '#5E8A92',
  teal: '#0E7E90',
  headGrad: 'linear-gradient(135deg,#127C90,#1AA1B0)',
  cardShadow: '0 30px 70px -34px rgba(11,85,96,.5)',
} as const

function WarnBanner({ title, body }: { title: string; body: string }) {
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: '18px 20px',
        borderRadius: 16,
        background: 'linear-gradient(180deg,#FFF4E0,#FFEACB)',
        border: '1.5px solid #F0B45E',
        boxShadow: '0 18px 40px -26px rgba(224,122,30,.5)',
      }}
    >
      <div
        aria-hidden
        style={{
          width: 40,
          height: 40,
          borderRadius: 11,
          background: '#F6A63A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 21,
          flexShrink: 0,
        }}
      >
        ⚠️
      </div>
      <div>
        <div style={{ font: '800 15px var(--f-display)', color: '#8A4B12' }}>{title}</div>
        <div style={{ marginTop: 5, font: '600 12.5px/1.6 var(--f-ui)', color: '#9A5A22' }}>{body}</div>
      </div>
    </div>
  )
}

export default function LegalDocPage({
  content,
  activeKey,
}: {
  content: Record<'ru' | 'en', LegalDocContent>
  activeKey: 'privacy' | 'distance-selling' | 'delivery-returns'
}) {
  const t = useDict(chrome)
  const doc = useDict(content)
  const { lang } = useLang()
  const translationPending = TRANSLATION_PENDING[lang]

  const others = [
    { key: 'privacy', label: t.privacy, href: LEGAL_ROUTES.privacy },
    { key: 'distance-selling', label: t.distance, href: LEGAL_ROUTES.distanceSelling },
    { key: 'delivery-returns', label: t.returns, href: LEGAL_ROUTES.deliveryReturns },
  ].filter((x) => x.key !== activeKey)

  return (
    <ClientShell>
      <Container pt={28} pb={110} style={{ maxWidth: 900 }}>
        <Kicker color={C.teal}>{t.kicker}</Kicker>
        <h1
          style={{
            margin: '10px 0 0',
            font: '800 clamp(26px,3.4vw,34px) var(--f-display)',
            color: C.ink,
            letterSpacing: '-0.01em',
          }}
        >
          {doc.title}
        </h1>
        <div style={{ marginTop: 6, font: '600 14px var(--f-ui)', color: C.muted }}>
          {doc.turkishTitle}
        </div>
        <div style={{ marginTop: 10, font: '600 11px var(--f-mono)', color: C.muted }}>
          {t.revision} {LEGAL_VERSION} · {t.template}
        </div>

        <div style={{ marginTop: 22 }}>
          {translationPending && (
            <div
              role="note"
              style={{
                marginBottom: 14,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '14px 18px',
                borderRadius: 14,
                background: 'linear-gradient(180deg,#EAF6FF,#DCEBFB)',
                border: '1.5px solid #8FB8E8',
              }}
            >
              <span aria-hidden style={{ fontSize: 18, flexShrink: 0 }}>🌐</span>
              <div style={{ font: '600 12.5px/1.6 var(--f-ui)', color: '#2A5A8A' }}>{translationPending}</div>
            </div>
          )}
          <WarnBanner title={t.bannerTitle} body={t.bannerBody} />
        </div>

        {/* document body */}
        <div
          style={{
            marginTop: 24,
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: C.cardShadow,
            background: '#fff',
          }}
        >
          <div style={{ padding: '22px 30px', background: C.headGrad }}>
            <div style={{ font: '800 18px var(--f-display)', color: '#fff' }}>{doc.title}</div>
            <div style={{ marginTop: 4, font: '500 12.5px/1.6 var(--f-ui)', color: '#DDF4F7' }}>
              {doc.intro}
            </div>
          </div>
          <div style={{ padding: 'clamp(22px,3vw,34px)' }}>
            {doc.sections.map((s, i) => (
              <section key={s.h} style={{ marginTop: i === 0 ? 0 : 22 }}>
                <h2 style={{ margin: 0, font: '800 15px var(--f-display)', color: C.teal }}>
                  {i + 1}. {s.h}
                </h2>
                <p style={{ margin: '8px 0 0', font: '500 13.5px/1.75 var(--f-ui)', color: C.body }}>
                  {s.b}
                </p>
              </section>
            ))}
          </div>
        </div>

        {/* cross-links to the other regulated docs */}
        <div style={{ marginTop: 26, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ font: '700 11px var(--f-mono)', letterSpacing: '.12em', color: C.muted }}>
            {t.otherDocs.toUpperCase()}
          </span>
          {others.map((o) => (
            <Link
              key={o.key}
              href={o.href}
              style={{
                padding: '9px 15px',
                borderRadius: 999,
                border: '1px solid rgba(20,153,174,.28)',
                color: C.teal,
                background: '#fff',
                font: '700 12px var(--f-ui)',
                textDecoration: 'none',
              }}
            >
              {o.label}
            </Link>
          ))}
        </div>
      </Container>
    </ClientShell>
  )
}
