import 'server-only'
import { headers } from 'next/headers'

/**
 * Lightweight in-memory fixed-window rate limiter. Suitable for a single-node
 * deployment; swap for Redis/Upstash when scaling horizontally.
 */
type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

export function clientIp(): string {
  const h = headers()
  return (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'local'
}

export interface RateResult {
  ok: boolean
  remaining: number
  retryAfterSec: number
}

/** Allow `limit` actions per `windowSec` for a given key (e.g. `login:${ip}`). */
export function rateLimit(key: string, limit: number, windowSec: number): RateResult {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSec * 1000 })
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 }
  }
  b.count += 1
  if (b.count > limit) {
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) }
  }
  return { ok: true, remaining: limit - b.count, retryAfterSec: 0 }
}

// occasional cleanup
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k)
  }, 60_000).unref?.()
}
