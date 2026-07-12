import type { Metadata } from 'next'
import LegalDocPage from '@/components/LegalDocPage'
import { distanceSellingContent } from '@/data/legal-docs'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Договор оферты (дистанционной продажи) · AVENTA',
  description: 'Mesafeli Satış Sözleşmesi — черновой шаблон, требует юридической проверки.',
}

export default function DistanceSellingPage() {
  return <LegalDocPage content={distanceSellingContent} activeKey="distance-selling" />
}
