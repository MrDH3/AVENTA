'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveInsuranceTierAction } from '@/server/insurance-actions'
import { useDict, type Dict } from '../i18n/lang'

type Status = 'yes' | 'no' | 'partial'
export interface CoverageRowView {
  labelRu: string
  labelEn: string
  status: Status
}
export interface InsuranceTierAdminView {
  key: string
  order: number
  nameRu: string
  nameEn: string
  descRu: string | null
  descEn: string | null
  excessRu: string | null
  excessEn: string | null
  coverage: CoverageRowView[]
  isPlaceholder: boolean
}

interface Strings {
  statusOpts: { v: Status; label: string }[]
  saved: string
  errGeneric: string
  placeholderBadge: string
  nameRuLabel: string
  nameEnLabel: string
  excessRuLabel: string
  excessEnLabel: string
  descRuLabel: string
  descEnLabel: string
  coverageItems: string
  itemPlaceholderRu: string
  itemPlaceholderEn: string
  deleteTitle: string
  addItem: string
  saving: string
  saveTier: string
  warnHeading: string
  warnBodyPre: string
  warnBodyBold: string
  warnBodyPost: string
  infoText: string
}

const dict: Dict<Strings> = {
  ru: {
    statusOpts: [
      { v: 'yes', label: '✓ Включено' },
      { v: 'partial', label: '~ Частично' },
      { v: 'no', label: '✗ Не включено' },
    ],
    saved: 'Сохранено ✓ — плейсхолдер снят',
    errGeneric: 'Ошибка',
    placeholderBadge: '⚠ ПРИМЕР — заменить',
    nameRuLabel: 'НАЗВАНИЕ (RU)',
    nameEnLabel: 'НАЗВАНИЕ (EN)',
    excessRuLabel: 'ФРАНШИЗА (RU)',
    excessEnLabel: 'ФРАНШИЗА (EN)',
    descRuLabel: 'ОПИСАНИЕ (RU)',
    descEnLabel: 'ОПИСАНИЕ (EN)',
    coverageItems: 'ПУНКТЫ ПОКРЫТИЯ',
    itemPlaceholderRu: 'Пункт (RU)',
    itemPlaceholderEn: 'Item (EN)',
    deleteTitle: 'Удалить',
    addItem: '＋ Добавить пункт',
    saving: 'Сохранение…',
    saveTier: 'Сохранить тариф',
    warnHeading: '⚠ ВНИМАНИЕ: показан ПРИМЕРНЫЙ текст покрытия',
    warnBodyPre: 'Тарифы, отмеченные «ПРИМЕР», содержат демонстрационные условия. ',
    warnBodyBold: 'Замените их на реальные условия вашего страхового полиса перед запуском',
    warnBodyPost: ' — неверный текст о покрытии создаёт юридический риск. Сохранение тарифа снимает пометку «ПРИМЕР».',
    infoText: 'Текст покрытия хранится в базе и редактируется здесь — в коде ничего не зашито. Изменения сразу видны в оформлении брони (шаг «Услуги и страховка»).',
  },
  en: {
    statusOpts: [
      { v: 'yes', label: '✓ Included' },
      { v: 'partial', label: '~ Partial' },
      { v: 'no', label: '✗ Not included' },
    ],
    saved: 'Saved ✓ — placeholder cleared',
    errGeneric: 'Error',
    placeholderBadge: '⚠ EXAMPLE — replace',
    nameRuLabel: 'NAME (RU)',
    nameEnLabel: 'NAME (EN)',
    excessRuLabel: 'EXCESS (RU)',
    excessEnLabel: 'EXCESS (EN)',
    descRuLabel: 'DESCRIPTION (RU)',
    descEnLabel: 'DESCRIPTION (EN)',
    coverageItems: 'COVERAGE ITEMS',
    itemPlaceholderRu: 'Item (RU)',
    itemPlaceholderEn: 'Item (EN)',
    deleteTitle: 'Delete',
    addItem: '＋ Add item',
    saving: 'Saving…',
    saveTier: 'Save tier',
    warnHeading: '⚠ WARNING: example coverage text is shown',
    warnBodyPre: 'Tiers marked “EXAMPLE” contain demonstration terms. ',
    warnBodyBold: 'Replace them with the real terms of your insurance policy before launch',
    warnBodyPost: ' — incorrect coverage text creates legal risk. Saving a tier clears the “EXAMPLE” mark.',
    infoText: 'Coverage text is stored in the database and edited here — nothing is hardcoded. Changes appear immediately in the booking flow (the “Services and insurance” step).',
  },
  tr: {
    statusOpts: [
      { v: 'yes', label: '✓ Dahil' },
      { v: 'partial', label: '~ Kısmi' },
      { v: 'no', label: '✗ Dahil değil' },
    ],
    saved: 'Kaydedildi ✓ — örnek işareti kaldırıldı',
    errGeneric: 'Hata',
    placeholderBadge: '⚠ ÖRNEK — değiştirin',
    nameRuLabel: 'AD (RU)',
    nameEnLabel: 'AD (EN)',
    excessRuLabel: 'MUAFİYET (RU)',
    excessEnLabel: 'MUAFİYET (EN)',
    descRuLabel: 'AÇIKLAMA (RU)',
    descEnLabel: 'AÇIKLAMA (EN)',
    coverageItems: 'KAPSAM MADDELERİ',
    itemPlaceholderRu: 'Madde (RU)',
    itemPlaceholderEn: 'Madde (EN)',
    deleteTitle: 'Sil',
    addItem: '＋ Madde ekle',
    saving: 'Kaydediliyor…',
    saveTier: 'Tarifeyi kaydet',
    warnHeading: '⚠ DİKKAT: örnek kapsam metni gösteriliyor',
    warnBodyPre: '“ÖRNEK” olarak işaretlenen tarifeler gösterim amaçlı koşullar içerir. ',
    warnBodyBold: 'Yayına almadan önce bunları sigorta poliçenizin gerçek koşullarıyla değiştirin',
    warnBodyPost: ' — yanlış kapsam metni yasal risk oluşturur. Bir tarifeyi kaydetmek “ÖRNEK” işaretini kaldırır.',
    infoText: 'Kapsam metni veritabanında saklanır ve buradan düzenlenir — kodda hiçbir şey sabit değildir. Değişiklikler rezervasyon akışında (“Hizmetler ve sigorta” adımı) anında görünür.',
  },
  es: {
    statusOpts: [
      { v: 'yes', label: '✓ Incluido' },
      { v: 'partial', label: '~ Parcial' },
      { v: 'no', label: '✗ No incluido' },
    ],
    saved: 'Guardado ✓ — marca de ejemplo eliminada',
    errGeneric: 'Error',
    placeholderBadge: '⚠ EJEMPLO — reemplazar',
    nameRuLabel: 'NOMBRE (RU)',
    nameEnLabel: 'NOMBRE (EN)',
    excessRuLabel: 'FRANQUICIA (RU)',
    excessEnLabel: 'FRANQUICIA (EN)',
    descRuLabel: 'DESCRIPCIÓN (RU)',
    descEnLabel: 'DESCRIPCIÓN (EN)',
    coverageItems: 'ELEMENTOS DE COBERTURA',
    itemPlaceholderRu: 'Elemento (RU)',
    itemPlaceholderEn: 'Elemento (EN)',
    deleteTitle: 'Eliminar',
    addItem: '＋ Añadir elemento',
    saving: 'Guardando…',
    saveTier: 'Guardar tarifa',
    warnHeading: '⚠ ATENCIÓN: se muestra texto de cobertura de ejemplo',
    warnBodyPre: 'Las tarifas marcadas como «EJEMPLO» contienen condiciones de demostración. ',
    warnBodyBold: 'Reemplácelas por las condiciones reales de su póliza de seguro antes del lanzamiento',
    warnBodyPost: ' — un texto de cobertura incorrecto genera riesgo legal. Guardar una tarifa elimina la marca «EJEMPLO».',
    infoText: 'El texto de cobertura se almacena en la base de datos y se edita aquí — no hay nada codificado. Los cambios se ven de inmediato en el proceso de reserva (el paso «Servicios y seguro»).',
  },
  de: {
    statusOpts: [
      { v: 'yes', label: '✓ Inbegriffen' },
      { v: 'partial', label: '~ Teilweise' },
      { v: 'no', label: '✗ Nicht enthalten' },
    ],
    saved: 'Gespeichert ✓ — Platzhalter entfernt',
    errGeneric: 'Fehler',
    placeholderBadge: '⚠ BEISPIEL — ersetzen',
    nameRuLabel: 'NAME (RU)',
    nameEnLabel: 'NAME (EN)',
    excessRuLabel: 'SELBSTBEHALT (RU)',
    excessEnLabel: 'SELBSTBEHALT (EN)',
    descRuLabel: 'BESCHREIBUNG (RU)',
    descEnLabel: 'BESCHREIBUNG (EN)',
    coverageItems: 'DECKUNGSPUNKTE',
    itemPlaceholderRu: 'Punkt (RU)',
    itemPlaceholderEn: 'Punkt (EN)',
    deleteTitle: 'Löschen',
    addItem: '＋ Punkt hinzufügen',
    saving: 'Speichern…',
    saveTier: 'Tarif speichern',
    warnHeading: '⚠ ACHTUNG: Beispiel-Deckungstext wird angezeigt',
    warnBodyPre: 'Mit „BEISPIEL“ markierte Tarife enthalten Demonstrationsbedingungen. ',
    warnBodyBold: 'Ersetzen Sie sie vor dem Start durch die tatsächlichen Bedingungen Ihrer Versicherungspolice',
    warnBodyPost: ' — falscher Deckungstext stellt ein rechtliches Risiko dar. Das Speichern eines Tarifs entfernt die Markierung „BEISPIEL“.',
    infoText: 'Der Deckungstext wird in der Datenbank gespeichert und hier bearbeitet — nichts ist fest im Code hinterlegt. Änderungen erscheinen sofort im Buchungsablauf (Schritt „Leistungen und Versicherung“).',
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
const panel = { background: 'var(--d-panel)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: 20 } as const
const btn = (bg: string, fg: string) => ({ padding: '9px 15px', borderRadius: 9, border: 'none', background: bg, color: fg, font: '700 12px var(--f-ui)', cursor: 'pointer' }) as const

function TierEditor({ tier }: { tier: InsuranceTierAdminView }) {
  const t = useDict(dict)
  const router = useRouter()
  const [nameRu, setNameRu] = useState(tier.nameRu)
  const [nameEn, setNameEn] = useState(tier.nameEn)
  const [descRu, setDescRu] = useState(tier.descRu ?? '')
  const [descEn, setDescEn] = useState(tier.descEn ?? '')
  const [excessRu, setExcessRu] = useState(tier.excessRu ?? '')
  const [excessEn, setExcessEn] = useState(tier.excessEn ?? '')
  const [rows, setRows] = useState<CoverageRowView[]>(tier.coverage)
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const setRow = (i: number, patch: Partial<CoverageRowView>) => setRows((rs) => rs.map((r, k) => (k === i ? { ...r, ...patch } : r)))
  const addRow = () => setRows((rs) => [...rs, { labelRu: '', labelEn: '', status: 'yes' }])
  const delRow = (i: number) => setRows((rs) => rs.filter((_, k) => k !== i))

  const save = () =>
    start(async () => {
      setMsg(null)
      const res = await saveInsuranceTierAction({ key: tier.key, nameRu, nameEn, descRu, descEn, excessRu, excessEn, coverage: rows })
      if (res.ok) { setMsg({ ok: true, text: t.saved }); router.refresh() } else setMsg({ ok: false, text: res.error ?? t.errGeneric })
    })

  return (
    <div style={{ ...panel, borderColor: tier.isPlaceholder ? 'rgba(224,161,6,.35)' : 'rgba(255,255,255,.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ font: '700 15px var(--f-display)', color: 'var(--d-text-bright)' }}>{tier.nameRu} / {tier.nameEn}</span>
        <span style={{ font: '600 10px var(--f-mono)', color: 'var(--d-muted-2)' }}>{tier.key}</span>
        {tier.isPlaceholder && (
          <span style={{ marginLeft: 'auto', padding: '3px 9px', borderRadius: 999, background: 'rgba(224,161,6,.14)', border: '1px solid rgba(224,161,6,.4)', font: '700 10px var(--f-ui)', color: '#E9BE56' }}>
            {t.placeholderBadge}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
        <div><label style={label}>{t.nameRuLabel}</label><input style={input} value={nameRu} onChange={(e) => setNameRu(e.target.value)} /></div>
        <div><label style={label}>{t.nameEnLabel}</label><input style={input} value={nameEn} onChange={(e) => setNameEn(e.target.value)} /></div>
        <div><label style={label}>{t.excessRuLabel}</label><input style={input} value={excessRu} onChange={(e) => setExcessRu(e.target.value)} placeholder="€500" /></div>
        <div><label style={label}>{t.excessEnLabel}</label><input style={input} value={excessEn} onChange={(e) => setExcessEn(e.target.value)} placeholder="€500" /></div>
      </div>
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
        <div><label style={label}>{t.descRuLabel}</label><input style={input} value={descRu} onChange={(e) => setDescRu(e.target.value)} /></div>
        <div><label style={label}>{t.descEnLabel}</label><input style={input} value={descEn} onChange={(e) => setDescEn(e.target.value)} /></div>
      </div>

      <div style={{ marginTop: 16, font: '700 10px var(--f-mono)', letterSpacing: '.1em', color: 'var(--d-muted-2)' }}>{t.coverageItems}</div>
      <div style={{ marginTop: 8, display: 'grid', gap: 7 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px 30px', gap: 7, alignItems: 'center' }}>
            <input style={input} value={r.labelRu} onChange={(e) => setRow(i, { labelRu: e.target.value })} placeholder={t.itemPlaceholderRu} />
            <input style={input} value={r.labelEn} onChange={(e) => setRow(i, { labelEn: e.target.value })} placeholder={t.itemPlaceholderEn} />
            <select style={{ ...input, cursor: 'pointer' }} value={r.status} onChange={(e) => setRow(i, { status: e.target.value as Status })}>
              {t.statusOpts.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
            </select>
            <button type="button" onClick={() => delRow(i)} style={{ ...btn('rgba(224,69,69,.14)', 'var(--d-red)'), padding: '8px 0' }} title={t.deleteTitle}>✕</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addRow} style={{ ...btn('var(--d-card)', 'var(--d-text)'), marginTop: 8, border: '1px solid rgba(255,255,255,.12)' }}>{t.addItem}</button>

      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" onClick={save} disabled={pending} style={btn('var(--d-accent)', '#082A33')}>{pending ? t.saving : t.saveTier}</button>
        {msg && <span style={{ font: '600 12px var(--f-ui)', color: msg.ok ? 'var(--d-green)' : 'var(--d-red)' }}>{msg.text}</span>}
      </div>
    </div>
  )
}

export default function InsuranceAdmin({ tiers, anyPlaceholder }: { tiers: InsuranceTierAdminView[]; anyPlaceholder: boolean }) {
  const t = useDict(dict)
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {anyPlaceholder && (
        <div style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(224,69,69,.10)', border: '1.5px solid rgba(224,69,69,.45)' }}>
          <div style={{ font: '800 14px var(--f-ui)', color: '#FF8A7A' }}>{t.warnHeading}</div>
          <div style={{ marginTop: 6, font: '500 12.5px/1.6 var(--f-ui)', color: 'var(--d-text)' }}>
            {t.warnBodyPre}<b>{t.warnBodyBold}</b>{t.warnBodyPost}
          </div>
        </div>
      )}
      <div style={{ font: '400 12px/1.6 var(--f-ui)', color: 'var(--d-muted)' }}>{t.infoText}</div>
      {tiers.map((tier) => <TierEditor key={tier.key} tier={tier} />)}
    </div>
  )
}
