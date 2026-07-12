/**
 * The pluggable payment-provider framework — the CORE abstraction.
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │ ⚠️ STATUS: UNFINISHED SCAFFOLDING — NOT WIRED TO CHARGE. Every adapter in ./adapters/* │
 * │ spreads `...notImplemented` (createPayment/handleWebhook return 'not_implemented',     │
 * │ verifySignature returns false), so even a fully-credentialed, enabled, unblocked       │
 * │ provider here CANNOT take money. The webhook routes these adapters reference            │
 * │ (/api/payments/webhook/*) DO NOT EXIST. Do not treat this framework as functional.     │
 * │                                                                                         │
 * │ The path that is ACTUALLY WIRED to charge today is the SEPARATE, legacy env-based stack │
 * │ in `lib/payments.ts` + `server/payment-actions.ts` (Stripe PaymentIntent / PayPal       │
 * │ order), with the real signature-verified Stripe webhook at /api/webhooks/stripe. These  │
 * │ two stacks are redundant; a future "go-live" must pick ONE and finish its webhook.      │
 * │ Meanwhile the only LIVE method is manual bank transfer + crypto (lib/payment-settings). │
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 *
 * Every payment processor (Stripe, PayPal, PayTR, iyzico, …) implements this ONE
 * interface. Checkout and the booking flow talk only to this contract — never to a
 * specific processor directly. Enabling/disabling and crediting a processor happens
 * entirely from the admin settings screen, never from code.
 *
 * Coinbase Commerce was intentionally removed: it is shutting down on 2026-03-31 for
 * non-US/Singapore merchants and was never available to a Turkey-registered entity.
 * There is deliberately no 'coinbase' key here, so it cannot be selected or configured.
 *
 * This file intentionally contains NO processor logic and NO secrets — only the
 * shared types. Adapters live in ./adapters/*, the registry in ./registry.
 */

export type PaymentProviderKey = 'stripe' | 'paypal' | 'paytr' | 'iyzico'

export const PAYMENT_PROVIDER_KEYS: PaymentProviderKey[] = ['stripe', 'paypal', 'paytr', 'iyzico']

/** What a processor is able to do — drives which options a customer is offered. */
export interface PaymentCapabilities {
  /** Accepts card payments (Visa/Mastercard/…). */
  cards: boolean
  /** Accepts crypto payments (stablecoins, BTC, …). */
  crypto: boolean
  /** Supports programmatic refunds. */
  refunds: boolean
}

/**
 * One credential a processor needs. `secret: true` fields are encrypted at rest
 * (AES-256-GCM, shared lib/crypto pipeline) and never returned to the browser.
 * Non-secret fields (publishable keys, merchant ids) are stored/echoed as-is.
 */
export interface ProviderCredentialField {
  key: string
  label: string
  secret: boolean
  placeholder?: string
  /** Required for the provider to count as "configured". Defaults to true. */
  required?: boolean
}

/**
 * Availability gate independent of credentials. Some processors cannot legally
 * onboard a company in certain jurisdictions (e.g. Stripe/PayPal for a
 * Turkey-registered entity). Such a processor may hold credentials but is
 * blocked from going live until an eligible entity exists.
 */
export interface ProviderAvailability {
  blocked: boolean
  note?: string
}

export interface CreatePaymentInput {
  bookingId: string
  amount: number
  currency: string
  description?: string
  returnUrl?: string
  metadata?: Record<string, string>
}

export interface CreatePaymentResult {
  ok: boolean
  /** Hosted-checkout / approval URL to redirect the customer to. */
  redirectUrl?: string
  /** Client secret for an in-page confirmation (e.g. Stripe Payment Element). */
  clientSecret?: string
  /** The processor's order/intent id, to be stored on the Payment row. */
  providerRef?: string
  error?: string
}

/** A raw inbound webhook/callback, handed to the adapter untouched for verification. */
export interface WebhookRequest {
  headers: Record<string, string>
  rawBody: string
  query?: Record<string, string>
}

export interface WebhookResult {
  ok: boolean
  event?: string
  bookingId?: string
  providerRef?: string
  status?: 'PAID' | 'FAILED' | 'PENDING'
  error?: string
}

/**
 * The single contract every processor implements. An adapter fully describes
 * itself (identity, capabilities, credential requirements, availability) AND
 * implements the runtime operations. The rest of the app depends on this type,
 * not on any concrete processor.
 */
export interface PaymentProviderAdapter {
  key: PaymentProviderKey
  displayName: string
  capabilities: PaymentCapabilities
  /** Declares which credentials this processor needs (drives the admin form + storage). */
  credentialFields: ProviderCredentialField[]
  availability: ProviderAvailability
  /** Short admin hint: where to get keys / configure the webhook. */
  help: string

  /** Begin a payment. Returns a redirect URL or client secret the checkout acts on. */
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>
  /** Parse & act on an inbound webhook/callback (after verifySignature passes). */
  handleWebhook(req: WebhookRequest): Promise<WebhookResult>
  /** Verify the authenticity of an inbound webhook/callback signature. */
  verifySignature(req: WebhookRequest): Promise<boolean> | boolean
}

/** Thrown by stub adapters whose runtime logic is not implemented yet. */
export const NOT_IMPLEMENTED = 'not_implemented' as const

/** Shared stub body so every un-built adapter fails identically & safely. */
export const notImplemented = {
  async createPayment(): Promise<CreatePaymentResult> {
    return { ok: false, error: NOT_IMPLEMENTED }
  },
  async handleWebhook(): Promise<WebhookResult> {
    return { ok: false, error: NOT_IMPLEMENTED }
  },
  verifySignature(): boolean {
    return false
  },
}
