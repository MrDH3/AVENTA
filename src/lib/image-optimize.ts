import sharp from 'sharp'

/**
 * Pure image-processing helpers for PUBLIC car marketing photos.
 *
 * Deliberately free of `server-only` so it can be reused by standalone seed
 * scripts (tsx) as well as server actions. It only transforms buffers — it does
 * NOT touch the filesystem, the DB, or the encrypted document store.
 */

// Card/list thumbnails and the full display image are both derived from the
// upload — we never serve the multi-MB original.
export const CAR_MAIN_MAX = 1600
export const CAR_THUMB_MAX = 640

/** Web-optimized display image: fit within 1600px, WebP q82. A 5 MB JPEG → ~120–250 KB. */
export async function toMainWebp(input: Buffer): Promise<Buffer> {
  return sharp(input, { failOn: 'none' })
    .rotate() // honour EXIF orientation, then strip metadata
    .resize(CAR_MAIN_MAX, CAR_MAIN_MAX, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer()
}

/** Small thumbnail for cards/admin list: fit within 640px, WebP q72 (~15–45 KB). */
export async function toThumbWebp(input: Buffer): Promise<Buffer> {
  return sharp(input, { failOn: 'none' })
    .rotate()
    .resize(CAR_THUMB_MAX, CAR_THUMB_MAX, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 72 })
    .toBuffer()
}

/** Derive the thumbnail storage key from a main-image key (`abc.webp` → `abc.t.webp`). */
export function thumbKeyFor(mainKey: string): string {
  return mainKey.replace(/\.webp$/i, '.t.webp')
}
