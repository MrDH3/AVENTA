'use client'

import { useState, type ReactNode } from 'react'
import AdminShell from '../components/AdminShell'
import { useIsMobile } from '@/components/useIsMobile'
import { useDict, type Dict } from '@/i18n/lang'

/* ------------------------------------------------------------------ *
 * Data shapes (TS strict — no `any`)
 * ------------------------------------------------------------------ */

type Channel = 'email' | 'telegram' | 'whatsapp'

/** Channel enum as stored in the DB (Prisma `NotificationChannel`). */
type NotifChannel = 'EMAIL' | 'TELEGRAM' | 'WHATSAPP' | 'INAPP'
/** Delivery status as stored in the DB (Prisma `NotificationStatus`). */
type NotifStatus = 'PENDING' | 'SENT' | 'FAILED'

/**
 * One row of the real notification log. Mirrors `RecentNotification` from the
 * server route (`src/app/notifications/page.tsx`) — plain JSON, dates as ISO.
 */
export interface RecentNotification {
  id: string
  event: string
  channel: NotifChannel
  status: NotifStatus
  subject: string | null
  toAddress: string | null
  bookingId: string | null
  createdAt: string // ISO
  sentAt: string | null // ISO
}

/** A channel cell is on (✓) or off (—). */
type ChannelState = boolean

/** Stable key for each trigger event row (label comes from the dict). */
type EventKey =
  | 'newReqAdmin'
  | 'acceptedClient'
  | 'awaitingPayment'
  | 'paymentReceived'
  | 'confirmed'
  | 'delivered'
  | 'returnReminder'
  | 'cancelled'

interface EventRow {
  key: EventKey
  channels: Record<Channel, ChannelState>
}

const CHANNELS: { key: Channel; label: string }[] = [
  { key: 'email', label: 'EMAIL' },
  { key: 'telegram', label: 'TELEGRAM' },
  { key: 'whatsapp', label: 'WHATSAPP' },
]

const EVENTS: EventRow[] = [
  { key: 'newReqAdmin', channels: { email: true, telegram: true, whatsapp: false } },
  { key: 'acceptedClient', channels: { email: true, telegram: true, whatsapp: true } },
  { key: 'awaitingPayment', channels: { email: true, telegram: true, whatsapp: true } },
  { key: 'paymentReceived', channels: { email: true, telegram: true, whatsapp: true } },
  { key: 'confirmed', channels: { email: true, telegram: true, whatsapp: true } },
  { key: 'delivered', channels: { email: false, telegram: true, whatsapp: true } },
  { key: 'returnReminder', channels: { email: false, telegram: true, whatsapp: true } },
  { key: 'cancelled', channels: { email: true, telegram: true, whatsapp: true } },
]

/* ------------------------------------------------------------------ *
 * i18n dictionary
 * ------------------------------------------------------------------ */

interface Strings {
  // page chrome
  pageTitle: string
  pageSubtitle: string
  // section labels
  secTemplateEditor: string
  secRecentLog: string
  secEmailClient: string
  secTelegramClient: string
  secWhatsAppClient: string
  secTelegramAdmin: string
  // event rows
  events: Record<EventKey, string>
  // template editor
  editorTitle: string
  editorSub: string
  colEvent: string
  templateCardTitle: string
  templateBody: string
  templateVars: string[]
  varsLabel: string
  btnTest: string
  btnTestSent: string
  btnSave: string
  btnSaved: string
  // email preview
  emailSubject: string
  emailHeading: string
  emailIntro: string
  carClass: string
  colPeriod: string
  colPickup: string
  colTotal: string
  colPrepay: string
  emailPeriod: string
  emailPickup: string
  emailPrepaid: string
  emailCta: string
  emailOutro: string
  emailFooterLoc: string
  emailUnsub: string
  // telegram to client
  tgToday: string
  tgAccepted: string
  tgDates: string
  tgPickup: string
  tgMoney: string
  tgContact: string
  tgBtnDetails: string
  tgBtnManager: string
  composer: string
  composerWa: string
  // whatsapp to client
  waOnline: string
  waToday: string
  waGreeting: string
  waAcceptedPre: string
  waAcceptedPost: string
  waDates: string
  waMoney: string
  waContact: string
  waBtnDetails: string
  waBtnCall: string
  // telegram to admin
  adminChannelName: string
  adminChannelSub: string
  adminNewRequest: string
  adminCustomer: string
  adminDates: string
  adminPurpose: string
  adminMoney: string
  adminDocs: string
  adminBtnConfirm: string
  adminBtnClient: string
  adminBtnOpen: string
  // recent log
  logTitle: string
  logSubHas: string
  logSubEmpty: string
  colChannel: string
  colStatus: string
  colTime: string
  logEmpty: string
  channelLabels: Record<NotifChannel, string>
  statusLabels: Record<NotifStatus, string>
  dateLocale: string
}

const dict: Dict<Strings> = {
  ru: {
    pageTitle: 'Шаблоны уведомлений',
    pageSubtitle:
      'Редактор событий и каналов · превью сообщений в Email, Telegram и WhatsApp (клиенту и администратору)',
    secTemplateEditor: 'Админ · события и каналы',
    secRecentLog: 'Последние отправленные · журнал',
    secEmailClient: 'Email клиенту · «Заявка принята»',
    secTelegramClient: 'Telegram клиенту',
    secWhatsAppClient: 'WhatsApp клиенту',
    secTelegramAdmin: 'Telegram админу · новая заявка',
    events: {
      newReqAdmin: 'Новая заявка → админу',
      acceptedClient: 'Заявка принята → клиенту',
      awaitingPayment: 'Ожидает оплаты',
      paymentReceived: 'Оплата получена',
      confirmed: 'Подтверждена',
      delivered: 'Авто доставлено',
      returnReminder: 'Напоминание о возврате',
      cancelled: 'Отменена',
    },
    editorTitle: 'Уведомления · шаблоны',
    editorSub: 'Триггеры срабатывают автоматически. Переменные подставляются из заявки.',
    colEvent: 'СОБЫТИЕ',
    templateCardTitle: 'Шаблон · «Заявка принята» (клиент)',
    templateBody:
      'Здравствуйте, {имя}! Заявка {№} принята. Автомобиль: {авто}, даты: {даты}. ' +
      'Итого: {сумма}, предоплата {предоплата}. Менеджер свяжется в течение часа.',
    templateVars: ['{имя}', '{№}', '{авто}', '{даты}', '{сумма}'],
    varsLabel: 'ПЕРЕМЕННЫЕ:',
    btnTest: 'Тест',
    btnTestSent: 'Отправлено ✓',
    btnSave: 'Сохранить',
    btnSaved: 'Сохранено ✓',
    emailSubject: 'Ваша заявка AVN-2026-0042 принята',
    emailHeading: 'Заявка принята, Иван!',
    emailIntro:
      'Мы получили вашу заявку на аренду. Администратор свяжется с вами в течение часа для ' +
      'подтверждения и деталей подачи автомобиля.',
    carClass: 'Бизнес · 2024',
    colPeriod: 'ПЕРИОД',
    colPickup: 'ПОДАЧА',
    colTotal: 'ИТОГО',
    colPrepay: 'ПРЕДОПЛАТА',
    emailPeriod: '10–15 авг · 5 сут',
    emailPickup: 'Аэропорт AYT',
    emailPrepaid: '€210 оплачено',
    emailCta: 'Открыть бронирование',
    emailOutro:
      'Есть вопросы? Ответьте на это письмо или напишите нам в Telegram / WhatsApp. Спасибо, ' +
      'что выбрали AVENTA.',
    emailFooterLoc: 'AVENTA · Анталия, Турция',
    emailUnsub: 'Отписаться',
    tgToday: 'Сегодня',
    tgAccepted: 'Заявка AVN-2026-0042 принята!',
    tgDates: '10–15 авг 2026 · 5 сут',
    tgPickup: 'Подача: Аэропорт Анталии (AYT)',
    tgMoney: 'Итого €700 · предоплата €210',
    tgContact: 'Администратор свяжется с вами в течение часа.',
    tgBtnDetails: '📋 Детали брони',
    tgBtnManager: '💬 Связаться с менеджером',
    composer: 'Сообщение…',
    composerWa: 'Сообщение',
    waOnline: 'в сети',
    waToday: 'СЕГОДНЯ',
    waGreeting: 'Здравствуйте, Иван! ✅',
    waAcceptedPre: 'Заявка ',
    waAcceptedPost: ' принята.',
    waDates: '10–15 авг · Аэропорт AYT',
    waMoney: 'Итого €700 · предоплата €210',
    waContact: 'Свяжемся с вами в течение часа.',
    waBtnDetails: 'Детали брони',
    waBtnCall: 'Позвонить',
    adminChannelName: 'AVENTA · Заявки',
    adminChannelSub: 'канал для администратора',
    adminNewRequest: 'Новая заявка · AVN-2026-0042',
    adminCustomer: 'Иван Петров · +90 555 123 45 67',
    adminDates: '10–15 авг · 5 сут · AYT',
    adminPurpose: 'Цель: покупка недвижимости',
    adminMoney: '€700 · оплачено €210 (USDT TRC20)',
    adminDocs: 'Паспорт ✓ · ВУ лиц. ✓ · ВУ обр. ✗',
    adminBtnConfirm: '✅ Подтвердить',
    adminBtnClient: '💬 Клиент',
    adminBtnOpen: '📋 Открыть в админ-панели',
    logTitle: 'Журнал уведомлений',
    logSubHas: 'Реальные события доставки — последние 10 записей.',
    logSubEmpty: 'Пока нет отправленных уведомлений.',
    colChannel: 'КАНАЛ',
    colStatus: 'СТАТУС',
    colTime: 'ВРЕМЯ',
    logEmpty: 'Записей нет',
    channelLabels: {
      EMAIL: 'Email',
      TELEGRAM: 'Telegram',
      WHATSAPP: 'WhatsApp',
      INAPP: 'В приложении',
    },
    statusLabels: {
      SENT: 'Отправлено',
      PENDING: 'В очереди',
      FAILED: 'Ошибка',
    },
    dateLocale: 'ru-RU',
  },
  en: {
    pageTitle: 'Notification templates',
    pageSubtitle:
      'Event and channel editor · message previews for Email, Telegram and WhatsApp (to client and admin)',
    secTemplateEditor: 'Admin · events & channels',
    secRecentLog: 'Recently sent · log',
    secEmailClient: 'Email to client · “Request accepted”',
    secTelegramClient: 'Telegram to client',
    secWhatsAppClient: 'WhatsApp to client',
    secTelegramAdmin: 'Telegram to admin · new request',
    events: {
      newReqAdmin: 'New request → admin',
      acceptedClient: 'Request accepted → client',
      awaitingPayment: 'Awaiting payment',
      paymentReceived: 'Payment received',
      confirmed: 'Confirmed',
      delivered: 'Car delivered',
      returnReminder: 'Return reminder',
      cancelled: 'Cancelled',
    },
    editorTitle: 'Notifications · templates',
    editorSub: 'Triggers fire automatically. Variables are filled in from the booking.',
    colEvent: 'EVENT',
    templateCardTitle: 'Template · “Request accepted” (client)',
    templateBody:
      'Hello, {name}! Request {no} accepted. Car: {car}, dates: {dates}. ' +
      'Total: {total}, prepayment {prepayment}. A manager will contact you within the hour.',
    templateVars: ['{name}', '{no}', '{car}', '{dates}', '{total}'],
    varsLabel: 'VARIABLES:',
    btnTest: 'Test',
    btnTestSent: 'Sent ✓',
    btnSave: 'Save',
    btnSaved: 'Saved ✓',
    emailSubject: 'Your request AVN-2026-0042 has been accepted',
    emailHeading: 'Request accepted, Ivan!',
    emailIntro:
      'We have received your rental request. An administrator will contact you within the hour ' +
      'to confirm and arrange the car handover details.',
    carClass: 'Business · 2024',
    colPeriod: 'PERIOD',
    colPickup: 'PICKUP',
    colTotal: 'TOTAL',
    colPrepay: 'PREPAYMENT',
    emailPeriod: '10–15 Aug · 5 days',
    emailPickup: 'AYT Airport',
    emailPrepaid: '€210 paid',
    emailCta: 'Open booking',
    emailOutro:
      'Questions? Reply to this email or message us on Telegram / WhatsApp. Thank you for ' +
      'choosing AVENTA.',
    emailFooterLoc: 'AVENTA · Antalya, Turkey',
    emailUnsub: 'Unsubscribe',
    tgToday: 'Today',
    tgAccepted: 'Request AVN-2026-0042 accepted!',
    tgDates: '10–15 Aug 2026 · 5 days',
    tgPickup: 'Pickup: Antalya Airport (AYT)',
    tgMoney: 'Total €700 · prepayment €210',
    tgContact: 'An administrator will contact you within the hour.',
    tgBtnDetails: '📋 Booking details',
    tgBtnManager: '💬 Contact manager',
    composer: 'Message…',
    composerWa: 'Message',
    waOnline: 'online',
    waToday: 'TODAY',
    waGreeting: 'Hello, Ivan! ✅',
    waAcceptedPre: 'Request ',
    waAcceptedPost: ' accepted.',
    waDates: '10–15 Aug · AYT Airport',
    waMoney: 'Total €700 · prepayment €210',
    waContact: 'We will contact you within the hour.',
    waBtnDetails: 'Booking details',
    waBtnCall: 'Call',
    adminChannelName: 'AVENTA · Requests',
    adminChannelSub: 'admin channel',
    adminNewRequest: 'New request · AVN-2026-0042',
    adminCustomer: 'Ivan Petrov · +90 555 123 45 67',
    adminDates: '10–15 Aug · 5 days · AYT',
    adminPurpose: 'Purpose: real estate purchase',
    adminMoney: '€700 · €210 paid (USDT TRC20)',
    adminDocs: 'Passport ✓ · License front ✓ · License back ✗',
    adminBtnConfirm: '✅ Confirm',
    adminBtnClient: '💬 Client',
    adminBtnOpen: '📋 Open in admin panel',
    logTitle: 'Notification log',
    logSubHas: 'Real delivery events — last 10 records.',
    logSubEmpty: 'No notifications sent yet.',
    colChannel: 'CHANNEL',
    colStatus: 'STATUS',
    colTime: 'TIME',
    logEmpty: 'No records',
    channelLabels: {
      EMAIL: 'Email',
      TELEGRAM: 'Telegram',
      WHATSAPP: 'WhatsApp',
      INAPP: 'In-app',
    },
    statusLabels: {
      SENT: 'Sent',
      PENDING: 'Queued',
      FAILED: 'Failed',
    },
    dateLocale: 'en-GB',
  },
  tr: {
    pageTitle: 'Bildirim şablonları',
    pageSubtitle:
      'Olay ve kanal düzenleyici · Email, Telegram ve WhatsApp mesaj önizlemeleri (müşteri ve yönetici)',
    secTemplateEditor: 'Yönetici · olaylar ve kanallar',
    secRecentLog: 'Son gönderilenler · günlük',
    secEmailClient: 'Müşteriye e-posta · «Talep kabul edildi»',
    secTelegramClient: 'Müşteriye Telegram',
    secWhatsAppClient: 'Müşteriye WhatsApp',
    secTelegramAdmin: 'Yöneticiye Telegram · yeni talep',
    events: {
      newReqAdmin: 'Yeni talep → yönetici',
      acceptedClient: 'Talep kabul edildi → müşteri',
      awaitingPayment: 'Ödeme bekleniyor',
      paymentReceived: 'Ödeme alındı',
      confirmed: 'Onaylandı',
      delivered: 'Araç teslim edildi',
      returnReminder: 'İade hatırlatması',
      cancelled: 'İptal edildi',
    },
    editorTitle: 'Bildirimler · şablonlar',
    editorSub: 'Tetikleyiciler otomatik çalışır. Değişkenler talepten doldurulur.',
    colEvent: 'OLAY',
    templateCardTitle: 'Şablon · «Talep kabul edildi» (müşteri)',
    templateBody:
      'Merhaba {name}! {no} numaralı talep kabul edildi. Araç: {car}, tarihler: {dates}. ' +
      'Toplam: {total}, ön ödeme {prepayment}. Bir yönetici bir saat içinde sizinle iletişime geçecek.',
    templateVars: ['{name}', '{no}', '{car}', '{dates}', '{total}'],
    varsLabel: 'DEĞİŞKENLER:',
    btnTest: 'Test',
    btnTestSent: 'Gönderildi ✓',
    btnSave: 'Kaydet',
    btnSaved: 'Kaydedildi ✓',
    emailSubject: 'AVN-2026-0042 talebiniz kabul edildi',
    emailHeading: 'Talep kabul edildi, Ivan!',
    emailIntro:
      'Kiralama talebinizi aldık. Bir yönetici, onay ve araç teslim ayrıntıları için bir saat ' +
      'içinde sizinle iletişime geçecek.',
    carClass: 'Business · 2024',
    colPeriod: 'DÖNEM',
    colPickup: 'TESLİM',
    colTotal: 'TOPLAM',
    colPrepay: 'ÖN ÖDEME',
    emailPeriod: '10–15 Ağu · 5 gün',
    emailPickup: 'AYT Havalimanı',
    emailPrepaid: '€210 ödendi',
    emailCta: 'Rezervasyonu aç',
    emailOutro:
      'Sorularınız mı var? Bu e-postayı yanıtlayın veya bize Telegram / WhatsApp üzerinden yazın. ' +
      'AVENTA’yı seçtiğiniz için teşekkürler.',
    emailFooterLoc: 'AVENTA · Antalya, Türkiye',
    emailUnsub: 'Abonelikten çık',
    tgToday: 'Bugün',
    tgAccepted: 'AVN-2026-0042 talebi kabul edildi!',
    tgDates: '10–15 Ağu 2026 · 5 gün',
    tgPickup: 'Teslim: Antalya Havalimanı (AYT)',
    tgMoney: 'Toplam €700 · ön ödeme €210',
    tgContact: 'Bir yönetici bir saat içinde sizinle iletişime geçecek.',
    tgBtnDetails: '📋 Rezervasyon detayları',
    tgBtnManager: '💬 Yöneticiye ulaş',
    composer: 'Mesaj…',
    composerWa: 'Mesaj',
    waOnline: 'çevrimiçi',
    waToday: 'BUGÜN',
    waGreeting: 'Merhaba Ivan! ✅',
    waAcceptedPre: '',
    waAcceptedPost: ' talebi kabul edildi.',
    waDates: '10–15 Ağu · AYT Havalimanı',
    waMoney: 'Toplam €700 · ön ödeme €210',
    waContact: 'Bir saat içinde sizinle iletişime geçeceğiz.',
    waBtnDetails: 'Rezervasyon detayları',
    waBtnCall: 'Ara',
    adminChannelName: 'AVENTA · Talepler',
    adminChannelSub: 'yönetici kanalı',
    adminNewRequest: 'Yeni talep · AVN-2026-0042',
    adminCustomer: 'Ivan Petrov · +90 555 123 45 67',
    adminDates: '10–15 Ağu · 5 gün · AYT',
    adminPurpose: 'Amaç: gayrimenkul alımı',
    adminMoney: '€700 · €210 ödendi (USDT TRC20)',
    adminDocs: 'Pasaport ✓ · Ehliyet ön ✓ · Ehliyet arka ✗',
    adminBtnConfirm: '✅ Onayla',
    adminBtnClient: '💬 Müşteri',
    adminBtnOpen: '📋 Yönetici panelinde aç',
    logTitle: 'Bildirim günlüğü',
    logSubHas: 'Gerçek teslim olayları — son 10 kayıt.',
    logSubEmpty: 'Henüz gönderilmiş bildirim yok.',
    colChannel: 'KANAL',
    colStatus: 'DURUM',
    colTime: 'ZAMAN',
    logEmpty: 'Kayıt yok',
    channelLabels: {
      EMAIL: 'Email',
      TELEGRAM: 'Telegram',
      WHATSAPP: 'WhatsApp',
      INAPP: 'Uygulama içi',
    },
    statusLabels: {
      SENT: 'Gönderildi',
      PENDING: 'Sırada',
      FAILED: 'Hata',
    },
    dateLocale: 'tr-TR',
  },
  es: {
    pageTitle: 'Plantillas de notificaciones',
    pageSubtitle:
      'Editor de eventos y canales · vistas previas de mensajes en Email, Telegram y WhatsApp (al cliente y al administrador)',
    secTemplateEditor: 'Administración · eventos y canales',
    secRecentLog: 'Enviados recientes · registro',
    secEmailClient: 'Email al cliente · «Solicitud aceptada»',
    secTelegramClient: 'Telegram al cliente',
    secWhatsAppClient: 'WhatsApp al cliente',
    secTelegramAdmin: 'Telegram al administrador · nueva solicitud',
    events: {
      newReqAdmin: 'Nueva solicitud → administrador',
      acceptedClient: 'Solicitud aceptada → cliente',
      awaitingPayment: 'Pendiente de pago',
      paymentReceived: 'Pago recibido',
      confirmed: 'Confirmada',
      delivered: 'Coche entregado',
      returnReminder: 'Recordatorio de devolución',
      cancelled: 'Cancelada',
    },
    editorTitle: 'Notificaciones · plantillas',
    editorSub: 'Los disparadores se activan automáticamente. Las variables se rellenan desde la reserva.',
    colEvent: 'EVENTO',
    templateCardTitle: 'Plantilla · «Solicitud aceptada» (cliente)',
    templateBody:
      '¡Hola, {name}! Solicitud {no} aceptada. Coche: {car}, fechas: {dates}. ' +
      'Total: {total}, anticipo {prepayment}. Un gestor se pondrá en contacto en una hora.',
    templateVars: ['{name}', '{no}', '{car}', '{dates}', '{total}'],
    varsLabel: 'VARIABLES:',
    btnTest: 'Probar',
    btnTestSent: 'Enviado ✓',
    btnSave: 'Guardar',
    btnSaved: 'Guardado ✓',
    emailSubject: 'Su solicitud AVN-2026-0042 ha sido aceptada',
    emailHeading: '¡Solicitud aceptada, Ivan!',
    emailIntro:
      'Hemos recibido su solicitud de alquiler. Un administrador se pondrá en contacto en una hora ' +
      'para confirmar y coordinar los detalles de la entrega del coche.',
    carClass: 'Business · 2024',
    colPeriod: 'PERIODO',
    colPickup: 'ENTREGA',
    colTotal: 'TOTAL',
    colPrepay: 'ANTICIPO',
    emailPeriod: '10–15 ago · 5 días',
    emailPickup: 'Aeropuerto AYT',
    emailPrepaid: '€210 pagado',
    emailCta: 'Abrir reserva',
    emailOutro:
      '¿Tiene preguntas? Responda a este correo o escríbanos por Telegram / WhatsApp. Gracias por ' +
      'elegir AVENTA.',
    emailFooterLoc: 'AVENTA · Antalya, Turquía',
    emailUnsub: 'Cancelar suscripción',
    tgToday: 'Hoy',
    tgAccepted: '¡Solicitud AVN-2026-0042 aceptada!',
    tgDates: '10–15 ago 2026 · 5 días',
    tgPickup: 'Entrega: Aeropuerto de Antalya (AYT)',
    tgMoney: 'Total €700 · anticipo €210',
    tgContact: 'Un administrador se pondrá en contacto en una hora.',
    tgBtnDetails: '📋 Detalles de la reserva',
    tgBtnManager: '💬 Contactar con el gestor',
    composer: 'Mensaje…',
    composerWa: 'Mensaje',
    waOnline: 'en línea',
    waToday: 'HOY',
    waGreeting: '¡Hola, Ivan! ✅',
    waAcceptedPre: 'Solicitud ',
    waAcceptedPost: ' aceptada.',
    waDates: '10–15 ago · Aeropuerto AYT',
    waMoney: 'Total €700 · anticipo €210',
    waContact: 'Nos pondremos en contacto en una hora.',
    waBtnDetails: 'Detalles de la reserva',
    waBtnCall: 'Llamar',
    adminChannelName: 'AVENTA · Solicitudes',
    adminChannelSub: 'canal del administrador',
    adminNewRequest: 'Nueva solicitud · AVN-2026-0042',
    adminCustomer: 'Ivan Petrov · +90 555 123 45 67',
    adminDates: '10–15 ago · 5 días · AYT',
    adminPurpose: 'Objetivo: compra de inmueble',
    adminMoney: '€700 · €210 pagado (USDT TRC20)',
    adminDocs: 'Pasaporte ✓ · Carné anverso ✓ · Carné reverso ✗',
    adminBtnConfirm: '✅ Confirmar',
    adminBtnClient: '💬 Cliente',
    adminBtnOpen: '📋 Abrir en el panel de administración',
    logTitle: 'Registro de notificaciones',
    logSubHas: 'Eventos de entrega reales — últimos 10 registros.',
    logSubEmpty: 'Aún no se han enviado notificaciones.',
    colChannel: 'CANAL',
    colStatus: 'ESTADO',
    colTime: 'HORA',
    logEmpty: 'Sin registros',
    channelLabels: {
      EMAIL: 'Email',
      TELEGRAM: 'Telegram',
      WHATSAPP: 'WhatsApp',
      INAPP: 'En la app',
    },
    statusLabels: {
      SENT: 'Enviado',
      PENDING: 'En cola',
      FAILED: 'Error',
    },
    dateLocale: 'es-ES',
  },
  de: {
    pageTitle: 'Benachrichtigungsvorlagen',
    pageSubtitle:
      'Ereignis- und Kanal-Editor · Nachrichtenvorschau für Email, Telegram und WhatsApp (an Kunde und Admin)',
    secTemplateEditor: 'Admin · Ereignisse & Kanäle',
    secRecentLog: 'Zuletzt gesendet · Protokoll',
    secEmailClient: 'E-Mail an Kunden · „Anfrage angenommen“',
    secTelegramClient: 'Telegram an Kunden',
    secWhatsAppClient: 'WhatsApp an Kunden',
    secTelegramAdmin: 'Telegram an Admin · neue Anfrage',
    events: {
      newReqAdmin: 'Neue Anfrage → Admin',
      acceptedClient: 'Anfrage angenommen → Kunde',
      awaitingPayment: 'Zahlung ausstehend',
      paymentReceived: 'Zahlung erhalten',
      confirmed: 'Bestätigt',
      delivered: 'Fahrzeug übergeben',
      returnReminder: 'Rückgabe-Erinnerung',
      cancelled: 'Storniert',
    },
    editorTitle: 'Benachrichtigungen · Vorlagen',
    editorSub: 'Auslöser werden automatisch ausgelöst. Variablen werden aus der Buchung übernommen.',
    colEvent: 'EREIGNIS',
    templateCardTitle: 'Vorlage · „Anfrage angenommen“ (Kunde)',
    templateBody:
      'Hallo {name}! Anfrage {no} angenommen. Fahrzeug: {car}, Daten: {dates}. ' +
      'Gesamt: {total}, Anzahlung {prepayment}. Ein Manager meldet sich innerhalb einer Stunde.',
    templateVars: ['{name}', '{no}', '{car}', '{dates}', '{total}'],
    varsLabel: 'VARIABLEN:',
    btnTest: 'Test',
    btnTestSent: 'Gesendet ✓',
    btnSave: 'Speichern',
    btnSaved: 'Gespeichert ✓',
    emailSubject: 'Ihre Anfrage AVN-2026-0042 wurde angenommen',
    emailHeading: 'Anfrage angenommen, Ivan!',
    emailIntro:
      'Wir haben Ihre Mietanfrage erhalten. Ein Administrator meldet sich innerhalb einer Stunde ' +
      'zur Bestätigung und Abstimmung der Übergabedetails.',
    carClass: 'Business · 2024',
    colPeriod: 'ZEITRAUM',
    colPickup: 'ÜBERGABE',
    colTotal: 'GESAMT',
    colPrepay: 'ANZAHLUNG',
    emailPeriod: '10.–15. Aug · 5 Tage',
    emailPickup: 'Flughafen AYT',
    emailPrepaid: '€210 bezahlt',
    emailCta: 'Buchung öffnen',
    emailOutro:
      'Fragen? Antworten Sie auf diese E-Mail oder schreiben Sie uns auf Telegram / WhatsApp. Danke, ' +
      'dass Sie sich für AVENTA entschieden haben.',
    emailFooterLoc: 'AVENTA · Antalya, Türkei',
    emailUnsub: 'Abbestellen',
    tgToday: 'Heute',
    tgAccepted: 'Anfrage AVN-2026-0042 angenommen!',
    tgDates: '10.–15. Aug 2026 · 5 Tage',
    tgPickup: 'Übergabe: Flughafen Antalya (AYT)',
    tgMoney: 'Gesamt €700 · Anzahlung €210',
    tgContact: 'Ein Administrator meldet sich innerhalb einer Stunde.',
    tgBtnDetails: '📋 Buchungsdetails',
    tgBtnManager: '💬 Manager kontaktieren',
    composer: 'Nachricht…',
    composerWa: 'Nachricht',
    waOnline: 'online',
    waToday: 'HEUTE',
    waGreeting: 'Hallo Ivan! ✅',
    waAcceptedPre: 'Anfrage ',
    waAcceptedPost: ' angenommen.',
    waDates: '10.–15. Aug · Flughafen AYT',
    waMoney: 'Gesamt €700 · Anzahlung €210',
    waContact: 'Wir melden uns innerhalb einer Stunde.',
    waBtnDetails: 'Buchungsdetails',
    waBtnCall: 'Anrufen',
    adminChannelName: 'AVENTA · Anfragen',
    adminChannelSub: 'Admin-Kanal',
    adminNewRequest: 'Neue Anfrage · AVN-2026-0042',
    adminCustomer: 'Ivan Petrov · +90 555 123 45 67',
    adminDates: '10.–15. Aug · 5 Tage · AYT',
    adminPurpose: 'Zweck: Immobilienkauf',
    adminMoney: '€700 · €210 bezahlt (USDT TRC20)',
    adminDocs: 'Reisepass ✓ · Führerschein Vorderseite ✓ · Führerschein Rückseite ✗',
    adminBtnConfirm: '✅ Bestätigen',
    adminBtnClient: '💬 Kunde',
    adminBtnOpen: '📋 Im Admin-Panel öffnen',
    logTitle: 'Benachrichtigungsprotokoll',
    logSubHas: 'Echte Zustellereignisse — letzte 10 Einträge.',
    logSubEmpty: 'Noch keine Benachrichtigungen gesendet.',
    colChannel: 'KANAL',
    colStatus: 'STATUS',
    colTime: 'ZEIT',
    logEmpty: 'Keine Einträge',
    channelLabels: {
      EMAIL: 'Email',
      TELEGRAM: 'Telegram',
      WHATSAPP: 'WhatsApp',
      INAPP: 'In-App',
    },
    statusLabels: {
      SENT: 'Gesendet',
      PENDING: 'In Warteschlange',
      FAILED: 'Fehler',
    },
    dateLocale: 'de-DE',
  },
}

/* ------------------------------------------------------------------ *
 * Small presentational helpers
 * ------------------------------------------------------------------ */

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        font: '700 13px var(--f-mono)',
        color: '#5f5f5f',
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  )
}

/** Phone-style preview chrome (Telegram / WhatsApp) — fixed 400×720 (fluid ≤400 on mobile). */
function Phone({ bg, children }: { bg: string; children: ReactNode }) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 400,
        height: 720,
        background: bg,
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 40px 90px -40px rgba(0,0,0,.5)',
        fontFamily: 'var(--f-ui)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * A · TEMPLATE EDITOR
 * ------------------------------------------------------------------ */

function TemplateEditor() {
  const t = useDict(dict)
  const [test, setTest] = useState(false)
  const [saved, setSaved] = useState(false)
  const isMobile = useIsMobile()
  const matrixCols = isMobile ? '1fr 40px 44px 44px' : '1.7fr 70px 90px 90px'

  return (
    <div style={{ width: 700, maxWidth: '100%' }}>
      <SectionLabel>{t.secTemplateEditor}</SectionLabel>
      <div
        style={{
          width: '100%',
          background: '#082A33',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 40px 90px -40px rgba(0,0,0,.55)',
          fontFamily: 'var(--f-ui)',
          color: '#ECF1F8',
          padding: isMobile ? '20px 16px' : '28px 30px',
        }}
      >
        <div style={{ font: isMobile ? '600 20px var(--f-display)' : '600 24px var(--f-display)', color: '#F4F7FB' }}>
          {t.editorTitle}
        </div>
        <div style={{ marginTop: 5, font: '400 13px var(--f-ui)', color: '#9CB0CB' }}>
          {t.editorSub}
        </div>

        {/* Event × channel matrix */}
        <div
          style={{
            marginTop: 22,
            background: '#0C3540',
            border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          {/* header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: matrixCols,
              gap: isMobile ? 6 : 10,
              padding: isMobile ? '12px 14px' : '12px 18px',
              borderBottom: '1px solid rgba(255,255,255,.08)',
              background: '#0E3A45',
              font: '400 10px var(--f-mono)',
              letterSpacing: '.08em',
              color: '#7E92AE',
              textAlign: 'center',
            }}
          >
            <span style={{ textAlign: 'left' }}>{t.colEvent}</span>
            {CHANNELS.map((c) => (
              <span key={c.key} title={c.label}>{isMobile ? c.label[0] : c.label}</span>
            ))}
          </div>

          {/* rows */}
          {EVENTS.map((row, i) => (
            <div
              key={row.key}
              style={{
                display: 'grid',
                gridTemplateColumns: matrixCols,
                gap: isMobile ? 6 : 10,
                padding: isMobile ? '12px 14px' : '12px 18px',
                borderBottom:
                  i === EVENTS.length - 1 ? 'none' : '1px solid rgba(255,255,255,.05)',
                alignItems: 'center',
                font: isMobile ? '500 12px var(--f-ui)' : '500 13px var(--f-ui)',
              }}
            >
              <span>{t.events[row.key]}</span>
              {CHANNELS.map((c) => {
                const on = row.channels[c.key]
                return (
                  <span
                    key={c.key}
                    style={{ textAlign: 'center', color: on ? '#8FD7AD' : '#5b6f8a' }}
                  >
                    {on ? '✓' : '—'}
                  </span>
                )
              })}
            </div>
          ))}
        </div>

        {/* Template card */}
        <div
          style={{
            marginTop: 18,
            background: '#0C3540',
            border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 14,
            padding: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div style={{ font: '600 14px var(--f-ui)', color: '#ECF1F8' }}>
              {t.templateCardTitle}
            </div>
            <span style={{ font: '600 11px var(--f-ui)', color: '#9CB0CB' }}>RU ▾</span>
          </div>

          <textarea
            defaultValue={t.templateBody}
            spellCheck={false}
            style={{
              display: 'block',
              width: '100%',
              minHeight: 96,
              resize: 'vertical',
              background: '#082A33',
              border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 10,
              padding: 14,
              font: '400 13px/1.6 var(--f-ui)',
              color: '#C9D4E4',
              outline: 'none',
            }}
          />

          {/* variable chips */}
          <div
            style={{
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ font: '400 10px var(--f-mono)', color: '#7E92AE' }}>{t.varsLabel}</span>
            {t.templateVars.map((v) => (
              <span
                key={v}
                style={{
                  padding: '5px 10px',
                  borderRadius: 7,
                  background: 'rgba(255,122,92,.12)',
                  color: '#FFB48A',
                  font: '600 11px var(--f-mono)',
                }}
              >
                {v}
              </span>
            ))}
          </div>

          {/* actions */}
          <div
            style={{
              marginTop: 14,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setTest(true)
                window.setTimeout(() => setTest(false), 1400)
              }}
              className="av-lift-sm av-tap"
              style={{
                padding: '10px 16px',
                minHeight: isMobile ? 44 : undefined,
                border: '1px solid rgba(255,255,255,.16)',
                color: '#9CB0CB',
                background: 'transparent',
                borderRadius: 9,
                font: '600 12px var(--f-ui)',
                cursor: 'pointer',
              }}
            >
              {test ? t.btnTestSent : t.btnTest}
            </button>
            <button
              type="button"
              onClick={() => {
                setSaved(true)
                window.setTimeout(() => setSaved(false), 1400)
              }}
              className="av-cta av-tap"
              style={{
                padding: '10px 20px',
                minHeight: isMobile ? 44 : undefined,
                background: 'linear-gradient(180deg,#FFB48A,#FF7A5C)',
                color: '#082A33',
                border: 'none',
                borderRadius: 9,
                font: '700 12px var(--f-ui)',
                cursor: 'pointer',
              }}
            >
              {saved ? t.btnSaved : t.btnSave}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * B · EMAIL TO CLIENT (branded)
 * ------------------------------------------------------------------ */

function EmailPreview() {
  const t = useDict(dict)
  return (
    <div style={{ width: 680, maxWidth: '100%' }}>
      <SectionLabel>{t.secEmailClient}</SectionLabel>
      <div
        style={{
          width: '100%',
          background: '#fff',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 40px 90px -40px rgba(0,0,0,.5)',
          fontFamily: 'var(--f-ui)',
        }}
      >
        {/* mail-client header (light) */}
        <div style={{ background: '#f4f5f7', borderBottom: '1px solid #e3e6ea', padding: '16px 22px' }}>
          <div style={{ font: '700 16px var(--f-ui)', color: '#1a1a1a' }}>
            {t.emailSubject}
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'linear-gradient(135deg,#0C3540,#082A33)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFB48A',
                font: '600 13px var(--f-display)',
              }}
            >
              A
            </div>
            <div>
              <div style={{ font: '600 13px var(--f-ui)', color: '#1a1a1a' }}>AVENTA Rental</div>
              <div style={{ font: '400 11px var(--f-ui)', color: '#6b7280' }}>
                noreply@aventa-rental.com → ivan@mail.com
              </div>
            </div>
          </div>
        </div>

        {/* email body (dark branded) */}
        <div style={{ background: '#082A33', color: '#ECF1F8' }}>
          {/* logo bar */}
          <div
            style={{
              padding: '26px 30px',
              borderBottom: '1px solid rgba(255,255,255,.08)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 7,
            }}
          >
            <div style={{ font: '600 22px var(--f-display)', letterSpacing: '.18em' }}>AVENTA</div>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF7A5C', marginTop: 8 }} />
          </div>

          <div style={{ padding: '28px 30px' }}>
            <div style={{ font: '600 24px var(--f-display)', color: '#F4F7FB' }}>
              {t.emailHeading}
            </div>
            <div style={{ marginTop: 12, font: '400 14px/1.65 var(--f-ui)', color: '#AFC0D7' }}>
              {t.emailIntro}
            </div>

            {/* booking summary card */}
            <div
              style={{
                marginTop: 22,
                background: '#0E3A45',
                border: '1px solid rgba(255,122,92,.22)',
                borderRadius: 14,
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 72,
                    height: 52,
                    borderRadius: 8,
                    background:
                      'repeating-linear-gradient(135deg,#114451 0 8px,#125060 8px 16px)',
                  }}
                />
                <div>
                  <div style={{ font: '600 16px var(--f-ui)', color: '#ECF1F8' }}>
                    Mercedes-Benz E 200
                  </div>
                  <div style={{ font: '400 12px var(--f-ui)', color: '#9CB0CB' }}>{t.carClass}</div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 16,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  font: '500 13px var(--f-ui)',
                }}
              >
                <div>
                  <div style={{ font: '400 10px var(--f-mono)', color: '#7E92AE' }}>{t.colPeriod}</div>
                  <div style={{ marginTop: 3, color: '#ECF1F8' }}>{t.emailPeriod}</div>
                </div>
                <div>
                  <div style={{ font: '400 10px var(--f-mono)', color: '#7E92AE' }}>{t.colPickup}</div>
                  <div style={{ marginTop: 3, color: '#ECF1F8' }}>{t.emailPickup}</div>
                </div>
                <div>
                  <div style={{ font: '400 10px var(--f-mono)', color: '#7E92AE' }}>{t.colTotal}</div>
                  <div style={{ marginTop: 3, color: '#ECF1F8' }}>€700</div>
                </div>
                <div>
                  <div style={{ font: '400 10px var(--f-mono)', color: '#7E92AE' }}>{t.colPrepay}</div>
                  <div style={{ marginTop: 3, color: '#8FD7AD' }}>{t.emailPrepaid}</div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div style={{ marginTop: 22, textAlign: 'center' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '14px 34px',
                  background: 'linear-gradient(180deg,#FFB48A,#FF7A5C)',
                  color: '#082A33',
                  borderRadius: 10,
                  font: '700 14px var(--f-ui)',
                }}
              >
                {t.emailCta}
              </span>
            </div>

            <div style={{ marginTop: 22, font: '400 12px/1.6 var(--f-ui)', color: '#7E92AE' }}>
              {t.emailOutro}
            </div>
          </div>

          {/* footer */}
          <div
            style={{
              padding: '18px 30px',
              borderTop: '1px solid rgba(255,255,255,.08)',
              font: '400 11px var(--f-ui)',
              color: '#5b6f8a',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>{t.emailFooterLoc}</span>
            <span>{t.emailUnsub}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * C · TELEGRAM TO CLIENT (Telegram brand chrome)
 * ------------------------------------------------------------------ */

function TelegramClient() {
  const t = useDict(dict)
  return (
    <div style={{ width: 400, maxWidth: '100%' }}>
      <SectionLabel>{t.secTelegramClient}</SectionLabel>
      <Phone bg="#0e1621">
        {/* header */}
        <div
          style={{
            background: '#17212b',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: '1px solid rgba(0,0,0,.3)',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#FFB48A,#FF7A5C)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#082A33',
              font: '600 14px var(--f-display)',
            }}
          >
            A
          </div>
          <div>
            <div style={{ font: '600 14px var(--f-ui)', color: '#fff' }}>AVENTA Rental</div>
            <div style={{ font: '400 11px var(--f-ui)', color: '#6ab7ff' }}>bot</div>
          </div>
        </div>

        {/* conversation */}
        <div
          style={{
            flex: 1,
            padding: '18px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            background: '#0e1621',
          }}
        >
          <div
            style={{
              alignSelf: 'center',
              font: '400 11px var(--f-ui)',
              color: '#6d7f8f',
              background: 'rgba(25,37,51,.6)',
              padding: '4px 12px',
              borderRadius: 999,
            }}
          >
            {t.tgToday}
          </div>

          {/* incoming bubble */}
          <div
            style={{
              alignSelf: 'flex-start',
              maxWidth: '88%',
              background: '#182533',
              borderRadius: '14px 14px 14px 4px',
              padding: '12px 14px',
            }}
          >
            <div style={{ font: '400 13px/1.55 var(--f-ui)', color: '#e9f0f6' }}>
              ✅ <b>{t.tgAccepted}</b>
              <br />
              <br />
              🚗 Mercedes-Benz E 200
              <br />
              📅 {t.tgDates}
              <br />
              📍 {t.tgPickup}
              <br />
              💶 {t.tgMoney}
              <br />
              <br />
              {t.tgContact}
            </div>
            <div
              style={{
                marginTop: 6,
                textAlign: 'right',
                font: '400 10px var(--f-ui)',
                color: '#6d7f8f',
              }}
            >
              12:04
            </div>
          </div>

          {/* inline buttons */}
          <div
            style={{
              alignSelf: 'flex-start',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              width: '88%',
            }}
          >
            {[t.tgBtnDetails, t.tgBtnManager].map((b) => (
              <div
                key={b}
                style={{
                  background: '#2b5278',
                  borderRadius: 10,
                  padding: 11,
                  textAlign: 'center',
                  font: '600 13px var(--f-ui)',
                  color: '#fff',
                }}
              >
                {b}
              </div>
            ))}
          </div>
        </div>

        {/* composer */}
        <div
          style={{
            background: '#17212b',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              flex: 1,
              background: '#242f3d',
              borderRadius: 18,
              padding: '10px 14px',
              font: '400 13px var(--f-ui)',
              color: '#6d7f8f',
            }}
          >
            {t.composer}
          </div>
          <span style={{ color: '#6ab7ff', font: '600 18px var(--f-ui)' }}>➤</span>
        </div>
      </Phone>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * D · WHATSAPP TO CLIENT (WhatsApp brand chrome)
 * ------------------------------------------------------------------ */

function WhatsAppClient() {
  const t = useDict(dict)
  return (
    <div style={{ width: 400, maxWidth: '100%' }}>
      <SectionLabel>{t.secWhatsAppClient}</SectionLabel>
      <Phone bg="#0b141a">
        {/* header */}
        <div
          style={{
            background: '#1f2c34',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#FFB48A,#FF7A5C)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#082A33',
              font: '600 14px var(--f-display)',
            }}
          >
            A
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ font: '600 14px var(--f-ui)', color: '#e9edef' }}>AVENTA Rental</div>
            <div style={{ font: '400 11px var(--f-ui)', color: '#8696a0' }}>{t.waOnline}</div>
          </div>
          <span style={{ color: '#8696a0', font: '600 16px var(--f-ui)' }}>⋮</span>
        </div>

        {/* conversation */}
        <div
          style={{
            flex: 1,
            padding: '18px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            background: '#0b141a',
            backgroundImage: 'radial-gradient(rgba(255,255,255,.015) 1px,transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        >
          <div
            style={{
              alignSelf: 'center',
              font: '400 11px var(--f-ui)',
              color: '#8696a0',
              background: '#182229',
              padding: '4px 12px',
              borderRadius: 8,
            }}
          >
            {t.waToday}
          </div>

          {/* incoming bubble */}
          <div
            style={{
              alignSelf: 'flex-start',
              maxWidth: '86%',
              background: '#1f2c34',
              borderRadius: '10px 10px 10px 2px',
              padding: '11px 13px',
            }}
          >
            <div style={{ font: '600 13px var(--f-ui)', color: '#FFB48A', marginBottom: 4 }}>
              AVENTA Rental
            </div>
            <div style={{ font: '400 13px/1.55 var(--f-ui)', color: '#e9edef' }}>
              {t.waGreeting}
              <br />
              {t.waAcceptedPre}<b>AVN-2026-0042</b>{t.waAcceptedPost}
              <br />
              <br />
              Mercedes-Benz E 200
              <br />
              {t.waDates}
              <br />
              {t.waMoney}
              <br />
              <br />
              {t.waContact}
            </div>
            <div
              style={{
                marginTop: 5,
                textAlign: 'right',
                font: '400 10px var(--f-ui)',
                color: '#8696a0',
              }}
            >
              12:04 ✓✓
            </div>
          </div>

          {/* quick-reply buttons */}
          <div
            style={{
              alignSelf: 'flex-start',
              display: 'flex',
              gap: 7,
              flexWrap: 'wrap',
              width: '86%',
            }}
          >
            {[t.waBtnDetails, t.waBtnCall].map((b) => (
              <div
                key={b}
                style={{
                  flex: 1,
                  background: '#1f2c34',
                  border: '1px solid #00a884',
                  borderRadius: 8,
                  padding: 9,
                  textAlign: 'center',
                  font: '600 12px var(--f-ui)',
                  color: '#00d9a3',
                }}
              >
                {b}
              </div>
            ))}
          </div>
        </div>

        {/* composer */}
        <div
          style={{
            background: '#1f2c34',
            padding: '11px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              flex: 1,
              background: '#2a3942',
              borderRadius: 18,
              padding: '10px 14px',
              font: '400 13px var(--f-ui)',
              color: '#8696a0',
            }}
          >
            {t.composerWa}
          </div>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#00a884',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0b141a',
              font: '600 16px var(--f-ui)',
            }}
          >
            ➤
          </div>
        </div>
      </Phone>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * E · TELEGRAM TO ADMIN (new-request channel)
 * ------------------------------------------------------------------ */

function TelegramAdmin() {
  const t = useDict(dict)
  return (
    <div style={{ width: 400, maxWidth: '100%' }}>
      <SectionLabel>{t.secTelegramAdmin}</SectionLabel>
      <Phone bg="#0e1621">
        {/* header */}
        <div
          style={{
            background: '#17212b',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: '1px solid rgba(0,0,0,.3)',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#2b5278',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              font: '600 16px var(--f-ui)',
            }}
          >
            📥
          </div>
          <div>
            <div style={{ font: '600 14px var(--f-ui)', color: '#fff' }}>{t.adminChannelName}</div>
            <div style={{ font: '400 11px var(--f-ui)', color: '#6d7f8f' }}>
              {t.adminChannelSub}
            </div>
          </div>
        </div>

        {/* conversation */}
        <div
          style={{
            flex: 1,
            padding: '18px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            background: '#0e1621',
          }}
        >
          {/* incoming bubble */}
          <div
            style={{
              alignSelf: 'flex-start',
              maxWidth: '92%',
              background: '#182533',
              borderRadius: '14px 14px 14px 4px',
              padding: '12px 14px',
            }}
          >
            <div style={{ font: '400 13px/1.55 var(--f-ui)', color: '#e9f0f6' }}>
              🔔 <b>{t.adminNewRequest}</b>
              <br />
              <br />
              👤 {t.adminCustomer}
              <br />
              🚗 Mercedes-Benz E 200
              <br />
              📅 {t.adminDates}
              <br />
              🎯 {t.adminPurpose}
              <br />
              💶 {t.adminMoney}
              <br />
              📄 {t.adminDocs}
            </div>
            <div
              style={{
                marginTop: 6,
                textAlign: 'right',
                font: '400 10px var(--f-ui)',
                color: '#6d7f8f',
              }}
            >
              12:03
            </div>
          </div>

          {/* inline buttons */}
          <div
            style={{
              alignSelf: 'flex-start',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              width: '92%',
            }}
          >
            <div style={{ display: 'flex', gap: 6 }}>
              {[t.adminBtnConfirm, t.adminBtnClient].map((b) => (
                <div
                  key={b}
                  style={{
                    flex: 1,
                    background: '#2b5278',
                    borderRadius: 10,
                    padding: 11,
                    textAlign: 'center',
                    font: '600 13px var(--f-ui)',
                    color: '#fff',
                  }}
                >
                  {b}
                </div>
              ))}
            </div>
            <div
              style={{
                background: '#2b5278',
                borderRadius: 10,
                padding: 11,
                textAlign: 'center',
                font: '600 13px var(--f-ui)',
                color: '#fff',
              }}
            >
              {t.adminBtnOpen}
            </div>
          </div>
        </div>

        {/* composer */}
        <div
          style={{
            background: '#17212b',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              flex: 1,
              background: '#242f3d',
              borderRadius: 18,
              padding: '10px 14px',
              font: '400 13px var(--f-ui)',
              color: '#6d7f8f',
            }}
          >
            {t.composer}
          </div>
          <span style={{ color: '#6ab7ff', font: '600 18px var(--f-ui)' }}>➤</span>
        </div>
      </Phone>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * F · RECENT SENT (real notification log — fed by `recent` prop)
 * ------------------------------------------------------------------ */

const STATUS_COLOR: Record<NotifStatus, string> = {
  SENT: '#8FD7AD',
  PENDING: '#FFB48A',
  FAILED: '#F49C9C',
}

/** Human-readable Antalya-local time for the log rows. */
function formatSentAt(iso: string, locale: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function RecentSent({ recent }: { recent: RecentNotification[] }) {
  const t = useDict(dict)
  const isMobile = useIsMobile()
  return (
    <div style={{ width: 700, maxWidth: '100%' }}>
      <SectionLabel>{t.secRecentLog}</SectionLabel>
      <div
        style={{
          width: '100%',
          background: '#082A33',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 40px 90px -40px rgba(0,0,0,.55)',
          fontFamily: 'var(--f-ui)',
          color: '#ECF1F8',
          padding: isMobile ? '20px 16px' : '24px 26px',
        }}
      >
        <div style={{ font: '600 18px var(--f-display)', color: '#F4F7FB' }}>
          {t.logTitle}
        </div>
        <div style={{ marginTop: 4, font: '400 12px var(--f-ui)', color: '#9CB0CB' }}>
          {recent.length > 0 ? t.logSubHas : t.logSubEmpty}
        </div>

        <div
          style={{
            marginTop: 18,
            background: '#0C3540',
            border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          {/* header */}
          <div
            style={{
              display: isMobile ? 'none' : 'grid',
              gridTemplateColumns: '1.6fr 100px 110px 120px',
              gap: 10,
              padding: '12px 18px',
              borderBottom: '1px solid rgba(255,255,255,.08)',
              background: '#0E3A45',
              font: '400 10px var(--f-mono)',
              letterSpacing: '.08em',
              color: '#7E92AE',
            }}
          >
            <span>{t.colEvent}</span>
            <span>{t.colChannel}</span>
            <span>{t.colStatus}</span>
            <span style={{ textAlign: 'right' }}>{t.colTime}</span>
          </div>

          {/* rows */}
          {recent.length === 0 ? (
            <div
              style={{
                padding: '22px 18px',
                font: '400 13px var(--f-ui)',
                color: '#7E92AE',
                textAlign: 'center',
              }}
            >
              {t.logEmpty}
            </div>
          ) : (
            recent.map((n, i) => {
              const color = STATUS_COLOR[n.status]
              const when = n.sentAt ?? n.createdAt
              return (
                <div
                  key={n.id}
                  style={{
                    display: isMobile ? 'flex' : 'grid',
                    flexWrap: isMobile ? 'wrap' : undefined,
                    gridTemplateColumns: '1.6fr 100px 110px 120px',
                    gap: isMobile ? 8 : 10,
                    rowGap: isMobile ? 6 : 10,
                    padding: isMobile ? '14px' : '12px 18px',
                    borderBottom:
                      i === recent.length - 1 ? 'none' : '1px solid rgba(255,255,255,.05)',
                    alignItems: 'center',
                    font: '500 13px var(--f-ui)',
                  }}
                >
                  <span style={{ minWidth: 0, flexBasis: isMobile ? '100%' : undefined }}>
                    <span
                      style={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: '#ECF1F8',
                      }}
                    >
                      {n.subject ?? n.event}
                    </span>
                    {n.toAddress && (
                      <span
                        style={{
                          display: 'block',
                          marginTop: 2,
                          font: '400 11px var(--f-mono)',
                          color: '#6f86a3',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {n.toAddress}
                      </span>
                    )}
                  </span>
                  <span style={{ font: '600 12px var(--f-ui)', color: '#AFC0D7', order: isMobile ? 1 : undefined }}>
                    {t.channelLabels[n.channel]}
                  </span>
                  <span style={{ order: isMobile ? 2 : undefined }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: 'rgba(255,255,255,.05)',
                        font: '600 11px var(--f-ui)',
                        color: color,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: color,
                        }}
                      />
                      {t.statusLabels[n.status]}
                    </span>
                  </span>
                  <span
                    style={{
                      textAlign: 'right',
                      font: '400 12px var(--f-mono)',
                      color: '#9CB0CB',
                      order: isMobile ? 3 : undefined,
                      marginLeft: isMobile ? 'auto' : undefined,
                    }}
                  >
                    {formatSentAt(when, t.dateLocale)}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

export default function Notifications({ recent, canSettings }: { recent: RecentNotification[]; canSettings: boolean }) {
  const t = useDict(dict)
  const isMobile = useIsMobile()
  return (
    <AdminShell
      active="notifications"
      title={t.pageTitle}
      subtitle={t.pageSubtitle}
      canSettings={canSettings}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          gap: isMobile ? 24 : 40,
        }}
      >
        <TemplateEditor />
        <RecentSent recent={recent} />
        <EmailPreview />
        <TelegramClient />
        <WhatsAppClient />
        <TelegramAdmin />
      </div>
    </AdminShell>
  )
}
