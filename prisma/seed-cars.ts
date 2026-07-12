/**
 * Cars-only seed — populates JUST the fleet (car records + their photos).
 *
 * Deliberately seeds NO users, bookings, services, reviews, settings or currency
 * rates. Prices still render correctly because lib/money.ts falls back to built-in
 * FALLBACK_RATES when the CurrencyRate table is empty.
 *
 * Run:  npm run db:seed:cars     (locally, or in the Render Shell after deploy)
 *
 * Idempotent & safe to run on every deploy: cars are CREATE-ONLY (existing rows are left
 * untouched, so admin edits are never clobbered); photo FILES are always (re)copied from the
 * committed prisma/seed-assets/cars into public/uploads/cars (so images come back after a
 * Render redeploy wipes the ephemeral uploads dir); CarPhoto DB rows are created once per car.
 */
import { PrismaClient, type Prisma } from '@prisma/client'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const prisma = new PrismaClient()

// ── The fleet (scalar car fields only — no relations) ──────────────────────
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

// Real committed photos (relative to prisma/seed-assets/cars). First = cover, rest = gallery.
const photoSources: Record<string, string[]> = {
  'mercedes-benz-e-200': ['mercedes-benz-e-200.jpg'],
  'range-rover-velar': ['range-rover-velar.jpg', 'extra/range-rover-velar-2.jpg'],
  'audi-a6': ['audi-a6.jpg', 'extra/audi-a6-2.jpg', 'extra/audi-a6-3.jpg', 'extra/audi-a6-4.jpg'],
  'bmw-520i': ['bmw-520i.jpg'],
  'mercedes-benz-v-class': ['mercedes-benz-v-class.jpg'],
}

async function main() {
  console.log('🚗 Seeding AVENTA fleet (cars only)…')

  const srcDir = path.resolve(process.cwd(), 'prisma/seed-assets/cars')
  const outDir = path.resolve(process.cwd(), 'public/uploads/cars')
  await fs.mkdir(outDir, { recursive: true })

  let carCount = 0
  let photoRows = 0
  let filesCopied = 0

  for (const c of cars) {
    // CREATE-ONLY: never overwrite an existing car (preserves admin edits across deploys).
    const car = await prisma.car.upsert({ where: { slug: c.slug }, update: {}, create: c })
    carCount++

    // Only create DB rows the first time; but ALWAYS re-copy the files (ephemeral uploads dir).
    const hasRows = (await prisma.carPhoto.count({ where: { carId: car.id } })) > 0

    let idx = 0
    for (const rel of photoSources[c.slug] ?? []) {
      const buf = await fs.readFile(path.join(srcDir, rel)).catch(() => null)
      if (!buf) {
        console.warn(`  ! missing source photo ${rel} — skipped`)
        continue
      }
      const ext = (rel.split('.').pop() || 'jpg').toLowerCase()
      const key = idx === 0 ? `${c.slug}.${ext}` : `${c.slug}-${idx + 1}.${ext}`
      await fs.writeFile(path.join(outDir, key), buf) // idempotent overwrite
      filesCopied++
      if (!hasRows) {
        await prisma.carPhoto.create({
          data: {
            carId: car.id,
            storageKey: key,
            isExternal: false,
            isCover: idx === 0,
            sortOrder: idx,
            alt: `${c.brand} ${c.model}`,
          },
        })
        photoRows++
      }
      idx++
    }
    console.log(`  ✓ ${c.slug} — ${idx} photo file(s)${hasRows ? ' (rows already existed)' : ''}`)
  }

  console.log(`✅ Fleet seed complete: ${carCount} cars, ${filesCopied} photo files copied, ${photoRows} new photo rows.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
