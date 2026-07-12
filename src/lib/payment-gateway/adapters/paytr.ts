import type { PaymentProviderAdapter } from '../interface'
import { notImplemented } from '../interface'

/** Turkish card acquirer — eligible for a Turkey-registered company. */
export const paytrAdapter: PaymentProviderAdapter = {
  key: 'paytr',
  displayName: 'PayTR',
  capabilities: { cards: true, crypto: false, refunds: true },
  credentialFields: [
    { key: 'merchantId', label: 'Merchant ID', secret: false, placeholder: '000000' },
    { key: 'merchantKey', label: 'Merchant Key', secret: true },
    { key: 'merchantSalt', label: 'Merchant Salt', secret: true },
  ],
  availability: { blocked: false },
  help: 'PayTR Mağaza Paneli → Ayarlar → Entegrasyon · callback → /api/payments/webhook/paytr',
  ...notImplemented,
}
