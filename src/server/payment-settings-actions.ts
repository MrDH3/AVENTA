'use server'

import { revalidatePath } from 'next/cache'
import type { Currency } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireSettingsAccess } from '@/lib/auth'
import { savePaymentSettings, WALLET_SLOTS } from '@/lib/payment-settings'
import { logAudit } from '@/lib/audit'

export interface PaySaveResult {
  ok: boolean
  error?: string
  savedAt?: number
}

const RATE_CODES: Currency[] = ['EUR', 'USD', 'RUB', 'TRY', 'USDT', 'USDC']
const RATE_SYMBOL: Record<Currency, string> = { EUR: '€', USD: '$', RUB: '₽', TRY: '₺', USDT: '₮', USDC: 'USDC' }

/**
 * Save the whole payment-settings form. ADMIN/OWNER only. Persists Setting rows
 * (deposit %, base currency, method toggles, crypto wallets, bank details) AND
 * the exchange-rate rows (CurrencyRate) in one submit.
 */
export async function savePaymentSettingsAction(_prev: PaySaveResult, formData: FormData): Promise<PaySaveResult> {
  let staffId: string
  try {
    const staff = await requireSettingsAccess()
    staffId = staff.id
  } catch {
    return { ok: false, error: 'Доступ только для администратора или владельца' }
  }

  const str = (k: string) => (formData.get(k) == null ? undefined : String(formData.get(k)))
  const values: Record<string, string> = {}

  const dp = str('pay_deposit_percent')
  if (dp !== undefined) values.pay_deposit_percent = String(Math.min(100, Math.max(0, Math.round(Number(dp) || 0))))
  const bc = str('pay_base_currency')
  if (bc !== undefined) values.pay_base_currency = bc === 'USD' ? 'USD' : 'EUR'

  // Toggles: an unchecked checkbox sends nothing, a checked one sends 'on'.
  values.pay_method_card = formData.get('pay_method_card') === 'on' ? '1' : '0'
  values.pay_method_bank = formData.get('pay_method_bank') === 'on' ? '1' : '0'
  values.pay_method_crypto = formData.get('pay_method_crypto') === 'on' ? '1' : '0'

  for (const w of WALLET_SLOTS) {
    const v = str(w.key)
    if (v !== undefined) values[w.key] = v.trim()
  }
  for (const k of ['pay_bank_account_name', 'bank_iban', 'bank_swift', 'pay_bank_local']) {
    const v = str(k)
    if (v !== undefined) values[k] = v.trim()
  }

  await savePaymentSettings(values)

  // Exchange rates (rate_<CODE>) → CurrencyRate. EUR base stays 1.
  const rateOps = []
  for (const code of RATE_CODES) {
    const raw = str(`rate_${code}`)
    if (raw === undefined) continue
    const rate = code === 'EUR' ? 1 : Number(raw)
    if (!Number.isFinite(rate) || rate <= 0) continue
    rateOps.push(
      prisma.currencyRate.upsert({
        where: { code },
        update: { rateFromBase: rate, active: true },
        create: { code, symbol: RATE_SYMBOL[code], rateFromBase: rate, active: true },
      }),
    )
  }
  if (rateOps.length) await prisma.$transaction(rateOps)

  await logAudit({ userId: staffId, action: 'payment.settings.save', entity: 'Setting', entityId: 'payment' })
  revalidatePath('/admin/settings/payments')
  revalidatePath('/booking')
  return { ok: true, savedAt: Date.now() }
}
