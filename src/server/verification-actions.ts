'use server'

import { revalidatePath } from 'next/cache'
import { requireStaff, requireSettingsAccess } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { prisma } from '@/lib/db'
import { setVerificationMethod } from '@/lib/verification-method'
import { isRequiredDocType } from '@/lib/verification'

export interface VerificationDecisionResult {
  ok: boolean
  error?: string
}

function parseDate(v?: string): Date | null {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Staff-only PER-DOCUMENT verification decision — the ONLY place a document becomes APPROVED
 * (VERIFIED) and the ONLY place its expiry is entered. The customer can never set these
 * (uploadDocumentAction only ever creates PENDING attempts). Each required document is decided
 * independently; "is the customer verified?" is DERIVED from all documents (getVerificationForUser),
 * so approving one and rejecting another leaves the customer correctly un-verified until all pass.
 *
 * APPROVE requires an expiry for expiring IDs (passport/licence) so the expiry-aware gate works;
 * a selfie has no expiry. REJECT requires a reason, surfaced to the customer so they know what to fix.
 * Decisions target the CURRENT (non-superseded) attempt — a stale prior attempt can't be re-decided.
 */
export async function setDocumentDecisionAction(input: {
  documentId: string
  decision: 'APPROVED' | 'REJECTED'
  expiresAt?: string // yyyy-mm-dd — required for expiring IDs on APPROVE
  reason?: string // required on REJECT
}): Promise<VerificationDecisionResult> {
  const staff = await requireStaff()
  const doc = await prisma.document.findUnique({
    where: { id: input.documentId },
    select: { id: true, userId: true, type: true, supersededAt: true },
  })
  if (!doc) return { ok: false, error: 'Документ не найден' }
  if (!isRequiredDocType(doc.type)) return { ok: false, error: 'Этот документ не подлежит проверке личности' }
  if (doc.supersededAt) return { ok: false, error: 'Это устаревшая попытка — решение принимается по актуальной загрузке' }

  const decidedAt = new Date()
  if (input.decision === 'APPROVED') {
    // Selfies don't expire; passport/licence images do → require an expiry so the gate can re-verify.
    const needsExpiry = doc.type !== 'SELFIE'
    const exp = parseDate(input.expiresAt)
    if (needsExpiry && !exp) return { ok: false, error: 'Укажите срок действия документа' }
    await prisma.document.update({
      where: { id: doc.id },
      data: { status: 'VERIFIED', expiresAt: exp, rejectionReason: null, reviewedById: staff.id, reviewedAt: decidedAt },
    })
  } else {
    const reason = input.reason?.trim().slice(0, 300)
    if (!reason) return { ok: false, error: 'Укажите причину отклонения' }
    await prisma.document.update({
      where: { id: doc.id },
      data: { status: 'REJECTED', rejectionReason: reason, reviewedById: staff.id, reviewedAt: decidedAt },
    })
  }

  await logAudit({ userId: staff.id, action: 'verification.doc.decision', entity: 'Document', entityId: doc.id, meta: { decision: input.decision, type: doc.type } })
  revalidatePath('/admin')
  revalidatePath('/admin/verifications')
  revalidatePath('/booking')
  revalidatePath('/account')
  return { ok: true }
}

/** Staff-only: switch the active verification method (MANUAL ⇄ SUMSUB, or a future provider). */
export async function saveVerificationMethodAction(method: string): Promise<{ ok: boolean }> {
  const staff = await requireSettingsAccess()
  await setVerificationMethod(method)
  await logAudit({ userId: staff.id, action: 'verification.method.set', entity: 'Setting', entityId: 'verification_method', meta: { method } })
  revalidatePath('/admin/settings/sumsub')
  revalidatePath('/booking')
  return { ok: true }
}
