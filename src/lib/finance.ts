import 'server-only'
import { Prisma } from '@prisma/client'
import type { Currency } from '@prisma/client'
import { prisma } from './db'
import { loadRates, BASE_CURRENCY, round2 } from './money'

/**
 * Finance module data layer — an informal SINGLE-ENTRY money tracker (income in / expenses out),
 * NOT double-entry accounting. Income is DERIVED from confirmed Payments (the authoritative source),
 * never stored, so it can't be faked. Only expenses + categories + reconciliation snapshots persist.
 *
 * MIXED CURRENCIES: payments/expenses can be in EUR/USD/RUB/TRY/USDT/USDC. We NEVER add different
 * currencies together as if equal. Every total is converted to the base currency (EUR) — income by
 * each payment's captured fxRate (the rate when it was taken), expenses by the frozen baseAmount
 * (converted at save time via admin rates). We ALSO expose a per-currency breakdown so raw amounts
 * are visible and nothing is silently summed.
 */

export const DEFAULT_EXPENSE_CATEGORIES: { key: string; nameRu: string; sortOrder: number }[] = [
  { key: 'fuel', nameRu: 'Топливо', sortOrder: 10 },
  { key: 'maintenance', nameRu: 'ТО и ремонт', sortOrder: 20 },
  { key: 'cleaning', nameRu: 'Мойка и уборка', sortOrder: 30 },
  { key: 'insurance', nameRu: 'Страхование', sortOrder: 40 },
  { key: 'salaries', nameRu: 'Зарплаты', sortOrder: 50 },
  { key: 'rent', nameRu: 'Офис / аренда', sortOrder: 60 },
  { key: 'marketing', nameRu: 'Маркетинг', sortOrder: 70 },
  { key: 'other', nameRu: 'Прочее', sortOrder: 80 },
]

/** Idempotently create the default categories the first time the module is opened. */
export async function ensureDefaultExpenseCategories(): Promise<void> {
  const count = await prisma.expenseCategory.count()
  if (count > 0) return
  await prisma.expenseCategory.createMany({ data: DEFAULT_EXPENSE_CATEGORIES })
}

export const DEFAULT_ACCOUNTS: { name: string; kind: string; currency: Currency; sortOrder: number }[] = [
  { name: 'Наличная касса', kind: 'CASH', currency: 'EUR', sortOrder: 10 },
  { name: 'Банковский счёт', kind: 'BANK', currency: 'EUR', sortOrder: 20 },
]

/** Idempotently create the default accounts (cash box + bank) on first open. */
export async function ensureDefaultAccounts(): Promise<void> {
  const count = await prisma.account.count()
  if (count > 0) return
  await prisma.account.createMany({ data: DEFAULT_ACCOUNTS })
}

/** Convert an amount in `currency` to base(EUR). `rates`: 1 EUR = rates[C] of currency C. */
export function toBase(amount: Prisma.Decimal.Value, currency: Currency, rates: Record<Currency, number>): number {
  if (currency === BASE_CURRENCY) return Number(round2(amount))
  const r = rates[currency] || 1
  return Number(round2(new Prisma.Decimal(amount).div(r)))
}

/** Convert a payment to base(EUR), preferring its captured fxRate; guard the schema default of 1. */
function paymentToBase(p: { amount: Prisma.Decimal; currency: Currency; fxRate: Prisma.Decimal }, rates: Record<Currency, number>): number {
  if (p.currency === BASE_CURRENCY) return Number(round2(p.amount))
  const pf = Number(p.fxRate)
  const rate = pf > 0 && !(pf === 1 && p.currency !== BASE_CURRENCY) ? pf : rates[p.currency] || 1
  return Number(round2(new Prisma.Decimal(p.amount).div(rate)))
}

export interface IncomeEntry {
  id: string
  date: string // ISO
  amount: number
  currency: Currency
  base: number
  kind: string
  bookingId: string | null
  bookingNumber: string
  customer: string
  accountName: string | null
  correction: boolean // true ⇒ a manual adjustment/correction (not a confirmed payment)
  reason: string | null
}
export interface ExpenseEntry {
  id: string
  date: string
  amount: number
  currency: Currency
  base: number
  categoryKey: string | null
  categoryName: string
  accountId: string | null
  accountName: string | null
  note: string | null
  vendor: string | null
  paid: boolean
}
export interface NamedTotal {
  key: string
  name: string
  base: number
}
export interface CurrencyTotal {
  currency: Currency
  amount: number
}

export interface FinanceOverview {
  baseCurrency: Currency
  from: string
  to: string
  incomeBase: number
  expenseBase: number
  profitBase: number
  cashPositionBase: number
  depositsHeldBase: number
  incomeByKind: NamedTotal[]
  expenseByCategory: NamedTotal[]
  incomeByCurrency: CurrencyTotal[]
  expenseByCurrency: CurrencyTotal[]
  incomeEntries: IncomeEntry[]
  expenseEntries: ExpenseEntry[]
}

const KIND_RU: Record<string, string> = { RENT: 'Аренда', DEPOSIT: 'Залог', PREPAY: 'Предоплата', BALANCE: 'Доплата', FULL: 'Полная оплата' }

function pushTotal(map: Map<string, NamedTotal>, key: string, name: string, base: number) {
  const cur = map.get(key)
  if (cur) cur.base = Number(round2(cur.base + base))
  else map.set(key, { key, name, base: Number(round2(base)) })
}
function pushCur(map: Map<Currency, number>, currency: Currency, amount: number) {
  map.set(currency, Number(round2((map.get(currency) ?? 0) + amount)))
}

export interface AccountRow {
  id: string
  name: string
  kind: string
  currency: Currency
  openingBalance: number // native currency
  openingBase: number // opening converted to base EUR
  balanceBase: number // full computed balance in base EUR
  archived: boolean
  note: string | null
}

/**
 * Per-account balances + the total cash position, all in base EUR. An account's balance =
 * openingBalance (→ base) + every income/deposit that landed in it − every deposit returned − every
 * PAID expense from it (+ transfers/adjustments once Prompt 2 adds them). Transactions with no
 * account are pooled into an "unassigned" bucket so nothing is ever dropped from the total.
 */
export async function getAccounts(preloadedRates?: Record<Currency, number>): Promise<{ rows: AccountRow[]; totalBase: number; unassignedBase: number; depositsHeldBase: number }> {
  const rates = preloadedRates ?? (await loadRates())
  const [accounts, income, depositsHeld, paidExpenses, transfers, adjustments] = await Promise.all([
    prisma.account.findMany({ orderBy: [{ archived: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }] }),
    prisma.payment.findMany({ where: { status: { in: ['PAID', 'PARTIAL'] }, kind: { not: 'DEPOSIT' } }, select: { accountId: true, amount: true, currency: true, fxRate: true } }),
    prisma.payment.findMany({ where: { kind: 'DEPOSIT', status: 'DEPOSIT_HELD' }, select: { accountId: true, amount: true, currency: true, fxRate: true } }),
    prisma.expense.findMany({ where: { paid: true }, select: { accountId: true, baseAmount: true } }),
    prisma.transfer.findMany({ select: { fromAccountId: true, toAccountId: true, baseAmount: true } }),
    prisma.incomeAdjustment.findMany({ select: { accountId: true, baseAmount: true } }),
  ])

  const flow = new Map<string, number>()
  const add = (accId: string | null, base: number) => {
    const k = accId ?? '__unassigned'
    flow.set(k, Number(round2((flow.get(k) ?? 0) + base)))
  }
  for (const p of income) add(p.accountId, paymentToBase(p, rates))
  // Only CURRENTLY-held deposits are cash on hand. A deposit that flips to DEPOSIT_RETURNED is
  // cash-neutral (received then refunded) and simply drops out of `depositsHeld` — we must NOT also
  // debit it, or a returned deposit would wrongly net to −x instead of 0.
  for (const p of depositsHeld) add(p.accountId, paymentToBase(p, rates))
  for (const e of paidExpenses) add(e.accountId, -Number(e.baseAmount))
  for (const t of transfers) { add(t.fromAccountId, -Number(t.baseAmount)); add(t.toAccountId, Number(t.baseAmount)) }
  for (const a of adjustments) add(a.accountId, Number(a.baseAmount)) // signed (negative reduces)

  const rows: AccountRow[] = accounts.map((a) => {
    const openingBase = toBase(a.openingBalance, a.currency, rates)
    return {
      id: a.id,
      name: a.name,
      kind: a.kind,
      currency: a.currency,
      openingBalance: Number(a.openingBalance),
      openingBase,
      balanceBase: Number(round2(openingBase + (flow.get(a.id) ?? 0))),
      archived: a.archived,
      note: a.note,
    }
  })
  const unassignedBase = Number(round2(flow.get('__unassigned') ?? 0))
  const totalBase = Number(round2(rows.reduce((s, r) => s + r.balanceBase, 0) + unassignedBase))
  const depositsHeldBase = Number(round2(depositsHeld.reduce((s, p) => s + paymentToBase(p, rates), 0)))
  return { rows, totalBase, unassignedBase, depositsHeldBase }
}

/** Running cash position (base EUR) = the sum of all account balances (incl. opening balances). */
export async function getCashPositionBase(preloadedRates?: Record<Currency, number>): Promise<{ cashPositionBase: number; depositsHeldBase: number }> {
  const acc = await getAccounts(preloadedRates)
  return { cashPositionBase: acc.totalBase, depositsHeldBase: acc.depositsHeldBase }
}

/** The finance dashboard: income/expense/profit for a period + all-time cash position + breakdowns. */
export async function getFinanceOverview(fromISO: string, toISO: string): Promise<FinanceOverview> {
  const from = new Date(fromISO)
  const to = new Date(toISO)
  const rates = await loadRates()

  // Income = confirmed rental payments in the period (PAID/PARTIAL, excluding refundable DEPOSITs).
  // Dated by `updatedAt` — the row's last state change, which for a confirmed payment is when staff
  // confirmed it (Payment has no dedicated confirmedAt column). This attributes income to the period
  // the money was CONFIRMED in, not merely when the row was first created.
  const incomePayments = await prisma.payment.findMany({
    where: { status: { in: ['PAID', 'PARTIAL'] }, kind: { not: 'DEPOSIT' }, updatedAt: { gte: from, lte: to } },
    select: {
      id: true, amount: true, currency: true, fxRate: true, kind: true, updatedAt: true,
      account: { select: { name: true } },
      booking: { select: { id: true, number: true, user: { select: { firstName: true, lastName: true, email: true } } } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const incomeByKind = new Map<string, NamedTotal>()
  const incomeByCurrency = new Map<Currency, number>()
  const incomeEntries: IncomeEntry[] = []
  let incomeBase = 0
  for (const p of incomePayments) {
    const base = paymentToBase(p, rates)
    incomeBase = Number(round2(incomeBase + base))
    pushTotal(incomeByKind, p.kind, KIND_RU[p.kind] ?? p.kind, base)
    pushCur(incomeByCurrency, p.currency, Number(p.amount))
    const name = [p.booking.user.firstName, p.booking.user.lastName].filter(Boolean).join(' ') || p.booking.user.email
    incomeEntries.push({ id: p.id, date: p.updatedAt.toISOString(), amount: Number(p.amount), currency: p.currency, base, kind: KIND_RU[p.kind] ?? p.kind, bookingId: p.booking.id, bookingNumber: p.booking.number, customer: name, accountName: p.account?.name ?? null, correction: false, reason: null })
  }

  // Income CORRECTIONS/adjustments in the period — visible entries that adjust derived income up or
  // down WITHOUT overwriting any confirmed payment. Amount is signed (negative = reduction).
  const adjustments = await prisma.incomeAdjustment.findMany({
    where: { occurredAt: { gte: from, lte: to } },
    include: { account: { select: { name: true } }, booking: { select: { number: true, user: { select: { firstName: true, lastName: true, email: true } } } } },
    orderBy: { occurredAt: 'desc' },
  })
  for (const a of adjustments) {
    const base = Number(a.baseAmount)
    incomeBase = Number(round2(incomeBase + base))
    pushTotal(incomeByKind, '__correction', 'Корректировки', base)
    pushCur(incomeByCurrency, a.currency, Number(a.amount))
    const cust = a.booking ? [a.booking.user.firstName, a.booking.user.lastName].filter(Boolean).join(' ') || a.booking.user.email : '—'
    incomeEntries.push({ id: a.id, date: a.occurredAt.toISOString(), amount: Number(a.amount), currency: a.currency, base, kind: 'Корректировка', bookingId: a.bookingId, bookingNumber: a.booking?.number ?? '—', customer: cust, accountName: a.account?.name ?? null, correction: true, reason: a.reason })
  }
  incomeEntries.sort((x, y) => (x.date < y.date ? 1 : -1))

  // Expenses in the period.
  const expenses = await prisma.expense.findMany({
    where: { spentAt: { gte: from, lte: to } },
    include: { category: true, account: { select: { name: true } } },
    orderBy: { spentAt: 'desc' },
  })
  const expenseByCategory = new Map<string, NamedTotal>()
  const expenseByCurrency = new Map<Currency, number>()
  const expenseEntries: ExpenseEntry[] = []
  let expenseBase = 0
  for (const e of expenses) {
    const base = Number(e.baseAmount)
    expenseBase = Number(round2(expenseBase + base))
    pushTotal(expenseByCategory, e.category?.key ?? 'uncat', e.category?.nameRu ?? 'Без категории', base)
    pushCur(expenseByCurrency, e.currency, Number(e.amount))
    expenseEntries.push({ id: e.id, date: e.spentAt.toISOString(), amount: Number(e.amount), currency: e.currency, base, categoryKey: e.category?.key ?? null, categoryName: e.category?.nameRu ?? 'Без категории', accountId: e.accountId, accountName: e.account?.name ?? null, note: e.note, vendor: e.vendor, paid: e.paid })
  }

  const cash = await getCashPositionBase(rates)

  return {
    baseCurrency: BASE_CURRENCY,
    from: fromISO,
    to: toISO,
    incomeBase,
    expenseBase,
    profitBase: Number(round2(incomeBase - expenseBase)),
    cashPositionBase: cash.cashPositionBase,
    depositsHeldBase: cash.depositsHeldBase,
    incomeByKind: [...incomeByKind.values()].sort((a, b) => b.base - a.base),
    expenseByCategory: [...expenseByCategory.values()].sort((a, b) => b.base - a.base),
    incomeByCurrency: [...incomeByCurrency.entries()].map(([currency, amount]) => ({ currency, amount })),
    expenseByCurrency: [...expenseByCurrency.entries()].map(([currency, amount]) => ({ currency, amount })),
    incomeEntries,
    expenseEntries,
  }
}

export interface DebtorRow {
  bookingId: string
  bookingNumber: string
  customer: string
  status: string
  balance: number
  currency: Currency
  balanceBase: number
}

/** Debtors = bookings with an outstanding balance (derived from existing per-booking balances). */
export async function getDebtors(): Promise<{ rows: DebtorRow[]; totalBase: number }> {
  const bookings = await prisma.booking.findMany({
    where: { balanceAmount: { gt: 0 }, status: { not: 'CANCELLED' } },
    select: { id: true, number: true, status: true, balanceAmount: true, currency: true, fxRate: true, user: { select: { firstName: true, lastName: true, email: true } } },
  })
  const rows: DebtorRow[] = bookings.map((b) => {
    const bf = Number(b.fxRate)
    const balanceBase = bf > 0 ? Number(round2(new Prisma.Decimal(b.balanceAmount).div(bf))) : Number(b.balanceAmount)
    return {
      bookingId: b.id,
      bookingNumber: b.number,
      customer: [b.user.firstName, b.user.lastName].filter(Boolean).join(' ') || b.user.email,
      status: b.status,
      balance: Number(b.balanceAmount),
      currency: b.currency,
      balanceBase,
    }
  })
  rows.sort((a, b) => b.balanceBase - a.balanceBase)
  return { rows, totalBase: Number(round2(rows.reduce((a, r) => a + r.balanceBase, 0))) }
}

export interface CreditorRow {
  id: string
  categoryName: string
  vendor: string | null
  note: string | null
  amount: number
  currency: Currency
  base: number
  date: string
}

/** Creditors = unpaid expenses (money we owe). */
export async function getCreditors(): Promise<{ rows: CreditorRow[]; totalBase: number }> {
  const expenses = await prisma.expense.findMany({ where: { paid: false }, include: { category: true }, orderBy: { spentAt: 'desc' } })
  const rows: CreditorRow[] = expenses.map((e) => ({
    id: e.id,
    categoryName: e.category?.nameRu ?? 'Без категории',
    vendor: e.vendor,
    note: e.note,
    amount: Number(e.amount),
    currency: e.currency,
    base: Number(e.baseAmount),
    date: e.spentAt.toISOString(),
  }))
  return { rows, totalBase: Number(round2(rows.reduce((a, r) => a + r.base, 0))) }
}

export interface TransferRow {
  id: string
  from: string
  to: string
  amount: number
  currency: Currency
  base: number
  note: string | null
  date: string
}

/** Recent transfers between accounts (for the transfers list / per-account history). */
export async function getTransfers(limit = 100): Promise<TransferRow[]> {
  const rows = await prisma.transfer.findMany({
    orderBy: { occurredAt: 'desc' },
    take: limit,
    include: { fromAccount: { select: { name: true } }, toAccount: { select: { name: true } } },
  })
  return rows.map((t) => ({ id: t.id, from: t.fromAccount.name, to: t.toAccount.name, amount: Number(t.amount), currency: t.currency, base: Number(t.baseAmount), note: t.note, date: t.occurredAt.toISOString() }))
}
