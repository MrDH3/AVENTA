'use client'

import { useState, type CSSProperties, type ReactNode } from 'react'
import ClientNav from '../components/ClientNav'
import ClientFooter from '../components/ClientFooter'
import PhoneFrame from '../components/PhoneFrame'
import { useDict } from '../i18n/lang'

const dict = {
  ru: {
    metaKicker: 'МОБИЛЬНОЕ ПРИЛОЖЕНИЕ',
    title: 'AVENTA в кармане — море, солнце и дорога',
    intro:
      'Весь сервис аренды в одном приложении: подбор авто на ваши даты, бронирование за минуту, услуги, страховка и личный кабинет. Морской стиль на каждом экране.',
    lblHome: 'Главная',
    lblCatalog: 'Каталог',
    lblDetail: 'Карточка авто',
    lblBooking: 'Бронирование · услуги',
    lblAccount: 'Личный кабинет',
    // Home
    hHero: 'Море, солнце и дорога — здесь',
    hHeroSub: 'Авто и весь сервис для поездки в Турцию.',
    hRange: 'ПОЛУЧЕНИЕ → ВОЗВРАТ',
    hDates: '10 → 15 авг · AYT',
    hFind: 'Найти авто',
    hAvail: 'Доступны сейчас',
    hAll: 'Все →',
    free: 'Свободен',
    auto5: 'Автомат · 5 мест',
    perDay: ' /сут',
    book: 'Бронь',
    // Catalog
    cTitle: 'Каталог',
    cFilters: 'Фильтры',
    cDates: '10–15 авг · AYT',
    cFreeToggle: 'Свободные',
    cAll5: 'Все · 5',
    cBiz: 'Бизнес',
    cSuv: 'SUV',
    specAuto: 'Автомат · Бензин · 5',
    busyTo: 'Занят до 18 авг',
    fromAug: 'С 18 авг',
    // Car detail
    dCatalog: 'Каталог',
    dBiz: 'Бизнес',
    dAvail: 'Доступен',
    dSpec: '2024 · Бизнес-класс · Седан',
    dGearbox: 'КОРОБКА',
    dAutoVal: 'Автомат',
    dFuel: 'ТОПЛИВО',
    dFuelVal: 'Бензин',
    dSeats: 'МЕСТ / ДВЕРЕЙ',
    dSeatsVal: '5 / 4',
    dMileage: 'ПРОБЕГ',
    dMileageVal: '250 км/сут',
    dTerms: 'Условия аренды',
    dTerm1: 'Возраст 21+, стаж 2+ года',
    dTerm2: 'Залог €800, базовая страховка',
    dPerDayFull: ' /сутки',
    dDeposit: 'Залог €800',
    dBook: 'Забронировать',
    // Booking
    bTitle: 'Услуги и страховка',
    bStep: '2/4',
    bHint: 'Расскажите о цели поездки — подберём услуги',
    bExtras: 'Дополнительные услуги',
    bSeat: 'Детское кресло',
    bSeatPrice: '€5 / сутки',
    bDelivery: 'Доставка авто по адресу',
    bDeliveryPrice: '€25',
    bInsurance: 'Страховка',
    bExt: 'Расширенная',
    bExtSub: 'Франшиза €300',
    bExtPrice: '€15/сут',
    bFull: 'Полная без франшизы',
    bFullSub: '0 франшиза',
    bFullPrice: '€28/сут',
    bTotal: 'ИТОГО',
    bNext: 'Далее →',
    // Account
    aKicker: 'ЛИЧНЫЙ КАБИНЕТ',
    aWelcome: 'С возвращением, Иван',
    aAvatar: 'И',
    aLoyalty: '3 поездки · −10%',
    aFav: 'ВАШ ЛЮБИМЫЙ АВТОМОБИЛЬ',
    aFavSub: '€120/сут · свободен',
    aRebook: 'Забронировать снова · ≈45 сек',
    aHistory: 'История',
    aH1Car: 'Range Rover Velar',
    aH1Dates: '12–18 мая · €1 080',
    aH1Action: 'PDF',
    aH2Car: 'Mercedes-Benz E 200',
    aH2Dates: '03–08 авг 2025 · €560',
    aH2Action: 'Повтор',
  },
  en: {
    metaKicker: 'MOBILE APP',
    title: 'AVENTA in your pocket — sea, sun and road',
    intro:
      'The whole rental service in one app: find a car for your dates, book in a minute, add services, insurance and your account. A seaside style on every screen.',
    lblHome: 'Home',
    lblCatalog: 'Catalogue',
    lblDetail: 'Car detail',
    lblBooking: 'Booking · extras',
    lblAccount: 'Account',
    // Home
    hHero: 'Sea, sun and the road — right here',
    hHeroSub: 'A car and the full service for your Turkey trip.',
    hRange: 'PICK-UP → RETURN',
    hDates: 'Aug 10 → 15 · AYT',
    hFind: 'Find a car',
    hAvail: 'Available now',
    hAll: 'All →',
    free: 'Available',
    auto5: 'Automatic · 5 seats',
    perDay: ' /day',
    book: 'Book',
    // Catalog
    cTitle: 'Catalogue',
    cFilters: 'Filters',
    cDates: 'Aug 10–15 · AYT',
    cFreeToggle: 'Available',
    cAll5: 'All · 5',
    cBiz: 'Business',
    cSuv: 'SUV',
    specAuto: 'Automatic · Petrol · 5',
    busyTo: 'Booked until Aug 18',
    fromAug: 'From Aug 18',
    // Car detail
    dCatalog: 'Catalogue',
    dBiz: 'Business',
    dAvail: 'Available',
    dSpec: '2024 · Business class · Sedan',
    dGearbox: 'GEARBOX',
    dAutoVal: 'Automatic',
    dFuel: 'FUEL',
    dFuelVal: 'Petrol',
    dSeats: 'SEATS / DOORS',
    dSeatsVal: '5 / 4',
    dMileage: 'MILEAGE',
    dMileageVal: '250 km/day',
    dTerms: 'Rental terms',
    dTerm1: 'Age 21+, 2+ years licence',
    dTerm2: 'Deposit €800, basic insurance',
    dPerDayFull: ' /day',
    dDeposit: 'Deposit €800',
    dBook: 'Book now',
    // Booking
    bTitle: 'Extras & insurance',
    bStep: '2/4',
    bHint: 'Tell us about your trip — we will suggest services',
    bExtras: 'Additional services',
    bSeat: 'Child seat',
    bSeatPrice: '€5 / day',
    bDelivery: 'Car delivery to address',
    bDeliveryPrice: '€25',
    bInsurance: 'Insurance',
    bExt: 'Extended',
    bExtSub: 'Excess €300',
    bExtPrice: '€15/day',
    bFull: 'Full, zero excess',
    bFullSub: '0 excess',
    bFullPrice: '€28/day',
    bTotal: 'TOTAL',
    bNext: 'Next →',
    // Account
    aKicker: 'YOUR ACCOUNT',
    aWelcome: 'Welcome back, Ivan',
    aAvatar: 'I',
    aLoyalty: '3 trips · −10%',
    aFav: 'YOUR FAVOURITE CAR',
    aFavSub: '€120/day · available',
    aRebook: 'Book again · ≈45 sec',
    aHistory: 'History',
    aH1Car: 'Range Rover Velar',
    aH1Dates: 'May 12–18 · €1,080',
    aH1Action: 'PDF',
    aH2Car: 'Mercedes-Benz E 200',
    aH2Dates: 'Aug 3–8, 2025 · €560',
    aH2Action: 'Repeat',
  },
  tr: {
    metaKicker: 'MOBİL UYGULAMA',
    title: 'AVENTA cebinizde — deniz, güneş ve yol',
    intro:
      'Tüm kiralama hizmeti tek uygulamada: tarihlerinize uygun aracı bulun, bir dakikada rezerve edin, hizmetleri, sigortayı ve hesabınızı ekleyin. Her ekranda deniz esintili bir tasarım.',
    lblHome: 'Ana Sayfa',
    lblCatalog: 'Katalog',
    lblDetail: 'Araç detayı',
    lblBooking: 'Rezervasyon · ekstralar',
    lblAccount: 'Hesap',
    // Home
    hHero: 'Deniz, güneş ve yol — tam burada',
    hHeroSub: 'Türkiye tatiliniz için araç ve eksiksiz hizmet.',
    hRange: 'ALIŞ → İADE',
    hDates: '10 → 15 Ağu · AYT',
    hFind: 'Araç bul',
    hAvail: 'Şimdi müsait',
    hAll: 'Tümü →',
    free: 'Müsait',
    auto5: 'Otomatik · 5 koltuk',
    perDay: ' /gün',
    book: 'Kirala',
    // Catalog
    cTitle: 'Katalog',
    cFilters: 'Filtreler',
    cDates: '10–15 Ağu · AYT',
    cFreeToggle: 'Müsait',
    cAll5: 'Tümü · 5',
    cBiz: 'Business',
    cSuv: 'SUV',
    specAuto: 'Otomatik · Benzin · 5',
    busyTo: '18 Ağu\'ya kadar dolu',
    fromAug: '18 Ağu\'dan itibaren',
    // Car detail
    dCatalog: 'Katalog',
    dBiz: 'Business',
    dAvail: 'Müsait',
    dSpec: '2024 · Business sınıfı · Sedan',
    dGearbox: 'VİTES',
    dAutoVal: 'Otomatik',
    dFuel: 'YAKIT',
    dFuelVal: 'Benzin',
    dSeats: 'KOLTUK / KAPI',
    dSeatsVal: '5 / 4',
    dMileage: 'KM LİMİTİ',
    dMileageVal: '250 km/gün',
    dTerms: 'Kiralama koşulları',
    dTerm1: '21+ yaş, 2+ yıl ehliyet',
    dTerm2: 'Depozito €800, temel sigorta',
    dPerDayFull: ' /gün',
    dDeposit: 'Depozito €800',
    dBook: 'Hemen kirala',
    // Booking
    bTitle: 'Ekstralar ve sigorta',
    bStep: '2/4',
    bHint: 'Seyahatinizi anlatın — size hizmet önerelim',
    bExtras: 'Ek hizmetler',
    bSeat: 'Çocuk koltuğu',
    bSeatPrice: '€5 / gün',
    bDelivery: 'Adrese araç teslimi',
    bDeliveryPrice: '€25',
    bInsurance: 'Sigorta',
    bExt: 'Genişletilmiş',
    bExtSub: 'Muafiyet €300',
    bExtPrice: '€15/gün',
    bFull: 'Tam, sıfır muafiyet',
    bFullSub: '0 muafiyet',
    bFullPrice: '€28/gün',
    bTotal: 'TOPLAM',
    bNext: 'İleri →',
    // Account
    aKicker: 'HESABINIZ',
    aWelcome: 'Tekrar hoş geldiniz, Ivan',
    aAvatar: 'I',
    aLoyalty: '3 seyahat · −10%',
    aFav: 'FAVORİ ARACINIZ',
    aFavSub: '€120/gün · müsait',
    aRebook: 'Tekrar kirala · ≈45 sn',
    aHistory: 'Geçmiş',
    aH1Car: 'Range Rover Velar',
    aH1Dates: '12–18 May · €1.080',
    aH1Action: 'PDF',
    aH2Car: 'Mercedes-Benz E 200',
    aH2Dates: '3–8 Ağu 2025 · €560',
    aH2Action: 'Tekrarla',
  },
  es: {
    metaKicker: 'APP MÓVIL',
    title: 'AVENTA en tu bolsillo — mar, sol y carretera',
    intro:
      'Todo el servicio de alquiler en una sola app: encuentra un coche para tus fechas, reserva en un minuto, añade servicios, seguro y tu cuenta. Un estilo marinero en cada pantalla.',
    lblHome: 'Inicio',
    lblCatalog: 'Catálogo',
    lblDetail: 'Detalle del coche',
    lblBooking: 'Reserva · extras',
    lblAccount: 'Cuenta',
    // Home
    hHero: 'Mar, sol y carretera — aquí mismo',
    hHeroSub: 'Un coche y el servicio completo para tu viaje a Turquía.',
    hRange: 'RECOGIDA → DEVOLUCIÓN',
    hDates: '10 → 15 Ago · AYT',
    hFind: 'Buscar coche',
    hAvail: 'Disponibles ahora',
    hAll: 'Todos →',
    free: 'Disponible',
    auto5: 'Automático · 5 plazas',
    perDay: ' /día',
    book: 'Reservar',
    // Catalog
    cTitle: 'Catálogo',
    cFilters: 'Filtros',
    cDates: '10–15 Ago · AYT',
    cFreeToggle: 'Disponibles',
    cAll5: 'Todos · 5',
    cBiz: 'Business',
    cSuv: 'SUV',
    specAuto: 'Automático · Gasolina · 5',
    busyTo: 'Reservado hasta el 18 Ago',
    fromAug: 'Desde el 18 Ago',
    // Car detail
    dCatalog: 'Catálogo',
    dBiz: 'Business',
    dAvail: 'Disponible',
    dSpec: '2024 · Clase Business · Sedán',
    dGearbox: 'CAMBIO',
    dAutoVal: 'Automático',
    dFuel: 'COMBUSTIBLE',
    dFuelVal: 'Gasolina',
    dSeats: 'PLAZAS / PUERTAS',
    dSeatsVal: '5 / 4',
    dMileage: 'KILOMETRAJE',
    dMileageVal: '250 km/día',
    dTerms: 'Condiciones de alquiler',
    dTerm1: 'Edad 21+, carné de 2+ años',
    dTerm2: 'Depósito €800, seguro básico',
    dPerDayFull: ' /día',
    dDeposit: 'Depósito €800',
    dBook: 'Reservar ahora',
    // Booking
    bTitle: 'Extras y seguro',
    bStep: '2/4',
    bHint: 'Cuéntanos sobre tu viaje — te sugeriremos servicios',
    bExtras: 'Servicios adicionales',
    bSeat: 'Silla infantil',
    bSeatPrice: '€5 / día',
    bDelivery: 'Entrega del coche a domicilio',
    bDeliveryPrice: '€25',
    bInsurance: 'Seguro',
    bExt: 'Ampliado',
    bExtSub: 'Franquicia €300',
    bExtPrice: '€15/día',
    bFull: 'Total, sin franquicia',
    bFullSub: '0 franquicia',
    bFullPrice: '€28/día',
    bTotal: 'TOTAL',
    bNext: 'Siguiente →',
    // Account
    aKicker: 'TU CUENTA',
    aWelcome: 'Bienvenido de nuevo, Ivan',
    aAvatar: 'I',
    aLoyalty: '3 viajes · −10%',
    aFav: 'TU COCHE FAVORITO',
    aFavSub: '€120/día · disponible',
    aRebook: 'Reservar otra vez · ≈45 s',
    aHistory: 'Historial',
    aH1Car: 'Range Rover Velar',
    aH1Dates: '12–18 May · €1.080',
    aH1Action: 'PDF',
    aH2Car: 'Mercedes-Benz E 200',
    aH2Dates: '3–8 Ago 2025 · €560',
    aH2Action: 'Repetir',
  },
  de: {
    metaKicker: 'MOBILE APP',
    title: 'AVENTA in deiner Tasche — Meer, Sonne und Straße',
    intro:
      'Der komplette Mietservice in einer App: Auto für deine Daten finden, in einer Minute buchen, Services, Versicherung und dein Konto hinzufügen. Maritimer Stil auf jedem Bildschirm.',
    lblHome: 'Start',
    lblCatalog: 'Katalog',
    lblDetail: 'Fahrzeugdetails',
    lblBooking: 'Buchung · Extras',
    lblAccount: 'Konto',
    // Home
    hHero: 'Meer, Sonne und Straße — genau hier',
    hHeroSub: 'Ein Auto und der komplette Service für deine Türkei-Reise.',
    hRange: 'ABHOLUNG → RÜCKGABE',
    hDates: '10. → 15. Aug · AYT',
    hFind: 'Auto finden',
    hAvail: 'Jetzt verfügbar',
    hAll: 'Alle →',
    free: 'Verfügbar',
    auto5: 'Automatik · 5 Sitze',
    perDay: ' /Tag',
    book: 'Buchen',
    // Catalog
    cTitle: 'Katalog',
    cFilters: 'Filter',
    cDates: '10.–15. Aug · AYT',
    cFreeToggle: 'Verfügbar',
    cAll5: 'Alle · 5',
    cBiz: 'Business',
    cSuv: 'SUV',
    specAuto: 'Automatik · Benzin · 5',
    busyTo: 'Belegt bis 18. Aug',
    fromAug: 'Ab 18. Aug',
    // Car detail
    dCatalog: 'Katalog',
    dBiz: 'Business',
    dAvail: 'Verfügbar',
    dSpec: '2024 · Business-Klasse · Limousine',
    dGearbox: 'GETRIEBE',
    dAutoVal: 'Automatik',
    dFuel: 'KRAFTSTOFF',
    dFuelVal: 'Benzin',
    dSeats: 'SITZE / TÜREN',
    dSeatsVal: '5 / 4',
    dMileage: 'KILOMETER',
    dMileageVal: '250 km/Tag',
    dTerms: 'Mietbedingungen',
    dTerm1: 'Alter 21+, Führerschein 2+ Jahre',
    dTerm2: 'Kaution €800, Basisversicherung',
    dPerDayFull: ' /Tag',
    dDeposit: 'Kaution €800',
    dBook: 'Jetzt buchen',
    // Booking
    bTitle: 'Extras & Versicherung',
    bStep: '2/4',
    bHint: 'Erzähl uns von deiner Reise — wir schlagen Services vor',
    bExtras: 'Zusätzliche Services',
    bSeat: 'Kindersitz',
    bSeatPrice: '€5 / Tag',
    bDelivery: 'Fahrzeuglieferung an Adresse',
    bDeliveryPrice: '€25',
    bInsurance: 'Versicherung',
    bExt: 'Erweitert',
    bExtSub: 'Selbstbeteiligung €300',
    bExtPrice: '€15/Tag',
    bFull: 'Voll, ohne Selbstbeteiligung',
    bFullSub: '0 Selbstbeteiligung',
    bFullPrice: '€28/Tag',
    bTotal: 'GESAMT',
    bNext: 'Weiter →',
    // Account
    aKicker: 'DEIN KONTO',
    aWelcome: 'Willkommen zurück, Ivan',
    aAvatar: 'I',
    aLoyalty: '3 Fahrten · −10%',
    aFav: 'DEIN LIEBLINGSAUTO',
    aFavSub: '€120/Tag · verfügbar',
    aRebook: 'Erneut buchen · ≈45 Sek.',
    aHistory: 'Verlauf',
    aH1Car: 'Range Rover Velar',
    aH1Dates: '12.–18. Mai · €1.080',
    aH1Action: 'PDF',
    aH2Car: 'Mercedes-Benz E 200',
    aH2Dates: '3.–8. Aug 2025 · €560',
    aH2Action: 'Wiederholen',
  },
}

type T = (typeof dict)['ru']

/* ---------- shared tiny styles for the in-frame mocks ---------- */
const screen: CSSProperties = {
  minHeight: '100%',
  background: 'var(--av-bg)',
  color: 'var(--av-text)',
  fontFamily: 'var(--f-ui)',
  paddingBottom: 20,
}
const carThumb: CSSProperties = {
  background: 'linear-gradient(135deg,#DCF3F6,#B6E6EE)',
}
const coralBtnSm: CSSProperties = {
  background: 'linear-gradient(180deg,#FF8A5B,#FF6F61)',
  color: '#fff',
  borderRadius: 999,
}
const monoLabel = (color: string): CSSProperties => ({
  font: '700 9px var(--f-mono)',
  letterSpacing: '.06em',
  color,
})

/* Small foam wave reused on the Home frame hero (global av-wave keyframe). */
function FoamWave() {
  return (
    <div style={{ height: 30, position: 'relative', marginTop: 8, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: '200%',
          height: 28,
          animation: 'av-wave 8s linear infinite',
        }}
      >
        <svg width="100%" height="28" viewBox="0 0 2880 28" preserveAspectRatio="none" fill="#fff">
          <path d="M0,15 C360,4 720,4 1440,15 C2160,26 2520,26 2880,15 L2880,28 L0,28Z" />
        </svg>
      </div>
    </div>
  )
}

function FreePill({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 9px',
        background: '#E6F8EE',
        borderRadius: 999,
        font: '700 9px var(--f-ui)',
        color: '#1F9E6B',
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#27B576' }} />
      {label}
    </span>
  )
}

/* ============================== HOME ============================== */
function HomeScreen({ t }: { t: T }) {
  const cars: { name: string; price: string }[] = [
    { name: 'Mercedes-Benz E 200', price: '€120' },
    { name: 'Range Rover Velar', price: '€180' },
  ]
  return (
    <div style={{ ...screen, paddingBottom: 24 }}>
      {/* sky hero band */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg,#CDEFF6,#7CD3E1)' }}>
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 22,
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: 'radial-gradient(circle,#FFE49B,#FFD56B 55%,#FFC24D)',
            boxShadow: '0 0 34px 10px rgba(255,213,107,.5)',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <svg width="26" height="26" viewBox="0 0 48 48" fill="none">
              <rect x="2" y="2" width="44" height="44" rx="14" fill="#fff" />
              <path d="M14 35 L24 12 L34 35" stroke="#0E7E90" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18.6 27.2 H29.4" stroke="#FF7A5C" strokeWidth="3.2" strokeLinecap="round" />
              <circle cx="24" cy="12" r="2.6" fill="#FF7A5C" />
            </svg>
            <div style={{ font: '800 17px var(--f-display)', color: '#0C3B45' }}>AVENTA</div>
          </div>
          <span style={{ padding: '5px 9px', background: '#0E7E90', color: '#fff', borderRadius: 999, font: '700 11px var(--f-ui)' }}>RU</span>
        </div>
        <div style={{ padding: '12px 16px 0', position: 'relative', zIndex: 2 }}>
          <div style={{ font: '800 24px/1.1 var(--f-display)', color: '#0C3B45' }}>{t.hHero}</div>
          <div style={{ marginTop: 8, font: '500 12px/1.5 var(--f-ui)', color: '#0B5560' }}>{t.hHeroSub}</div>
        </div>
        {/* search card */}
        <div
          style={{
            margin: '14px 14px 0',
            background: 'rgba(255,255,255,.9)',
            borderRadius: 16,
            padding: 6,
            position: 'relative',
            zIndex: 2,
            boxShadow: '0 16px 34px -20px rgba(11,85,96,.5)',
          }}
        >
          <div style={{ padding: '11px 13px', borderBottom: '1px solid rgba(12,59,69,.08)' }}>
            <div style={{ ...monoLabel('#1399AE'), letterSpacing: '.1em' }}>{t.hRange}</div>
            <div style={{ marginTop: 4, font: '700 14px var(--f-ui)', color: '#0C3B45' }}>{t.hDates}</div>
          </div>
          <div style={{ padding: 7 }}>
            <div style={{ textAlign: 'center', padding: 13, ...coralBtnSm, borderRadius: 11, font: '700 14px var(--f-ui)' }}>{t.hFind}</div>
          </div>
        </div>
        <FoamWave />
      </div>
      {/* available now */}
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ font: '800 17px var(--f-display)', color: '#0C3B45' }}>{t.hAvail}</div>
          <span style={{ font: '700 12px var(--f-ui)', color: '#0E7E90' }}>{t.hAll}</span>
        </div>
        <div style={{ marginTop: 13, display: 'flex', flexDirection: 'column', gap: 13 }}>
          {cars.map((c) => (
            <div key={c.name} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 14px 32px -22px rgba(11,85,96,.4)' }}>
              <div style={{ position: 'relative', height: 96, ...carThumb, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={monoLabel('rgba(12,59,69,.4)')}>{c.name}</div>
                <span style={{ position: 'absolute', top: 9, right: 9 }}>
                  <FreePill label={t.free} />
                </span>
              </div>
              <div style={{ padding: 13, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ font: '700 14px var(--f-display)', color: '#0C3B45' }}>{c.name}</div>
                  <div style={{ marginTop: 4, font: '600 10px var(--f-mono)', color: '#5E8A92' }}>{t.auto5}</div>
                  <div style={{ marginTop: 7, font: '800 16px var(--f-display)', color: '#0C3B45' }}>
                    {c.price}
                    <span style={{ font: '600 10px var(--f-ui)', color: '#5E8A92' }}>{t.perDay}</span>
                  </div>
                </div>
                <span style={{ padding: '8px 14px', ...coralBtnSm, font: '700 12px var(--f-ui)' }}>{t.book}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ============================ CATALOG ============================ */
function CatalogScreen({ t }: { t: T }) {
  const [onlyFree, setOnlyFree] = useState(true)
  const [cat, setCat] = useState<'all' | 'biz' | 'suv'>('all')
  const chips: { id: 'all' | 'biz' | 'suv'; label: string }[] = [
    { id: 'all', label: t.cAll5 },
    { id: 'biz', label: t.cBiz },
    { id: 'suv', label: t.cSuv },
  ]
  const cars: { name: string; price: string; busy?: boolean }[] = [
    { name: 'Mercedes-Benz E 200', price: '€120' },
    { name: 'Range Rover Velar', price: '€180' },
    { name: 'BMW 520i', price: '€110', busy: true },
  ]
  return (
    <div style={screen}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ font: '700 20px var(--f-ui)', color: '#5E8A92' }}>‹</span>
          <div style={{ font: '800 20px var(--f-display)', color: '#0C3B45' }}>{t.cTitle}</div>
        </div>
        <span style={{ padding: '7px 12px', background: '#fff', borderRadius: 10, font: '700 11px var(--f-ui)', color: '#0E7E90', boxShadow: '0 6px 14px -8px rgba(11,85,96,.4)' }}>{t.cFilters}</span>
      </div>
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 12, padding: '11px 14px', boxShadow: '0 8px 20px -12px rgba(11,85,96,.4)' }}>
          <div style={{ font: '700 12px var(--f-ui)', color: '#0C3B45' }}>{t.cDates}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ font: '600 11px var(--f-ui)', color: '#5E8A92' }}>{t.cFreeToggle}</span>
            <button
              type="button"
              onClick={() => setOnlyFree((v) => !v)}
              style={{
                width: 34,
                height: 20,
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                borderRadius: 999,
                background: onlyFree ? '#27B576' : '#CFE0E4',
                position: 'relative',
                transition: 'background .2s',
              }}
              aria-pressed={onlyFree}
            >
              <span style={{ position: 'absolute', top: 3, left: onlyFree ? 17 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
            </button>
          </div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          {chips.map((c) => {
            const active = cat === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCat(c.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  background: active ? '#0E7E90' : '#fff',
                  color: active ? '#fff' : '#0C3B45',
                  font: `${active ? 700 : 600} 12px var(--f-ui)`,
                  boxShadow: active ? 'none' : '0 6px 14px -8px rgba(11,85,96,.3)',
                }}
              >
                {c.label}
              </button>
            )
          })}
        </div>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cars.map((c) => (
            <div
              key={c.name}
              style={{
                display: 'flex',
                gap: 12,
                background: '#fff',
                borderRadius: 14,
                padding: 12,
                boxShadow: '0 12px 28px -20px rgba(11,85,96,.4)',
                opacity: c.busy ? 0.7 : 1,
              }}
            >
              <div style={{ width: 100, height: 78, borderRadius: 11, flexShrink: 0, background: c.busy ? 'linear-gradient(135deg,#E4EEF0,#CFE0E4)' : 'linear-gradient(135deg,#DCF3F6,#B6E6EE)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '700 14px var(--f-display)', color: '#0C3B45' }}>{c.name}</div>
                <div style={{ marginTop: 4, font: '600 10px var(--f-mono)', color: c.busy ? '#E07A1E' : '#5E8A92' }}>{c.busy ? t.busyTo : t.specAuto}</div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ font: '800 16px var(--f-display)', color: '#0C3B45' }}>
                    {c.price}
                    <span style={{ font: '600 10px var(--f-ui)', color: '#5E8A92' }}>{t.perDay}</span>
                  </span>
                  {c.busy ? (
                    <span style={{ padding: '7px 12px', border: '1.5px solid #FF7A5C', color: '#FF6F61', borderRadius: 999, font: '700 10px var(--f-ui)' }}>{t.fromAug}</span>
                  ) : (
                    <span style={{ padding: '7px 12px', ...coralBtnSm, font: '700 11px var(--f-ui)' }}>{t.book}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* =========================== CAR DETAIL =========================== */
function DetailScreen({ t }: { t: T }) {
  const specs: { label: string; value: string }[] = [
    { label: t.dGearbox, value: t.dAutoVal },
    { label: t.dFuel, value: t.dFuelVal },
    { label: t.dSeats, value: t.dSeatsVal },
    { label: t.dMileage, value: t.dMileageVal },
  ]
  const terms: string[] = [t.dTerm1, t.dTerm2]
  return (
    <div style={{ ...screen, position: 'relative', paddingBottom: 88 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 12px' }}>
        <span style={{ font: '700 20px var(--f-ui)', color: '#5E8A92' }}>‹</span>
        <span style={{ font: '600 12px var(--f-ui)', color: '#5E8A92' }}>{t.dCatalog}</span>
        <span style={{ font: '700 16px var(--f-ui)', color: '#FF6F61' }}>♡</span>
      </div>
      <div style={{ position: 'relative', height: 184, margin: '0 16px', borderRadius: 18, ...carThumb, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={monoLabel('rgba(12,59,69,.4)')}>Mercedes-Benz E 200</div>
        <span style={{ position: 'absolute', top: 12, left: 12, padding: '5px 11px', background: '#fff', borderRadius: 999, font: '700 10px var(--f-ui)', color: '#0E7E90' }}>{t.dBiz}</span>
        <span style={{ position: 'absolute', top: 12, right: 12 }}>
          <FreePill label={t.dAvail} />
        </span>
      </div>
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ font: '800 21px var(--f-display)', color: '#0C3B45' }}>Mercedes-Benz E 200</div>
        <div style={{ marginTop: 4, font: '500 12px var(--f-ui)', color: '#5E8A92' }}>{t.dSpec}</div>
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {specs.map((s) => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 11, padding: 11, boxShadow: '0 8px 20px -16px rgba(11,85,96,.5)' }}>
              <div style={monoLabel('#1399AE')}>{s.label}</div>
              <div style={{ marginTop: 3, font: '700 13px var(--f-ui)', color: '#0C3B45' }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, font: '700 14px var(--f-display)', color: '#0C3B45' }}>{t.dTerms}</div>
        <div style={{ marginTop: 9, display: 'flex', flexDirection: 'column', gap: 8, font: '500 12px var(--f-ui)', color: '#0B5560' }}>
          {terms.map((term) => (
            <span key={term} style={{ display: 'flex', gap: 8 }}>
              <span style={{ color: '#27B576' }}>✓</span>
              {term}
            </span>
          ))}
        </div>
      </div>
      {/* sticky price bar */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: '#fff', borderTop: '1px solid rgba(12,59,69,.08)', padding: '14px 16px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ font: '800 21px var(--f-display)', color: '#0C3B45' }}>
            €120<span style={{ font: '600 10px var(--f-ui)', color: '#5E8A92' }}>{t.dPerDayFull}</span>
          </div>
          <div style={{ font: '500 10px var(--f-ui)', color: '#5E8A92' }}>{t.dDeposit}</div>
        </div>
        <span style={{ padding: '13px 24px', ...coralBtnSm, borderRadius: 12, font: '700 14px var(--f-ui)' }}>{t.dBook}</span>
      </div>
    </div>
  )
}

/* ============================ BOOKING ============================ */
function ExtraRow({ title, sub, checked, onToggle }: { title: string; sub: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        background: checked ? '#E9FBF2' : '#fff',
        border: checked ? '1.5px solid #27B576' : '1.5px solid transparent',
        borderRadius: 12,
        padding: '13px 14px',
        boxShadow: checked ? 'none' : '0 8px 20px -16px rgba(11,85,96,.4)',
      }}
      aria-pressed={checked}
    >
      <span>
        <span style={{ display: 'block', font: '700 13px var(--f-ui)', color: '#0C3B45' }}>{title}</span>
        <span style={{ display: 'block', font: '500 11px var(--f-ui)', color: '#5E8A92' }}>{sub}</span>
      </span>
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          flexShrink: 0,
          border: checked ? 'none' : '1.5px solid rgba(20,153,174,.3)',
          background: checked ? '#27B576' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          font: '700 12px var(--f-ui)',
        }}
      >
        {checked ? '✓' : ''}
      </span>
    </button>
  )
}

function InsuranceRow({ title, sub, price, active, onClick }: { title: string; sub: string; price: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        background: active ? 'linear-gradient(135deg,#FFF3EB,#FFE8DC)' : '#fff',
        border: active ? '1.5px solid #FF7A5C' : '1px solid rgba(20,153,174,.2)',
        borderRadius: 12,
        padding: '13px 14px',
        boxShadow: active ? 'none' : '0 8px 20px -16px rgba(11,85,96,.4)',
      }}
      aria-pressed={active}
    >
      <span>
        <span style={{ display: 'block', font: '700 13px var(--f-ui)', color: '#0C3B45' }}>{title}</span>
        <span style={{ display: 'block', font: '500 11px var(--f-ui)', color: '#5E8A92' }}>{sub}</span>
      </span>
      <span style={{ font: '800 14px var(--f-display)', color: active ? '#FF6F61' : '#0C3B45' }}>{price}</span>
    </button>
  )
}

function BookingScreen({ t }: { t: T }) {
  const [seat, setSeat] = useState(false)
  const [delivery, setDelivery] = useState(true)
  const [plan, setPlan] = useState<'ext' | 'full'>('ext')

  // recompute the total live from selections: base €600 over 5 days + extras + insurance
  const base = 600
  const extras = (seat ? 5 * 5 : 0) + (delivery ? 25 : 0)
  const ins = plan === 'ext' ? 15 * 5 : 28 * 5
  const total = base + extras + ins

  return (
    <div style={{ ...screen, position: 'relative', paddingBottom: 88 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 12px' }}>
        <span style={{ font: '700 20px var(--f-ui)', color: '#5E8A92' }}>‹</span>
        <div style={{ font: '800 15px var(--f-display)', color: '#0C3B45' }}>{t.bTitle}</div>
        <span style={{ font: '600 11px var(--f-mono)', color: '#5E8A92' }}>{t.bStep}</span>
      </div>
      {/* progress */}
      <div style={{ display: 'flex', gap: 5, padding: '0 16px 16px' }}>
        {[true, true, false, false].map((on, i) => (
          <span key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: on ? '#FF7A5C' : '#CFE0E4' }} />
        ))}
      </div>
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg,#127C90,#1AA1B0)', borderRadius: 12, padding: '13px 14px' }}>
          <span style={{ color: '#FFD56B', font: '700 16px var(--f-ui)' }}>✦</span>
          <span style={{ font: '600 12px/1.4 var(--f-ui)', color: '#fff' }}>{t.bHint}</span>
        </div>
        {/* extras */}
        <div style={{ marginTop: 16, font: '700 13px var(--f-ui)', color: '#5E8A92' }}>{t.bExtras}</div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ExtraRow title={t.bSeat} sub={t.bSeatPrice} checked={seat} onToggle={() => setSeat((v) => !v)} />
          <ExtraRow title={t.bDelivery} sub={t.bDeliveryPrice} checked={delivery} onToggle={() => setDelivery((v) => !v)} />
        </div>
        {/* insurance */}
        <div style={{ marginTop: 16, font: '700 13px var(--f-ui)', color: '#5E8A92' }}>{t.bInsurance}</div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <InsuranceRow title={t.bExt} sub={t.bExtSub} price={t.bExtPrice} active={plan === 'ext'} onClick={() => setPlan('ext')} />
          <InsuranceRow title={t.bFull} sub={t.bFullSub} price={t.bFullPrice} active={plan === 'full'} onClick={() => setPlan('full')} />
        </div>
      </div>
      {/* sticky total */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: '#fff', borderTop: '1px solid rgba(12,59,69,.08)', padding: '13px 16px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={monoLabel('#5E8A92')}>{t.bTotal}</div>
          <div style={{ font: '800 20px var(--f-display)', color: '#0C3B45' }}>€{total.toLocaleString('ru-RU')}</div>
        </div>
        <span style={{ padding: '13px 26px', ...coralBtnSm, borderRadius: 12, font: '700 14px var(--f-ui)' }}>{t.bNext}</span>
      </div>
    </div>
  )
}

/* ============================ ACCOUNT ============================ */
function AccountScreen({ t }: { t: T }) {
  const history: { car: string; dates: string; action: string }[] = [
    { car: t.aH1Car, dates: t.aH1Dates, action: t.aH1Action },
    { car: t.aH2Car, dates: t.aH2Dates, action: t.aH2Action },
  ]
  return (
    <div style={{ ...screen, paddingBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 14px' }}>
        <div style={{ font: '800 18px var(--f-display)', color: '#0C3B45' }}>AVENTA</div>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#FF8A5B,#FF6F61)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', font: '700 12px var(--f-ui)' }}>
          {t.aAvatar}
        </div>
      </div>
      <div style={{ padding: '6px 16px 0' }}>
        <div style={{ ...monoLabel('#FF7A5C'), letterSpacing: '.14em' }}>{t.aKicker}</div>
        <div style={{ marginTop: 8, font: '800 24px var(--f-display)', color: '#0C3B45' }}>{t.aWelcome}</div>
        <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', background: '#fff', borderRadius: 999, boxShadow: '0 8px 18px -10px rgba(11,85,96,.4)' }}>
          <span style={{ color: '#FFC24D' }}>★</span>
          <span style={{ font: '700 11px var(--f-ui)', color: '#0C3B45' }}>{t.aLoyalty}</span>
        </div>
        {/* favourite car card */}
        <div style={{ marginTop: 16, borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(135deg,#127C90,#1AA1B0)', padding: 16 }}>
          <div style={{ ...monoLabel('#BFF0F5'), letterSpacing: '.12em' }}>{t.aFav}</div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 80, height: 52, borderRadius: 10, flexShrink: 0, background: 'rgba(255,255,255,.25)' }} />
            <div>
              <div style={{ font: '700 14px var(--f-display)', color: '#fff' }}>Mercedes-Benz E 200</div>
              <div style={{ marginTop: 3, font: '600 10px var(--f-mono)', color: 'rgba(255,255,255,.85)' }}>{t.aFavSub}</div>
            </div>
          </div>
          <div style={{ marginTop: 14, textAlign: 'center', padding: 13, background: '#fff', color: '#FF6F61', borderRadius: 11, font: '700 13px var(--f-ui)' }}>{t.aRebook}</div>
        </div>
        {/* history */}
        <div style={{ marginTop: 18, font: '800 16px var(--f-display)', color: '#0C3B45' }}>{t.aHistory}</div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.map((h) => (
            <div key={h.car + h.dates} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 12, padding: 11, boxShadow: '0 10px 24px -18px rgba(11,85,96,.4)' }}>
              <div style={{ width: 56, height: 42, borderRadius: 9, flexShrink: 0, ...carThumb }} />
              <div style={{ flex: 1 }}>
                <div style={{ font: '700 13px var(--f-display)', color: '#0C3B45' }}>{h.car}</div>
                <div style={{ font: '500 11px var(--f-ui)', color: '#5E8A92' }}>{h.dates}</div>
              </div>
              <span style={{ font: '700 11px var(--f-ui)', color: '#0E7E90' }}>{h.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ============================== PAGE ============================== */
export default function Mobile() {
  const t = useDict(dict)

  const frames: { label: string; node: ReactNode }[] = [
    { label: t.lblHome, node: <HomeScreen t={t} /> },
    { label: t.lblCatalog, node: <CatalogScreen t={t} /> },
    { label: t.lblDetail, node: <DetailScreen t={t} /> },
    { label: t.lblBooking, node: <BookingScreen t={t} /> },
    { label: t.lblAccount, node: <AccountScreen t={t} /> },
  ]

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: 'var(--av-bg)', color: 'var(--av-text)', overflowX: 'clip' }}>
      {/* sticky nav band */}
      <div className="av-sticky-header" style={{ background: 'linear-gradient(180deg,#CDEFF6 0%,#A7E2EC 100%)' }}>
        <ClientNav glass />
      </div>
      {/* sky band with heading */}
      <div
        style={{
          position: 'relative',
          background: 'linear-gradient(180deg,#A7E2EC 0%,#7CD3E1 55%,#5AC7D6 100%)',
        }}
      >
        <div style={{ position: 'relative', zIndex: 5 }}>
          <div style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: 'clamp(28px,4vw,52px) var(--pad-x) clamp(32px,5vw,56px)' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 15px',
                background: 'rgba(255,255,255,.55)',
                border: '1px solid rgba(255,255,255,.8)',
                borderRadius: 999,
                backdropFilter: 'blur(6px)',
                font: '700 11px var(--f-mono)',
                letterSpacing: '.12em',
                color: 'var(--av-teal)',
              }}
            >
              ☀ {t.metaKicker}
            </div>
            <div style={{ marginTop: 18, font: '800 clamp(32px,5vw,52px)/1.05 var(--f-display)', letterSpacing: '-.02em', color: 'var(--av-text)', maxWidth: 720 }}>
              {t.title}
            </div>
            <div style={{ marginTop: 16, font: '500 clamp(14px,2vw,17px)/1.6 var(--f-ui)', color: 'var(--av-body)', maxWidth: 560 }}>
              {t.intro}
            </div>
          </div>
        </div>
      </div>

      {/* phones row, centered on soft sky gradient */}
      <div
        style={{
          background: 'linear-gradient(180deg,#5AC7D6 0%,#9BDDE7 18%,#D7F2F6 46%,var(--av-bg) 100%)',
          padding: 'clamp(40px,6vw,72px) var(--pad-x) clamp(56px,7vw,90px)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--container)',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: 'clamp(28px,3.5vw,48px)',
          }}
        >
          {frames.map((f) => (
            <PhoneFrame key={f.label} dark={false} label={f.label}>
              {f.node}
            </PhoneFrame>
          ))}
        </div>
      </div>

      <ClientFooter />
    </div>
  )
}
