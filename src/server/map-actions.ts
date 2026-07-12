'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireSettingsAccess, getCurrentUser } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { saveMapConfig, MAP_PROVIDERS, type MapProvider } from '@/lib/map-provider'

export interface MapResult {
  ok: boolean
  error?: string
}

/** Admin: pick the active map provider + (optionally) store an encrypted Google/Yandex key. */
export async function saveMapConfigAction(input: { activeProvider: string; googleKey?: string; yandexKey?: string }): Promise<MapResult> {
  const staff = await requireSettingsAccess()
  const provider: MapProvider = (MAP_PROVIDERS as string[]).includes(input.activeProvider) ? (input.activeProvider as MapProvider) : 'osm'
  await saveMapConfig({ activeProvider: provider, googleKey: input.googleKey, yandexKey: input.yandexKey })
  await logAudit({ userId: staff.id, action: 'map.config', entity: 'MapProviderConfig', entityId: 'default', meta: { provider, googleKey: !!input.googleKey?.trim(), yandexKey: !!input.yandexKey?.trim() } })
  revalidatePath('/admin')
  revalidatePath('/account')
  return { ok: true }
}

export interface SavedPlaceView {
  id: string
  label: string
  lat: number
  lng: number
  address: string | null
}

/** Customer: save a chosen destination (a labelled point) — for directions, NOT tracking. */
export async function addSavedPlaceAction(input: { label: string; lat: number; lng: number; address?: string }): Promise<{ ok: boolean; error?: string; place?: SavedPlaceView }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'Требуется вход' }
  const label = input.label.trim().slice(0, 80)
  if (!label) return { ok: false, error: 'Укажите название места' }
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng) || Math.abs(input.lat) > 90 || Math.abs(input.lng) > 180) {
    return { ok: false, error: 'Некорректная точка на карте' }
  }
  const count = await prisma.savedPlace.count({ where: { userId: user.id } })
  if (count >= 30) return { ok: false, error: 'Достигнут лимит сохранённых мест (30)' }
  const p = await prisma.savedPlace.create({
    data: { userId: user.id, label, lat: input.lat, lng: input.lng, address: input.address?.slice(0, 300) ?? null },
  })
  await logAudit({ userId: user.id, action: 'place.add', entity: 'SavedPlace', entityId: p.id })
  revalidatePlaces()
  return { ok: true, place: { id: p.id, label: p.label, lat: p.lat, lng: p.lng, address: p.address } }
}

/** Customer: rename and/or re-pin an existing saved place (owner-only). */
export async function updateSavedPlaceAction(input: { id: string; label?: string; lat?: number; lng?: number; address?: string }): Promise<{ ok: boolean; error?: string; place?: SavedPlaceView }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'Требуется вход' }
  const existing = await prisma.savedPlace.findUnique({ where: { id: input.id } })
  if (!existing || existing.userId !== user.id) return { ok: false, error: 'Нет доступа' }

  const data: { label?: string; lat?: number; lng?: number; address?: string | null } = {}
  if (input.label !== undefined) {
    const label = input.label.trim().slice(0, 80)
    if (!label) return { ok: false, error: 'Укажите название места' }
    data.label = label
  }
  if (input.lat !== undefined || input.lng !== undefined) {
    const lat = input.lat ?? existing.lat
    const lng = input.lng ?? existing.lng
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return { ok: false, error: 'Некорректная точка на карте' }
    }
    data.lat = lat
    data.lng = lng
  }
  if (input.address !== undefined) data.address = input.address.slice(0, 300)

  const p = await prisma.savedPlace.update({ where: { id: input.id }, data })
  await logAudit({ userId: user.id, action: 'place.update', entity: 'SavedPlace', entityId: p.id })
  revalidatePlaces()
  return { ok: true, place: { id: p.id, label: p.label, lat: p.lat, lng: p.lng, address: p.address } }
}

/** Customer: remove one of their saved places. */
export async function removeSavedPlaceAction(placeId: string): Promise<MapResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'Требуется вход' }
  const place = await prisma.savedPlace.findUnique({ where: { id: placeId } })
  if (!place || place.userId !== user.id) return { ok: false, error: 'Нет доступа' }
  await prisma.savedPlace.delete({ where: { id: placeId } })
  await logAudit({ userId: user.id, action: 'place.remove', entity: 'SavedPlace', entityId: placeId })
  revalidatePlaces()
  return { ok: true }
}

/** Saved places surface on the profile home, the Map tab, and the standalone Addresses page. */
function revalidatePlaces() {
  revalidatePath('/account')
  revalidatePath('/account/addresses')
  revalidatePath('/map')
}
