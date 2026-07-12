'use client'

import Link from 'next/link'
import { LogoMark } from '../components/Logo'
import { useDict, type Dict } from '../i18n/lang'

interface CardText {
  title: string
  desc: string
}

type CardKey =
  | 'home'
  | 'catalog'
  | 'booking'
  | 'services'
  | 'account'
  | 'mobile'
  | 'admin'
  | 'crm'
  | 'calendar'
  | 'notifications'
  | 'adminMobile'
  | 'brand'
  | 'auth'
  | 'success'
  | 'states'
  | 'about'
  | 'legal'

interface Strings {
  openCard: string
  proto: (n: number) => string
  heroTitle: string
  heroDesc: string
  groupClient: string
  groupAdmin: string
  groupSystem: string
  footer: string
  cards: Record<CardKey, CardText>
}

const dict: Dict<Strings> = {
  ru: {
    openCard: 'Открыть →',
    proto: (n: number) => `ПРОТОТИП · ${n} ЭКРАНОВ`,
    heroTitle: 'Премиум-аренда авто в Турции — карта экранов прототипа',
    heroDesc:
      'Кликабельный прототип: клиентская часть в новом «морском» стиле, админ-панель, CRM владельца и уведомления. Откройте любой экран.',
    groupClient: 'КЛИЕНТСКАЯ ЧАСТЬ',
    groupAdmin: 'АДМИН · ВЛАДЕЛЕЦ',
    groupSystem: 'СИСТЕМА · СОСТОЯНИЯ · ЮРИДИКА',
    footer:
      'AVENTA · «морской» стиль · клиентские экраны двуязычные (RU/EN), внутренние — рабочая светлая версия. Статичные хай-фай макеты — основа для разработки.',
    cards: {
      home: {
        title: 'Главная страница',
        desc: 'Анимированный пляж, поиск, парк, экосистема · RU/EN',
      },
      catalog: {
        title: 'Каталог + карточка авто',
        desc: 'Фильтры, характеристики, условия, фото, календарь',
      },
      booking: {
        title: 'Бронирование · 5 шагов',
        desc: 'Маршрут+карта, услуги, данные, оплата (крипто)',
      },
      services: {
        title: 'Умный подбор услуг',
        desc: 'Цель поездки → потребности → рекомендации',
      },
      account: {
        title: 'Личный кабинет',
        desc: 'Документы, адреса, история, «Забронировать снова»',
      },
      mobile: {
        title: 'Мобильные версии',
        desc: 'Главная, каталог, карточка, бронь, кабинет',
      },
      admin: {
        title: 'Админ-панель',
        desc: 'Заявки, карточка, авто, клиенты, финансы, услуги',
      },
      crm: {
        title: 'CRM-дашборд владельца',
        desc: 'Доход, загрузка парка, прибыль, интересы клиентов',
      },
      calendar: {
        title: 'Календарь занятости',
        desc: 'Таймлайн всего автопарка с бронями и статусами',
      },
      notifications: {
        title: 'Шаблоны уведомлений',
        desc: 'Email, Telegram, WhatsApp · клиенту и админу',
      },
      adminMobile: {
        title: 'Мобильная админка',
        desc: 'Заявки, авто и финансы владельца со смартфона',
      },
      brand: {
        title: 'Brand Kit · дизайн-система',
        desc: 'Логотип, палитра, типографика, иконки',
      },
      auth: {
        title: 'Вход · регистрация · OTP',
        desc: 'Аутентификация, восстановление пароля',
      },
      success: {
        title: 'Успех брони · договор PDF',
        desc: 'Подтверждение + автоматический договор',
      },
      states: {
        title: 'Состояния · пустые · ошибки',
        desc: 'Загрузка документов, нет авто, сбой оплаты',
      },
      about: {
        title: 'О компании · доверие',
        desc: 'Статистика, гарантии, отзывы, реквизиты',
      },
      legal: {
        title: 'Юридика · cookie · согласие',
        desc: 'Политика, оферта, баннер, экран согласия',
      },
    },
  },
  en: {
    openCard: 'Open →',
    proto: (n: number) => `PROTOTYPE · ${n} SCREENS`,
    heroTitle: 'Premium car rental in Turkey — a prototype screen map',
    heroDesc:
      'Clickable prototype: the customer side in the new "marine" style, admin panel, owner CRM and notifications. Open any screen.',
    groupClient: 'CUSTOMER SIDE',
    groupAdmin: 'ADMIN · OWNER',
    groupSystem: 'SYSTEM · STATES · LEGAL',
    footer:
      'AVENTA · "marine" style · customer screens are bilingual (RU/EN), internal ones use a working light version. Static hi-fi mockups — a foundation for development.',
    cards: {
      home: {
        title: 'Home page',
        desc: 'Animated beach, search, fleet, ecosystem · RU/EN',
      },
      catalog: {
        title: 'Catalog + car card',
        desc: 'Filters, specs, terms, photos, calendar',
      },
      booking: {
        title: 'Booking · 5 steps',
        desc: 'Route+map, services, details, payment (crypto)',
      },
      services: {
        title: 'Smart service picker',
        desc: 'Trip goal → needs → recommendations',
      },
      account: {
        title: 'Personal account',
        desc: 'Documents, addresses, history, "Book again"',
      },
      mobile: {
        title: 'Mobile versions',
        desc: 'Home, catalog, car card, booking, account',
      },
      admin: {
        title: 'Admin panel',
        desc: 'Requests, card, cars, customers, finance, services',
      },
      crm: {
        title: 'Owner CRM dashboard',
        desc: 'Revenue, fleet utilization, profit, customer interests',
      },
      calendar: {
        title: 'Availability calendar',
        desc: 'Timeline of the whole fleet with bookings and statuses',
      },
      notifications: {
        title: 'Notification templates',
        desc: 'Email, Telegram, WhatsApp · to customer and admin',
      },
      adminMobile: {
        title: 'Mobile admin',
        desc: 'Requests, cars and owner finances from a smartphone',
      },
      brand: {
        title: 'Brand Kit · design system',
        desc: 'Logo, palette, typography, icons',
      },
      auth: {
        title: 'Login · sign-up · OTP',
        desc: 'Authentication, password recovery',
      },
      success: {
        title: 'Booking success · contract PDF',
        desc: 'Confirmation + automatic contract',
      },
      states: {
        title: 'States · empty · errors',
        desc: 'Document upload, no cars, payment failure',
      },
      about: {
        title: 'About · trust',
        desc: 'Statistics, guarantees, reviews, company details',
      },
      legal: {
        title: 'Legal · cookie · consent',
        desc: 'Policy, offer, banner, consent screen',
      },
    },
  },
  tr: {
    openCard: 'Aç →',
    proto: (n: number) => `PROTOTİP · ${n} EKRAN`,
    heroTitle: "Türkiye'de premium araç kiralama — prototip ekran haritası",
    heroDesc:
      `Tıklanabilir prototip: yeni "denizci" tarzında müşteri tarafı, yönetim paneli, sahip CRM'i ve bildirimler. Herhangi bir ekranı açın.`,
    groupClient: 'MÜŞTERİ TARAFI',
    groupAdmin: 'YÖNETİM · SAHİP',
    groupSystem: 'SİSTEM · DURUMLAR · HUKUK',
    footer:
      'AVENTA · "denizci" tarzı · müşteri ekranları iki dilli (RU/EN), dahili ekranlar çalışan bir açık sürüm kullanır. Statik hi-fi maketler — geliştirme için bir temel.',
    cards: {
      home: {
        title: 'Ana sayfa',
        desc: 'Animasyonlu plaj, arama, filo, ekosistem · RU/EN',
      },
      catalog: {
        title: 'Katalog + araç kartı',
        desc: 'Filtreler, özellikler, koşullar, fotoğraflar, takvim',
      },
      booking: {
        title: 'Rezervasyon · 5 adım',
        desc: 'Rota+harita, hizmetler, bilgiler, ödeme (kripto)',
      },
      services: {
        title: 'Akıllı hizmet seçici',
        desc: 'Seyahat amacı → ihtiyaçlar → öneriler',
      },
      account: {
        title: 'Kişisel hesap',
        desc: 'Belgeler, adresler, geçmiş, "Tekrar rezervasyon"',
      },
      mobile: {
        title: 'Mobil sürümler',
        desc: 'Ana sayfa, katalog, araç kartı, rezervasyon, hesap',
      },
      admin: {
        title: 'Yönetim paneli',
        desc: 'Talepler, kart, araçlar, müşteriler, finans, hizmetler',
      },
      crm: {
        title: 'Sahip CRM panosu',
        desc: 'Gelir, filo doluluğu, kâr, müşteri ilgi alanları',
      },
      calendar: {
        title: 'Doluluk takvimi',
        desc: 'Rezervasyon ve durumlarla tüm filonun zaman çizelgesi',
      },
      notifications: {
        title: 'Bildirim şablonları',
        desc: 'E-posta, Telegram, WhatsApp · müşteriye ve yöneticiye',
      },
      adminMobile: {
        title: 'Mobil yönetim',
        desc: 'Talepler, araçlar ve sahip finansları akıllı telefondan',
      },
      brand: {
        title: 'Brand Kit · tasarım sistemi',
        desc: 'Logo, palet, tipografi, ikonlar',
      },
      auth: {
        title: 'Giriş · kayıt · OTP',
        desc: 'Kimlik doğrulama, parola kurtarma',
      },
      success: {
        title: 'Rezervasyon başarılı · sözleşme PDF',
        desc: 'Onay + otomatik sözleşme',
      },
      states: {
        title: 'Durumlar · boş · hatalar',
        desc: 'Belge yükleme, araç yok, ödeme hatası',
      },
      about: {
        title: 'Hakkında · güven',
        desc: 'İstatistikler, garantiler, yorumlar, şirket bilgileri',
      },
      legal: {
        title: 'Hukuk · çerez · onay',
        desc: 'Politika, sözleşme, banner, onay ekranı',
      },
    },
  },
  es: {
    openCard: 'Abrir →',
    proto: (n: number) => `PROTOTIPO · ${n} PANTALLAS`,
    heroTitle: 'Alquiler de coches premium en Turquía — mapa de pantallas del prototipo',
    heroDesc:
      'Prototipo interactivo: la parte del cliente con el nuevo estilo "marino", panel de administración, CRM del propietario y notificaciones. Abra cualquier pantalla.',
    groupClient: 'PARTE DEL CLIENTE',
    groupAdmin: 'ADMIN · PROPIETARIO',
    groupSystem: 'SISTEMA · ESTADOS · LEGAL',
    footer:
      'AVENTA · estilo "marino" · las pantallas del cliente son bilingües (RU/EN), las internas usan una versión clara de trabajo. Maquetas hi-fi estáticas — una base para el desarrollo.',
    cards: {
      home: {
        title: 'Página de inicio',
        desc: 'Playa animada, búsqueda, flota, ecosistema · RU/EN',
      },
      catalog: {
        title: 'Catálogo + ficha del coche',
        desc: 'Filtros, características, condiciones, fotos, calendario',
      },
      booking: {
        title: 'Reserva · 5 pasos',
        desc: 'Ruta+mapa, servicios, datos, pago (cripto)',
      },
      services: {
        title: 'Selector inteligente de servicios',
        desc: 'Objetivo del viaje → necesidades → recomendaciones',
      },
      account: {
        title: 'Cuenta personal',
        desc: 'Documentos, direcciones, historial, "Reservar de nuevo"',
      },
      mobile: {
        title: 'Versiones móviles',
        desc: 'Inicio, catálogo, ficha, reserva, cuenta',
      },
      admin: {
        title: 'Panel de administración',
        desc: 'Solicitudes, ficha, coches, clientes, finanzas, servicios',
      },
      crm: {
        title: 'Panel CRM del propietario',
        desc: 'Ingresos, ocupación de la flota, beneficio, intereses de clientes',
      },
      calendar: {
        title: 'Calendario de ocupación',
        desc: 'Cronología de toda la flota con reservas y estados',
      },
      notifications: {
        title: 'Plantillas de notificaciones',
        desc: 'Email, Telegram, WhatsApp · al cliente y al admin',
      },
      adminMobile: {
        title: 'Admin móvil',
        desc: 'Solicitudes, coches y finanzas del propietario desde el smartphone',
      },
      brand: {
        title: 'Brand Kit · sistema de diseño',
        desc: 'Logotipo, paleta, tipografía, iconos',
      },
      auth: {
        title: 'Acceso · registro · OTP',
        desc: 'Autenticación, recuperación de contraseña',
      },
      success: {
        title: 'Reserva exitosa · contrato PDF',
        desc: 'Confirmación + contrato automático',
      },
      states: {
        title: 'Estados · vacíos · errores',
        desc: 'Carga de documentos, sin coches, fallo de pago',
      },
      about: {
        title: 'Acerca de · confianza',
        desc: 'Estadísticas, garantías, reseñas, datos de la empresa',
      },
      legal: {
        title: 'Legal · cookie · consentimiento',
        desc: 'Política, oferta, banner, pantalla de consentimiento',
      },
    },
  },
  de: {
    openCard: 'Öffnen →',
    proto: (n: number) => `PROTOTYP · ${n} SCREENS`,
    heroTitle: 'Premium-Autovermietung in der Türkei — Prototyp-Screenübersicht',
    heroDesc:
      'Klickbarer Prototyp: der Kundenbereich im neuen „maritimen" Stil, Admin-Panel, Eigentümer-CRM und Benachrichtigungen. Öffnen Sie einen beliebigen Screen.',
    groupClient: 'KUNDENBEREICH',
    groupAdmin: 'ADMIN · EIGENTÜMER',
    groupSystem: 'SYSTEM · ZUSTÄNDE · RECHT',
    footer:
      'AVENTA · „maritimer" Stil · Kundenscreens sind zweisprachig (RU/EN), interne nutzen eine helle Arbeitsversion. Statische Hi-Fi-Mockups — eine Grundlage für die Entwicklung.',
    cards: {
      home: {
        title: 'Startseite',
        desc: 'Animierter Strand, Suche, Flotte, Ökosystem · RU/EN',
      },
      catalog: {
        title: 'Katalog + Fahrzeugkarte',
        desc: 'Filter, Merkmale, Bedingungen, Fotos, Kalender',
      },
      booking: {
        title: 'Buchung · 5 Schritte',
        desc: 'Route+Karte, Services, Daten, Zahlung (Krypto)',
      },
      services: {
        title: 'Intelligente Serviceauswahl',
        desc: 'Reiseziel → Bedürfnisse → Empfehlungen',
      },
      account: {
        title: 'Persönliches Konto',
        desc: 'Dokumente, Adressen, Verlauf, „Erneut buchen"',
      },
      mobile: {
        title: 'Mobile Versionen',
        desc: 'Startseite, Katalog, Fahrzeugkarte, Buchung, Konto',
      },
      admin: {
        title: 'Admin-Panel',
        desc: 'Anfragen, Karte, Fahrzeuge, Kunden, Finanzen, Services',
      },
      crm: {
        title: 'Eigentümer-CRM-Dashboard',
        desc: 'Umsatz, Flottenauslastung, Gewinn, Kundeninteressen',
      },
      calendar: {
        title: 'Belegungskalender',
        desc: 'Zeitleiste der gesamten Flotte mit Buchungen und Status',
      },
      notifications: {
        title: 'Benachrichtigungsvorlagen',
        desc: 'E-Mail, Telegram, WhatsApp · an Kunde und Admin',
      },
      adminMobile: {
        title: 'Mobile Admin',
        desc: 'Anfragen, Fahrzeuge und Eigentümerfinanzen vom Smartphone',
      },
      brand: {
        title: 'Brand Kit · Designsystem',
        desc: 'Logo, Palette, Typografie, Icons',
      },
      auth: {
        title: 'Login · Registrierung · OTP',
        desc: 'Authentifizierung, Passwort-Wiederherstellung',
      },
      success: {
        title: 'Buchung erfolgreich · Vertrag PDF',
        desc: 'Bestätigung + automatischer Vertrag',
      },
      states: {
        title: 'Zustände · leer · Fehler',
        desc: 'Dokument-Upload, keine Fahrzeuge, Zahlungsfehler',
      },
      about: {
        title: 'Über uns · Vertrauen',
        desc: 'Statistiken, Garantien, Bewertungen, Firmendaten',
      },
      legal: {
        title: 'Recht · Cookie · Einwilligung',
        desc: 'Richtlinie, Angebot, Banner, Einwilligungsscreen',
      },
    },
  },
}

interface ScreenCard {
  key: CardKey
  to: string
  tag: string
  grad: string
}

const teal = 'linear-gradient(135deg,#1AA1B0,#28BBC4)'
const coral = 'linear-gradient(135deg,#FF8A5B,#FF6F61)'
const sun = 'linear-gradient(135deg,#FFD56B,#FFB23E)'
const deep = 'linear-gradient(135deg,#0E7E90,#127C90)'

const client: ScreenCard[] = [
  { key: 'home', to: '/', tag: '01', grad: teal },
  { key: 'catalog', to: '/catalog', tag: '02', grad: teal },
  { key: 'booking', to: '/booking', tag: '03', grad: teal },
  { key: 'services', to: '/services', tag: '04', grad: teal },
  { key: 'account', to: '/account', tag: '08', grad: coral },
  { key: 'mobile', to: '/mobile', tag: '09', grad: coral },
]

const admin: ScreenCard[] = [
  { key: 'admin', to: '/admin', tag: '06', grad: deep },
  { key: 'crm', to: '/crm', tag: '07', grad: deep },
  { key: 'calendar', to: '/calendar', tag: '05', grad: deep },
  { key: 'notifications', to: '/notifications', tag: '10', grad: deep },
  { key: 'adminMobile', to: '/admin/mobile', tag: '16', grad: deep },
]

const system: ScreenCard[] = [
  { key: 'brand', to: '/brand', tag: '✦', grad: sun },
  { key: 'auth', to: '/auth', tag: '11', grad: sun },
  { key: 'success', to: '/success', tag: '12', grad: sun },
  { key: 'states', to: '/states', tag: '13', grad: sun },
  { key: 'about', to: '/about', tag: '14', grad: sun },
  { key: 'legal', to: '/legal', tag: '15', grad: sun },
]

const screenCount = client.length + admin.length + system.length

function GroupHeader({ label, mt }: { label: string; mt?: number }) {
  return (
    <div
      style={{
        gridColumn: '1/-1',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginTop: mt ?? 0,
      }}
    >
      <div
        style={{
          font: '700 12px var(--f-mono)',
          letterSpacing: '0.18em',
          color: '#FF7A5C',
        }}
      >
        {label}
      </div>
      <div style={{ flex: 1, height: 1, background: 'rgba(20,153,174,.2)' }} />
    </div>
  )
}

function ScreenTile({ s }: { s: ScreenCard }) {
  const t = useDict(dict)
  const card = t.cards[s.key]
  return (
    <Link
      href={s.to}
      className="av-lift"
      style={{
        display: 'block',
        background: '#fff',
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 16px 38px -26px rgba(11,85,96,.4)',
      }}
    >
      <div
        style={{
          height: 112,
          background: s.grad,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            font: `800 ${s.tag.length > 2 ? 34 : 38}px var(--f-display)`,
            color: 'rgba(255,255,255,.9)',
          }}
        >
          {s.tag}
        </div>
      </div>
      <div style={{ padding: '18px 20px' }}>
        <div style={{ font: '700 17px var(--f-display)', color: '#0C3B45' }}>{card.title}</div>
        <div
          style={{
            marginTop: 6,
            font: '500 13px/1.5 var(--f-ui)',
            color: '#5E8A92',
          }}
        >
          {card.desc}
        </div>
        <div style={{ marginTop: 12, font: '700 12px var(--f-ui)', color: '#0E7E90' }}>
          {t.openCard}
        </div>
      </div>
    </Link>
  )
}

export default function IndexHub() {
  const t = useDict(dict)
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: '#EAF7F8',
        color: '#0C3B45',
        fontFamily: 'var(--f-ui)',
      }}
    >
      {/* Sky band + sun */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg,#CDEFF6,#A7E2EC 70%,#EAF7F8)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 50,
            right: '8%',
            width: 90,
            height: 90,
            borderRadius: '50%',
            background: 'radial-gradient(circle,#FFE49B,#FFD56B 55%,#FFC24D)',
            boxShadow: '0 0 60px 20px rgba(255,213,107,.5)',
            animation: 'av-sun 8s ease-in-out infinite',
          }}
        />
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: '42px clamp(20px,4vw,40px) 48px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <LogoMark size={42} variant="light" />
              <div
                style={{
                  font: '800 26px var(--f-display)',
                  letterSpacing: '0.04em',
                  color: '#0C3B45',
                }}
              >
                AVENTA
              </div>
            </div>
            <div style={{ font: '700 12px var(--f-mono)', color: '#0E7E90' }}>
              {t.proto(screenCount)}
            </div>
          </div>
          <div
            style={{
              marginTop: 28,
              font: '800 clamp(30px,4.6vw,46px)/1.08 var(--f-display)',
              letterSpacing: '-0.02em',
              color: '#0C3B45',
              maxWidth: 740,
            }}
          >
            {t.heroTitle}
          </div>
          <div
            style={{
              marginTop: 14,
              font: '500 15px/1.6 var(--f-ui)',
              color: '#0B5560',
              maxWidth: 600,
            }}
          >
            {t.heroDesc}
          </div>
        </div>
      </div>

      {/* Card grid */}
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: 'clamp(28px,3vw,40px) clamp(20px,4vw,40px) 64px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))',
            gap: 18,
          }}
        >
          <GroupHeader label={t.groupClient} />
          {client.map((s) => (
            <ScreenTile key={s.to} s={s} />
          ))}

          <GroupHeader label={t.groupAdmin} mt={12} />
          {admin.map((s) => (
            <ScreenTile key={s.to} s={s} />
          ))}

          <GroupHeader label={t.groupSystem} mt={12} />
          {system.map((s) => (
            <ScreenTile key={s.to} s={s} />
          ))}
        </div>

        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: '24px 0 0',
            font: '500 12px var(--f-ui)',
            color: '#5E8A92',
          }}
        >
          {t.footer}
        </div>
      </div>
    </div>
  )
}
