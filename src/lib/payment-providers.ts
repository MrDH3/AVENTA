import 'server-only'
import type { Prisma } from '@prisma/client'
import { prisma } from './db'
import { encryptSecret, decryptSecret, type EncryptedSecret } from './crypto'
import { listAdapters, getAdapter, isProviderKey } from './payment-gateway/registry'
import type { PaymentProviderAdapter, PaymentProviderKey } from './payment-gateway/interface'

/**
 * Settings/storage layer for the payment-provider framework — the exact analogue
 * of lib/provider-credentials.ts (OAuth), but for payment processors.
 *
 * The DB row (`PaymentProvider`) stores only config + toggle; the provider's
 * identity, capabilities and credential shape come from its adapter in
 * lib/payment-gateway. Secret credential fields are AES-256-GCM encrypted via the
 * shared lib/crypto pipeline and NEVER returned to the browser.
 */

export type { PaymentProviderKey } from './payment-gateway/interface'
export { PAYMENT_PROVIDER_KEYS } from './payment-gateway/interface'

type ConfigMap = Record<string, string>
type SecretMap = Record<string, EncryptedSecret>

function asConfig(v: Prisma.JsonValue | null | undefined): ConfigMap {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as ConfigMap) : {}
}
function asSecrets(v: Prisma.JsonValue | null | undefined): SecretMap {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as unknown as SecretMap) : {}
}

/** Per-field status shown in the admin UI. Secret values are NEVER included. */
export interface ProviderFieldStatus {
  key: string
  label: string
  secret: boolean
  placeholder?: string
  required: boolean
  /** Current value for NON-secret fields; secret fields are always null. */
  value: string | null
  /** Whether a value is stored (for secrets: a ciphertext exists). */
  hasValue: boolean
}

/** Full, browser-safe status for one provider. Contains no secrets. */
export interface PaymentProviderStatus {
  key: PaymentProviderKey
  name: string
  enabled: boolean
  capabilities: { cards: boolean; crypto: boolean; refunds: boolean }
  blocked: boolean
  blockedNote?: string
  help: string
  fields: ProviderFieldStatus[]
  /** All required credentials present. */
  configured: boolean
  /** Actually usable in checkout: enabled AND configured AND NOT blocked. */
  available: boolean
}

function fieldRequired(f: PaymentProviderAdapter['credentialFields'][number]): boolean {
  return f.required !== false
}

function buildStatus(
  adapter: PaymentProviderAdapter,
  row: { enabled: boolean; config: Prisma.JsonValue | null; secrets: Prisma.JsonValue | null } | null,
): PaymentProviderStatus {
  const config = asConfig(row?.config)
  const secrets = asSecrets(row?.secrets)
  const enabled = row?.enabled ?? false

  const fields: ProviderFieldStatus[] = adapter.credentialFields.map((f) => {
    const hasValue = f.secret
      ? Boolean(secrets[f.key]?.ciphertext)
      : Boolean((config[f.key] ?? '').trim())
    return {
      key: f.key,
      label: f.label,
      secret: f.secret,
      placeholder: f.placeholder,
      required: fieldRequired(f),
      value: f.secret ? null : config[f.key] ?? null, // never echo a secret
      hasValue,
    }
  })

  const configured = adapter.credentialFields.every((f) => {
    if (!fieldRequired(f)) return true
    return f.secret ? Boolean(secrets[f.key]?.ciphertext) : Boolean((config[f.key] ?? '').trim())
  })

  const blocked = adapter.availability.blocked
  return {
    key: adapter.key,
    name: adapter.displayName,
    enabled,
    capabilities: adapter.capabilities,
    blocked,
    blockedNote: adapter.availability.note,
    help: adapter.help,
    fields,
    configured,
    available: enabled && configured && !blocked,
  }
}

/** All five providers' statuses for the admin screen. Never returns secrets. */
export async function getPaymentProviderStatuses(): Promise<PaymentProviderStatus[]> {
  const rows = await prisma.paymentProvider.findMany()
  const byKey = new Map(rows.map((r) => [r.key, r]))
  return listAdapters().map((a) => buildStatus(a, byKey.get(a.key) ?? null))
}

export async function getPaymentProviderStatus(key: PaymentProviderKey): Promise<PaymentProviderStatus> {
  const row = await prisma.paymentProvider.findUnique({ where: { key } })
  return buildStatus(getAdapter(key), row)
}

/** Public list of providers a customer can actually pay with (no secrets). */
export interface EnabledProvider {
  key: PaymentProviderKey
  name: string
  cards: boolean
  crypto: boolean
}

/**
 * Providers to surface in checkout: enabled AND fully configured AND not blocked.
 * Blocked processors (e.g. Stripe/PayPal for a Turkey entity) never appear here,
 * even if credentials are saved and the toggle is on.
 */
export async function getEnabledPaymentProviders(): Promise<EnabledProvider[]> {
  const statuses = await getPaymentProviderStatuses()
  return statuses
    .filter((s) => s.available)
    .map((s) => ({ key: s.key, name: s.name, cards: s.capabilities.cards, crypto: s.capabilities.crypto }))
}

/**
 * Admin save. Secret fields: a non-blank value is encrypted & replaces the old
 * one; a blank field keeps the existing ciphertext. Non-secret fields are stored
 * as-is (blank clears them). NEVER logs or returns secret values.
 */
export async function savePaymentProvider(
  key: PaymentProviderKey,
  input: { enabled: boolean; fields: Record<string, string> },
): Promise<void> {
  const adapter = getAdapter(key)
  const existing = await prisma.paymentProvider.findUnique({ where: { key } })
  const config: ConfigMap = { ...asConfig(existing?.config) }
  const secrets: SecretMap = { ...asSecrets(existing?.secrets) }

  for (const f of adapter.credentialFields) {
    const raw = (input.fields[f.key] ?? '').trim()
    if (f.secret) {
      if (raw) secrets[f.key] = encryptSecret(raw) // replace only when a new value is typed
      // blank ⇒ keep the stored ciphertext untouched
    } else {
      if (raw) config[f.key] = raw
      else delete config[f.key]
    }
  }

  await prisma.paymentProvider.upsert({
    where: { key },
    update: { enabled: input.enabled, config: config as Prisma.InputJsonValue, secrets: secrets as unknown as Prisma.InputJsonValue },
    create: {
      key,
      enabled: input.enabled,
      config: config as Prisma.InputJsonValue,
      secrets: secrets as unknown as Prisma.InputJsonValue,
    },
  })
}

/**
 * Decrypt a provider's credentials — call ONLY at charge/webhook time, never into
 * any response. Returns null if disabled, blocked, or not configured.
 */
export async function getDecryptedProviderCredentials(
  key: PaymentProviderKey,
): Promise<{ config: ConfigMap; secrets: ConfigMap } | null> {
  const status = await getPaymentProviderStatus(key)
  if (!status.available) return null
  const row = await prisma.paymentProvider.findUnique({ where: { key } })
  if (!row) return null
  const config = asConfig(row.config)
  const encSecrets = asSecrets(row.secrets)
  const secrets: ConfigMap = {}
  for (const [k, v] of Object.entries(encSecrets)) {
    if (v?.ciphertext && v.iv && v.authTag) {
      try {
        secrets[k] = decryptSecret(v.ciphertext, v.iv, v.authTag)
      } catch {
        return null
      }
    }
  }
  return { config, secrets }
}

export { isProviderKey }
