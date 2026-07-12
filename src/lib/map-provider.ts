import 'server-only'
import type { Prisma } from '@prisma/client'
import { prisma } from './db'
import { encryptSecret, decryptSecret, type EncryptedSecret } from './crypto'

/**
 * Pluggable map provider — admin picks OSM (default, always works) / Google / Yandex, exactly the
 * "dormant-but-ready" pattern of PaymentProvider. Google & Yandex need an API key (stored AES-256-GCM
 * encrypted at rest); a provider is only usable once its key is configured, otherwise the app RESOLVES
 * back to OSM so maps never break. Map JS SDK keys are client-side (referrer-restricted) keys, so the
 * resolved provider's key IS handed to the browser — but only the ACTIVE provider's, and only when set.
 */
export type MapProvider = 'osm' | 'google' | 'yandex'
export const MAP_PROVIDERS: MapProvider[] = ['osm', 'google', 'yandex']

type SecretMap = Record<string, EncryptedSecret>
function asSecrets(v: unknown): SecretMap {
  return v && typeof v === 'object' ? (v as SecretMap) : {}
}

export interface MapPublicConfig {
  activeProvider: MapProvider // what the admin selected
  resolvedProvider: MapProvider // active if usable (osm always; google/yandex need a key), else osm
  configured: { google: boolean; yandex: boolean }
}

export async function getMapConfig(): Promise<MapPublicConfig> {
  const row = await prisma.mapProviderConfig.findUnique({ where: { id: 'default' } })
  const secrets = asSecrets(row?.secrets)
  const active = (row?.activeProvider as MapProvider) || 'osm'
  const configured = { google: Boolean(secrets.google?.ciphertext), yandex: Boolean(secrets.yandex?.ciphertext) }
  const usable = (p: MapProvider) => p === 'osm' || (p === 'google' && configured.google) || (p === 'yandex' && configured.yandex)
  const activeSafe: MapProvider = MAP_PROVIDERS.includes(active) ? active : 'osm'
  return { activeProvider: activeSafe, resolvedProvider: usable(activeSafe) ? activeSafe : 'osm', configured }
}

export async function saveMapConfig(input: { activeProvider: MapProvider; googleKey?: string; yandexKey?: string }): Promise<void> {
  const existing = await prisma.mapProviderConfig.findUnique({ where: { id: 'default' } })
  const secrets: SecretMap = { ...asSecrets(existing?.secrets) }
  if (input.googleKey?.trim()) secrets.google = encryptSecret(input.googleKey.trim())
  if (input.yandexKey?.trim()) secrets.yandex = encryptSecret(input.yandexKey.trim())
  const provider: MapProvider = MAP_PROVIDERS.includes(input.activeProvider) ? input.activeProvider : 'osm'
  await prisma.mapProviderConfig.upsert({
    where: { id: 'default' },
    update: { activeProvider: provider, secrets: secrets as unknown as Prisma.InputJsonValue },
    create: { id: 'default', activeProvider: provider, secrets: secrets as unknown as Prisma.InputJsonValue },
  })
}

/** Resolved provider + its (decrypted) client key for the browser map SDK. OSM → no key needed. */
export async function getMapClientConfig(): Promise<{ provider: MapProvider; apiKey: string | null }> {
  const cfg = await getMapConfig()
  if (cfg.resolvedProvider === 'osm') return { provider: 'osm', apiKey: null }
  const row = await prisma.mapProviderConfig.findUnique({ where: { id: 'default' } })
  const s = asSecrets(row?.secrets)[cfg.resolvedProvider]
  if (!s?.ciphertext) return { provider: 'osm', apiKey: null }
  try {
    return { provider: cfg.resolvedProvider, apiKey: decryptSecret(s.ciphertext, s.iv, s.authTag) }
  } catch {
    return { provider: 'osm', apiKey: null }
  }
}
