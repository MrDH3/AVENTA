import 'server-only'
import { Prisma } from '@prisma/client'
import { prisma } from './db'

/**
 * Append-only, immutable audit trail for the finance module. Every create/edit/archive/confirm of a
 * financial record writes one row here, server-side, automatically — a user can't forge or suppress
 * it. Nothing in the app ever UPDATEs or DELETEs a FinanceAudit row: the trail is write-only, which
 * is exactly what makes the editable finance records (expenses, opening balances, …) trustworthy.
 */

export interface AuditChange {
  field: string
  from: string | null
  to: string | null
}

export function staffName(u: { firstName: string | null; lastName: string | null; email: string }): string {
  return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email
}

/** Append one immutable audit entry. */
export async function writeFinanceAudit(input: {
  entityType: string
  entityId: string
  action: string
  changes?: AuditChange[]
  reason?: string | null
  staff: { id: string; firstName: string | null; lastName: string | null; email: string }
}): Promise<void> {
  await prisma.financeAudit.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      changes: input.changes && input.changes.length ? (input.changes as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
      reason: input.reason?.slice(0, 500) || null,
      byUserId: input.staff.id,
      byName: staffName(input.staff),
    },
  })
}

/** Field-by-field diff of two snapshots → change-set (only changed fields). Values stringified. */
export function diffFields(before: Record<string, unknown>, after: Record<string, unknown>, fields: string[]): AuditChange[] {
  const norm = (v: unknown) => (v == null || v === '' ? null : String(v))
  const changes: AuditChange[] = []
  for (const f of fields) {
    const a = norm(before[f])
    const b = norm(after[f])
    if (a !== b) changes.push({ field: f, from: a, to: b })
  }
  return changes
}

export interface AuditRow {
  id: string
  entityType: string
  entityId: string
  action: string
  changes: AuditChange[]
  reason: string | null
  byName: string | null
  createdAt: string
}

function toRow(r: { id: string; entityType: string; entityId: string; action: string; changes: unknown; reason: string | null; byName: string | null; createdAt: Date }): AuditRow {
  return {
    id: r.id,
    entityType: r.entityType,
    entityId: r.entityId,
    action: r.action,
    changes: Array.isArray(r.changes) ? (r.changes as AuditChange[]) : [],
    reason: r.reason,
    byName: r.byName,
    createdAt: r.createdAt.toISOString(),
  }
}

/** Full history for one record (newest first). */
export async function getRecordAudit(entityType: string, entityId: string): Promise<AuditRow[]> {
  const rows = await prisma.financeAudit.findMany({ where: { entityType, entityId }, orderBy: { createdAt: 'desc' } })
  return rows.map(toRow)
}

/** The overall finance audit log (newest first). */
export async function getFinanceAuditLog(limit = 200): Promise<AuditRow[]> {
  const rows = await prisma.financeAudit.findMany({ orderBy: { createdAt: 'desc' }, take: limit })
  return rows.map(toRow)
}
