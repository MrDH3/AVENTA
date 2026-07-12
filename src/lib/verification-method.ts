import 'server-only'
import { prisma } from './db'

/**
 * Pluggable identity-verification method (like the payment-provider pattern). The
 * ACTIVE method decides how a customer becomes verified; the booking gate always asks
 * the same method-agnostic question — "is this customer verified?" — answered by
 * lib/verification `verificationState` (profile status + non-expired docs), regardless
 * of which method produced the approval.
 *
 * Add a provider (Veriff / Onfido / iDenfy …) by adding one entry here + its Step-3 UI
 * and (for automated ones) its webhook — the gate and reuse logic do not change.
 */
export type VerificationMethod = 'MANUAL' | 'SUMSUB'

export interface VerificationMethodDef {
  key: VerificationMethod
  label: string
  /** Whether a booking requires verification under this method. */
  requiresVerification: boolean
  /** Automated (provider webhook approves) vs manual (staff approves). */
  automated: boolean
}

export const VERIFICATION_METHODS: Record<VerificationMethod, VerificationMethodDef> = {
  MANUAL: { key: 'MANUAL', label: 'Ручная проверка (админ)', requiresVerification: true, automated: false },
  SUMSUB: { key: 'SUMSUB', label: 'Sumsub (авто-KYC)', requiresVerification: true, automated: true },
}
export const VERIFICATION_METHOD_KEYS = Object.keys(VERIFICATION_METHODS) as VerificationMethod[]

const KEY = 'verification_method'

/** The active verification method (default MANUAL). */
export async function getVerificationMethod(): Promise<VerificationMethod> {
  const s = await prisma.setting.findUnique({ where: { key: KEY } })
  const v = s?.value
  return v === 'SUMSUB' || v === 'MANUAL' ? v : 'MANUAL'
}

export async function setVerificationMethod(method: string): Promise<void> {
  const m: VerificationMethod = method === 'SUMSUB' ? 'SUMSUB' : 'MANUAL'
  await prisma.setting.upsert({
    where: { key: KEY },
    update: { value: m, group: 'verification' },
    create: { key: KEY, value: m, group: 'verification' },
  })
}

/** Does a booking require the customer to be verified under the active method? */
export async function verificationRequired(): Promise<boolean> {
  return VERIFICATION_METHODS[await getVerificationMethod()].requiresVerification
}
