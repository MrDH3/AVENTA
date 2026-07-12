'use client'

import { useEffect, useMemo, useState } from 'react'
import SearchSelect, { type SelectOption } from './SearchSelect'
import { useDict } from '../i18n/lang'

interface GeoData {
  countries: { c: string; n: string; f: string }[]
  regions: Record<string, { c: string; n: string }[]>
}

const dict = {
  ru: {
    country: 'Страна документа',
    region: 'Регион / штат',
    pickCountry: 'Выберите страну',
    pickRegion: 'Выберите регион',
    searchCountry: 'Поиск страны…',
    searchRegion: 'Поиск региона…',
    pickFirst: 'Сначала выберите страну',
    change: 'Изменить',
    changeConfirm: 'Страна и регион документа зафиксированы для проверки личности. Точно изменить?',
    noRegions: 'У этой страны нет регионов в справочнике — достаточно выбрать страну.',
    empty: 'Ничего не найдено',
    lockedNote: '🔒 Зафиксировано для проверки — нажмите «Изменить», чтобы поменять.',
    loading: 'Загрузка справочника стран…',
  },
  en: {
    country: 'Document country',
    region: 'Region / state',
    pickCountry: 'Select a country',
    pickRegion: 'Select a region',
    searchCountry: 'Search country…',
    searchRegion: 'Search region…',
    pickFirst: 'Select a country first',
    change: 'Change',
    changeConfirm: 'The document country & region are locked for identity verification. Change them anyway?',
    noRegions: 'This country has no regions in the directory — selecting the country is enough.',
    empty: 'Nothing found',
    lockedNote: '🔒 Locked for verification — tap “Change” to edit.',
    loading: 'Loading country directory…',
  },
  tr: {
    country: 'Belge ülkesi',
    region: 'Bölge / eyalet',
    pickCountry: 'Bir ülke seçin',
    pickRegion: 'Bir bölge seçin',
    searchCountry: 'Ülke ara…',
    searchRegion: 'Bölge ara…',
    pickFirst: 'Önce bir ülke seçin',
    change: 'Değiştir',
    changeConfirm: 'Belge ülkesi ve bölgesi kimlik doğrulaması için kilitlendi. Yine de değiştirilsin mi?',
    noRegions: 'Bu ülkenin dizinde bölgesi yok — ülkeyi seçmeniz yeterli.',
    empty: 'Sonuç bulunamadı',
    lockedNote: '🔒 Doğrulama için kilitli — düzenlemek için "Değiştir" düğmesine dokunun.',
    loading: 'Ülke dizini yükleniyor…',
  },
  es: {
    country: 'País del documento',
    region: 'Región / estado',
    pickCountry: 'Selecciona un país',
    pickRegion: 'Selecciona una región',
    searchCountry: 'Buscar país…',
    searchRegion: 'Buscar región…',
    pickFirst: 'Primero selecciona un país',
    change: 'Cambiar',
    changeConfirm: 'El país y la región del documento están bloqueados para la verificación de identidad. ¿Cambiarlos de todos modos?',
    noRegions: 'Este país no tiene regiones en el directorio — basta con seleccionar el país.',
    empty: 'No se encontró nada',
    lockedNote: '🔒 Bloqueado para la verificación — toca «Cambiar» para editar.',
    loading: 'Cargando el directorio de países…',
  },
  de: {
    country: 'Dokumentland',
    region: 'Region / Bundesland',
    pickCountry: 'Land auswählen',
    pickRegion: 'Region auswählen',
    searchCountry: 'Land suchen…',
    searchRegion: 'Region suchen…',
    pickFirst: 'Zuerst ein Land auswählen',
    change: 'Ändern',
    changeConfirm: 'Land und Region des Dokuments sind für die Identitätsprüfung gesperrt. Trotzdem ändern?',
    noRegions: 'Für dieses Land sind im Verzeichnis keine Regionen vorhanden — die Auswahl des Landes genügt.',
    empty: 'Nichts gefunden',
    lockedNote: '🔒 Für die Prüfung gesperrt — zum Bearbeiten auf „Ändern“ tippen.',
    loading: 'Länderverzeichnis wird geladen…',
  },
}

const fieldLabel = { font: '500 11px var(--f-ui)', color: 'var(--av-muted)', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '.04em' }

/**
 * Document issuing Country + Region/State as searchable, DEPENDENT dropdowns (ISO 3166). The region
 * list is filtered to the chosen country. Once a valid selection exists it LOCKS to a fixed summary;
 * changing it is a deliberate, confirmed action — the issuing region shouldn't drift after it is set
 * for verification. Persists human-readable names via `onChange(countryName, regionName)`.
 */
export default function CountryRegionPicker({
  country,
  region,
  onChange,
  onValidChange,
  disabled,
}: {
  country: string
  region: string
  onChange: (country: string, region: string) => void
  onValidChange: (valid: boolean) => void
  disabled?: boolean
}) {
  const t = useDict(dict)
  const [geo, setGeo] = useState<GeoData | null>(null)
  const [countryCode, setCountryCode] = useState<string | null>(null)
  const [regionCode, setRegionCode] = useState<string | null>(null)
  const [editing, setEditing] = useState(true)

  // Load the (large) ISO dataset only when this step renders.
  useEffect(() => {
    let alive = true
    import('../data/geo.json').then((m) => { if (alive) setGeo((m.default ?? m) as GeoData) })
    return () => { alive = false }
  }, [])

  // Restore an existing (persisted-by-name) selection to codes, and lock it if valid.
  useEffect(() => {
    if (!geo) return
    const cc = country.trim() ? geo.countries.find((c) => c.n.toLowerCase() === country.trim().toLowerCase())?.c ?? null : null
    const rr = cc && region.trim() ? (geo.regions[cc] ?? []).find((r) => r.n.toLowerCase() === region.trim().toLowerCase())?.c ?? null : null
    setCountryCode(cc)
    setRegionCode(rr)
    // A chosen country is sufficient (region is optional), so lock to the summary as soon as a country
    // resolves — the default (Turkey) shows as a locked selection the user isn't required to touch.
    setEditing(!cc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo])

  const countryOptions: SelectOption[] = useMemo(
    () => (geo?.countries ?? []).map((c) => ({ value: c.c, label: c.n, icon: <span style={{ fontSize: 18, lineHeight: 1 }}>{c.f}</span> })),
    [geo],
  )
  const regionsForCountry = (countryCode && geo?.regions[countryCode]) || []
  const hasRegions = regionsForCountry.length > 0
  const regionOptions: SelectOption[] = useMemo(() => regionsForCountry.map((r) => ({ value: r.c, label: r.n })), [regionsForCountry])

  const countryObj = geo?.countries.find((c) => c.c === countryCode) ?? null
  const regionObj = regionsForCountry.find((r) => r.c === regionCode) ?? null
  // A chosen country is enough to proceed; the region is an optional refinement (selection not forced).
  const complete = !!countryCode

  // Tell the parent the gate state (country set & region set-or-not-applicable).
  useEffect(() => { onValidChange(complete) }, [complete, onValidChange])

  const chooseCountry = (cc: string) => {
    setCountryCode(cc)
    setRegionCode(null)
    const cName = geo?.countries.find((c) => c.c === cc)?.n ?? ''
    const noRegions = (geo?.regions[cc]?.length ?? 0) === 0
    onChange(cName, '')
    if (noRegions) setEditing(false) // country with no subdivisions → immediately committed
  }
  const chooseRegion = (rc: string) => {
    setRegionCode(rc)
    const cName = countryObj?.n ?? ''
    const rName = regionsForCountry.find((r) => r.c === rc)?.n ?? ''
    onChange(cName, rName)
    setEditing(false) // both chosen → lock
  }
  const requestChange = () => {
    if (disabled) return
    if (window.confirm(t.changeConfirm)) setEditing(true)
  }

  if (!geo) {
    return <div style={{ font: '500 13px var(--f-ui)', color: 'var(--av-muted)', padding: '10px 0' }}>{t.loading}</div>
  }

  // LOCKED summary — the default once a valid selection exists.
  if (!editing && complete) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={fieldLabel}>{t.country} · {t.region}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'var(--av-success-bg, #E9FBF2)', border: '1px solid rgba(39,181,118,.3)' }}>
          {countryObj && <span style={{ fontSize: 20, lineHeight: 1 }}>{countryObj.f}</span>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: '700 15px var(--f-ui)', color: 'var(--av-text)' }}>
              {countryObj?.n}{regionObj ? ` · ${regionObj.n}` : ''}
            </div>
            <div style={{ marginTop: 2, font: '500 11.5px var(--f-ui)', color: 'var(--av-muted)' }}>{t.lockedNote}</div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={requestChange}
              className="av-tap"
              style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 10, border: '1px solid var(--av-hair-strong)', background: '#fff', color: 'var(--av-teal)', font: '700 12px var(--f-ui)', cursor: 'pointer' }}
            >
              {t.change}
            </button>
          )}
        </div>
      </div>
    )
  }

  // EDITING — country first, then dependent region.
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={fieldLabel}>{t.country}</div>
        <SearchSelect
          options={countryOptions}
          value={countryCode}
          onChange={chooseCountry}
          placeholder={t.pickCountry}
          searchPlaceholder={t.searchCountry}
          emptyText={t.empty}
          disabled={disabled}
        />
      </div>
      <div>
        <div style={fieldLabel}>{t.region}</div>
        {!countryCode ? (
          <div style={{ padding: '12px 14px', borderRadius: 12, border: '1px dashed var(--av-hair-strong)', background: 'var(--av-field, #F3FAFB)', font: '500 13px var(--f-ui)', color: 'var(--av-muted)' }}>{t.pickFirst}</div>
        ) : !hasRegions ? (
          <div style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid var(--av-hair-soft)', background: 'var(--av-field, #F3FAFB)', font: '500 12.5px/1.5 var(--f-ui)', color: 'var(--av-muted)' }}>{t.noRegions}</div>
        ) : (
          <SearchSelect
            options={regionOptions}
            value={regionCode}
            onChange={chooseRegion}
            placeholder={t.pickRegion}
            searchPlaceholder={t.searchRegion}
            emptyText={t.empty}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  )
}
