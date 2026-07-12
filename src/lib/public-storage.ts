import 'server-only'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { toMainWebp, toThumbWebp, thumbKeyFor } from '@/lib/image-optimize'

/**
 * PUBLIC image storage for car marketing photos. Plain (unencrypted) files under
 * `public/uploads/cars/`, served directly by Next's static handler.
 *
 * ⚠️ This is deliberately SEPARATE from the encrypted document store
 * (`lib/crypto-storage.ts` → `./.storage`, served only via the auth-gated
 * `/api/documents/[id]` route). Sensitive documents (passports/licences/payment
 * proofs) must NEVER be written here, and car photos must never go into `.storage`.
 */

const REL_DIR = 'public/uploads/cars'
export const CAR_URL_PREFIX = '/uploads/cars'

/** Public URL for a stored car image key (full display image). */
export function carPhotoUrl(storageKey: string): string {
  if (/^https?:\/\//i.test(storageKey)) return storageKey
  return `${CAR_URL_PREFIX}/${storageKey}`
}

/**
 * Public URL for the small thumbnail rendition — use on cards/lists so the
 * catalog stays fast. Falls back to the full image for external URLs or any
 * non-WebP key (e.g. legacy files that have no separate thumbnail).
 */
export function carThumbUrl(storageKey: string): string {
  if (/^https?:\/\//i.test(storageKey)) return storageKey
  if (!/\.webp$/i.test(storageKey)) return carPhotoUrl(storageKey)
  return `${CAR_URL_PREFIX}/${thumbKeyFor(storageKey)}`
}

function carsDir(): string {
  return path.resolve(process.cwd(), REL_DIR)
}

/**
 * Optimise an uploaded image and persist two renditions (full + thumbnail) as
 * WebP. Returns the MAIN storage key; the thumbnail key is derived from it via
 * `thumbKeyFor`. The original bytes are never written to disk.
 */
export async function saveOptimizedCarImage(input: Buffer): Promise<string> {
  const base = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}`
  const mainKey = `${base}.webp`
  const dir = carsDir()
  await fs.mkdir(dir, { recursive: true })
  const [main, thumb] = await Promise.all([toMainWebp(input), toThumbWebp(input)])
  await Promise.all([
    fs.writeFile(path.join(dir, mainKey), main),
    fs.writeFile(path.join(dir, thumbKeyFor(mainKey)), thumb),
  ])
  return mainKey
}

/** Raw (unoptimised) write — kept for callers that persist already-processed bytes. */
export async function savePublicCarImage(bytes: Buffer, ext: string): Promise<string> {
  const safeExt = (ext || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg'
  const key = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}.${safeExt}`
  const dir = carsDir()
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, key), bytes)
  return key
}

/** Delete a stored image and its derived thumbnail (if any). */
export async function deletePublicCarImage(storageKey: string): Promise<void> {
  if (storageKey.includes('..') || storageKey.includes('/') || storageKey.includes('\\')) return
  const dir = carsDir()
  await fs.rm(path.join(dir, storageKey), { force: true }).catch(() => {})
  if (/\.webp$/i.test(storageKey)) {
    await fs.rm(path.join(dir, thumbKeyFor(storageKey)), { force: true }).catch(() => {})
  }
}
