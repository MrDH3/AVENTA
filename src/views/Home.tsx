'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import LanguageDropdown from '../components/LanguageDropdown'
import ClientFooter from '../components/ClientFooter'
import { useIsMobile } from '../components/useIsMobile'
import { useDict } from '../i18n/lang'
import type { CarView } from '../lib/view'
import type { AboutReview } from '../components/AboutSection'
import { searchAvailabilityAction } from '../server/misc-actions'
import { Ic, I, RdCarCard, RD_CSS } from '../components/RdKit'
import CarDetailDrawer from '../components/CarDetailDrawer'

/* ════════════════════════════════════════════════════════════════════════════
   AVENTA — Landing (redesign per design_handoff_aventa_landing).
   Sleek/tech-forward, "wow while scrolling": dark cinematic hero (keeps the real
   /image_.png with a gentle float), real-photo fleet with 3D tilt, ghost-number
   steps, why-bento, insurance band, about + count-up stats, reviews, closing CTA.
   Design tokens are scoped under `.rd` so nothing leaks into the rest of the app.
   Motion is progressive enhancement — everything is visible with JS/motion off.
   ═══════════════════════════════════════════════════════════════════════════ */

const dict = {
  ru: {
    navCars: 'Автомобили', navHow: 'Как это работает', navWhy: 'Почему Aventa', navAbout: 'О нас', navReviews: 'Отзывы',
    signIn: 'Войти', choose: 'Выбрать авто',
    heroKicker: 'ПРЕМИУМ-АРЕНДА · АНТАЛИЯ', heroT1: 'Готовы отправиться ', heroT2: 'в путь?',
    heroSub: 'Премиальные авто с подачей по всей Анталии — с полным страхованием, без кредитной карты.',
    fPickup: 'ПОЛУЧЕНИЕ', fReturn: 'ВОЗВРАТ', fLoc: 'МЕСТО ПОДАЧИ', findBtn: 'Найти авто', searching: 'Ищем…',
    searchNote: 'Показываем только свободные на ваши даты авто', dateErr: 'Проверьте даты — возврат должен быть позже получения',
    freeOn: (n: number, r: string) => `Свободно на ${r}: ${n} авто`, noneFree: 'На эти даты свободных авто нет — измените даты', reset: 'Показать все',
    tYears: '8 ЛЕТ В АНТАЛИИ', tGuests: '2 000+ ДОВОЛЬНЫХ ГОСТЕЙ', tRated: '4.9★ РЕЙТИНГ', tFleet: (n: number) => `ПАРК · ${n} АВТО`, scrollLbl: 'ЛИСТАЙТЕ',
    fleetKicker: (n: number) => `АВТОПАРК · ${n} АВТО`, fleetTitle: 'Выберите свой автомобиль',
    fleetSub: 'От экономичных хэтчбеков до представительских седанов и внедорожников — всё с полным страхованием.',
    available: 'Свободно', bookNow: 'Забронировать', checkDates: 'Проверить даты', perDay: '/сут', deposit: 'Залог',
    chipInstant: 'Мгновенная бронь', chipCash: 'Залог наличными', chipNoCard: 'Без кредитной карты',
    howKicker: 'КАК ЭТО РАБОТАЕТ', howTitle: 'Четыре шага до открытой дороги',
    how1t: 'Выберите авто', how1d: 'Отфильтруйте по датам и классу, сравните цены и характеристики.',
    how2t: 'Забронируйте онлайн', how2d: 'Загрузите права и паспорт в защищённом кабинете и внесите депозит.',
    how3t: 'Мы подаём', how3d: 'Встретим в аэропорту или привезём авто по адресу — точно ко времени.',
    how4t: 'В путь', how4d: 'Полный бак, чистый салон и поддержка на связи всю поездку.',
    whyKicker: 'ПОЧЕМУ AVENTA', whyTitle: 'Аренда, которой доверяют',
    why1t: 'Местная команда в Анталии', why1d: 'Настоящий офис в Коньяалты, а не колл-центр за рубежом. Встречаем в аэропорту и на связи всю поездку.',
    why2t: 'Честная цена', why2d: 'Одна цена в договоре: без доплат на стойке и скрытых сборов.',
    why3t: 'Ухоженный парк', why3d: 'Свежие модели, регулярное ТО и детейлинг перед каждой подачей.',
    why4t: 'Ваш язык, 24/7', why4d: 'Поддержка на русском и английском — до, во время и после поездки.',
    why5t: 'Полное страхование', why5d: 'Базовая, расширенная или без франшизы — выбор за вами.',
    whyEst: 'ОСН. 2018 · КОНЬЯАЛТЫ, АНТАЛИЯ', statAvg: 'средний рейтинг', statSince: 'довольных гостей с 2018',
    insKicker: 'СТРАХОВАНИЕ И ЗАЛОГ', insTitle: 'Спокойствие включено. Сюрпризов — нет.',
    insBody: 'Базовая страховка (CDW/TP) входит в каждую аренду. Нужна полная уверенность — добавьте расширенную защиту с нулевой франшизой: царапины, колёса и стёкла берём на себя. Залог блокируется на карте и полностью возвращается при возврате авто в исходном состоянии.',
    insChip1: 'Базовая включена', insChip2: 'Ноль франшизы (опция)', insChip3: 'Залог возвращается',
    aboutKicker: 'О НАС · АНТАЛИЯ С 2018', aboutTitle: 'Премиум-аренда, которой доверяют гости Турции',
    aboutBody: 'Мы сопровождаем всю вашу поездку — от встречи в аэропорту до возврата ключей. Настоящая команда в Анталии, честные условия и поддержка на вашем языке.',
    aboutBrowse: 'Смотреть автопарк', aboutRead: 'Читать отзывы',
    sYears: 'лет в Анталии', sYearsSub: 'локально, с 2018', sGuests: 'довольных гостей', sGuestsSub: 'и растёт',
    sRating: 'средний рейтинг', sRatingSub: 'по всем отзывам', sRepeat: 'возвращаются снова', sRepeatSub: 'повторные гости',
    revKicker: 'ОТЗЫВЫ ГОСТЕЙ', revTitle: 'Нас любят 2 000+ путешественников', revBased: (n: string) => `на основе ${n} отзывов`,
    ctaKicker: 'ЖДЁМ, КОГДА ВЫ ПРИЛЕТИТЕ', ctaTitle: 'Ваше авто ждёт в Анталии',
    ctaBody: 'Выберите машину, укажите место подачи — и поездка начнётся, как только вы приземлитесь.', ctaChoose: 'Выбрать авто',
    cWa: 'WhatsApp · Telegram', cWaSub: 'hello@aventa.rent', cHours: 'Пн–Вс · 09:00–21:00', cHoursSub: 'Поддержка на вашем языке',
    cLoc: 'Анталия, Коньяалты, Турция', cLocSub: 'Аэропорт AYT и по вашему адресу',
    locAirport: 'Аэропорт Анталии (AYT)', locLara: 'Лара', locKonyaalti: 'Коньяалты', locOldtown: 'Калеичи (Старый город)', locBelek: 'Белек', locAddress: 'По моему адресу',
  },
  en: {
    navCars: 'Cars', navHow: 'How it works', navWhy: 'Why Aventa', navAbout: 'About', navReviews: 'Reviews',
    signIn: 'Sign in', choose: 'Choose a car',
    heroKicker: 'PREMIUM CAR RENTAL · ANTALYA', heroT1: 'Ready to hit ', heroT2: 'the road?',
    heroSub: 'Premium cars delivered across Antalya — fully insured, no credit card.',
    fPickup: 'PICK-UP', fReturn: 'RETURN', fLoc: 'PICK-UP POINT', findBtn: 'Find a car', searching: 'Searching…',
    searchNote: 'We show only cars free for your dates', dateErr: 'Check your dates — return must be after pick-up',
    freeOn: (n: number, r: string) => `Free on ${r}: ${n} cars`, noneFree: 'No cars free for those dates — try other dates', reset: 'Show all',
    tYears: '8 YEARS IN ANTALYA', tGuests: '2,000+ HAPPY GUESTS', tRated: '4.9★ RATED', tFleet: (n: number) => `${n}-CAR FLEET`, scrollLbl: 'SCROLL',
    fleetKicker: (n: number) => `FLEET · ${n} CARS`, fleetTitle: 'Choose your car',
    fleetSub: 'From frugal hatchbacks to executive saloons and SUVs — every one with full insurance.',
    available: 'Available', bookNow: 'Book now', checkDates: 'Check dates', perDay: '/day', deposit: 'Deposit',
    chipInstant: 'Instant booking', chipCash: 'Cash deposit possible', chipNoCard: 'No credit card',
    howKicker: 'HOW IT WORKS', howTitle: 'Four steps to the open road',
    how1t: 'Pick your car', how1d: 'Filter by dates and class, compare prices and specs side by side.',
    how2t: 'Book online', how2d: 'Upload your licence and passport in a secure cabinet and pay the deposit.',
    how3t: 'We deliver', how3d: 'We meet you at the airport or bring the car to your address — right on time.',
    how4t: 'Hit the road', how4d: 'Full tank, clean cabin, and support on call for the whole trip.',
    whyKicker: 'WHY AVENTA', whyTitle: 'Rental you can trust',
    why1t: 'A local team in Antalya', why1d: 'A real office in Konyaaltı — not an overseas call-centre. We meet you at the airport and stay on call for the whole trip.',
    why2t: 'Transparent pricing', why2d: 'One price in the contract: no counter upsells, no hidden fees.',
    why3t: 'A cared-for fleet', why3d: 'Recent models, regular servicing and detailing before every handover.',
    why4t: 'Your language, 24/7', why4d: 'Support in Russian and English — before, during and after your trip.',
    why5t: 'Full insurance', why5d: 'Basic, extended or zero-excess cover — the choice is yours.',
    whyEst: 'EST. 2018 · KONYAALTI, ANTALYA', statAvg: 'average rating', statSince: 'happy guests since 2018',
    insKicker: 'INSURANCE & DEPOSIT', insTitle: 'Peace of mind included. No surprises.',
    insBody: 'Basic insurance (CDW/TP) is included in every rental. Want total confidence? Add extended zero-excess cover — scratches, tyres and glass are on us. Your deposit is held on your card and fully released when you return the car as it left.',
    insChip1: 'Basic included', insChip2: 'Zero-excess (option)', insChip3: 'Deposit refunded',
    aboutKicker: 'ABOUT · ANTALYA SINCE 2018', aboutTitle: 'Premium rental, trusted by guests of Türkiye',
    aboutBody: 'We accompany your whole trip — from meeting you at the airport to the key handback. A real team in Antalya, honest terms, and support in your language.',
    aboutBrowse: 'Browse the fleet', aboutRead: 'Read reviews',
    sYears: 'years in Antalya', sYearsSub: 'local, since 2018', sGuests: 'happy guests', sGuestsSub: 'and counting',
    sRating: 'average rating', sRatingSub: 'across all reviews', sRepeat: 'come back again', sRepeatSub: 'repeat guests',
    revKicker: 'GUEST REVIEWS', revTitle: 'Loved by 2,000+ travellers', revBased: (n: string) => `based on ${n} reviews`,
    ctaKicker: 'READY WHEN YOU LAND', ctaTitle: 'Your car is waiting in Antalya',
    ctaBody: 'Pick your car, choose where we drop it off, and start the trip the moment you land.', ctaChoose: 'Choose a car',
    cWa: 'WhatsApp · Telegram', cWaSub: 'hello@aventa.rent', cHours: 'Mon–Sun · 09:00–21:00', cHoursSub: 'Support in your language',
    cLoc: 'Antalya, Konyaaltı, Türkiye', cLocSub: 'Airport AYT & to your address',
    locAirport: 'Antalya Airport (AYT)', locLara: 'Lara', locKonyaalti: 'Konyaaltı', locOldtown: 'Kaleiçi (Old Town)', locBelek: 'Belek', locAddress: 'To my address',
  },
  tr: {
    navCars: 'Araçlar', navHow: 'Nasıl çalışır', navWhy: 'Neden Aventa', navAbout: 'Hakkımızda', navReviews: 'Yorumlar',
    signIn: 'Giriş', choose: 'Araç seç',
    heroKicker: 'PREMIUM KİRALAMA · ANTALYA', heroT1: 'Yola çıkmaya ', heroT2: 'hazır mısınız?',
    heroSub: 'Antalya genelinde teslim edilen premium araçlar — tam sigortalı, kredi kartı gerekmez.',
    fPickup: 'ALIŞ', fReturn: 'İADE', fLoc: 'ALIŞ NOKTASI', findBtn: 'Araç bul', searching: 'Aranıyor…',
    searchNote: 'Yalnızca tarihlerinize uygun müsait araçları gösteriyoruz', dateErr: 'Tarihleri kontrol edin — iade, alıştan sonra olmalı',
    freeOn: (n: number, r: string) => `${r} için müsait: ${n} araç`, noneFree: 'Bu tarihlerde müsait araç yok — başka tarih deneyin', reset: 'Tümünü göster',
    tYears: 'ANTALYA’DA 8 YIL', tGuests: '2000+ MUTLU MİSAFİR', tRated: '4.9★ PUAN', tFleet: (n: number) => `FİLO · ${n} ARAÇ`, scrollLbl: 'KAYDIR',
    fleetKicker: (n: number) => `FİLO · ${n} ARAÇ`, fleetTitle: 'Aracınızı seçin',
    fleetSub: 'Ekonomik otomobillerden üst sınıf sedanlara ve SUV modellerine kadar — hepsi tam sigortalı.',
    available: 'Müsait', bookNow: 'Rezerve et', checkDates: 'Tarihleri kontrol et', perDay: '/gün', deposit: 'Depozito',
    chipInstant: 'Anında rezervasyon', chipCash: 'Nakit depozito mümkün', chipNoCard: 'Kredi kartı gerekmez',
    howKicker: 'NASIL ÇALIŞIR', howTitle: 'Açık yola dört adım',
    how1t: 'Aracınızı seçin', how1d: 'Tarih ve sınıfa göre filtreleyin, fiyat ve özellikleri yan yana karşılaştırın.',
    how2t: 'Online rezervasyon', how2d: 'Ehliyet ve pasaportunuzu güvenli panele yükleyin ve depozitoyu ödeyin.',
    how3t: 'Teslim ederiz', how3d: 'Sizi havalimanında karşılar ya da aracı adresinize getiririz — tam zamanında.',
    how4t: 'Yola çıkın', how4d: 'Dolu depo, temiz iç mekân ve tüm yolculuk boyunca telefon desteği.',
    whyKicker: 'NEDEN AVENTA', whyTitle: 'Güvenebileceğiniz kiralama',
    why1t: 'Antalya’da yerel ekip', why1d: 'Konyaaltı’nda gerçek bir ofis — yurt dışında çağrı merkezi değil. Sizi havalimanında karşılar ve yol boyunca yanınızdayız.',
    why2t: 'Şeffaf fiyatlandırma', why2d: 'Sözleşmede tek fiyat: bankoda ek satış yok, gizli ücret yok.',
    why3t: 'Özenle bakılan filo', why3d: 'Güncel modeller, düzenli bakım, her teslimattan önce detaylı temizlik.',
    why4t: 'Kendi dilinizde, 7/24', why4d: 'Rusça ve İngilizce destek — öncesinde, sırasında ve sonrasında.',
    why5t: 'Tam sigorta', why5d: 'Temel, genişletilmiş veya muafiyetsiz — seçim sizin.',
    whyEst: 'KURULUŞ 2018 · KONYAALTI, ANTALYA', statAvg: 'ortalama puan', statSince: '2018’den beri mutlu misafir',
    insKicker: 'SİGORTA VE DEPOZİTO', insTitle: 'Gönül rahatlığı dahil. Sürpriz yok.',
    insBody: 'Temel sigorta (CDW/TP) her kiralamaya dahildir. Tam güvence isterseniz muafiyetsiz genişletilmiş korumayı ekleyin: çizikler, lastikler ve camlar bizden. Depozito kartınızda bloke edilir ve aracı teslim aldığınız durumda iade ettiğinizde tamamen serbest bırakılır.',
    insChip1: 'Temel dahil', insChip2: 'Sıfır muafiyet (opsiyon)', insChip3: 'Depozito iade edilir',
    aboutKicker: 'HAKKIMIZDA · 2018’DEN BERİ ANTALYA', aboutTitle: 'Türkiye misafirlerinin güvendiği premium kiralama',
    aboutBody: 'Tüm yolculuğunuza eşlik ederiz — havalimanında karşılamadan anahtar teslimine kadar. Antalya’da gerçek bir ekip, dürüst koşullar ve kendi dilinizde destek.',
    aboutBrowse: 'Filoya göz atın', aboutRead: 'Yorumları oku',
    sYears: 'yıldır Antalya’da', sYearsSub: 'yerel, 2018’den beri', sGuests: 'mutlu misafir', sGuestsSub: 've artıyor',
    sRating: 'ortalama puan', sRatingSub: 'tüm yorumlarda', sRepeat: 'tekrar geliyor', sRepeatSub: 'geri dönen misafir',
    revKicker: 'MİSAFİR YORUMLARI', revTitle: '2000+ gezgin tarafından sevildi', revBased: (n: string) => `${n} yoruma dayalı`,
    ctaKicker: 'İNDİĞİNİZDE HAZIR', ctaTitle: 'Aracınız Antalya’da bekliyor',
    ctaBody: 'Aracınızı seçin, teslim noktasını belirtin — yolculuk indiğiniz an başlasın.', ctaChoose: 'Araç seç',
    cWa: 'WhatsApp · Telegram', cWaSub: 'hello@aventa.rent', cHours: 'Pzt–Paz · 09:00–21:00', cHoursSub: 'Kendi dilinizde destek',
    cLoc: 'Antalya, Konyaaltı, Türkiye', cLocSub: 'Havalimanı AYT ve adresinize',
    locAirport: 'Antalya Havalimanı (AYT)', locLara: 'Lara', locKonyaalti: 'Konyaaltı', locOldtown: 'Kaleiçi (Eski Şehir)', locBelek: 'Belek', locAddress: 'Adresime',
  },
  es: {
    navCars: 'Coches', navHow: 'Cómo funciona', navWhy: 'Por qué Aventa', navAbout: 'Nosotros', navReviews: 'Opiniones',
    signIn: 'Entrar', choose: 'Elegir coche',
    heroKicker: 'ALQUILER PREMIUM · ANTALYA', heroT1: '¿Listo para salir ', heroT2: 'a la carretera?',
    heroSub: 'Coches premium entregados por toda Antalya — con seguro completo, sin tarjeta de crédito.',
    fPickup: 'RECOGIDA', fReturn: 'DEVOLUCIÓN', fLoc: 'PUNTO DE RECOGIDA', findBtn: 'Buscar coche', searching: 'Buscando…',
    searchNote: 'Solo mostramos coches disponibles para tus fechas', dateErr: 'Revisa las fechas — la devolución debe ser posterior a la recogida',
    freeOn: (n: number, r: string) => `Disponibles ${r}: ${n} coches`, noneFree: 'No hay coches disponibles para esas fechas — prueba con otras', reset: 'Mostrar todos',
    tYears: '8 AÑOS EN ANTALYA', tGuests: '2000+ CLIENTES FELICES', tRated: '4.9★ VALORADO', tFleet: (n: number) => `FLOTA · ${n} COCHES`, scrollLbl: 'DESLIZA',
    fleetKicker: (n: number) => `FLOTA · ${n} COCHES`, fleetTitle: 'Elige tu coche',
    fleetSub: 'Desde utilitarios económicos hasta berlinas ejecutivas y SUV — todos con seguro completo.',
    available: 'Disponible', bookNow: 'Reservar', checkDates: 'Ver fechas', perDay: '/día', deposit: 'Depósito',
    chipInstant: 'Reserva instantánea', chipCash: 'Depósito en efectivo posible', chipNoCard: 'Sin tarjeta de crédito',
    howKicker: 'CÓMO FUNCIONA', howTitle: 'Cuatro pasos hasta la carretera',
    how1t: 'Elige tu coche', how1d: 'Filtra por fechas y categoría, compara precios y características.',
    how2t: 'Reserva online', how2d: 'Sube tu permiso y pasaporte en un área segura y paga el depósito.',
    how3t: 'Te lo llevamos', how3d: 'Te recibimos en el aeropuerto o llevamos el coche a tu dirección — siempre puntuales.',
    how4t: 'A la carretera', how4d: 'Depósito lleno, interior limpio y asistencia durante todo el viaje.',
    whyKicker: 'POR QUÉ AVENTA', whyTitle: 'Un alquiler de confianza',
    why1t: 'Un equipo local en Antalya', why1d: 'Una oficina real en Konyaaltı — no un centro de llamadas en el extranjero. Te recibimos en el aeropuerto y te acompañamos todo el viaje.',
    why2t: 'Precios transparentes', why2d: 'Un solo precio en el contrato: sin ventas en el mostrador ni cargos ocultos.',
    why3t: 'Una flota cuidada', why3d: 'Modelos recientes, mantenimiento periódico y limpieza a fondo antes de cada entrega.',
    why4t: 'Tu idioma, 24/7', why4d: 'Atención en ruso e inglés — antes, durante y después.',
    why5t: 'Seguro completo', why5d: 'Básico, ampliado o sin franquicia — tú eliges.',
    whyEst: 'DESDE 2018 · KONYAALTI, ANTALYA', statAvg: 'valoración media', statSince: 'clientes felices desde 2018',
    insKicker: 'SEGURO Y DEPÓSITO', insTitle: 'Tranquilidad incluida. Sin sorpresas.',
    insBody: 'El seguro básico (CDW/TP) está incluido en cada alquiler. ¿Quieres total tranquilidad? Añade la cobertura ampliada sin franquicia: arañazos, neumáticos y lunas corren de nuestra cuenta. El depósito se bloquea en tu tarjeta y se libera por completo al devolver el coche tal como te lo entregamos.',
    insChip1: 'Básico incluido', insChip2: 'Sin franquicia (opción)', insChip3: 'Depósito reembolsado',
    aboutKicker: 'NOSOTROS · ANTALYA DESDE 2018', aboutTitle: 'Alquiler premium en el que confían los visitantes de Türkiye',
    aboutBody: 'Te acompañamos durante todo el viaje — desde el aeropuerto hasta la entrega de llaves. Un equipo real en Antalya, condiciones honestas y atención en tu idioma.',
    aboutBrowse: 'Ver la flota', aboutRead: 'Leer opiniones',
    sYears: 'años en Antalya', sYearsSub: 'local, desde 2018', sGuests: 'clientes felices', sGuestsSub: 'y sumando',
    sRating: 'valoración media', sRatingSub: 'en todas las opiniones', sRepeat: 'vuelven de nuevo', sRepeatSub: 'clientes recurrentes',
    revKicker: 'OPINIONES DE CLIENTES', revTitle: 'Con la confianza de 2000+ viajeros', revBased: (n: string) => `basado en ${n} opiniones`,
    ctaKicker: 'LISTOS CUANDO ATERRICES', ctaTitle: 'Tu coche te espera en Antalya',
    ctaBody: 'Elige tu coche, indica dónde lo dejamos y empieza el viaje en cuanto aterrices.', ctaChoose: 'Elegir coche',
    cWa: 'WhatsApp · Telegram', cWaSub: 'hello@aventa.rent', cHours: 'Lun–Dom · 09:00–21:00', cHoursSub: 'Atención en tu idioma',
    cLoc: 'Antalya, Konyaaltı, Türkiye', cLocSub: 'Aeropuerto AYT y a tu dirección',
    locAirport: 'Aeropuerto de Antalya (AYT)', locLara: 'Lara', locKonyaalti: 'Konyaaltı', locOldtown: 'Kaleiçi (casco antiguo)', locBelek: 'Belek', locAddress: 'A mi dirección',
  },
  de: {
    navCars: 'Autos', navHow: 'So funktioniert’s', navWhy: 'Warum Aventa', navAbout: 'Über uns', navReviews: 'Bewertungen',
    signIn: 'Anmelden', choose: 'Auto wählen',
    heroKicker: 'PREMIUM-VERMIETUNG · ANTALYA', heroT1: 'Bereit für ', heroT2: 'die Straße?',
    heroSub: 'Premium-Autos, geliefert in ganz Antalya — vollversichert, ohne Kreditkarte.',
    fPickup: 'ABHOLUNG', fReturn: 'RÜCKGABE', fLoc: 'ABHOLORT', findBtn: 'Auto finden', searching: 'Suche läuft…',
    searchNote: 'Wir zeigen nur Autos, die in Ihrem Zeitraum verfügbar sind', dateErr: 'Bitte Daten prüfen — die Rückgabe muss nach der Abholung liegen',
    freeOn: (n: number, r: string) => `Verfügbar ${r}: ${n} Autos`, noneFree: 'Keine Autos für diese Daten verfügbar — andere Daten wählen', reset: 'Alle anzeigen',
    tYears: '8 JAHRE IN ANTALYA', tGuests: '2000+ ZUFRIEDENE GÄSTE', tRated: '4.9★ BEWERTET', tFleet: (n: number) => `FLOTTE · ${n} AUTOS`, scrollLbl: 'SCROLLEN',
    fleetKicker: (n: number) => `FLOTTE · ${n} AUTOS`, fleetTitle: 'Wählen Sie Ihr Auto',
    fleetSub: 'Vom sparsamen Kleinwagen bis zur Oberklasse-Limousine und zum SUV — alle mit Vollversicherung.',
    available: 'Verfügbar', bookNow: 'Jetzt buchen', checkDates: 'Termine prüfen', perDay: '/Tag', deposit: 'Kaution',
    chipInstant: 'Sofortbuchung', chipCash: 'Barkaution möglich', chipNoCard: 'Keine Kreditkarte',
    howKicker: 'SO FUNKTIONIERT ES', howTitle: 'In vier Schritten auf die Straße',
    how1t: 'Auto auswählen', how1d: 'Nach Daten und Klasse filtern, Preise und Ausstattung vergleichen.',
    how2t: 'Online buchen', how2d: 'Führerschein und Reisepass im sicheren Bereich hochladen und Kaution zahlen.',
    how3t: 'Wir liefern', how3d: 'Wir empfangen Sie am Flughafen oder bringen das Auto zu Ihrer Adresse — pünktlich.',
    how4t: 'Losfahren', how4d: 'Voller Tank, sauberer Innenraum und Support während der gesamten Fahrt.',
    whyKicker: 'WARUM AVENTA', whyTitle: 'Vermietung, der Sie vertrauen können',
    why1t: 'Ein lokales Team in Antalya', why1d: 'Ein echtes Büro in Konyaaltı — kein Callcenter im Ausland. Wir empfangen Sie am Flughafen und sind die ganze Fahrt erreichbar.',
    why2t: 'Transparente Preise', why2d: 'Ein Preis im Vertrag: kein Zusatzverkauf am Schalter, keine versteckten Gebühren.',
    why3t: 'Eine gepflegte Flotte', why3d: 'Aktuelle Modelle, regelmäßige Wartung, Aufbereitung vor jeder Übergabe.',
    why4t: 'Ihre Sprache, 24/7', why4d: 'Support auf Russisch und Englisch — davor, währenddessen und danach.',
    why5t: 'Vollversicherung', why5d: 'Basis, erweitert oder ohne Selbstbeteiligung — Sie entscheiden.',
    whyEst: 'SEIT 2018 · KONYAALTI, ANTALYA', statAvg: 'Durchschnittsbewertung', statSince: 'zufriedene Gäste seit 2018',
    insKicker: 'VERSICHERUNG & KAUTION', insTitle: 'Sorglos unterwegs. Keine Überraschungen.',
    insBody: 'Die Basisversicherung (CDW/TP) ist in jeder Anmietung enthalten. Für volle Sicherheit ergänzen Sie den erweiterten Schutz ohne Selbstbeteiligung: Kratzer, Reifen und Glas gehen auf uns. Die Kaution wird auf Ihrer Karte reserviert und vollständig freigegeben, sobald Sie das Auto im ursprünglichen Zustand zurückgeben.',
    insChip1: 'Basisschutz inklusive', insChip2: 'Ohne Selbstbeteiligung (Option)', insChip3: 'Kaution wird erstattet',
    aboutKicker: 'ÜBER UNS · ANTALYA SEIT 2018', aboutTitle: 'Premium-Vermietung, der Gäste der Türkei vertrauen',
    aboutBody: 'Wir begleiten Ihre ganze Reise — vom Empfang am Flughafen bis zur Schlüsselrückgabe. Ein echtes Team in Antalya, faire Bedingungen und Support in Ihrer Sprache.',
    aboutBrowse: 'Flotte ansehen', aboutRead: 'Bewertungen lesen',
    sYears: 'Jahre in Antalya', sYearsSub: 'lokal, seit 2018', sGuests: 'zufriedene Gäste', sGuestsSub: 'und es werden mehr',
    sRating: 'Durchschnittsbewertung', sRatingSub: 'über alle Bewertungen', sRepeat: 'kommen wieder', sRepeatSub: 'Stammgäste',
    revKicker: 'GÄSTEBEWERTUNGEN', revTitle: 'Von 2000+ Reisenden geliebt', revBased: (n: string) => `basierend auf ${n} Bewertungen`,
    ctaKicker: 'BEREIT, WENN SIE LANDEN', ctaTitle: 'Ihr Auto wartet in Antalya',
    ctaBody: 'Wählen Sie Ihr Auto, sagen Sie uns, wohin wir es bringen — und starten Sie, sobald Sie landen.', ctaChoose: 'Auto wählen',
    cWa: 'WhatsApp · Telegram', cWaSub: 'hello@aventa.rent', cHours: 'Mo–So · 09:00–21:00', cHoursSub: 'Support in Ihrer Sprache',
    cLoc: 'Antalya, Konyaaltı, Türkiye', cLocSub: 'Flughafen AYT & zu Ihrer Adresse',
    locAirport: 'Flughafen Antalya (AYT)', locLara: 'Lara', locKonyaalti: 'Konyaaltı', locOldtown: 'Kaleiçi (Altstadt)', locBelek: 'Belek', locAddress: 'An meine Adresse',
  },
}

const iso = (d: string, h: number) => new Date(`${d}T${String(h).padStart(2, '0')}:00:00`).toISOString()
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/* Icons (Ic/I), the fleet card (RdCarCard) and the full .rd stylesheet (RD_CSS)
   now live in components/RdKit and are shared with the catalogue. */

export default function Home({ cars, reviews = [], resumeSlugs = [] }: { cars: CarView[]; reviews?: AboutReview[]; resumeSlugs?: string[] }) {
  const t = useDict(dict)
  const isMobile = useIsMobile()
  const [pickup, setPickup] = useState('')
  const [ret, setRet] = useState('')
  const [loc, setLoc] = useState('airport')
  const [availableSlugs, setAvailableSlugs] = useState<string[] | null>(null)
  const [rangeLabel, setRangeLabel] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [detailCar, setDetailCar] = useState<CarView | null>(null)
  const [motion, setMotion] = useState(false) // pointer-fine + motion allowed → enables tilt
  const progressRef = useRef<HTMLDivElement>(null)
  const heroBgRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const a = new Date(); a.setDate(a.getDate() + 3)
    const b = new Date(); b.setDate(b.getDate() + 6)
    setPickup(ymd(a)); setRet(ymd(b))
    setMotion(window.matchMedia('(pointer:fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  // Scroll → nav solid state + progress bar + hero parallax (rAF-throttled)
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const y = window.scrollY
        setScrolled(y > 40)
        const doc = document.documentElement
        const p = doc.scrollHeight > doc.clientHeight ? y / (doc.scrollHeight - doc.clientHeight) : 0
        if (progressRef.current) progressRef.current.style.width = `${Math.min(100, p * 100)}%`
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (heroBgRef.current && !reduce) heroBgRef.current.style.transform = `translateY(${y * 0.22}px)`
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf) }
  }, [])

  // Scroll-reveal + count-up stats via IntersectionObserver
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { root.querySelectorAll('.rv').forEach((e) => e.classList.add('in')); root.querySelectorAll<HTMLElement>('[data-count]').forEach((e) => { e.textContent = e.dataset.count ?? '' }); return }
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue
        const el = en.target as HTMLElement
        io.unobserve(el)
        if (el.classList.contains('rv')) el.classList.add('in')
        if (el.dataset.count != null) {
          const raw = el.dataset.count, num = parseFloat(raw.replace(/[^0-9.]/g, '')) || 0
          const suffix = raw.replace(/[0-9.,]/g, ''), decimals = (raw.split('.')[1] || '').replace(/[^0-9]/g, '').length
          const t0 = performance.now(), dur = 1500
          const tick = (now: number) => {
            const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3), v = num * e
            el.textContent = (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-US')) + suffix
            if (k < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      }
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' })
    root.querySelectorAll('.rv, [data-count]').forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [cars.length, reviews.length])

  const search = () => {
    setErr(null)
    if (!pickup || !ret || ret <= pickup) { setErr('range'); return }
    const label = `${pickup.slice(8)}.${pickup.slice(5, 7)} – ${ret.slice(8)}.${ret.slice(5, 7)}`
    startTransition(async () => {
      const res = await searchAvailabilityAction(iso(pickup, 10), iso(ret, 10))
      if (res.ok && res.availableSlugs) {
        setAvailableSlugs(res.availableSlugs); setRangeLabel(label)
        requestAnimationFrame(() => document.getElementById('fleet')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }))
      } else setErr(res.error ?? 'error')
    })
  }
  const shown = availableSlugs ? cars.filter((c) => availableSlugs.includes(c.slug)) : cars
  const locs: [string, string][] = [['airport', t.locAirport], ['lara', t.locLara], ['konyaalti', t.locKonyaalti], ['oldtown', t.locOldtown], ['belek', t.locBelek], ['address', t.locAddress]]
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '4.9'
  const navLinks: [string, string][] = [['#fleet', t.navCars], ['#how', t.navHow], ['#why', t.navWhy], ['#about', t.navAbout], ['#reviews', t.navReviews]]

  return (
    <div className="rd" ref={rootRef} id="top">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: RD_CSS }} />

      {/* scroll progress */}
      <div className="rd-progress" aria-hidden><div ref={progressRef} /></div>

      {/* NAV */}
      <header className={`rd-nav ${scrolled ? 'solid' : ''}`}>
        <div className="rd-nav-in">
          <a href="#top" className="rd-logo"><span className="rd-mark">A</span><b>AVENTA</b></a>
          <nav className="rd-links">{navLinks.map(([h, l]) => <a key={h} href={h}>{l}</a>)}</nav>
          <div className="rd-nav-right">
            <span className="rd-lang"><LanguageDropdown variant="bar" /></span>
            <Link href="/auth" className="rd-btn rd-btn-ghost rd-btn-sm">{t.signIn}</Link>
            <Link href="/catalog" className="rd-btn rd-btn-coral rd-btn-sm">{t.choose}<Ic d={I.arrow} s={16} c="#fff" /></Link>
            <button className="rd-burger" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}><Ic d={I.menu} s={22} /></button>
          </div>
        </div>
        {menuOpen && (
          <div className="rd-menu">
            {navLinks.map(([h, l]) => <a key={h} href={h} onClick={() => setMenuOpen(false)}>{l}</a>)}
            <Link href="/auth" onClick={() => setMenuOpen(false)}>{t.signIn}</Link>
            <Link href="/catalog" className="rd-btn rd-btn-coral" onClick={() => setMenuOpen(false)}>{t.choose}</Link>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="rd-hero">
        <div className="rd-hero-bg" ref={heroBgRef} aria-hidden />
        <div className="rd-orb rd-orb-1" aria-hidden /><div className="rd-orb rd-orb-2" aria-hidden />
        <div className="rd-hero-scrim" aria-hidden />
        <div className="rd-wrap rd-hero-in">
          <div className="rd-hero-copy">
            <div className="rd-eyebrow rv"><span className="dot" />{t.heroKicker}</div>
            <h1 className="rv" style={{ transitionDelay: '.06s' }}>{t.heroT1}<em>{t.heroT2}</em></h1>
            <p className="rd-hero-sub rv" style={{ transitionDelay: '.12s' }}>{t.heroSub}</p>

            {/* booking form */}
            <div className="rd-form rv" style={{ transitionDelay: '.18s' }}>
              <div className="rd-form-row">
                <label><span>{t.fPickup}</span><input type="date" value={pickup} onChange={(e) => setPickup(e.target.value)} /></label>
                <label><span>{t.fReturn}</span><input type="date" value={ret} min={pickup} onChange={(e) => setRet(e.target.value)} /></label>
              </div>
              <label className="rd-form-sel"><span>{t.fLoc}</span>
                <select value={loc} onChange={(e) => setLoc(e.target.value)}>{locs.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              </label>
              <button className="rd-btn rd-btn-coral rd-form-btn" onClick={search} disabled={pending} aria-busy={pending}>
                {pending ? t.searching : t.findBtn}{!pending && <Ic d={I.arrow} s={18} c="#fff" />}
              </button>
              <div className={`rd-form-note ${err === 'range' ? 'err' : ''}`}>
                <Ic d={err === 'range' ? <path d="M12 8v5M12 16h.01" /> : I.check} s={15} c={err === 'range' ? '#ef5c3a' : 'var(--teal)'} />
                {err === 'range' ? t.dateErr : t.searchNote}
              </div>
            </div>

            <div className="rd-trust rv" style={{ transitionDelay: '.24s' }}>
              <span>{t.tYears}</span><i />{' '}<span>{t.tGuests}</span><i /><span>{t.tRated}</span><i /><span>{t.tFleet(cars.length)}</span>
            </div>
          </div>

          {/* the real photo — floats */}
          <div className="rd-hero-photo rv rv-r" style={{ transitionDelay: '.1s' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/image_.png" alt="AVENTA — rent a car in Antalya" className="rd-float" />
            <div className="rd-hero-chip"><b>{avg}</b> ★ · 2,000+ {t.sGuests}</div>
          </div>
        </div>
        <a href="#fleet" className="rd-scroll-cue" aria-label={t.scrollLbl}><span>{t.scrollLbl}</span><Ic d={I.down} s={18} c="rgba(255,255,255,.7)" /></a>
      </section>

      {/* FLEET */}
      <section id="fleet" className="rd-sec">
        <div className="rd-wrap">
          <div className="rd-head rv"><div className="rd-kick">{t.fleetKicker(cars.length)}</div><h2>{t.fleetTitle}</h2><p>{t.fleetSub}</p></div>
          {availableSlugs && (
            <div className={`rd-searchmsg rv ${shown.length ? '' : 'warn'}`}>
              <span>{shown.length ? t.freeOn(shown.length, rangeLabel) : t.noneFree}</span>
              <button onClick={() => { setAvailableSlugs(null); setErr(null) }}>{t.reset}</button>
            </div>
          )}
          <div className="rd-fleet rv">{shown.map((car) => <RdCarCard key={car.id} car={car} t={t} motion={motion} onOpen={() => setDetailCar(car)} />)}</div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="rd-sec rd-sec-b">
        <div className="rd-wrap">
          <div className="rd-head rv"><div className="rd-kick">{t.howKicker}</div><h2>{t.howTitle}</h2></div>
          <div className="rd-steps">
            {[[t.how1t, t.how1d, I.search], [t.how2t, t.how2d, I.fileCheck], [t.how3t, t.how3d, I.truck], [t.how4t, t.how4d, I.flag]].map(([title, desc, icon], i) => (
              <div className="rd-step rv" key={i} style={{ transitionDelay: `${i * 0.085}s` }}>
                <span className="rd-step-n">{String(i + 1).padStart(2, '0')}</span>
                <div className="rd-step-ic"><Ic d={icon as React.ReactNode} s={22} c="var(--teal)" /></div>
                <h3>{title as string}</h3><p>{desc as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY — bento */}
      <section id="why" className="rd-sec">
        <div className="rd-wrap">
          <div className="rd-head rv"><div className="rd-kick">{t.whyKicker}</div><h2>{t.whyTitle}</h2></div>
          <div className="rd-bento">
            <div className="rd-tile rd-tile-dark span2 rv">
              <div className="rd-tile-ic dark"><Ic d={I.pin} s={22} c="#67e3d3" /></div>
              <h3>{t.why1t}</h3><p>{t.why1d}</p><div className="rd-tile-est">{t.whyEst}</div>
            </div>
            <div className="rd-tile rv" style={{ transitionDelay: '.06s' }}><div className="rd-tile-ic soft"><Ic d={I.tag} s={20} c="var(--accent)" /></div><h3>{t.why2t}</h3><p>{t.why2d}</p></div>
            <div className="rd-tile rv" style={{ transitionDelay: '.12s' }}><div className="rd-tile-ic"><Ic d={I.sparkles} s={20} c="var(--teal)" /></div><h3>{t.why3t}</h3><p>{t.why3d}</p></div>
            <div className="rd-tile rv" style={{ transitionDelay: '.06s' }}><div className="rd-tile-ic"><Ic d={I.headphones} s={20} c="var(--teal)" /></div><h3>{t.why4t}</h3><p>{t.why4d}</p></div>
            <div className="rd-tile rv" style={{ transitionDelay: '.12s' }}><div className="rd-tile-ic"><Ic d={I.shield} s={20} c="var(--teal)" /></div><h3>{t.why5t}</h3><p>{t.why5d}</p></div>
            <div className="rd-tile rd-tile-stat span2 rv">
              <div><b data-count="4.9">4.9</b><span>★ {t.statAvg}</span></div><i />
              <div><b data-count="2000+">2000+</b><span>{t.statSince}</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* INSURANCE band */}
      <section id="insurance" className="rd-sec rd-sec-b">
        <div className="rd-wrap"><div className="rd-ins rv">
          <div className="rd-ins-glow" aria-hidden />
          <div className="rd-ins-in">
            <div className="rd-kick" style={{ color: 'rgba(255,255,255,.82)' }}>{t.insKicker}</div>
            <h2>{t.insTitle}</h2><p>{t.insBody}</p>
            <div className="rd-ins-chips">{[t.insChip1, t.insChip2, t.insChip3].map((c) => <span key={c}><Ic d={I.check} s={16} c="#fff" />{c}</span>)}</div>
          </div>
        </div></div>
      </section>

      {/* ABOUT + STATS */}
      <section id="about" className="rd-sec">
        <div className="rd-wrap">
          <div className="rd-about">
            <div className="rd-about-copy rv rv-l">
              <div className="rd-kick">{t.aboutKicker}</div><h2>{t.aboutTitle}</h2><p>{t.aboutBody}</p>
              <div className="rd-about-btns"><Link href="/catalog" className="rd-btn rd-btn-coral">{t.aboutBrowse}</Link><a href="#reviews" className="rd-btn rd-btn-ghost-ink">{t.aboutRead}</a></div>
            </div>
            <div className="rd-about-photo rv rv-r">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hero-composite.webp" alt="AVENTA team & fleet in Antalya" loading="lazy" />
              <div className="rd-about-chip">★ {avg} · 2,000+ {t.sGuests}</div>
            </div>
          </div>
          <div className="rd-stats">
            {[['8', t.sYears, t.sYearsSub], ['2000+', t.sGuests, t.sGuestsSub], [`${avg}★`, t.sRating, t.sRatingSub], ['41%', t.sRepeat, t.sRepeatSub]].map(([n, l, s], i) => (
              <div className="rd-stat rv" key={i} style={{ transitionDelay: `${i * 0.07}s` }}><b data-count={n as string}>{n}</b><span>{l as string}</span><i>{s as string}</i></div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      {reviews.length > 0 && (
        <section id="reviews" className="rd-sec rd-sec-b">
          <div className="rd-wrap">
            <div className="rd-rev-head rv">
              <div><div className="rd-kick">{t.revKicker}</div><h2>{t.revTitle}</h2></div>
              <div className="rd-rev-summary"><b>{avg}</b><div><div className="rd-stars">★★★★★</div><span>{t.revBased(reviews.length.toLocaleString('en-US'))}</span></div></div>
            </div>
            <div className="rd-reviews">
              {reviews.slice(0, 6).map((r, i) => {
                const initials = r.authorName.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
                return (
                  <div className="rd-review rv" key={r.id} style={{ transitionDelay: `${(i % 3) * 0.07}s` }}>
                    <div className="rd-stars">{'★'.repeat(Math.round(r.rating))}</div>
                    <p>{r.text}</p>
                    <div className="rd-review-by"><span className="rd-av">{initials}</span><div><b>{r.authorName}</b><i>{new Date(r.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</i></div></div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* CLOSING CTA */}
      <section id="contact" className="rd-sec">
        <div className="rd-wrap"><div className="rd-cta rv">
          <div className="rd-orb rd-orb-3" aria-hidden /><div className="rd-orb rd-orb-4" aria-hidden />
          <div className="rd-cta-in">
            <div className="rd-cta-copy">
              <div className="rd-kick" style={{ color: '#67e3d3' }}>{t.ctaKicker}</div><h2>{t.ctaTitle}</h2><p>{t.ctaBody}</p>
              <div className="rd-cta-btns"><Link href="/catalog" className="rd-btn rd-btn-coral">{t.ctaChoose}<Ic d={I.arrow} s={16} c="#fff" /></Link><a href="tel:+905000000000" className="rd-btn rd-btn-ghost">+90 500 000 00 00</a></div>
            </div>
            <div className="rd-cta-panel">
              <div className="rd-cta-row"><span className="rd-cta-ic"><Ic d={I.phone} s={18} c="#67e3d3" /></span><div><b>{t.cWa}</b><i>{t.cWaSub}</i></div></div>
              <div className="rd-cta-row"><span className="rd-cta-ic"><Ic d={I.clock} s={18} c="#67e3d3" /></span><div><b>{t.cHours}</b><i>{t.cHoursSub}</i></div></div>
              <div className="rd-cta-row"><span className="rd-cta-ic"><Ic d={I.pin} s={18} c="#67e3d3" /></span><div><b>{t.cLoc}</b><i>{t.cLocSub}</i></div></div>
              <div className="rd-pay"><span>VISA</span><span>MASTERCARD</span><span>iyzico</span><span className="ssl"><Ic d={I.shield} s={13} c="#67e3d3" />SSL</span></div>
            </div>
          </div>
        </div></div>
      </section>

      <ClientFooter />

      {/* Car detail drawer — opens when a fleet card is clicked (Book now on the card still deep-links). */}
      <CarDetailDrawer car={detailCar} onClose={() => setDetailCar(null)} />
    </div>
  )
}
