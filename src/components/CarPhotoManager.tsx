'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  uploadCarPhotoAction,
  setCarCoverAction,
  deleteCarPhotoAction,
  reorderCarPhotosAction,
  getCarPhotosAction,
} from '@/server/car-photo-actions'
import { useDict, type Dict } from '../i18n/lang'

export interface AdminCarPhoto {
  id: string
  storageKey: string
  isExternal: boolean
  isCover: boolean
  sortOrder: number
}

// Small grid tiles → load the thumbnail rendition (`x.webp` → `x.t.webp`).
// Inline derivation: this is a client component and can't import the sharp lib.
const photoUrl = (p: AdminCarPhoto) =>
  p.isExternal ? p.storageKey : `/uploads/cars/${p.storageKey.replace(/\.webp$/i, '.t.webp')}`

interface Strings {
  photosHeader: string
  uploadBtn: string
  errUpload: string
  errGeneric: string
  emptyState: string
  coverBadge: string
  setCoverBtn: string
}

const dict: Dict<Strings> = {
  ru: {
    photosHeader: 'ФОТОГРАФИИ',
    uploadBtn: '＋ Загрузить фото',
    errUpload: 'Ошибка загрузки',
    errGeneric: 'Ошибка',
    emptyState: 'Нет фото — загрузите обложку, чтобы каталог не показывал заглушку.',
    coverBadge: 'ОБЛОЖКА',
    setCoverBtn: '★ Обложка',
  },
  en: {
    photosHeader: 'PHOTOS',
    uploadBtn: '＋ Upload photo',
    errUpload: 'Upload error',
    errGeneric: 'Error',
    emptyState: 'No photos — upload a cover so the catalogue does not show a placeholder.',
    coverBadge: 'COVER',
    setCoverBtn: '★ Cover',
  },
  tr: {
    photosHeader: 'FOTOĞRAFLAR',
    uploadBtn: '＋ Fotoğraf yükle',
    errUpload: 'Yükleme hatası',
    errGeneric: 'Hata',
    emptyState: 'Fotoğraf yok — kataloğun yer tutucu göstermemesi için bir kapak yükleyin.',
    coverBadge: 'KAPAK',
    setCoverBtn: '★ Kapak',
  },
  es: {
    photosHeader: 'FOTOS',
    uploadBtn: '＋ Subir foto',
    errUpload: 'Error de carga',
    errGeneric: 'Error',
    emptyState: 'Sin fotos — sube una portada para que el catálogo no muestre un marcador de posición.',
    coverBadge: 'PORTADA',
    setCoverBtn: '★ Portada',
  },
  de: {
    photosHeader: 'FOTOS',
    uploadBtn: '＋ Foto hochladen',
    errUpload: 'Upload-Fehler',
    errGeneric: 'Fehler',
    emptyState: 'Keine Fotos — laden Sie ein Titelbild hoch, damit der Katalog keinen Platzhalter zeigt.',
    coverBadge: 'TITELBILD',
    setCoverBtn: '★ Titelbild',
  },
}

/** Admin photo manager for a car: upload multiple, set cover, reorder, delete. */
export default function CarPhotoManager({ carId, photos: initialPhotos }: { carId: string; photos: AdminCarPhoto[] }) {
  const t = useDict(dict)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<AdminCarPhoto[]>(initialPhotos)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Resync when the manager opens for a different car.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPhotos(initialPhotos) }, [carId])

  const ordered = [...photos].sort((a, b) => a.sortOrder - b.sortOrder)

  // Pull the fresh photo list into local state so the grid updates immediately,
  // and refresh the rest of the admin (car-list cover) via the router.
  const reload = async () => {
    try {
      setPhotos(await getCarPhotosAction(carId))
    } catch {
      /* keep current state on transient error */
    }
    startTransition(() => router.refresh())
  }

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setBusy(true)
    setErr(null)
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      const res = await uploadCarPhotoAction(carId, fd)
      if (!res.ok) setErr(res.error ?? t.errUpload)
    }
    if (inputRef.current) inputRef.current.value = ''
    await reload()
    setBusy(false)
  }

  const act = async (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusy(true)
    setErr(null)
    const res = await fn()
    if (!res.ok) setErr(res.error ?? t.errGeneric)
    await reload()
    setBusy(false)
  }

  const move = (id: string, dir: -1 | 1) => {
    const idx = ordered.findIndex((p) => p.id === id)
    const swap = idx + dir
    if (swap < 0 || swap >= ordered.length) return
    const ids = ordered.map((p) => p.id)
    ;[ids[idx], ids[swap]] = [ids[swap], ids[idx]]
    act(() => reorderCarPhotosAction(carId, ids))
  }

  const label = { font: '600 11px var(--f-ui)', color: 'var(--d-muted)' } as const
  const btn = {
    padding: '5px 9px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,.14)',
    background: 'var(--d-el)',
    color: 'var(--d-text)',
    font: '600 11px var(--f-ui)',
    cursor: 'pointer',
  } as const

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={label}>{t.photosHeader} · {ordered.length}</div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          style={{ ...btn, background: 'var(--d-accent)', color: '#082A33', border: 'none' }}
        >
          {busy ? '…' : t.uploadBtn}
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      </div>

      {err && <div style={{ font: '600 11px var(--f-ui)', color: 'var(--d-red)', marginBottom: 8 }}>{err}</div>}

      {ordered.length === 0 ? (
        <div style={{ font: '500 12px var(--f-ui)', color: 'var(--d-muted-2)' }}>
          {t.emptyState}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
          {ordered.map((p, i) => (
            <div
              key={p.id}
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                border: p.isCover ? '2px solid var(--d-accent)' : '1px solid rgba(255,255,255,.1)',
                background: 'var(--d-card)',
              }}
            >
              <div style={{ position: 'relative', height: 84, background: '#0a313b' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl(p)} alt="" style={{ width: '100%', height: 84, objectFit: 'cover' }} />
                {p.isCover && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
                      padding: '2px 7px',
                      borderRadius: 999,
                      background: 'var(--d-accent)',
                      color: '#082A33',
                      font: '700 9px var(--f-ui)',
                    }}
                  >
                    {t.coverBadge}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4, padding: 6, flexWrap: 'wrap' }}>
                {!p.isCover && (
                  <button type="button" style={btn} disabled={busy} onClick={() => act(() => setCarCoverAction(p.id))}>
                    {t.setCoverBtn}
                  </button>
                )}
                <button type="button" style={btn} disabled={busy || i === 0} onClick={() => move(p.id, -1)}>
                  ↑
                </button>
                <button type="button" style={btn} disabled={busy || i === ordered.length - 1} onClick={() => move(p.id, 1)}>
                  ↓
                </button>
                <button
                  type="button"
                  style={{ ...btn, color: 'var(--d-red)' }}
                  disabled={busy}
                  onClick={() => act(() => deleteCarPhotoAction(p.id))}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
