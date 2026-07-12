import { redirect } from 'next/navigation'
import { getCurrentUser, canManageSettings } from '@/lib/auth'
import { prisma } from '@/lib/db'
import AdminShell from '@/components/AdminShell'
import Finance from '@/views/Finance'
import {
  ensureDefaultExpenseCategories,
  ensureDefaultAccounts,
  getFinanceOverview,
  getAccounts,
  getDebtors,
  getCreditors,
  getTransfers,
  type FinanceOverview,
  type AccountRow,
  type DebtorRow,
  type CreditorRow,
  type TransferRow,
} from '@/lib/finance'
import { getFinanceAuditLog, type AuditRow } from '@/lib/finance-audit'

export const dynamic = 'force-dynamic'

export interface FinanceCategory {
  id: string
  key: string
  nameRu: string
  active: boolean
  count: number
}
export interface ReconRow {
  id: string
  actualAmount: number
  recordedAmount: number
  difference: number
  createdAt: string
}
export interface FinanceProps {
  from: string // yyyy-mm-dd
  to: string
  overview: FinanceOverview
  categories: FinanceCategory[]
  accounts: { rows: AccountRow[]; totalBase: number; unassignedBase: number }
  transfers: TransferRow[]
  bookings: { id: string; number: string; customer: string }[]
  debtors: { rows: DebtorRow[]; totalBase: number }
  creditors: { rows: CreditorRow[]; totalBase: number }
  reconciliations: ReconRow[]
  audit: AuditRow[]
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default async function FinancePage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) redirect('/auth')

  await Promise.all([ensureDefaultExpenseCategories(), ensureDefaultAccounts()])

  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const isDate = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s)
  const fromStr = isDate(searchParams.from) ? (searchParams.from as string) : ymd(monthStart)
  const toStr = isDate(searchParams.to) ? (searchParams.to as string) : ymd(now)

  const [overview, cats, accounts, transfers, bookingRows, debtors, creditors, recons, audit] = await Promise.all([
    getFinanceOverview(`${fromStr}T00:00:00.000Z`, `${toStr}T23:59:59.999Z`),
    prisma.expenseCategory.findMany({ orderBy: [{ sortOrder: 'asc' }, { nameRu: 'asc' }], include: { _count: { select: { expenses: true } } } }),
    getAccounts(),
    getTransfers(60),
    prisma.booking.findMany({ orderBy: { createdAt: 'desc' }, take: 100, select: { id: true, number: true, user: { select: { firstName: true, lastName: true, email: true } } } }),
    getDebtors(),
    getCreditors(),
    prisma.financeReconciliation.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
    getFinanceAuditLog(300),
  ])
  const bookings = bookingRows.map((b) => ({ id: b.id, number: b.number, customer: [b.user.firstName, b.user.lastName].filter(Boolean).join(' ') || b.user.email }))

  const categories: FinanceCategory[] = cats.map((c) => ({ id: c.id, key: c.key, nameRu: c.nameRu, active: c.active, count: c._count.expenses }))
  const reconciliations: ReconRow[] = recons.map((r) => ({
    id: r.id,
    actualAmount: Number(r.actualAmount),
    recordedAmount: Number(r.recordedAmount),
    difference: Number(r.actualAmount) - Number(r.recordedAmount),
    createdAt: r.createdAt.toISOString(),
  }))

  return (
    <AdminShell active="finance" title="Финансы" subtitle="Учёт денег — счета, доходы, расходы, прибыль и касса (упрощённый, одностатейный)" canSettings={canManageSettings(user)}>
      <Finance
        from={fromStr}
        to={toStr}
        overview={overview}
        categories={categories}
        accounts={{ rows: accounts.rows, totalBase: accounts.totalBase, unassignedBase: accounts.unassignedBase }}
        transfers={transfers}
        bookings={bookings}
        debtors={debtors}
        creditors={creditors}
        reconciliations={reconciliations}
        audit={audit}
      />
    </AdminShell>
  )
}
