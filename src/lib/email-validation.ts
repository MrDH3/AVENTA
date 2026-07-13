import 'server-only'
import { promises as dns } from 'node:dns'

/**
 * Reject throwaway / temporary email providers at sign-up. This is a curated set of the most common
 * disposable-mail domains — not exhaustive (there are thousands), but it stops the casual "temp-mail"
 * signups the owner asked about. Extend freely; matching is exact on the lowercased domain.
 */
const DISPOSABLE_DOMAINS = new Set<string>([
  '10minutemail.com', '20minutemail.com', '1secmail.com', '33mail.com',
  'anonbox.net', 'burnermail.io', 'dispostable.com', 'discard.email',
  'emailondeck.com', 'etempmail.com', 'fakeinbox.com', 'fakemail.net',
  'getairmail.com', 'getnada.com', 'grr.la', 'guerrillamail.com',
  'guerrillamail.info', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamailblock.com',
  'inboxkitten.com', 'jetable.org', 'luxusmail.org', 'mailcatch.com',
  'maildrop.cc', 'mailexpire.com', 'mailinator.com', 'mailnesia.com',
  'mailtemp.net', 'minuteinbox.com', 'moakt.com', 'mohmal.com',
  'mvrht.com', 'mytemp.email', 'nada.email', 'pokemail.net',
  'sharklasers.com', 'spam4.me', 'spambog.com', 'spamgourmet.com',
  'temp-mail.io', 'temp-mail.org', 'tempinbox.com', 'tempmail.com',
  'tempmailo.com', 'tempmail.net', 'tempr.email', 'throwawaymail.com',
  'tmpmail.net', 'tmpmail.org', 'trashmail.com', 'trashmail.de',
  'yopmail.com', 'yopmail.fr', 'yopmail.net', 'mailsac.com',
  'tempail.com', 'mail-temp.com', 'wegwerfmail.de', 'trbvm.com',
  'byom.de', 'einrot.com', 'fleckens.hu', 'gustr.com',
])

function domainOf(email: string): string | null {
  const at = email.lastIndexOf('@')
  if (at < 0) return null
  const domain = email.slice(at + 1).trim().toLowerCase()
  return domain || null
}

/** True when the address uses a known throwaway / temporary-mail provider. */
export function isDisposableEmail(email: string): boolean {
  const domain = domainOf(email)
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false
}

async function recordState(domain: string, type: 'MX' | 'A'): Promise<'yes' | 'no' | 'error'> {
  try {
    const recs = type === 'MX' ? await dns.resolveMx(domain) : await dns.resolve(domain)
    return recs.length > 0 ? 'yes' : 'no'
  } catch (e) {
    const code = (e as NodeJS.ErrnoException)?.code
    // Domain definitively has no such records → treat as "no". Any other (transient) failure → "error".
    if (code === 'ENOTFOUND' || code === 'ENODATA' || code === 'NXDOMAIN') return 'no'
    return 'error'
  }
}

/**
 * Best-effort deliverability check: can this address's domain actually receive mail? Returns true when
 * it looks deliverable (has MX, or an A record for implicit RFC-5321 delivery) and false ONLY when the
 * domain definitively has neither. Fails OPEN on transient DNS errors and on a 4s timeout, so a DNS
 * hiccup never blocks a legitimate signup — the goal is to catch typos / dead domains, not gate on DNS.
 */
export async function domainCanReceiveMail(email: string): Promise<boolean> {
  const domain = domainOf(email)
  if (!domain) return false

  const check = (async (): Promise<boolean> => {
    const mx = await recordState(domain, 'MX')
    if (mx === 'yes') return true
    if (mx === 'error') return true // transient DNS problem → don't block a real user
    const a = await recordState(domain, 'A') // no MX: some domains accept mail on the A record
    return a === 'yes' || a === 'error'
  })()

  const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 4000))
  return Promise.race([check, timeout])
}
