import type { Metadata } from 'next'
import LegalDocPage from '@/components/LegalDocPage'
import { privacyContent } from '@/data/legal-docs'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Политика конфиденциальности · AVENTA',
  description: 'Gizlilik Politikası ve KVKK Aydınlatma Metni — черновой шаблон, требует юридической проверки.',
}

export default function PrivacyPolicyPage() {
  return <LegalDocPage content={privacyContent} activeKey="privacy" />
}
