'use client'

import { useState, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { LogoMark } from '../components/Logo'
import { useDict, useLang, type Lang, type Dict } from '../i18n/lang'
import { BOOKING_LIFECYCLE } from '@/lib/booking-status'
import type { Currency } from '@prisma/client'
import type { SuccessBooking, SuccessBankDetails, SuccessSupport, SuccessShellUser } from '../app/success/page'
import AccountShell from '../components/AccountShell'
import { useIsMobile } from '../components/useIsMobile'
import LangToggle from '../components/LangToggle'
import { getCryptoPaymentInfo, submitManualPaymentAction } from '@/server/payment-actions'
import { uploadDocumentAction } from '@/server/document-actions'
import { formatMoney } from '@/lib/money'
import StripeCardPayment from '../components/StripeCardPayment'

/* ------------------------------------------------------------------ *
 *  i18n dictionary (RU / EN). RU copy is verbatim from the design;
 *  EN is a faithful translation. When a real `booking` prop is passed
 *  the data-derived strings below are overridden with live values; the
 *  static copy (conditions, section titles, party company block, …)
 *  stays as-is so the page renders identically with or without ?b=.
 * ------------------------------------------------------------------ */

interface TimelineStep {
  state: 'done' | 'current' | 'upcoming'
  badge: string
  title: string
  meta: string
}

interface RecapRow {
  label: string
  value: string
}

interface CostRow {
  label: string
  value: string
  total?: boolean
}

interface Strings {
  tagTitle: string
  tagSub: string
  // success card
  successTag: string
  checkTitle: string
  checkBody: string
  reqLabel: string
  reqNo: string
  carName: string
  carDates: string
  carPrice: string
  carPrepaid: string
  whatsNext: string
  steps: TimelineStep[]
  downloadPdf: string
  toAccount: string
  // contract
  contractTag: string
  fileName: string
  btnDownload: string
  btnPrint: string
  brandKicker: string
  contractNoLabel: string
  contractNo: string
  contractTitle: string
  contractPlace: string
  lessorLabel: string
  lessorBody: string[]
  renterLabel: string
  renterBody: string[]
  s1Title: string
  subjectRows: RecapRow[]
  s2Title: string
  costRows: CostRow[]
  depositRow: CostRow
  s3Title: string
  conditions: string[]
  signLessor: string
  signRenter: string
  eSignNote: string
  // graceful not-found state
  notFoundTitle: string
  notFoundBody: string
}

const dict: Dict<Strings> = {
  ru: {
    tagTitle: 'AVENTA — Успех бронирования + договор аренды (PDF)',
    tagSub: 'Финальный экран после заявки · автоматический договор · «морской» стиль',
    successTag: 'Заявка принята',
    checkTitle: 'Заявка принята!',
    checkBody:
      'Спасибо, Иван. Администратор свяжется в течение часа для подтверждения. Детали отправлены в Email, Telegram и WhatsApp.',
    reqLabel: 'НОМЕР ЗАЯВКИ',
    reqNo: 'AVN-2026-0042',
    carName: 'Mercedes-Benz E 200',
    carDates: '10–15 авг · 5 сут · AYT → AYT',
    carPrice: '€700',
    carPrepaid: '€210 предоплата ✓',
    whatsNext: 'ЧТО ДАЛЬШЕ',
    steps: [
      { state: 'done', badge: '✓', title: 'Заявка получена', meta: 'только что' },
      {
        state: 'current',
        badge: '2',
        title: 'Подтверждение менеджером',
        meta: 'в течение часа · проверка документов',
      },
      {
        state: 'upcoming',
        badge: '3',
        title: 'Договор и подача автомобиля',
        meta: '10 авг, 12:00 · Аэропорт AYT',
      },
    ],
    downloadPdf: 'Скачать договор PDF',
    toAccount: 'В кабинет',
    contractTag: 'Договор аренды · PDF',
    fileName: 'Договор-AVN-2026-0042.pdf',
    btnDownload: 'Скачать',
    btnPrint: 'Печать',
    brandKicker: 'PREMIUM CAR RENTAL · TURKEY',
    contractNoLabel: 'ДОГОВОР №',
    contractNo: 'AVN-2026-0042',
    contractTitle: 'ДОГОВОР АРЕНДЫ ТРАНСПОРТНОГО СРЕДСТВА',
    contractPlace: 'г. Анталия, Турция · 09 августа 2026 г.',
    lessorLabel: 'АРЕНДОДАТЕЛЬ',
    lessorBody: ['AVENTA Rental LLC', 'Antalya, Konyaaltı', 'VKN 1234567890', '+90 555 000 00 00'],
    renterLabel: 'АРЕНДАТОР',
    renterBody: ['Иван Петров', 'Паспорт 75 1234567', 'ВУ 99 АА 123456 (РФ)', '+90 555 123 45 67'],
    s1Title: '1. ПРЕДМЕТ ДОГОВОРА',
    subjectRows: [
      { label: 'Автомобиль', value: 'Mercedes-Benz E 200, 2024' },
      { label: 'Период', value: '10.08.2026 12:00 — 15.08.2026 12:00' },
      { label: 'Подача / возврат', value: 'Аэропорт Анталии (AYT)' },
    ],
    s2Title: '2. СТОИМОСТЬ',
    costRows: [
      { label: 'Аренда 5 сут × €120', value: '€600' },
      { label: 'Доп. услуги', value: '€100' },
      { label: 'Итого', value: '€700', total: true },
    ],
    depositRow: { label: 'Залог', value: '€800' },
    s3Title: '3. УСЛОВИЯ',
    conditions: [
      'Возраст 21+, стаж 2+ года',
      'Лимит 250 км/сут, далее €0,30/км',
      'Топливо «полный → полный»',
      'Страховка: расширенная, франшиза €300',
    ],
    signLessor: 'Арендодатель · AVENTA',
    signRenter: 'Арендатор · И. Петров',
    eSignNote:
      'Договор формируется автоматически из данных заявки. Подписывается при получении автомобиля.',
    notFoundTitle: 'Заявка не найдена',
    notFoundBody:
      'Мы не нашли бронирование с таким номером. Проверьте ссылку или откройте список заявок в личном кабинете.',
  },
  en: {
    tagTitle: 'AVENTA — Booking success + rental contract (PDF)',
    tagSub: 'Final screen after request · automatic contract · “seaside” style',
    successTag: 'Request accepted',
    checkTitle: 'Request accepted!',
    checkBody:
      'Thank you, Ivan. A manager will contact you within the hour to confirm. Details have been sent to Email, Telegram and WhatsApp.',
    reqLabel: 'REQUEST NO.',
    reqNo: 'AVN-2026-0042',
    carName: 'Mercedes-Benz E 200',
    carDates: 'Aug 10–15 · 5 days · AYT → AYT',
    carPrice: '€700',
    carPrepaid: '€210 prepaid ✓',
    whatsNext: 'WHAT’S NEXT',
    steps: [
      { state: 'done', badge: '✓', title: 'Request received', meta: 'just now' },
      {
        state: 'current',
        badge: '2',
        title: 'Manager confirmation',
        meta: 'within the hour · document check',
      },
      {
        state: 'upcoming',
        badge: '3',
        title: 'Contract & car handover',
        meta: 'Aug 10, 12:00 · Antalya Airport AYT',
      },
    ],
    downloadPdf: 'Download contract PDF',
    toAccount: 'To account',
    contractTag: 'Rental contract · PDF',
    fileName: 'Contract-AVN-2026-0042.pdf',
    btnDownload: 'Download',
    btnPrint: 'Print',
    brandKicker: 'PREMIUM CAR RENTAL · TURKEY',
    contractNoLabel: 'CONTRACT №',
    contractNo: 'AVN-2026-0042',
    contractTitle: 'VEHICLE RENTAL AGREEMENT',
    contractPlace: 'Antalya, Turkey · 09 August 2026',
    lessorLabel: 'LESSOR',
    lessorBody: ['AVENTA Rental LLC', 'Antalya, Konyaaltı', 'VKN 1234567890', '+90 555 000 00 00'],
    renterLabel: 'RENTER',
    renterBody: ['Ivan Petrov', 'Passport 75 1234567', 'Licence 99 AA 123456 (RU)', '+90 555 123 45 67'],
    s1Title: '1. SUBJECT OF THE AGREEMENT',
    subjectRows: [
      { label: 'Vehicle', value: 'Mercedes-Benz E 200, 2024' },
      { label: 'Period', value: '10.08.2026 12:00 — 15.08.2026 12:00' },
      { label: 'Pickup / return', value: 'Antalya Airport (AYT)' },
    ],
    s2Title: '2. COST',
    costRows: [
      { label: 'Rental 5 days × €120', value: '€600' },
      { label: 'Extra services', value: '€100' },
      { label: 'Total', value: '€700', total: true },
    ],
    depositRow: { label: 'Deposit', value: '€800' },
    s3Title: '3. CONDITIONS',
    conditions: [
      'Age 21+, 2+ years driving experience',
      'Limit 250 km/day, then €0.30/km',
      'Fuel “full → full”',
      'Insurance: extended, €300 deductible',
    ],
    signLessor: 'Lessor · AVENTA',
    signRenter: 'Renter · I. Petrov',
    eSignNote:
      'The contract is generated automatically from your request. It is signed on handover of the car.',
    notFoundTitle: 'Booking not found',
    notFoundBody:
      'We could not find a booking with this number. Check the link or open your bookings list in the account area.',
  },
  tr: {
    tagTitle: 'AVENTA — Rezervasyon başarılı + kiralama sözleşmesi (PDF)',
    tagSub: 'Talep sonrası son ekran · otomatik sözleşme · “deniz” teması',
    successTag: 'Talep kabul edildi',
    checkTitle: 'Talep kabul edildi!',
    checkBody:
      'Teşekkürler, Ivan. Bir yönetici onay için bir saat içinde sizinle iletişime geçecek. Ayrıntılar e-posta, Telegram ve WhatsApp ile gönderildi.',
    reqLabel: 'TALEP NO.',
    reqNo: 'AVN-2026-0042',
    carName: 'Mercedes-Benz E 200',
    carDates: '10–15 Ağu · 5 gün · AYT → AYT',
    carPrice: '€700',
    carPrepaid: '€210 ön ödeme ✓',
    whatsNext: 'SIRADA NE VAR',
    steps: [
      { state: 'done', badge: '✓', title: 'Talep alındı', meta: 'az önce' },
      {
        state: 'current',
        badge: '2',
        title: 'Yönetici onayı',
        meta: 'bir saat içinde · belge kontrolü',
      },
      {
        state: 'upcoming',
        badge: '3',
        title: 'Sözleşme ve araç teslimi',
        meta: '10 Ağu, 12:00 · Antalya Havalimanı AYT',
      },
    ],
    downloadPdf: 'Sözleşmeyi PDF olarak indir',
    toAccount: 'Hesaba git',
    contractTag: 'Kiralama sözleşmesi · PDF',
    fileName: 'Sözleşme-AVN-2026-0042.pdf',
    btnDownload: 'İndir',
    btnPrint: 'Yazdır',
    brandKicker: 'PREMIUM CAR RENTAL · TURKEY',
    contractNoLabel: 'SÖZLEŞME №',
    contractNo: 'AVN-2026-0042',
    contractTitle: 'ARAÇ KİRALAMA SÖZLEŞMESİ',
    contractPlace: 'Antalya, Türkiye · 09 Ağustos 2026',
    lessorLabel: 'KİRAYA VEREN',
    lessorBody: ['AVENTA Rental LLC', 'Antalya, Konyaaltı', 'VKN 1234567890', '+90 555 000 00 00'],
    renterLabel: 'KİRACI',
    renterBody: ['Ivan Petrov', 'Pasaport 75 1234567', 'Ehliyet 99 AA 123456 (RU)', '+90 555 123 45 67'],
    s1Title: '1. SÖZLEŞMENİN KONUSU',
    subjectRows: [
      { label: 'Araç', value: 'Mercedes-Benz E 200, 2024' },
      { label: 'Dönem', value: '10.08.2026 12:00 — 15.08.2026 12:00' },
      { label: 'Teslim alma / iade', value: 'Antalya Havalimanı (AYT)' },
    ],
    s2Title: '2. ÜCRET',
    costRows: [
      { label: 'Kiralama 5 gün × €120', value: '€600' },
      { label: 'Ek hizmetler', value: '€100' },
      { label: 'Toplam', value: '€700', total: true },
    ],
    depositRow: { label: 'Depozito', value: '€800' },
    s3Title: '3. KOŞULLAR',
    conditions: [
      '21+ yaş, 2+ yıl sürücü deneyimi',
      'Limit 250 km/gün, sonrası €0,30/km',
      'Yakıt “dolu → dolu”',
      'Sigorta: genişletilmiş, €300 muafiyet',
    ],
    signLessor: 'Kiraya veren · AVENTA',
    signRenter: 'Kiracı · I. Petrov',
    eSignNote:
      'Sözleşme, talebinizdeki bilgilerden otomatik olarak oluşturulur. Araç teslim edilirken imzalanır.',
    notFoundTitle: 'Rezervasyon bulunamadı',
    notFoundBody:
      'Bu numaraya sahip bir rezervasyon bulamadık. Bağlantıyı kontrol edin veya hesabınızdaki rezervasyon listenizi açın.',
  },
  es: {
    tagTitle: 'AVENTA — Reserva confirmada + contrato de alquiler (PDF)',
    tagSub: 'Pantalla final tras la solicitud · contrato automático · estilo “costero”',
    successTag: 'Solicitud aceptada',
    checkTitle: '¡Solicitud aceptada!',
    checkBody:
      'Gracias, Ivan. Un gestor se pondrá en contacto contigo en menos de una hora para confirmar. Los detalles se han enviado por correo electrónico, Telegram y WhatsApp.',
    reqLabel: 'N.º DE SOLICITUD',
    reqNo: 'AVN-2026-0042',
    carName: 'Mercedes-Benz E 200',
    carDates: '10–15 ago · 5 días · AYT → AYT',
    carPrice: '€700',
    carPrepaid: '€210 pagado por adelantado ✓',
    whatsNext: 'QUÉ SIGUE',
    steps: [
      { state: 'done', badge: '✓', title: 'Solicitud recibida', meta: 'ahora mismo' },
      {
        state: 'current',
        badge: '2',
        title: 'Confirmación del gestor',
        meta: 'en menos de una hora · verificación de documentos',
      },
      {
        state: 'upcoming',
        badge: '3',
        title: 'Contrato y entrega del vehículo',
        meta: '10 ago, 12:00 · Aeropuerto de Antalya AYT',
      },
    ],
    downloadPdf: 'Descargar contrato PDF',
    toAccount: 'Ir a la cuenta',
    contractTag: 'Contrato de alquiler · PDF',
    fileName: 'Contrato-AVN-2026-0042.pdf',
    btnDownload: 'Descargar',
    btnPrint: 'Imprimir',
    brandKicker: 'PREMIUM CAR RENTAL · TURKEY',
    contractNoLabel: 'CONTRATO №',
    contractNo: 'AVN-2026-0042',
    contractTitle: 'CONTRATO DE ALQUILER DE VEHÍCULO',
    contractPlace: 'Antalya, Turquía · 09 de agosto de 2026',
    lessorLabel: 'ARRENDADOR',
    lessorBody: ['AVENTA Rental LLC', 'Antalya, Konyaaltı', 'VKN 1234567890', '+90 555 000 00 00'],
    renterLabel: 'ARRENDATARIO',
    renterBody: ['Ivan Petrov', 'Pasaporte 75 1234567', 'Permiso 99 AA 123456 (RU)', '+90 555 123 45 67'],
    s1Title: '1. OBJETO DEL CONTRATO',
    subjectRows: [
      { label: 'Vehículo', value: 'Mercedes-Benz E 200, 2024' },
      { label: 'Periodo', value: '10.08.2026 12:00 — 15.08.2026 12:00' },
      { label: 'Recogida / devolución', value: 'Aeropuerto de Antalya (AYT)' },
    ],
    s2Title: '2. COSTE',
    costRows: [
      { label: 'Alquiler 5 días × €120', value: '€600' },
      { label: 'Servicios adicionales', value: '€100' },
      { label: 'Total', value: '€700', total: true },
    ],
    depositRow: { label: 'Depósito', value: '€800' },
    s3Title: '3. CONDICIONES',
    conditions: [
      'Edad 21+, 2+ años de experiencia al volante',
      'Límite 250 km/día, luego €0,30/km',
      'Combustible “lleno → lleno”',
      'Seguro: ampliado, €300 de franquicia',
    ],
    signLessor: 'Arrendador · AVENTA',
    signRenter: 'Arrendatario · I. Petrov',
    eSignNote:
      'El contrato se genera automáticamente a partir de tu solicitud. Se firma en el momento de la entrega del vehículo.',
    notFoundTitle: 'Reserva no encontrada',
    notFoundBody:
      'No pudimos encontrar ninguna reserva con este número. Comprueba el enlace o abre la lista de reservas en tu cuenta.',
  },
  de: {
    tagTitle: 'AVENTA — Buchung erfolgreich + Mietvertrag (PDF)',
    tagSub: 'Letzter Bildschirm nach der Anfrage · automatischer Vertrag · “maritimer” Stil',
    successTag: 'Anfrage angenommen',
    checkTitle: 'Anfrage angenommen!',
    checkBody:
      'Danke, Ivan. Ein Mitarbeiter kontaktiert Sie innerhalb einer Stunde zur Bestätigung. Die Details wurden per E-Mail, Telegram und WhatsApp gesendet.',
    reqLabel: 'ANFRAGE-NR.',
    reqNo: 'AVN-2026-0042',
    carName: 'Mercedes-Benz E 200',
    carDates: '10.–15. Aug · 5 Tage · AYT → AYT',
    carPrice: '€700',
    carPrepaid: '€210 vorausbezahlt ✓',
    whatsNext: 'WIE ES WEITERGEHT',
    steps: [
      { state: 'done', badge: '✓', title: 'Anfrage erhalten', meta: 'gerade eben' },
      {
        state: 'current',
        badge: '2',
        title: 'Bestätigung durch den Manager',
        meta: 'innerhalb einer Stunde · Dokumentenprüfung',
      },
      {
        state: 'upcoming',
        badge: '3',
        title: 'Vertrag & Fahrzeugübergabe',
        meta: '10. Aug, 12:00 · Flughafen Antalya AYT',
      },
    ],
    downloadPdf: 'Vertrag als PDF herunterladen',
    toAccount: 'Zum Konto',
    contractTag: 'Mietvertrag · PDF',
    fileName: 'Vertrag-AVN-2026-0042.pdf',
    btnDownload: 'Herunterladen',
    btnPrint: 'Drucken',
    brandKicker: 'PREMIUM CAR RENTAL · TURKEY',
    contractNoLabel: 'VERTRAG №',
    contractNo: 'AVN-2026-0042',
    contractTitle: 'FAHRZEUGMIETVERTRAG',
    contractPlace: 'Antalya, Türkei · 09. August 2026',
    lessorLabel: 'VERMIETER',
    lessorBody: ['AVENTA Rental LLC', 'Antalya, Konyaaltı', 'VKN 1234567890', '+90 555 000 00 00'],
    renterLabel: 'MIETER',
    renterBody: ['Ivan Petrov', 'Reisepass 75 1234567', 'Führerschein 99 AA 123456 (RU)', '+90 555 123 45 67'],
    s1Title: '1. VERTRAGSGEGENSTAND',
    subjectRows: [
      { label: 'Fahrzeug', value: 'Mercedes-Benz E 200, 2024' },
      { label: 'Zeitraum', value: '10.08.2026 12:00 — 15.08.2026 12:00' },
      { label: 'Abholung / Rückgabe', value: 'Flughafen Antalya (AYT)' },
    ],
    s2Title: '2. KOSTEN',
    costRows: [
      { label: 'Miete 5 Tage × €120', value: '€600' },
      { label: 'Zusatzleistungen', value: '€100' },
      { label: 'Gesamt', value: '€700', total: true },
    ],
    depositRow: { label: 'Kaution', value: '€800' },
    s3Title: '3. BEDINGUNGEN',
    conditions: [
      'Alter 21+, 2+ Jahre Fahrpraxis',
      'Limit 250 km/Tag, danach €0,30/km',
      'Kraftstoff “voll → voll”',
      'Versicherung: erweitert, €300 Selbstbeteiligung',
    ],
    signLessor: 'Vermieter · AVENTA',
    signRenter: 'Mieter · I. Petrov',
    eSignNote:
      'Der Vertrag wird automatisch aus Ihrer Anfrage erstellt. Er wird bei der Fahrzeugübergabe unterschrieben.',
    notFoundTitle: 'Buchung nicht gefunden',
    notFoundBody:
      'Wir konnten keine Buchung mit dieser Nummer finden. Prüfen Sie den Link oder öffnen Sie Ihre Buchungsliste im Kontobereich.',
  },
}

/* Company (lessor) block is a constant — verbatim from the design. */
const LESSOR_BODY: Dict<string[]> = {
  ru: ['AVENTA Rental LLC', 'Antalya, Konyaaltı', 'VKN 1234567890', '+90 555 000 00 00'],
  en: ['AVENTA Rental LLC', 'Antalya, Konyaaltı', 'VKN 1234567890', '+90 555 000 00 00'],
  tr: ['AVENTA Rental LLC', 'Antalya, Konyaaltı', 'VKN 1234567890', '+90 555 000 00 00'],
  es: ['AVENTA Rental LLC', 'Antalya, Konyaaltı', 'VKN 1234567890', '+90 555 000 00 00'],
  de: ['AVENTA Rental LLC', 'Antalya, Konyaaltı', 'VKN 1234567890', '+90 555 000 00 00'],
}

/* ------------------------------------------------------------------ *
 *  Merge live booking data over the demo dictionary. Returns the same
 *  `Strings` shape, so the render body below is untouched.
 * ------------------------------------------------------------------ */

function withBooking(base: Strings, b: SuccessBooking, lang: Lang): Strings {
  // Localized leftovers this file owns (the Dict<Strings> above is handled elsewhere). Every map
  // provides all five languages; `?? m.en` guarantees a missing language can never render undefined.
  const pick = <T,>(m: Record<Lang, T>): T => m[lang] ?? m.en
  const carLine = `${b.carName}, ${b.carYear}`
  // Recap payment note: prepaid shows the amount paid; "Payment after confirmation" only makes sense
  // BEFORE the booking is confirmed — a confirmed/active/completed/cancelled booking shows no such note.
  const bRank = (BOOKING_LIFECYCLE as string[]).indexOf(b.status)
  const isPreConfirm = bRank >= 0 && bRank < BOOKING_LIFECYCLE.indexOf('CONFIRMED')
  const prepaid =
    b.prepaidAmount > 0
      ? `${b.prepaidMoney} ${pick({
          ru: 'предоплата',
          en: 'prepaid',
          tr: 'ön ödeme',
          es: 'pagado por adelantado',
          de: 'vorausbezahlt',
        })} ✓`
      : isPreConfirm
        ? pick({
            ru: 'Оплата после подтверждения',
            en: 'Payment after confirmation',
            tr: 'Onaydan sonra ödeme',
            es: 'Pago tras la confirmación',
            de: 'Zahlung nach Bestätigung',
          })
        : ''

  const rentLabel = pick({
    ru: `Аренда ${b.days} сут × ${b.pricePerDayMoney}`,
    en: `Rental ${b.days} days × ${b.pricePerDayMoney}`,
    tr: `Kiralama ${b.days} gün × ${b.pricePerDayMoney}`,
    es: `Alquiler ${b.days} días × ${b.pricePerDayMoney}`,
    de: `Miete ${b.days} Tage × ${b.pricePerDayMoney}`,
  })

  const costRows: CostRow[] = [{ label: rentLabel, value: b.rentMoney }]
  if (b.extrasTotal > 0) {
    costRows.push({
      label: pick({
        ru: 'Доп. услуги',
        en: 'Extra services',
        tr: 'Ek hizmetler',
        es: 'Servicios adicionales',
        de: 'Zusatzleistungen',
      }),
      value: b.extrasMoney,
    })
  }
  if (b.insuranceTotal > 0) {
    costRows.push({
      label: pick({
        ru: 'Страховка',
        en: 'Insurance',
        tr: 'Sigorta',
        es: 'Seguro',
        de: 'Versicherung',
      }),
      value: b.insuranceMoney,
    })
  }
  costRows.push({
    label: pick({ ru: 'Итого', en: 'Total', tr: 'Toplam', es: 'Total', de: 'Gesamt' }),
    value: b.subtotalMoney,
    total: true,
  })

  // renter block: name + phone (+ optional passport/licence when present)
  const renterBody = [
    b.clientName,
    b.clientPassport ??
      pick({
        ru: 'Паспорт — уточняется',
        en: 'Passport — to be provided',
        tr: 'Pasaport — belirtilecek',
        es: 'Pasaporte — por indicar',
        de: 'Reisepass — wird nachgereicht',
      }),
    b.clientLicense ??
      pick({
        ru: 'ВУ — уточняется',
        en: 'Licence — to be provided',
        tr: 'Ehliyet — belirtilecek',
        es: 'Permiso — por indicar',
        de: 'Führerschein — wird nachgereicht',
      }),
    b.clientPhone ??
      pick({
        ru: 'Телефон — уточняется',
        en: 'Phone — to be provided',
        tr: 'Telefon — belirtilecek',
        es: 'Teléfono — por indicar',
        de: 'Telefon — wird nachgereicht',
      }),
  ]

  const stepMetaHandover =
    lang === 'ru'
      ? `${startShort(b.startISO, lang)} · ${b.pickupCode}`
      : `${startShort(b.startISO, lang)} · ${b.pickupCode}`

  const conditions = [...base.conditions]
  if (b.insuranceLabel) {
    // Only the field label is localized; the coverage value (b.insuranceLabel) is booking data, verbatim.
    conditions[conditions.length - 1] = `${pick({
      ru: 'Страховка',
      en: 'Insurance',
      tr: 'Sigorta',
      es: 'Seguro',
      de: 'Versicherung',
    })}: ${b.insuranceLabel.toLowerCase()}`
  }

  return {
    ...base,
    reqNo: b.number,
    carName: b.carName,
    carDates: b.datesLabel,
    carPrice: b.subtotalMoney,
    carPrepaid: prepaid,
    steps: [
      base.steps[0],
      base.steps[1],
      { ...base.steps[2], meta: stepMetaHandover },
    ],
    fileName: `${pick({
      ru: 'Договор',
      en: 'Contract',
      tr: 'Sözleşme',
      es: 'Contrato',
      de: 'Vertrag',
    })}-${b.number}.pdf`,
    contractNo: b.number,
    contractPlace: `${pick({
      ru: 'г. Анталия, Турция',
      en: 'Antalya, Turkey',
      tr: 'Antalya, Türkiye',
      es: 'Antalya, Turquía',
      de: 'Antalya, Türkei',
    })} · ${longDate(b.createdAtISO, lang)}`,
    lessorBody: LESSOR_BODY[lang] ?? LESSOR_BODY.en,
    renterBody,
    subjectRows: [
      {
        label: pick({
          ru: 'Автомобиль',
          en: 'Vehicle',
          tr: 'Araç',
          es: 'Vehículo',
          de: 'Fahrzeug',
        }),
        value: carLine,
      },
      {
        label: pick({ ru: 'Период', en: 'Period', tr: 'Dönem', es: 'Periodo', de: 'Zeitraum' }),
        value: b.periodLabel,
      },
      {
        label: pick({
          ru: 'Подача / возврат',
          en: 'Pickup / return',
          tr: 'Teslim alma / iade',
          es: 'Recogida / devolución',
          de: 'Abholung / Rückgabe',
        }),
        value: b.pickupAddress,
      },
    ],
    costRows,
    depositRow: {
      label: pick({ ru: 'Залог', en: 'Deposit', tr: 'Depozito', es: 'Depósito', de: 'Kaution' }),
      value: b.depositMoney,
    },
    conditions,
    signRenter: `${pick({
      ru: 'Арендатор',
      en: 'Renter',
      tr: 'Kiracı',
      es: 'Arrendatario',
      de: 'Mieter',
    })} · ${shortName(b.clientName)}`,
  }
}

const MONTHS_LONG: Record<Lang, string[]> = {
  ru: [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
  ],
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  tr: [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ],
  es: [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ],
  de: [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ],
}
const MONTHS_SHORT: Record<Lang, string[]> = {
  ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  tr: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

// Localized long date for the contract place-line. Month NAMES are translated per language; the
// day/month order + suffix follow each locale's own convention (matching the static contractPlace copy).
function longDate(iso: string, lang: Lang): string {
  const d = new Date(iso)
  const day = pad(d.getDate())
  const month = (MONTHS_LONG[lang] ?? MONTHS_LONG.en)[d.getMonth()]
  const year = d.getFullYear()
  switch (lang) {
    case 'ru':
      return `${day} ${month} ${year} г.`
    case 'es':
      return `${day} de ${month} de ${year}`
    case 'de':
      return `${day}. ${month} ${year}`
    default:
      return `${day} ${month} ${year}`
  }
}

// Localized short date + time for the handover step meta. Month NAMES are translated per language;
// English leads with the month, the others lead with the day (per locale convention).
function startShort(iso: string, lang: Lang): string {
  const d = new Date(iso)
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  const month = (MONTHS_SHORT[lang] ?? MONTHS_SHORT.en)[d.getMonth()]
  const day = d.getDate()
  switch (lang) {
    case 'en':
      return `${month} ${day}, ${time}`
    case 'de':
      return `${day}. ${month}, ${time}`
    default:
      return `${day} ${month}, ${time}`
  }
}

/** "Иван Петров" → "И. Петров"; single token returned as-is. */
function shortName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length < 2) return name
  return `${parts[0].charAt(0)}. ${parts.slice(1).join(' ')}`
}

/* ------------------------------------------------------------------ *
 *  Inline icons
 * ------------------------------------------------------------------ */

function CheckBig() {
  return (
    <svg
      width="46"
      height="46"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0f9d6f"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function DocIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M9 13l2 2 4-4" />
    </svg>
  )
}

function ShieldCheck() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0d9488"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}

/* Step-badge colours mirror the design's three states. */
const stepBadgeStyle: Record<TimelineStep['state'], CSSProperties> = {
  done: { background: '#0f9d6f', border: 'none', color: '#fff' },
  current: { background: 'rgba(251,109,76,.14)', border: '1.5px solid #fb6d4c', color: '#ef5c3a' },
  upcoming: { background: '#f6f8f8', border: '1.5px solid rgba(13,148,136,.28)', color: '#5b7678' },
}

/* ── Premium "contract" redesign (design_handoff_aventa_contract) — .rd design language ──
 * Scope class `.rdc` re-points --f-* to Space Grotesk / Manrope / JetBrains Mono so every existing
 * `var(--f-*)` in this file's inline styles renders in the new type system, and --av-bg to the rd bg.
 * Presentation only — all booking/status/print/payment logic is untouched. */
const SC_FONTS = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap'
const SUCCESS_CSS = `
.rdc{--ink:#0a2225;--muted:#5b7678;--muted-2:#8aa2a3;--bg:#eef6f5;--bg-2:#e7f1ef;--surface:#ffffff;--line:rgba(10,34,37,.10);--teal:#0d9488;--teal-700:#0f6d68;--teal-bright:#67e3d3;--accent:#fb6d4c;--accent-strong:#ef5c3a;--ok:#0f9d6f}
.rdc .av-cta{transition:transform .16s ease, box-shadow .16s ease, background .16s ease}
.rdc .av-cta:hover{transform:translateY(-1px)}
.rdc .sc-cols{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:22px;align-items:start}
.rdc .sc-side{position:sticky;top:86px;display:flex;flex-direction:column;gap:16px}
.rdc .sc-qa{transition:border-color .18s ease, background .18s ease, transform .18s ease}
.rdc .sc-qa:hover{border-color:var(--teal) !important;background:rgba(13,148,136,.07) !important;transform:translateX(3px)}
.rdc .sc-toolbtn{transition:background .16s ease}
.rdc .sc-toolbtn:hover{background:rgba(255,255,255,.16) !important}
.rdc .sc-mgrbtn{transition:filter .16s ease}
.rdc .sc-mgrbtn:hover{filter:brightness(.95)}
@keyframes scSheen{0%{transform:translateX(-130%)}58%,100%{transform:translateX(360%)}}
@keyframes scFloat{0%,100%{transform:translate(0,0)}50%{transform:translate(-14px,12px)}}
@keyframes scDot{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes scPop{0%{transform:scale(.4);opacity:0}60%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
@keyframes scPulse{0%{box-shadow:0 0 0 0 var(--st-glow)}70%,100%{box-shadow:0 0 0 12px transparent}}
.sc-sheen{animation:scSheen 3.8s ease-in-out infinite}
.sc-orb{animation:scFloat 16s ease-in-out infinite}
.sc-dot{animation:scDot 2s ease-in-out infinite}
.sc-pop{animation:scPop .55s cubic-bezier(.16,.84,.34,1) both}
.sc-pulse{animation:scPulse 2.2s ease-in-out infinite}
.sc-rail{transition:width 1.15s cubic-bezier(.16,.84,.34,1) .15s}
@keyframes avFloat{0%,100%{transform:translate(0,0)}50%{transform:translate(-12px,14px)}}
@keyframes avFloatSlow{0%,100%{transform:translate(0,0)}50%{transform:translate(16px,-18px)}}
@keyframes avRingPulse{0%{transform:scale(1);opacity:.5}100%{transform:scale(2);opacity:0}}
@keyframes avPop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.18)}100%{transform:scale(1);opacity:1}}
.scm-orb1{animation:avFloat 15s ease-in-out infinite}
.scm-orb2{animation:avFloatSlow 18s ease-in-out infinite}
.scm-halo{animation:avRingPulse 2.4s ease-out infinite}
.scm-pop{animation:avPop .6s cubic-bezier(.16,.84,.34,1) both}
.scm-sheet{transition:transform .42s cubic-bezier(.16,.84,.34,1)}
.rdc .scm-qa{transition:transform .15s ease}
.rdc .scm-qa:active{transform:scale(.96)}
.rdc .scm-press:active{transform:scale(.985)}
@media (max-width:1080px){.rdc .sc-cols{grid-template-columns:1fr !important}.rdc .sc-side{position:static !important}}
@media (max-width:560px){.sc-stats{grid-template-columns:1fr 1fr !important}.sc-vehrow{flex-wrap:wrap}.sc-tl-sub{display:none}}
@media (prefers-reduced-motion:reduce){.sc-sheen,.sc-orb,.sc-dot,.sc-pop,.sc-pulse,.scm-orb1,.scm-orb2,.scm-halo,.scm-pop{animation:none !important}}
`

/* Per-status accent theme = the design's re-pointed --st* vars (applyStatusVars in the handoff):
 * accepted/awaiting→teal, confirmed/active→green, completed→muted, cancelled→coral.
 * Drives the hero bar/orb/icon tile, status pill, timeline nodes + rail, and the sidebar accents. */
type ScTheme = { c: string; soft: string; line: string; deep: string; glow: string }
const scThemeByKind: Record<'accepted' | 'confirmed' | 'active' | 'completed' | 'cancelled', ScTheme> = {
  accepted:  { c: '#0d9488', soft: 'rgba(13,148,136,.12)', line: 'rgba(13,148,136,.30)', deep: '#0b5457', glow: 'rgba(13,148,136,.35)' },
  confirmed: { c: '#0f9d6f', soft: 'rgba(16,185,129,.12)', line: 'rgba(16,185,129,.30)', deep: '#0a6b4d', glow: 'rgba(16,185,129,.35)' },
  active:    { c: '#0f9d6f', soft: 'rgba(16,185,129,.12)', line: 'rgba(16,185,129,.30)', deep: '#0a6b4d', glow: 'rgba(16,185,129,.35)' },
  completed: { c: '#5b7678', soft: 'rgba(91,118,120,.13)', line: 'rgba(91,118,120,.28)', deep: '#3d5254', glow: 'rgba(138,162,163,.35)' },
  cancelled: { c: '#ef5c3a', soft: 'rgba(251,109,76,.12)', line: 'rgba(251,109,76,.30)', deep: '#b23c22', glow: 'rgba(251,109,76,.34)' },
}

/* 5-language dict for the two-column contract redesign (hero stat strip, vehicle strip, horizontal
 * timeline, how-to-pay / quick-actions / manager sidebar, cancelled state). Reuses the main `t` dict
 * for the contract paper + download/print/whatsNext copy; only genuinely-new labels live here. */
type ScStrings = {
  vehicle: string; period: string; contractTotal: string; orderValue: string; prepaid: string; depositDue: string; charged: string
  yourVehicle: string; dates: string; route: string
  done: string; inProgress: string; upcoming: string
  rentalContract: string; autoGen: string; draft: string
  howToPay: string; depositPaid: string; balanceReturn: string; noteConfirmed: string; orderTotal: string; noteAwaiting: string
  paidInFull: string; paidNote: string; goPay: string; payDeposit: string
  quickActions: string; downloadPdf: string; printContract: string; addCal: string
  yourManager: string; online: string; contact: string
  noPayment: string; cxBody: string; browse: string; rebook: string
}
const scDict: Record<Lang, ScStrings> = {
  ru: {
    vehicle: 'Автомобиль', period: 'Период', contractTotal: 'Сумма договора', orderValue: 'Сумма заказа', prepaid: 'Оплачено', depositDue: 'К оплате', charged: 'Списано',
    yourVehicle: 'Ваш автомобиль', dates: 'Даты', route: 'Маршрут',
    done: 'Готово', inProgress: 'В процессе', upcoming: 'Ожидается',
    rentalContract: 'Договор аренды', autoGen: 'Сгенерировано · скачать или печать', draft: 'ЧЕРНОВИК',
    howToPay: 'Оплата', depositPaid: 'Депозит оплачен', balanceReturn: 'Остаток при возврате', noteConfirmed: 'Остаток — при возврате авто. Можно оплатить раньше в любой момент.', orderTotal: 'Сумма заказа', noteAwaiting: 'Оплатите депозит, чтобы ускорить подтверждение. Менеджер проверит документы до выдачи.',
    paidInFull: 'Оплачено полностью', paidNote: 'Оплата по этой брони получена. Дополнительных действий не требуется.', goPay: 'К оплате', payDeposit: 'Оплатить депозит',
    quickActions: 'Быстрые действия', downloadPdf: 'Скачать договор PDF', printContract: 'Печать договора', addCal: 'Добавить в календарь',
    yourManager: 'Ваш менеджер', online: 'Онлайн · ответит за ~5 мин', contact: 'Связаться',
    noPayment: 'Оплата не списана', cxBody: 'Договор по этой брони не оформлялся, оплата не производилась. Вы можете выбрать авто и оформить новую бронь в любое время — ваши данные сохранены.', browse: 'Выбрать авто', rebook: 'Забронировать снова',
  },
  en: {
    vehicle: 'Vehicle', period: 'Period', contractTotal: 'Contract total', orderValue: 'Order value', prepaid: 'Prepaid', depositDue: 'Deposit due', charged: 'Charged',
    yourVehicle: 'Your vehicle', dates: 'Dates', route: 'Route',
    done: 'Done', inProgress: 'In progress', upcoming: 'Upcoming',
    rentalContract: 'Rental contract', autoGen: 'Auto-generated · download or print', draft: 'DRAFT',
    howToPay: 'How to pay', depositPaid: 'Deposit paid', balanceReturn: 'Balance on return', noteConfirmed: 'The balance is due at car return. You can settle early any time.', orderTotal: 'Order total', noteAwaiting: 'Pay the deposit to speed up confirmation. A manager verifies your documents before handover.',
    paidInFull: 'Paid in full', paidNote: 'We’ve received payment for this booking. Nothing more to do here.', goPay: 'Go to Payments', payDeposit: 'Pay deposit',
    quickActions: 'Quick actions', downloadPdf: 'Download contract PDF', printContract: 'Print contract', addCal: 'Add handover to calendar',
    yourManager: 'Your manager', online: 'Online · replies in ~5 min', contact: 'Contact',
    noPayment: 'No payment taken', cxBody: 'No contract was issued for this booking and no charge was made. You can browse the fleet and start a new reservation any time — your details are still on file.', browse: 'Browse cars', rebook: 'Book again',
  },
  tr: {
    vehicle: 'Araç', period: 'Dönem', contractTotal: 'Sözleşme toplamı', orderValue: 'Sipariş tutarı', prepaid: 'Ön ödeme', depositDue: 'Ödenecek', charged: 'Tahsil edildi',
    yourVehicle: 'Aracınız', dates: 'Tarihler', route: 'Güzergah',
    done: 'Tamam', inProgress: 'Devam ediyor', upcoming: 'Yakında',
    rentalContract: 'Kira sözleşmesi', autoGen: 'Otomatik oluşturuldu · indir veya yazdır', draft: 'TASLAK',
    howToPay: 'Nasıl ödenir', depositPaid: 'Depozito ödendi', balanceReturn: 'İade sırasında kalan', noteConfirmed: 'Kalan tutar araç iadesinde ödenir. İstediğiniz zaman erken ödeyebilirsiniz.', orderTotal: 'Sipariş toplamı', noteAwaiting: 'Onayı hızlandırmak için depozitoyu ödeyin. Teslimattan önce yönetici belgelerinizi doğrular.',
    paidInFull: 'Tamamı ödendi', paidNote: 'Bu rezervasyon için ödemeyi aldık. Başka işlem gerekmez.', goPay: 'Ödemeye git', payDeposit: 'Depozito öde',
    quickActions: 'Hızlı işlemler', downloadPdf: 'Sözleşmeyi PDF indir', printContract: 'Sözleşmeyi yazdır', addCal: 'Teslimi takvime ekle',
    yourManager: 'Yöneticiniz', online: 'Çevrimiçi · ~5 dk içinde yanıt', contact: 'İletişim',
    noPayment: 'Ödeme alınmadı', cxBody: 'Bu rezervasyon için sözleşme düzenlenmedi ve ücret alınmadı. İstediğiniz zaman araç seçip yeni rezervasyon yapabilirsiniz — bilgileriniz kayıtlı.', browse: 'Araçlara göz at', rebook: 'Tekrar rezerve et',
  },
  es: {
    vehicle: 'Vehículo', period: 'Período', contractTotal: 'Total del contrato', orderValue: 'Importe del pedido', prepaid: 'Pagado', depositDue: 'A pagar', charged: 'Cobrado',
    yourVehicle: 'Tu vehículo', dates: 'Fechas', route: 'Ruta',
    done: 'Hecho', inProgress: 'En curso', upcoming: 'Próximo',
    rentalContract: 'Contrato de alquiler', autoGen: 'Generado automáticamente · descargar o imprimir', draft: 'BORRADOR',
    howToPay: 'Cómo pagar', depositPaid: 'Depósito pagado', balanceReturn: 'Saldo a la devolución', noteConfirmed: 'El saldo se paga al devolver el coche. Puedes liquidarlo antes cuando quieras.', orderTotal: 'Total del pedido', noteAwaiting: 'Paga el depósito para acelerar la confirmación. Un gestor verifica tus documentos antes de la entrega.',
    paidInFull: 'Pagado por completo', paidNote: 'Hemos recibido el pago de esta reserva. No hay nada más que hacer aquí.', goPay: 'Ir a Pagos', payDeposit: 'Pagar depósito',
    quickActions: 'Acciones rápidas', downloadPdf: 'Descargar contrato PDF', printContract: 'Imprimir contrato', addCal: 'Añadir entrega al calendario',
    yourManager: 'Tu gestor', online: 'En línea · responde en ~5 min', contact: 'Contacto',
    noPayment: 'No se cobró nada', cxBody: 'No se emitió contrato para esta reserva ni se realizó ningún cargo. Puedes explorar la flota y empezar una nueva reserva cuando quieras — tus datos siguen guardados.', browse: 'Ver coches', rebook: 'Reservar de nuevo',
  },
  de: {
    vehicle: 'Fahrzeug', period: 'Zeitraum', contractTotal: 'Vertragssumme', orderValue: 'Bestellwert', prepaid: 'Angezahlt', depositDue: 'Zu zahlen', charged: 'Belastet',
    yourVehicle: 'Ihr Fahrzeug', dates: 'Daten', route: 'Route',
    done: 'Erledigt', inProgress: 'In Bearbeitung', upcoming: 'Demnächst',
    rentalContract: 'Mietvertrag', autoGen: 'Automatisch erstellt · herunterladen oder drucken', draft: 'ENTWURF',
    howToPay: 'Zahlung', depositPaid: 'Kaution bezahlt', balanceReturn: 'Restbetrag bei Rückgabe', noteConfirmed: 'Der Restbetrag ist bei Fahrzeugrückgabe fällig. Sie können jederzeit früher zahlen.', orderTotal: 'Bestellsumme', noteAwaiting: 'Zahlen Sie die Kaution, um die Bestätigung zu beschleunigen. Ein Mitarbeiter prüft Ihre Dokumente vor der Übergabe.',
    paidInFull: 'Vollständig bezahlt', paidNote: 'Wir haben die Zahlung für diese Buchung erhalten. Hier ist nichts weiter zu tun.', goPay: 'Zu den Zahlungen', payDeposit: 'Kaution zahlen',
    quickActions: 'Schnellaktionen', downloadPdf: 'Vertrag als PDF', printContract: 'Vertrag drucken', addCal: 'Übergabe zum Kalender',
    yourManager: 'Ihr Betreuer', online: 'Online · antwortet in ~5 Min', contact: 'Kontakt',
    noPayment: 'Keine Zahlung erfolgt', cxBody: 'Für diese Buchung wurde kein Vertrag erstellt und keine Zahlung vorgenommen. Sie können jederzeit die Flotte durchsuchen und neu buchen — Ihre Daten sind gespeichert.', browse: 'Autos ansehen', rebook: 'Erneut buchen',
  },
}

/* ------------------------------------------------------------------ */

const flowDict: Record<Lang, { s1t: string; s1s: string; s2t: string; s2s: string; s3t: string; s3s: string }> = {
  ru: {
    s1t: 'Заявка принята', s1s: 'Что дальше — по шагам',
    s2t: 'Ваш договор', s2s: 'Сформирован автоматически — скачайте или распечатайте',
    s3t: 'Как оплатить', s3s: 'Внесите предоплату и приложите чек об оплате',
  },
  en: {
    s1t: 'Request accepted', s1s: 'Here’s what happens next',
    s2t: 'Your contract', s2s: 'Auto-generated for this booking — download or print',
    s3t: 'How to pay', s3s: 'Pay the deposit and attach your receipt',
  },
  tr: {
    s1t: 'Talep kabul edildi', s1s: 'İşte sıradaki adımlar',
    s2t: 'Sözleşmeniz', s2s: 'Bu rezervasyon için otomatik oluşturuldu — indirin veya yazdırın',
    s3t: 'Nasıl ödenir', s3s: 'Depozitoyu ödeyin ve makbuzunuzu ekleyin',
  },
  es: {
    s1t: 'Solicitud aceptada', s1s: 'Esto es lo que sigue',
    s2t: 'Tu contrato', s2s: 'Generado automáticamente para esta reserva — descárgalo o imprímelo',
    s3t: 'Cómo pagar', s3s: 'Paga el depósito y adjunta tu comprobante',
  },
  de: {
    s1t: 'Anfrage angenommen', s1s: 'So geht es weiter',
    s2t: 'Ihr Vertrag', s2s: 'Automatisch für diese Buchung erstellt — herunterladen oder drucken',
    s3t: 'So bezahlen Sie', s3s: 'Zahlen Sie die Kaution und fügen Sie Ihren Beleg bei',
  },
}

/**
 * Status-aware hero copy for the Details view. The page is reused for EVERY booking status, so it must
 * not always say "request accepted": a confirmed/completed/cancelled booking gets its own framing.
 * (NEW / AWAITING_CONFIRMATION / AWAITING_PAYMENT keep the existing "request accepted" copy.)
 */
const statusHeroDict: Record<Lang, {
  confirmedTitle: string; confirmedBody: string; confirmedSub: string
  activeTitle: string; activeBody: string; activeSub: string
  completedTitle: string; completedBody: string; completedSub: string
  cancelledTitle: string; cancelledBody: string; cancelledSub: string
}> = {
  ru: {
    confirmedTitle: 'Бронирование подтверждено', confirmedBody: 'Ваше бронирование подтверждено. Договор — ниже; проверка документов и выдача авто проходят как обычно.', confirmedSub: 'Бронирование подтверждено',
    activeTitle: 'Аренда активна', activeBody: 'Аренда активна — счастливой дороги. Договор — ниже.', activeSub: 'Аренда активна',
    completedTitle: 'Аренда завершена', completedBody: 'Эта аренда завершена. Договор остаётся доступен ниже.', completedSub: 'Аренда завершена',
    cancelledTitle: 'Бронирование отменено', cancelledBody: 'Это бронирование отменено. Договор и оплата не требуются.', cancelledSub: 'Бронирование отменено',
  },
  en: {
    confirmedTitle: 'Booking confirmed', confirmedBody: 'Your booking is confirmed. Your contract is below; document verification and car handover happen as usual.', confirmedSub: 'Your booking is confirmed',
    activeTitle: 'Rental active', activeBody: 'Your rental is active — enjoy the road. Your contract is below.', activeSub: 'Your rental is active',
    completedTitle: 'Rental completed', completedBody: 'This rental is complete. Your contract remains available below.', completedSub: 'This rental is complete',
    cancelledTitle: 'Booking cancelled', cancelledBody: 'This booking has been cancelled. No contract or payment is required.', cancelledSub: 'This booking was cancelled',
  },
  tr: {
    confirmedTitle: 'Rezervasyon onaylandı', confirmedBody: 'Rezervasyonunuz onaylandı. Sözleşmeniz aşağıda; belge doğrulama ve araç teslimi her zamanki gibi yapılır.', confirmedSub: 'Rezervasyonunuz onaylandı',
    activeTitle: 'Kiralama aktif', activeBody: 'Kiralamanız aktif — iyi yolculuklar. Sözleşmeniz aşağıda.', activeSub: 'Kiralamanız aktif',
    completedTitle: 'Kiralama tamamlandı', completedBody: 'Bu kiralama tamamlandı. Sözleşmeniz aşağıda mevcut kalır.', completedSub: 'Bu kiralama tamamlandı',
    cancelledTitle: 'Rezervasyon iptal edildi', cancelledBody: 'Bu rezervasyon iptal edildi. Sözleşme veya ödeme gerekmez.', cancelledSub: 'Bu rezervasyon iptal edildi',
  },
  es: {
    confirmedTitle: 'Reserva confirmada', confirmedBody: 'Tu reserva está confirmada. Tu contrato está abajo; la verificación de documentos y la entrega del coche se realizan como de costumbre.', confirmedSub: 'Tu reserva está confirmada',
    activeTitle: 'Alquiler activo', activeBody: 'Tu alquiler está activo — buen viaje. Tu contrato está abajo.', activeSub: 'Tu alquiler está activo',
    completedTitle: 'Alquiler completado', completedBody: 'Este alquiler ha finalizado. Tu contrato sigue disponible abajo.', completedSub: 'Este alquiler ha finalizado',
    cancelledTitle: 'Reserva cancelada', cancelledBody: 'Esta reserva ha sido cancelada. No se requiere contrato ni pago.', cancelledSub: 'Esta reserva fue cancelada',
  },
  de: {
    confirmedTitle: 'Buchung bestätigt', confirmedBody: 'Ihre Buchung ist bestätigt. Ihr Vertrag steht unten; Dokumentenprüfung und Fahrzeugübergabe erfolgen wie gewohnt.', confirmedSub: 'Ihre Buchung ist bestätigt',
    activeTitle: 'Miete aktiv', activeBody: 'Ihre Miete ist aktiv — gute Fahrt. Ihr Vertrag steht unten.', activeSub: 'Ihre Miete ist aktiv',
    completedTitle: 'Miete abgeschlossen', completedBody: 'Diese Miete ist abgeschlossen. Ihr Vertrag bleibt unten verfügbar.', completedSub: 'Diese Miete ist abgeschlossen',
    cancelledTitle: 'Buchung storniert', cancelledBody: 'Diese Buchung wurde storniert. Kein Vertrag und keine Zahlung erforderlich.', cancelledSub: 'Diese Buchung wurde storniert',
  },
}

/** Red ✕ used in the hero when a booking is cancelled (mirrors CheckBig). */
function CrossBig() {
  return (
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#ef5c3a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

/** A numbered section header marking one step of the confirmation → contract → payment flow. */
function FlowHeader({ n, title, sub, accent }: { n: number; title: string; sub: string; accent: string }) {
  return (
    <div className="av-no-print" style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 16 }}>
      <span style={{ flexShrink: 0, width: 34, height: 34, borderRadius: '50%', background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 15px var(--f-display)', boxShadow: '0 8px 18px -10px rgba(6,33,38,.55)' }}>{n}</span>
      <div>
        <div style={{ font: '800 19px var(--f-display)', color: '#0a2225', lineHeight: 1.1 }}>{title}</div>
        <div style={{ marginTop: 2, font: '600 12px var(--f-mono)', color: '#5b7678' }}>{sub}</div>
      </div>
    </div>
  )
}

const SC_ZOOMS = [0.8, 0.9, 1, 1.15, 1.3, 1.5]

export default function Success({
  booking = null,
  notFound = false,
  support = null,
  shellUser = null,
}: {
  booking?: SuccessBooking | null
  notFound?: boolean
  support?: SuccessSupport | null
  shellUser?: SuccessShellUser | null
}) {
  const { lang } = useLang()
  const base = useDict(dict)
  const isMobile = useIsMobile()
  // Contract-viewer zoom (design toolbar − 100% +). Hook must run before the early empty-state return.
  const [zoom, setZoom] = useState(1)
  // Mobile: the contract opens in a slide-up sheet (default zoom 0.6 per the mobile handoff).
  const [contractOpen, setContractOpen] = useState(false)
  const zoomIn = () => setZoom((z) => SC_ZOOMS[Math.min(SC_ZOOMS.length - 1, SC_ZOOMS.indexOf(z) + 1)] ?? 1)
  const zoomOut = () => setZoom((z) => SC_ZOOMS[Math.max(0, SC_ZOOMS.indexOf(z) - 1)] ?? 1)
  const t = booking ? withBooking(base, booking, lang) : base
  // Profile chip for the shared left-sidebar shell (falls back to a neutral identity if not provided).
  const shell = shellUser ?? { fullName: 'AVENTA', initial: 'A', tierName: 'SILVER' }
  // Payment moved OFF this page → the Payments surface (bottom-nav / account). Here we only show a
  // clear status + a pointer so nobody is stranded. `paidSoFar` = deposit already captured (card
  // bookings), `owed` = balance still due (bank/crypto owe the deposit; card bookings owe the rest).
  const paidSoFar = booking?.prepaidAmount ?? 0
  const owed = booking?.balanceAmount ?? 0

  const print = () => {
    if (typeof window !== 'undefined') window.print()
  }
  // Real PDF endpoint (may be added later); window.print() stays as the working fallback.
  const pdfHref = booking ? `/api/contract/${booking.number}` : undefined

  const monoTag: CSSProperties = { font: "700 13px var(--f-mono)", color: '#5b7678' }
  const f = flowDict[lang] ?? flowDict.en

  // No valid booking (opened without a `?b=` reference, or the number didn't match) → a clean, honest
  // empty state. We must NEVER fabricate booking data / personal information here.
  if (!booking) {
    return (
      <AccountShell active="bookings" user={shell} title={t.notFoundTitle}>
        <div style={{ maxWidth: 620, margin: '0 auto', padding: 'clamp(24px,4vw,56px) clamp(18px,3vw,40px) 80px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid #f7d9d0', borderRadius: 18, padding: '32px 28px', boxShadow: '0 18px 40px -26px rgba(6,33,38,.4)', textAlign: 'center' }}>
            <div aria-hidden style={{ fontSize: 34 }}>🔍</div>
            <div style={{ marginTop: 10, font: '800 20px var(--f-display)', color: 'var(--ink)' }}>{t.notFoundTitle}</div>
            <p style={{ margin: '10px auto 0', maxWidth: 420, font: '500 14px/1.6 var(--f-ui)', color: 'var(--muted)' }}>{t.notFoundBody}</p>
            <Link
              href="/account"
              style={{ marginTop: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 22px', background: 'var(--accent)', color: '#fff', borderRadius: 12, font: '700 13px var(--f-ui)', textDecoration: 'none', boxShadow: '0 14px 28px -10px rgba(251,109,76,.7)' }}
            >
              {t.toAccount}
            </Link>
          </div>
        </div>
      </AccountShell>
    )
  }

  // Status-aware framing (booking is non-null past the guard above): the Details view is reused for
  // EVERY booking status, so the hero + which sections render adapt to booking.status. A cancelled
  // booking is not "accepted" — it has no contract and no payment.
  const sh = statusHeroDict[lang] ?? statusHeroDict.en
  const status = booking.status
  const heroKind =
    status === 'CANCELLED' ? 'cancelled'
    : status === 'RETURNED' || status === 'CLOSED' ? 'completed'
    : status === 'DELIVERED' || status === 'ACTIVE' ? 'active'
    : status === 'CONFIRMED' || status === 'PREPARING' ? 'confirmed'
    : 'accepted'
  const showContract = status !== 'CANCELLED'
  const showPayment = status !== 'CANCELLED' && status !== 'RETURNED' && status !== 'CLOSED' && owed > 0
  const heroByKind = {
    accepted:  { cross: false, bg: 'linear-gradient(180deg,#e7f1ef,#d7ebe8)', accent: 'linear-gradient(135deg,#0d9488,#0f6d68)', title: t.checkTitle, body: t.checkBody, sub: f.s1s },
    confirmed: { cross: false, bg: 'linear-gradient(180deg,#D6F4E4,#B2E8CB)', accent: 'linear-gradient(135deg,#0f9d6f,#0f9d6f)', title: sh.confirmedTitle, body: sh.confirmedBody, sub: sh.confirmedSub },
    active:    { cross: false, bg: 'linear-gradient(180deg,#D2F0F5,#AEE3EC)', accent: 'linear-gradient(135deg,#0d9488,#0f6d68)', title: sh.activeTitle, body: sh.activeBody, sub: sh.activeSub },
    completed: { cross: false, bg: 'linear-gradient(180deg,#E6EEF0,#D2DEE2)', accent: 'linear-gradient(135deg,#5b7678,#7A9AA2)', title: sh.completedTitle, body: sh.completedBody, sub: sh.completedSub },
    cancelled: { cross: true,  bg: 'linear-gradient(180deg,#F5E4E4,#E9CFCF)', accent: 'linear-gradient(135deg,#d24a2c,#ef5c3a)', title: sh.cancelledTitle, body: sh.cancelledBody, sub: sh.cancelledSub },
  }
  const hero = heroByKind[heroKind]

  // WHAT'S NEXT step states derived from the ACTUAL lifecycle position (not hardcoded): step 1 (request
  // received) is always done; step 2 (manager confirmation) becomes done once CONFIRMED; step 3 (contract
  // & car handover) becomes done once DELIVERED. So a confirmed booking shows step 2 done + step 3 current,
  // and an active/returned rental shows every step done — never "awaiting manager confirmation".
  const rank = (BOOKING_LIFECYCLE as string[]).indexOf(status)
  const stepDone = [true, rank >= BOOKING_LIFECYCLE.indexOf('CONFIRMED'), rank >= BOOKING_LIFECYCLE.indexOf('DELIVERED')]
  const firstPending = stepDone.indexOf(false)
  const flowSteps = t.steps.map((step, i) => {
    const done = stepDone[i]
    const state: 'done' | 'current' | 'upcoming' = done ? 'done' : i === firstPending ? 'current' : 'upcoming'
    return { ...step, state, badge: done ? '✓' : String(i + 1) }
  })

      const st = scThemeByKind[heroKind]
  const sc = scDict[lang] ?? scDict.en
  const isCancelled = heroKind === 'cancelled'
  const notCancelled = !isCancelled
  const isDraft = heroKind === 'accepted'
  const fullyPaid = owed <= 0
  const pctPaid = booking.subtotal > 0 ? Math.round((paidSoFar / booking.subtotal) * 100) : 0

  // Re-point the design's --st* accent vars for this status onto the state wrapper (like applyStatusVars).
  const stVars = {
    ['--st' as any]: st.c,
    ['--st-soft' as any]: st.soft,
    ['--st-line' as any]: st.line,
    ['--st-deep' as any]: st.deep,
    ['--st-glow' as any]: st.glow,
  } as CSSProperties

  // 4-cell hero stat strip (Vehicle / Period / Contract-total / Prepaid-or-Due), mapped to real money.
  const heroStats: { label: string; value: string; big: boolean; color: string }[] = [
    { label: sc.vehicle, value: t.carName, big: false, color: 'var(--ink)' },
    { label: sc.period, value: booking.periodLong, big: false, color: 'var(--ink)' },
    isCancelled
      ? { label: sc.orderValue, value: booking.subtotalMoney, big: true, color: 'var(--muted)' }
      : { label: sc.contractTotal, value: booking.subtotalMoney, big: true, color: 'var(--ink)' },
    isCancelled
      ? { label: sc.charged, value: booking.prepaidMoney, big: true, color: 'var(--st-deep)' }
      : heroKind === 'accepted'
        ? { label: sc.depositDue, value: owed > 0 ? booking.balanceMoney : booking.depositMoney, big: true, color: '#b7791f' }
        : paidSoFar > 0
          ? { label: `${sc.prepaid} · ${pctPaid}%`, value: booking.prepaidMoney, big: true, color: 'var(--st-deep)' }
          : { label: sc.depositDue, value: booking.balanceMoney, big: true, color: '#b7791f' },
  ]

  // Horizontal timeline fill-rail width (design: frac × (100 − 100/n), rail inset 1/6 each side).
  const tlActiveIdx = flowSteps.findIndex((s) => s.state === 'current')
  const tlAllDone = flowSteps.every((s) => s.state === 'done')
  const tlN = flowSteps.length || 3
  const tlFrac = tlAllDone ? 1 : tlActiveIdx >= 0 ? tlActiveIdx / (tlN - 1) : 0
  const railW = `${(tlFrac * (100 - 100 / tlN)).toFixed(2)}%`

  // Build & download a real .ics for the car handover (design "Add handover to calendar").
  const addToCalendar = () => {
    if (typeof window === 'undefined' || !booking) return
    const dt = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AVENTA//Rental//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', 'UID:' + booking.number + '@aventa.rent', 'DTSTAMP:' + dt(booking.createdAtISO), 'DTSTART:' + dt(booking.startISO), 'DTEND:' + dt(booking.endISO), 'SUMMARY:AVENTA · ' + booking.carName, 'LOCATION:' + booking.pickupAddress, 'DESCRIPTION:AVENTA rental ' + booking.number, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
    try {
      const blob = new Blob([ics], { type: 'text/calendar' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'AVENTA-' + booking.number + '.ics'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      /* ignore */
    }
  }

  const qaBtn: CSSProperties = { display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', border: '1.5px solid var(--line)', borderRadius: 12, background: 'var(--surface)', color: 'var(--ink)', font: '600 13.5px var(--f-ui)', cursor: 'pointer', textAlign: 'left', width: '100%', textDecoration: 'none' }

  // ═══════════════════════ MOBILE — dedicated single-screen contract app ═══════════════════════
  if (isMobile) {
    const mPayMode = heroKind === 'accepted' && owed > 0
    const contractFile = `Contract-${booking.number}.pdf`
    const tapView = ({ en: 'Tap to view · download · print', ru: 'Открыть · скачать · печать', tr: 'Görüntüle · indir · yazdır', es: 'Ver · descargar · imprimir', de: 'Ansehen · herunterladen · drucken' } as Record<string, string>)[lang] ?? 'Tap to view · download · print'
    const check = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
    return (
      <div
        className="rdc scm"
        style={{
          ['--f-display' as any]: "'Space Grotesk',sans-serif",
          ['--f-ui' as any]: "'Manrope',sans-serif",
          ['--f-mono' as any]: "'JetBrains Mono',monospace",
          ['--st' as any]: st.c,
          ['--st-soft' as any]: st.soft,
          ['--st-line' as any]: st.line,
          ['--st-deep' as any]: st.deep,
          ['--st-glow' as any]: st.glow,
          position: 'fixed', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', background: '#05191d',
        } as CSSProperties}
      >
        <link rel="stylesheet" href={SC_FONTS} />
        <style dangerouslySetInnerHTML={{ __html: SUCCESS_CSS }} />
        <style>{`@media print{body{background:#fff}.scm-noprint{display:none!important}.scm-paper{position:static!important;box-shadow:none!important;zoom:1!important;width:100%!important}}`}</style>

        {/* ── scroll area ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
          {/* HERO */}
          <header style={{ position: 'relative', overflow: 'hidden', padding: '52px 20px 58px', background: 'radial-gradient(130% 120% at 80% 2%,#0f7173 0%,#0a4247 46%,#05191d 100%)', color: '#fff' }}>
            <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg,rgba(255,255,255,.045) 0 1.5px,transparent 1.5px 22px)', opacity: 0.5, pointerEvents: 'none' }} />
            <div className="scm-orb1" aria-hidden style={{ position: 'absolute', top: '-16%', right: '-14%', width: 230, height: 230, borderRadius: '50%', background: 'radial-gradient(circle,var(--st-glow),transparent 62%)', filter: 'blur(26px)', pointerEvents: 'none' }} />
            <div className="scm-orb2" aria-hidden style={{ position: 'absolute', bottom: '-30%', left: '-20%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,rgba(251,109,76,.26),transparent 64%)', filter: 'blur(30px)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link href="/account" style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.16)', display: 'grid', placeItems: 'center', color: '#fff', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </Link>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '600 9.5px var(--f-mono)', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--teal-bright)' }}>{t.reqLabel}</div>
                <div style={{ font: '600 13px var(--f-mono)', letterSpacing: '.04em', color: '#fff', marginTop: 2 }}>{t.reqNo}</div>
              </div>
              <span style={{ display: 'inline-flex' }}><LangToggle glass /></span>
            </div>

            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: 22 }}>
              <span className="scm-pop" style={{ position: 'relative', width: 72, height: 72, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', color: 'var(--st)', boxShadow: '0 14px 30px -12px rgba(0,0,0,.5)' }}>
                <span className="scm-halo" aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--st-soft)' }} />
                {isCancelled ? (
                  <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative' }}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative' }}><path d="M20 6 9 17l-5-5" /></svg>
                )}
              </span>
              <h1 style={{ font: '700 25px var(--f-display)', letterSpacing: '-.01em', color: '#fff', margin: '18px 0 0' }}>{hero.title}</h1>
              <p style={{ font: '500 13.5px/1.5 var(--f-ui)', color: 'rgba(255,255,255,.78)', margin: '8px 0 0', maxWidth: 300 }}>{hero.sub}</p>
            </div>
          </header>

          {/* SHEET */}
          <div style={{ position: 'relative', marginTop: -34, borderRadius: '26px 26px 0 0', background: 'var(--bg)', padding: '8px 16px 26px', minHeight: 200 }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--line)', margin: '0 auto 16px' }} />

            {/* vehicle + facts card */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 14px 36px -26px rgba(6,33,38,.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '16px 16px 14px' }}>
                <div aria-hidden style={{ width: 78, height: 56, borderRadius: 12, background: 'linear-gradient(135deg,#0b4f52,#0a3438)', flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ font: '600 9.5px var(--f-mono)', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>{sc.yourVehicle}</div>
                  <div style={{ font: '700 17px var(--f-display)', color: 'var(--ink)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.carName}</div>
                  <div style={{ font: '500 12px var(--f-ui)', color: 'var(--muted)', marginTop: 1 }}>{booking.carClass}</div>
                </div>
                <span style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: 'var(--st-soft)', color: 'var(--st-deep)', font: '600 9.5px var(--f-mono)', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>
                  <span className="sc-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--st)' }} />{hero.sub}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--line)', borderTop: '1px solid var(--line)' }}>
                <div style={{ background: 'var(--surface)', padding: '13px 16px' }}>
                  <span style={{ display: 'block', font: '600 9.5px var(--f-mono)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>{sc.dates}</span>
                  <span style={{ display: 'block', font: '700 14px var(--f-display)', color: 'var(--ink)', marginTop: 5 }}>{booking.periodLong}</span>
                </div>
                <div style={{ background: 'var(--surface)', padding: '13px 16px' }}>
                  <span style={{ display: 'block', font: '600 9.5px var(--f-mono)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>{isCancelled ? sc.orderValue : sc.contractTotal}</span>
                  <span style={{ display: 'block', font: '700 16px var(--f-display)', color: 'var(--ink)', marginTop: 5 }}>{booking.subtotalMoney}</span>
                </div>
              </div>
            </div>

            {notCancelled && (
              <>
                {/* vertical timeline */}
                <div style={{ marginTop: 14, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, padding: '18px 18px 6px', boxShadow: '0 14px 36px -26px rgba(6,33,38,.5)' }}>
                  <div style={{ font: '600 10px var(--f-mono)', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>{t.whatsNext}</div>
                  {flowSteps.map((step, i) => {
                    const done = step.state === 'done'
                    const active = step.state === 'current'
                    const last = i === flowSteps.length - 1
                    return (
                      <div key={step.title} style={{ display: 'flex', gap: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                          <span className={active ? 'sc-pulse' : undefined} style={{ width: 38, height: 38, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, background: done ? 'var(--st)' : 'var(--surface)', border: done ? 'none' : active ? '2.5px solid var(--st)' : '2px solid var(--line)', color: done ? '#fff' : active ? 'var(--st)' : 'var(--muted-2)', boxShadow: done ? '0 8px 18px -8px var(--st)' : 'none' }}>
                            {done ? check : <span style={{ font: '700 15px var(--f-display)' }}>{i + 1}</span>}
                          </span>
                          {!last && <span style={{ width: 2.5, flex: 1, minHeight: 20, borderRadius: 3, background: done ? 'var(--st)' : 'var(--line)' }} />}
                        </div>
                        <div style={{ paddingBottom: 16, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ font: '700 15px var(--f-display)', color: done || active ? 'var(--ink)' : 'var(--muted-2)' }}>{step.title}</span>
                            <span style={{ padding: '3px 9px', borderRadius: 999, font: '600 8.5px var(--f-mono)', letterSpacing: '.08em', textTransform: 'uppercase', ...(done || active ? { background: 'var(--st-soft)', color: 'var(--st-deep)' } : { background: 'var(--bg-2)', color: 'var(--muted-2)' }) }}>{done ? sc.done : active ? sc.inProgress : sc.upcoming}</span>
                          </div>
                          <div style={{ font: '500 12.5px/1.45 var(--f-ui)', color: 'var(--muted)', marginTop: 3 }}>{step.meta}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* contract card (opens the slide-up sheet) */}
                <button type="button" onClick={() => setContractOpen(true)} className="scm-press" style={{ width: '100%', textAlign: 'left', marginTop: 14, background: 'linear-gradient(180deg,#0c2e31,#082226)', border: 'none', borderRadius: 20, padding: 16, cursor: 'pointer', boxShadow: '0 18px 40px -26px rgba(6,33,38,.7)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                    <div aria-hidden style={{ position: 'relative', width: 52, height: 66, borderRadius: 7, background: '#fff', flexShrink: 0, overflow: 'hidden', boxShadow: '0 6px 14px -6px rgba(0,0,0,.5)' }}>
                      <div style={{ position: 'absolute', top: 8, left: 7, right: 7, height: 4, borderRadius: 2, background: 'var(--teal)' }} />
                      <div style={{ position: 'absolute', top: 16, left: 7, width: 22, height: 3, borderRadius: 2, background: '#c9d3d3' }} />
                      <div style={{ position: 'absolute', top: 23, left: 7, right: 7, height: 2, background: '#e6ebeb' }} />
                      <div style={{ position: 'absolute', top: 28, left: 7, right: 7, height: 2, background: '#e6ebeb' }} />
                      <div style={{ position: 'absolute', top: 33, left: 7, right: 20, height: 2, background: '#e6ebeb' }} />
                      <div style={{ position: 'absolute', bottom: 8, left: 7, width: 16, height: 6, borderRadius: 2, background: 'var(--accent)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: '600 9.5px var(--f-mono)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--teal-bright)' }}>{sc.rentalContract}</div>
                      <div style={{ font: '500 12.5px var(--f-mono)', color: '#fff', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contractFile}</div>
                      <div style={{ font: '500 11.5px var(--f-ui)', color: 'rgba(255,255,255,.6)', marginTop: 3 }}>{tapView}</div>
                    </div>
                    <span style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(255,255,255,.1)', display: 'grid', placeItems: 'center', color: '#fff', flexShrink: 0 }}>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
                    </span>
                  </div>
                </button>

                {/* how to pay */}
                <div style={{ marginTop: 14, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, padding: 18, boxShadow: '0 14px 36px -26px rgba(6,33,38,.5)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ font: '600 10px var(--f-mono)', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>{sc.howToPay}</span>
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="var(--muted-2)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                  </div>
                  {heroKind === 'accepted' ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 13px', borderRadius: 12, background: 'rgba(245,180,0,.14)', marginTop: 12 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: '600 13px var(--f-ui)', color: '#b7791f' }}>
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>{sc.depositDue}
                        </span>
                        <span style={{ font: '700 15px var(--f-display)', color: '#b7791f' }}>{owed > 0 ? booking.balanceMoney : booking.depositMoney}</span>
                      </div>
                      <p style={{ font: '500 12px/1.5 var(--f-ui)', color: 'var(--muted)', margin: '10px 3px 0' }}>{sc.noteAwaiting}</p>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 13px', borderRadius: 12, background: 'var(--ok-soft)', marginTop: 12 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: '600 13px var(--f-ui)', color: 'var(--ok)' }}>
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>{sc.depositPaid}
                        </span>
                        <span style={{ font: '700 15px var(--f-display)', color: 'var(--ok)' }}>{booking.prepaidMoney}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 13px 2px' }}>
                        <span style={{ font: '500 13px var(--f-ui)', color: 'var(--muted)' }}>{sc.balanceReturn}</span>
                        <span style={{ font: '700 16px var(--f-display)', color: 'var(--ink)' }}>{booking.balanceMoney}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* quick actions */}
                <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { label: sc.downloadPdf, onClick: print, icon: <><path d="M12 15V3" /><path d="m7 10 5 5 5-5" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /></> },
                    { label: sc.printContract, onClick: print, icon: <><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /></> },
                    { label: sc.addCal, onClick: addToCalendar, icon: <><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></> },
                  ].map((a) => (
                    <button key={a.label} type="button" onClick={a.onClick} className="scm-qa" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '15px 8px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, cursor: 'pointer' }}>
                      <span style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--teal-soft)', color: 'var(--teal)', display: 'grid', placeItems: 'center' }}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{a.icon}</svg>
                      </span>
                      <span style={{ font: '600 11.5px var(--f-ui)', color: 'var(--ink)', textAlign: 'center', lineHeight: 1.25 }}>{a.label}</span>
                    </button>
                  ))}
                </div>

                {/* manager */}
                {support && (support.whatsappHref || support.telegramHref || support.phone || support.email) && (
                  <div style={{ position: 'relative', overflow: 'hidden', marginTop: 14, background: 'linear-gradient(155deg,#fff2ee,#ffe4dc)', border: '1px solid rgba(251,109,76,.2)', borderRadius: 20, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ position: 'relative', width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent-strong))', display: 'grid', placeItems: 'center', color: '#fff', font: '700 18px var(--f-display)', flexShrink: 0 }}>
                        {support.name.trim().charAt(0).toUpperCase() || 'A'}
                        <span style={{ position: 'absolute', right: -1, bottom: -1, width: 12, height: 12, borderRadius: '50%', background: 'var(--ok)', border: '2.5px solid #fff2ee' }} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ font: '600 9.5px var(--f-mono)', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--accent-strong)' }}>{sc.yourManager}</div>
                        <div style={{ font: '700 16px var(--f-display)', color: 'var(--ink)', marginTop: 2 }}>{support.name}</div>
                        <div style={{ font: '500 11.5px var(--f-ui)', color: 'var(--muted)' }}>{sc.online}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: support.whatsappHref && support.telegramHref ? '1fr 1fr' : '1fr', gap: 9, marginTop: 14 }}>
                      {support.whatsappHref && (
                        <a href={support.whatsappHref} target="_blank" rel="noopener noreferrer" className="sc-mgrbtn" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 11, borderRadius: 12, background: '#25d366', color: '#fff', font: '700 13px var(--f-display)', textDecoration: 'none' }}>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.01c-.24.68-1.4 1.3-1.94 1.38-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-2.99 0-1.42.75-2.12 1.01-2.41.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.41-.07.65.5.24.57.82 1.99.89 2.13.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.16-.19.69-.8.87-1.08.18-.28.36-.23.61-.14.25.09 1.6.75 1.87.89.28.14.46.21.53.33.07.12.07.68-.17 1.36Z" /></svg>WhatsApp
                        </a>
                      )}
                      {support.telegramHref && (
                        <a href={support.telegramHref} target="_blank" rel="noopener noreferrer" className="sc-mgrbtn" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 11, borderRadius: 12, background: '#229ed9', color: '#fff', font: '700 13px var(--f-display)', textDecoration: 'none' }}>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M21.94 4.6 18.6 20.3c-.25 1.1-.9 1.38-1.83.86l-5.05-3.72-2.44 2.35c-.27.27-.5.5-1.02.5l.36-5.16 9.4-8.49c.4-.36-.09-.56-.63-.2L5.15 13.1l-5-1.57c-1.09-.34-1.1-1.09.23-1.61l19.55-7.53c.9-.34 1.7.2 1.41 1.61Z" /></svg>Telegram
                        </a>
                      )}
                      {!support.whatsappHref && !support.telegramHref && (support.phone || support.email) && (
                        <a href={support.phone ? `tel:${support.phone}` : `mailto:${support.email}`} className="sc-mgrbtn" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 11, borderRadius: 12, background: 'var(--accent)', color: '#fff', font: '700 13px var(--f-display)', textDecoration: 'none' }}>{support.phone || support.email}</a>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {isCancelled && (
              <div style={{ marginTop: 14, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, padding: 18, boxShadow: '0 14px 36px -26px rgba(6,33,38,.5)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 13px', borderRadius: 11, background: 'var(--st-soft)', color: 'var(--st-deep)', font: '600 13px var(--f-ui)' }}>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>{sc.noPayment}
                </span>
                <p style={{ font: '500 13.5px/1.6 var(--f-ui)', color: 'var(--muted)', margin: '14px 0 0' }}>{sc.cxBody}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── sticky bottom action bar ── */}
        <div className="scm-noprint" style={{ flexShrink: 0, position: 'relative', zIndex: 5, padding: '12px 16px calc(env(safe-area-inset-bottom,0px) + 14px)', background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderTop: '1px solid var(--line)' }}>
          {isCancelled ? (
            <Link href="/catalog" className="scm-press" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 15, borderRadius: 14, background: 'var(--accent)', color: '#fff', font: '700 15px var(--f-display)', textDecoration: 'none', boxShadow: '0 12px 26px -12px var(--accent)' }}>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>{sc.rebook}
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              {mPayMode ? (
                <Link href="/account/payments" className="scm-press" style={{ position: 'relative', overflow: 'hidden', flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 15, borderRadius: 14, background: 'var(--accent)', color: '#fff', font: '700 15px var(--f-display)', textDecoration: 'none', boxShadow: '0 12px 26px -12px var(--accent)' }}>
                  <span className="sc-sheen" aria-hidden style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '55%', background: 'linear-gradient(100deg,transparent,rgba(255,255,255,.32),transparent)', pointerEvents: 'none' }} />
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative' }}><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                  <span style={{ position: 'relative' }}>{sc.payDeposit}</span>
                </Link>
              ) : pdfHref ? (
                <a href={pdfHref} target="_blank" rel="noreferrer" className="scm-press" style={{ position: 'relative', overflow: 'hidden', flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 15, borderRadius: 14, background: 'var(--accent)', color: '#fff', font: '700 15px var(--f-display)', textDecoration: 'none', boxShadow: '0 12px 26px -12px var(--accent)' }}>
                  <span className="sc-sheen" aria-hidden style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '55%', background: 'linear-gradient(100deg,transparent,rgba(255,255,255,.32),transparent)', pointerEvents: 'none' }} />
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative' }}><path d="M12 15V3" /><path d="m7 10 5 5 5-5" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /></svg>
                  <span style={{ position: 'relative' }}>{t.downloadPdf}</span>
                </a>
              ) : (
                <button type="button" onClick={print} className="scm-press" style={{ position: 'relative', overflow: 'hidden', flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 15, border: 'none', borderRadius: 14, background: 'var(--accent)', color: '#fff', font: '700 15px var(--f-display)', cursor: 'pointer', boxShadow: '0 12px 26px -12px var(--accent)' }}>
                  <span className="sc-sheen" aria-hidden style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '55%', background: 'linear-gradient(100deg,transparent,rgba(255,255,255,.32),transparent)', pointerEvents: 'none' }} />
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative' }}><path d="M12 15V3" /><path d="m7 10 5 5 5-5" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /></svg>
                  <span style={{ position: 'relative' }}>{t.downloadPdf}</span>
                </button>
              )}
              <Link href="/account" style={{ width: 52, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: 14, border: '1.5px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}>
                <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></svg>
              </Link>
            </div>
          )}
        </div>

        {/* ── contract slide-up sheet ── */}
        {notCancelled && (
          <>
            <div onClick={() => setContractOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(4,20,23,.55)', opacity: contractOpen ? 1 : 0, pointerEvents: contractOpen ? 'auto' : 'none', transition: 'opacity .32s' }} />
            <div className="scm-sheet" style={{ position: 'fixed', inset: 0, zIndex: 81, display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg,#0c2e31,#082226)', transform: contractOpen ? 'translateY(0)' : 'translateY(101%)', pointerEvents: contractOpen ? 'auto' : 'none' }}>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: 'calc(env(safe-area-inset-top,0px) + 14px) 16px 14px', borderBottom: '1px solid rgba(255,255,255,.08)', background: '#0c2e31' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--teal-bright)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v5h5" /></svg>
                <span style={{ flex: 1, font: '500 12px var(--f-mono)', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contractFile}</span>
                <button type="button" onClick={zoomOut} style={{ width: 30, height: 30, border: 'none', borderRadius: 8, background: 'rgba(255,255,255,.08)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14" /></svg></button>
                <button type="button" onClick={zoomIn} style={{ width: 30, height: 30, border: 'none', borderRadius: 8, background: 'rgba(255,255,255,.08)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg></button>
                <button type="button" onClick={() => setContractOpen(false)} style={{ width: 30, height: 30, border: 'none', borderRadius: 8, background: 'rgba(255,255,255,.14)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg></button>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '18px 14px calc(env(safe-area-inset-bottom,0px) + 18px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', background: 'repeating-linear-gradient(135deg,rgba(255,255,255,.02) 0 2px,transparent 2px 24px)' }}>
                <div className="scm-paper" style={{ zoom: Math.min(zoom, 0.85), position: 'relative', width: 560, flexShrink: 0, background: '#fff', color: '#141b1c', borderRadius: 3, padding: '40px 42px 36px', boxShadow: '0 20px 46px -18px rgba(0,0,0,.5)', fontFamily: 'var(--f-ui)' }}>
                  {isDraft && <span aria-hidden style={{ position: 'absolute', top: '46%', left: '50%', transform: 'translate(-50%,-50%) rotate(-24deg)', font: '700 110px var(--f-display)', color: 'rgba(13,148,136,.07)', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 0 }}>{sc.draft}</span>}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <LogoMark size={32} variant="onTeal" />
                        <div>
                          <div style={{ font: '700 16px var(--f-display)', letterSpacing: '.12em', color: '#0a2225' }}>AVENTA</div>
                          <div style={{ font: '600 8px var(--f-mono)', letterSpacing: '.14em', color: '#8aa2a3', marginTop: 1 }}>{t.brandKicker}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ font: '600 8px var(--f-mono)', letterSpacing: '.12em', color: '#8aa2a3' }}>{t.contractNoLabel}</div>
                        <div style={{ font: '700 14px var(--f-display)', color: '#0d9488', marginTop: 2 }}>{t.contractNo}</div>
                      </div>
                    </div>
                    <div style={{ height: 2, background: '#0d9488', margin: '16px 0 18px', borderRadius: 2 }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ font: '700 17px var(--f-display)', color: '#0a2225' }}>{t.contractTitle}</div>
                      <div style={{ font: '500 11px var(--f-ui)', color: '#5b7678', marginTop: 4 }}>{t.contractPlace}</div>
                    </div>
                    <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
                      <PartyBlock label={t.lessorLabel} lines={t.lessorBody} />
                      <PartyBlock label={t.renterLabel} lines={t.renterBody} />
                    </div>
                    <SectionLabel style={{ marginTop: 22, marginBottom: 9 }}>{t.s1Title}</SectionLabel>
                    <div style={{ border: '1px solid #e6ebeb', borderRadius: 6, overflow: 'hidden' }}>
                      {t.subjectRows.map((row, i) => (
                        <div key={row.label} style={{ display: 'flex', borderBottom: i === t.subjectRows.length - 1 ? 'none' : '1px solid #eef1f1' }}>
                          <span style={{ width: 120, flexShrink: 0, padding: '8px 11px', background: '#f6f8f8', font: '500 11px var(--f-ui)', color: '#5b7678' }}>{row.label}</span>
                          <span style={{ flex: 1, padding: '8px 11px', font: '600 12px var(--f-ui)', color: '#141b1c' }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
                      <div>
                        <SectionLabel style={{ marginBottom: 9 }}>{t.s2Title}</SectionLabel>
                        <div>
                          {t.costRows.map((row) => row.total ? (
                            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0 4px', marginTop: 3, borderTop: '2px solid #0a2225' }}>
                              <span style={{ font: '700 12.5px var(--f-display)', color: '#0a2225' }}>{row.label}</span>
                              <span style={{ font: '700 14px var(--f-display)', color: '#0a2225', whiteSpace: 'nowrap' }}>{row.value}</span>
                            </div>
                          ) : (
                            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '4px 0', font: '500 11.5px var(--f-ui)', color: '#33474a', borderBottom: '1px dashed #eef1f1' }}>
                              <span>{row.label}</span><span style={{ fontWeight: 600, color: '#141b1c', whiteSpace: 'nowrap' }}>{row.value}</span>
                            </div>
                          ))}
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '3px 0', font: '500 11.5px var(--f-ui)', color: '#5b7678' }}>
                            <span>{t.depositRow.label}</span><span style={{ fontWeight: 600, color: '#141b1c' }}>{t.depositRow.value}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <SectionLabel style={{ marginBottom: 9 }}>{t.s3Title}</SectionLabel>
                        <div>
                          {t.conditions.map((c) => (
                            <div key={c} style={{ display: 'flex', gap: 7, padding: '3px 0', font: '500 11px/1.5 var(--f-ui)', color: '#33474a' }}>
                              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#0d9488" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M20 6 9 17l-5-5" /></svg>
                              <span>{c}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <SignatureLine caption={t.signLessor} />
                      <SignatureLine caption={t.signRenter} />
                    </div>
                    <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 9, background: 'var(--st-soft)', color: 'var(--st-deep)' }}>
                      <ShieldCheck />
                      <span style={{ font: '500 11px/1.45 var(--f-ui)', color: 'var(--st-deep)' }}>{t.eSignNote}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ flexShrink: 0, display: 'flex', gap: 10, padding: '12px 16px calc(env(safe-area-inset-bottom,0px) + 12px)', borderTop: '1px solid rgba(255,255,255,.08)', background: '#0c2e31' }}>
                <button type="button" onClick={print} style={{ width: 52, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: 12, border: 'none', background: 'rgba(255,255,255,.08)', color: '#fff', cursor: 'pointer' }}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /></svg></button>
                {pdfHref ? (
                  <a href={pdfHref} target="_blank" rel="noreferrer" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 13, borderRadius: 12, background: 'var(--accent)', color: '#fff', font: '700 14.5px var(--f-display)', textDecoration: 'none' }}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3" /><path d="m7 10 5 5 5-5" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /></svg>{t.btnDownload}</a>
                ) : (
                  <button type="button" onClick={print} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 13, border: 'none', borderRadius: 12, background: 'var(--accent)', color: '#fff', font: '700 14.5px var(--f-display)', cursor: 'pointer' }}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3" /><path d="m7 10 5 5 5-5" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /></svg>{t.btnDownload}</button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <AccountShell active="bookings" user={shell} title={booking.number}>
      <div
        className="rdc"
        style={{
          overflowX: 'clip',
          ['--f-display' as any]: "'Space Grotesk',sans-serif",
          ['--f-ui' as any]: "'Manrope',sans-serif",
          ['--f-mono' as any]: "'JetBrains Mono',monospace",
          background: 'var(--bg)',
        } as CSSProperties}
      >
        <link rel="stylesheet" href={SC_FONTS} />
        <style dangerouslySetInnerHTML={{ __html: SUCCESS_CSS }} />
        {/* print rules: hide chrome + dark PDF wrapper, print only the white sheet */}
        <style>{`
          @media print {
            body { background: #fff; }
            .av-no-print { display: none !important; }
            .av-print-area { box-shadow: none !important; border-radius: 0 !important; padding: 0 !important; background: #fff !important; border: none !important; }
            .av-pdf-scroll { max-height: none !important; overflow: visible !important; padding: 0 !important; background: #fff !important; display: block !important; }
            .av-print-area .av-pdf-sheet { box-shadow: none !important; border-radius: 0 !important; max-width: none !important; width: 100% !important; zoom: 1 !important; }
          }
        `}</style>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(20px,3vw,40px) clamp(18px,3vw,40px) 64px' }}>
          <div style={stVars}>

            {/* ═══════════ STATUS HERO ═══════════ */}
            <section className="av-no-print" style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 22, boxShadow: '0 1px 2px rgba(6,33,38,.04),0 26px 56px -38px rgba(6,33,38,.55)' }}>
              <span className="sc-orb" aria-hidden style={{ position: 'absolute', top: -90, right: -40, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,var(--st-glow),transparent 68%)', filter: 'blur(10px)', opacity: 0.5, pointerEvents: 'none' }} />
              <span aria-hidden style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: 'var(--st)' }} />
              <div style={{ position: 'relative', padding: '28px 32px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
                  <span className="sc-pop" style={{ flexShrink: 0, width: 64, height: 64, borderRadius: 18, background: 'var(--st-soft)', color: 'var(--st)', display: 'grid', placeItems: 'center' }}>
                    {isCancelled ? (
                      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    )}
                  </span>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <h1 style={{ font: '700 clamp(24px,3vw,32px) var(--f-display)', letterSpacing: '-.02em', color: 'var(--ink)', margin: 0 }}>{hero.title}</h1>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 999, background: 'var(--st-soft)', color: 'var(--st-deep)', font: '600 10.5px var(--f-mono)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                        <span className="sc-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--st)' }} />{hero.sub}
                      </span>
                    </div>
                    <p style={{ font: '500 15px/1.55 var(--f-ui)', color: 'var(--muted)', margin: '9px 0 0', maxWidth: 640 }}>{hero.body}</p>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '7px 13px', borderRadius: 10, border: '1px dashed var(--line)', background: 'var(--bg)', font: '600 12px var(--f-mono)', color: 'var(--muted)' }}>
                      {t.reqLabel}<span style={{ color: 'var(--st-deep)', letterSpacing: '.04em' }}>{t.reqNo}</span>
                    </span>
                  </div>
                </div>
                {/* stat strip */}
                <div className="sc-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, marginTop: 24, background: 'var(--line)', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden' }}>
                  {heroStats.map((s, i) => (
                    <div key={i} style={{ background: 'var(--surface)', padding: '15px 18px' }}>
                      <span style={{ display: 'block', font: '600 10.5px var(--f-mono)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>{s.label}</span>
                      <span style={{ display: 'block', font: `700 ${s.big ? '23px' : '17px'} var(--f-display)`, color: s.color, marginTop: 6, letterSpacing: '-.01em', lineHeight: 1.15, whiteSpace: s.big ? 'nowrap' : 'normal', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ═══════════ CONFIRMED / AWAITING ═══════════ */}
            {notCancelled && (
              <>
                {/* vehicle strip */}
                <section className="av-no-print sc-vehrow" style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18, padding: '16px 18px', marginTop: 18, boxShadow: '0 1px 2px rgba(6,33,38,.04),0 20px 44px -36px rgba(6,33,38,.5)' }}>
                  <div aria-hidden style={{ width: 112, height: 74, borderRadius: 12, background: 'linear-gradient(135deg,#0b4f52,#0a3438)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <span style={{ font: '600 10.5px var(--f-mono)', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>{sc.yourVehicle}</span>
                    <div style={{ font: '700 19px var(--f-display)', color: 'var(--ink)', marginTop: 3 }}>{t.carName}</div>
                    <div style={{ font: '500 13px var(--f-ui)', color: 'var(--muted)', marginTop: 2 }}>{booking.carClass}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
                    <div><span style={{ display: 'block', font: '600 10px var(--f-mono)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>{sc.dates}</span><span style={{ display: 'block', font: '700 14px var(--f-ui)', color: 'var(--ink)', marginTop: 4 }}>{booking.periodLong}</span></div>
                    <div><span style={{ display: 'block', font: '600 10px var(--f-mono)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>{sc.route}</span><span style={{ display: 'block', font: '700 14px var(--f-ui)', color: 'var(--ink)', marginTop: 4 }}>{booking.routeText}</span></div>
                  </div>
                </section>

                {/* horizontal timeline */}
                <section className="av-no-print" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, padding: '24px 26px', marginTop: 18, boxShadow: '0 1px 2px rgba(6,33,38,.04),0 22px 50px -36px rgba(6,33,38,.5)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 22 }}>
                    <span style={{ font: '600 11px var(--f-mono)', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)' }}>{t.whatsNext}</span>
                    <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                  </div>
                  <div style={{ position: 'relative', padding: '8px 4px 2px' }}>
                    <div style={{ position: 'absolute', left: '16.667%', right: '16.667%', top: 28, height: 3, borderRadius: 3, background: 'var(--line)' }} />
                    <div className="sc-rail" style={{ position: 'absolute', left: '16.667%', top: 28, height: 3, width: railW, borderRadius: 3, background: 'var(--st)', boxShadow: '0 0 10px var(--st-glow)' }} />
                    <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
                      {flowSteps.map((step, i) => {
                        const done = step.state === 'done'
                        const active = step.state === 'current'
                        const nodeBase: CSSProperties = { position: 'relative', zIndex: 1, display: 'grid', placeItems: 'center', width: 44, height: 44, borderRadius: '50%' }
                        const nodeStyle: CSSProperties = done
                          ? { ...nodeBase, background: 'var(--st)', color: '#fff', boxShadow: '0 10px 22px -8px var(--st)' }
                          : active
                            ? { ...nodeBase, background: 'var(--surface)', color: 'var(--st)', border: '2.5px solid var(--st)' }
                            : { ...nodeBase, background: 'var(--surface)', color: 'var(--muted-2)', border: '2px solid var(--line)' }
                        const chipStyle: CSSProperties = { marginTop: 12, padding: '3px 10px', borderRadius: 999, font: '600 9px var(--f-mono)', letterSpacing: '.1em', textTransform: 'uppercase', ...(active || done ? { background: 'var(--st-soft)', color: 'var(--st-deep)' } : { background: 'var(--bg-2)', color: 'var(--muted-2)' }) }
                        return (
                          <div key={step.title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 10px' }}>
                            <span className={active ? 'sc-pulse' : undefined} style={nodeStyle}>
                              {done ? (
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                              ) : (
                                <span style={{ font: '700 16px var(--f-display)', color: active ? 'var(--st)' : 'var(--muted-2)' }}>{i + 1}</span>
                              )}
                            </span>
                            <span style={chipStyle}>{done ? sc.done : active ? sc.inProgress : sc.upcoming}</span>
                            <div style={{ font: '700 15px var(--f-display)', color: done || active ? 'var(--ink)' : 'var(--muted-2)', marginTop: 9 }}>{step.title}</div>
                            <div className="sc-tl-sub" style={{ font: '500 12.5px/1.45 var(--f-ui)', color: 'var(--muted)', marginTop: 3 }}>{step.meta}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </section>

                {/* two-column body */}
                <div className="sc-cols" style={{ marginTop: 18 }}>

                  {/* LEFT: contract viewer */}
                  <div>
                  <div className="av-no-print" style={{ display: 'flex', alignItems: 'center', gap: 11, margin: '0 2px 12px' }}>
                    <span style={{ font: '600 11px var(--f-mono)', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)' }}>{sc.rentalContract}</span>
                    <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                    <span style={{ font: '500 12.5px var(--f-ui)', color: 'var(--muted-2)' }}>{sc.autoGen}</span>
                  </div>
                  <section className="av-print-area" style={{ background: 'linear-gradient(180deg,#0c2e31,#082226)', border: '1px solid rgba(4,20,23,.5)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 30px 70px -34px rgba(6,33,38,.7)' }}>
                    <div className="av-no-print" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--teal-bright)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v5h5" /></svg>
                        <span style={{ font: '500 12px var(--f-mono)', color: 'rgba(255,255,255,.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Contract-{booking.number}.pdf</span>
                      </span>
                      <span style={{ flex: 1 }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,.06)', borderRadius: 9, padding: 3 }}>
                        <button type="button" onClick={zoomOut} title="Zoom out" className="sc-toolbtn" style={{ width: 28, height: 28, border: 'none', borderRadius: 7, background: 'transparent', color: 'rgba(255,255,255,.8)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
                        </button>
                        <span style={{ minWidth: 44, textAlign: 'center', font: '500 11.5px var(--f-mono)', color: 'rgba(255,255,255,.9)' }}>{Math.round(zoom * 100)}%</span>
                        <button type="button" onClick={zoomIn} title="Zoom in" className="sc-toolbtn" style={{ width: 28, height: 28, border: 'none', borderRadius: 7, background: 'transparent', color: 'rgba(255,255,255,.8)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                        </button>
                      </div>
                      <button type="button" onClick={print} title={t.btnPrint} className="sc-toolbtn av-cta" style={{ width: 32, height: 32, border: 'none', borderRadius: 8, background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.85)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /></svg>
                      </button>
                      {pdfHref ? (
                        <a href={pdfHref} target="_blank" rel="noreferrer" className="av-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '0 13px', height: 32, border: 'none', borderRadius: 8, background: 'var(--accent)', color: '#fff', font: '700 12.5px var(--f-display)', cursor: 'pointer', textDecoration: 'none', boxShadow: '0 8px 18px -8px var(--accent)' }}>
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3" /><path d="m7 10 5 5 5-5" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /></svg>{t.btnDownload}
                        </a>
                      ) : (
                        <button type="button" onClick={print} className="av-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '0 13px', height: 32, border: 'none', borderRadius: 8, background: 'var(--accent)', color: '#fff', font: '700 12.5px var(--f-display)', cursor: 'pointer', boxShadow: '0 8px 18px -8px var(--accent)' }}>
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3" /><path d="m7 10 5 5 5-5" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /></svg>{t.btnDownload}
                        </button>
                      )}
                    </div>

                    <div className="av-pdf-scroll" style={{ maxHeight: 660, overflow: 'auto', padding: 26, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'repeating-linear-gradient(135deg,rgba(255,255,255,.02) 0 2px,transparent 2px 24px)' }}>
                      <div className="av-pdf-sheet" style={{ position: 'relative', zoom, width: 560, maxWidth: '100%', flexShrink: 0, background: '#fff', color: '#141b1c', borderRadius: 4, padding: '44px 46px 38px', boxShadow: '0 20px 46px -18px rgba(0,0,0,.5)', fontFamily: 'var(--f-ui)' }}>
                        {isDraft && (
                          <span aria-hidden style={{ position: 'absolute', top: '46%', left: '50%', transform: 'translate(-50%,-50%) rotate(-24deg)', font: '700 108px var(--f-display)', letterSpacing: '.06em', color: 'rgba(13,148,136,.07)', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 0 }}>{sc.draft}</span>
                        )}
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <LogoMark size={34} variant="onTeal" />
                              <div>
                                <div style={{ font: '700 17px var(--f-display)', letterSpacing: '.14em', color: '#0a2225' }}>AVENTA</div>
                                <div style={{ marginTop: 1, font: '600 8.5px var(--f-mono)', letterSpacing: '.16em', color: '#8aa2a3' }}>{t.brandKicker}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ font: '600 8.5px var(--f-mono)', letterSpacing: '.14em', color: '#8aa2a3' }}>{t.contractNoLabel}</div>
                              <div style={{ marginTop: 2, font: '700 15px var(--f-display)', color: '#0d9488' }}>{t.contractNo}</div>
                            </div>
                          </div>
                          <div style={{ height: 2, background: '#0d9488', margin: '18px 0 20px', borderRadius: 2 }} />
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ font: '700 19px var(--f-display)', letterSpacing: '.02em', color: '#0a2225' }}>{t.contractTitle}</div>
                            <div style={{ marginTop: 4, font: '500 12px var(--f-ui)', color: '#5b7678' }}>{t.contractPlace}</div>
                          </div>
                          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                            <PartyBlock label={t.lessorLabel} lines={t.lessorBody} />
                            <PartyBlock label={t.renterLabel} lines={t.renterBody} />
                          </div>
                          <SectionLabel style={{ marginTop: 24, marginBottom: 10 }}>{t.s1Title}</SectionLabel>
                          <div style={{ border: '1px solid #e6ebeb', borderRadius: 6, overflow: 'hidden' }}>
                            {t.subjectRows.map((row, i) => (
                              <div key={row.label} style={{ display: 'flex', borderBottom: i === t.subjectRows.length - 1 ? 'none' : '1px solid #eef1f1' }}>
                                <span style={{ width: 150, flexShrink: 0, padding: '9px 12px', background: '#f6f8f8', font: '500 11.5px var(--f-ui)', color: '#5b7678' }}>{row.label}</span>
                                <span style={{ flex: 1, padding: '9px 12px', font: '600 12.5px var(--f-ui)', color: '#141b1c' }}>{row.value}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26 }}>
                            <div>
                              <SectionLabel style={{ marginBottom: 10 }}>{t.s2Title}</SectionLabel>
                              <div>
                                {t.costRows.map((row) =>
                                  row.total ? (
                                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '9px 0 5px', marginTop: 4, borderTop: '2px solid #0a2225' }}>
                                      <span style={{ font: '700 13px var(--f-display)', color: '#0a2225' }}>{row.label}</span>
                                      <span style={{ font: '700 15px var(--f-display)', color: '#0a2225', whiteSpace: 'nowrap' }}>{row.value}</span>
                                    </div>
                                  ) : (
                                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '5px 0', font: '500 12px var(--f-ui)', color: '#33474a', borderBottom: '1px dashed #eef1f1' }}>
                                      <span>{row.label}</span><span style={{ fontWeight: 600, color: '#141b1c', whiteSpace: 'nowrap' }}>{row.value}</span>
                                    </div>
                                  ),
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '4px 0', font: '500 12px var(--f-ui)', color: '#5b7678' }}>
                                  <span>{t.depositRow.label}</span><span style={{ fontWeight: 600, color: '#141b1c', whiteSpace: 'nowrap' }}>{t.depositRow.value}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <SectionLabel style={{ marginBottom: 10 }}>{t.s3Title}</SectionLabel>
                              <div>
                                {t.conditions.map((c) => (
                                  <div key={c} style={{ display: 'flex', gap: 8, padding: '3px 0', font: '500 11.5px/1.5 var(--f-ui)', color: '#33474a' }}>
                                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#0d9488" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M20 6 9 17l-5-5" /></svg>
                                    <span>{c}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div style={{ marginTop: 34, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <SignatureLine caption={t.signLessor} />
                            <SignatureLine caption={t.signRenter} />
                          </div>
                          <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', borderRadius: 9, background: 'var(--st-soft)', color: 'var(--st-deep)' }}>
                            <ShieldCheck />
                            <span style={{ font: '500 11.5px/1.45 var(--f-ui)', color: 'var(--st-deep)' }}>{t.eSignNote}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                  </div>

                  {/* RIGHT: sticky sidebar */}
                  <aside className="av-no-print sc-side">
                    {/* how to pay */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18, padding: 20, boxShadow: '0 1px 2px rgba(6,33,38,.04),0 22px 50px -36px rgba(6,33,38,.55)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <span style={{ font: '600 10.5px var(--f-mono)', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>{sc.howToPay}</span>
                        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="var(--muted-2)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                      </div>

                      {fullyPaid ? (
                        <>
                          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span aria-hidden style={{ display: 'inline-flex', width: 28, height: 28, borderRadius: 999, background: 'var(--ok)', color: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                            </span>
                            <div style={{ font: '700 16px var(--f-display)', color: 'var(--ink)' }}>{sc.paidInFull}</div>
                          </div>
                          <p style={{ margin: '10px 2px 0', font: '500 12.5px/1.5 var(--f-ui)', color: 'var(--muted)' }}>{sc.paidNote}</p>
                        </>
                      ) : heroKind === 'accepted' ? (
                        <>
                          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 12px', borderRadius: 11, background: 'rgba(245,180,0,.14)' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: '600 13px var(--f-ui)', color: '#b7791f' }}>
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>{sc.depositDue}
                              </span>
                              <span style={{ font: '700 15px var(--f-display)', color: '#b7791f' }}>{owed > 0 ? booking.balanceMoney : booking.depositMoney}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 12px' }}>
                              <span style={{ font: '500 13px var(--f-ui)', color: 'var(--muted)' }}>{sc.orderTotal}</span>
                              <span style={{ font: '700 16px var(--f-display)', color: 'var(--ink)' }}>{booking.subtotalMoney}</span>
                            </div>
                          </div>
                          <p style={{ margin: '6px 2px 0', font: '500 12px/1.5 var(--f-ui)', color: 'var(--muted)' }}>{sc.noteAwaiting}</p>
                        </>
                      ) : (
                        <>
                          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 12px', borderRadius: 11, background: 'rgba(16,185,129,.12)' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: '600 13px var(--f-ui)', color: 'var(--ok)' }}>
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>{sc.depositPaid}
                              </span>
                              <span style={{ font: '700 15px var(--f-display)', color: 'var(--ok)' }}>{booking.prepaidMoney}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 12px' }}>
                              <span style={{ font: '500 13px var(--f-ui)', color: 'var(--muted)' }}>{sc.balanceReturn}</span>
                              <span style={{ font: '700 16px var(--f-display)', color: 'var(--ink)' }}>{booking.balanceMoney}</span>
                            </div>
                          </div>
                          <p style={{ margin: '6px 2px 0', font: '500 12px/1.5 var(--f-ui)', color: 'var(--muted)' }}>{sc.noteConfirmed}</p>
                        </>
                      )}

                      {!fullyPaid && (
                        <Link href="/account/payments" className="av-cta av-tap" style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, padding: 13, borderRadius: 12, background: 'var(--accent)', color: '#fff', font: '700 14.5px var(--f-display)', textDecoration: 'none', boxShadow: '0 12px 26px -12px var(--accent)' }}>
                          <span className="sc-sheen" aria-hidden style={{ position: 'absolute', top: 0, bottom: 0, width: '55%', left: 0, background: 'linear-gradient(100deg,transparent,rgba(255,255,255,.32),transparent)', pointerEvents: 'none' }} />
                          <span style={{ position: 'relative' }}>{heroKind === 'accepted' ? sc.payDeposit : sc.goPay}</span>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative' }}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                        </Link>
                      )}
                    </div>

                    {/* quick actions */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18, padding: '18px 20px', boxShadow: '0 1px 2px rgba(6,33,38,.04),0 22px 50px -36px rgba(6,33,38,.55)' }}>
                      <span style={{ font: '600 10.5px var(--f-mono)', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>{sc.quickActions}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 14 }}>
                        {pdfHref ? (
                          <a href={pdfHref} target="_blank" rel="noreferrer" className="sc-qa" style={qaBtn}>
                            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="var(--teal)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3" /><path d="m7 10 5 5 5-5" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /></svg><span>{sc.downloadPdf}</span>
                          </a>
                        ) : (
                          <button type="button" onClick={print} className="sc-qa" style={qaBtn}>
                            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="var(--teal)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3" /><path d="m7 10 5 5 5-5" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /></svg><span>{sc.downloadPdf}</span>
                          </button>
                        )}
                        <button type="button" onClick={print} className="sc-qa" style={qaBtn}>
                          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="var(--teal)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /></svg><span>{sc.printContract}</span>
                        </button>
                        <button type="button" onClick={addToCalendar} className="sc-qa" style={qaBtn}>
                          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="var(--teal)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg><span>{sc.addCal}</span>
                        </button>
                      </div>
                    </div>

                    {/* manager */}
                    {support && (support.whatsappHref || support.telegramHref || support.phone || support.email) && (
                      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(155deg,#fff2ee,#ffe4dc)', border: '1px solid rgba(251,109,76,.2)', borderRadius: 18, padding: '18px 20px' }}>
                        <span className="sc-orb" aria-hidden style={{ position: 'absolute', top: -40, right: -30, width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle,rgba(251,109,76,.28),transparent 70%)', filter: 'blur(4px)', pointerEvents: 'none' }} />
                        <span style={{ position: 'relative', font: '600 10.5px var(--f-mono)', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent-strong)' }}>{sc.yourManager}</span>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                          <span style={{ position: 'relative', width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent-strong))', display: 'grid', placeItems: 'center', color: '#fff', font: '700 19px var(--f-display)', flexShrink: 0 }}>
                            {support.name.trim().charAt(0).toUpperCase() || 'A'}
                            <span style={{ position: 'absolute', right: -1, bottom: -1, width: 13, height: 13, borderRadius: '50%', background: 'var(--ok)', border: '2.5px solid #fff2ee' }} />
                          </span>
                          <div>
                            <div style={{ font: '700 16px var(--f-display)', color: 'var(--ink)' }}>{support.name}</div>
                            <div style={{ font: '500 12px var(--f-ui)', color: 'var(--muted)' }}>{sc.online}</div>
                          </div>
                        </div>
                        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: support.whatsappHref && support.telegramHref ? '1fr 1fr' : '1fr', gap: 9, marginTop: 14 }}>
                          {support.whatsappHref && (
                            <a href={support.whatsappHref} target="_blank" rel="noopener noreferrer" className="sc-mgrbtn" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 10, borderRadius: 11, background: '#25d366', color: '#fff', font: '700 13px var(--f-display)', textDecoration: 'none' }}>
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.01c-.24.68-1.4 1.3-1.94 1.38-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-2.99 0-1.42.75-2.12 1.01-2.41.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.41-.07.65.5.24.57.82 1.99.89 2.13.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.16-.19.69-.8.87-1.08.18-.28.36-.23.61-.14.25.09 1.6.75 1.87.89.28.14.46.21.53.33.07.12.07.68-.17 1.36Z" /></svg>WhatsApp
                            </a>
                          )}
                          {support.telegramHref && (
                            <a href={support.telegramHref} target="_blank" rel="noopener noreferrer" className="sc-mgrbtn" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 10, borderRadius: 11, background: '#229ed9', color: '#fff', font: '700 13px var(--f-display)', textDecoration: 'none' }}>
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M21.94 4.6 18.6 20.3c-.25 1.1-.9 1.38-1.83.86l-5.05-3.72-2.44 2.35c-.27.27-.5.5-1.02.5l.36-5.16 9.4-8.49c.4-.36-.09-.56-.63-.2L5.15 13.1l-5-1.57c-1.09-.34-1.1-1.09.23-1.61l19.55-7.53c.9-.34 1.7.2 1.41 1.61Z" /></svg>Telegram
                            </a>
                          )}
                          {!support.whatsappHref && !support.telegramHref && (support.phone || support.email) && (
                            <a href={support.phone ? `tel:${support.phone}` : `mailto:${support.email}`} className="sc-mgrbtn" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 10, borderRadius: 11, background: 'var(--accent)', color: '#fff', font: '700 13px var(--f-display)', textDecoration: 'none' }}>
                              {support.phone || support.email}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </aside>
                </div>
              </>
            )}

            {/* ═══════════ CANCELLED ═══════════ */}
            {isCancelled && (
              <section className="av-no-print" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, padding: 26, marginTop: 18, boxShadow: '0 1px 2px rgba(6,33,38,.04),0 22px 50px -36px rgba(6,33,38,.5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div aria-hidden style={{ width: 112, height: 74, borderRadius: 12, background: 'linear-gradient(135deg,#5b6b6c,#3c4849)', flexShrink: 0, filter: 'grayscale(.4)' }} />
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <span style={{ font: '600 10.5px var(--f-mono)', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>{sc.yourVehicle}</span>
                    <div style={{ font: '700 19px var(--f-display)', color: 'var(--ink)', marginTop: 3 }}>{t.carName}</div>
                    <div style={{ font: '500 13px var(--f-ui)', color: 'var(--muted)', marginTop: 2 }}>{booking.periodLong} · {booking.routeText}</div>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 11, background: 'var(--st-soft)', color: 'var(--st-deep)', font: '600 13px var(--f-ui)' }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>{sc.noPayment}
                  </span>
                </div>
                <div style={{ height: 1, background: 'var(--line)', margin: '22px 0' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  <p style={{ font: '500 13.5px/1.6 var(--f-ui)', color: 'var(--muted)', margin: 0, maxWidth: 520 }}>{sc.cxBody}</p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Link href="/catalog" className="av-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 12, border: '1.5px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', font: '700 14px var(--f-display)', textDecoration: 'none' }}>{sc.browse}</Link>
                    <Link href="/catalog" className="av-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', font: '700 14px var(--f-display)', textDecoration: 'none', boxShadow: '0 12px 26px -12px var(--accent)' }}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>{sc.rebook}
                    </Link>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </AccountShell>
  )
}

/* ------------------------------------------------------------------ *
 *  Reusable bits inside the contract sheet
 * ------------------------------------------------------------------ */

function SectionLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{ font: "700 10px var(--f-mono)", letterSpacing: '.08em', color: '#fb6d4c', ...style }}
    >
      {children}
    </div>
  )
}

function PartyBlock({ label, lines }: { label: string; lines: string[] }) {
  return (
    <div>
      <div
        style={{
          font: "700 10px var(--f-mono)",
          letterSpacing: '.08em',
          color: '#fb6d4c',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ font: "500 11px/1.6 var(--f-ui)", color: '#33474a' }}>
        {lines.map((l, i) => (
          <span key={l}>
            {l}
            {i < lines.length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  )
}

function SignatureLine({ caption }: { caption: string }) {
  return (
    <div style={{ width: '42%' }}>
      <div style={{ borderBottom: '1px solid #141b1c', height: 32 }} />
      <div style={{ marginTop: 5, font: "500 10px var(--f-ui)", color: '#8aa2a3' }}>{caption}</div>
    </div>
  )
}

/* ================================================================== *
 *  PAYMENT POINTER — replaces the old on-page "How to pay" panel.
 *  Payment now lives on the dedicated Payments surface (bottom-nav /
 *  account). Here we only report status and, if money is still owed,
 *  route the customer there so they are never stranded.
 * ================================================================== */

const pointerDict: Dict<{
  tag: string
  paidTitle: string
  paidBody: string
  depositPaid: string
  balanceLabel: string
  dueTitle: string
  dueBody: string
  amountDue: string
  cta: string
  reassure: string
}> = {
  ru: {
    tag: 'Оплата / Payment',
    paidTitle: 'Оплачено полностью',
    paidBody: 'Мы получили оплату по этой брони. Дополнительных действий не требуется.',
    depositPaid: 'Депозит оплачен',
    balanceLabel: 'Остаток',
    dueTitle: 'Как оплатить',
    dueBody: 'Оплатите картой моментально или банковским переводом / криптовалютой на странице «Оплата».',
    amountDue: 'К оплате',
    cta: 'Перейти к оплате',
    reassure: 'Оплата и проверка документов — независимые шаги. Менеджер всё равно проверит документы перед выдачей.',
  },
  en: {
    tag: 'Оплата / Payment',
    paidTitle: 'Paid in full',
    paidBody: 'We’ve received payment for this booking. Nothing more to do here.',
    depositPaid: 'Deposit paid',
    balanceLabel: 'Balance',
    dueTitle: 'How to pay',
    dueBody: 'Pay instantly by card, or by bank transfer / crypto, on the Payments page.',
    amountDue: 'Amount due',
    cta: 'Go to Payments',
    reassure: 'Payment and document checks are separate steps. A manager still verifies your documents before handover.',
  },
  tr: {
    tag: 'Оплата / Payment',
    paidTitle: 'Tamamı ödendi',
    paidBody: 'Bu rezervasyon için ödemeyi aldık. Başka bir işlem yapmanıza gerek yok.',
    depositPaid: 'Depozito ödendi',
    balanceLabel: 'Kalan tutar',
    dueTitle: 'Nasıl ödenir',
    dueBody: 'Kartla anında ya da banka havalesi / kripto ile Ödeme sayfasından ödeyin.',
    amountDue: 'Ödenecek tutar',
    cta: 'Ödemeye git',
    reassure: 'Ödeme ve belge kontrolü ayrı adımlardır. Yönetici, teslimattan önce belgelerinizi yine de doğrular.',
  },
  es: {
    tag: 'Оплата / Payment',
    paidTitle: 'Pagado por completo',
    paidBody: 'Hemos recibido el pago de esta reserva. No tienes que hacer nada más.',
    depositPaid: 'Depósito pagado',
    balanceLabel: 'Saldo',
    dueTitle: 'Cómo pagar',
    dueBody: 'Paga al instante con tarjeta, o mediante transferencia bancaria / cripto, en la página de Pagos.',
    amountDue: 'Importe a pagar',
    cta: 'Ir a Pagos',
    reassure: 'El pago y la verificación de documentos son pasos independientes. Un gestor verificará tus documentos antes de la entrega.',
  },
  de: {
    tag: 'Оплата / Payment',
    paidTitle: 'Vollständig bezahlt',
    paidBody: 'Wir haben die Zahlung für diese Buchung erhalten. Hier ist nichts weiter zu tun.',
    depositPaid: 'Kaution bezahlt',
    balanceLabel: 'Restbetrag',
    dueTitle: 'So bezahlen Sie',
    dueBody: 'Zahlen Sie sofort per Karte oder per Banküberweisung / Krypto auf der Zahlungsseite.',
    amountDue: 'Fälliger Betrag',
    cta: 'Zu den Zahlungen',
    reassure: 'Zahlung und Dokumentenprüfung sind getrennte Schritte. Ein Mitarbeiter prüft Ihre Dokumente dennoch vor der Übergabe.',
  },
}

function PaymentPointer({
  paidSoFar,
  owed,
  booking,
  lang,
}: {
  paidSoFar: number
  owed: number
  booking: SuccessBooking
  lang: Lang
}) {
  const t = pointerDict[lang] ?? pointerDict.en
  const money = (v: number) => formatMoney(v, booking.currency)
  // Nothing owed → calm state (covers a settled booking AND the degenerate zero-total booking); the
  // "how to pay" branch only shows when there's a real balance, so it never renders "Amount due 0".
  const fullyPaid = owed <= 0

  const card: CSSProperties = {
    borderRadius: 18,
    padding: '20px 22px 22px',
    background: '#fff',
    border: '1px solid rgba(10,34,37,.10)',
    boxShadow: '0 1px 2px rgba(6,33,38,.04), 0 22px 50px -36px rgba(6,33,38,.55)',
  }
  const head: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }
  const tag: CSSProperties = { font: '600 10.5px var(--f-mono)', letterSpacing: '.14em', textTransform: 'uppercase', color: '#5b7678' }
  const CardGlyph = (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#8aa2a3" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
  )

  // Fully-paid (card deposit + no remaining balance, or a settled booking) → calm confirmation, no CTA.
  if (fullyPaid) {
    return (
      <div style={{ ...card, borderColor: 'rgba(16,185,129,.35)', background: 'linear-gradient(180deg,#f1fcf6,#ffffff)' }}>
        <div style={head}><span style={tag}>{t.tag}</span>{CardGlyph}</div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span aria-hidden style={{ display: 'inline-flex', width: 28, height: 28, borderRadius: 999, background: '#0f9d6f', color: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </span>
          <div style={{ font: '700 17px var(--f-display)', color: '#0a2225' }}>{t.paidTitle}</div>
        </div>
        <p style={{ margin: '10px 0 0', font: '500 13px/1.6 var(--f-ui)', color: '#5b7678' }}>{t.paidBody}</p>
      </div>
    )
  }

  // Something is still owed (bank/crypto owe the whole deposit; card bookings owe the remaining balance).
  return (
    <div style={card}>
      <div style={head}><span style={tag}>{t.tag}</span>{CardGlyph}</div>
      <div style={{ marginTop: 10, font: '700 18px var(--f-display)', color: '#0a2225' }}>{t.dueTitle}</div>
      <p style={{ margin: '7px 0 0', font: '500 13px/1.6 var(--f-ui)', color: '#5b7678' }}>{t.dueBody}</p>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {paidSoFar > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 12px', borderRadius: 11, background: 'rgba(16,185,129,.12)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: '600 13px var(--f-ui)', color: '#0f9d6f' }}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>{t.depositPaid}
            </span>
            <span style={{ font: '700 15px var(--f-display)', color: '#0f9d6f' }}>{money(paidSoFar)}</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 12px' }}>
          <span style={{ font: '600 13px var(--f-ui)', color: '#5b7678' }}>{paidSoFar > 0 ? t.balanceLabel : t.amountDue}</span>
          <span style={{ font: '700 20px var(--f-display)', color: '#ef5c3a' }}>{money(owed)}</span>
        </div>
      </div>

      <Link
        href="/account/payments"
        className="av-cta av-tap"
        style={{ position: 'relative', overflow: 'hidden', marginTop: 14, width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, padding: '13px 18px', borderRadius: 12, background: '#fb6d4c', color: '#fff', font: '700 14.5px var(--f-display)', textDecoration: 'none', boxShadow: '0 12px 26px -12px rgba(251,109,76,.7)' }}
      >
        <span className="sc-sheen" aria-hidden style={{ position: 'absolute', top: 0, bottom: 0, width: '55%', left: 0, background: 'linear-gradient(100deg,transparent,rgba(255,255,255,.32),transparent)', pointerEvents: 'none' }} />
        <span style={{ position: 'relative' }}>{t.cta}</span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative' }}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
      </Link>

      <p style={{ margin: '12px 2px 0', font: '500 11.5px/1.55 var(--f-ui)', color: '#8aa2a3' }}>{t.reassure}</p>
    </div>
  )
}

/* ================================================================== *
 *  PAYMENT PANEL — real client payment flow (pay-with-proof).
 *  Method select → (crypto: fetch wallets/QR) → tx-hash + receipt →
 *  submitManualPaymentAction. Fits the seaside success/contract style.
 * ================================================================== */

type PayMethod = 'BANK_TRANSFER' | 'CRYPTO' | 'CARD'
type PayPhase = 'idle' | 'loading' | 'submitting' | 'done' | 'error'

interface CryptoOptionView {
  token: string
  network: string
  address: string
  qr: string
}

interface PayStrings {
  panelTag: string
  title: string
  subtitle: string
  subtitleWithCard: string
  methodBank: string
  methodCrypto: string
  methodCard: string
  methodCardSoon: string
  soon: string
  amountLabel: string
  bankTitle: string
  bankHolder: string
  bankIban: string
  bankSwift: string
  bankRef: string
  bankNote: string
  bankMissing: string
  cryptoLoading: string
  cryptoNone: string
  network: string
  address: string
  copy: string
  copied: string
  warn: (token: string, network: string) => string
  txLabel: string
  txPlaceholder: string
  proofLabel: string
  proofHint: string
  submit: string
  submitting: string
  done: string
  errGeneric: string
  errNoInput: string
}

const payDict: Dict<PayStrings> = {
  ru: {
    panelTag: 'Оплата / Payment',
    title: 'Оплата брони',
    subtitle:
      'Оплатите картой недоступно — выберите перевод или криптовалюту, затем приложите чек. Администратор подтвердит платёж.',
    subtitleWithCard:
      'Оплатите депозит картой (моментально) или переводом/криптовалютой с чеком. Для перевода и крипто администратор подтверждает платёж.',
    methodBank: 'Банковский перевод',
    methodCrypto: 'Криптовалюта',
    methodCard: 'Карта',
    methodCardSoon: 'Карта (Stripe / PayPal)',
    soon: 'скоро',
    amountLabel: 'К оплате',
    bankTitle: 'Реквизиты для перевода',
    bankHolder: 'Получатель',
    bankIban: 'IBAN',
    bankSwift: 'SWIFT',
    bankRef: 'Назначение',
    bankNote: 'Укажите номер брони в назначении платежа.',
    bankMissing: 'Реквизиты уточняются — свяжитесь с администратором.',
    cryptoLoading: 'Загружаем реквизиты кошельков…',
    cryptoNone:
      'Криптокошельки пока не настроены. Пожалуйста, воспользуйтесь банковским переводом или свяжитесь с администратором.',
    network: 'Сеть',
    address: 'Адрес кошелька',
    copy: 'Копировать',
    copied: 'Скопировано',
    warn: (token, network) => `Отправляйте только ${token} в сети ${network}.`,
    txLabel: 'Хэш транзакции / номер платежа',
    txPlaceholder: 'напр. 0x… или референс перевода',
    proofLabel: 'Чек / подтверждение (файл)',
    proofHint: 'PDF или изображение. Файл шифруется при загрузке.',
    submit: 'Отправить на подтверждение',
    submitting: 'Отправляем…',
    done: 'Оплата отправлена — ожидает подтверждения администратора.',
    errGeneric: 'Не удалось отправить оплату. Попробуйте ещё раз.',
    errNoInput: 'Укажите хэш транзакции или приложите чек.',
  },
  en: {
    panelTag: 'Оплата / Payment',
    title: 'Booking payment',
    subtitle:
      'Card payment is unavailable — pick a bank transfer or crypto, then attach the receipt. An administrator will confirm the payment.',
    subtitleWithCard:
      'Pay the deposit instantly by card, or by bank transfer / crypto with a receipt. For transfer and crypto an administrator confirms the payment.',
    methodBank: 'Bank transfer',
    methodCrypto: 'Cryptocurrency',
    methodCard: 'Card',
    methodCardSoon: 'Card (Stripe / PayPal)',
    soon: 'soon',
    amountLabel: 'Amount due',
    bankTitle: 'Transfer details',
    bankHolder: 'Beneficiary',
    bankIban: 'IBAN',
    bankSwift: 'SWIFT',
    bankRef: 'Reference',
    bankNote: 'Please include your booking number in the payment reference.',
    bankMissing: 'Details are being finalised — please contact an administrator.',
    cryptoLoading: 'Loading wallet details…',
    cryptoNone:
      'Crypto wallets are not configured yet. Please use a bank transfer or contact an administrator.',
    network: 'Network',
    address: 'Wallet address',
    copy: 'Copy',
    copied: 'Copied',
    warn: (token, network) => `Send only ${token} on the ${network} network.`,
    txLabel: 'Transaction hash / payment reference',
    txPlaceholder: 'e.g. 0x… or transfer reference',
    proofLabel: 'Receipt / proof (file)',
    proofHint: 'PDF or image. The file is encrypted on upload.',
    submit: 'Submit for confirmation',
    submitting: 'Submitting…',
    done: 'Payment submitted — awaiting administrator confirmation.',
    errGeneric: 'Could not submit the payment. Please try again.',
    errNoInput: 'Enter a transaction hash or attach a receipt.',
  },
  tr: {
    panelTag: 'Оплата / Payment',
    title: 'Rezervasyon ödemesi',
    subtitle:
      'Kartla ödeme kullanılamıyor — banka havalesi veya kripto seçin, ardından makbuzu ekleyin. Bir yönetici ödemeyi onaylayacaktır.',
    subtitleWithCard:
      'Depozitoyu kartla anında ödeyin ya da makbuzla banka havalesi / kripto ile ödeyin. Havale ve kripto için ödemeyi bir yönetici onaylar.',
    methodBank: 'Banka havalesi',
    methodCrypto: 'Kripto para',
    methodCard: 'Kart',
    methodCardSoon: 'Kart (Stripe / PayPal)',
    soon: 'yakında',
    amountLabel: 'Ödenecek tutar',
    bankTitle: 'Havale bilgileri',
    bankHolder: 'Alıcı',
    bankIban: 'IBAN',
    bankSwift: 'SWIFT',
    bankRef: 'Açıklama',
    bankNote: 'Lütfen ödeme açıklamasına rezervasyon numaranızı ekleyin.',
    bankMissing: 'Bilgiler henüz tamamlanıyor — lütfen bir yöneticiyle iletişime geçin.',
    cryptoLoading: 'Cüzdan bilgileri yükleniyor…',
    cryptoNone:
      'Kripto cüzdanları henüz yapılandırılmadı. Lütfen banka havalesi kullanın veya bir yöneticiyle iletişime geçin.',
    network: 'Ağ',
    address: 'Cüzdan adresi',
    copy: 'Kopyala',
    copied: 'Kopyalandı',
    warn: (token, network) => `Yalnızca ${network} ağında ${token} gönderin.`,
    txLabel: 'İşlem hash / ödeme referansı',
    txPlaceholder: 'örn. 0x… veya havale referansı',
    proofLabel: 'Makbuz / kanıt (dosya)',
    proofHint: 'PDF veya görsel. Dosya yüklenirken şifrelenir.',
    submit: 'Onaya gönder',
    submitting: 'Gönderiliyor…',
    done: 'Ödeme gönderildi — yönetici onayı bekleniyor.',
    errGeneric: 'Ödeme gönderilemedi. Lütfen tekrar deneyin.',
    errNoInput: 'Bir işlem hash girin veya bir makbuz ekleyin.',
  },
  es: {
    panelTag: 'Оплата / Payment',
    title: 'Pago de la reserva',
    subtitle:
      'El pago con tarjeta no está disponible: elige transferencia bancaria o cripto y luego adjunta el comprobante. Un administrador confirmará el pago.',
    subtitleWithCard:
      'Paga el depósito al instante con tarjeta, o mediante transferencia bancaria / cripto con un comprobante. Para transferencia y cripto, un administrador confirma el pago.',
    methodBank: 'Transferencia bancaria',
    methodCrypto: 'Criptomoneda',
    methodCard: 'Tarjeta',
    methodCardSoon: 'Tarjeta (Stripe / PayPal)',
    soon: 'pronto',
    amountLabel: 'Importe a pagar',
    bankTitle: 'Datos de la transferencia',
    bankHolder: 'Beneficiario',
    bankIban: 'IBAN',
    bankSwift: 'SWIFT',
    bankRef: 'Concepto',
    bankNote: 'Incluye tu número de reserva en el concepto del pago.',
    bankMissing: 'Los datos se están finalizando: ponte en contacto con un administrador.',
    cryptoLoading: 'Cargando los datos de la cartera…',
    cryptoNone:
      'Todavía no hay carteras cripto configuradas. Usa una transferencia bancaria o ponte en contacto con un administrador.',
    network: 'Red',
    address: 'Dirección de la cartera',
    copy: 'Copiar',
    copied: 'Copiado',
    warn: (token, network) => `Envía solo ${token} en la red ${network}.`,
    txLabel: 'Hash de la transacción / referencia del pago',
    txPlaceholder: 'p. ej. 0x… o referencia de la transferencia',
    proofLabel: 'Comprobante / justificante (archivo)',
    proofHint: 'PDF o imagen. El archivo se cifra al subirlo.',
    submit: 'Enviar para confirmación',
    submitting: 'Enviando…',
    done: 'Pago enviado: a la espera de la confirmación del administrador.',
    errGeneric: 'No se pudo enviar el pago. Inténtalo de nuevo.',
    errNoInput: 'Introduce un hash de transacción o adjunta un comprobante.',
  },
  de: {
    panelTag: 'Оплата / Payment',
    title: 'Zahlung der Buchung',
    subtitle:
      'Kartenzahlung ist nicht verfügbar — wählen Sie Banküberweisung oder Krypto und fügen Sie dann den Beleg bei. Ein Administrator bestätigt die Zahlung.',
    subtitleWithCard:
      'Zahlen Sie die Kaution sofort per Karte oder per Banküberweisung / Krypto mit Beleg. Bei Überweisung und Krypto bestätigt ein Administrator die Zahlung.',
    methodBank: 'Banküberweisung',
    methodCrypto: 'Kryptowährung',
    methodCard: 'Karte',
    methodCardSoon: 'Karte (Stripe / PayPal)',
    soon: 'bald',
    amountLabel: 'Fälliger Betrag',
    bankTitle: 'Überweisungsdaten',
    bankHolder: 'Empfänger',
    bankIban: 'IBAN',
    bankSwift: 'SWIFT',
    bankRef: 'Verwendungszweck',
    bankNote: 'Bitte geben Sie Ihre Buchungsnummer im Verwendungszweck an.',
    bankMissing: 'Die Daten werden noch finalisiert — bitte wenden Sie sich an einen Administrator.',
    cryptoLoading: 'Wallet-Daten werden geladen…',
    cryptoNone:
      'Krypto-Wallets sind noch nicht eingerichtet. Bitte nutzen Sie eine Banküberweisung oder wenden Sie sich an einen Administrator.',
    network: 'Netzwerk',
    address: 'Wallet-Adresse',
    copy: 'Kopieren',
    copied: 'Kopiert',
    warn: (token, network) => `Senden Sie nur ${token} im ${network}-Netzwerk.`,
    txLabel: 'Transaktions-Hash / Zahlungsreferenz',
    txPlaceholder: 'z. B. 0x… oder Überweisungsreferenz',
    proofLabel: 'Beleg / Nachweis (Datei)',
    proofHint: 'PDF oder Bild. Die Datei wird beim Hochladen verschlüsselt.',
    submit: 'Zur Bestätigung senden',
    submitting: 'Wird gesendet…',
    done: 'Zahlung gesendet — Bestätigung des Administrators ausstehend.',
    errGeneric: 'Die Zahlung konnte nicht gesendet werden. Bitte versuchen Sie es erneut.',
    errNoInput: 'Geben Sie einen Transaktions-Hash ein oder fügen Sie einen Beleg bei.',
  },
}

const PAY_TEAL = '#0d9488'

/** The subset of a booking the payment panel needs — so it can be reused on the Payments surface
 *  without constructing a full `SuccessBooking`. `subtotal`/`subtotalMoney` are the amount this
 *  panel collects (on the Payments surface that's the outstanding balance; on the contract it's the
 *  full total). The Stripe card option always charges the reservation deposit server-side. */
export interface PayPanelBooking {
  id: string
  number: string
  currency: Currency
  subtotal: number
  subtotalMoney: string
}

export function PaymentPanel({
  booking,
  bank,
  lang,
  cardEnabled = false,
}: {
  booking: PayPanelBooking
  bank: SuccessBankDetails | null
  lang: Lang
  cardEnabled?: boolean
}) {
  const t = payDict[lang] ?? payDict.en
  const [method, setMethod] = useState<PayMethod>('BANK_TRANSFER')
  const [phase, setPhase] = useState<PayPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [cardAmount, setCardAmount] = useState<string | null>(null) // deposit label from the Stripe intent

  // crypto state
  const [cryptoLoaded, setCryptoLoaded] = useState(false)
  const [amountUsd, setAmountUsd] = useState<number | null>(null)
  const [options, setOptions] = useState<CryptoOptionView[]>([])
  const [optionIdx, setOptionIdx] = useState(0)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  // proof state
  const [txHash, setTxHash] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const selectMethod = (m: PayMethod) => {
    setMethod(m)
    setError(null)
    if (phase === 'done') setPhase('idle')
    if (m === 'CRYPTO' && !cryptoLoaded) void loadCrypto()
  }

  async function loadCrypto() {
    setPhase('loading')
    try {
      const res = await getCryptoPaymentInfo(booking.id)
      if (res.ok) {
        setAmountUsd(res.amountUsd ?? null)
        setOptions(res.options ?? [])
        setOptionIdx(0)
      } else {
        setError(res.error ?? t.errGeneric)
      }
    } catch {
      setError(t.errGeneric)
    } finally {
      setCryptoLoaded(true)
      setPhase('idle')
    }
  }

  const copyAddress = (addr: string, idx: number) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(addr).then(
        () => {
          setCopiedIdx(idx)
          window.setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1800)
        },
        () => {},
      )
    }
  }

  const activeOption = options[optionIdx] as CryptoOptionView | undefined

  async function submit() {
    setError(null)
    // Card is confirmed via Stripe (StripeCardPayment), never through this manual declare-a-payment path.
    if (method === 'CARD') return
    if (!txHash.trim() && !file) {
      setError(t.errNoInput)
      return
    }
    setPhase('submitting')
    try {
      // 1) encrypted proof upload (optional)
      let proofDocId: string | undefined
      if (file) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('type', 'PAYMENT_PROOF')
        const up = await uploadDocumentAction(fd)
        if (!up.ok || !up.documentId) {
          setError(up.error ?? t.errGeneric)
          setPhase('error')
          return
        }
        proofDocId = up.documentId
      }

      // 2) declare the payment (crypto → USD amount + token/network; bank → subtotal + booking currency)
      const isCrypto = method === 'CRYPTO'
      const amount = isCrypto ? amountUsd ?? booking.subtotal : booking.subtotal
      const currency = isCrypto ? activeOption?.token ?? 'USDT' : booking.currency
      const res = await submitManualPaymentAction({
        bookingId: booking.id,
        method,
        amount,
        currency,
        txHash: txHash.trim() || undefined,
        cryptoNetwork: isCrypto ? activeOption?.network : undefined,
        proofDocId,
      })
      if (res.ok) {
        setPhase('done')
      } else {
        setError(res.error ?? t.errGeneric)
        setPhase('error')
      }
    } catch {
      setError(t.errGeneric)
      setPhase('error')
    }
  }

  const amountMoney =
    method === 'CARD'
      ? cardAmount ?? booking.subtotalMoney
      : method === 'CRYPTO' && amountUsd != null
        ? `₮${amountUsd}`
        : booking.subtotalMoney
  const busy = phase === 'loading' || phase === 'submitting'

  return (
    <div>
      <div style={{ font: "700 13px var(--f-mono)", color: '#5b7678', marginBottom: 12 }}>
        {t.panelTag}
      </div>

      <div
        style={{
          borderRadius: 22,
          overflow: 'hidden',
          boxShadow: '0 30px 70px -34px rgba(6,33,38,.5)',
          background: 'linear-gradient(180deg,#eef6f5,#e7f1ef)',
          fontFamily: 'var(--f-ui)',
          color: '#0a2225',
          padding: '32px 30px',
        }}
      >
        <div style={{ font: "800 24px var(--f-display)", color: '#0a2225', letterSpacing: '-.01em' }}>
          {t.title}
        </div>
        <div style={{ marginTop: 8, font: "500 13.5px/1.6 var(--f-ui)", color: '#33474a' }}>
          {cardEnabled ? t.subtitleWithCard : t.subtitle}
        </div>

        {/* amount */}
        <div
          style={{
            marginTop: 18,
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 10,
            padding: '10px 16px',
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 10px 24px -16px rgba(6,33,38,.5)',
          }}
        >
          <span style={{ font: "600 11px var(--f-mono)", color: '#5b7678' }}>{t.amountLabel}</span>
          <span style={{ font: "800 20px var(--f-display)", color: '#0a2225' }}>{amountMoney}</span>
        </div>

        {/* method selection */}
        <div style={{ marginTop: 22, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <MethodChip
            active={method === 'BANK_TRANSFER'}
            label={t.methodBank}
            onClick={() => selectMethod('BANK_TRANSFER')}
          />
          <MethodChip
            active={method === 'CRYPTO'}
            label={t.methodCrypto}
            onClick={() => selectMethod('CRYPTO')}
          />
          {cardEnabled ? (
            <MethodChip active={method === 'CARD'} label={t.methodCard} onClick={() => selectMethod('CARD')} />
          ) : (
            <MethodChip active={false} disabled label={t.methodCardSoon} soon={t.soon} />
          )}
        </div>

        {/* ---- bank transfer ---- */}
        {method === 'BANK_TRANSFER' && (
          <div
            style={{
              marginTop: 18,
              background: '#fff',
              borderRadius: 14,
              padding: '18px 20px',
              boxShadow: '0 14px 32px -24px rgba(6,33,38,.4)',
            }}
          >
            <div style={{ font: "700 12px var(--f-mono)", letterSpacing: '.06em', color: PAY_TEAL }}>
              {t.bankTitle}
            </div>
            {bank && (bank.iban || bank.swift) ? (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {bank.holder && <BankRow label={t.bankHolder} value={bank.holder} />}
                {bank.iban && <BankRow label={t.bankIban} value={bank.iban} mono copyable />}
                {bank.swift && <BankRow label={t.bankSwift} value={bank.swift} mono copyable />}
                <BankRow label={t.bankRef} value={booking.number} mono copyable />
                <div style={{ font: "500 12px/1.5 var(--f-ui)", color: '#5b7678' }}>{t.bankNote}</div>
              </div>
            ) : (
              <div style={{ marginTop: 10, font: "500 13px/1.6 var(--f-ui)", color: '#5b7678' }}>
                {t.bankMissing}
              </div>
            )}
          </div>
        )}

        {/* ---- crypto ---- */}
        {method === 'CRYPTO' && (
          <div style={{ marginTop: 18 }}>
            {phase === 'loading' && !cryptoLoaded ? (
              <div
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  padding: '18px 20px',
                  font: "500 13px var(--f-ui)",
                  color: '#5b7678',
                  boxShadow: '0 14px 32px -24px rgba(6,33,38,.4)',
                }}
              >
                {t.cryptoLoading}
              </div>
            ) : options.length === 0 ? (
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #f7d9d0',
                  borderRadius: 14,
                  padding: '18px 20px',
                  font: "500 13px/1.6 var(--f-ui)",
                  color: '#5b7678',
                  boxShadow: '0 14px 32px -24px rgba(6,33,38,.4)',
                }}
              >
                {t.cryptoNone}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {options.map((opt, i) => {
                  const active = i === optionIdx
                  return (
                    <button
                      type="button"
                      key={`${opt.token}-${opt.network}-${opt.address}`}
                      onClick={() => setOptionIdx(i)}
                      style={{
                        textAlign: 'left',
                        cursor: 'pointer',
                        background: '#fff',
                        border: active ? `2px solid ${PAY_TEAL}` : '2px solid transparent',
                        borderRadius: 14,
                        padding: '16px 18px',
                        boxShadow: '0 14px 32px -24px rgba(6,33,38,.4)',
                        display: 'flex',
                        gap: 16,
                        alignItems: 'flex-start',
                      }}
                    >
                      <img
                        src={opt.qr}
                        alt={`${opt.token} ${opt.network} QR`}
                        width={96}
                        height={96}
                        style={{ borderRadius: 8, flexShrink: 0, background: '#fff' }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ font: "800 15px var(--f-display)", color: '#0a2225' }}>
                            {opt.token}
                          </span>
                          <span
                            style={{
                              font: "700 10px var(--f-mono)",
                              letterSpacing: '.06em',
                              color: PAY_TEAL,
                              background: '#e6f5f2',
                              borderRadius: 999,
                              padding: '3px 9px',
                            }}
                          >
                            {t.network}: {opt.network}
                          </span>
                        </div>
                        <div style={{ marginTop: 8, font: "600 10px var(--f-mono)", color: '#8aa2a3' }}>
                          {t.address}
                        </div>
                        <div
                          style={{
                            font: "600 12px var(--f-mono)",
                            color: '#141b1c',
                            wordBreak: 'break-all',
                            lineHeight: 1.5,
                          }}
                        >
                          {opt.address}
                        </div>
                        <span
                          onClick={(e) => {
                            e.stopPropagation()
                            copyAddress(opt.address, i)
                          }}
                          style={{
                            marginTop: 8,
                            display: 'inline-block',
                            font: "700 11px var(--f-ui)",
                            color: PAY_TEAL,
                            cursor: 'pointer',
                          }}
                        >
                          {copiedIdx === i ? t.copied : t.copy}
                        </span>
                      </div>
                    </button>
                  )
                })}

                {activeOption && (
                  <div
                    style={{
                      background: '#FFF3EF',
                      border: '1px solid #f7d9d0',
                      borderRadius: 12,
                      padding: '12px 14px',
                      font: "800 12.5px/1.5 var(--f-ui)",
                      color: '#C2410C',
                    }}
                  >
                    ⚠ {t.warn(activeOption.token, activeOption.network)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ---- card (Stripe Elements — the card field is a Stripe-hosted iframe, never our input) ---- */}
        {method === 'CARD' && (
          <StripeCardPayment bookingId={booking.id} bookingNumber={booking.number} lang={lang} onAmount={setCardAmount} />
        )}

        {/* ---- proof / tx-hash + submit (bank/crypto only; card confirms via Stripe, no receipt) ---- */}
        {method !== 'CARD' && !(method === 'CRYPTO' && cryptoLoaded && options.length === 0) && (
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'block' }}>
              <span style={{ font: "600 11px var(--f-mono)", color: '#5b7678' }}>{t.txLabel}</span>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder={t.txPlaceholder}
                disabled={busy}
                style={{
                  marginTop: 6,
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '11px 13px',
                  borderRadius: 10,
                  border: '1px solid #C7E4E9',
                  background: '#fff',
                  font: "500 13px var(--f-mono)",
                  color: '#0a2225',
                }}
              />
            </label>

            <label style={{ display: 'block' }}>
              <span style={{ font: "600 11px var(--f-mono)", color: '#5b7678' }}>{t.proofLabel}</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={busy}
                style={{
                  marginTop: 6,
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px dashed #9AD0DA',
                  background: '#fff',
                  font: "500 12px var(--f-ui)",
                  color: '#33474a',
                }}
              />
              <span style={{ marginTop: 5, display: 'block', font: "500 11px var(--f-ui)", color: '#8aa2a3' }}>
                {t.proofHint}
              </span>
            </label>

            {phase === 'done' ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#e6f5f2',
                  borderRadius: 12,
                  padding: '13px 15px',
                  font: "700 13px var(--f-ui)",
                  color: '#0b4f52',
                }}
              >
                <ShieldCheck />
                {t.done}
              </div>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={busy}
                className="av-cta"
                style={{
                  marginTop: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 9,
                  padding: 14,
                  background: 'linear-gradient(180deg,#fb6d4c,#fb6d4c)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  font: "700 13px var(--f-ui)",
                  boxShadow: '0 14px 28px -10px rgba(251,109,76,.7)',
                  cursor: busy ? 'default' : 'pointer',
                  opacity: busy ? 0.75 : 1,
                }}
              >
                {phase === 'submitting' ? t.submitting : t.submit}
              </button>
            )}

            {error && (
              <div style={{ font: "600 12px/1.5 var(--f-ui)", color: '#C2410C' }}>{error}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function MethodChip({
  active,
  label,
  onClick,
  disabled = false,
  soon,
}: {
  active: boolean
  label: string
  onClick?: () => void
  disabled?: boolean
  soon?: string
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        borderRadius: 999,
        border: active ? `2px solid ${PAY_TEAL}` : '2px solid transparent',
        background: active ? '#e6f5f2' : '#fff',
        color: disabled ? '#9FB4B9' : '#0a2225',
        font: "700 13px var(--f-ui)",
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: '0 10px 24px -18px rgba(6,33,38,.5)',
      }}
    >
      {label}
      {soon && (
        <span
          style={{
            font: "700 9px var(--f-mono)",
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            color: '#5b7678',
            background: '#f6f8f8',
            borderRadius: 999,
            padding: '2px 7px',
          }}
        >
          {soon}
        </span>
      )}
    </button>
  )
}

function BankRow({
  label,
  value,
  mono = false,
  copyable = false,
}: {
  label: string
  value: string
  mono?: boolean
  copyable?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(value).then(
        () => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1600)
        },
        () => {},
      )
    }
  }
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
      <span style={{ font: "600 11px var(--f-mono)", color: '#8aa2a3', minWidth: 82 }}>{label}</span>
      <span
        style={{
          flex: 1,
          font: mono ? "700 13px var(--f-mono)" : "700 13px var(--f-ui)",
          color: '#0a2225',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </span>
      {copyable && (
        <span
          onClick={copy}
          style={{ font: "700 11px var(--f-ui)", color: PAY_TEAL, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {copied ? '✓' : '⧉'}
        </span>
      )}
    </div>
  )
}
