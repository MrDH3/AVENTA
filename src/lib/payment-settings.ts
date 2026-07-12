import 'server-only'
import { prisma } from './db'
import { cryptoOptions as envCryptoOptions } from './payments'

/**
 * Admin/owner-configurable payment settings, stored in the Setting key/value
 * table (group 'payment'). Values here are NOT secret — crypto wallet addresses
 * and bank IBAN/SWIFT are meant to be shown to the paying customer. If a truly
 * secret field is ever added (e.g. a gateway API key), encrypt it with the
 * shared lib/crypto pipeline (encryptSecret) exactly like provider-credentials.ts,
 * and store the ciphertext/iv/authTag instead of plaintext — never return it to
 * the browser. Saving is gated to ADMIN/OWNER in payment-settings-actions.ts.
 */

export type PayMethod = 'card' | 'bank' | 'crypto'
export type CryptoToken = 'USDT' | 'USDC'

export interface CryptoWallet {
  key: string
  token: CryptoToken
  network: string
  address: string
}

export interface BankDetails {
  accountName: string
  iban: string
  swift: string
  local: string
}

/** Public config consumed by the customer payment step (no secrets). */
export interface PaymentPublicConfig {
  depositPercent: number
  baseCurrency: 'EUR' | 'USD'
  methods: Record<PayMethod, boolean>
  wallets: CryptoWallet[]
  bank: BankDetails
}

/** The five wallet slots (settings key → token/network). */
export const WALLET_SLOTS: { key: string; token: CryptoToken; network: string }[] = [
  { key: 'pay_usdt_trc20', token: 'USDT', network: 'TRC20' },
  { key: 'pay_usdt_erc20', token: 'USDT', network: 'ERC20' },
  { key: 'pay_usdt_bep20', token: 'USDT', network: 'BEP20' },
  { key: 'pay_usdc_erc20', token: 'USDC', network: 'ERC20' },
  { key: 'pay_usdc_polygon', token: 'USDC', network: 'POLYGON' },
]

/** All setting keys this module owns (bank_iban/bank_swift are shared with the general company card). */
export const PAYMENT_KEYS = [
  'pay_deposit_percent',
  'pay_base_currency',
  'pay_method_card',
  'pay_method_bank',
  'pay_method_crypto',
  ...WALLET_SLOTS.map((w) => w.key),
  'pay_bank_account_name',
  'bank_iban',
  'bank_swift',
  'pay_bank_local',
] as const

function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return 15
  return Math.min(100, Math.max(0, Math.round(n)))
}

async function readSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany({ where: { key: { in: [...PAYMENT_KEYS] } } })
  const out: Record<string, string> = {}
  for (const r of rows) out[r.key] = r.value
  return out
}

/** Raw values for the admin settings form (all keys, plaintext). */
export async function getPaymentSettingsAdmin(): Promise<Record<string, string>> {
  const s = await readSettings()
  return {
    pay_deposit_percent: s.pay_deposit_percent ?? '15',
    pay_base_currency: s.pay_base_currency === 'USD' ? 'USD' : 'EUR',
    pay_method_card: s.pay_method_card ?? '0',
    pay_method_bank: s.pay_method_bank ?? '1',
    pay_method_crypto: s.pay_method_crypto ?? '1',
    ...Object.fromEntries(WALLET_SLOTS.map((w) => [w.key, s[w.key] ?? ''])),
    pay_bank_account_name: s.pay_bank_account_name ?? '',
    bank_iban: s.bank_iban ?? '',
    bank_swift: s.bank_swift ?? '',
    pay_bank_local: s.pay_bank_local ?? '',
  }
}

/** Public payment config for the customer booking step. Falls back to env wallets if the DB has none. */
export async function getPaymentConfig(): Promise<PaymentPublicConfig> {
  const s = await readSettings()
  const depositPercent = clampPercent(Number(s.pay_deposit_percent ?? '15'))
  const baseCurrency: 'EUR' | 'USD' = s.pay_base_currency === 'USD' ? 'USD' : 'EUR'
  const methods: Record<PayMethod, boolean> = {
    card: s.pay_method_card === '1',
    bank: (s.pay_method_bank ?? '1') === '1',
    crypto: (s.pay_method_crypto ?? '1') === '1',
  }

  let wallets: CryptoWallet[] = WALLET_SLOTS
    .map((w) => ({ key: w.key, token: w.token, network: w.network, address: (s[w.key] ?? '').trim() }))
    .filter((w) => w.address.length > 0)
  // Back-compat: if nothing configured in DB yet, surface env-configured wallets.
  if (wallets.length === 0) {
    wallets = envCryptoOptions().map((o, i) => ({ key: `env${i}`, token: o.token, network: o.network, address: o.address }))
  }

  const bank: BankDetails = {
    accountName: (s.pay_bank_account_name ?? '').trim(),
    iban: (s.bank_iban ?? '').trim(),
    swift: (s.bank_swift ?? '').trim(),
    local: (s.pay_bank_local ?? '').trim(),
  }

  return { depositPercent, baseCurrency, methods, wallets, bank }
}

/** Upsert a batch of payment settings. Caller MUST have verified ADMIN/OWNER. */
export async function savePaymentSettings(values: Record<string, string>): Promise<void> {
  const entries = Object.entries(values).filter(([k]) => (PAYMENT_KEYS as readonly string[]).includes(k))
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value, group: 'payment' },
        create: { key, value, group: 'payment' },
      }),
    ),
  )
}
