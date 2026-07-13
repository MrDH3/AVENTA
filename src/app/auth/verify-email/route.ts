import { NextResponse, type NextRequest } from 'next/server'
import { verifyEmailToken } from '@/lib/email-verify'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * Redeem an email-confirmation link (GET so it works straight from the email client). Flips
 * emailVerified via the token, then bounces to the cabinet (logged in — the banner disappears) or the
 * login page (link opened on another device) with ?verified=<outcome> so the UI can acknowledge it.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? ''
  const result = await verifyEmailToken(token)
  const user = await getCurrentUser()
  const url = new URL(user ? '/account' : '/auth', req.url)
  url.searchParams.set('verified', result)
  return NextResponse.redirect(url)
}
