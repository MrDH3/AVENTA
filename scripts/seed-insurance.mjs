import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// PLACEHOLDER example coverage — the owner MUST replace with real policy terms.
// Rows are aligned across tiers (same labels/order) so the booking UI compares cleanly.
const rows = (basic, ext, full) => [
  { labelRu: 'Ответственность перед третьими лицами', labelEn: 'Third-party liability (TPL)', s: [basic[0], ext[0], full[0]] },
  { labelRu: 'Ущерб автомобилю (CDW)', labelEn: 'Collision damage (CDW)', s: [basic[1], ext[1], full[1]] },
  { labelRu: 'Угон и кража', labelEn: 'Theft & burglary', s: [basic[2], ext[2], full[2]] },
  { labelRu: 'Стёкла, шины и днище', labelEn: 'Glass, tyres & underbody', s: [basic[3], ext[3], full[3]] },
  { labelRu: 'Помощь на дороге 24/7', labelEn: '24/7 roadside assistance', s: [basic[4], ext[4], full[4]] },
  { labelRu: 'Без франшизы', labelEn: 'Zero excess / no deductible', s: [basic[5], ext[5], full[5]] },
]
// column index 0=BASIC 1=EXTENDED 2=FULL for each row
const matrix = rows(
  /* BASIC    */ ['yes', 'partial', 'partial', 'no', 'no', 'no'],
  /* EXTENDED */ ['yes', 'yes', 'yes', 'no', 'yes', 'no'],
  /* FULL     */ ['yes', 'yes', 'yes', 'yes', 'yes', 'yes'],
)
const cov = (col) => matrix.map((r) => ({ labelRu: r.labelRu, labelEn: r.labelEn, status: r.s[col] }))

const TIERS = [
  {
    key: 'BASIC', order: 0, nameRu: 'Базовая', nameEn: 'Basic',
    descRu: '[ПРИМЕР] Обязательное покрытие с высокой франшизой.', descEn: '[EXAMPLE] Mandatory cover with a high excess.',
    excessRu: '€1500', excessEn: '€1500', coverage: cov(0),
  },
  {
    key: 'EXTENDED', order: 1, nameRu: 'Расширенная', nameEn: 'Extended',
    descRu: '[ПРИМЕР] Сниженная франшиза и помощь на дороге.', descEn: '[EXAMPLE] Reduced excess plus roadside assistance.',
    excessRu: '€500', excessEn: '€500', coverage: cov(1),
  },
  {
    key: 'FULL_NO_FRANCHISE', order: 2, nameRu: 'Полная (без франшизы)', nameEn: 'Full (zero excess)',
    descRu: '[ПРИМЕР] Максимальная защита без франшизы.', descEn: '[EXAMPLE] Maximum protection, no excess.',
    excessRu: '€0', excessEn: '€0', coverage: cov(2),
  },
]

async function main() {
  for (const t of TIERS) {
    await prisma.insuranceTier.upsert({
      where: { key: t.key },
      // Only (re)seed placeholders — never clobber content an admin already edited.
      update: {},
      create: { ...t, isPlaceholder: true },
    })
  }
  const all = await prisma.insuranceTier.findMany({ orderBy: { order: 'asc' } })
  console.log('insurance tiers:', all.map((t) => `${t.key}(placeholder=${t.isPlaceholder}, excess=${t.excessEn}, ${Array.isArray(t.coverage) ? t.coverage.length : 0} rows)`).join(' | '))
}
main().finally(() => prisma.$disconnect())
