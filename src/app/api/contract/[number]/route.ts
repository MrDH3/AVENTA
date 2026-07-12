import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, isStaff } from '@/lib/auth'
import { generateContractPdf } from '@/lib/contract-pdf'
import { logAudit } from '@/lib/audit'

/** Access-gated rental-contract PDF. Owner or staff only. */
export async function GET(_req: Request, { params }: { params: { number: string } }) {
  const user = await getCurrentUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const booking = await prisma.booking.findUnique({
    where: { number: params.number },
    include: { car: true, user: true, extras: true, insurance: true, contractSignature: true },
  })
  if (!booking) return new NextResponse('Not found', { status: 404 })
  if (booking.userId !== user.id && !isStaff(user.role)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const sig = booking.contractSignature
      ? { data: booking.contractSignature.signatureData, name: booking.contractSignature.signerName }
      : null
    const bytes = await generateContractPdf(booking, sig)
    await logAudit({ userId: user.id, action: 'contract.download', entity: 'Booking', entityId: booking.id })
    return new NextResponse(bytes as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="AVENTA-${booking.number}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (e) {
    return new NextResponse('Unable to generate contract: ' + String(e), { status: 500 })
  }
}
