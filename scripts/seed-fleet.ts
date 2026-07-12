/**
 * Expand the demo fleet from 5 to 12 cars (spanning economy → premium) so the
 * landing page can lead with the product. Upserts each car by slug and attaches
 * a real cover photo (optimised WebP main+thumb) from prisma/seed-assets/cars/fleet/<slug>.jpg.
 * Idempotent. Photos are attached only if the source file exists.
 *
 *   node --env-file=.env --import tsx scripts/seed-fleet.ts
 */
import { PrismaClient, type Prisma } from '@prisma/client'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { toMainWebp, toThumbWebp, thumbKeyFor } from '../src/lib/image-optimize'

const prisma = new PrismaClient()
const DIR = path.resolve('public/uploads/cars')
const SRC = path.resolve('prisma/seed-assets/cars/fleet')

const cond = (ru: string, en: string) => ({ conditionsRu: ru, conditionsEn: en })
const AGE21 = cond(
  'Возраст 21+, стаж 2+ года · Базовая страховка включена · Топливо «полный → полный»',
  'Age 21+, 2+ years licence · Basic insurance included · Fuel “full → full”',
)
const AGE25 = cond(
  'Возраст 25+, стаж 3+ года · Базовая страховка включена · Топливо «полный → полный»',
  'Age 25+, 3+ years licence · Basic insurance included · Fuel “full → full”',
)

const fleet: Prisma.CarCreateInput[] = [
  {
    slug: 'volkswagen-polo', brand: 'Volkswagen', model: 'Polo', year: 2023,
    class: 'ECONOMY', gearbox: 'MANUAL', fuel: 'PETROL', seats: 5, doors: 5,
    pricePerDay: 32, deposit: 300, mileageLimitPerDay: 300, minRentalDays: 2, sortOrder: 6,
    descriptionRu: 'Экономичный и лёгкий в городе — идеален для поездок по Анталье и побережью.',
    descriptionEn: 'Frugal and easy in traffic — ideal for Antalya city runs and the coast road.',
    ...AGE21,
  },
  {
    slug: 'renault-clio', brand: 'Renault', model: 'Clio', year: 2023,
    class: 'ECONOMY', gearbox: 'AUTOMATIC', fuel: 'PETROL', seats: 5, doors: 5,
    pricePerDay: 38, deposit: 300, mileageLimitPerDay: 300, minRentalDays: 2, sortOrder: 7,
    descriptionRu: 'Компактный автомат с климат-контролем — комфортно вдвоём и с багажом.',
    descriptionEn: 'Compact automatic with climate control — comfortable for two with luggage.',
    ...AGE21,
  },
  {
    slug: 'volkswagen-golf', brand: 'Volkswagen', model: 'Golf', year: 2023,
    class: 'COMFORT', gearbox: 'AUTOMATIC', fuel: 'PETROL', seats: 5, doors: 5,
    pricePerDay: 48, deposit: 500, mileageLimitPerDay: 300, sortOrder: 8,
    descriptionRu: 'Золотая середина: динамика, расход и комфорт в одном кузове.',
    descriptionEn: 'The all-rounder: performance, economy and comfort in one hatch.',
    ...AGE21,
  },
  {
    slug: 'skoda-octavia', brand: 'Škoda', model: 'Octavia', year: 2023,
    class: 'COMFORT', gearbox: 'AUTOMATIC', fuel: 'DIESEL', seats: 5, doors: 5,
    pricePerDay: 45, deposit: 500, mileageLimitPerDay: 300, sortOrder: 9,
    descriptionRu: 'Огромный багажник и дизельная экономичность — лучший выбор для семьи.',
    descriptionEn: 'Vast boot and diesel economy — the smart family choice.',
    ...AGE21,
  },
  {
    slug: 'mercedes-benz-c-class', brand: 'Mercedes-Benz', model: 'C 200', year: 2023,
    class: 'BUSINESS', gearbox: 'AUTOMATIC', fuel: 'PETROL', seats: 5, doors: 4,
    pricePerDay: 95, deposit: 700, mileageLimitPerDay: 250, sortOrder: 10,
    descriptionRu: 'Бизнес-седан со свежим интерьером и мягкой подвеской.',
    descriptionEn: 'A business saloon with a fresh cabin and a supple ride.',
    ...AGE21,
  },
  {
    slug: 'bmw-x5', brand: 'BMW', model: 'X5', year: 2023,
    class: 'SUV', gearbox: 'AUTOMATIC', fuel: 'DIESEL', seats: 5, doors: 5,
    pricePerDay: 165, deposit: 1500, mileageLimitPerDay: 250, minRentalDays: 2, sortOrder: 11,
    descriptionRu: 'Полный привод и командная посадка — уверенно и в горах, и в городе.',
    descriptionEn: 'All-wheel drive and a commanding seat — sure-footed from the mountains to the marina.',
    ...AGE25,
  },
  {
    slug: 'mercedes-benz-s-class', brand: 'Mercedes-Benz', model: 'S 500', year: 2024,
    class: 'PREMIUM', gearbox: 'AUTOMATIC', fuel: 'PETROL', seats: 5, doors: 4,
    pricePerDay: 240, deposit: 2500, mileageLimitPerDay: 200, minRentalDays: 2, sortOrder: 12,
    descriptionRu: 'Флагман представительского класса — тишина, кожа и полный набор ассистентов.',
    descriptionEn: 'The flagship limousine — hushed cabin, fine leather, the full suite of assistants.',
    ...AGE25,
  },
]

async function attachCover(slug: string, carId: string, brand: string, model: string) {
  const srcFile = path.join(SRC, `${slug}.jpg`)
  try { await fs.access(srcFile) } catch { console.log(`  · no photo yet for ${slug} (skipped)`); return false }

  const existing = await prisma.carPhoto.findMany({ where: { carId } })
  for (const p of existing) if (!p.isExternal) {
    await fs.rm(path.join(DIR, p.storageKey), { force: true }).catch(() => {})
    if (/\.webp$/i.test(p.storageKey)) await fs.rm(path.join(DIR, thumbKeyFor(p.storageKey)), { force: true }).catch(() => {})
  }
  await prisma.carPhoto.deleteMany({ where: { carId } })

  const input = await fs.readFile(srcFile)
  const mainKey = `seed-${slug}-${crypto.randomBytes(4).toString('hex')}.webp`
  const [main, thumb] = await Promise.all([toMainWebp(input), toThumbWebp(input)])
  await fs.mkdir(DIR, { recursive: true })
  await fs.writeFile(path.join(DIR, mainKey), main)
  await fs.writeFile(path.join(DIR, thumbKeyFor(mainKey)), thumb)
  await prisma.carPhoto.create({ data: { carId, storageKey: mainKey, isExternal: false, isCover: true, sortOrder: 0, alt: `${brand} ${model}` } })
  console.log(`  ✓ ${slug}: cover ${(main.length / 1024) | 0}KB + thumb ${(thumb.length / 1024) | 0}KB`)
  return true
}

async function main() {
  let withPhoto = 0
  for (const c of fleet) {
    const rec = await prisma.car.upsert({ where: { slug: c.slug }, update: c, create: c })
    console.log(`upserted ${c.slug} (${c.class}, €${c.pricePerDay}/day)`)
    if (await attachCover(c.slug, rec.id, c.brand, c.model)) withPhoto++
  }
  const total = await prisma.car.count({ where: { active: true } })
  console.log(`\nfleet seeded: +${fleet.length} cars (${withPhoto} with photos) · total active cars: ${total}`)
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
