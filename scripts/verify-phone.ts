import { PrismaClient } from '@prisma/client'
import { normalizePhone } from '../src/lib/phone'

const prisma = new PrismaClient()

async function main() {
  // Exactly what registerAction & createBookingAction do: normalize, then findFirst.
  const formats = ['+90 555 123 45 67', '+905551234567', '90-555-123-45-67', '(90) 555 1234567']
  for (const f of formats) {
    const norm = normalizePhone(f)
    const hit = norm ? await prisma.user.findFirst({ where: { phone: norm }, select: { email: true } }) : null
    console.log(`${f.padEnd(22)} → ${String(norm).padEnd(15)} → ${hit ? 'REJECT (belongs to ' + hit.email + ')' : 'accept'}`)
  }
  const fresh = normalizePhone('+90 555 000 11 22')
  const freshHit = await prisma.user.findFirst({ where: { phone: fresh } })
  console.log(`${'+90 555 000 11 22 (new)'.padEnd(22)} → ${String(fresh).padEnd(15)} → ${freshHit ? 'REJECT' : 'accept ✓'}`)
}
main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
