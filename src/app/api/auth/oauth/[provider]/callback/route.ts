import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { OAUTH_PROVIDERS, exchangeCodeForProfile, type OAuthProvider } from '@/lib/oauth'
import { getProviderAuthConfig } from '@/lib/provider-credentials'
import { linkOrCreateUser } from '@/lib/identity'
import { createSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { env } from '@/lib/env'

/** OAuth callback: verify state, load DB creds (decrypting the secret only now),
 *  exchange the code, link/create the user, start a session. */
export async function GET(req: Request, { params }: { params: { provider: string } }) {
  const provider = params.provider as OAuthProvider
  const fail = (reason: string) => NextResponse.redirect(`${env.appUrl}/auth?error=${reason}`)

  if (!OAUTH_PROVIDERS.includes(provider)) return fail('unknown_provider')

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const stored = cookies().get('oauth_state')?.value
  cookies().delete('oauth_state')

  if (!code || !state || !stored) return fail('oauth_missing')
  const [storedState, next] = stored.split(':')
  if (state !== storedState) return fail('oauth_state_mismatch')

  // Load clientId + decrypted secret from the DB — only at the token-exchange moment.
  const cfg = await getProviderAuthConfig(provider)
  if (!cfg) return fail('provider_unavailable')

  const profile = await exchangeCodeForProfile(provider, code, cfg.clientId, cfg.clientSecret)
  if (!profile) return fail('oauth_exchange_failed')

  const user = await linkOrCreateUser({
    provider,
    providerAccountId: profile.providerAccountId,
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    image: profile.image,
  })
  await createSession(user.id)
  await logAudit({ userId: user.id, action: `auth.oauth.${provider}`, entity: 'User', entityId: user.id })

  const dest = next && next.startsWith('/') ? next : '/account'
  return NextResponse.redirect(`${env.appUrl}${dest}`)
}
