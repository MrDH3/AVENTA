import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'node:crypto'
import { OAUTH_PROVIDERS, buildAuthUrl, type OAuthProvider } from '@/lib/oauth'
import { getProviderPublicConfig } from '@/lib/provider-credentials'
import { env } from '@/lib/env'

/** Start an OAuth flow: load DB config, refuse if disabled/unconfigured, set a
 *  CSRF state cookie, and redirect to the provider. */
export async function GET(req: Request, { params }: { params: { provider: string } }) {
  const provider = params.provider as OAuthProvider
  if (!OAUTH_PROVIDERS.includes(provider)) {
    return NextResponse.redirect(`${env.appUrl}/auth?error=unknown_provider`)
  }

  const cfg = await getProviderPublicConfig(provider)
  if (!cfg.enabled || !cfg.configured || !cfg.clientId) {
    return NextResponse.redirect(`${env.appUrl}/auth?error=provider_unavailable&provider=${provider}`)
  }

  const url = new URL(req.url)
  const next = url.searchParams.get('next') || '/account'
  const state = crypto.randomBytes(16).toString('hex')

  cookies().set('oauth_state', `${state}:${next}`, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })

  return NextResponse.redirect(buildAuthUrl(provider, state, cfg.clientId))
}
