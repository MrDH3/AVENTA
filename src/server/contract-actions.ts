'use server'

import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { getCurrentUser, isStaff } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

/** Capture the client's drawn e-signature (PNG data URL) for a booking's contract. */
export async function signContractAction(
  bookingId: string,
  signatureData: string,
  signerName: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'Требуется вход' }
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
  if (!booking || (booking.userId !== user.id && !isStaff(user.role))) {
    return { ok: false, error: 'Нет доступа' }
  }
  if (!signatureData.startsWith('data:image/') || signatureData.length > 400_000) {
    return { ok: false, error: 'Некорректная подпись' }
  }
  const h = headers()
  await prisma.contractSignature.upsert({
    where: { bookingId },
    update: { signatureData, signerName: signerName.slice(0, 120) },
    create: {
      bookingId,
      signerName: signerName.slice(0, 120) || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
      signatureData,
      ip: (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || null,
      userAgent: h.get('user-agent')?.slice(0, 300) ?? null,
    },
  })
  await logAudit({ userId: user.id, action: 'contract.sign', entity: 'Booking', entityId: bookingId })
  return { ok: true }
}
