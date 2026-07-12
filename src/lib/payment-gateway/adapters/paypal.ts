import type { PaymentProviderAdapter } from '../interface'
import { notImplemented } from '../interface'

/** Turkey-registered company cannot onboard PayPal for receiving — held but blocked. */
const TURKEY_BLOCK =
  'Требуется юридическое лицо в поддерживаемой стране — недоступно для компании, зарегистрированной в Турции. Настраивайте только при наличии подходящего зарубежного юр. лица.'

export const paypalAdapter: PaymentProviderAdapter = {
  key: 'paypal',
  displayName: 'PayPal',
  capabilities: { cards: true, crypto: false, refunds: true },
  credentialFields: [
    { key: 'clientId', label: 'Client ID', secret: false, placeholder: 'A…' },
    { key: 'clientSecret', label: 'Client Secret', secret: true },
    { key: 'webhookId', label: 'Webhook ID', secret: false, required: false },
  ],
  availability: { blocked: true, note: TURKEY_BLOCK },
  help: 'developer.paypal.com → Apps & Credentials · webhook → /api/payments/webhook/paypal',
  ...notImplemented,
}
