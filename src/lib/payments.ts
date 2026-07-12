import 'server-only'
import QRCode from 'qrcode'
import Stripe from 'stripe'
import type { Currency } from '@prisma/client'
import { env } from './env'

/**
 * ✅ THE ACTUALLY-WIRED payment path (env-based). This file + `server/payment-actions.ts` create real
 * Stripe PaymentIntents / PayPal orders and generate crypto QR codes; the Stripe webhook at
 * /api/webhooks/stripe (signature-verified) confirms them. It is gated purely on env vars
 * (STRIPE_SECRET_KEY / PAYPAL_CLIENT_ID…), so it is DORMANT until those are set — but it is the path
 * that works when they are. The manual bank/crypto flow (lib/payment-settings.ts) is the only method
 * LIVE today.
 *
 * NOTE: this is SEPARATE from and redundant with the admin-configurable adapter framework in
 * `lib/payment-gateway/*`, whose adapters are all `notImplemented` STUBS. A future go-live must pick
 * one stack. See the banner in lib/payment-gateway/interface.ts.
 */

// ── Crypto ────────────────────────────────────────────────────────────
export interface CryptoOption {
  token: 'USDT' | 'USDC'
  network: 'TRC20' | 'ERC20' | 'BEP20' | 'POLYGON'
  address: string
}

export function cryptoOptions(): CryptoOption[] {
  const c = env.crypto
  const out: CryptoOption[] = []
  if (c.usdtTrc20) out.push({ token: 'USDT', network: 'TRC20', address: c.usdtTrc20 })
  if (c.usdtErc20) out.push({ token: 'USDT', network: 'ERC20', address: c.usdtErc20 })
  if (c.usdtBep20) out.push({ token: 'USDT', network: 'BEP20', address: c.usdtBep20 })
  if (c.usdcErc20) out.push({ token: 'USDC', network: 'ERC20', address: c.usdcErc20 })
  if (c.usdcPolygon) out.push({ token: 'USDC', network: 'POLYGON', address: c.usdcPolygon })
  return out
}

/** Server-generated QR data URL for a wallet address (no third-party call). */
export async function walletQr(address: string): Promise<string> {
  return QRCode.toDataURL(address, { margin: 1, width: 240, color: { dark: '#0C3B45', light: '#ffffff' } })
}

// ── Stripe ────────────────────────────────────────────────────────────
let stripeClient: Stripe | null = null
export function stripe(): Stripe | null {
  if (!env.stripe.secret) return null
  if (!stripeClient) stripeClient = new Stripe(env.stripe.secret, { apiVersion: '2024-06-20' as Stripe.LatestApiVersion })
  return stripeClient
}

/**
 * Is Stripe card payment available? True only when BOTH the server secret and the client publishable
 * key are set (test or live). Used to surface the "Card" option in checkout. The webhook secret is a
 * separate concern (needed for the webhook to confirm, provided by the Stripe CLI / dashboard).
 */
export function stripeConfigured(): boolean {
  return Boolean(env.stripe.secret && env.stripe.publishable)
}

const ZERO_DECIMAL = new Set(['JPY', 'KRW'])
export function toStripeAmount(amount: number, currency: Currency): number {
  return ZERO_DECIMAL.has(currency) ? Math.round(amount) : Math.round(amount * 100)
}

/** Stripe supports these fiat currencies from our set. */
export function stripeSupports(currency: Currency): boolean {
  return currency === 'EUR' || currency === 'USD' || currency === 'RUB' || currency === 'TRY'
}

// ── PayPal (REST, sandbox/live) ───────────────────────────────────────
function paypalBase(): string {
  return env.paypal.envName === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'
}

export function paypalConfigured(): boolean {
  return Boolean(env.paypal.clientId && env.paypal.clientSecret)
}

async function paypalToken(): Promise<string | null> {
  if (!paypalConfigured()) return null
  const auth = Buffer.from(`${env.paypal.clientId}:${env.paypal.clientSecret}`).toString('base64')
  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) return null
  const j = (await res.json()) as { access_token: string }
  return j.access_token
}

export async function createPayPalOrder(amount: number, currency: Currency, ref: string): Promise<{ id: string; approveUrl: string } | null> {
  const token = await paypalToken()
  if (!token) return null
  const res = await fetch(`${paypalBase()}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ reference_id: ref, amount: { currency_code: currency, value: amount.toFixed(2) } }],
      application_context: {
        brand_name: 'AVENTA',
        return_url: `${env.appUrl}/account?paypal=success`,
        cancel_url: `${env.appUrl}/account?paypal=cancel`,
      },
    }),
  })
  if (!res.ok) return null
  const j = (await res.json()) as { id: string; links: { rel: string; href: string }[] }
  const approve = j.links.find((l) => l.rel === 'approve')?.href ?? ''
  return { id: j.id, approveUrl: approve }
}
