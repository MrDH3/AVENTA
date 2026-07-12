'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import SiteNav from '../components/SiteNav'
import ClientFooter from '../components/ClientFooter'
import AccountShell from '../components/AccountShell'
import { useDict, useLang } from '../i18n/lang'
import type { CarView } from '../lib/view'
import type { ServiceView } from '../lib/queries'
import { createBookingAction, prepareCardBookingAction } from '../server/booking-actions'
import StripeCardForm from '../components/StripeCardForm'
import LegalConsentModal, { type LegalDocKey } from '../components/LegalConsentModal'
import { uploadDocumentAction, deleteDocumentAction } from '../server/document-actions'
import { submitManualPaymentAction } from '../server/payment-actions'
import { saveBookingDraftAction, discardBookingDraftAction } from '../server/draft-actions'
import type { DraftView } from '../lib/booking-draft'
import { safeInternalPath } from '../lib/safe-path'
import { escapeHtml } from '../lib/escape-html'
import type { BookingCreateInput } from '../lib/validation'
import type { BookingUser, BookingProfile, BookingPayment, BookingCity, BookingOffice } from '../app/booking/page'
import AvailabilityCalendar from '../components/AvailabilityCalendar'
import ServiceIcon from '../components/ServiceIcon'
import SummaryGallery from '../components/SummaryGallery'
import CountryRegionPicker from '../components/CountryRegionPicker'
import { validateCarRangeAction } from '../server/availability-actions'
import type { CarAvailability } from '../lib/availability'
import type { InsuranceTierView } from '../lib/insurance'
import SumsubVerification from '../components/SumsubVerification'
import type { VerificationState, DerivedVerification } from '../lib/verification'
import { useIsMobile } from '../components/useIsMobile'

const MapView = dynamic(() => import('../components/MapView'), { ssr: false })

/* ------------------------------------------------------------------ dict */

const dict = {
  ru: {
    toCatalog: 'К каталогу',
    title: 'Оформление бронирования',
    s1: 'Маршрут и место подачи',
    s2: 'Услуги и страховка',
    s3: 'Данные клиента',
    sDocs: 'Документы',
    s4: 'Оплата',
    cardFinalizingTitle: 'Подтверждаем платёж…',
    cardFinalizingBody: 'Карта авторизована. Создаём бронирование — это займёт мгновение. Пожалуйста, не закрывайте страницу.',
    cardFinalizeFail: 'Не удалось завершить бронирование после оплаты. Если средства были списаны, они будут возвращены автоматически.',
    country: 'СТРАНА',
    countryLocked: 'Страна фиксирована — Турция',
    city: 'ГОРОД',
    address: 'АДРЕС ПОДАЧИ',
    countryV: 'Турция',
    cityV: 'Анталия',
    addressV: 'Аэропорт Анталии (AYT), Терминал 1, зона прилёта',
    pickupPh: 'Аэропорт Анталии (AYT), Терминал 1, зона прилёта',
    mapTitle: 'Карта подачи',
    pickupChip: 'Аэропорт Анталии (AYT)',
    dateFrom: 'НАЧАЛО АРЕНДЫ',
    dateTo: 'КОНЕЦ АРЕНДЫ',
    dateOnly: 'Дата',
    timeOnly: 'Время',
    pickDateFirst: 'Сначала выберите дату',
    firstName: 'ИМЯ',
    lastName: 'ФАМИЛИЯ',
    phone: 'ТЕЛЕФОН',
    whatsapp: 'WHATSAPP',
    citizenship: 'ГРАЖДАНСТВО',
    birthDate: 'ДАТА РОЖДЕНИЯ',
    passportNo: 'НОМЕР ПАСПОРТА',
    licenseNo: 'НОМЕР ВУ',
    licenseCountry: 'СТРАНА ВЫДАЧИ ВУ',
    addressLine: 'АДРЕС ПРОЖИВАНИЯ',
    docsTitle: 'Документы',
    verifyTitle: 'Проверка личности',
    verifyRequired: 'Завершите проверку личности, чтобы продолжить бронирование.',
    manualVerified: 'Личность подтверждена',
    manualRejected: 'Проверка отклонена',
    manualPending: 'Документы отправлены — ожидают проверки. Бронирование станет доступно после одобрения администратором.',
    manualUploadPrompt: 'Загрузите паспорт/ID и водительское удостоверение (лицевая и обратная стороны). После проверки администратором бронирование станет доступно.',
    passport: 'Паспорт',
    dlFront: 'ВУ лицевая',
    dlBack: 'ВУ обратная',
    uploaded: '✓ загружен',
    uploading: '… загрузка',
    addDoc: '+ добавить',
    // client-details messengers + additional phone
    additionalPhone: 'ДОП. ТЕЛЕФОН',
    msgOn: 'Мессенджеры на этом номере',
    mWhatsapp: 'WhatsApp',
    mTelegram: 'Telegram',
    mMax: 'Max',
    // documents step
    docReadHint: 'Документы должны быть читаемыми, без бликов и чёткими.',
    docCountry: 'СТРАНА ДОКУМЕНТА',
    docRegion: 'РЕГИОН / ШТАТ',
    docPickCountry: 'Сначала выберите страну и регион выдачи документа.',
    docApproved: 'Одобрен',
    docUnderReview: 'На проверке',
    docExpired: 'Истёк срок',
    docRejected: 'Отклонён',
    docNeeded: 'Нужно загрузить',
    docValidUntil: 'Действует до',
    docAttach: 'Прикрепить файл',
    docReplace: 'Заменить',
    docRemove: 'Удалить',
    docDelete: 'Удалить загрузку',
    docView: 'Просмотреть',
    docDeleteConfirm: 'Удалить этот документ? Это действие нельзя отменить.',
    docSubmitReview: (n: number) => `Отправить на проверку (${n})`,
    docSub1: 'Паспорт или ID',
    docSub1Hint: 'Загрузите разворот паспорта или обе стороны ID-карты.',
    docSub2: 'Паспорт/ID с вашим лицом',
    docSub2Hint: 'Держите паспорт/ID рядом с лицом — фото должно быть чётким.',
    docSelfie: 'Селфи с документом',
    docSub3: 'Водительское удостоверение',
    docSub3Hint: 'Загрузите лицевую и обратную стороны ВУ.',
    docNext: 'Далее',
    docStepOf: (a: number, b: number) => `Шаг ${a} из ${b}`,
    guestUploadTitle: 'Войдите, чтобы загрузить документы',
    guestUploadBody: 'Создайте аккаунт или войдите — так мы сохраним ваши данные и документы, и в следующий раз бронировать будет быстрее.',
    signIn: 'Войти',
    signUp: 'Регистрация',
    lockedHint: 'Завершите текущий шаг, чтобы продолжить.',
    insTitle: 'Страховка',
    insBasic: 'Базовая',
    insExt: 'Расширенная',
    insFull: 'Полная без франшизы',
    fr: 'франшиза',
    excessLabel: 'Франшиза',
    whatsIncluded: 'Что включено в тариф',
    perDayShort: '/сут',
    payCur: 'Валюта оплаты',
    cryptoTitle: 'Оплата криптовалютой',
    cryptoSub: 'Отправляйте только USDT в сети TRC20 на указанный адрес.',
    network: 'TRC20',
    consentPersonalPre: 'Я согласен на обработку персональных данных согласно ',
    consentPersonalLink: 'политике конфиденциальности',
    consentPersonalPost: '.',
    consentOfferPre: 'Я принимаю условия ',
    consentOfferLink: 'договора оферты (дистанционной продажи)',
    consentOfferPost: ' и условия аренды.',
    consentHeading: 'СОГЛАСИЯ',
    consentScrollFirst: 'откройте и пролистайте документ до конца',
    period: 'Период',
    nights: 'сут',
    rent: 'Аренда',
    extrasL: 'Доп. услуги',
    insuranceL: 'Страховка',
    total: 'Итого',
    deposit: 'Залог',
    submit: 'Отправить заявку',
    submitting: 'Отправляем…',
    noCharge: 'Оплата после подтверждения менеджером',
    cardInstant: 'Списание сразу · бронь подтверждается моментально',
    payOnLastStep: 'Перейдите к шагу «Оплата», чтобы оплатить',
    back: 'Назад',
    cont: 'Продолжить',
    stepNames: ['Маршрут', 'Услуги', 'Данные', 'Документы', 'Оплата'],
    perDay: '/ сут',
    flat: 'разово',
    perTrip: '/ поездка',
    needConsent: 'Отметьте оба согласия, чтобы продолжить.',
    suggestFree: 'Ближайшие свободные даты',
    unavailable: 'Автомобиль недоступен на выбранные даты.',
    routeChoose: 'Как вы получите автомобиль',
    deliverTitle: 'Доставить мне',
    deliverDesc: 'Привезём по вашему адресу',
    officeTitle: 'Забрать из офиса',
    officeDesc: 'Заберёте в нашем офисе',
    fullAddress: 'ПОЛНЫЙ АДРЕС',
    fullAddressPh: 'Улица, дом, район, ориентир',
    useLoc: '📍 Моё местоположение',
    locating: '📍 Определяем…',
    pinHint: 'Поставьте точку на карте или заполните адрес.',
    ourOffice: 'Наш офис',
    directions: 'Открыть маршрут:',
    durationL: 'Длительность',
    dayU: 'дн.',
    nightU: 'ноч.',
    payNowRoute: 'Оплатить сейчас',
    restReturn: 'остаток при возврате',
    noCities: 'Города пока не настроены администратором.',
    noOffice: 'Офис ещё не задан администратором.',
    backToCar: 'Назад к выбору',
    deliveryNA: 'Недоступно при выдаче из офиса',
    pickHint: 'Выберите даты на календаре — занятые дни красные, буфер подготовки заштрихован. Время уточните ниже.',
    selectEnd: 'Теперь выберите дату окончания',
    checkingRange: 'Проверяем доступность…',
    rangeOverlap: 'Эти даты пересекаются с существующей бронью.',
    rangeMin: (n: number) => `Минимальный срок аренды — ${n} дн.`,
    rangeInvalid: 'Выберите корректный диапазон дат.',
    nearest: 'Ближайшие свободные',
    applyDates: 'выбрать',
    busyUntilL: (d: string) => `Занят до ${d}`,
    freeFromL: (d: string) => `Свободен с ${d}`,
    stepOfBar: (a: number, b: number) => `Шаг ${a} из ${b}`,
    stepBack: 'Назад',
    moreDetails: 'Подробнее',
    hideDetails: 'Свернуть',
    payNowShort: 'К оплате',
    exitTitle: 'Вы выходите из оформления',
    exitBody: 'Сохранить введённые данные, чтобы продолжить позже? Черновик хранится 24 часа, затем удаляется автоматически.',
    exitSave: 'Сохранить и выйти',
    exitDiscard: 'Не сохранять',
    exitContinue: 'Продолжить оформление',
    exitSaving: 'Сохранение…',
    resumeTitle: 'Продолжить бронирование?',
    resumeBody: 'У вас есть незавершённое бронирование этого автомобиля. Восстановить введённые данные и продолжить с того же шага?',
    resumeYes: 'Продолжить',
    resumeFresh: 'Начать заново',
  },
  en: {
    toCatalog: 'To catalogue',
    title: 'Complete your booking',
    s1: 'Route & pick-up point',
    s2: 'Extras & insurance',
    s3: 'Client details',
    sDocs: 'Documents',
    s4: 'Payment',
    cardFinalizingTitle: 'Confirming your payment…',
    cardFinalizingBody: 'Your card was authorised. We’re creating your booking — this only takes a moment. Please don’t close this page.',
    cardFinalizeFail: 'We couldn’t finalise your booking after payment. If your card was charged, it will be refunded automatically.',
    country: 'COUNTRY',
    countryLocked: 'Country is fixed — Turkey',
    city: 'CITY',
    address: 'PICK-UP ADDRESS',
    countryV: 'Türkiye',
    cityV: 'Antalya',
    addressV: 'Antalya Airport (AYT), Terminal 1, arrivals',
    pickupPh: 'Antalya Airport (AYT), Terminal 1, arrivals',
    mapTitle: 'Pick-up map',
    pickupChip: 'Antalya Airport (AYT)',
    dateFrom: 'RENTAL START',
    dateTo: 'RENTAL END',
    dateOnly: 'Date',
    timeOnly: 'Time',
    pickDateFirst: 'Pick a date first',
    firstName: 'FIRST NAME',
    lastName: 'LAST NAME',
    phone: 'PHONE',
    whatsapp: 'WHATSAPP',
    citizenship: 'CITIZENSHIP',
    birthDate: 'DATE OF BIRTH',
    passportNo: 'PASSPORT NO.',
    licenseNo: 'LICENCE NO.',
    licenseCountry: 'LICENCE COUNTRY',
    addressLine: 'HOME ADDRESS',
    docsTitle: 'Documents',
    verifyTitle: 'Identity verification',
    verifyRequired: 'Complete identity verification to continue with the booking.',
    manualVerified: 'Identity verified',
    manualRejected: 'Verification rejected',
    manualPending: 'Documents submitted — awaiting review. Your booking unlocks once our team approves.',
    manualUploadPrompt: 'Upload your passport/ID and driving licence (front and back). Booking unlocks after our team approves.',
    passport: 'Passport',
    dlFront: 'Licence front',
    dlBack: 'Licence back',
    uploaded: '✓ uploaded',
    uploading: '… uploading',
    addDoc: '+ add',
    // client-details messengers + additional phone
    additionalPhone: 'ADDITIONAL PHONE',
    msgOn: 'Messengers on this number',
    mWhatsapp: 'WhatsApp',
    mTelegram: 'Telegram',
    mMax: 'Max',
    // documents step
    docReadHint: 'Documents must be readable, glare-free and clear.',
    docCountry: 'DOCUMENT COUNTRY',
    docRegion: 'REGION / STATE',
    docPickCountry: 'First select the document’s issuing country and region.',
    docApproved: 'Approved',
    docUnderReview: 'Under review',
    docExpired: 'Expired',
    docRejected: 'Rejected',
    docNeeded: 'Upload needed',
    docValidUntil: 'Valid until',
    docAttach: 'Attach file',
    docReplace: 'Replace',
    docRemove: 'Remove',
    docDelete: 'Delete upload',
    docView: 'View',
    docDeleteConfirm: "Delete this document? This can't be undone.",
    docSubmitReview: (n: number) => `Submit for review (${n})`,
    docSub1: 'Passport or ID',
    docSub1Hint: 'Upload the passport photo page or both sides of your ID card.',
    docSub2: 'Passport/ID with your face',
    docSub2Hint: 'Hold your passport/ID next to your face — the photo must be clear.',
    docSelfie: 'Selfie with document',
    docSub3: 'Driving licence',
    docSub3Hint: 'Upload the front and back of your driving licence.',
    docNext: 'Next',
    docStepOf: (a: number, b: number) => `Step ${a} of ${b}`,
    guestUploadTitle: 'Sign in to upload documents',
    guestUploadBody: 'Create an account or sign in — we’ll save your details and documents so next time booking is faster.',
    signIn: 'Sign in',
    signUp: 'Sign up',
    lockedHint: 'Finish the current step to continue.',
    insTitle: 'Insurance',
    insBasic: 'Basic',
    insExt: 'Extended',
    insFull: 'Full, zero-excess',
    fr: 'excess',
    excessLabel: 'Excess',
    whatsIncluded: "What's included",
    perDayShort: '/day',
    payCur: 'Payment currency',
    cryptoTitle: 'Pay with crypto',
    cryptoSub: 'Send only USDT on the TRC20 network to the address shown.',
    network: 'TRC20',
    consentPersonalPre: 'I consent to the processing of personal data in line with the ',
    consentPersonalLink: 'privacy policy',
    consentPersonalPost: '.',
    consentOfferPre: 'I accept the ',
    consentOfferLink: 'distance selling contract',
    consentOfferPost: ' and the rental terms.',
    consentHeading: 'CONSENTS',
    consentScrollFirst: 'open and scroll the document to the end',
    period: 'Period',
    nights: 'nights',
    rent: 'Rental',
    extrasL: 'Extras',
    insuranceL: 'Insurance',
    total: 'Total',
    deposit: 'Deposit',
    submit: 'Submit request',
    submitting: 'Submitting…',
    noCharge: 'Payment after manager confirmation',
    cardInstant: 'Card charged now · booking confirmed instantly',
    payOnLastStep: 'Go to the Payment step to pay',
    back: 'Back',
    cont: 'Continue',
    stepNames: ['Route', 'Extras', 'Details', 'Documents', 'Payment'],
    perDay: '/ day',
    flat: 'one-off',
    perTrip: '/ trip',
    needConsent: 'Tick both consents to continue.',
    suggestFree: 'Nearest available dates',
    unavailable: 'Car unavailable for the selected dates.',
    routeChoose: 'How you receive the car',
    deliverTitle: 'Deliver to me',
    deliverDesc: 'We bring it to your address',
    officeTitle: 'Pick up from office',
    officeDesc: 'Collect at our office',
    fullAddress: 'FULL ADDRESS',
    fullAddressPh: 'Street, building, district, landmark',
    useLoc: '📍 Use my location',
    locating: '📍 Locating…',
    pinHint: 'Drop a pin on the map or fill in the address.',
    ourOffice: 'Our office',
    directions: 'Open directions:',
    durationL: 'Duration',
    dayU: 'd',
    nightU: 'n',
    payNowRoute: 'Pay now',
    restReturn: 'rest on return',
    noCities: 'No cities configured by admin yet.',
    noOffice: 'No office set by admin yet.',
    backToCar: 'Back to selection',
    deliveryNA: 'Not applicable for office pickup',
    pickHint: 'Pick dates on the calendar — booked days are red, the turnaround buffer is hatched. Fine-tune the time below.',
    selectEnd: 'Now pick the end date',
    checkingRange: 'Checking availability…',
    rangeOverlap: 'These dates overlap an existing booking.',
    rangeMin: (n: number) => `Minimum rental is ${n} days.`,
    rangeInvalid: 'Pick a valid date range.',
    nearest: 'Nearest available',
    applyDates: 'use',
    busyUntilL: (d: string) => `Booked until ${d}`,
    freeFromL: (d: string) => `Free from ${d}`,
    stepOfBar: (a: number, b: number) => `Step ${a} of ${b}`,
    stepBack: 'Back',
    moreDetails: 'Details',
    hideDetails: 'Hide',
    payNowShort: 'Pay now',
    exitTitle: 'You’re leaving the booking',
    exitBody: 'Save what you’ve entered so you can continue later? A draft is kept for 24 hours, then deleted automatically.',
    exitSave: 'Save & exit',
    exitDiscard: 'Don’t save',
    exitContinue: 'Continue booking',
    exitSaving: 'Saving…',
    resumeTitle: 'Resume your booking?',
    resumeBody: 'You have an unfinished booking for this car. Restore what you entered and pick up from the same step?',
    resumeYes: 'Resume',
    resumeFresh: 'Start fresh',
  },
  tr: {
    toCatalog: 'Kataloğa dön',
    title: 'Rezervasyonu tamamlayın',
    s1: 'Güzergâh ve teslim noktası',
    s2: 'Ekstralar ve sigorta',
    s3: 'Müşteri bilgileri',
    sDocs: 'Belgeler',
    s4: 'Ödeme',
    cardFinalizingTitle: 'Ödemeniz onaylanıyor…',
    cardFinalizingBody: 'Kartınız yetkilendirildi. Rezervasyonunuzu oluşturuyoruz — yalnızca birkaç saniye sürer. Lütfen bu sayfayı kapatmayın.',
    cardFinalizeFail: 'Ödemeden sonra rezervasyonunuz tamamlanamadı. Kartınızdan ücret alındıysa otomatik olarak iade edilecektir.',
    country: 'ÜLKE',
    countryLocked: 'Ülke sabit — Türkiye',
    city: 'ŞEHİR',
    address: 'TESLİM ADRESİ',
    countryV: 'Türkiye',
    cityV: 'Antalya',
    addressV: 'Antalya Havalimanı (AYT), Terminal 1, gelen yolcu',
    pickupPh: 'Antalya Havalimanı (AYT), Terminal 1, gelen yolcu',
    mapTitle: 'Teslim haritası',
    pickupChip: 'Antalya Havalimanı (AYT)',
    dateFrom: 'KİRALAMA BAŞLANGICI',
    dateTo: 'KİRALAMA BİTİŞİ',
    dateOnly: 'Tarih',
    timeOnly: 'Saat',
    pickDateFirst: 'Önce bir tarih seçin',
    firstName: 'AD',
    lastName: 'SOYAD',
    phone: 'TELEFON',
    whatsapp: 'WHATSAPP',
    citizenship: 'UYRUK',
    birthDate: 'DOĞUM TARİHİ',
    passportNo: 'PASAPORT NO.',
    licenseNo: 'EHLİYET NO.',
    licenseCountry: 'EHLİYET ÜLKESİ',
    addressLine: 'EV ADRESİ',
    docsTitle: 'Belgeler',
    verifyTitle: 'Kimlik doğrulama',
    verifyRequired: 'Rezervasyona devam etmek için kimlik doğrulamasını tamamlayın.',
    manualVerified: 'Kimlik doğrulandı',
    manualRejected: 'Doğrulama reddedildi',
    manualPending: 'Belgeler gönderildi — inceleme bekleniyor. Ekibimiz onayladığında rezervasyonunuz açılır.',
    manualUploadPrompt: 'Pasaportunuzu/kimliğinizi ve ehliyetinizi (ön ve arka) yükleyin. Ekibimiz onayladıktan sonra rezervasyon açılır.',
    passport: 'Pasaport',
    dlFront: 'Ehliyet ön',
    dlBack: 'Ehliyet arka',
    uploaded: '✓ yüklendi',
    uploading: '… yükleniyor',
    addDoc: '+ ekle',
    additionalPhone: 'EK TELEFON',
    msgOn: 'Bu numaradaki mesajlaşma uygulamaları',
    mWhatsapp: 'WhatsApp',
    mTelegram: 'Telegram',
    mMax: 'Max',
    docReadHint: 'Belgeler okunaklı, parlamasız ve net olmalıdır.',
    docCountry: 'BELGE ÜLKESİ',
    docRegion: 'BÖLGE / EYALET',
    docPickCountry: 'Önce belgenin verildiği ülkeyi ve bölgeyi seçin.',
    docApproved: 'Onaylandı',
    docUnderReview: 'İnceleniyor',
    docExpired: 'Süresi doldu',
    docRejected: 'Reddedildi',
    docNeeded: 'Yükleme gerekli',
    docValidUntil: 'Geçerlilik',
    docAttach: 'Dosya ekle',
    docReplace: 'Değiştir',
    docRemove: 'Kaldır',
    docDelete: 'Yüklemeyi sil',
    docView: 'Görüntüle',
    docDeleteConfirm: 'Bu belge silinsin mi? Bu işlem geri alınamaz.',
    docSubmitReview: (n: number) => `İncelemeye gönder (${n})`,
    docSub1: 'Pasaport veya kimlik',
    docSub1Hint: 'Pasaportun fotoğraflı sayfasını veya kimlik kartınızın her iki yüzünü yükleyin.',
    docSub2: 'Yüzünüzle birlikte pasaport/kimlik',
    docSub2Hint: 'Pasaportunuzu/kimliğinizi yüzünüzün yanında tutun — fotoğraf net olmalıdır.',
    docSelfie: 'Belgeyle selfie',
    docSub3: 'Sürücü belgesi',
    docSub3Hint: 'Ehliyetinizin ön ve arka yüzünü yükleyin.',
    docNext: 'İleri',
    docStepOf: (a: number, b: number) => `Adım ${a} / ${b}`,
    guestUploadTitle: 'Belge yüklemek için giriş yapın',
    guestUploadBody: 'Hesap oluşturun veya giriş yapın — bilgilerinizi ve belgelerinizi kaydedelim, böylece bir sonraki rezervasyon daha hızlı olsun.',
    signIn: 'Giriş yap',
    signUp: 'Kayıt ol',
    lockedHint: 'Devam etmek için mevcut adımı tamamlayın.',
    insTitle: 'Sigorta',
    insBasic: 'Temel',
    insExt: 'Genişletilmiş',
    insFull: 'Tam, muafiyetsiz',
    fr: 'muafiyet',
    excessLabel: 'Muafiyet',
    whatsIncluded: 'Neler dâhil',
    perDayShort: '/gün',
    payCur: 'Ödeme para birimi',
    cryptoTitle: 'Kripto ile öde',
    cryptoSub: 'Belirtilen adrese yalnızca TRC20 ağı üzerinden USDT gönderin.',
    network: 'TRC20',
    consentPersonalPre: 'Kişisel verilerimin ',
    consentPersonalLink: 'gizlilik politikasına',
    consentPersonalPost: ' uygun şekilde işlenmesini kabul ediyorum.',
    consentOfferPre: 'Kabul ediyorum: ',
    consentOfferLink: 'mesafeli satış sözleşmesi',
    consentOfferPost: ' ve kiralama koşulları.',
    consentHeading: 'ONAYLAR',
    consentScrollFirst: 'belgeyi açın ve sonuna kadar kaydırın',
    period: 'Dönem',
    nights: 'gece',
    rent: 'Kiralama',
    extrasL: 'Ekstralar',
    insuranceL: 'Sigorta',
    total: 'Toplam',
    deposit: 'Depozito',
    submit: 'Talep gönder',
    submitting: 'Gönderiliyor…',
    noCharge: 'Ödeme yönetici onayından sonra',
    cardInstant: 'Kart hemen çekilir · rezervasyon anında onaylanır',
    payOnLastStep: 'Ödemek için Ödeme adımına gidin',
    back: 'Geri',
    cont: 'Devam et',
    stepNames: ['Güzergâh', 'Ekstralar', 'Bilgiler', 'Belgeler', 'Ödeme'],
    perDay: '/ gün',
    flat: 'tek seferlik',
    perTrip: '/ yolculuk',
    needConsent: 'Devam etmek için her iki onayı da işaretleyin.',
    suggestFree: 'En yakın uygun tarihler',
    unavailable: 'Seçilen tarihlerde araç müsait değil.',
    routeChoose: 'Aracı nasıl teslim alacaksınız',
    deliverTitle: 'Bana teslim edin',
    deliverDesc: 'Adresinize getirelim',
    officeTitle: 'Ofisten teslim al',
    officeDesc: 'Ofisimizden teslim alın',
    fullAddress: 'TAM ADRES',
    fullAddressPh: 'Sokak, bina, mahalle, yakın nokta',
    useLoc: '📍 Konumumu kullan',
    locating: '📍 Konum belirleniyor…',
    pinHint: 'Haritada bir işaret bırakın veya adresi doldurun.',
    ourOffice: 'Ofisimiz',
    directions: 'Yol tarifini aç:',
    durationL: 'Süre',
    dayU: 'gün',
    nightU: 'gece',
    payNowRoute: 'Şimdi öde',
    restReturn: 'kalanı iadede',
    noCities: 'Yönetici tarafından henüz şehir tanımlanmadı.',
    noOffice: 'Yönetici tarafından henüz ofis tanımlanmadı.',
    backToCar: 'Seçime dön',
    deliveryNA: 'Ofisten teslimde geçerli değil',
    pickHint: 'Takvimden tarihleri seçin — dolu günler kırmızı, hazırlık tamponu taralıdır. Saati aşağıdan ayarlayın.',
    selectEnd: 'Şimdi bitiş tarihini seçin',
    checkingRange: 'Müsaitlik kontrol ediliyor…',
    rangeOverlap: 'Bu tarihler mevcut bir rezervasyonla çakışıyor.',
    rangeMin: (n: number) => `Minimum kiralama süresi ${n} gün.`,
    rangeInvalid: 'Geçerli bir tarih aralığı seçin.',
    nearest: 'En yakın uygun',
    applyDates: 'kullan',
    busyUntilL: (d: string) => `${d} tarihine kadar dolu`,
    freeFromL: (d: string) => `${d} tarihinden itibaren müsait`,
    stepOfBar: (a: number, b: number) => `Adım ${a} / ${b}`,
    stepBack: 'Geri',
    moreDetails: 'Ayrıntılar',
    hideDetails: 'Gizle',
    payNowShort: 'Şimdi öde',
    exitTitle: 'Rezervasyondan çıkıyorsunuz',
    exitBody: 'Daha sonra devam edebilmek için girdiklerinizi kaydedelim mi? Taslak 24 saat saklanır, sonra otomatik olarak silinir.',
    exitSave: 'Kaydet ve çık',
    exitDiscard: 'Kaydetme',
    exitContinue: 'Rezervasyona devam et',
    exitSaving: 'Kaydediliyor…',
    resumeTitle: 'Rezervasyonunuza devam edilsin mi?',
    resumeBody: 'Bu araç için tamamlanmamış bir rezervasyonunuz var. Girdiklerinizi geri yükleyip aynı adımdan devam edelim mi?',
    resumeYes: 'Devam et',
    resumeFresh: 'Yeniden başla',
  },
  es: {
    toCatalog: 'Volver al catálogo',
    title: 'Completa tu reserva',
    s1: 'Ruta y punto de recogida',
    s2: 'Extras y seguro',
    s3: 'Datos del cliente',
    sDocs: 'Documentos',
    s4: 'Pago',
    cardFinalizingTitle: 'Confirmando tu pago…',
    cardFinalizingBody: 'Tu tarjeta fue autorizada. Estamos creando tu reserva — solo tardará un momento. Por favor, no cierres esta página.',
    cardFinalizeFail: 'No pudimos finalizar tu reserva tras el pago. Si se cobró tu tarjeta, se reembolsará automáticamente.',
    country: 'PAÍS',
    countryLocked: 'El país es fijo — Turquía',
    city: 'CIUDAD',
    address: 'DIRECCIÓN DE RECOGIDA',
    countryV: 'Turquía',
    cityV: 'Antalya',
    addressV: 'Aeropuerto de Antalya (AYT), Terminal 1, llegadas',
    pickupPh: 'Aeropuerto de Antalya (AYT), Terminal 1, llegadas',
    mapTitle: 'Mapa de recogida',
    pickupChip: 'Aeropuerto de Antalya (AYT)',
    dateFrom: 'INICIO DEL ALQUILER',
    dateTo: 'FIN DEL ALQUILER',
    dateOnly: 'Fecha',
    timeOnly: 'Hora',
    pickDateFirst: 'Elige primero una fecha',
    firstName: 'NOMBRE',
    lastName: 'APELLIDOS',
    phone: 'TELÉFONO',
    whatsapp: 'WHATSAPP',
    citizenship: 'NACIONALIDAD',
    birthDate: 'FECHA DE NACIMIENTO',
    passportNo: 'N.º DE PASAPORTE',
    licenseNo: 'N.º DE CARNÉ',
    licenseCountry: 'PAÍS DEL CARNÉ',
    addressLine: 'DOMICILIO',
    docsTitle: 'Documentos',
    verifyTitle: 'Verificación de identidad',
    verifyRequired: 'Completa la verificación de identidad para continuar con la reserva.',
    manualVerified: 'Identidad verificada',
    manualRejected: 'Verificación rechazada',
    manualPending: 'Documentos enviados — pendientes de revisión. Tu reserva se desbloquea cuando nuestro equipo los apruebe.',
    manualUploadPrompt: 'Sube tu pasaporte/DNI y tu carné de conducir (anverso y reverso). La reserva se desbloquea tras la aprobación de nuestro equipo.',
    passport: 'Pasaporte',
    dlFront: 'Carné anverso',
    dlBack: 'Carné reverso',
    uploaded: '✓ subido',
    uploading: '… subiendo',
    addDoc: '+ añadir',
    additionalPhone: 'TELÉFONO ADICIONAL',
    msgOn: 'Mensajería en este número',
    mWhatsapp: 'WhatsApp',
    mTelegram: 'Telegram',
    mMax: 'Max',
    docReadHint: 'Los documentos deben ser legibles, sin reflejos y nítidos.',
    docCountry: 'PAÍS DEL DOCUMENTO',
    docRegion: 'REGIÓN / PROVINCIA',
    docPickCountry: 'Primero selecciona el país y la región de emisión del documento.',
    docApproved: 'Aprobado',
    docUnderReview: 'En revisión',
    docExpired: 'Caducado',
    docRejected: 'Rechazado',
    docNeeded: 'Falta subirlo',
    docValidUntil: 'Válido hasta',
    docAttach: 'Adjuntar archivo',
    docReplace: 'Reemplazar',
    docRemove: 'Quitar',
    docDelete: 'Eliminar archivo',
    docView: 'Ver',
    docDeleteConfirm: '¿Eliminar este documento? Esta acción no se puede deshacer.',
    docSubmitReview: (n: number) => `Enviar a revisión (${n})`,
    docSub1: 'Pasaporte o DNI',
    docSub1Hint: 'Sube la página con foto del pasaporte o ambas caras de tu DNI.',
    docSub2: 'Pasaporte/DNI junto a tu cara',
    docSub2Hint: 'Sostén tu pasaporte/DNI junto a tu cara — la foto debe ser nítida.',
    docSelfie: 'Selfie con el documento',
    docSub3: 'Carné de conducir',
    docSub3Hint: 'Sube el anverso y el reverso de tu carné de conducir.',
    docNext: 'Siguiente',
    docStepOf: (a: number, b: number) => `Paso ${a} de ${b}`,
    guestUploadTitle: 'Inicia sesión para subir documentos',
    guestUploadBody: 'Crea una cuenta o inicia sesión — guardaremos tus datos y documentos para que la próxima reserva sea más rápida.',
    signIn: 'Iniciar sesión',
    signUp: 'Registrarse',
    lockedHint: 'Completa el paso actual para continuar.',
    insTitle: 'Seguro',
    insBasic: 'Básico',
    insExt: 'Ampliado',
    insFull: 'Total, sin franquicia',
    fr: 'franquicia',
    excessLabel: 'Franquicia',
    whatsIncluded: 'Qué incluye',
    perDayShort: '/día',
    payCur: 'Moneda de pago',
    cryptoTitle: 'Pagar con cripto',
    cryptoSub: 'Envía solo USDT en la red TRC20 a la dirección indicada.',
    network: 'TRC20',
    consentPersonalPre: 'Doy mi consentimiento para el tratamiento de mis datos personales conforme a la ',
    consentPersonalLink: 'política de privacidad',
    consentPersonalPost: '.',
    consentOfferPre: 'Acepto el ',
    consentOfferLink: 'contrato de venta a distancia',
    consentOfferPost: ' y las condiciones de alquiler.',
    consentHeading: 'CONSENTIMIENTOS',
    consentScrollFirst: 'abre y desplaza el documento hasta el final',
    period: 'Periodo',
    nights: 'noches',
    rent: 'Alquiler',
    extrasL: 'Extras',
    insuranceL: 'Seguro',
    total: 'Total',
    deposit: 'Fianza',
    submit: 'Enviar solicitud',
    submitting: 'Enviando…',
    noCharge: 'Pago tras la confirmación del gestor',
    cardInstant: 'Cobro inmediato · reserva confirmada al instante',
    payOnLastStep: 'Ve al paso de Pago para pagar',
    back: 'Atrás',
    cont: 'Continuar',
    stepNames: ['Ruta', 'Extras', 'Datos', 'Documentos', 'Pago'],
    perDay: '/ día',
    flat: 'único',
    perTrip: '/ viaje',
    needConsent: 'Marca ambos consentimientos para continuar.',
    suggestFree: 'Fechas disponibles más próximas',
    unavailable: 'Coche no disponible para las fechas seleccionadas.',
    routeChoose: 'Cómo recibes el coche',
    deliverTitle: 'Entregar a mí',
    deliverDesc: 'Lo llevamos a tu dirección',
    officeTitle: 'Recoger en oficina',
    officeDesc: 'Recógelo en nuestra oficina',
    fullAddress: 'DIRECCIÓN COMPLETA',
    fullAddressPh: 'Calle, edificio, barrio, punto de referencia',
    useLoc: '📍 Usar mi ubicación',
    locating: '📍 Localizando…',
    pinHint: 'Coloca un marcador en el mapa o rellena la dirección.',
    ourOffice: 'Nuestra oficina',
    directions: 'Abrir indicaciones:',
    durationL: 'Duración',
    dayU: 'd',
    nightU: 'n',
    payNowRoute: 'Pagar ahora',
    restReturn: 'resto a la devolución',
    noCities: 'El administrador aún no ha configurado ciudades.',
    noOffice: 'El administrador aún no ha definido una oficina.',
    backToCar: 'Volver a la selección',
    deliveryNA: 'No aplicable para recogida en oficina',
    pickHint: 'Elige fechas en el calendario — los días reservados están en rojo y el margen de preparación aparece rayado. Ajusta la hora abajo.',
    selectEnd: 'Ahora elige la fecha de fin',
    checkingRange: 'Comprobando disponibilidad…',
    rangeOverlap: 'Estas fechas se solapan con una reserva existente.',
    rangeMin: (n: number) => `El alquiler mínimo es de ${n} días.`,
    rangeInvalid: 'Elige un rango de fechas válido.',
    nearest: 'Más próximas disponibles',
    applyDates: 'usar',
    busyUntilL: (d: string) => `Reservado hasta ${d}`,
    freeFromL: (d: string) => `Disponible desde ${d}`,
    stepOfBar: (a: number, b: number) => `Paso ${a} de ${b}`,
    stepBack: 'Atrás',
    moreDetails: 'Detalles',
    hideDetails: 'Ocultar',
    payNowShort: 'Pagar ahora',
    exitTitle: 'Vas a salir de la reserva',
    exitBody: '¿Guardar lo que has introducido para continuar más tarde? El borrador se conserva 24 horas y luego se elimina automáticamente.',
    exitSave: 'Guardar y salir',
    exitDiscard: 'No guardar',
    exitContinue: 'Continuar la reserva',
    exitSaving: 'Guardando…',
    resumeTitle: '¿Retomar tu reserva?',
    resumeBody: 'Tienes una reserva sin terminar para este coche. ¿Restaurar lo que introdujiste y continuar desde el mismo paso?',
    resumeYes: 'Retomar',
    resumeFresh: 'Empezar de nuevo',
  },
  de: {
    toCatalog: 'Zum Katalog',
    title: 'Buchung abschließen',
    s1: 'Route und Abholort',
    s2: 'Extras und Versicherung',
    s3: 'Kundendaten',
    sDocs: 'Dokumente',
    s4: 'Zahlung',
    cardFinalizingTitle: 'Zahlung wird bestätigt…',
    cardFinalizingBody: 'Ihre Karte wurde autorisiert. Wir erstellen Ihre Buchung — das dauert nur einen Moment. Bitte schließen Sie diese Seite nicht.',
    cardFinalizeFail: 'Wir konnten Ihre Buchung nach der Zahlung nicht abschließen. Falls Ihre Karte belastet wurde, wird der Betrag automatisch erstattet.',
    country: 'LAND',
    countryLocked: 'Land ist festgelegt — Türkei',
    city: 'STADT',
    address: 'ABHOLADRESSE',
    countryV: 'Türkei',
    cityV: 'Antalya',
    addressV: 'Flughafen Antalya (AYT), Terminal 1, Ankunft',
    pickupPh: 'Flughafen Antalya (AYT), Terminal 1, Ankunft',
    mapTitle: 'Abholkarte',
    pickupChip: 'Flughafen Antalya (AYT)',
    dateFrom: 'MIETBEGINN',
    dateTo: 'MIETENDE',
    dateOnly: 'Datum',
    timeOnly: 'Uhrzeit',
    pickDateFirst: 'Zuerst ein Datum wählen',
    firstName: 'VORNAME',
    lastName: 'NACHNAME',
    phone: 'TELEFON',
    whatsapp: 'WHATSAPP',
    citizenship: 'STAATSANGEHÖRIGKEIT',
    birthDate: 'GEBURTSDATUM',
    passportNo: 'REISEPASS-NR.',
    licenseNo: 'FÜHRERSCHEIN-NR.',
    licenseCountry: 'FÜHRERSCHEINLAND',
    addressLine: 'WOHNADRESSE',
    docsTitle: 'Dokumente',
    verifyTitle: 'Identitätsprüfung',
    verifyRequired: 'Schließen Sie die Identitätsprüfung ab, um mit der Buchung fortzufahren.',
    manualVerified: 'Identität bestätigt',
    manualRejected: 'Prüfung abgelehnt',
    manualPending: 'Dokumente eingereicht — Prüfung ausstehend. Ihre Buchung wird freigegeben, sobald unser Team sie genehmigt.',
    manualUploadPrompt: 'Laden Sie Ihren Reisepass/Ausweis und Führerschein (Vorder- und Rückseite) hoch. Die Buchung wird nach der Genehmigung durch unser Team freigegeben.',
    passport: 'Reisepass',
    dlFront: 'Führerschein Vorderseite',
    dlBack: 'Führerschein Rückseite',
    uploaded: '✓ hochgeladen',
    uploading: '… wird hochgeladen',
    addDoc: '+ hinzufügen',
    additionalPhone: 'ZUSÄTZLICHES TELEFON',
    msgOn: 'Messenger unter dieser Nummer',
    mWhatsapp: 'WhatsApp',
    mTelegram: 'Telegram',
    mMax: 'Max',
    docReadHint: 'Dokumente müssen lesbar, spiegelungsfrei und scharf sein.',
    docCountry: 'DOKUMENTLAND',
    docRegion: 'REGION / BUNDESLAND',
    docPickCountry: 'Wählen Sie zuerst das Ausstellungsland und die Region des Dokuments.',
    docApproved: 'Genehmigt',
    docUnderReview: 'In Prüfung',
    docExpired: 'Abgelaufen',
    docRejected: 'Abgelehnt',
    docNeeded: 'Upload erforderlich',
    docValidUntil: 'Gültig bis',
    docAttach: 'Datei anhängen',
    docReplace: 'Ersetzen',
    docRemove: 'Entfernen',
    docDelete: 'Upload löschen',
    docView: 'Ansehen',
    docDeleteConfirm: 'Dieses Dokument löschen? Das kann nicht rückgängig gemacht werden.',
    docSubmitReview: (n: number) => `Zur Prüfung einreichen (${n})`,
    docSub1: 'Reisepass oder Ausweis',
    docSub1Hint: 'Laden Sie die Passbildseite oder beide Seiten Ihres Ausweises hoch.',
    docSub2: 'Reisepass/Ausweis neben Ihrem Gesicht',
    docSub2Hint: 'Halten Sie Ihren Reisepass/Ausweis neben Ihr Gesicht — das Foto muss scharf sein.',
    docSelfie: 'Selfie mit Dokument',
    docSub3: 'Führerschein',
    docSub3Hint: 'Laden Sie die Vorder- und Rückseite Ihres Führerscheins hoch.',
    docNext: 'Weiter',
    docStepOf: (a: number, b: number) => `Schritt ${a} von ${b}`,
    guestUploadTitle: 'Zum Hochladen von Dokumenten anmelden',
    guestUploadBody: 'Erstellen Sie ein Konto oder melden Sie sich an — wir speichern Ihre Daten und Dokumente, damit die nächste Buchung schneller geht.',
    signIn: 'Anmelden',
    signUp: 'Registrieren',
    lockedHint: 'Schließen Sie den aktuellen Schritt ab, um fortzufahren.',
    insTitle: 'Versicherung',
    insBasic: 'Basis',
    insExt: 'Erweitert',
    insFull: 'Vollkasko, ohne Selbstbeteiligung',
    fr: 'Selbstbeteiligung',
    excessLabel: 'Selbstbeteiligung',
    whatsIncluded: 'Was ist enthalten',
    perDayShort: '/Tag',
    payCur: 'Zahlungswährung',
    cryptoTitle: 'Mit Krypto zahlen',
    cryptoSub: 'Senden Sie nur USDT über das TRC20-Netzwerk an die angezeigte Adresse.',
    network: 'TRC20',
    consentPersonalPre: 'Ich willige in die Verarbeitung meiner personenbezogenen Daten gemäß der ',
    consentPersonalLink: 'Datenschutzerklärung',
    consentPersonalPost: ' ein.',
    consentOfferPre: 'Ich akzeptiere den ',
    consentOfferLink: 'Fernabsatzvertrag',
    consentOfferPost: ' und die Mietbedingungen.',
    consentHeading: 'EINWILLIGUNGEN',
    consentScrollFirst: 'öffnen Sie das Dokument und scrollen Sie bis zum Ende',
    period: 'Zeitraum',
    nights: 'Nächte',
    rent: 'Miete',
    extrasL: 'Extras',
    insuranceL: 'Versicherung',
    total: 'Gesamt',
    deposit: 'Kaution',
    submit: 'Anfrage senden',
    submitting: 'Wird gesendet…',
    noCharge: 'Zahlung nach Bestätigung durch den Manager',
    cardInstant: 'Karte wird sofort belastet · Buchung sofort bestätigt',
    payOnLastStep: 'Zum Bezahlen zum Zahlungsschritt gehen',
    back: 'Zurück',
    cont: 'Weiter',
    stepNames: ['Route', 'Extras', 'Angaben', 'Dokumente', 'Zahlung'],
    perDay: '/ Tag',
    flat: 'einmalig',
    perTrip: '/ Fahrt',
    needConsent: 'Setzen Sie beide Häkchen, um fortzufahren.',
    suggestFree: 'Nächste verfügbare Termine',
    unavailable: 'Fahrzeug für die gewählten Daten nicht verfügbar.',
    routeChoose: 'Wie Sie das Fahrzeug erhalten',
    deliverTitle: 'Zu mir liefern',
    deliverDesc: 'Wir bringen es zu Ihrer Adresse',
    officeTitle: 'Im Büro abholen',
    officeDesc: 'Abholung in unserem Büro',
    fullAddress: 'VOLLSTÄNDIGE ADRESSE',
    fullAddressPh: 'Straße, Gebäude, Viertel, Orientierungspunkt',
    useLoc: '📍 Meinen Standort verwenden',
    locating: '📍 Standort wird ermittelt…',
    pinHint: 'Setzen Sie eine Markierung auf der Karte oder geben Sie die Adresse ein.',
    ourOffice: 'Unser Büro',
    directions: 'Route öffnen:',
    durationL: 'Dauer',
    dayU: 'Tage',
    nightU: 'Nächte',
    payNowRoute: 'Jetzt zahlen',
    restReturn: 'Rest bei Rückgabe',
    noCities: 'Noch keine Städte vom Administrator konfiguriert.',
    noOffice: 'Noch kein Büro vom Administrator festgelegt.',
    backToCar: 'Zurück zur Auswahl',
    deliveryNA: 'Bei Abholung im Büro nicht verfügbar',
    pickHint: 'Wählen Sie Daten im Kalender — gebuchte Tage sind rot, der Aufbereitungspuffer ist schraffiert. Feinabstimmung der Uhrzeit unten.',
    selectEnd: 'Wählen Sie jetzt das Enddatum',
    checkingRange: 'Verfügbarkeit wird geprüft…',
    rangeOverlap: 'Diese Daten überschneiden sich mit einer bestehenden Buchung.',
    rangeMin: (n: number) => `Die Mindestmietdauer beträgt ${n} Tage.`,
    rangeInvalid: 'Wählen Sie einen gültigen Datumsbereich.',
    nearest: 'Nächste verfügbare',
    applyDates: 'übernehmen',
    busyUntilL: (d: string) => `Gebucht bis ${d}`,
    freeFromL: (d: string) => `Frei ab ${d}`,
    stepOfBar: (a: number, b: number) => `Schritt ${a} von ${b}`,
    stepBack: 'Zurück',
    moreDetails: 'Details',
    hideDetails: 'Ausblenden',
    payNowShort: 'Jetzt zahlen',
    exitTitle: 'Sie verlassen die Buchung',
    exitBody: 'Ihre Eingaben speichern, um später fortzufahren? Ein Entwurf wird 24 Stunden aufbewahrt und dann automatisch gelöscht.',
    exitSave: 'Speichern und verlassen',
    exitDiscard: 'Nicht speichern',
    exitContinue: 'Buchung fortsetzen',
    exitSaving: 'Wird gespeichert…',
    resumeTitle: 'Buchung fortsetzen?',
    resumeBody: 'Sie haben eine unvollständige Buchung für dieses Fahrzeug. Ihre Eingaben wiederherstellen und beim selben Schritt fortfahren?',
    resumeYes: 'Fortsetzen',
    resumeFresh: 'Neu beginnen',
  },
}

/* ------------------------------------------------------- payment-step dict */

/**
 * Payment-step copy (method labels, bank/crypto/card notes, online-payment banner).
 * Lang-keyed; English is the source of truth and the fallback (read as `PT[lang] ?? PT.en`).
 */
const PT = {
  ru: {
    payNow: 'Оплатить сейчас', depositOf: (n: number) => `депозит ${n}%`, remaining: 'Остаток при возврате авто',
    method: 'СПОСОБ ОПЛАТЫ', mCrypto: 'Криптовалюта', mBank: 'Банковский перевод', mCard: 'Карта',
    amountToSend: 'Сумма к отправке', copy: 'Копировать', copied: 'Скопировано',
    txHash: 'ХЭШ ТРАНЗАКЦИИ (TX HASH)', txHashPh: 'Вставьте hash после отправки',
    bankTitle: 'Реквизиты для перевода', recipient: 'Получатель', local: 'Доп. реквизиты',
    receipt: '＋ Загрузить чек / скриншот', receiptOk: '✓ Чек загружен', receiptUp: '… загрузка',
    receiptHint: 'Чек необязателен, но ускоряет подтверждение.',
    cardNote: 'Карта списывается на этом шаге оплаты — бронь подтверждается сразу после успешного платежа (документы уже проверены на предыдущем шаге). Выдача — как обычно.',
    cardPayTitle: 'Оплата депозита картой',
    cardPaySub: 'Бронь будет создана и автомобиль забронирован только после успешной оплаты.',
    cardPayBtn: 'Оплатить и забронировать',
    cardCancel: 'Отменить и выбрать другой способ',
    noMethods: 'Способы оплаты сейчас недоступны — менеджер свяжется с вами.',
    warn: (tok: string, net: string) => `Отправляйте только ${tok} в сети ${net} на этот адрес.`,
    onlineTitle: 'ОНЛАЙН-ОПЛАТА', onlineCards: 'карты', onlineCrypto: 'крипто',
    onlineSoon: 'подключается', onlineNote: 'Онлайн-эквайринг настраивается. Пока оформите бронь переводом или криптовалютой ниже — менеджер подтвердит оплату.',
  },
  en: {
    payNow: 'Pay now', depositOf: (n: number) => `${n}% deposit`, remaining: 'Remaining on car return',
    method: 'PAYMENT METHOD', mCrypto: 'Crypto', mBank: 'Bank transfer', mCard: 'Card',
    amountToSend: 'Amount to send', copy: 'Copy', copied: 'Copied',
    txHash: 'TRANSACTION HASH (TX HASH)', txHashPh: 'Paste the hash after sending',
    bankTitle: 'Bank details', recipient: 'Recipient', local: 'Extra details',
    receipt: '＋ Upload receipt / screenshot', receiptOk: '✓ Receipt uploaded', receiptUp: '… uploading',
    receiptHint: 'A receipt is optional but speeds up confirmation.',
    cardNote: 'Your card is charged on this payment step — the booking is confirmed the moment the charge succeeds (your documents were already verified in the previous step). Handover happens as usual.',
    cardPayTitle: 'Pay the deposit by card',
    cardPaySub: 'Your booking is created and the car is held only after the payment succeeds.',
    cardPayBtn: 'Pay & book',
    cardCancel: 'Cancel and choose another method',
    noMethods: 'Payment methods are unavailable right now — a manager will contact you.',
    warn: (tok: string, net: string) => `Send only ${tok} on the ${net} network to this address.`,
    onlineTitle: 'ONLINE PAYMENT', onlineCards: 'cards', onlineCrypto: 'crypto',
    onlineSoon: 'connecting', onlineNote: 'Online acquiring is being finalised. For now, reserve via bank transfer or crypto below — a manager confirms the payment.',
  },
  tr: {
    payNow: 'Şimdi öde', depositOf: (n: number) => `%${n} depozito`, remaining: 'Araç iadesinde kalan',
    method: 'ÖDEME YÖNTEMİ', mCrypto: 'Kripto', mBank: 'Banka havalesi', mCard: 'Kart',
    amountToSend: 'Gönderilecek tutar', copy: 'Kopyala', copied: 'Kopyalandı',
    txHash: 'İŞLEM HASH KODU (TX HASH)', txHashPh: 'Gönderdikten sonra hash kodunu yapıştırın',
    bankTitle: 'Banka bilgileri', recipient: 'Alıcı', local: 'Ek bilgiler',
    receipt: '＋ Makbuz / ekran görüntüsü yükle', receiptOk: '✓ Makbuz yüklendi', receiptUp: '… yükleniyor',
    receiptHint: 'Makbuz isteğe bağlıdır ancak onayı hızlandırır.',
    cardNote: 'Kartınız bu ödeme adımında tahsil edilir — ödeme başarılı olur olmaz rezervasyon onaylanır (belgeleriniz önceki adımda zaten doğrulandı). Teslim her zamanki gibi yapılır.',
    cardPayTitle: 'Kartla depozito ödemesi',
    cardPaySub: 'Rezervasyonunuz oluşturulur ve araç yalnızca ödeme başarılı olduktan sonra ayrılır.',
    cardPayBtn: 'Öde ve rezerve et',
    cardCancel: 'İptal et ve başka yöntem seç',
    noMethods: 'Ödeme yöntemleri şu anda kullanılamıyor — bir yönetici sizinle iletişime geçecek.',
    warn: (tok: string, net: string) => `Bu adrese yalnızca ${net} ağı üzerinden ${tok} gönderin.`,
    onlineTitle: 'ONLINE ÖDEME', onlineCards: 'kartlar', onlineCrypto: 'kripto',
    onlineSoon: 'yakında', onlineNote: 'Online tahsilat kuruluyor. Şimdilik aşağıdaki banka havalesi veya kripto ile rezervasyon yapın — ödemeyi bir yönetici onaylar.',
  },
  es: {
    payNow: 'Pagar ahora', depositOf: (n: number) => `${n}% de depósito`, remaining: 'Resto al devolver el coche',
    method: 'MÉTODO DE PAGO', mCrypto: 'Cripto', mBank: 'Transferencia bancaria', mCard: 'Tarjeta',
    amountToSend: 'Importe a enviar', copy: 'Copiar', copied: 'Copiado',
    txHash: 'HASH DE LA TRANSACCIÓN (TX HASH)', txHashPh: 'Pega el hash después de enviar',
    bankTitle: 'Datos bancarios', recipient: 'Beneficiario', local: 'Datos adicionales',
    receipt: '＋ Subir recibo / captura', receiptOk: '✓ Recibo subido', receiptUp: '… subiendo',
    receiptHint: 'El recibo es opcional, pero agiliza la confirmación.',
    cardNote: 'Tu tarjeta se cobra en este paso de pago: la reserva se confirma en cuanto el cobro se realiza correctamente (tus documentos ya se verificaron en el paso anterior). La entrega se realiza como de costumbre.',
    cardPayTitle: 'Pagar el depósito con tarjeta',
    cardPaySub: 'Tu reserva se crea y el coche se retiene solo después de que el pago se realice correctamente.',
    cardPayBtn: 'Pagar y reservar',
    cardCancel: 'Cancelar y elegir otro método',
    noMethods: 'Los métodos de pago no están disponibles ahora mismo: un gestor se pondrá en contacto contigo.',
    warn: (tok: string, net: string) => `Envía solo ${tok} en la red ${net} a esta dirección.`,
    onlineTitle: 'PAGO EN LÍNEA', onlineCards: 'tarjetas', onlineCrypto: 'cripto',
    onlineSoon: 'en proceso', onlineNote: 'La pasarela de pago en línea se está terminando de configurar. Por ahora, reserva mediante transferencia bancaria o cripto abajo: un gestor confirma el pago.',
  },
  de: {
    payNow: 'Jetzt bezahlen', depositOf: (n: number) => `${n}% Anzahlung`, remaining: 'Rest bei Rückgabe',
    method: 'ZAHLUNGSART', mCrypto: 'Krypto', mBank: 'Banküberweisung', mCard: 'Karte',
    amountToSend: 'Zu sendender Betrag', copy: 'Kopieren', copied: 'Kopiert',
    txHash: 'TRANSAKTIONS-HASH (TX HASH)', txHashPh: 'Hash nach dem Senden einfügen',
    bankTitle: 'Bankverbindung', recipient: 'Empfänger', local: 'Zusätzliche Angaben',
    receipt: '＋ Beleg / Screenshot hochladen', receiptOk: '✓ Beleg hochgeladen', receiptUp: '… wird hochgeladen',
    receiptHint: 'Ein Beleg ist optional, beschleunigt aber die Bestätigung.',
    cardNote: 'Ihre Karte wird in diesem Zahlungsschritt belastet — die Buchung wird bestätigt, sobald die Zahlung erfolgreich ist (Ihre Dokumente wurden bereits im vorherigen Schritt geprüft). Die Übergabe erfolgt wie gewohnt.',
    cardPayTitle: 'Anzahlung per Karte bezahlen',
    cardPaySub: 'Ihre Buchung wird erstellt und das Fahrzeug erst nach erfolgreicher Zahlung reserviert.',
    cardPayBtn: 'Bezahlen & buchen',
    cardCancel: 'Abbrechen und andere Methode wählen',
    noMethods: 'Zahlungsmethoden sind derzeit nicht verfügbar — ein Mitarbeiter wird sich bei Ihnen melden.',
    warn: (tok: string, net: string) => `Senden Sie nur ${tok} im ${net}-Netzwerk an diese Adresse.`,
    onlineTitle: 'ONLINE-ZAHLUNG', onlineCards: 'Karten', onlineCrypto: 'Krypto',
    onlineSoon: 'in Kürze', onlineNote: 'Die Online-Zahlung wird gerade eingerichtet. Reservieren Sie vorerst per Banküberweisung oder Krypto unten — ein Mitarbeiter bestätigt die Zahlung.',
  },
}

/* ----------------------------------------------------------------- consts */

interface InsuranceOpt {
  id: 'BASIC' | 'EXTENDED' | 'FULL_NO_FRANCHISE'
  rate: number // fraction of car pricePerDay per day
}
const INSURANCE: InsuranceOpt[] = [
  { id: 'BASIC', rate: 0 },
  { id: 'EXTENDED', rate: 0.15 },
  { id: 'FULL_NO_FRANCHISE', rate: 0.28 },
]

const CURRENCIES = ['EUR', 'USD', 'RUB', 'TRY', 'USDT', 'USDC'] as const
type Currency = (typeof CURRENCIES)[number]

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  RUB: '₽',
  TRY: '₺',
  USDT: '₮',
  USDC: 'USDC',
}

type DocSlot = 'PASSPORT' | 'SELFIE' | 'LICENSE_FRONT' | 'LICENSE_BACK'

/* ------------------------------------------------------------- money utils */

/** Convert a base-EUR amount into the selected currency (mirrors server money.ts). */
function convert(amountBase: number, currency: Currency, rates: Record<string, number>): number {
  const rate = rates[currency] ?? 1
  return Math.round(amountBase * rate * 100) / 100
}

/** Format like the server formatMoney (crypto 2dp / after; fiat 0dp / before). */
function fmt(amount: number, currency: Currency): string {
  const isCrypto = currency === 'USDT' || currency === 'USDC'
  const body = amount.toLocaleString('en-US', {
    minimumFractionDigits: isCrypto ? 2 : 0,
    maximumFractionDigits: 2,
  })
  if (currency === 'USDC') return `${body} USDC`
  if (currency === 'USDT') return `₮${body}`
  return `${CURRENCY_SYMBOLS[currency]}${body}`
}

/** Whole days between two ISO date strings (min 1). Mirrors rentalDays ceil-of-ms. */
function daysBetween(startISO: string, endISO: string): number {
  const s = new Date(startISO)
  const e = new Date(endISO)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 1
  const ms = e.getTime() - s.getTime()
  if (ms <= 0) return 1
  return Math.max(1, Math.ceil(ms / 864e5))
}

/** The YYYY-MM-DD part of a datetime-local string. */
function datePart(dt: string): string {
  return dt.slice(0, 10)
}
/** The HH:mm part of a datetime-local string (defaults to 10:00). */
function timePart(dt: string): string {
  return dt.slice(11, 16) || '10:00'
}
/** ISO instant → a local datetime-local input value (YYYY-MM-DDTHH:mm). */
function isoToLocalInput(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/** Whole overnight periods between start and end (0 for sub-24h rentals). */
function nightsBetween(startISO: string, endISO: string): number {
  const s = new Date(startISO)
  const e = new Date(endISO)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0
  const ms = e.getTime() - s.getTime()
  if (ms <= 0) return 0
  return Math.floor(ms / 864e5)
}

/* ------------------------------------------------------------- style bits */

const fieldLabel: CSSProperties = {
  font: '600 10px var(--f-mono)',
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  marginBottom: 8,
}
const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'var(--surface)',
  border: '1.5px solid var(--line)',
  borderRadius: 12,
  padding: '13px 14px',
  font: '500 15px var(--f-ui)',
  color: 'var(--ink)',
  outline: 'none',
}
const cardStyle: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 1px 2px rgba(6,33,38,.04),0 26px 54px -36px rgba(6,33,38,.5)',
}

// Redesign fonts + scoped focus ring (the whole page is wrapped in `.rdb`, which also
// redefines --f-* so every existing `var(--f-*)` renders in the new type system).
const BOOKING_FONTS =
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap'
const BOOKING_CSS = `
.rdb input:focus,.rdb select:focus,.rdb textarea:focus{border-color:#0d9488 !important;box-shadow:0 0 0 4px rgba(13,148,136,.10) !important}
`

function LabeledInput({
  label,
  value,
  onChange,
  span2 = false,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  span2?: boolean
  type?: string
  placeholder?: string
}) {
  return (
    <div style={span2 ? { gridColumn: 'span 2' } : undefined}>
      <div style={fieldLabel}>{label}</div>
      <input
        style={inputStyle}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

/** Messenger toggle chips shown under a phone field (WhatsApp / Telegram / Max). */
function MessengerTicks({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string
  options: { key: string; label: string }[]
  selected: string[]
  onToggle: (key: string) => void
}) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ font: '600 10px var(--f-ui)', color: 'var(--muted)', marginBottom: 6 }}>{legend}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {options.map((o) => {
          const on = selected.includes(o.key)
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => onToggle(o.key)}
              role="checkbox"
              aria-checked={on}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 999,
                cursor: 'pointer',
                background: on ? 'var(--teal-soft)' : 'var(--surface)',
                border: on ? '1.5px solid var(--teal)' : '1px solid var(--line)',
                font: '700 11.5px var(--f-ui)',
                color: on ? 'var(--teal-700)' : 'var(--muted)',
              }}
            >
              <span style={{ width: 14, height: 14, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? 'var(--teal)' : 'transparent', border: on ? 'none' : '1.5px solid var(--muted-2)', color: '#fff', font: '700 9px var(--f-ui)' }}>{on ? '✓' : ''}</span>
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepHead({ num, title }: { num: number; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          background: 'var(--teal-soft)',
          color: 'var(--teal-700)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          font: '700 14px var(--f-display)',
        }}
      >
        {num}
      </span>
      <div style={{ font: '700 22px var(--f-display)', letterSpacing: '-.015em', color: 'var(--ink)' }}>{title}</div>
    </div>
  )
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ color: 'var(--ink)', fontWeight: strong ? 700 : 600, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

/** ✓ / ~ / ✗ mark for an insurance coverage cell (status from the DB). */
function CoverMark({ status }: { status: 'yes' | 'no' | 'partial' | null }) {
  if (status === 'yes') return <span style={{ color: '#0d9488', font: '800 13px var(--f-ui)' }}>✓</span>
  if (status === 'partial') return <span style={{ color: '#E0A106', font: '800 14px var(--f-ui)' }}>~</span>
  if (status === 'no') return <span style={{ color: '#C4CED0', font: '700 12px var(--f-ui)' }}>✕</span>
  return <span style={{ color: '#C4CED0' }}>—</span>
}

/* ------------------------------------------------------------------ props */

export interface BookingProps {
  car: CarView | null
  extras: ServiceView[]
  rates: Record<string, number>
  currentUser: BookingUser | null
  profile: BookingProfile | null
  tripGoal?: string | null
  payment: BookingPayment
  cities: BookingCity[]
  offices: BookingOffice[]
  defaultCountry: string
  initialStart?: string | null
  initialEnd?: string | null
  backHref?: string | null
  availability: CarAvailability | null
  insuranceTiers: InsuranceTierView[]
  verification: DerivedVerification | null // DERIVED per-document state (drives the manual Documents step + gate)
  sumsubInitial: VerificationState | null // applicant-level state for the Sumsub widget only
  verificationMethod: string // 'MANUAL' | 'SUMSUB' (active method)
  verificationRequired: boolean
  draft: DraftView | null // in-progress booking to resume (server-side; survives sign-up)
  mapProvider: 'osm' | 'google' | 'yandex' // resolved map provider (OSM default) — maps render through it
  mapApiKey: string | null
}

/* ====================================================================== */

export default function Booking({ car, extras, rates, currentUser, profile, tripGoal, payment, cities, offices, defaultCountry, initialStart, initialEnd, backHref, availability, insuranceTiers, verification, sumsubInitial, verificationMethod, verificationRequired, draft, mapProvider, mapApiKey }: BookingProps) {
  const t = useDict(dict)
  const { lang } = useLang()
  const router = useRouter()
  const isMobile = useIsMobile()

  // When the customer is signed in, the whole checkout renders inside the cabinet's left green-sidebar
  // shell (design_handoff_aventa_cabinet_booking) so it "lives in the cabinet window". Guests keep the
  // standalone top-nav chrome. All step content + payment/booking/document logic is unchanged either way.
  const authed = !!currentUser
  const shellUser = currentUser
    ? {
        fullName: [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || currentUser.email || 'AVENTA',
        initial: ((currentUser.firstName || currentUser.email || 'A').trim()[0] || 'A').toUpperCase(),
        tierName: currentUser.loyaltyTier || 'MEMBER',
      }
    : null

  // step navigation (0-based)
  const [step, setStep] = useState(0)
  const [done, setDone] = useState<Set<number>>(new Set())

  // Mobile-only: the fixed bottom bar can expand into a price-breakdown sheet.
  const [sheetOpen, setSheetOpen] = useState(false)

  // dates (datetime-local, incl. time-of-day). Start EMPTY unless dates were passed in — the fields
  // show their native placeholder until the user picks from the calendar or types a value.
  const [startAt, setStartAt] = useState(initialStart || '')
  const [endAt, setEndAt] = useState(initialEnd || '')
  const days = useMemo(() => daysBetween(startAt, endAt), [startAt, endAt])
  const nights = useMemo(() => nightsBetween(startAt, endAt), [startAt, endAt])

  // Calendar range selection. The calendar drives the SAME startAt/endAt datetime state
  // (not a parallel mechanism); the verdict comes from validateCarRangeAction → the exact
  // checkCarAvailability the submit uses, so calendar & server can never disagree.
  const [pendingStart, setPendingStart] = useState<string | null>(null) // YYYY-MM-DD mid-pick
  const [rangeError, setRangeError] = useState<string | null>(null)
  const [rangeSuggestion, setRangeSuggestion] = useState<{ start: string; end: string } | null>(null)
  const [checkingRange, setCheckingRange] = useState(false)

  // route / pickup
  const [pickupCountry, setPickupCountry] = useState(defaultCountry || 'Türkiye')
  const [pickupCity, setPickupCity] = useState(cities[0]?.name ?? '')
  const [pickupAddress, setPickupAddress] = useState('')
  // 'delivery' → we bring the car to the customer's address/pin; 'office' → they collect from us
  const [routeMode, setRouteMode] = useState<'delivery' | 'office'>('delivery')
  const office = offices[0] ?? null
  const [pinLat, setPinLat] = useState<number | null>(null)
  const [pinLng, setPinLng] = useState<number | null>(null)
  const [geoBusy, setGeoBusy] = useState(false)

  // Restore an in-progress Route selection so returning here is never a blank form.
  // The SERVER draft (bound to the account) takes precedence — it survives the sign-up email
  // detour that a sessionStorage tab would not — and resumes at the step the user left off.
  const hydrated = useRef(false)
  // Keep two CSS vars in sync with the real, variable-height sticky headers:
  //  • --nav-h            → the step rail pins right below the sticky nav.
  //  • --booking-sticky-top → the sticky summary card must clear ALL sticky chrome above it, so its
  //    car photo never slides under the header. That's nav + step rail as a guest, or the AccountShell
  //    header when signed in (the rail is static there). We sum only elements that are actually sticky.
  useEffect(() => {
    const root = document.documentElement
    const selectors = ['.av-sticky-header', '.acs-hd-d', '.acs-hd-m', '.av-booking-steprail']
    const measure = () => {
      let navH = 0
      let stickyChrome = 0
      for (const sel of selectors) {
        const el = document.querySelector(sel) as HTMLElement | null
        if (!el) continue
        const h = el.offsetHeight
        if (h === 0) continue // hidden (e.g. the mobile header while on desktop)
        if (sel === '.av-sticky-header') navH = h
        if (getComputedStyle(el).position === 'sticky') stickyChrome += h
      }
      root.style.setProperty('--nav-h', `${navH || 72}px`)
      root.style.setProperty('--booking-sticky-top', `${stickyChrome + 14}px`)
    }
    measure()
    const ro = new ResizeObserver(measure)
    for (const sel of selectors) {
      const el = document.querySelector(sel)
      if (el) ro.observe(el)
    }
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [authed, isMobile])

  // (draft hydration + within-tab persistence effects live below, after fullSnapshot/restoreSnapshot)

  // The paid "delivery to address" extra is the SAME service concept as the Route-step
  // "deliver to me" choice. We keep them as two coupled fields (method vs. optional fee)
  // rather than one: an office pickup makes the fee inapplicable, while a delivery pickup
  // leaves the fee an explicit opt-in (never auto-charged).
  const deliveryServiceId = useMemo(() => extras.find((e) => e.key === 'delivery')?.id ?? null, [extras])
  // Extras by service id → qty (presence = selected). Delivery is NOT auto-added.
  const [selExtras, setSelExtras] = useState<Record<string, number>>({})

  // Coupling (one-directional): whenever office pickup is active, drop the paid delivery
  // extra so the customer is never charged a delivery fee for collecting from the office.
  // Switching back to "deliver to me" does NOT re-add it — the customer must pick it again.
  // Runs on every routeMode change AND on hydration, so the price stays consistent no
  // matter the order of navigation. Total + deposit recompute reactively (see `totals`).
  useEffect(() => {
    if (routeMode !== 'office' || !deliveryServiceId) return
    setSelExtras((prev) => {
      if (!prev[deliveryServiceId]) return prev
      const next = { ...prev }
      delete next[deliveryServiceId]
      return next
    })
  }, [routeMode, deliveryServiceId])

  const [insurance, setInsurance] = useState<InsuranceOpt['id']>('EXTENDED')
  const [currency, setCurrency] = useState<Currency>('EUR')

  // payment method + reservation-deposit proof
  const enabledMethods = useMemo(() => {
    const m: ('crypto' | 'bank' | 'card')[] = []
    if (payment.methods.crypto && payment.wallets.length > 0) m.push('crypto')
    if (payment.methods.bank) m.push('bank')
    if (payment.methods.card) m.push('card')
    return m
  }, [payment])
  const [payMethod, setPayMethod] = useState<'crypto' | 'bank' | 'card' | null>(enabledMethods[0] ?? null)
  const [walletIdx, setWalletIdx] = useState(0)
  const [txHash, setTxHash] = useState('')
  const [proof, setProof] = useState<{ id: string; status: 'uploading' | 'done' } | null>(null)
  const [payError, setPayError] = useState<string | null>(null)

  const toggleExtra = (id: string) =>
    setSelExtras((prev) => {
      const next = { ...prev }
      if (next[id]) delete next[id]
      else next[id] = 1
      return next
    })

  // personal / contract data (prefill from user + profile). Passport/licence numbers are
  // NOT collected here — an admin records them while approving the documents.
  const [firstName, setFirstName] = useState(currentUser?.firstName ?? '')
  const [lastName, setLastName] = useState(currentUser?.lastName ?? '')
  const [birthDate, setBirthDate] = useState((profile?.birthDate ?? '').slice(0, 10))
  const [phone, setPhone] = useState(currentUser?.phone ?? '')
  const [additionalPhone, setAdditionalPhone] = useState(profile?.additionalPhone ?? '')
  const [phoneMsgs, setPhoneMsgs] = useState<string[]>(profile?.phoneMessengers ?? [])
  const [addPhoneMsgs, setAddPhoneMsgs] = useState<string[]>(profile?.additionalPhoneMessengers ?? [])
  const [addressLine, setAddressLine] = useState(profile?.addressLine ?? '')
  const toggleMsg = (setter: React.Dispatch<React.SetStateAction<string[]>>, key: string) =>
    setter((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

  // documents step (own step; country/state chosen before uploading; per-document staging).
  // Country defaults to Turkey (the company's country) so the user isn't required to select it — the
  // picker treats a chosen country as sufficient (region optional), so this default is already valid.
  const [docCountry, setDocCountry] = useState(profile?.docCountry || 'Turkey')
  const [docRegion, setDocRegion] = useState(profile?.docRegion ?? '')
  // The picker reports when the location is a valid selection (a country is chosen). Starts valid
  // because the country is pre-defaulted to Turkey.
  const [docLocValid, setDocLocValid] = useState(true)

  // Per-document STAGING: a locally-chosen file (preview + delete/replace) that is NOT yet sent to
  // the admin. Only "Отправить на проверку" uploads staged files, each as a new PENDING submission.
  type Staged = { file: File; url: string }
  const [staged, setStaged] = useState<Partial<Record<DocSlot, Staged>>>({})
  const [docError, setDocError] = useState<string | null>(null)
  const [submittingDocs, setSubmittingDocs] = useState(false)

  // consents
  const [consentPersonal, setConsentPersonal] = useState(false)
  const [consentOffer, setConsentOffer] = useState(false)
  // Scroll-to-confirm gate: a consent checkbox only enables once its document has been read to the end
  // in the modal. `legalModal` is the open document (or null).
  const [legalModal, setLegalModal] = useState<LegalDocKey | null>(null)
  const [scrolledPrivacy, setScrolledPrivacy] = useState(false)
  const [scrolledOffer, setScrolledOffer] = useState(false)

  // Draft persistence UX: the step-1 exit dialog (Save / Don't save / Continue) and the resume prompt
  // shown when a saved (server) draft exists on load. A logged-in user's data is persisted ONLY via
  // Save here — leaving unsaved loses it and restarts fresh next time.
  const [exitDialog, setExitDialog] = useState(false)
  const [resumeOffer, setResumeOffer] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  // Gates within-tab persistence: flipped true only AFTER the mount hydration has settled, so the
  // write effect can never fire on the hydration commit and clobber good sessionStorage with defaults.
  const [persistReady, setPersistReady] = useState(false)

  // submission
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<{ start: string; end: string } | null>(null)
  // OPTION A card flow: after the customer submits with CARD, we prepare a Stripe PaymentIntent for the
  // deposit and mount the card form; the booking is created ONLY after a successful charge (handleCardPaid).
  const [cardStage, setCardStage] = useState<
    { clientSecret: string; publishableKey: string; amountLabel?: string; intentId: string; input: BookingCreateInput & { documentIds?: string[] } } | null
  >(null)
  const [cardError, setCardError] = useState<string | null>(null)
  // A 3-D Secure card redirect returns to this page with ?payment_intent=…&redirect_status=succeeded.
  // `finalizingCard` shows a "confirming your payment" overlay while we create the (already-paid) booking
  // from the input we stashed before redirecting — so a redirect-based SCA challenge can't strand the deposit.
  const [finalizingCard, setFinalizingCard] = useState(false)
  const finalizeRan = useRef(false)

  // ID verification gate — method-agnostic and DERIVED. MANUAL: the server-provided per-document
  // `verification.verified` (updates on router.refresh after each submit/decision). SUMSUB: the
  // widget reports its own state client-side. `verified` is the single value the gate reads.
  const [sumsubValid, setSumsubValid] = useState(verification?.verified ?? false)
  const verified = verificationMethod === 'SUMSUB' ? sumsubValid : (verification?.verified ?? false)
  // When verification is required, Step 3 (index 2) cannot be left until it is valid.
  const verifyGateBlocks = verificationRequired && !verified
  // Where to return after sign-in/up from the Documents guest gate (Phase-1 basic prompt).
  const bookingPath = car ? `/booking?car=${car.slug}` : '/booking'

  // Poll-while-pending (MANUAL method): while any submitted document is under review, re-fetch the
  // server state periodically so an admin approve/reject appears automatically — no manual reload.
  // router.refresh() re-derives `verification`; when nothing is pending the effect cleans up and stops.
  const anyPending = verification?.anyPending ?? false
  useEffect(() => {
    if (verificationMethod !== 'MANUAL' || !anyPending) return
    const id = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(id)
  }, [verificationMethod, anyPending, router])

  // Insurance coverage text is admin-managed in the DB (NOT hardcoded), keyed by tier.
  // Each tier renders its own "what's included" inline on its card (no shared table).
  const tierByKey = useMemo(
    () => Object.fromEntries(insuranceTiers.map((tier) => [tier.key, tier])) as Record<string, InsuranceTierView | undefined>,
    [insuranceTiers],
  )

  const perDay = car?.pricePerDay ?? 0
  const depositBase = car?.deposit ?? 0

  /** Per-extra base-EUR price for the current window (mirrors pricing.ts). */
  const extraLineBase = (svc: ServiceView, qty: number): number =>
    svc.unit === 'per_day' ? svc.price * days * qty : svc.price * qty

  const unitLabel = (unit: string): string =>
    unit === 'per_day' ? t.perDay : unit === 'per_trip' ? t.perTrip : t.flat

  /* ---- totals (base EUR → selected currency), mirroring the server ---- */
  const totals = useMemo(() => {
    const rentBase = perDay * days
    let extrasBase = 0
    for (const [id, qty] of Object.entries(selExtras)) {
      const svc = extras.find((e) => e.id === id)
      if (svc) extrasBase += extraLineBase(svc, qty)
    }
    const insRate = INSURANCE.find((x) => x.id === insurance)?.rate ?? 0
    const insBase = perDay * insRate * days
    const subtotalBase = rentBase + extrasBase + insBase
    return {
      rent: convert(rentBase, currency, rates),
      extras: convert(extrasBase, currency, rates),
      insurance: convert(insBase, currency, rates),
      total: convert(subtotalBase, currency, rates),
      deposit: convert(depositBase, currency, rates),
      subtotalBase,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perDay, depositBase, days, selExtras, insurance, currency, rates, extras])

  /* ---- reservation deposit (admin %) → "pay now / rest on return" ---- */
  const depositPercent = payment.depositPercent
  const payNowBase = Math.round(((totals.subtotalBase * depositPercent) / 100) * 100) / 100
  const remainingBase = Math.round((totals.subtotalBase - payNowBase) * 100) / 100
  const payNowDisplay = convert(payNowBase, currency, rates)
  const remainingDisplay = convert(remainingBase, currency, rates)
  const wallet = payment.wallets[walletIdx] ?? payment.wallets[0] ?? null
  const payNowCrypto = wallet ? convert(payNowBase, wallet.token as Currency, rates) : payNowDisplay

  /* ---- payment proof (receipt) upload → encrypted store ---- */
  const onPickProof = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPayError(null)
    setProof({ id: '', status: 'uploading' })
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', 'PAYMENT_PROOF')
    const res = await uploadDocumentAction(fd)
    if (res.ok && res.documentId) {
      setProof({ id: res.documentId, status: 'done' })
    } else {
      setProof(null)
      setPayError(res.error ?? 'Не удалось загрузить чек')
    }
  }

  const pt = PT[lang] ?? PT.en

  const proofRow = (
    <div style={{ marginTop: 12 }}>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 10, cursor: 'pointer', background: proof?.status === 'done' ? '#E6F8EE' : '#fff', border: '1px solid rgba(20,153,174,.25)', font: '700 12px var(--f-ui)', color: proof?.status === 'done' ? '#1F9E6B' : '#0d9488' }}>
        {proof?.status === 'done' ? pt.receiptOk : proof?.status === 'uploading' ? pt.receiptUp : pt.receipt}
        <input type="file" accept="image/*,.pdf" hidden onChange={onPickProof} />
      </label>
      <div style={{ marginTop: 6, font: '500 11px var(--f-ui)', color: '#5b7678' }}>{pt.receiptHint}</div>
    </div>
  )

  /* ---- calendar range selection ---- */
  const clearRangeMsgs = () => {
    setRangeError(null)
    setRangeSuggestion(null)
  }
  /** Validate [startDate,endDate] via the server gate, committing to startAt/endAt on success. */
  const commitRange = async (startDate: string, endDate: string) => {
    if (!car) return
    setCheckingRange(true)
    clearRangeMsgs()
    const st = `${startDate}T${timePart(startAt)}`
    const en = `${endDate}T${timePart(endAt)}`
    const res = await validateCarRangeAction({
      carId: car.slug,
      start: new Date(st).toISOString(),
      end: new Date(en).toISOString(),
    })
    setCheckingRange(false)
    if (res.ok) {
      setStartAt(st)
      setEndAt(en)
      setPendingStart(null)
    } else {
      setRangeSuggestion(res.suggestion ?? null)
      setRangeError(
        res.reason === 'MIN_RENTAL'
          ? t.rangeMin(res.minRentalDays ?? 1)
          : res.reason === 'OVERLAP'
            ? t.rangeOverlap
            : t.rangeInvalid,
      )
    }
  }
  /** A day was clicked on the calendar (only ever a `free` day — others are disabled). */
  const onPickDate = (date: string) => {
    setRangeError(null)
    if (pendingStart === null) {
      setPendingStart(date)
      setRangeSuggestion(null)
    } else if (date <= pendingStart) {
      setPendingStart(date) // clicking on/before the pending start restarts the range
    } else {
      void commitRange(pendingStart, date)
    }
  }
  const applySuggestion = () => {
    if (!rangeSuggestion) return
    setStartAt(isoToLocalInput(rangeSuggestion.start))
    setEndAt(isoToLocalInput(rangeSuggestion.end))
    setPendingStart(null)
    clearRangeMsgs()
  }
  const startFromNextFree = () => {
    if (!availability?.nextFree) return
    setStartAt(isoToLocalInput(availability.nextFree))
    setPendingStart(null)
    clearRangeMsgs()
  }
  // Only paint a committed range blue when EVERY day in it is free (guards a seeded/default
  // range that happens to overlap a booking — never show an unbookable range as "selected").
  const rangeAllFree = useMemo(() => {
    if (!availability) return true
    const sd = datePart(startAt)
    const ed = datePart(endAt)
    if (!(sd < ed)) return false
    return availability.days.every((d) => !(d.date >= sd && d.date <= ed) || d.state === 'free')
  }, [availability, startAt, endAt])
  // What the calendar highlights blue: the pending start alone while picking, else the range.
  const calStart = pendingStart ?? (rangeAllFree ? datePart(startAt) : null)
  const calEnd = pendingStart ? null : rangeAllFree ? datePart(endAt) : null
  const calInitialMonth =
    availability && !availability.availableNow && availability.nextFree
      ? isoToLocalInput(availability.nextFree).slice(0, 7)
      : datePart(startAt).slice(0, 7)

  /* ---- step gating: a step is complete only when its data is sufficient; a later step
     is reachable only when every step before it is complete. Back-navigation to any
     already-reachable step stays allowed. Steps: 0 Route · 1 Extras · 2 Details ·
     3 Documents · 4 Payment (FINAL — pay the deposit + create the booking here).
     LAST_STEP = 4 (the old separate "Done/Confirm" step 5 was merged into Payment). ---- */
  const LAST_STEP = 4
  const stepValid = (i: number): boolean => {
    switch (i) {
      case 0: return !!startAt && !!endAt && rangeAllFree && !checkingRange && !rangeError && consentPersonal && consentOffer
      case 1: return true
      case 2: return firstName.trim().length > 0 && lastName.trim().length > 0 && phone.trim().length > 0
      case 3: return !verificationRequired || verified // documents approved (derived per-document / Sumsub)
      case 4: return true
      default: return true
    }
  }
  // The first step whose data is not yet complete — you can reach it, but nothing beyond it.
  let firstIncomplete = LAST_STEP
  for (let i = 0; i < LAST_STEP; i++) { if (!stepValid(i)) { firstIncomplete = i; break } }
  const reachable = (i: number): boolean => i <= firstIncomplete
  const goto = (i: number) => {
    if (!reachable(i)) return
    setDone((prev) => {
      const nextSet = new Set(prev)
      if (i > step) nextSet.add(step)
      return nextSet
    })
    setStep(i)
  }
  // The WHOLE booking form captured for a draft / resume (so returning restores every step's inputs,
  // not just Route). Keep in sync with restoreSnapshot below.
  const fullSnapshot = () => ({
    startAt, endAt, pickupCountry, pickupCity, routeMode, pickupAddress, pinLat, pinLng,
    selExtras, insurance, currency, payMethod,
    firstName, lastName, birthDate, phone, additionalPhone, phoneMsgs, addPhoneMsgs, addressLine,
    docCountry, docRegion, consentPersonal, consentOffer,
  })
  const restoreSnapshot = (s: Record<string, unknown>) => {
    if (typeof s.startAt === 'string') setStartAt(s.startAt)
    if (typeof s.endAt === 'string') setEndAt(s.endAt)
    if (typeof s.pickupCountry === 'string') setPickupCountry(s.pickupCountry)
    if (typeof s.pickupCity === 'string' && cities.some((c) => c.name === s.pickupCity)) setPickupCity(s.pickupCity)
    if (s.routeMode === 'office' && offices.length > 0) setRouteMode('office')
    else if (s.routeMode === 'delivery') setRouteMode('delivery')
    if (typeof s.pickupAddress === 'string') setPickupAddress(s.pickupAddress)
    if (typeof s.pinLat === 'number') setPinLat(s.pinLat)
    if (typeof s.pinLng === 'number') setPinLng(s.pinLng)
    if (s.selExtras && typeof s.selExtras === 'object' && !Array.isArray(s.selExtras)) setSelExtras(s.selExtras as Record<string, number>)
    if (typeof s.insurance === 'string') setInsurance(s.insurance as InsuranceOpt['id'])
    if (typeof s.currency === 'string') setCurrency(s.currency as Currency)
    if (s.payMethod === 'crypto' || s.payMethod === 'bank' || s.payMethod === 'card' || s.payMethod === null) setPayMethod(s.payMethod)
    if (typeof s.firstName === 'string') setFirstName(s.firstName)
    if (typeof s.lastName === 'string') setLastName(s.lastName)
    if (typeof s.birthDate === 'string') setBirthDate(s.birthDate)
    if (typeof s.phone === 'string') setPhone(s.phone)
    if (typeof s.additionalPhone === 'string') setAdditionalPhone(s.additionalPhone)
    if (Array.isArray(s.phoneMsgs)) setPhoneMsgs(s.phoneMsgs.filter((x): x is string => typeof x === 'string'))
    if (Array.isArray(s.addPhoneMsgs)) setAddPhoneMsgs(s.addPhoneMsgs.filter((x): x is string => typeof x === 'string'))
    if (typeof s.addressLine === 'string') setAddressLine(s.addressLine)
    if (typeof s.docCountry === 'string') setDocCountry(s.docCountry)
    if (typeof s.docRegion === 'string') setDocRegion(s.docRegion)
    if (s.consentPersonal === true) setConsentPersonal(true)
    if (s.consentOffer === true) setConsentOffer(true)
  }

  // On mount: a SAVED (server) draft → OFFER to resume (don't silently restore). Otherwise restore any
  // WITHIN-TAB work (sessionStorage survives a refresh). A fresh visit / new tab with no saved draft
  // starts clean → step 0, later steps re-locked. So leaving unsaved genuinely restarts from the top.
  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    try {
      const rp = new URLSearchParams(window.location.search)
      if (rp.get('payment_intent') && rp.get('redirect_status')) return // card-redirect return → finalize effect owns this load
      if (draft?.data) { setResumeOffer(true); return } // offer resume; skip within-tab restore
      const raw = sessionStorage.getItem('aventa_booking')
      const s = raw ? JSON.parse(raw) : null
      if (s && s.data && typeof s.data === 'object') {
        restoreSnapshot(s.data as Record<string, unknown>)
        if (typeof s.step === 'number') setStep(Math.max(0, Math.min(LAST_STEP, s.step)))
      }
    } catch {
      /* ignore */
    } finally {
      setPersistReady(true) // enable persistence only after this commit settles (see `persistReady` note)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Within-tab persistence (survives a refresh; NOT a saved draft). Held until `persistReady`
  // (post-hydration) and paused while the resume prompt decides, so it never clobbers restored data.
  useEffect(() => {
    if (!persistReady || resumeOffer) return
    try {
      sessionStorage.setItem('aventa_booking', JSON.stringify({ data: fullSnapshot(), step }))
    } catch {
      /* ignore */
    }
  })

  // Escape dismisses either overlay (exit dialog → Continue; resume prompt → keep the draft for later).
  useEffect(() => {
    if (!exitDialog && !resumeOffer) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setExitDialog(false); setResumeOffer(false) } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [exitDialog, resumeOffer])

  const clearSession = () => { try { sessionStorage.removeItem('aventa_booking') } catch { /* ignore */ } }
  /** On a completed booking, drop the resumable draft (server) + within-tab work so it never
   *  re-offers as "resume" and the sweep has nothing to collect. */
  const clearDraftAndSession = () => { if (car) void discardBookingDraftAction(car.slug); clearSession() }

  // ── 3-D Secure redirect return: finalize the already-paid card booking ────────────────────────────
  // JSON-serialization turned the input's Dates into ISO strings before we stashed it; revive them so the
  // server action (whose schema expects Date objects) accepts the input.
  const reviveCardInput = (raw: Record<string, unknown>): BookingCreateInput & { documentIds?: string[] } => {
    const profile = raw.profile && typeof raw.profile === 'object' ? (raw.profile as Record<string, unknown>) : null
    return {
      ...raw,
      startAt: new Date(String(raw.startAt)),
      endAt: new Date(String(raw.endAt)),
      ...(profile
        ? { profile: { ...profile, ...(profile.birthDate ? { birthDate: new Date(String(profile.birthDate)) } : {}) } }
        : {}),
    } as unknown as BookingCreateInput & { documentIds?: string[] }
  }
  useEffect(() => {
    if (finalizeRan.current || typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const intentId = params.get('payment_intent')
    if (!intentId || params.get('redirect_status') !== 'succeeded') return // not a card-redirect return
    finalizeRan.current = true
    let pending: { intentId?: string; input?: Record<string, unknown> } | null = null
    try { pending = JSON.parse(sessionStorage.getItem('aventa_card_pending') || 'null') } catch { pending = null }
    if (!pending || pending.intentId !== intentId || !pending.input) {
      // Input lost (tab closed / other browser) — we can't recreate the booking here; the reconcile cron
      // refunds the stranded deposit. Tell the customer and strip the query so a refresh can't loop.
      setError(t.cardFinalizeFail)
      window.history.replaceState(null, '', bookingPath)
      return
    }
    setFinalizingCard(true)
    void (async () => {
      try {
        const res = await createBookingAction({ ...reviveCardInput(pending.input as Record<string, unknown>), cardPaymentIntentId: intentId })
        try { sessionStorage.removeItem('aventa_card_pending') } catch { /* ignore */ }
        if (res.ok && res.redirectTo) {
          clearDraftAndSession()
          router.push(res.redirectTo)
          return
        }
        // The server refunds when it charged but can't create (car taken, drift); surface its message.
        setFinalizingCard(false)
        setError(res.error ?? t.cardFinalizeFail)
        window.history.replaceState(null, '', bookingPath)
      } catch {
        setFinalizingCard(false)
        setError(t.cardFinalizeFail)
        window.history.replaceState(null, '', bookingPath)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const next = () => {
    if (!stepValid(step)) return // can't advance past an unfinished step (incl. the doc gate)
    // After Route (step 0), an anonymous visitor must sign up to continue: persist their work as a
    // draft (anon cookie now, bound to the account at sign-up) and send them to sign-up with a return
    // path. This save is intrinsic to the auth detour — NOT the general auto-save (removed): a logged-in
    // user's in-progress data is only persisted when they explicitly Save via the exit dialog.
    if (step === 0 && !currentUser && car) {
      void saveBookingDraftAction({ carSlug: car.slug, data: fullSnapshot(), step: 1 }).then(() =>
        router.push(`/auth?next=${encodeURIComponent(bookingPath)}`),
      )
      return
    }
    if (step < LAST_STEP) goto(step + 1)
  }
  const back = () => {
    if (step > 0) goto(step - 1)
    else setExitDialog(true) // step 1 Back → Save / Don't save / Continue
  }
  /** Leave the booking flow back to where the customer came from. */
  const leaveFlow = () => {
    // Only honour an explicit, internal back path (same-origin '/x'); else history, then fleet.
    if (safeInternalPath(backHref)) router.push(backHref as string)
    else if (typeof window !== 'undefined' && window.history.length > 1) router.back()
    else router.push('/#fleet')
  }

  // ── Exit dialog (step-1 Back) + resume prompt (returning with a saved draft) ─────────────────
  /** Save → persist a resumable draft (24h TTL) and leave. */
  const saveAndExit = async () => {
    if (!car) { setExitDialog(false); leaveFlow(); return }
    setSavingDraft(true)
    await saveBookingDraftAction({ carSlug: car.slug, data: fullSnapshot(), step })
    setSavingDraft(false)
    setExitDialog(false)
    leaveFlow()
  }
  /** Don't save → discard any draft + within-tab work, then leave (a return starts fresh). */
  const discardAndExit = () => {
    if (car) void discardBookingDraftAction(car.slug)
    clearSession()
    setExitDialog(false)
    leaveFlow()
  }
  /** Resume → restore the saved draft's data and jump to the furthest step they'd reached
   *  (restoring data auto-unlocks those steps because step validity derives from the data). */
  const resumeDraft = () => {
    if (draft?.data) {
      restoreSnapshot(draft.data)
      setStep(Math.max(0, Math.min(LAST_STEP, draft.step)))
    }
    setResumeOffer(false)
  }
  /** Start fresh → drop the saved draft and begin at step 0. The form is still at its mount
   *  defaults (we only OFFERED to resume, never restored), so dismissing is all that's needed. */
  const startFresh = () => {
    if (car) void discardBookingDraftAction(car.slug)
    clearSession()
    setStep(0)
    setResumeOffer(false)
  }
  /** Select the pickup method; picking office clears the paid delivery extra in the SAME
   *  render batch (no total flicker). The coupling effect above still covers hydration. */
  const selectRoute = (m: 'delivery' | 'office') => {
    setRouteMode(m)
    if (m === 'office' && deliveryServiceId) {
      setSelExtras((prev) => {
        if (!prev[deliveryServiceId]) return prev
        const next = { ...prev }
        delete next[deliveryServiceId]
        return next
      })
    }
  }
  /** Delivery: fill the pin from the device location ("share my location"). */
  const useMyLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    setGeoBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPinLat(Math.round(pos.coords.latitude * 1e6) / 1e6)
        setPinLng(Math.round(pos.coords.longitude * 1e6) / 1e6)
        setGeoBusy(false)
      },
      () => setGeoBusy(false),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  /* ---- document upload ---- */
  // Revoke any staged object URLs when the flow unmounts (avoid leaking blob URLs if the user leaves
  // after staging without submitting). Uses a ref so the cleanup runs once, on unmount only.
  const stagedRef = useRef(staged)
  stagedRef.current = staged
  useEffect(() => () => { Object.values(stagedRef.current).forEach((s) => s && URL.revokeObjectURL(s.url)) }, [])

  // Stage a locally-chosen file for a slot (preview only — nothing is sent yet; replaces any prior staged pick).
  const stageFile = (slot: DocSlot, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    setDocError(null)
    setStaged((prev) => {
      const cur = prev[slot]
      if (cur) URL.revokeObjectURL(cur.url)
      return { ...prev, [slot]: { file, url: URL.createObjectURL(file) } }
    })
  }
  // Remove a staged pick (before submit) so the user can re-insert a different image.
  const unstage = (slot: DocSlot) =>
    setStaged((prev) => {
      const cur = prev[slot]
      if (cur) URL.revokeObjectURL(cur.url)
      const next = { ...prev }
      delete next[slot]
      return next
    })
  // Submit all staged documents for review — each becomes a NEW pending attempt (server supersedes
  // any prior current attempt of that type). Then refresh so the server-derived state updates.
  const submitDocuments = async () => {
    const entries = Object.entries(staged) as [DocSlot, Staged][]
    if (!entries.length || submittingDocs) return
    setSubmittingDocs(true)
    setDocError(null)
    const done: DocSlot[] = []
    let failed: string | null = null
    for (const [slot, s] of entries) {
      const fd = new FormData()
      fd.append('file', s.file)
      fd.append('type', slot)
      const res = await uploadDocumentAction(fd)
      if (!res.ok) {
        failed = res.error ?? 'Ошибка загрузки'
        break // stop; a partial failure must NOT silently drop the remaining picks
      }
      URL.revokeObjectURL(s.url)
      done.push(slot)
    }
    // Clear ONLY the slots that actually uploaded (now PENDING on the server, URLs revoked); keep any
    // that failed / weren't attempted so their preview stays intact and they can be resubmitted.
    if (done.length) setStaged((prev) => { const next = { ...prev }; for (const sl of done) delete next[sl]; return next })
    if (failed) setDocError(failed)
    setSubmittingDocs(false)
    router.refresh() // always re-derive so successfully-submitted docs show PENDING (never stale)
  }

  // Delete a PENDING/REJECTED upload (confirmed). The server re-checks the rule — an APPROVED doc can
  // never be deleted this way. After deletion the slot returns to "needed" so the customer re-uploads.
  const deleteUploadedDoc = async (documentId: string) => {
    if (!window.confirm(t.docDeleteConfirm)) return
    setDocError(null)
    const res = await deleteDocumentAction(documentId)
    if (!res.ok) { setDocError(res.error ?? 'Ошибка'); return }
    router.refresh()
  }

  /* ---- submit ---- */
  const submit = async () => {
    setError(null)
    setSuggestion(null)
    if (!car) {
      setError(t.unavailable)
      return
    }
    if (!consentPersonal || !consentOffer) {
      setStep(0) // consents live on the Route step — send them back there to fix it
      setError(t.needConsent)
      return
    }
    setSubmitting(true)

    const goalUpper = tripGoal ? tripGoal.toUpperCase() : undefined
    const validGoals = [
      'LEISURE',
      'BUSINESS',
      'PROPERTY_PURCHASE',
      'PROPERTY_VIEWING',
      'MEDICAL',
      'RELOCATION',
      'LONG_STAY',
      'VISITING',
      'OTHER',
    ]
    const tripGoalValue =
      goalUpper && validGoals.includes(goalUpper)
        ? (goalUpper as
            | 'LEISURE'
            | 'BUSINESS'
            | 'PROPERTY_PURCHASE'
            | 'PROPERTY_VIEWING'
            | 'MEDICAL'
            | 'RELOCATION'
            | 'LONG_STAY'
            | 'VISITING'
            | 'OTHER')
        : undefined

    const input: BookingCreateInput & { documentIds?: string[] } = {
      carId: car.slug,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      currency,
      pickup:
        routeMode === 'office' && office
          ? {
              kind: 'OFFICE',
              country: office.country || pickupCountry,
              city: office.city || pickupCity,
              district: '',
              address: office.address,
              comment: `Офис: ${office.name}`,
              lat: office.lat,
              lng: office.lng,
            }
          : {
              kind: 'DELIVERY',
              country: pickupCountry,
              city: pickupCity,
              district: '',
              address: pickupAddress,
              comment: '',
              ...(pinLat != null && pinLng != null ? { lat: pinLat, lng: pinLng } : {}),
            },
      returnSameAsPickup: true,
      extras: Object.entries(selExtras).map(([serviceId, qty]) => ({ serviceId, qty })),
      insuranceType: insurance,
      ...(tripGoalValue ? { tripGoal: tripGoalValue } : {}),
      smartNeeds: [],
      profile: {
        firstName,
        lastName,
        ...(birthDate ? { birthDate: new Date(birthDate) } : {}),
        phone,
        additionalPhone,
        phoneMessengers: phoneMsgs as ('whatsapp' | 'telegram' | 'max')[],
        additionalPhoneMessengers: addPhoneMsgs as ('whatsapp' | 'telegram' | 'max')[],
        docCountry,
        docRegion,
        addressLine,
      },
      consentPersonalData: true,
      consentOffer: true,
    }

    // OPTION A — CARD pays FIRST. Prepare a Stripe PaymentIntent for the deposit (NO booking created,
    // car NOT held yet), then mount the card form. The booking is created only in handleCardPaid()
    // after Stripe confirms the charge. If the customer abandons the card form, nothing is created.
    if (payMethod === 'card') {
      const prep = await prepareCardBookingAction(input)
      setSubmitting(false)
      if (prep.ok && prep.clientSecret && prep.publishableKey && prep.intentId) {
        setCardError(null)
        setCardStage({ clientSecret: prep.clientSecret, publishableKey: prep.publishableKey, amountLabel: prep.amountLabel, intentId: prep.intentId, input })
        // Stash the intent + assembled input so a 3-D Secure redirect (which reloads this page and wipes
        // React state) can finalize the already-paid booking on return. Dates JSON-serialize to ISO and
        // are revived on read. If this is lost (tab closed / other browser), the reconcile cron refunds.
        try {
          sessionStorage.setItem('aventa_card_pending', JSON.stringify({ intentId: prep.intentId, carSlug: car.slug, input }))
        } catch {
          /* ignore */
        }
      } else {
        setError(prep.error ?? 'Не удалось начать оплату картой')
      }
      return
    }

    const res = await createBookingAction(input)

    // Manual-confirmation model: attach the reservation-deposit payment (crypto / bank)
    // so it lands in the admin payments queue as AWAITING. Card is handled above (pay-then-create).
    if (res.ok && res.bookingId && (payMethod === 'crypto' || payMethod === 'bank')) {
      const isCrypto = payMethod === 'crypto'
      const payCurrency = isCrypto && wallet ? (wallet.token as Currency) : currency
      await submitManualPaymentAction({
        bookingId: res.bookingId,
        method: isCrypto ? 'CRYPTO' : 'BANK_TRANSFER',
        kind: 'PREPAY',
        amount: isCrypto ? payNowCrypto : payNowDisplay,
        currency: payCurrency,
        fxRate: rates[payCurrency] ?? 1,
        txHash: isCrypto ? txHash.trim() || undefined : undefined,
        cryptoNetwork: isCrypto && wallet ? wallet.network : undefined,
        cryptoAddress: isCrypto && wallet ? wallet.address : undefined,
        proofDocId: proof?.status === 'done' ? proof.id : undefined,
      }).catch(() => {})
    }

    setSubmitting(false)

    if (res.redirectTo && (res.ok || !currentUser)) {
      if (res.ok) clearDraftAndSession() // booking created → retire the draft
      router.push(res.redirectTo)
      return
    }
    if (res.suggestion) setSuggestion(res.suggestion)
    if (res.fieldErrors) {
      setError(Object.values(res.fieldErrors)[0] ?? 'Проверьте введённые данные')
    } else {
      setError(res.error ?? 'Не удалось создать бронирование')
    }
  }

  // OPTION A — card deposit confirmed by Stripe → NOW create the booking (already-paid). The server
  // re-verifies the intent, holds the car, and refunds if it can't create. On success → success page.
  const handleCardPaid = async (intentId: string) => {
    if (!cardStage) return
    setCardError(null)
    const res = await createBookingAction({ ...cardStage.input, cardPaymentIntentId: intentId })
    if (res.ok && res.redirectTo) {
      clearDraftAndSession() // paid booking created → retire the draft
      router.push(res.redirectTo)
      return
    }
    // Could not create despite payment (e.g. car taken in the meantime). The server surfaces the exact
    // reason (and refunds when it charged); the fallback below never asserts a refund as completed fact.
    setCardStage(null)
    setError(res.error ?? (res.fieldErrors ? Object.values(res.fieldErrors)[0] : 'Не удалось создать бронирование. Если средства были списаны, они будут возвращены.') ?? null)
    setStep(4)
    throw new Error('booking-create-failed')
  }

  // referenced so lang explicitly drives re-render of localized fallbacks
  void lang

  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB')
  }
  const fmtDateTime = (iso: string) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  // Card padding tightens on mobile so 360px viewports don't feel cramped.
  const cardStyleR: CSSProperties = isMobile ? { ...cardStyle, padding: 16, borderRadius: 16 } : cardStyle
  // Two-up form grids collapse to a single column on mobile.
  const twoCol: CSSProperties = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }

  // Payment CTA is method-aware: CARD is a pay-NOW action (the booking is created the instant the charge
  // succeeds — never a "request pending a manager"), while bank/crypto submit a request confirmed later.
  const isCardPay = payMethod === 'card'
  const submitLabel = isCardPay ? `${pt.payNow} · ${fmt(payNowDisplay, currency)}` : t.submit
  const submitSubtext = isCardPay ? t.cardInstant : t.noCharge

  const bookingBody = (
    <div
      className="rdb"
      style={{
        '--f-display': "'Space Grotesk',system-ui,sans-serif",
        '--f-ui': "'Manrope',system-ui,sans-serif",
        '--f-mono': "'JetBrains Mono',ui-monospace,monospace",
        '--grad-coral': '#fb6d4c',
        '--av-bg': '#eef6f5',
        // Full .rd design ramp (design_handoff_aventa_cabinet_booking) so the restyled steps can use var(--teal) etc.
        '--ink': '#0a2225', '--muted': '#5b7678', '--muted-2': '#8aa2a3',
        '--bg': '#eef6f5', '--bg-2': '#e7f1ef', '--surface': '#ffffff', '--line': 'rgba(10,34,37,.10)',
        '--teal': '#0d9488', '--teal-700': '#0f6d68', '--teal-deep': '#0b4f52', '--teal-bright': '#67e3d3', '--teal-soft': 'rgba(13,148,136,.10)',
        '--accent': '#fb6d4c', '--accent-strong': '#ef5c3a', '--accent-soft': 'rgba(251,109,76,.12)',
        '--ok': '#0f9d6f', '--ok-soft': 'rgba(16,185,129,.12)', '--gold': '#f5b400',
        width: '100%',
        minHeight: authed ? undefined : '100vh',
        background: '#eef6f5',
        color: '#0a2225',
        overflowX: 'clip',
      } as CSSProperties}
    >
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={BOOKING_FONTS} />
      <style dangerouslySetInnerHTML={{ __html: BOOKING_CSS }} />
      {/* guest chrome: standalone top-nav band. Signed-in customers get the cabinet left-sidebar shell
          (wrapped at the bottom of this component) instead, so this band is hidden for them. */}
      {!authed && (
        <div className="av-sticky-header" style={{ background: 'transparent' }}>
          <SiteNav />
        </div>
      )}

      {/* page title (scrolls away under the sticky rail) */}
      <div
        style={{
          maxWidth: 'var(--container)',
          margin: '0 auto',
          padding: `clamp(18px,3vw,32px) var(--pad-x) 12px`,
        }}
      >
        <div
          style={{
            font: `800 ${isMobile ? 'clamp(20px,6vw,26px)' : 'clamp(24px,3.4vw,34px)'} var(--f-display)`,
            letterSpacing: '-.02em',
            color: '#0a2225',
          }}
        >
          {t.title}
        </div>
      </div>

      {/* step-indicator card — design_handoff_aventa_cabinet_booking (wired to goto/step/done/stepValid/reachable) */}
      <div className="av-booking-steprail" style={{ background: 'transparent', position: authed ? 'static' : undefined }}>
        <div style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: `0 var(--pad-x)`, width: '100%' }}>
          <div
            style={{
              margin: isMobile ? '4px 0 14px' : '18px 0 22px',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: isMobile ? 16 : 18,
              padding: isMobile ? '13px 15px' : '17px 22px',
              boxShadow: '0 1px 2px rgba(6,33,38,.04), 0 22px 44px -36px rgba(6,33,38,.55)',
            }}
          >
            {isMobile ? (
              /* MOBILE: current step name + n / 5 + a 5-segment progress bar (tap a done segment to jump back) */
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ font: '700 15.5px var(--f-display)', color: 'var(--ink)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.stepNames[step]}
                  </span>
                  <span style={{ flexShrink: 0, font: '700 12px var(--f-mono)', letterSpacing: '.04em', color: 'var(--teal)' }}>
                    {step + 1} / {t.stepNames.length}
                  </span>
                </div>
                <div style={{ marginTop: 11, display: 'flex', gap: 6 }}>
                  {t.stepNames.map((name, i) => {
                    const filled = i <= step
                    const locked = !reachable(i)
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => goto(i)}
                        disabled={locked}
                        aria-label={name}
                        title={locked ? t.lockedHint : name}
                        style={{
                          flex: 1,
                          height: 6,
                          padding: 0,
                          border: 'none',
                          borderRadius: 999,
                          cursor: locked ? 'not-allowed' : 'pointer',
                          background: filled ? 'var(--teal)' : 'var(--bg-2)',
                          transition: 'background .25s ease',
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            ) : (
              /* DESKTOP: 5 nodes + filled connectors */
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {t.stepNames.map((name, i) => {
                  const active = i === step
                  const complete = done.has(i) && stepValid(i)
                  const locked = !reachable(i)
                  const last = i === t.stepNames.length - 1
                  return (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', flex: last ? '0 0 auto' : 1, minWidth: 0 }}>
                      <button
                        type="button"
                        onClick={() => goto(i)}
                        disabled={locked}
                        title={locked ? t.lockedHint : undefined}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 11,
                          border: 'none',
                          background: 'transparent',
                          padding: 0,
                          cursor: locked ? 'not-allowed' : 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            flexShrink: 0,
                            display: 'grid',
                            placeItems: 'center',
                            font: '700 13px var(--f-display)',
                            background: complete || active ? 'var(--teal)' : 'var(--bg-2)',
                            color: complete || active ? '#fff' : 'var(--muted-2)',
                            boxShadow: active ? '0 0 0 4px var(--teal-soft)' : 'none',
                            transition: 'background .2s ease, box-shadow .2s ease',
                          }}
                        >
                          {complete && !active ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          ) : (
                            i + 1
                          )}
                        </span>
                        <span
                          style={{
                            font: active ? '700 13.5px var(--f-display)' : '600 13.5px var(--f-display)',
                            color: active ? 'var(--ink)' : complete ? 'var(--teal-700)' : 'var(--muted-2)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {name}
                        </span>
                      </button>
                      {!last && (
                        <span
                          style={{
                            flex: 1,
                            height: 2,
                            minWidth: 14,
                            margin: '0 12px',
                            borderRadius: 2,
                            background: complete ? 'var(--teal)' : 'var(--line)',
                            transition: 'background .25s ease',
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* layout */}
      <div
        style={{
          maxWidth: 'var(--container)',
          margin: '0 auto',
          padding: isMobile ? '2px var(--pad-x) 132px' : '4px var(--pad-x) clamp(40px,5vw,60px)',
          display: 'flex',
          gap: 26,
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          alignItems: 'flex-start',
        }}
      >
        {/* LEFT — current step card */}
        <div style={{ flex: isMobile ? '1 1 100%' : '1 1 0', width: isMobile ? '100%' : undefined, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* STEP 1 — route */}
          {step === 0 && (
            <div style={cardStyleR}>
              <button
                type="button"
                onClick={leaveFlow}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(20,153,174,.25)', background: '#ffffff', color: '#0d9488', font: '700 12px var(--f-ui)', cursor: 'pointer' }}
              >
                ‹ {t.backToCar}
              </button>
              <StepHead num={1} title={t.s1} />

              {/* busy-until banner for a currently-rented car */}
              {availability && !availability.availableNow && availability.busyUntil && (
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '11px 14px', borderRadius: 12, background: '#FCEEE9', border: '1px solid rgba(214,75,61,.28)' }}>
                  <span style={{ font: '700 12px var(--f-ui)', color: '#C6392B' }}>🔒 {t.busyUntilL(fmtDate(availability.busyUntil))}</span>
                  {availability.nextFree && (
                    <button type="button" onClick={startFromNextFree} style={{ marginLeft: 'auto', padding: '7px 13px', borderRadius: 9, border: 'none', background: '#0d9488', color: '#fff', font: '700 12px var(--f-ui)', cursor: 'pointer' }}>
                      {t.freeFromL(fmtDate(availability.nextFree))} ›
                    </button>
                  )}
                </div>
              )}

              {/* availability calendar — day-states come straight from the server engine */}
              {availability && availability.days.length > 0 && (
                <div style={{ marginTop: 14, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: 16 }}>
                  <div style={{ font: '500 11.5px/1.5 var(--f-ui)', color: 'var(--muted)', marginBottom: 12 }}>{t.pickHint}</div>
                  <AvailabilityCalendar days={availability.days} selectedStart={calStart} selectedEnd={calEnd} onPick={onPickDate} lang={lang} initialMonth={calInitialMonth} />
                  {pendingStart && !rangeError && (
                    <div style={{ marginTop: 12, font: '700 12px var(--f-ui)', color: '#3F6FD1', textAlign: 'center' }}>{t.selectEnd}</div>
                  )}
                  {checkingRange && (
                    <div style={{ marginTop: 12, font: '600 12px var(--f-ui)', color: '#5b7678', textAlign: 'center' }}>{t.checkingRange}</div>
                  )}
                  {rangeError && (
                    <div style={{ marginTop: 12, padding: '11px 14px', borderRadius: 12, background: '#FCEEE9', border: '1px solid rgba(214,75,61,.28)' }}>
                      <div style={{ font: '700 12px var(--f-ui)', color: '#C6392B' }}>⚠ {rangeError}</div>
                      {rangeSuggestion && (
                        <button type="button" onClick={applySuggestion} style={{ marginTop: 8, padding: '9px 14px', borderRadius: 10, border: 'none', background: '#0d9488', color: '#fff', font: '700 12px var(--f-ui)', cursor: 'pointer' }}>
                          {t.nearest}: {fmtDate(rangeSuggestion.start)} → {fmtDate(rangeSuggestion.end)} · {t.applyDates}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* date + time as SEPARATE fields — pick the date (calendar or the date field), then the
                  time (the time field enables only once a date is set). Both are native inputs, so they
                  work by keyboard as well as tap. */}
              <div style={{ ...twoCol, marginTop: 16 }}>
                <div>
                  <div style={fieldLabel}>{t.dateFrom}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      aria-label={`${t.dateFrom} · ${t.dateOnly}`}
                      style={{ ...inputStyle, flex: '1 1 58%', minWidth: 0 }}
                      type="date"
                      value={datePart(startAt)}
                      onChange={(e) => { const d = e.target.value; setStartAt(d ? `${d}T${timePart(startAt)}` : ''); setPendingStart(null); clearRangeMsgs() }}
                    />
                    <input
                      aria-label={`${t.dateFrom} · ${t.timeOnly}`}
                      title={!startAt ? t.pickDateFirst : undefined}
                      style={{ ...inputStyle, flex: '1 1 42%', minWidth: 0, opacity: startAt ? 1 : 0.5, cursor: startAt ? 'text' : 'not-allowed' }}
                      type="time"
                      value={startAt ? timePart(startAt) : ''}
                      disabled={!startAt}
                      onChange={(e) => { setStartAt(`${datePart(startAt)}T${e.target.value || '10:00'}`); clearRangeMsgs() }}
                    />
                  </div>
                </div>
                <div>
                  <div style={fieldLabel}>{t.dateTo}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      aria-label={`${t.dateTo} · ${t.dateOnly}`}
                      style={{ ...inputStyle, flex: '1 1 58%', minWidth: 0 }}
                      type="date"
                      value={datePart(endAt)}
                      min={datePart(startAt) || undefined}
                      onChange={(e) => { const d = e.target.value; setEndAt(d ? `${d}T${timePart(endAt)}` : ''); setPendingStart(null); clearRangeMsgs() }}
                    />
                    <input
                      aria-label={`${t.dateTo} · ${t.timeOnly}`}
                      title={!endAt ? t.pickDateFirst : undefined}
                      style={{ ...inputStyle, flex: '1 1 42%', minWidth: 0, opacity: endAt ? 1 : 0.5, cursor: endAt ? 'text' : 'not-allowed' }}
                      type="time"
                      value={endAt ? timePart(endAt) : ''}
                      disabled={!endAt}
                      onChange={(e) => { setEndAt(`${datePart(endAt)}T${e.target.value || '10:00'}`); clearRangeMsgs() }}
                    />
                  </div>
                </div>
              </div>
              {/* combined result — shown once both date+time are set on each side */}
              {startAt && endAt && (
                <div style={{ marginTop: 10, font: '600 12px var(--f-ui)', color: '#0a2225' }}>
                  {fmtDateTime(startAt)} <span style={{ color: '#5b7678' }}>→</span> {fmtDateTime(endAt)}
                </div>
              )}
              {/* live duration */}
              <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 13px', borderRadius: 999, background: 'var(--teal-soft)', border: '1px solid rgba(13,148,136,.2)', font: '600 12px var(--f-ui)', color: 'var(--ink)' }}>
                ⏱ {t.durationL}: <b style={{ color: 'var(--teal-700)' }}>{days} {t.dayU}</b>
                <span style={{ color: 'var(--muted)' }}>· {nights} {t.nightU}</span>
              </div>

              {/* country + city — country is LOCKED (fixed to Turkey), display-only, not editable */}
              <div style={{ ...twoCol, marginTop: 16 }}>
                <div>
                  <div style={fieldLabel}>{t.country}</div>
                  <div
                    title={t.countryLocked}
                    aria-readonly="true"
                    style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: '#ffffff', cursor: 'not-allowed' }}
                  >
                    <span style={{ color: '#0a2225', fontWeight: 600 }}>{pickupCountry}</span>
                    <span aria-hidden style={{ fontSize: 13 }}>🔒</span>
                  </div>
                </div>
                <div>
                  <div style={fieldLabel}>{t.city}</div>
                  {cities.length === 0 ? (
                    <div style={{ ...inputStyle, color: '#5b7678', display: 'flex', alignItems: 'center' }}>{t.noCities}</div>
                  ) : (
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={pickupCity} onChange={(e) => setPickupCity(e.target.value)}>
                      {cities.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* deliver vs office */}
              <div style={{ marginTop: 18, ...fieldLabel }}>{t.routeChoose}</div>
              <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                {([
                  { m: 'delivery' as const, icon: '🚗', title: t.deliverTitle, desc: t.deliverDesc },
                  { m: 'office' as const, icon: '🏢', title: t.officeTitle, desc: office ? t.officeDesc : t.noOffice },
                ]).map(({ m, icon, title, desc }) => {
                  const on = routeMode === m
                  const disabled = m === 'office' && !office
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => !disabled && selectRoute(m)}
                      disabled={disabled}
                      style={{ textAlign: 'left', padding: '14px 16px', borderRadius: 14, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1, border: on ? '1.5px solid var(--teal)' : '1px solid var(--line)', background: on ? 'var(--teal-soft)' : 'var(--surface)', transition: 'border-color .15s ease, background .15s ease' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{icon}</span>
                        <span style={{ font: '700 14px var(--f-ui)', color: 'var(--ink)' }}>{title}</span>
                        <span style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', flexShrink: 0, background: '#fff', border: on ? '5px solid var(--teal)' : '2px solid var(--muted-2)', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ marginTop: 5, font: '500 11.5px var(--f-ui)', color: 'var(--muted)' }}>{desc}</div>
                    </button>
                  )
                })}
              </div>

              {/* DELIVERY: address + pin */}
              {routeMode === 'delivery' && (
                <div style={{ marginTop: 14, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 16 }}>
                  <div style={fieldLabel}>{t.fullAddress}</div>
                  <input style={inputStyle} value={pickupAddress} placeholder={t.fullAddressPh} onChange={(e) => setPickupAddress(e.target.value)} />
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <button type="button" onClick={useMyLocation} disabled={geoBusy} style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--teal-700)', font: '700 12px var(--f-ui)', cursor: geoBusy ? 'wait' : 'pointer' }}>
                      {geoBusy ? t.locating : t.useLoc}
                    </button>
                    {pinLat != null && pinLng != null && (
                      <span style={{ font: '600 11px var(--f-mono)', color: 'var(--teal)' }}>{pinLat.toFixed(5)}, {pinLng.toFixed(5)}</span>
                    )}
                  </div>
                  <div style={{ marginTop: 8, font: '500 11px var(--f-ui)', color: 'var(--muted)' }}>{t.pinHint}</div>
                  <div style={{ marginTop: 10 }}>
                    <MapView
                      provider={mapProvider}
                      apiKey={mapApiKey}
                      mode="pick"
                      lat={pinLat}
                      lng={pinLng}
                      zoom={12}
                      height={260}
                      onChange={(la, ln) => { setPinLat(la); setPinLng(ln) }}
                      fallback={office ? { lat: office.lat, lng: office.lng } : undefined}
                    />
                  </div>
                </div>
              )}

              {/* OFFICE: fixed map + open-in-maps */}
              {routeMode === 'office' && (
                office ? (
                  <div style={{ marginTop: 14, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 16 }}>
                    <div style={{ font: '700 13px var(--f-ui)', color: 'var(--ink)' }}>🏢 {t.ourOffice}: {office.name}</div>
                    <div style={{ marginTop: 3, font: '500 12px var(--f-ui)', color: 'var(--muted)' }}>{office.address}{office.city ? `, ${office.city}` : ''}</div>
                    <div style={{ marginTop: 10 }}>
                      <MapView provider={mapProvider} apiKey={mapApiKey} mode="view" lat={office.lat} lng={office.lng} zoom={14} height={260} popupHtml={`<b>${escapeHtml(office.name)}</b><br/>${escapeHtml(office.address)}`} />
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ font: '600 12px var(--f-ui)', color: 'var(--muted)' }}>{t.directions}</span>
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${office.lat},${office.lng}`} target="_blank" rel="noreferrer" style={{ padding: '8px 13px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--line)', font: '700 12px var(--f-ui)', color: 'var(--teal-700)', textDecoration: 'none' }}>
                        Google Maps ↗
                      </a>
                      <a href={`https://maps.apple.com/?daddr=${office.lat},${office.lng}`} target="_blank" rel="noreferrer" style={{ padding: '8px 13px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--line)', font: '700 12px var(--f-ui)', color: 'var(--teal-700)', textDecoration: 'none' }}>
                        Apple Maps ↗
                      </a>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 14, padding: 16, borderRadius: 14, background: '#FFF6E9', border: '1px solid rgba(224,161,6,.3)', font: '600 12px var(--f-ui)', color: '#B45309' }}>{t.noOffice}</div>
                )
              )}

              {/* pay-now (deposit %) — display only, reads admin setting */}
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '13px 16px', borderRadius: 14, background: 'var(--teal-soft)', border: '1px solid rgba(13,148,136,.2)' }}>
                <div style={{ font: '600 13px var(--f-ui)', color: 'var(--ink)' }}>
                  {t.payNowRoute}: <b style={{ font: '800 18px var(--f-display)', color: 'var(--teal-deep)' }}>{fmt(payNowDisplay, currency)}</b>
                  <span style={{ marginLeft: 6, font: '700 12px var(--f-ui)', color: 'var(--teal-700)' }}>({depositPercent}%)</span>
                </div>
                <div style={{ font: '500 12px var(--f-ui)', color: 'var(--muted)' }}>{fmt(remainingDisplay, currency)} · {t.restReturn}</div>
              </div>

              {/* LEGAL CONSENT — early gate (moved here from the final step). Each checkbox stays disabled
                  until its document is opened in the modal and scrolled to the end (scroll-to-confirm);
                  both are required to leave the Route step. The consent record is written at booking submit. */}
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                <div style={fieldLabel}>{t.consentHeading}</div>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {([
                    { key: 'privacy' as LegalDocKey, checked: consentPersonal, set: setConsentPersonal, scrolled: scrolledPrivacy, pre: t.consentPersonalPre, link: t.consentPersonalLink, post: t.consentPersonalPost },
                    { key: 'distance-selling' as LegalDocKey, checked: consentOffer, set: setConsentOffer, scrolled: scrolledOffer, pre: t.consentOfferPre, link: t.consentOfferLink, post: t.consentOfferPost },
                  ]).map((row) => (
                    <div key={row.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={row.checked}
                        title={row.checked ? undefined : t.consentScrollFirst}
                        // Clicking the box OPENS the document modal (read + scroll-to-confirm ticks it);
                        // clicking an already-ticked box un-ticks it.
                        onClick={() => { if (row.checked) row.set(false); else setLegalModal(row.key) }}
                        style={{ flexShrink: 0, marginTop: 1, width: 20, height: 20, borderRadius: 6, background: row.checked ? 'var(--teal)' : '#fff', border: row.checked ? 'none' : '1.5px solid var(--muted-2)', color: '#fff', font: '700 12px var(--f-ui)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {row.checked ? '✓' : ''}
                      </button>
                      <span style={{ font: '500 12px/1.55 var(--f-ui)', color: 'var(--ink)' }}>
                        {row.pre}
                        <button type="button" onClick={() => setLegalModal(row.key)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--teal)', font: '700 12px var(--f-ui)', cursor: 'pointer', textDecoration: 'underline' }}>
                          {row.link}
                        </button>
                        {row.post}
                        {!row.scrolled && <span style={{ marginLeft: 6, font: '600 11px var(--f-ui)', color: '#E07A1E' }}>· {t.consentScrollFirst}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — extras + insurance */}
          {step === 1 && (
            <div style={cardStyleR}>
              <StepHead num={2} title={t.s2} />
              <div
                style={{
                  marginTop: 16,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
                  gap: 10,
                }}
              >
                {extras.map((svc) => {
                  // Delivery-to-address is not applicable to an office pickup: disable it there.
                  const disabled = svc.key === 'delivery' && routeMode === 'office'
                  const on = !disabled && !!selExtras[svc.id]
                  const priceStr = `${fmt(convert(svc.price, currency, rates), currency)} ${unitLabel(svc.unit)}`
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => { if (!disabled) toggleExtra(svc.id) }}
                      disabled={disabled}
                      title={disabled ? t.deliveryNA : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textAlign: 'left',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.55 : 1,
                        background: disabled ? 'var(--bg-2)' : on ? 'var(--teal-soft)' : 'var(--surface)',
                        border: on ? '1.5px solid var(--teal)' : '1px solid var(--line)',
                        borderRadius: 14,
                        padding: 14,
                        transition: 'border-color .15s ease, background .15s ease',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                        <span style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? '#fff' : 'var(--bg-2)', color: disabled ? 'var(--muted-2)' : 'var(--teal)', border: `1px solid ${on ? 'rgba(13,148,136,.28)' : 'var(--line)'}` }}>
                          <ServiceIcon serviceKey={svc.key} size={18} />
                        </span>
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: 'block', font: '700 13px var(--f-ui)', color: 'var(--ink)' }}>
                            {svc.name}
                          </span>
                          <span style={{ display: 'block', font: '500 11px var(--f-ui)', color: disabled ? '#B45309' : 'var(--muted)' }}>
                            {disabled ? t.deliveryNA : priceStr}
                          </span>
                        </span>
                      </span>
                      <span
                        style={
                          on
                            ? {
                                width: 20,
                                height: 20,
                                borderRadius: 6,
                                background: 'var(--teal)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                font: '700 11px var(--f-ui)',
                                flexShrink: 0,
                              }
                            : {
                                width: 20,
                                height: 20,
                                borderRadius: 6,
                                border: '1.5px solid var(--line)',
                                flexShrink: 0,
                              }
                        }
                      >
                        {on ? '✓' : ''}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div
                style={{
                  marginTop: 18,
                  font: '700 9px var(--f-mono)',
                  letterSpacing: '.1em',
                  color: '#5b7678',
                }}
              >
                {t.insTitle.toUpperCase()}
              </div>
              {/* Each tier is a selectable card carrying its own "what's included" inline
                  (franchise + coverage list, all admin-managed from the DB — no shared table). */}
              <div
                style={{
                  marginTop: 10,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))',
                  gap: 12,
                  alignItems: 'stretch',
                }}
              >
                {INSURANCE.map((ins) => {
                  const on = insurance === ins.id
                  const tier = tierByKey[ins.id]
                  const dayPrice = convert(perDay * ins.rate, currency, rates)
                  return (
                    <button
                      key={ins.id}
                      type="button"
                      onClick={() => setInsurance(ins.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        textAlign: 'left',
                        cursor: 'pointer',
                        background: on ? 'var(--teal-soft)' : 'var(--surface)',
                        border: on ? '1.5px solid var(--teal)' : '1px solid var(--line)',
                        borderRadius: 14,
                        padding: 15,
                        gap: 10,
                        transition: 'border-color .15s ease, background .15s ease',
                      }}
                    >
                      {/* header: radio + name + price */}
                      <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <span style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, border: on ? '5px solid var(--teal)' : '2px solid var(--muted-2)', background: '#fff', transition: 'border .15s ease' }} />
                          <span style={{ font: '800 14px var(--f-display)', color: 'var(--ink)' }}>{tier?.name ?? ins.id}</span>
                        </span>
                        <span style={{ font: '800 15px var(--f-display)', color: on ? 'var(--teal-700)' : 'var(--ink)', flexShrink: 0 }}>
                          {fmt(dayPrice, currency)}<span style={{ font: '600 10px var(--f-ui)', color: 'var(--muted)' }}>{t.perDayShort}</span>
                        </span>
                      </span>
                      {/* franchise / excess */}
                      <span style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, background: '#fff', border: '1px solid var(--line)', font: '700 10.5px var(--f-ui)', color: 'var(--ink)' }}>
                        {t.excessLabel}: {tier?.excess ?? '—'}
                      </span>
                      {/* coverage list — inline "what's included" */}
                      {tier && tier.coverage.length > 0 && (
                        <span style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 2 }}>
                          {tier.coverage.map((c) => (
                            <span key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <CoverMark status={c.status} />
                              <span style={{ font: '500 11.5px/1.35 var(--f-ui)', color: c.status === 'no' ? 'var(--muted-2)' : 'var(--ink)' }}>{c.label}</span>
                            </span>
                          ))}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 3 — client details (no documents here) */}
          {step === 2 && (
            <div style={cardStyleR}>
              <StepHead num={3} title={t.s3} />
              <div style={{ ...twoCol, marginTop: 16 }}>
                <LabeledInput label={t.firstName} value={firstName} onChange={setFirstName} />
                <LabeledInput label={t.lastName} value={lastName} onChange={setLastName} />
                {/* date of birth — right after the surname */}
                <div>
                  <div style={fieldLabel}>{t.birthDate}</div>
                  <input style={inputStyle} type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                </div>
                {!isMobile && <div />}
                {/* phone + its messengers (whatsapp / telegram / max) */}
                <div style={{ gridColumn: 'span 2' }}>
                  <LabeledInput label={t.phone} value={phone} onChange={setPhone} type="tel" />
                  <MessengerTicks legend={t.msgOn} options={[{ key: 'whatsapp', label: t.mWhatsapp }, { key: 'telegram', label: t.mTelegram }, { key: 'max', label: t.mMax }]} selected={phoneMsgs} onToggle={(k) => toggleMsg(setPhoneMsgs, k)} />
                </div>
                {/* additional phone + its messengers */}
                <div style={{ gridColumn: 'span 2' }}>
                  <LabeledInput label={t.additionalPhone} value={additionalPhone} onChange={setAdditionalPhone} type="tel" />
                  <MessengerTicks legend={t.msgOn} options={[{ key: 'whatsapp', label: t.mWhatsapp }, { key: 'telegram', label: t.mTelegram }, { key: 'max', label: t.mMax }]} selected={addPhoneMsgs} onToggle={(k) => toggleMsg(setAddPhoneMsgs, k)} />
                </div>
                <LabeledInput label={t.addressLine} value={addressLine} onChange={setAddressLine} span2 />
              </div>
            </div>
          )}

          {/* STEP 4 — documents (own step; blocks Payment until approved) */}
          {step === 3 && (
            <div style={cardStyleR}>
              <StepHead num={4} title={t.sDocs} />

              {/* Documents — by now the visitor is authenticated (sign-up happens after Route). */}
              {(
                <>
                  {/* readability guidance */}
                  <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 9, padding: '11px 14px', borderRadius: 12, background: '#FFF6E9', border: '1px solid rgba(224,161,6,.28)' }}>
                    <span aria-hidden>💡</span>
                    <span style={{ font: '600 12px/1.5 var(--f-ui)', color: '#B45309' }}>{t.docReadHint}</span>
                  </div>

                  {/* document issuing country + region — searchable dependent dropdowns, lock after select */}
                  <div style={{ marginTop: 14 }}>
                    <CountryRegionPicker
                      country={docCountry}
                      region={docRegion}
                      onChange={(c, r) => { setDocCountry(c); setDocRegion(r) }}
                      onValidChange={setDocLocValid}
                      disabled={verified}
                    />
                  </div>

                  {verificationMethod === 'SUMSUB' && (
                    <div style={{ marginTop: 14 }}>
                      <SumsubVerification initial={sumsubInitial} lang={lang} onStateChange={(s) => setSumsubValid(s.valid)} />
                    </div>
                  )}

                  {verificationMethod === 'MANUAL' && (() => {
                    const labelFor = (ty: string) => (ty === 'PASSPORT' ? t.passport : ty === 'SELFIE' ? t.docSelfie : ty === 'LICENSE_FRONT' ? t.dlFront : t.dlBack)
                    const countryReady = docLocValid
                    const dvDocs = verification?.docs ?? []
                    const stagedCount = Object.keys(staged).length
                    return (
                      <>
                        {/* overall status banner */}
                        {verified ? (
                          <div style={{ marginTop: 14, background: 'var(--ok-soft)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 14, padding: 16, font: '700 14px var(--f-ui)', color: 'var(--ok)' }}>✓ {t.manualVerified}</div>
                        ) : verification?.anyPending ? (
                          <div style={{ marginTop: 14, background: '#FFF6E9', border: '1px solid rgba(224,161,6,.3)', borderRadius: 14, padding: 14, font: '600 12.5px/1.5 var(--f-ui)', color: '#B45309' }}>⏳ {t.manualPending}</div>
                        ) : verification?.anyRejected || verification?.anyExpired ? (
                          <div style={{ marginTop: 14, background: '#FCEEE9', border: '1px solid rgba(214,75,61,.3)', borderRadius: 14, padding: 14, font: '700 13px var(--f-ui)', color: '#C6392B' }}>✕ {t.manualRejected}</div>
                        ) : (
                          <div style={{ marginTop: 14, font: '500 12px/1.6 var(--f-ui)', color: '#5b7678' }}>{t.manualUploadPrompt}</div>
                        )}

                        {!countryReady && !verified && (
                          <div style={{ marginTop: 12, font: '600 12px var(--f-ui)', color: '#E07A1E' }}>{t.docPickCountry}</div>
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
                            const border = approved ? 'rgba(16,185,129,.35)' : pending ? 'rgba(224,161,6,.3)' : d.decision === 'REJECTED' || d.expired ? 'rgba(214,75,61,.3)' : 'var(--line)'
                            const bg = approved ? 'var(--ok-soft)' : pending ? '#FFFBF0' : d.decision === 'REJECTED' || d.expired ? '#FDF1EE' : 'var(--bg-2)'
                            return (
                              <div key={d.type} style={{ border: `1px solid ${border}`, borderRadius: 12, padding: 12, background: bg }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                  <span style={{ font: '700 12.5px var(--f-ui)', color: 'var(--ink)' }}>{label}</span>
                                  <span style={{ font: '700 11px var(--f-ui)', color: approved ? 'var(--ok)' : pending ? '#B45309' : d.decision === 'REJECTED' || d.expired ? '#C6392B' : 'var(--muted)' }}>
                                    {approved ? `✓ ${t.docApproved}` : pending ? `⏳ ${t.docUnderReview}` : d.expired ? `✕ ${t.docExpired}` : d.decision === 'REJECTED' ? `✕ ${t.docRejected}` : t.docNeeded}
                                  </span>
                                </div>
                                {approved && d.expiresAt && (
                                  <div style={{ marginTop: 5, font: '500 11px var(--f-mono)', color: '#5b7678' }}>{t.docValidUntil} {fmtDate(d.expiresAt)}</div>
                                )}
                                {d.decision === 'REJECTED' && d.reason && (
                                  <div style={{ marginTop: 6, font: '500 12px/1.5 var(--f-ui)', color: '#C6392B', whiteSpace: 'pre-wrap' }}>{d.reason}</div>
                                )}

                                {/* View own document (gated route) + delete a PENDING/REJECTED upload.
                                    Approved docs are viewable but NEVER deletable here. */}
                                {d.documentId && (
                                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                                    <a
                                      href={`/api/documents/${d.documentId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="av-tap"
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: isMobile ? 40 : undefined, font: '700 11px var(--f-ui)', color: 'var(--teal)', textDecoration: 'none' }}
                                    >
                                      👁 {t.docView}
                                    </a>
                                    {(d.decision === 'PENDING' || d.decision === 'REJECTED') && (
                                      <button
                                        type="button"
                                        onClick={() => deleteUploadedDoc(d.documentId!)}
                                        className="av-tap"
                                        aria-label={t.docDelete}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: isMobile ? 40 : undefined, padding: 0, background: 'none', border: 'none', cursor: 'pointer', font: '700 11px var(--f-ui)', color: '#C6392B' }}
                                      >
                                        🗑 {t.docDelete}
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
                                          <div style={{ width: 84, height: 58, borderRadius: 8, border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', font: '700 10px var(--f-ui)', color: 'var(--teal)' }}>PDF</div>
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ font: '600 11px var(--f-ui)', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.file.name}</div>
                                          <div style={{ marginTop: 4, display: 'flex', gap: 8 }}>
                                            <label style={{ cursor: 'pointer', font: '700 11px var(--f-ui)', color: 'var(--teal)' }}>
                                              {t.docReplace}
                                              <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ display: 'none' }} onChange={(e) => stageFile(slot, e)} />
                                            </label>
                                            <button type="button" onClick={() => unstage(slot)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: '700 11px var(--f-ui)', color: '#C6392B' }}>{t.docRemove}</button>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <label style={{ display: 'inline-block', cursor: 'pointer', border: '1.5px dashed var(--accent)', borderRadius: 10, padding: '9px 14px', background: 'var(--accent-soft)', font: '700 11px var(--f-ui)', color: 'var(--accent-strong)' }}>
                                        + {t.docAttach}
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

                        {/* submit staged documents for review */}
                        {stagedCount > 0 && (
                          <button type="button" onClick={submitDocuments} disabled={submittingDocs} className="av-cta" style={{ marginTop: 14, width: '100%', padding: '13px 18px', borderRadius: 14, border: 'none', background: 'linear-gradient(180deg,var(--accent),var(--accent-strong))', color: '#fff', font: '800 13.5px var(--f-display)', cursor: submittingDocs ? 'wait' : 'pointer', opacity: submittingDocs ? 0.7 : 1 }}>
                            {submittingDocs ? t.uploading : t.docSubmitReview(stagedCount)}
                          </button>
                        )}

                        {verifyGateBlocks && stagedCount === 0 && (
                          <div style={{ marginTop: 12, font: '600 12px var(--f-ui)', color: '#E07A1E' }}>{t.verifyRequired}</div>
                        )}
                      </>
                    )
                  })()}
                </>
              )}
            </div>
          )}

          {/* STEP 5 — payment (currency lives inside each method, not a separate selector) */}
          {step === 4 && !cardStage && (
            <div style={cardStyleR}>
              <StepHead num={5} title={t.s4} />

              {/* deposit breakdown — teal Pay-now tile (design) */}
              <div style={{ marginTop: 16, borderRadius: 14, padding: 16, background: 'var(--teal-soft)', border: '1px solid rgba(13,148,136,.2)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ font: '700 10px var(--f-mono)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--teal-700)' }}>{pt.payNow} · {pt.depositOf(depositPercent)}</div>
                    <div style={{ marginTop: 4, font: '800 26px var(--f-display)', color: 'var(--teal-deep)' }}>{fmt(payNowDisplay, currency)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ font: '600 11px var(--f-ui)', color: 'var(--muted)' }}>{pt.remaining}</div>
                    <div style={{ marginTop: 4, font: '700 18px var(--f-display)', color: 'var(--ink)' }}>{fmt(remainingDisplay, currency)}</div>
                  </div>
                </div>
                <div style={{ marginTop: 8, font: '500 11.5px var(--f-ui)', color: 'var(--muted)' }}>
                  {t.total}: {fmt(totals.total, currency)} · {t.deposit}: {fmt(totals.deposit, currency)}
                </div>
              </div>

              {/* online payment providers — only those enabled + configured + eligible in admin */}
              {payment.providers.length > 0 && (
                <div style={{ marginTop: 16, borderRadius: 14, padding: 16, background: '#F4F7FD', border: '1px solid rgba(78,127,224,.22)' }}>
                  <div style={{ font: '700 9px var(--f-mono)', letterSpacing: '.1em', color: '#4E7FE0' }}>{pt.onlineTitle}</div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {payment.providers.map((p) => (
                      <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', borderRadius: 12, background: '#fff', border: '1px solid rgba(78,127,224,.25)' }}>
                        <span style={{ font: '700 12px var(--f-ui)', color: '#243B66' }}>{p.name}</span>
                        <span style={{ font: '600 10px var(--f-ui)', color: '#7E93C4' }}>
                          {[p.cards ? pt.onlineCards : null, p.crypto ? pt.onlineCrypto : null].filter(Boolean).join(' · ')}
                        </span>
                        <span style={{ padding: '2px 7px', borderRadius: 999, background: 'rgba(78,127,224,.12)', font: '700 9px var(--f-mono)', letterSpacing: '.05em', color: '#4E7FE0' }}>{pt.onlineSoon}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 10, font: '500 11.5px/1.5 var(--f-ui)', color: '#5E6E93' }}>{pt.onlineNote}</div>
                </div>
              )}

              {/* method selector */}
              {enabledMethods.length === 0 ? (
                <div style={{ marginTop: 16, font: '600 12px var(--f-ui)', color: '#E07A1E' }}>{pt.noMethods}</div>
              ) : (
                <>
                  <div style={{ marginTop: 16, font: '700 10px var(--f-mono)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>{pt.method}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    {enabledMethods.map((m) => {
                      const on = payMethod === m
                      const lbl = m === 'crypto' ? pt.mCrypto : m === 'bank' ? pt.mBank : pt.mCard
                      const icon = m === 'card' ? '▭' : m === 'bank' ? '🏦' : '◈'
                      return (
                        <button key={m} type="button" onClick={() => setPayMethod(m)}
                          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: isMobile ? '13px 10px' : '12px 10px', minHeight: isMobile ? 58 : 54, borderRadius: 13, cursor: 'pointer', border: on ? '1.5px solid var(--teal)' : '1px solid var(--line)', background: on ? 'var(--teal-soft)' : 'var(--surface)', color: on ? 'var(--teal-700)' : 'var(--muted)', font: '700 12.5px var(--f-display)', transition: 'border-color .15s ease, background .15s ease' }}>
                          <span aria-hidden style={{ fontSize: 15, lineHeight: 1 }}>{icon}</span>
                          {lbl}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              {/* CRYPTO panel */}
              {payMethod === 'crypto' && wallet && (
                <div style={{ marginTop: 14, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 16 }}>
                  {payment.wallets.length > 1 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                      {payment.wallets.map((w, i) => {
                        const on = i === walletIdx
                        return (
                          <button key={w.address + i} type="button" onClick={() => setWalletIdx(i)}
                            style={{ padding: '6px 11px', borderRadius: 999, cursor: 'pointer', background: on ? 'var(--teal)' : 'var(--surface)', color: on ? '#fff' : 'var(--ink)', border: on ? '1px solid var(--teal)' : '1px solid var(--line)', font: '700 11px var(--f-ui)' }}>
                            {w.token} · {w.network}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div style={{ width: 116, height: 116, flexShrink: 0, borderRadius: 12, overflow: 'hidden', background: '#fff', padding: 7 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={wallet.qr} alt={`QR ${wallet.token} ${wallet.network}`} style={{ width: '100%', height: '100%', display: 'block' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ font: '700 13px var(--f-ui)', color: '#0a2225' }}>{pt.amountToSend}: {fmt(payNowCrypto, wallet.token as Currency)}</div>
                      <div style={{ marginTop: 8, padding: '9px 11px', background: '#fff', borderRadius: 9, border: '1px solid rgba(20,153,174,.15)', font: '600 12px var(--f-mono)', color: '#0d9488', wordBreak: 'break-all' }}>
                        {wallet.address}
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 7, padding: '8px 11px', background: '#FFF0E0', border: '1px solid rgba(224,122,30,.3)', borderRadius: 9, font: '600 11.5px/1.4 var(--f-ui)', color: '#B45309' }}>
                        <span>⚠</span>
                        <span>{pt.warn(wallet.token, wallet.network)}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={fieldLabel}>{pt.txHash}</div>
                    <input style={inputStyle} value={txHash} placeholder={pt.txHashPh} onChange={(e) => setTxHash(e.target.value)} />
                  </div>
                  {proofRow}
                </div>
              )}

              {/* BANK panel */}
              {payMethod === 'bank' && (
                <div style={{ marginTop: 14, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 16 }}>
                  {/* transfer currency lives with the method */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {(['EUR', 'USD', 'RUB', 'TRY'] as const).map((c) => {
                      const on = currency === c
                      return (
                        <button key={c} type="button" onClick={() => setCurrency(c)}
                          style={{ padding: '6px 12px', borderRadius: 999, cursor: 'pointer', background: on ? 'var(--teal)' : 'var(--surface)', color: on ? '#fff' : 'var(--ink)', border: on ? '1px solid var(--teal)' : '1px solid var(--line)', font: '700 11px var(--f-ui)' }}>
                          {c === 'EUR' ? 'EUR €' : c}
                        </button>
                      )
                    })}
                  </div>
                  <div style={{ font: '700 13px var(--f-ui)', color: '#0a2225', marginBottom: 10 }}>{pt.bankTitle} · {fmt(payNowDisplay, currency)}</div>
                  <div style={{ display: 'grid', gap: 7 }}>
                    {payment.bank.accountName && <Row label={pt.recipient} value={payment.bank.accountName} />}
                    {payment.bank.iban && <Row label="IBAN" value={payment.bank.iban} />}
                    {payment.bank.swift && <Row label="SWIFT/BIC" value={payment.bank.swift} />}
                    {payment.bank.local && <div style={{ marginTop: 2, font: '500 12px/1.5 var(--f-ui)', color: '#5b7678' }}>{payment.bank.local}</div>}
                    {!payment.bank.iban && !payment.bank.accountName && <div style={{ font: '500 12px var(--f-ui)', color: '#5b7678' }}>—</div>}
                  </div>
                  {proofRow}
                </div>
              )}

              {/* CARD panel */}
              {payMethod === 'card' && (
                <div style={{ marginTop: 14, background: '#ffffff', border: '1px solid rgba(20,153,174,.2)', borderRadius: 14, padding: 16, font: '500 12.5px/1.6 var(--f-ui)', color: '#5b7678' }}>
                  {pt.cardNote}
                </div>
              )}

              {payError && <div style={{ marginTop: 10, font: '600 11px var(--f-ui)', color: '#D64545' }}>{payError}</div>}
            </div>
          )}

          {/* CARD deposit form — shown on the final Payment step after choosing card + PAY. The booking
              is created only once Stripe confirms the charge (handleCardPaid); cancelling creates nothing.
              A redirect-based SCA challenge returns to /booking/finalize, which finalizes by intent id. */}
          {cardStage && (
            <div style={cardStyleR}>
              <StepHead num={5} title={pt.cardPayTitle} />
              <div style={{ marginTop: 6, font: '500 12.5px/1.6 var(--f-ui)', color: '#5b7678' }}>{pt.cardPaySub}</div>
              <div style={{ marginTop: 14 }}>
                <StripeCardForm
                  clientSecret={cardStage.clientSecret}
                  publishableKey={cardStage.publishableKey}
                  amountLabel={cardStage.amountLabel}
                  lang={lang}
                  onPaid={handleCardPaid}
                  payLabel={pt.cardPayBtn}
                  returnUrl={typeof window !== 'undefined' ? `${window.location.origin}${bookingPath}` : undefined}
                />
              </div>
              {cardError && <div style={{ marginTop: 10, font: '600 12px var(--f-ui)', color: '#D64545' }}>{cardError}</div>}
              <button
                type="button"
                onClick={() => { setCardStage(null); setCardError(null) }}
                style={{ marginTop: 12, background: 'none', border: 'none', color: '#5b7678', font: '700 12px var(--f-ui)', cursor: 'pointer', padding: 0 }}
              >
                ← {pt.cardCancel}
              </button>
            </div>
          )}

          {/* inline errors / suggestion */}
          {(error || suggestion) && (
            <div
              style={{
                background: '#FFF1EE',
                border: '1px solid rgba(214,69,69,.25)',
                borderRadius: 14,
                padding: '14px 16px',
              }}
            >
              {error && <div style={{ font: '600 13px var(--f-ui)', color: '#D64545' }}>{error}</div>}
              {suggestion && (
                <div style={{ marginTop: error ? 8 : 0, font: '600 12px var(--f-ui)', color: '#0d9488' }}>
                  {t.suggestFree}: {fmtDate(suggestion.start)} → {fmtDate(suggestion.end)}
                </div>
              )}
            </div>
          )}

          {/* back / continue */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={back}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: isMobile ? '100%' : undefined,
                minHeight: 46,
                padding: '12px 20px',
                borderRadius: 14,
                border: '1.5px solid var(--line)',
                background: 'var(--surface)',
                color: 'var(--teal-700)',
                font: '700 13px var(--f-display)',
                cursor: 'pointer',
                opacity: 1,
              }}
            >
              ‹ {step === 0 ? t.backToCar : t.back}
            </button>
            {/* On mobile the primary Continue/Submit lives in the fixed bottom bar. */}
            {isMobile ? null : step < LAST_STEP ? (
              <button
                type="button"
                onClick={next}
                disabled={!stepValid(step)}
                className="av-cta"
                title={!stepValid(step) ? (step === 3 ? t.verifyRequired : t.lockedHint) : undefined}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 26px',
                  borderRadius: 14,
                  border: 'none',
                  background: 'linear-gradient(180deg,var(--accent),var(--accent-strong))',
                  color: '#fff',
                  font: '700 14.5px var(--f-display)',
                  boxShadow: '0 16px 30px -12px rgba(251,109,76,.7)',
                  cursor: !stepValid(step) ? 'not-allowed' : 'pointer',
                  opacity: !stepValid(step) ? 0.5 : 1,
                }}
              >
                {t.cont} ›
              </button>
            ) : cardStage ? null : (
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="av-cta"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 26px',
                  borderRadius: 14,
                  border: 'none',
                  background: 'linear-gradient(180deg,var(--accent),var(--accent-strong))',
                  color: '#fff',
                  font: '700 14.5px var(--f-display)',
                  boxShadow: '0 16px 30px -12px rgba(251,109,76,.7)',
                  cursor: submitting ? 'wait' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? t.submitting : `${submitLabel} ›`}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT — sticky summary (desktop only; mobile uses the fixed bottom bar below) */}
        {!isMobile && (
        <div style={{ flex: '0 0 380px', width: 380, minWidth: 0, position: 'sticky', top: authed ? 'var(--booking-sticky-top, 72px)' : 'var(--booking-sticky-top, 170px)' }}>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 1px 2px rgba(6,33,38,.04), 0 30px 60px -34px rgba(11,85,96,.5)',
            }}
          >
            <SummaryGallery photos={car?.photos ?? []} label={car ? `${car.brand} ${car.model}` : 'AVENTA'} />
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ font: '700 18px var(--f-display)', color: 'var(--ink)' }}>
                    {car ? `${car.brand} ${car.model}` : 'AVENTA'}
                  </div>
                  <div style={{ marginTop: 4, font: '600 11px var(--f-mono)', letterSpacing: '.04em', color: 'var(--muted)' }}>
                    {car ? `${car.clsLabel} · ${car.year}` : ''}
                  </div>
                </div>
                {car && (
                  <span style={{ flexShrink: 0, padding: '5px 10px', borderRadius: 999, background: 'var(--teal-soft)', color: 'var(--teal-700)', font: '700 9.5px var(--f-mono)', letterSpacing: '.09em', textTransform: 'uppercase' }}>
                    {car.clsLabel}
                  </span>
                )}
              </div>
              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 9,
                  font: '500 13px var(--f-ui)',
                }}
              >
                <Row label={t.period} value={`${fmtDate(startAt)} → ${fmtDate(endAt)} · ${days} ${t.nights}`} strong />
                <Row label={`${t.rent} ${days}×${fmt(convert(perDay, currency, rates), currency)}`} value={fmt(totals.rent, currency)} strong />
                {totals.extras > 0 && <Row label={t.extrasL} value={fmt(totals.extras, currency)} strong />}
                {totals.insurance > 0 && <Row label={t.insuranceL} value={fmt(totals.insurance, currency)} strong />}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    borderTop: '1px solid var(--line)',
                    paddingTop: 12,
                    marginTop: 2,
                  }}
                >
                  <span style={{ color: 'var(--ink)', font: '800 14px var(--f-display)' }}>{t.total}</span>
                  <span style={{ color: 'var(--ink)', font: '800 22px var(--f-display)' }}>{fmt(totals.total, currency)}</span>
                </div>
                <Row label={t.deposit} value={fmt(totals.deposit, currency)} />
              </div>

              {/* Pay-now tile — reservation deposit split (design teal-soft tile) */}
              <div style={{ marginTop: 14, padding: '13px 15px', borderRadius: 14, background: 'var(--teal-soft)', border: '1px solid rgba(13,148,136,.18)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ font: '700 10px var(--f-mono)', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--teal-700)' }}>
                    {t.payNowShort} · {depositPercent}%
                  </span>
                  <span style={{ font: '800 18px var(--f-display)', color: 'var(--teal-deep)' }}>{fmt(payNowDisplay, currency)}</span>
                </div>
                <div style={{ marginTop: 4, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ font: '600 11.5px var(--f-ui)', color: 'var(--muted)' }}>{t.restReturn}</span>
                  <span style={{ font: '700 12.5px var(--f-ui)', color: 'var(--muted)' }}>{fmt(remainingDisplay, currency)}</span>
                </div>
              </div>

              {(() => {
                // Hidden while the card form is active — the customer completes payment in the Stripe panel.
                if (cardStage) return null
                // The submit/pay action is only offered ON the final Payment step (and once every earlier
                // step is complete). On steps 1–4 it stays disabled — you can't submit/pay from the summary
                // before reaching Payment.
                const allComplete = firstIncomplete >= LAST_STEP
                const onPayStep = step === LAST_STEP
                const disabled = submitting || !allComplete || !onPayStep
                return (
                  <button
                    type="button"
                    className={disabled ? undefined : 'av-cta'}
                    onClick={submit}
                    disabled={disabled}
                    title={!allComplete ? t.lockedHint : !onPayStep ? t.payOnLastStep : undefined}
                    style={{
                      marginTop: 16,
                      width: '100%',
                      display: 'block',
                      textAlign: 'center',
                      padding: '15px 16px',
                      border: 'none',
                      background: disabled ? 'var(--muted-2)' : 'linear-gradient(180deg,var(--accent),var(--accent-strong))',
                      color: '#fff',
                      borderRadius: 14,
                      font: '700 14.5px var(--f-display)',
                      letterSpacing: '.01em',
                      boxShadow: disabled ? 'none' : '0 16px 30px -12px rgba(251,109,76,.7)',
                      cursor: submitting ? 'wait' : disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.6 : 1,
                    }}
                  >
                    {submitting ? t.submitting : submitLabel}
                  </button>
                )
              })()}
              <div style={{ marginTop: 10, textAlign: 'center', font: '500 11px var(--f-ui)', color: 'var(--muted)' }}>
                {submitSubtext}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* MOBILE — fixed bottom bar: total + pay-now + expandable breakdown + primary CTA.
          Always visible so the total & pay-now are reachable without scrolling to the bottom. */}
      {isMobile && (
        <>
          {/* backdrop for the expanded breakdown sheet */}
          {sheetOpen && (
            <div
              onClick={() => setSheetOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(6,40,46,.35)', zIndex: 59 }}
            />
          )}
          <div className="av-bottombar" style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', boxShadow: '0 -12px 30px -20px rgba(6,33,38,.45)' }}>
            {/* expandable price breakdown (bottom sheet) */}
            {sheetOpen && (
              <div style={{ padding: '14px 16px 6px', borderBottom: '1px solid rgba(12,59,69,.08)', maxHeight: '52vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, font: '500 13px var(--f-ui)' }}>
                  <Row label={t.period} value={`${fmtDate(startAt)} → ${fmtDate(endAt)} · ${days} ${t.nights}`} strong />
                  <Row label={`${t.rent} ${days}×${fmt(convert(perDay, currency, rates), currency)}`} value={fmt(totals.rent, currency)} strong />
                  {totals.extras > 0 && <Row label={t.extrasL} value={fmt(totals.extras, currency)} strong />}
                  {totals.insurance > 0 && <Row label={t.insuranceL} value={fmt(totals.insurance, currency)} strong />}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                    <span style={{ color: 'var(--ink)', font: '800 14px var(--f-display)' }}>{t.total}</span>
                    <span style={{ color: 'var(--ink)', font: '800 20px var(--f-display)' }}>{fmt(totals.total, currency)}</span>
                  </div>
                  <Row label={t.deposit} value={fmt(totals.deposit, currency)} />
                  {/* pay-now / rest split — mirrors the emphasized bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(13,148,136,.2)', marginTop: 2, paddingTop: 10 }}>
                    <span style={{ color: 'var(--teal-700)', fontWeight: 800 }}>{t.payNowShort} · {depositPercent}%</span>
                    <span style={{ color: 'var(--teal-deep)', fontWeight: 800, fontSize: 17 }}>{fmt(payNowDisplay, currency)}</span>
                  </div>
                  <Row label={t.restReturn} value={fmt(remainingDisplay, currency)} />
                </div>
              </div>
            )}
            {/* the always-visible bar: PAY NOW is the star, total + rest secondary (tap to expand) + primary CTA */}
            <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={() => setSheetOpen((v) => !v)}
                aria-expanded={sheetOpen}
                style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4 }}
              >
                {/* label */}
                <span style={{ font: '800 10px var(--f-mono)', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--teal-700)' }}>
                  {t.payNowShort} · {depositPercent}%
                </span>
                {/* the star: highlighted pay-now amount */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', padding: '4px 11px', borderRadius: 11, background: 'var(--teal-soft)', border: '1px solid rgba(13,148,136,.24)' }}>
                  <span style={{ font: '800 23px var(--f-display)', color: 'var(--teal-deep)', lineHeight: 1 }}>{fmt(payNowDisplay, currency)}</span>
                  <span aria-hidden style={{ font: '700 11px var(--f-ui)', color: 'var(--teal)', transition: 'transform .2s', transform: sheetOpen ? 'rotate(180deg)' : 'none' }}>▲</span>
                </span>
                {/* secondary: total + rest on return + expand hint */}
                <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '2px 8px', font: '600 11px var(--f-ui)', color: 'var(--muted)' }}>
                  <span>{t.total} <b style={{ fontWeight: 800, color: 'var(--ink)' }}>{fmt(totals.total, currency)}</b></span>
                  <span aria-hidden>·</span>
                  <span>{fmt(remainingDisplay, currency)} {t.restReturn}</span>
                  <span style={{ color: 'var(--teal)', fontWeight: 700 }}>{t.moreDetails} ›</span>
                </span>
              </button>
              {step < LAST_STEP ? (
                <button
                  type="button"
                  onClick={() => { setSheetOpen(false); next() }}
                  disabled={!stepValid(step)}
                  className="av-cta av-tap"
                  title={!stepValid(step) ? (step === 3 ? t.verifyRequired : t.lockedHint) : undefined}
                  style={{
                    flexShrink: 0,
                    padding: '14px 24px',
                    borderRadius: 14,
                    border: 'none',
                    background: 'linear-gradient(180deg,var(--accent),var(--accent-strong))',
                    color: '#fff',
                    font: '700 14.5px var(--f-display)',
                    boxShadow: '0 14px 26px -12px rgba(251,109,76,.7)',
                    cursor: !stepValid(step) ? 'not-allowed' : 'pointer',
                    opacity: !stepValid(step) ? 0.5 : 1,
                  }}
                >
                  {t.cont} ›
                </button>
              ) : cardStage ? null : (
                <button
                  type="button"
                  onClick={() => { setSheetOpen(false); submit() }}
                  disabled={submitting}
                  className="av-cta av-tap"
                  style={{
                    flexShrink: 0,
                    padding: '14px 24px',
                    borderRadius: 14,
                    border: 'none',
                    background: 'linear-gradient(180deg,var(--accent),var(--accent-strong))',
                    color: '#fff',
                    font: '700 14.5px var(--f-display)',
                    boxShadow: '0 14px 26px -12px rgba(251,109,76,.7)',
                    cursor: submitting ? 'wait' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? t.submitting : submitLabel}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* scroll-to-confirm legal modal (privacy / distance-selling) — the consent gate on the Route step */}
      {legalModal && (
        <LegalConsentModal
          open
          docKey={legalModal}
          lang={lang}
          onClose={() => setLegalModal(null)}
          onReachedEnd={() => { if (legalModal === 'privacy') setScrolledPrivacy(true); else setScrolledOffer(true) }}
          onAgree={() => {
            if (legalModal === 'privacy') { setScrolledPrivacy(true); setConsentPersonal(true) }
            else { setScrolledOffer(true); setConsentOffer(true) }
            setLegalModal(null)
          }}
        />
      )}

      {/* Exit confirmation (step-1 Back): Save draft / Don't save / Continue booking */}
      {exitDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.exitTitle}
          onClick={() => setExitDialog(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 220, background: 'rgba(11,40,46,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(12px,4vw,28px)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 18, padding: '22px 22px 20px', boxShadow: '0 40px 90px -30px rgba(11,85,96,.7)' }}
          >
            <h2 style={{ margin: 0, font: '800 18px var(--f-display)', color: '#0a2225' }}>{t.exitTitle}</h2>
            <p style={{ margin: '10px 0 18px', font: '500 13px/1.6 var(--f-ui)', color: '#5b7678' }}>{t.exitBody}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <button
                type="button"
                onClick={saveAndExit}
                disabled={savingDraft}
                className="av-cta av-tap"
                style={{ width: '100%', minHeight: 48, padding: '13px 18px', borderRadius: 12, border: 'none', background: 'var(--grad-coral)', color: '#fff', font: '800 14px var(--f-ui)', cursor: savingDraft ? 'wait' : 'pointer', opacity: savingDraft ? 0.7 : 1 }}
              >
                {savingDraft ? t.exitSaving : t.exitSave}
              </button>
              <button
                type="button"
                onClick={() => setExitDialog(false)}
                className="av-tap"
                style={{ width: '100%', minHeight: 46, padding: '12px 18px', borderRadius: 12, border: '1px solid #C7E4E9', background: '#fff', color: '#0a2225', font: '700 13px var(--f-ui)', cursor: 'pointer' }}
              >
                {t.exitContinue}
              </button>
              <button
                type="button"
                onClick={discardAndExit}
                disabled={savingDraft}
                className="av-tap"
                style={{ width: '100%', minHeight: 44, padding: '11px 18px', borderRadius: 12, border: 'none', background: 'none', color: '#C6392B', font: '700 13px var(--f-ui)', cursor: 'pointer' }}
              >
                {t.exitDiscard}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume prompt (returning with a valid saved draft): Resume / Start fresh */}
      {resumeOffer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.resumeTitle}
          onClick={() => setResumeOffer(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 220, background: 'rgba(11,40,46,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(12px,4vw,28px)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 18, padding: '22px 22px 20px', boxShadow: '0 40px 90px -30px rgba(11,85,96,.7)' }}
          >
            <h2 style={{ margin: 0, font: '800 18px var(--f-display)', color: '#0a2225' }}>{t.resumeTitle}</h2>
            <p style={{ margin: '10px 0 18px', font: '500 13px/1.6 var(--f-ui)', color: '#5b7678' }}>{t.resumeBody}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <button
                type="button"
                onClick={resumeDraft}
                className="av-cta av-tap"
                style={{ width: '100%', minHeight: 48, padding: '13px 18px', borderRadius: 12, border: 'none', background: 'var(--grad-coral)', color: '#fff', font: '800 14px var(--f-ui)', cursor: 'pointer' }}
              >
                {t.resumeYes}
              </button>
              <button
                type="button"
                onClick={startFresh}
                className="av-tap"
                style={{ width: '100%', minHeight: 46, padding: '12px 18px', borderRadius: 12, border: '1px solid #C7E4E9', background: '#fff', color: '#0a2225', font: '700 13px var(--f-ui)', cursor: 'pointer' }}
              >
                {t.resumeFresh}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3-D Secure return: creating the already-paid booking. Blocks the UI so the customer waits here
          rather than seeing the fresh wizard while the booking is finalized. */}
      {finalizingCard && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.cardFinalizingTitle}
          style={{ position: 'fixed', inset: 0, zIndex: 240, background: 'rgba(11,40,46,.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(12px,4vw,28px)' }}
        >
          <div style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 18, padding: '26px 24px', textAlign: 'center', boxShadow: '0 40px 90px -30px rgba(11,85,96,.7)' }}>
            <div aria-hidden style={{ width: 44, height: 44, margin: '0 auto', borderRadius: '50%', border: '3px solid #E3EFF1', borderTopColor: '#0d9488', animation: 'av-spin 0.8s linear infinite' }} />
            <h2 style={{ margin: '16px 0 0', font: '800 18px var(--f-display)', color: '#0a2225' }}>{t.cardFinalizingTitle}</h2>
            <p style={{ margin: '10px 0 0', font: '500 13px/1.6 var(--f-ui)', color: '#5b7678' }}>{t.cardFinalizingBody}</p>
          </div>
        </div>
      )}

      {!authed && <ClientFooter />}
    </div>
  )

  // Signed-in → render inside the cabinet's left green-sidebar shell (booking "lives in the cabinet").
  // Guest → the standalone body above (with its own top nav) is returned as-is.
  return authed && shellUser ? (
    <AccountShell active="bookings" user={shellUser} title={t.title}>
      {bookingBody}
    </AccountShell>
  ) : (
    bookingBody
  )
}
