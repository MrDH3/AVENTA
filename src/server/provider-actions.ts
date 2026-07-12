'use server'

import { revalidatePath } from 'next/cache'
import { requireStaff } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { saveProviderCredential, SOCIAL_PROVIDERS, type SocialProvider } from '@/lib/provider-credentials'

export interface ProviderSaveResult {
  ok: boolean
  error?: string
}

/**
 * Save a provider's Client ID / Secret / enabled flag. The secret (if supplied)
 * is encrypted before storage; a blank secret field keeps the existing one.
 * NOTE: this action never returns the secret.
 */
export async function saveAuthProviderAction(_prev: ProviderSaveResult, formData: FormData): Promise<ProviderSaveResult> {
  const staff = await requireStaff()
  const provider = String(formData.get('provider') ?? '') as SocialProvider
  if (!SOCIAL_PROVIDERS.includes(provider)) return { ok: false, error: 'Неизвестный провайдер' }

  const clientId = String(formData.get('clientId') ?? '')
  const clientSecret = String(formData.get('clientSecret') ?? '') // blank ⇒ keep existing
  const enabled = formData.get('enabled') === 'on' || formData.get('enabled') === 'true'

  await saveProviderCredential(provider, { clientId, clientSecret, enabled })
  await logAudit({
    userId: staff.id,
    action: 'provider.credential.save',
    entity: 'ProviderCredential',
    entityId: provider,
    meta: { enabled, clientIdSet: Boolean(clientId), secretChanged: Boolean(clientSecret.trim()) },
  })

  revalidatePath('/admin/settings/auth')
  revalidatePath('/auth')
  return { ok: true }
}
