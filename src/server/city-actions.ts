'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireSettingsAccess } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export interface CityActionResult {
  ok: boolean
  error?: string
}

function revalidate() {
  revalidatePath('/admin/settings/locations')
  revalidatePath('/booking')
}

/** Add a city (admin/owner). New city goes to the end of the order. */
export async function createCityAction(input: { name: string; country?: string }): Promise<CityActionResult> {
  const staff = await requireSettingsAccess()
  const name = input.name.trim()
  if (!name) return { ok: false, error: 'Введите название города' }
  const country = (input.country ?? '').trim() || 'Türkiye'
  const last = await prisma.city.findFirst({ orderBy: { order: 'desc' }, select: { order: true } })
  const city = await prisma.city.create({ data: { name, country, enabled: true, order: (last?.order ?? -1) + 1 } })
  await logAudit({ userId: staff.id, action: 'city.create', entity: 'City', entityId: city.id, meta: { name, country } })
  revalidate()
  return { ok: true }
}

/** Edit a city's name/country. */
export async function updateCityAction(input: { id: string; name: string; country?: string }): Promise<CityActionResult> {
  const staff = await requireSettingsAccess()
  const name = input.name.trim()
  if (!name) return { ok: false, error: 'Введите название города' }
  const country = (input.country ?? '').trim() || 'Türkiye'
  await prisma.city.update({ where: { id: input.id }, data: { name, country } })
  await logAudit({ userId: staff.id, action: 'city.update', entity: 'City', entityId: input.id, meta: { name, country } })
  revalidate()
  return { ok: true }
}

/** Enable/disable a city. Disabled cities never appear in the booking form. */
export async function toggleCityAction(input: { id: string; enabled: boolean }): Promise<CityActionResult> {
  const staff = await requireSettingsAccess()
  await prisma.city.update({ where: { id: input.id }, data: { enabled: input.enabled } })
  await logAudit({ userId: staff.id, action: 'city.toggle', entity: 'City', entityId: input.id, meta: { enabled: input.enabled } })
  revalidate()
  return { ok: true }
}

/** Move a city up/down by swapping order with its neighbour. */
export async function moveCityAction(input: { id: string; dir: 'up' | 'down' }): Promise<CityActionResult> {
  const staff = await requireSettingsAccess()
  const cities = await prisma.city.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }], select: { id: true, order: true } })
  const idx = cities.findIndex((c) => c.id === input.id)
  if (idx === -1) return { ok: false, error: 'Город не найден' }
  const swapIdx = input.dir === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= cities.length) return { ok: true } // already at the edge
  const a = cities[idx]
  const b = cities[swapIdx]
  await prisma.$transaction([
    prisma.city.update({ where: { id: a.id }, data: { order: b.order } }),
    prisma.city.update({ where: { id: b.id }, data: { order: a.order } }),
  ])
  await logAudit({ userId: staff.id, action: 'city.reorder', entity: 'City', entityId: input.id, meta: { dir: input.dir } })
  revalidate()
  return { ok: true }
}

/** Remove a city. */
export async function deleteCityAction(input: { id: string }): Promise<CityActionResult> {
  const staff = await requireSettingsAccess()
  await prisma.city.delete({ where: { id: input.id } })
  await logAudit({ userId: staff.id, action: 'city.delete', entity: 'City', entityId: input.id })
  revalidate()
  return { ok: true }
}
