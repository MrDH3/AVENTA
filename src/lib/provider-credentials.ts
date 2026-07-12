import 'server-only'
import type { Prisma } from '@prisma/client'
import { prisma } from './db'
import { encryptSecret, decryptSecret } from './crypto'
import { env } from './env'

export type SocialProvider = 'google' | 'yandex' | 'telegram'
export const SOCIAL_PROVIDERS: SocialProvider[] = ['google', 'yandex', 'telegram']

/** Public config — NEVER includes the secret. */
export interface ProviderPublicConfig {
  provider: SocialProvider
  clientId: string | null
  enabled: boolean
  hasSecret: boolean
  configured: boolean // has clientId AND a stored secret
  source: 'db' | 'env' | 'none'
}

/** Transitional .env fallback used only when a provider has no DB row yet. */
function envFallback(provider: SocialProvider): { clientId?: string; secret?: string } {
  if (provider === 'google') return { clientId: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET }
  if (provider === 'yandex') return { clientId: process.env.YANDEX_CLIENT_ID, secret: process.env.YANDEX_CLIENT_SECRET }
  return { clientId: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME, secret: process.env.TELEGRAM_LOGIN_BOT_TOKEN || env.telegram.botToken }
}

/** DB is the source of truth. Falls back to .env only if there is no DB row. Never decrypts. */
export async function getProviderPublicConfig(provider: SocialProvider): Promise<ProviderPublicConfig> {
  const row = await prisma.providerCredential.findUnique({ where: { provider } })
  if (row) {
    const hasSecret = Boolean(row.encryptedClientSecret && row.secretIv && row.secretAuthTag)
    return {
      provider,
      clientId: row.clientId,
      enabled: row.enabled,
      hasSecret,
      configured: Boolean(row.clientId && hasSecret),
      source: 'db',
    }
  }
  const e = envFallback(provider)
  const hasSecret = Boolean(e.secret)
  const configured = Boolean(e.clientId && hasSecret)
  return {
    provider,
    clientId: e.clientId ?? null,
    enabled: configured, // env-only providers are "on" if fully configured
    hasSecret,
    configured,
    source: configured ? 'env' : 'none',
  }
}

export async function listProviderStatuses(): Promise<ProviderPublicConfig[]> {
  return Promise.all(SOCIAL_PROVIDERS.map(getProviderPublicConfig))
}

/** Providers whose social button should be rendered (enabled AND configured). */
export async function enabledConfiguredProviders(): Promise<SocialProvider[]> {
  const all = await listProviderStatuses()
  return all.filter((p) => p.enabled && p.configured).map((p) => p.provider)
}

/**
 * Decrypt the stored secret. Call ONLY at the moment of the OAuth token exchange —
 * never earlier, never into any response.
 */
export async function getDecryptedSecret(provider: SocialProvider): Promise<string | null> {
  const row = await prisma.providerCredential.findUnique({ where: { provider } })
  if (row?.encryptedClientSecret && row.secretIv && row.secretAuthTag) {
    try {
      return decryptSecret(row.encryptedClientSecret, row.secretIv, row.secretAuthTag)
    } catch {
      return null
    }
  }
  return envFallback(provider).secret ?? null // transitional
}

/** Credentials for a token exchange (clientId + decrypted secret), or null if unavailable/disabled. */
export async function getProviderAuthConfig(
  provider: SocialProvider,
): Promise<{ clientId: string; clientSecret: string } | null> {
  const pub = await getProviderPublicConfig(provider)
  if (!pub.enabled || !pub.clientId) return null
  const clientSecret = await getDecryptedSecret(provider)
  if (!clientSecret) return null
  return { clientId: pub.clientId, clientSecret }
}

/** Admin save. A non-empty clientSecret is encrypted & replaces the old one; blank keeps it. */
export async function saveProviderCredential(
  provider: SocialProvider,
  input: { clientId?: string; clientSecret?: string; enabled?: boolean },
): Promise<void> {
  const data: Prisma.ProviderCredentialUpdateInput = {}
  if (input.clientId !== undefined) data.clientId = input.clientId.trim() || null
  if (input.enabled !== undefined) data.enabled = input.enabled
  const newSecret = input.clientSecret?.trim()
  if (newSecret) {
    const enc = encryptSecret(newSecret)
    data.encryptedClientSecret = enc.ciphertext
    data.secretIv = enc.iv
    data.secretAuthTag = enc.authTag
  }
  await prisma.providerCredential.upsert({
    where: { provider },
    update: data,
    create: {
      provider,
      clientId: input.clientId?.trim() || null,
      enabled: input.enabled ?? false,
      ...(newSecret
        ? (() => {
            const enc = encryptSecret(newSecret)
            return { encryptedClientSecret: enc.ciphertext, secretIv: enc.iv, secretAuthTag: enc.authTag }
          })()
        : {}),
    },
  })
}
