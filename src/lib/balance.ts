import 'server-only'
import { Prisma } from '@prisma/client'
import { prisma } from './db'
import { loadRates, BASE_CURRENCY } from './money'

/**
 * Recompute a booking's prepaid + outstanding balance from its confirmed payments.
 * Only received rental payments count (status PAID/PARTIAL, excluding DEPOSIT). Deposits
 * are tracked separately and don't reduce the rental balance.
 *
 * CURRENCY: a payment may be recorded in a different currency than the booking (e.g. a
 * crypto deposit in USDT against a EUR booking). We therefore convert every payment amount
 * INTO the booking currency before summing — never a bare cross-currency addition. Conversion
 * uses the payment's own stored fxRate when available (the rate at the time it was taken),
 * falling back to live rates by currency, then scales base→booking currency by the booking's
 * fxRate so the result is consistent with how `subtotal` itself was derived.
 */
export async function recomputeBookingBalance(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { subtotal: true, currency: true, fxRate: true },
  })
  if (!booking) return

  const payments = await prisma.payment.findMany({
    where: { bookingId, status: { in: ['PAID', 'PARTIAL'] }, kind: { not: 'DEPOSIT' } },
    select: { amount: true, currency: true, fxRate: true },
  })

  const rates = await loadRates()
  // base(EUR) → booking currency (keep consistent with subtotal = baseTotal * booking.fxRate)
  const bookingRate = Number(booking.fxRate) > 0 ? new Prisma.Decimal(booking.fxRate) : new Prisma.Decimal(rates[booking.currency] ?? 1)

  let prepaid = new Prisma.Decimal(0)
  for (const p of payments) {
    if (p.currency === booking.currency) {
      // same currency — no conversion
      prepaid = prepaid.add(p.amount)
      continue
    }
    // payment currency → base(EUR). Prefer the payment's stored fxRate (rate at capture time);
    // guard against the schema default of 1 wrongly applied to a non-base currency.
    const pf = Number(p.fxRate)
    const payRate =
      pf > 0 && !(pf === 1 && p.currency !== BASE_CURRENCY)
        ? new Prisma.Decimal(p.fxRate)
        : new Prisma.Decimal(rates[p.currency] ?? 1)
    const inBase = new Prisma.Decimal(p.amount).div(payRate)
    prepaid = prepaid.add(inBase.mul(bookingRate))
  }
  prepaid = prepaid.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)

  const balance = new Prisma.Decimal(booking.subtotal).sub(prepaid)

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      prepaidAmount: prepaid,
      balanceAmount: balance.lessThan(0) ? new Prisma.Decimal(0) : balance,
    },
  })
}
