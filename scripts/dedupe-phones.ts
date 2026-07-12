/**
 * One-time data fix before adding the DB partial-unique index on User.phone.
 * Normalizes every stored phone to canonical form; for any set that collapses
 * to the same number, keeps the oldest account and NULLs the phone on the rest
 * (accounts are never merged automatically). Idempotent.
 *
 *   node --env-file=.env --import tsx ./scripts/dedupe-phones.ts
 */
import { PrismaClient } from '@prisma/client'
import { normalizePhone } from '../src/lib/phone'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    where: { phone: { not: null } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, phone: true },
  })

  const groups = new Map<string, string[]>() // normalized → [userId,…] (oldest first)
  let invalidNulled = 0

  for (const u of users) {
    const norm = normalizePhone(u.phone)
    if (!norm) {
      await prisma.user.update({ where: { id: u.id }, data: { phone: null } })
      invalidNulled++
      continue
    }
    if (!groups.has(norm)) groups.set(norm, [])
    groups.get(norm)!.push(u.id)
  }

  let normalized = 0
  let duplicatesNulled = 0
  for (const [norm, ids] of groups) {
    const [keep, ...dups] = ids
    await prisma.user.update({ where: { id: keep }, data: { phone: norm } })
    normalized++
    for (const dupId of dups) {
      await prisma.user.update({ where: { id: dupId }, data: { phone: null } })
      duplicatesNulled++
    }
  }

  console.log(JSON.stringify({ scanned: users.length, distinctPhones: groups.size, normalized, duplicatesNulled, invalidNulled }))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
