/**
 * Validate a caller-supplied return path (a `next` / `back` redirect target).
 *
 * Returns the path only if it is unambiguously a SAME-ORIGIN absolute path; otherwise null.
 * A naive `startsWith('/') && !startsWith('//')` check is NOT enough: the WHATWG URL parser
 * (used by Next's `redirect()` and `router.push()`) folds backslashes to slashes, so a value
 * like `/\evil.com` would resolve to the protocol-relative `//evil.com` → an external origin.
 * We therefore also reject backslashes and control characters, closing the open-redirect gap.
 */
export function safeInternalPath(v: string | null | undefined): string | null {
  if (!v || typeof v !== 'string') return null
  if (!v.startsWith('/') || v.startsWith('//')) return null // must be a rooted path, not protocol-relative
  if (/[\\\x00-\x1f\x7f]/.test(v)) return null // backslashes (folded to '/') or control chars → reject
  return v.slice(0, 512)
}
