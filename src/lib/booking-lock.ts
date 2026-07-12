import 'server-only'
import type { Prisma } from '@prisma/client'

/**
 * Take a row-level lock on a single Booking (Postgres SELECT … FOR UPDATE) inside an interactive
 * transaction. Any two transactions that lock the SAME booking are serialized: the second blocks
 * until the first commits/rolls back.
 *
 * This is the shared primitive that makes the reservation-timeout sweep atomic against a concurrent
 * payment confirmation. The sweep locks the booking, then re-checks "still an unconfirmed hold?"; the
 * confirm paths (setPaymentStatus / recordPayment mark a payment PAID) lock the same booking before
 * writing — so a confirm that commits first is always seen, and a confirmed hold is never expired.
 */
export async function lockBookingRow(tx: Prisma.TransactionClient, bookingId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM "Booking" WHERE id = ${bookingId} FOR UPDATE`
}
