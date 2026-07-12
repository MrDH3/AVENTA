import { PrismaClient, type Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const hash = (pw: string) => bcrypt.hash(pw, 12)
const day = (iso: string) => new Date(iso)

async function main() {
  console.log('🌱 Seeding AVENTA…')

  // ── Currency rates (base = EUR) ──────────────────────────────────────
  const rates: { code: any; symbol: string; rate: number }[] = [
    { code: 'EUR', symbol: '€', rate: 1 },
    { code: 'USD', symbol: '$', rate: 1.08 },
    { code: 'RUB', symbol: '₽', rate: 98 },
    { code: 'TRY', symbol: '₺', rate: 38 },
    { code: 'USDT', symbol: '₮', rate: 1.08 },
    { code: 'USDC', symbol: 'USDC', rate: 1.08 },
  ]
  for (const r of rates) {
    await prisma.currencyRate.upsert({
      where: { code: r.code },
      update: { symbol: r.symbol, rateFromBase: r.rate, active: true },
      create: { code: r.code, symbol: r.symbol, rateFromBase: r.rate, active: true },
    })
  }

  // ── Settings ─────────────────────────────────────────────────────────
  const settings: { key: string; value: string; group: string }[] = [
    { key: 'base_currency', value: 'EUR', group: 'finance' },
    { key: 'min_rental_days', value: '1', group: 'booking' },
    { key: 'prep_hours_default', value: '3', group: 'booking' },
    { key: 'company_name', value: 'AVENTA Rent', group: 'company' },
    { key: 'company_legal', value: 'AVENTA Turizm ve Rent A Car Ltd. Şti.', group: 'company' },
    { key: 'company_address', value: 'Antalya, Türkiye', group: 'company' },
    { key: 'company_phone', value: '+90 555 000 00 00', group: 'company' },
    { key: 'company_email', value: 'hello@aventa.rent', group: 'company' },
    { key: 'bank_iban', value: 'TR00 0000 0000 0000 0000 0000 00', group: 'finance' },
    { key: 'bank_swift', value: 'XXXXTRXX', group: 'finance' },
  ]
  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value, group: s.group },
      create: s,
    })
  }

  // ── Site content (admin-editable copy) ───────────────────────────────
  const content: { key: string; ru: string; en: string; group: string }[] = [
    {
      key: 'home.hero.title',
      ru: 'Ваше море, солнце и дорога — начинаются здесь',
      en: 'Your sea, sun and the open road — start here',
      group: 'home',
    },
    {
      key: 'home.hero.sub',
      ru: 'Премиум-парк, подача в аэропорт и к морю, трансферы, экскурсии и недвижимость — в одном бронировании.',
      en: 'Premium fleet, airport & seaside delivery, transfers, tours and real estate — all in one booking.',
      group: 'home',
    },
  ]
  for (const c of content) {
    for (const loc of ['ru', 'en'] as const) {
      await prisma.siteContent.upsert({
        where: { key_locale: { key: c.key, locale: loc } },
        update: { value: loc === 'ru' ? c.ru : c.en, group: c.group },
        create: { key: c.key, locale: loc, value: loc === 'ru' ? c.ru : c.en, group: c.group },
      })
    }
  }

  // ── Users ────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL ?? 'admin@aventa.rent' },
    update: {},
    create: {
      email: process.env.SEED_ADMIN_EMAIL ?? 'admin@aventa.rent',
      passwordHash: await hash(process.env.SEED_ADMIN_PASSWORD ?? 'Admin!2026'),
      role: 'ADMIN',
      firstName: 'Админ',
      lastName: 'AVENTA',
      locale: 'ru',
    },
  })
  await prisma.user.upsert({
    where: { email: process.env.SEED_OWNER_EMAIL ?? 'owner@aventa.rent' },
    update: {},
    create: {
      email: process.env.SEED_OWNER_EMAIL ?? 'owner@aventa.rent',
      passwordHash: await hash(process.env.SEED_OWNER_PASSWORD ?? 'Owner!2026'),
      role: 'OWNER',
      firstName: 'Владелец',
      lastName: 'AVENTA',
      locale: 'ru',
    },
  })
  const client = await prisma.user.upsert({
    where: { email: process.env.SEED_DEMO_CLIENT_EMAIL ?? 'ivan@example.com' },
    update: {},
    create: {
      email: process.env.SEED_DEMO_CLIENT_EMAIL ?? 'ivan@example.com',
      passwordHash: await hash(process.env.SEED_DEMO_CLIENT_PASSWORD ?? 'Client!2026'),
      role: 'CLIENT',
      firstName: 'Иван',
      lastName: 'Петров',
      phone: '+90 555 123 45 67',
      whatsapp: '@ivanp',
      locale: 'ru',
      loyaltyTier: 'Gold',
      profile: {
        create: {
          birthDate: day('1990-05-14'),
          citizenship: 'Россия',
          passportNo: '75 1234567',
          licenseNo: '99 AA 123456',
          licenseCountry: 'РФ',
          licenseIssue: day('2019-03-01'),
          licenseExpiry: day('2029-03-01'),
          addressCountry: 'Россия',
          addressCity: 'Москва',
          addressLine: 'г. Москва',
        },
      },
      // NOTE: SavedAddress and SavedPaymentMethod are DEPRECATED / unread models (see schema) — no
      // demo rows are seeded for them. Real addresses/places live in SavedPlace; there is no card
      // storage until a payment processor is connected.
    },
  })

  // ── Fleet (5 cars) ───────────────────────────────────────────────────
  const cars: Prisma.CarCreateInput[] = [
    {
      slug: 'mercedes-benz-e-200', brand: 'Mercedes-Benz', model: 'E 200', year: 2024,
      class: 'BUSINESS', gearbox: 'AUTOMATIC', fuel: 'PETROL', seats: 5, doors: 4,
      pricePerDay: 120, deposit: 800, mileageLimitPerDay: 250, sortOrder: 1,
      conditionsRu: 'Возраст 21+, стаж 2+ года · Залог €800 · Базовая страховка включена · Топливо «полный → полный»',
      conditionsEn: 'Age 21+, 2+ years licence · Deposit €800 · Basic insurance included · Fuel “full → full”',
    },
    {
      slug: 'range-rover-velar', brand: 'Range Rover', model: 'Velar', year: 2024,
      class: 'SUV', gearbox: 'AUTOMATIC', fuel: 'PETROL', seats: 5, doors: 4,
      pricePerDay: 180, deposit: 1500, mileageLimitPerDay: 250, sortOrder: 2,
      conditionsRu: 'Возраст 25+, стаж 3+ года · Залог €1500 · Базовая страховка включена',
      conditionsEn: 'Age 25+, 3+ years licence · Deposit €1500 · Basic insurance included',
    },
    {
      slug: 'audi-a6', brand: 'Audi', model: 'A6', year: 2023,
      class: 'BUSINESS', gearbox: 'AUTOMATIC', fuel: 'PETROL', seats: 5, doors: 4,
      pricePerDay: 115, deposit: 800, mileageLimitPerDay: 250, sortOrder: 3,
      conditionsRu: 'Возраст 21+, стаж 2+ года · Залог €800 · Базовая страховка включена',
      conditionsEn: 'Age 21+, 2+ years licence · Deposit €800 · Basic insurance included',
    },
    {
      slug: 'bmw-520i', brand: 'BMW', model: '520i', year: 2023,
      class: 'BUSINESS', gearbox: 'AUTOMATIC', fuel: 'DIESEL', seats: 5, doors: 4,
      pricePerDay: 110, deposit: 750, mileageLimitPerDay: 250, sortOrder: 4,
      conditionsRu: 'Возраст 21+, стаж 2+ года · Залог €750 · Базовая страховка включена',
      conditionsEn: 'Age 21+, 2+ years licence · Deposit €750 · Basic insurance included',
    },
    {
      slug: 'mercedes-benz-v-class', brand: 'Mercedes-Benz', model: 'V-Class', year: 2024,
      class: 'MINIVAN', gearbox: 'AUTOMATIC', fuel: 'DIESEL', seats: 7, doors: 4,
      pricePerDay: 160, deposit: 1200, mileageLimitPerDay: 200, sortOrder: 5,
      conditionsRu: 'Возраст 25+, стаж 3+ года · Залог €1200 · 7 мест · Базовая страховка включена',
      conditionsEn: 'Age 25+, 3+ years licence · Deposit €1200 · 7 seats · Basic insurance included',
    },
  ]
  const carRecords: Record<string, string> = {}
  for (const c of cars) {
    const rec = await prisma.car.upsert({ where: { slug: c.slug }, update: c, create: c })
    carRecords[c.slug] = rec.id
  }

  // ── Cover photos (branded SVG placeholders so the catalog isn't blank) ─
  const { promises: fs } = await import('node:fs')
  const path = await import('node:path')
  const carsDir = path.resolve(process.cwd(), 'public/uploads/cars')
  await fs.mkdir(carsDir, { recursive: true })
  const coverSvg = (brand: string, model: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#CDEFF6"/><stop offset="0.55" stop-color="#7CD3E1"/><stop offset="1" stop-color="#0E7E90"/>
</linearGradient></defs>
<rect width="1200" height="800" fill="url(#g)"/>
<circle cx="980" cy="180" r="90" fill="#FFD56B"/>
<path d="M0 620 Q300 560 600 610 T1200 600 V800 H0Z" fill="#0E7E90" opacity="0.5"/>
<path d="M0 680 Q300 640 600 680 T1200 670 V800 H0Z" fill="#0C3B45" opacity="0.35"/>
<g transform="translate(210,360)"><path d="M40 120 L120 60 L360 60 L440 120 L520 120 Q540 120 540 150 L540 200 Q540 220 520 220 L40 220 Q20 220 20 200 L20 150 Q20 120 40 120 Z" fill="#0C3B45"/>
<path d="M150 66 L340 66 L400 118 L120 118 Z" fill="#EAF7F8" opacity="0.85"/>
<circle cx="140" cy="220" r="52" fill="#0C3B45"/><circle cx="140" cy="220" r="24" fill="#EAF7F8"/>
<circle cx="430" cy="220" r="52" fill="#0C3B45"/><circle cx="430" cy="220" r="24" fill="#EAF7F8"/>
<rect x="505" y="150" width="34" height="26" rx="6" fill="#FF7A5C"/></g>
<text x="600" y="120" font-family="Segoe UI, sans-serif" font-size="60" font-weight="800" fill="#0C3B45" text-anchor="middle">${brand}</text>
<text x="600" y="185" font-family="Segoe UI, sans-serif" font-size="44" font-weight="600" fill="#0B5560" text-anchor="middle">${model}</text>
<text x="600" y="740" font-family="monospace" font-size="26" letter-spacing="6" fill="#EAF7F8" text-anchor="middle">AVENTA · ANTALYA</text>
</svg>`
  for (const c of cars) {
    const carId = carRecords[c.slug]
    const has = await prisma.carPhoto.count({ where: { carId } })
    if (has > 0) continue
    const key = `seed-${c.slug}.svg`
    await fs.writeFile(path.join(carsDir, key), coverSvg(c.brand, c.model), 'utf8')
    await prisma.carPhoto.create({
      data: { carId, storageKey: key, isExternal: false, isCover: true, sortOrder: 0, alt: `${c.brand} ${c.model}` },
    })
  }

  // ── Services (concierge / ecosystem) ─────────────────────────────────
  const services: Prisma.ServiceCreateInput[] = [
    { key: 'child_seat', category: 'RENTAL', nameRu: 'Детское кресло', nameEn: 'Child seat', price: 5, unit: 'per_day', forGoals: ['LEISURE', 'VISITING'], sortOrder: 1 },
    { key: 'extra_driver', category: 'RENTAL', nameRu: 'Дополнительный водитель', nameEn: 'Additional driver', price: 7, unit: 'per_day', forGoals: ['BUSINESS', 'LEISURE'], sortOrder: 2 },
    { key: 'delivery', category: 'TRANSFER', nameRu: 'Доставка автомобиля по адресу', nameEn: 'Delivery to address', price: 25, unit: 'flat', forGoals: [], sortOrder: 3 },
    { key: 'return_other', category: 'TRANSFER', nameRu: 'Возврат в другом месте', nameEn: 'Return at another location', price: 30, unit: 'flat', forGoals: [], sortOrder: 4 },
    { key: 'unlimited_mileage', category: 'RENTAL', nameRu: 'Безлимитный пробег', nameEn: 'Unlimited mileage', price: 15, unit: 'per_day', forGoals: ['RELOCATION', 'LONG_STAY'], sortOrder: 5 },
    { key: 'transfer_airport', category: 'TRANSFER', nameRu: 'Трансфер из аэропорта', nameEn: 'Airport transfer', price: 40, unit: 'per_trip', forGoals: ['LEISURE', 'MEDICAL', 'BUSINESS'], sortOrder: 6 },
    { key: 'vip_meet', category: 'TRANSFER', nameRu: 'VIP-встреча в аэропорту', nameEn: 'VIP airport meet & greet', price: 90, unit: 'per_trip', forGoals: ['BUSINESS', 'PROPERTY_PURCHASE'], sortOrder: 7 },
    { key: 'property_viewing', category: 'REAL_ESTATE', nameRu: 'Просмотр объектов недвижимости', nameEn: 'Property viewing tour', price: 0, unit: 'flat', forGoals: ['PROPERTY_PURCHASE', 'PROPERTY_VIEWING'], sortOrder: 8 },
    { key: 'property_agent', category: 'REAL_ESTATE', nameRu: 'Встреча с агентом + сопровождение', nameEn: 'Agent meeting & assistance', price: 0, unit: 'flat', forGoals: ['PROPERTY_PURCHASE'], sortOrder: 9 },
    { key: 'yacht', category: 'TOURS', nameRu: 'Аренда яхты', nameEn: 'Yacht charter', price: 450, unit: 'per_trip', forGoals: ['LEISURE'], sortOrder: 10 },
    { key: 'excursions', category: 'TOURS', nameRu: 'Экскурсии', nameEn: 'Guided excursions', price: 60, unit: 'per_trip', forGoals: ['LEISURE', 'VISITING'], sortOrder: 11 },
    { key: 'personal_driver', category: 'CONCIERGE', nameRu: 'Индивидуальный водитель', nameEn: 'Personal driver', price: 120, unit: 'per_day', forGoals: ['BUSINESS', 'MEDICAL', 'PROPERTY_PURCHASE'], sortOrder: 12 },
    { key: 'esim', category: 'CONNECTIVITY', nameRu: 'SIM-карта / eSIM', nameEn: 'SIM / eSIM', price: 12, unit: 'flat', forGoals: ['LEISURE', 'BUSINESS', 'RELOCATION'], sortOrder: 13 },
    { key: 'translator', category: 'CONCIERGE', nameRu: 'Переводчик', nameEn: 'Interpreter', price: 80, unit: 'per_day', forGoals: ['MEDICAL', 'PROPERTY_PURCHASE', 'BUSINESS'], sortOrder: 14 },
    { key: 'doc_help', category: 'CONCIERGE', nameRu: 'Помощь с документами', nameEn: 'Document assistance', price: 100, unit: 'flat', forGoals: ['RELOCATION', 'MEDICAL', 'PROPERTY_PURCHASE'], sortOrder: 15 },
    { key: 'investment_consult', category: 'REAL_ESTATE', nameRu: 'Консультация по инвестициям', nameEn: 'Investment consultation', price: 0, unit: 'flat', forGoals: ['PROPERTY_PURCHASE'], sortOrder: 16 },
    { key: 'hotel_booking', category: 'CONCIERGE', nameRu: 'Бронирование отеля', nameEn: 'Hotel booking', price: 0, unit: 'flat', forGoals: ['LEISURE', 'MEDICAL'], sortOrder: 17 },
  ]
  for (const s of services) {
    await prisma.service.upsert({ where: { key: s.key }, update: s, create: s })
  }

  // ── Reviews ──────────────────────────────────────────────────────────
  const reviews = [
    { authorName: 'Elena K.', rating: 5, text: 'Машину подали прямо в аэропорт, всё чисто и по договору. Вернёмся снова!', locale: 'ru' },
    { authorName: 'Marcus T.', rating: 5, text: 'Smooth booking, transparent price, great car. Highly recommend.', locale: 'en' },
    { authorName: 'Ольга В.', rating: 5, text: 'Помогли с трансфером и даже с просмотром квартир. Сервис топ.', locale: 'ru' },
  ]
  const anyReview = await prisma.review.count()
  if (anyReview === 0) await prisma.review.createMany({ data: reviews })

  // ── Demo bookings (statuses for admin/CRM/calendar) ──────────────────
  const anyBooking = await prisma.booking.count()
  if (anyBooking === 0) {
    const mk = (
      seq: number,
      slug: string,
      startIso: string,
      endIso: string,
      status: any,
      rent: number,
      deposit: number,
    ): Prisma.BookingCreateInput => {
      const days = Math.max(1, Math.ceil((day(endIso).getTime() - day(startIso).getTime()) / 86400000))
      return {
        number: `AVN-2026-${String(seq).padStart(4, '0')}`,
        car: { connect: { id: carRecords[slug] } },
        user: { connect: { id: client.id } },
        startAt: day(startIso), endAt: day(endIso), days, status,
        pickupKind: 'AIRPORT', pickupCity: 'Анталия', pickupAddress: 'Аэропорт Анталии (AYT), Терминал 1',
        currency: 'EUR', fxRate: 1,
        rentTotal: rent, subtotal: rent, baseTotal: rent, depositAmount: deposit,
        tripGoal: 'PROPERTY_PURCHASE',
        insurance: { create: { type: 'EXTENDED', status: 'ISSUED', price: 0 } },
      }
    }
    await prisma.booking.create({ data: mk(40, 'mercedes-benz-v-class', '2026-06-28', '2026-07-10', 'ACTIVE', 1920, 1200) })
    await prisma.booking.create({ data: mk(41, 'bmw-520i', '2026-08-05', '2026-08-18', 'CONFIRMED', 1430, 750) })
    await prisma.booking.create({ data: mk(42, 'mercedes-benz-e-200', '2026-08-10', '2026-08-15', 'AWAITING_PAYMENT', 600, 800) })
    await prisma.booking.create({ data: mk(38, 'audi-a6', '2026-06-01', '2026-06-06', 'CLOSED', 575, 800) })
  }

  console.log('✅ Seed complete:', {
    admin: admin.email,
    cars: Object.keys(carRecords).length,
    services: services.length,
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
