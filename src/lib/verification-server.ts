import 'server-only'
import { prisma } from './db'
import { getVerificationMethod } from './verification-method'
import { verificationState, deriveVerification, REQUIRED_DOC_TYPES, type DerivedVerification } from './verification'

/** The customer's CURRENT (non-superseded) required documents — one active attempt per type. */
export function getCurrentRequiredDocs(userId: string) {
  return prisma.document.findMany({
    where: { userId, type: { in: [...REQUIRED_DOC_TYPES] }, supersededAt: null },
    select: { id: true, type: true, status: true, expiresAt: true, rejectionReason: true, uploadedAt: true },
    orderBy: { uploadedAt: 'desc' },
  })
}

/**
 * The SINGLE authority for "is this customer verified enough to complete a booking?".
 * Every gate/reader must go through here — there is no customer-level status short-circuit.
 *
 * - MANUAL method → DERIVED per-document: all required current docs APPROVED and not expired.
 * - SUMSUB method → the applicant-level verificationState (Sumsub decides the whole applicant at once).
 */
export async function getVerificationForUser(userId: string): Promise<DerivedVerification & { method: string }> {
  const method = await getVerificationMethod()
  if (method === 'SUMSUB') {
    const vp = await prisma.clientProfile.findUnique({ where: { userId } })
    const vs = verificationState(vp)
    return {
      method,
      verified: vs.valid,
      anySubmitted: vs.status !== 'NONE',
      anyPending: vs.status === 'PENDING',
      anyRejected: vs.status === 'REJECTED',
      anyExpired: vs.passportExpired || vs.licenseExpired,
      docs: [],
    }
  }
  const docs = await getCurrentRequiredDocs(userId)
  return { method, ...deriveVerification(docs) }
}
