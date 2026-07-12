'use client'

import Link from 'next/link'
import ClientNav from '../components/ClientNav'
import ClientFooter from '../components/ClientFooter'
import { useDict, useLang } from '../i18n/lang'

type Stat = { v: string; l: string }
type Guarantee = { emoji: string; title: string; desc: string; tint: string }
type Review = { text: string; initials: string; name: string; meta: string }

/** Plain, JSON-serializable review row passed from the server page. */
export interface AboutReview {
  id: string
  authorName: string
  rating: number
  text: string
  locale: string
  createdAt: string // ISO
}

/** Two-letter initials from a display name (falls back to the first char). */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '—'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const dict = {
  ru: {
    kicker: 'О КОМПАНИИ · АНТАЛИЯ С 2018',
    title: 'Премиум-аренда, которой доверяют гости Турции',
    lead:
      'Мы сопровождаем вашу поездку от встречи в аэропорту до возврата ключей: подаём автомобиль ко времени, страхуем и всегда на связи. Прозрачно, на вашем языке, с заботой о деталях.',
    guaranteesKicker: 'НАШИ ГАРАНТИИ',
    reviewsKicker: 'ОТЗЫВЫ ГОСТЕЙ',
    reqKicker: 'РЕКВИЗИТЫ КОМПАНИИ',
    licence: 'Лицензия',
    contactsKicker: 'КОНТАКТЫ',
    hours: 'Пн–Вс, 09:00–21:00',
    payKicker: 'ОПЛАТА И ВАЛЮТЫ',
    dataSafe: 'данные под защитой',
    footRights: 'Премиум-аренда авто, Анталия',
    privacy: 'Политика конфиденциальности',
    offer: 'Оферта',
    contact: 'Контакты',
    stats: [
      ['8 лет', 'на рынке Антальи'],
      ['2 000+', 'довольных гостей'],
      ['4.9★', 'средняя оценка'],
      ['41%', 'возвращаются снова'],
    ] as ReadonlyArray<readonly [string, string]>,
    guarantees: [
      ['🏷', 'Прозрачная цена', 'Без скрытых платежей. Цена, залог и услуги — в договоре.'],
      ['🛡', 'Полное страхование', 'Базовая, расширенная и полная без франшизы — на ваш выбор.'],
      ['🕑', 'Поддержка 24/7', 'Менеджер на связи на русском весь срок аренды.'],
      ['✨', 'Проверенные авто', 'Свежий парк, ТО и проверка перед каждой подачей.'],
    ] as ReadonlyArray<readonly [string, string, string]>,
    reviews: [
      [
        '«Встретили в аэропорту с табличкой, машина чистая и новая. Всё как в договоре, без доплат на стойке. Сервис уровня консьержа.»',
        'ИП',
        'Иван П.',
        'Россия · август 2025',
      ],
      [
        '«Brought the car to our hotel, perfect support. Extended insurance gave real peace of mind on mountain roads.»',
        'LB',
        'Lukas B.',
        'Germany · July 2025',
      ],
      [
        '«Долгосрочная аренда на месяц для бизнеса. Авто бизнес-класса, водитель по запросу. Рекомендую.»',
        'МА',
        'Mehmet A.',
        'Türkiye · сентябрь 2025',
      ],
    ] as ReadonlyArray<readonly [string, string, string, string]>,
  },
  en: {
    kicker: 'ABOUT · ANTALYA SINCE 2018',
    title: 'Premium rental trusted by guests of Turkey',
    lead:
      'We accompany your trip from meeting you at the airport to the key handback: the car arrives on time, fully insured, and we stay on call throughout. Transparent, in your language, with care for the details.',
    guaranteesKicker: 'OUR GUARANTEES',
    reviewsKicker: 'GUEST REVIEWS',
    reqKicker: 'COMPANY DETAILS',
    licence: 'Licence',
    contactsKicker: 'CONTACTS',
    hours: 'Mon–Sun, 09:00–21:00',
    payKicker: 'PAYMENT & CURRENCIES',
    dataSafe: 'data protected',
    footRights: 'Premium car rental, Antalya',
    privacy: 'Privacy policy',
    offer: 'Offer',
    contact: 'Contact',
    stats: [
      ['8 yrs', 'in Antalya'],
      ['2,000+', 'happy guests'],
      ['4.9★', 'average rating'],
      ['41%', 'come back again'],
    ] as ReadonlyArray<readonly [string, string]>,
    guarantees: [
      ['🏷', 'Transparent price', 'No hidden fees. Price, deposit and extras — in the contract.'],
      ['🛡', 'Full insurance', 'Basic, extended and zero-excess — your choice.'],
      ['🕑', '24/7 support', 'A manager available in your language throughout the rental.'],
      ['✨', 'Checked cars', 'Fresh fleet, service and inspection before each handover.'],
    ] as ReadonlyArray<readonly [string, string, string]>,
    reviews: [
      [
        '“Met us at the airport with a name board, the car was clean and new. Everything exactly as in the contract, no counter upsells. Concierge-level service.”',
        'IP',
        'Ivan P.',
        'Russia · Aug 2025',
      ],
      [
        '“Brought the car to our hotel, perfect support. Extended insurance gave real peace of mind on mountain roads.”',
        'LB',
        'Lukas B.',
        'Germany · Jul 2025',
      ],
      [
        '“Long-term monthly rental for business. Business-class car, driver on request. Recommended.”',
        'MA',
        'Mehmet A.',
        'Türkiye · Sep 2025',
      ],
    ] as ReadonlyArray<readonly [string, string, string, string]>,
  },
  tr: {
    kicker: 'HAKKIMIZDA · 2018’DEN BERİ ANTALYA',
    title: 'Türkiye’ye gelen misafirlerin güvendiği premium araç kiralama',
    lead:
      'Havalimanında sizi karşıladığımız andan anahtarları teslim ettiğiniz ana kadar yolculuğunuza eşlik ediyoruz: araç zamanında ve tam sigortalı geliyor, tüm süreç boyunca yanınızdayız. Şeffaf, kendi dilinizde ve ayrıntılara özenle.',
    guaranteesKicker: 'GARANTİLERİMİZ',
    reviewsKicker: 'MİSAFİR YORUMLARI',
    reqKicker: 'ŞİRKET BİLGİLERİ',
    licence: 'Lisans',
    contactsKicker: 'İLETİŞİM',
    hours: 'Pzt–Paz, 09:00–21:00',
    payKicker: 'ÖDEME VE PARA BİRİMLERİ',
    dataSafe: 'veriler güvende',
    footRights: 'Premium araç kiralama, Antalya',
    privacy: 'Gizlilik politikası',
    offer: 'Sözleşme',
    contact: 'İletişim',
    stats: [
      ['8 yıl', 'Antalya’da'],
      ['2.000+', 'memnun misafir'],
      ['4,9★', 'ortalama puan'],
      ['41%', 'tekrar geliyor'],
    ] as ReadonlyArray<readonly [string, string]>,
    guarantees: [
      ['🏷', 'Şeffaf fiyat', 'Gizli ücret yok. Fiyat, depozito ve ek hizmetler — hepsi sözleşmede.'],
      ['🛡', 'Tam sigorta', 'Temel, genişletilmiş ve muafiyetsiz — seçim sizin.'],
      ['🕑', '7/24 destek', 'Kiralama süresi boyunca kendi dilinizde bir yönetici hizmetinizde.'],
      ['✨', 'Kontrol edilmiş araçlar', 'Yeni araç filosu, her teslimden önce bakım ve kontrol.'],
    ] as ReadonlyArray<readonly [string, string, string]>,
    reviews: [
      [
        '“Havalimanında isim tabelasıyla bizi karşıladılar, araç tertemiz ve yeniydi. Her şey tam sözleşmedeki gibiydi, bankoda sürpriz ek satış yok. Konsiyerj seviyesinde hizmet.”',
        'IP',
        'Ivan P.',
        'Rusya · Ağu 2025',
      ],
      [
        '“Aracı otelimize getirdiler, destek kusursuzdu. Genişletilmiş sigorta, dağ yollarında gerçek bir gönül rahatlığı sağladı.”',
        'LB',
        'Lukas B.',
        'Almanya · Tem 2025',
      ],
      [
        '“İş için uzun dönem aylık kiralama. Business sınıfı araç, talep üzerine şoför. Tavsiye ederim.”',
        'MA',
        'Mehmet A.',
        'Türkiye · Eyl 2025',
      ],
    ] as ReadonlyArray<readonly [string, string, string, string]>,
  },
  es: {
    kicker: 'SOBRE NOSOTROS · ANTALYA DESDE 2018',
    title: 'Alquiler premium en el que confían los huéspedes de Turquía',
    lead:
      'Le acompañamos en su viaje desde que le recibimos en el aeropuerto hasta la devolución de las llaves: el coche llega puntual y con seguro completo, y permanecemos disponibles en todo momento. Con transparencia, en su idioma y con atención al detalle.',
    guaranteesKicker: 'NUESTRAS GARANTÍAS',
    reviewsKicker: 'OPINIONES DE HUÉSPEDES',
    reqKicker: 'DATOS DE LA EMPRESA',
    licence: 'Licencia',
    contactsKicker: 'CONTACTO',
    hours: 'Lun–Dom, 09:00–21:00',
    payKicker: 'PAGO Y MONEDAS',
    dataSafe: 'datos protegidos',
    footRights: 'Alquiler premium de coches, Antalya',
    privacy: 'Política de privacidad',
    offer: 'Contrato',
    contact: 'Contacto',
    stats: [
      ['8 años', 'en Antalya'],
      ['2.000+', 'huéspedes satisfechos'],
      ['4,9★', 'valoración media'],
      ['41%', 'vuelven a reservar'],
    ] as ReadonlyArray<readonly [string, string]>,
    guarantees: [
      ['🏷', 'Precio transparente', 'Sin cargos ocultos. Precio, depósito y extras — todo en el contrato.'],
      ['🛡', 'Seguro completo', 'Básico, ampliado y sin franquicia — usted elige.'],
      ['🕑', 'Soporte 24/7', 'Un gestor disponible en su idioma durante todo el alquiler.'],
      ['✨', 'Coches revisados', 'Flota reciente, mantenimiento e inspección antes de cada entrega.'],
    ] as ReadonlyArray<readonly [string, string, string]>,
    reviews: [
      [
        '“Nos recibieron en el aeropuerto con un cartel con el nombre, el coche estaba limpio y nuevo. Todo tal como en el contrato, sin ventas adicionales en el mostrador. Un servicio de nivel conserjería.”',
        'IP',
        'Ivan P.',
        'Rusia · ago 2025',
      ],
      [
        '“Trajeron el coche a nuestro hotel, un soporte perfecto. El seguro ampliado dio verdadera tranquilidad en las carreteras de montaña.”',
        'LB',
        'Lukas B.',
        'Alemania · jul 2025',
      ],
      [
        '“Alquiler mensual de larga duración para empresa. Coche de clase business, conductor a petición. Recomendado.”',
        'MA',
        'Mehmet A.',
        'Türkiye · sept 2025',
      ],
    ] as ReadonlyArray<readonly [string, string, string, string]>,
  },
  de: {
    kicker: 'ÜBER UNS · ANTALYA SEIT 2018',
    title: 'Premium-Vermietung, der die Gäste der Türkei vertrauen',
    lead:
      'Wir begleiten Ihre Reise von der Begrüßung am Flughafen bis zur Rückgabe der Schlüssel: Das Auto kommt pünktlich und vollständig versichert, und wir sind durchgehend für Sie erreichbar. Transparent, in Ihrer Sprache und mit Liebe zum Detail.',
    guaranteesKicker: 'UNSERE GARANTIEN',
    reviewsKicker: 'GÄSTEBEWERTUNGEN',
    reqKicker: 'UNTERNEHMENSDATEN',
    licence: 'Lizenz',
    contactsKicker: 'KONTAKT',
    hours: 'Mo–So, 09:00–21:00',
    payKicker: 'ZAHLUNG & WÄHRUNGEN',
    dataSafe: 'Daten geschützt',
    footRights: 'Premium-Autovermietung, Antalya',
    privacy: 'Datenschutz',
    offer: 'AGB',
    contact: 'Kontakt',
    stats: [
      ['8 Jahre', 'in Antalya'],
      ['2.000+', 'zufriedene Gäste'],
      ['4,9★', 'Ø Bewertung'],
      ['41%', 'kommen wieder'],
    ] as ReadonlyArray<readonly [string, string]>,
    guarantees: [
      ['🏷', 'Transparenter Preis', 'Keine versteckten Gebühren. Preis, Kaution und Extras — alles im Vertrag.'],
      ['🛡', 'Vollversicherung', 'Basis, erweitert und ohne Selbstbeteiligung — Ihre Wahl.'],
      ['🕑', '24/7-Support', 'Ein Ansprechpartner in Ihrer Sprache während der gesamten Mietzeit.'],
      ['✨', 'Geprüfte Fahrzeuge', 'Junge Flotte, Wartung und Inspektion vor jeder Übergabe.'],
    ] as ReadonlyArray<readonly [string, string, string]>,
    reviews: [
      [
        '“Man empfing uns am Flughafen mit einem Namensschild, das Auto war sauber und neu. Alles genau wie im Vertrag, keine Zusatzverkäufe am Schalter. Service auf Concierge-Niveau.”',
        'IP',
        'Ivan P.',
        'Russland · Aug. 2025',
      ],
      [
        '“Das Auto wurde zu unserem Hotel gebracht, perfekter Support. Die erweiterte Versicherung gab auf Bergstraßen ein wirklich sicheres Gefühl.”',
        'LB',
        'Lukas B.',
        'Deutschland · Juli 2025',
      ],
      [
        '“Langfristige Monatsmiete für Geschäftszwecke. Fahrzeug der Businessklasse, Fahrer auf Anfrage. Sehr zu empfehlen.”',
        'MA',
        'Mehmet A.',
        'Türkiye · Sep. 2025',
      ],
    ] as ReadonlyArray<readonly [string, string, string, string]>,
  },
}

const guaranteeTints = ['#E0F6F2', '#FFEEDD', '#E3F2FB', '#FFF3D6'] as const

const sectionWrap = {
  maxWidth: 'var(--container)',
  margin: '0 auto',
} as const

const cardSurface = {
  background: '#fff',
  borderRadius: 20,
  boxShadow: '0 16px 38px -26px rgba(11,85,96,.4)',
} as const

const panelLabel = {
  font: "700 11px var(--f-mono)",
  letterSpacing: '.14em',
  color: '#BFF0F5',
} as const

const payChip = {
  padding: '6px 11px',
  background: 'rgba(255,255,255,.18)',
  borderRadius: 8,
  font: "700 11px var(--f-mono)",
  color: '#fff',
} as const

const payMethods = ['VISA', 'MC', 'IBAN', 'USDT', 'USDC'] as const

export default function About({ reviews: dbReviews = [] }: { reviews?: AboutReview[] }) {
  const t = useDict(dict)
  const { lang } = useLang()

  const stats: Stat[] = t.stats.map((s) => ({ v: s[0], l: s[1] }))
  const guarantees: Guarantee[] = t.guarantees.map((g, i) => ({
    emoji: g[0],
    title: g[1],
    desc: g[2],
    tint: guaranteeTints[i % guaranteeTints.length],
  }))

  const dateFmt = new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
    month: 'short',
    year: 'numeric',
  })

  // Prefer approved reviews from the database; fall back to the curated
  // static copy when there are none.
  const staticReviews: Review[] = t.reviews.map((r) => ({
    text: r[0],
    initials: r[1],
    name: r[2],
    meta: r[3],
  }))
  const reviews: Review[] =
    dbReviews.length > 0
      ? dbReviews.map((r) => ({
          text: r.text,
          initials: initialsOf(r.authorName),
          name: r.authorName,
          meta: dateFmt.format(new Date(r.createdAt)),
        }))
      : staticReviews

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'var(--av-bg)',
        color: 'var(--av-text)',
      }}
    >
      {/* NAV in sky band — sticky */}
      <div
        className="av-sticky-header"
        style={{
          background: 'linear-gradient(180deg,#CDEFF6,#EAF7F8)',
          borderBottom: '1px solid rgba(20,153,174,.14)',
        }}
      >
        <ClientNav glass={false} />
      </div>

      {/* HERO */}
      <div
        style={{
          ...sectionWrap,
          padding: 'clamp(40px,6vw,64px) var(--pad-x) 30px',
          textAlign: 'center',
        }}
      >
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
          ☀ {t.kicker}
        </div>
        <div
          style={{
            marginTop: 18,
            font: "800 clamp(30px,5vw,50px)/1.08 var(--f-display)",
            letterSpacing: '-.02em',
            color: 'var(--av-text)',
            maxWidth: 720,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {t.title}
        </div>
        <div
          style={{
            marginTop: 16,
            font: "500 16px/1.65 var(--f-ui)",
            color: 'var(--av-muted)',
            maxWidth: 600,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {t.lead}
        </div>
      </div>

      {/* STATS ROW */}
      <div style={{ ...sectionWrap, padding: '0 var(--pad-x)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))',
            gap: 16,
          }}
        >
          {stats.map((s) => (
            <div
              key={s.l}
              style={{ ...cardSurface, padding: '26px 22px', textAlign: 'center' }}
            >
              <div style={{ font: "800 38px var(--f-display)", color: '#FF6F61' }}>{s.v}</div>
              <div style={{ marginTop: 6, font: "500 12px var(--f-ui)", color: 'var(--av-muted)' }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GUARANTEES */}
      <div style={{ ...sectionWrap, padding: 'clamp(40px,5vw,56px) var(--pad-x) 20px' }}>
        <div
          style={{
            font: "700 12px var(--f-mono)",
            letterSpacing: '.16em',
            color: 'var(--av-coral)',
            textAlign: 'center',
          }}
        >
          {t.guaranteesKicker}
        </div>
        <div
          style={{
            marginTop: 22,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
            gap: 18,
          }}
        >
          {guarantees.map((g) => (
            <div key={g.title} style={{ ...cardSurface, padding: 26 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  background: g.tint,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                {g.emoji}
              </div>
              <div
                style={{
                  marginTop: 16,
                  font: "700 18px var(--f-display)",
                  color: 'var(--av-text)',
                }}
              >
                {g.title}
              </div>
              <div
                style={{ marginTop: 7, font: "500 13px/1.55 var(--f-ui)", color: 'var(--av-muted)' }}
              >
                {g.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* REVIEWS */}
      <div style={{ ...sectionWrap, padding: 'clamp(30px,4vw,44px) var(--pad-x) 20px' }}>
        <div
          style={{
            font: "700 12px var(--f-mono)",
            letterSpacing: '.16em',
            color: 'var(--av-coral)',
            textAlign: 'center',
          }}
        >
          {t.reviewsKicker}
        </div>
        <div
          style={{
            marginTop: 22,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
            gap: 18,
          }}
        >
          {reviews.map((r) => (
            <div key={r.name} style={{ ...cardSurface, padding: 26 }}>
              <div style={{ color: '#FFC24D', fontSize: 15, letterSpacing: 2 }}>★★★★★</div>
              <div
                style={{
                  marginTop: 14,
                  font: "500 14px/1.65 var(--f-ui)",
                  color: 'var(--av-text)',
                }}
              >
                {r.text}
              </div>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 11 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#7FD6E3,#1399AE)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    font: "700 13px var(--f-ui)",
                    color: '#fff',
                  }}
                >
                  {r.initials}
                </div>
                <div>
                  <div style={{ font: "700 13px var(--f-ui)", color: 'var(--av-text)' }}>
                    {r.name}
                  </div>
                  <div style={{ font: "500 11px var(--f-ui)", color: 'var(--av-muted)' }}>
                    {r.meta}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COMPANY DETAILS / CONTACTS / PAYMENT — teal panel */}
      <div
        style={{
          ...sectionWrap,
          padding: 'clamp(30px,4vw,44px) var(--pad-x) clamp(40px,5vw,60px)',
        }}
      >
        <div
          style={{
            borderRadius: 22,
            padding: 'clamp(26px,4vw,38px)',
            background: 'linear-gradient(135deg,#127C90,#1AA1B0 60%,#28BBC4)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 26px 54px -28px rgba(11,85,96,.6)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -26,
              right: -16,
              width: 150,
              height: 150,
              borderRadius: '50%',
              background: 'radial-gradient(circle,#FFD56B,#FFC24D)',
              opacity: 0.85,
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
              gap: 24,
            }}
          >
            {/* company details */}
            <div>
              <div style={panelLabel}>{t.reqKicker}</div>
              <div style={{ marginTop: 12, font: "500 13px/1.9 var(--f-ui)", color: '#fff' }}>
                AVENTA Rental LLC
                <br />
                Antalya, Konyaaltı, Türkiye
                <br />
                VKN: 1234567890
                <br />
                {t.licence} TÜRSAB: 12345
              </div>
            </div>

            {/* contacts */}
            <div>
              <div style={panelLabel}>{t.contactsKicker}</div>
              <div style={{ marginTop: 12, font: "500 13px/1.9 var(--f-ui)", color: '#fff' }}>
                +90 555 000 00 00
                <br />
                hello@aventa-rental.com
                <br />
                Telegram · WhatsApp
                <br />
                {t.hours}
              </div>
            </div>

            {/* payment */}
            <div>
              <div style={panelLabel}>{t.payKicker}</div>
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {payMethods.map((m) => (
                  <span key={m} style={payChip}>
                    {m}
                  </span>
                ))}
              </div>
              <div
                style={{
                  marginTop: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  font: "600 12px var(--f-ui)",
                  color: '#BFF0F5',
                }}
              >
                🔒 SSL · {t.dataSafe}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LEGAL FOOTER LINKS */}
      <div style={{ background: '#0C3B45', color: '#CDEAEF' }}>
        <div
          style={{
            ...sectionWrap,
            padding: '26px var(--pad-x)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            font: "500 12px var(--f-ui)",
            color: '#7FB6BF',
          }}
        >
          <span>AVENTA · © 2026 · {t.footRights}</span>
          <div style={{ display: 'flex', gap: 18 }}>
            <Link href="/legal/privacy" style={{ color: '#5FE0C8' }}>
              {t.privacy}
            </Link>
            <Link href="/legal/distance-selling" style={{ color: '#5FE0C8' }}>
              {t.offer}
            </Link>
            <Link href="/contact" style={{ color: '#5FE0C8' }}>
              {t.contact}
            </Link>
          </div>
        </div>
      </div>

      <ClientFooter />
    </div>
  )
}
