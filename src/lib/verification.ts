import type { VerificationStatus, DocumentType, DocumentStatus } from '@prisma/client'

/**
 * Expiry-aware verification gate — the single source of truth for "is this customer
 * verified enough to complete a booking?".
 *
 * The rule (a real liability control): "already verified" means APPROVED *and* neither
 * the passport nor the licence has expired. A returning customer skips re-verification
 * ONLY when `valid` is true. If a document expiry is KNOWN and in the past, the customer
 * must re-verify — we never trust an old approval whose licence has since expired.
 *
 * Pure + isomorphic (no DB / no secrets) so it can run on the server (booking page,
 * submit) and be reflected on the client (Step 3) identically.
 */
export interface VerificationInput {
  verificationStatus: VerificationStatus
  passportExpiry: Date | string | null
  licenseExpiry: Date | string | null
  verificationReason?: string | null
  sumsubApplicantId?: string | null
  verifiedAt?: Date | string | null
}

export interface VerificationState {
  status: VerificationStatus
  /** APPROVED AND no known-expired document → the customer may complete a booking / skip re-verification. */
  valid: boolean
  passportExpired: boolean
  licenseExpired: boolean
  passportExpiry: string | null // ISO
  licenseExpiry: string | null // ISO
  verifiedAt: string | null
  reason: string | null
}

function toDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

export function verificationState(profile: VerificationInput | null, now: Date = new Date()): VerificationState {
  const status = profile?.verificationStatus ?? 'NONE'
  const passport = toDate(profile?.passportExpiry ?? null)
  const license = toDate(profile?.licenseExpiry ?? null)

  // "expired" only when the expiry is KNOWN and strictly before now.
  const passportExpired = passport != null && passport.getTime() < now.getTime()
  const licenseExpired = license != null && license.getTime() < now.getTime()

  const valid = status === 'APPROVED' && !passportExpired && !licenseExpired

  return {
    status,
    valid,
    passportExpired,
    licenseExpired,
    passportExpiry: passport ? passport.toISOString() : null,
    licenseExpiry: license ? license.toISOString() : null,
    verifiedAt: toDate(profile?.verifiedAt ?? null)?.toISOString() ?? null,
    reason: profile?.verificationReason ?? null,
  }
}

// ───────────────────────── Per-document verification (derived) ─────────────────────────
//
// The manual method verifies EACH document independently. "Is this customer verified?" is DERIVED:
// every required document type's CURRENT (non-superseded) attempt is APPROVED and not expired. This
// derived value REPLACES the customer-level verificationStatus as the gate's source of truth.

export const REQUIRED_DOC_TYPES = ['PASSPORT', 'SELFIE', 'LICENSE_FRONT', 'LICENSE_BACK'] as const
export type RequiredDocType = (typeof REQUIRED_DOC_TYPES)[number]

export function isRequiredDocType(t: string): t is RequiredDocType {
  return (REQUIRED_DOC_TYPES as readonly string[]).includes(t)
}

export const REQUIRED_DOC_LABELS: Record<RequiredDocType, { ru: string; en: string }> = {
  PASSPORT: { ru: 'Паспорт / ID', en: 'Passport / ID' },
  SELFIE: { ru: 'Селфи с документом', en: 'Selfie with document' },
  LICENSE_FRONT: { ru: 'Водит. удостоверение — лицевая', en: 'Driver’s licence — front' },
  LICENSE_BACK: { ru: 'Водит. удостоверение — обратная', en: 'Driver’s licence — back' },
}

/** Per-document decision, derived from the raw DocumentStatus. */
export type DocDecision = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'

/** Minimal current-attempt shape needed to derive verification (one CURRENT attempt per type). */
export interface CurrentDocInput {
  type: DocumentType | string
  status: DocumentStatus | string
  expiresAt: Date | string | null
  rejectionReason?: string | null
  id?: string | null
  uploadedAt?: Date | string | null
}

export interface DocStateOut {
  type: RequiredDocType
  decision: DocDecision
  valid: boolean // APPROVED and not expired
  expired: boolean
  expiresAt: string | null // ISO
  reason: string | null // reject reason (user-facing)
  documentId: string | null
  uploadedAt: string | null
}

export interface DerivedVerification {
  verified: boolean // every required type valid (APPROVED + not expired) — the gate reads THIS
  anySubmitted: boolean
  anyPending: boolean
  anyRejected: boolean
  anyExpired: boolean
  docs: DocStateOut[] // one entry per REQUIRED_DOC_TYPES, in order
}

function statusToDecision(s: string): DocDecision {
  if (s === 'VERIFIED') return 'APPROVED'
  if (s === 'REJECTED') return 'REJECTED'
  if (s === 'UPLOADED' || s === 'UNDER_REVIEW') return 'PENDING'
  return 'NONE'
}

/**
 * Derive per-document verification from a customer's CURRENT (non-superseded) required documents.
 * PURE + isomorphic so the server gate and the client (Documents step, cabinet) agree exactly.
 * `verified` = every required type has a current attempt that is APPROVED and not expired.
 */
export function deriveVerification(currentDocs: CurrentDocInput[], now: Date = new Date()): DerivedVerification {
  // Collapse to the latest attempt per type (defensive: normally there's exactly one non-superseded).
  const byType = new Map<string, CurrentDocInput>()
  for (const d of currentDocs) {
    const prev = byType.get(String(d.type))
    if (!prev) byType.set(String(d.type), d)
    else {
      const a = toDate(prev.uploadedAt ?? null)?.getTime() ?? 0
      const b = toDate(d.uploadedAt ?? null)?.getTime() ?? 0
      if (b >= a) byType.set(String(d.type), d)
    }
  }
  const docs: DocStateOut[] = REQUIRED_DOC_TYPES.map((type) => {
    const d = byType.get(type)
    if (!d) return { type, decision: 'NONE', valid: false, expired: false, expiresAt: null, reason: null, documentId: null, uploadedAt: null }
    const decision = statusToDecision(String(d.status))
    const exp = toDate(d.expiresAt)
    const expired = exp != null && exp.getTime() < now.getTime()
    return {
      type,
      decision,
      valid: decision === 'APPROVED' && !expired,
      expired,
      expiresAt: exp ? exp.toISOString() : null,
      reason: d.rejectionReason ?? null,
      documentId: d.id ?? null,
      uploadedAt: toDate(d.uploadedAt ?? null)?.toISOString() ?? null,
    }
  })
  return {
    verified: docs.every((d) => d.valid),
    anySubmitted: docs.some((d) => d.decision !== 'NONE'),
    anyPending: docs.some((d) => d.decision === 'PENDING'),
    anyRejected: docs.some((d) => d.decision === 'REJECTED'),
    anyExpired: docs.some((d) => d.expired),
    docs,
  }
}

/** One required document as shown in a staff review surface (queue + admin panels) — includes mime for the thumbnail. */
export interface ReviewDoc {
  documentId: string | null
  type: RequiredDocType
  label: string
  decision: DocDecision
  reason: string | null
  expiresAt: string | null // ISO
  expired: boolean
  mime: string | null
}

/** Build the per-document review list (one entry per required type) from a user's CURRENT documents. */
export function buildReviewDocs(
  currentDocs: (CurrentDocInput & { mime?: string | null })[],
  lang: 'ru' | 'en' = 'ru',
  now: Date = new Date(),
): ReviewDoc[] {
  const derived = deriveVerification(currentDocs, now)
  const byType = new Map(currentDocs.map((d) => [String(d.type), d]))
  return derived.docs.map((ds) => ({
    documentId: ds.documentId,
    type: ds.type,
    label: REQUIRED_DOC_LABELS[ds.type][lang],
    decision: ds.decision,
    reason: ds.reason,
    expiresAt: ds.expiresAt,
    expired: ds.expired,
    mime: byType.get(ds.type)?.mime ?? null,
  }))
}
