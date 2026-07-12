'use server'

import { revalidatePath } from 'next/cache'
import { requireStaff } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { prisma } from '@/lib/db'
import { purgeCustomerIdDocuments, runDocumentRetention, storeVerifiedDocuments } from '@/lib/id-documents'

export interface PurgeResult {
  ok: boolean
  purged?: number
  error?: string
}

/**
 * Admin/owner: securely purge a customer's stored ID documents NOW (e.g. the rental
 * relationship ended, or a data-erasure request). Removes the encrypted bytes + the DB
 * reference — not just a flag.
 */
export async function purgeCustomerDocsAction(userId: string): Promise<PurgeResult> {
  const staff = await requireStaff()
  const purged = await purgeCustomerIdDocuments(userId)
  await logAudit({ userId: staff.id, action: 'iddoc.purge.manual', entity: 'ClientProfile', entityId: userId, meta: { purged } })
  revalidatePath('/admin')
  return { ok: true, purged }
}

/** Admin/owner: run the retention sweep now (also runnable on a schedule via cron). */
export async function runRetentionSweepAction(): Promise<{ ok: boolean; scanned?: number; purged?: number; usersPurged?: number; retentionDays?: number }> {
  await requireStaff()
  const res = await runDocumentRetention()
  return { ok: true, ...res }
}

/**
 * Admin/owner: re-pull a customer's verified ID images from Sumsub — a recovery path if
 * the post-approval retrieval failed transiently (idempotent; safe to re-run).
 */
export async function resyncCustomerDocsAction(userId: string): Promise<{ ok: boolean; stored?: number; error?: string }> {
  const staff = await requireStaff()
  const profile = await prisma.clientProfile.findUnique({ where: { userId }, select: { sumsubApplicantId: true, verificationStatus: true } })
  if (!profile?.sumsubApplicantId) return { ok: false, error: 'Нет applicantId Sumsub' }
  if (profile.verificationStatus !== 'APPROVED') return { ok: false, error: 'Клиент не подтверждён' }
  const stored = await storeVerifiedDocuments(userId, profile.sumsubApplicantId)
  await logAudit({ userId: staff.id, action: 'iddoc.resync', entity: 'ClientProfile', entityId: userId, meta: { stored } })
  return { ok: true, stored }
}
