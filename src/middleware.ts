import { NextResponse, type NextRequest } from 'next/server'

/**
 * Edge middleware: sets a Content-Security-Policy and other headers on every
 * response, and applies a cheap "has session cookie" gate to protected areas
 * (the pages themselves do the authoritative DB + role check).
 */

const PROTECTED = ['/account', '/admin', '/crm', '/calendar', '/notifications']

function csp(): string {
  return [
    "default-src 'self'",
    // ACCEPTED KNOWN RISK: script-src keeps 'unsafe-inline' + 'unsafe-eval'.
    // Why not tightened to nonces here: Next.js (App Router) injects inline hydration/runtime
    // scripts, and this codebase styles almost everything inline; a nonce migration must thread a
    // fresh per-request nonce through the whole app/document and any un-nonced inline script silently
    // breaks the page. That is a larger, separately-tracked change, deliberately NOT attempted here to
    // avoid breaking Stripe.js / the app. Residual XSS exposure is bounded: there are no
    // dangerouslySetInnerHTML sinks, and the one raw-HTML path (Leaflet/Google/Yandex map popups) is
    // HTML-escaped at the source (see lib/escape-html.ts). Revisit with nonces when feasible.
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://api.qrserver.com https://*.tile.openstreetmap.org https://*.openstreetmap.org",
    "connect-src 'self' https://api.stripe.com",
    "frame-src 'self' https://www.openstreetmap.org https://js.stripe.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ].join('; ')
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Lightweight auth gate (authoritative check happens in the page/server action)
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    const hasSession = req.cookies.has('aventa_session')
    if (!hasSession) {
      const url = req.nextUrl.clone()
      url.pathname = '/auth'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  }

  const res = NextResponse.next()
  // CSP is set here (route-aware). Note: the STATIC baseline security headers — including
  // Strict-Transport-Security (HSTS: max-age 2y + includeSubDomains + preload), X-Frame-Options,
  // Permissions-Policy, Referrer-Policy and X-Content-Type-Options — are already set for every route
  // in next.config.mjs `headers()`. So HSTS is in place app-wide (and a TLS proxy may add it too);
  // it is deliberately NOT re-set here.
  res.headers.set('Content-Security-Policy', csp())
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return res
}

export const config = {
  // Run on all paths except static assets and the favicon.
  matcher: ['/((?!_next/static|_next/image|favicon.svg|assets/).*)'],
}
