import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { enabledConfiguredProviders, getProviderPublicConfig } from '@/lib/provider-credentials'
import { safeInternalPath } from '@/lib/safe-path'
import Auth from '@/views/Auth'

export const dynamic = 'force-dynamic'

export default async function AuthPage({
  searchParams,
}: {
  searchParams: { error?: string; reset?: string; reset_token?: string; mode?: string; next?: string }
}) {
  if (await getCurrentUser()) redirect('/account')

  // Source of truth is the DB (admin-managed). Only enabled + configured providers render.
  const enabled = await enabledConfiguredProviders()
  const providers = enabled.filter((p): p is 'google' | 'yandex' => p === 'google' || p === 'yandex')
  const tg = await getProviderPublicConfig('telegram')

  // Only a same-origin absolute path is a safe return target.
  const next = safeInternalPath(searchParams.next)

  return (
    <Auth
      providers={providers}
      telegramBot={tg.enabled && tg.configured ? tg.clientId : null}
      initialError={searchParams.error ?? null}
      resetToken={searchParams.reset_token ?? null}
      resetDone={searchParams.reset === 'done'}
      // Arriving from the booking flow (has a return path) → default to the simplified sign-up.
      initialMode={searchParams.mode === 'register' || (next && !searchParams.reset_token) ? 'register' : 'login'}
      next={next}
    />
  )
}
