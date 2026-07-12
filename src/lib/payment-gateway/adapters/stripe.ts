import type { PaymentProviderAdapter } from '../interface'
import { notImplemented } from '../interface'

/** Turkey-registered company cannot onboard Stripe — held but blocked. */
const TURKEY_BLOCK =
  'Требуется юридическое лицо в поддерживаемой стране — недоступно для компании, зарегистрированной в Турции. Настраивайте только при наличии подходящего зарубежного юр. лица.'

export const stripeAdapter: PaymentProviderAdapter = {
  key: 'stripe',
  displayName: 'Stripe',
  capabilities: { cards: true, crypto: false, refunds: true },
  credentialFields: [
    { key: 'publishableKey', label: 'Publishable key (pk_…)', secret: false, placeholder: 'pk_live_…' },
    { key: 'secretKey', label: 'Secret key (sk_…)', secret: true },
    { key: 'webhookSecret', label: 'Webhook signing secret (whsec_…)', secret: true },
  ],
  availability: { blocked: true, note: TURKEY_BLOCK },
  help: 'dashboard.stripe.com/apikeys · webhook → /api/payments/webhook/stripe',
  ...notImplemented,
}
