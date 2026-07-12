import type { Metadata } from 'next'
import LegalDocPage from '@/components/LegalDocPage'
import { deliveryReturnsContent } from '@/data/legal-docs'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Политика доставки и возврата · AVENTA',
  description: 'Teslimat ve İade Koşulları — черновой шаблон, требует юридической проверки.',
}

export default function DeliveryReturnsPage() {
  return <LegalDocPage content={deliveryReturnsContent} activeKey="delivery-returns" />
}
