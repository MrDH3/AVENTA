import 'server-only'
import { headers } from 'next/headers'
import { prisma } from './db'

export async function logAudit(input: {
  userId?: string | null
  action: string
  entity?: string
  entityId?: string
  meta?: Record<string, unknown>
}): Promise<void> {
  try {
    const ip = (headers().get('x-forwarded-for') ?? '').split(',')[0].trim() || null
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        meta: input.meta as object | undefined,
        ip,
      },
    })
  } catch {
    // auditing must never break the request
  }
}
