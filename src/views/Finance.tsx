'use client'

import { useMemo, useState, useTransition, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useIsMobile } from '@/components/useIsMobile'
import { useDict, type Dict } from '@/i18n/lang'
import type { FinanceProps } from '@/app/admin/finance/page'
import {
  addExpense,
  updateExpense,
  deleteExpense,
  setExpensePaid,
  addExpenseCategory,
  updateExpenseCategory,
  setExpenseCategoryActive,
  deleteExpenseCategory,
  saveReconciliation,
  createAccount,
  updateAccount,
  setAccountOpeningBalance,
  setAccountArchived,
  createTransfer,
  addIncomeAdjustment,
} from '@/server/finance-actions'
import type { AuditRow } from '@/lib/finance-audit'

const SYM: Record<string, string> = { EUR: '€', USD: '$', RUB: '₽', TRY: '₺', USDT: '₮', USDC: 'USDC' }
const CURRENCIES = ['EUR', 'USD', 'RUB', 'TRY', 'USDT', 'USDC'] as const

function fmt(n: number, cur = 'EUR'): string {
  const body = Number(n).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  if (cur === 'USDC') return `${body} USDC`
  if (cur === 'USDT') return `₮${body}`
  return `${SYM[cur] ?? ''}${body}`
}
const eur = (n: number) => fmt(n, 'EUR')
const dshort = (iso: string) => {
  const d = new Date(iso)
  return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}`
}

const PANEL: CSSProperties = { background: 'var(--d-panel)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14 }
const LABEL: CSSProperties = { font: '400 10px var(--f-mono)', letterSpacing: '.12em', color: 'var(--d-muted-2)' }
const inputSt: CSSProperties = { background: 'var(--d-base)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 9, padding: '9px 11px', font: '600 12px var(--f-ui)', color: 'var(--d-text)', outline: 'none' }
const coralBtn: CSSProperties = { background: 'linear-gradient(180deg,#FFB48A,#FF7A5C)', color: '#082A33', borderRadius: 9, font: '700 12px var(--f-ui)', border: 'none', cursor: 'pointer', padding: '9px 16px' }

type View = 'overview' | 'accounts' | 'expenses' | 'categories' | 'reconcile' | 'ledger' | 'audit'
const VIEW_KEYS: View[] = ['overview', 'accounts', 'expenses', 'categories', 'reconcile', 'ledger', 'audit']

const ACCOUNT_KIND_KEYS = ['CASH', 'BANK', 'CRYPTO', 'OTHER'] as const

/* ─────────────── i18n dictionary ─────────────── */
interface Strings {
  // sub-nav / views
  views: Record<View, string>
  // account kinds
  accountKinds: Record<string, string>
  // audit maps
  auditAction: Record<string, string>
  auditEntity: Record<string, string>
  // audit item / bars / generic
  reasonPrefix: string
  noDataPeriod: string
  errorGeneric: string
  // period bar
  period: string
  month: string
  year: string
  allTime: string
  // overview stats
  incomeForPeriod: string
  confirmedPayments: string
  expensesForPeriod: string
  profit: string
  incomeMinusExpenses: string
  cashNow: string
  cashSub: (deposits: string) => string
  cashByAccount: string
  unassigned: string
  baseNotePre: string
  baseNotePost: string
  incomeByType: string
  expenseByCategory: string
  byCurrency: string
  incomeWord: string
  expensesWord: string
  incomeEntriesHeader: (n: number) => string
  incomeDerivedNote: string
  addIncomeAdjustBtn: string
  noConfirmedPayments: string
  correctionBadge: string
  // income adjust form
  adjustmentAdded: string
  adjustTitle: string
  amountSigned: string
  currency: string
  bookingOptional: string
  none: string
  accountOptional: string
  reasonRequired: string
  reasonAdjustPlaceholder: string
  addAdjustmentBtn: string
  // expenses
  expenseAdded: string
  addExpenseTitle: string
  amount: string
  category: string
  fromAccount: string
  date: string
  vendor: string
  note: string
  paidCheckbox: string
  addExpenseBtn: string
  allCategories: string
  expensesHeader: (n: number, total: string) => string
  noExpensesPeriod: string
  paidBtn: string
  notPaidBtn: string
  updated: string
  edit: string
  history: string
  changeHistoryTitle: string
  noChangesYet: string
  // expense edit form
  editExpenseTitle: string
  account: string
  reasonChangePlaceholder: string
  expenseUpdated: string
  save: string
  cancel: string
  // categories
  newCategoryTitle: string
  categoryPlaceholder: string
  categoryAdded: string
  add: string
  saved: string
  categoryCount: (n: number) => string
  disabledSuffix: string
  on: string
  off: string
  categoryDeleted: string
  // reconcile
  reconcileTitle: string
  reconcileIntro: string
  calculatedCash: string
  actualBalance: string
  discrepancy: string
  booksMatch: string
  actualMore: string
  actualLess: string
  noteOptionalPlaceholder: string
  reconcileSaved: string
  saveReconcileBtn: string
  reconcileHistory: string
  actualPrefix: string
  recordedPrefix: string
  // ledger
  debtorsTitle: string
  noDebtors: string
  creditorsTitle: string
  noCreditors: string
  markedPaid: string
  payBtn: string
  // accounts
  transferDone: string
  accountCreated: string
  totalInCash: string
  sumAllAccounts: string
  newAccountTitle: string
  name: string
  accountNamePlaceholder: string
  type: string
  openingBalanceLabel: string
  createAccountBtn: string
  transferTitle: string
  toAccount: string
  transferBtn: string
  recentTransfers: string
  archivedBadge: string
  balanceEur: string
  openingShort: string
  openingBalanceBtn: string
  restored: string
  archived: string
  unarchiveBtn: string
  archiveBtn: string
  accountsNote: string
  // opening balance edit
  openingBalanceCur: (cur: string) => string
  reasonAuditPlaceholder: string
  balanceUpdated: string
  // account edit
  accountUpdated: string
  // audit log
  auditLogTitle: string
  allFilter: string
  noRecords: string
}

const dict: Dict<Strings> = {
  ru: {
    views: { overview: 'Обзор', accounts: 'Счета', expenses: 'Расходы', categories: 'Категории', reconcile: 'Сверка', ledger: 'Должники и кредиторы', audit: 'Аудит' },
    accountKinds: { CASH: 'Наличные', BANK: 'Банк', CRYPTO: 'Крипто', OTHER: 'Другое' },
    auditAction: { create: 'создание', update: 'изменение', archive: 'архивация', unarchive: 'разархивация', delete: 'удаление', confirm: 'подтверждение', correct: 'корректировка', transfer: 'перевод' },
    auditEntity: { account: 'Счёт', expense: 'Расход', payment: 'Платёж', opening_balance: 'Нач. остаток', transfer: 'Перевод', income_adjustment: 'Корректировка дохода' },
    reasonPrefix: 'причина: ',
    noDataPeriod: 'Нет данных за период.',
    errorGeneric: 'Ошибка',
    period: 'ПЕРИОД',
    month: 'Месяц',
    year: 'Год',
    allTime: 'Всё',
    incomeForPeriod: 'ДОХОД ЗА ПЕРИОД',
    confirmedPayments: 'подтверждённые оплаты',
    expensesForPeriod: 'РАСХОДЫ ЗА ПЕРИОД',
    profit: 'ПРИБЫЛЬ',
    incomeMinusExpenses: 'доход − расходы',
    cashNow: 'КАССА (СЕЙЧАС)',
    cashSub: (d) => `сумма по счетам · залоги ${d}`,
    cashByAccount: 'КАССА ПО СЧЕТАМ',
    unassigned: 'Не распределено (без счёта)',
    baseNotePre: 'Все итоги — в пересчёте на базовую валюту ',
    baseNotePost: ' по курсам системы (доход — по курсу на момент платежа, расходы — по курсу на момент внесения). Разные валюты никогда не складываются напрямую — см. разбивку по валютам ниже.',
    incomeByType: 'ДОХОДЫ ПО ТИПАМ',
    expenseByCategory: 'РАСХОДЫ ПО КАТЕГОРИЯМ',
    byCurrency: 'ПО ВАЛЮТАМ (без пересчёта, «как есть»)',
    incomeWord: 'Доход',
    expensesWord: 'Расходы',
    incomeEntriesHeader: (n) => `ПОСТУПЛЕНИЯ ЗА ПЕРИОД (${n})`,
    incomeDerivedNote: 'Доход выводится из подтверждённых платежей и не редактируется напрямую — используйте корректировку.',
    addIncomeAdjustBtn: '+ Корректировка дохода',
    noConfirmedPayments: 'Нет подтверждённых оплат за период.',
    correctionBadge: 'КОРРЕКЦИЯ',
    adjustmentAdded: 'Корректировка добавлена',
    adjustTitle: 'КОРРЕКТИРОВКА ДОХОДА (сумма со знаком: «−50» — уменьшение)',
    amountSigned: 'СУММА (±)',
    currency: 'ВАЛЮТА',
    bookingOptional: 'БРОНЬ (необяз.)',
    none: '— без —',
    accountOptional: 'СЧЁТ (необяз.)',
    reasonRequired: 'ПРИЧИНА *',
    reasonAdjustPlaceholder: 'Напр.: возврат за перерасчёт',
    addAdjustmentBtn: 'Добавить корректировку',
    expenseAdded: 'Расход добавлен',
    addExpenseTitle: 'ДОБАВИТЬ РАСХОД',
    amount: 'СУММА',
    category: 'КАТЕГОРИЯ',
    fromAccount: 'СО СЧЁТА',
    date: 'ДАТА',
    vendor: 'ПОСТАВЩИК',
    note: 'ЗАМЕТКА',
    paidCheckbox: 'Оплачен',
    addExpenseBtn: 'Добавить расход',
    allCategories: 'Все',
    expensesHeader: (n, total) => `РАСХОДЫ ЗА ПЕРИОД (${n}) · ИТОГО ${total}`,
    noExpensesPeriod: 'Расходов за период нет.',
    paidBtn: 'Оплачен',
    notPaidBtn: 'Не опл.',
    updated: 'Обновлено',
    edit: 'Изм.',
    history: 'История',
    changeHistoryTitle: 'ИСТОРИЯ ИЗМЕНЕНИЙ (неизменяемая)',
    noChangesYet: 'Изменений пока нет.',
    editExpenseTitle: 'РЕДАКТИРОВАТЬ РАСХОД',
    account: 'СЧЁТ',
    reasonChangePlaceholder: 'Причина изменения (в аудит)',
    expenseUpdated: 'Расход изменён',
    save: 'Сохранить',
    cancel: 'Отмена',
    newCategoryTitle: 'НОВАЯ КАТЕГОРИЯ РАСХОДОВ',
    categoryPlaceholder: 'Например: Штрафы',
    categoryAdded: 'Категория добавлена',
    add: 'Добавить',
    saved: 'Сохранено',
    categoryCount: (n) => `${n} расх.`,
    disabledSuffix: ' (откл.)',
    on: 'Вкл',
    off: 'Выкл',
    categoryDeleted: 'Категория удалена',
    reconcileTitle: 'СВЕРКА С РЕАЛЬНОСТЬЮ',
    reconcileIntro: 'Введите фактический остаток по банку/кассе (в EUR) и сравните с расчётной кассой модуля. Расхождение — повод проверить, ничего не пересчитывается автоматически.',
    calculatedCash: 'РАСЧЁТНАЯ КАССА',
    actualBalance: 'ФАКТИЧЕСКИЙ ОСТАТОК',
    discrepancy: 'РАСХОЖДЕНИЕ',
    booksMatch: 'книги сходятся',
    actualMore: 'фактически больше',
    actualLess: 'фактически меньше',
    noteOptionalPlaceholder: 'Заметка (необязательно)',
    reconcileSaved: 'Сверка сохранена',
    saveReconcileBtn: 'Сохранить сверку',
    reconcileHistory: 'ИСТОРИЯ СВЕРОК',
    actualPrefix: 'факт ',
    recordedPrefix: 'расч. ',
    debtorsTitle: 'ДОЛЖНИКИ (нам должны)',
    noDebtors: 'Никто не должен — все брони оплачены.',
    creditorsTitle: 'КРЕДИТОРЫ (мы должны · неоплаченные расходы)',
    noCreditors: 'Нет неоплаченных расходов.',
    markedPaid: 'Отмечено оплаченным',
    payBtn: 'Оплатить',
    transferDone: 'Перевод выполнен',
    accountCreated: 'Счёт создан',
    totalInCash: 'ВСЕГО В КАССЕ',
    sumAllAccounts: 'сумма по всем счетам (EUR)',
    newAccountTitle: 'НОВЫЙ СЧЁТ / КОШЕЛЁК',
    name: 'НАЗВАНИЕ',
    accountNamePlaceholder: 'Напр.: Касса офиса',
    type: 'ТИП',
    openingBalanceLabel: 'НАЧ. ОСТАТОК',
    createAccountBtn: 'Создать счёт',
    transferTitle: 'ПЕРЕВОД МЕЖДУ СЧЕТАМИ (итог не меняется)',
    toAccount: 'НА СЧЁТ',
    transferBtn: 'Перевести',
    recentTransfers: 'ПОСЛЕДНИЕ ПЕРЕВОДЫ',
    archivedBadge: '· в архиве',
    balanceEur: 'БАЛАНС (EUR)',
    openingShort: 'нач. ',
    openingBalanceBtn: 'Нач. остаток',
    restored: 'Восстановлен',
    archived: 'В архиве',
    unarchiveBtn: 'Вернуть',
    archiveBtn: 'В архив',
    accountsNote: 'Баланс счёта = начальный остаток + поступления/залоги на счёт − возвраты залогов − оплаченные расходы со счёта. Все балансы в пересчёте на EUR. Начальный остаток редактируется, но каждое изменение фиксируется в аудите.',
    openingBalanceCur: (cur) => `НАЧ. ОСТАТОК (${cur})`,
    reasonAuditPlaceholder: 'Причина (в аудит)',
    balanceUpdated: 'Остаток изменён',
    accountUpdated: 'Счёт изменён',
    auditLogTitle: 'ЖУРНАЛ АУДИТА (неизменяемый · только для персонала)',
    allFilter: 'Все',
    noRecords: 'Записей нет.',
  },
  en: {
    views: { overview: 'Overview', accounts: 'Accounts', expenses: 'Expenses', categories: 'Categories', reconcile: 'Reconciliation', ledger: 'Debtors & creditors', audit: 'Audit' },
    accountKinds: { CASH: 'Cash', BANK: 'Bank', CRYPTO: 'Crypto', OTHER: 'Other' },
    auditAction: { create: 'creation', update: 'update', archive: 'archiving', unarchive: 'unarchiving', delete: 'deletion', confirm: 'confirmation', correct: 'correction', transfer: 'transfer' },
    auditEntity: { account: 'Account', expense: 'Expense', payment: 'Payment', opening_balance: 'Opening balance', transfer: 'Transfer', income_adjustment: 'Income adjustment' },
    reasonPrefix: 'reason: ',
    noDataPeriod: 'No data for the period.',
    errorGeneric: 'Error',
    period: 'PERIOD',
    month: 'Month',
    year: 'Year',
    allTime: 'All',
    incomeForPeriod: 'INCOME FOR PERIOD',
    confirmedPayments: 'confirmed payments',
    expensesForPeriod: 'EXPENSES FOR PERIOD',
    profit: 'PROFIT',
    incomeMinusExpenses: 'income − expenses',
    cashNow: 'CASH (NOW)',
    cashSub: (d) => `sum across accounts · deposits ${d}`,
    cashByAccount: 'CASH BY ACCOUNT',
    unassigned: 'Unassigned (no account)',
    baseNotePre: 'All totals are converted to the base currency ',
    baseNotePost: ' at system rates (income — at the rate on the payment date, expenses — at the rate on the entry date). Different currencies are never added together directly — see the per-currency breakdown below.',
    incomeByType: 'INCOME BY TYPE',
    expenseByCategory: 'EXPENSES BY CATEGORY',
    byCurrency: 'BY CURRENCY (no conversion, “as is”)',
    incomeWord: 'Income',
    expensesWord: 'Expenses',
    incomeEntriesHeader: (n) => `INCOME FOR PERIOD (${n})`,
    incomeDerivedNote: 'Income is derived from confirmed payments and cannot be edited directly — use an adjustment.',
    addIncomeAdjustBtn: '+ Income adjustment',
    noConfirmedPayments: 'No confirmed payments for the period.',
    correctionBadge: 'CORRECTION',
    adjustmentAdded: 'Adjustment added',
    adjustTitle: 'INCOME ADJUSTMENT (signed amount: “−50” — a decrease)',
    amountSigned: 'AMOUNT (±)',
    currency: 'CURRENCY',
    bookingOptional: 'BOOKING (optional)',
    none: '— none —',
    accountOptional: 'ACCOUNT (optional)',
    reasonRequired: 'REASON *',
    reasonAdjustPlaceholder: 'E.g.: refund for recalculation',
    addAdjustmentBtn: 'Add adjustment',
    expenseAdded: 'Expense added',
    addExpenseTitle: 'ADD EXPENSE',
    amount: 'AMOUNT',
    category: 'CATEGORY',
    fromAccount: 'FROM ACCOUNT',
    date: 'DATE',
    vendor: 'VENDOR',
    note: 'NOTE',
    paidCheckbox: 'Paid',
    addExpenseBtn: 'Add expense',
    allCategories: 'All',
    expensesHeader: (n, total) => `EXPENSES FOR PERIOD (${n}) · TOTAL ${total}`,
    noExpensesPeriod: 'No expenses for the period.',
    paidBtn: 'Paid',
    notPaidBtn: 'Unpaid',
    updated: 'Updated',
    edit: 'Edit',
    history: 'History',
    changeHistoryTitle: 'CHANGE HISTORY (immutable)',
    noChangesYet: 'No changes yet.',
    editExpenseTitle: 'EDIT EXPENSE',
    account: 'ACCOUNT',
    reasonChangePlaceholder: 'Reason for the change (to audit)',
    expenseUpdated: 'Expense updated',
    save: 'Save',
    cancel: 'Cancel',
    newCategoryTitle: 'NEW EXPENSE CATEGORY',
    categoryPlaceholder: 'E.g.: Fines',
    categoryAdded: 'Category added',
    add: 'Add',
    saved: 'Saved',
    categoryCount: (n) => `${n} exp.`,
    disabledSuffix: ' (off)',
    on: 'On',
    off: 'Off',
    categoryDeleted: 'Category deleted',
    reconcileTitle: 'RECONCILE WITH REALITY',
    reconcileIntro: 'Enter the actual bank/cash balance (in EUR) and compare it with the module’s calculated cash. A discrepancy is a reason to check — nothing is recalculated automatically.',
    calculatedCash: 'CALCULATED CASH',
    actualBalance: 'ACTUAL BALANCE',
    discrepancy: 'DISCREPANCY',
    booksMatch: 'books match',
    actualMore: 'actual is higher',
    actualLess: 'actual is lower',
    noteOptionalPlaceholder: 'Note (optional)',
    reconcileSaved: 'Reconciliation saved',
    saveReconcileBtn: 'Save reconciliation',
    reconcileHistory: 'RECONCILIATION HISTORY',
    actualPrefix: 'actual ',
    recordedPrefix: 'calc. ',
    debtorsTitle: 'DEBTORS (owe us)',
    noDebtors: 'No one owes — all bookings are paid.',
    creditorsTitle: 'CREDITORS (we owe · unpaid expenses)',
    noCreditors: 'No unpaid expenses.',
    markedPaid: 'Marked as paid',
    payBtn: 'Pay',
    transferDone: 'Transfer completed',
    accountCreated: 'Account created',
    totalInCash: 'TOTAL IN CASH',
    sumAllAccounts: 'sum across all accounts (EUR)',
    newAccountTitle: 'NEW ACCOUNT / WALLET',
    name: 'NAME',
    accountNamePlaceholder: 'E.g.: Office cash',
    type: 'TYPE',
    openingBalanceLabel: 'OPENING BALANCE',
    createAccountBtn: 'Create account',
    transferTitle: 'TRANSFER BETWEEN ACCOUNTS (total unchanged)',
    toAccount: 'TO ACCOUNT',
    transferBtn: 'Transfer',
    recentTransfers: 'RECENT TRANSFERS',
    archivedBadge: '· archived',
    balanceEur: 'BALANCE (EUR)',
    openingShort: 'open. ',
    openingBalanceBtn: 'Opening balance',
    restored: 'Restored',
    archived: 'Archived',
    unarchiveBtn: 'Restore',
    archiveBtn: 'Archive',
    accountsNote: 'Account balance = opening balance + income/deposits into the account − deposit refunds − paid expenses from the account. All balances are converted to EUR. The opening balance can be edited, but every change is recorded in the audit trail.',
    openingBalanceCur: (cur) => `OPENING BALANCE (${cur})`,
    reasonAuditPlaceholder: 'Reason (to audit)',
    balanceUpdated: 'Balance updated',
    accountUpdated: 'Account updated',
    auditLogTitle: 'AUDIT LOG (immutable · staff only)',
    allFilter: 'All',
    noRecords: 'No records.',
  },
  tr: {
    views: { overview: 'Genel bakış', accounts: 'Hesaplar', expenses: 'Giderler', categories: 'Kategoriler', reconcile: 'Mutabakat', ledger: 'Borçlular ve alacaklılar', audit: 'Denetim' },
    accountKinds: { CASH: 'Nakit', BANK: 'Banka', CRYPTO: 'Kripto', OTHER: 'Diğer' },
    auditAction: { create: 'oluşturma', update: 'değişiklik', archive: 'arşivleme', unarchive: 'arşivden çıkarma', delete: 'silme', confirm: 'onaylama', correct: 'düzeltme', transfer: 'transfer' },
    auditEntity: { account: 'Hesap', expense: 'Gider', payment: 'Ödeme', opening_balance: 'Açılış bakiyesi', transfer: 'Transfer', income_adjustment: 'Gelir düzeltmesi' },
    reasonPrefix: 'gerekçe: ',
    noDataPeriod: 'Dönem için veri yok.',
    errorGeneric: 'Hata',
    period: 'DÖNEM',
    month: 'Ay',
    year: 'Yıl',
    allTime: 'Tümü',
    incomeForPeriod: 'DÖNEM GELİRİ',
    confirmedPayments: 'onaylanmış ödemeler',
    expensesForPeriod: 'DÖNEM GİDERİ',
    profit: 'KÂR',
    incomeMinusExpenses: 'gelir − gider',
    cashNow: 'KASA (ŞU AN)',
    cashSub: (d) => `hesaplar toplamı · depozitolar ${d}`,
    cashByAccount: 'HESABA GÖRE KASA',
    unassigned: 'Atanmamış (hesapsız)',
    baseNotePre: 'Tüm toplamlar temel para birimine çevrilmiştir ',
    baseNotePost: ' sistem kurlarıyla (gelir — ödeme anındaki kur, giderler — kayıt anındaki kur). Farklı para birimleri asla doğrudan toplanmaz — aşağıdaki para birimi dökümüne bakın.',
    incomeByType: 'TÜRE GÖRE GELİR',
    expenseByCategory: 'KATEGORİYE GÖRE GİDER',
    byCurrency: 'PARA BİRİMİNE GÖRE (çevrimsiz, “olduğu gibi”)',
    incomeWord: 'Gelir',
    expensesWord: 'Giderler',
    incomeEntriesHeader: (n) => `DÖNEM GELİRLERİ (${n})`,
    incomeDerivedNote: 'Gelir, onaylanmış ödemelerden türetilir ve doğrudan düzenlenemez — bir düzeltme kullanın.',
    addIncomeAdjustBtn: '+ Gelir düzeltmesi',
    noConfirmedPayments: 'Dönem için onaylanmış ödeme yok.',
    correctionBadge: 'DÜZELTME',
    adjustmentAdded: 'Düzeltme eklendi',
    adjustTitle: 'GELİR DÜZELTMESİ (işaretli tutar: “−50” — azalma)',
    amountSigned: 'TUTAR (±)',
    currency: 'PARA BİRİMİ',
    bookingOptional: 'REZERVASYON (opsiyonel)',
    none: '— yok —',
    accountOptional: 'HESAP (opsiyonel)',
    reasonRequired: 'GEREKÇE *',
    reasonAdjustPlaceholder: 'Örn.: yeniden hesaplama iadesi',
    addAdjustmentBtn: 'Düzeltme ekle',
    expenseAdded: 'Gider eklendi',
    addExpenseTitle: 'GİDER EKLE',
    amount: 'TUTAR',
    category: 'KATEGORİ',
    fromAccount: 'HESAPTAN',
    date: 'TARİH',
    vendor: 'TEDARİKÇİ',
    note: 'NOT',
    paidCheckbox: 'Ödendi',
    addExpenseBtn: 'Gider ekle',
    allCategories: 'Tümü',
    expensesHeader: (n, total) => `DÖNEM GİDERLERİ (${n}) · TOPLAM ${total}`,
    noExpensesPeriod: 'Dönem için gider yok.',
    paidBtn: 'Ödendi',
    notPaidBtn: 'Ödenmedi',
    updated: 'Güncellendi',
    edit: 'Düzenle',
    history: 'Geçmiş',
    changeHistoryTitle: 'DEĞİŞİKLİK GEÇMİŞİ (değiştirilemez)',
    noChangesYet: 'Henüz değişiklik yok.',
    editExpenseTitle: 'GİDERİ DÜZENLE',
    account: 'HESAP',
    reasonChangePlaceholder: 'Değişiklik gerekçesi (denetime)',
    expenseUpdated: 'Gider güncellendi',
    save: 'Kaydet',
    cancel: 'İptal',
    newCategoryTitle: 'YENİ GİDER KATEGORİSİ',
    categoryPlaceholder: 'Örn.: Cezalar',
    categoryAdded: 'Kategori eklendi',
    add: 'Ekle',
    saved: 'Kaydedildi',
    categoryCount: (n) => `${n} gider`,
    disabledSuffix: ' (kapalı)',
    on: 'Açık',
    off: 'Kapalı',
    categoryDeleted: 'Kategori silindi',
    reconcileTitle: 'GERÇEKLE MUTABAKAT',
    reconcileIntro: 'Gerçek banka/kasa bakiyesini (EUR) girin ve modülün hesapladığı kasayla karşılaştırın. Fark, kontrol etmek için bir nedendir — hiçbir şey otomatik olarak yeniden hesaplanmaz.',
    calculatedCash: 'HESAPLANAN KASA',
    actualBalance: 'GERÇEK BAKİYE',
    discrepancy: 'FARK',
    booksMatch: 'kayıtlar uyuşuyor',
    actualMore: 'gerçek daha fazla',
    actualLess: 'gerçek daha az',
    noteOptionalPlaceholder: 'Not (opsiyonel)',
    reconcileSaved: 'Mutabakat kaydedildi',
    saveReconcileBtn: 'Mutabakatı kaydet',
    reconcileHistory: 'MUTABAKAT GEÇMİŞİ',
    actualPrefix: 'gerçek ',
    recordedPrefix: 'hesap. ',
    debtorsTitle: 'BORÇLULAR (bize borçlu)',
    noDebtors: 'Kimse borçlu değil — tüm rezervasyonlar ödendi.',
    creditorsTitle: 'ALACAKLILAR (biz borçluyuz · ödenmemiş giderler)',
    noCreditors: 'Ödenmemiş gider yok.',
    markedPaid: 'Ödendi olarak işaretlendi',
    payBtn: 'Öde',
    transferDone: 'Transfer tamamlandı',
    accountCreated: 'Hesap oluşturuldu',
    totalInCash: 'KASADA TOPLAM',
    sumAllAccounts: 'tüm hesapların toplamı (EUR)',
    newAccountTitle: 'YENİ HESAP / CÜZDAN',
    name: 'AD',
    accountNamePlaceholder: 'Örn.: Ofis kasası',
    type: 'TÜR',
    openingBalanceLabel: 'AÇILIŞ BAKİYESİ',
    createAccountBtn: 'Hesap oluştur',
    transferTitle: 'HESAPLAR ARASI TRANSFER (toplam değişmez)',
    toAccount: 'HESABA',
    transferBtn: 'Transfer et',
    recentTransfers: 'SON TRANSFERLER',
    archivedBadge: '· arşivde',
    balanceEur: 'BAKİYE (EUR)',
    openingShort: 'açılış ',
    openingBalanceBtn: 'Açılış bakiyesi',
    restored: 'Geri yüklendi',
    archived: 'Arşivlendi',
    unarchiveBtn: 'Geri al',
    archiveBtn: 'Arşivle',
    accountsNote: 'Hesap bakiyesi = açılış bakiyesi + hesaba gelen gelir/depozitolar − depozito iadeleri − hesaptan ödenen giderler. Tüm bakiyeler EUR’ya çevrilir. Açılış bakiyesi düzenlenebilir, ancak her değişiklik denetim kaydına işlenir.',
    openingBalanceCur: (cur) => `AÇILIŞ BAKİYESİ (${cur})`,
    reasonAuditPlaceholder: 'Gerekçe (denetime)',
    balanceUpdated: 'Bakiye güncellendi',
    accountUpdated: 'Hesap güncellendi',
    auditLogTitle: 'DENETİM GÜNLÜĞÜ (değiştirilemez · yalnızca personel)',
    allFilter: 'Tümü',
    noRecords: 'Kayıt yok.',
  },
  es: {
    views: { overview: 'Resumen', accounts: 'Cuentas', expenses: 'Gastos', categories: 'Categorías', reconcile: 'Conciliación', ledger: 'Deudores y acreedores', audit: 'Auditoría' },
    accountKinds: { CASH: 'Efectivo', BANK: 'Banco', CRYPTO: 'Cripto', OTHER: 'Otro' },
    auditAction: { create: 'creación', update: 'modificación', archive: 'archivado', unarchive: 'desarchivado', delete: 'eliminación', confirm: 'confirmación', correct: 'corrección', transfer: 'transferencia' },
    auditEntity: { account: 'Cuenta', expense: 'Gasto', payment: 'Pago', opening_balance: 'Saldo inicial', transfer: 'Transferencia', income_adjustment: 'Ajuste de ingresos' },
    reasonPrefix: 'motivo: ',
    noDataPeriod: 'No hay datos del período.',
    errorGeneric: 'Error',
    period: 'PERÍODO',
    month: 'Mes',
    year: 'Año',
    allTime: 'Todo',
    incomeForPeriod: 'INGRESOS DEL PERÍODO',
    confirmedPayments: 'pagos confirmados',
    expensesForPeriod: 'GASTOS DEL PERÍODO',
    profit: 'BENEFICIO',
    incomeMinusExpenses: 'ingresos − gastos',
    cashNow: 'CAJA (AHORA)',
    cashSub: (d) => `suma de cuentas · fianzas ${d}`,
    cashByAccount: 'CAJA POR CUENTA',
    unassigned: 'Sin asignar (sin cuenta)',
    baseNotePre: 'Todos los totales están convertidos a la divisa base ',
    baseNotePost: ' a los tipos del sistema (ingresos — al tipo de la fecha de pago, gastos — al tipo de la fecha de registro). Las distintas divisas nunca se suman directamente — véase el desglose por divisa más abajo.',
    incomeByType: 'INGRESOS POR TIPO',
    expenseByCategory: 'GASTOS POR CATEGORÍA',
    byCurrency: 'POR DIVISA (sin conversión, «tal cual»)',
    incomeWord: 'Ingresos',
    expensesWord: 'Gastos',
    incomeEntriesHeader: (n) => `INGRESOS DEL PERÍODO (${n})`,
    incomeDerivedNote: 'Los ingresos se derivan de los pagos confirmados y no se editan directamente — usa un ajuste.',
    addIncomeAdjustBtn: '+ Ajuste de ingresos',
    noConfirmedPayments: 'No hay pagos confirmados en el período.',
    correctionBadge: 'CORRECCIÓN',
    adjustmentAdded: 'Ajuste añadido',
    adjustTitle: 'AJUSTE DE INGRESOS (importe con signo: «−50» — disminución)',
    amountSigned: 'IMPORTE (±)',
    currency: 'DIVISA',
    bookingOptional: 'RESERVA (opcional)',
    none: '— sin —',
    accountOptional: 'CUENTA (opcional)',
    reasonRequired: 'MOTIVO *',
    reasonAdjustPlaceholder: 'P. ej.: reembolso por recálculo',
    addAdjustmentBtn: 'Añadir ajuste',
    expenseAdded: 'Gasto añadido',
    addExpenseTitle: 'AÑADIR GASTO',
    amount: 'IMPORTE',
    category: 'CATEGORÍA',
    fromAccount: 'DESDE CUENTA',
    date: 'FECHA',
    vendor: 'PROVEEDOR',
    note: 'NOTA',
    paidCheckbox: 'Pagado',
    addExpenseBtn: 'Añadir gasto',
    allCategories: 'Todas',
    expensesHeader: (n, total) => `GASTOS DEL PERÍODO (${n}) · TOTAL ${total}`,
    noExpensesPeriod: 'No hay gastos en el período.',
    paidBtn: 'Pagado',
    notPaidBtn: 'Sin pagar',
    updated: 'Actualizado',
    edit: 'Editar',
    history: 'Historial',
    changeHistoryTitle: 'HISTORIAL DE CAMBIOS (inmutable)',
    noChangesYet: 'Aún no hay cambios.',
    editExpenseTitle: 'EDITAR GASTO',
    account: 'CUENTA',
    reasonChangePlaceholder: 'Motivo del cambio (a auditoría)',
    expenseUpdated: 'Gasto actualizado',
    save: 'Guardar',
    cancel: 'Cancelar',
    newCategoryTitle: 'NUEVA CATEGORÍA DE GASTOS',
    categoryPlaceholder: 'P. ej.: Multas',
    categoryAdded: 'Categoría añadida',
    add: 'Añadir',
    saved: 'Guardado',
    categoryCount: (n) => `${n} gastos`,
    disabledSuffix: ' (desact.)',
    on: 'Act.',
    off: 'Desact.',
    categoryDeleted: 'Categoría eliminada',
    reconcileTitle: 'CONCILIACIÓN CON LA REALIDAD',
    reconcileIntro: 'Introduce el saldo real de banco/caja (en EUR) y compáralo con la caja calculada del módulo. Una discrepancia es motivo para revisar — no se recalcula nada automáticamente.',
    calculatedCash: 'CAJA CALCULADA',
    actualBalance: 'SALDO REAL',
    discrepancy: 'DISCREPANCIA',
    booksMatch: 'las cuentas cuadran',
    actualMore: 'lo real es mayor',
    actualLess: 'lo real es menor',
    noteOptionalPlaceholder: 'Nota (opcional)',
    reconcileSaved: 'Conciliación guardada',
    saveReconcileBtn: 'Guardar conciliación',
    reconcileHistory: 'HISTORIAL DE CONCILIACIONES',
    actualPrefix: 'real ',
    recordedPrefix: 'calc. ',
    debtorsTitle: 'DEUDORES (nos deben)',
    noDebtors: 'Nadie debe — todas las reservas están pagadas.',
    creditorsTitle: 'ACREEDORES (debemos · gastos sin pagar)',
    noCreditors: 'No hay gastos sin pagar.',
    markedPaid: 'Marcado como pagado',
    payBtn: 'Pagar',
    transferDone: 'Transferencia realizada',
    accountCreated: 'Cuenta creada',
    totalInCash: 'TOTAL EN CAJA',
    sumAllAccounts: 'suma de todas las cuentas (EUR)',
    newAccountTitle: 'NUEVA CUENTA / MONEDERO',
    name: 'NOMBRE',
    accountNamePlaceholder: 'P. ej.: Caja de oficina',
    type: 'TIPO',
    openingBalanceLabel: 'SALDO INICIAL',
    createAccountBtn: 'Crear cuenta',
    transferTitle: 'TRANSFERENCIA ENTRE CUENTAS (el total no cambia)',
    toAccount: 'A CUENTA',
    transferBtn: 'Transferir',
    recentTransfers: 'TRANSFERENCIAS RECIENTES',
    archivedBadge: '· archivada',
    balanceEur: 'SALDO (EUR)',
    openingShort: 'inicial ',
    openingBalanceBtn: 'Saldo inicial',
    restored: 'Restaurada',
    archived: 'Archivada',
    unarchiveBtn: 'Restaurar',
    archiveBtn: 'Archivar',
    accountsNote: 'Saldo de la cuenta = saldo inicial + ingresos/fianzas a la cuenta − devoluciones de fianzas − gastos pagados desde la cuenta. Todos los saldos están convertidos a EUR. El saldo inicial se puede editar, pero cada cambio queda registrado en la auditoría.',
    openingBalanceCur: (cur) => `SALDO INICIAL (${cur})`,
    reasonAuditPlaceholder: 'Motivo (a auditoría)',
    balanceUpdated: 'Saldo actualizado',
    accountUpdated: 'Cuenta actualizada',
    auditLogTitle: 'REGISTRO DE AUDITORÍA (inmutable · solo personal)',
    allFilter: 'Todos',
    noRecords: 'Sin registros.',
  },
  de: {
    views: { overview: 'Übersicht', accounts: 'Konten', expenses: 'Ausgaben', categories: 'Kategorien', reconcile: 'Abgleich', ledger: 'Schuldner & Gläubiger', audit: 'Prüfprotokoll' },
    accountKinds: { CASH: 'Bar', BANK: 'Bank', CRYPTO: 'Krypto', OTHER: 'Sonstige' },
    auditAction: { create: 'Erstellung', update: 'Änderung', archive: 'Archivierung', unarchive: 'Wiederherstellung', delete: 'Löschung', confirm: 'Bestätigung', correct: 'Korrektur', transfer: 'Überweisung' },
    auditEntity: { account: 'Konto', expense: 'Ausgabe', payment: 'Zahlung', opening_balance: 'Anfangssaldo', transfer: 'Überweisung', income_adjustment: 'Ertragskorrektur' },
    reasonPrefix: 'Grund: ',
    noDataPeriod: 'Keine Daten für den Zeitraum.',
    errorGeneric: 'Fehler',
    period: 'ZEITRAUM',
    month: 'Monat',
    year: 'Jahr',
    allTime: 'Alles',
    incomeForPeriod: 'EINNAHMEN IM ZEITRAUM',
    confirmedPayments: 'bestätigte Zahlungen',
    expensesForPeriod: 'AUSGABEN IM ZEITRAUM',
    profit: 'GEWINN',
    incomeMinusExpenses: 'Einnahmen − Ausgaben',
    cashNow: 'KASSE (JETZT)',
    cashSub: (d) => `Summe aller Konten · Kautionen ${d}`,
    cashByAccount: 'KASSE NACH KONTO',
    unassigned: 'Nicht zugeordnet (ohne Konto)',
    baseNotePre: 'Alle Summen sind in die Basiswährung umgerechnet ',
    baseNotePost: ' zu den Systemkursen (Einnahmen — zum Kurs am Zahlungstag, Ausgaben — zum Kurs am Erfassungstag). Unterschiedliche Währungen werden nie direkt addiert — siehe die Aufschlüsselung nach Währung unten.',
    incomeByType: 'EINNAHMEN NACH TYP',
    expenseByCategory: 'AUSGABEN NACH KATEGORIE',
    byCurrency: 'NACH WÄHRUNG (ohne Umrechnung, „wie erfasst“)',
    incomeWord: 'Einnahmen',
    expensesWord: 'Ausgaben',
    incomeEntriesHeader: (n) => `EINNAHMEN IM ZEITRAUM (${n})`,
    incomeDerivedNote: 'Einnahmen werden aus bestätigten Zahlungen abgeleitet und können nicht direkt bearbeitet werden — verwenden Sie eine Korrektur.',
    addIncomeAdjustBtn: '+ Ertragskorrektur',
    noConfirmedPayments: 'Keine bestätigten Zahlungen im Zeitraum.',
    correctionBadge: 'KORREKTUR',
    adjustmentAdded: 'Korrektur hinzugefügt',
    adjustTitle: 'ERTRAGSKORREKTUR (Betrag mit Vorzeichen: „−50“ — Minderung)',
    amountSigned: 'BETRAG (±)',
    currency: 'WÄHRUNG',
    bookingOptional: 'BUCHUNG (optional)',
    none: '— ohne —',
    accountOptional: 'KONTO (optional)',
    reasonRequired: 'GRUND *',
    reasonAdjustPlaceholder: 'z. B.: Erstattung wegen Neuberechnung',
    addAdjustmentBtn: 'Korrektur hinzufügen',
    expenseAdded: 'Ausgabe hinzugefügt',
    addExpenseTitle: 'AUSGABE HINZUFÜGEN',
    amount: 'BETRAG',
    category: 'KATEGORIE',
    fromAccount: 'VON KONTO',
    date: 'DATUM',
    vendor: 'LIEFERANT',
    note: 'NOTIZ',
    paidCheckbox: 'Bezahlt',
    addExpenseBtn: 'Ausgabe hinzufügen',
    allCategories: 'Alle',
    expensesHeader: (n, total) => `AUSGABEN IM ZEITRAUM (${n}) · GESAMT ${total}`,
    noExpensesPeriod: 'Keine Ausgaben im Zeitraum.',
    paidBtn: 'Bezahlt',
    notPaidBtn: 'Offen',
    updated: 'Aktualisiert',
    edit: 'Bearb.',
    history: 'Verlauf',
    changeHistoryTitle: 'ÄNDERUNGSVERLAUF (unveränderlich)',
    noChangesYet: 'Noch keine Änderungen.',
    editExpenseTitle: 'AUSGABE BEARBEITEN',
    account: 'KONTO',
    reasonChangePlaceholder: 'Grund der Änderung (ins Protokoll)',
    expenseUpdated: 'Ausgabe geändert',
    save: 'Speichern',
    cancel: 'Abbrechen',
    newCategoryTitle: 'NEUE AUSGABENKATEGORIE',
    categoryPlaceholder: 'z. B.: Bußgelder',
    categoryAdded: 'Kategorie hinzugefügt',
    add: 'Hinzufügen',
    saved: 'Gespeichert',
    categoryCount: (n) => `${n} Ausg.`,
    disabledSuffix: ' (aus)',
    on: 'An',
    off: 'Aus',
    categoryDeleted: 'Kategorie gelöscht',
    reconcileTitle: 'ABGLEICH MIT DER REALITÄT',
    reconcileIntro: 'Geben Sie den tatsächlichen Bank-/Kassenbestand (in EUR) ein und vergleichen Sie ihn mit dem berechneten Kassenbestand des Moduls. Eine Abweichung ist ein Grund zur Prüfung — es wird nichts automatisch neu berechnet.',
    calculatedCash: 'BERECHNETE KASSE',
    actualBalance: 'TATSÄCHLICHER SALDO',
    discrepancy: 'ABWEICHUNG',
    booksMatch: 'Bücher stimmen überein',
    actualMore: 'tatsächlich mehr',
    actualLess: 'tatsächlich weniger',
    noteOptionalPlaceholder: 'Notiz (optional)',
    reconcileSaved: 'Abgleich gespeichert',
    saveReconcileBtn: 'Abgleich speichern',
    reconcileHistory: 'ABGLEICHVERLAUF',
    actualPrefix: 'tatsächlich ',
    recordedPrefix: 'ber. ',
    debtorsTitle: 'SCHULDNER (schulden uns)',
    noDebtors: 'Niemand schuldet — alle Buchungen sind bezahlt.',
    creditorsTitle: 'GLÄUBIGER (wir schulden · offene Ausgaben)',
    noCreditors: 'Keine offenen Ausgaben.',
    markedPaid: 'Als bezahlt markiert',
    payBtn: 'Bezahlen',
    transferDone: 'Überweisung ausgeführt',
    accountCreated: 'Konto erstellt',
    totalInCash: 'GESAMT IN KASSE',
    sumAllAccounts: 'Summe aller Konten (EUR)',
    newAccountTitle: 'NEUES KONTO / WALLET',
    name: 'NAME',
    accountNamePlaceholder: 'z. B.: Bürokasse',
    type: 'TYP',
    openingBalanceLabel: 'ANFANGSSALDO',
    createAccountBtn: 'Konto erstellen',
    transferTitle: 'ÜBERWEISUNG ZWISCHEN KONTEN (Gesamt bleibt gleich)',
    toAccount: 'AUF KONTO',
    transferBtn: 'Überweisen',
    recentTransfers: 'LETZTE ÜBERWEISUNGEN',
    archivedBadge: '· archiviert',
    balanceEur: 'SALDO (EUR)',
    openingShort: 'Anf. ',
    openingBalanceBtn: 'Anfangssaldo',
    restored: 'Wiederhergestellt',
    archived: 'Archiviert',
    unarchiveBtn: 'Zurückholen',
    archiveBtn: 'Archivieren',
    accountsNote: 'Kontostand = Anfangssaldo + Einnahmen/Kautionen auf das Konto − Kautionsrückzahlungen − vom Konto bezahlte Ausgaben. Alle Salden sind in EUR umgerechnet. Der Anfangssaldo kann bearbeitet werden, aber jede Änderung wird im Prüfprotokoll festgehalten.',
    openingBalanceCur: (cur) => `ANFANGSSALDO (${cur})`,
    reasonAuditPlaceholder: 'Grund (ins Protokoll)',
    balanceUpdated: 'Saldo geändert',
    accountUpdated: 'Konto geändert',
    auditLogTitle: 'PRÜFPROTOKOLL (unveränderlich · nur Personal)',
    allFilter: 'Alle',
    noRecords: 'Keine Einträge.',
  },
}

const kindLabel = (t: Strings, k: string) => t.accountKinds[k] ?? k

/** One immutable audit entry: who · what changed (from → to) · when. */
function AuditItem({ a }: { a: AuditRow }) {
  const t = useDict(dict)
  return (
    <div style={{ padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ font: '700 12px var(--f-ui)', color: 'var(--d-text)' }}>
          {t.auditEntity[a.entityType] ?? a.entityType} · {t.auditAction[a.action] ?? a.action}
        </span>
        <span style={{ font: '500 10px var(--f-mono)', color: 'var(--d-muted-2)', whiteSpace: 'nowrap' }}>
          {a.byName ?? '—'} · {new Date(a.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      {a.changes.length > 0 && (
        <div style={{ marginTop: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {a.changes.map((c, i) => (
            <div key={i} style={{ font: '500 11px var(--f-ui)', color: 'var(--d-muted)' }}>
              <span style={{ color: 'var(--d-muted-2)' }}>{c.field}:</span> {c.from ?? '∅'} <span style={{ color: 'var(--d-accent-light)' }}>→</span> {c.to ?? '∅'}
            </div>
          ))}
        </div>
      )}
      {a.reason && <div style={{ marginTop: 2, font: '500 11px var(--f-ui)', color: '#E7B463' }}>{t.reasonPrefix}{a.reason}</div>}
    </div>
  )
}

function StatCard({ label, value, tone, sub }: { label: string; value: string; tone: string; sub?: string }) {
  return (
    <div style={{ ...PANEL, padding: '16px 18px', borderLeft: `3px solid ${tone}` }}>
      <div style={LABEL}>{label}</div>
      <div style={{ marginTop: 6, font: '800 24px var(--f-display)', color: tone }}>{value}</div>
      {sub && <div style={{ marginTop: 3, font: '500 11px var(--f-ui)', color: 'var(--d-muted)' }}>{sub}</div>}
    </div>
  )
}

function Bars({ rows, tone }: { rows: { key: string; name: string; base: number }[]; tone: string }) {
  const t = useDict(dict)
  const max = Math.max(1, ...rows.map((r) => r.base))
  if (!rows.length) return <div style={{ font: '500 12px var(--f-ui)', color: 'var(--d-muted-2)', padding: '6px 0' }}>{t.noDataPeriod}</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {rows.map((r) => (
        <div key={r.key}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-text)' }}>{r.name}</span>
            <span style={{ font: '700 12px var(--f-ui)', color: tone }}>{eur(r.base)}</span>
          </div>
          <div style={{ height: 7, borderRadius: 5, background: 'var(--d-el)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(r.base / max) * 100}%`, background: tone, borderRadius: 5 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Finance({ from, to, overview, categories, accounts, transfers, bookings, debtors, creditors, reconciliations, audit }: FinanceProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const t = useDict(dict)
  const [pending, start] = useTransition()
  const [view, setView] = useState<View>('overview')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) => {
    setMsg(null)
    start(async () => {
      const r = await fn()
      if (r.ok) { setMsg({ ok: true, text: okMsg }); router.refresh() } else setMsg({ ok: false, text: r.error ?? t.errorGeneric })
    })
  }

  const setPeriod = (f: string, tt: string) => start(() => { router.push(`/admin/finance?from=${f}&to=${tt}`); return Promise.resolve() })
  const preset = (kind: 'month' | 'year' | 'all') => {
    const now = new Date()
    if (kind === 'month') setPeriod(`${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`, now.toISOString().slice(0, 10))
    else if (kind === 'year') setPeriod(`${now.getUTCFullYear()}-01-01`, now.toISOString().slice(0, 10))
    else setPeriod('2000-01-01', now.toISOString().slice(0, 10))
  }

  const PeriodBar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={LABEL}>{t.period}</span>
      <input type="date" value={from} onChange={(e) => setPeriod(e.target.value, to)} style={inputSt} />
      <span style={{ color: 'var(--d-muted)' }}>—</span>
      <input type="date" value={to} onChange={(e) => setPeriod(from, e.target.value)} style={inputSt} />
      {(['month', 'year', 'all'] as const).map((k) => (
        <button key={k} type="button" onClick={() => preset(k)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--d-hair)', background: 'var(--d-el)', color: 'var(--d-muted)', font: '700 11px var(--f-ui)', cursor: 'pointer' }}>
          {k === 'month' ? t.month : k === 'year' ? t.year : t.allTime}
        </button>
      ))}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* sub-nav — scrollable chip rail on mobile, wraps on desktop */}
      <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'center', gap: 8, flexDirection: isMobile ? 'column' : 'row', flexWrap: isMobile ? 'nowrap' : 'wrap' }}>
        <div
          className={isMobile ? 'av-xscroll' : undefined}
          style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: isMobile ? 'nowrap' : 'wrap', ...(isMobile ? { paddingBottom: 4 } : {}) }}
        >
          {VIEW_KEYS.map((key) => {
            const on = key === view
            return (
              <button key={key} type="button" onClick={() => setView(key)}
                style={{ padding: isMobile ? '11px 16px' : '9px 15px', minHeight: isMobile ? 44 : undefined, borderRadius: 10, border: on ? 'none' : '1px solid var(--d-hair)', background: on ? 'var(--d-accent)' : 'var(--d-el)', color: on ? '#082A33' : 'var(--d-muted)', font: '700 12px var(--f-ui)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {t.views[key]}
                {key === 'ledger' && (debtors.rows.length + creditors.rows.length > 0) && (
                  <span style={{ marginLeft: 6, opacity: 0.8 }}>· {debtors.rows.length + creditors.rows.length}</span>
                )}
              </button>
            )
          })}
        </div>
        {msg && <span style={{ marginLeft: isMobile ? 0 : 'auto', font: '600 12px var(--f-ui)', color: msg.ok ? 'var(--d-green)' : 'var(--d-red)' }}>{msg.text}</span>}
      </div>

      {view === 'overview' && <Overview overview={overview} accounts={accounts} bookings={bookings} pending={pending} run={run} periodBar={PeriodBar} isMobile={isMobile} />}
      {view === 'accounts' && <Accounts accounts={accounts} transfers={transfers} audit={audit} pending={pending} run={run} isMobile={isMobile} />}
      {view === 'expenses' && <Expenses overview={overview} categories={categories} accounts={accounts.rows} audit={audit} periodBar={PeriodBar} pending={pending} run={run} isMobile={isMobile} />}
      {view === 'categories' && <Categories categories={categories} pending={pending} run={run} />}
      {view === 'reconcile' && <Reconcile recorded={overview.cashPositionBase} reconciliations={reconciliations} pending={pending} run={run} isMobile={isMobile} />}
      {view === 'ledger' && <Ledger debtors={debtors} creditors={creditors} pending={pending} run={run} />}
      {view === 'audit' && <AuditLog audit={audit} />}
    </div>
  )
}

/* ─────────────── Overview ─────────────── */
function Overview({ overview: o, accounts, bookings, pending, run, periodBar, isMobile }: { overview: FinanceProps['overview']; accounts: FinanceProps['accounts']; bookings: FinanceProps['bookings']; pending: boolean; run: (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => void; periodBar: ReactNode; isMobile: boolean }) {
  const t = useDict(dict)
  const activeAccounts = accounts.rows.filter((a) => !a.archived)
  const [showAdj, setShowAdj] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {periodBar}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
        <StatCard label={t.incomeForPeriod} value={eur(o.incomeBase)} tone="#8FD7AD" sub={t.confirmedPayments} />
        <StatCard label={t.expensesForPeriod} value={eur(o.expenseBase)} tone="#E58A8A" />
        <StatCard label={t.profit} value={eur(o.profitBase)} tone={o.profitBase >= 0 ? '#8FD7AD' : '#E58A8A'} sub={t.incomeMinusExpenses} />
        <StatCard label={t.cashNow} value={eur(accounts.totalBase)} tone="#A6BEF2" sub={t.cashSub(eur(o.depositsHeldBase))} />
      </div>

      {/* cash split across accounts (= cash position) */}
      <div style={{ ...PANEL, padding: '18px 22px' }}>
        <div style={{ ...LABEL, marginBottom: 12 }}>{t.cashByAccount}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
          {activeAccounts.map((a) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 9, background: 'var(--d-el)' }}>
              <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-text)' }}>{a.name} <span style={{ color: 'var(--d-muted-2)', fontSize: 10 }}>· {kindLabel(t, a.kind)}</span></span>
              <span style={{ font: '800 13px var(--f-ui)', color: a.balanceBase >= 0 ? 'var(--d-text)' : '#E58A8A' }}>{eur(a.balanceBase)}</span>
            </div>
          ))}
          {accounts.unassignedBase !== 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 9, background: 'var(--d-el)', border: '1px dashed rgba(255,255,255,.14)' }}>
              <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-muted)' }}>{t.unassigned}</span>
              <span style={{ font: '800 13px var(--f-ui)', color: '#E7B463' }}>{eur(accounts.unassignedBase)}</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ font: '500 11px var(--f-ui)', color: 'var(--d-muted-2)' }}>
        {t.baseNotePre}<b style={{ color: 'var(--d-muted)' }}>EUR</b>{t.baseNotePost}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
        <div style={{ ...PANEL, padding: '20px 22px' }}>
          <div style={{ ...LABEL, marginBottom: 14 }}>{t.incomeByType}</div>
          <Bars rows={o.incomeByKind} tone="#6FBF8F" />
        </div>
        <div style={{ ...PANEL, padding: '20px 22px' }}>
          <div style={{ ...LABEL, marginBottom: 14 }}>{t.expenseByCategory}</div>
          <Bars rows={o.expenseByCategory} tone="#E0A23E" />
        </div>
      </div>

      {/* per-currency transparency */}
      <div style={{ ...PANEL, padding: '20px 22px' }}>
        <div style={{ ...LABEL, marginBottom: 14 }}>{t.byCurrency}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ font: '700 11px var(--f-ui)', color: '#8FD7AD', marginBottom: 8 }}>{t.incomeWord}</div>
            {o.incomeByCurrency.length === 0 ? <span style={{ font: '500 12px var(--f-ui)', color: 'var(--d-muted-2)' }}>—</span> : o.incomeByCurrency.map((c) => (
              <div key={c.currency} style={{ display: 'flex', justifyContent: 'space-between', font: '600 12px var(--f-ui)', color: 'var(--d-text)', marginBottom: 4 }}><span style={{ color: 'var(--d-muted)' }}>{c.currency}</span><span>{fmt(c.amount, c.currency)}</span></div>
            ))}
          </div>
          <div>
            <div style={{ font: '700 11px var(--f-ui)', color: '#E58A8A', marginBottom: 8 }}>{t.expensesWord}</div>
            {o.expenseByCurrency.length === 0 ? <span style={{ font: '500 12px var(--f-ui)', color: 'var(--d-muted-2)' }}>—</span> : o.expenseByCurrency.map((c) => (
              <div key={c.currency} style={{ display: 'flex', justifyContent: 'space-between', font: '600 12px var(--f-ui)', color: 'var(--d-text)', marginBottom: 4 }}><span style={{ color: 'var(--d-muted)' }}>{c.currency}</span><span>{fmt(c.amount, c.currency)}</span></div>
            ))}
          </div>
        </div>
      </div>

      {/* income entries + corrections */}
      <div style={{ ...PANEL, padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={LABEL}>{t.incomeEntriesHeader(o.incomeEntries.length)}</div>
          <div style={{ marginLeft: 'auto', font: '500 10px var(--f-ui)', color: 'var(--d-muted-2)' }}>{t.incomeDerivedNote}</div>
          <button type="button" onClick={() => setShowAdj((v) => !v)} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--d-hair)', background: showAdj ? 'var(--d-accent)' : 'var(--d-el)', color: showAdj ? '#082A33' : 'var(--d-muted)', font: '700 11px var(--f-ui)', cursor: 'pointer' }}>{t.addIncomeAdjustBtn}</button>
        </div>
        {showAdj && <IncomeAdjustForm bookings={bookings} accounts={accounts.rows.filter((a) => !a.archived)} pending={pending} run={run} onDone={() => setShowAdj(false)} />}
        {o.incomeEntries.length === 0 ? (
          <div style={{ font: '500 12px var(--f-ui)', color: 'var(--d-muted-2)' }}>{t.noConfirmedPayments}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {o.incomeEntries.slice(0, 60).map((e) => (
              <div key={e.id} style={isMobile
                ? { display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '2px 8px', padding: '11px 12px', borderRadius: 9, background: e.correction ? 'rgba(224,162,62,.08)' : 'var(--d-el)', borderLeft: e.correction ? '3px solid #E0A23E' : '3px solid transparent' }
                : { display: 'grid', gridTemplateColumns: '90px 1fr 130px 120px', gap: 12, alignItems: 'center', padding: '9px 12px', borderRadius: 9, background: e.correction ? 'rgba(224,162,62,.08)' : 'var(--d-el)', borderLeft: e.correction ? '3px solid #E0A23E' : '3px solid transparent' }}>
                <span style={{ font: '600 11px var(--f-mono)', color: 'var(--d-muted)' }}>{dshort(e.date)}</span>
                {e.correction ? (
                  <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-text)', ...(isMobile ? { flexBasis: '100%', order: 3 } : {}) }}>
                    <span style={{ font: '700 9px var(--f-ui)', color: '#082A33', background: '#E7B463', borderRadius: 5, padding: '2px 6px', marginRight: 6 }}>{t.correctionBadge}</span>
                    {e.bookingNumber !== '—' && <span style={{ color: 'var(--d-accent-light)', fontFamily: 'var(--f-mono)' }}>{e.bookingNumber} </span>}
                    <span style={{ color: 'var(--d-muted)' }}>{e.reason}</span>
                  </span>
                ) : (
                  <Link href={`/admin?tab=bookings&booking=${e.bookingId}`} style={{ font: '600 12px var(--f-ui)', color: 'var(--d-text)', textDecoration: 'none', ...(isMobile ? { flexBasis: '100%', order: 3, minHeight: 32, display: 'flex', alignItems: 'center' } : {}) }}>
                    <span style={{ color: 'var(--d-accent-light)', fontFamily: 'var(--f-mono)' }}>{e.bookingNumber}</span> · {e.customer} <span style={{ color: 'var(--d-muted-2)' }}>· {e.kind}{e.accountName ? ` · 💳 ${e.accountName}` : ''}</span>
                  </Link>
                )}
                <span style={{ font: '700 12px var(--f-ui)', color: e.base < 0 ? '#E58A8A' : 'var(--d-text)', textAlign: 'right', ...(isMobile ? { order: 1, marginLeft: 'auto' } : {}) }}>{fmt(e.amount, e.currency)}</span>
                <span style={{ font: '600 11px var(--f-ui)', color: e.base < 0 ? '#E58A8A' : '#8FD7AD', textAlign: 'right', ...(isMobile ? { order: 2 } : {}) }}>≈ {eur(e.base)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** Add a marked income correction (signed). Income itself stays derived — this is a separate entry. */
function IncomeAdjustForm({ bookings, accounts, pending, run, onDone }: { bookings: FinanceProps['bookings']; accounts: { id: string; name: string }[]; pending: boolean; run: (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => void; onDone: () => void }) {
  const t = useDict(dict)
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [bookingId, setBookingId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [reason, setReason] = useState('')
  const submit = () => {
    if (!amount.trim() || !reason.trim()) return
    run(() => addIncomeAdjustment({ amount, currency, bookingId: bookingId || null, accountId: accountId || null, reason }), t.adjustmentAdded)
    onDone()
  }
  return (
    <div style={{ ...PANEL, padding: '14px 16px', marginBottom: 12, background: 'var(--d-base)' }}>
      <div style={{ ...LABEL, marginBottom: 8 }}>{t.adjustTitle}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={LABEL}>{t.amountSigned}</span><input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="-50" inputMode="text" style={{ ...inputSt, width: 100 }} /></label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={LABEL}>{t.currency}</span><select value={currency} onChange={(e) => setCurrency(e.target.value)} style={inputSt}>{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={LABEL}>{t.bookingOptional}</span><select value={bookingId} onChange={(e) => setBookingId(e.target.value)} style={inputSt}><option value="">{t.none}</option>{bookings.map((b) => <option key={b.id} value={b.id}>{b.number} · {b.customer}</option>)}</select></label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={LABEL}>{t.accountOptional}</span><select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={inputSt}><option value="">{t.none}</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 160 }}><span style={LABEL}>{t.reasonRequired}</span><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t.reasonAdjustPlaceholder} style={inputSt} /></label>
        <button type="button" onClick={submit} disabled={pending || !amount.trim() || !reason.trim()} style={{ ...coralBtn, opacity: pending || !amount.trim() || !reason.trim() ? 0.6 : 1 }}>{t.addAdjustmentBtn}</button>
      </div>
    </div>
  )
}

/* ─────────────── Expenses ─────────────── */
function Expenses({ overview: o, categories, accounts, audit, periodBar, pending, run, isMobile }: { overview: FinanceProps['overview']; categories: FinanceProps['categories']; accounts: { id: string; name: string }[]; audit: AuditRow[]; periodBar: ReactNode; pending: boolean; run: (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => void; isMobile: boolean }) {
  const t = useDict(dict)
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [spentAt, setSpentAt] = useState(new Date().toISOString().slice(0, 10))
  const [vendor, setVendor] = useState('')
  const [note, setNote] = useState('')
  const [paid, setPaid] = useState(true)
  const [filter, setFilter] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [histId, setHistId] = useState<string | null>(null)

  const activeCats = categories.filter((c) => c.active)
  const submit = () => {
    if (!amount.trim()) return
    run(() => addExpense({ amount, currency, categoryId: categoryId || null, accountId: accountId || null, spentAt, vendor, note, paid }), t.expenseAdded)
    setAmount(''); setVendor(''); setNote('')
  }
  const rows = o.expenseEntries.filter((e) => !filter || e.categoryKey === filter)
  const historyFor = (id: string) => audit.filter((a) => a.entityType === 'expense' && a.entityId === id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* add form */}
      <div style={{ ...PANEL, padding: '18px 22px' }}>
        <div style={{ ...LABEL, marginBottom: 12 }}>{t.addExpenseTitle}</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={LABEL}>{t.amount}</span><input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" inputMode="decimal" style={{ ...inputSt, width: 100 }} /></label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={LABEL}>{t.currency}</span><select value={currency} onChange={(e) => setCurrency(e.target.value)} style={inputSt}>{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={LABEL}>{t.category}</span><select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={inputSt}><option value="">{t.none}</option>{activeCats.map((c) => <option key={c.id} value={c.id}>{c.nameRu}</option>)}</select></label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={LABEL}>{t.fromAccount}</span><select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={inputSt}><option value="">{t.none}</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={LABEL}>{t.date}</span><input type="date" value={spentAt} onChange={(e) => setSpentAt(e.target.value)} style={inputSt} /></label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={LABEL}>{t.vendor}</span><input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="—" style={{ ...inputSt, width: 120 }} /></label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 130 }}><span style={LABEL}>{t.note}</span><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="—" style={inputSt} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, font: '600 12px var(--f-ui)', color: 'var(--d-muted)', paddingBottom: 9, cursor: 'pointer' }}>
            <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} /> {t.paidCheckbox}
          </label>
          <button type="button" onClick={submit} disabled={pending || !amount.trim()} style={{ ...coralBtn, opacity: pending || !amount.trim() ? 0.6 : 1 }}>{t.addExpenseBtn}</button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {periodBar}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <span style={LABEL}>{t.category}</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={inputSt}><option value="">{t.allCategories}</option>{categories.map((c) => <option key={c.key} value={c.key}>{c.nameRu}</option>)}</select>
        </label>
      </div>

      <div style={{ ...PANEL, padding: '16px 20px' }}>
        <div style={{ ...LABEL, marginBottom: 12 }}>{t.expensesHeader(rows.length, eur(rows.reduce((a, r) => a + r.base, 0)))}</div>
        {rows.length === 0 ? (
          <div style={{ font: '500 12px var(--f-ui)', color: 'var(--d-muted-2)', padding: '6px 0' }}>{t.noExpensesPeriod}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {rows.map((e) => {
              const hist = historyFor(e.id)
              return (
                <div key={e.id} style={{ borderRadius: 9, background: 'var(--d-el)', overflow: 'hidden' }}>
                  <div style={isMobile
                    ? { display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 8px', padding: '12px' }
                    : { display: 'grid', gridTemplateColumns: '84px 130px 1fr 110px 90px auto auto auto', gap: 10, alignItems: 'center', padding: '10px 12px' }}>
                    <span style={{ font: '700 12px var(--f-ui)', color: 'var(--d-text)', ...(isMobile ? { order: 1 } : {}) }}>{e.categoryName}</span>
                    <span style={{ font: '700 13px var(--f-ui)', color: 'var(--d-text)', textAlign: 'right', ...(isMobile ? { order: 2, marginLeft: 'auto' } : {}) }}>{fmt(e.amount, e.currency)}</span>
                    <span style={{ font: '600 11px var(--f-mono)', color: 'var(--d-muted)', ...(isMobile ? { order: 3, flexBasis: '100%' } : {}) }}>{dshort(e.date)}{isMobile && <span style={{ color: '#E58A8A', fontFamily: 'var(--f-ui)', marginLeft: 8 }}>≈ {eur(e.base)}</span>}</span>
                    <span style={{ font: '500 11.5px var(--f-ui)', color: 'var(--d-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...(isMobile ? { order: 4, flexBasis: '100%' } : {}) }}>
                      {[e.vendor, e.note].filter(Boolean).join(' · ') || '—'}{e.accountName && <span style={{ color: 'var(--d-muted-2)' }}> · 💳 {e.accountName}</span>}
                    </span>
                    {!isMobile && <span style={{ font: '600 11px var(--f-ui)', color: '#E58A8A', textAlign: 'right' }}>≈ {eur(e.base)}</span>}
                    <button type="button" onClick={() => run(() => setExpensePaid(e.id, !e.paid), t.updated)} disabled={pending}
                      style={{ padding: isMobile ? '9px 12px' : '5px 9px', minHeight: isMobile ? 40 : undefined, borderRadius: 7, border: `1px solid ${e.paid ? 'rgba(111,191,143,.3)' : 'rgba(224,162,62,.35)'}`, background: e.paid ? 'rgba(111,191,143,.12)' : 'rgba(224,162,62,.12)', color: e.paid ? '#8FD7AD' : '#E7B463', font: '700 10px var(--f-ui)', cursor: 'pointer', whiteSpace: 'nowrap', ...(isMobile ? { order: 5, marginTop: 4 } : {}) }}>
                      {e.paid ? t.paidBtn : t.notPaidBtn}
                    </button>
                    <button type="button" onClick={() => { setEditId(editId === e.id ? null : e.id); setHistId(null) }} disabled={pending}
                      style={{ padding: isMobile ? '9px 12px' : '5px 9px', minHeight: isMobile ? 40 : undefined, borderRadius: 7, border: '1px solid var(--d-hair)', background: editId === e.id ? 'var(--d-accent)' : 'var(--d-base)', color: editId === e.id ? '#082A33' : 'var(--d-muted)', font: '700 10px var(--f-ui)', cursor: 'pointer', ...(isMobile ? { order: 6, marginTop: 4 } : {}) }}>{t.edit}</button>
                    <button type="button" onClick={() => { setHistId(histId === e.id ? null : e.id); setEditId(null) }}
                      style={{ padding: isMobile ? '9px 12px' : '5px 9px', minHeight: isMobile ? 40 : undefined, borderRadius: 7, border: '1px solid var(--d-hair)', background: 'var(--d-base)', color: 'var(--d-muted)', font: '700 10px var(--f-ui)', cursor: 'pointer', whiteSpace: 'nowrap', ...(isMobile ? { order: 7, marginTop: 4 } : {}) }}>{t.history} {hist.length ? `(${hist.length})` : ''}</button>
                  </div>
                  {editId === e.id && (
                    <ExpenseEditForm entry={e} categories={activeCats} accounts={accounts} pending={pending} run={run} onDone={() => setEditId(null)} />
                  )}
                  {histId === e.id && (
                    <div style={{ padding: '4px 16px 14px', background: 'var(--d-base)' }}>
                      <div style={{ ...LABEL, margin: '10px 0 6px' }}>{t.changeHistoryTitle}</div>
                      {hist.length === 0 ? <div style={{ font: '500 11px var(--f-ui)', color: 'var(--d-muted-2)' }}>{t.noChangesYet}</div> : hist.map((a) => <AuditItem key={a.id} a={a} />)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/** Inline expense edit — every field change is written to the immutable audit trail (with a reason). */
function ExpenseEditForm({ entry, categories, accounts, pending, run, onDone }: { entry: FinanceProps['overview']['expenseEntries'][number]; categories: FinanceProps['categories']; accounts: { id: string; name: string }[]; pending: boolean; run: (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => void; onDone: () => void }) {
  const t = useDict(dict)
  const [amount, setAmount] = useState(String(entry.amount))
  const [currency, setCurrency] = useState(entry.currency)
  const [categoryId, setCategoryId] = useState(categories.find((c) => c.key === entry.categoryKey)?.id ?? '')
  const [accountId, setAccountId] = useState(entry.accountId ?? '')
  const [spentAt, setSpentAt] = useState(entry.date.slice(0, 10))
  const [vendor, setVendor] = useState(entry.vendor ?? '')
  const [note, setNote] = useState(entry.note ?? '')
  const [reason, setReason] = useState('')
  return (
    <div style={{ padding: '4px 16px 16px', background: 'var(--d-base)', borderTop: '1px solid rgba(255,255,255,.06)' }}>
      <div style={{ ...LABEL, margin: '10px 0 8px' }}>{t.editExpenseTitle}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={LABEL}>{t.amount}</span><input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" style={{ ...inputSt, width: 100 }} /></label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={LABEL}>{t.currency}</span><select value={currency} onChange={(e) => setCurrency(e.target.value as typeof currency)} style={inputSt}>{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={LABEL}>{t.category}</span><select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={inputSt}><option value="">{t.none}</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.nameRu}</option>)}</select></label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={LABEL}>{t.account}</span><select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={inputSt}><option value="">{t.none}</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={LABEL}>{t.date}</span><input type="date" value={spentAt} onChange={(e) => setSpentAt(e.target.value)} style={inputSt} /></label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={LABEL}>{t.vendor}</span><input value={vendor} onChange={(e) => setVendor(e.target.value)} style={{ ...inputSt, width: 120 }} /></label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 120 }}><span style={LABEL}>{t.note}</span><input value={note} onChange={(e) => setNote(e.target.value)} style={inputSt} /></label>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t.reasonChangePlaceholder} style={{ ...inputSt, flex: 1 }} />
        <button type="button" onClick={() => { run(() => updateExpense(entry.id, { amount, currency, categoryId: categoryId || null, accountId: accountId || null, spentAt, vendor, note, paid: entry.paid, reason }), t.expenseUpdated); onDone() }} disabled={pending} style={{ ...coralBtn, opacity: pending ? 0.6 : 1 }}>{t.save}</button>
        <button type="button" onClick={onDone} style={{ padding: '9px 14px', borderRadius: 9, border: '1px solid var(--d-hair)', background: 'var(--d-el)', color: 'var(--d-muted)', font: '700 12px var(--f-ui)', cursor: 'pointer' }}>{t.cancel}</button>
      </div>
    </div>
  )
}

/* ─────────────── Categories ─────────────── */
function Categories({ categories, pending, run }: { categories: FinanceProps['categories']; pending: boolean; run: (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => void }) {
  const t = useDict(dict)
  const [name, setName] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ ...PANEL, padding: '18px 22px' }}>
        <div style={{ ...LABEL, marginBottom: 12 }}>{t.newCategoryTitle}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.categoryPlaceholder} style={{ ...inputSt, flex: 1 }} />
          <button type="button" onClick={() => { if (name.trim()) { run(() => addExpenseCategory(name.trim()), t.categoryAdded); setName('') } }} disabled={pending || !name.trim()} style={{ ...coralBtn, opacity: pending || !name.trim() ? 0.6 : 1 }}>{t.add}</button>
        </div>
      </div>
      <div style={{ ...PANEL, padding: '10px 12px' }}>
        {categories.map((c) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
            {editId === c.id ? (
              <>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ ...inputSt, flex: 1 }} autoFocus />
                <button type="button" onClick={() => { run(() => updateExpenseCategory(c.id, editName), t.saved); setEditId(null) }} disabled={pending} style={{ ...coralBtn, padding: '7px 12px' }}>OK</button>
                <button type="button" onClick={() => setEditId(null)} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--d-hair)', background: 'var(--d-el)', color: 'var(--d-muted)', font: '700 11px var(--f-ui)', cursor: 'pointer' }}>{t.cancel}</button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, font: '700 13px var(--f-ui)', color: c.active ? 'var(--d-text)' : 'var(--d-muted-2)' }}>{c.nameRu}{!c.active && t.disabledSuffix}</span>
                <span style={{ font: '600 11px var(--f-ui)', color: 'var(--d-muted-2)' }}>{t.categoryCount(c.count)}</span>
                <button type="button" onClick={() => run(() => setExpenseCategoryActive(c.id, !c.active), t.updated)} disabled={pending} style={{ padding: '6px 11px', borderRadius: 7, border: '1px solid var(--d-hair)', background: 'var(--d-el)', color: c.active ? '#8FD7AD' : 'var(--d-muted)', font: '700 10px var(--f-ui)', cursor: 'pointer' }}>{c.active ? t.on : t.off}</button>
                <button type="button" onClick={() => { setEditId(c.id); setEditName(c.nameRu) }} style={{ padding: '6px 11px', borderRadius: 7, border: '1px solid var(--d-hair)', background: 'var(--d-el)', color: 'var(--d-muted)', font: '700 10px var(--f-ui)', cursor: 'pointer' }}>{t.edit}</button>
                <button type="button" onClick={() => run(() => deleteExpenseCategory(c.id), t.categoryDeleted)} disabled={pending} style={{ padding: '6px 9px', borderRadius: 7, border: '1px solid rgba(224,69,69,.3)', background: 'transparent', color: 'var(--d-red)', font: '700 10px var(--f-ui)', cursor: 'pointer' }}>✕</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────── Reconcile ─────────────── */
function Reconcile({ recorded, reconciliations, pending, run, isMobile }: { recorded: number; reconciliations: FinanceProps['reconciliations']; pending: boolean; run: (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => void; isMobile: boolean }) {
  const t = useDict(dict)
  const [actual, setActual] = useState('')
  const [note, setNote] = useState('')
  const actualNum = Number(String(actual).replace(',', '.'))
  const diff = Number.isFinite(actualNum) && actual.trim() ? Number((actualNum - recorded).toFixed(2)) : null
  return (
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ ...PANEL, padding: '22px 24px' }}>
        <div style={{ ...LABEL, marginBottom: 6 }}>{t.reconcileTitle}</div>
        <div style={{ font: '500 12px/1.6 var(--f-ui)', color: 'var(--d-muted)', marginBottom: 16 }}>{t.reconcileIntro}</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
          <div style={{ ...PANEL, padding: '14px 16px', borderLeft: '3px solid #A6BEF2' }}>
            <div style={LABEL}>{t.calculatedCash}</div>
            <div style={{ marginTop: 5, font: '800 20px var(--f-display)', color: '#A6BEF2' }}>{eur(recorded)}</div>
          </div>
          <div style={{ ...PANEL, padding: '14px 16px', borderLeft: '3px solid #FFB48A' }}>
            <div style={LABEL}>{t.actualBalance}</div>
            <input value={actual} onChange={(e) => setActual(e.target.value)} placeholder="€0" inputMode="decimal" style={{ ...inputSt, marginTop: 6, width: '100%', boxSizing: 'border-box', font: '800 18px var(--f-display)' }} />
          </div>
          <div style={{ ...PANEL, padding: '14px 16px', borderLeft: `3px solid ${diff == null ? 'var(--d-hair)' : diff === 0 ? '#8FD7AD' : '#E58A8A'}` }}>
            <div style={LABEL}>{t.discrepancy}</div>
            <div style={{ marginTop: 5, font: '800 20px var(--f-display)', color: diff == null ? 'var(--d-muted-2)' : diff === 0 ? '#8FD7AD' : '#E58A8A' }}>
              {diff == null ? '—' : `${diff > 0 ? '+' : ''}${eur(diff)}`}
            </div>
            <div style={{ marginTop: 2, font: '500 10px var(--f-ui)', color: 'var(--d-muted-2)' }}>{diff == null ? '' : diff === 0 ? t.booksMatch : diff > 0 ? t.actualMore : t.actualLess}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.noteOptionalPlaceholder} style={{ ...inputSt, flex: 1 }} />
          <button type="button" onClick={() => { if (actual.trim()) { run(() => saveReconciliation(actual, note), t.reconcileSaved); setActual(''); setNote('') } }} disabled={pending || !actual.trim()} style={{ ...coralBtn, opacity: pending || !actual.trim() ? 0.6 : 1 }}>{t.saveReconcileBtn}</button>
        </div>
      </div>
      {reconciliations.length > 0 && (
        <div style={{ ...PANEL, padding: '16px 20px' }}>
          <div style={{ ...LABEL, marginBottom: 12 }}>{t.reconcileHistory}</div>
          {reconciliations.map((r) => (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: isMobile ? 'auto 1fr' : '110px 1fr 1fr 1fr', gap: isMobile ? '2px 12px' : 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.05)', font: '600 12px var(--f-ui)', color: 'var(--d-text)' }}>
              <span style={{ color: 'var(--d-muted)', fontFamily: 'var(--f-mono)', fontSize: 11 }}>{dshort(r.createdAt)}</span>
              <span style={{ ...(isMobile ? { textAlign: 'right' } : {}) }}>{t.actualPrefix}{eur(r.actualAmount)}</span>
              <span style={{ color: 'var(--d-muted)', ...(isMobile ? { gridColumn: '1 / -1', textAlign: 'right' } : {}) }}>{t.recordedPrefix}{eur(r.recordedAmount)}</span>
              <span style={{ color: r.difference === 0 ? '#8FD7AD' : '#E58A8A', textAlign: 'right', ...(isMobile ? { gridColumn: '1 / -1' } : {}) }}>{r.difference > 0 ? '+' : ''}{eur(r.difference)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────── Ledger (debtors + creditors) ─────────────── */
function Ledger({ debtors, creditors, pending, run }: { debtors: FinanceProps['debtors']; creditors: FinanceProps['creditors']; pending: boolean; run: (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => void }) {
  const t = useDict(dict)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(380px,100%),1fr))', gap: 16 }}>
      {/* Debtors */}
      <div style={{ ...PANEL, padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div style={LABEL}>{t.debtorsTitle}</div>
          <div style={{ font: '800 15px var(--f-display)', color: '#E58A8A' }}>{eur(debtors.totalBase)}</div>
        </div>
        {debtors.rows.length === 0 ? <div style={{ font: '500 12px var(--f-ui)', color: 'var(--d-muted-2)' }}>{t.noDebtors}</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {debtors.rows.map((d) => (
              <Link key={d.bookingId} href={`/admin?tab=bookings&booking=${d.bookingId}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 9, background: 'var(--d-el)', textDecoration: 'none' }}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', font: '700 12px var(--f-ui)', color: 'var(--d-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.customer}</span>
                  <span style={{ font: '600 10px var(--f-mono)', color: 'var(--d-accent-light)' }}>{d.bookingNumber}</span>
                </span>
                <span style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', font: '800 13px var(--f-ui)', color: 'var(--d-text)' }}>{fmt(d.balance, d.currency)}</span>
                  <span style={{ font: '600 10px var(--f-ui)', color: 'var(--d-muted-2)' }}>≈ {eur(d.balanceBase)}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Creditors */}
      <div style={{ ...PANEL, padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div style={LABEL}>{t.creditorsTitle}</div>
          <div style={{ font: '800 15px var(--f-display)', color: '#E7B463' }}>{eur(creditors.totalBase)}</div>
        </div>
        {creditors.rows.length === 0 ? <div style={{ font: '500 12px var(--f-ui)', color: 'var(--d-muted-2)' }}>{t.noCreditors}</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {creditors.rows.map((c) => (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 9, background: 'var(--d-el)' }}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', font: '700 12px var(--f-ui)', color: 'var(--d-text)' }}>{c.categoryName}</span>
                  <span style={{ font: '500 10px var(--f-ui)', color: 'var(--d-muted-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[c.vendor, c.note, dshort(c.date)].filter(Boolean).join(' · ')}</span>
                </span>
                <span style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', font: '800 13px var(--f-ui)', color: 'var(--d-text)' }}>{fmt(c.amount, c.currency)}</span>
                  <span style={{ font: '600 10px var(--f-ui)', color: 'var(--d-muted-2)' }}>≈ {eur(c.base)}</span>
                </span>
                <button type="button" onClick={() => run(() => setExpensePaid(c.id, true), t.markedPaid)} disabled={pending} style={{ padding: '6px 10px', borderRadius: 7, border: 'none', background: 'rgba(111,191,143,.16)', color: '#8FD7AD', font: '700 10px var(--f-ui)', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t.payBtn}</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────── Accounts (wallets) ─────────────── */
function Accounts({ accounts, transfers, audit, pending, run, isMobile }: { accounts: FinanceProps['accounts']; transfers: FinanceProps['transfers']; audit: AuditRow[]; pending: boolean; run: (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => void; isMobile: boolean }) {
  const t = useDict(dict)
  const [name, setName] = useState('')
  const [kind, setKind] = useState('CASH')
  const [currency, setCurrency] = useState('EUR')
  const [opening, setOpening] = useState('')
  const [open, setOpen] = useState<{ id: string; mode: 'edit' | 'opening' | 'hist' } | null>(null)
  const activeAccs = accounts.rows.filter((a) => !a.archived)
  const [tFrom, setTFrom] = useState(activeAccs[0]?.id ?? '')
  const [tTo, setTTo] = useState(activeAccs[1]?.id ?? '')
  const [tAmount, setTAmount] = useState('')
  const [tCurrency, setTCurrency] = useState('EUR')
  const [tNote, setTNote] = useState('')
  const doTransfer = () => {
    if (!tAmount.trim()) return
    run(() => createTransfer({ fromAccountId: tFrom, toAccountId: tTo, amount: tAmount, currency: tCurrency, note: tNote }), t.transferDone)
    setTAmount(''); setTNote('')
  }
  const toggle = (id: string, mode: 'edit' | 'opening' | 'hist') => setOpen(open && open.id === id && open.mode === mode ? null : { id, mode })
  const add = () => {
    if (!name.trim()) return
    run(() => createAccount({ name, kind, currency, openingBalance: opening || 0 }), t.accountCreated)
    setName(''); setOpening('')
  }
  const historyFor = (id: string) => audit.filter((a) => a.entityType === 'account' && a.entityId === id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
        <StatCard label={t.totalInCash} value={eur(accounts.totalBase)} tone="#A6BEF2" sub={t.sumAllAccounts} />
      </div>

      {/* add account */}
      <div style={{ ...PANEL, padding: '18px 22px' }}>
        <div style={{ ...LABEL, marginBottom: 12 }}>{t.newAccountTitle}</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 160 }}><span style={LABEL}>{t.name}</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.accountNamePlaceholder} style={inputSt} /></label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={LABEL}>{t.type}</span><select value={kind} onChange={(e) => setKind(e.target.value)} style={inputSt}>{ACCOUNT_KIND_KEYS.map((k) => <option key={k} value={k}>{t.accountKinds[k]}</option>)}</select></label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={LABEL}>{t.currency}</span><select value={currency} onChange={(e) => setCurrency(e.target.value)} style={inputSt}>{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={LABEL}>{t.openingBalanceLabel}</span><input value={opening} onChange={(e) => setOpening(e.target.value)} placeholder="0" inputMode="decimal" style={{ ...inputSt, width: 120 }} /></label>
          <button type="button" onClick={add} disabled={pending || !name.trim()} style={{ ...coralBtn, opacity: pending || !name.trim() ? 0.6 : 1 }}>{t.createAccountBtn}</button>
        </div>
      </div>

      {/* transfer between accounts */}
      <div style={{ ...PANEL, padding: '18px 22px' }}>
        <div style={{ ...LABEL, marginBottom: 12 }}>{t.transferTitle}</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={LABEL}>{t.fromAccount}</span><select value={tFrom} onChange={(e) => setTFrom(e.target.value)} style={inputSt}>{activeAccs.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
          <span style={{ paddingBottom: 9, color: 'var(--d-accent-light)', font: '700 16px var(--f-ui)' }}>→</span>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={LABEL}>{t.toAccount}</span><select value={tTo} onChange={(e) => setTTo(e.target.value)} style={inputSt}>{activeAccs.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={LABEL}>{t.amount}</span><input value={tAmount} onChange={(e) => setTAmount(e.target.value)} placeholder="0" inputMode="decimal" style={{ ...inputSt, width: 110 }} /></label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={LABEL}>{t.currency}</span><select value={tCurrency} onChange={(e) => setTCurrency(e.target.value)} style={inputSt}>{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 130 }}><span style={LABEL}>{t.note}</span><input value={tNote} onChange={(e) => setTNote(e.target.value)} placeholder="—" style={inputSt} /></label>
          <button type="button" onClick={doTransfer} disabled={pending || !tAmount.trim() || tFrom === tTo} style={{ ...coralBtn, opacity: pending || !tAmount.trim() || tFrom === tTo ? 0.6 : 1 }}>{t.transferBtn}</button>
        </div>
        {transfers.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ ...LABEL, marginBottom: 8 }}>{t.recentTransfers}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {transfers.slice(0, 12).map((tx) => (
                <div key={tx.id} style={{ display: 'grid', gridTemplateColumns: '84px 1fr auto', gap: 10, alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: 'var(--d-el)' }}>
                  <span style={{ font: '600 11px var(--f-mono)', color: 'var(--d-muted)' }}>{dshort(tx.date)}</span>
                  <span style={{ font: '600 12px var(--f-ui)', color: 'var(--d-text)' }}>{tx.from} <span style={{ color: 'var(--d-accent-light)' }}>→</span> {tx.to}{tx.note && <span style={{ color: 'var(--d-muted-2)' }}> · {tx.note}</span>}</span>
                  <span style={{ font: '700 12px var(--f-ui)', color: 'var(--d-text)', textAlign: 'right' }}>{fmt(tx.amount, tx.currency)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* account list */}
      <div style={{ ...PANEL, padding: '10px 14px' }}>
        {accounts.rows.map((a) => {
          const hist = historyFor(a.id)
          return (
            <div key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}>
              <div style={isMobile
                ? { display: 'flex', flexDirection: 'column', gap: 10, padding: '13px 6px', opacity: a.archived ? 0.55 : 1 }
                : { display: 'grid', gridTemplateColumns: '1fr 130px 150px auto auto auto', gap: 12, alignItems: 'center', padding: '13px 6px', opacity: a.archived ? 0.55 : 1 }}>
                <div style={{ ...(isMobile ? { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' } : {}) }}>
                  <div>
                    <div style={{ font: '700 14px var(--f-ui)', color: 'var(--d-text)' }}>{a.name} {a.archived && <span style={{ font: '600 10px var(--f-ui)', color: 'var(--d-muted-2)' }}>{t.archivedBadge}</span>}</div>
                    <div style={{ font: '500 11px var(--f-ui)', color: 'var(--d-muted-2)' }}>{kindLabel(t, a.kind)} · {a.currency}</div>
                  </div>
                  {isMobile && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ font: '400 9px var(--f-mono)', color: 'var(--d-muted-2)' }}>{t.balanceEur}</div>
                      <div style={{ font: '800 16px var(--f-display)', color: a.balanceBase >= 0 ? 'var(--d-text-bright)' : '#E58A8A' }}>{eur(a.balanceBase)}</div>
                      <div style={{ font: '500 10px var(--f-ui)', color: 'var(--d-muted-2)', marginTop: 2 }}>{t.openingShort}{fmt(a.openingBalance, a.currency)}</div>
                    </div>
                  )}
                </div>
                {!isMobile && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ font: '400 9px var(--f-mono)', color: 'var(--d-muted-2)' }}>{t.openingBalanceLabel}</div>
                    <div style={{ font: '600 12px var(--f-ui)', color: 'var(--d-muted)' }}>{fmt(a.openingBalance, a.currency)}</div>
                  </div>
                )}
                {!isMobile && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ font: '400 9px var(--f-mono)', color: 'var(--d-muted-2)' }}>{t.balanceEur}</div>
                    <div style={{ font: '800 16px var(--f-display)', color: a.balanceBase >= 0 ? 'var(--d-text-bright)' : '#E58A8A' }}>{eur(a.balanceBase)}</div>
                  </div>
                )}
                {isMobile ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button type="button" onClick={() => toggle(a.id, 'opening')} disabled={pending} style={{ ...miniBtn(open?.id === a.id && open?.mode === 'opening'), minHeight: 40, padding: '9px 12px' }}>{t.openingBalanceBtn}</button>
                    <button type="button" onClick={() => toggle(a.id, 'edit')} disabled={pending} style={{ ...miniBtn(open?.id === a.id && open?.mode === 'edit'), minHeight: 40, padding: '9px 12px' }}>{t.edit}</button>
                    <button type="button" onClick={() => run(() => setAccountArchived(a.id, !a.archived), a.archived ? t.restored : t.archived)} disabled={pending} style={{ ...miniBtn(false), minHeight: 40, padding: '9px 12px' }}>{a.archived ? t.unarchiveBtn : t.archiveBtn}</button>
                    <button type="button" onClick={() => toggle(a.id, 'hist')} style={{ ...miniBtn(open?.id === a.id && open?.mode === 'hist'), minHeight: 40, padding: '9px 12px' }}>{t.history} {hist.length ? `(${hist.length})` : ''}</button>
                  </div>
                ) : (
                  <>
                    <button type="button" onClick={() => toggle(a.id, 'opening')} disabled={pending} style={miniBtn(open?.id === a.id && open?.mode === 'opening')}>{t.openingBalanceBtn}</button>
                    <button type="button" onClick={() => toggle(a.id, 'edit')} disabled={pending} style={miniBtn(open?.id === a.id && open?.mode === 'edit')}>{t.edit}</button>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" onClick={() => run(() => setAccountArchived(a.id, !a.archived), a.archived ? t.restored : t.archived)} disabled={pending} style={miniBtn(false)}>{a.archived ? t.unarchiveBtn : t.archiveBtn}</button>
                      <button type="button" onClick={() => toggle(a.id, 'hist')} style={miniBtn(open?.id === a.id && open?.mode === 'hist')}>{t.history} {hist.length ? `(${hist.length})` : ''}</button>
                    </div>
                  </>
                )}
              </div>
              {open?.id === a.id && open.mode === 'opening' && <OpeningBalanceEdit account={a} pending={pending} run={run} onDone={() => setOpen(null)} />}
              {open?.id === a.id && open.mode === 'edit' && <AccountEdit account={a} pending={pending} run={run} onDone={() => setOpen(null)} />}
              {open?.id === a.id && open.mode === 'hist' && (
                <div style={{ padding: '2px 8px 14px' }}>
                  {hist.length === 0 ? <div style={{ font: '500 11px var(--f-ui)', color: 'var(--d-muted-2)' }}>{t.noChangesYet}</div> : hist.map((x) => <AuditItem key={x.id} a={x} />)}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ font: '500 11px var(--f-ui)', color: 'var(--d-muted-2)' }}>
        {t.accountsNote}
      </div>
    </div>
  )
}

const miniBtn = (on: boolean): CSSProperties => ({ padding: '6px 10px', borderRadius: 7, border: on ? 'none' : '1px solid var(--d-hair)', background: on ? 'var(--d-accent)' : 'var(--d-base)', color: on ? '#082A33' : 'var(--d-muted)', font: '700 10px var(--f-ui)', cursor: 'pointer', whiteSpace: 'nowrap' })

function OpeningBalanceEdit({ account, pending, run, onDone }: { account: FinanceProps['accounts']['rows'][number]; pending: boolean; run: (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => void; onDone: () => void }) {
  const t = useDict(dict)
  const [value, setValue] = useState(String(account.openingBalance))
  const [reason, setReason] = useState('')
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', padding: '2px 8px 14px', flexWrap: 'wrap' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={LABEL}>{t.openingBalanceCur(account.currency)}</span><input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" style={{ ...inputSt, width: 140 }} /></label>
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t.reasonAuditPlaceholder} style={{ ...inputSt, flex: 1, minWidth: 160 }} />
      <button type="button" onClick={() => { run(() => setAccountOpeningBalance(account.id, value, reason), t.balanceUpdated); onDone() }} disabled={pending} style={{ ...coralBtn, opacity: pending ? 0.6 : 1 }}>{t.save}</button>
      <button type="button" onClick={onDone} style={miniBtn(false)}>{t.cancel}</button>
    </div>
  )
}

function AccountEdit({ account, pending, run, onDone }: { account: FinanceProps['accounts']['rows'][number]; pending: boolean; run: (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => void; onDone: () => void }) {
  const t = useDict(dict)
  const [name, setName] = useState(account.name)
  const [kind, setKind] = useState(account.kind)
  const [note, setNote] = useState(account.note ?? '')
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', padding: '2px 8px 14px', flexWrap: 'wrap' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 150 }}><span style={LABEL}>{t.name}</span><input value={name} onChange={(e) => setName(e.target.value)} style={inputSt} /></label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={LABEL}>{t.type}</span><select value={kind} onChange={(e) => setKind(e.target.value)} style={inputSt}>{ACCOUNT_KIND_KEYS.map((k) => <option key={k} value={k}>{t.accountKinds[k]}</option>)}</select></label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={LABEL}>{t.currency}</span><span style={{ ...inputSt, color: 'var(--d-muted)', minWidth: 50 }}>{account.currency}</span></div>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 130 }}><span style={LABEL}>{t.note}</span><input value={note} onChange={(e) => setNote(e.target.value)} style={inputSt} /></label>
      <button type="button" onClick={() => { run(() => updateAccount(account.id, { name, kind, note }), t.accountUpdated); onDone() }} disabled={pending} style={{ ...coralBtn, opacity: pending ? 0.6 : 1 }}>{t.save}</button>
      <button type="button" onClick={onDone} style={miniBtn(false)}>{t.cancel}</button>
    </div>
  )
}

/* ─────────────── Audit log ─────────────── */
function AuditLog({ audit }: { audit: AuditRow[] }) {
  const t = useDict(dict)
  const [filter, setFilter] = useState('')
  const types = Array.from(new Set(audit.map((a) => a.entityType)))
  const rows = audit.filter((a) => !filter || a.entityType === filter)
  return (
    <div style={{ ...PANEL, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={LABEL}>{t.auditLogTitle}</div>
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setFilter('')} style={miniBtn(filter === '')}>{t.allFilter}</button>
          {types.map((et) => <button key={et} type="button" onClick={() => setFilter(et)} style={miniBtn(filter === et)}>{t.auditEntity[et] ?? et}</button>)}
        </div>
      </div>
      {rows.length === 0 ? (
        <div style={{ font: '500 12px var(--f-ui)', color: 'var(--d-muted-2)' }}>{t.noRecords}</div>
      ) : (
        <div>{rows.map((a) => <AuditItem key={a.id} a={a} />)}</div>
      )}
    </div>
  )
}
