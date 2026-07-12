'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { TripGoal } from '@prisma/client'
import ClientNav from '../components/ClientNav'
import ClientFooter from '../components/ClientFooter'
import { useDict } from '../i18n/lang'
import type { ServiceView } from '../lib/queries'
import { saveSmartResponseAction } from '../server/misc-actions'

/* ---------------------------------------------------------------- data types */

type Goal = {
  goal: TripGoal
  emoji: string
  title: string
  desc: string
}

type Need = {
  key: string
  label: string
}

type Reco = {
  name: string
  desc: string
  price: string
  cta: string
}

interface Strings {
  toBooking: string
  kicker: string
  q1: string
  q1sub: string
  selected: string
  q2: string
  q2sub: string
  recoKicker: string
  recoTitle: string
  heroReco: string
  heroRecoSub: string
  getConsult: string
  pickObjects: string
  savedNote: string
  continue: string
  saving: string
  free: string
  addCta: string
  goals: Goal[]
  needs: Need[]
  recos: Reco[]
}

/* The design seeds these as "selected by default"; the goal defaults to buying
 * property and all needs but VIP meet & yachts are pre-checked. Keys are the
 * language-independent identifiers persisted to the CRM. */
const DEFAULT_GOAL: TripGoal = 'PROPERTY_PURCHASE'
const DEFAULT_NEED_KEYS = [
  'car_rental',
  'airport_transfer',
  'buy_property',
  'property_viewings',
  'interpreter',
  'investment_consult',
]

/* -------------------------------------------------------------------- i18n */

const dict: { ru: Strings; en: Strings; tr: Strings; es: Strings; de: Strings } = {
  ru: {
    toBooking: 'К бронированию',
    kicker: 'ПЕРСОНАЛЬНЫЙ ПОДБОР',
    q1: 'Какова цель вашей поездки в Турцию?',
    q1sub: 'Подберём релевантные услуги и сделаем поездку удобнее.',
    selected: 'Выбрано',
    q2: 'Чем мы можем быть полезны?',
    q2sub: 'Выберите всё, что интересно — менеджер учтёт это заранее.',
    recoKicker: 'ПЕРСОНАЛЬНЫЕ РЕКОМЕНДАЦИИ',
    recoTitle: 'Подобрали под вашу поездку',
    heroReco: 'Поможем с покупкой недвижимости под ключ',
    heroRecoSub:
      'Организуем просмотр объектов, встречу с агентом и сопровождение переводчика на всех этапах сделки.',
    getConsult: 'Получить консультацию',
    pickObjects: 'Подобрать объекты',
    savedNote: 'Цель и услуги сохранены — менеджер увидит их в вашей карточке (CRM).',
    continue: 'Продолжить бронирование',
    saving: 'Сохраняем…',
    free: 'Бесплатно',
    addCta: 'Добавить +',
    goals: [
      { goal: 'LEISURE', emoji: '🏖', title: 'Отдых', desc: 'Море, экскурсии, яхты' },
      { goal: 'BUSINESS', emoji: '💼', title: 'Бизнес', desc: 'Авто бизнес-класса, водитель' },
      { goal: 'PROPERTY_PURCHASE', emoji: '🏠', title: 'Покупка недвижимости', desc: 'Просмотры, агент, сделка' },
      { goal: 'PROPERTY_VIEWING', emoji: '🔑', title: 'Просмотр недвижимости', desc: 'Тур по объектам' },
      { goal: 'MEDICAL', emoji: '⚕', title: 'Медицинский туризм', desc: 'Трансфер, ожидание, переводчик' },
      { goal: 'RELOCATION', emoji: '📦', title: 'Переезд', desc: 'Жильё, документы, вещи' },
    ],
    needs: [
      { key: 'car_rental', label: 'Только аренда авто' },
      { key: 'airport_transfer', label: 'Трансфер из аэропорта' },
      { key: 'vip_meet', label: 'VIP-встреча' },
      { key: 'buy_property', label: 'Покупка недвижимости' },
      { key: 'property_viewings', label: 'Просмотр объектов' },
      { key: 'interpreter', label: 'Переводчик' },
      { key: 'investment_consult', label: 'Консультация по инвестициям' },
      { key: 'tours_yachts', label: 'Экскурсии и яхты' },
    ],
    recos: [
      { name: 'Просмотр объектов', desc: 'Тур по 5–7 объектам с агентом за день', price: 'от €80', cta: 'Добавить +' },
      { name: 'Встреча с агентом', desc: 'Русскоязычный эксперт по региону', price: 'Бесплатно', cta: 'Записаться' },
      { name: 'Переводчик на сделке', desc: 'На просмотрах и у нотариуса', price: '€60 / день', cta: 'Добавить +' },
      { name: 'Долгосрочная аренда', desc: '−20% на аренду от 14 дней', price: '€96 / сут', cta: 'Выбрать' },
      { name: 'Трансфер из аэропорта', desc: 'Встретим с табличкой', price: '€35', cta: 'Добавить +' },
      { name: 'Помощь с документами', desc: 'ВНЖ, налоговый номер, счёт', price: 'по запросу', cta: 'Узнать' },
    ],
  },
  en: {
    toBooking: 'To booking',
    kicker: 'PERSONAL MATCH',
    q1: 'What is the purpose of your trip to Turkey?',
    q1sub: 'We will suggest relevant services to make your trip easier.',
    selected: 'Selected',
    q2: 'How can we help you?',
    q2sub: 'Pick anything of interest — your manager will prepare in advance.',
    recoKicker: 'PERSONAL RECOMMENDATIONS',
    recoTitle: 'Tailored to your trip',
    heroReco: 'Full support buying property in Turkey',
    heroRecoSub:
      'We arrange property viewings, a meeting with an agent and an interpreter at every step of the deal.',
    getConsult: 'Get a consultation',
    pickObjects: 'Find properties',
    savedNote: 'Goal and services saved — your manager sees them in your CRM card.',
    continue: 'Continue booking',
    saving: 'Saving…',
    free: 'Free',
    addCta: 'Add +',
    goals: [
      { goal: 'LEISURE', emoji: '🏖', title: 'Leisure', desc: 'Sea, tours, yachts' },
      { goal: 'BUSINESS', emoji: '💼', title: 'Business', desc: 'Business-class car, driver' },
      { goal: 'PROPERTY_PURCHASE', emoji: '🏠', title: 'Buying property', desc: 'Viewings, agent, deal' },
      { goal: 'PROPERTY_VIEWING', emoji: '🔑', title: 'Property viewing', desc: 'Tour of objects' },
      { goal: 'MEDICAL', emoji: '⚕', title: 'Medical tourism', desc: 'Transfer, waiting, interpreter' },
      { goal: 'RELOCATION', emoji: '📦', title: 'Relocation', desc: 'Housing, documents, goods' },
    ],
    needs: [
      { key: 'car_rental', label: 'Car rental only' },
      { key: 'airport_transfer', label: 'Airport transfer' },
      { key: 'vip_meet', label: 'VIP meet & greet' },
      { key: 'buy_property', label: 'Buying property' },
      { key: 'property_viewings', label: 'Property viewings' },
      { key: 'interpreter', label: 'Interpreter' },
      { key: 'investment_consult', label: 'Investment consultation' },
      { key: 'tours_yachts', label: 'Tours & yachts' },
    ],
    recos: [
      { name: 'Property viewings', desc: 'Tour of 5–7 objects with an agent in a day', price: 'from €80', cta: 'Add +' },
      { name: 'Meet the agent', desc: 'Region expert in your language', price: 'Free', cta: 'Book' },
      { name: 'Interpreter at the deal', desc: 'At viewings and the notary', price: '€60 / day', cta: 'Add +' },
      { name: 'Long-term rental', desc: '−20% on rentals from 14 days', price: '€96 / day', cta: 'Choose' },
      { name: 'Airport transfer', desc: 'Meet you with a sign', price: '€35', cta: 'Add +' },
      { name: 'Document help', desc: 'Residence permit, tax number, account', price: 'on request', cta: 'Learn more' },
    ],
  },
  tr: {
    toBooking: 'Rezervasyona git',
    kicker: 'KİŞİSEL EŞLEŞTİRME',
    q1: 'Türkiye seyahatinizin amacı nedir?',
    q1sub: 'Seyahatinizi kolaylaştırmak için size uygun hizmetler önereceğiz.',
    selected: 'Seçildi',
    q2: 'Size nasıl yardımcı olabiliriz?',
    q2sub: 'İlginizi çeken her şeyi seçin — yöneticiniz her şeyi önceden hazırlasın.',
    recoKicker: 'KİŞİSEL ÖNERİLER',
    recoTitle: 'Seyahatinize özel',
    heroReco: 'Türkiye’de gayrimenkul alımında tam destek',
    heroRecoSub:
      'Gayrimenkul görüntülemeleri, emlak danışmanıyla görüşme ve işlemin her aşamasında tercüman hizmetini organize ediyoruz.',
    getConsult: 'Danışmanlık alın',
    pickObjects: 'Gayrimenkul bulun',
    savedNote: 'Amaç ve hizmetler kaydedildi — yöneticiniz bunları CRM kartınızda görür.',
    continue: 'Rezervasyona devam et',
    saving: 'Kaydediliyor…',
    free: 'Ücretsiz',
    addCta: 'Ekle +',
    goals: [
      { goal: 'LEISURE', emoji: '🏖', title: 'Tatil', desc: 'Deniz, turlar, yatlar' },
      { goal: 'BUSINESS', emoji: '💼', title: 'İş', desc: 'Business sınıfı araç, şoför' },
      { goal: 'PROPERTY_PURCHASE', emoji: '🏠', title: 'Gayrimenkul alımı', desc: 'Görüntülemeler, danışman, işlem' },
      { goal: 'PROPERTY_VIEWING', emoji: '🔑', title: 'Gayrimenkul görüntüleme', desc: 'Mülk turu' },
      { goal: 'MEDICAL', emoji: '⚕', title: 'Sağlık turizmi', desc: 'Transfer, bekleme, tercüman' },
      { goal: 'RELOCATION', emoji: '📦', title: 'Taşınma', desc: 'Konut, belgeler, eşyalar' },
    ],
    needs: [
      { key: 'car_rental', label: 'Sadece araç kiralama' },
      { key: 'airport_transfer', label: 'Havalimanı transferi' },
      { key: 'vip_meet', label: 'VIP karşılama' },
      { key: 'buy_property', label: 'Gayrimenkul alımı' },
      { key: 'property_viewings', label: 'Gayrimenkul görüntülemeleri' },
      { key: 'interpreter', label: 'Tercüman' },
      { key: 'investment_consult', label: 'Yatırım danışmanlığı' },
      { key: 'tours_yachts', label: 'Turlar ve yatlar' },
    ],
    recos: [
      { name: 'Gayrimenkul görüntülemeleri', desc: 'Bir günde danışmanla 5–7 mülkün turu', price: '€80’den', cta: 'Ekle +' },
      { name: 'Danışmanla tanışın', desc: 'Kendi dilinizde bölge uzmanı', price: 'Ücretsiz', cta: 'Randevu al' },
      { name: 'İşlemde tercüman', desc: 'Görüntülemelerde ve noterde', price: '€60 / gün', cta: 'Ekle +' },
      { name: 'Uzun dönem kiralama', desc: '14 günden itibaren kiralamalarda −20%', price: '€96 / gün', cta: 'Seç' },
      { name: 'Havalimanı transferi', desc: 'Sizi tabela ile karşılarız', price: '€35', cta: 'Ekle +' },
      { name: 'Belge yardımı', desc: 'Oturma izni, vergi numarası, hesap', price: 'talep üzerine', cta: 'Bilgi al' },
    ],
  },
  es: {
    toBooking: 'A la reserva',
    kicker: 'SELECCIÓN PERSONAL',
    q1: '¿Cuál es el propósito de su viaje a Turquía?',
    q1sub: 'Le sugeriremos servicios relevantes para facilitar su viaje.',
    selected: 'Seleccionado',
    q2: '¿En qué podemos ayudarle?',
    q2sub: 'Elija todo lo que le interese — su gestor lo preparará con antelación.',
    recoKicker: 'RECOMENDACIONES PERSONALES',
    recoTitle: 'A la medida de su viaje',
    heroReco: 'Apoyo integral para comprar propiedad en Turquía',
    heroRecoSub:
      'Organizamos visitas a propiedades, una reunión con un agente y un intérprete en cada paso de la operación.',
    getConsult: 'Solicitar asesoría',
    pickObjects: 'Buscar propiedades',
    savedNote: 'Objetivo y servicios guardados — su gestor los ve en su ficha de CRM.',
    continue: 'Continuar con la reserva',
    saving: 'Guardando…',
    free: 'Gratis',
    addCta: 'Añadir +',
    goals: [
      { goal: 'LEISURE', emoji: '🏖', title: 'Ocio', desc: 'Mar, excursiones, yates' },
      { goal: 'BUSINESS', emoji: '💼', title: 'Negocios', desc: 'Coche de clase business, chófer' },
      { goal: 'PROPERTY_PURCHASE', emoji: '🏠', title: 'Compra de propiedad', desc: 'Visitas, agente, operación' },
      { goal: 'PROPERTY_VIEWING', emoji: '🔑', title: 'Visita de propiedad', desc: 'Recorrido por propiedades' },
      { goal: 'MEDICAL', emoji: '⚕', title: 'Turismo médico', desc: 'Traslado, espera, intérprete' },
      { goal: 'RELOCATION', emoji: '📦', title: 'Mudanza', desc: 'Vivienda, documentos, enseres' },
    ],
    needs: [
      { key: 'car_rental', label: 'Solo alquiler de coche' },
      { key: 'airport_transfer', label: 'Traslado de aeropuerto' },
      { key: 'vip_meet', label: 'Recepción VIP' },
      { key: 'buy_property', label: 'Compra de propiedad' },
      { key: 'property_viewings', label: 'Visitas a propiedades' },
      { key: 'interpreter', label: 'Intérprete' },
      { key: 'investment_consult', label: 'Asesoría de inversión' },
      { key: 'tours_yachts', label: 'Excursiones y yates' },
    ],
    recos: [
      { name: 'Visitas a propiedades', desc: 'Recorrido por 5–7 propiedades con un agente en un día', price: 'desde €80', cta: 'Añadir +' },
      { name: 'Conozca al agente', desc: 'Experto en la región en su idioma', price: 'Gratis', cta: 'Reservar' },
      { name: 'Intérprete en la operación', desc: 'En las visitas y ante el notario', price: '€60 / día', cta: 'Añadir +' },
      { name: 'Alquiler de larga duración', desc: '−20% en alquileres desde 14 días', price: '€96 / día', cta: 'Elegir' },
      { name: 'Traslado de aeropuerto', desc: 'Le recibimos con un cartel', price: '€35', cta: 'Añadir +' },
      { name: 'Ayuda con documentos', desc: 'Permiso de residencia, número fiscal, cuenta', price: 'Bajo petición', cta: 'Saber más' },
    ],
  },
  de: {
    toBooking: 'Zur Buchung',
    kicker: 'PERSÖNLICHE AUSWAHL',
    q1: 'Was ist der Zweck Ihrer Reise in die Türkei?',
    q1sub: 'Wir schlagen Ihnen passende Services vor, um Ihre Reise zu erleichtern.',
    selected: 'Ausgewählt',
    q2: 'Wie können wir Ihnen helfen?',
    q2sub: 'Wählen Sie alles, was Sie interessiert — Ihr Betreuer bereitet alles im Voraus vor.',
    recoKicker: 'PERSÖNLICHE EMPFEHLUNGEN',
    recoTitle: 'Auf Ihre Reise zugeschnitten',
    heroReco: 'Volle Unterstützung beim Immobilienkauf in der Türkei',
    heroRecoSub:
      'Wir organisieren Immobilienbesichtigungen, ein Treffen mit einem Makler und einen Dolmetscher in jeder Phase des Kaufs.',
    getConsult: 'Beratung anfragen',
    pickObjects: 'Immobilien finden',
    savedNote: 'Ziel und Services gespeichert — Ihr Betreuer sieht sie in Ihrer CRM-Karte.',
    continue: 'Buchung fortsetzen',
    saving: 'Wird gespeichert…',
    free: 'Kostenlos',
    addCta: 'Hinzufügen +',
    goals: [
      { goal: 'LEISURE', emoji: '🏖', title: 'Urlaub', desc: 'Meer, Touren, Yachten' },
      { goal: 'BUSINESS', emoji: '💼', title: 'Geschäftlich', desc: 'Business-Class-Wagen, Fahrer' },
      { goal: 'PROPERTY_PURCHASE', emoji: '🏠', title: 'Immobilienkauf', desc: 'Besichtigungen, Makler, Abschluss' },
      { goal: 'PROPERTY_VIEWING', emoji: '🔑', title: 'Immobilienbesichtigung', desc: 'Rundgang durch Objekte' },
      { goal: 'MEDICAL', emoji: '⚕', title: 'Medizintourismus', desc: 'Transfer, Wartezeit, Dolmetscher' },
      { goal: 'RELOCATION', emoji: '📦', title: 'Umzug', desc: 'Wohnung, Dokumente, Umzugsgut' },
    ],
    needs: [
      { key: 'car_rental', label: 'Nur Autovermietung' },
      { key: 'airport_transfer', label: 'Flughafentransfer' },
      { key: 'vip_meet', label: 'VIP-Empfang' },
      { key: 'buy_property', label: 'Immobilienkauf' },
      { key: 'property_viewings', label: 'Immobilienbesichtigungen' },
      { key: 'interpreter', label: 'Dolmetscher' },
      { key: 'investment_consult', label: 'Investitionsberatung' },
      { key: 'tours_yachts', label: 'Touren & Yachten' },
    ],
    recos: [
      { name: 'Immobilienbesichtigungen', desc: 'Rundgang durch 5–7 Objekte mit einem Makler an einem Tag', price: 'ab €80', cta: 'Hinzufügen +' },
      { name: 'Makler kennenlernen', desc: 'Regionsexperte in Ihrer Sprache', price: 'Kostenlos', cta: 'Buchen' },
      { name: 'Dolmetscher beim Abschluss', desc: 'Bei Besichtigungen und beim Notar', price: '€60 / Tag', cta: 'Hinzufügen +' },
      { name: 'Langzeitmiete', desc: '−20% bei Anmietung ab 14 Tagen', price: '€96 / Tag', cta: 'Wählen' },
      { name: 'Flughafentransfer', desc: 'Wir empfangen Sie mit einem Schild', price: '€35', cta: 'Hinzufügen +' },
      { name: 'Hilfe mit Dokumenten', desc: 'Aufenthaltstitel, Steuernummer, Konto', price: 'auf Anfrage', cta: 'Mehr erfahren' },
    ],
  },
}

/* ---------------------------------------------------------------- price fmt */

/** Format a real service price into the design's compact "€NN / unit" style. */
function formatServicePrice(s: ServiceView, t: Strings): string {
  if (s.price <= 0) return t.free
  const amount = Number.isInteger(s.price) ? String(s.price) : s.price.toFixed(2)
  const unit = s.unit && s.unit.toLowerCase() !== 'fixed' ? ` / ${s.unit}` : ''
  return `€${amount}${unit}`
}

/* ------------------------------------------------------------------- styles */

const goalSelBox = {
  background: '#fff',
  border: '2px solid #FF7A5C',
  borderRadius: 18,
  padding: 22,
  boxShadow: '0 18px 40px -24px rgba(255,111,97,.5)',
  cursor: 'pointer',
  textAlign: 'left',
} as const

const goalBox = {
  background: '#fff',
  border: '2px solid transparent',
  borderRadius: 18,
  padding: 22,
  boxShadow: '0 14px 34px -24px rgba(11,85,96,.35)',
  cursor: 'pointer',
  textAlign: 'left',
} as const

const iconWrap = {
  width: 44,
  height: 44,
  borderRadius: 13,
  background: '#E0F6F2',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 22,
} as const

const iconSel = {
  width: 44,
  height: 44,
  borderRadius: 13,
  background: '#FFEEDD',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 22,
} as const

const ckBox = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: '#E9FBF2',
  border: '1.5px solid #27B576',
  borderRadius: 12,
  padding: '13px 14px',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
} as const

const idBox = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: '#F2FAFB',
  border: '1px solid rgba(20,153,174,.18)',
  borderRadius: 12,
  padding: '13px 14px',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
} as const

const ck = {
  width: 18,
  height: 18,
  borderRadius: 5,
  background: '#27B576',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  font: "700 10px var(--f-ui)",
  flexShrink: 0,
} as const

const unck = {
  width: 18,
  height: 18,
  borderRadius: 5,
  border: '1.5px solid rgba(20,153,174,.3)',
  flexShrink: 0,
} as const

/* ---------------------------------------------------------------- component */

export default function Services({ services }: { services: ServiceView[] }) {
  const t = useDict(dict)
  const router = useRouter()

  const [goal, setGoal] = useState<TripGoal>(DEFAULT_GOAL)
  const [needs, setNeeds] = useState<Set<string>>(() => new Set(DEFAULT_NEED_KEYS))
  const [saving, setSaving] = useState(false)

  const toggleNeed = (key: string) =>
    setNeeds((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  /* Real recommendations: active services whose forGoals include the chosen
   * goal. Fall back to the curated static cards when none match so the section
   * is never empty. */
  const matchedServices = useMemo(
    () => services.filter((s) => s.forGoals.includes(goal)),
    [services, goal],
  )

  const recoCards: Reco[] =
    matchedServices.length > 0
      ? matchedServices.map((s) => ({
          name: s.name,
          desc: s.desc ?? '',
          price: formatServicePrice(s, t),
          cta: t.addCta,
        }))
      : t.recos

  const onContinue = async () => {
    if (saving) return
    setSaving(true)
    try {
      await saveSmartResponseAction(goal, Array.from(needs))
      router.push('/booking')
    } catch {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'var(--av-bg)',
        color: 'var(--av-text)',
      }}
    >
      {/* sky band: client nav (with RU/EN toggle + CTA) — sticky */}
      <div
        className="av-sticky-header"
        style={{
          background: 'linear-gradient(180deg,#CDEFF6,#EAF7F8)',
          borderBottom: '1px solid rgba(20,153,174,.14)',
        }}
      >
        <ClientNav glass={false} />
      </div>

      <div
        style={{
          maxWidth: 'var(--container)',
          margin: '0 auto',
          padding: 'clamp(28px,4vw,44px) var(--pad-x) clamp(40px,5vw,64px)',
        }}
      >
        {/* heading */}
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 15px',
              background: '#fff',
              borderRadius: 999,
              font: "700 11px var(--f-mono)",
              letterSpacing: '.12em',
              color: 'var(--av-teal)',
              boxShadow: '0 6px 16px -8px rgba(11,85,96,.4)',
            }}
          >
            ✦ {t.kicker}
          </div>
          <div
            style={{
              marginTop: 16,
              font: '800 clamp(28px,4.4vw,42px)/1.08 var(--f-display)',
              letterSpacing: '-.02em',
              color: 'var(--av-text)',
            }}
          >
            {t.q1}
          </div>
          <div style={{ marginTop: 12, font: '500 15px var(--f-ui)', color: 'var(--av-muted)' }}>
            {t.q1sub}
          </div>
        </div>

        {/* STEP 1 — trip-goal grid (single-select) */}
        <div
          style={{
            marginTop: 30,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))',
            gap: 14,
          }}
        >
          {t.goals.map((g) => {
            const active = goal === g.goal
            return (
              <button
                key={g.goal}
                type="button"
                onClick={() => setGoal(g.goal)}
                aria-pressed={active}
                className="av-lift"
                style={active ? goalSelBox : goalBox}
              >
                <div style={active ? iconSel : iconWrap}>{g.emoji}</div>
                <div style={{ marginTop: 12, font: '700 16px var(--f-display)', color: 'var(--av-text)' }}>
                  {g.title}
                </div>
                <div style={{ marginTop: 6, font: '500 12px/1.5 var(--f-ui)', color: 'var(--av-muted)' }}>
                  {g.desc}
                </div>
                {active && (
                  <div
                    style={{
                      marginTop: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      font: '700 11px var(--f-ui)',
                      color: '#FF6F61',
                    }}
                  >
                    ✓ {t.selected}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* STEP 2 — needs checklist (multi-select) */}
        <div
          style={{
            marginTop: 36,
            background: '#fff',
            borderRadius: 22,
            padding: 'clamp(22px,3vw,32px)',
            boxShadow: '0 18px 44px -26px rgba(11,85,96,.4)',
          }}
        >
          <div style={{ font: '800 22px var(--f-display)', letterSpacing: '-.02em', color: 'var(--av-text)' }}>
            {t.q2}
          </div>
          <div style={{ marginTop: 6, font: '500 13px var(--f-ui)', color: 'var(--av-muted)' }}>
            {t.q2sub}
          </div>
          <div
            style={{
              marginTop: 18,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
              gap: 10,
            }}
          >
            {t.needs.map((n) => {
              const checked = needs.has(n.key)
              return (
                <button
                  key={n.key}
                  type="button"
                  onClick={() => toggleNeed(n.key)}
                  aria-pressed={checked}
                  style={checked ? ckBox : idBox}
                >
                  <span style={checked ? ck : unck}>{checked ? '✓' : ''}</span>
                  <span style={{ font: '600 13px var(--f-ui)', color: 'var(--av-text)' }}>{n.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* STEP 3 — personalized recommendations */}
        <div style={{ marginTop: 36 }}>
          <div style={{ font: "700 12px var(--f-mono)", letterSpacing: '.16em', color: 'var(--av-coral)' }}>
            {t.recoKicker}
          </div>
          <div
            style={{
              marginTop: 8,
              font: '800 clamp(22px,3vw,30px) var(--f-display)',
              letterSpacing: '-.02em',
              color: 'var(--av-text)',
            }}
          >
            {t.recoTitle}
          </div>

          {/* teal hero recommendation */}
          <div
            style={{
              marginTop: 18,
              borderRadius: 22,
              padding: 'clamp(24px,3vw,32px)',
              background: 'linear-gradient(135deg,#127C90,#1AA1B0 60%,#28BBC4)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 26px 54px -28px rgba(11,85,96,.6)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -24,
                right: -16,
                width: 140,
                height: 140,
                borderRadius: '50%',
                background: 'radial-gradient(circle,#FFD56B,#FFC24D)',
                opacity: 0.85,
              }}
            />
            <div style={{ position: 'relative', zIndex: 2, maxWidth: 680 }}>
              <div style={{ font: '800 24px var(--f-display)', color: '#fff' }}>{t.heroReco}</div>
              <div style={{ marginTop: 10, font: '500 14px/1.6 var(--f-ui)', color: 'rgba(255,255,255,.9)' }}>
                {t.heroRecoSub}
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span
                  className="av-cta"
                  style={{
                    padding: '12px 22px',
                    background: '#fff',
                    color: 'var(--av-teal)',
                    borderRadius: 11,
                    font: '700 13px var(--f-ui)',
                    cursor: 'pointer',
                  }}
                >
                  {t.getConsult}
                </span>
                <span
                  className="av-cta"
                  style={{
                    padding: '12px 22px',
                    background: 'rgba(255,255,255,.18)',
                    border: '1px solid rgba(255,255,255,.4)',
                    color: '#fff',
                    borderRadius: 11,
                    font: '700 13px var(--f-ui)',
                    cursor: 'pointer',
                  }}
                >
                  {t.pickObjects}
                </span>
              </div>
            </div>
          </div>

          {/* service cards grid (price + CTA) — real services for the chosen goal */}
          <div
            style={{
              marginTop: 16,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))',
              gap: 14,
            }}
          >
            {recoCards.map((r, i) => (
              <div
                key={`${r.name}-${i}`}
                className="av-lift"
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: 20,
                  boxShadow: '0 14px 34px -24px rgba(11,85,96,.4)',
                }}
              >
                <div style={{ font: '700 15px var(--f-display)', color: 'var(--av-text)' }}>{r.name}</div>
                <div style={{ marginTop: 7, font: '500 12px/1.5 var(--f-ui)', color: 'var(--av-muted)' }}>
                  {r.desc}
                </div>
                <div
                  style={{
                    marginTop: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ font: '800 15px var(--f-display)', color: 'var(--av-text)' }}>{r.price}</span>
                  <span style={{ font: '700 12px var(--f-ui)', color: '#FF6F61', cursor: 'pointer' }}>{r.cta}</span>
                </div>
              </div>
            ))}
          </div>

          {/* saved-to-CRM note + continue booking */}
          <div
            style={{
              marginTop: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              background: '#E9FBF2',
              border: '1px solid rgba(39,181,118,.3)',
              borderRadius: 16,
              padding: '18px 22px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: '#27B576',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  font: '700 14px var(--f-ui)',
                }}
              >
                ✓
              </span>
              <span style={{ font: '500 13px var(--f-ui)', color: 'var(--av-body)' }}>{t.savedNote}</span>
            </div>
            <button
              type="button"
              onClick={onContinue}
              disabled={saving}
              className="av-cta"
              style={{
                border: 'none',
                padding: '13px 26px',
                background: 'var(--grad-coral)',
                color: '#fff',
                borderRadius: 12,
                font: '700 13px var(--f-ui)',
                boxShadow: '0 12px 26px -10px rgba(255,111,97,.7)',
                cursor: saving ? 'progress' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? t.saving : t.continue}
            </button>
          </div>

          {/* keep a crawlable link to the booking flow */}
          <div style={{ marginTop: 10, textAlign: 'right' }}>
            <Link
              href="/booking"
              style={{ font: '600 12px var(--f-ui)', color: 'var(--av-muted)', textDecoration: 'none' }}
            >
              {t.toBooking} →
            </Link>
          </div>
        </div>
      </div>

      <ClientFooter />
    </div>
  )
}
