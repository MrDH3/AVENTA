import 'server-only'
import { Prisma } from '@prisma/client'
import { prisma } from './db'
import { saveEncrypted, deleteStored } from './crypto-storage'
import { getApplicantImages } from './sumsub'
import { BLOCKING_STATUSES } from './availability'
import { logAudit } from './audit'

/**
 * Verified government-ID images (highest-liability data). They are pulled from
 * Sumsub after an APPROVED result and stored ONLY in the AES-256-GCM encrypted
 * document store (crypto-storage → env.storageDir/.storage). The bytes go from the
 * Sumsub API response straight into saveEncrypted — never to the public folder,
 * never to disk unencrypted, never to logs. Served only via the gated
 * /api/documents/[id] route (owner-or-staff).
 */

const FILENAME: Record<string, string> = {
  PASSPORT: 'id-passport',
  LICENSE_FRONT: 'id-licence-front',
  LICENSE_BACK: 'id-licence-back',
}
function extFromMime(mime: string): string {
  if (/png/i.test(mime)) return 'png'
  if (/webp/i.test(mime)) return 'webp'
  if (/pdf/i.test(mime)) return 'pdf'
  return 'jpg'
}

/**
 * Retrieve verified ID images from Sumsub and store them encrypted, attached to the
 * customer's profile as Document rows. Idempotent (skips if the same image set is
 * already stored) and replace-on-re-verification (a fresh approval swaps the set).
 * Returns the number of images stored (0 if none fetched — existing docs untouched).
 */
export async function storeVerifiedDocuments(userId: string, applicantId: string): Promise<number> {
  const images = await getApplicantImages(applicantId)
  if (images.length === 0) return 0 // couldn't fetch — keep whatever exists, never wipe

  const newIds = new Set(images.map((i) => i.sumsubImageId))
  const existing = await prisma.document.findMany({
    where: { userId, sumsubImageId: { not: null } },
    select: { id: true, sumsubImageId: true, storageKey: true },
  })
  const existingIds = new Set(existing.map((e) => e.sumsubImageId))
  if (images.every((img) => existingIds.has(img.sumsubImageId))) return 0 // already stored (idempotent / duplicate webhook)

  // Docs from a PREVIOUS verification (not in the new set). Retired AFTER the new set is
  // fully stored — store-then-purge, so a mid-store failure can never leave the customer
  // with a partial/empty verified-ID set (the prior good set stays intact until success).
  const stale = existing.filter((e) => e.sumsubImageId != null && !newIds.has(e.sumsubImageId))

  const createdIds: string[] = []
  const createdKeys: string[] = []
  try {
    for (const img of images) {
      if (existingIds.has(img.sumsubImageId)) continue // this exact image already stored
      const enc = await saveEncrypted(img.bytes, extFromMime(img.mime)) // ← encrypted store ONLY
      try {
        const doc = await prisma.document.create({
          data: {
            userId,
            type: img.type,
            storageKey: enc.storageKey,
            filename: `${FILENAME[img.type] ?? 'id-doc'}.${extFromMime(img.mime)}`,
            mime: img.mime,
            size: enc.size,
            iv: enc.iv,
            authTag: enc.authTag,
            status: 'VERIFIED',
            sumsubImageId: img.sumsubImageId,
          },
        })
        createdIds.push(doc.id)
        createdKeys.push(enc.storageKey)
      } catch (e) {
        // Concurrent webhook already stored this exact image (unique userId+sumsubImageId):
        // discard the bytes we just wrote and continue — not a real error.
        await deleteStored(enc.storageKey).catch(() => {})
        if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e
      }
    }
  } catch (e) {
    // Roll back OUR partial new set; the previous good set (stale) is untouched.
    for (const k of createdKeys) await deleteStored(k).catch(() => {})
    if (createdIds.length) await prisma.document.deleteMany({ where: { id: { in: createdIds } } })
    throw e
  }

  // New set complete → now retire the previous set (idempotent under concurrency).
  if (stale.length) {
    for (const d of stale) await deleteStored(d.storageKey).catch(() => {})
    await prisma.document.deleteMany({ where: { id: { in: stale.map((d) => d.id) } } })
  }

  if (createdIds.length) await logAudit({ userId, action: 'iddoc.stored', entity: 'ClientProfile', entityId: userId, meta: { count: createdIds.length } })
  return createdIds.length
}

/**
 * Securely remove ALL Sumsub-sourced ID documents for a customer: deletes the
 * ENCRYPTED BYTES from the store (deleteStored → fs.rm) AND the DB reference — not
 * just a flag. Returns how many were purged.
 */
export async function purgeCustomerIdDocuments(userId: string): Promise<number> {
  const docs = await prisma.document.findMany({ where: { userId, sumsubImageId: { not: null } } })
  for (const d of docs) {
    await deleteStored(d.storageKey).catch(() => {}) // remove the ciphertext bytes on disk
  }
  const ids = docs.map((d) => d.id)
  if (ids.length) {
    await prisma.document.deleteMany({ where: { id: { in: ids } } })
    await logAudit({ userId, action: 'iddoc.purged', entity: 'ClientProfile', entityId: userId, meta: { count: ids.length } })
  }
  return ids.length
}

/* ─────────────────────────── retention policy ──────────────────────────── */

const RETENTION_KEY = 'id_doc_retention_days'
const DEFAULT_RETENTION_DAYS = 90

export async function getRetentionDays(): Promise<number> {
  const s = await prisma.setting.findUnique({ where: { key: RETENTION_KEY } })
  const n = parseInt(s?.value ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_RETENTION_DAYS
}

export async function setRetentionDays(days: number): Promise<void> {
  const v = String(Math.max(1, Math.floor(days)))
  await prisma.setting.upsert({
    where: { key: RETENTION_KEY },
    update: { value: v, group: 'verification' },
    create: { key: RETENTION_KEY, value: v, group: 'verification' },
  })
}

/**
 * Retention sweep. Purges Sumsub ID documents older than the retention period whose
 * owner has no active/upcoming rental (the relationship has ended). Securely removes
 * the encrypted bytes + the DB reference. Run on a schedule (see /api/cron/document-retention)
 * and/or manually from admin.
 */
export async function runDocumentRetention(): Promise<{ scanned: number; purged: number; usersPurged: number; retentionDays: number }> {
  const retentionDays = await getRetentionDays()
  const cutoff = new Date(Date.now() - retentionDays * 86_400_000)
  const stale = await prisma.document.findMany({
    where: { sumsubImageId: { not: null }, uploadedAt: { lt: cutoff } },
    select: { id: true, userId: true, storageKey: true },
  })

  const byUser = new Map<string, { id: string; storageKey: string }[]>()
  for (const d of stale) {
    const a = byUser.get(d.userId) ?? []
    a.push({ id: d.id, storageKey: d.storageKey })
    byUser.set(d.userId, a)
  }

  const now = new Date()
  let purged = 0
  let usersPurged = 0
  for (const [userId, docs] of byUser) {
    const active = await prisma.booking.count({
      where: {
        userId,
        OR: [
          { status: { in: BLOCKING_STATUSES }, endAt: { gte: now } }, // scheduled ongoing/upcoming
          { status: { in: ['ACTIVE', 'DELIVERED'] } }, // car physically out (kept even if the return is overdue)
        ],
      },
    })
    if (active > 0) continue // active/upcoming rental — keep the ID during the relationship
    for (const d of docs) await deleteStored(d.storageKey).catch(() => {})
    await prisma.document.deleteMany({ where: { id: { in: docs.map((d) => d.id) } } })
    purged += docs.length
    usersPurged++
  }

  await logAudit({ action: 'iddoc.retention.sweep', entity: 'Document', entityId: 'retention', meta: { retentionDays, scanned: stale.length, purged, usersPurged } })
  return { scanned: stale.length, purged, usersPurged, retentionDays }
}
