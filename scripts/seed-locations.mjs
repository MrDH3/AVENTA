import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const CITIES = [
  { name: 'Antalya', order: 0 },
  { name: 'Alanya', order: 1 },
  { name: 'Belek', order: 2 },
  { name: 'Side', order: 3 },
  { name: 'Kemer', order: 4 },
  { name: 'Lara', order: 5 },
  { name: 'Kaş', order: 6 },
]

async function main() {
  const cityCount = await prisma.city.count()
  if (cityCount === 0) {
    await prisma.city.createMany({
      data: CITIES.map((c) => ({ name: c.name, country: 'Türkiye', enabled: true, order: c.order })),
    })
    console.log('seeded cities:', CITIES.length)
  } else {
    console.log('cities already present:', cityCount, '(skipped)')
  }

  const officeCount = await prisma.office.count()
  if (officeCount === 0) {
    await prisma.office.create({
      data: {
        name: 'AVENTA — Antalya',
        address: 'Fener, Tekelioğlu Cd., Muratpaşa, Antalya',
        city: 'Antalya',
        country: 'Türkiye',
        lat: 36.8987,
        lng: 30.8005,
        enabled: true,
        order: 0,
      },
    })
    console.log('seeded 1 office')
  } else {
    console.log('offices already present:', officeCount, '(skipped)')
  }

  const cities = await prisma.city.findMany({ orderBy: { order: 'asc' } })
  const offices = await prisma.office.findMany()
  console.log('cities:', cities.map((c) => `${c.name}${c.enabled ? '' : '(off)'}`).join(', '))
  console.log('offices:', offices.map((o) => `${o.name} @ ${o.lat},${o.lng}`).join(' | '))
}

main().finally(() => prisma.$disconnect())
