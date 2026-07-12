import 'server-only'
import crypto from 'node:crypto'
import type { Prisma, VerificationStatus } from '@prisma/client'
import { prisma } from './db'
import { encryptSecret, decryptSecret, type EncryptedSecret } from './crypto'

/**
 * Sumsub (identity verification) integration.
 *
 * Security notes:
 *  - App token, secret key and webhook secret are AES-256-GCM encrypted at rest
 *    (shared lib/crypto) and decrypted ONLY at the moment of use — never returned
 *    to the browser.
 *  - API requests are signed with X-App-Access-Sig = HMAC-SHA256(ts+METHOD+path+body).
 *  - Inbound webhooks are verified with verifyWebhookSignature() — the load-bearing
 *    control. An unsigned / wrongly-signed webhook must be rejected before any event
 *    is trusted (anyone who finds the URL could otherwise forge an "approved" result).
 */

const SUMSUB_BASE = 'https://api.sumsub.com' // sandbox uses the SAME host with sandbox (sbx:) credentials

const SECRET_FIELDS = ['appToken', 'secretKey', 'webhookSecret'] as const
type SecretField = (typeof SECRET_FIELDS)[number]
type SecretMap = Partial<Record<SecretField, EncryptedSecret>>

function asSecrets(v: Prisma.JsonValue | null | undefined): SecretMap {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as unknown as SecretMap) : {}
}

/* ─────────────────────────── config store (no secrets out) ─────────────── */

export interface SumsubPublicConfig {
  enabled: boolean
  levelName: string
  hasAppToken: boolean
  hasSecretKey: boolean
  hasWebhookSecret: boolean
  /** Enabled + level + all three credentials present. */
  configured: boolean
}

export async function getSumsubConfig(): Promise<SumsubPublicConfig> {
  const row = await prisma.sumsubConfig.findUnique({ where: { id: 'default' } })
  const secrets = asSecrets(row?.secrets)
  const has = (f: SecretField) => Boolean(secrets[f]?.ciphertext)
  return {
    enabled: row?.enabled ?? false,
    levelName: row?.levelName ?? '',
    hasAppToken: has('appToken'),
    hasSecretKey: has('secretKey'),
    hasWebhookSecret: has('webhookSecret'),
    configured: Boolean(row?.enabled && row?.levelName?.trim() && has('appToken') && has('secretKey') && has('webhookSecret')),
  }
}

/** Admin save. Blank secret fields keep the existing ciphertext. Never logs secrets. */
export async function saveSumsubConfig(input: {
  enabled: boolean
  levelName: string
  appToken?: string
  secretKey?: string
  webhookSecret?: string
}): Promise<void> {
  const existing = await prisma.sumsubConfig.findUnique({ where: { id: 'default' } })
  const secrets: SecretMap = { ...asSecrets(existing?.secrets) }
  const setIf = (f: SecretField, v?: string) => {
    const t = (v ?? '').trim()
    if (t) secrets[f] = encryptSecret(t) // replace only when a new value is typed
  }
  setIf('appToken', input.appToken)
  setIf('secretKey', input.secretKey)
  setIf('webhookSecret', input.webhookSecret)
  await prisma.sumsubConfig.upsert({
    where: { id: 'default' },
    update: { enabled: input.enabled, levelName: input.levelName.trim(), secrets: secrets as unknown as Prisma.InputJsonValue },
    create: { id: 'default', enabled: input.enabled, levelName: input.levelName.trim(), secrets: secrets as unknown as Prisma.InputJsonValue },
  })
}

/** Decrypt a single secret — ONLY at the point of use (API call / webhook verify). */
async function getSecret(field: SecretField): Promise<string | null> {
  const row = await prisma.sumsubConfig.findUnique({ where: { id: 'default' } })
  const s = asSecrets(row?.secrets)[field]
  if (!s?.ciphertext || !s.iv || !s.authTag) return null
  try {
    return decryptSecret(s.ciphertext, s.iv, s.authTag)
  } catch {
    return null
  }
}

/* ─────────────────────────── signed API client ─────────────────────────── */

function signRequest(secretKey: string, ts: number, method: string, path: string, body: string): string {
  return crypto.createHmac('sha256', secretKey).update(ts + method.toUpperCase() + path + body).digest('hex')
}

async function sumsubRequest(method: string, path: string, bodyObj?: unknown): Promise<{ ok: boolean; status: number; data: Record<string, unknown> | null }> {
  const [appToken, secretKey] = await Promise.all([getSecret('appToken'), getSecret('secretKey')])
  if (!appToken || !secretKey) return { ok: false, status: 0, data: { error: 'sumsub_not_configured' } }
  const body = bodyObj ? JSON.stringify(bodyObj) : ''
  const ts = Math.floor(Date.now() / 1000)
  const sig = signRequest(secretKey, ts, method, path, body)
  const res = await fetch(SUMSUB_BASE + path, {
    method,
    headers: {
      'X-App-Token': appToken,
      'X-App-Access-Sig': sig,
      'X-App-Access-Ts': String(ts),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body || undefined,
  })
  let data: Record<string, unknown> | null = null
  try {
    data = (await res.json()) as Record<string, unknown>
  } catch {
    data = null
  }
  return { ok: res.ok, status: res.status, data }
}

/** Access token for the WebSDK, bound to our user id (externalUserId). Short-lived. */
export async function createAccessToken(externalUserId: string, ttlInSecs = 600): Promise<{ ok: boolean; token?: string; error?: string }> {
  const cfg = await prisma.sumsubConfig.findUnique({ where: { id: 'default' } })
  const level = cfg?.levelName?.trim()
  if (!cfg?.enabled || !level) return { ok: false, error: 'not_configured' }
  const res = await sumsubRequest('POST', '/resources/accessTokens/sdk', { userId: externalUserId, levelName: level, ttlInSecs })
  const token = typeof res.data?.token === 'string' ? (res.data.token as string) : null
  if (!res.ok || !token) return { ok: false, error: String(res.data?.description ?? res.data?.error ?? `sumsub_${res.status}`) }
  return { ok: true, token }
}

/**
 * Document expiry metadata (NOT images) for the reuse/expiry check, fetched after
 * approval. Reads the applicant's extracted idDocs and maps validUntil per doc type.
 */
export interface DocExpiries {
  passportExpiry: Date | null
  licenseExpiry: Date | null
}
export async function getApplicantDocExpiries(applicantId: string): Promise<DocExpiries> {
  const out: DocExpiries = { passportExpiry: null, licenseExpiry: null }
  const res = await sumsubRequest('GET', `/resources/applicants/${encodeURIComponent(applicantId)}/one`)
  const info = res.data?.info as { idDocs?: unknown[] } | undefined
  if (!Array.isArray(info?.idDocs)) return out
  for (const raw of info!.idDocs!) {
    const d = raw as { idDocType?: string; validUntil?: string }
    const validUntil = d.validUntil ? new Date(d.validUntil) : null
    if (!validUntil || Number.isNaN(validUntil.getTime())) continue
    if (d.idDocType === 'DRIVERS') {
      out.licenseExpiry = validUntil
    } else if (d.idDocType === 'PASSPORT' || d.idDocType === 'ID_CARD' || d.idDocType === 'RESIDENCE_PERMIT') {
      if (!out.passportExpiry || validUntil < out.passportExpiry) out.passportExpiry = validUntil
    }
  }
  return out
}

/* ─────────────────────── verified document images ──────────────────────── */

/** Signed binary GET (image download). Returns the raw bytes + content-type. */
async function sumsubRequestBinary(method: string, path: string): Promise<{ ok: boolean; status: number; bytes: Buffer | null; mime: string }> {
  const [appToken, secretKey] = await Promise.all([getSecret('appToken'), getSecret('secretKey')])
  if (!appToken || !secretKey) return { ok: false, status: 0, bytes: null, mime: '' }
  const ts = Math.floor(Date.now() / 1000)
  const sig = signRequest(secretKey, ts, method, path, '')
  const res = await fetch(SUMSUB_BASE + path, {
    method,
    headers: { 'X-App-Token': appToken, 'X-App-Access-Sig': sig, 'X-App-Access-Ts': String(ts) },
  })
  if (!res.ok) return { ok: false, status: res.status, bytes: null, mime: '' }
  const bytes = Buffer.from(await res.arrayBuffer())
  return { ok: true, status: res.status, bytes, mime: res.headers.get('content-type') || 'application/octet-stream' }
}

export interface VerifiedImage {
  type: 'PASSPORT' | 'LICENSE_FRONT' | 'LICENSE_BACK'
  bytes: Buffer
  mime: string
  sumsubImageId: string
}

/**
 * Download an applicant's verified ID-document images (passport/ID + licence
 * front/back). The bytes stay in memory — the caller MUST put them straight into
 * the encrypted store. Never write them to disk unencrypted and never log them.
 */
export async function getApplicantImages(applicantId: string): Promise<VerifiedImage[]> {
  const one = await sumsubRequest('GET', `/resources/applicants/${encodeURIComponent(applicantId)}/one`)
  const inspectionId = typeof one.data?.inspectionId === 'string' ? (one.data.inspectionId as string) : null
  const info = one.data?.info as { idDocs?: unknown[] } | undefined
  if (!inspectionId || !Array.isArray(info?.idDocs)) return []

  const out: VerifiedImage[] = []
  for (const raw of info!.idDocs!) {
    const d = raw as { idDocType?: string; imageIds?: (number | string)[] }
    const imageIds = Array.isArray(d.imageIds) ? d.imageIds : []
    const isLicense = d.idDocType === 'DRIVERS'
    const isId = d.idDocType === 'PASSPORT' || d.idDocType === 'ID_CARD' || d.idDocType === 'RESIDENCE_PERMIT'
    if (!isLicense && !isId) continue
    for (let i = 0; i < imageIds.length; i++) {
      const imageId = String(imageIds[i])
      const img = await sumsubRequestBinary('GET', `/resources/inspections/${encodeURIComponent(inspectionId)}/resources/${encodeURIComponent(imageId)}`)
      if (!img.ok || !img.bytes) continue
      const type = isLicense ? (i === 0 ? 'LICENSE_FRONT' : 'LICENSE_BACK') : 'PASSPORT'
      out.push({ type, bytes: img.bytes, mime: img.mime, sumsubImageId: imageId })
    }
  }
  return out
}

/* ─────────────────────── webhook signature (LOAD-BEARING) ───────────────── */

const ALG_MAP: Record<string, string> = {
  HMAC_SHA1_HEX: 'sha1',
  HMAC_SHA256_HEX: 'sha256',
  HMAC_SHA512_HEX: 'sha512',
}

/**
 * Verify a Sumsub webhook: HMAC(rawBody, webhookSecret) with the algorithm named in
 * `x-payload-digest-alg`, compared timing-safely to `x-payload-digest`. Returns false
 * for a missing/unknown algorithm, a missing digest, an unconfigured secret, or any
 * mismatch. Callers MUST reject the request when this returns false, before parsing.
 */
export async function verifyWebhookSignature(rawBody: Buffer, digestHeader: string | null, algHeader: string | null): Promise<boolean> {
  if (!digestHeader) return false
  const alg = ALG_MAP[(algHeader || 'HMAC_SHA256_HEX').toUpperCase()]
  if (!alg) return false
  const secret = await getSecret('webhookSecret')
  if (!secret) return false // no secret configured ⇒ nothing can be trusted
  const expected = crypto.createHmac(alg, secret).update(rawBody).digest('hex')
  let a: Buffer
  let b: Buffer
  try {
    a = Buffer.from(expected, 'hex')
    b = Buffer.from(digestHeader, 'hex')
  } catch {
    return false
  }
  if (a.length === 0 || a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

/* ─────────────────────────── review → status mapping ────────────────────── */

export interface ReviewOutcome {
  status: VerificationStatus
  reason: string | null
}

/** Map a Sumsub webhook payload to our verification status. Never auto-approves on unknown events. */
export function mapReviewToStatus(payload: Record<string, unknown>): ReviewOutcome {
  const type = String(payload?.type ?? '')
  if (type === 'applicantReviewed') {
    const rr = (payload?.reviewResult ?? {}) as { reviewAnswer?: string; reviewRejectType?: string; moderationComment?: string; rejectLabels?: unknown }
    if (rr.reviewAnswer === 'GREEN') return { status: 'APPROVED', reason: null }
    const reason = rr.moderationComment || (Array.isArray(rr.rejectLabels) ? (rr.rejectLabels as string[]).join(', ') : null)
    return { status: rr.reviewRejectType === 'RETRY' ? 'RESUBMISSION' : 'REJECTED', reason: reason || null }
  }
  if (type === 'applicantReset' || type === 'applicantDeleted') return { status: 'NONE', reason: null }
  // applicantCreated / applicantPending / applicantOnHold / applicantActionPending / other
  return { status: 'PENDING', reason: null }
}
