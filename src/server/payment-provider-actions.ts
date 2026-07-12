'use server'

import { revalidatePath } from 'next/cache'
import { requireStaff } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { savePaymentProvider, isProviderKey } from '@/lib/payment-providers'
import { getAdapter } from '@/lib/payment-gateway/registry'

export interface PaymentProviderSaveResult {
  ok: boolean
  error?: string
}

/**
 * Save one payment processor's credentials + enabled flag (admin/owner only).
 * Secret fields are encrypted before storage; a blank secret keeps the existing
 * one. This action NEVER returns or logs a secret value — only which fields changed.
 */
export async function savePaymentProviderAction(
  _prev: PaymentProviderSaveResult,
  formData: FormData,
): Promise<PaymentProviderSaveResult> {
  const staff = await requireStaff()
  const key = String(formData.get('provider') ?? '')
  if (!isProviderKey(key)) return { ok: false, error: 'Неизвестный провайдер' }

  const adapter = getAdapter(key)
  const enabled = formData.get('enabled') === 'on' || formData.get('enabled') === 'true'

  const fields: Record<string, string> = {}
  const secretChanged: string[] = []
  for (const f of adapter.credentialFields) {
    const val = String(formData.get(f.key) ?? '')
    fields[f.key] = val
    if (f.secret && val.trim()) secretChanged.push(f.key)
  }

  await savePaymentProvider(key, { enabled, fields })

  await logAudit({
    userId: staff.id,
    action: 'payment.provider.save',
    entity: 'PaymentProvider',
    entityId: key,
    // Only metadata — never the secret values themselves.
    meta: { enabled, secretsChanged: secretChanged },
  })

  revalidatePath('/admin/settings/payment-providers')
  revalidatePath('/booking')
  return { ok: true }
}
