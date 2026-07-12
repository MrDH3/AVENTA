'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { savePaymentSettingsAction, type PaySaveResult } from '@/server/payment-settings-actions'
import { setReservationHoldHoursAction, runReservationTimeoutAction, setBookingDraftTtlHoursAction, runBookingDraftCleanupAction, setCardReconcileGraceMinutesAction, runCardReconcileAction } from '@/server/admin-actions'
import { useDict, type Dict } from '@/i18n/lang'

type Settings = Record<string, string>
type Rates = Record<string, number>

interface Strings {
  // Common
  saving: string
  saveSettings: string
  save: string
  savedCheck: string
  errGeneric: string
  // Intro
  introA: string
  introBold: string
  introB: string
  // Deposit
  depositTitle: string
  depositHint: string
  depositLabel: string
  baseCurrencyLabel: string
  // Methods
  methodsTitle: string
  methodsHint: string
  methodCardTitle: string
  methodCardDesc: string
  methodBankTitle: string
  methodBankDesc: string
  methodCryptoTitle: string
  methodCryptoDesc: string
  // Wallets
  walletsTitle: string
  walletsHint: string
  walletPlaceholder: (token: string, network: string) => string
  // Bank
  bankTitle: string
  bankHint: string
  bankRecipientLabel: string
  bankLocalLabel: string
  // Rates
  ratesTitle: string
  ratesHint: string
  // Reservation hold
  holdTitle: string
  holdHint: string
  holdHoursLabel: string
  holdRunBtn: string
  holdRunning: string
  holdSweepMsg: (scanned: number, expired: number, holdHours: number) => string
  holdRunErr: string
  // Card reconcile
  reconcileTitle: string
  reconcileHintA: string
  reconcileHintBold: string
  reconcileHintB: string
  reconcileMinutesLabel: string
  reconcileRunBtn: string
  reconcileRunning: string
  reconcileSweepMsg: (scanned: number, refunded: number, refundFailed: number, graceMinutes: number) => string
  reconcileRunErr: string
  // Booking draft
  draftTitle: string
  draftHintA: string
  draftHintBold: string
  draftHintB: string
  draftHoursLabel: string
  draftRunBtn: string
  draftRunning: string
  draftSweepMsg: (deleted: number, ttlHours: number) => string
  draftRunErr: string
}

const dict: Dict<Strings> = {
  ru: {
    saving: 'Сохранение…',
    saveSettings: 'Сохранить настройки',
    save: 'Сохранить',
    savedCheck: '✓ Сохранено',
    errGeneric: 'Ошибка',
    introA: 'Всё, что видит клиент на шаге оплаты, настраивается здесь — ',
    introBold: 'без правки кода',
    introB: '. Значения не секретны (адреса кошельков и банковские реквизиты показываются плательщику). Доступно администратору и владельцу.',
    depositTitle: 'Депозит и базовая валюта',
    depositHint: 'Процент предоплаты — сколько клиент платит сейчас, чтобы забронировать. Остаток — при возврате авто.',
    depositLabel: 'ПРЕДОПЛАТА / ДЕПОЗИТ, %',
    baseCurrencyLabel: 'БАЗОВАЯ ВАЛЮТА',
    methodsTitle: 'Способы оплаты',
    methodsHint: 'Отключённый способ не показывается клиенту на шаге оплаты.',
    methodCardTitle: 'Карта (Stripe / PayPal)',
    methodCardDesc: 'Требует ключей Stripe/PayPal в окружении',
    methodBankTitle: 'Банковский перевод',
    methodBankDesc: 'Клиент переводит по реквизитам ниже и загружает чек',
    methodCryptoTitle: 'Криптовалюта (USDT / USDC)',
    methodCryptoDesc: 'Клиент отправляет на кошелёк и указывает хэш транзакции',
    walletsTitle: 'Криптокошельки',
    walletsHint: 'Адрес показывается клиенту вместе с QR-кодом и предупреждением «отправляйте только [токен] в сети [сеть]». Пустой адрес — сеть скрыта.',
    walletPlaceholder: (token, network) => `Адрес кошелька ${token} (${network})`,
    bankTitle: 'Банковские реквизиты',
    bankHint: 'Показываются клиенту при выборе банковского перевода.',
    bankRecipientLabel: 'ПОЛУЧАТЕЛЬ (ACCOUNT NAME)',
    bankLocalLabel: 'МЕСТНЫЙ ПЕРЕВОД / ДОП. ДЕТАЛИ',
    ratesTitle: 'Курсы валют (1 EUR =)',
    ratesHint: 'Используются для пересчёта сумм в выбранную клиентом валюту. EUR — база (всегда 1).',
    holdTitle: 'Резерв без подтверждения (авто-таймаут)',
    holdHint: 'Ручная бронь (перевод/крипто) держит авто указанное время. Если оплата не подтверждена админом за этот срок — бронь автоматически отменяется и авто освобождается. Оплаченные и подтверждённые брони никогда не отменяются. По умолчанию 24 ч. Проверка запускается по расписанию (cron) и вручную ниже.',
    holdHoursLabel: 'ЧАСОВ ДО ОТМЕНЫ',
    holdRunBtn: 'Запустить проверку сейчас',
    holdRunning: 'Проверка…',
    holdSweepMsg: (scanned, expired, holdHours) => `Проверено: ${scanned}, отменено: ${expired} (окно ${holdHours} ч)`,
    holdRunErr: 'Ошибка запуска проверки',
    reconcileTitle: 'Зависшие депозиты картой (авто-возврат)',
    reconcileHintA: 'Если депозит по карте ',
    reconcileHintBold: 'списался, но бронь не создалась',
    reconcileHintB: ' (3-D Secure увёл на другую страницу, сессия истекла, платёж «в обработке» подтвердился позже), деньги возвращаются автоматически. Ждём указанное время после списания, затем — если депозит так и не привязан к брони — делаем возврат. Брони и авто это не затрагивает. По умолчанию 30 мин. Идёт по расписанию (cron) и вручную ниже.',
    reconcileMinutesLabel: 'МИНУТ ДО ВОЗВРАТА',
    reconcileRunBtn: 'Запустить сверку сейчас',
    reconcileRunning: 'Сверка…',
    reconcileSweepMsg: (scanned, refunded, refundFailed, graceMinutes) => `Проверено: ${scanned}, возвращено: ${refunded}${refundFailed ? `, ошибок возврата: ${refundFailed}` : ''} (окно ${graceMinutes} мин)`,
    reconcileRunErr: 'Ошибка запуска сверки',
    draftTitle: 'Незавершённые черновики брони (авто-удаление)',
    draftHintA: 'Если клиент сохранил бронь на полпути и не завершил её, черновик хранится указанное время, затем удаляется автоматически. Это только данные формы — ',
    draftHintBold: 'никакая бронь или авто не затрагиваются',
    draftHintB: ' (в отличие от таймаута резерва выше). По умолчанию 24 ч. Очистка идёт по расписанию (cron) и вручную ниже.',
    draftHoursLabel: 'ЧАСОВ ДО УДАЛЕНИЯ',
    draftRunBtn: 'Запустить очистку сейчас',
    draftRunning: 'Очистка…',
    draftSweepMsg: (deleted, ttlHours) => `Удалено черновиков: ${deleted} (окно ${ttlHours} ч)`,
    draftRunErr: 'Ошибка запуска очистки',
  },
  en: {
    saving: 'Saving…',
    saveSettings: 'Save settings',
    save: 'Save',
    savedCheck: '✓ Saved',
    errGeneric: 'Error',
    introA: 'Everything the customer sees at the payment step is configured here — ',
    introBold: 'without touching code',
    introB: '. These values are not secret (wallet addresses and bank details are shown to the payer). Available to the administrator and the owner.',
    depositTitle: 'Deposit and base currency',
    depositHint: 'Prepayment percentage — how much the customer pays now to book. The remainder is due when the car is returned.',
    depositLabel: 'PREPAYMENT / DEPOSIT, %',
    baseCurrencyLabel: 'BASE CURRENCY',
    methodsTitle: 'Payment methods',
    methodsHint: 'A disabled method is not shown to the customer at the payment step.',
    methodCardTitle: 'Card (Stripe / PayPal)',
    methodCardDesc: 'Requires Stripe/PayPal keys in the environment',
    methodBankTitle: 'Bank transfer',
    methodBankDesc: 'The customer transfers using the details below and uploads a receipt',
    methodCryptoTitle: 'Cryptocurrency (USDT / USDC)',
    methodCryptoDesc: 'The customer sends to the wallet and provides the transaction hash',
    walletsTitle: 'Crypto wallets',
    walletsHint: 'The address is shown to the customer along with a QR code and a warning "send only [token] on the [network] network". An empty address hides the network.',
    walletPlaceholder: (token, network) => `${token} wallet address (${network})`,
    bankTitle: 'Bank details',
    bankHint: 'Shown to the customer when they choose bank transfer.',
    bankRecipientLabel: 'RECIPIENT (ACCOUNT NAME)',
    bankLocalLabel: 'LOCAL TRANSFER / ADDITIONAL DETAILS',
    ratesTitle: 'Exchange rates (1 EUR =)',
    ratesHint: 'Used to convert amounts into the currency chosen by the customer. EUR is the base (always 1).',
    holdTitle: 'Unconfirmed reservation (auto-timeout)',
    holdHint: 'A manual booking (transfer/crypto) holds the car for the specified time. If the payment is not confirmed by an admin within this period, the booking is cancelled automatically and the car is released. Paid and confirmed bookings are never cancelled. Default is 24 h. The check runs on a schedule (cron) and manually below.',
    holdHoursLabel: 'HOURS UNTIL CANCELLATION',
    holdRunBtn: 'Run check now',
    holdRunning: 'Checking…',
    holdSweepMsg: (scanned, expired, holdHours) => `Checked: ${scanned}, cancelled: ${expired} (window ${holdHours} h)`,
    holdRunErr: 'Failed to run the check',
    reconcileTitle: 'Stranded card deposits (auto-refund)',
    reconcileHintA: 'If a card deposit ',
    reconcileHintBold: 'was charged but no booking was created',
    reconcileHintB: ' (3-D Secure took the user to another page, the session expired, an "in progress" payment settled later), the money is refunded automatically. We wait the specified time after the charge, then — if the deposit is still not linked to a booking — issue a refund. This does not affect bookings or cars. Default is 30 min. Runs on a schedule (cron) and manually below.',
    reconcileMinutesLabel: 'MINUTES UNTIL REFUND',
    reconcileRunBtn: 'Run reconciliation now',
    reconcileRunning: 'Reconciling…',
    reconcileSweepMsg: (scanned, refunded, refundFailed, graceMinutes) => `Checked: ${scanned}, refunded: ${refunded}${refundFailed ? `, refund errors: ${refundFailed}` : ''} (window ${graceMinutes} min)`,
    reconcileRunErr: 'Failed to run reconciliation',
    draftTitle: 'Unfinished booking drafts (auto-delete)',
    draftHintA: 'If a customer saved a booking halfway and did not finish it, the draft is kept for the specified time, then deleted automatically. This is only form data — ',
    draftHintBold: 'no booking or car is affected',
    draftHintB: ' (unlike the reservation timeout above). Default is 24 h. Cleanup runs on a schedule (cron) and manually below.',
    draftHoursLabel: 'HOURS UNTIL DELETION',
    draftRunBtn: 'Run cleanup now',
    draftRunning: 'Cleaning up…',
    draftSweepMsg: (deleted, ttlHours) => `Drafts deleted: ${deleted} (window ${ttlHours} h)`,
    draftRunErr: 'Failed to run cleanup',
  },
  tr: {
    saving: 'Kaydediliyor…',
    saveSettings: 'Ayarları kaydet',
    save: 'Kaydet',
    savedCheck: '✓ Kaydedildi',
    errGeneric: 'Hata',
    introA: 'Müşterinin ödeme adımında gördüğü her şey buradan ayarlanır — ',
    introBold: 'kod düzenlemeden',
    introB: '. Bu değerler gizli değildir (cüzdan adresleri ve banka bilgileri ödemeyi yapan kişiye gösterilir). Yönetici ve sahip için kullanılabilir.',
    depositTitle: 'Depozito ve temel para birimi',
    depositHint: 'Ön ödeme yüzdesi — müşterinin rezervasyon için şimdi ödediği tutar. Kalan tutar araç iade edilirken alınır.',
    depositLabel: 'ÖN ÖDEME / DEPOZİTO, %',
    baseCurrencyLabel: 'TEMEL PARA BİRİMİ',
    methodsTitle: 'Ödeme yöntemleri',
    methodsHint: 'Devre dışı bırakılan yöntem, ödeme adımında müşteriye gösterilmez.',
    methodCardTitle: 'Kart (Stripe / PayPal)',
    methodCardDesc: 'Ortamda Stripe/PayPal anahtarları gerektirir',
    methodBankTitle: 'Banka havalesi',
    methodBankDesc: 'Müşteri aşağıdaki bilgilerle havale yapar ve dekont yükler',
    methodCryptoTitle: 'Kripto para (USDT / USDC)',
    methodCryptoDesc: 'Müşteri cüzdana gönderir ve işlem hash’ini belirtir',
    walletsTitle: 'Kripto cüzdanları',
    walletsHint: 'Adres, müşteriye bir QR kodu ve «yalnızca [token] tokenini [network] ağında gönderin» uyarısıyla birlikte gösterilir. Boş adres — ağ gizlenir.',
    walletPlaceholder: (token, network) => `${token} cüzdan adresi (${network})`,
    bankTitle: 'Banka bilgileri',
    bankHint: 'Müşteri banka havalesini seçtiğinde gösterilir.',
    bankRecipientLabel: 'ALICI (ACCOUNT NAME)',
    bankLocalLabel: 'YEREL HAVALE / EK BİLGİLER',
    ratesTitle: 'Döviz kurları (1 EUR =)',
    ratesHint: 'Tutarların müşterinin seçtiği para birimine çevrilmesi için kullanılır. EUR temel alınır (her zaman 1).',
    holdTitle: 'Onaysız rezervasyon (otomatik zaman aşımı)',
    holdHint: 'Manuel rezervasyon (havale/kripto), aracı belirtilen süre boyunca tutar. Ödeme bu süre içinde bir yönetici tarafından onaylanmazsa, rezervasyon otomatik olarak iptal edilir ve araç serbest bırakılır. Ödenmiş ve onaylanmış rezervasyonlar asla iptal edilmez. Varsayılan 24 saattir. Kontrol, zamanlanmış (cron) olarak ve aşağıdan manuel olarak çalışır.',
    holdHoursLabel: 'İPTALE KADAR SAAT',
    holdRunBtn: 'Kontrolü şimdi çalıştır',
    holdRunning: 'Kontrol ediliyor…',
    holdSweepMsg: (scanned, expired, holdHours) => `Kontrol edildi: ${scanned}, iptal edildi: ${expired} (pencere ${holdHours} sa)`,
    holdRunErr: 'Kontrol başlatılamadı',
    reconcileTitle: 'Askıda kalan kart depozitoları (otomatik iade)',
    reconcileHintA: 'Bir kart depozitosu ',
    reconcileHintBold: 'çekildi ancak rezervasyon oluşmadıysa',
    reconcileHintB: ' (3-D Secure kullanıcıyı başka bir sayfaya götürdü, oturum sona erdi, «işlemde» olan ödeme daha sonra tamamlandı), para otomatik olarak iade edilir. Çekimden sonra belirtilen süre kadar bekleriz, ardından — depozito hâlâ bir rezervasyona bağlı değilse — iade yaparız. Bu, rezervasyonları veya araçları etkilemez. Varsayılan 30 dakikadır. Zamanlanmış (cron) olarak ve aşağıdan manuel olarak çalışır.',
    reconcileMinutesLabel: 'İADEYE KADAR DAKİKA',
    reconcileRunBtn: 'Mutabakatı şimdi çalıştır',
    reconcileRunning: 'Mutabakat…',
    reconcileSweepMsg: (scanned, refunded, refundFailed, graceMinutes) => `Kontrol edildi: ${scanned}, iade edildi: ${refunded}${refundFailed ? `, iade hatası: ${refundFailed}` : ''} (pencere ${graceMinutes} dk)`,
    reconcileRunErr: 'Mutabakat başlatılamadı',
    draftTitle: 'Tamamlanmamış rezervasyon taslakları (otomatik silme)',
    draftHintA: 'Bir müşteri rezervasyonu yarıda kaydedip tamamlamadıysa, taslak belirtilen süre boyunca saklanır, ardından otomatik olarak silinir. Bu yalnızca form verisidir — ',
    draftHintBold: 'hiçbir rezervasyon veya araç etkilenmez',
    draftHintB: ' (yukarıdaki rezervasyon zaman aşımından farklı olarak). Varsayılan 24 saattir. Temizlik, zamanlanmış (cron) olarak ve aşağıdan manuel olarak çalışır.',
    draftHoursLabel: 'SİLMEYE KADAR SAAT',
    draftRunBtn: 'Temizliği şimdi çalıştır',
    draftRunning: 'Temizleniyor…',
    draftSweepMsg: (deleted, ttlHours) => `Silinen taslak: ${deleted} (pencere ${ttlHours} sa)`,
    draftRunErr: 'Temizlik başlatılamadı',
  },
  es: {
    saving: 'Guardando…',
    saveSettings: 'Guardar ajustes',
    save: 'Guardar',
    savedCheck: '✓ Guardado',
    errGeneric: 'Error',
    introA: 'Todo lo que el cliente ve en el paso de pago se configura aquí — ',
    introBold: 'sin tocar código',
    introB: '. Estos valores no son secretos (las direcciones de billetera y los datos bancarios se muestran al pagador). Disponible para el administrador y el propietario.',
    depositTitle: 'Depósito y moneda base',
    depositHint: 'Porcentaje de prepago: cuánto paga el cliente ahora para reservar. El resto se cobra al devolver el coche.',
    depositLabel: 'PREPAGO / DEPÓSITO, %',
    baseCurrencyLabel: 'MONEDA BASE',
    methodsTitle: 'Métodos de pago',
    methodsHint: 'Un método desactivado no se muestra al cliente en el paso de pago.',
    methodCardTitle: 'Tarjeta (Stripe / PayPal)',
    methodCardDesc: 'Requiere claves de Stripe/PayPal en el entorno',
    methodBankTitle: 'Transferencia bancaria',
    methodBankDesc: 'El cliente transfiere con los datos de abajo y sube el comprobante',
    methodCryptoTitle: 'Criptomoneda (USDT / USDC)',
    methodCryptoDesc: 'El cliente envía a la billetera e indica el hash de la transacción',
    walletsTitle: 'Billeteras cripto',
    walletsHint: 'La dirección se muestra al cliente junto con un código QR y una advertencia «envíe solo [token] en la red [network]». Una dirección vacía oculta la red.',
    walletPlaceholder: (token, network) => `Dirección de billetera ${token} (${network})`,
    bankTitle: 'Datos bancarios',
    bankHint: 'Se muestran al cliente cuando elige la transferencia bancaria.',
    bankRecipientLabel: 'DESTINATARIO (ACCOUNT NAME)',
    bankLocalLabel: 'TRANSFERENCIA LOCAL / DATOS ADICIONALES',
    ratesTitle: 'Tipos de cambio (1 EUR =)',
    ratesHint: 'Se usan para convertir los importes a la moneda elegida por el cliente. EUR es la base (siempre 1).',
    holdTitle: 'Reserva sin confirmar (tiempo de espera automático)',
    holdHint: 'Una reserva manual (transferencia/cripto) retiene el coche durante el tiempo indicado. Si el pago no lo confirma un administrador dentro de este plazo, la reserva se cancela automáticamente y el coche se libera. Las reservas pagadas y confirmadas nunca se cancelan. El valor predeterminado es 24 h. La comprobación se ejecuta de forma programada (cron) y manualmente abajo.',
    holdHoursLabel: 'HORAS HASTA CANCELAR',
    holdRunBtn: 'Ejecutar comprobación ahora',
    holdRunning: 'Comprobando…',
    holdSweepMsg: (scanned, expired, holdHours) => `Revisadas: ${scanned}, canceladas: ${expired} (ventana ${holdHours} h)`,
    holdRunErr: 'Error al ejecutar la comprobación',
    reconcileTitle: 'Depósitos con tarjeta bloqueados (reembolso automático)',
    reconcileHintA: 'Si un depósito con tarjeta ',
    reconcileHintBold: 'se cobró pero no se creó la reserva',
    reconcileHintB: ' (3-D Secure llevó al usuario a otra página, la sesión caducó, un pago «en proceso» se confirmó más tarde), el dinero se reembolsa automáticamente. Esperamos el tiempo indicado tras el cargo y, si el depósito sigue sin estar vinculado a una reserva, hacemos el reembolso. Esto no afecta a las reservas ni a los coches. El valor predeterminado es 30 min. Se ejecuta de forma programada (cron) y manualmente abajo.',
    reconcileMinutesLabel: 'MINUTOS HASTA REEMBOLSO',
    reconcileRunBtn: 'Ejecutar conciliación ahora',
    reconcileRunning: 'Conciliando…',
    reconcileSweepMsg: (scanned, refunded, refundFailed, graceMinutes) => `Revisados: ${scanned}, reembolsados: ${refunded}${refundFailed ? `, errores de reembolso: ${refundFailed}` : ''} (ventana ${graceMinutes} min)`,
    reconcileRunErr: 'Error al ejecutar la conciliación',
    draftTitle: 'Borradores de reserva sin terminar (eliminación automática)',
    draftHintA: 'Si un cliente guardó una reserva a medias y no la terminó, el borrador se conserva durante el tiempo indicado y luego se elimina automáticamente. Son solo datos del formulario — ',
    draftHintBold: 'no se afecta ninguna reserva ni coche',
    draftHintB: ' (a diferencia del tiempo de espera de la reserva de arriba). El valor predeterminado es 24 h. La limpieza se ejecuta de forma programada (cron) y manualmente abajo.',
    draftHoursLabel: 'HORAS HASTA ELIMINAR',
    draftRunBtn: 'Ejecutar limpieza ahora',
    draftRunning: 'Limpiando…',
    draftSweepMsg: (deleted, ttlHours) => `Borradores eliminados: ${deleted} (ventana ${ttlHours} h)`,
    draftRunErr: 'Error al ejecutar la limpieza',
  },
  de: {
    saving: 'Speichern…',
    saveSettings: 'Einstellungen speichern',
    save: 'Speichern',
    savedCheck: '✓ Gespeichert',
    errGeneric: 'Fehler',
    introA: 'Alles, was der Kunde im Zahlungsschritt sieht, wird hier eingestellt — ',
    introBold: 'ohne Code-Änderung',
    introB: '. Diese Werte sind nicht geheim (Wallet-Adressen und Bankdaten werden dem Zahler angezeigt). Verfügbar für Administrator und Inhaber.',
    depositTitle: 'Kaution und Basiswährung',
    depositHint: 'Vorauszahlungsprozentsatz — wie viel der Kunde jetzt für die Buchung zahlt. Der Rest ist bei Rückgabe des Fahrzeugs fällig.',
    depositLabel: 'VORAUSZAHLUNG / KAUTION, %',
    baseCurrencyLabel: 'BASISWÄHRUNG',
    methodsTitle: 'Zahlungsmethoden',
    methodsHint: 'Eine deaktivierte Methode wird dem Kunden im Zahlungsschritt nicht angezeigt.',
    methodCardTitle: 'Karte (Stripe / PayPal)',
    methodCardDesc: 'Erfordert Stripe/PayPal-Schlüssel in der Umgebung',
    methodBankTitle: 'Banküberweisung',
    methodBankDesc: 'Der Kunde überweist anhand der Daten unten und lädt einen Beleg hoch',
    methodCryptoTitle: 'Kryptowährung (USDT / USDC)',
    methodCryptoDesc: 'Der Kunde sendet an die Wallet und gibt den Transaktions-Hash an',
    walletsTitle: 'Krypto-Wallets',
    walletsHint: 'Die Adresse wird dem Kunden zusammen mit einem QR-Code und dem Hinweis «senden Sie nur [token] im [network]-Netzwerk» angezeigt. Eine leere Adresse blendet das Netzwerk aus.',
    walletPlaceholder: (token, network) => `${token}-Wallet-Adresse (${network})`,
    bankTitle: 'Bankverbindung',
    bankHint: 'Werden dem Kunden angezeigt, wenn er Banküberweisung wählt.',
    bankRecipientLabel: 'EMPFÄNGER (ACCOUNT NAME)',
    bankLocalLabel: 'LOKALE ÜBERWEISUNG / ZUSÄTZLICHE ANGABEN',
    ratesTitle: 'Wechselkurse (1 EUR =)',
    ratesHint: 'Werden verwendet, um Beträge in die vom Kunden gewählte Währung umzurechnen. EUR ist die Basis (immer 1).',
    holdTitle: 'Unbestätigte Reservierung (Auto-Timeout)',
    holdHint: 'Eine manuelle Buchung (Überweisung/Krypto) reserviert das Fahrzeug für die angegebene Zeit. Wird die Zahlung nicht innerhalb dieser Frist von einem Admin bestätigt, wird die Buchung automatisch storniert und das Fahrzeug freigegeben. Bezahlte und bestätigte Buchungen werden nie storniert. Standard sind 24 Std. Die Prüfung läuft nach Zeitplan (cron) und manuell unten.',
    holdHoursLabel: 'STUNDEN BIS STORNO',
    holdRunBtn: 'Prüfung jetzt ausführen',
    holdRunning: 'Prüfung…',
    holdSweepMsg: (scanned, expired, holdHours) => `Geprüft: ${scanned}, storniert: ${expired} (Fenster ${holdHours} Std)`,
    holdRunErr: 'Prüfung konnte nicht gestartet werden',
    reconcileTitle: 'Hängengebliebene Kartenkautionen (Auto-Rückerstattung)',
    reconcileHintA: 'Wenn eine Kartenkaution ',
    reconcileHintBold: 'abgebucht wurde, aber keine Buchung entstand',
    reconcileHintB: ' (3-D Secure hat den Nutzer auf eine andere Seite geführt, die Sitzung ist abgelaufen, eine «in Bearbeitung» befindliche Zahlung wurde später bestätigt), wird das Geld automatisch zurückerstattet. Wir warten die angegebene Zeit nach der Abbuchung und erstatten dann — falls die Kaution weiterhin keiner Buchung zugeordnet ist — den Betrag. Buchungen und Fahrzeuge sind davon nicht betroffen. Standard sind 30 Min. Läuft nach Zeitplan (cron) und manuell unten.',
    reconcileMinutesLabel: 'MINUTEN BIS RÜCKERSTATTUNG',
    reconcileRunBtn: 'Abgleich jetzt ausführen',
    reconcileRunning: 'Abgleich…',
    reconcileSweepMsg: (scanned, refunded, refundFailed, graceMinutes) => `Geprüft: ${scanned}, erstattet: ${refunded}${refundFailed ? `, Erstattungsfehler: ${refundFailed}` : ''} (Fenster ${graceMinutes} Min)`,
    reconcileRunErr: 'Abgleich konnte nicht gestartet werden',
    draftTitle: 'Unvollständige Buchungsentwürfe (Auto-Löschung)',
    draftHintA: 'Wenn ein Kunde eine Buchung auf halbem Weg gespeichert und nicht abgeschlossen hat, wird der Entwurf für die angegebene Zeit aufbewahrt und dann automatisch gelöscht. Dies sind nur Formulardaten — ',
    draftHintBold: 'keine Buchung und kein Fahrzeug sind betroffen',
    draftHintB: ' (im Gegensatz zum Reservierungs-Timeout oben). Standard sind 24 Std. Die Bereinigung läuft nach Zeitplan (cron) und manuell unten.',
    draftHoursLabel: 'STUNDEN BIS LÖSCHUNG',
    draftRunBtn: 'Bereinigung jetzt ausführen',
    draftRunning: 'Bereinigung…',
    draftSweepMsg: (deleted, ttlHours) => `Gelöschte Entwürfe: ${deleted} (Fenster ${ttlHours} Std)`,
    draftRunErr: 'Bereinigung konnte nicht gestartet werden',
  },
}

const WALLET_SLOTS: { key: string; token: string; network: string }[] = [
  { key: 'pay_usdt_trc20', token: 'USDT', network: 'TRC20' },
  { key: 'pay_usdt_erc20', token: 'USDT', network: 'ERC20' },
  { key: 'pay_usdt_bep20', token: 'USDT', network: 'BEP20' },
  { key: 'pay_usdc_erc20', token: 'USDC', network: 'ERC20' },
  { key: 'pay_usdc_polygon', token: 'USDC', network: 'POLYGON' },
]
const RATE_CODES = ['EUR', 'USD', 'RUB', 'TRY', 'USDT', 'USDC'] as const

const input = {
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,.12)',
  background: 'var(--d-base)',
  color: 'var(--d-text)',
  font: '500 13px var(--f-ui)',
} as const
const label = { font: '400 10px var(--f-mono)', letterSpacing: '.1em', color: 'var(--d-muted-2)', marginBottom: 6, display: 'block' } as const
const card = { background: 'var(--d-panel)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: 22, marginBottom: 16 } as const
const cardTitle = { font: '600 15px var(--f-display)', color: 'var(--d-text-bright)', marginBottom: 4 } as const
const cardHint = { font: '400 12px/1.5 var(--f-ui)', color: 'var(--d-muted)', marginBottom: 16 } as const

function SaveBar({ state }: { state: PaySaveResult }) {
  const t = useDict(dict)
  const { pending } = useFormStatus()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', bottom: 0, padding: '14px 0', background: 'linear-gradient(180deg, transparent, var(--d-base) 40%)' }}>
      <button
        type="submit"
        disabled={pending}
        style={{ padding: '12px 28px', borderRadius: 11, border: 'none', background: 'var(--d-accent)', color: '#082A33', font: '700 14px var(--f-ui)', cursor: 'pointer' }}
      >
        {pending ? t.saving : t.saveSettings}
      </button>
      {state.ok && state.savedAt && <span style={{ font: '600 13px var(--f-ui)', color: 'var(--d-green)' }}>{t.savedCheck}</span>}
      {state.error && <span style={{ font: '600 13px var(--f-ui)', color: 'var(--d-red)' }}>{state.error}</span>}
    </div>
  )
}

function Toggle({ name, checked, title, desc }: { name: string; checked: boolean; title: string; desc: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', cursor: 'pointer' }}>
      <input type="checkbox" name={name} defaultChecked={checked} style={{ width: 18, height: 18, marginTop: 2, accentColor: '#FF7A5C' }} />
      <span>
        <span style={{ display: 'block', font: '600 13px var(--f-ui)', color: 'var(--d-text)' }}>{title}</span>
        <span style={{ display: 'block', font: '400 12px var(--f-ui)', color: 'var(--d-muted-2)', marginTop: 2 }}>{desc}</span>
      </span>
    </label>
  )
}

export default function PaymentSettings({ settings, rates, holdHours, draftTtlHours, reconcileGraceMinutes }: { settings: Settings; rates: Rates; holdHours: number; draftTtlHours: number; reconcileGraceMinutes: number }) {
  const t = useDict(dict)
  const [state, action] = useFormState<PaySaveResult, FormData>(savePaymentSettingsAction, { ok: false })

  return (
    <>
    <ReservationHoldCard holdHours={holdHours} />
    <BookingDraftCard draftTtlHours={draftTtlHours} />
    <CardReconcileCard graceMinutes={reconcileGraceMinutes} />
    <form action={action}>
      <div style={{ font: '400 13px/1.6 var(--f-ui)', color: 'var(--d-muted)', maxWidth: 680, marginBottom: 20 }}>
        {t.introA}<b>{t.introBold}</b>{t.introB}
      </div>

      {/* General: deposit % + base currency */}
      <div style={card}>
        <div style={cardTitle}>{t.depositTitle}</div>
        <div style={cardHint}>{t.depositHint}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
          <div>
            <label style={label}>{t.depositLabel}</label>
            <input name="pay_deposit_percent" type="number" min={0} max={100} defaultValue={settings.pay_deposit_percent} style={input} />
          </div>
          <div>
            <label style={label}>{t.baseCurrencyLabel}</label>
            <select name="pay_base_currency" defaultValue={settings.pay_base_currency} style={{ ...input, cursor: 'pointer' }}>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enabled methods */}
      <div style={card}>
        <div style={cardTitle}>{t.methodsTitle}</div>
        <div style={cardHint}>{t.methodsHint}</div>
        <Toggle name="pay_method_card" checked={settings.pay_method_card === '1'} title={t.methodCardTitle} desc={t.methodCardDesc} />
        <Toggle name="pay_method_bank" checked={settings.pay_method_bank === '1'} title={t.methodBankTitle} desc={t.methodBankDesc} />
        <Toggle name="pay_method_crypto" checked={settings.pay_method_crypto === '1'} title={t.methodCryptoTitle} desc={t.methodCryptoDesc} />
      </div>

      {/* Crypto wallets */}
      <div style={card}>
        <div style={cardTitle}>{t.walletsTitle}</div>
        <div style={cardHint}>{t.walletsHint}</div>
        <div style={{ display: 'grid', gap: 12 }}>
          {WALLET_SLOTS.map((w) => (
            <div key={w.key}>
              <label style={label}>{w.token} · {w.network}</label>
              <input name={w.key} defaultValue={settings[w.key] ?? ''} placeholder={t.walletPlaceholder(w.token, w.network)} style={{ ...input, font: '500 12px var(--f-mono)' }} autoComplete="off" />
            </div>
          ))}
        </div>
      </div>

      {/* Bank details */}
      <div style={card}>
        <div style={cardTitle}>{t.bankTitle}</div>
        <div style={cardHint}>{t.bankHint}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={label}>{t.bankRecipientLabel}</label>
            <input name="pay_bank_account_name" defaultValue={settings.pay_bank_account_name ?? ''} style={input} />
          </div>
          <div>
            <label style={label}>IBAN</label>
            <input name="bank_iban" defaultValue={settings.bank_iban ?? ''} style={{ ...input, font: '500 12px var(--f-mono)' }} />
          </div>
          <div>
            <label style={label}>SWIFT / BIC</label>
            <input name="bank_swift" defaultValue={settings.bank_swift ?? ''} style={{ ...input, font: '500 12px var(--f-mono)' }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={label}>{t.bankLocalLabel}</label>
            <textarea name="pay_bank_local" defaultValue={settings.pay_bank_local ?? ''} rows={2} style={{ ...input, resize: 'vertical' }} />
          </div>
        </div>
      </div>

      {/* Exchange rates */}
      <div style={card}>
        <div style={cardTitle}>{t.ratesTitle}</div>
        <div style={cardHint}>{t.ratesHint}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12 }}>
          {RATE_CODES.map((code) => (
            <div key={code}>
              <label style={label}>{code}</label>
              <input
                name={`rate_${code}`}
                type="number"
                step="0.0001"
                min={0}
                defaultValue={code === 'EUR' ? 1 : (rates[code] ?? '')}
                readOnly={code === 'EUR'}
                style={{ ...input, opacity: code === 'EUR' ? 0.6 : 1 }}
              />
            </div>
          ))}
        </div>
      </div>

      <SaveBar state={state} />
    </form>
    </>
  )
}

/**
 * Reservation-hold timeout: how long an unconfirmed MANUAL (bank/crypto) booking holds the car before
 * it auto-expires and the car is released. Saved via its own action (not the main payment form) and
 * includes a "run the sweep now" trigger for testing. Confirmed/paid bookings are never expired.
 */
function ReservationHoldCard({ holdHours }: { holdHours: number }) {
  const t = useDict(dict)
  const [hours, setHours] = useState(String(holdHours))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sweeping, setSweeping] = useState(false)
  const [sweepMsg, setSweepMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const save = async () => {
    setSaving(true); setSaved(false); setErr(null)
    const res = await setReservationHoldHoursAction(Number(hours))
    setSaving(false)
    if (res.ok) setSaved(true)
    else setErr(res.error ?? t.errGeneric)
  }
  const runSweep = async () => {
    setSweeping(true); setSweepMsg(null); setErr(null)
    const res = await runReservationTimeoutAction()
    setSweeping(false)
    if (res.ok) setSweepMsg(t.holdSweepMsg(res.scanned ?? 0, res.expired ?? 0, res.holdHours ?? 0))
    else setErr(t.holdRunErr)
  }

  return (
    <div style={card}>
      <div style={cardTitle}>{t.holdTitle}</div>
      <div style={cardHint}>
        {t.holdHint}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 200 }}>
          <label style={label}>{t.holdHoursLabel}</label>
          <input type="number" min={1} value={hours} onChange={(e) => { setHours(e.target.value); setSaved(false) }} style={input} />
        </div>
        <button type="button" onClick={save} disabled={saving} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--d-accent)', color: '#082A33', font: '700 13px var(--f-ui)', cursor: saving ? 'wait' : 'pointer' }}>
          {saving ? t.saving : t.save}
        </button>
        {saved && <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-green)' }}>{t.savedCheck}</span>}
        <div style={{ flexBasis: '100%', height: 0 }} />
        <button type="button" onClick={runSweep} disabled={sweeping} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,.14)', background: 'transparent', color: 'var(--d-text)', font: '700 13px var(--f-ui)', cursor: sweeping ? 'wait' : 'pointer' }}>
          {sweeping ? t.holdRunning : t.holdRunBtn}
        </button>
        {sweepMsg && <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-green)' }}>{sweepMsg}</span>}
        {err && <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-red)' }}>{err}</span>}
      </div>
    </div>
  )
}

/**
 * Card-deposit reconciliation: refunds Stripe card deposits that were CHARGED but never became a booking
 * (a 3-D Secure redirect stranded the tab, the session was lost, an async charge settled late). The grace
 * window is how long after capture we wait before treating a deposit as stranded. Money-safety backstop
 * for the pay-before-create card flow — never touches a created booking or a car. Runs on cron + here.
 */
function CardReconcileCard({ graceMinutes }: { graceMinutes: number }) {
  const t = useDict(dict)
  const [minutes, setMinutes] = useState(String(graceMinutes))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sweeping, setSweeping] = useState(false)
  const [sweepMsg, setSweepMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const save = async () => {
    setSaving(true); setSaved(false); setErr(null)
    const res = await setCardReconcileGraceMinutesAction(Number(minutes))
    setSaving(false)
    if (res.ok) setSaved(true)
    else setErr(res.error ?? t.errGeneric)
  }
  const runSweep = async () => {
    setSweeping(true); setSweepMsg(null); setErr(null)
    const res = await runCardReconcileAction()
    setSweeping(false)
    if (res.ok) setSweepMsg(t.reconcileSweepMsg(res.scanned ?? 0, res.refunded ?? 0, res.refundFailed ?? 0, res.graceMinutes ?? 0))
    else setErr(t.reconcileRunErr)
  }

  return (
    <div style={card}>
      <div style={cardTitle}>{t.reconcileTitle}</div>
      <div style={cardHint}>
        {t.reconcileHintA}<b>{t.reconcileHintBold}</b>{t.reconcileHintB}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 220 }}>
          <label style={label}>{t.reconcileMinutesLabel}</label>
          <input type="number" min={1} value={minutes} onChange={(e) => { setMinutes(e.target.value); setSaved(false) }} style={input} />
        </div>
        <button type="button" onClick={save} disabled={saving} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--d-accent)', color: '#082A33', font: '700 13px var(--f-ui)', cursor: saving ? 'wait' : 'pointer' }}>
          {saving ? t.saving : t.save}
        </button>
        {saved && <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-green)' }}>{t.savedCheck}</span>}
        <div style={{ flexBasis: '100%', height: 0 }} />
        <button type="button" onClick={runSweep} disabled={sweeping} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,.14)', background: 'transparent', color: 'var(--d-text)', font: '700 13px var(--f-ui)', cursor: sweeping ? 'wait' : 'pointer' }}>
          {sweeping ? t.reconcileRunning : t.reconcileRunBtn}
        </button>
        {sweepMsg && <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-green)' }}>{sweepMsg}</span>}
        {err && <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-red)' }}>{err}</span>}
      </div>
    </div>
  )
}

/**
 * Abandoned-DRAFT auto-delete: how long a saved (half-filled) booking FORM is kept before it is
 * swept. Entirely SEPARATE from the reservation-hold timeout above — a draft is just form data, no
 * booking or car is involved. Own action + a "run the sweep now" trigger for testing. Default 24h.
 */
function BookingDraftCard({ draftTtlHours }: { draftTtlHours: number }) {
  const t = useDict(dict)
  const [hours, setHours] = useState(String(draftTtlHours))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sweeping, setSweeping] = useState(false)
  const [sweepMsg, setSweepMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const save = async () => {
    setSaving(true); setSaved(false); setErr(null)
    const res = await setBookingDraftTtlHoursAction(Number(hours))
    setSaving(false)
    if (res.ok) setSaved(true)
    else setErr(res.error ?? t.errGeneric)
  }
  const runSweep = async () => {
    setSweeping(true); setSweepMsg(null); setErr(null)
    const res = await runBookingDraftCleanupAction()
    setSweeping(false)
    if (res.ok) setSweepMsg(t.draftSweepMsg(res.deleted ?? 0, res.ttlHours ?? 0))
    else setErr(t.draftRunErr)
  }

  return (
    <div style={card}>
      <div style={cardTitle}>{t.draftTitle}</div>
      <div style={cardHint}>
        {t.draftHintA}<b>{t.draftHintBold}</b>{t.draftHintB}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 200 }}>
          <label style={label}>{t.draftHoursLabel}</label>
          <input type="number" min={1} value={hours} onChange={(e) => { setHours(e.target.value); setSaved(false) }} style={input} />
        </div>
        <button type="button" onClick={save} disabled={saving} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--d-accent)', color: '#082A33', font: '700 13px var(--f-ui)', cursor: saving ? 'wait' : 'pointer' }}>
          {saving ? t.saving : t.save}
        </button>
        {saved && <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-green)' }}>{t.savedCheck}</span>}
        <div style={{ flexBasis: '100%', height: 0 }} />
        <button type="button" onClick={runSweep} disabled={sweeping} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,.14)', background: 'transparent', color: 'var(--d-text)', font: '700 13px var(--f-ui)', cursor: sweeping ? 'wait' : 'pointer' }}>
          {sweeping ? t.draftRunning : t.draftRunBtn}
        </button>
        {sweepMsg && <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-green)' }}>{sweepMsg}</span>}
        {err && <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-red)' }}>{err}</span>}
      </div>
    </div>
  )
}
