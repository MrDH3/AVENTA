import 'server-only'
import { cookies, headers } from 'next/headers'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import type { Role, User } from '@prisma/client'
import { prisma } from './db'

const COOKIE = 'aventa_session'
const SESSION_TTL_DAYS = 30

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 12)
}
export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash)
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/** Create a DB-backed session and set the httpOnly cookie. Call from a route/action. */
export async function createSession(userId: string): Promise<void> {
  const token = crypto.randomBytes(32).toString('base64url')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 864e5)

  const h = headers()
  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent: h.get('user-agent')?.slice(0, 300) ?? null,
      ip: (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || null,
    },
  })

  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(COOKIE)?.value
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => {})
  }
  cookies().delete(COOKIE)
}

/** Resolve the current user from the session cookie, or null. Safe in server components. */
export async function getCurrentUser(): Promise<User | null> {
  const token = cookies().get(COOKIE)?.value
  if (!token) return null
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  })
  if (!session || session.expiresAt < new Date()) return null
  // An archived staff account is treated as logged-out everywhere (owner disabled it).
  if (session.user.archivedAt) return null
  return session.user
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) throw new AuthError('UNAUTHENTICATED')
  return user
}

export function isStaff(role: Role): boolean {
  return role === 'ADMIN' || role === 'OWNER'
}

export async function requireRole(...roles: Role[]): Promise<User> {
  const user = await requireUser()
  if (!roles.includes(user.role)) throw new AuthError('FORBIDDEN')
  return user
}

export async function requireStaff(): Promise<User> {
  return requireRole('ADMIN', 'OWNER')
}

/** Owner-only actions (managing admins, recovery contacts). */
export async function requireOwner(): Promise<User> {
  return requireRole('OWNER')
}

export class AuthError extends Error {
  constructor(public code: 'UNAUTHENTICATED' | 'FORBIDDEN') {
    super(code)
    this.name = 'AuthError'
  }
}
