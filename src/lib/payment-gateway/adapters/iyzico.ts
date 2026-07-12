import type { PaymentProviderAdapter } from '../interface'
import { notImplemented } from '../interface'

/** Turkish payment institution — eligible for a Turkey-registered company. */
export const iyzicoAdapter: PaymentProviderAdapter = {
  key: 'iyzico',
  displayName: 'iyzico',
  capabilities: { cards: true, crypto: false, refunds: true },
  credentialFields: [
    { key: 'apiKey', label: 'API Key', secret: true },
    { key: 'secretKey', label: 'Secret Key', secret: true },
  ],
  availability: { blocked: false },
  help: 'merchant.iyzipay.com → Ayarlar → API Anahtarları · callback → /api/payments/webhook/iyzico',
  ...notImplemented,
}
