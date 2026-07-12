'use server'

import type { DocumentType } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { saveEncrypted, deleteStored } from '@/lib/crypto-storage'
import { isRequiredDocType } from '@/lib/verification'
import { validateUpload } from '@/lib/validation'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'

const VALID_TYPES: DocumentType[] = ['PASSPORT', 'SELFIE', 'LICENSE_FRONT', 'LICENSE_BACK', 'PAYMENT_PROOF', 'OTHER']

export interface UploadResult {
  ok: boolean
  error?: string
  documentId?: string
  filename?: string
  type?: DocumentType
}

/** Encrypt & store an uploaded document, returning its id (to attach to a booking). */
export async function uploadDocumentAction(formData: FormData): Promise<UploadResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'Требуется вход' }

  const rl = rateLimit(`upload:${clientIp()}`, 30, 600)
  if (!rl.ok) return { ok: false, error: 'Слишком много загрузок, попробуйте позже' }

  const file = formData.get('file')
  const typeRaw = String(formData.get('type') ?? 'OTHER') as DocumentType
  const type = VALID_TYPES.includes(typeRaw) ? typeRaw : 'OTHER'

  if (!(file instanceof File)) return { ok: false, error: 'Файл не передан' }
  const err = validateUpload({ size: file.size, type: file.type })
  if (err) return { ok: false, error: err }

  const bytes = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split('.').pop() ?? ''
  const stored = await saveEncrypted(bytes, ext)

  const required = isRequiredDocType(type)

  // A required-ID upload is a NEW, immutable submission (per-document verification): supersede the
  // customer's prior CURRENT attempt of the SAME type (it stays on record for the admin, just no
  // longer counts) and mark this new attempt PENDING review (UNDER_REVIEW). Superseding whatever the
  // prior status was — including an APPROVED-but-expired doc — is exactly what lets an expired
  // customer re-verify without being stranded. This NEVER sets APPROVED (staff-only); the customer
  // can only ever move a document to PENDING, never verify themselves.
  //
  // Supersede + create run in ONE transaction so we can never supersede the prior attempt without
  // creating its replacement (which would leave the customer with no current doc for that type).
  const docData = {
    userId: user.id,
    type,
    storageKey: stored.storageKey,
    filename: file.name.slice(0, 200),
    mime: file.type,
    size: stored.size,
    iv: stored.iv,
    authTag: stored.authTag,
    status: (required ? 'UNDER_REVIEW' : 'UPLOADED') as 'UNDER_REVIEW' | 'UPLOADED',
  }
  const doc = required
    ? await prisma.$transaction(async (tx) => {
        await tx.document.updateMany({ where: { userId: user.id, type, supersededAt: null }, data: { supersededAt: new Date() } })
        return tx.document.create({ data: docData })
      })
    : await prisma.document.create({ data: docData })

  await logAudit({ userId: user.id, action: 'document.upload', entity: 'Document', entityId: doc.id, meta: { type } })

  return { ok: true, documentId: doc.id, filename: doc.filename, type }
}

/**
 * Owner deletes their own document upload — allowed ONLY while it is PENDING (UPLOADED/UNDER_REVIEW)
 * or REJECTED, and only for their CURRENT (non-superseded) attempt. This is the authority-over-state
 * rule enforced server-side: an APPROVED (VERIFIED) document is the customer's verified set and can
 * NEVER be user-deleted (a crafted request must not silently un-verify them), and superseded
 * historical attempts stay immutable for the admin audit trail. After deleting a pending/rejected
 * upload the customer simply re-uploads (a fresh PENDING attempt). Removes the encrypted file too.
 */
export async function deleteDocumentAction(documentId: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'Требуется вход' }
  const doc = await prisma.document.findUnique({ where: { id: documentId } })
  if (!doc || doc.userId !== user.id) return { ok: false, error: 'Нет доступа' }
  if (doc.supersededAt !== null) return { ok: false, error: 'Этот документ уже заменён и сохраняется в истории' }
  if (doc.status === 'VERIFIED') return { ok: false, error: 'Проверенный документ нельзя удалить' }
  // status is now one of UPLOADED / UNDER_REVIEW (pending) or REJECTED → deletable
  await deleteStored(doc.storageKey).catch(() => {})
  await prisma.document.delete({ where: { id: documentId } })
  await logAudit({ userId: user.id, action: 'document.delete', entity: 'Document', entityId: documentId, meta: { type: doc.type, status: doc.status } })
  return { ok: true }
}

/**
 * Persist the document issuing country/region on the customer's profile from the standalone
 * "My documents" page (the booking flow persists these at booking submit; this mirrors that so the
 * selection survives a reload and is recorded for verification). Owner-only, upsert.
 */
export async function saveDocLocationAction(input: { country: string; region: string }): Promise<{ ok: boolean }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false }
  const docCountry = (input.country || '').trim().slice(0, 100) || null
  const docRegion = (input.region || '').trim().slice(0, 100) || null
  await prisma.clientProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, docCountry, docRegion },
    update: { docCountry, docRegion },
  })
  return { ok: true }
}
