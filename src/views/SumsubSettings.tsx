'use client'

import { useState, useTransition } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { saveSumsubConfigAction, type SumsubSaveResult } from '@/server/sumsub-actions'
import { runRetentionSweepAction } from '@/server/id-document-actions'
import { saveVerificationMethodAction } from '@/server/verification-actions'
import { useDict, type Dict } from '../i18n/lang'

export interface SumsubConfigView {
  enabled: boolean
  levelName: string
  hasAppToken: boolean
  hasSecretKey: boolean
  hasWebhookSecret: boolean
  configured: boolean
}

interface Strings {
  // SaveButton
  save: string
  saving: string
  // SecretField
  secretSavedPlaceholder: string
  secretEnterValue: string
  secretSavedHint: string
  secretNotSet: string
  // retention sweep result
  sweepDone: (purged: number, usersPurged: number, retentionDays: number) => string
  sweepError: string
  // status badge
  badgeConfigured: string
  badgePartial: string
  badgeNotConfigured: string
  // verification methods
  methodManualTitle: string
  methodManualDesc: string
  methodSumsubTitle: string
  methodSumsubDesc: string
  // method section
  methodSectionTitle: string
  methodIntroA: string
  methodIntroBold: string
  methodIntroB: string
  active: string
  // sumsub description
  sumsubDescA: string
  sumsubDescBold: string
  sumsubDescC: string
  sumsubDescD: string
  sumsubDescE: string
  // level name field
  levelNameLabel: string
  levelNamePlaceholder: string
  levelNameHint: string
  // retention days field
  retentionLabel: string
  retentionHint: string
  // webhook secret field title
  webhookSecretTitle: string
  // enable toggle
  enableToggle: string
  // save state
  saved: string
  // webhook url card
  webhookUrlLabel: string
  webhookHintA: string
  webhookHintB: string
  // retention section
  retentionSectionTitle: string
  retentionBodyA: string
  retentionBodyBold: string
  retentionBodyB: string
  retentionDaysBold: (n: number) => string
  retentionBodyC: string
  retentionBodyD: string
  retentionBodyE: string
  runSweepNow: string
  sweeping: string
}

const dict: Dict<Strings> = {
  ru: {
    save: 'Сохранить',
    saving: 'Сохранение…',
    secretSavedPlaceholder: '•••• •••• (сохранён — оставьте пустым)',
    secretEnterValue: 'Введите значение',
    secretSavedHint: 'Сохранён ✓ — введите новый, чтобы заменить (текущий не показывается)',
    secretNotSet: 'Ещё не задан',
    sweepDone: (purged, usersPurged, retentionDays) => `Готово: удалено ${purged} документ(ов) у ${usersPurged} клиент(ов) (старше ${retentionDays} дн.)`,
    sweepError: 'Ошибка',
    badgeConfigured: 'Включён и настроен',
    badgePartial: 'Настроен частично',
    badgeNotConfigured: 'Не настроен',
    methodManualTitle: 'Ручная проверка (админ)',
    methodManualDesc: 'Клиент загружает документы → админ проверяет и одобряет. Активно сейчас.',
    methodSumsubTitle: 'Sumsub (авто-KYC)',
    methodSumsubDesc: 'Автоматическая проверка. Требует ключи ниже. Готово к включению позже.',
    methodSectionTitle: 'Метод проверки личности',
    methodIntroA: 'Единый вопрос для бронирования — «клиент проверен?» — на него отвечает ',
    methodIntroBold: 'активный метод',
    methodIntroB: '. Переключение — это только смена настройки.',
    active: 'АКТИВНО',
    sumsubDescA: 'Проверка личности через Sumsub (паспорт/ID + водительское удостоверение + селфи/liveness). Ключи хранятся ',
    sumsubDescBold: 'зашифрованными (AES-256-GCM) и никогда не возвращаются в браузер',
    sumsubDescC: '. Для теста используйте ',
    sumsubDescD: '-ключи (app token вида ',
    sumsubDescE: ') и уровень (level) из Sandbox, покрывающий документ + права + liveness.',
    levelNameLabel: 'LEVEL NAME (УРОВЕНЬ ПРОВЕРКИ)',
    levelNamePlaceholder: 'напр. id-and-driving-license',
    levelNameHint: 'Точное имя уровня из панели Sumsub (регистр важен). Уровень должен требовать документ ID + вод. удостоверение + селфи.',
    retentionLabel: 'СРОК ХРАНЕНИЯ ДОКУМЕНТОВ (ДНЕЙ)',
    retentionHint: 'Изображения документов удаляются из зашифрованного хранилища после этого срока (при отсутствии активной аренды).',
    webhookSecretTitle: 'WEBHOOK SECRET (для проверки подписи вебхука)',
    enableToggle: 'Включить проверку личности на шаге «Данные»',
    saved: 'Сохранено ✓',
    webhookUrlLabel: 'WEBHOOK URL (укажите в Sumsub → Dev space → Webhooks)',
    webhookHintA: 'Секрет вебхука, заданный здесь, должен совпадать с «secret key» вебхука в панели Sumsub. Подпись каждого вебхука проверяется (HMAC, заголовок ',
    webhookHintB: ') — неподписанные/поддельные запросы отклоняются.',
    retentionSectionTitle: 'Хранение и удаление ID-документов',
    retentionBodyA: 'Изображения документов (паспорт/ID, права) хранятся ',
    retentionBodyBold: 'только в зашифрованном хранилище',
    retentionBodyB: ' и удаляются по истечении срока хранения (',
    retentionDaysBold: (n) => `${n} дн.`,
    retentionBodyC: '). Плановое удаление — cron на ',
    retentionBodyD: ' (защищён ',
    retentionBodyE: '). Можно удалить документы конкретного клиента в карточке брони.',
    runSweepNow: 'Запустить удаление сейчас',
    sweeping: 'Выполняется…',
  },
  en: {
    save: 'Save',
    saving: 'Saving…',
    secretSavedPlaceholder: '•••• •••• (saved — leave empty)',
    secretEnterValue: 'Enter a value',
    secretSavedHint: 'Saved ✓ — enter a new one to replace it (the current value is not shown)',
    secretNotSet: 'Not set yet',
    sweepDone: (purged, usersPurged, retentionDays) => `Done: deleted ${purged} document(s) for ${usersPurged} customer(s) (older than ${retentionDays} d.)`,
    sweepError: 'Error',
    badgeConfigured: 'Enabled and configured',
    badgePartial: 'Partially configured',
    badgeNotConfigured: 'Not configured',
    methodManualTitle: 'Manual review (admin)',
    methodManualDesc: 'The customer uploads documents → an admin reviews and approves. Active now.',
    methodSumsubTitle: 'Sumsub (auto-KYC)',
    methodSumsubDesc: 'Automated verification. Requires the keys below. Ready to enable later.',
    methodSectionTitle: 'Identity verification method',
    methodIntroA: 'A single question for the booking — “is the customer verified?” — is answered by the ',
    methodIntroBold: 'active method',
    methodIntroB: '. Switching is just a settings change.',
    active: 'ACTIVE',
    sumsubDescA: 'Identity verification via Sumsub (passport/ID + driving licence + selfie/liveness). Keys are stored ',
    sumsubDescBold: 'encrypted (AES-256-GCM) and are never returned to the browser',
    sumsubDescC: '. For testing, use ',
    sumsubDescD: ' keys (app token like ',
    sumsubDescE: ') and a level from Sandbox covering document + licence + liveness.',
    levelNameLabel: 'LEVEL NAME (VERIFICATION LEVEL)',
    levelNamePlaceholder: 'e.g. id-and-driving-license',
    levelNameHint: 'Exact level name from the Sumsub console (case-sensitive). The level must require an ID document + driving licence + selfie.',
    retentionLabel: 'DOCUMENT RETENTION PERIOD (DAYS)',
    retentionHint: 'Document images are deleted from encrypted storage after this period (when there is no active rental).',
    webhookSecretTitle: 'WEBHOOK SECRET (for webhook signature verification)',
    enableToggle: 'Enable identity verification at the “Details” step',
    saved: 'Saved ✓',
    webhookUrlLabel: 'WEBHOOK URL (set it in Sumsub → Dev space → Webhooks)',
    webhookHintA: 'The webhook secret set here must match the webhook “secret key” in the Sumsub console. Every webhook signature is verified (HMAC, header ',
    webhookHintB: ') — unsigned/forged requests are rejected.',
    retentionSectionTitle: 'Storage and deletion of ID documents',
    retentionBodyA: 'Document images (passport/ID, licence) are stored ',
    retentionBodyBold: 'only in encrypted storage',
    retentionBodyB: ' and are deleted after the retention period (',
    retentionDaysBold: (n) => `${n} days`,
    retentionBodyC: '). Scheduled deletion runs via cron at ',
    retentionBodyD: ' (protected by ',
    retentionBodyE: '). You can delete the documents of a specific customer from the booking card.',
    runSweepNow: 'Run deletion now',
    sweeping: 'Running…',
  },
  tr: {
    save: 'Kaydet',
    saving: 'Kaydediliyor…',
    secretSavedPlaceholder: '•••• •••• (kayıtlı — boş bırakın)',
    secretEnterValue: 'Bir değer girin',
    secretSavedHint: 'Kayıtlı ✓ — değiştirmek için yenisini girin (mevcut değer gösterilmez)',
    secretNotSet: 'Henüz ayarlanmadı',
    sweepDone: (purged, usersPurged, retentionDays) => `Tamamlandı: ${usersPurged} müşteriye ait ${purged} belge silindi (${retentionDays} günden eski)`,
    sweepError: 'Hata',
    badgeConfigured: 'Etkin ve yapılandırıldı',
    badgePartial: 'Kısmen yapılandırıldı',
    badgeNotConfigured: 'Yapılandırılmadı',
    methodManualTitle: 'Manuel inceleme (admin)',
    methodManualDesc: 'Müşteri belgeleri yükler → admin inceler ve onaylar. Şu anda aktif.',
    methodSumsubTitle: 'Sumsub (otomatik KYC)',
    methodSumsubDesc: 'Otomatik doğrulama. Aşağıdaki anahtarları gerektirir. Daha sonra etkinleştirmeye hazır.',
    methodSectionTitle: 'Kimlik doğrulama yöntemi',
    methodIntroA: 'Rezervasyon için tek bir soru — «müşteri doğrulandı mı?» — buna ',
    methodIntroBold: 'aktif yöntem',
    methodIntroB: ' yanıt verir. Geçiş yalnızca bir ayar değişikliğidir.',
    active: 'AKTİF',
    sumsubDescA: 'Sumsub ile kimlik doğrulama (pasaport/kimlik + sürücü belgesi + selfie/liveness). Anahtarlar ',
    sumsubDescBold: 'şifreli olarak (AES-256-GCM) saklanır ve asla tarayıcıya döndürülmez',
    sumsubDescC: '. Test için ',
    sumsubDescD: ' anahtarları kullanın (şu biçimde app token: ',
    sumsubDescE: ') ve belge + ehliyet + liveness kapsayan bir Sandbox seviyesi (level).',
    levelNameLabel: 'LEVEL NAME (DOĞRULAMA SEVİYESİ)',
    levelNamePlaceholder: 'örn. id-and-driving-license',
    levelNameHint: 'Sumsub panelindeki tam seviye adı (büyük/küçük harf önemli). Seviye, kimlik belgesi + sürücü belgesi + selfie gerektirmelidir.',
    retentionLabel: 'BELGE SAKLAMA SÜRESİ (GÜN)',
    retentionHint: 'Belge görüntüleri, bu sürenin ardından şifreli depodan silinir (aktif kiralama yoksa).',
    webhookSecretTitle: 'WEBHOOK SECRET (webhook imza doğrulaması için)',
    enableToggle: 'Kimlik doğrulamayı «Bilgiler» adımında etkinleştir',
    saved: 'Kaydedildi ✓',
    webhookUrlLabel: 'WEBHOOK URL (Sumsub → Dev space → Webhooks içinde belirtin)',
    webhookHintA: 'Burada belirlenen webhook gizli anahtarı, Sumsub panelindeki webhook «secret key» ile eşleşmelidir. Her webhook imzası doğrulanır (HMAC, başlık ',
    webhookHintB: ') — imzasız/sahte istekler reddedilir.',
    retentionSectionTitle: 'Kimlik belgelerinin saklanması ve silinmesi',
    retentionBodyA: 'Belge görüntüleri (pasaport/kimlik, ehliyet) ',
    retentionBodyBold: 'yalnızca şifreli depoda',
    retentionBodyB: ' saklanır ve saklama süresi dolduğunda silinir (',
    retentionDaysBold: (n) => `${n} gün`,
    retentionBodyC: '). Planlı silme — cron: ',
    retentionBodyD: ' (koruma: ',
    retentionBodyE: '). Belirli bir müşterinin belgelerini rezervasyon kartından silebilirsiniz.',
    runSweepNow: 'Silmeyi şimdi çalıştır',
    sweeping: 'Çalışıyor…',
  },
  es: {
    save: 'Guardar',
    saving: 'Guardando…',
    secretSavedPlaceholder: '•••• •••• (guardado — deje vacío)',
    secretEnterValue: 'Introduzca un valor',
    secretSavedHint: 'Guardado ✓ — introduzca uno nuevo para reemplazarlo (el valor actual no se muestra)',
    secretNotSet: 'Aún no definido',
    sweepDone: (purged, usersPurged, retentionDays) => `Listo: eliminados ${purged} documento(s) de ${usersPurged} cliente(s) (más de ${retentionDays} días)`,
    sweepError: 'Error',
    badgeConfigured: 'Activado y configurado',
    badgePartial: 'Configurado parcialmente',
    badgeNotConfigured: 'Sin configurar',
    methodManualTitle: 'Revisión manual (admin)',
    methodManualDesc: 'El cliente sube los documentos → un admin revisa y aprueba. Activo ahora.',
    methodSumsubTitle: 'Sumsub (KYC automático)',
    methodSumsubDesc: 'Verificación automática. Requiere las claves de abajo. Lista para activar más adelante.',
    methodSectionTitle: 'Método de verificación de identidad',
    methodIntroA: 'Una única pregunta para la reserva — «¿el cliente está verificado?» — la responde el ',
    methodIntroBold: 'método activo',
    methodIntroB: '. Cambiarlo es solo un cambio de ajuste.',
    active: 'ACTIVO',
    sumsubDescA: 'Verificación de identidad con Sumsub (pasaporte/ID + permiso de conducir + selfi/liveness). Las claves se almacenan ',
    sumsubDescBold: 'cifradas (AES-256-GCM) y nunca se devuelven al navegador',
    sumsubDescC: '. Para pruebas, use claves ',
    sumsubDescD: ' (app token del tipo ',
    sumsubDescE: ') y un level de Sandbox que cubra documento + permiso + liveness.',
    levelNameLabel: 'LEVEL NAME (NIVEL DE VERIFICACIÓN)',
    levelNamePlaceholder: 'p. ej. id-and-driving-license',
    levelNameHint: 'Nombre exacto del nivel del panel de Sumsub (distingue mayúsculas). El nivel debe requerir documento de identidad + permiso de conducir + selfi.',
    retentionLabel: 'PERÍODO DE CONSERVACIÓN DE DOCUMENTOS (DÍAS)',
    retentionHint: 'Las imágenes de los documentos se eliminan del almacenamiento cifrado tras este plazo (si no hay un alquiler activo).',
    webhookSecretTitle: 'WEBHOOK SECRET (para verificar la firma del webhook)',
    enableToggle: 'Activar la verificación de identidad en el paso «Datos»',
    saved: 'Guardado ✓',
    webhookUrlLabel: 'WEBHOOK URL (indíquela en Sumsub → Dev space → Webhooks)',
    webhookHintA: 'El secreto de webhook definido aquí debe coincidir con la «secret key» del webhook en el panel de Sumsub. La firma de cada webhook se verifica (HMAC, cabecera ',
    webhookHintB: ') — las solicitudes sin firma/falsificadas se rechazan.',
    retentionSectionTitle: 'Conservación y eliminación de documentos de identidad',
    retentionBodyA: 'Las imágenes de los documentos (pasaporte/ID, permiso) se almacenan ',
    retentionBodyBold: 'solo en almacenamiento cifrado',
    retentionBodyB: ' y se eliminan al vencer el plazo de conservación (',
    retentionDaysBold: (n) => `${n} días`,
    retentionBodyC: '). Eliminación programada — cron en ',
    retentionBodyD: ' (protegido por ',
    retentionBodyE: '). Puede eliminar los documentos de un cliente concreto desde la ficha de la reserva.',
    runSweepNow: 'Ejecutar eliminación ahora',
    sweeping: 'Ejecutando…',
  },
  de: {
    save: 'Speichern',
    saving: 'Speichern…',
    secretSavedPlaceholder: '•••• •••• (gespeichert — leer lassen)',
    secretEnterValue: 'Wert eingeben',
    secretSavedHint: 'Gespeichert ✓ — zum Ersetzen einen neuen eingeben (der aktuelle Wert wird nicht angezeigt)',
    secretNotSet: 'Noch nicht festgelegt',
    sweepDone: (purged, usersPurged, retentionDays) => `Fertig: ${purged} Dokument(e) von ${usersPurged} Kunde(n) gelöscht (älter als ${retentionDays} Tage)`,
    sweepError: 'Fehler',
    badgeConfigured: 'Aktiviert und konfiguriert',
    badgePartial: 'Teilweise konfiguriert',
    badgeNotConfigured: 'Nicht konfiguriert',
    methodManualTitle: 'Manuelle Prüfung (Admin)',
    methodManualDesc: 'Der Kunde lädt Dokumente hoch → ein Admin prüft und genehmigt. Jetzt aktiv.',
    methodSumsubTitle: 'Sumsub (Auto-KYC)',
    methodSumsubDesc: 'Automatische Prüfung. Erfordert die Schlüssel unten. Kann später aktiviert werden.',
    methodSectionTitle: 'Identitätsprüfungsmethode',
    methodIntroA: 'Eine einzige Frage für die Buchung — „ist der Kunde verifiziert?“ — beantwortet die ',
    methodIntroBold: 'aktive Methode',
    methodIntroB: '. Das Umschalten ist nur eine Einstellungsänderung.',
    active: 'AKTIV',
    sumsubDescA: 'Identitätsprüfung über Sumsub (Reisepass/ID + Führerschein + Selfie/Liveness). Die Schlüssel werden ',
    sumsubDescBold: 'verschlüsselt (AES-256-GCM) gespeichert und niemals an den Browser zurückgegeben',
    sumsubDescC: '. Verwenden Sie zum Testen ',
    sumsubDescD: '-Schlüssel (app token wie ',
    sumsubDescE: ') und ein Level aus der Sandbox, das Dokument + Führerschein + Liveness abdeckt.',
    levelNameLabel: 'LEVEL NAME (PRÜFUNGSSTUFE)',
    levelNamePlaceholder: 'z. B. id-and-driving-license',
    levelNameHint: 'Genauer Level-Name aus der Sumsub-Konsole (Groß-/Kleinschreibung beachten). Der Level muss ID-Dokument + Führerschein + Selfie verlangen.',
    retentionLabel: 'AUFBEWAHRUNGSFRIST FÜR DOKUMENTE (TAGE)',
    retentionHint: 'Dokumentbilder werden nach diesem Zeitraum aus dem verschlüsselten Speicher gelöscht (sofern keine aktive Miete besteht).',
    webhookSecretTitle: 'WEBHOOK SECRET (zur Verifizierung der Webhook-Signatur)',
    enableToggle: 'Identitätsprüfung im Schritt „Daten“ aktivieren',
    saved: 'Gespeichert ✓',
    webhookUrlLabel: 'WEBHOOK URL (in Sumsub → Dev space → Webhooks angeben)',
    webhookHintA: 'Das hier festgelegte Webhook-Secret muss mit dem „secret key“ des Webhooks in der Sumsub-Konsole übereinstimmen. Jede Webhook-Signatur wird verifiziert (HMAC, Header ',
    webhookHintB: ') — unsignierte/gefälschte Anfragen werden abgelehnt.',
    retentionSectionTitle: 'Speicherung und Löschung von Ausweisdokumenten',
    retentionBodyA: 'Dokumentbilder (Reisepass/ID, Führerschein) werden ',
    retentionBodyBold: 'nur in verschlüsseltem Speicher',
    retentionBodyB: ' gespeichert und nach Ablauf der Aufbewahrungsfrist gelöscht (',
    retentionDaysBold: (n) => `${n} Tage`,
    retentionBodyC: '). Geplante Löschung — Cron unter ',
    retentionBodyD: ' (geschützt durch ',
    retentionBodyE: '). Sie können die Dokumente eines bestimmten Kunden in der Buchungskarte löschen.',
    runSweepNow: 'Löschung jetzt ausführen',
    sweeping: 'Wird ausgeführt…',
  },
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
    <button type="submit" disabled={pending} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'var(--d-accent)', color: '#082A33', font: '700 13px var(--f-ui)', cursor: 'pointer' }}>
      {pending ? t.saving : t.save}
    </button>
  )
}

function SecretField({ name, title, has }: { name: string; title: string; has: boolean }) {
  const t = useDict(dict)
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={label}>{title}</label>
      <input name={name} type="password" autoComplete="new-password" placeholder={has ? t.secretSavedPlaceholder : t.secretEnterValue} style={input} />
      <div style={{ marginTop: 5, font: '500 11px var(--f-ui)', color: has ? 'var(--d-green)' : 'var(--d-muted-2)' }}>
        {has ? t.secretSavedHint : t.secretNotSet}
      </div>
    </div>
  )
}

export default function SumsubSettings({ config, webhookUrl, retentionDays, method }: { config: SumsubConfigView; webhookUrl: string; retentionDays: number; method: string }) {
  const t = useDict(dict)
  const [state, action] = useFormState<SumsubSaveResult, FormData>(saveSumsubConfigAction, { ok: false })
  const [sweeping, startSweep] = useTransition()
  const [sweepMsg, setSweepMsg] = useState<string | null>(null)
  const [activeMethod, setActiveMethod] = useState(method === 'SUMSUB' ? 'SUMSUB' : 'MANUAL')
  const [savingMethod, startMethod] = useTransition()
  const pickMethod = (m: string) =>
    startMethod(async () => {
      setActiveMethod(m)
      await saveVerificationMethodAction(m)
    })
  const runSweep = () =>
    startSweep(async () => {
      setSweepMsg(null)
      const r = await runRetentionSweepAction()
      setSweepMsg(r.ok ? t.sweepDone(r.purged ?? 0, r.usersPurged ?? 0, r.retentionDays ?? 0) : t.sweepError)
    })

  const badge = config.configured
    ? { dot: '🟢', text: t.badgeConfigured, color: 'var(--d-green)' }
    : config.hasAppToken || config.hasSecretKey
      ? { dot: '⚪', text: t.badgePartial, color: 'var(--d-muted)' }
      : { dot: '🔴', text: t.badgeNotConfigured, color: 'var(--d-red)' }

  const METHODS = [
    { key: 'MANUAL', title: t.methodManualTitle, desc: t.methodManualDesc },
    { key: 'SUMSUB', title: t.methodSumsubTitle, desc: t.methodSumsubDesc },
  ]

  return (
    <div>
      <div style={{ background: 'var(--d-panel)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: 20, maxWidth: 640, marginBottom: 18 }}>
        <div style={{ font: '700 13px var(--f-display)', color: 'var(--d-text-bright)', marginBottom: 4 }}>{t.methodSectionTitle}</div>
        <div style={{ font: '400 12px/1.5 var(--f-ui)', color: 'var(--d-muted)', marginBottom: 14 }}>
          {t.methodIntroA}<b>{t.methodIntroBold}</b>{t.methodIntroB}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {METHODS.map((m) => {
            const on = activeMethod === m.key
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => pickMethod(m.key)}
                disabled={savingMethod}
                style={{ textAlign: 'left', padding: '13px 15px', borderRadius: 13, cursor: savingMethod ? 'wait' : 'pointer', border: on ? '2px solid var(--d-accent)' : '1px solid rgba(255,255,255,.12)', background: on ? 'rgba(255,122,92,.10)' : 'var(--d-base)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', border: on ? '5px solid var(--d-accent)' : '2px solid rgba(255,255,255,.3)', boxSizing: 'border-box' }} />
                  <span style={{ font: '700 13px var(--f-ui)', color: 'var(--d-text-bright)' }}>{m.title}</span>
                  {on && <span style={{ marginLeft: 'auto', font: '700 9px var(--f-mono)', color: 'var(--d-green)' }}>{t.active}</span>}
                </div>
                <div style={{ marginTop: 6, font: '500 11px/1.4 var(--f-ui)', color: 'var(--d-muted-2)' }}>{m.desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ font: '400 13px/1.6 var(--f-ui)', color: 'var(--d-muted)', maxWidth: 680, marginBottom: 18 }}>
        {t.sumsubDescA}
        <b>{t.sumsubDescBold}</b>{t.sumsubDescC}<b>sandbox</b>{t.sumsubDescD}<code>sbx:…</code>{t.sumsubDescE}
      </div>

      <form action={action} style={{ background: 'var(--d-panel)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: 22, maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ font: '600 16px var(--f-display)', color: 'var(--d-text-bright)' }}>Sumsub</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, font: '600 12px var(--f-ui)', color: badge.color }}>
            <span>{badge.dot}</span>
            {badge.text}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={label}>{t.levelNameLabel}</label>
          <input name="levelName" defaultValue={config.levelName} placeholder={t.levelNamePlaceholder} style={input} autoComplete="off" />
          <div style={{ marginTop: 5, font: '500 11px var(--f-ui)', color: 'var(--d-muted-2)' }}>{t.levelNameHint}</div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={label}>{t.retentionLabel}</label>
          <input name="retentionDays" type="number" min={1} defaultValue={retentionDays} style={{ ...input, maxWidth: 160 }} />
          <div style={{ marginTop: 5, font: '500 11px var(--f-ui)', color: 'var(--d-muted-2)' }}>{t.retentionHint}</div>
        </div>

        <SecretField name="appToken" title="APP TOKEN" has={config.hasAppToken} />
        <SecretField name="secretKey" title="SECRET KEY" has={config.hasSecretKey} />
        <SecretField name="webhookSecret" title={t.webhookSecretTitle} has={config.hasWebhookSecret} />

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }}>
          <input type="checkbox" name="enabled" defaultChecked={config.enabled} style={{ width: 18, height: 18, accentColor: '#FF7A5C' }} />
          <span style={{ font: '600 13px var(--f-ui)', color: 'var(--d-text)' }}>{t.enableToggle}</span>
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SaveButton />
          {state.ok && <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-green)' }}>{t.saved}</span>}
          {state.error && <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-red)' }}>{state.error}</span>}
        </div>
      </form>

      <div style={{ marginTop: 16, background: 'var(--d-panel)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: 18, maxWidth: 640 }}>
        <div style={{ font: '700 11px var(--f-mono)', letterSpacing: '.08em', color: 'var(--d-muted-2)', marginBottom: 8 }}>{t.webhookUrlLabel}</div>
        <code style={{ display: 'block', padding: '10px 12px', borderRadius: 9, background: 'var(--d-base)', color: 'var(--d-accent-light)', font: '600 12px var(--f-mono)', wordBreak: 'break-all' }}>{webhookUrl}</code>
        <div style={{ marginTop: 8, font: '400 11px/1.5 var(--f-ui)', color: 'var(--d-muted-2)' }}>
          {t.webhookHintA}<code>x-payload-digest</code>{t.webhookHintB}
        </div>
      </div>

      <div style={{ marginTop: 16, background: 'var(--d-panel)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: 18, maxWidth: 640 }}>
        <div style={{ font: '700 13px var(--f-display)', color: 'var(--d-text-bright)', marginBottom: 6 }}>{t.retentionSectionTitle}</div>
        <div style={{ font: '400 12px/1.6 var(--f-ui)', color: 'var(--d-muted)', marginBottom: 12 }}>
          {t.retentionBodyA}<b>{t.retentionBodyBold}</b>{t.retentionBodyB}<b>{t.retentionDaysBold(retentionDays)}</b>{t.retentionBodyC}<code>/api/cron/document-retention</code>{t.retentionBodyD}<code>CRON_SECRET</code>{t.retentionBodyE}
        </div>
        <button type="button" onClick={runSweep} disabled={sweeping} style={{ padding: '9px 15px', borderRadius: 10, border: '1px solid rgba(255,255,255,.14)', background: 'var(--d-card)', color: 'var(--d-text)', font: '700 12px var(--f-ui)', cursor: sweeping ? 'wait' : 'pointer' }}>
          {sweeping ? t.sweeping : t.runSweepNow}
        </button>
        {sweepMsg && <span style={{ marginLeft: 12, font: '600 12px var(--f-ui)', color: 'var(--d-green)' }}>{sweepMsg}</span>}
      </div>
    </div>
  )
}
