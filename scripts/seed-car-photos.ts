/**
 * Re-seed the 5 demo cars with REAL cover photos (Wikimedia Commons, CC BY-SA 4.0).
 * Each source image is optimised to a WebP main (≤1600px) + thumbnail (≤640px)
 * via the shared lib/image-optimize helpers, replacing the old SVG placeholders.
 * Idempotent: safe to re-run — it clears each car's existing photos/files first.
 *
 *   node --env-file=.env --import tsx scripts/seed-car-photos.ts
 */
import { PrismaClient } from '@prisma/client'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { toMainWebp, toThumbWebp, thumbKeyFor } from '../src/lib/image-optimize'

const prisma = new PrismaClient()
const DIR = path.resolve('public/uploads/cars')
const SRC = path.resolve('prisma/seed-assets/cars')
const SLUGS = ['mercedes-benz-e-200', 'bmw-520i', 'audi-a6', 'range-rover-velar', 'mercedes-benz-v-class']

async function rmKey(key: string) {
  await fs.rm(path.join(DIR, key), { force: true }).catch(() => {})
  if (/\.webp$/i.test(key)) await fs.rm(path.join(DIR, thumbKeyFor(key)), { force: true }).catch(() => {})
}

async function main() {
  await fs.mkdir(DIR, { recursive: true })
  for (const slug of SLUGS) {
    const car = await prisma.car.findUnique({ where: { slug }, include: { photos: true } })
    if (!car) { console.log('skip (no car):', slug); continue }

    for (const p of car.photos) if (!p.isExternal) await rmKey(p.storageKey)
    await prisma.carPhoto.deleteMany({ where: { carId: car.id } })

    const input = await fs.readFile(path.join(SRC, `${slug}.jpg`))
    const mainKey = `seed-${slug}-${crypto.randomBytes(4).toString('hex')}.webp`
    const [main, thumb] = await Promise.all([toMainWebp(input), toThumbWebp(input)])
    await fs.writeFile(path.join(DIR, mainKey), main)
    await fs.writeFile(path.join(DIR, thumbKeyFor(mainKey)), thumb)
    await prisma.carPhoto.create({
      data: { carId: car.id, storageKey: mainKey, isExternal: false, isCover: true, sortOrder: 0, alt: `${car.brand} ${car.model}` },
    })
    console.log(`✓ ${slug}: ${(input.length / 1024) | 0}KB → main ${(main.length / 1024) | 0}KB + thumb ${(thumb.length / 1024) | 0}KB`)
  }

  // Clean any orphan files (old SVG placeholders, stray test uploads).
  const referenced = new Set(
    (await prisma.carPhoto.findMany({ where: { isExternal: false }, select: { storageKey: true } }))
      .flatMap((p) => [p.storageKey, thumbKeyFor(p.storageKey)]),
  )
  for (const f of await fs.readdir(DIR)) {
    if (f === 'PHOTO_CREDITS.md' || f === '.gitkeep' || referenced.has(f)) continue
    await fs.rm(path.join(DIR, f), { force: true }).catch(() => {})
    console.log('  removed orphan:', f)
  }

  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
