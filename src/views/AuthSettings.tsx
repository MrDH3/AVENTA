'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { saveAuthProviderAction, type ProviderSaveResult } from '@/server/provider-actions'
import { useDict, type Dict } from '../i18n/lang'

export interface ProviderStatusView {
  provider: 'google' | 'yandex' | 'telegram'
  clientId: string | null
  enabled: boolean
  hasSecret: boolean
  configured: boolean
  source: 'db' | 'env' | 'none'
}

interface Strings {
  // intro paragraph (split around a <b> emphasis span)
  introBefore: string
  introBold: string
  introAfter: string
  // per-provider field labels (technical/brand terms kept verbatim; only the Yandex secret hint varies)
  idLabels: Record<ProviderStatusView['provider'], string>
  secretLabels: Record<ProviderStatusView['provider'], string>
  // status badge text
  statusEnabledConfigured: string
  statusConfiguredDisabled: string
  statusNoKeys: string
  // save button
  saving: string
  save: string
  // secret field placeholders + hints
  secretPlaceholderSaved: string
  secretPlaceholderNew: string
  secretSavedHint: string
  secretNotSetHint: string
  // enable toggle
  enableLogin: (name: string) => string
  // save result
  saved: string
  // the callback URL / domain to register in the provider console
  callbackLabel: string
  domainLabel: string
}

const dict: Dict<Strings> = {
  ru: {
    introBefore: 'Управляйте входом через соцсети прямо здесь — без правки файлов. Client ID хранится как есть, ',
    introBold: 'секрет шифруется (AES-256-GCM) и никогда не показывается обратно',
    introAfter: '. Выключите провайдера — и его кнопка исчезнет со страницы входа.',
    idLabels: { google: 'Client ID', yandex: 'Client ID', telegram: 'Bot username (@name)' },
    secretLabels: { google: 'Client Secret', yandex: 'Client Secret (пароль)', telegram: 'Bot token' },
    statusEnabledConfigured: 'Включён и настроен',
    statusConfiguredDisabled: 'Настроен, но выключен',
    statusNoKeys: 'Нет ключей',
    saving: 'Сохранение…',
    save: 'Сохранить',
    secretPlaceholderSaved: '•••• •••• •••• (сохранён — оставьте пустым)',
    secretPlaceholderNew: 'Введите секрет',
    secretSavedHint: 'Секрет сохранён ✓ — введите новый, чтобы заменить (текущий не показывается)',
    secretNotSetHint: 'Секрет ещё не задан',
    enableLogin: (name) => `Включить вход через ${name}`,
    saved: 'Сохранено ✓',
    callbackLabel: 'Redirect URI — вставьте в консоль провайдера',
    domainLabel: 'Домен — укажите в @BotFather → /setdomain',
  },
  en: {
    introBefore: 'Manage social logins right here — no file editing needed. The Client ID is stored as-is, ',
    introBold: 'the secret is encrypted (AES-256-GCM) and is never shown again',
    introAfter: '. Disable a provider — and its button disappears from the login page.',
    idLabels: { google: 'Client ID', yandex: 'Client ID', telegram: 'Bot username (@name)' },
    secretLabels: { google: 'Client Secret', yandex: 'Client Secret (password)', telegram: 'Bot token' },
    statusEnabledConfigured: 'Enabled and configured',
    statusConfiguredDisabled: 'Configured but disabled',
    statusNoKeys: 'No keys',
    saving: 'Saving…',
    save: 'Save',
    secretPlaceholderSaved: '•••• •••• •••• (saved — leave blank)',
    secretPlaceholderNew: 'Enter secret',
    secretSavedHint: 'Secret saved ✓ — enter a new one to replace it (the current one is not shown)',
    secretNotSetHint: 'Secret not set yet',
    enableLogin: (name) => `Enable login via ${name}`,
    saved: 'Saved ✓',
    callbackLabel: 'Redirect URI — paste into the provider console',
    domainLabel: 'Domain — set in @BotFather → /setdomain',
  },
  tr: {
    introBefore: 'Sosyal girişleri doğrudan buradan yönetin — dosya düzenlemeye gerek yok. Client ID olduğu gibi saklanır, ',
    introBold: 'gizli anahtar şifrelenir (AES-256-GCM) ve asla geri gösterilmez',
    introAfter: '. Bir sağlayıcıyı kapatın — düğmesi giriş sayfasından kaybolur.',
    idLabels: { google: 'Client ID', yandex: 'Client ID', telegram: 'Bot username (@name)' },
    secretLabels: { google: 'Client Secret', yandex: 'Client Secret (şifre)', telegram: 'Bot token' },
    statusEnabledConfigured: 'Etkin ve yapılandırıldı',
    statusConfiguredDisabled: 'Yapılandırıldı ama kapalı',
    statusNoKeys: 'Anahtar yok',
    saving: 'Kaydediliyor…',
    save: 'Kaydet',
    secretPlaceholderSaved: '•••• •••• •••• (kayıtlı — boş bırakın)',
    secretPlaceholderNew: 'Gizli anahtarı girin',
    secretSavedHint: 'Gizli anahtar kaydedildi ✓ — değiştirmek için yenisini girin (mevcut olan gösterilmez)',
    secretNotSetHint: 'Gizli anahtar henüz ayarlanmadı',
    enableLogin: (name) => `${name} ile girişi etkinleştir`,
    saved: 'Kaydedildi ✓',
    callbackLabel: 'Redirect URI — sağlayıcı konsoluna yapıştırın',
    domainLabel: 'Alan adı — @BotFather → /setdomain ile ayarlayın',
  },
  es: {
    introBefore: 'Gestione los inicios de sesión sociales aquí mismo — sin editar archivos. El Client ID se guarda tal cual, ',
    introBold: 'el secreto se cifra (AES-256-GCM) y nunca se vuelve a mostrar',
    introAfter: '. Desactive un proveedor — y su botón desaparecerá de la página de inicio de sesión.',
    idLabels: { google: 'Client ID', yandex: 'Client ID', telegram: 'Bot username (@name)' },
    secretLabels: { google: 'Client Secret', yandex: 'Client Secret (contraseña)', telegram: 'Bot token' },
    statusEnabledConfigured: 'Activado y configurado',
    statusConfiguredDisabled: 'Configurado pero desactivado',
    statusNoKeys: 'Sin claves',
    saving: 'Guardando…',
    save: 'Guardar',
    secretPlaceholderSaved: '•••• •••• •••• (guardado — deje en blanco)',
    secretPlaceholderNew: 'Introduzca el secreto',
    secretSavedHint: 'Secreto guardado ✓ — introduzca uno nuevo para reemplazarlo (el actual no se muestra)',
    secretNotSetHint: 'El secreto aún no está configurado',
    enableLogin: (name) => `Activar el inicio de sesión con ${name}`,
    saved: 'Guardado ✓',
    callbackLabel: 'Redirect URI — pégalo en la consola del proveedor',
    domainLabel: 'Dominio — configúralo en @BotFather → /setdomain',
  },
  de: {
    introBefore: 'Verwalten Sie Social Logins direkt hier — ohne Dateien zu bearbeiten. Die Client ID wird unverändert gespeichert, ',
    introBold: 'das Secret wird verschlüsselt (AES-256-GCM) und nie wieder angezeigt',
    introAfter: '. Deaktivieren Sie einen Anbieter — und seine Schaltfläche verschwindet von der Anmeldeseite.',
    idLabels: { google: 'Client ID', yandex: 'Client ID', telegram: 'Bot username (@name)' },
    secretLabels: { google: 'Client Secret', yandex: 'Client Secret (Passwort)', telegram: 'Bot token' },
    statusEnabledConfigured: 'Aktiviert und konfiguriert',
    statusConfiguredDisabled: 'Konfiguriert, aber deaktiviert',
    statusNoKeys: 'Keine Schlüssel',
    saving: 'Wird gespeichert…',
    save: 'Speichern',
    secretPlaceholderSaved: '•••• •••• •••• (gespeichert — leer lassen)',
    secretPlaceholderNew: 'Secret eingeben',
    secretSavedHint: 'Secret gespeichert ✓ — geben Sie ein neues ein, um es zu ersetzen (das aktuelle wird nicht angezeigt)',
    secretNotSetHint: 'Secret noch nicht festgelegt',
    enableLogin: (name) => `Anmeldung über ${name} aktivieren`,
    saved: 'Gespeichert ✓',
    callbackLabel: 'Redirect URI — in die Anbieter-Konsole einfügen',
    domainLabel: 'Domain — in @BotFather → /setdomain festlegen',
  },
}

const META: Record<
  ProviderStatusView['provider'],
  { name: string; help: string; badge: string }
> = {
  google: { name: 'Google', help: 'console.cloud.google.com → Credentials · redirect: /api/auth/oauth/google/callback', badge: 'G' },
  yandex: { name: 'Yandex', help: 'oauth.yandex.ru · redirect: /api/auth/oauth/yandex/callback', badge: 'Я' },
  telegram: { name: 'Telegram', help: '@BotFather → /newbot · /setdomain to your host', badge: '✈' },
}

function statusBadge(s: ProviderStatusView, t: Strings): { dot: string; text: string; color: string } {
  if (s.enabled && s.configured) return { dot: '🟢', text: t.statusEnabledConfigured, color: 'var(--d-green)' }
  if (s.configured && !s.enabled) return { dot: '⚪', text: t.statusConfiguredDisabled, color: 'var(--d-muted)' }
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

function SaveButton() {
  const { pending } = useFormStatus()
  const t = useDict(dict)
  return (
    <button
      type="submit"
      disabled={pending}
      style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'var(--d-accent)', color: '#082A33', font: '700 13px var(--f-ui)', cursor: 'pointer' }}
    >
      {pending ? t.saving : t.save}
    </button>
  )
}

function ProviderCard({ s, appUrl }: { s: ProviderStatusView; appUrl: string }) {
  const t = useDict(dict)
  const meta = META[s.provider]
  const host = appUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  const callbackValue = s.provider === 'telegram' ? host : `${appUrl}/api/auth/oauth/${s.provider}/callback`
  const badge = statusBadge(s, t)
  const [state, action] = useFormState<ProviderSaveResult, FormData>(saveAuthProviderAction, { ok: false })

  return (
    <form
      action={action}
      style={{ background: 'var(--d-panel)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: 22 }}
    >
      <input type="hidden" name="provider" value={s.provider} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--d-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 15px var(--f-display)', color: 'var(--d-text)' }}>{meta.badge}</span>
          <div style={{ font: '600 16px var(--f-display)', color: 'var(--d-text-bright)' }}>{meta.name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, font: '600 12px var(--f-ui)', color: badge.color }}>
          <span>{badge.dot}</span>
          {badge.text}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={label}>{t.idLabels[s.provider].toUpperCase()}</label>
        <input name="clientId" defaultValue={s.clientId ?? ''} placeholder="—" style={input} autoComplete="off" />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={label}>{t.secretLabels[s.provider].toUpperCase()}</label>
        <input
          name="clientSecret"
          type="password"
          autoComplete="new-password"
          placeholder={s.hasSecret ? t.secretPlaceholderSaved : t.secretPlaceholderNew}
          style={input}
        />
        <div style={{ marginTop: 6, font: '500 11px var(--f-ui)', color: s.hasSecret ? 'var(--d-green)' : 'var(--d-muted-2)' }}>
          {s.hasSecret ? t.secretSavedHint : t.secretNotSetHint}
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }}>
        <input type="checkbox" name="enabled" defaultChecked={s.enabled} style={{ width: 18, height: 18, accentColor: '#FF7A5C' }} />
        <span style={{ font: '600 13px var(--f-ui)', color: 'var(--d-text)' }}>{t.enableLogin(meta.name)}</span>
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <SaveButton />
        {state.ok && <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-green)' }}>{t.saved}</span>}
        {state.error && <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-red)' }}>{state.error}</span>}
      </div>

      {/* Exact value to register in the provider console — built from APP_URL, so a wrong APP_URL shows here. */}
      <div style={{ marginTop: 14 }}>
        <label style={label}>{(s.provider === 'telegram' ? t.domainLabel : t.callbackLabel).toUpperCase()}</label>
        <div style={{ userSelect: 'all', wordBreak: 'break-all', padding: '9px 11px', borderRadius: 9, border: '1px solid rgba(255,255,255,.14)', background: 'var(--d-base)', color: 'var(--d-text)', font: '500 12px var(--f-mono,monospace)' }}>{callbackValue}</div>
      </div>

      <div style={{ marginTop: 12, font: '400 10px var(--f-mono)', color: 'var(--d-muted-2)' }}>{meta.help}</div>
    </form>
  )
}

export default function AuthSettings({ statuses, appUrl }: { statuses: ProviderStatusView[]; appUrl: string }) {
  const t = useDict(dict)
  return (
    <div>
      <div style={{ font: '400 13px/1.6 var(--f-ui)', color: 'var(--d-muted)', maxWidth: 640, marginBottom: 20 }}>
        {t.introBefore}
        <b>{t.introBold}</b>
        {t.introAfter}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
        {statuses.map((s) => (
          <ProviderCard key={s.provider} s={s} appUrl={appUrl} />
        ))}
      </div>
    </div>
  )
}
