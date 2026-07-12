'use server'

import crypto from 'node:crypto'
import { revalidatePath } from 'next/cache'
import type { Currency } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireStaff } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { loadRates } from '@/lib/money'
import { toBase, getCashPositionBase, getAccounts } from '@/lib/finance'
import { writeFinanceAudit, diffFields } from '@/lib/finance-audit'

export interface FinResult {
  ok: boolean
  error?: string
}

const CURRENCIES: Currency[] = ['EUR', 'USD', 'RUB', 'TRY', 'USDT', 'USDC']
const ACCOUNT_KINDS = ['CASH', 'BANK', 'CRYPTO', 'OTHER']

function cleanAmount(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 100) / 100
}
/** Any finite amount, incl. 0 / negative (opening balances may be either). */
function cleanSigned(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(',', '.'))
  if (!Number.isFinite(n)) return null
  return Math.round(n * 100) / 100
}
function cleanCurrency(v: unknown): Currency {
  return CURRENCIES.includes(v as Currency) ? (v as Currency) : 'EUR'
}
function parseDate(v: unknown): Date {
  const d = v ? new Date(String(v)) : new Date()
  return Number.isNaN(d.getTime()) ? new Date() : d
}

/** Resolve an account id to a usable (existing, non-archived) account, else null. */
async function resolveActiveAccount(id?: string | null): Promise<string | null> {
  if (!id) return null
  const a = await prisma.account.findUnique({ where: { id }, select: { id: true, archived: true } })
  return a && !a.archived ? a.id : null
}

/* ───────────────────────── Accounts ───────────────────────── */

export async function createAccount(input: { name: string; kind?: string; currency?: string; openingBalance?: number | string; note?: string }): Promise<FinResult> {
  const staff = await requireStaff()
  const name = input.name?.trim().slice(0, 80)
  if (!name) return { ok: false, error: 'Введите название счёта' }
  const kind = ACCOUNT_KINDS.includes(input.kind ?? '') ? (input.kind as string) : 'CASH'
  const currency = cleanCurrency(input.currency)
  const openingBalance = cleanSigned(input.openingBalance) ?? 0
  const max = await prisma.account.aggregate({ _max: { sortOrder: true } })
  const a = await prisma.account.create({ data: { name, kind, currency, openingBalance, sortOrder: (max._max.sortOrder ?? 0) + 10, note: input.note?.trim()?.slice(0, 300) || null } })
  await writeFinanceAudit({ entityType: 'account', entityId: a.id, action: 'create', staff, changes: [{ field: 'name', from: null, to: name }, { field: 'currency', from: null, to: currency }, { field: 'openingBalance', from: null, to: String(openingBalance) }] })
  await logAudit({ userId: staff.id, action: 'finance.account.create', entity: 'Account', entityId: a.id })
  revalidatePath('/admin/finance')
  return { ok: true }
}

export async function updateAccount(id: string, input: { name: string; kind?: string; note?: string }): Promise<FinResult> {
  const staff = await requireStaff()
  const before = await prisma.account.findUnique({ where: { id } })
  if (!before) return { ok: false, error: 'Счёт не найден' }
  const name = input.name?.trim().slice(0, 80)
  if (!name) return { ok: false, error: 'Введите название счёта' }
  const kind = ACCOUNT_KINDS.includes(input.kind ?? '') ? (input.kind as string) : before.kind
  const note = input.note?.trim()?.slice(0, 300) || null
  // NOTE: currency is fixed at creation and NOT editable here — its openingBalance is a native-
  // currency figure, so changing the currency would silently re-value the account with no entry.
  const after = { name, kind, note }
  const changes = diffFields({ name: before.name, kind: before.kind, note: before.note }, after, ['name', 'kind', 'note'])
  await prisma.account.update({ where: { id }, data: after })
  if (changes.length) await writeFinanceAudit({ entityType: 'account', entityId: id, action: 'update', staff, changes })
  await logAudit({ userId: staff.id, action: 'finance.account.update', entity: 'Account', entityId: id })
  revalidatePath('/admin/finance')
  return { ok: true }
}

/** Edit an account's opening balance — a legitimate admin figure, but every change is audited. */
export async function setAccountOpeningBalance(id: string, openingBalance: number | string, reason?: string): Promise<FinResult> {
  const staff = await requireStaff()
  const before = await prisma.account.findUnique({ where: { id }, select: { openingBalance: true } })
  if (!before) return { ok: false, error: 'Счёт не найден' }
  const value = cleanSigned(openingBalance)
  if (value == null) return { ok: false, error: 'Введите корректную сумму' }
  const from = String(Number(before.openingBalance))
  if (from === String(value)) return { ok: true }
  await prisma.account.update({ where: { id }, data: { openingBalance: value } })
  await writeFinanceAudit({ entityType: 'account', entityId: id, action: 'update', reason, staff, changes: [{ field: 'openingBalance', from, to: String(value) }] })
  await logAudit({ userId: staff.id, action: 'finance.account.opening', entity: 'Account', entityId: id, meta: { from, to: value } })
  revalidatePath('/admin/finance')
  return { ok: true }
}

export async function setAccountArchived(id: string, archived: boolean): Promise<FinResult> {
  const staff = await requireStaff()
  await prisma.account.update({ where: { id }, data: { archived } })
  await writeFinanceAudit({ entityType: 'account', entityId: id, action: archived ? 'archive' : 'unarchive', staff, changes: [{ field: 'archived', from: String(!archived), to: String(archived) }] })
  await logAudit({ userId: staff.id, action: 'finance.account.archive', entity: 'Account', entityId: id, meta: { archived } })
  revalidatePath('/admin/finance')
  return { ok: true }
}

/* ───────────────────────── Expenses ───────────────────────── */

export async function addExpense(input: {
  amount: number | string
  currency: string
  categoryId?: string | null
  accountId?: string | null
  spentAt?: string
  note?: string
  vendor?: string
  paid?: boolean
}): Promise<FinResult> {
  const staff = await requireStaff()
  const amount = cleanAmount(input.amount)
  if (amount == null) return { ok: false, error: 'Введите сумму больше нуля' }
  const currency = cleanCurrency(input.currency)
  const rates = await loadRates()
  const baseAmount = toBase(amount, currency, rates)

  let categoryId: string | null = null
  if (input.categoryId) {
    const cat = await prisma.expenseCategory.findUnique({ where: { id: input.categoryId }, select: { id: true } })
    categoryId = cat?.id ?? null
  }
  const accountId = await resolveActiveAccount(input.accountId)

  const e = await prisma.expense.create({
    data: {
      amount, currency, baseAmount, categoryId, accountId,
      spentAt: parseDate(input.spentAt),
      note: input.note?.trim()?.slice(0, 500) || null,
      vendor: input.vendor?.trim()?.slice(0, 200) || null,
      paid: input.paid !== false,
      createdById: staff.id,
    },
  })
  await writeFinanceAudit({ entityType: 'expense', entityId: e.id, action: 'create', staff, changes: [{ field: 'amount', from: null, to: `${amount} ${currency}` }, { field: 'paid', from: null, to: String(input.paid !== false) }] })
  await logAudit({ userId: staff.id, action: 'finance.expense.add', entity: 'Expense', entityId: e.id, meta: { baseAmount } })
  revalidatePath('/admin/finance')
  return { ok: true }
}

export async function updateExpense(id: string, input: {
  amount: number | string
  currency: string
  categoryId?: string | null
  accountId?: string | null
  spentAt?: string
  note?: string
  vendor?: string
  paid?: boolean
  reason?: string
}): Promise<FinResult> {
  const staff = await requireStaff()
  const before = await prisma.expense.findUnique({ where: { id }, include: { category: true, account: true } })
  if (!before) return { ok: false, error: 'Расход не найден' }
  const amount = cleanAmount(input.amount)
  if (amount == null) return { ok: false, error: 'Введите сумму больше нуля' }
  const currency = cleanCurrency(input.currency)
  const rates = await loadRates()
  const baseAmount = toBase(amount, currency, rates)
  const categoryId = input.categoryId ? (await prisma.expenseCategory.findUnique({ where: { id: input.categoryId }, select: { id: true } }))?.id ?? null : null
  // Keep an already-assigned account even if it has since been ARCHIVED (an unrelated edit must not
  // silently strip the link and shift the archived account's historical balance). Only re-validate a
  // genuinely NEW assignment (which can't target an archived account).
  const accountId = input.accountId && input.accountId === before.accountId ? before.accountId : await resolveActiveAccount(input.accountId)
  const spentAt = parseDate(input.spentAt)
  const note = input.note?.trim()?.slice(0, 500) || null
  const vendor = input.vendor?.trim()?.slice(0, 200) || null
  const paid = input.paid !== false

  // Human-readable before/after snapshot for the immutable trail.
  const catName = async (cid: string | null) => (cid ? (await prisma.expenseCategory.findUnique({ where: { id: cid }, select: { nameRu: true } }))?.nameRu ?? null : null)
  const acctName = async (aid: string | null) => (aid ? (await prisma.account.findUnique({ where: { id: aid }, select: { name: true } }))?.name ?? null : null)
  const beforeSnap = {
    amount: `${Number(before.amount)} ${before.currency}`,
    category: before.category?.nameRu ?? null,
    account: before.account?.name ?? null,
    date: before.spentAt.toISOString().slice(0, 10),
    vendor: before.vendor,
    note: before.note,
    paid: String(before.paid),
  }
  const afterSnap = {
    amount: `${amount} ${currency}`,
    category: await catName(categoryId),
    account: await acctName(accountId),
    date: spentAt.toISOString().slice(0, 10),
    vendor,
    note,
    paid: String(paid),
  }
  const changes = diffFields(beforeSnap, afterSnap, ['amount', 'category', 'account', 'date', 'vendor', 'note', 'paid'])

  await prisma.expense.update({ where: { id }, data: { amount, currency, baseAmount, categoryId, accountId, spentAt, note, vendor, paid } })
  if (changes.length) await writeFinanceAudit({ entityType: 'expense', entityId: id, action: 'update', reason: input.reason, staff, changes })
  await logAudit({ userId: staff.id, action: 'finance.expense.update', entity: 'Expense', entityId: id })
  revalidatePath('/admin/finance')
  return { ok: true }
}

export async function deleteExpense(id: string): Promise<FinResult> {
  const staff = await requireStaff()
  const before = await prisma.expense.findUnique({ where: { id }, select: { amount: true, currency: true } })
  await prisma.expense.delete({ where: { id } })
  await writeFinanceAudit({ entityType: 'expense', entityId: id, action: 'delete', staff, changes: before ? [{ field: 'amount', from: `${Number(before.amount)} ${before.currency}`, to: null }] : [] })
  await logAudit({ userId: staff.id, action: 'finance.expense.delete', entity: 'Expense', entityId: id })
  revalidatePath('/admin/finance')
  return { ok: true }
}

/** Flip an expense's paid/unpaid flag (drives the creditors list). */
export async function setExpensePaid(id: string, paid: boolean): Promise<FinResult> {
  const staff = await requireStaff()
  const before = await prisma.expense.findUnique({ where: { id }, select: { paid: true } })
  await prisma.expense.update({ where: { id }, data: { paid } })
  await writeFinanceAudit({ entityType: 'expense', entityId: id, action: 'update', staff, changes: [{ field: 'paid', from: before ? String(before.paid) : null, to: String(paid) }] })
  await logAudit({ userId: staff.id, action: 'finance.expense.paid', entity: 'Expense', entityId: id, meta: { paid } })
  revalidatePath('/admin/finance')
  return { ok: true }
}

/* ─────────────────────── Categories ─────────────────────── */

export async function addExpenseCategory(nameRu: string): Promise<FinResult> {
  const staff = await requireStaff()
  const name = nameRu.trim().slice(0, 60)
  if (!name) return { ok: false, error: 'Введите название категории' }
  const max = await prisma.expenseCategory.aggregate({ _max: { sortOrder: true } })
  await prisma.expenseCategory.create({ data: { key: `cat-${crypto.randomBytes(5).toString('hex')}`, nameRu: name, sortOrder: (max._max.sortOrder ?? 0) + 10 } })
  await logAudit({ userId: staff.id, action: 'finance.category.add', entity: 'ExpenseCategory', entityId: name })
  revalidatePath('/admin/finance')
  return { ok: true }
}

export async function updateExpenseCategory(id: string, nameRu: string): Promise<FinResult> {
  const staff = await requireStaff()
  const name = nameRu.trim().slice(0, 60)
  if (!name) return { ok: false, error: 'Введите название категории' }
  await prisma.expenseCategory.update({ where: { id }, data: { nameRu: name } })
  await logAudit({ userId: staff.id, action: 'finance.category.update', entity: 'ExpenseCategory', entityId: id })
  revalidatePath('/admin/finance')
  return { ok: true }
}

export async function setExpenseCategoryActive(id: string, active: boolean): Promise<FinResult> {
  const staff = await requireStaff()
  await prisma.expenseCategory.update({ where: { id }, data: { active } })
  await logAudit({ userId: staff.id, action: 'finance.category.active', entity: 'ExpenseCategory', entityId: id, meta: { active } })
  revalidatePath('/admin/finance')
  return { ok: true }
}

export async function deleteExpenseCategory(id: string): Promise<FinResult> {
  const staff = await requireStaff()
  const used = await prisma.expense.count({ where: { categoryId: id } })
  if (used > 0) return { ok: false, error: `Категория используется в ${used} расходах — отключите её вместо удаления` }
  await prisma.expenseCategory.delete({ where: { id } })
  await logAudit({ userId: staff.id, action: 'finance.category.delete', entity: 'ExpenseCategory', entityId: id })
  revalidatePath('/admin/finance')
  return { ok: true }
}

/* ─────────────────────── Transfers ─────────────────────── */

/** Move money between two accounts (source down, destination up, total unchanged). Audited. */
export async function createTransfer(input: { fromAccountId: string; toAccountId: string; amount: number | string; currency: string; occurredAt?: string; note?: string }): Promise<FinResult> {
  const staff = await requireStaff()
  const amount = cleanAmount(input.amount)
  if (amount == null) return { ok: false, error: 'Введите сумму больше нуля' }
  if (!input.fromAccountId || !input.toAccountId) return { ok: false, error: 'Выберите оба счёта' }
  if (input.fromAccountId === input.toAccountId) return { ok: false, error: 'Счета должны отличаться' }
  const [from, to] = await Promise.all([
    prisma.account.findUnique({ where: { id: input.fromAccountId }, select: { id: true, name: true, archived: true } }),
    prisma.account.findUnique({ where: { id: input.toAccountId }, select: { id: true, name: true, archived: true } }),
  ])
  if (!from || !to) return { ok: false, error: 'Счёт не найден' }
  if (from.archived || to.archived) return { ok: false, error: 'Нельзя переводить на/со архивного счёта' }
  const currency = cleanCurrency(input.currency)
  const rates = await loadRates()
  const baseAmount = toBase(amount, currency, rates)
  // No overdraw: the source account must have enough to cover the transfer.
  const { rows } = await getAccounts(rates)
  const src = rows.find((r) => r.id === from.id)
  if (src && src.balanceBase < baseAmount - 0.005) return { ok: false, error: `Недостаточно средств на «${from.name}» (доступно ${src.balanceBase.toFixed(2)} EUR)` }

  const t = await prisma.transfer.create({ data: { fromAccountId: from.id, toAccountId: to.id, amount, currency, baseAmount, occurredAt: parseDate(input.occurredAt), note: input.note?.trim()?.slice(0, 300) || null, byUserId: staff.id } })
  await writeFinanceAudit({ entityType: 'transfer', entityId: t.id, action: 'transfer', reason: input.note, staff, changes: [{ field: 'сумма', from: null, to: `${amount} ${currency}` }, { field: 'со счёта', from: null, to: from.name }, { field: 'на счёт', from: null, to: to.name }] })
  await logAudit({ userId: staff.id, action: 'finance.transfer', entity: 'Transfer', entityId: t.id, meta: { baseAmount } })
  revalidatePath('/admin/finance')
  return { ok: true }
}

/* ─────────────────────── Income corrections ─────────────────────── */

/**
 * Add a VISIBLE income correction (a signed adjustment). Derived income is NEVER overwritten — this
 * is a separate, clearly-marked entry with a required reason, leaving the original payment intact.
 */
export async function addIncomeAdjustment(input: { amount: number | string; currency: string; bookingId?: string | null; accountId?: string | null; reason: string; occurredAt?: string }): Promise<FinResult> {
  const staff = await requireStaff()
  const amount = cleanSigned(input.amount)
  if (amount == null || amount === 0) return { ok: false, error: 'Введите ненулевую сумму (можно со знаком «−»)' }
  const reason = input.reason?.trim().slice(0, 500)
  if (!reason) return { ok: false, error: 'Укажите причину корректировки' }
  const currency = cleanCurrency(input.currency)
  const rates = await loadRates()
  const baseAmount = toBase(amount, currency, rates) // signed
  let bookingId: string | null = null
  if (input.bookingId) bookingId = (await prisma.booking.findUnique({ where: { id: input.bookingId }, select: { id: true } }))?.id ?? null
  const accountId = await resolveActiveAccount(input.accountId)

  const adj = await prisma.incomeAdjustment.create({ data: { amount, currency, baseAmount, bookingId, accountId, reason, occurredAt: parseDate(input.occurredAt), byUserId: staff.id } })
  await writeFinanceAudit({ entityType: 'income_adjustment', entityId: adj.id, action: 'correct', reason, staff, changes: [{ field: 'сумма', from: null, to: `${amount} ${currency}` }] })
  await logAudit({ userId: staff.id, action: 'finance.income.adjust', entity: 'IncomeAdjustment', entityId: adj.id, meta: { baseAmount } })
  revalidatePath('/admin/finance')
  return { ok: true }
}

/* ─────────────────────── Reconciliation ─────────────────────── */

/** Log a reconciliation check: owner-entered actual balance vs the module's recorded cash position. */
export async function saveReconciliation(actualAmount: number | string, note?: string): Promise<FinResult> {
  const staff = await requireStaff()
  const actual = Number(String(actualAmount ?? '').replace(',', '.'))
  if (!Number.isFinite(actual)) return { ok: false, error: 'Введите фактический баланс' }
  const { cashPositionBase } = await getCashPositionBase()
  await prisma.financeReconciliation.create({
    data: { actualAmount: Math.round(actual * 100) / 100, recordedAmount: cashPositionBase, note: note?.trim()?.slice(0, 500) || null, byUserId: staff.id },
  })
  await logAudit({ userId: staff.id, action: 'finance.reconcile', entity: 'FinanceReconciliation', entityId: staff.id, meta: { actual, recorded: cashPositionBase } })
  revalidatePath('/admin/finance')
  return { ok: true }
}
