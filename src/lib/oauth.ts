import 'server-only'
import { env } from './env'

export type OAuthProvider = 'google' | 'yandex'
export const OAUTH_PROVIDERS: OAuthProvider[] = ['google', 'yandex']

export interface OAuthProfile {
  providerAccountId: string
  email?: string
  firstName?: string
  lastName?: string
  image?: string
}

interface ProviderMeta {
  authUrl: string
  tokenUrl: string
  scope: string
  fetchProfile: (accessToken: string) => Promise<OAuthProfile>
}

/** Provider metadata only — NO credentials here. clientId/secret come from the DB. */
function providerMeta(provider: OAuthProvider): ProviderMeta {
  if (provider === 'google') {
    return {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scope: 'openid email profile',
      async fetchProfile(token) {
        const r = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const j = (await r.json()) as { sub: string; email?: string; given_name?: string; family_name?: string; picture?: string }
        return { providerAccountId: j.sub, email: j.email, firstName: j.given_name, lastName: j.family_name, image: j.picture }
      },
    }
  }
  return {
    authUrl: 'https://oauth.yandex.ru/authorize',
    tokenUrl: 'https://oauth.yandex.ru/token',
    scope: 'login:email login:info',
    async fetchProfile(token) {
      const r = await fetch('https://login.yandex.ru/info?format=json', {
        headers: { Authorization: `OAuth ${token}` },
      })
      const j = (await r.json()) as { id: string; default_email?: string; first_name?: string; last_name?: string; default_avatar_id?: string }
      return {
        providerAccountId: j.id,
        email: j.default_email,
        firstName: j.first_name,
        lastName: j.last_name,
        image: j.default_avatar_id ? `https://avatars.yandex.net/get-yapic/${j.default_avatar_id}/islands-200` : undefined,
      }
    },
  }
}

export function oauthRedirectUri(provider: OAuthProvider): string {
  return `${env.appUrl}/api/auth/oauth/${provider}/callback`
}

/** Build the provider authorize URL from a DB-sourced clientId (no secret needed). */
export function buildAuthUrl(provider: OAuthProvider, state: string, clientId: string): string {
  const m = providerMeta(provider)
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: oauthRedirectUri(provider),
    response_type: 'code',
    scope: m.scope,
    state,
    ...(provider === 'google' ? { access_type: 'online', prompt: 'select_account' } : {}),
  })
  return `${m.authUrl}?${params.toString()}`
}

/**
 * Exchange an authorization code for the user's profile. The decrypted client
 * secret is supplied by the caller ONLY here, at the token-exchange moment.
 */
export async function exchangeCodeForProfile(
  provider: OAuthProvider,
  code: string,
  clientId: string,
  clientSecret: string,
): Promise<OAuthProfile | null> {
  const m = providerMeta(provider)
  const res = await fetch(m.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: oauthRedirectUri(provider),
    }),
  })
  if (!res.ok) return null
  const tok = (await res.json()) as { access_token?: string }
  if (!tok.access_token) return null
  return m.fetchProfile(tok.access_token)
}
