'use server'

import crypto from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireOwner } from '@/lib/auth'
import { emailSchema } from '@/lib/validation'
import { logAudit } from '@/lib/audit'
import { sendEmail } from '@/lib/notify'
import { env } from '@/lib/env'

const hashToken = (t: string) => crypto.createHash('sha256').update(t).digest('hex')

/**
 * Owner-only staff & recovery management. Every action re-checks requireOwner() on the server,
 * so it can't be called by an admin even if the UI leaks. Admins are the only manageable target;
 * the owner account can never be archived, removed, or acted on by itself.
 */
export interface ActionResult {
  ok: boolean
  error?: string
  inviteLink?: string // set-password link returned by createAdmin (also emailed to the admin)
  invitedEmail?: string
}

export interface StaffRow {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: 'ADMIN' | 'OWNER'
  archived: boolean
  settingsAccess: boolean // may this admin open the sensitive Settings area (owner is always true)
  createdAt: string
}
export interface RecoveryRow {
  id: string
  email: string
  label: string | null
}

const norm = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v.trim() : '')

/** All staff (owner + admins), owner first then admins by creation. Owner-only. */
export async function listStaffAction(): Promise<StaffRow[]> {
  await requireOwner()
  const rows = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'OWNER'] } },
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, email: true, firstName: true, lastName: true, role: true, archivedAt: true, settingsAccess: true, createdAt: true },
  })
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    firstName: r.firstName,
    lastName: r.lastName,
    role: r.role as 'ADMIN' | 'OWNER',
    archived: !!r.archivedAt,
    settingsAccess: r.role === 'OWNER' || r.settingsAccess, // owner always has it
    createdAt: r.createdAt.toISOString(),
  }))
}

/**
 * Create a new admin and EMAIL them a "set your password" link (valid 3 days). The account has no
 * password until they use the link, so they can't sign in before setting one. The link is also
 * returned to the owner as a fallback (to share manually if email isn't configured yet).
 */
export async function createAdminAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireOwner()
  const email = emailSchema.safeParse(norm(formData.get('email')))
  if (!email.success) return { ok: false, error: 'Некорректный email' }
  if (await prisma.user.findUnique({ where: { email: email.data } })) {
    return { ok: false, error: 'Пользователь с таким email уже существует' }
  }
  const user = await prisma.user.create({
    data: {
      email: email.data,
      firstName: norm(formData.get('firstName')) || null,
      lastName: norm(formData.get('lastName')) || null,
      role: 'ADMIN',
      passwordHash: null, // set by the admin via the emailed link
    },
  })
  // Set-password invite = a reset token with a longer (3-day) window than an ordinary reset.
  const token = crypto.randomBytes(32).toString('base64url')
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 3 * 864e5) },
  })
  const link = `${env.appUrl}/auth?reset_token=${token}`
  await sendEmail({
    to: email.data,
    subject: 'AVENTA — вы добавлены как администратор',
    html: `<p>Вас добавили администратором в AVENTA. Задайте свой пароль по ссылке (действует 3 дня), после чего сможете войти:</p><p><a href="${link}">${link}</a></p><p>Если вы не ожидали этого письма — просто проигнорируйте его.</p>`,
    event: 'admin.invite',
  })
  await logAudit({ action: 'staff.admin.create', entity: 'User', entityId: user.id, meta: { email: user.email } })
  revalidatePath('/admin/team')
  return { ok: true, inviteLink: link, invitedEmail: email.data }
}

/** Archive (disable) an admin — login is refused, the record and history are kept. Owner-only. */
export async function archiveAdminAction(userId: string): Promise<ActionResult> {
  const owner = await requireOwner()
  if (userId === owner.id) return { ok: false, error: 'Нельзя архивировать себя' }
  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target || target.role !== 'ADMIN') return { ok: false, error: 'Архивировать можно только администратора' }
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { archivedAt: new Date() } }),
    prisma.session.deleteMany({ where: { userId } }), // log them out immediately
  ])
  await logAudit({ action: 'staff.admin.archive', entity: 'User', entityId: userId })
  revalidatePath('/admin/team')
  return { ok: true }
}

/** Restore an archived admin. Owner-only. */
export async function unarchiveAdminAction(userId: string): Promise<ActionResult> {
  await requireOwner()
  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target || target.role !== 'ADMIN') return { ok: false, error: 'Не администратор' }
  await prisma.user.update({ where: { id: userId }, data: { archivedAt: null } })
  await logAudit({ action: 'staff.admin.unarchive', entity: 'User', entityId: userId })
  revalidatePath('/admin/team')
  return { ok: true }
}

/** Permanently delete an admin (and their sessions/tokens/logs). Owner-only. */
export async function removeAdminAction(userId: string): Promise<ActionResult> {
  const owner = await requireOwner()
  if (userId === owner.id) return { ok: false, error: 'Нельзя удалить себя' }
  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target || target.role !== 'ADMIN') return { ok: false, error: 'Удалить можно только администратора' }
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId } }),
    prisma.passwordResetToken.deleteMany({ where: { userId } }),
    prisma.oAuthAccount.deleteMany({ where: { userId } }),
    prisma.auditLog.deleteMany({ where: { userId } }),
    prisma.recoveryEmail.deleteMany({ where: { userId } }),
    prisma.bookingDraft.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ])
  await logAudit({ action: 'staff.admin.remove', entity: 'User', entityId: userId, meta: { email: target.email } })
  revalidatePath('/admin/team')
  return { ok: true }
}

/**
 * Grant or revoke an admin's access to the sensitive Settings area (API keys, payment/insurance
 * config, locations, verification). Only the owner can flip this; the owner's own access is implicit
 * and can't be toggled. Revoking takes effect on the admin's next request (server-enforced).
 */
export async function setSettingsAccessAction(userId: string, allow: boolean): Promise<ActionResult> {
  const owner = await requireOwner()
  if (userId === owner.id) return { ok: false, error: 'Доступ владельца изменить нельзя' }
  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target || target.role !== 'ADMIN') return { ok: false, error: 'Доступ можно выдать только администратору' }
  await prisma.user.update({ where: { id: userId }, data: { settingsAccess: allow } })
  await logAudit({ action: allow ? 'staff.settings.grant' : 'staff.settings.revoke', entity: 'User', entityId: userId, meta: { email: target.email } })
  revalidatePath('/admin/team')
  return { ok: true }
}

// ── Recovery emails (owner account) ─────────────────────────────────────────
export async function listRecoveryEmailsAction(): Promise<RecoveryRow[]> {
  const owner = await requireOwner()
  const rows = await prisma.recoveryEmail.findMany({ where: { userId: owner.id }, orderBy: { createdAt: 'asc' } })
  return rows.map((r) => ({ id: r.id, email: r.email, label: r.label }))
}

/** Add a recovery email for the owner (max 2). Owner-only. */
export async function addRecoveryEmailAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const owner = await requireOwner()
  const email = emailSchema.safeParse(norm(formData.get('email')))
  if (!email.success) return { ok: false, error: 'Некорректный email' }
  if (email.data === owner.email) return { ok: false, error: 'Это адрес самого владельца' }
  if ((await prisma.recoveryEmail.count({ where: { userId: owner.id } })) >= 2) {
    return { ok: false, error: 'Максимум 2 адреса восстановления' }
  }
  const dup = await prisma.recoveryEmail.findUnique({ where: { userId_email: { userId: owner.id, email: email.data } } })
  if (dup) return { ok: false, error: 'Этот адрес уже добавлен' }
  await prisma.recoveryEmail.create({ data: { userId: owner.id, email: email.data, label: norm(formData.get('label')) || null } })
  await logAudit({ action: 'staff.recovery.add', meta: { email: email.data } })
  revalidatePath('/admin/team')
  return { ok: true }
}

/** Remove one of the owner's recovery emails. Owner-only. */
export async function removeRecoveryEmailAction(id: string): Promise<ActionResult> {
  const owner = await requireOwner()
  const row = await prisma.recoveryEmail.findUnique({ where: { id } })
  if (!row || row.userId !== owner.id) return { ok: false, error: 'Не найдено' }
  await prisma.recoveryEmail.delete({ where: { id } })
  await logAudit({ action: 'staff.recovery.remove', meta: { email: row.email } })
  revalidatePath('/admin/team')
  return { ok: true }
}
