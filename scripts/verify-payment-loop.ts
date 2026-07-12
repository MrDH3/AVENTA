/** Verifies the payment loop's data logic against a real booking, then restores it. */
import { PrismaClient, Prisma } from '@prisma/client'
const prisma = new PrismaClient()

// mirrors src/lib/balance.ts recomputeBookingBalance
async function recompute(bookingId: string) {
  const b = await prisma.booking.findUnique({ where: { id: bookingId }, select: { subtotal: true } })
  if (!b) return
  const rec = await prisma.payment.aggregate({
    where: { bookingId, status: { in: ['PAID', 'PARTIAL'] }, kind: { not: 'DEPOSIT' } },
    _sum: { amount: true },
  })
  const prepaid = new Prisma.Decimal(rec._sum.amount ?? 0)
  const bal = new Prisma.Decimal(b.subtotal).sub(prepaid)
  await prisma.booking.update({
    where: { id: bookingId },
    data: { prepaidAmount: prepaid, balanceAmount: bal.lessThan(0) ? new Prisma.Decimal(0) : bal },
  })
}

async function snap(id: string) {
  const b = await prisma.booking.findUnique({ where: { id } })
  return { status: b!.status, balance: String(b!.balanceAmount), prepaid: String(b!.prepaidAmount) }
}

async function main() {
  const bk = await prisma.booking.findUnique({ where: { number: 'AVN-2026-0042' } })
  if (!bk) throw new Error('demo booking AVN-2026-0042 not found')
  const orig = { status: bk.status, balance: bk.balanceAmount, prepaid: bk.prepaidAmount }
  console.log('0) initial          :', { subtotal: String(bk.subtotal), currency: bk.currency, ...(await snap(bk.id)) })

  // 1) client submits crypto payment (submitManualPaymentAction effect) → AWAITING
  const pay = await prisma.payment.create({
    data: { bookingId: bk.id, method: 'CRYPTO', kind: 'FULL', currency: 'USDT', amount: 648, status: 'AWAITING', txHash: 'TEST-TX-HASH-abc123', cryptoNetwork: 'TRC20' },
  })
  await prisma.booking.update({ where: { id: bk.id }, data: { status: 'AWAITING_PAYMENT' } })
  await recompute(bk.id)
  console.log('1) client submitted :', await snap(bk.id), '(AWAITING → balance unchanged)')

  // 2) admin confirms (setPaymentStatus PAID) → recompute + status bump
  await prisma.payment.update({ where: { id: pay.id }, data: { status: 'PAID' } })
  await recompute(bk.id)
  let after = await snap(bk.id)
  if (Number(after.balance) <= 0 && ['AWAITING_PAYMENT', 'NEW', 'AWAITING_CONFIRMATION'].includes(after.status)) {
    await prisma.booking.update({ where: { id: bk.id }, data: { status: 'CONFIRMED' } })
  }
  console.log('2) admin confirmed  :', await snap(bk.id), '(PAID → balance 0, CONFIRMED)')

  // restore demo data
  await prisma.payment.delete({ where: { id: pay.id } })
  await prisma.booking.update({ where: { id: bk.id }, data: { status: orig.status, balanceAmount: orig.balance, prepaidAmount: orig.prepaid } })
  console.log('3) restored         :', await snap(bk.id))
}
main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
