'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireStaff } from '@/lib/auth'
import { saveOptimizedCarImage, deletePublicCarImage } from '@/lib/public-storage'
import { logAudit } from '@/lib/audit'

const MAX_IMAGE = 12 * 1024 * 1024 // 12 MB before optimisation (stored much smaller)
// Raster formats only — SVG is rejected (staff upload, but avoids any script-in-SVG risk).
const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

export interface PhotoResult {
  ok: boolean
  error?: string
  photoId?: string
}

export interface CarPhotoRow {
  id: string
  storageKey: string
  isExternal: boolean
  isCover: boolean
  sortOrder: number
}

/** Current photos for a car (ordered) — used by the admin manager to refresh its grid live. */
export async function getCarPhotosAction(carId: string): Promise<CarPhotoRow[]> {
  await requireStaff()
  const photos = await prisma.carPhoto.findMany({ where: { carId }, orderBy: { sortOrder: 'asc' } })
  return photos.map((p) => ({ id: p.id, storageKey: p.storageKey, isExternal: p.isExternal, isCover: p.isCover, sortOrder: p.sortOrder }))
}

/** Upload a car photo (public image). First photo for a car becomes the cover. */
export async function uploadCarPhotoAction(carId: string, formData: FormData): Promise<PhotoResult> {
  const staff = await requireStaff()
  const car = await prisma.car.findUnique({ where: { id: carId }, include: { _count: { select: { photos: true } } } })
  if (!car) return { ok: false, error: 'Автомобиль не найден' }

  const file = formData.get('file')
  if (!(file instanceof File)) return { ok: false, error: 'Файл не передан' }
  if (file.size > MAX_IMAGE) return { ok: false, error: 'Файл слишком большой (макс. 12 МБ)' }
  if (!IMAGE_MIME.includes(file.type)) return { ok: false, error: 'Только JPG, PNG, WEBP или AVIF' }

  const bytes = Buffer.from(await file.arrayBuffer())
  let storageKey: string
  try {
    storageKey = await saveOptimizedCarImage(bytes)
  } catch {
    return { ok: false, error: 'Не удалось обработать изображение — попробуйте другой файл' }
  }

  const isFirst = car._count.photos === 0
  const max = await prisma.carPhoto.aggregate({ where: { carId }, _max: { sortOrder: true } })
  const photo = await prisma.carPhoto.create({
    data: {
      carId,
      storageKey,
      isExternal: false,
      isCover: isFirst,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
      alt: `${car.brand} ${car.model}`,
    },
  })
  await logAudit({ userId: staff.id, action: 'carphoto.upload', entity: 'Car', entityId: carId })
  revalidatePath('/admin')
  revalidatePath('/catalog')
  revalidatePath('/')
  return { ok: true, photoId: photo.id }
}

export async function setCarCoverAction(photoId: string): Promise<PhotoResult> {
  const staff = await requireStaff()
  const photo = await prisma.carPhoto.findUnique({ where: { id: photoId } })
  if (!photo) return { ok: false, error: 'Фото не найдено' }
  await prisma.$transaction([
    prisma.carPhoto.updateMany({ where: { carId: photo.carId }, data: { isCover: false } }),
    prisma.carPhoto.update({ where: { id: photoId }, data: { isCover: true } }),
  ])
  await logAudit({ userId: staff.id, action: 'carphoto.cover', entity: 'Car', entityId: photo.carId })
  revalidatePath('/admin')
  revalidatePath('/catalog')
  revalidatePath('/')
  return { ok: true }
}

export async function reorderCarPhotosAction(carId: string, orderedIds: string[]): Promise<PhotoResult> {
  const staff = await requireStaff()
  await prisma.$transaction(
    orderedIds.map((id, i) =>
      prisma.carPhoto.update({ where: { id }, data: { sortOrder: i } }),
    ),
  )
  await logAudit({ userId: staff.id, action: 'carphoto.reorder', entity: 'Car', entityId: carId })
  revalidatePath('/admin')
  revalidatePath('/catalog')
  return { ok: true }
}

export async function deleteCarPhotoAction(photoId: string): Promise<PhotoResult> {
  const staff = await requireStaff()
  const photo = await prisma.carPhoto.findUnique({ where: { id: photoId } })
  if (!photo) return { ok: false, error: 'Фото не найдено' }

  if (!photo.isExternal) await deletePublicCarImage(photo.storageKey)
  await prisma.carPhoto.delete({ where: { id: photoId } })

  // if we removed the cover, promote the next photo
  if (photo.isCover) {
    const next = await prisma.carPhoto.findFirst({ where: { carId: photo.carId }, orderBy: { sortOrder: 'asc' } })
    if (next) await prisma.carPhoto.update({ where: { id: next.id }, data: { isCover: true } })
  }
  await logAudit({ userId: staff.id, action: 'carphoto.delete', entity: 'Car', entityId: photo.carId })
  revalidatePath('/admin')
  revalidatePath('/catalog')
  revalidatePath('/')
  return { ok: true }
}
