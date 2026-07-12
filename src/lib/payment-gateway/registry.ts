/**
 * The payment-provider registry — the ONE place that knows every concrete
 * processor. The rest of the app resolves processors through here by key and
 * only ever sees the PaymentProviderAdapter interface. Adding a new processor
 * = drop an adapter file and register it here; no checkout code changes.
 */
import type { PaymentProviderAdapter, PaymentProviderKey } from './interface'
import { PAYMENT_PROVIDER_KEYS } from './interface'
import { stripeAdapter } from './adapters/stripe'
import { paypalAdapter } from './adapters/paypal'
import { paytrAdapter } from './adapters/paytr'
import { iyzicoAdapter } from './adapters/iyzico'

// Coinbase Commerce removed: shutting down 2026-03-31 for non-US/SG merchants and never
// available to a Turkey entity. Its adapter file is deleted so the slot cannot reappear.
export const PAYMENT_ADAPTERS: Record<PaymentProviderKey, PaymentProviderAdapter> = {
  stripe: stripeAdapter,
  paypal: paypalAdapter,
  paytr: paytrAdapter,
  iyzico: iyzicoAdapter,
}

/** Adapters in a stable display order. */
export function listAdapters(): PaymentProviderAdapter[] {
  return PAYMENT_PROVIDER_KEYS.map((k) => PAYMENT_ADAPTERS[k])
}

export function getAdapter(key: PaymentProviderKey): PaymentProviderAdapter {
  return PAYMENT_ADAPTERS[key]
}

export function isProviderKey(v: string): v is PaymentProviderKey {
  return (PAYMENT_PROVIDER_KEYS as string[]).includes(v)
}

export type { PaymentProviderAdapter, PaymentProviderKey }
