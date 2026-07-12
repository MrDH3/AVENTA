/**
 * Domain-logic verification (run with: npx tsx scripts/verify-domain.ts).
 * Exercises availability (no double-booking), pricing, AES doc encryption,
 * and creates a demo session token for HTTP smoke tests.
 */
import crypto from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { checkCarAvailability, carStatusNow, nextFreeInterval, listAvailableCars } from '../src/lib/availability'
import { quote } from '../src/lib/pricing'
import { FALLBACK_RATES } from '../src/lib/money'

const prisma = new PrismaClient()
let pass = 0
let fail = 0
const ok = (name: string, cond: boolean, extra = '') => {
  console.log(`${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`)
  cond ? pass++ : fail++
}

async function main() {
  const cars = await prisma.car.findMany()
  const bySlug = Object.fromEntries(cars.map((c) => [c.slug, c]))
  const bmw = bySlug['bmw-520i']
  const e200 = bySlug['mercedes-benz-e-200']
  const vclass = bySlug['mercedes-benz-v-class']

  const d = (s: string) => new Date(s)

  // 1. Overlap rejected (BMW busy Aug 5–18)
  const overlap = await checkCarAvailability(bmw.id, d('2026-08-10'), d('2026-08-15'))
  ok('BMW 520i Aug 10–15 rejected (overlaps Aug 5–18)', !overlap.available && overlap.reason === 'OVERLAP', overlap.reason)

  // 2. Free window allowed
  const free = await checkCarAvailability(bmw.id, d('2026-08-25'), d('2026-08-28'))
  ok('BMW 520i Aug 25–28 available', free.available)

  // 3. Prep-time buffer respected (right after Aug 18 end + 3h prep)
  const tooClose = await checkCarAvailability(bmw.id, d('2026-08-18'), d('2026-08-20'))
  ok('BMW 520i Aug 18 blocked by prep buffer', !tooClose.available, tooClose.reason)

  // 4. Currently-active car reports busy
  const status = await carStatusNow(vclass.id)
  ok('V-Class busy now (active rental Jun 28–Jul 10)', !status.availableNow && status.nextFree !== null,
    status.nextFree ? `free ${status.nextFree.toISOString().slice(0, 10)}` : '')

  // 5. Nearest free interval suggestion
  const nf = await nextFreeInterval(bmw.id, 5, d('2026-08-10'))
  ok('nextFreeInterval returns a window for BMW', nf !== null, nf ? `${nf.start.toISOString().slice(0,10)}→${nf.end.toISOString().slice(0,10)}` : '')

  // 6. "Free cars for my dates" excludes the busy BMW
  const availIds = await listAvailableCars(d('2026-08-10'), d('2026-08-15'))
  ok('listAvailableCars(Aug10–15) excludes BMW', !availIds.includes(bmw.id), `${availIds.length} free`)
  ok('listAvailableCars includes E200', availIds.includes(e200.id))

  // 7. Pricing quote
  const q = quote({ car: e200, start: d('2026-08-10'), end: d('2026-08-15'), extras: [], insuranceType: 'BASIC', currency: 'EUR', rates: FALLBACK_RATES })
  ok('E200 5-day BASIC quote = €600 rent, €800 deposit', Number(q.rentTotal) === 600 && Number(q.deposit) === 800, `subtotal ${q.subtotal}`)
  const qExt = quote({ car: e200, start: d('2026-08-10'), end: d('2026-08-15'), extras: [], insuranceType: 'EXTENDED', currency: 'EUR', rates: FALLBACK_RATES })
  ok('EXTENDED insurance adds 15%/day (€90)', Number(qExt.insuranceTotal) === 90, `${qExt.insuranceTotal}`)

  // 8. AES-256-GCM round-trip (same algorithm as crypto-storage)
  const key = Buffer.from(process.env.DOC_ENCRYPTION_KEY ?? '', 'hex')
  const iv = crypto.randomBytes(12)
  const plain = Buffer.from('passport-scan-bytes-😀-паспорт')
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plain), cipher.final()])
  const tag = cipher.getAuthTag()
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const dec = Buffer.concat([decipher.update(enc), decipher.final()])
  ok('AES-256-GCM encrypt→decrypt round-trip', dec.equals(plain) && !enc.equals(plain), `key ${key.length}B`)

  // 9. Mint a demo session for HTTP smoke tests
  const client = await prisma.user.findUnique({ where: { email: 'ivan@example.com' } })
  if (client) {
    const token = crypto.randomBytes(32).toString('base64url')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    await prisma.session.create({ data: { userId: client.id, tokenHash, expiresAt: new Date(Date.now() + 3600_000) } })
    console.log(`\nSESSION_TOKEN=${token}`)
  }

  console.log(`\n${pass} passed, ${fail} failed`)
  if (fail) process.exitCode = 1
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
