import type { Metadata } from 'next'
import Contact from '@/views/Contact'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Контакты · AVENTA',
  description: 'Свяжитесь с AVENTA: телефон, email, WhatsApp, Telegram, адрес в Анталии и форма обратной связи.',
}

export default function ContactPage() {
  return <Contact />
}
