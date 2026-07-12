'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import MapView from './MapView'
import { useDict } from '../i18n/lang'
import { addSavedPlaceAction, updateSavedPlaceAction, removeSavedPlaceAction, type SavedPlaceView } from '../server/map-actions'
import { escapeHtml } from '../lib/escape-html'

export interface OfficePoint {
  id: string
  name: string
  address: string
  city: string | null
  lat: number
  lng: number
}

const dict = {
  ru: {
    title: 'Мои места и маршруты',
    sub: 'Сохраните места и постройте маршрут — офисы и ваши точки',
    add: 'Добавить место',
    addHint: 'Нажмите на карту, чтобы поставить точку, и дайте ей название',
    editHint: 'Передвиньте точку и/или измените название, затем сохраните',
    label: 'Название',
    labelPh: 'Например: «Мой отель», «Пляж»',
    save: 'Сохранить',
    cancel: 'Отмена',
    saving: 'Сохранение…',
    picked: 'Точка',
    yourPlaces: 'Ваши места',
    offices: 'Офисы AVENTA',
    directions: 'Маршрут',
    edit: 'Изменить',
    remove: 'Удалить',
    removeConfirm: 'Удалить это место?',
    none: 'Пока нет сохранённых мест — добавьте первое.',
  },
  en: {
    title: 'My places & directions',
    sub: 'Save places and get directions — offices and your own pins',
    add: 'Add a place',
    addHint: 'Tap the map to drop a pin, then name it',
    editHint: 'Move the pin and/or rename, then save',
    label: 'Label',
    labelPh: 'e.g. “My hotel”, “Beach”',
    save: 'Save',
    cancel: 'Cancel',
    saving: 'Saving…',
    picked: 'Pin',
    yourPlaces: 'Your places',
    offices: 'AVENTA offices',
    directions: 'Directions',
    edit: 'Edit',
    remove: 'Remove',
    removeConfirm: 'Remove this place?',
    none: 'No saved places yet — add your first.',
  },
  tr: {
    title: 'Yerlerim ve yol tarifleri',
    sub: 'Yerleri kaydedin ve yol tarifi alın — ofisler ve kendi işaretçileriniz',
    add: 'Yer ekle',
    addHint: 'İşaret koymak için haritaya dokunun, ardından ona bir ad verin',
    editHint: 'İşareti taşıyın ve/veya adını değiştirin, ardından kaydedin',
    label: 'Etiket',
    labelPh: 'örn. “Otelim”, “Plaj”',
    save: 'Kaydet',
    cancel: 'İptal',
    saving: 'Kaydediliyor…',
    picked: 'İşaret',
    yourPlaces: 'Yerleriniz',
    offices: 'AVENTA ofisleri',
    directions: 'Yol tarifi',
    edit: 'Düzenle',
    remove: 'Kaldır',
    removeConfirm: 'Bu yer kaldırılsın mı?',
    none: 'Henüz kayıtlı yer yok — ilkini ekleyin.',
  },
  es: {
    title: 'Mis lugares y rutas',
    sub: 'Guardar lugares y ver cómo llegar — oficinas y sus propios marcadores',
    add: 'Añadir un lugar',
    addHint: 'Toque el mapa para colocar un marcador y luego póngale un nombre',
    editHint: 'Mueva el marcador y/o cámbiele el nombre, luego guarde',
    label: 'Etiqueta',
    labelPh: 'p. ej. «Mi hotel», «Playa»',
    save: 'Guardar',
    cancel: 'Cancelar',
    saving: 'Guardando…',
    picked: 'Marcador',
    yourPlaces: 'Sus lugares',
    offices: 'Oficinas AVENTA',
    directions: 'Cómo llegar',
    edit: 'Editar',
    remove: 'Eliminar',
    removeConfirm: '¿Eliminar este lugar?',
    none: 'Aún no hay lugares guardados — añada el primero.',
  },
  de: {
    title: 'Meine Orte & Routen',
    sub: 'Orte speichern und Routen abrufen — Büros und Ihre eigenen Markierungen',
    add: 'Ort hinzufügen',
    addHint: 'Tippen Sie auf die Karte, um eine Markierung zu setzen, und benennen Sie sie',
    editHint: 'Verschieben Sie die Markierung und/oder benennen Sie sie um, dann speichern',
    label: 'Bezeichnung',
    labelPh: 'z. B. „Mein Hotel“, „Strand“',
    save: 'Speichern',
    cancel: 'Abbrechen',
    saving: 'Wird gespeichert…',
    picked: 'Markierung',
    yourPlaces: 'Ihre Orte',
    offices: 'AVENTA-Büros',
    directions: 'Route',
    edit: 'Bearbeiten',
    remove: 'Entfernen',
    removeConfirm: 'Diesen Ort entfernen?',
    none: 'Noch keine gespeicherten Orte — fügen Sie Ihren ersten hinzu.',
  },
}

/** Open the destination in the device's native map app (Apple Maps on Apple devices, else Google). */
function openDirections(lat: number, lng: number) {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const apple = /iPad|iPhone|iPod|Macintosh/.test(ua)
  const url = apple
    ? `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  window.open(url, '_blank', 'noopener')
}

const pinBtn = { flexShrink: 0, padding: '7px 12px', borderRadius: 9, border: '1px solid var(--av-hair-strong)', background: '#fff', color: 'var(--av-teal)', font: '700 11px var(--f-ui)', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 } as const
const rowIcon = { width: 30, height: 30, borderRadius: 9, background: '#E0F6F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as const

export default function SavedPlaces({
  provider,
  apiKey,
  offices,
  places,
}: {
  provider: 'osm' | 'google' | 'yandex'
  apiKey: string | null
  offices: OfficePoint[]
  places: SavedPlaceView[]
}) {
  const t = useDict(dict)
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null) // a place being re-pinned/renamed
  const [pick, setPick] = useState<{ lat: number; lng: number } | null>(null)
  const [label, setLabel] = useState('')
  const [pending, setPending] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const formOpen = adding || editId !== null

  const defaultCenter = useMemo(() => (offices[0] ? { lat: offices[0].lat, lng: offices[0].lng } : { lat: 36.8969, lng: 30.7133 }), [offices])

  // View markers: every office + every saved place.
  const markers = useMemo(
    () => [
      ...offices.map((o) => ({ lat: o.lat, lng: o.lng, popupHtml: `<b>${escapeHtml(o.name)}</b><br/>${escapeHtml(o.address)}` })),
      ...places.map((p) => ({ lat: p.lat, lng: p.lng, popupHtml: `<b>${escapeHtml(p.label)}</b>` })),
    ],
    [offices, places],
  )

  const startAdd = () => { setEditId(null); setAdding(true); setErr(null); setLabel(''); setPick(defaultCenter) }
  const startEdit = (p: SavedPlaceView) => { setAdding(false); setEditId(p.id); setErr(null); setLabel(p.label); setPick({ lat: p.lat, lng: p.lng }) }
  const cancelForm = () => { setAdding(false); setEditId(null); setPick(null); setLabel(''); setErr(null) }

  const save = async () => {
    if (!pick) { setErr(t.addHint); return }
    if (!label.trim()) { setErr(t.labelPh); return }
    setPending(true); setErr(null)
    const res = editId
      ? await updateSavedPlaceAction({ id: editId, label: label.trim(), lat: pick.lat, lng: pick.lng })
      : await addSavedPlaceAction({ label: label.trim(), lat: pick.lat, lng: pick.lng })
    setPending(false)
    if (!res.ok) { setErr(res.error ?? 'Error'); return }
    cancelForm()
    router.refresh()
  }

  const remove = async (id: string) => {
    if (!window.confirm(t.removeConfirm)) return
    const res = await removeSavedPlaceAction(id)
    if (res.ok) router.refresh()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ font: '700 10px var(--f-mono)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--av-label)' }}>{t.title}</span>
        {!formOpen && (
          <button type="button" onClick={startAdd} className="av-tap" style={{ ...pinBtn, background: 'var(--grad-coral)', color: '#fff', border: 'none' }}>+ {t.add}</button>
        )}
      </div>

      {formOpen && (
        <div style={{ marginBottom: 12, padding: 12, borderRadius: 12, background: 'var(--av-field,#F3FAFB)', border: '1px solid var(--av-hair-soft)' }}>
          <div style={{ font: '500 12px var(--f-ui)', color: 'var(--av-muted)', marginBottom: 8 }}>{editId ? t.editHint : t.addHint}</div>
          <MapView
            provider={provider}
            apiKey={apiKey}
            mode="pick"
            lat={pick?.lat ?? defaultCenter.lat}
            lng={pick?.lng ?? defaultCenter.lng}
            zoom={12}
            height={200}
            onChange={(lat, lng) => setPick({ lat, lng })}
          />
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t.labelPh}
              aria-label={t.label}
              style={{ flex: '1 1 180px', minWidth: 0, boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--av-hair-soft)', background: '#fff', font: '600 14px var(--f-ui)', color: 'var(--av-text)', outline: 'none' }}
            />
            <button type="button" onClick={save} disabled={pending} className="av-tap" style={{ ...pinBtn, background: 'var(--grad-coral)', color: '#fff', border: 'none', opacity: pending ? 0.6 : 1 }}>{pending ? t.saving : t.save}</button>
            <button type="button" onClick={cancelForm} className="av-tap" style={pinBtn}>{t.cancel}</button>
          </div>
          {pick && <div style={{ marginTop: 6, font: '500 11px var(--f-mono)', color: 'var(--av-muted)' }}>{t.picked}: {pick.lat.toFixed(4)}, {pick.lng.toFixed(4)}</div>}
          {err && <div style={{ marginTop: 6, font: '600 11px var(--f-ui)', color: 'var(--av-danger,#C6392B)' }}>{err}</div>}
        </div>
      )}

      {!formOpen && (
        <MapView provider={provider} apiKey={apiKey} mode="view" lat={defaultCenter.lat} lng={defaultCenter.lng} zoom={11} height={200} markers={markers} />
      )}

      {/* saved places — with directions + remove */}
      <div style={{ marginTop: 12 }}>
        <div style={{ font: '700 10px var(--f-mono)', letterSpacing: '.08em', color: 'var(--av-label)', marginBottom: 8 }}>{t.yourPlaces}</div>
        {places.length === 0 ? (
          <div style={{ font: '500 12px var(--f-ui)', color: 'var(--av-muted)' }}>{t.none}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {places.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span style={rowIcon}>📍</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '600 13px var(--f-ui)', color: 'var(--av-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</div>
                  <div style={{ font: '500 11px var(--f-mono)', color: 'var(--av-muted)' }}>{p.lat.toFixed(4)}, {p.lng.toFixed(4)}</div>
                </div>
                <button type="button" onClick={() => openDirections(p.lat, p.lng)} className="av-tap" style={pinBtn}>↗ {t.directions}</button>
                <button type="button" onClick={() => startEdit(p)} aria-label={t.edit} className="av-tap" style={pinBtn}>✎</button>
                <button type="button" onClick={() => remove(p.id)} aria-label={t.remove} className="av-tap" style={{ ...pinBtn, color: 'var(--av-danger,#C6392B)', borderColor: 'rgba(214,75,61,.3)' }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* offices — directions to a pickup point */}
      {offices.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ font: '700 10px var(--f-mono)', letterSpacing: '.08em', color: 'var(--av-label)', marginBottom: 8 }}>{t.offices}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {offices.map((o) => (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span style={rowIcon}>🏢</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '600 13px var(--f-ui)', color: 'var(--av-text)' }}>{o.name}</div>
                  <div style={{ font: '500 11px var(--f-ui)', color: 'var(--av-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[o.city, o.address].filter(Boolean).join(' · ')}</div>
                </div>
                <button type="button" onClick={() => openDirections(o.lat, o.lng)} className="av-tap" style={pinBtn}>↗ {t.directions}</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
