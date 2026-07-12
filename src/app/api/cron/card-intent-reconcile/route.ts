import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { reconcileOrphanedCardDeposits } from '@/lib/card-reconcile'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Scheduled reconciliation of stranded CARD DEPOSITS: refunds any Stripe deposit intent that was captured
 * but never became a booking (3-D Secure redirect stranded the tab, session lost, async-settled charge,
 * client crash). Protected by a bearer secret (CRON_SECRET env), fail-closed. This is the money-safety
 * backstop for the pay-before-create card flow — SEPARATE from the reservation-hold timeout
 * (/api/cron/reservation-timeout) and the booking-draft cleanup (/api/cron/booking-draft-cleanup);
 * neither of those touches a Stripe charge.
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/card-intent-reconcile
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = req.headers.get('authorization') || ''
  const provided = header.startsWith('Bearer ') ? header.slice(7) : new URL(req.url).searchParams.get('key') || ''
  const a = Buffer.from(provided)
  const b = Buffer.from(secret)
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b)
}

async function handle(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const res = await reconcileOrphanedCardDeposits()
  return NextResponse.json({ ok: true, ...res })
}

export const GET = handle
export const POST = handle
