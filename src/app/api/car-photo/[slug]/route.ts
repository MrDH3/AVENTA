import { NextResponse } from 'next/server'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { prisma } from '@/lib/db'

/**
 * Stable per-car cover image URL. Resolves the car's current cover photo and
 * STREAMS the bytes directly (public — car marketing images are not sensitive;
 * sensitive documents are served only by the auth-gated /api/documents/[id]).
 *
 * We stream rather than 302-redirect to the static file because a redirect's
 * relative Location gets absolutised against X-Forwarded-Proto behind the dev
 * proxy (→ https on an http-only server → SSL error). Streaming has no second
 * hop, so it works on any host/port/proto. `?size=thumb` serves the small
 * rendition for cards/lists.
 */
export const dynamic = 'force-dynamic'

const CONTENT_TYPE: Record<string, string> = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
}

const carsDir = () => path.resolve(process.cwd(), 'public/uploads/cars')

async function readCarImage(key: string): Promise<Buffer | null> {
  if (!key || key.includes('..') || key.includes('/') || key.includes('\\')) return null
  return fs.readFile(path.join(carsDir(), key)).catch(() => null)
}

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const car = await prisma.car.findUnique({
    where: { slug: params.slug },
    select: { photos: { where: { isCover: true }, take: 1 } },
  })
  const cover = car?.photos[0]
  if (!cover) return new NextResponse('No cover', { status: 404 })

  // External cover → redirect to its own absolute URL.
  if (cover.isExternal) return NextResponse.redirect(cover.storageKey, 302)

  const mainKey = cover.storageKey
  const wantThumb = new URL(req.url).searchParams.get('size') === 'thumb'
  const key = wantThumb && /\.webp$/i.test(mainKey) ? mainKey.replace(/\.webp$/i, '.t.webp') : mainKey

  let data = await readCarImage(key)
  if (!data && key !== mainKey) data = await readCarImage(mainKey) // thumb missing → full image
  if (!data) return new NextResponse('Not found', { status: 404 })

  const ext = (key.split('.').pop() || 'webp').toLowerCase()
  return new NextResponse(new Uint8Array(data), {
    headers: {
      'Content-Type': CONTENT_TYPE[ext] ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
