import { Prisma } from '@prisma/client'
import type { Car, Currency, InsuranceType, Service } from '@prisma/client'
import { convertFromBase, fxRate, round2 } from './money'
import { rentalDays } from './availability'

/** Insurance day-rate as a fraction of the car's daily price (in base currency). */
export const INSURANCE_RATE: Record<InsuranceType, number> = {
  BASIC: 0, // included
  EXTENDED: 0.15,
  FULL_NO_FRANCHISE: 0.28,
}

export interface ExtraSelection {
  service: Pick<Service, 'id' | 'nameRu' | 'nameEn' | 'price' | 'unit'>
  qty: number
}

export interface QuoteInput {
  car: Pick<Car, 'pricePerDay' | 'deposit'>
  start: Date
  end: Date
  extras: ExtraSelection[]
  insuranceType: InsuranceType
  currency: Currency
  rates: Record<Currency, number>
}

export interface Quote {
  days: number
  currency: Currency
  fxRate: number
  rentBase: Prisma.Decimal
  rentTotal: Prisma.Decimal
  extrasTotal: Prisma.Decimal
  insuranceTotal: Prisma.Decimal
  subtotal: Prisma.Decimal
  deposit: Prisma.Decimal
  baseTotal: Prisma.Decimal
  extraLines: { name: string; qty: number; total: Prisma.Decimal }[]
}

/** Compute a full price quote in the requested currency (car prices are in base/EUR). */
export function quote(input: QuoteInput): Quote {
  const { car, start, end, extras, insuranceType, currency, rates } = input
  const days = rentalDays(start, end)
  const rate = fxRate(currency, rates)

  const rentBase = round2(new Prisma.Decimal(car.pricePerDay).mul(days))

  let extrasBase = new Prisma.Decimal(0)
  const extraLines: Quote['extraLines'] = []
  for (const e of extras) {
    const unit = new Prisma.Decimal(e.service.price)
    const qty = Math.max(1, e.qty)
    const lineBase = round2(
      e.service.unit === 'per_day' ? unit.mul(days).mul(qty) : unit.mul(qty),
    )
    extrasBase = extrasBase.add(lineBase)
    extraLines.push({
      name: e.service.nameEn,
      qty,
      total: convertFromBase(lineBase, currency, rates),
    })
  }

  const insBase = round2(
    new Prisma.Decimal(car.pricePerDay).mul(INSURANCE_RATE[insuranceType]).mul(days),
  )

  const subtotalBase = round2(rentBase.add(extrasBase).add(insBase))

  return {
    days,
    currency,
    fxRate: rate,
    rentBase,
    rentTotal: convertFromBase(rentBase, currency, rates),
    extrasTotal: convertFromBase(extrasBase, currency, rates),
    insuranceTotal: convertFromBase(insBase, currency, rates),
    subtotal: convertFromBase(subtotalBase, currency, rates),
    deposit: convertFromBase(car.deposit, currency, rates),
    baseTotal: subtotalBase,
    extraLines,
  }
}

/** AVN-2026-0042 style human booking numbers. */
export function bookingNumber(seq: number, year = new Date().getFullYear()): string {
  return `AVN-${year}-${String(seq).padStart(4, '0')}`
}
