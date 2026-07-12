/**
 * One-time migration: move any OAuth credentials currently in .env into the
 * encrypted ProviderCredential store (DB becomes the source of truth). Idempotent
 * — skips a provider that already has a DB row. Uses the SAME AES-256-GCM cipher
 * + DOC_ENCRYPTION_KEY as src/lib/crypto.ts, so the app decrypts it correctly.
 *
 *   node --env-file=.env --import tsx ./scripts/migrate-oauth-to-db.ts
 */
import { PrismaClient } from '@prisma/client'
import crypto from 'node:crypto'

const prisma = new PrismaClient()

function key(): Buffer {
  const b = Buffer.from(process.env.DOC_ENCRYPTION_KEY ?? '', 'hex')
  if (b.length !== 32) throw new Error('DOC_ENCRYPTION_KEY must be 32 bytes (64 hex chars)')
  return b
}
function encryptSecret(pt: string) {
  const iv = crypto.randomBytes(12)
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const data = Buffer.concat([c.update(Buffer.from(pt, 'utf8')), c.final()])
  return { ciphertext: data.toString('hex'), iv: iv.toString('hex'), authTag: c.getAuthTag().toString('hex') }
}

const SOURCES: { provider: string; clientId?: string; secret?: string }[] = [
  { provider: 'google', clientId: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET },
  { provider: 'yandex', clientId: process.env.YANDEX_CLIENT_ID, secret: process.env.YANDEX_CLIENT_SECRET },
  { provider: 'telegram', clientId: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME, secret: process.env.TELEGRAM_LOGIN_BOT_TOKEN },
]

async function main() {
  const results: Record<string, string> = {}
  for (const s of SOURCES) {
    const existing = await prisma.providerCredential.findUnique({ where: { provider: s.provider } })
    if (existing) {
      results[s.provider] = 'skipped (DB row already exists)'
      continue
    }
    if (!s.clientId || !s.secret) {
      results[s.provider] = 'skipped (no .env keys)'
      continue
    }
    const enc = encryptSecret(s.secret)
    await prisma.providerCredential.create({
      data: {
        provider: s.provider,
        clientId: s.clientId,
        encryptedClientSecret: enc.ciphertext,
        secretIv: enc.iv,
        secretAuthTag: enc.authTag,
        enabled: true,
      },
    })
    results[s.provider] = 'migrated → encrypted DB (enabled)'
  }
  console.log(JSON.stringify(results, null, 0))
}
main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
