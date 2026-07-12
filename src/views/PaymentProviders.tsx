'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { savePaymentProviderAction, type PaymentProviderSaveResult } from '@/server/payment-provider-actions'
import { useDict, type Dict } from '../i18n/lang'

/** Browser-safe status (no secrets) — mirrors lib/payment-providers PaymentProviderStatus. */
export interface ProviderFieldView {
  key: string
  label: string
  secret: boolean
  placeholder?: string
  required: boolean
  value: string | null
  hasValue: boolean
}
export interface PaymentProviderView {
  key: string
  name: string
  enabled: boolean
  capabilities: { cards: boolean; crypto: boolean; refunds: boolean }
  blocked: boolean
  blockedNote?: string
  help: string
  fields: ProviderFieldView[]
  configured: boolean
  available: boolean
}

const BADGES: Record<string, string> = {
  stripe: 'S',
  paypal: 'PP',
  paytr: 'PT',
  iyzico: 'iy',
}

interface Strings {
  // status badge (statusBadge helper)
  statusBlocked: string
  statusEnabled: string
  statusConfiguredOff: string
  statusNoKeys: string
  // save button
  saving: string
  saveBlocked: string
  save: string
  // capability chips
  capCards: string
  capCrypto: string
  // field label
  optional: string
  // secret field
  secretPlaceholderSaved: string
  secretPlaceholderEmpty: string
  secretStatusSaved: string
  secretStatusEmpty: string
  // enable checkbox
  acceptVia: (name: string) => string
  blockedActivateHint: string
  // save result
  savedOk: string
  // intro paragraph (segmented around the two <b> spans)
  introP1: string
  introBold1: string
  introP2: string
  introBold2: string
  introP3: string
}

const dict: Dict<Strings> = {
  ru: {
    statusBlocked: 'Заблокировано (юрисдикция)',
    statusEnabled: 'Включён и настроен',
    statusConfiguredOff: 'Настроен, выключен',
    statusNoKeys: 'Нет ключей',
    saving: 'Сохранение…',
    saveBlocked: 'Сохранить (пока заблокирован)',
    save: 'Сохранить',
    capCards: 'Карты',
    capCrypto: 'Крипто',
    optional: 'необязательно',
    secretPlaceholderSaved: '•••• •••• •••• (сохранён — оставьте пустым)',
    secretPlaceholderEmpty: 'Введите значение',
    secretStatusSaved: 'Сохранён ✓ — введите новый, чтобы заменить (текущий не показывается)',
    secretStatusEmpty: 'Ещё не задан',
    acceptVia: (name) => `Принимать оплату через ${name}`,
    blockedActivateHint: '(не активируется, пока заблокирован)',
    savedOk: 'Сохранено ✓',
    introP1: 'Все платёжные процессоры настраиваются и включаются здесь — без правки кода. Открытые поля (publishable key, merchant id) хранятся как есть; ',
    introBold1: 'секретные ключи шифруются (AES-256-GCM) и никогда не показываются обратно',
    introP2: '. Провайдер появляется в оформлении брони только когда он ',
    introBold2: 'включён, настроен и не заблокирован',
    introP3: '. Пока ни один не настроен — оплата идёт через ручной банковский перевод.',
  },
  en: {
    statusBlocked: 'Blocked (jurisdiction)',
    statusEnabled: 'Enabled and configured',
    statusConfiguredOff: 'Configured, disabled',
    statusNoKeys: 'No keys',
    saving: 'Saving…',
    saveBlocked: 'Save (still blocked)',
    save: 'Save',
    capCards: 'Cards',
    capCrypto: 'Crypto',
    optional: 'optional',
    secretPlaceholderSaved: '•••• •••• •••• (saved — leave empty)',
    secretPlaceholderEmpty: 'Enter a value',
    secretStatusSaved: 'Saved ✓ — enter a new one to replace it (the current value is not shown)',
    secretStatusEmpty: 'Not set yet',
    acceptVia: (name) => `Accept payment via ${name}`,
    blockedActivateHint: '(will not activate while blocked)',
    savedOk: 'Saved ✓',
    introP1: 'All payment processors are configured and enabled here — with no code changes. Public fields (publishable key, merchant id) are stored as-is; ',
    introBold1: 'secret keys are encrypted (AES-256-GCM) and never shown back',
    introP2: '. A provider appears in booking checkout only when it is ',
    introBold2: 'enabled, configured and not blocked',
    introP3: '. While none is configured — payment goes through a manual bank transfer.',
  },
  tr: {
    statusBlocked: 'Engellendi (yargı bölgesi)',
    statusEnabled: 'Etkin ve yapılandırıldı',
    statusConfiguredOff: 'Yapılandırıldı, devre dışı',
    statusNoKeys: 'Anahtar yok',
    saving: 'Kaydediliyor…',
    saveBlocked: 'Kaydet (hâlâ engelli)',
    save: 'Kaydet',
    capCards: 'Kartlar',
    capCrypto: 'Kripto',
    optional: 'isteğe bağlı',
    secretPlaceholderSaved: '•••• •••• •••• (kaydedildi — boş bırakın)',
    secretPlaceholderEmpty: 'Bir değer girin',
    secretStatusSaved: 'Kaydedildi ✓ — değiştirmek için yenisini girin (mevcut değer gösterilmez)',
    secretStatusEmpty: 'Henüz ayarlanmadı',
    acceptVia: (name) => `${name} ile ödeme kabul et`,
    blockedActivateHint: '(engelliyken etkinleşmez)',
    savedOk: 'Kaydedildi ✓',
    introP1: 'Tüm ödeme işlemcileri kod değişikliği olmadan burada yapılandırılır ve etkinleştirilir. Açık alanlar (publishable key, merchant id) olduğu gibi saklanır; ',
    introBold1: 'gizli anahtarlar şifrelenir (AES-256-GCM) ve asla geri gösterilmez',
    introP2: '. Bir sağlayıcı yalnızca ',
    introBold2: 'etkin, yapılandırılmış ve engellenmemiş',
    introP3: ' olduğunda rezervasyon ödemesinde görünür. Hiçbiri yapılandırılmadığı sürece — ödeme manuel banka havalesiyle alınır.',
  },
  es: {
    statusBlocked: 'Bloqueado (jurisdicción)',
    statusEnabled: 'Activado y configurado',
    statusConfiguredOff: 'Configurado, desactivado',
    statusNoKeys: 'Sin claves',
    saving: 'Guardando…',
    saveBlocked: 'Guardar (aún bloqueado)',
    save: 'Guardar',
    capCards: 'Tarjetas',
    capCrypto: 'Cripto',
    optional: 'opcional',
    secretPlaceholderSaved: '•••• •••• •••• (guardada — deje vacío)',
    secretPlaceholderEmpty: 'Introduzca un valor',
    secretStatusSaved: 'Guardada ✓ — introduzca una nueva para reemplazarla (el valor actual no se muestra)',
    secretStatusEmpty: 'Aún no configurada',
    acceptVia: (name) => `Aceptar pagos con ${name}`,
    blockedActivateHint: '(no se activará mientras esté bloqueado)',
    savedOk: 'Guardado ✓',
    introP1: 'Todos los procesadores de pago se configuran y activan aquí, sin tocar el código. Los campos públicos (publishable key, merchant id) se guardan tal cual; ',
    introBold1: 'las claves secretas se cifran (AES-256-GCM) y nunca se vuelven a mostrar',
    introP2: '. Un proveedor aparece en el proceso de reserva solo cuando está ',
    introBold2: 'activado, configurado y no bloqueado',
    introP3: '. Mientras no haya ninguno configurado, el pago se realiza mediante transferencia bancaria manual.',
  },
  de: {
    statusBlocked: 'Gesperrt (Rechtsraum)',
    statusEnabled: 'Aktiviert und konfiguriert',
    statusConfiguredOff: 'Konfiguriert, deaktiviert',
    statusNoKeys: 'Keine Schlüssel',
    saving: 'Speichern…',
    saveBlocked: 'Speichern (noch gesperrt)',
    save: 'Speichern',
    capCards: 'Karten',
    capCrypto: 'Krypto',
    optional: 'optional',
    secretPlaceholderSaved: '•••• •••• •••• (gespeichert — leer lassen)',
    secretPlaceholderEmpty: 'Wert eingeben',
    secretStatusSaved: 'Gespeichert ✓ — neuen eingeben, um ihn zu ersetzen (der aktuelle Wert wird nicht angezeigt)',
    secretStatusEmpty: 'Noch nicht festgelegt',
    acceptVia: (name) => `Zahlung über ${name} akzeptieren`,
    blockedActivateHint: '(wird nicht aktiviert, solange gesperrt)',
    savedOk: 'Gespeichert ✓',
    introP1: 'Alle Zahlungsdienstleister werden hier konfiguriert und aktiviert — ohne Codeänderung. Öffentliche Felder (publishable key, merchant id) werden unverändert gespeichert; ',
    introBold1: 'geheime Schlüssel werden verschlüsselt (AES-256-GCM) und nie wieder angezeigt',
    introP2: '. Ein Anbieter erscheint nur dann im Buchungs-Checkout, wenn er ',
    introBold2: 'aktiviert, konfiguriert und nicht gesperrt',
    introP3: ' ist. Solange keiner konfiguriert ist, erfolgt die Zahlung per manueller Banküberweisung.',
  },
}

function statusBadge(s: PaymentProviderView, t: Strings): { dot: string; text: string; color: string } {
  if (s.blocked) return { dot: '🔒', text: t.statusBlocked, color: '#E0A106' }
  if (s.available) return { dot: '🟢', text: t.statusEnabled, color: 'var(--d-green)' }
  if (s.configured && !s.enabled) return { dot: '⚪', text: t.statusConfiguredOff, color: 'var(--d-muted)' }
  return { dot: '🔴', text: t.statusNoKeys, color: 'var(--d-red)' }
}

const input = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,.12)',
  background: 'var(--d-base)',
  color: 'var(--d-text)',
  font: '500 13px var(--f-ui)',
} as const
const label = { font: '400 10px var(--f-mono)', letterSpacing: '.1em', color: 'var(--d-muted-2)', marginBottom: 6, display: 'block' } as const

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ padding: '2px 9px', borderRadius: 999, background: 'var(--d-card)', border: '1px solid rgba(255,255,255,.08)', font: '600 10px var(--f-ui)', color: 'var(--d-muted)', letterSpacing: '.02em' }}>
      {children}
    </span>
  )
}

function SaveButton({ blocked }: { blocked: boolean }) {
  const t = useDict(dict)
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'var(--d-accent)', color: '#082A33', font: '700 13px var(--f-ui)', cursor: 'pointer', opacity: pending ? 0.6 : 1 }}
    >
      {pending ? t.saving : blocked ? t.saveBlocked : t.save}
    </button>
  )
}

function ProviderCard({ s }: { s: PaymentProviderView }) {
  const t = useDict(dict)
  const badge = statusBadge(s, t)
  const [state, action] = useFormState<PaymentProviderSaveResult, FormData>(savePaymentProviderAction, { ok: false })

  return (
    <form
      action={action}
      style={{ background: 'var(--d-panel)', border: `1px solid ${s.blocked ? 'rgba(224,161,6,.28)' : 'rgba(255,255,255,.07)'}`, borderRadius: 16, padding: 22, opacity: s.blocked ? 0.92 : 1 }}
    >
      <input type="hidden" name="provider" value={s.key} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--d-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 13px var(--f-display)', color: 'var(--d-text)' }}>{BADGES[s.key] ?? '•'}</span>
          <div>
            <div style={{ font: '600 16px var(--f-display)', color: 'var(--d-text-bright)' }}>{s.name}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              {s.capabilities.cards && <Chip>{t.capCards}</Chip>}
              {s.capabilities.crypto && <Chip>{t.capCrypto}</Chip>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, font: '600 12px var(--f-ui)', color: badge.color }}>
          <span>{badge.dot}</span>
          {badge.text}
        </div>
      </div>

      {s.blocked && s.blockedNote && (
        <div style={{ marginBottom: 16, padding: '11px 13px', borderRadius: 11, background: 'rgba(224,161,6,.09)', border: '1px solid rgba(224,161,6,.3)', font: '500 12px/1.5 var(--f-ui)', color: '#E9BE56' }}>
          ⚠ {s.blockedNote}
        </div>
      )}

      {s.fields.map((f) => (
        <div key={f.key} style={{ marginBottom: 13 }}>
          <label style={label}>
            {f.label.toUpperCase()}
            {!f.required && <span style={{ color: 'var(--d-muted-2)', textTransform: 'none', letterSpacing: 0 }}> · {t.optional}</span>}
          </label>
          {f.secret ? (
            <>
              <input
                name={f.key}
                type="password"
                autoComplete="new-password"
                placeholder={f.hasValue ? t.secretPlaceholderSaved : t.secretPlaceholderEmpty}
                style={input}
              />
              <div style={{ marginTop: 5, font: '500 10px var(--f-ui)', color: f.hasValue ? 'var(--d-green)' : 'var(--d-muted-2)' }}>
                {f.hasValue ? t.secretStatusSaved : t.secretStatusEmpty}
              </div>
            </>
          ) : (
            <input name={f.key} defaultValue={f.value ?? ''} placeholder="—" style={input} autoComplete="off" />
          )}
        </div>
      ))}

      <label style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0', cursor: 'pointer' }}>
        <input type="checkbox" name="enabled" defaultChecked={s.enabled} style={{ width: 18, height: 18, accentColor: '#FF7A5C' }} />
        <span style={{ font: '600 13px var(--f-ui)', color: 'var(--d-text)' }}>
          {t.acceptVia(s.name)}
          {s.blocked && <span style={{ color: 'var(--d-muted-2)', fontWeight: 400 }}> {t.blockedActivateHint}</span>}
        </span>
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <SaveButton blocked={s.blocked} />
        {state.ok && <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-green)' }}>{t.savedOk}</span>}
        {state.error && <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-red)' }}>{state.error}</span>}
      </div>

      <div style={{ marginTop: 12, font: '400 10px var(--f-mono)', color: 'var(--d-muted-2)' }}>{s.help}</div>
    </form>
  )
}

export default function PaymentProviders({ statuses }: { statuses: PaymentProviderView[] }) {
  const t = useDict(dict)
  return (
    <div>
      <div style={{ font: '400 13px/1.6 var(--f-ui)', color: 'var(--d-muted)', maxWidth: 680, marginBottom: 20 }}>
        {t.introP1}<b>{t.introBold1}</b>{t.introP2}<b>{t.introBold2}</b>{t.introP3}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(330px,1fr))', gap: 16 }}>
        {statuses.map((s) => (
          <ProviderCard key={s.key} s={s} />
        ))}
      </div>
    </div>
  )
}
