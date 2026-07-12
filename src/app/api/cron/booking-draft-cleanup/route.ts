import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { runBookingDraftCleanup } from '@/lib/booking-draft'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Scheduled cleanup of abandoned booking DRAFTS (half-filled forms past their 24h window). Protected
 * by a bearer secret (CRON_SECRET env), fail-closed. This is SEPARATE from the reservation-hold
 * timeout (/api/cron/reservation-timeout), which cancels created manual bookings and releases their
 * held cars — this one only removes stale draft form data, no booking/car is involved.
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/booking-draft-cleanup
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
  const res = await runBookingDraftCleanup()
  return NextResponse.json({ ok: true, ...res })
}

export const GET = handle
export const POST = handle
