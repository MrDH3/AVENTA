'use server'

import { revalidatePath } from 'next/cache'
import { requireSettingsAccess, getCurrentUser } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { prisma } from '@/lib/db'
import { saveSumsubConfig, createAccessToken } from '@/lib/sumsub'
import { setRetentionDays } from '@/lib/id-documents'
import { verificationState, type VerificationState } from '@/lib/verification'

export interface SumsubSaveResult {
  ok: boolean
  error?: string
}

/**
 * Save Sumsub config (admin/owner only). Secret fields are encrypted before storage;
 * blank fields keep the existing value. NEVER returns or logs a secret.
 */
export async function saveSumsubConfigAction(_prev: SumsubSaveResult, formData: FormData): Promise<SumsubSaveResult> {
  const staff = await requireSettingsAccess()
  const levelName = String(formData.get('levelName') ?? '')
  const enabled = formData.get('enabled') === 'on' || formData.get('enabled') === 'true'
  const appToken = String(formData.get('appToken') ?? '')
  const secretKey = String(formData.get('secretKey') ?? '')
  const webhookSecret = String(formData.get('webhookSecret') ?? '')

  await saveSumsubConfig({ enabled, levelName, appToken, secretKey, webhookSecret })

  const retentionDays = parseInt(String(formData.get('retentionDays') ?? ''), 10)
  if (Number.isFinite(retentionDays) && retentionDays > 0) await setRetentionDays(retentionDays)

  await logAudit({
    userId: staff.id,
    action: 'sumsub.config.save',
    entity: 'SumsubConfig',
    entityId: 'default',
    meta: { enabled, levelSet: Boolean(levelName.trim()), secretsChanged: [appToken, secretKey, webhookSecret].filter((s) => s.trim()).length },
  })
  revalidatePath('/admin/settings/sumsub')
  revalidatePath('/booking')
  return { ok: true }
}

/**
 * Customer: create a Sumsub WebSDK access token for the signed-in user (externalUserId
 * = our user id, so the same applicant is reused across sessions).
 */
export async function createSumsubAccessTokenAction(): Promise<{ ok: boolean; token?: string; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'auth' }
  // Ensure a profile row exists to receive the webhook result later.
  await prisma.clientProfile.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } })
  const res = await createAccessToken(user.id)
  if (!res.ok) return { ok: false, error: res.error }
  await logAudit({ userId: user.id, action: 'sumsub.token.create', entity: 'ClientProfile', entityId: user.id })
  return { ok: true, token: res.token }
}

/** Customer: current verification state (used by Step 3 to poll after the WebSDK flow). */
export async function getMyVerificationStatusAction(): Promise<{ ok: boolean; state?: VerificationState }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false }
  const profile = await prisma.clientProfile.findUnique({ where: { userId: user.id } })
  return { ok: true, state: verificationState(profile) }
}
