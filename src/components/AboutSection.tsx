'use client'

import { useDict, useLang } from '../i18n/lang'

/** Plain, JSON-serializable review row passed from the server page. */
export interface AboutReview {
  id: string
  authorName: string
  rating: number
  text: string
  locale: string
  createdAt: string // ISO
}

type Review = { text: string; initials: string; name: string; meta: string }

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
      ['«Встретили в аэропорту с табличкой, машина чистая и новая. Всё как в договоре, без доплат на стойке. Сервис уровня консьержа.»', 'ИП', 'Иван П.', 'Россия · август 2025'],
      ['«Brought the car to our hotel, perfect support. Extended insurance gave real peace of mind on mountain roads.»', 'LB', 'Lukas B.', 'Germany · July 2025'],
      ['«Долгосрочная аренда на месяц для бизнеса. Авто бизнес-класса, водитель по запросу. Рекомендую.»', 'МА', 'Mehmet A.', 'Türkiye · сентябрь 2025'],
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
      ['“Met us at the airport with a name board, the car was clean and new. Everything exactly as in the contract, no counter upsells. Concierge-level service.”', 'IP', 'Ivan P.', 'Russia · Aug 2025'],
      ['“Brought the car to our hotel, perfect support. Extended insurance gave real peace of mind on mountain roads.”', 'LB', 'Lukas B.', 'Germany · Jul 2025'],
      ['“Long-term monthly rental for business. Business-class car, driver on request. Recommended.”', 'MA', 'Mehmet A.', 'Türkiye · Sep 2025'],
    ] as ReadonlyArray<readonly [string, string, string, string]>,
  },
  tr: {
    kicker: 'HAKKIMIZDA · 2018’DEN BERİ ANTALYA’DA',
    title: 'Türkiye misafirlerinin güvendiği premium kiralama',
    lead:
      'Yolculuğunuza havaalanında karşılamadan anahtarların iadesine kadar eşlik ediyoruz: araç zamanında ve tam sigortalı gelir, tüm kiralama boyunca yanınızdayız. Şeffaf biçimde, kendi dilinizde ve ayrıntılara özenle.',
    guaranteesKicker: 'GARANTİLERİMİZ',
    reviewsKicker: 'MİSAFİR YORUMLARI',
    reqKicker: 'ŞİRKET BİLGİLERİ',
    licence: 'Lisans',
    contactsKicker: 'İLETİŞİM',
    hours: 'Pzt–Paz, 09:00–21:00',
    payKicker: 'ÖDEME VE PARA BİRİMLERİ',
    dataSafe: 'veriler güvende',
    stats: [
      ['8 yıl', 'Antalya’da'],
      ['2.000+', 'mutlu misafir'],
      ['4,9★', 'ortalama puan'],
      ['41%', 'geri dönüyor'],
    ] as ReadonlyArray<readonly [string, string]>,
    guarantees: [
      ['🏷', 'Şeffaf fiyat', 'Gizli ücret yok. Fiyat, depozito ve ekstralar — sözleşmede.'],
      ['🛡', 'Tam sigorta', 'Temel, genişletilmiş ve sıfır muafiyetli — seçim sizin.'],
      ['🕑', '7/24 destek', 'Kiralama boyunca kendi dilinizde ulaşabileceğiniz bir yönetici.'],
      ['✨', 'Kontrollü araçlar', 'Güncel filo; her teslimden önce bakım ve kontrol.'],
    ] as ReadonlyArray<readonly [string, string, string]>,
    reviews: [
      ['“Bizi havaalanında isim tabelasıyla karşıladılar, araç tertemiz ve yeniydi. Her şey tam olarak sözleşmedeki gibiydi, bankoda ekstra satış yok. Konsiyerj seviyesinde hizmet.”', 'IP', 'Ivan P.', 'Rusya · Ağu 2025'],
      ['“Aracı otelimize getirdiler, destek kusursuzdu. Genişletilmiş sigorta, dağ yollarında gerçekten içimizi rahatlattı.”', 'LB', 'Lukas B.', 'Almanya · Tem 2025'],
      ['“İş için uzun dönem aylık kiralama. İş sınıfı araç, talep üzerine şoför. Tavsiye ederim.”', 'MA', 'Mehmet A.', 'Türkiye · Eyl 2025'],
    ] as ReadonlyArray<readonly [string, string, string, string]>,
  },
  es: {
    kicker: 'SOBRE NOSOTROS · ANTALYA DESDE 2018',
    title: 'Alquiler premium en el que confían los huéspedes de Turquía',
    lead:
      'Acompañamos su viaje desde la recepción en el aeropuerto hasta la devolución de las llaves: el coche llega puntual y totalmente asegurado, y seguimos disponibles durante todo el alquiler. De forma transparente, en su idioma y con atención al detalle.',
    guaranteesKicker: 'NUESTRAS GARANTÍAS',
    reviewsKicker: 'OPINIONES DE HUÉSPEDES',
    reqKicker: 'DATOS DE LA EMPRESA',
    licence: 'Licencia',
    contactsKicker: 'CONTACTO',
    hours: 'Lun–Dom, 09:00–21:00',
    payKicker: 'PAGO Y DIVISAS',
    dataSafe: 'datos protegidos',
    stats: [
      ['8 años', 'en Antalya'],
      ['2.000+', 'huéspedes felices'],
      ['4,9★', 'valoración media'],
      ['41%', 'vuelven a elegirnos'],
    ] as ReadonlyArray<readonly [string, string]>,
    guarantees: [
      ['🏷', 'Precio transparente', 'Sin cargos ocultos. Precio, depósito y extras — en el contrato.'],
      ['🛡', 'Seguro completo', 'Básico, ampliado y sin franquicia — usted elige.'],
      ['🕑', 'Asistencia 24/7', 'Un gestor disponible en su idioma durante todo el alquiler.'],
      ['✨', 'Coches revisados', 'Flota reciente; mantenimiento e inspección antes de cada entrega.'],
    ] as ReadonlyArray<readonly [string, string, string]>,
    reviews: [
      ['«Nos recibieron en el aeropuerto con un cartel con nuestro nombre, el coche estaba limpio y nuevo. Todo exactamente como en el contrato, sin ventas adicionales en el mostrador. Un servicio a la altura de un conserje.»', 'IP', 'Ivan P.', 'Rusia · ago 2025'],
      ['«Trajeron el coche a nuestro hotel, una atención perfecta. El seguro ampliado nos dio verdadera tranquilidad en las carreteras de montaña.»', 'LB', 'Lukas B.', 'Alemania · jul 2025'],
      ['«Alquiler mensual de larga duración para empresa. Coche de clase business, chófer a petición. Recomendado.»', 'MA', 'Mehmet A.', 'Turquía · sept 2025'],
    ] as ReadonlyArray<readonly [string, string, string, string]>,
  },
  de: {
    kicker: 'ÜBER UNS · ANTALYA SEIT 2018',
    title: 'Premium-Vermietung, der die Gäste der Türkei vertrauen',
    lead:
      'Wir begleiten Ihre Reise von der Abholung am Flughafen bis zur Rückgabe der Schlüssel: Das Auto kommt pünktlich und voll versichert, und wir sind während der gesamten Mietzeit für Sie erreichbar. Transparent, in Ihrer Sprache und mit Liebe zum Detail.',
    guaranteesKicker: 'UNSERE GARANTIEN',
    reviewsKicker: 'GÄSTEBEWERTUNGEN',
    reqKicker: 'UNTERNEHMENSDATEN',
    licence: 'Lizenz',
    contactsKicker: 'KONTAKT',
    hours: 'Mo–So, 09:00–21:00',
    payKicker: 'ZAHLUNG & WÄHRUNGEN',
    dataSafe: 'Daten geschützt',
    stats: [
      ['8 Jahre', 'in Antalya'],
      ['2.000+', 'zufriedene Gäste'],
      ['4,9★', 'mittlere Bewertung'],
      ['41%', 'kommen wieder'],
    ] as ReadonlyArray<readonly [string, string]>,
    guarantees: [
      ['🏷', 'Transparenter Preis', 'Keine versteckten Kosten. Preis, Kaution und Extras — alles im Vertrag.'],
      ['🛡', 'Vollversicherung', 'Basis, erweitert und ohne Selbstbeteiligung — Ihre Wahl.'],
      ['🕑', '24/7-Support', 'Ein Ansprechpartner, der Ihnen während der gesamten Mietzeit in Ihrer Sprache zur Seite steht.'],
      ['✨', 'Geprüfte Fahrzeuge', 'Aktuelle Flotte, Wartung und Inspektion vor jeder Übergabe.'],
    ] as ReadonlyArray<readonly [string, string, string]>,
    reviews: [
      ['„Sie haben uns am Flughafen mit einem Namensschild empfangen, das Auto war sauber und neu. Alles genau wie im Vertrag, keine Zusatzverkäufe am Schalter. Service auf Concierge-Niveau.“', 'IP', 'Ivan P.', 'Russland · Aug 2025'],
      ['„Sie haben das Auto zu unserem Hotel gebracht, perfekte Betreuung. Die erweiterte Versicherung sorgte auf den Bergstraßen für echte Sorgenfreiheit.“', 'LB', 'Lukas B.', 'Deutschland · Jul 2025'],
      ['„Langfristige Monatsmiete für Unternehmen. Wagen der Business-Klasse, Fahrer auf Anfrage. Sehr zu empfehlen.“', 'MA', 'Mehmet A.', 'Türkei · Sep 2025'],
    ] as ReadonlyArray<readonly [string, string, string, string]>,
  },
}

const guaranteeTints = ['#E0F6F2', '#FFEEDD', '#E3F2FB', '#FFF3D6'] as const
const cardSurface = { background: '#fff', borderRadius: 20, boxShadow: '0 16px 38px -26px rgba(11,85,96,.4)' } as const
const panelLabel = { font: '700 11px var(--f-mono)', letterSpacing: '.14em', color: '#BFF0F5' } as const
const payChip = { padding: '6px 11px', background: 'rgba(255,255,255,.18)', borderRadius: 8, font: '700 11px var(--f-mono)', color: '#fff' } as const
const subKicker = { font: '700 12px var(--f-mono)', letterSpacing: '.16em', color: 'var(--av-coral)' } as const
const payMethods = ['VISA', 'MC', 'IBAN', 'USDT', 'USDC'] as const

export default function AboutSection({ reviews: dbReviews = [] }: { reviews?: AboutReview[] }) {
  const t = useDict(dict)
  const { lang } = useLang()

  const stats = t.stats.map((s) => ({ v: s[0], l: s[1] }))
  const guarantees = t.guarantees.map((g, i) => ({ emoji: g[0], title: g[1], desc: g[2], tint: guaranteeTints[i % guaranteeTints.length] }))

  const dateFmt = new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', year: 'numeric' })
  const staticReviews: Review[] = t.reviews.map((r) => ({ text: r[0], initials: r[1], name: r[2], meta: r[3] }))
  const reviews: Review[] =
    dbReviews.length > 0
      ? dbReviews.map((r) => ({ text: r.text, initials: initialsOf(r.authorName), name: r.authorName, meta: dateFmt.format(new Date(r.createdAt)) }))
      : staticReviews

  return (
    <section id="about" style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: 'clamp(48px,6vw,80px) var(--pad-x) 0' }}>
      {/* Heading */}
      <div style={subKicker}>{t.kicker}</div>
      <h2 style={{ margin: '8px 0 0', font: '800 clamp(26px,3.6vw,38px) var(--f-display)', letterSpacing: '-.02em', color: 'var(--av-text)', maxWidth: 680 }}>{t.title}</h2>
      <p style={{ margin: '12px 0 0', font: '500 15px/1.65 var(--f-ui)', color: 'var(--av-muted)', maxWidth: 620 }}>{t.lead}</p>

      {/* Stats */}
      <div style={{ marginTop: 26, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16 }}>
        {stats.map((s) => (
          <div key={s.l} style={{ ...cardSurface, padding: '24px 22px', textAlign: 'center' }}>
            <div style={{ font: '800 36px var(--f-display)', color: '#FF6F61' }}>{s.v}</div>
            <div style={{ marginTop: 6, font: '500 12px var(--f-ui)', color: 'var(--av-muted)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Guarantees */}
      <div style={{ ...subKicker, marginTop: 44 }}>{t.guaranteesKicker}</div>
      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 18 }}>
        {guarantees.map((g) => (
          <div key={g.title} style={{ ...cardSurface, padding: 24 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: g.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{g.emoji}</div>
            <div style={{ marginTop: 15, font: '700 18px var(--f-display)', color: 'var(--av-text)' }}>{g.title}</div>
            <div style={{ marginTop: 7, font: '500 13px/1.55 var(--f-ui)', color: 'var(--av-muted)' }}>{g.desc}</div>
          </div>
        ))}
      </div>

      {/* Reviews */}
      <div style={{ ...subKicker, marginTop: 44 }}>{t.reviewsKicker}</div>
      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 18 }}>
        {reviews.map((r) => (
          <div key={r.name + r.meta} style={{ ...cardSurface, padding: 24 }}>
            <div style={{ color: '#FFC24D', fontSize: 15, letterSpacing: 2 }}>★★★★★</div>
            <div style={{ marginTop: 13, font: '500 14px/1.65 var(--f-ui)', color: 'var(--av-text)' }}>{r.text}</div>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#7FD6E3,#1399AE)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 13px var(--f-ui)', color: '#fff' }}>{r.initials}</div>
              <div>
                <div style={{ font: '700 13px var(--f-ui)', color: 'var(--av-text)' }}>{r.name}</div>
                <div style={{ font: '500 11px var(--f-ui)', color: 'var(--av-muted)' }}>{r.meta}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Company details / contacts / payment — teal panel */}
      <div style={{ marginTop: 44, borderRadius: 22, padding: 'clamp(26px,4vw,38px)', background: 'linear-gradient(135deg,#127C90,#1AA1B0 60%,#28BBC4)', position: 'relative', overflow: 'hidden', boxShadow: '0 26px 54px -28px rgba(11,85,96,.6)' }}>
        <div aria-hidden="true" style={{ position: 'absolute', top: -26, right: -16, width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle,#FFD56B,#FFC24D)', opacity: 0.85 }} />
        <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 24 }}>
          <div>
            <div style={panelLabel}>{t.reqKicker}</div>
            <div style={{ marginTop: 12, font: '500 13px/1.9 var(--f-ui)', color: '#fff' }}>
              AVENTA Rental LLC<br />Antalya, Konyaaltı, Türkiye<br />VKN: 1234567890<br />{t.licence} TÜRSAB: 12345
            </div>
          </div>
          <div>
            <div style={panelLabel}>{t.contactsKicker}</div>
            <div style={{ marginTop: 12, font: '500 13px/1.9 var(--f-ui)', color: '#fff' }}>
              +90 555 000 00 00<br />hello@aventa-rental.com<br />Telegram · WhatsApp<br />{t.hours}
            </div>
          </div>
          <div>
            <div style={panelLabel}>{t.payKicker}</div>
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {payMethods.map((m) => <span key={m} style={payChip}>{m}</span>)}
            </div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, font: '600 12px var(--f-ui)', color: '#BFF0F5' }}>🔒 SSL · {t.dataSafe}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
