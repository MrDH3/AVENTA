import { Prisma } from '@prisma/client'
import type { Currency } from '@prisma/client'
import { prisma } from './db'

/** Base currency for all stored car prices / reporting. */
export const BASE_CURRENCY: Currency = 'EUR'

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  RUB: '₽',
  TRY: '₺',
  USDT: '₮',
  USDC: 'USDC',
}

/** Fallback rates (1 EUR = X) used if the DB has none yet. Admin-editable in Settings. */
export const FALLBACK_RATES: Record<Currency, number> = {
  EUR: 1,
  USD: 1.08,
  RUB: 98,
  TRY: 38,
  USDT: 1.08,
  USDC: 1.08,
}

export type Money = Prisma.Decimal
export const D = (v: Prisma.Decimal.Value): Prisma.Decimal => new Prisma.Decimal(v)

/** Round to 2 dp (money) as a Decimal. */
export function round2(v: Prisma.Decimal.Value): Prisma.Decimal {
  return new Prisma.Decimal(v).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
}

/** Load active currency rates from DB, falling back to constants. */
export async function loadRates(): Promise<Record<Currency, number>> {
  const rows = await prisma.currencyRate.findMany()
  const out = { ...FALLBACK_RATES }
  for (const r of rows) out[r.code] = Number(r.rateFromBase)
  return out
}

/** Convert an amount in BASE currency into `to`, using provided or loaded rates. */
export function convertFromBase(
  amountBase: Prisma.Decimal.Value,
  to: Currency,
  rates: Record<Currency, number>,
): Prisma.Decimal {
  const rate = rates[to] ?? 1
  return round2(new Prisma.Decimal(amountBase).mul(rate))
}

export function fxRate(to: Currency, rates: Record<Currency, number>): number {
  return rates[to] ?? 1
}

export function formatMoney(amount: Prisma.Decimal.Value, currency: Currency): string {
  const n = Number(amount)
  const sym = CURRENCY_SYMBOLS[currency]
  const isCrypto = currency === 'USDT' || currency === 'USDC'
  const body = n.toLocaleString('en-US', {
    minimumFractionDigits: isCrypto ? 2 : 0,
    maximumFractionDigits: 2,
  })
  // symbol placement: € before, crypto codes after
  if (currency === 'USDC') return `${body} USDC`
  if (currency === 'USDT') return `₮${body}`
  return `${sym}${body}`
}
