/**
 * Add extra (non-cover) photo angles to a few cars so the public card carousel
 * has multi-photo cars to demonstrate. Same-model, tonally-consistent angles
 * (real Wikimedia Commons photos, CC BY-SA 4.0), optimised to WebP main+thumb.
 * Idempotent: clears existing non-cover photos for the listed cars first.
 *
 *   SCRATCH_CARS=<dir> node --env-file=.env --import tsx scripts/seed-extra-photos.ts
 */
import { PrismaClient } from '@prisma/client'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { toMainWebp, toThumbWebp, thumbKeyFor } from '../src/lib/image-optimize'

const prisma = new PrismaClient()
const DIR = path.resolve('public/uploads/cars')
const EXTRA = path.resolve('prisma/seed-assets/cars/extra')
const SCRATCH = process.env.SCRATCH_CARS || ''

// slug -> ordered list of source filenames (extra angles, cover excluded)
const MAP: Record<string, string[]> = {
  'audi-a6': ['audi1.jpg', 'audi_c.jpg', 'audi_d.jpg'],
  'range-rover-velar': ['velar.jpg'],
}

async function main() {
  await fs.mkdir(EXTRA, { recursive: true })
  for (const [slug, files] of Object.entries(MAP)) {
    const car = await prisma.car.findUnique({ where: { slug }, include: { photos: true } })
    if (!car) { console.log('skip (no car):', slug); continue }

    for (const p of car.photos.filter((x) => !x.isCover && !x.isExternal)) {
      await fs.rm(path.join(DIR, p.storageKey), { force: true }).catch(() => {})
      if (/\.webp$/i.test(p.storageKey)) await fs.rm(path.join(DIR, thumbKeyFor(p.storageKey)), { force: true }).catch(() => {})
    }
    await prisma.carPhoto.deleteMany({ where: { carId: car.id, isCover: false } })

    let order = (await prisma.carPhoto.aggregate({ where: { carId: car.id }, _max: { sortOrder: true } }))._max.sortOrder ?? 0
    for (let i = 0; i < files.length; i++) {
      const persist = path.join(EXTRA, `${slug}-${i + 2}.jpg`)
      try { await fs.access(persist) } catch { await fs.copyFile(path.join(SCRATCH, files[i]), persist) }
      const input = await fs.readFile(persist)
      const mainKey = `seed-${slug}-x${i + 2}-${crypto.randomBytes(3).toString('hex')}.webp`
      const [main, thumb] = await Promise.all([toMainWebp(input), toThumbWebp(input)])
      await fs.writeFile(path.join(DIR, mainKey), main)
      await fs.writeFile(path.join(DIR, thumbKeyFor(mainKey)), thumb)
      order += 1
      await prisma.carPhoto.create({
        data: { carId: car.id, storageKey: mainKey, isExternal: false, isCover: false, sortOrder: order, alt: `${car.brand} ${car.model}` },
      })
    }
    const total = await prisma.carPhoto.count({ where: { carId: car.id } })
    console.log(`✓ ${slug}: now ${total} photos (1 cover + ${total - 1} extra)`)
  }
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
