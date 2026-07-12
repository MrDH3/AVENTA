'use server'

import { headers, cookies } from 'next/headers'
import type { TripGoal } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { listAvailableCars } from '@/lib/availability'
import { logAudit } from '@/lib/audit'
import { LEGAL_VERSION } from '@/lib/legal'

/** "Show all free cars for my dates" — returns available car slugs for a range. */
export async function searchAvailabilityAction(
  startISO: string,
  endISO: string,
): Promise<{ ok: boolean; availableSlugs?: string[]; error?: string }> {
  const start = new Date(startISO)
  const end = new Date(endISO)
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || !(start < end)) {
    return { ok: false, error: 'Некорректные даты' }
  }
  const ids = await listAvailableCars(start, end)
  const cars = await prisma.car.findMany({ where: { id: { in: ids } }, select: { slug: true } })
  return { ok: true, availableSlugs: cars.map((c) => c.slug) }
}

/** Persist a smart-services questionnaire result to CRM (attached to the user if logged in). */
export async function saveSmartResponseAction(
  tripGoal: TripGoal,
  needs: string[],
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser()
  await prisma.smartServiceResponse.create({
    data: { userId: user?.id ?? null, tripGoal, needs: needs.slice(0, 40) },
  })
  await logAudit({ userId: user?.id, action: 'smart.response', meta: { tripGoal, needs } })
  return { ok: true }
}

/** Record a consent event (cookie banner / consent modal). */
export async function recordConsentAction(
  types: string[],
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser()
  const h = headers()
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || null
  const ua = h.get('user-agent')?.slice(0, 300) ?? null
  await prisma.consentRecord.createMany({
    data: types.map((type) => ({ userId: user?.id ?? null, type, version: LEGAL_VERSION, ip, userAgent: ua })),
  })
  cookies().set('aventa_consent', '1', { path: '/', maxAge: 31536000, sameSite: 'lax' })
  return { ok: true }
}

/** Persist language choice to a server-readable cookie. */
export async function setLangAction(lang: string): Promise<void> {
  const safe = ['ru', 'en', 'tr', 'es', 'de'].includes(lang) ? lang : 'en'
  cookies().set('aventa_lang', safe, { path: '/', maxAge: 31536000, sameSite: 'lax' })
}
