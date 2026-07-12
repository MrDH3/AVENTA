import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { runDocumentRetention } from '@/lib/id-documents'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Scheduled retention sweep. Protected by a bearer secret (CRON_SECRET env). Point a
 * scheduler (cron / Vercel Cron / uptime pinger) at this URL to purge government-ID
 * documents past the retention period. Fail-closed: with no CRON_SECRET set, all
 * requests are denied.
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/document-retention
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false // not configured ⇒ deny everything
  const header = req.headers.get('authorization') || ''
  const provided = header.startsWith('Bearer ') ? header.slice(7) : new URL(req.url).searchParams.get('key') || ''
  const a = Buffer.from(provided)
  const b = Buffer.from(secret)
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b)
}

async function handle(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const res = await runDocumentRetention()
  return NextResponse.json({ ok: true, ...res })
}

export const GET = handle
export const POST = handle
