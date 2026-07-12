import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, isStaff } from '@/lib/auth'
import { readDecrypted } from '@/lib/crypto-storage'
import { logAudit } from '@/lib/audit'

/**
 * Access-gated document download. Decrypts in memory and streams to the browser.
 * ONLY the document owner or staff (ADMIN/OWNER) may fetch it. The encrypted
 * bytes under STORAGE_DIR are never served statically.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const doc = await prisma.document.findUnique({ where: { id: params.id } })
  if (!doc) return new NextResponse('Not found', { status: 404 })

  const allowed = doc.userId === user.id || isStaff(user.role)
  if (!allowed) {
    await logAudit({ userId: user.id, action: 'document.access.denied', entity: 'Document', entityId: doc.id })
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const bytes = await readDecrypted(doc.storageKey, doc.iv, doc.authTag)
    await logAudit({ userId: user.id, action: 'document.access', entity: 'Document', entityId: doc.id })
    return new NextResponse(bytes as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': doc.mime,
        'Content-Disposition': `inline; filename="${encodeURIComponent(doc.filename)}"`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new NextResponse('Unable to read document', { status: 500 })
  }
}
