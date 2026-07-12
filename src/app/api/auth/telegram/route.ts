import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { linkOrCreateUser } from '@/lib/identity'
import { createSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { env } from '@/lib/env'
import { getProviderPublicConfig, getDecryptedSecret } from '@/lib/provider-credentials'

// OAuth callback — reads request params + the DB at request time; never prerender at build.
export const dynamic = 'force-dynamic'

/**
 * Telegram Login Widget callback. Verifies the HMAC signature per
 * https://core.telegram.org/widgets/login#checking-authorization, then signs in.
 * The bot token (used as the HMAC key) is loaded from the encrypted DB store and
 * decrypted only here.
 */
export async function GET(req: Request) {
  const fail = (reason: string) => NextResponse.redirect(`${env.appUrl}/auth?error=${reason}`)
  const cfg = await getProviderPublicConfig('telegram')
  if (!cfg.enabled) return fail('telegram_unavailable')
  const botToken = await getDecryptedSecret('telegram')
  if (!botToken) return fail('telegram_unavailable')

  const url = new URL(req.url)
  const params: Record<string, string> = {}
  url.searchParams.forEach((v, k) => (params[k] = v))
  const { hash, ...data } = params
  if (!hash) return fail('telegram_missing')

  const checkString = Object.keys(data)
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join('\n')
  const secret = crypto.createHash('sha256').update(botToken).digest()
  const hmac = crypto.createHmac('sha256', secret).update(checkString).digest('hex')
  if (hmac !== hash) return fail('telegram_bad_signature')

  // reject stale payloads (>1 day)
  if (data.auth_date && Date.now() / 1000 - Number(data.auth_date) > 86400) return fail('telegram_expired')

  const user = await linkOrCreateUser({
    provider: 'telegram',
    providerAccountId: String(data.id),
    firstName: data.first_name,
    lastName: data.last_name,
    telegram: data.username ? `@${data.username}` : undefined,
    image: data.photo_url,
  })
  await createSession(user.id)
  await logAudit({ userId: user.id, action: 'auth.telegram', entity: 'User', entityId: user.id })
  return NextResponse.redirect(`${env.appUrl}/account`)
}
