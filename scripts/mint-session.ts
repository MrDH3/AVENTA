// Dev helper: mint a session token for an email. Usage: tsx scripts/mint-session.ts <email>
import { PrismaClient } from '@prisma/client'
import crypto from 'node:crypto'

const prisma = new PrismaClient()
const email = process.argv[2] ?? 'admin@aventa.rent'

async function main() {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error(`No user ${email}`)
  const token = crypto.randomBytes(32).toString('base64url')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  await prisma.session.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 3600_000) } })
  process.stdout.write(token)
}
main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
