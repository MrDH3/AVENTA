'use client'

import type { CSSProperties, ReactNode } from 'react'
import ClientNav from '../components/ClientNav'
import ClientFooter from '../components/ClientFooter'
import Logo, { LogoMark } from '../components/Logo'
import { Container, CoralButton, OutlineButton, StatusPill } from '../components/ui'
import { useDict } from '../i18n/lang'

/* ------------------------------------------------------------------ */
/*  i18n dictionary                                                    */
/* ------------------------------------------------------------------ */

interface Strings {
  badge: string
  title: string
  lead: string
  s1: string
  s2: string
  s3: string
  s4: string
  s5: string
  logoEmblem: string
  logoWhite: string
  logoTeal: string
  logoLockup: string
  logoNote: string
  paletteClient: string
  paletteInternal: string
  typeDisplay: string
  typeUi: string
  typeMono: string
  typeDisplayDesc: string
  typeUiDesc: string
  typeMonoDesc: string
  iconsNote: string
  iconsInterface: string
  iconsEcosystem: string
  compButtons: string
  compPills: string
  compField: string
  compToggle: string
  fieldPh: string
  foot: string
}

type Swatch = { name: string; hex: string; use: string; bg: string; border?: boolean; dark?: boolean }
type TypeRow = { label: string; sample: string; style: CSSProperties }
type IconDef = { key: string; label: string; path: ReactNode }

const dict: Record<'ru' | 'en' | 'tr' | 'es' | 'de', Strings> = {
  ru: {
    badge: 'ДИЗАЙН-СИСТЕМА · BRAND KIT v2',
    title: 'Бренд и дизайн-система AVENTA',
    lead:
      'Единый язык для всех экранов и спецификация для разработчика: логотип, палитра, типографика, иконки и компоненты направления «у моря».',
    s1: '01 · ЛОГОТИП',
    s2: '02 · ПАЛИТРА',
    s3: '03 · ТИПОГРАФИКА',
    s4: '04 · ИКОНКИ',
    s5: '05 · КОМПОНЕНТЫ',
    logoEmblem: 'Эмблема · на светлом',
    logoWhite: 'Логотип · на белом',
    logoTeal: 'Инверсия · на бирюзе',
    logoLockup: 'Горизонтальный лок-ап (основной)',
    logoNote:
      'Эмблема — скруглённый квадрат с буквой «A»: апекс бирюзовый #0E7E90, перекладина и точка коралловые #FF7A5C. Словесный знак — Bricolage Grotesque 800, трекинг .04em.',
    paletteClient: 'КЛИЕНТ · СВЕТЛАЯ «У МОРЯ»',
    paletteInternal: 'ВНУТРЕННЯЯ · ТЁМНАЯ «ГЛУБОКОЕ МОРЕ»',
    typeDisplay: 'ДИСПЛЕЙНЫЙ · ЗАГОЛОВКИ',
    typeUi: 'ИНТЕРФЕЙС · ТЕКСТ',
    typeMono: 'НАДСТРОЧНЫЕ МЕТКИ',
    typeDisplayDesc: '500 · 600 · 700 · 800 — hero, заголовки, акценты',
    typeUiDesc: '400–800 — кнопки, тело, подписи, цены',
    typeMonoDesc: 'метки, коды, даты, технические подписи',
    iconsNote:
      'Тонкая линия 1.6px, currentColor, скруглённые концы. Заменяют юникод-глифы и эмодзи в интерфейсе и админке.',
    iconsInterface: 'ИНТЕРФЕЙС И АДМИН',
    iconsEcosystem: 'ЭКОСИСТЕМА УСЛУГ И ПРЕИМУЩЕСТВА',
    compButtons: 'КНОПКИ',
    compPills: 'СТАТУС-ПИЛЮЛИ',
    compField: 'ПОЛЕ ВВОДА',
    compToggle: 'ПЕРЕКЛЮЧАТЕЛЬ',
    fieldPh: 'Введите имя…',
    foot: 'AVENTA · дизайн-система v2 · направление «у моря». Используйте hex и шкалу как единый источник для вёрстки.',
  },
  en: {
    badge: 'DESIGN SYSTEM · BRAND KIT v2',
    title: 'AVENTA brand & design system',
    lead:
      'One language for every screen and a developer spec: logo, palette, typography, icons and components of the "seaside" direction.',
    s1: '01 · LOGO',
    s2: '02 · PALETTE',
    s3: '03 · TYPOGRAPHY',
    s4: '04 · ICONS',
    s5: '05 · COMPONENTS',
    logoEmblem: 'Emblem · on light',
    logoWhite: 'Logo · on white',
    logoTeal: 'Inverse · on teal',
    logoLockup: 'Horizontal lockup (primary)',
    logoNote:
      'The emblem is a rounded square with an “A”: teal apex #0E7E90, coral crossbar and dot #FF7A5C. Wordmark is Bricolage Grotesque 800, tracking .04em.',
    paletteClient: 'CLIENT · LIGHT “SEASIDE”',
    paletteInternal: 'INTERNAL · DARK “DEEP SEA”',
    typeDisplay: 'DISPLAY · HEADINGS',
    typeUi: 'INTERFACE · BODY',
    typeMono: 'MICRO-LABELS',
    typeDisplayDesc: '500 · 600 · 700 · 800 — hero, headings, accents',
    typeUiDesc: '400–800 — buttons, body, captions, prices',
    typeMonoDesc: 'labels, codes, dates, technical captions',
    iconsNote:
      'Thin 1.6px line, currentColor, rounded caps. They replace unicode glyphs and emoji across the UI and admin.',
    iconsInterface: 'INTERFACE & ADMIN',
    iconsEcosystem: 'SERVICE ECOSYSTEM & BENEFITS',
    compButtons: 'BUTTONS',
    compPills: 'STATUS PILLS',
    compField: 'INPUT FIELD',
    compToggle: 'TOGGLE',
    fieldPh: 'Enter your name…',
    foot: 'AVENTA · design system v2 · "seaside" direction. Use the hex values and the scale as the single source for layout.',
  },
  tr: {
    badge: 'TASARIM SİSTEMİ · MARKA KİTİ v2',
    title: 'AVENTA marka ve tasarım sistemi',
    lead:
      'Her ekran için ortak bir dil ve geliştiriciye yönelik spesifikasyon: "deniz kıyısı" temasının logosu, renk paleti, tipografisi, ikonları ve bileşenleri.',
    s1: '01 · LOGO',
    s2: '02 · PALET',
    s3: '03 · TİPOGRAFİ',
    s4: '04 · İKONLAR',
    s5: '05 · BİLEŞENLER',
    logoEmblem: 'Amblem · açık zeminde',
    logoWhite: 'Logo · beyaz üzerinde',
    logoTeal: 'Ters · turkuaz üzerinde',
    logoLockup: 'Yatay logo düzeni (birincil)',
    logoNote:
      'Amblem, “A” harfli yuvarlatılmış bir karedir: turkuaz tepe #0E7E90, mercan rengi orta çubuk ve nokta #FF7A5C. Kelime markası Bricolage Grotesque 800, harf aralığı .04em.',
    paletteClient: 'MÜŞTERİ · AÇIK “DENİZ KIYISI”',
    paletteInternal: 'DAHİLİ · KOYU “DERİN DENİZ”',
    typeDisplay: 'DISPLAY · BAŞLIKLAR',
    typeUi: 'ARAYÜZ · GÖVDE',
    typeMono: 'MİKRO ETİKETLER',
    typeDisplayDesc: '500 · 600 · 700 · 800 — hero, başlıklar, vurgular',
    typeUiDesc: '400–800 — düğmeler, gövde, alt yazılar, fiyatlar',
    typeMonoDesc: 'etiketler, kodlar, tarihler, teknik açıklamalar',
    iconsNote:
      'İnce 1.6px çizgi, currentColor, yuvarlatılmış uçlar. Arayüz ve yönetim panelinde unicode gliflerinin ve emojilerin yerini alır.',
    iconsInterface: 'ARAYÜZ VE YÖNETİM',
    iconsEcosystem: 'HİZMET EKOSİSTEMİ VE AVANTAJLAR',
    compButtons: 'DÜĞMELER',
    compPills: 'DURUM ROZETLERİ',
    compField: 'GİRİŞ ALANI',
    compToggle: 'ANAHTAR',
    fieldPh: 'Adınızı girin…',
    foot: 'AVENTA · tasarım sistemi v2 · "deniz kıyısı" teması. Düzen için tek kaynak olarak hex değerlerini ve ölçeği kullanın.',
  },
  es: {
    badge: 'SISTEMA DE DISEÑO · KIT DE MARCA v2',
    title: 'Sistema de marca y diseño de AVENTA',
    lead:
      'Un mismo lenguaje para cada pantalla y una especificación para el desarrollador: logotipo, paleta, tipografía, iconos y componentes de la estética "junto al mar".',
    s1: '01 · LOGOTIPO',
    s2: '02 · PALETA',
    s3: '03 · TIPOGRAFÍA',
    s4: '04 · ICONOS',
    s5: '05 · COMPONENTES',
    logoEmblem: 'Emblema · sobre claro',
    logoWhite: 'Logotipo · sobre blanco',
    logoTeal: 'Inverso · sobre verde azulado',
    logoLockup: 'Composición horizontal (principal)',
    logoNote:
      'El emblema es un cuadrado redondeado con una “A”: vértice en verde azulado #0E7E90, barra y punto en coral #FF7A5C. La marca denominativa es Bricolage Grotesque 800, con interletraje de .04em.',
    paletteClient: 'CLIENTE · CLARO “JUNTO AL MAR”',
    paletteInternal: 'INTERNO · OSCURO “MAR PROFUNDO”',
    typeDisplay: 'DISPLAY · TÍTULOS',
    typeUi: 'INTERFAZ · CUERPO',
    typeMono: 'MICROETIQUETAS',
    typeDisplayDesc: '500 · 600 · 700 · 800 — hero, títulos, acentos',
    typeUiDesc: '400–800 — botones, cuerpo, leyendas, precios',
    typeMonoDesc: 'etiquetas, códigos, fechas, leyendas técnicas',
    iconsNote:
      'Línea fina de 1.6px, currentColor, extremos redondeados. Sustituyen a los glifos unicode y a los emojis en toda la interfaz y el panel de administración.',
    iconsInterface: 'INTERFAZ Y ADMINISTRACIÓN',
    iconsEcosystem: 'ECOSISTEMA DE SERVICIOS Y VENTAJAS',
    compButtons: 'BOTONES',
    compPills: 'PÍLDORAS DE ESTADO',
    compField: 'CAMPO DE ENTRADA',
    compToggle: 'INTERRUPTOR',
    fieldPh: 'Introduce tu nombre…',
    foot: 'AVENTA · sistema de diseño v2 · estética "junto al mar". Usa los valores hex y la escala como fuente única para la maquetación.',
  },
  de: {
    badge: 'DESIGNSYSTEM · MARKEN-KIT v2',
    title: 'AVENTA Marken- und Designsystem',
    lead:
      'Eine einheitliche Sprache für jeden Bildschirm und eine Spezifikation für Entwickler: Logo, Farbpalette, Typografie, Icons und Komponenten der Ästhetik "am Meer".',
    s1: '01 · LOGO',
    s2: '02 · FARBPALETTE',
    s3: '03 · TYPOGRAFIE',
    s4: '04 · ICONS',
    s5: '05 · KOMPONENTEN',
    logoEmblem: 'Emblem · auf hellem Grund',
    logoWhite: 'Logo · auf Weiß',
    logoTeal: 'Invers · auf Petrol',
    logoLockup: 'Horizontale Logo-Anordnung (primär)',
    logoNote:
      'Das Emblem ist ein abgerundetes Quadrat mit einem “A”: petrolfarbene Spitze #0E7E90, korallfarbener Querbalken und Punkt #FF7A5C. Die Wortmarke ist Bricolage Grotesque 800, Laufweite .04em.',
    paletteClient: 'KUNDE · HELL “AM MEER”',
    paletteInternal: 'INTERN · DUNKEL “TIEFSEE”',
    typeDisplay: 'DISPLAY · ÜBERSCHRIFTEN',
    typeUi: 'OBERFLÄCHE · FLIESSTEXT',
    typeMono: 'MIKRO-LABELS',
    typeDisplayDesc: '500 · 600 · 700 · 800 — Hero, Überschriften, Akzente',
    typeUiDesc: '400–800 — Schaltflächen, Fließtext, Beschriftungen, Preise',
    typeMonoDesc: 'Labels, Codes, Datumsangaben, technische Beschriftungen',
    iconsNote:
      'Dünne 1.6px-Linie, currentColor, abgerundete Enden. Sie ersetzen Unicode-Glyphen und Emojis in der gesamten Oberfläche und im Adminbereich.',
    iconsInterface: 'OBERFLÄCHE & ADMIN',
    iconsEcosystem: 'SERVICE-ÖKOSYSTEM & VORTEILE',
    compButtons: 'SCHALTFLÄCHEN',
    compPills: 'STATUS-PILLS',
    compField: 'EINGABEFELD',
    compToggle: 'SCHALTER',
    fieldPh: 'Ihren Namen eingeben…',
    foot: 'AVENTA · Designsystem v2 · Ausrichtung "am Meer". Verwenden Sie die Hex-Werte und die Skala als einzige Quelle für das Layout.',
  },
}

/* ------------------------------------------------------------------ */
/*  Static data — palette                                             */
/* ------------------------------------------------------------------ */

const clientColors: ReadonlyArray<Swatch> = [
  { name: 'Page', hex: '#EAF7F8', use: 'Фон приложения / App background', bg: '#EAF7F8', border: true },
  { name: 'Surface', hex: '#FFFFFF', use: 'Карточки, панели / Cards', bg: '#FFFFFF', border: true },
  { name: 'Field', hex: '#F2FAFB', use: 'Поля ввода / Inputs', bg: '#F2FAFB', border: true },
  { name: 'Teal', hex: '#0E7E90', use: 'Бренд, ссылки / Brand, links', bg: '#0E7E90' },
  { name: 'Coral', hex: '#FF7A5C', use: 'Главный CTA / Primary CTA', bg: 'linear-gradient(135deg,#FF8A5B,#FF6F61)' },
  { name: 'Sand', hex: '#FFD56B', use: 'Солнце, акценты / Sun, highlights', bg: '#FFD56B' },
  { name: 'Text', hex: '#0C3B45', use: 'Заголовки / Headings', bg: '#0C3B45' },
  { name: 'Body', hex: '#0B5560', use: 'Абзацы / Paragraphs', bg: '#0B5560' },
  { name: 'Muted', hex: '#5E8A92', use: 'Вторичный / Secondary', bg: '#5E8A92' },
  { name: 'Success', hex: '#27B576', use: 'Доступно, оплачено / Paid', bg: '#27B576' },
  { name: 'Warning', hex: '#FF9F45', use: 'Занято, ожидание / Pending', bg: '#FF9F45' },
  { name: 'Danger', hex: '#E0533E', use: 'Ошибка, отказ / Error', bg: '#E0533E' },
  { name: 'Info', hex: '#2E86C9', use: 'На проверке / Under review', bg: '#2E86C9' },
]

const internalColors: ReadonlyArray<Swatch> = [
  { name: 'Base', hex: '#082A33', use: 'Тёмный фон / Main dark bg', bg: '#082A33', dark: true },
  { name: 'Deep', hex: '#06222A', use: 'Сайдбар, футер / Sidebar', bg: '#06222A', dark: true },
  { name: 'Panel', hex: '#0C3540', use: 'Панели / Panels', bg: '#0C3540', dark: true },
  { name: 'Card', hex: '#0E3A45', use: 'Карточки, строки / Rows', bg: '#0E3A45', dark: true },
  { name: 'Element', hex: '#114451', use: 'Ховер, чипы / Hover', bg: '#114451', dark: true },
  { name: 'Accent', hex: '#FF7A5C', use: 'Активный, primary / Active', bg: '#FF7A5C' },
  { name: 'Accent Light', hex: '#FFB48A', use: 'Текст, градиент / Gradient', bg: '#FFB48A' },
  { name: 'Text', hex: '#ECF1F8', use: 'Основной текст / Text', bg: '#ECF1F8', border: true },
  { name: 'Muted', hex: '#9CB0CB', use: 'Вторичный / Secondary', bg: '#9CB0CB' },
  { name: 'Green', hex: '#6FBF8F', use: 'Статус / Status', bg: '#6FBF8F' },
  { name: 'Amber', hex: '#E0A23E', use: 'Статус / Status', bg: '#E0A23E' },
  { name: 'Blue', hex: '#4E7FE0', use: 'Статус / Status', bg: '#4E7FE0' },
  { name: 'Red', hex: '#CE4A4A', use: 'Статус / Status', bg: '#CE4A4A' },
]

/* ------------------------------------------------------------------ */
/*  Static data — type scale                                          */
/* ------------------------------------------------------------------ */

const typeScale: ReadonlyArray<TypeRow> = [
  {
    label: 'Hero · 58 / 700',
    sample: 'Премиум-аренда у моря',
    style: { font: '700 46px var(--f-display)', letterSpacing: '-0.02em', color: 'var(--av-text)', lineHeight: 1.05 },
  },
  {
    label: 'H1 · 40 / 700',
    sample: 'Доступны к бронированию',
    style: { font: '700 34px var(--f-display)', letterSpacing: '-0.02em', color: 'var(--av-text)' },
  },
  {
    label: 'H2 · 24 / 600',
    sample: 'Дополнительные услуги',
    style: { font: '600 23px var(--f-display)', color: 'var(--av-text)' },
  },
  {
    label: 'Body · 15 / 400',
    sample: 'Премиум-парк, подача в аэропорт и отель, трансферы и консьерж.',
    style: { font: '400 15px var(--f-ui)', color: 'var(--av-body)', lineHeight: 1.6 },
  },
  {
    label: 'Label · 11 / Mono',
    sample: 'МЕСТО ПОДАЧИ · AYT',
    style: { font: '700 11px var(--f-mono)', letterSpacing: '.16em', color: 'var(--av-label)' },
  },
]

/* ------------------------------------------------------------------ */
/*  Static data — icons (thin 1.6px line, currentColor)               */
/* ------------------------------------------------------------------ */

const interfaceIcons: ReadonlyArray<IconDef> = [
  {
    key: 'car',
    label: 'Авто',
    path: (
      <path d="M4 13l1.6-4.6A2 2 0 017.5 7h9a2 2 0 011.9 1.4L20 13v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H7v1a1 1 0 01-1 1H5a1 1 0 01-1-1z" />
    ),
  },
  {
    key: 'calendar',
    label: 'Календарь',
    path: (
      <>
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M4 9h16M8 3v4M16 3v4" />
      </>
    ),
  },
  {
    key: 'shield',
    label: 'Страховка',
    path: (
      <>
        <path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
  },
  {
    key: 'clock',
    label: 'Подача 24/7',
    path: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
  {
    key: 'star',
    label: 'Рейтинг',
    path: <path d="M12 3l2.6 5.6L21 9.3l-4.5 4.3 1.1 6.4L12 17l-5.6 3 1.1-6.4L3 9.3l6.4-.7z" />,
  },
  {
    key: 'transfer',
    label: 'Трансфер',
    path: <path d="M21 16l-9-3-7 4 1.5-5L3 9l5 .5L12 4l1.5 6L21 11z" />,
  },
  {
    key: 'realestate',
    label: 'Недвижим.',
    path: (
      <>
        <path d="M4 21V7l8-4 8 4v14" />
        <path d="M9 21v-5h6v5M9 9h2M13 9h2M9 12.5h2M13 12.5h2" />
      </>
    ),
  },
  {
    key: 'yacht',
    label: 'Яхта',
    path: (
      <>
        <path d="M4 19h16l-2 3H6z" />
        <path d="M12 4v12M12 6l7 8H5z" />
      </>
    ),
  },
  {
    key: 'location',
    label: 'Локация',
    path: (
      <>
        <path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" />
        <circle cx="12" cy="9" r="2.5" />
      </>
    ),
  },
  {
    key: 'phone',
    label: 'Телефон',
    path: <path d="M5 4h3.5l1.5 4-2 1.5a11 11 0 005.5 5.5l1.5-2 4 1.5V19a2 2 0 01-2 2A15 15 0 014 6a2 2 0 011-2z" />,
  },
  {
    key: 'search',
    label: 'Поиск',
    path: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </>
    ),
  },
  {
    key: 'check',
    label: 'Готово',
    path: <path d="M20 6L9 17l-5-5" />,
  },
]

const ecosystemIcons: ReadonlyArray<IconDef> = [
  {
    key: 'dashboard',
    label: 'Дашборд',
    path: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
  },
  {
    key: 'bookings',
    label: 'Заявки',
    path: (
      <>
        <path d="M4 4h16v12H14l-2 3-2-3H4z" />
        <path d="M8 9h8M8 12h5" />
      </>
    ),
  },
  {
    key: 'clients',
    label: 'Клиенты',
    path: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20a6 6 0 0112 0" />
        <path d="M16 6a3 3 0 010 6M21 20a5.5 5.5 0 00-4-5.3" />
      </>
    ),
  },
  {
    key: 'payments',
    label: 'Финансы',
    path: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18M7 15h3" />
      </>
    ),
  },
  {
    key: 'services',
    label: 'Услуги',
    path: <path d="M12 3l2 5 5 .4-3.8 3.3 1.2 4.9L12 14l-4.6 2.6 1.2-4.9L5 8.4 10 8z" />,
  },
  {
    key: 'tours',
    label: 'Экскурсии',
    path: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M15.5 8.5l-2 5-5 2 2-5z" />
      </>
    ),
  },
  {
    key: 'translator',
    label: 'Переводчик',
    path: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
      </>
    ),
  },
  {
    key: 'settings',
    label: 'Настройки',
    path: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
      </>
    ),
  },
  {
    key: 'notifications',
    label: 'Уведомл.',
    path: (
      <>
        <path d="M6 9a6 6 0 1112 0c0 5 2 6 2 7H4c0-1 2-2 2-7z" />
        <path d="M10 21a2 2 0 004 0" />
      </>
    ),
  },
  {
    key: 'price',
    label: 'Цена/залог',
    path: (
      <>
        <path d="M3 12l9-9h6v6l-9 9z" />
        <circle cx="15" cy="9" r="1.4" />
      </>
    ),
  },
  {
    key: 'next',
    label: 'Далее',
    path: <path d="M5 12h14M13 6l6 6-6 6" />,
  },
  {
    key: 'back',
    label: 'Назад',
    path: <path d="M19 12H5M11 18l-6-6 6-6" />,
  },
]

/* ------------------------------------------------------------------ */
/*  Small presentational helpers                                      */
/* ------------------------------------------------------------------ */

const cardStyle: CSSProperties = {
  background: 'var(--av-surface)',
  borderRadius: 'var(--r-card)',
  boxShadow: 'var(--sh-card)',
}

function SectionHead({ children }: { children: ReactNode }) {
  return (
    <div style={{ marginTop: 52, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ font: '700 12px var(--f-mono)', letterSpacing: '.2em', color: 'var(--av-coral)' }}>{children}</div>
      <div style={{ flex: 1, height: 1, background: 'var(--av-hair)' }} />
    </div>
  )
}

function MicroLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ font: '700 10px var(--f-mono)', letterSpacing: '.14em', color: 'var(--av-muted)', ...style }}>
      {children}
    </div>
  )
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width={26}
      height={26}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

function IconCard({ def }: { def: IconDef }) {
  return (
    <div
      className="av-lift-sm"
      style={{
        background: 'var(--av-surface)',
        border: '1px solid var(--av-hair-soft)',
        borderRadius: 'var(--r-card)',
        boxShadow: 'var(--sh-card)',
        padding: '16px 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        color: 'var(--av-teal)',
      }}
    >
      <Icon>{def.path}</Icon>
      <span style={{ font: '600 10px var(--f-ui)', color: 'var(--av-muted)' }}>{def.label}</span>
    </div>
  )
}

function SwatchCard({ c }: { c: Swatch }) {
  return (
    <div
      style={{
        background: 'var(--av-surface)',
        border: '1px solid var(--av-hair-soft)',
        borderRadius: 'var(--r-chip)',
        overflow: 'hidden',
        boxShadow: 'var(--sh-card)',
      }}
    >
      <div
        style={{
          height: 76,
          background: c.bg,
          borderBottom: c.border ? '1px solid var(--av-hair-soft)' : 'none',
        }}
      />
      <div style={{ padding: '12px 14px' }}>
        <div style={{ font: '700 13px var(--f-ui)', color: 'var(--av-text)' }}>{c.name}</div>
        <div style={{ marginTop: 3, font: '700 11px var(--f-mono)', color: 'var(--av-label)' }}>{c.hex}</div>
        <div style={{ marginTop: 5, font: '500 10px var(--f-ui)', color: 'var(--av-muted)' }}>{c.use}</div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function BrandKit() {
  const t = useDict(dict)

  const swatchGrid: CSSProperties = {
    marginTop: 16,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))',
    gap: 12,
  }
  const iconGrid: CSSProperties = {
    marginTop: 12,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill,minmax(112px,1fr))',
    gap: 10,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--av-bg)' }}>
      {/* sky band + nav */}
      <div style={{ background: 'var(--grad-sky)', paddingBottom: 36 }}>
        <ClientNav />
        <Container style={{ paddingTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ font: '700 12px var(--f-mono)', letterSpacing: '.16em', color: 'var(--av-teal)' }}>
              {t.badge}
            </div>
          </div>
          <h1
            style={{
              margin: '20px 0 0',
              font: '700 clamp(30px,4.4vw,46px) var(--f-display)',
              letterSpacing: '-0.02em',
              lineHeight: 1.08,
              color: 'var(--av-text)',
              maxWidth: 720,
            }}
          >
            {t.title}
          </h1>
          <p style={{ margin: '14px 0 0', font: '400 16px var(--f-ui)', lineHeight: 1.6, color: 'var(--av-body)', maxWidth: 620 }}>
            {t.lead}
          </p>
        </Container>
      </div>

      <Container style={{ paddingBottom: 70 }}>
        {/* ---- 01 · LOGO ---- */}
        <SectionHead>{t.s1}</SectionHead>
        <div
          style={{
            marginTop: 18,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
            gap: 16,
          }}
        >
          {/* emblem on light page */}
          <div
            style={{
              ...cardStyle,
              background: 'var(--av-bg)',
              border: '1px solid var(--av-hair-soft)',
              padding: 30,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              minHeight: 170,
            }}
          >
            <LogoMark size={64} variant="light" />
            <MicroLabel>{t.logoEmblem}</MicroLabel>
          </div>

          {/* full logo on white */}
          <div
            style={{
              ...cardStyle,
              padding: 30,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              minHeight: 170,
            }}
          >
            <Logo size={46} wordmarkSize={26} to={null} />
            <MicroLabel>{t.logoWhite}</MicroLabel>
          </div>

          {/* on-teal inverse variant */}
          <div
            style={{
              borderRadius: 'var(--r-card)',
              boxShadow: 'var(--sh-card)',
              background: 'var(--grad-teal)',
              padding: 30,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              minHeight: 170,
            }}
          >
            <Logo size={46} wordmarkSize={26} variant="onTeal" to={null} />
            <div style={{ font: '700 10px var(--f-mono)', letterSpacing: '.14em', color: 'rgba(255,255,255,.85)' }}>
              {t.logoTeal}
            </div>
          </div>

          {/* full horizontal lockup */}
          <div
            style={{
              ...cardStyle,
              gridColumn: '1 / -1',
              padding: 34,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 18,
              minHeight: 150,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <LogoMark size={54} variant="light" />
              <div>
                <div style={{ font: '800 34px var(--f-display)', letterSpacing: '.04em', color: 'var(--av-text)' }}>
                  AVENTA
                </div>
                <div style={{ marginTop: 2, font: '700 10px var(--f-mono)', letterSpacing: '.22em', color: 'var(--av-muted)' }}>
                  PREMIUM CAR RENTAL · TURKEY
                </div>
              </div>
            </div>
            <MicroLabel>{t.logoLockup}</MicroLabel>
          </div>
        </div>
        <p style={{ marginTop: 14, font: '400 13px var(--f-ui)', lineHeight: 1.6, color: 'var(--av-muted)', maxWidth: 760 }}>
          {t.logoNote}
        </p>

        {/* ---- 02 · PALETTE ---- */}
        <SectionHead>{t.s2}</SectionHead>
        <MicroLabel style={{ marginTop: 18 }}>{t.paletteClient}</MicroLabel>
        <div style={swatchGrid}>
          {clientColors.map((c) => (
            <SwatchCard key={c.name + c.hex} c={c} />
          ))}
        </div>
        <MicroLabel style={{ marginTop: 26 }}>{t.paletteInternal}</MicroLabel>
        <div style={swatchGrid}>
          {internalColors.map((c) => (
            <SwatchCard key={'int-' + c.name + c.hex} c={c} />
          ))}
        </div>

        {/* ---- 03 · TYPOGRAPHY ---- */}
        <SectionHead>{t.s3}</SectionHead>
        <div
          style={{
            marginTop: 18,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
            gap: 16,
          }}
        >
          <div style={{ ...cardStyle, padding: 26 }}>
            <MicroLabel>{t.typeDisplay}</MicroLabel>
            <div style={{ marginTop: 10, font: '700 38px var(--f-display)', letterSpacing: '-0.02em', color: 'var(--av-text)' }}>
              Bricolage Grotesque
            </div>
            <div style={{ marginTop: 6, font: '500 13px var(--f-ui)', color: 'var(--av-muted)' }}>{t.typeDisplayDesc}</div>
          </div>
          <div style={{ ...cardStyle, padding: 26 }}>
            <MicroLabel>{t.typeUi}</MicroLabel>
            <div style={{ marginTop: 10, font: '700 34px var(--f-ui)', color: 'var(--av-text)' }}>Plus Jakarta Sans</div>
            <div style={{ marginTop: 6, font: '500 13px var(--f-ui)', color: 'var(--av-muted)' }}>{t.typeUiDesc}</div>
          </div>
          <div style={{ ...cardStyle, padding: 26 }}>
            <MicroLabel>{t.typeMono}</MicroLabel>
            <div style={{ marginTop: 10, font: '700 30px var(--f-mono)', color: 'var(--av-text)' }}>Space Mono</div>
            <div style={{ marginTop: 6, font: '500 13px var(--f-ui)', color: 'var(--av-muted)' }}>{t.typeMonoDesc}</div>
          </div>
        </div>
        <div style={{ ...cardStyle, marginTop: 14, padding: '8px 26px' }}>
          {typeScale.map((row, i) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 20,
                padding: '16px 0',
                borderBottom: i < typeScale.length - 1 ? '1px solid var(--av-hair-soft)' : 'none',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ width: 130, flexShrink: 0, font: '700 11px var(--f-mono)', color: 'var(--av-muted)' }}>
                {row.label}
              </div>
              <div style={row.style}>{row.sample}</div>
            </div>
          ))}
        </div>

        {/* ---- 04 · ICONS ---- */}
        <SectionHead>{t.s4}</SectionHead>
        <p style={{ marginTop: 10, font: '400 13px var(--f-ui)', lineHeight: 1.6, color: 'var(--av-muted)', maxWidth: 760 }}>
          {t.iconsNote}
        </p>
        <MicroLabel style={{ marginTop: 18, color: 'var(--av-label)' }}>{t.iconsInterface}</MicroLabel>
        <div style={iconGrid}>
          {interfaceIcons.map((d) => (
            <IconCard key={d.key} def={d} />
          ))}
        </div>
        <MicroLabel style={{ marginTop: 22, color: 'var(--av-label)' }}>{t.iconsEcosystem}</MicroLabel>
        <div style={iconGrid}>
          {ecosystemIcons.map((d) => (
            <IconCard key={d.key} def={d} />
          ))}
        </div>

        {/* ---- 05 · COMPONENTS ---- */}
        <SectionHead>{t.s5}</SectionHead>
        <div
          style={{
            marginTop: 18,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
            gap: 16,
          }}
        >
          {/* buttons */}
          <div style={{ ...cardStyle, padding: 24 }}>
            <MicroLabel style={{ marginBottom: 16 }}>{t.compButtons}</MicroLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
              <CoralButton>Забронировать</CoralButton>
              <OutlineButton>Подробнее</OutlineButton>
              <button
                className="av-cta"
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '12px 8px',
                  font: '700 14px var(--f-ui)',
                  color: 'var(--av-teal)',
                }}
              >
                Отмена
              </button>
            </div>
          </div>

          {/* status pills */}
          <div style={{ ...cardStyle, padding: 24 }}>
            <MicroLabel style={{ marginBottom: 16 }}>{t.compPills}</MicroLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              <StatusPill tone="success">Доступен</StatusPill>
              <StatusPill tone="warn">Ожидает</StatusPill>
              <StatusPill tone="danger">Отменена</StatusPill>
              <StatusPill tone="info">На проверке</StatusPill>
              <StatusPill tone="neutral">Закрыта</StatusPill>
            </div>
          </div>

          {/* field + toggle */}
          <div style={{ ...cardStyle, padding: 24 }}>
            <MicroLabel style={{ marginBottom: 14 }}>{t.compField}</MicroLabel>
            <input
              type="text"
              placeholder={t.fieldPh}
              style={{
                width: '100%',
                background: 'var(--av-field)',
                border: '1px solid var(--av-hair)',
                borderRadius: 'var(--r-field)',
                padding: '12px 14px',
                font: '500 13px var(--f-ui)',
                color: 'var(--av-text)',
                outline: 'none',
              }}
            />
            <MicroLabel style={{ margin: '20px 0 14px' }}>{t.compToggle}</MicroLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* on */}
              <span
                style={{
                  width: 44,
                  height: 26,
                  borderRadius: 999,
                  background: 'var(--av-success)',
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 3,
                    right: 3,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 1px 3px rgba(11,85,96,.3)',
                  }}
                />
              </span>
              {/* off */}
              <span
                style={{
                  width: 44,
                  height: 26,
                  borderRadius: 999,
                  background: 'var(--av-hair-strong)',
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: 3,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 1px 3px rgba(11,85,96,.3)',
                  }}
                />
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 44,
            paddingTop: 22,
            borderTop: '1px solid var(--av-hair)',
            font: '500 12px var(--f-ui)',
            color: 'var(--av-muted)',
          }}
        >
          {t.foot}
        </div>
      </Container>

      <ClientFooter />
    </div>
  )
}
