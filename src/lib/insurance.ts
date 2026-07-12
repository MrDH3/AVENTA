import 'server-only'
import type { Prisma } from '@prisma/client'
import { prisma } from './db'
import type { Lang } from '@/i18n/lang'

/** One coverage line as stored (bilingual). status: yes | no | partial. */
export interface CoverageItemRaw {
  labelRu: string
  labelEn: string
  status: 'yes' | 'no' | 'partial'
}
/** Coverage line resolved to the customer's language. */
export interface CoverageItem {
  label: string
  status: 'yes' | 'no' | 'partial'
}

/** Public tier view for the booking flow (resolved to one language). */
export interface InsuranceTierView {
  key: string
  name: string
  desc: string | null
  excess: string | null
  coverage: CoverageItem[]
  isPlaceholder: boolean
}

/** Raw admin view (both languages) for the editor. */
export interface InsuranceTierAdmin {
  key: string
  order: number
  nameRu: string
  nameEn: string
  descRu: string | null
  descEn: string | null
  excessRu: string | null
  excessEn: string | null
  coverage: CoverageItemRaw[]
  isPlaceholder: boolean
}

function parseCoverage(v: Prisma.JsonValue | null | undefined): CoverageItemRaw[] {
  if (!Array.isArray(v)) return []
  const out: CoverageItemRaw[] = []
  for (const x of v) {
    if (!x || typeof x !== 'object' || Array.isArray(x)) continue
    const o = x as Record<string, unknown>
    const status = o.status === 'yes' || o.status === 'no' || o.status === 'partial' ? o.status : 'no'
    out.push({ labelRu: String(o.labelRu ?? ''), labelEn: String(o.labelEn ?? ''), status })
  }
  return out
}

/** Tiers resolved to `lang` for the customer-facing booking step. */
export async function getInsuranceTiers(lang: Lang): Promise<InsuranceTierView[]> {
  const rows = await prisma.insuranceTier.findMany({ orderBy: { order: 'asc' } })
  return rows.map((r) => ({
    key: r.key,
    name: lang === 'ru' ? r.nameRu : r.nameEn,
    desc: (lang === 'ru' ? r.descRu : r.descEn) || null,
    excess: (lang === 'ru' ? r.excessRu : r.excessEn) || null,
    coverage: parseCoverage(r.coverage).map((c) => ({ label: lang === 'ru' ? c.labelRu : c.labelEn, status: c.status })),
    isPlaceholder: r.isPlaceholder,
  }))
}

/** Raw tiers (both languages) for the admin editor. */
export async function getInsuranceTiersAdmin(): Promise<InsuranceTierAdmin[]> {
  const rows = await prisma.insuranceTier.findMany({ orderBy: { order: 'asc' } })
  return rows.map((r) => ({
    key: r.key,
    order: r.order,
    nameRu: r.nameRu,
    nameEn: r.nameEn,
    descRu: r.descRu,
    descEn: r.descEn,
    excessRu: r.excessRu,
    excessEn: r.excessEn,
    coverage: parseCoverage(r.coverage),
    isPlaceholder: r.isPlaceholder,
  }))
}

/** True while ANY tier still holds seeded placeholder text (drives the admin warning). */
export async function anyInsurancePlaceholder(): Promise<boolean> {
  const n = await prisma.insuranceTier.count({ where: { isPlaceholder: true } })
  return n > 0
}

/**
 * Admin save. Persists the edited tier and clears the placeholder flag — saving
 * IS the owner confirming the text is now their real policy wording.
 */
export async function saveInsuranceTier(
  key: string,
  input: {
    nameRu: string
    nameEn: string
    descRu?: string
    descEn?: string
    excessRu?: string
    excessEn?: string
    coverage: CoverageItemRaw[]
  },
): Promise<void> {
  const coverage = input.coverage
    .map((c) => ({ labelRu: c.labelRu.trim(), labelEn: c.labelEn.trim(), status: c.status }))
    .filter((c) => c.labelRu || c.labelEn)
  await prisma.insuranceTier.update({
    where: { key },
    data: {
      nameRu: input.nameRu.trim(),
      nameEn: input.nameEn.trim(),
      descRu: input.descRu?.trim() || null,
      descEn: input.descEn?.trim() || null,
      excessRu: input.excessRu?.trim() || null,
      excessEn: input.excessEn?.trim() || null,
      coverage: coverage as unknown as Prisma.InputJsonValue,
      isPlaceholder: false,
    },
  })
}
