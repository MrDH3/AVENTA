'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireStaff } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export interface OfficeActionResult {
  ok: boolean
  error?: string
  id?: string
}

function revalidate() {
  revalidatePath('/admin/settings/locations')
  revalidatePath('/booking')
}

function parseCoord(v: unknown, min: number, max: number): number | null {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').trim())
  if (!Number.isFinite(n) || n < min || n > max) return null
  return n
}

/** Create or update an office (admin/owner). Blank id ⇒ create. */
export async function saveOfficeAction(input: {
  id?: string
  name: string
  address: string
  city?: string
  country?: string
  lat: number | string
  lng: number | string
  enabled?: boolean
}): Promise<OfficeActionResult> {
  const staff = await requireStaff()
  const name = input.name.trim()
  const address = input.address.trim()
  if (!name) return { ok: false, error: 'Введите название офиса' }
  if (!address) return { ok: false, error: 'Введите адрес офиса' }
  const lat = parseCoord(input.lat, -90, 90)
  const lng = parseCoord(input.lng, -180, 180)
  if (lat === null || lng === null) return { ok: false, error: 'Укажите корректные координаты (поставьте точку на карте)' }
  const city = (input.city ?? '').trim() || null
  const country = (input.country ?? '').trim() || 'Türkiye'
  const enabled = input.enabled ?? true

  let id = input.id
  if (id) {
    await prisma.office.update({ where: { id }, data: { name, address, city, country, lat, lng, enabled } })
  } else {
    const last = await prisma.office.findFirst({ orderBy: { order: 'desc' }, select: { order: true } })
    const created = await prisma.office.create({ data: { name, address, city, country, lat, lng, enabled, order: (last?.order ?? -1) + 1 } })
    id = created.id
  }
  await logAudit({ userId: staff.id, action: input.id ? 'office.update' : 'office.create', entity: 'Office', entityId: id, meta: { name, lat, lng, enabled } })
  revalidate()
  return { ok: true, id }
}

/** Remove an office. */
export async function deleteOfficeAction(input: { id: string }): Promise<OfficeActionResult> {
  const staff = await requireStaff()
  await prisma.office.delete({ where: { id: input.id } })
  await logAudit({ userId: staff.id, action: 'office.delete', entity: 'Office', entityId: input.id })
  revalidate()
  return { ok: true }
}
