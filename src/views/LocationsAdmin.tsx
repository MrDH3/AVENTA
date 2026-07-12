'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createCityAction, updateCityAction, toggleCityAction, moveCityAction, deleteCityAction } from '@/server/city-actions'
import { saveOfficeAction, deleteOfficeAction } from '@/server/office-actions'
import { useDict, type Dict } from '../i18n/lang'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

export interface MapClient {
  provider: 'osm' | 'google' | 'yandex'
  apiKey: string | null
}

export interface CityView {
  id: string
  name: string
  country: string
  enabled: boolean
  order: number
}
export interface OfficeView {
  id: string
  name: string
  address: string
  city: string | null
  country: string
  lat: number
  lng: number
  enabled: boolean
  order: number
}

interface Strings {
  // city row
  moveUp: string
  moveDown: string
  enabledTitle: string
  disabledTitle: string
  enabledLabel: string
  disabledLabel: string
  save: string
  deleteLabel: string
  confirmDeleteCity: (name: string) => string
  // add city
  errGeneric: string
  newCityLabel: string
  newCityPlaceholder: string
  countryLabel: string
  addCity: string
  // office editor
  savedOk: string
  confirmDeleteOffice: (name: string) => string
  nameLabel: string
  cityLabel: string
  addressLabel: string
  addressPlaceholder: string
  latLabel: string
  lngLabel: string
  active: string
  mapHint: string
  saving: string
  saveOffice: string
  createOffice: string
  // root
  citiesTitle: string
  citiesHintPre: string
  citiesHintBold: string
  citiesHintPost: string
  noCities: string
  orderLabel: string
  statusLabel: string
  officesTitle: string
  officesHint: string
  addOffice: string
}

const dict: Dict<Strings> = {
  ru: {
    moveUp: 'Вверх',
    moveDown: 'Вниз',
    enabledTitle: 'Включён — виден в форме',
    disabledTitle: 'Выключен — скрыт',
    enabledLabel: '● Вкл',
    disabledLabel: '○ Выкл',
    save: 'Сохранить',
    deleteLabel: 'Удалить',
    confirmDeleteCity: (name: string) => `Удалить город «${name}»?`,
    errGeneric: 'Ошибка',
    newCityLabel: 'НОВЫЙ ГОРОД',
    newCityPlaceholder: 'Напр. Manavgat',
    countryLabel: 'СТРАНА',
    addCity: '＋ Добавить',
    savedOk: 'Сохранено ✓',
    confirmDeleteOffice: (name: string) => `Удалить офис «${name}»?`,
    nameLabel: 'НАЗВАНИЕ',
    cityLabel: 'ГОРОД',
    addressLabel: 'АДРЕС',
    addressPlaceholder: 'Улица, район, город',
    latLabel: 'ШИРОТА (LAT)',
    lngLabel: 'ДОЛГОТА (LNG)',
    active: 'Активен',
    mapHint: 'Поставьте точку на карте — координаты заполнятся автоматически.',
    saving: 'Сохранение…',
    saveOffice: 'Сохранить офис',
    createOffice: 'Создать офис',
    citiesTitle: 'Города обслуживания',
    citiesHintPre: 'В форме бронирования показываются только ',
    citiesHintBold: 'включённые',
    citiesHintPost: ' города в этом порядке. Перетаскивания нет — используйте стрелки.',
    noCities: 'Пока нет городов.',
    orderLabel: 'ПОРЯДОК',
    statusLabel: 'СТАТУС',
    officesTitle: 'Офис(ы) компании',
    officesHint: 'Показывается на карте при выборе «Забрать из офиса». Координаты дают ссылку «открыть в картах».',
    addOffice: '＋ Добавить офис',
  },
  en: {
    moveUp: 'Up',
    moveDown: 'Down',
    enabledTitle: 'Enabled — visible in the form',
    disabledTitle: 'Disabled — hidden',
    enabledLabel: '● On',
    disabledLabel: '○ Off',
    save: 'Save',
    deleteLabel: 'Delete',
    confirmDeleteCity: (name: string) => `Delete city “${name}”?`,
    errGeneric: 'Error',
    newCityLabel: 'NEW CITY',
    newCityPlaceholder: 'e.g. Manavgat',
    countryLabel: 'COUNTRY',
    addCity: '＋ Add',
    savedOk: 'Saved ✓',
    confirmDeleteOffice: (name: string) => `Delete office “${name}”?`,
    nameLabel: 'NAME',
    cityLabel: 'CITY',
    addressLabel: 'ADDRESS',
    addressPlaceholder: 'Street, district, city',
    latLabel: 'LATITUDE (LAT)',
    lngLabel: 'LONGITUDE (LNG)',
    active: 'Active',
    mapHint: 'Place a point on the map — the coordinates fill in automatically.',
    saving: 'Saving…',
    saveOffice: 'Save office',
    createOffice: 'Create office',
    citiesTitle: 'Service cities',
    citiesHintPre: 'Only ',
    citiesHintBold: 'enabled',
    citiesHintPost: ' cities are shown in the booking form, in this order. There is no drag-and-drop — use the arrows.',
    noCities: 'No cities yet.',
    orderLabel: 'ORDER',
    statusLabel: 'STATUS',
    officesTitle: 'Company office(s)',
    officesHint: 'Shown on the map when “Pick up from office” is selected. The coordinates provide an “open in maps” link.',
    addOffice: '＋ Add office',
  },
  tr: {
    moveUp: 'Yukarı',
    moveDown: 'Aşağı',
    enabledTitle: 'Etkin — formda görünür',
    disabledTitle: 'Kapalı — gizli',
    enabledLabel: '● Açık',
    disabledLabel: '○ Kapalı',
    save: 'Kaydet',
    deleteLabel: 'Sil',
    confirmDeleteCity: (name: string) => `“${name}” şehri silinsin mi?`,
    errGeneric: 'Hata',
    newCityLabel: 'YENİ ŞEHİR',
    newCityPlaceholder: 'Örn. Manavgat',
    countryLabel: 'ÜLKE',
    addCity: '＋ Ekle',
    savedOk: 'Kaydedildi ✓',
    confirmDeleteOffice: (name: string) => `“${name}” ofisi silinsin mi?`,
    nameLabel: 'AD',
    cityLabel: 'ŞEHİR',
    addressLabel: 'ADRES',
    addressPlaceholder: 'Sokak, ilçe, şehir',
    latLabel: 'ENLEM (LAT)',
    lngLabel: 'BOYLAM (LNG)',
    active: 'Aktif',
    mapHint: 'Haritada bir nokta koyun — koordinatlar otomatik olarak doldurulur.',
    saving: 'Kaydediliyor…',
    saveOffice: 'Ofisi kaydet',
    createOffice: 'Ofis oluştur',
    citiesTitle: 'Hizmet şehirleri',
    citiesHintPre: 'Rezervasyon formunda yalnızca ',
    citiesHintBold: 'etkin',
    citiesHintPost: ' şehirler bu sırayla gösterilir. Sürükle-bırak yoktur — okları kullanın.',
    noCities: 'Henüz şehir yok.',
    orderLabel: 'SIRA',
    statusLabel: 'DURUM',
    officesTitle: 'Şirket ofis(ler)i',
    officesHint: '“Ofisten teslim al” seçildiğinde haritada gösterilir. Koordinatlar bir “haritada aç” bağlantısı sağlar.',
    addOffice: '＋ Ofis ekle',
  },
  es: {
    moveUp: 'Subir',
    moveDown: 'Bajar',
    enabledTitle: 'Activado — visible en el formulario',
    disabledTitle: 'Desactivado — oculto',
    enabledLabel: '● Activo',
    disabledLabel: '○ Inactivo',
    save: 'Guardar',
    deleteLabel: 'Eliminar',
    confirmDeleteCity: (name: string) => `¿Eliminar la ciudad «${name}»?`,
    errGeneric: 'Error',
    newCityLabel: 'NUEVA CIUDAD',
    newCityPlaceholder: 'Ej. Manavgat',
    countryLabel: 'PAÍS',
    addCity: '＋ Añadir',
    savedOk: 'Guardado ✓',
    confirmDeleteOffice: (name: string) => `¿Eliminar la oficina «${name}»?`,
    nameLabel: 'NOMBRE',
    cityLabel: 'CIUDAD',
    addressLabel: 'DIRECCIÓN',
    addressPlaceholder: 'Calle, distrito, ciudad',
    latLabel: 'LATITUD (LAT)',
    lngLabel: 'LONGITUD (LNG)',
    active: 'Activo',
    mapHint: 'Coloque un punto en el mapa — las coordenadas se rellenan automáticamente.',
    saving: 'Guardando…',
    saveOffice: 'Guardar oficina',
    createOffice: 'Crear oficina',
    citiesTitle: 'Ciudades de servicio',
    citiesHintPre: 'En el formulario de reserva solo se muestran las ciudades ',
    citiesHintBold: 'activadas',
    citiesHintPost: ' en este orden. No hay arrastrar y soltar — use las flechas.',
    noCities: 'Aún no hay ciudades.',
    orderLabel: 'ORDEN',
    statusLabel: 'ESTADO',
    officesTitle: 'Oficina(s) de la empresa',
    officesHint: 'Se muestra en el mapa al seleccionar «Recoger en la oficina». Las coordenadas proporcionan un enlace «abrir en mapas».',
    addOffice: '＋ Añadir oficina',
  },
  de: {
    moveUp: 'Nach oben',
    moveDown: 'Nach unten',
    enabledTitle: 'Aktiviert — im Formular sichtbar',
    disabledTitle: 'Deaktiviert — ausgeblendet',
    enabledLabel: '● Ein',
    disabledLabel: '○ Aus',
    save: 'Speichern',
    deleteLabel: 'Löschen',
    confirmDeleteCity: (name: string) => `Stadt „${name}“ löschen?`,
    errGeneric: 'Fehler',
    newCityLabel: 'NEUE STADT',
    newCityPlaceholder: 'z. B. Manavgat',
    countryLabel: 'LAND',
    addCity: '＋ Hinzufügen',
    savedOk: 'Gespeichert ✓',
    confirmDeleteOffice: (name: string) => `Büro „${name}“ löschen?`,
    nameLabel: 'NAME',
    cityLabel: 'STADT',
    addressLabel: 'ADRESSE',
    addressPlaceholder: 'Straße, Bezirk, Stadt',
    latLabel: 'BREITE (LAT)',
    lngLabel: 'LÄNGE (LNG)',
    active: 'Aktiv',
    mapHint: 'Setzen Sie einen Punkt auf die Karte — die Koordinaten werden automatisch ausgefüllt.',
    saving: 'Wird gespeichert…',
    saveOffice: 'Büro speichern',
    createOffice: 'Büro erstellen',
    citiesTitle: 'Servicestädte',
    citiesHintPre: 'Im Buchungsformular werden nur ',
    citiesHintBold: 'aktivierte',
    citiesHintPost: ' Städte in dieser Reihenfolge angezeigt. Kein Drag-and-drop — verwenden Sie die Pfeile.',
    noCities: 'Noch keine Städte.',
    orderLabel: 'REIHENFOLGE',
    statusLabel: 'STATUS',
    officesTitle: 'Firmenbüro(s)',
    officesHint: 'Wird auf der Karte angezeigt, wenn „Im Büro abholen“ gewählt ist. Die Koordinaten liefern einen „in Karten öffnen“-Link.',
    addOffice: '＋ Büro hinzufügen',
  },
}

const input = {
  width: '100%',
  padding: '9px 11px',
  borderRadius: 9,
  border: '1px solid rgba(255,255,255,.12)',
  background: 'var(--d-base)',
  color: 'var(--d-text)',
  font: '500 13px var(--f-ui)',
} as const
const label = { font: '400 10px var(--f-mono)', letterSpacing: '.1em', color: 'var(--d-muted-2)', marginBottom: 5, display: 'block' } as const
const btn = (bg: string, fg: string) => ({ padding: '8px 14px', borderRadius: 9, border: 'none', background: bg, color: fg, font: '700 12px var(--f-ui)', cursor: 'pointer' }) as const
const iconBtn = { width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,.12)', background: 'var(--d-card)', color: 'var(--d-text)', cursor: 'pointer', font: '700 13px var(--f-ui)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' } as const
const panel = { background: 'var(--d-panel)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: 20 } as const
const h = { font: '700 13px var(--f-display)', color: 'var(--d-text-bright)', marginBottom: 14 } as const

/* ---------------------------------------------------------------- cities */

function CityRowItem({ c, first, last }: { c: CityView; first: boolean; last: boolean }) {
  const t = useDict(dict)
  const router = useRouter()
  const [name, setName] = useState(c.name)
  const [country, setCountry] = useState(c.country)
  const [pending, start] = useTransition()
  const dirty = name !== c.name || country !== c.country

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => start(async () => { await fn(); router.refresh() })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr auto auto auto auto', gap: 8, alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,.05)', opacity: c.enabled ? 1 : 0.5 }}>
      <input style={input} value={name} onChange={(e) => setName(e.target.value)} />
      <input style={input} value={country} onChange={(e) => setCountry(e.target.value)} />
      <div style={{ display: 'flex', gap: 4 }}>
        <button title={t.moveUp} disabled={first || pending} style={{ ...iconBtn, opacity: first ? 0.35 : 1 }} onClick={() => run(() => moveCityAction({ id: c.id, dir: 'up' }))}>↑</button>
        <button title={t.moveDown} disabled={last || pending} style={{ ...iconBtn, opacity: last ? 0.35 : 1 }} onClick={() => run(() => moveCityAction({ id: c.id, dir: 'down' }))}>↓</button>
      </div>
      <button
        onClick={() => run(() => toggleCityAction({ id: c.id, enabled: !c.enabled }))}
        disabled={pending}
        style={btn(c.enabled ? 'rgba(39,181,118,.18)' : 'var(--d-card)', c.enabled ? 'var(--d-green)' : 'var(--d-muted)')}
        title={c.enabled ? t.enabledTitle : t.disabledTitle}
      >
        {c.enabled ? t.enabledLabel : t.disabledLabel}
      </button>
      <button onClick={() => run(() => updateCityAction({ id: c.id, name, country }))} disabled={!dirty || pending} style={{ ...btn('var(--d-accent)', '#082A33'), opacity: dirty ? 1 : 0.4 }}>
        {t.save}
      </button>
      <button onClick={() => { if (confirm(t.confirmDeleteCity(c.name))) run(() => deleteCityAction({ id: c.id })) }} disabled={pending} style={btn('rgba(224,69,69,.14)', 'var(--d-red)')} title={t.deleteLabel}>✕</button>
    </div>
  )
}

function AddCity() {
  const t = useDict(dict)
  const router = useRouter()
  const [name, setName] = useState('')
  const [country, setCountry] = useState('Türkiye')
  const [pending, start] = useTransition()
  const [err, setErr] = useState<string | null>(null)
  const add = () =>
    start(async () => {
      setErr(null)
      const res = await createCityAction({ name, country })
      if (res.ok) { setName(''); router.refresh() } else setErr(res.error ?? t.errGeneric)
    })
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr auto', gap: 8, alignItems: 'end', marginTop: 14 }}>
      <div><label style={label}>{t.newCityLabel}</label><input style={input} value={name} placeholder={t.newCityPlaceholder} onChange={(e) => setName(e.target.value)} /></div>
      <div><label style={label}>{t.countryLabel}</label><input style={input} value={country} onChange={(e) => setCountry(e.target.value)} /></div>
      <button onClick={add} disabled={pending || !name.trim()} style={{ ...btn('var(--d-accent)', '#082A33'), opacity: name.trim() ? 1 : 0.5 }}>{t.addCity}</button>
      {err && <div style={{ gridColumn: '1 / -1', font: '600 12px var(--f-ui)', color: 'var(--d-red)' }}>{err}</div>}
    </div>
  )
}

/* ---------------------------------------------------------------- office */

function OfficeEditor({ o, map }: { o: OfficeView | null; map: MapClient }) {
  const t = useDict(dict)
  const router = useRouter()
  const [name, setName] = useState(o?.name ?? '')
  const [address, setAddress] = useState(o?.address ?? '')
  const [city, setCity] = useState(o?.city ?? '')
  const [country, setCountry] = useState(o?.country ?? 'Türkiye')
  const [lat, setLat] = useState<number | null>(o?.lat ?? 36.8987)
  const [lng, setLng] = useState<number | null>(o?.lng ?? 30.8005)
  const [enabled, setEnabled] = useState(o?.enabled ?? true)
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const save = () =>
    start(async () => {
      setMsg(null)
      const res = await saveOfficeAction({ id: o?.id, name, address, city, country, lat: lat ?? '', lng: lng ?? '', enabled })
      if (res.ok) { setMsg({ ok: true, text: t.savedOk }); router.refresh() } else setMsg({ ok: false, text: res.error ?? t.errGeneric })
    })
  const remove = () => { if (o && confirm(t.confirmDeleteOffice(o.name))) start(async () => { await deleteOfficeAction({ id: o.id }); router.refresh() }) }

  return (
    <div style={{ ...panel, marginTop: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
        <div><label style={label}>{t.nameLabel}</label><input style={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="AVENTA — Antalya" /></div>
        <div><label style={label}>{t.cityLabel}</label><input style={input} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Antalya" /></div>
        <div><label style={label}>{t.countryLabel}</label><input style={input} value={country} onChange={(e) => setCountry(e.target.value)} /></div>
      </div>
      <div style={{ marginTop: 12 }}><label style={label}>{t.addressLabel}</label><input style={input} value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t.addressPlaceholder} /></div>
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
        <div><label style={label}>{t.latLabel}</label><input style={input} type="number" step="0.000001" value={lat ?? ''} onChange={(e) => setLat(e.target.value === '' ? null : parseFloat(e.target.value))} /></div>
        <div><label style={label}>{t.lngLabel}</label><input style={input} type="number" step="0.000001" value={lng ?? ''} onChange={(e) => setLng(e.target.value === '' ? null : parseFloat(e.target.value))} /></div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', paddingBottom: 8 }}>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} style={{ width: 17, height: 17, accentColor: '#FF7A5C' }} />
          <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-text)' }}>{t.active}</span>
        </label>
      </div>
      <div style={{ marginTop: 12, font: '400 11px var(--f-ui)', color: 'var(--d-muted-2)' }}>{t.mapHint}</div>
      <div style={{ marginTop: 8 }}>
        <MapView provider={map.provider} apiKey={map.apiKey} mode="pick" lat={lat} lng={lng} zoom={13} height={280} onChange={(la, ln) => { setLat(la); setLng(ln) }} />
      </div>
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={save} disabled={pending} style={btn('var(--d-accent)', '#082A33')}>{pending ? t.saving : o ? t.saveOffice : t.createOffice}</button>
        {o && <button onClick={remove} disabled={pending} style={btn('rgba(224,69,69,.14)', 'var(--d-red)')}>{t.deleteLabel}</button>}
        {msg && <span style={{ font: '600 12px var(--f-ui)', color: msg.ok ? 'var(--d-green)' : 'var(--d-red)' }}>{msg.text}</span>}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- root */

export default function LocationsAdmin({ cities, offices, map }: { cities: CityView[]; offices: OfficeView[]; map: MapClient }) {
  const t = useDict(dict)
  const [addingOffice, setAddingOffice] = useState(false)
  return (
    <div style={{ display: 'grid', gap: 22 }}>
      <div style={panel}>
        <div style={h}>{t.citiesTitle}</div>
        <div style={{ font: '400 12px/1.6 var(--f-ui)', color: 'var(--d-muted)', marginBottom: 12 }}>
          {t.citiesHintPre}<b>{t.citiesHintBold}</b>{t.citiesHintPost}
        </div>
        {cities.length === 0 ? (
          <div style={{ font: '500 13px var(--f-ui)', color: 'var(--d-muted-2)', padding: '10px 0' }}>{t.noCities}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr auto auto auto auto', gap: 8, marginBottom: 4 }}>
            <div style={label}>{t.cityLabel}</div><div style={label}>{t.countryLabel}</div><div style={label}>{t.orderLabel}</div><div style={label}>{t.statusLabel}</div><div /><div />
          </div>
        )}
        {cities.map((c, i) => (
          <CityRowItem key={c.id} c={c} first={i === 0} last={i === cities.length - 1} />
        ))}
        <AddCity />
      </div>

      <div style={panel}>
        <div style={h}>{t.officesTitle}</div>
        <div style={{ font: '400 12px/1.6 var(--f-ui)', color: 'var(--d-muted)', marginBottom: 4 }}>
          {t.officesHint}
        </div>
        {offices.map((o) => (
          <OfficeEditor key={o.id} o={o} map={map} />
        ))}
        {addingOffice && <OfficeEditor o={null} map={map} />}
        {!addingOffice && (
          <button onClick={() => setAddingOffice(true)} style={{ ...btn('var(--d-card)', 'var(--d-text)'), marginTop: 14, border: '1px solid rgba(255,255,255,.12)' }}>{t.addOffice}</button>
        )}
      </div>
    </div>
  )
}
