import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyWebhookSignature, mapReviewToStatus, getApplicantDocExpiries } from '@/lib/sumsub'
import { storeVerifiedDocuments } from '@/lib/id-documents'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'
// We need the RAW body bytes for the HMAC — never let a framework re-serialize it.
export const runtime = 'nodejs'

/**
 * Sumsub verification webhook.
 *
 * SECURITY (load-bearing): every request is authenticated ONLY by its HMAC signature
 * (x-payload-digest, verified with our encrypted webhook secret). An unsigned or
 * wrongly-signed request is rejected with 401 BEFORE the body is parsed or trusted —
 * otherwise anyone who finds this URL could forge an "approved" result and bypass ID
 * verification entirely. There is no other auth here by design (Sumsub calls it).
 */
export async function POST(req: Request) {
  const raw = Buffer.from(await req.arrayBuffer())
  const digest = req.headers.get('x-payload-digest')
  const alg = req.headers.get('x-payload-digest-alg')

  const valid = await verifyWebhookSignature(raw, digest, alg)
  if (!valid) {
    // Do NOT parse or act on the body. Reject.
    await logAudit({ action: 'sumsub.webhook.rejected', entity: 'SumsubConfig', entityId: 'default', meta: { reason: 'bad_signature', hasDigest: Boolean(digest) } }).catch(() => {})
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  // Signature verified — now it is safe to parse & trust the event.
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(raw.toString('utf8'))
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 })
  }

  const externalUserId = typeof payload.externalUserId === 'string' ? payload.externalUserId : null
  const applicantId = typeof payload.applicantId === 'string' ? payload.applicantId : null
  if (!externalUserId) return NextResponse.json({ ok: true, note: 'no externalUserId' })

  const outcome = mapReviewToStatus(payload)

  // Base update: status + applicant id + reason.
  const data: Record<string, unknown> = {
    verificationStatus: outcome.status,
    verificationReason: outcome.reason,
    ...(applicantId ? { sumsubApplicantId: applicantId } : {}),
  }

  if (outcome.status === 'APPROVED') {
    data.verifiedAt = new Date()
    // Fetch document EXPIRY metadata (not images) for the expiry-aware reuse check.
    if (applicantId) {
      try {
        const exp = await getApplicantDocExpiries(applicantId)
        // Only overwrite when we actually got a value — never null out a known expiry.
        if (exp.passportExpiry) data.passportExpiry = exp.passportExpiry
        if (exp.licenseExpiry) data.licenseExpiry = exp.licenseExpiry
      } catch {
        /* expiry fetch failed — status stays APPROVED; expiry may remain unknown */
      }
    }
  }

  // updateMany = no throw if the profile doesn't exist yet.
  const res = await prisma.clientProfile.updateMany({ where: { userId: externalUserId }, data })

  // On approval, pull the verified ID images into the ENCRYPTED store (best-effort — a
  // retrieval/storage failure must not fail the webhook or cause Sumsub to retry forever).
  // Bytes flow Sumsub API → saveEncrypted only; they never touch public storage or logs.
  if (outcome.status === 'APPROVED' && applicantId) {
    try {
      await storeVerifiedDocuments(externalUserId, applicantId)
    } catch {
      /* image retrieval/storage failed — verification stands; images can be re-pulled later */
    }
  }

  await logAudit({
    userId: externalUserId,
    action: 'sumsub.webhook.processed',
    entity: 'ClientProfile',
    entityId: externalUserId,
    meta: { type: String(payload.type ?? ''), status: outcome.status, applied: res.count },
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
