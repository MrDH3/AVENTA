'use client'

import { useMemo, useState, useTransition, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type {
  BookingStatus,
  CarClass,
  Currency,
  DocumentStatus,
  DocumentType,
  Gearbox,
  Fuel,
  InsuranceStatus,
  ServiceCategory,
  TripGoal,
} from '@prisma/client'
import AdminShell, { type AdminNavKey } from '../components/AdminShell'
import { useIsMobile } from '@/components/useIsMobile'
import CarPhotoManager from '@/components/CarPhotoManager'
import {
  addBookingComment,
  deleteCar,
  deleteService,
  recordPayment,
  reorderService,
  reviewDocument,
  setBookingStatus,
  setPaymentStatus,
  setInsuranceStatus,
  toggleCarActive,
  toggleServiceActive,
  updateRate,
  updateSetting,
  upsertCar,
  upsertService,
} from '@/server/admin-actions'
import { saveMapConfigAction } from '@/server/map-actions'
import { purgeCustomerDocsAction } from '@/server/id-document-actions'
import VerificationReview from './VerificationReview'
import { statusLabel, BOOKING_STATUS_KIND, KIND_COLORS, type StatusKind } from '@/lib/booking-status'
import OrderStatusControl from './OrderStatusControl'
import Collapsible from '../components/Collapsible'
import type {
  AdminBookingDetail,
  AdminBookingRow,
  AdminCar,
  AdminClient,
  AdminDocument,
  AdminPaymentLine,
  AdminPaymentRow,
  AdminProps,
  AdminRate,
  AdminService,
  AdminSetting,
  AdminMapConfig,
} from '@/app/admin/page'
import { LANGUAGES, useDict, useLang, type Dict } from '../i18n/lang'

/* ============================================================
   AVENTA — Admin Panel (internal, RU-only, deep-sea dark)
   Wired to PostgreSQL via server actions. Tab state via ?tab=…
   Booking detail via ?booking=<id>. Design preserved verbatim.
   ============================================================ */

/* ====================== i18n DICTIONARY ======================
   All user-facing admin strings. RU is the authored source of truth; en/tr/es/de are
   professional translations. Each sub-component calls `const t = useDict(dict)`. Module-level
   helpers that need copy receive `t` (or the needed slice) as a parameter — the hook is never
   called at module scope. Booking-status labels come from lib/booking-status (localised there). */
interface Strings {
  // enum → label maps (keys must stay verbatim; only values are translated)
  paymentStatus: Record<string, string>
  paymentMethod: Record<string, string>
  paymentKind: Record<string, string>
  carClass: Record<CarClass, string>
  gearbox: Record<Gearbox, string>
  fuel: Record<Fuel, string>
  serviceCat: Record<string, string>
  serviceUnit: Record<string, string>
  docType: Record<DocumentType, string>
  docStatus: Record<DocumentStatus, string>
  tripGoal: Record<TripGoal, string>
  insuranceType: Record<string, string>
  insuranceOpt: Record<string, string>
  serviceUnitOpt: Record<string, string>
  carFieldMsg: Record<string, string>
  serviceFieldMsg: Record<string, string>
  companyField: Record<string, string>
  months: string[]
  titles: Record<AdminNavKey, [string, string]>
  // page
  orderTitle: (n: string) => string
  open: string
  // settings tab links
  linkAuthTitle: string
  linkAuthDesc: string
  linkPaymentsTitle: string
  linkPaymentsDesc: string
  linkProvidersTitle: string
  linkProvidersDesc: string
  linkLocationsTitle: string
  linkLocationsDesc: string
  linkInsuranceTitle: string
  linkInsuranceDesc: string
  linkSumsubTitle: string
  linkSumsubDesc: string
  // bookings list
  chipAll: (n: number) => string
  chipNew: (n: number) => string
  chipActive: (n: number) => string
  chipPending: (n: number) => string
  passiveCar: string
  passivePeriod: string
  passiveExport: string
  colOrderNo: string
  colClient: string
  colCar: string
  colPeriod: string
  colStatus: string
  colAmount: string
  colPayment: string
  noBookings: string
  openRow: string
  // pay summary labels
  payPaid: string
  payPartial: string
  payUnpaid: string
  // payment section
  payTitle: string
  awaitingConfirm: (n: number) => string
  creditToAccount: string
  noPayments: string
  receipt: string
  btnConfirmPayment: string
  btnDepositReceived: string
  changePaymentStatus: string
  // booking detail messages
  msgSaved: string
  msgError: string
  msgInsuranceUpdated: string
  msgCommentAdded: string
  msgStatusUpdated: string
  promptRejectReason: string
  msgDocApproved: string
  msgDocRejected: string
  confirmPurgeDocs: string
  msgDocsPurged: string
  msgPaymentStatusUpdated: string
  verifApproved: string
  verifPending: string
  verifRejected: string
  verifResubmission: string
  verifNone: string
  fieldVerification: string
  fieldEmail: string
  fieldPhone: string
  fieldWhatsapp: string
  fieldPassport: string
  fieldLicense: string
  fieldLicensePeriod: string
  fieldPassportExpiry: string
  fieldAddress: string
  airportAntalya: string
  pickupAddressDefault: string
  backToList: string
  kfClient: string
  kfCar: string
  kfRentalPeriod: string
  kfPayment: string
  daysUnit: string
  balanceDeposit: (bal: string, dep: string) => string
  collapseDocsTitle: string
  filesCount: (n: number) => string
  docsNotUploaded: string
  sumsubDocsTitle: string
  btnDeleteStorage: string
  perDocDecisionTitle: string
  pickupAddressLabel: string
  tripGoalTitle: string
  tripGoalNotSet: string
  insuranceLabel: string
  insuranceNotIssued: string
  adminCommentTitle: string
  commentPlaceholder: string
  send: string
  bookingLabel: string
  rowPeriod: string
  rowPickupReturn: string
  servicesLabel: string
  rowRent: string
  rowServices: string
  rowInsurance: string
  rowTotal: string
  rowPrepay: string
  paidSuffix: (m: string) => string
  rowBalance: string
  rowDeposit: string
  statusHistoryTitle: string
  // doc card
  btnVerify: string
  btnReject: string
  // cars
  confirmDeleteCar: (name: string) => string
  errDeleteFailed: string
  savedCarAdded: (label: string) => string
  savedCarUpdated: (label: string) => string
  errCheckFields: string
  errSaveFailed: string
  carFallback: string
  searchCarPlaceholder: string
  filterAll: (n: number) => string
  filterActive: (n: number) => string
  filterHidden: (n: number) => string
  btnAddCar: string
  colPhoto: string
  colClass: string
  colPricePerDay: string
  colDeposit: string
  colActions: string
  emptyCarsNone: string
  emptyFilter: string
  seatsUnit: string
  statusActiveM: string
  statusHiddenM: string
  titleEdit: string
  actionDelete: string
  btnEditShort: string
  // car form
  carFormNew: string
  requiredFieldsPre: string
  requiredFieldsPost: string
  cancel: string
  saving: string
  carFormAdd: string
  carFormSave: string
  scBasics: string
  scSpecs: string
  scPricing: string
  scPricingHint: string
  scConditions: string
  scPhotos: string
  fBrand: string
  fModel: string
  fYear: string
  fClass: string
  fGearbox: string
  fFuel: string
  fSeats: string
  fDoors: string
  fAircon: string
  yes: string
  no: string
  fPricePerDay: string
  fDeposit: string
  fMileage: string
  mileagePlaceholder: string
  fMinRental: string
  fPrepHours: string
  fShowToClients: string
  conditionsNote: string
  photosSaveFirst: string
  // clients
  cvApproved: string
  cvPending: string
  cvRejected: string
  cvResubmission: string
  cvNone: string
  clientsSummary: (n: number, m: number) => string
  colContacts: string
  colCitizenship: string
  colBookings: string
  colDocuments: string
  colEmail: string
  noClients: string
  docFull: string
  docNoLicense: string
  docIncomplete: string
  bookingsPrefix: string
  idDocsLabel: string
  docsNotUploadedYet: string
  // payments view
  kpiIncome: string
  kpiAwaiting: string
  kpiDeposits: string
  kpiAvg: string
  errBookingAmount: string
  errRecordFailed: string
  btnRecordPayment: string
  newPaymentTitle: string
  fBooking: string
  fMethod: string
  fType: string
  fAmount: string
  fCurrency: string
  fStatus: string
  fTxHash: string
  btnRecord: string
  colNo: string
  colDate: string
  noPaymentsYet: string
  // services view
  confirmDeleteService: (name: string) => string
  savedServiceAdded: (label: string) => string
  savedServiceUpdated: (label: string) => string
  serviceFallback: string
  searchServicePlaceholder: string
  btnAddService: string
  reorderHint: string
  emptyServicesNone: string
  free: string
  arrowUp: string
  arrowDown: string
  colOrder: string
  colService: string
  colCategory: string
  colPrice: string
  colUnit: string
  colActive: string
  // service form
  serviceFormNew: string
  serviceFormAdd: string
  serviceFormSave: string
  scName: string
  scNameHint: string
  scPriceHint: string
  scDesc: string
  scDescHint: string
  scRecommend: string
  scRecommendHint: string
  fNameRu: string
  fNameEn: string
  phNameRu: string
  fCategory: string
  fPrice: string
  fUnit: string
  statusActiveF: string
  statusHiddenF: string
  fDescRu: string
  fDescEn: string
  phDescRu: string
  // settings — map provider
  providerNoKey: string
  providerKeySaved: string
  providerNeedKey: string
  mapCardTitle: string
  mapCardDesc: string
  googleApiKey: string
  yandexApiKey: string
  phKeySaved: string
  phEnterKey: string
  saveBtn: string
  // settings — rates
  baseEur: string
  currenciesTitle: string
  oneEur: string
  ratesHint: string
  // settings — company
  companyTitle: string
  sslNote: string
  // settings — backup
  backupTitle: string
  autoBackup: string
  lastBackup: string
  lastBackupValue: string
  downloadBackup: string
  restore: string
}

const dict: Dict<Strings> = {
  ru: {
    paymentStatus: { NOT_PAID: 'Не оплачено', AWAITING: 'Ожидает', PARTIAL: 'Частично', PAID: 'Оплачено', DEPOSIT_HELD: 'Залог получен', DEPOSIT_RETURNED: 'Залог возвращён', ERROR: 'Ошибка', CANCELLED: 'Отменено' },
    paymentMethod: { CARD_STRIPE: 'Карта (Stripe)', CARD_PAYPAL: 'PayPal', BANK_TRANSFER: 'IBAN перевод', CRYPTO: 'Криптовалюта', CASH: 'Наличные', MANUAL: 'Вручную' },
    paymentKind: { RENT: 'Аренда', DEPOSIT: 'Залог', PREPAY: 'Предоплата', BALANCE: 'Остаток', FULL: 'Полная' },
    carClass: { ECONOMY: 'Эконом', COMFORT: 'Комфорт', BUSINESS: 'Бизнес', PREMIUM: 'Премиум', SUV: 'Премиум SUV', MINIVAN: 'Минивэн VIP' },
    gearbox: { AUTOMATIC: 'Автомат', MANUAL: 'Механика' },
    fuel: { PETROL: 'Бензин', DIESEL: 'Дизель', HYBRID: 'Гибрид', ELECTRIC: 'Электро' },
    serviceCat: { RENTAL: 'Авто', TRANSFER: 'Трансфер', REAL_ESTATE: 'Недвижимость', TOURS: 'Досуг', INSURANCE: 'Страхование', CONCIERGE: 'Сервис', CONNECTIVITY: 'Связь', OTHER: 'Прочее' },
    serviceUnit: { flat: '', per_day: '/ сут', per_trip: '/ поездка' },
    docType: { PASSPORT: 'Паспорт', SELFIE: 'Селфи с документом', LICENSE_FRONT: 'ВУ лицевая', LICENSE_BACK: 'ВУ обратная', PAYMENT_PROOF: 'Чек оплаты', CONTRACT: 'Договор', OTHER: 'Документ' },
    docStatus: { UPLOADED: 'Загружен', UNDER_REVIEW: 'На проверке', VERIFIED: 'Проверен', REJECTED: 'Отклонён' },
    tripGoal: { LEISURE: 'Отдых', BUSINESS: 'Бизнес', PROPERTY_PURCHASE: 'Покупка недвижимости', PROPERTY_VIEWING: 'Просмотр недвижимости', MEDICAL: 'Лечение', RELOCATION: 'Переезд', LONG_STAY: 'Долгосрочная аренда', VISITING: 'В гости', OTHER: 'Другое' },
    insuranceType: { BASIC: 'Базовая страховка', EXTENDED: 'Расширенная страховка', FULL_NO_FRANCHISE: 'Полная страховка без франшизы' },
    insuranceOpt: { ISSUED: 'Оформлена', PENDING: 'Ожидает', CLIENT_DATA_INCOMPLETE: 'Данные неполные', NEEDS_EXTRA_CHECK: 'Доп. проверка' },
    serviceUnitOpt: { flat: 'Разово', per_day: 'За сутки', per_trip: 'За поездку' },
    carFieldMsg: { brand: 'Укажите марку — например, BMW', model: 'Укажите модель — например, 520i', year: 'Год выпуска от 1990 до 2100', class: 'Выберите класс автомобиля', seats: 'Число мест от 1 до 20', doors: 'Число дверей от 2 до 6', pricePerDay: 'Цена за сутки — число не меньше 0', deposit: 'Залог — число не меньше 0', mileageLimitPerDay: 'Лимит пробега — целое число (пусто = без лимита)', minRentalDays: 'Минимальный срок — от 1 до 60 суток', prepHoursBetween: 'Время подготовки — от 0 до 168 часов' },
    serviceFieldMsg: { nameRu: 'Укажите название по-русски', nameEn: 'Укажите название по-английски (English)', price: 'Цена — число не меньше 0 (0 = бесплатно)', category: 'Выберите категорию', unit: 'Выберите единицу расчёта' },
    companyField: { company_name: 'Название компании', company_legal: 'Юр. лицо', company_phone: 'Телефон', company_email: 'Email', company_address: 'Адрес', bank_iban: 'IBAN', bank_swift: 'SWIFT' },
    months: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
    titles: {
      dashboard: ['Дашборд', 'Сводка по бизнесу'],
      bookings: ['Бронирования', 'Все заявки клиентов'],
      board: ['Доска заказов', 'Канбан по этапам аренды'],
      cars: ['Автомобили', 'Управление автопарком'],
      calendar: ['Календарь', 'Занятость автопарка'],
      clients: ['Клиенты', 'База клиентов и история'],
      verifications: ['Проверки', 'Очередь проверки личности'],
      payments: ['Оплаты', 'Оплаты, залоги и остатки'],
      finance: ['Финансы', 'Учёт денег — доходы, расходы, прибыль'],
      services: ['Услуги', 'Каталог дополнительных услуг'],
      notifications: ['Уведомления', 'Системные события'],
      settings: ['Настройки', 'Параметры и доступы'],
      team: ['Команда', 'Администраторы и восстановление'],
    },
    orderTitle: (n) => `Заявка ${n}`,
    open: 'Открыть →',
    linkAuthTitle: 'Вход через соцсети · Google · Yandex · Telegram',
    linkAuthDesc: 'Ключи OAuth, секреты шифруются, включение/выключение кнопок входа',
    linkPaymentsTitle: 'Платежи и валюты · депозит · крипто · банк',
    linkPaymentsDesc: 'Процент предоплаты, включение способов оплаты, криптокошельки, банковские реквизиты, курсы валют',
    linkProvidersTitle: 'Платёжные провайдеры · Stripe · PayPal · PayTR · iyzico',
    linkProvidersDesc: 'Эквайринг: ключи процессоров (секреты шифруются), вкл/выкл каждого, статусы. Показываются в оплате только включённые',
    linkLocationsTitle: 'Города и офисы · зоны обслуживания · карта',
    linkLocationsDesc: 'Список городов (вкл/выкл, порядок), адрес и координаты офиса выдачи на карте',
    linkInsuranceTitle: 'Страховка — что включено · покрытие тарифов',
    linkInsuranceDesc: 'Условия покрытия Basic / Extended / Full (франшиза, угон, ущерб, стёкла, помощь) — редактируются, хранятся в БД',
    linkSumsubTitle: 'Проверка личности (Sumsub) · KYC',
    linkSumsubDesc: 'Ключи Sumsub (шифруются), уровень проверки, webhook. Паспорт/ID + права + liveness на шаге «Данные»',
    chipAll: (n) => `Все · ${n}`,
    chipNew: (n) => `Новые · ${n}`,
    chipActive: (n) => `Активные · ${n}`,
    chipPending: (n) => `Ожидают оплаты · ${n}`,
    passiveCar: 'Авто ▾',
    passivePeriod: 'Период ▾',
    passiveExport: 'Экспорт',
    colOrderNo: '№ ЗАЯВКИ',
    colClient: 'КЛИЕНТ',
    colCar: 'АВТОМОБИЛЬ',
    colPeriod: 'ПЕРИОД',
    colStatus: 'СТАТУС',
    colAmount: 'СУММА',
    colPayment: 'ОПЛАТА',
    noBookings: 'Заявок не найдено',
    openRow: 'Открыть ›',
    payPaid: 'Оплачено',
    payPartial: 'Частично',
    payUnpaid: 'Не оплачено',
    payTitle: 'ПЛАТЕЖИ ПО ЗАКАЗУ',
    awaitingConfirm: (n) => `${n} ${n === 1 ? 'ждёт' : 'ждут'} подтверждения`,
    creditToAccount: 'Зачислить на счёт:',
    noPayments: 'Платежей по этому заказу пока нет.',
    receipt: 'Чек',
    btnConfirmPayment: 'Подтвердить оплату',
    btnDepositReceived: 'Залог получен',
    changePaymentStatus: 'Изменить статус платежа',
    msgSaved: 'Сохранено',
    msgError: 'Ошибка',
    msgInsuranceUpdated: 'Статус страховки обновлён',
    msgCommentAdded: 'Комментарий добавлен',
    msgStatusUpdated: 'Статус обновлён',
    promptRejectReason: 'Причина отклонения (необязательно):',
    msgDocApproved: 'Документ подтверждён',
    msgDocRejected: 'Документ отклонён',
    confirmPurgeDocs: 'Удалить проверенные документы личности этого клиента из зашифрованного хранилища? Действие необратимо.',
    msgDocsPurged: 'Документы удалены',
    msgPaymentStatusUpdated: 'Статус платежа обновлён',
    verifApproved: '🟢 Подтверждён',
    verifPending: '🟡 На проверке',
    verifRejected: '🔴 Отклонён',
    verifResubmission: '🟠 Требуется повторно',
    verifNone: '⚪ Не проверен',
    fieldVerification: 'ПРОВЕРКА ЛИЧНОСТИ (SUMSUB)',
    fieldEmail: 'EMAIL',
    fieldPhone: 'ТЕЛЕФОН',
    fieldWhatsapp: 'WHATSAPP / TG',
    fieldPassport: 'ПАСПОРТ / ID',
    fieldLicense: 'ВОД. УДОСТОВЕРЕНИЕ',
    fieldLicensePeriod: 'СРОК ВУ',
    fieldPassportExpiry: 'СРОК ПАСПОРТА/ID',
    fieldAddress: 'АДРЕС',
    airportAntalya: 'Аэропорт Анталии (AYT)',
    pickupAddressDefault: 'Адрес подачи',
    backToList: '← К списку заявок',
    kfClient: 'КЛИЕНТ',
    kfCar: 'АВТОМОБИЛЬ',
    kfRentalPeriod: 'ПЕРИОД АРЕНДЫ',
    kfPayment: 'ОПЛАТА',
    daysUnit: 'сут',
    balanceDeposit: (bal, dep) => `Остаток ${bal} · залог ${dep}`,
    collapseDocsTitle: 'ДОКУМЕНТЫ И ПРОВЕРКА ЛИЧНОСТИ',
    filesCount: (n) => `${n} файл.`,
    docsNotUploaded: 'Документы не загружены',
    sumsubDocsTitle: 'ДОКУМЕНТЫ ЛИЧНОСТИ (SUMSUB)',
    btnDeleteStorage: 'Удалить (хранение)',
    perDocDecisionTitle: 'ПРОВЕРКА ЛИЧНОСТИ — ПОДОКУМЕНТНОЕ РЕШЕНИЕ',
    pickupAddressLabel: 'АДРЕС ПОДАЧИ',
    tripGoalTitle: 'ЦЕЛЬ ПОЕЗДКИ · ИНТЕРЕСЫ (CRM)',
    tripGoalNotSet: 'Цель поездки не указана',
    insuranceLabel: 'СТРАХОВКА',
    insuranceNotIssued: 'Страховка не оформлена',
    adminCommentTitle: 'КОММЕНТАРИЙ АДМИНИСТРАТОРА',
    commentPlaceholder: 'Добавить комментарий…',
    send: 'Отправить',
    bookingLabel: 'БРОНЬ',
    rowPeriod: 'Период',
    rowPickupReturn: 'Подача / возврат',
    servicesLabel: 'УСЛУГИ',
    rowRent: 'Аренда',
    rowServices: 'Услуги',
    rowInsurance: 'Страховка',
    rowTotal: 'Итого',
    rowPrepay: 'Предоплата',
    paidSuffix: (m) => `${m} оплачено`,
    rowBalance: 'Остаток',
    rowDeposit: 'Залог',
    statusHistoryTitle: 'ИСТОРИЯ СТАТУСОВ',
    btnVerify: 'Проверить',
    btnReject: 'Отклонить',
    confirmDeleteCar: (name) => `Удалить «${name}»? Это действие нельзя отменить.`,
    errDeleteFailed: 'Не удалось удалить',
    savedCarAdded: (label) => `✓ ${label} — автомобиль добавлен`,
    savedCarUpdated: (label) => `✓ ${label} — изменения сохранены`,
    errCheckFields: 'Проверьте выделенные поля ниже',
    errSaveFailed: 'Не удалось сохранить',
    carFallback: 'Автомобиль',
    searchCarPlaceholder: 'Поиск по марке или модели…',
    filterAll: (n) => `Все · ${n}`,
    filterActive: (n) => `Активные · ${n}`,
    filterHidden: (n) => `Скрытые · ${n}`,
    btnAddCar: '+ Добавить автомобиль',
    colPhoto: 'ФОТО',
    colClass: 'КЛАСС',
    colPricePerDay: 'ЦЕНА/СУТ',
    colDeposit: 'ЗАЛОГ',
    colActions: 'ДЕЙСТВИЯ',
    emptyCarsNone: 'Пока нет автомобилей — добавьте первый.',
    emptyFilter: 'Ничего не найдено по фильтру.',
    seatsUnit: 'мест',
    statusActiveM: 'Активен',
    statusHiddenM: 'Скрыт',
    titleEdit: 'Редактировать',
    actionDelete: 'Удалить',
    btnEditShort: 'Ред.',
    carFormNew: 'Новый автомобиль',
    requiredFieldsPre: 'Поля со ',
    requiredFieldsPost: ' обязательны',
    cancel: 'Отмена',
    saving: 'Сохранение…',
    carFormAdd: 'Добавить автомобиль',
    carFormSave: 'Сохранить автомобиль',
    scBasics: 'ОСНОВНОЕ',
    scSpecs: 'ХАРАКТЕРИСТИКИ',
    scPricing: 'ЦЕНА И ЗАЛОГ',
    scPricingHint: 'в EUR — базовая валюта',
    scConditions: 'УСЛОВИЯ И СТАТУС',
    scPhotos: 'ФОТО',
    fBrand: 'Марка',
    fModel: 'Модель',
    fYear: 'Год',
    fClass: 'Класс',
    fGearbox: 'Коробка передач',
    fFuel: 'Тип топлива',
    fSeats: 'Мест',
    fDoors: 'Дверей',
    fAircon: 'Кондиционер',
    yes: 'Есть',
    no: 'Нет',
    fPricePerDay: 'Цена за сутки, €',
    fDeposit: 'Залог, €',
    fMileage: 'Лимит пробега, км/сут',
    mileagePlaceholder: 'пусто = без лимита',
    fMinRental: 'Мин. срок аренды, сут',
    fPrepHours: 'Подготовка между арендами, ч',
    fShowToClients: 'Показывать клиентам',
    conditionsNote: 'Текстовые условия аренды для клиента (возраст, страховка и т. д.) редактируются отдельно — этот блок появится позже.',
    photosSaveFirst: 'Сначала сохраните автомобиль — затем здесь появится загрузка фотографий.',
    cvApproved: '🟢 подтверждён',
    cvPending: '🟡 на проверке',
    cvRejected: '🔴 отклонён',
    cvResubmission: '🟠 повторно',
    cvNone: '⚪ не проверен',
    clientsSummary: (n, m) => `${n} клиентов · ${m} с повторными бронированиями`,
    colContacts: 'КОНТАКТЫ',
    colCitizenship: 'ГРАЖДАНСТВО',
    colBookings: 'БРОНЕЙ',
    colDocuments: 'ДОКУМЕНТЫ',
    colEmail: 'EMAIL',
    noClients: 'Клиентов пока нет',
    docFull: '✓ полный',
    docNoLicense: '⚠ нет ВУ',
    docIncomplete: '⚠ неполный',
    bookingsPrefix: 'Броней: ',
    idDocsLabel: 'ДОКУМЕНТЫ ЛИЧНОСТИ',
    docsNotUploadedYet: 'Документы ещё не загружены',
    kpiIncome: 'ДОХОД (ОПЛАЧЕНО)',
    kpiAwaiting: 'ОЖИДАЕТ ОПЛАТЫ',
    kpiDeposits: 'ЗАЛОГИ УДЕРЖАНЫ',
    kpiAvg: 'СРЕДНИЙ ЧЕК',
    errBookingAmount: 'Укажите бронь и сумму',
    errRecordFailed: 'Не удалось записать платёж',
    btnRecordPayment: '+ Записать платёж',
    newPaymentTitle: 'НОВЫЙ ПЛАТЁЖ',
    fBooking: 'БРОНЬ',
    fMethod: 'СПОСОБ',
    fType: 'ТИП',
    fAmount: 'СУММА',
    fCurrency: 'ВАЛЮТА',
    fStatus: 'СТАТУС',
    fTxHash: 'TX HASH (необязательно)',
    btnRecord: 'Записать',
    colNo: '№',
    colDate: 'ДАТА',
    noPaymentsYet: 'Платежей пока нет',
    confirmDeleteService: (name) => `Удалить услугу «${name}»? Это действие нельзя отменить.`,
    savedServiceAdded: (label) => `✓ ${label} — услуга добавлена`,
    savedServiceUpdated: (label) => `✓ ${label} — изменения сохранены`,
    serviceFallback: 'Услуга',
    searchServicePlaceholder: 'Поиск по названию или категории…',
    btnAddService: '+ Добавить услугу',
    reorderHint: 'Сбросьте поиск и фильтр, чтобы менять порядок услуг стрелками ↑↓',
    emptyServicesNone: 'Пока нет услуг — добавьте первую.',
    free: 'Бесплатно',
    arrowUp: 'Выше',
    arrowDown: 'Ниже',
    colOrder: 'ПОРЯДОК',
    colService: 'УСЛУГА',
    colCategory: 'КАТЕГОРИЯ',
    colPrice: 'ЦЕНА',
    colUnit: 'ЕД.',
    colActive: 'АКТ.',
    serviceFormNew: 'Новая услуга',
    serviceFormAdd: 'Добавить услугу',
    serviceFormSave: 'Сохранить услугу',
    scName: 'НАЗВАНИЕ',
    scNameHint: 'показывается клиенту в бронировании',
    scPriceHint: 'в EUR — базовая валюта · 0 = бесплатно',
    scDesc: 'ОПИСАНИЕ',
    scDescHint: 'необязательно',
    scRecommend: 'РЕКОМЕНДАЦИИ',
    scRecommendHint: 'для каких целей поездки предлагать (умный подбор)',
    fNameRu: 'Название (RU)',
    fNameEn: 'Название (EN)',
    phNameRu: 'Детское кресло',
    fCategory: 'Категория',
    fPrice: 'Цена, €',
    fUnit: 'Единица расчёта',
    statusActiveF: 'Активна',
    statusHiddenF: 'Скрыта',
    fDescRu: 'Описание (RU)',
    fDescEn: 'Описание (EN)',
    phDescRu: 'Короткое описание услуги для клиента',
    providerNoKey: 'Работает без ключа',
    providerKeySaved: 'Ключ сохранён',
    providerNeedKey: 'Нужен API-ключ',
    mapCardTitle: 'Карты · провайдер',
    mapCardDesc: 'Все карты приложения рендерятся через выбранного провайдера. OSM работает всегда; Google и Yandex активируются после добавления зашифрованного ключа (иначе используется OSM).',
    googleApiKey: 'Google API-ключ',
    yandexApiKey: 'Yandex API-ключ',
    phKeySaved: '•••••••• (сохранён)',
    phEnterKey: 'Вставьте ключ',
    saveBtn: 'Сохранить',
    baseEur: 'База: EUR',
    currenciesTitle: 'Валюты и курсы',
    oneEur: '1 EUR =',
    ratesHint: 'Измените курс и нажмите Enter или уберите фокус — сохраняется автоматически.',
    companyTitle: 'Реквизиты компании',
    sslNote: 'SSL-сертификат активен · документы хранятся в зашифрованном виде',
    backupTitle: 'Резервное копирование',
    autoBackup: 'Автобэкап ежедневно, 03:00',
    lastBackup: 'ПОСЛЕДНИЙ БЭКАП',
    lastBackupValue: 'Сегодня, 03:00 · база + документы',
    downloadBackup: 'Скачать бэкап',
    restore: 'Восстановить',
  },
  en: {
    paymentStatus: { NOT_PAID: 'Not paid', AWAITING: 'Awaiting', PARTIAL: 'Partial', PAID: 'Paid', DEPOSIT_HELD: 'Deposit held', DEPOSIT_RETURNED: 'Deposit returned', ERROR: 'Error', CANCELLED: 'Cancelled' },
    paymentMethod: { CARD_STRIPE: 'Card (Stripe)', CARD_PAYPAL: 'PayPal', BANK_TRANSFER: 'IBAN transfer', CRYPTO: 'Cryptocurrency', CASH: 'Cash', MANUAL: 'Manual' },
    paymentKind: { RENT: 'Rental', DEPOSIT: 'Deposit', PREPAY: 'Prepayment', BALANCE: 'Balance', FULL: 'Full' },
    carClass: { ECONOMY: 'Economy', COMFORT: 'Comfort', BUSINESS: 'Business', PREMIUM: 'Premium', SUV: 'Premium SUV', MINIVAN: 'Minivan VIP' },
    gearbox: { AUTOMATIC: 'Automatic', MANUAL: 'Manual' },
    fuel: { PETROL: 'Petrol', DIESEL: 'Diesel', HYBRID: 'Hybrid', ELECTRIC: 'Electric' },
    serviceCat: { RENTAL: 'Car', TRANSFER: 'Transfer', REAL_ESTATE: 'Real estate', TOURS: 'Leisure', INSURANCE: 'Insurance', CONCIERGE: 'Concierge', CONNECTIVITY: 'Connectivity', OTHER: 'Other' },
    serviceUnit: { flat: '', per_day: '/ day', per_trip: '/ trip' },
    docType: { PASSPORT: 'Passport', SELFIE: 'Selfie with document', LICENSE_FRONT: 'Licence front', LICENSE_BACK: 'Licence back', PAYMENT_PROOF: 'Payment receipt', CONTRACT: 'Contract', OTHER: 'Document' },
    docStatus: { UPLOADED: 'Uploaded', UNDER_REVIEW: 'Under review', VERIFIED: 'Verified', REJECTED: 'Rejected' },
    tripGoal: { LEISURE: 'Leisure', BUSINESS: 'Business', PROPERTY_PURCHASE: 'Property purchase', PROPERTY_VIEWING: 'Property viewing', MEDICAL: 'Medical', RELOCATION: 'Relocation', LONG_STAY: 'Long-term rental', VISITING: 'Visiting', OTHER: 'Other' },
    insuranceType: { BASIC: 'Basic insurance', EXTENDED: 'Extended insurance', FULL_NO_FRANCHISE: 'Full insurance, no excess' },
    insuranceOpt: { ISSUED: 'Issued', PENDING: 'Pending', CLIENT_DATA_INCOMPLETE: 'Data incomplete', NEEDS_EXTRA_CHECK: 'Extra check' },
    serviceUnitOpt: { flat: 'One-time', per_day: 'Per day', per_trip: 'Per trip' },
    carFieldMsg: { brand: 'Enter the make — e.g. BMW', model: 'Enter the model — e.g. 520i', year: 'Model year between 1990 and 2100', class: 'Select the car class', seats: 'Seats between 1 and 20', doors: 'Doors between 2 and 6', pricePerDay: 'Price per day — a number of at least 0', deposit: 'Deposit — a number of at least 0', mileageLimitPerDay: 'Mileage limit — a whole number (blank = no limit)', minRentalDays: 'Minimum period — 1 to 60 days', prepHoursBetween: 'Prep time — 0 to 168 hours' },
    serviceFieldMsg: { nameRu: 'Enter the name in Russian', nameEn: 'Enter the name in English', price: 'Price — a number of at least 0 (0 = free)', category: 'Select a category', unit: 'Select a billing unit' },
    companyField: { company_name: 'Company name', company_legal: 'Legal entity', company_phone: 'Phone', company_email: 'Email', company_address: 'Address', bank_iban: 'IBAN', bank_swift: 'SWIFT' },
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    titles: {
      dashboard: ['Dashboard', 'Business overview'],
      bookings: ['Bookings', 'All customer requests'],
      board: ['Order board', 'Kanban by rental stage'],
      cars: ['Cars', 'Fleet management'],
      calendar: ['Calendar', 'Fleet availability'],
      clients: ['Clients', 'Client base and history'],
      verifications: ['Verifications', 'Identity verification queue'],
      payments: ['Payments', 'Payments, deposits and balances'],
      finance: ['Finance', 'Money tracking — income, expenses, profit'],
      services: ['Services', 'Add-on services catalogue'],
      notifications: ['Notifications', 'System events'],
      settings: ['Settings', 'Parameters and access'],
      team: ['Team', 'Admins & recovery'],
    },
    orderTitle: (n) => `Order ${n}`,
    open: 'Open →',
    linkAuthTitle: 'Social login · Google · Yandex · Telegram',
    linkAuthDesc: 'OAuth keys, secrets are encrypted, enable/disable login buttons',
    linkPaymentsTitle: 'Payments and currencies · deposit · crypto · bank',
    linkPaymentsDesc: 'Prepayment percentage, enabling payment methods, crypto wallets, bank details, exchange rates',
    linkProvidersTitle: 'Payment providers · Stripe · PayPal · PayTR · iyzico',
    linkProvidersDesc: 'Acquiring: processor keys (secrets encrypted), on/off per provider, statuses. Only enabled ones appear at checkout',
    linkLocationsTitle: 'Cities and offices · service zones · map',
    linkLocationsDesc: 'City list (on/off, order), address and coordinates of the pickup office on the map',
    linkInsuranceTitle: 'Insurance — what is covered · plan coverage',
    linkInsuranceDesc: 'Coverage terms for Basic / Extended / Full (excess, theft, damage, glass, assistance) — editable, stored in the DB',
    linkSumsubTitle: 'Identity verification (Sumsub) · KYC',
    linkSumsubDesc: 'Sumsub keys (encrypted), verification level, webhook. Passport/ID + licence + liveness on the “Details” step',
    chipAll: (n) => `All · ${n}`,
    chipNew: (n) => `New · ${n}`,
    chipActive: (n) => `Active · ${n}`,
    chipPending: (n) => `Awaiting payment · ${n}`,
    passiveCar: 'Car ▾',
    passivePeriod: 'Period ▾',
    passiveExport: 'Export',
    colOrderNo: 'ORDER №',
    colClient: 'CLIENT',
    colCar: 'CAR',
    colPeriod: 'PERIOD',
    colStatus: 'STATUS',
    colAmount: 'AMOUNT',
    colPayment: 'PAYMENT',
    noBookings: 'No bookings found',
    openRow: 'Open ›',
    payPaid: 'Paid',
    payPartial: 'Partial',
    payUnpaid: 'Not paid',
    payTitle: 'PAYMENTS FOR THIS ORDER',
    awaitingConfirm: (n) => `${n} awaiting confirmation`,
    creditToAccount: 'Credit to account:',
    noPayments: 'No payments for this order yet.',
    receipt: 'Receipt',
    btnConfirmPayment: 'Confirm payment',
    btnDepositReceived: 'Deposit received',
    changePaymentStatus: 'Change payment status',
    msgSaved: 'Saved',
    msgError: 'Error',
    msgInsuranceUpdated: 'Insurance status updated',
    msgCommentAdded: 'Comment added',
    msgStatusUpdated: 'Status updated',
    promptRejectReason: 'Reason for rejection (optional):',
    msgDocApproved: 'Document verified',
    msgDocRejected: 'Document rejected',
    confirmPurgeDocs: 'Delete this client’s verified identity documents from encrypted storage? This action is irreversible.',
    msgDocsPurged: 'Documents deleted',
    msgPaymentStatusUpdated: 'Payment status updated',
    verifApproved: '🟢 Verified',
    verifPending: '🟡 Under review',
    verifRejected: '🔴 Rejected',
    verifResubmission: '🟠 Resubmission required',
    verifNone: '⚪ Not verified',
    fieldVerification: 'IDENTITY VERIFICATION (SUMSUB)',
    fieldEmail: 'EMAIL',
    fieldPhone: 'PHONE',
    fieldWhatsapp: 'WHATSAPP / TG',
    fieldPassport: 'PASSPORT / ID',
    fieldLicense: 'DRIVING LICENCE',
    fieldLicensePeriod: 'LICENCE VALIDITY',
    fieldPassportExpiry: 'PASSPORT/ID EXPIRY',
    fieldAddress: 'ADDRESS',
    airportAntalya: 'Antalya Airport (AYT)',
    pickupAddressDefault: 'Pickup address',
    backToList: '← Back to bookings',
    kfClient: 'CLIENT',
    kfCar: 'CAR',
    kfRentalPeriod: 'RENTAL PERIOD',
    kfPayment: 'PAYMENT',
    daysUnit: 'days',
    balanceDeposit: (bal, dep) => `Balance ${bal} · deposit ${dep}`,
    collapseDocsTitle: 'DOCUMENTS AND IDENTITY VERIFICATION',
    filesCount: (n) => `${n} files`,
    docsNotUploaded: 'No documents uploaded',
    sumsubDocsTitle: 'IDENTITY DOCUMENTS (SUMSUB)',
    btnDeleteStorage: 'Delete (storage)',
    perDocDecisionTitle: 'IDENTITY VERIFICATION — PER-DOCUMENT DECISION',
    pickupAddressLabel: 'PICKUP ADDRESS',
    tripGoalTitle: 'TRIP PURPOSE · INTERESTS (CRM)',
    tripGoalNotSet: 'Trip purpose not specified',
    insuranceLabel: 'INSURANCE',
    insuranceNotIssued: 'No insurance issued',
    adminCommentTitle: 'ADMINISTRATOR COMMENT',
    commentPlaceholder: 'Add a comment…',
    send: 'Send',
    bookingLabel: 'BOOKING',
    rowPeriod: 'Period',
    rowPickupReturn: 'Pickup / return',
    servicesLabel: 'SERVICES',
    rowRent: 'Rental',
    rowServices: 'Services',
    rowInsurance: 'Insurance',
    rowTotal: 'Total',
    rowPrepay: 'Prepayment',
    paidSuffix: (m) => `${m} paid`,
    rowBalance: 'Balance',
    rowDeposit: 'Deposit',
    statusHistoryTitle: 'STATUS HISTORY',
    btnVerify: 'Verify',
    btnReject: 'Reject',
    confirmDeleteCar: (name) => `Delete “${name}”? This action cannot be undone.`,
    errDeleteFailed: 'Failed to delete',
    savedCarAdded: (label) => `✓ ${label} — car added`,
    savedCarUpdated: (label) => `✓ ${label} — changes saved`,
    errCheckFields: 'Check the highlighted fields below',
    errSaveFailed: 'Failed to save',
    carFallback: 'Car',
    searchCarPlaceholder: 'Search by make or model…',
    filterAll: (n) => `All · ${n}`,
    filterActive: (n) => `Active · ${n}`,
    filterHidden: (n) => `Hidden · ${n}`,
    btnAddCar: '+ Add car',
    colPhoto: 'PHOTO',
    colClass: 'CLASS',
    colPricePerDay: 'PRICE/DAY',
    colDeposit: 'DEPOSIT',
    colActions: 'ACTIONS',
    emptyCarsNone: 'No cars yet — add the first one.',
    emptyFilter: 'Nothing matches the filter.',
    seatsUnit: 'seats',
    statusActiveM: 'Active',
    statusHiddenM: 'Hidden',
    titleEdit: 'Edit',
    actionDelete: 'Delete',
    btnEditShort: 'Edit',
    carFormNew: 'New car',
    requiredFieldsPre: 'Fields marked ',
    requiredFieldsPost: ' are required',
    cancel: 'Cancel',
    saving: 'Saving…',
    carFormAdd: 'Add car',
    carFormSave: 'Save car',
    scBasics: 'BASICS',
    scSpecs: 'SPECIFICATIONS',
    scPricing: 'PRICE AND DEPOSIT',
    scPricingHint: 'in EUR — base currency',
    scConditions: 'CONDITIONS AND STATUS',
    scPhotos: 'PHOTOS',
    fBrand: 'Make',
    fModel: 'Model',
    fYear: 'Year',
    fClass: 'Class',
    fGearbox: 'Gearbox',
    fFuel: 'Fuel type',
    fSeats: 'Seats',
    fDoors: 'Doors',
    fAircon: 'Air conditioning',
    yes: 'Yes',
    no: 'No',
    fPricePerDay: 'Price per day, €',
    fDeposit: 'Deposit, €',
    fMileage: 'Mileage limit, km/day',
    mileagePlaceholder: 'blank = no limit',
    fMinRental: 'Min. rental period, days',
    fPrepHours: 'Prep between rentals, h',
    fShowToClients: 'Show to clients',
    conditionsNote: 'Text rental terms for the client (age, insurance, etc.) are edited separately — this block will appear later.',
    photosSaveFirst: 'Save the car first — photo upload will then appear here.',
    cvApproved: '🟢 verified',
    cvPending: '🟡 under review',
    cvRejected: '🔴 rejected',
    cvResubmission: '🟠 resubmission',
    cvNone: '⚪ not verified',
    clientsSummary: (n, m) => `${n} clients · ${m} with repeat bookings`,
    colContacts: 'CONTACTS',
    colCitizenship: 'CITIZENSHIP',
    colBookings: 'BOOKINGS',
    colDocuments: 'DOCUMENTS',
    colEmail: 'EMAIL',
    noClients: 'No clients yet',
    docFull: '✓ complete',
    docNoLicense: '⚠ no licence',
    docIncomplete: '⚠ incomplete',
    bookingsPrefix: 'Bookings: ',
    idDocsLabel: 'IDENTITY DOCUMENTS',
    docsNotUploadedYet: 'No documents uploaded yet',
    kpiIncome: 'INCOME (PAID)',
    kpiAwaiting: 'AWAITING PAYMENT',
    kpiDeposits: 'DEPOSITS HELD',
    kpiAvg: 'AVERAGE CHECK',
    errBookingAmount: 'Specify a booking and an amount',
    errRecordFailed: 'Failed to record the payment',
    btnRecordPayment: '+ Record payment',
    newPaymentTitle: 'NEW PAYMENT',
    fBooking: 'BOOKING',
    fMethod: 'METHOD',
    fType: 'TYPE',
    fAmount: 'AMOUNT',
    fCurrency: 'CURRENCY',
    fStatus: 'STATUS',
    fTxHash: 'TX HASH (optional)',
    btnRecord: 'Record',
    colNo: '№',
    colDate: 'DATE',
    noPaymentsYet: 'No payments yet',
    confirmDeleteService: (name) => `Delete the service “${name}”? This action cannot be undone.`,
    savedServiceAdded: (label) => `✓ ${label} — service added`,
    savedServiceUpdated: (label) => `✓ ${label} — changes saved`,
    serviceFallback: 'Service',
    searchServicePlaceholder: 'Search by name or category…',
    btnAddService: '+ Add service',
    reorderHint: 'Clear the search and filter to reorder services with the ↑↓ arrows',
    emptyServicesNone: 'No services yet — add the first one.',
    free: 'Free',
    arrowUp: 'Up',
    arrowDown: 'Down',
    colOrder: 'ORDER',
    colService: 'SERVICE',
    colCategory: 'CATEGORY',
    colPrice: 'PRICE',
    colUnit: 'UNIT',
    colActive: 'ACT.',
    serviceFormNew: 'New service',
    serviceFormAdd: 'Add service',
    serviceFormSave: 'Save service',
    scName: 'NAME',
    scNameHint: 'shown to the client at booking',
    scPriceHint: 'in EUR — base currency · 0 = free',
    scDesc: 'DESCRIPTION',
    scDescHint: 'optional',
    scRecommend: 'RECOMMENDATIONS',
    scRecommendHint: 'which trip purposes to suggest it for (smart matching)',
    fNameRu: 'Name (RU)',
    fNameEn: 'Name (EN)',
    phNameRu: 'Child seat',
    fCategory: 'Category',
    fPrice: 'Price, €',
    fUnit: 'Billing unit',
    statusActiveF: 'Active',
    statusHiddenF: 'Hidden',
    fDescRu: 'Description (RU)',
    fDescEn: 'Description (EN)',
    phDescRu: 'Short description of the service for the client',
    providerNoKey: 'Works without a key',
    providerKeySaved: 'Key saved',
    providerNeedKey: 'API key required',
    mapCardTitle: 'Maps · provider',
    mapCardDesc: 'All app maps render through the selected provider. OSM always works; Google and Yandex activate once an encrypted key is added (otherwise OSM is used).',
    googleApiKey: 'Google API key',
    yandexApiKey: 'Yandex API key',
    phKeySaved: '•••••••• (saved)',
    phEnterKey: 'Paste the key',
    saveBtn: 'Save',
    baseEur: 'Base: EUR',
    currenciesTitle: 'Currencies and rates',
    oneEur: '1 EUR =',
    ratesHint: 'Change a rate and press Enter or blur the field — it saves automatically.',
    companyTitle: 'Company details',
    sslNote: 'SSL certificate active · documents stored encrypted',
    backupTitle: 'Backup',
    autoBackup: 'Auto-backup daily, 03:00',
    lastBackup: 'LAST BACKUP',
    lastBackupValue: 'Today, 03:00 · database + documents',
    downloadBackup: 'Download backup',
    restore: 'Restore',
  },
  tr: {
    paymentStatus: { NOT_PAID: 'Ödenmedi', AWAITING: 'Bekliyor', PARTIAL: 'Kısmi', PAID: 'Ödendi', DEPOSIT_HELD: 'Depozito alındı', DEPOSIT_RETURNED: 'Depozito iade edildi', ERROR: 'Hata', CANCELLED: 'İptal edildi' },
    paymentMethod: { CARD_STRIPE: 'Kart (Stripe)', CARD_PAYPAL: 'PayPal', BANK_TRANSFER: 'IBAN havale', CRYPTO: 'Kripto para', CASH: 'Nakit', MANUAL: 'Manuel' },
    paymentKind: { RENT: 'Kiralama', DEPOSIT: 'Depozito', PREPAY: 'Ön ödeme', BALANCE: 'Bakiye', FULL: 'Tam' },
    carClass: { ECONOMY: 'Ekonomi', COMFORT: 'Konfor', BUSINESS: 'Business', PREMIUM: 'Premium', SUV: 'Premium SUV', MINIVAN: 'Minivan VIP' },
    gearbox: { AUTOMATIC: 'Otomatik', MANUAL: 'Manuel' },
    fuel: { PETROL: 'Benzin', DIESEL: 'Dizel', HYBRID: 'Hibrit', ELECTRIC: 'Elektrik' },
    serviceCat: { RENTAL: 'Araç', TRANSFER: 'Transfer', REAL_ESTATE: 'Emlak', TOURS: 'Eğlence', INSURANCE: 'Sigorta', CONCIERGE: 'Hizmet', CONNECTIVITY: 'Bağlantı', OTHER: 'Diğer' },
    serviceUnit: { flat: '', per_day: '/ gün', per_trip: '/ yolculuk' },
    docType: { PASSPORT: 'Pasaport', SELFIE: 'Belgeli selfie', LICENSE_FRONT: 'Ehliyet ön', LICENSE_BACK: 'Ehliyet arka', PAYMENT_PROOF: 'Ödeme dekontu', CONTRACT: 'Sözleşme', OTHER: 'Belge' },
    docStatus: { UPLOADED: 'Yüklendi', UNDER_REVIEW: 'İncelemede', VERIFIED: 'Doğrulandı', REJECTED: 'Reddedildi' },
    tripGoal: { LEISURE: 'Tatil', BUSINESS: 'İş', PROPERTY_PURCHASE: 'Emlak alımı', PROPERTY_VIEWING: 'Emlak görüntüleme', MEDICAL: 'Tedavi', RELOCATION: 'Taşınma', LONG_STAY: 'Uzun dönem kiralama', VISITING: 'Ziyaret', OTHER: 'Diğer' },
    insuranceType: { BASIC: 'Temel sigorta', EXTENDED: 'Genişletilmiş sigorta', FULL_NO_FRANCHISE: 'Muafiyetsiz tam sigorta' },
    insuranceOpt: { ISSUED: 'Düzenlendi', PENDING: 'Bekliyor', CLIENT_DATA_INCOMPLETE: 'Veriler eksik', NEEDS_EXTRA_CHECK: 'Ek kontrol' },
    serviceUnitOpt: { flat: 'Tek seferlik', per_day: 'Günlük', per_trip: 'Yolculuk başına' },
    carFieldMsg: { brand: 'Markayı girin — örn. BMW', model: 'Modeli girin — örn. 520i', year: 'Model yılı 1990 ile 2100 arası', class: 'Araç sınıfını seçin', seats: 'Koltuk sayısı 1 ile 20 arası', doors: 'Kapı sayısı 2 ile 6 arası', pricePerDay: 'Günlük fiyat — en az 0 olan bir sayı', deposit: 'Depozito — en az 0 olan bir sayı', mileageLimitPerDay: 'Kilometre limiti — tam sayı (boş = limitsiz)', minRentalDays: 'Minimum süre — 1 ile 60 gün arası', prepHoursBetween: 'Hazırlık süresi — 0 ile 168 saat arası' },
    serviceFieldMsg: { nameRu: 'Adı Rusça girin', nameEn: 'Adı İngilizce girin (English)', price: 'Fiyat — en az 0 olan bir sayı (0 = ücretsiz)', category: 'Bir kategori seçin', unit: 'Bir ücretlendirme birimi seçin' },
    companyField: { company_name: 'Şirket adı', company_legal: 'Tüzel kişi', company_phone: 'Telefon', company_email: 'E-posta', company_address: 'Adres', bank_iban: 'IBAN', bank_swift: 'SWIFT' },
    months: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
    titles: {
      dashboard: ['Panel', 'İşletme özeti'],
      bookings: ['Rezervasyonlar', 'Tüm müşteri talepleri'],
      board: ['Sipariş panosu', 'Kiralama aşamasına göre Kanban'],
      cars: ['Araçlar', 'Filo yönetimi'],
      calendar: ['Takvim', 'Filo doluluğu'],
      clients: ['Müşteriler', 'Müşteri tabanı ve geçmiş'],
      verifications: ['Doğrulamalar', 'Kimlik doğrulama kuyruğu'],
      payments: ['Ödemeler', 'Ödemeler, depozitolar ve bakiyeler'],
      finance: ['Finans', 'Para takibi — gelir, gider, kâr'],
      services: ['Hizmetler', 'Ek hizmetler kataloğu'],
      notifications: ['Bildirimler', 'Sistem olayları'],
      settings: ['Ayarlar', 'Parametreler ve erişim'],
      team: ['Ekip', 'Yöneticiler ve kurtarma'],
    },
    orderTitle: (n) => `Sipariş ${n}`,
    open: 'Aç →',
    linkAuthTitle: 'Sosyal giriş · Google · Yandex · Telegram',
    linkAuthDesc: 'OAuth anahtarları, sırlar şifrelenir, giriş düğmelerini aç/kapat',
    linkPaymentsTitle: 'Ödemeler ve para birimleri · depozito · kripto · banka',
    linkPaymentsDesc: 'Ön ödeme yüzdesi, ödeme yöntemlerini etkinleştirme, kripto cüzdanları, banka bilgileri, döviz kurları',
    linkProvidersTitle: 'Ödeme sağlayıcıları · Stripe · PayPal · PayTR · iyzico',
    linkProvidersDesc: 'Tahsilat: işlemci anahtarları (sırlar şifrelenir), her biri için aç/kapat, durumlar. Ödemede yalnızca etkin olanlar gösterilir',
    linkLocationsTitle: 'Şehirler ve ofisler · hizmet bölgeleri · harita',
    linkLocationsDesc: 'Şehir listesi (aç/kapat, sıra), teslim ofisinin adresi ve harita koordinatları',
    linkInsuranceTitle: 'Sigorta — neler dahil · plan kapsamı',
    linkInsuranceDesc: 'Basic / Extended / Full kapsam koşulları (muafiyet, hırsızlık, hasar, cam, yardım) — düzenlenebilir, veritabanında saklanır',
    linkSumsubTitle: 'Kimlik doğrulama (Sumsub) · KYC',
    linkSumsubDesc: 'Sumsub anahtarları (şifrelenir), doğrulama düzeyi, webhook. Pasaport/kimlik + ehliyet + canlılık «Bilgiler» adımında',
    chipAll: (n) => `Tümü · ${n}`,
    chipNew: (n) => `Yeni · ${n}`,
    chipActive: (n) => `Aktif · ${n}`,
    chipPending: (n) => `Ödeme bekliyor · ${n}`,
    passiveCar: 'Araç ▾',
    passivePeriod: 'Dönem ▾',
    passiveExport: 'Dışa aktar',
    colOrderNo: 'SİPARİŞ №',
    colClient: 'MÜŞTERİ',
    colCar: 'ARAÇ',
    colPeriod: 'DÖNEM',
    colStatus: 'DURUM',
    colAmount: 'TUTAR',
    colPayment: 'ÖDEME',
    noBookings: 'Rezervasyon bulunamadı',
    openRow: 'Aç ›',
    payPaid: 'Ödendi',
    payPartial: 'Kısmi',
    payUnpaid: 'Ödenmedi',
    payTitle: 'BU SİPARİŞİN ÖDEMELERİ',
    awaitingConfirm: (n) => `${n} onay bekliyor`,
    creditToAccount: 'Hesaba geçir:',
    noPayments: 'Bu sipariş için henüz ödeme yok.',
    receipt: 'Dekont',
    btnConfirmPayment: 'Ödemeyi onayla',
    btnDepositReceived: 'Depozito alındı',
    changePaymentStatus: 'Ödeme durumunu değiştir',
    msgSaved: 'Kaydedildi',
    msgError: 'Hata',
    msgInsuranceUpdated: 'Sigorta durumu güncellendi',
    msgCommentAdded: 'Yorum eklendi',
    msgStatusUpdated: 'Durum güncellendi',
    promptRejectReason: 'Reddetme nedeni (isteğe bağlı):',
    msgDocApproved: 'Belge doğrulandı',
    msgDocRejected: 'Belge reddedildi',
    confirmPurgeDocs: 'Bu müşterinin doğrulanmış kimlik belgeleri şifreli depodan silinsin mi? Bu işlem geri alınamaz.',
    msgDocsPurged: 'Belgeler silindi',
    msgPaymentStatusUpdated: 'Ödeme durumu güncellendi',
    verifApproved: '🟢 Doğrulandı',
    verifPending: '🟡 İncelemede',
    verifRejected: '🔴 Reddedildi',
    verifResubmission: '🟠 Yeniden gönderim gerekli',
    verifNone: '⚪ Doğrulanmadı',
    fieldVerification: 'KİMLİK DOĞRULAMA (SUMSUB)',
    fieldEmail: 'E-POSTA',
    fieldPhone: 'TELEFON',
    fieldWhatsapp: 'WHATSAPP / TG',
    fieldPassport: 'PASAPORT / KİMLİK',
    fieldLicense: 'SÜRÜCÜ BELGESİ',
    fieldLicensePeriod: 'EHLİYET GEÇERLİLİĞİ',
    fieldPassportExpiry: 'PASAPORT/KİMLİK SON GEÇERLİLİK',
    fieldAddress: 'ADRES',
    airportAntalya: 'Antalya Havalimanı (AYT)',
    pickupAddressDefault: 'Teslim adresi',
    backToList: '← Rezervasyonlara dön',
    kfClient: 'MÜŞTERİ',
    kfCar: 'ARAÇ',
    kfRentalPeriod: 'KİRALAMA DÖNEMİ',
    kfPayment: 'ÖDEME',
    daysUnit: 'gün',
    balanceDeposit: (bal, dep) => `Bakiye ${bal} · depozito ${dep}`,
    collapseDocsTitle: 'BELGELER VE KİMLİK DOĞRULAMA',
    filesCount: (n) => `${n} dosya`,
    docsNotUploaded: 'Belge yüklenmedi',
    sumsubDocsTitle: 'KİMLİK BELGELERİ (SUMSUB)',
    btnDeleteStorage: 'Sil (depolama)',
    perDocDecisionTitle: 'KİMLİK DOĞRULAMA — BELGE BAZLI KARAR',
    pickupAddressLabel: 'TESLİM ADRESİ',
    tripGoalTitle: 'YOLCULUK AMACI · İLGİ ALANLARI (CRM)',
    tripGoalNotSet: 'Yolculuk amacı belirtilmedi',
    insuranceLabel: 'SİGORTA',
    insuranceNotIssued: 'Sigorta düzenlenmedi',
    adminCommentTitle: 'YÖNETİCİ YORUMU',
    commentPlaceholder: 'Yorum ekle…',
    send: 'Gönder',
    bookingLabel: 'REZERVASYON',
    rowPeriod: 'Dönem',
    rowPickupReturn: 'Teslim / iade',
    servicesLabel: 'HİZMETLER',
    rowRent: 'Kiralama',
    rowServices: 'Hizmetler',
    rowInsurance: 'Sigorta',
    rowTotal: 'Toplam',
    rowPrepay: 'Ön ödeme',
    paidSuffix: (m) => `${m} ödendi`,
    rowBalance: 'Bakiye',
    rowDeposit: 'Depozito',
    statusHistoryTitle: 'DURUM GEÇMİŞİ',
    btnVerify: 'Doğrula',
    btnReject: 'Reddet',
    confirmDeleteCar: (name) => `«${name}» silinsin mi? Bu işlem geri alınamaz.`,
    errDeleteFailed: 'Silinemedi',
    savedCarAdded: (label) => `✓ ${label} — araç eklendi`,
    savedCarUpdated: (label) => `✓ ${label} — değişiklikler kaydedildi`,
    errCheckFields: 'Aşağıda işaretli alanları kontrol edin',
    errSaveFailed: 'Kaydedilemedi',
    carFallback: 'Araç',
    searchCarPlaceholder: 'Marka veya modele göre ara…',
    filterAll: (n) => `Tümü · ${n}`,
    filterActive: (n) => `Aktif · ${n}`,
    filterHidden: (n) => `Gizli · ${n}`,
    btnAddCar: '+ Araç ekle',
    colPhoto: 'FOTO',
    colClass: 'SINIF',
    colPricePerDay: 'FİYAT/GÜN',
    colDeposit: 'DEPOZİTO',
    colActions: 'İŞLEMLER',
    emptyCarsNone: 'Henüz araç yok — ilkini ekleyin.',
    emptyFilter: 'Filtreye uyan bir şey yok.',
    seatsUnit: 'koltuk',
    statusActiveM: 'Aktif',
    statusHiddenM: 'Gizli',
    titleEdit: 'Düzenle',
    actionDelete: 'Sil',
    btnEditShort: 'Düzenle',
    carFormNew: 'Yeni araç',
    requiredFieldsPre: '',
    requiredFieldsPost: ' işaretli alanlar zorunludur',
    cancel: 'İptal',
    saving: 'Kaydediliyor…',
    carFormAdd: 'Araç ekle',
    carFormSave: 'Aracı kaydet',
    scBasics: 'TEMEL',
    scSpecs: 'ÖZELLİKLER',
    scPricing: 'FİYAT VE DEPOZİTO',
    scPricingHint: 'EUR olarak — temel para birimi',
    scConditions: 'KOŞULLAR VE DURUM',
    scPhotos: 'FOTOĞRAFLAR',
    fBrand: 'Marka',
    fModel: 'Model',
    fYear: 'Yıl',
    fClass: 'Sınıf',
    fGearbox: 'Vites kutusu',
    fFuel: 'Yakıt tipi',
    fSeats: 'Koltuk',
    fDoors: 'Kapı',
    fAircon: 'Klima',
    yes: 'Var',
    no: 'Yok',
    fPricePerDay: 'Günlük fiyat, €',
    fDeposit: 'Depozito, €',
    fMileage: 'Kilometre limiti, km/gün',
    mileagePlaceholder: 'boş = limitsiz',
    fMinRental: 'Min. kiralama süresi, gün',
    fPrepHours: 'Kiralamalar arası hazırlık, s',
    fShowToClients: 'Müşterilere göster',
    conditionsNote: 'Müşteri için metin kiralama koşulları (yaş, sigorta vb.) ayrı olarak düzenlenir — bu bölüm daha sonra eklenecek.',
    photosSaveFirst: 'Önce aracı kaydedin — ardından fotoğraf yükleme burada görünecek.',
    cvApproved: '🟢 doğrulandı',
    cvPending: '🟡 incelemede',
    cvRejected: '🔴 reddedildi',
    cvResubmission: '🟠 yeniden',
    cvNone: '⚪ doğrulanmadı',
    clientsSummary: (n, m) => `${n} müşteri · ${m} tekrar rezervasyonlu`,
    colContacts: 'İLETİŞİM',
    colCitizenship: 'UYRUK',
    colBookings: 'REZERVASYON',
    colDocuments: 'BELGELER',
    colEmail: 'E-POSTA',
    noClients: 'Henüz müşteri yok',
    docFull: '✓ eksiksiz',
    docNoLicense: '⚠ ehliyet yok',
    docIncomplete: '⚠ eksik',
    bookingsPrefix: 'Rezervasyon: ',
    idDocsLabel: 'KİMLİK BELGELERİ',
    docsNotUploadedYet: 'Belgeler henüz yüklenmedi',
    kpiIncome: 'GELİR (ÖDENDİ)',
    kpiAwaiting: 'ÖDEME BEKLİYOR',
    kpiDeposits: 'TUTULAN DEPOZİTOLAR',
    kpiAvg: 'ORTALAMA FİŞ',
    errBookingAmount: 'Bir rezervasyon ve tutar belirtin',
    errRecordFailed: 'Ödeme kaydedilemedi',
    btnRecordPayment: '+ Ödeme kaydet',
    newPaymentTitle: 'YENİ ÖDEME',
    fBooking: 'REZERVASYON',
    fMethod: 'YÖNTEM',
    fType: 'TİP',
    fAmount: 'TUTAR',
    fCurrency: 'PARA BİRİMİ',
    fStatus: 'DURUM',
    fTxHash: 'TX HASH (isteğe bağlı)',
    btnRecord: 'Kaydet',
    colNo: '№',
    colDate: 'TARİH',
    noPaymentsYet: 'Henüz ödeme yok',
    confirmDeleteService: (name) => `«${name}» hizmeti silinsin mi? Bu işlem geri alınamaz.`,
    savedServiceAdded: (label) => `✓ ${label} — hizmet eklendi`,
    savedServiceUpdated: (label) => `✓ ${label} — değişiklikler kaydedildi`,
    serviceFallback: 'Hizmet',
    searchServicePlaceholder: 'Ada veya kategoriye göre ara…',
    btnAddService: '+ Hizmet ekle',
    reorderHint: 'Hizmetleri ↑↓ oklarıyla sıralamak için aramayı ve filtreyi temizleyin',
    emptyServicesNone: 'Henüz hizmet yok — ilkini ekleyin.',
    free: 'Ücretsiz',
    arrowUp: 'Yukarı',
    arrowDown: 'Aşağı',
    colOrder: 'SIRA',
    colService: 'HİZMET',
    colCategory: 'KATEGORİ',
    colPrice: 'FİYAT',
    colUnit: 'BİRİM',
    colActive: 'AKT.',
    serviceFormNew: 'Yeni hizmet',
    serviceFormAdd: 'Hizmet ekle',
    serviceFormSave: 'Hizmeti kaydet',
    scName: 'AD',
    scNameHint: 'rezervasyonda müşteriye gösterilir',
    scPriceHint: 'EUR olarak — temel para birimi · 0 = ücretsiz',
    scDesc: 'AÇIKLAMA',
    scDescHint: 'isteğe bağlı',
    scRecommend: 'ÖNERİLER',
    scRecommendHint: 'hangi yolculuk amaçları için önerileceği (akıllı eşleştirme)',
    fNameRu: 'Ad (RU)',
    fNameEn: 'Ad (EN)',
    phNameRu: 'Çocuk koltuğu',
    fCategory: 'Kategori',
    fPrice: 'Fiyat, €',
    fUnit: 'Ücretlendirme birimi',
    statusActiveF: 'Aktif',
    statusHiddenF: 'Gizli',
    fDescRu: 'Açıklama (RU)',
    fDescEn: 'Açıklama (EN)',
    phDescRu: 'Müşteri için hizmetin kısa açıklaması',
    providerNoKey: 'Anahtarsız çalışır',
    providerKeySaved: 'Anahtar kaydedildi',
    providerNeedKey: 'API anahtarı gerekli',
    mapCardTitle: 'Haritalar · sağlayıcı',
    mapCardDesc: 'Tüm uygulama haritaları seçilen sağlayıcı üzerinden işlenir. OSM her zaman çalışır; Google ve Yandex, şifreli bir anahtar eklendikten sonra etkinleşir (aksi halde OSM kullanılır).',
    googleApiKey: 'Google API anahtarı',
    yandexApiKey: 'Yandex API anahtarı',
    phKeySaved: '•••••••• (kaydedildi)',
    phEnterKey: 'Anahtarı yapıştırın',
    saveBtn: 'Kaydet',
    baseEur: 'Temel: EUR',
    currenciesTitle: 'Para birimleri ve kurlar',
    oneEur: '1 EUR =',
    ratesHint: 'Kuru değiştirin ve Enter’a basın veya alandan çıkın — otomatik kaydedilir.',
    companyTitle: 'Şirket bilgileri',
    sslNote: 'SSL sertifikası aktif · belgeler şifreli saklanır',
    backupTitle: 'Yedekleme',
    autoBackup: 'Günlük otomatik yedek, 03:00',
    lastBackup: 'SON YEDEK',
    lastBackupValue: 'Bugün, 03:00 · veritabanı + belgeler',
    downloadBackup: 'Yedeği indir',
    restore: 'Geri yükle',
  },
  es: {
    paymentStatus: { NOT_PAID: 'No pagado', AWAITING: 'En espera', PARTIAL: 'Parcial', PAID: 'Pagado', DEPOSIT_HELD: 'Depósito retenido', DEPOSIT_RETURNED: 'Depósito devuelto', ERROR: 'Error', CANCELLED: 'Cancelado' },
    paymentMethod: { CARD_STRIPE: 'Tarjeta (Stripe)', CARD_PAYPAL: 'PayPal', BANK_TRANSFER: 'Transferencia IBAN', CRYPTO: 'Criptomoneda', CASH: 'Efectivo', MANUAL: 'Manual' },
    paymentKind: { RENT: 'Alquiler', DEPOSIT: 'Depósito', PREPAY: 'Prepago', BALANCE: 'Saldo', FULL: 'Completo' },
    carClass: { ECONOMY: 'Económico', COMFORT: 'Confort', BUSINESS: 'Business', PREMIUM: 'Premium', SUV: 'SUV Premium', MINIVAN: 'Minivan VIP' },
    gearbox: { AUTOMATIC: 'Automático', MANUAL: 'Manual' },
    fuel: { PETROL: 'Gasolina', DIESEL: 'Diésel', HYBRID: 'Híbrido', ELECTRIC: 'Eléctrico' },
    serviceCat: { RENTAL: 'Coche', TRANSFER: 'Traslado', REAL_ESTATE: 'Inmuebles', TOURS: 'Ocio', INSURANCE: 'Seguro', CONCIERGE: 'Servicio', CONNECTIVITY: 'Conectividad', OTHER: 'Otros' },
    serviceUnit: { flat: '', per_day: '/ día', per_trip: '/ viaje' },
    docType: { PASSPORT: 'Pasaporte', SELFIE: 'Selfie con documento', LICENSE_FRONT: 'Carné anverso', LICENSE_BACK: 'Carné reverso', PAYMENT_PROOF: 'Comprobante de pago', CONTRACT: 'Contrato', OTHER: 'Documento' },
    docStatus: { UPLOADED: 'Subido', UNDER_REVIEW: 'En revisión', VERIFIED: 'Verificado', REJECTED: 'Rechazado' },
    tripGoal: { LEISURE: 'Ocio', BUSINESS: 'Negocios', PROPERTY_PURCHASE: 'Compra de inmueble', PROPERTY_VIEWING: 'Visita de inmueble', MEDICAL: 'Tratamiento', RELOCATION: 'Mudanza', LONG_STAY: 'Alquiler de larga duración', VISITING: 'Visita', OTHER: 'Otro' },
    insuranceType: { BASIC: 'Seguro básico', EXTENDED: 'Seguro ampliado', FULL_NO_FRANCHISE: 'Seguro a todo riesgo sin franquicia' },
    insuranceOpt: { ISSUED: 'Emitido', PENDING: 'En espera', CLIENT_DATA_INCOMPLETE: 'Datos incompletos', NEEDS_EXTRA_CHECK: 'Revisión adicional' },
    serviceUnitOpt: { flat: 'Único', per_day: 'Por día', per_trip: 'Por viaje' },
    carFieldMsg: { brand: 'Indique la marca — p. ej. BMW', model: 'Indique el modelo — p. ej. 520i', year: 'Año entre 1990 y 2100', class: 'Seleccione la clase del coche', seats: 'Plazas entre 1 y 20', doors: 'Puertas entre 2 y 6', pricePerDay: 'Precio por día — un número no menor que 0', deposit: 'Depósito — un número no menor que 0', mileageLimitPerDay: 'Límite de kilometraje — número entero (vacío = sin límite)', minRentalDays: 'Periodo mínimo — de 1 a 60 días', prepHoursBetween: 'Tiempo de preparación — de 0 a 168 horas' },
    serviceFieldMsg: { nameRu: 'Indique el nombre en ruso', nameEn: 'Indique el nombre en inglés (English)', price: 'Precio — un número no menor que 0 (0 = gratis)', category: 'Seleccione una categoría', unit: 'Seleccione una unidad de cobro' },
    companyField: { company_name: 'Nombre de la empresa', company_legal: 'Entidad legal', company_phone: 'Teléfono', company_email: 'Email', company_address: 'Dirección', bank_iban: 'IBAN', bank_swift: 'SWIFT' },
    months: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
    titles: {
      dashboard: ['Panel', 'Resumen del negocio'],
      bookings: ['Reservas', 'Todas las solicitudes de clientes'],
      board: ['Tablero de pedidos', 'Kanban por etapa de alquiler'],
      cars: ['Coches', 'Gestión de la flota'],
      calendar: ['Calendario', 'Disponibilidad de la flota'],
      clients: ['Clientes', 'Base de clientes e historial'],
      verifications: ['Verificaciones', 'Cola de verificación de identidad'],
      payments: ['Pagos', 'Pagos, depósitos y saldos'],
      finance: ['Finanzas', 'Control del dinero — ingresos, gastos, beneficio'],
      services: ['Servicios', 'Catálogo de servicios adicionales'],
      notifications: ['Notificaciones', 'Eventos del sistema'],
      settings: ['Ajustes', 'Parámetros y accesos'],
      team: ['Equipo', 'Admins y recuperación'],
    },
    orderTitle: (n) => `Pedido ${n}`,
    open: 'Abrir →',
    linkAuthTitle: 'Inicio con redes sociales · Google · Yandex · Telegram',
    linkAuthDesc: 'Claves OAuth, los secretos se cifran, activar/desactivar botones de inicio',
    linkPaymentsTitle: 'Pagos y monedas · depósito · cripto · banco',
    linkPaymentsDesc: 'Porcentaje de prepago, activación de métodos de pago, carteras cripto, datos bancarios, tipos de cambio',
    linkProvidersTitle: 'Proveedores de pago · Stripe · PayPal · PayTR · iyzico',
    linkProvidersDesc: 'Adquirencia: claves de procesadores (secretos cifrados), activar/desactivar cada uno, estados. En el pago solo aparecen los activados',
    linkLocationsTitle: 'Ciudades y oficinas · zonas de servicio · mapa',
    linkLocationsDesc: 'Lista de ciudades (activar/desactivar, orden), dirección y coordenadas de la oficina de entrega en el mapa',
    linkInsuranceTitle: 'Seguro — qué incluye · cobertura de las tarifas',
    linkInsuranceDesc: 'Condiciones de cobertura Basic / Extended / Full (franquicia, robo, daños, cristales, asistencia) — editables, guardadas en la BD',
    linkSumsubTitle: 'Verificación de identidad (Sumsub) · KYC',
    linkSumsubDesc: 'Claves Sumsub (cifradas), nivel de verificación, webhook. Pasaporte/ID + carné + liveness en el paso «Datos»',
    chipAll: (n) => `Todas · ${n}`,
    chipNew: (n) => `Nuevas · ${n}`,
    chipActive: (n) => `Activas · ${n}`,
    chipPending: (n) => `En espera de pago · ${n}`,
    passiveCar: 'Coche ▾',
    passivePeriod: 'Periodo ▾',
    passiveExport: 'Exportar',
    colOrderNo: 'PEDIDO Nº',
    colClient: 'CLIENTE',
    colCar: 'COCHE',
    colPeriod: 'PERIODO',
    colStatus: 'ESTADO',
    colAmount: 'IMPORTE',
    colPayment: 'PAGO',
    noBookings: 'No se encontraron reservas',
    openRow: 'Abrir ›',
    payPaid: 'Pagado',
    payPartial: 'Parcial',
    payUnpaid: 'No pagado',
    payTitle: 'PAGOS DEL PEDIDO',
    awaitingConfirm: (n) => `${n} en espera de confirmación`,
    creditToAccount: 'Ingresar en la cuenta:',
    noPayments: 'Aún no hay pagos para este pedido.',
    receipt: 'Comprobante',
    btnConfirmPayment: 'Confirmar pago',
    btnDepositReceived: 'Depósito recibido',
    changePaymentStatus: 'Cambiar el estado del pago',
    msgSaved: 'Guardado',
    msgError: 'Error',
    msgInsuranceUpdated: 'Estado del seguro actualizado',
    msgCommentAdded: 'Comentario añadido',
    msgStatusUpdated: 'Estado actualizado',
    promptRejectReason: 'Motivo del rechazo (opcional):',
    msgDocApproved: 'Documento verificado',
    msgDocRejected: 'Documento rechazado',
    confirmPurgeDocs: '¿Eliminar los documentos de identidad verificados de este cliente del almacenamiento cifrado? Esta acción es irreversible.',
    msgDocsPurged: 'Documentos eliminados',
    msgPaymentStatusUpdated: 'Estado del pago actualizado',
    verifApproved: '🟢 Verificado',
    verifPending: '🟡 En revisión',
    verifRejected: '🔴 Rechazado',
    verifResubmission: '🟠 Reenvío requerido',
    verifNone: '⚪ Sin verificar',
    fieldVerification: 'VERIFICACIÓN DE IDENTIDAD (SUMSUB)',
    fieldEmail: 'EMAIL',
    fieldPhone: 'TELÉFONO',
    fieldWhatsapp: 'WHATSAPP / TG',
    fieldPassport: 'PASAPORTE / ID',
    fieldLicense: 'PERMISO DE CONDUCIR',
    fieldLicensePeriod: 'VIGENCIA DEL PERMISO',
    fieldPassportExpiry: 'CADUCIDAD PASAPORTE/ID',
    fieldAddress: 'DIRECCIÓN',
    airportAntalya: 'Aeropuerto de Antalya (AYT)',
    pickupAddressDefault: 'Dirección de entrega',
    backToList: '← Volver a las reservas',
    kfClient: 'CLIENTE',
    kfCar: 'COCHE',
    kfRentalPeriod: 'PERIODO DE ALQUILER',
    kfPayment: 'PAGO',
    daysUnit: 'días',
    balanceDeposit: (bal, dep) => `Saldo ${bal} · depósito ${dep}`,
    collapseDocsTitle: 'DOCUMENTOS Y VERIFICACIÓN DE IDENTIDAD',
    filesCount: (n) => `${n} archivos`,
    docsNotUploaded: 'No se han subido documentos',
    sumsubDocsTitle: 'DOCUMENTOS DE IDENTIDAD (SUMSUB)',
    btnDeleteStorage: 'Eliminar (almacenamiento)',
    perDocDecisionTitle: 'VERIFICACIÓN DE IDENTIDAD — DECISIÓN POR DOCUMENTO',
    pickupAddressLabel: 'DIRECCIÓN DE ENTREGA',
    tripGoalTitle: 'MOTIVO DEL VIAJE · INTERESES (CRM)',
    tripGoalNotSet: 'Motivo del viaje no indicado',
    insuranceLabel: 'SEGURO',
    insuranceNotIssued: 'Seguro no emitido',
    adminCommentTitle: 'COMENTARIO DEL ADMINISTRADOR',
    commentPlaceholder: 'Añadir un comentario…',
    send: 'Enviar',
    bookingLabel: 'RESERVA',
    rowPeriod: 'Periodo',
    rowPickupReturn: 'Entrega / devolución',
    servicesLabel: 'SERVICIOS',
    rowRent: 'Alquiler',
    rowServices: 'Servicios',
    rowInsurance: 'Seguro',
    rowTotal: 'Total',
    rowPrepay: 'Prepago',
    paidSuffix: (m) => `${m} pagado`,
    rowBalance: 'Saldo',
    rowDeposit: 'Depósito',
    statusHistoryTitle: 'HISTORIAL DE ESTADOS',
    btnVerify: 'Verificar',
    btnReject: 'Rechazar',
    confirmDeleteCar: (name) => `¿Eliminar «${name}»? Esta acción no se puede deshacer.`,
    errDeleteFailed: 'No se pudo eliminar',
    savedCarAdded: (label) => `✓ ${label} — coche añadido`,
    savedCarUpdated: (label) => `✓ ${label} — cambios guardados`,
    errCheckFields: 'Revise los campos resaltados abajo',
    errSaveFailed: 'No se pudo guardar',
    carFallback: 'Coche',
    searchCarPlaceholder: 'Buscar por marca o modelo…',
    filterAll: (n) => `Todos · ${n}`,
    filterActive: (n) => `Activos · ${n}`,
    filterHidden: (n) => `Ocultos · ${n}`,
    btnAddCar: '+ Añadir coche',
    colPhoto: 'FOTO',
    colClass: 'CLASE',
    colPricePerDay: 'PRECIO/DÍA',
    colDeposit: 'DEPÓSITO',
    colActions: 'ACCIONES',
    emptyCarsNone: 'Aún no hay coches — añada el primero.',
    emptyFilter: 'Nada coincide con el filtro.',
    seatsUnit: 'plazas',
    statusActiveM: 'Activo',
    statusHiddenM: 'Oculto',
    titleEdit: 'Editar',
    actionDelete: 'Eliminar',
    btnEditShort: 'Editar',
    carFormNew: 'Nuevo coche',
    requiredFieldsPre: 'Los campos con ',
    requiredFieldsPost: ' son obligatorios',
    cancel: 'Cancelar',
    saving: 'Guardando…',
    carFormAdd: 'Añadir coche',
    carFormSave: 'Guardar coche',
    scBasics: 'BÁSICO',
    scSpecs: 'CARACTERÍSTICAS',
    scPricing: 'PRECIO Y DEPÓSITO',
    scPricingHint: 'en EUR — moneda base',
    scConditions: 'CONDICIONES Y ESTADO',
    scPhotos: 'FOTOS',
    fBrand: 'Marca',
    fModel: 'Modelo',
    fYear: 'Año',
    fClass: 'Clase',
    fGearbox: 'Caja de cambios',
    fFuel: 'Tipo de combustible',
    fSeats: 'Plazas',
    fDoors: 'Puertas',
    fAircon: 'Aire acondicionado',
    yes: 'Sí',
    no: 'No',
    fPricePerDay: 'Precio por día, €',
    fDeposit: 'Depósito, €',
    fMileage: 'Límite de kilometraje, km/día',
    mileagePlaceholder: 'vacío = sin límite',
    fMinRental: 'Periodo mín. de alquiler, días',
    fPrepHours: 'Preparación entre alquileres, h',
    fShowToClients: 'Mostrar a los clientes',
    conditionsNote: 'Las condiciones de alquiler en texto para el cliente (edad, seguro, etc.) se editan aparte — este bloque aparecerá más adelante.',
    photosSaveFirst: 'Guarde primero el coche — luego aparecerá aquí la subida de fotos.',
    cvApproved: '🟢 verificado',
    cvPending: '🟡 en revisión',
    cvRejected: '🔴 rechazado',
    cvResubmission: '🟠 reenvío',
    cvNone: '⚪ sin verificar',
    clientsSummary: (n, m) => `${n} clientes · ${m} con reservas repetidas`,
    colContacts: 'CONTACTOS',
    colCitizenship: 'NACIONALIDAD',
    colBookings: 'RESERVAS',
    colDocuments: 'DOCUMENTOS',
    colEmail: 'EMAIL',
    noClients: 'Aún no hay clientes',
    docFull: '✓ completo',
    docNoLicense: '⚠ sin permiso',
    docIncomplete: '⚠ incompleto',
    bookingsPrefix: 'Reservas: ',
    idDocsLabel: 'DOCUMENTOS DE IDENTIDAD',
    docsNotUploadedYet: 'Aún no se han subido documentos',
    kpiIncome: 'INGRESOS (PAGADO)',
    kpiAwaiting: 'EN ESPERA DE PAGO',
    kpiDeposits: 'DEPÓSITOS RETENIDOS',
    kpiAvg: 'TICKET MEDIO',
    errBookingAmount: 'Indique una reserva y un importe',
    errRecordFailed: 'No se pudo registrar el pago',
    btnRecordPayment: '+ Registrar pago',
    newPaymentTitle: 'NUEVO PAGO',
    fBooking: 'RESERVA',
    fMethod: 'MÉTODO',
    fType: 'TIPO',
    fAmount: 'IMPORTE',
    fCurrency: 'MONEDA',
    fStatus: 'ESTADO',
    fTxHash: 'TX HASH (opcional)',
    btnRecord: 'Registrar',
    colNo: 'Nº',
    colDate: 'FECHA',
    noPaymentsYet: 'Aún no hay pagos',
    confirmDeleteService: (name) => `¿Eliminar el servicio «${name}»? Esta acción no se puede deshacer.`,
    savedServiceAdded: (label) => `✓ ${label} — servicio añadido`,
    savedServiceUpdated: (label) => `✓ ${label} — cambios guardados`,
    serviceFallback: 'Servicio',
    searchServicePlaceholder: 'Buscar por nombre o categoría…',
    btnAddService: '+ Añadir servicio',
    reorderHint: 'Borre la búsqueda y el filtro para reordenar los servicios con las flechas ↑↓',
    emptyServicesNone: 'Aún no hay servicios — añada el primero.',
    free: 'Gratis',
    arrowUp: 'Subir',
    arrowDown: 'Bajar',
    colOrder: 'ORDEN',
    colService: 'SERVICIO',
    colCategory: 'CATEGORÍA',
    colPrice: 'PRECIO',
    colUnit: 'UD.',
    colActive: 'ACT.',
    serviceFormNew: 'Nuevo servicio',
    serviceFormAdd: 'Añadir servicio',
    serviceFormSave: 'Guardar servicio',
    scName: 'NOMBRE',
    scNameHint: 'se muestra al cliente en la reserva',
    scPriceHint: 'en EUR — moneda base · 0 = gratis',
    scDesc: 'DESCRIPCIÓN',
    scDescHint: 'opcional',
    scRecommend: 'RECOMENDACIONES',
    scRecommendHint: 'para qué motivos de viaje ofrecerlo (recomendación inteligente)',
    fNameRu: 'Nombre (RU)',
    fNameEn: 'Nombre (EN)',
    phNameRu: 'Silla infantil',
    fCategory: 'Categoría',
    fPrice: 'Precio, €',
    fUnit: 'Unidad de cobro',
    statusActiveF: 'Activo',
    statusHiddenF: 'Oculto',
    fDescRu: 'Descripción (RU)',
    fDescEn: 'Descripción (EN)',
    phDescRu: 'Descripción breve del servicio para el cliente',
    providerNoKey: 'Funciona sin clave',
    providerKeySaved: 'Clave guardada',
    providerNeedKey: 'Se requiere clave API',
    mapCardTitle: 'Mapas · proveedor',
    mapCardDesc: 'Todos los mapas de la app se renderizan con el proveedor seleccionado. OSM siempre funciona; Google y Yandex se activan tras añadir una clave cifrada (de lo contrario se usa OSM).',
    googleApiKey: 'Clave API de Google',
    yandexApiKey: 'Clave API de Yandex',
    phKeySaved: '•••••••• (guardada)',
    phEnterKey: 'Pegue la clave',
    saveBtn: 'Guardar',
    baseEur: 'Base: EUR',
    currenciesTitle: 'Monedas y tipos de cambio',
    oneEur: '1 EUR =',
    ratesHint: 'Cambie el tipo y pulse Enter o quite el foco — se guarda automáticamente.',
    companyTitle: 'Datos de la empresa',
    sslNote: 'Certificado SSL activo · documentos almacenados cifrados',
    backupTitle: 'Copia de seguridad',
    autoBackup: 'Copia automática diaria, 03:00',
    lastBackup: 'ÚLTIMA COPIA',
    lastBackupValue: 'Hoy, 03:00 · base de datos + documentos',
    downloadBackup: 'Descargar copia',
    restore: 'Restaurar',
  },
  de: {
    paymentStatus: { NOT_PAID: 'Nicht bezahlt', AWAITING: 'Ausstehend', PARTIAL: 'Teilweise', PAID: 'Bezahlt', DEPOSIT_HELD: 'Kaution einbehalten', DEPOSIT_RETURNED: 'Kaution zurück', ERROR: 'Fehler', CANCELLED: 'Storniert' },
    paymentMethod: { CARD_STRIPE: 'Karte (Stripe)', CARD_PAYPAL: 'PayPal', BANK_TRANSFER: 'IBAN-Überweisung', CRYPTO: 'Kryptowährung', CASH: 'Bar', MANUAL: 'Manuell' },
    paymentKind: { RENT: 'Miete', DEPOSIT: 'Kaution', PREPAY: 'Anzahlung', BALANCE: 'Restbetrag', FULL: 'Vollständig' },
    carClass: { ECONOMY: 'Economy', COMFORT: 'Komfort', BUSINESS: 'Business', PREMIUM: 'Premium', SUV: 'Premium SUV', MINIVAN: 'Minivan VIP' },
    gearbox: { AUTOMATIC: 'Automatik', MANUAL: 'Schaltgetriebe' },
    fuel: { PETROL: 'Benzin', DIESEL: 'Diesel', HYBRID: 'Hybrid', ELECTRIC: 'Elektro' },
    serviceCat: { RENTAL: 'Auto', TRANSFER: 'Transfer', REAL_ESTATE: 'Immobilien', TOURS: 'Freizeit', INSURANCE: 'Versicherung', CONCIERGE: 'Service', CONNECTIVITY: 'Konnektivität', OTHER: 'Sonstiges' },
    serviceUnit: { flat: '', per_day: '/ Tag', per_trip: '/ Fahrt' },
    docType: { PASSPORT: 'Reisepass', SELFIE: 'Selfie mit Dokument', LICENSE_FRONT: 'Führerschein Vorderseite', LICENSE_BACK: 'Führerschein Rückseite', PAYMENT_PROOF: 'Zahlungsbeleg', CONTRACT: 'Vertrag', OTHER: 'Dokument' },
    docStatus: { UPLOADED: 'Hochgeladen', UNDER_REVIEW: 'In Prüfung', VERIFIED: 'Geprüft', REJECTED: 'Abgelehnt' },
    tripGoal: { LEISURE: 'Urlaub', BUSINESS: 'Geschäftlich', PROPERTY_PURCHASE: 'Immobilienkauf', PROPERTY_VIEWING: 'Immobilienbesichtigung', MEDICAL: 'Behandlung', RELOCATION: 'Umzug', LONG_STAY: 'Langzeitmiete', VISITING: 'Besuch', OTHER: 'Sonstiges' },
    insuranceType: { BASIC: 'Basisversicherung', EXTENDED: 'Erweiterte Versicherung', FULL_NO_FRANCHISE: 'Vollversicherung ohne Selbstbeteiligung' },
    insuranceOpt: { ISSUED: 'Ausgestellt', PENDING: 'Ausstehend', CLIENT_DATA_INCOMPLETE: 'Daten unvollständig', NEEDS_EXTRA_CHECK: 'Zusatzprüfung' },
    serviceUnitOpt: { flat: 'Einmalig', per_day: 'Pro Tag', per_trip: 'Pro Fahrt' },
    carFieldMsg: { brand: 'Marke angeben — z. B. BMW', model: 'Modell angeben — z. B. 520i', year: 'Baujahr zwischen 1990 und 2100', class: 'Fahrzeugklasse auswählen', seats: 'Sitze zwischen 1 und 20', doors: 'Türen zwischen 2 und 6', pricePerDay: 'Preis pro Tag — eine Zahl ab 0', deposit: 'Kaution — eine Zahl ab 0', mileageLimitPerDay: 'Kilometerlimit — ganze Zahl (leer = kein Limit)', minRentalDays: 'Mindestdauer — 1 bis 60 Tage', prepHoursBetween: 'Vorbereitungszeit — 0 bis 168 Stunden' },
    serviceFieldMsg: { nameRu: 'Namen auf Russisch angeben', nameEn: 'Namen auf Englisch angeben (English)', price: 'Preis — eine Zahl ab 0 (0 = kostenlos)', category: 'Eine Kategorie auswählen', unit: 'Eine Abrechnungseinheit auswählen' },
    companyField: { company_name: 'Firmenname', company_legal: 'Juristische Person', company_phone: 'Telefon', company_email: 'E-Mail', company_address: 'Adresse', bank_iban: 'IBAN', bank_swift: 'SWIFT' },
    months: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
    titles: {
      dashboard: ['Dashboard', 'Geschäftsübersicht'],
      bookings: ['Buchungen', 'Alle Kundenanfragen'],
      board: ['Auftragsboard', 'Kanban nach Mietphase'],
      cars: ['Fahrzeuge', 'Flottenverwaltung'],
      calendar: ['Kalender', 'Flottenauslastung'],
      clients: ['Kunden', 'Kundenstamm und Historie'],
      verifications: ['Prüfungen', 'Warteschlange der Identitätsprüfung'],
      payments: ['Zahlungen', 'Zahlungen, Kautionen und Restbeträge'],
      finance: ['Finanzen', 'Geldverwaltung — Einnahmen, Ausgaben, Gewinn'],
      services: ['Leistungen', 'Katalog der Zusatzleistungen'],
      notifications: ['Benachrichtigungen', 'Systemereignisse'],
      settings: ['Einstellungen', 'Parameter und Zugänge'],
      team: ['Team', 'Admins & Wiederherstellung'],
    },
    orderTitle: (n) => `Auftrag ${n}`,
    open: 'Öffnen →',
    linkAuthTitle: 'Social-Login · Google · Yandex · Telegram',
    linkAuthDesc: 'OAuth-Schlüssel, Secrets werden verschlüsselt, Login-Buttons ein-/ausschalten',
    linkPaymentsTitle: 'Zahlungen und Währungen · Kaution · Krypto · Bank',
    linkPaymentsDesc: 'Anzahlungsprozentsatz, Zahlungsarten aktivieren, Krypto-Wallets, Bankdaten, Wechselkurse',
    linkProvidersTitle: 'Zahlungsanbieter · Stripe · PayPal · PayTR · iyzico',
    linkProvidersDesc: 'Acquiring: Prozessor-Schlüssel (Secrets verschlüsselt), jeweils ein/aus, Status. Im Checkout erscheinen nur aktivierte',
    linkLocationsTitle: 'Städte und Büros · Servicezonen · Karte',
    linkLocationsDesc: 'Städteliste (ein/aus, Reihenfolge), Adresse und Koordinaten des Übergabebüros auf der Karte',
    linkInsuranceTitle: 'Versicherung — was enthalten ist · Tarifabdeckung',
    linkInsuranceDesc: 'Deckungsbedingungen Basic / Extended / Full (Selbstbeteiligung, Diebstahl, Schäden, Glas, Pannenhilfe) — bearbeitbar, in der DB gespeichert',
    linkSumsubTitle: 'Identitätsprüfung (Sumsub) · KYC',
    linkSumsubDesc: 'Sumsub-Schlüssel (verschlüsselt), Prüfstufe, Webhook. Reisepass/ID + Führerschein + Liveness im Schritt „Daten“',
    chipAll: (n) => `Alle · ${n}`,
    chipNew: (n) => `Neue · ${n}`,
    chipActive: (n) => `Aktive · ${n}`,
    chipPending: (n) => `Warten auf Zahlung · ${n}`,
    passiveCar: 'Auto ▾',
    passivePeriod: 'Zeitraum ▾',
    passiveExport: 'Export',
    colOrderNo: 'AUFTRAG №',
    colClient: 'KUNDE',
    colCar: 'FAHRZEUG',
    colPeriod: 'ZEITRAUM',
    colStatus: 'STATUS',
    colAmount: 'BETRAG',
    colPayment: 'ZAHLUNG',
    noBookings: 'Keine Buchungen gefunden',
    openRow: 'Öffnen ›',
    payPaid: 'Bezahlt',
    payPartial: 'Teilweise',
    payUnpaid: 'Nicht bezahlt',
    payTitle: 'ZAHLUNGEN ZUM AUFTRAG',
    awaitingConfirm: (n) => `${n} ${n === 1 ? 'wartet' : 'warten'} auf Bestätigung`,
    creditToAccount: 'Auf Konto buchen:',
    noPayments: 'Noch keine Zahlungen für diesen Auftrag.',
    receipt: 'Beleg',
    btnConfirmPayment: 'Zahlung bestätigen',
    btnDepositReceived: 'Kaution erhalten',
    changePaymentStatus: 'Zahlungsstatus ändern',
    msgSaved: 'Gespeichert',
    msgError: 'Fehler',
    msgInsuranceUpdated: 'Versicherungsstatus aktualisiert',
    msgCommentAdded: 'Kommentar hinzugefügt',
    msgStatusUpdated: 'Status aktualisiert',
    promptRejectReason: 'Ablehnungsgrund (optional):',
    msgDocApproved: 'Dokument geprüft',
    msgDocRejected: 'Dokument abgelehnt',
    confirmPurgeDocs: 'Die geprüften Ausweisdokumente dieses Kunden aus dem verschlüsselten Speicher löschen? Diese Aktion ist unwiderruflich.',
    msgDocsPurged: 'Dokumente gelöscht',
    msgPaymentStatusUpdated: 'Zahlungsstatus aktualisiert',
    verifApproved: '🟢 Geprüft',
    verifPending: '🟡 In Prüfung',
    verifRejected: '🔴 Abgelehnt',
    verifResubmission: '🟠 Erneute Einreichung nötig',
    verifNone: '⚪ Nicht geprüft',
    fieldVerification: 'IDENTITÄTSPRÜFUNG (SUMSUB)',
    fieldEmail: 'E-MAIL',
    fieldPhone: 'TELEFON',
    fieldWhatsapp: 'WHATSAPP / TG',
    fieldPassport: 'REISEPASS / ID',
    fieldLicense: 'FÜHRERSCHEIN',
    fieldLicensePeriod: 'FÜHRERSCHEIN-GÜLTIGKEIT',
    fieldPassportExpiry: 'ABLAUF REISEPASS/ID',
    fieldAddress: 'ADRESSE',
    airportAntalya: 'Flughafen Antalya (AYT)',
    pickupAddressDefault: 'Übergabeadresse',
    backToList: '← Zurück zu den Buchungen',
    kfClient: 'KUNDE',
    kfCar: 'FAHRZEUG',
    kfRentalPeriod: 'MIETZEITRAUM',
    kfPayment: 'ZAHLUNG',
    daysUnit: 'Tage',
    balanceDeposit: (bal, dep) => `Restbetrag ${bal} · Kaution ${dep}`,
    collapseDocsTitle: 'DOKUMENTE UND IDENTITÄTSPRÜFUNG',
    filesCount: (n) => `${n} Dateien`,
    docsNotUploaded: 'Keine Dokumente hochgeladen',
    sumsubDocsTitle: 'AUSWEISDOKUMENTE (SUMSUB)',
    btnDeleteStorage: 'Löschen (Speicher)',
    perDocDecisionTitle: 'IDENTITÄTSPRÜFUNG — ENTSCHEIDUNG PRO DOKUMENT',
    pickupAddressLabel: 'ÜBERGABEADRESSE',
    tripGoalTitle: 'REISEZWECK · INTERESSEN (CRM)',
    tripGoalNotSet: 'Reisezweck nicht angegeben',
    insuranceLabel: 'VERSICHERUNG',
    insuranceNotIssued: 'Keine Versicherung ausgestellt',
    adminCommentTitle: 'ADMINISTRATOR-KOMMENTAR',
    commentPlaceholder: 'Kommentar hinzufügen…',
    send: 'Senden',
    bookingLabel: 'BUCHUNG',
    rowPeriod: 'Zeitraum',
    rowPickupReturn: 'Übergabe / Rückgabe',
    servicesLabel: 'LEISTUNGEN',
    rowRent: 'Miete',
    rowServices: 'Leistungen',
    rowInsurance: 'Versicherung',
    rowTotal: 'Gesamt',
    rowPrepay: 'Anzahlung',
    paidSuffix: (m) => `${m} bezahlt`,
    rowBalance: 'Restbetrag',
    rowDeposit: 'Kaution',
    statusHistoryTitle: 'STATUSVERLAUF',
    btnVerify: 'Prüfen',
    btnReject: 'Ablehnen',
    confirmDeleteCar: (name) => `„${name}“ löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
    errDeleteFailed: 'Löschen fehlgeschlagen',
    savedCarAdded: (label) => `✓ ${label} — Fahrzeug hinzugefügt`,
    savedCarUpdated: (label) => `✓ ${label} — Änderungen gespeichert`,
    errCheckFields: 'Prüfen Sie die hervorgehobenen Felder unten',
    errSaveFailed: 'Speichern fehlgeschlagen',
    carFallback: 'Fahrzeug',
    searchCarPlaceholder: 'Nach Marke oder Modell suchen…',
    filterAll: (n) => `Alle · ${n}`,
    filterActive: (n) => `Aktive · ${n}`,
    filterHidden: (n) => `Ausgeblendet · ${n}`,
    btnAddCar: '+ Fahrzeug hinzufügen',
    colPhoto: 'FOTO',
    colClass: 'KLASSE',
    colPricePerDay: 'PREIS/TAG',
    colDeposit: 'KAUTION',
    colActions: 'AKTIONEN',
    emptyCarsNone: 'Noch keine Fahrzeuge — fügen Sie das erste hinzu.',
    emptyFilter: 'Kein Treffer für den Filter.',
    seatsUnit: 'Sitze',
    statusActiveM: 'Aktiv',
    statusHiddenM: 'Ausgeblendet',
    titleEdit: 'Bearbeiten',
    actionDelete: 'Löschen',
    btnEditShort: 'Bearb.',
    carFormNew: 'Neues Fahrzeug',
    requiredFieldsPre: 'Mit ',
    requiredFieldsPost: ' markierte Felder sind Pflicht',
    cancel: 'Abbrechen',
    saving: 'Speichern…',
    carFormAdd: 'Fahrzeug hinzufügen',
    carFormSave: 'Fahrzeug speichern',
    scBasics: 'GRUNDLAGEN',
    scSpecs: 'MERKMALE',
    scPricing: 'PREIS UND KAUTION',
    scPricingHint: 'in EUR — Basiswährung',
    scConditions: 'BEDINGUNGEN UND STATUS',
    scPhotos: 'FOTOS',
    fBrand: 'Marke',
    fModel: 'Modell',
    fYear: 'Jahr',
    fClass: 'Klasse',
    fGearbox: 'Getriebe',
    fFuel: 'Kraftstoffart',
    fSeats: 'Sitze',
    fDoors: 'Türen',
    fAircon: 'Klimaanlage',
    yes: 'Ja',
    no: 'Nein',
    fPricePerDay: 'Preis pro Tag, €',
    fDeposit: 'Kaution, €',
    fMileage: 'Kilometerlimit, km/Tag',
    mileagePlaceholder: 'leer = kein Limit',
    fMinRental: 'Min. Mietdauer, Tage',
    fPrepHours: 'Vorbereitung zwischen Mieten, Std.',
    fShowToClients: 'Kunden anzeigen',
    conditionsNote: 'Textliche Mietbedingungen für den Kunden (Alter, Versicherung usw.) werden separat bearbeitet — dieser Block folgt später.',
    photosSaveFirst: 'Speichern Sie zuerst das Fahrzeug — danach erscheint hier der Foto-Upload.',
    cvApproved: '🟢 geprüft',
    cvPending: '🟡 in Prüfung',
    cvRejected: '🔴 abgelehnt',
    cvResubmission: '🟠 erneut',
    cvNone: '⚪ nicht geprüft',
    clientsSummary: (n, m) => `${n} Kunden · ${m} mit wiederholten Buchungen`,
    colContacts: 'KONTAKTE',
    colCitizenship: 'STAATSANGEHÖRIGKEIT',
    colBookings: 'BUCHUNGEN',
    colDocuments: 'DOKUMENTE',
    colEmail: 'E-MAIL',
    noClients: 'Noch keine Kunden',
    docFull: '✓ vollständig',
    docNoLicense: '⚠ kein Führerschein',
    docIncomplete: '⚠ unvollständig',
    bookingsPrefix: 'Buchungen: ',
    idDocsLabel: 'AUSWEISDOKUMENTE',
    docsNotUploadedYet: 'Noch keine Dokumente hochgeladen',
    kpiIncome: 'EINNAHMEN (BEZAHLT)',
    kpiAwaiting: 'WARTEN AUF ZAHLUNG',
    kpiDeposits: 'EINBEHALTENE KAUTIONEN',
    kpiAvg: 'DURCHSCHNITTSBON',
    errBookingAmount: 'Buchung und Betrag angeben',
    errRecordFailed: 'Zahlung konnte nicht erfasst werden',
    btnRecordPayment: '+ Zahlung erfassen',
    newPaymentTitle: 'NEUE ZAHLUNG',
    fBooking: 'BUCHUNG',
    fMethod: 'METHODE',
    fType: 'TYP',
    fAmount: 'BETRAG',
    fCurrency: 'WÄHRUNG',
    fStatus: 'STATUS',
    fTxHash: 'TX HASH (optional)',
    btnRecord: 'Erfassen',
    colNo: '№',
    colDate: 'DATUM',
    noPaymentsYet: 'Noch keine Zahlungen',
    confirmDeleteService: (name) => `Leistung „${name}“ löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
    savedServiceAdded: (label) => `✓ ${label} — Leistung hinzugefügt`,
    savedServiceUpdated: (label) => `✓ ${label} — Änderungen gespeichert`,
    serviceFallback: 'Leistung',
    searchServicePlaceholder: 'Nach Name oder Kategorie suchen…',
    btnAddService: '+ Leistung hinzufügen',
    reorderHint: 'Suche und Filter zurücksetzen, um Leistungen mit den ↑↓-Pfeilen umzusortieren',
    emptyServicesNone: 'Noch keine Leistungen — fügen Sie die erste hinzu.',
    free: 'Kostenlos',
    arrowUp: 'Nach oben',
    arrowDown: 'Nach unten',
    colOrder: 'REIHENFOLGE',
    colService: 'LEISTUNG',
    colCategory: 'KATEGORIE',
    colPrice: 'PREIS',
    colUnit: 'EINH.',
    colActive: 'AKT.',
    serviceFormNew: 'Neue Leistung',
    serviceFormAdd: 'Leistung hinzufügen',
    serviceFormSave: 'Leistung speichern',
    scName: 'NAME',
    scNameHint: 'wird dem Kunden bei der Buchung angezeigt',
    scPriceHint: 'in EUR — Basiswährung · 0 = kostenlos',
    scDesc: 'BESCHREIBUNG',
    scDescHint: 'optional',
    scRecommend: 'EMPFEHLUNGEN',
    scRecommendHint: 'für welche Reisezwecke anbieten (intelligente Auswahl)',
    fNameRu: 'Name (RU)',
    fNameEn: 'Name (EN)',
    phNameRu: 'Kindersitz',
    fCategory: 'Kategorie',
    fPrice: 'Preis, €',
    fUnit: 'Abrechnungseinheit',
    statusActiveF: 'Aktiv',
    statusHiddenF: 'Ausgeblendet',
    fDescRu: 'Beschreibung (RU)',
    fDescEn: 'Beschreibung (EN)',
    phDescRu: 'Kurze Beschreibung der Leistung für den Kunden',
    providerNoKey: 'Funktioniert ohne Schlüssel',
    providerKeySaved: 'Schlüssel gespeichert',
    providerNeedKey: 'API-Schlüssel erforderlich',
    mapCardTitle: 'Karten · Anbieter',
    mapCardDesc: 'Alle Karten der App werden über den gewählten Anbieter gerendert. OSM funktioniert immer; Google und Yandex werden nach Hinzufügen eines verschlüsselten Schlüssels aktiv (sonst wird OSM verwendet).',
    googleApiKey: 'Google-API-Schlüssel',
    yandexApiKey: 'Yandex-API-Schlüssel',
    phKeySaved: '•••••••• (gespeichert)',
    phEnterKey: 'Schlüssel einfügen',
    saveBtn: 'Speichern',
    baseEur: 'Basis: EUR',
    currenciesTitle: 'Währungen und Kurse',
    oneEur: '1 EUR =',
    ratesHint: 'Kurs ändern und Enter drücken oder das Feld verlassen — wird automatisch gespeichert.',
    companyTitle: 'Firmendaten',
    sslNote: 'SSL-Zertifikat aktiv · Dokumente verschlüsselt gespeichert',
    backupTitle: 'Datensicherung',
    autoBackup: 'Tägliches Auto-Backup, 03:00',
    lastBackup: 'LETZTES BACKUP',
    lastBackupValue: 'Heute, 03:00 · Datenbank + Dokumente',
    downloadBackup: 'Backup herunterladen',
    restore: 'Wiederherstellen',
  },
}

/* ---- Status pill system (matches the design's S[] map). StatusKind + booking status
   labels/kinds/transitions live in lib/booking-status (shared with the kanban board). ---- */
interface PillStyle {
  badge: CSSProperties
  dot: CSSProperties
}

const pill = (bg: string, bd: string, tx: string): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 999,
  background: bg,
  border: `1px solid ${bd}`,
  color: tx,
  font: '600 11px var(--f-ui)',
  whiteSpace: 'nowrap',
})

const dot = (c: string): CSSProperties => ({
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: c,
})

const STATUS: Record<StatusKind, PillStyle> = {
  green: { badge: pill('rgba(111,191,143,.14)', 'rgba(111,191,143,.3)', '#8FD7AD'), dot: dot('#6FBF8F') },
  blue: { badge: pill('rgba(78,127,224,.14)', 'rgba(78,127,224,.3)', '#A6BEF2'), dot: dot('#4E7FE0') },
  amber: { badge: pill('rgba(224,162,62,.14)', 'rgba(224,162,62,.32)', '#ECC481'), dot: dot('#E0A23E') },
  gold: { badge: pill('rgba(255,122,92,.14)', 'rgba(255,122,92,.34)', '#FFB48A'), dot: dot('#FF7A5C') },
  grey: { badge: pill('rgba(255,255,255,.05)', 'rgba(255,255,255,.12)', '#9CB0CB'), dot: dot('#5b6f8a') },
  red: { badge: pill('rgba(206,74,74,.14)', 'rgba(206,74,74,.32)', '#E58A8A'), dot: dot('#CE4A4A') },
}

const StatusPill = ({ kind, label }: { kind: StatusKind; label: string }) => (
  <span style={STATUS[kind].badge}>
    <span style={STATUS[kind].dot} />
    {label}
  </span>
)

/* ---- Shared style atoms ---- */
const PANEL: CSSProperties = {
  background: 'var(--d-panel)',
  border: '1px solid rgba(255,255,255,.07)',
  borderRadius: 14,
}
const SECTION_LABEL: CSSProperties = {
  font: '400 10px var(--f-mono)',
  letterSpacing: '.12em',
  color: 'var(--d-muted-2)',
}
const CORAL_BTN: CSSProperties = {
  background: 'linear-gradient(180deg,#FFB48A,#FF7A5C)',
  color: '#082A33',
  borderRadius: 10,
  font: '700 13px var(--f-ui)',
  border: 'none',
  cursor: 'pointer',
}

/* Toggle pill ----------------------------------------------------------- */
function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <span
      onClick={disabled ? undefined : onClick}
      role="switch"
      aria-checked={on}
      style={{
        width: 38,
        height: 22,
        borderRadius: 999,
        background: on ? '#6FBF8F' : 'rgba(255,255,255,.15)',
        position: 'relative',
        flexShrink: 0,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background .15s ease',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          [on ? 'right' : 'left']: 3,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: on ? '#082A33' : '#fff',
          transition: 'all .15s ease',
        }}
      />
    </span>
  )
}

/* ====================== ENUM → RU LABELS / PILL KINDS ======================
   Booking-status labels/kinds/order + transition rules live in lib/booking-status
   (shared source of truth with the kanban board). Payment labels stay local. */

const PAYMENT_STATUS_KIND: Record<string, StatusKind> = {
  NOT_PAID: 'red',
  AWAITING: 'amber',
  PARTIAL: 'amber',
  PAID: 'green',
  DEPOSIT_HELD: 'green',
  DEPOSIT_RETURNED: 'grey',
  ERROR: 'red',
  CANCELLED: 'grey',
}

/**
 * DERIVED whole-customer verification status from the per-document review list — the manual method
 * no longer stores a customer-level status, so admin badges must derive it (all current docs
 * approved+not-expired → APPROVED; any pending → PENDING; else REJECTED; nothing submitted → NONE).
 */
function derivedVerifStatus(docs: { decision: string; expired: boolean }[]): string {
  if (!docs.length || docs.every((d) => d.decision === 'NONE')) return 'NONE'
  if (docs.every((d) => d.decision === 'APPROVED' && !d.expired)) return 'APPROVED'
  if (docs.some((d) => d.decision === 'PENDING')) return 'PENDING'
  return 'REJECTED'
}

const CURRENCY_SYMBOL: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  RUB: '₽',
  TRY: '₺',
  USDT: '₮',
  USDC: 'USDC',
}

function money(amount: number, currency: Currency): string {
  const isCrypto = currency === 'USDT' || currency === 'USDC'
  const body = amount.toLocaleString('ru-RU', {
    minimumFractionDigits: isCrypto ? 2 : 0,
    maximumFractionDigits: 2,
  })
  if (currency === 'USDC') return `${body} USDC`
  if (currency === 'USDT') return `₮${body}`
  return `${CURRENCY_SYMBOL[currency]}${body}`
}

function dm(isoStr: string, months: string[]): string {
  const d = new Date(isoStr)
  return `${d.getDate()} ${months[d.getMonth()]}`
}
function period(startISO: string, endISO: string, months: string[]): string {
  return `${dm(startISO, months)} – ${dm(endISO, months)}`
}
function dateShort(isoStr: string | null): string {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '—'
}

/** Payment summary badge shown in the bookings list "ОПЛАТА" column. */
function payLabel(b: AdminBookingRow, t: Strings): { text: string; color: string } {
  if (b.subtotal > 0 && b.prepaidAmount >= b.subtotal) return { text: t.payPaid, color: '#8FD7AD' }
  if (b.prepaidAmount > 0) return { text: t.payPartial, color: '#E7B463' }
  return { text: t.payUnpaid, color: '#E58A8A' }
}

/* ====================== PAGE ====================== */
export default function Admin(props: AdminProps) {
  const { tab, detail } = props
  const t = useDict(dict)
  const [title, subtitle] = t.titles[tab]
  const isMobile = useIsMobile()

  const activeNav: AdminNavKey = detail ? 'bookings' : tab
  const pageTitle = detail ? t.orderTitle(detail.number) : title
  const pageSub = detail
    ? `${detail.car.brand} ${detail.car.model} · ${[detail.client.firstName, detail.client.lastName].filter(Boolean).join(' ') || detail.client.email}`
    : subtitle

  return (
    <AdminShell active={activeNav} title={pageTitle} subtitle={pageSub} isOwner={props.isOwner}>
      {tab === 'bookings' && detail && <BookingDetail detail={detail} />}
      {tab === 'bookings' && !detail && (
        <BookingsView bookings={props.bookings} statusCounts={props.statusCounts} />
      )}
      {tab === 'cars' && <CarsView cars={props.cars} />}
      {tab === 'clients' && <ClientsView clients={props.clients} />}
      {tab === 'payments' && <PaymentsView payments={props.payments} bookings={props.bookings} />}
      {tab === 'services' && <ServicesView services={props.services} />}
      {tab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 0 }}>
          <a
            href="/admin/settings/auth"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '16px 20px',
              marginBottom: isMobile ? 0 : 16,
              borderRadius: 14,
              border: '1px solid rgba(255,122,92,.3)',
              background: 'linear-gradient(135deg,rgba(255,122,92,.10),rgba(255,180,138,.05))',
              textDecoration: 'none',
            }}
          >
            <div>
              <div style={{ font: '600 14px var(--f-ui)', color: 'var(--d-text-bright)' }}>
                {t.linkAuthTitle}
              </div>
              <div style={{ marginTop: 3, font: '400 12px var(--f-ui)', color: 'var(--d-muted)' }}>
                {t.linkAuthDesc}
              </div>
            </div>
            <span style={{ font: '700 13px var(--f-ui)', color: 'var(--d-accent-light)' }}>{t.open}</span>
          </a>
          <a
            href="/admin/settings/payments"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '16px 20px',
              marginBottom: isMobile ? 0 : 16,
              borderRadius: 14,
              border: '1px solid rgba(111,191,143,.3)',
              background: 'linear-gradient(135deg,rgba(111,191,143,.10),rgba(78,127,224,.05))',
              textDecoration: 'none',
            }}
          >
            <div>
              <div style={{ font: '600 14px var(--f-ui)', color: 'var(--d-text-bright)' }}>
                {t.linkPaymentsTitle}
              </div>
              <div style={{ marginTop: 3, font: '400 12px var(--f-ui)', color: 'var(--d-muted)' }}>
                {t.linkPaymentsDesc}
              </div>
            </div>
            <span style={{ font: '700 13px var(--f-ui)', color: 'var(--d-green)' }}>{t.open}</span>
          </a>
          <a
            href="/admin/settings/payment-providers"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '16px 20px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,.08)',
              background: 'linear-gradient(135deg,rgba(78,127,224,.10),rgba(155,110,224,.05))',
              textDecoration: 'none',
            }}
          >
            <div>
              <div style={{ font: '600 14px var(--f-ui)', color: 'var(--d-text-bright)' }}>
                {t.linkProvidersTitle}
              </div>
              <div style={{ marginTop: 3, font: '400 12px var(--f-ui)', color: 'var(--d-muted)' }}>
                {t.linkProvidersDesc}
              </div>
            </div>
            <span style={{ font: '700 13px var(--f-ui)', color: 'var(--d-accent-light)' }}>{t.open}</span>
          </a>
          <a
            href="/admin/settings/locations"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '16px 20px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,.08)',
              background: 'linear-gradient(135deg,rgba(111,191,143,.10),rgba(20,153,174,.05))',
              textDecoration: 'none',
            }}
          >
            <div>
              <div style={{ font: '600 14px var(--f-ui)', color: 'var(--d-text-bright)' }}>
                {t.linkLocationsTitle}
              </div>
              <div style={{ marginTop: 3, font: '400 12px var(--f-ui)', color: 'var(--d-muted)' }}>
                {t.linkLocationsDesc}
              </div>
            </div>
            <span style={{ font: '700 13px var(--f-ui)', color: 'var(--d-green)' }}>{t.open}</span>
          </a>
          <a
            href="/admin/settings/insurance"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '16px 20px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,.08)',
              background: 'linear-gradient(135deg,rgba(255,122,92,.10),rgba(224,161,6,.05))',
              textDecoration: 'none',
            }}
          >
            <div>
              <div style={{ font: '600 14px var(--f-ui)', color: 'var(--d-text-bright)' }}>
                {t.linkInsuranceTitle}
              </div>
              <div style={{ marginTop: 3, font: '400 12px var(--f-ui)', color: 'var(--d-muted)' }}>
                {t.linkInsuranceDesc}
              </div>
            </div>
            <span style={{ font: '700 13px var(--f-ui)', color: 'var(--d-accent-light)' }}>{t.open}</span>
          </a>
          <a
            href="/admin/settings/sumsub"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '16px 20px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,.08)',
              background: 'linear-gradient(135deg,rgba(78,127,224,.10),rgba(39,181,118,.05))',
              textDecoration: 'none',
            }}
          >
            <div>
              <div style={{ font: '600 14px var(--f-ui)', color: 'var(--d-text-bright)' }}>
                {t.linkSumsubTitle}
              </div>
              <div style={{ marginTop: 3, font: '400 12px var(--f-ui)', color: 'var(--d-muted)' }}>
                {t.linkSumsubDesc}
              </div>
            </div>
            <span style={{ font: '700 13px var(--f-ui)', color: 'var(--d-accent-light)' }}>{t.open}</span>
          </a>
          <SettingsView rates={props.rates} settings={props.settings} mapConfig={props.mapConfig} />
        </div>
      )}
    </AdminShell>
  )
}

/* ====================== BOOKINGS LIST ====================== */
const BK_COLS = '120px 1.4fr 1.5fr 1.2fr 1.3fr 90px 120px 24px'

type ChipKey = 'all' | 'new' | 'active' | 'pending'
interface ChipDef {
  key: ChipKey
  label: string
  statuses: BookingStatus[] | null
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="av-tap"
      style={{
        padding: '9px 14px',
        borderRadius: 10,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        background: active ? 'var(--d-accent)' : 'var(--d-card)',
        border: active ? '1px solid transparent' : '1px solid rgba(255,255,255,.08)',
        color: active ? '#082A33' : 'var(--d-muted)',
        font: active ? '600 12px var(--f-ui)' : '500 12px var(--f-ui)',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

const PassiveChip = ({ label, accent }: { label: string; accent?: boolean }) => (
  <span
    className="av-tap"
    style={{
      padding: '9px 14px',
      borderRadius: 10,
      whiteSpace: 'nowrap',
      flexShrink: 0,
      background: 'var(--d-card)',
      border: accent ? '1px solid rgba(255,122,92,.4)' : '1px solid rgba(255,255,255,.08)',
      color: accent ? 'var(--d-accent-light)' : 'var(--d-muted)',
      font: accent ? '600 12px var(--f-ui)' : '500 12px var(--f-ui)',
      cursor: 'pointer',
      ...(accent ? { background: 'transparent' } : {}),
    }}
  >
    {label}
  </span>
)

function BookingsView({
  bookings,
  statusCounts,
}: {
  bookings: AdminBookingRow[]
  statusCounts: Record<string, number>
}) {
  const router = useRouter()
  const t = useDict(dict)
  const { lang } = useLang()
  const [chip, setChip] = useState<ChipKey>('all')

  const countFor = (statuses: BookingStatus[] | null): number =>
    statuses === null
      ? bookings.length
      : statuses.reduce((sum, s) => sum + (statusCounts[s] ?? 0), 0)

  const chips: ChipDef[] = [
    { key: 'all', label: t.chipAll(countFor(null)), statuses: null },
    { key: 'new', label: t.chipNew(countFor(['NEW'])), statuses: ['NEW'] },
    {
      key: 'active',
      label: t.chipActive(countFor(['ACTIVE', 'DELIVERED'])),
      statuses: ['ACTIVE', 'DELIVERED'],
    },
    {
      key: 'pending',
      label: t.chipPending(countFor(['AWAITING_PAYMENT', 'AWAITING_CONFIRMATION'])),
      statuses: ['AWAITING_PAYMENT', 'AWAITING_CONFIRMATION'],
    },
  ]

  const activeChip = chips.find((c) => c.key === chip) ?? chips[0]
  const visible = useMemo(
    () =>
      activeChip.statuses === null
        ? bookings
        : bookings.filter((b) => activeChip.statuses!.includes(b.status)),
    [bookings, activeChip],
  )
  const isMobile = useIsMobile()

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <div
          className={isMobile ? 'av-xscroll' : undefined}
          style={
            isMobile
              ? { display: 'flex', gap: 8, flexWrap: 'nowrap', width: '100%', paddingBottom: 4 }
              : { display: 'flex', gap: 10, flexWrap: 'wrap' }
          }
        >
          {chips.map((c) => (
            <FilterChip key={c.key} active={chip === c.key} label={c.label} onClick={() => setChip(c.key)} />
          ))}
        </div>
        <div
          className={isMobile ? 'av-xscroll' : undefined}
          style={
            isMobile
              ? { display: 'flex', gap: 8, flexWrap: 'nowrap', width: '100%', paddingBottom: 4 }
              : { display: 'flex', gap: 10, flexShrink: 0 }
          }
        >
          <PassiveChip label={t.passiveCar} />
          <PassiveChip label={t.passivePeriod} />
          <PassiveChip label={t.passiveExport} accent />
        </div>
      </div>

      <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: 12 } : { ...PANEL, overflow: 'hidden' }}>
        {!isMobile && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: BK_COLS,
              gap: 12,
              padding: '13px 18px',
              borderBottom: '1px solid rgba(255,255,255,.08)',
              background: 'var(--d-card)',
              font: '400 10px var(--f-mono)',
              letterSpacing: '.1em',
              color: 'var(--d-muted-2)',
            }}
          >
            <span>{t.colOrderNo}</span>
            <span>{t.colClient}</span>
            <span>{t.colCar}</span>
            <span>{t.colPeriod}</span>
            <span>{t.colStatus}</span>
            <span>{t.colAmount}</span>
            <span>{t.colPayment}</span>
            <span />
          </div>
        )}
        {visible.length === 0 && (
          <div style={{ padding: '28px 18px', textAlign: 'center', font: '400 13px var(--f-ui)', color: 'var(--d-muted)' }}>
            {t.noBookings}
          </div>
        )}
        {visible.map((b) => {
          const pay = payLabel(b, t)
          if (isMobile) {
            return (
              <div
                key={b.id}
                className="av-row-hover av-tap"
                onClick={() => router.push(`/admin?tab=bookings&booking=${b.id}`)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  padding: '16px 16px',
                  background: 'var(--d-card)',
                  border: '1px solid rgba(255,255,255,.09)',
                  borderRadius: 16,
                  boxShadow: '0 12px 26px -20px rgba(0,0,0,.8)',
                  cursor: 'pointer',
                }}
              >
                {/* top: order # + status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ font: '600 13px var(--f-mono)', letterSpacing: '.02em', color: 'var(--d-accent-light)' }}>{b.number}</span>
                  <StatusPill kind={BOOKING_STATUS_KIND[b.status]} label={statusLabel(b.status, lang)} />
                </div>
                {/* who + which car — the primary identity of the order */}
                <div>
                  <div style={{ font: '700 17px var(--f-ui)', color: 'var(--d-text-bright)' }}>{b.clientName}</div>
                  <div style={{ marginTop: 3, font: '500 14px var(--f-ui)', color: '#C9D4E4' }}>{b.carName}</div>
                </div>
                {/* dates + payment status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', font: '500 13px var(--f-ui)' }}>
                  <span style={{ color: 'var(--d-muted)' }}>{period(b.startAt, b.endAt, t.months)}</span>
                  <span style={{ color: pay.color, fontWeight: 600 }}>{pay.text}</span>
                </div>
                {/* amount + open — separated for a clear money/action line */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.06)' }}>
                  <span style={{ font: '800 19px var(--f-ui)', color: 'var(--d-text-bright)' }}>{money(b.subtotal, b.currency)}</span>
                  <span style={{ font: '700 13px var(--f-ui)', color: 'var(--d-accent)' }}>{t.openRow}</span>
                </div>
              </div>
            )
          }
          return (
            <div
              key={b.id}
              className="av-row-hover"
              onClick={() => router.push(`/admin?tab=bookings&booking=${b.id}`)}
              style={{
                display: 'grid',
                gridTemplateColumns: BK_COLS,
                gap: 12,
                padding: '15px 18px',
                borderBottom: '1px solid rgba(255,255,255,.05)',
                alignItems: 'center',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ font: '600 12px var(--f-mono)', color: 'var(--d-accent-light)' }}>{b.number}</span>
              <span style={{ font: '600 13px var(--f-ui)', color: 'var(--d-text)' }}>{b.clientName}</span>
              <span style={{ font: '500 13px var(--f-ui)', color: '#C9D4E4' }}>{b.carName}</span>
              <span style={{ font: '500 12px var(--f-ui)', color: 'var(--d-muted)' }}>{period(b.startAt, b.endAt, t.months)}</span>
              <span>
                <StatusPill kind={BOOKING_STATUS_KIND[b.status]} label={statusLabel(b.status, lang)} />
              </span>
              <span style={{ font: '700 13px var(--f-ui)', color: 'var(--d-text-bright)' }}>{money(b.subtotal, b.currency)}</span>
              <span style={{ font: '500 12px var(--f-ui)', color: pay.color }}>{pay.text}</span>
              <span style={{ color: '#5b6f8a' }}>›</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ====================== BOOKING DETAIL ====================== */
const fieldLabel: CSSProperties = { font: '400 10px var(--f-mono)', color: 'var(--d-muted-2)' }
const fieldValue: CSSProperties = { marginTop: 3, font: '500 13px var(--f-ui)', color: 'var(--d-text)' }

const INSURANCE_OPT_KEYS: InsuranceStatus[] = ['ISSUED', 'PENDING', 'CLIENT_DATA_INCOMPLETE', 'NEEDS_EXTRA_CHECK']

/** A small labelled card for the order-detail key-facts strip. */
function KeyFact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ ...PANEL, padding: '14px 16px' }}>
      <div style={{ ...SECTION_LABEL, marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  )
}

type PayStatus = Parameters<typeof setPaymentStatus>[1]
const PENDING_PAY: string[] = ['AWAITING', 'NOT_PAID', 'PARTIAL']
/**
 * Status options are KIND-AWARE: a DEPOSIT can only be held/returned (never PAID/PARTIAL rental
 * income), and a rental payment can never be DEPOSIT_HELD/RETURNED. Offering an incompatible pair
 * would make the money fall outside every finance balance bucket and silently vanish.
 */
function payStatusOptionsFor(kind: string): PayStatus[] {
  return kind === 'DEPOSIT'
    ? ['NOT_PAID', 'AWAITING', 'DEPOSIT_HELD', 'DEPOSIT_RETURNED', 'ERROR', 'CANCELLED']
    : ['NOT_PAID', 'AWAITING', 'PARTIAL', 'PAID', 'ERROR', 'CANCELLED']
}

/**
 * Full-width, roomy payment list for the order detail. Each entry is a spacious row (method · kind ·
 * date | amount | status | receipt/tx | action) so it parses at a glance instead of being crammed
 * into the narrow side column. Pending payments are sorted first and highlighted, with an obvious
 * "Подтвердить оплату" button. Confirmation is staff-only + server-authoritative (setPaymentStatus →
 * requireStaff); the customer has no path to self-confirm.
 */
function PaymentSection({
  payments,
  accounts,
  pending,
  onSetStatus,
}: {
  payments: AdminPaymentLine[]
  accounts: { id: string; name: string }[]
  pending: boolean
  onSetStatus: (id: string, status: PayStatus, accountId?: string | null) => void
}) {
  const isMobile = useIsMobile()
  const t = useDict(dict)
  const [confirmAccount, setConfirmAccount] = useState(accounts[0]?.id ?? '')
  const pendingCount = payments.filter((p) => PENDING_PAY.includes(p.status)).length
  const sorted = [...payments].sort((a, b) => {
    const ap = PENDING_PAY.includes(a.status) ? 0 : 1
    const bp = PENDING_PAY.includes(b.status) ? 0 : 1
    if (ap !== bp) return ap - bp
    return a.createdAt < b.createdAt ? 1 : -1
  })
  return (
    <div style={{ ...PANEL, padding: isMobile ? '18px 16px' : '22px 24px', marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={SECTION_LABEL}>{t.payTitle}</div>
        <span style={{ font: '700 11px var(--f-ui)', color: 'var(--d-muted)', background: 'var(--d-el)', borderRadius: 999, padding: '2px 9px' }}>{payments.length}</span>
        {pendingCount > 0 && (
          <span style={{ font: '700 11px var(--f-ui)', color: '#E7B463', background: 'rgba(224,162,62,.14)', border: '1px solid rgba(224,162,62,.32)', borderRadius: 999, padding: '3px 11px' }}>
            ⏳ {t.awaitingConfirm(pendingCount)}
          </span>
        )}
        {pendingCount > 0 && accounts.length > 0 && (
          <label style={{ marginLeft: isMobile ? 0 : 'auto', width: isMobile ? '100%' : undefined, display: 'flex', alignItems: 'center', gap: 8, font: '600 11px var(--f-ui)', color: 'var(--d-muted)' }}>
            {t.creditToAccount}
            <select value={confirmAccount} onChange={(e) => setConfirmAccount(e.target.value)} disabled={pending}
              style={{ flex: isMobile ? 1 : undefined, padding: '7px 9px', borderRadius: 8, border: '1px solid rgba(255,255,255,.16)', background: 'var(--d-base)', color: 'var(--d-text)', font: '600 11px var(--f-ui)', cursor: 'pointer' }}>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
        )}
      </div>

      {payments.length === 0 ? (
        <div style={{ font: '500 13px var(--f-ui)', color: 'var(--d-muted-2)', padding: '8px 0' }}>{t.noPayments}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sorted.map((p) => {
            const isPending = PENDING_PAY.includes(p.status)
            const k = PAYMENT_STATUS_KIND[p.status]
            const accent = isPending ? '#E0A23E' : KIND_COLORS[k].dot
            return (
              <div
                key={p.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? '1fr auto'
                    : 'minmax(150px,1.3fr) minmax(120px,0.9fr) minmax(120px,auto) minmax(230px,1.6fr)',
                  gap: isMobile ? 12 : 18,
                  alignItems: 'center',
                  padding: isMobile ? '14px 14px' : '16px 18px',
                  borderRadius: 12,
                  background: isPending ? 'rgba(224,162,62,.07)' : 'var(--d-el)',
                  border: `1px solid ${isPending ? 'rgba(224,162,62,.32)' : 'rgba(255,255,255,.07)'}`,
                  borderLeft: `3px solid ${accent}`,
                }}
              >
                {/* method · kind · date */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ font: '700 14px var(--f-ui)', color: 'var(--d-text)' }}>{t.paymentMethod[p.method]}</div>
                  <div style={{ marginTop: 3, font: '500 11px var(--f-ui)', color: 'var(--d-muted)' }}>
                    {t.paymentKind[p.kind]} · {dateShort(p.createdAt)}
                  </div>
                </div>
                {/* amount */}
                <div style={isMobile ? { textAlign: 'right' } : undefined}>
                  <div style={{ font: '800 18px var(--f-display)', color: 'var(--d-text-bright)' }}>{money(p.amount, p.currency)}</div>
                  <div style={{ font: '400 10px var(--f-mono)', letterSpacing: '.08em', color: 'var(--d-muted-2)' }}>{p.currency}</div>
                </div>
                {/* status */}
                <div style={isMobile ? { gridColumn: '1 / -1' } : undefined}>
                  <StatusPill kind={k} label={t.paymentStatus[p.status]} />
                  {p.accountName && <div style={{ marginTop: 4, font: '600 10px var(--f-ui)', color: 'var(--d-muted-2)' }}>→ {p.accountName}</div>}
                </div>
                {/* receipt / tx + actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'flex-start' : 'flex-end', gap: 10, flexWrap: 'wrap', ...(isMobile ? { gridColumn: '1 / -1' } : null) }}>
                  {p.txHash && (
                    <span title={p.txHash} style={{ font: '600 10px var(--f-mono)', color: '#C9D4E4', background: 'var(--d-base)', borderRadius: 7, padding: '4px 8px' }}>
                      {p.txHash.slice(0, 6)}…{p.txHash.slice(-4)}
                    </span>
                  )}
                  {p.proofDocId && (
                    <a
                      href={`/api/documents/${p.proofDocId}`}
                      target="_blank"
                      rel="noreferrer"
                      className={isMobile ? 'av-tap' : undefined}
                      style={{ display: 'inline-flex', alignItems: 'center', padding: isMobile ? '10px 14px' : '6px 11px', borderRadius: 8, border: '1px solid rgba(255,255,255,.16)', background: 'var(--d-base)', color: '#C9D4E4', font: '700 11px var(--f-ui)', textDecoration: 'none', whiteSpace: 'nowrap' }}
                    >
                      📎 {t.receipt}
                    </a>
                  )}
                  {isPending && (
                    <button
                      type="button"
                      className={isMobile ? 'av-tap' : undefined}
                      // A deposit is confirmed as HELD (a liability we keep), not as PAID rental income —
                      // otherwise the finance module would count it as neither income nor deposit-held.
                      onClick={() => onSetStatus(p.id, p.kind === 'DEPOSIT' ? 'DEPOSIT_HELD' : 'PAID', confirmAccount || null)}
                      disabled={pending}
                      style={{ flex: isMobile ? '1 1 auto' : undefined, padding: isMobile ? '12px 18px' : '9px 16px', borderRadius: 9, border: 'none', background: 'linear-gradient(180deg,#8FD7AD,#4FB985)', color: '#082A33', font: '700 12px var(--f-ui)', cursor: pending ? 'wait' : 'pointer', opacity: pending ? 0.6 : 1, whiteSpace: 'nowrap' }}
                    >
                      ✓ {p.kind === 'DEPOSIT' ? t.btnDepositReceived : t.btnConfirmPayment}
                    </button>
                  )}
                  <select
                    value={p.status}
                    onChange={(e) => onSetStatus(p.id, e.target.value as PayStatus)}
                    disabled={pending}
                    title={t.changePaymentStatus}
                    style={{ flex: isMobile ? '1 1 auto' : undefined, padding: isMobile ? '11px 12px' : '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.16)', background: 'var(--d-base)', color: 'var(--d-text)', font: '600 11px var(--f-ui)', cursor: pending ? 'wait' : 'pointer' }}
                  >
                    {payStatusOptionsFor(p.kind).map((s) => (
                      <option key={s} value={s}>{t.paymentStatus[s]}</option>
                    ))}
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function BookingDetail({ detail }: { detail: AdminBookingDetail }) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const t = useDict(dict)
  const { lang } = useLang()
  const [pending, startTransition] = useTransition()
  const [insurance, setInsurance] = useState<InsuranceStatus>(detail.insurance?.status ?? 'PENDING')
  const [comment, setComment] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const clientName = [detail.client.firstName, detail.client.lastName].filter(Boolean).join(' ') || detail.client.email
  const paidCurrency = detail.currency

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg?: string) => {
    setMsg(null)
    startTransition(async () => {
      const res = await fn()
      if (res.ok) {
        setMsg(okMsg ?? t.msgSaved)
        router.refresh()
      } else {
        setMsg(res.error ?? t.msgError)
      }
    })
  }

  const changeInsurance = (status: InsuranceStatus) => {
    setInsurance(status)
    run(() => setInsuranceStatus(detail.id, status), t.msgInsuranceUpdated)
  }

  const submitComment = () => {
    if (!comment.trim()) return
    run(() => addBookingComment(detail.id, comment.trim()), t.msgCommentAdded)
    setComment('')
  }

  const setStatus = (to: BookingStatus, statusComment?: string) => {
    run(() => setBookingStatus(detail.id, to, statusComment), t.msgStatusUpdated)
  }

  const reviewDoc = (id: string, status: 'VERIFIED' | 'REJECTED') => {
    const reason = status === 'REJECTED' ? window.prompt(t.promptRejectReason) ?? undefined : undefined
    run(() => reviewDocument(id, status, reason), status === 'VERIFIED' ? t.msgDocApproved : t.msgDocRejected)
  }
  const purgeDocs = (userId: string) => {
    if (!window.confirm(t.confirmPurgeDocs)) return
    run(() => purgeCustomerDocsAction(userId).then((r) => ({ ok: r.ok })), t.msgDocsPurged)
  }

  const vStatus = derivedVerifStatus(detail.client.reviewDocs)
  const vLabel =
    vStatus === 'APPROVED' ? t.verifApproved
    : vStatus === 'PENDING' ? t.verifPending
    : vStatus === 'REJECTED' ? t.verifRejected
    : vStatus === 'RESUBMISSION' ? t.verifResubmission
    : t.verifNone
  const clientFields = [
    {
      label: t.fieldVerification,
      value: `${vLabel}${detail.client.verifiedAt ? ` · ${dateShort(detail.client.verifiedAt)}` : ''}${detail.client.verificationReason ? ` · ${detail.client.verificationReason}` : ''}`,
    },
    { label: t.fieldEmail, value: detail.client.email },
    { label: t.fieldPhone, value: detail.client.phone ?? '—' },
    { label: t.fieldWhatsapp, value: detail.client.whatsapp ?? detail.client.telegram ?? '—' },
    { label: t.fieldPassport, value: detail.client.passportNo ?? '—' },
    {
      label: t.fieldLicense,
      value: detail.client.licenseNo
        ? `${detail.client.licenseNo}${detail.client.licenseCountry ? ` · ${detail.client.licenseCountry}` : ''}`
        : '—',
    },
    {
      label: t.fieldLicensePeriod,
      value:
        detail.client.licenseIssue || detail.client.licenseExpiry
          ? `${dateShort(detail.client.licenseIssue)} – ${dateShort(detail.client.licenseExpiry)}`
          : '—',
    },
    { label: t.fieldPassportExpiry, value: detail.client.passportExpiry ? dateShort(detail.client.passportExpiry) : '—' },
    {
      label: t.fieldAddress,
      value: detail.client.addressLine ?? detail.client.addressCity ?? detail.client.addressCountry ?? '—',
    },
  ]

  const pickupTitle =
    detail.pickupKind === 'AIRPORT'
      ? t.airportAntalya
      : detail.pickupCity || detail.pickupAddress || t.pickupAddressDefault
  const pickupSub =
    [detail.pickupAddress, detail.pickupDistrict, detail.pickupComment].filter(Boolean).join(' · ') || '—'

  // Booking-level payment summary (for the scannable key-facts strip).
  const fullyPaid = detail.subtotal > 0 && detail.balanceAmount <= 0
  const payKind: StatusKind = fullyPaid ? 'green' : detail.prepaidAmount > 0 ? 'amber' : 'red'
  const payLabel = fullyPaid ? t.payPaid : detail.prepaidAmount > 0 ? t.payPartial : t.payUnpaid
  const vKind: StatusKind =
    vStatus === 'APPROVED' ? 'green' : vStatus === 'PENDING' ? 'amber' : vStatus === 'NONE' ? 'grey' : 'red'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <Link
          href="/admin?tab=bookings"
          style={{ font: '600 13px var(--f-ui)', color: 'var(--d-accent)', cursor: 'pointer', textDecoration: 'none' }}
        >
          {t.backToList}
        </Link>
        {msg && <span style={{ font: '500 12px var(--f-ui)', color: pending ? 'var(--d-muted)' : '#8FD7AD' }}>{msg}</span>}
      </div>

      {/* PROMINENT STATUS CONTROL — the main thing the owner does here */}
      <div style={{ marginBottom: 18 }}>
        <OrderStatusControl status={detail.status} number={detail.number} pending={pending} onSetStatus={setStatus} />
      </div>

      {/* KEY FACTS — scannable summary of the frequently-needed info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14, marginBottom: 18 }}>
        <KeyFact label={t.kfClient}>
          <div style={{ font: '700 15px var(--f-ui)', color: 'var(--d-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clientName}</div>
          <div style={{ marginTop: 3, font: '500 12px var(--f-ui)', color: 'var(--d-muted)' }}>{detail.client.phone ?? detail.client.email}</div>
          <div style={{ marginTop: 8 }}><StatusPill kind={vKind} label={vLabel} /></div>
        </KeyFact>
        <KeyFact label={t.kfCar}>
          <div style={{ font: '700 15px var(--f-ui)', color: 'var(--d-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{detail.car.brand} {detail.car.model}</div>
          <div style={{ marginTop: 3, font: '500 12px var(--f-ui)', color: 'var(--d-muted)' }}>{detail.car.clsLabel} · {detail.car.year}</div>
        </KeyFact>
        <KeyFact label={t.kfRentalPeriod}>
          <div style={{ font: '700 15px var(--f-ui)', color: 'var(--d-text)' }}>{period(detail.startAt, detail.endAt, t.months)}</div>
          <div style={{ marginTop: 3, font: '500 12px var(--f-ui)', color: 'var(--d-muted)' }}>{detail.days} {t.daysUnit} · {detail.returnSameAsPickup ? 'AYT → AYT' : `${detail.pickupCity ?? 'AYT'} → ${detail.returnCity ?? '—'}`}</div>
        </KeyFact>
        <KeyFact label={t.kfPayment}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ font: '700 15px var(--f-ui)', color: 'var(--d-text)' }}>{money(detail.prepaidAmount, paidCurrency)}</span>
            <StatusPill kind={payKind} label={payLabel} />
          </div>
          <div style={{ marginTop: 3, font: '500 12px var(--f-ui)', color: 'var(--d-muted)' }}>{t.balanceDeposit(money(detail.balanceAmount, paidCurrency), money(detail.depositAmount, paidCurrency))}</div>
        </KeyFact>
      </div>

      <div style={{ display: 'flex', gap: isMobile ? 16 : 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* LEFT COLUMN */}
        <div style={{ flex: 1, minWidth: 0, width: isMobile ? '100%' : undefined, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Client */}
          <div style={{ ...PANEL, padding: '22px 24px' }}>
            <div style={{ ...SECTION_LABEL, marginBottom: 16 }}>{t.kfClient}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg,#125060,#0E3A45)',
                  border: '1px solid rgba(255,122,92,.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  font: '600 16px var(--f-ui)',
                  color: 'var(--d-accent-light)',
                }}
              >
                {initialsOf(clientName)}
              </div>
              <div>
                <div style={{ font: '600 18px var(--f-ui)', color: 'var(--d-text)' }}>{clientName}</div>
                <div style={{ font: '400 12px var(--f-ui)', color: 'var(--d-muted)' }}>
                  {[
                    detail.client.citizenship,
                    detail.client.birthDate ? dateShort(detail.client.birthDate) : null,
                    detail.client.phone,
                  ]
                    .filter(Boolean)
                    .join(' · ') || detail.client.email}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: 14 }}>
              {clientFields.map((f) => (
                <div key={f.label} style={{ minWidth: 0 }}>
                  <div style={fieldLabel}>{f.label}</div>
                  <div style={{ ...fieldValue, wordBreak: 'break-word' }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Documents & identity verification — collapsed unless a decision is needed */}
          <Collapsible
            title={t.collapseDocsTitle}
            count={t.filesCount(detail.documents.length + detail.idDocuments.length)}
            defaultOpen={['PENDING', 'REJECTED', 'RESUBMISSION'].includes(vStatus)}
            accent={KIND_COLORS[vKind].dot}
          >
            {/* Documents */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {detail.documents.length === 0 && (
                <div style={{ font: '400 12px var(--f-ui)', color: 'var(--d-muted-2)' }}>{t.docsNotUploaded}</div>
              )}
              {detail.documents.map((d) => (
                <DocCardView key={d.id} doc={d} pending={pending} onReview={reviewDoc} />
              ))}
            </div>

            {/* Verified government-ID images (Sumsub) — served ONLY via the gated /api/documents route */}
            {detail.idDocuments.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={SECTION_LABEL}>{t.sumsubDocsTitle}</div>
                  <button type="button" onClick={() => purgeDocs(detail.client.id)} disabled={pending} style={{ padding: '5px 11px', borderRadius: 8, border: '1px solid rgba(224,69,69,.3)', background: 'rgba(224,69,69,.10)', color: 'var(--d-red)', font: '700 10px var(--f-ui)', cursor: pending ? 'wait' : 'pointer' }}>
                    {t.btnDeleteStorage}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {detail.idDocuments.map((d) => (
                    <a key={d.id} href={`/api/documents/${d.id}`} target="_blank" rel="noreferrer" style={{ display: 'block', width: 118, textDecoration: 'none' }}>
                      {/(jpeg|jpg|png|webp)/i.test(d.mime) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/api/documents/${d.id}`} alt={d.type} style={{ width: 118, height: 82, objectFit: 'cover', borderRadius: 9, border: '1px solid rgba(255,255,255,.1)' }} />
                      ) : (
                        <div style={{ width: 118, height: 82, borderRadius: 9, border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--d-card)', font: '700 11px var(--f-ui)', color: 'var(--d-muted)' }}>PDF</div>
                      )}
                      <div style={{ marginTop: 4, font: '600 10px var(--f-ui)', color: 'var(--d-muted)' }}>{d.type}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Per-document verification decision — staff-only approve/reject + expiry, each doc independently */}
            <div style={{ marginTop: 18 }}>
              <div style={SECTION_LABEL}>{t.perDocDecisionTitle}</div>
              <VerificationReview docs={detail.client.reviewDocs} />
            </div>
          </Collapsible>

          {/* Pickup address + Trip goal/interests */}
          <div style={{ display: 'flex', gap: 16, flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ ...PANEL, flex: 1, minWidth: 0, padding: '22px 24px' }}>
              <div style={{ ...SECTION_LABEL, marginBottom: 14 }}>{t.pickupAddressLabel}</div>
              <div style={{ font: '600 14px var(--f-ui)', color: 'var(--d-text)' }}>{pickupTitle}</div>
              <div style={{ marginTop: 4, font: '400 12px/1.5 var(--f-ui)', color: 'var(--d-muted)' }}>{pickupSub}</div>
              {/* mini map placeholder */}
              <div
                style={{
                  marginTop: 12,
                  position: 'relative',
                  height: 120,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,.08)',
                  background:
                    'linear-gradient(rgba(11,26,46,.5),rgba(11,26,46,.5)),repeating-linear-gradient(0deg,#0d3a44 0 1px,transparent 1px 26px),repeating-linear-gradient(90deg,#0d3a44 0 1px,transparent 1px 26px),#0a313b',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '55%',
                    transform: 'translate(-50%,-100%)',
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: 'var(--d-accent)',
                    border: '3px solid #082A33',
                    boxShadow: '0 0 0 4px rgba(255,122,92,.25)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: 8,
                    bottom: 6,
                    font: '400 9px var(--f-mono)',
                    color: 'rgba(255,255,255,.4)',
                  }}
                >
                  [ Google Maps ]
                </div>
              </div>
            </div>

            <div style={{ ...PANEL, flex: 1, minWidth: 0, padding: '22px 24px' }}>
              <div style={{ ...SECTION_LABEL, marginBottom: 14 }}>{t.tripGoalTitle}</div>
              {detail.tripGoal || detail.smart ? (
                <>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      borderRadius: 999,
                      background: 'rgba(255,122,92,.14)',
                      color: 'var(--d-accent-light)',
                      font: '600 12px var(--f-ui)',
                    }}
                  >
                    {t.tripGoal[detail.smart?.tripGoal ?? detail.tripGoal ?? 'OTHER']}
                  </div>
                  <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {(detail.smart?.needs ?? []).map((it) => (
                      <span
                        key={it}
                        style={{
                          padding: '6px 11px',
                          borderRadius: 8,
                          background: 'var(--d-el)',
                          color: '#C9D4E4',
                          font: '500 11px var(--f-ui)',
                        }}
                      >
                        {it}
                      </span>
                    ))}
                  </div>
                  {detail.smart?.notes && (
                    <div style={{ marginTop: 14, font: '400 12px/1.5 var(--f-ui)', color: 'var(--d-muted)' }}>
                      {detail.smart.notes}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ font: '400 12px var(--f-ui)', color: 'var(--d-muted-2)' }}>{t.tripGoalNotSet}</div>
              )}
            </div>
          </div>

          {/* Insurance */}
          <div style={{ ...PANEL, padding: '22px 24px' }}>
            <div style={{ ...SECTION_LABEL, marginBottom: 14 }}>{t.insuranceLabel}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ font: '600 14px var(--f-ui)', color: 'var(--d-text)' }}>
                {detail.insurance
                  ? `${t.insuranceType[detail.insurance.type]} · ${money(detail.insurance.price, paidCurrency)}`
                  : t.insuranceNotIssued}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {INSURANCE_OPT_KEYS.map((k) => {
                  const on = insurance === k
                  return (
                    <button
                      key={k}
                      className={isMobile ? 'av-tap' : undefined}
                      disabled={pending || !detail.insurance}
                      onClick={() => changeInsurance(k)}
                      style={{
                        padding: isMobile ? '11px 16px' : '7px 12px',
                        borderRadius: 8,
                        background: on ? 'rgba(111,191,143,.14)' : 'transparent',
                        border: on ? '1px solid transparent' : '1px solid rgba(255,255,255,.12)',
                        color: on ? '#8FD7AD' : 'var(--d-muted)',
                        font: on ? '600 11px var(--f-ui)' : '500 11px var(--f-ui)',
                        cursor: pending || !detail.insurance ? 'default' : 'pointer',
                        opacity: !detail.insurance ? 0.5 : 1,
                      }}
                    >
                      {t.insuranceOpt[k]}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Admin comment */}
          <div style={{ ...PANEL, padding: '22px 24px' }}>
            <div style={{ ...SECTION_LABEL, marginBottom: 14 }}>{t.adminCommentTitle}</div>
            {detail.adminComment && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#FFB48A,#FF7A5C)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ background: 'var(--d-el)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ font: '500 12px var(--f-ui)', color: 'var(--d-text)' }}>{detail.adminComment}</div>
                </div>
              </div>
            )}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t.commentPlaceholder}
              rows={2}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                resize: 'vertical',
                background: 'var(--d-base)',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 10,
                padding: '12px 14px',
                font: '400 13px var(--f-ui)',
                color: 'var(--d-text)',
                outline: 'none',
              }}
            />
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={submitComment}
                disabled={pending || !comment.trim()}
                style={{
                  ...CORAL_BTN,
                  padding: '9px 18px',
                  font: '700 12px var(--f-ui)',
                  opacity: pending || !comment.trim() ? 0.6 : 1,
                }}
              >
                {t.send}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ width: isMobile ? '100%' : 340, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Booking summary */}
          <div style={{ ...PANEL, padding: 22 }}>
            <div style={{ ...SECTION_LABEL, marginBottom: 14 }}>{t.bookingLabel}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 60,
                  height: 44,
                  borderRadius: 8,
                  background: detail.car ? undefined : 'repeating-linear-gradient(135deg,#114451 0 8px,#125060 8px 16px)',
                  backgroundImage: 'repeating-linear-gradient(135deg,#114451 0 8px,#125060 8px 16px)',
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ font: '600 14px var(--f-ui)', color: 'var(--d-text)' }}>
                  {detail.car.brand} {detail.car.model}
                </div>
                <div style={{ font: '400 11px var(--f-ui)', color: 'var(--d-muted)' }}>
                  {detail.car.clsLabel} · {detail.car.year}
                </div>
              </div>
            </div>
            <SummaryRow label={t.rowPeriod} value={`${period(detail.startAt, detail.endAt, t.months)} · ${detail.days} ${t.daysUnit}`} />
            <SummaryRow
              label={t.rowPickupReturn}
              value={detail.returnSameAsPickup ? 'AYT → AYT' : `${detail.pickupCity ?? 'AYT'} → ${detail.returnCity ?? '—'}`}
              last
            />
            {detail.extras.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.08)' }}>
                <div style={{ font: '400 10px var(--f-mono)', color: 'var(--d-muted-2)', marginBottom: 8 }}>{t.servicesLabel}</div>
                {detail.extras.map((e) => (
                  <SummaryRow key={e.id} label={`${e.name}${e.qty > 1 ? ` ×${e.qty}` : ''}`} value={money(e.total, paidCurrency)} />
                ))}
              </div>
            )}
          </div>

          {/* Payment summary */}
          <div style={{ ...PANEL, padding: 22 }}>
            <div style={{ ...SECTION_LABEL, marginBottom: 14 }}>{t.kfPayment}</div>
            <SummaryRow label={t.rowRent} value={money(detail.rentTotal, paidCurrency)} />
            <SummaryRow label={t.rowServices} value={money(detail.extrasTotal, paidCurrency)} />
            <SummaryRow label={t.rowInsurance} value={money(detail.insuranceTotal, paidCurrency)} />
            <SummaryRow label={t.rowTotal} value={money(detail.subtotal, paidCurrency)} />
            <SummaryRow label={t.rowPrepay} value={t.paidSuffix(money(detail.prepaidAmount, paidCurrency))} valueColor="#8FD7AD" />
            <SummaryRow label={t.rowBalance} value={money(detail.balanceAmount, paidCurrency)} />
            <SummaryRow label={t.rowDeposit} value={money(detail.depositAmount, paidCurrency)} last />
          </div>

          {/* Status history — collapsible */}
          {detail.statusHistory.length > 0 && (
            <Collapsible title={t.statusHistoryTitle} count={`${detail.statusHistory.length}`}>
              <div>
                {detail.statusHistory.map((s) => (
                  <div key={s.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <StatusPill kind={BOOKING_STATUS_KIND[s.status]} label={statusLabel(s.status, lang)} />
                      <span style={{ font: '400 10px var(--f-mono)', color: 'var(--d-muted-2)' }}>{dateShort(s.createdAt)}</span>
                    </div>
                    {s.comment && (
                      <div style={{ marginTop: 4, font: '400 11px var(--f-ui)', color: 'var(--d-muted)' }}>{s.comment}</div>
                    )}
                  </div>
                ))}
              </div>
            </Collapsible>
          )}
        </div>
      </div>

      {/* Payments — full-width, roomy (moved out of the cramped side column) */}
      <PaymentSection
        payments={detail.payments}
        accounts={detail.accounts}
        pending={pending}
        onSetStatus={(id, s, acc) => run(() => setPaymentStatus(id, s, acc), t.msgPaymentStatusUpdated)}
      />
    </div>
  )
}

function DocCardView({
  doc,
  pending,
  onReview,
}: {
  doc: AdminDocument
  pending: boolean
  onReview: (id: string, status: 'VERIFIED' | 'REJECTED') => void
}) {
  const isMobile = useIsMobile()
  const t = useDict(dict)
  const verified = doc.status === 'VERIFIED'
  const rejected = doc.status === 'REJECTED'
  const tone = verified ? '#8FD7AD' : rejected ? '#E58A8A' : '#E7B463'
  const border = verified
    ? '1px solid rgba(111,191,143,.4)'
    : rejected
      ? '1px solid rgba(206,74,74,.4)'
      : '1px dashed rgba(224,162,62,.5)'
  const bg = verified ? 'rgba(111,191,143,.06)' : rejected ? 'rgba(206,74,74,.06)' : 'rgba(224,162,62,.06)'
  return (
    <div style={{ flex: '1 1 140px', border, background: bg, borderRadius: 10, padding: 12, textAlign: 'center' }}>
      <Link
        href={`/api/documents/${doc.id}`}
        target="_blank"
        style={{ textDecoration: 'none', font: '600 13px var(--f-ui)', color: tone }}
      >
        {t.docType[doc.type]}
      </Link>
      <div style={{ font: '400 10px var(--f-mono)', color: 'var(--d-muted-2)', marginTop: 3, wordBreak: 'break-all' }}>
        {doc.filename}
      </div>
      <div style={{ marginTop: 4, font: '500 10px var(--f-ui)', color: tone }}>{t.docStatus[doc.status]}</div>
      {doc.rejectionReason && (
        <div style={{ marginTop: 2, font: '400 10px var(--f-ui)', color: '#E58A8A' }}>{doc.rejectionReason}</div>
      )}
      <div style={{ marginTop: 8, display: 'flex', gap: isMobile ? 8 : 6, justifyContent: 'center' }}>
        <button
          onClick={() => onReview(doc.id, 'VERIFIED')}
          disabled={pending || verified}
          className={isMobile ? 'av-tap' : undefined}
          style={{
            flex: isMobile ? 1 : undefined,
            padding: isMobile ? '10px 12px' : '5px 10px',
            borderRadius: 7,
            border: '1px solid rgba(111,191,143,.4)',
            background: 'transparent',
            color: '#8FD7AD',
            font: '600 10px var(--f-ui)',
            cursor: pending || verified ? 'default' : 'pointer',
            opacity: verified ? 0.5 : 1,
          }}
        >
          {t.btnVerify}
        </button>
        <button
          onClick={() => onReview(doc.id, 'REJECTED')}
          disabled={pending || rejected}
          className={isMobile ? 'av-tap' : undefined}
          style={{
            flex: isMobile ? 1 : undefined,
            padding: isMobile ? '10px 12px' : '5px 10px',
            borderRadius: 7,
            border: '1px solid rgba(206,74,74,.4)',
            background: 'transparent',
            color: '#E58A8A',
            font: '600 10px var(--f-ui)',
            cursor: pending || rejected ? 'default' : 'pointer',
            opacity: rejected ? 0.5 : 1,
          }}
        >
          {t.btnReject}
        </button>
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  valueColor,
  last,
}: {
  label: string
  value: string
  valueColor?: string
  last?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        font: '500 12px var(--f-ui)',
        color: 'var(--d-text)',
        marginBottom: last ? 0 : 7,
      }}
    >
      <span style={{ color: 'var(--d-muted)' }}>{label}</span>
      <span style={valueColor ? { color: valueColor } : undefined}>{value}</span>
    </div>
  )
}

/* ====================== CARS ====================== */
const CAR_COLS = '56px 1.7fr 118px 96px 90px 118px 170px'
const ROW_BTN: CSSProperties = {
  padding: '6px 12px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,.14)',
  background: 'var(--d-el)',
  color: 'var(--d-text)',
  font: '600 12px var(--f-ui)',
  cursor: 'pointer',
}

type CarFormState = {
  brand: string
  model: string
  year: string
  class: CarClass
  gearbox: Gearbox
  fuel: Fuel
  seats: string
  doors: string
  airConditioning: boolean
  pricePerDay: string
  deposit: string
  mileageLimitPerDay: string
  minRentalDays: string
  prepHoursBetween: string
  active: boolean
}

function emptyCarForm(): CarFormState {
  return {
    brand: '',
    model: '',
    year: String(new Date().getFullYear()),
    class: 'BUSINESS',
    gearbox: 'AUTOMATIC',
    fuel: 'PETROL',
    seats: '5',
    doors: '4',
    airConditioning: true,
    pricePerDay: '',
    deposit: '',
    mileageLimitPerDay: '',
    minRentalDays: '1',
    prepHoursBetween: '3',
    active: true,
  }
}

function carToForm(c: AdminCar): CarFormState {
  return {
    brand: c.brand,
    model: c.model,
    year: String(c.year),
    class: c.cls,
    gearbox: c.gearbox,
    fuel: c.fuel,
    seats: String(c.seats),
    doors: String(c.doors),
    airConditioning: c.airConditioning,
    pricePerDay: String(c.pricePerDay),
    deposit: String(c.deposit),
    mileageLimitPerDay: c.mileageLimitPerDay != null ? String(c.mileageLimitPerDay) : '',
    minRentalDays: String(c.minRentalDays),
    prepHoursBetween: String(c.prepHoursBetween),
    active: c.active,
  }
}

function CarsView({ cars }: { cars: AdminCar[] }) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const t = useDict(dict)
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState<AdminCar | 'new' | null>(null)
  const [form, setForm] = useState<CarFormState>(emptyCarForm())
  const [err, setErr] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden'>('all')

  const q = query.trim().toLowerCase()
  const filtered = cars.filter((c) => {
    const matchesQuery = !q || `${c.brand} ${c.model}`.toLowerCase().includes(q)
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? c.active : !c.active)
    return matchesQuery && matchesStatus
  })

  const openNew = () => {
    setForm(emptyCarForm())
    setEditing('new')
    setErr(null)
    setFieldErrors({})
  }
  const openEdit = (c: AdminCar) => {
    setForm(carToForm(c))
    setEditing(c)
    setErr(null)
    setFieldErrors({})
  }

  const toggle = (c: AdminCar) => {
    startTransition(async () => {
      await toggleCarActive(c.id, !c.active)
      router.refresh()
    })
  }

  const remove = (c: AdminCar) => {
    if (!window.confirm(t.confirmDeleteCar(`${c.brand} ${c.model}`))) return
    startTransition(async () => {
      const res = await deleteCar(c.id)
      if (!res.ok) window.alert(res.error ?? t.errDeleteFailed)
      router.refresh()
    })
  }

  const save = () => {
    setErr(null)
    setFieldErrors({})
    const isNew = editing === 'new'
    const payload = {
      brand: form.brand.trim(),
      model: form.model.trim(),
      year: Number(form.year),
      class: form.class,
      gearbox: form.gearbox,
      fuel: form.fuel,
      seats: Number(form.seats),
      doors: Number(form.doors),
      airConditioning: form.airConditioning,
      pricePerDay: Number(form.pricePerDay),
      deposit: Number(form.deposit),
      mileageLimitPerDay: form.mileageLimitPerDay.trim() === '' ? null : Number(form.mileageLimitPerDay),
      minRentalDays: Number(form.minRentalDays),
      prepHoursBetween: Number(form.prepHoursBetween),
      active: form.active,
    }
    const label = `${form.brand} ${form.model}`.trim() || t.carFallback
    startTransition(async () => {
      const res = await upsertCar(isNew ? null : (editing as AdminCar).id, payload)
      if (res.ok) {
        setSavedMsg(isNew ? t.savedCarAdded(label) : t.savedCarUpdated(label))
        setEditing(null)
        router.refresh()
        window.setTimeout(() => setSavedMsg(null), 4000)
      } else {
        setFieldErrors(res.fieldErrors ?? {})
        setErr(
          res.error ??
            (res.fieldErrors && Object.keys(res.fieldErrors).length
              ? t.errCheckFields
              : t.errSaveFailed),
        )
      }
    })
  }

  return (
    <div>
      {savedMsg && (
        <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(111,191,143,.12)', border: '1px solid rgba(111,191,143,.3)', font: '600 12px var(--f-ui)', color: 'var(--d-green)' }}>
          {savedMsg}
        </div>
      )}

      {editing ? (
        <CarForm
          form={form}
          setForm={setForm}
          onCancel={() => setEditing(null)}
          onSave={save}
          pending={pending}
          err={err}
          fieldErrors={fieldErrors}
          isNew={editing === 'new'}
          car={editing === 'new' ? null : editing}
        />
      ) : (
        <>
      {/* Toolbar — search · status filter · add */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--d-muted-2)', font: '400 14px var(--f-ui)', pointerEvents: 'none' }}>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchCarPlaceholder}
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 30px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'var(--d-card)', color: 'var(--d-text)', font: '500 13px var(--f-ui)', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(
            [
              ['all', t.filterAll(cars.length)],
              ['active', t.filterActive(cars.filter((c) => c.active).length)],
              ['hidden', t.filterHidden(cars.filter((c) => !c.active).length)],
            ] as const
          ).map(([key, lbl]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              style={{
                padding: '8px 13px',
                borderRadius: 9,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                border: statusFilter === key ? '1px solid var(--d-accent)' : '1px solid rgba(255,255,255,.1)',
                background: statusFilter === key ? 'rgba(255,122,92,.14)' : 'transparent',
                color: statusFilter === key ? 'var(--d-accent-light)' : 'var(--d-muted)',
                font: '600 12px var(--f-ui)',
              }}
            >
              {lbl}
            </button>
          ))}
        </div>
        <button onClick={openNew} style={{ ...CORAL_BTN, padding: '11px 20px', marginLeft: 'auto' }}>
          {t.btnAddCar}
        </button>
      </div>

      {/* List — on mobile the wide action columns stay reachable by scrolling the list itself. */}
      <div style={{ ...PANEL, overflow: 'hidden' }}>
       <div className={isMobile ? 'av-xscroll' : undefined}>
        <div style={{ display: 'grid', gridTemplateColumns: CAR_COLS, minWidth: isMobile ? 720 : undefined, gap: 14, padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,.08)', background: 'var(--d-card)', font: '400 10px var(--f-mono)', letterSpacing: '.1em', color: 'var(--d-muted-2)', alignItems: 'center' }}>
          <span>{t.colPhoto}</span>
          <span>{t.colCar}</span>
          <span>{t.colClass}</span>
          <span>{t.colPricePerDay}</span>
          <span>{t.colDeposit}</span>
          <span>{t.colStatus}</span>
          <span style={{ textAlign: 'right' }}>{t.colActions}</span>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: '28px 18px', textAlign: 'center', font: '500 13px var(--f-ui)', color: 'var(--d-muted-2)' }}>
            {cars.length === 0 ? t.emptyCarsNone : t.emptyFilter}
          </div>
        ) : (
          filtered.map((c) => (
            <div key={c.id} className="av-row-hover" style={{ display: 'grid', gridTemplateColumns: CAR_COLS, minWidth: isMobile ? 720 : undefined, gap: 14, padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,.05)', alignItems: 'center' }}>
              <div style={{ width: 52, height: 38, borderRadius: 8, overflow: 'hidden', background: 'linear-gradient(135deg,#114451,#0e3a45)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,.06)' }}>
                {c.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5b7f88" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l1.6-4.6A2 2 0 018.5 7h7a2 2 0 011.9 1.4L19 13v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H8v1a1 1 0 01-1 1H6a1 1 0 01-1-1z" />
                    <circle cx="8" cy="16" r="0.7" />
                    <circle cx="16" cy="16" r="0.7" />
                  </svg>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ font: '600 14px var(--f-ui)', color: 'var(--d-text-bright)' }}>
                  {c.brand} {c.model}
                </div>
                <div style={{ font: '400 11px var(--f-ui)', color: 'var(--d-muted-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.year} · {t.gearbox[c.gearbox]} · {t.fuel[c.fuel]} · {c.seats} {t.seatsUnit}{c.airConditioning ? ' · A/C' : ''}
                </div>
              </div>
              <span style={{ font: '500 12px var(--f-ui)', color: '#C9D4E4' }}>{t.carClass[c.cls]}</span>
              <span style={{ font: '700 14px var(--f-ui)', color: 'var(--d-text-bright)' }}>€{c.pricePerDay}</span>
              <span style={{ font: '500 13px var(--f-ui)', color: 'var(--d-muted)' }}>€{c.deposit}</span>
              <span>
                <StatusPill kind={c.active ? 'green' : 'grey'} label={c.active ? t.statusActiveM : t.statusHiddenM} />
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                <Toggle on={c.active} onClick={() => toggle(c)} disabled={pending} />
                <button onClick={() => openEdit(c)} style={ROW_BTN} title={t.titleEdit}>
                  {t.btnEditShort}
                </button>
                <button onClick={() => remove(c)} style={{ ...ROW_BTN, color: '#E58A8A', borderColor: 'rgba(206,74,74,.35)' }} title={t.actionDelete}>
                  {t.actionDelete}
                </button>
              </div>
            </div>
          ))
        )}
       </div>
      </div>
        </>
      )}
    </div>
  )
}

const formInput: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'var(--d-base)',
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 9,
  padding: '9px 12px',
  font: '500 13px var(--f-ui)',
  color: 'var(--d-text)',
  outline: 'none',
}
function inputErr(hasError?: boolean): CSSProperties {
  return hasError ? { ...formInput, border: '1px solid #CE4A4A' } : formInput
}

/** Labelled field. `basis` sizes it to its content (narrow year, wide model). */
function Field({
  label,
  required,
  error,
  basis,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  basis?: string
  children: ReactNode
}) {
  return (
    <label style={{ display: 'block', flex: basis ?? '1 1 160px', minWidth: 0 }}>
      <div style={{ font: '500 11px var(--f-ui)', color: 'var(--d-muted)', marginBottom: 6 }}>
        {label}
        {required && <span style={{ color: 'var(--d-accent)' }}> *</span>}
      </div>
      {children}
      {error && <div style={{ marginTop: 5, font: '500 11px/1.4 var(--f-ui)', color: '#E58A8A' }}>{error}</div>}
    </label>
  )
}

function SectionCard({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div style={{ background: 'var(--d-card)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
        <span style={{ font: '400 10px var(--f-mono)', letterSpacing: '.14em', color: 'var(--d-accent-light)' }}>{title}</span>
        {hint && <span style={{ font: '400 11px var(--f-ui)', color: 'var(--d-muted-2)' }}>{hint}</span>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>{children}</div>
    </div>
  )
}

function CarForm({
  form,
  setForm,
  onCancel,
  onSave,
  pending,
  err,
  fieldErrors,
  isNew,
  car,
}: {
  form: CarFormState
  setForm: (f: CarFormState) => void
  onCancel: () => void
  onSave: () => void
  pending: boolean
  err: string | null
  fieldErrors: Record<string, string>
  isNew: boolean
  car: AdminCar | null
}) {
  const t = useDict(dict)
  const upd = <K extends keyof CarFormState>(k: K, v: CarFormState[K]) => setForm({ ...form, [k]: v })
  const fe = (key: string): string | undefined => (fieldErrors[key] ? t.carFieldMsg[key] ?? fieldErrors[key] : undefined)

  return (
    <div style={{ ...PANEL, padding: '22px 24px', marginBottom: 18 }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          margin: '-22px -24px 18px',
          padding: '16px 24px',
          background: 'var(--d-panel)',
          borderBottom: '1px solid rgba(255,255,255,.07)',
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ font: '600 17px var(--f-display)', color: 'var(--d-text-bright)' }}>
            {isNew ? t.carFormNew : `${form.brand} ${form.model}`.trim() || t.carFallback}
          </div>
          <div style={{ marginTop: 2, font: '400 11px var(--f-ui)', color: 'var(--d-muted-2)' }}>
            {t.requiredFieldsPre}<span style={{ color: 'var(--d-accent)' }}>*</span>{t.requiredFieldsPost}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {err && <span style={{ font: '600 12px var(--f-ui)', color: '#E58A8A' }}>{err}</span>}
          <button
            onClick={onCancel}
            style={{ padding: '11px 20px', border: '1px solid rgba(255,255,255,.16)', background: 'transparent', color: 'var(--d-text)', borderRadius: 10, font: '600 13px var(--f-ui)', cursor: 'pointer' }}
          >
            {t.cancel}
          </button>
          <button onClick={onSave} disabled={pending} style={{ ...CORAL_BTN, padding: '11px 24px', opacity: pending ? 0.6 : 1 }}>
            {pending ? t.saving : isNew ? t.carFormAdd : t.carFormSave}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* BASICS */}
        <SectionCard title={t.scBasics}>
          <Field label={t.fBrand} required error={fe('brand')} basis="1 1 200px">
            <input style={inputErr(!!fieldErrors.brand)} value={form.brand} onChange={(e) => upd('brand', e.target.value)} placeholder="BMW" />
          </Field>
          <Field label={t.fModel} required error={fe('model')} basis="1 1 200px">
            <input style={inputErr(!!fieldErrors.model)} value={form.model} onChange={(e) => upd('model', e.target.value)} placeholder="520i" />
          </Field>
          <Field label={t.fYear} required error={fe('year')} basis="0 0 110px">
            <input style={inputErr(!!fieldErrors.year)} type="number" value={form.year} onChange={(e) => upd('year', e.target.value)} />
          </Field>
          <Field label={t.fClass} required error={fe('class')} basis="0 0 170px">
            <select style={inputErr(!!fieldErrors.class)} value={form.class} onChange={(e) => upd('class', e.target.value as CarClass)}>
              {(Object.keys(t.carClass) as CarClass[]).map((k) => (
                <option key={k} value={k} style={{ background: '#0C3540' }}>{t.carClass[k]}</option>
              ))}
            </select>
          </Field>
        </SectionCard>

        {/* SPECS */}
        <SectionCard title={t.scSpecs}>
          <Field label={t.fGearbox} basis="0 0 180px">
            <select style={formInput} value={form.gearbox} onChange={(e) => upd('gearbox', e.target.value as Gearbox)}>
              {(Object.keys(t.gearbox) as Gearbox[]).map((k) => (
                <option key={k} value={k} style={{ background: '#0C3540' }}>{t.gearbox[k]}</option>
              ))}
            </select>
          </Field>
          <Field label={t.fFuel} basis="0 0 170px">
            <select style={formInput} value={form.fuel} onChange={(e) => upd('fuel', e.target.value as Fuel)}>
              {(Object.keys(t.fuel) as Fuel[]).map((k) => (
                <option key={k} value={k} style={{ background: '#0C3540' }}>{t.fuel[k]}</option>
              ))}
            </select>
          </Field>
          <Field label={t.fSeats} error={fe('seats')} basis="0 0 88px">
            <input style={inputErr(!!fieldErrors.seats)} type="number" value={form.seats} onChange={(e) => upd('seats', e.target.value)} />
          </Field>
          <Field label={t.fDoors} error={fe('doors')} basis="0 0 88px">
            <input style={inputErr(!!fieldErrors.doors)} type="number" value={form.doors} onChange={(e) => upd('doors', e.target.value)} />
          </Field>
          <Field label={t.fAircon} basis="0 0 150px">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 40 }}>
              <Toggle on={form.airConditioning} onClick={() => upd('airConditioning', !form.airConditioning)} />
              <span style={{ font: '500 13px var(--f-ui)', color: 'var(--d-muted)' }}>{form.airConditioning ? t.yes : t.no}</span>
            </div>
          </Field>
        </SectionCard>

        {/* PRICING */}
        <SectionCard title={t.scPricing} hint={t.scPricingHint}>
          <Field label={t.fPricePerDay} required error={fe('pricePerDay')} basis="0 0 160px">
            <input style={inputErr(!!fieldErrors.pricePerDay)} type="number" value={form.pricePerDay} onChange={(e) => upd('pricePerDay', e.target.value)} placeholder="120" />
          </Field>
          <Field label={t.fDeposit} required error={fe('deposit')} basis="0 0 160px">
            <input style={inputErr(!!fieldErrors.deposit)} type="number" value={form.deposit} onChange={(e) => upd('deposit', e.target.value)} placeholder="800" />
          </Field>
          <Field label={t.fMileage} error={fe('mileageLimitPerDay')} basis="0 0 220px">
            <input style={inputErr(!!fieldErrors.mileageLimitPerDay)} type="number" value={form.mileageLimitPerDay} onChange={(e) => upd('mileageLimitPerDay', e.target.value)} placeholder={t.mileagePlaceholder} />
          </Field>
        </SectionCard>

        {/* CONDITIONS & STATUS */}
        <SectionCard title={t.scConditions}>
          <Field label={t.fMinRental} error={fe('minRentalDays')} basis="0 0 180px">
            <input style={inputErr(!!fieldErrors.minRentalDays)} type="number" value={form.minRentalDays} onChange={(e) => upd('minRentalDays', e.target.value)} />
          </Field>
          <Field label={t.fPrepHours} error={fe('prepHoursBetween')} basis="0 0 230px">
            <input style={inputErr(!!fieldErrors.prepHoursBetween)} type="number" value={form.prepHoursBetween} onChange={(e) => upd('prepHoursBetween', e.target.value)} />
          </Field>
          <Field label={t.fShowToClients} basis="0 0 200px">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 40 }}>
              <Toggle on={form.active} onClick={() => upd('active', !form.active)} />
              <StatusPill kind={form.active ? 'green' : 'grey'} label={form.active ? t.statusActiveM : t.statusHiddenM} />
            </div>
          </Field>
          <div style={{ flex: '1 1 100%', marginTop: 2, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,.03)', border: '1px dashed rgba(255,255,255,.1)', font: '400 11px/1.5 var(--f-ui)', color: 'var(--d-muted-2)' }}>
            {t.conditionsNote}
          </div>
        </SectionCard>

        {/* PHOTOS */}
        <SectionCard title={t.scPhotos}>
          {isNew || !car ? (
            <div style={{ flex: '1 1 100%', padding: '14px 16px', borderRadius: 10, background: 'rgba(255,255,255,.03)', border: '1px dashed rgba(255,255,255,.12)', font: '500 12px var(--f-ui)', color: 'var(--d-muted-2)' }}>
              {t.photosSaveFirst}
            </div>
          ) : (
            <div style={{ flex: '1 1 100%' }}>
              <CarPhotoManager carId={car.id} photos={car.photos} />
            </div>
          )}
        </SectionCard>
      </div>

    </div>
  )
}

/* ====================== CLIENTS ====================== */
const CLIENT_COLS = '1.4fr 1.6fr 1fr 90px 110px 1.2fr'

function ClientsView({ clients }: { clients: AdminClient[] }) {
  const t = useDict(dict)
  const repeatCount = clients.filter((c) => c.tripCount > 1).length
  const [expanded, setExpanded] = useState<string | null>(null)
  const isMobile = useIsMobile()
  const vBadge = (s: string) =>
    s === 'APPROVED' ? { t: t.cvApproved, c: '#8FD7AD' }
    : s === 'PENDING' ? { t: t.cvPending, c: '#E7B463' }
    : s === 'REJECTED' ? { t: t.cvRejected, c: '#E88A82' }
    : s === 'RESUBMISSION' ? { t: t.cvResubmission, c: '#E0A106' }
    : { t: t.cvNone, c: 'var(--d-muted-2)' }
  return (
    <div>
      <div style={{ marginBottom: 18, font: '400 13px var(--f-ui)', color: 'var(--d-muted)' }}>
        {t.clientsSummary(clients.length, repeatCount)}
      </div>
      <div style={{ ...PANEL, overflow: 'hidden' }}>
        {!isMobile && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: CLIENT_COLS,
              gap: 14,
              padding: '13px 18px',
              borderBottom: '1px solid rgba(255,255,255,.08)',
              background: 'var(--d-card)',
              font: '400 10px var(--f-mono)',
              letterSpacing: '.1em',
              color: 'var(--d-muted-2)',
            }}
          >
            <span>{t.colClient}</span>
            <span>{t.colContacts}</span>
            <span>{t.colCitizenship}</span>
            <span>{t.colBookings}</span>
            <span>{t.colDocuments}</span>
            <span>{t.colEmail}</span>
          </div>
        )}
        {clients.length === 0 && (
          <div style={{ padding: '28px 18px', textAlign: 'center', font: '400 13px var(--f-ui)', color: 'var(--d-muted)' }}>
            {t.noClients}
          </div>
        )}
        {clients.map((cl) => {
          const name = [cl.firstName, cl.lastName].filter(Boolean).join(' ') || cl.email
          const full = cl.hasPassport && cl.hasLicense
          const docText = full ? t.docFull : cl.hasPassport ? t.docNoLicense : t.docIncomplete
          const docColor = full ? '#8FD7AD' : '#E7B463'
          const vb = vBadge(derivedVerifStatus(cl.reviewDocs))
          const isOpen = expanded === cl.id
          return (
            <div key={cl.id}>
              {isMobile ? (
                <div
                  className="av-row-hover av-tap"
                  onClick={() => setExpanded(isOpen ? null : cl.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    padding: '14px 16px',
                    borderBottom: '1px solid rgba(255,255,255,.05)',
                    cursor: 'pointer',
                    background: isOpen ? 'rgba(255,255,255,.03)' : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, flexShrink: 0, borderRadius: '50%', background: 'var(--d-el)', border: '1px solid rgba(255,122,92,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 12px var(--f-ui)', color: 'var(--d-accent-light)' }}>
                      {initialsOf(name)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ font: '600 15px var(--f-ui)', color: 'var(--d-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                      <div style={{ font: '500 12px var(--f-ui)', color: '#C9D4E4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cl.email}</div>
                    </div>
                    <span style={{ font: '600 13px var(--f-ui)', color: 'var(--d-muted-2)', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', font: '500 12px var(--f-ui)', color: 'var(--d-muted)' }}>
                    <span>{cl.phone ?? cl.whatsapp ?? '—'}</span>
                    <span style={{ color: '#C9D4E4' }}>{cl.citizenship ?? '—'}</span>
                    <span>{t.bookingsPrefix}<b style={{ color: 'var(--d-text-bright)' }}>{cl.tripCount}</b></span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
                    <span style={{ font: '500 11px var(--f-ui)', color: docColor }}>{docText}</span>
                    <span style={{ font: '600 11px var(--f-ui)', color: vb.c }}>{vb.t}</span>
                  </div>
                </div>
              ) : (
              <div
                className="av-row-hover"
                onClick={() => setExpanded(isOpen ? null : cl.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: CLIENT_COLS,
                  gap: 14,
                  padding: '14px 18px',
                  borderBottom: '1px solid rgba(255,255,255,.05)',
                  alignItems: 'center',
                  cursor: 'pointer',
                  background: isOpen ? 'rgba(255,255,255,.03)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--d-el)', border: '1px solid rgba(255,122,92,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 11px var(--f-ui)', color: 'var(--d-accent-light)' }}>
                    {initialsOf(name)}
                  </div>
                  <span style={{ font: '600 13px var(--f-ui)', color: 'var(--d-text)' }}>{name}</span>
                </div>
                <span style={{ font: '500 12px var(--f-ui)', color: 'var(--d-muted)' }}>{cl.phone ?? cl.whatsapp ?? '—'}</span>
                <span style={{ font: '500 12px var(--f-ui)', color: '#C9D4E4' }}>{cl.citizenship ?? '—'}</span>
                <span style={{ font: '700 13px var(--f-ui)', color: 'var(--d-text-bright)' }}>{cl.tripCount}</span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ font: '500 11px var(--f-ui)', color: docColor }}>{docText}</span>
                  <span style={{ font: '600 10px var(--f-ui)', color: vb.c }}>{vb.t}</span>
                </span>
                <span style={{ font: '500 12px var(--f-ui)', color: '#C9D4E4' }}>{cl.email}</span>
              </div>
              )}
              {isOpen && (
                <div style={{ padding: '14px 18px 18px', background: 'rgba(255,255,255,.02)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                  <div style={{ font: '400 10px var(--f-mono)', letterSpacing: '.1em', color: 'var(--d-muted-2)', marginBottom: 10 }}>{t.idDocsLabel}</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {cl.idDocuments.length === 0 && <div style={{ font: '400 12px var(--f-ui)', color: 'var(--d-muted-2)' }}>{t.docsNotUploadedYet}</div>}
                    {cl.idDocuments.map((d) => (
                      <a key={d.id} href={`/api/documents/${d.id}`} target="_blank" rel="noreferrer" style={{ display: 'block', width: 112, textDecoration: 'none' }}>
                        {/(jpeg|jpg|png|webp)/i.test(d.mime) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`/api/documents/${d.id}`} alt={d.type} style={{ width: 112, height: 78, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,.1)' }} />
                        ) : (
                          <div style={{ width: 112, height: 78, borderRadius: 8, border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--d-card)', font: '700 11px var(--f-ui)', color: 'var(--d-muted)' }}>PDF</div>
                        )}
                        <div style={{ marginTop: 4, font: '600 10px var(--f-ui)', color: 'var(--d-muted)' }}>{d.type}</div>
                      </a>
                    ))}
                  </div>
                  <VerificationReview docs={cl.reviewDocs} compact />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ====================== PAYMENTS ====================== */
const PAY_COLS = '110px 1.2fr 1fr 90px 90px 120px 1fr'

function PaymentsView({ payments, bookings }: { payments: AdminPaymentRow[]; bookings: AdminBookingRow[] }) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const t = useDict(dict)
  const [pending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [bookingId, setBookingId] = useState(bookings[0]?.id ?? '')
  const [method, setMethod] = useState('BANK_TRANSFER')
  const [kind, setKind] = useState('RENT')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('EUR')
  const [status, setStatus] = useState('PAID')
  const [txHash, setTxHash] = useState('')
  const [err, setErr] = useState<string | null>(null)

  const kpis = useMemo(() => {
    const income = payments
      .filter((p) => p.status === 'PAID' && (p.kind === 'RENT' || p.kind === 'PREPAY' || p.kind === 'BALANCE' || p.kind === 'FULL'))
      .reduce((s, p) => s + p.amount, 0)
    const awaiting = payments.filter((p) => p.status === 'AWAITING' || p.status === 'PARTIAL').reduce((s, p) => s + p.amount, 0)
    const deposits = payments.filter((p) => p.status === 'DEPOSIT_HELD').reduce((s, p) => s + p.amount, 0)
    const closed = bookings.filter((b) => b.subtotal > 0)
    const avg = closed.length ? Math.round(closed.reduce((s, b) => s + b.subtotal, 0) / closed.length) : 0
    return [
      { label: t.kpiIncome, value: `€${income.toLocaleString('ru-RU')}`, color: '#8FD7AD' },
      { label: t.kpiAwaiting, value: `€${awaiting.toLocaleString('ru-RU')}`, color: '#E7B463' },
      { label: t.kpiDeposits, value: `€${deposits.toLocaleString('ru-RU')}`, color: 'var(--d-text)' },
      { label: t.kpiAvg, value: `€${avg.toLocaleString('ru-RU')}`, color: 'var(--d-text)' },
    ]
  }, [payments, bookings, t])

  const submit = () => {
    setErr(null)
    const amt = Number(amount)
    if (!bookingId || !amt) {
      setErr(t.errBookingAmount)
      return
    }
    startTransition(async () => {
      const res = await recordPayment({
        bookingId,
        method,
        currency,
        amount: amt,
        kind,
        status: status as never,
        txHash: txHash.trim() || undefined,
      })
      if (res.ok) {
        setShowForm(false)
        setAmount('')
        setTxHash('')
        router.refresh()
      } else {
        setErr(res.error ?? t.errRecordFailed)
      }
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        {kpis.map((k) => (
          <div
            key={k.label}
            style={{
              background: 'var(--d-card)',
              border: '1px solid rgba(255,255,255,.07)',
              borderRadius: 12,
              padding: '14px 20px',
              ...(isMobile ? { flex: '1 1 calc(50% - 6px)', minWidth: 0 } : null),
            }}
          >
            <div style={{ font: '400 10px var(--f-mono)', color: 'var(--d-muted-2)' }}>{k.label}</div>
            <div style={{ marginTop: 5, font: `700 ${isMobile ? 19 : 22}px var(--f-ui)`, color: k.color }}>{k.value}</div>
          </div>
        ))}
        <button
          onClick={() => setShowForm((v) => !v)}
          className="av-tap"
          style={{ ...CORAL_BTN, padding: '11px 20px', ...(isMobile ? { width: '100%' } : { marginLeft: 'auto', alignSelf: 'center' }) }}
        >
          {t.btnRecordPayment}
        </button>
      </div>

      {showForm && (
        <div style={{ ...PANEL, padding: '22px 24px', marginBottom: 18 }}>
          <div style={{ ...SECTION_LABEL, marginBottom: 16 }}>{t.newPaymentTitle}</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
            <Field label={t.fBooking}>
              <select style={formInput} value={bookingId} onChange={(e) => setBookingId(e.target.value)}>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id} style={{ background: '#0C3540' }}>
                    {b.number} · {b.clientName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.fMethod}>
              <select style={formInput} value={method} onChange={(e) => setMethod(e.target.value)}>
                {Object.keys(t.paymentMethod).map((k) => (
                  <option key={k} value={k} style={{ background: '#0C3540' }}>
                    {t.paymentMethod[k]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.fType}>
              <select style={formInput} value={kind} onChange={(e) => setKind(e.target.value)}>
                {Object.keys(t.paymentKind).map((k) => (
                  <option key={k} value={k} style={{ background: '#0C3540' }}>
                    {t.paymentKind[k]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.fAmount}>
              <input style={formInput} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Field label={t.fCurrency}>
              <select style={formInput} value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
                {(Object.keys(CURRENCY_SYMBOL) as Currency[]).map((k) => (
                  <option key={k} value={k} style={{ background: '#0C3540' }}>
                    {k}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.fStatus}>
              <select style={formInput} value={status} onChange={(e) => setStatus(e.target.value)}>
                {Object.keys(t.paymentStatus).map((k) => (
                  <option key={k} value={k} style={{ background: '#0C3540' }}>
                    {t.paymentStatus[k]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.fTxHash}>
              <input style={formInput} value={txHash} onChange={(e) => setTxHash(e.target.value)} />
            </Field>
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            {err && <span style={{ font: '500 12px var(--f-ui)', color: '#E58A8A' }}>{err}</span>}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  padding: '10px 18px',
                  border: '1px solid rgba(255,255,255,.16)',
                  background: 'transparent',
                  color: 'var(--d-text)',
                  borderRadius: 10,
                  font: '600 12px var(--f-ui)',
                  cursor: 'pointer',
                }}
              >
                {t.cancel}
              </button>
              <button onClick={submit} disabled={pending} style={{ ...CORAL_BTN, padding: '10px 22px', opacity: pending ? 0.6 : 1 }}>
                {t.btnRecord}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ ...PANEL, overflow: 'hidden' }}>
        {!isMobile && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: PAY_COLS,
              gap: 12,
              padding: '13px 18px',
              borderBottom: '1px solid rgba(255,255,255,.08)',
              background: 'var(--d-card)',
              font: '400 10px var(--f-mono)',
              letterSpacing: '.08em',
              color: 'var(--d-muted-2)',
            }}
          >
            <span>{t.colNo}</span>
            <span>{t.colClient}</span>
            <span>{t.fMethod}</span>
            <span>{t.fType}</span>
            <span>{t.colAmount}</span>
            <span>{t.colDate}</span>
            <span>{t.colStatus}</span>
          </div>
        )}
        {payments.length === 0 && (
          <div style={{ padding: '28px 18px', textAlign: 'center', font: '400 13px var(--f-ui)', color: 'var(--d-muted)' }}>
            {t.noPaymentsYet}
          </div>
        )}
        {payments.map((p) =>
          isMobile ? (
            <div
              key={p.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: '14px 16px',
                borderBottom: '1px solid rgba(255,255,255,.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ font: '600 11px var(--f-mono)', color: 'var(--d-accent-light)' }}>{p.bookingNumber}</span>
                <StatusPill kind={PAYMENT_STATUS_KIND[p.status]} label={t.paymentStatus[p.status]} />
              </div>
              <div style={{ font: '600 15px var(--f-ui)', color: 'var(--d-text)' }}>{p.clientName}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ font: '500 12px var(--f-ui)', color: '#C9D4E4' }}>{t.paymentMethod[p.method]} · {t.paymentKind[p.kind]}</span>
                <span style={{ font: '500 12px var(--f-ui)', color: 'var(--d-muted)' }}>{dateShort(p.createdAt)}</span>
              </div>
              <div style={{ font: '700 17px var(--f-ui)', color: 'var(--d-text-bright)' }}>{money(p.amount, p.currency)}</div>
            </div>
          ) : (
            <div
              key={p.id}
              style={{
                display: 'grid',
                gridTemplateColumns: PAY_COLS,
                gap: 12,
                padding: '14px 18px',
                borderBottom: '1px solid rgba(255,255,255,.05)',
                alignItems: 'center',
              }}
            >
              <span style={{ font: '600 11px var(--f-mono)', color: 'var(--d-accent-light)' }}>{p.bookingNumber}</span>
              <span style={{ font: '600 13px var(--f-ui)', color: 'var(--d-text)' }}>{p.clientName}</span>
              <span style={{ font: '500 12px var(--f-ui)', color: '#C9D4E4' }}>{t.paymentMethod[p.method]}</span>
              <span style={{ font: '500 12px var(--f-ui)', color: 'var(--d-muted)' }}>{t.paymentKind[p.kind]}</span>
              <span style={{ font: '700 12px var(--f-ui)', color: 'var(--d-text-bright)' }}>{money(p.amount, p.currency)}</span>
              <span style={{ font: '500 12px var(--f-ui)', color: 'var(--d-muted)' }}>{dateShort(p.createdAt)}</span>
              <span>
                <StatusPill kind={PAYMENT_STATUS_KIND[p.status]} label={t.paymentStatus[p.status]} />
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  )
}

/* ====================== SERVICES ====================== */
const SVC_COLS = '76px 1.7fr 132px 92px 96px 60px 150px'

const SERVICE_UNIT_OPT_VALUES: string[] = ['flat', 'per_day', 'per_trip']

type ServiceFormState = {
  category: ServiceCategory
  nameRu: string
  nameEn: string
  descRu: string
  descEn: string
  price: string
  unit: string
  forGoals: TripGoal[]
  active: boolean
}

function emptyServiceForm(): ServiceFormState {
  return { category: 'OTHER', nameRu: '', nameEn: '', descRu: '', descEn: '', price: '', unit: 'flat', forGoals: [], active: true }
}

function serviceToForm(s: AdminService): ServiceFormState {
  return {
    category: s.category,
    nameRu: s.nameRu,
    nameEn: s.nameEn,
    descRu: s.descRu,
    descEn: s.descEn,
    price: String(s.price),
    unit: s.unit,
    forGoals: s.forGoals,
    active: s.active,
  }
}

/** Small square ↑/↓ reorder button. */
function ArrowBtn({ dir, onClick, disabled, title }: { dir: 'up' | 'down'; onClick: () => void; disabled?: boolean; title?: string }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 26,
        height: 24,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        border: '1px solid rgba(255,255,255,.14)',
        background: 'var(--d-el)',
        color: 'var(--d-text)',
        font: '700 11px var(--f-ui)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        padding: 0,
      }}
    >
      {dir === 'up' ? '↑' : '↓'}
    </button>
  )
}

function ServicesView({ services }: { services: AdminService[] }) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const t = useDict(dict)
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState<AdminService | 'new' | null>(null)
  const [form, setForm] = useState<ServiceFormState>(emptyServiceForm())
  const [err, setErr] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden'>('all')

  const q = query.trim().toLowerCase()
  const filtered = services.filter((s) => {
    const matchesQuery = !q || `${s.nameRu} ${s.nameEn} ${t.serviceCat[s.category] ?? ''}`.toLowerCase().includes(q)
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? s.active : !s.active)
    return matchesQuery && matchesStatus
  })
  // Reorder is only meaningful on the full, unfiltered list — the swap is with the true DB neighbour.
  const canReorder = !q && statusFilter === 'all'

  const openNew = () => { setForm(emptyServiceForm()); setEditing('new'); setErr(null); setFieldErrors({}) }
  const openEdit = (s: AdminService) => { setForm(serviceToForm(s)); setEditing(s); setErr(null); setFieldErrors({}) }

  const toggle = (s: AdminService) => {
    startTransition(async () => { await toggleServiceActive(s.id, !s.active); router.refresh() })
  }

  const move = (s: AdminService, dir: 'up' | 'down') => {
    startTransition(async () => { await reorderService(s.id, dir); router.refresh() })
  }

  const remove = (s: AdminService) => {
    if (!window.confirm(t.confirmDeleteService(s.nameRu))) return
    startTransition(async () => {
      const res = await deleteService(s.id)
      if (!res.ok) window.alert(res.error ?? t.errDeleteFailed)
      router.refresh()
    })
  }

  const save = () => {
    setErr(null)
    setFieldErrors({})
    const isNew = editing === 'new'
    const payload = {
      category: form.category,
      nameRu: form.nameRu.trim(),
      nameEn: form.nameEn.trim(),
      descRu: form.descRu.trim(),
      descEn: form.descEn.trim(),
      price: Number(form.price || 0),
      unit: form.unit,
      forGoals: form.forGoals,
      active: form.active,
    }
    const label = form.nameRu.trim() || form.nameEn.trim() || t.serviceFallback
    startTransition(async () => {
      const res = await upsertService(isNew ? null : (editing as AdminService).id, payload)
      if (res.ok) {
        setSavedMsg(isNew ? t.savedServiceAdded(label) : t.savedServiceUpdated(label))
        setEditing(null)
        router.refresh()
        window.setTimeout(() => setSavedMsg(null), 4000)
      } else {
        setFieldErrors(res.fieldErrors ?? {})
        setErr(res.error ?? (res.fieldErrors && Object.keys(res.fieldErrors).length ? t.errCheckFields : t.errSaveFailed))
      }
    })
  }

  if (editing) {
    return (
      <ServiceForm
        form={form}
        setForm={setForm}
        onCancel={() => setEditing(null)}
        onSave={save}
        pending={pending}
        err={err}
        fieldErrors={fieldErrors}
        isNew={editing === 'new'}
      />
    )
  }

  const catPill = (category: string) => (
    <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(255,122,92,.1)', color: 'var(--d-accent-light)', font: '600 11px var(--f-ui)', whiteSpace: 'nowrap' }}>
      {t.serviceCat[category] ?? category}
    </span>
  )

  return (
    <div>
      {savedMsg && (
        <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(111,191,143,.12)', border: '1px solid rgba(111,191,143,.3)', font: '600 12px var(--f-ui)', color: 'var(--d-green)' }}>
          {savedMsg}
        </div>
      )}

      {/* Toolbar — search · status filter · add */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--d-muted-2)', font: '400 14px var(--f-ui)', pointerEvents: 'none' }}>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchServicePlaceholder}
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 30px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'var(--d-card)', color: 'var(--d-text)', font: '500 13px var(--f-ui)', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(
            [
              ['all', t.filterAll(services.length)],
              ['active', t.filterActive(services.filter((s) => s.active).length)],
              ['hidden', t.filterHidden(services.filter((s) => !s.active).length)],
            ] as const
          ).map(([key, lbl]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              style={{
                padding: '8px 13px',
                borderRadius: 9,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                border: statusFilter === key ? '1px solid var(--d-accent)' : '1px solid rgba(255,255,255,.1)',
                background: statusFilter === key ? 'rgba(255,122,92,.14)' : 'transparent',
                color: statusFilter === key ? 'var(--d-accent-light)' : 'var(--d-muted)',
                font: '600 12px var(--f-ui)',
              }}
            >
              {lbl}
            </button>
          ))}
        </div>
        <button onClick={openNew} style={{ ...CORAL_BTN, padding: '11px 20px', marginLeft: isMobile ? 0 : 'auto', width: isMobile ? '100%' : undefined }}>
          {t.btnAddService}
        </button>
      </div>

      {!canReorder && (
        <div style={{ marginBottom: 10, font: '400 11px var(--f-ui)', color: 'var(--d-muted-2)' }}>
          {t.reorderHint}
        </div>
      )}

      {isMobile ? (
        /* Mobile — distinct spaced cards */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 ? (
            <div style={{ ...PANEL, padding: '26px 18px', textAlign: 'center', font: '500 13px var(--f-ui)', color: 'var(--d-muted-2)' }}>
              {services.length === 0 ? t.emptyServicesNone : t.emptyFilter}
            </div>
          ) : (
            filtered.map((s) => {
              const idx = services.findIndex((x) => x.id === s.id)
              return (
                <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 16px', background: 'var(--d-card)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 16, boxShadow: '0 12px 26px -20px rgba(0,0,0,.8)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ font: '700 16px var(--f-ui)', color: 'var(--d-text-bright)' }}>{s.nameRu}</div>
                      {s.nameEn && s.nameEn !== s.nameRu && <div style={{ marginTop: 2, font: '500 12px var(--f-ui)', color: 'var(--d-muted-2)' }}>{s.nameEn}</div>}
                    </div>
                    <Toggle on={s.active} onClick={() => toggle(s)} disabled={pending} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {catPill(s.category)}
                    <span style={{ font: '700 14px var(--f-ui)', color: 'var(--d-text-bright)' }}>{s.price > 0 ? `€${s.price}` : t.free}</span>
                    <span style={{ font: '500 12px var(--f-ui)', color: 'var(--d-muted)' }}>{t.serviceUnit[s.unit] || ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.06)' }}>
                    <ArrowBtn dir="up" onClick={() => move(s, 'up')} disabled={pending || !canReorder || idx <= 0} title={t.arrowUp} />
                    <ArrowBtn dir="down" onClick={() => move(s, 'down')} disabled={pending || !canReorder || idx >= services.length - 1} title={t.arrowDown} />
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(s)} style={ROW_BTN}>{t.btnEditShort}</button>
                      <button onClick={() => remove(s)} style={{ ...ROW_BTN, color: '#E58A8A', borderColor: 'rgba(206,74,74,.35)' }}>{t.actionDelete}</button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        /* Desktop — grid table with reorder + actions */
        <div style={{ ...PANEL, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: SVC_COLS, gap: 12, padding: '13px 18px', borderBottom: '1px solid rgba(255,255,255,.08)', background: 'var(--d-card)', font: '400 10px var(--f-mono)', letterSpacing: '.08em', color: 'var(--d-muted-2)', alignItems: 'center' }}>
            <span>{t.colOrder}</span>
            <span>{t.colService}</span>
            <span>{t.colCategory}</span>
            <span>{t.colPrice}</span>
            <span>{t.colUnit}</span>
            <span>{t.colActive}</span>
            <span style={{ textAlign: 'right' }}>{t.colActions}</span>
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: '28px 18px', textAlign: 'center', font: '500 13px var(--f-ui)', color: 'var(--d-muted-2)' }}>
              {services.length === 0 ? t.emptyServicesNone : t.emptyFilter}
            </div>
          ) : (
            filtered.map((s) => {
              const idx = services.findIndex((x) => x.id === s.id)
              return (
                <div key={s.id} className="av-row-hover" style={{ display: 'grid', gridTemplateColumns: SVC_COLS, gap: 12, padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,.05)', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <ArrowBtn dir="up" onClick={() => move(s, 'up')} disabled={pending || !canReorder || idx <= 0} title={t.arrowUp} />
                    <ArrowBtn dir="down" onClick={() => move(s, 'down')} disabled={pending || !canReorder || idx >= services.length - 1} title={t.arrowDown} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ font: '600 13px var(--f-ui)', color: 'var(--d-text)' }}>{s.nameRu}</div>
                    {s.nameEn && s.nameEn !== s.nameRu && <div style={{ font: '400 11px var(--f-ui)', color: 'var(--d-muted-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nameEn}</div>}
                  </div>
                  <span>{catPill(s.category)}</span>
                  <span style={{ font: '600 13px var(--f-ui)', color: 'var(--d-text-bright)' }}>{s.price > 0 ? `€${s.price}` : t.free}</span>
                  <span style={{ font: '500 12px var(--f-ui)', color: 'var(--d-muted)' }}>{t.serviceUnit[s.unit] || '—'}</span>
                  <span><Toggle on={s.active} onClick={() => toggle(s)} disabled={pending} /></span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                    <button onClick={() => openEdit(s)} style={ROW_BTN} title={t.titleEdit}>{t.btnEditShort}</button>
                    <button onClick={() => remove(s)} style={{ ...ROW_BTN, color: '#E58A8A', borderColor: 'rgba(206,74,74,.35)' }} title={t.actionDelete}>{t.actionDelete}</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

function ServiceForm({
  form,
  setForm,
  onCancel,
  onSave,
  pending,
  err,
  fieldErrors,
  isNew,
}: {
  form: ServiceFormState
  setForm: (f: ServiceFormState) => void
  onCancel: () => void
  onSave: () => void
  pending: boolean
  err: string | null
  fieldErrors: Record<string, string>
  isNew: boolean
}) {
  const t = useDict(dict)
  const upd = <K extends keyof ServiceFormState>(k: K, v: ServiceFormState[K]) => setForm({ ...form, [k]: v })
  const fe = (key: string): string | undefined => (fieldErrors[key] ? t.serviceFieldMsg[key] ?? fieldErrors[key] : undefined)
  const toggleGoal = (g: TripGoal) =>
    upd('forGoals', form.forGoals.includes(g) ? form.forGoals.filter((x) => x !== g) : [...form.forGoals, g])
  const textarea: CSSProperties = { ...formInput, minHeight: 66, resize: 'vertical', font: '500 13px/1.5 var(--f-ui)' }

  return (
    <div style={{ ...PANEL, padding: '22px 24px', marginBottom: 18 }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          margin: '-22px -24px 18px',
          padding: '16px 24px',
          background: 'var(--d-panel)',
          borderBottom: '1px solid rgba(255,255,255,.07)',
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ font: '600 17px var(--f-display)', color: 'var(--d-text-bright)' }}>
            {isNew ? t.serviceFormNew : form.nameRu.trim() || form.nameEn.trim() || t.serviceFallback}
          </div>
          <div style={{ marginTop: 2, font: '400 11px var(--f-ui)', color: 'var(--d-muted-2)' }}>
            {t.requiredFieldsPre}<span style={{ color: 'var(--d-accent)' }}>*</span>{t.requiredFieldsPost}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {err && <span style={{ font: '600 12px var(--f-ui)', color: '#E58A8A' }}>{err}</span>}
          <button onClick={onCancel} style={{ padding: '11px 20px', border: '1px solid rgba(255,255,255,.16)', background: 'transparent', color: 'var(--d-text)', borderRadius: 10, font: '600 13px var(--f-ui)', cursor: 'pointer' }}>
            {t.cancel}
          </button>
          <button onClick={onSave} disabled={pending} style={{ ...CORAL_BTN, padding: '11px 24px', opacity: pending ? 0.6 : 1 }}>
            {pending ? t.saving : isNew ? t.serviceFormAdd : t.serviceFormSave}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* NAME */}
        <SectionCard title={t.scName} hint={t.scNameHint}>
          <Field label={t.fNameRu} required error={fe('nameRu')} basis="1 1 240px">
            <input style={inputErr(!!fieldErrors.nameRu)} value={form.nameRu} onChange={(e) => upd('nameRu', e.target.value)} placeholder={t.phNameRu} />
          </Field>
          <Field label={t.fNameEn} required error={fe('nameEn')} basis="1 1 240px">
            <input style={inputErr(!!fieldErrors.nameEn)} value={form.nameEn} onChange={(e) => upd('nameEn', e.target.value)} placeholder="Child seat" />
          </Field>
          <Field label={t.fCategory} required error={fe('category')} basis="0 0 200px">
            <select style={inputErr(!!fieldErrors.category)} value={form.category} onChange={(e) => upd('category', e.target.value as ServiceCategory)}>
              {(Object.keys(t.serviceCat) as ServiceCategory[]).map((k) => (
                <option key={k} value={k} style={{ background: '#0C3540' }}>{t.serviceCat[k]}</option>
              ))}
            </select>
          </Field>
        </SectionCard>

        {/* PRICING */}
        <SectionCard title={t.colPrice} hint={t.scPriceHint}>
          <Field label={t.fPrice} required error={fe('price')} basis="0 0 160px">
            <input style={inputErr(!!fieldErrors.price)} type="number" value={form.price} onChange={(e) => upd('price', e.target.value)} placeholder="0" />
          </Field>
          <Field label={t.fUnit} error={fe('unit')} basis="0 0 200px">
            <select style={formInput} value={form.unit} onChange={(e) => upd('unit', e.target.value)}>
              {SERVICE_UNIT_OPT_VALUES.map((u) => (
                <option key={u} value={u} style={{ background: '#0C3540' }}>{t.serviceUnitOpt[u]}</option>
              ))}
            </select>
          </Field>
          <Field label={t.fShowToClients} basis="0 0 200px">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 40 }}>
              <Toggle on={form.active} onClick={() => upd('active', !form.active)} />
              <StatusPill kind={form.active ? 'green' : 'grey'} label={form.active ? t.statusActiveF : t.statusHiddenF} />
            </div>
          </Field>
        </SectionCard>

        {/* DESCRIPTION */}
        <SectionCard title={t.scDesc} hint={t.scDescHint}>
          <Field label={t.fDescRu} basis="1 1 260px">
            <textarea style={textarea} value={form.descRu} onChange={(e) => upd('descRu', e.target.value)} placeholder={t.phDescRu} />
          </Field>
          <Field label={t.fDescEn} basis="1 1 260px">
            <textarea style={textarea} value={form.descEn} onChange={(e) => upd('descEn', e.target.value)} placeholder="Short description for the customer" />
          </Field>
        </SectionCard>

        {/* SMART RECOMMENDATIONS */}
        <SectionCard title={t.scRecommend} hint={t.scRecommendHint}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, flex: '1 1 100%' }}>
            {(Object.keys(t.tripGoal) as TripGoal[]).map((g) => {
              const on = form.forGoals.includes(g)
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGoal(g)}
                  style={{
                    padding: '8px 13px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    border: on ? '1px solid var(--d-accent)' : '1px solid rgba(255,255,255,.14)',
                    background: on ? 'rgba(255,122,92,.16)' : 'transparent',
                    color: on ? 'var(--d-accent-light)' : 'var(--d-muted)',
                    font: '600 12px var(--f-ui)',
                  }}
                >
                  {on ? '✓ ' : ''}{t.tripGoal[g]}
                </button>
              )
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

/* ====================== SETTINGS ====================== */
const settingsCard: CSSProperties = {
  background: 'var(--d-panel)',
  border: '1px solid rgba(255,255,255,.07)',
  borderRadius: 16,
  padding: '22px 24px',
}
const cardTitle: CSSProperties = { font: '600 17px var(--f-ui)', color: 'var(--d-text)' }

function SettingsView({
  rates,
  settings,
  mapConfig,
}: {
  rates: AdminRate[]
  settings: AdminSetting[]
  mapConfig: AdminMapConfig
}) {
  const isMobile = useIsMobile()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        <RatesCard rates={rates} />
        <CompanyCard settings={settings} />
      </div>
      <MapProviderCard config={mapConfig} />
      <BackupCard />
    </div>
  )
}

/** Map provider selector — OSM default (always works), Google/Yandex dormant until an encrypted key is added. */
function MapProviderCard({ config }: { config: AdminMapConfig }) {
  const router = useRouter()
  const t = useDict(dict)
  const [pending, start] = useTransition()
  const [provider, setProvider] = useState(config.activeProvider)
  const [googleKey, setGoogleKey] = useState('')
  const [yandexKey, setYandexKey] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const save = () => {
    start(async () => {
      const r = await saveMapConfigAction({ activeProvider: provider, googleKey, yandexKey })
      if (r.ok) { setGoogleKey(''); setYandexKey(''); setMsg(t.msgSaved); router.refresh(); window.setTimeout(() => setMsg(null), 4000) } else setMsg(r.error ?? t.msgError)
    })
  }

  const PROVIDERS: { key: 'osm' | 'google' | 'yandex'; name: string; ready: boolean; note: string }[] = [
    { key: 'osm', name: 'OpenStreetMap', ready: true, note: t.providerNoKey },
    { key: 'google', name: 'Google Maps', ready: config.configured.google, note: config.configured.google ? t.providerKeySaved : t.providerNeedKey },
    { key: 'yandex', name: 'Yandex Maps', ready: config.configured.yandex, note: config.configured.yandex ? t.providerKeySaved : t.providerNeedKey },
  ]

  return (
    <div style={settingsCard}>
      <div style={{ ...cardTitle, marginBottom: 6 }}>{t.mapCardTitle}</div>
      <div style={{ font: '400 12px/1.6 var(--f-ui)', color: 'var(--d-muted)', marginBottom: 14 }}>
        {t.mapCardDesc}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {PROVIDERS.map((p) => {
          const selected = provider === p.key
          const selectable = p.ready
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => selectable && setProvider(p.key)}
              disabled={!selectable}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', textAlign: 'left',
                padding: '12px 14px', borderRadius: 11, cursor: selectable ? 'pointer' : 'not-allowed',
                border: selected ? '1px solid var(--d-accent)' : '1px solid rgba(255,255,255,.1)',
                background: selected ? 'rgba(255,122,92,.12)' : 'var(--d-base)',
                opacity: selectable ? 1 : 0.6,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, border: selected ? '5px solid var(--d-accent)' : '2px solid var(--d-muted-2)' }} />
                <span style={{ font: '700 13px var(--f-ui)', color: 'var(--d-text)' }}>{p.name}</span>
              </span>
              <span style={{ font: '700 10px var(--f-ui)', padding: '3px 9px', borderRadius: 999, background: p.ready ? 'rgba(39,181,118,.14)' : 'rgba(224,162,62,.14)', color: p.ready ? 'var(--d-green)' : '#E7B463' }}>{p.ready ? '● ' + p.note : '○ ' + p.note}</span>
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ flex: '1 1 220px', minWidth: 0 }}>
          <div style={{ font: '500 11px var(--f-ui)', color: 'var(--d-muted)', marginBottom: 6 }}>{t.googleApiKey}</div>
          <input type="password" value={googleKey} onChange={(e) => setGoogleKey(e.target.value)} placeholder={config.configured.google ? t.phKeySaved : t.phEnterKey} style={dInput} />
        </label>
        <label style={{ flex: '1 1 220px', minWidth: 0 }}>
          <div style={{ font: '500 11px var(--f-ui)', color: 'var(--d-muted)', marginBottom: 6 }}>{t.yandexApiKey}</div>
          <input type="password" value={yandexKey} onChange={(e) => setYandexKey(e.target.value)} placeholder={config.configured.yandex ? t.phKeySaved : t.phEnterKey} style={dInput} />
        </label>
      </div>
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={save} disabled={pending} style={{ ...CORAL_BTN, padding: '11px 20px', opacity: pending ? 0.6 : 1 }}>{t.saveBtn}</button>
        {msg && <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-green)' }}>{msg}</span>}
      </div>
    </div>
  )
}

function RatesCard({ rates }: { rates: AdminRate[] }) {
  const router = useRouter()
  const t = useDict(dict)
  const [pending, startTransition] = useTransition()
  const [drafts, setDrafts] = useState<Record<string, string>>(
    () => Object.fromEntries(rates.map((r) => [r.code, String(r.rateFromBase)])),
  )
  const [savedCode, setSavedCode] = useState<string | null>(null)

  const save = (code: Currency) => {
    const v = Number(drafts[code])
    if (!v || v <= 0) return
    startTransition(async () => {
      const res = await updateRate(code, v)
      if (res.ok) {
        setSavedCode(code)
        router.refresh()
      }
    })
  }

  return (
    <div style={settingsCard}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={cardTitle}>{t.currenciesTitle}</div>
        <span
          style={{
            font: '600 11px var(--f-ui)',
            color: 'var(--d-accent-light)',
            background: 'rgba(255,122,92,.12)',
            padding: '5px 11px',
            borderRadius: 999,
          }}
        >
          {t.baseEur}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {rates
          .filter((r) => r.code !== 'EUR')
          .map((r) => (
            <div key={r.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ font: '600 13px var(--f-ui)', color: 'var(--d-text)' }}>
                {r.code} <span style={{ color: 'var(--d-muted-2)' }}>{r.symbol}</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ font: '400 11px var(--f-ui)', color: 'var(--d-muted-2)' }}>{t.oneEur}</span>
                <input
                  value={drafts[r.code] ?? ''}
                  onChange={(e) => {
                    setDrafts({ ...drafts, [r.code]: e.target.value })
                    setSavedCode(null)
                  }}
                  onBlur={() => save(r.code)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  }}
                  disabled={pending}
                  style={{
                    background: 'var(--d-base)',
                    border: savedCode === r.code ? '1px solid rgba(111,191,143,.5)' : '1px solid rgba(255,255,255,.1)',
                    borderRadius: 8,
                    padding: '7px 12px',
                    font: '600 12px var(--f-mono)',
                    color: 'var(--d-text)',
                    width: 90,
                    textAlign: 'right',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          ))}
      </div>
      <div style={{ marginTop: 14, font: '400 11px var(--f-ui)', color: 'var(--d-muted-2)' }}>
        {t.ratesHint}
      </div>
    </div>
  )
}

const dInput: CSSProperties = { width: '100%', boxSizing: 'border-box', background: 'var(--d-base)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 9, padding: '9px 12px', font: '500 13px var(--f-ui)', color: 'var(--d-text)', outline: 'none' }

const COMPANY_FIELD_KEYS: string[] = ['company_name', 'company_legal', 'company_phone', 'company_email', 'company_address', 'bank_iban', 'bank_swift']

function CompanyCard({ settings }: { settings: AdminSetting[] }) {
  const router = useRouter()
  const t = useDict(dict)
  const [pending, startTransition] = useTransition()
  const initial = useMemo(() => {
    const map: Record<string, string> = {}
    for (const k of COMPANY_FIELD_KEYS) map[k] = settings.find((s) => s.key === k)?.value ?? ''
    return map
  }, [settings])
  const [drafts, setDrafts] = useState<Record<string, string>>(initial)
  const [savedKey, setSavedKey] = useState<string | null>(null)

  const save = (key: string) => {
    if (drafts[key] === initial[key]) return
    startTransition(async () => {
      const res = await updateSetting(key, drafts[key] ?? '')
      if (res.ok) {
        setSavedKey(key)
        router.refresh()
      }
    })
  }

  return (
    <div style={settingsCard}>
      <div style={{ ...cardTitle, marginBottom: 16 }}>{t.companyTitle}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {COMPANY_FIELD_KEYS.map((k) => (
          <div key={k}>
            <div style={{ font: '400 10px var(--f-mono)', letterSpacing: '.1em', color: 'var(--d-muted-2)', marginBottom: 5 }}>
              {t.companyField[k].toUpperCase()}
              {savedKey === k && <span style={{ marginLeft: 8, color: '#8FD7AD' }}>✓</span>}
            </div>
            <input
              value={drafts[k] ?? ''}
              onChange={(e) => {
                setDrafts({ ...drafts, [k]: e.target.value })
                setSavedKey(null)
              }}
              onBlur={() => save(k)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              }}
              disabled={pending}
              style={formInput}
            />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, font: '500 12px var(--f-ui)', color: '#8FD7AD' }}>
        <span>🔒</span>{t.sslNote}
      </div>
    </div>
  )
}

function BackupCard() {
  const t = useDict(dict)
  const [autoBackup, setAutoBackup] = useState(true)
  return (
    <div style={settingsCard}>
      <div style={{ ...cardTitle, marginBottom: 16 }}>{t.backupTitle}</div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 12,
          borderBottom: '1px solid rgba(255,255,255,.06)',
        }}
      >
        <span style={{ font: '500 13px var(--f-ui)', color: 'var(--d-text)' }}>{t.autoBackup}</span>
        <Toggle on={autoBackup} onClick={() => setAutoBackup((v) => !v)} />
      </div>
      <div style={{ marginTop: 14, font: '400 11px var(--f-mono)', color: 'var(--d-muted-2)' }}>{t.lastBackup}</div>
      <div style={{ marginTop: 4, font: '600 14px var(--f-ui)', color: 'var(--d-text)' }}>
        {t.lastBackupValue}
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
        <button style={{ ...CORAL_BTN, flex: 1, textAlign: 'center', padding: 11, font: '700 12px var(--f-ui)' }}>
          {t.downloadBackup}
        </button>
        <button
          style={{
            padding: '11px 16px',
            border: '1px solid rgba(255,255,255,.16)',
            background: 'transparent',
            color: 'var(--d-text)',
            borderRadius: 10,
            font: '600 12px var(--f-ui)',
            cursor: 'pointer',
          }}
        >
          {t.restore}
        </button>
      </div>
    </div>
  )
}
