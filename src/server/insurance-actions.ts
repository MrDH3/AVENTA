'use server'

import { revalidatePath } from 'next/cache'
import { requireStaff } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { saveInsuranceTier, type CoverageItemRaw } from '@/lib/insurance'

export interface InsuranceSaveResult {
  ok: boolean
  error?: string
}

const VALID_KEYS = ['BASIC', 'EXTENDED', 'FULL_NO_FRANCHISE']

/**
 * Save one insurance tier's coverage text (admin/owner only). Saving clears the
 * placeholder flag — it's the owner confirming the wording is now their real
 * policy. This is the ONLY place the coverage text is written; nothing is hardcoded.
 */
export async function saveInsuranceTierAction(input: {
  key: string
  nameRu: string
  nameEn: string
  descRu?: string
  descEn?: string
  excessRu?: string
  excessEn?: string
  coverage: CoverageItemRaw[]
}): Promise<InsuranceSaveResult> {
  const staff = await requireStaff()
  if (!VALID_KEYS.includes(input.key)) return { ok: false, error: 'Неизвестный тариф' }
  if (!input.nameRu.trim() || !input.nameEn.trim()) return { ok: false, error: 'Введите название тарифа (RU и EN)' }

  await saveInsuranceTier(input.key, input)
  await logAudit({
    userId: staff.id,
    action: 'insurance.tier.save',
    entity: 'InsuranceTier',
    entityId: input.key,
    meta: { rows: input.coverage.length },
  })

  revalidatePath('/admin/settings/insurance')
  revalidatePath('/booking')
  return { ok: true }
}
